import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GeminiProvider } from './providers/gemini.provider';
import { OpenAIProvider } from './providers/openai.provider';
import { SchemaValidator } from './validators/schema.validator';
import {
  TestSpecSchema,
  TestSpec,
  AnswerCheckResultSchema,
  AnswerCheckResult,
} from '../common/contracts';

interface Citation {
  chunkId: string;
  text: string;
  documentId: string;
}

interface AnswerParams {
  projectId: string;
  userId: string;
  query: string;
  sessionContext?: any;
}

interface GenerateTestsParams {
  projectId: string;
  topics: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  count: number;
}

interface CheckAnswersParams {
  spec: TestSpec;
  answers: Record<string, any>;
}

@Injectable()
export class AiCoreService {
  private readonly logger = new Logger(AiCoreService.name);
  private readonly MAX_RETRIES = 2;

  constructor(
    private readonly prisma: PrismaService,
    private readonly gemini: GeminiProvider,
    private readonly openai: OpenAIProvider,
    private readonly validator: SchemaValidator,
  ) {}

  /**
   * RAG-based Q&A: embed query → vector search → grounded generation.
   */
  async answer(params: AnswerParams): Promise<{
    answer: string;
    confidence: number;
    citations?: Citation[];
  }> {
    try {
      // 1. Embed query
      const queryEmbedding = await this.embedQuery(params.query);

      // 2. Vector search (top 5 chunks)
      const chunks = await this.vectorSearch(
        params.projectId,
        queryEmbedding,
        5,
      );

      // 3. Build context
      const context = chunks.map((c) => c.text).join('\n\n');

      // 4. Generate grounded answer
      const systemPrompt =
        'Ты — помощник по обучению. Отвечай ТОЛЬКО на основе предоставленного контекста. ' +
        'Если контекст не содержит ответа, скажи "Я не нашёл информации по этому вопросу в учебных материалах." ' +
        'Отвечай на русском языке. Используй Markdown для форматирования.';

      const answer = await this.generateWithFallback({
        prompt: params.query,
        context: context || 'Контекст не найден. База знаний пуста.',
        systemPrompt,
      });

      // 5. Calculate confidence
      const confidence = this.calculateConfidence(chunks);

      const citations: Citation[] = chunks.map((c) => ({
        chunkId: c.id,
        text: c.text.substring(0, 200),
        documentId: c.documentId,
      }));

      return { answer, confidence, citations };
    } catch (error) {
      this.logger.error(`RAG answer failed: ${error}`);
      return {
        answer:
          'Произошла ошибка при обработке вопроса. Попробуйте позже.',
        confidence: 0,
      };
    }
  }

  /**
   * Generate tests with schema validation and retry logic.
   */
  async generateTests(params: GenerateTestsParams): Promise<TestSpec[]> {
    const prompt =
      `Generate ${params.count} test(s) on the following topics: ${params.topics.join(', ')}.\n` +
      `Difficulty: ${params.difficulty}\n` +
      `Each test should have 5-10 questions.\n` +
      `Question types: multiple_choice and short_answer.\n` +
      `For multiple_choice, provide 4 options and correctAnswer as array of correct option indices (0-based).\n` +
      `For short_answer, correctAnswer is a string.\n` +
      `Each question needs an explanation.\n` +
      `Return a JSON array of test specs.\n` +
      `Language: Russian`;

    const systemPrompt =
      'You are a test generation AI. Generate educational tests in valid JSON format. ' +
      'All questions and explanations should be in Russian.';

    return this.generateWithValidation<TestSpec[]>(
      prompt,
      systemPrompt,
      (data) => {
        if (!Array.isArray(data)) return null;
        const results: TestSpec[] = [];
        for (const item of data) {
          const validated = this.validator.validate(TestSpecSchema, item);
          if (!validated) return null;
          results.push(validated);
        }
        return results;
      },
    );
  }

  /**
   * Check test answers with AI analysis.
   */
  async checkAnswers(params: CheckAnswersParams): Promise<AnswerCheckResult> {
    const questionsText = params.spec.questions
      .map((q, i) => {
        const userAnswer = params.answers[q.id] ?? 'Нет ответа';
        return (
          `Question ${i + 1}: ${q.text}\n` +
          `Correct answer: ${JSON.stringify(q.correctAnswer)}\n` +
          `User answer: ${JSON.stringify(userAnswer)}\n` +
          `Explanation: ${q.explanation}`
        );
      })
      .join('\n\n');

    const prompt =
      `Check the following test answers and provide detailed feedback.\n\n` +
      `Test topic: ${params.spec.topic}\n` +
      `Difficulty: ${params.spec.difficulty}\n` +
      `Passing score: ${params.spec.passingScore}%\n\n` +
      `Questions and answers:\n${questionsText}\n\n` +
      `Return a JSON object with: score (0-100), passed (boolean), ` +
      `mistakes (array of {questionId, userAnswer, correctAnswer, explanation}), ` +
      `feedback (overall text in Russian), recommendation ("repeat"|"proceed"|"review_topic"), ` +
      `strengths (array of strings), weaknesses (array of strings).`;

    const systemPrompt =
      'You are a test grading AI. Grade answers accurately and provide constructive feedback in Russian.';

    return this.generateWithValidation<AnswerCheckResult>(
      prompt,
      systemPrompt,
      (data) => this.validator.validate(AnswerCheckResultSchema, data),
    );
  }

  /**
   * Analyze homework submission for admin review.
   */
  async analyzeHomework(params: {
    submissionContent: string;
  }): Promise<{
    summary: string;
    suggestedFeedback: string;
  }> {
    const prompt =
      `Analyze this homework submission and provide:\n` +
      `1. A brief summary of what was submitted\n` +
      `2. Suggested feedback for the teacher\n\n` +
      `Submission:\n${params.submissionContent}\n\n` +
      `Return JSON with "summary" and "suggestedFeedback" fields. In Russian.`;

    const result = await this.generateJsonWithFallback<{
      summary: string;
      suggestedFeedback: string;
    }>(prompt, 'You are an educational content analyzer. Respond in Russian.');

    return result;
  }

  // --- Private helpers ---

  private async embedQuery(query: string): Promise<number[]> {
    try {
      if (this.gemini.isAvailable) {
        return await this.gemini.embed(query);
      }
      if (this.openai.isAvailable) {
        return await this.openai.embed(query);
      }
    } catch (error) {
      this.logger.error(`Embedding failed: ${error}`);
      // Try fallback
      if (this.openai.isAvailable) {
        return await this.openai.embed(query);
      }
    }
    // Return zero vector as last resort
    return new Array(1536).fill(0);
  }

  private async vectorSearch(
    projectId: string,
    embedding: number[],
    limit: number,
  ): Promise<Array<{ id: string; text: string; documentId: string; score: number }>> {
    try {
      // Use raw SQL for pgvector cosine similarity search
      const embeddingStr = `[${embedding.join(',')}]`;
      const results = await this.prisma.$queryRawUnsafe<
        Array<{ id: string; text: string; document_id: string; score: number }>
      >(
        `SELECT id, text, document_id,
         1 - (embedding <=> $1::vector) as score
         FROM knowledge_chunks
         WHERE project_id = $2::uuid
         AND embedding IS NOT NULL
         ORDER BY embedding <=> $1::vector
         LIMIT $3`,
        embeddingStr,
        projectId,
        limit,
      );

      return results.map((r) => ({
        id: r.id,
        text: r.text,
        documentId: r.document_id,
        score: r.score,
      }));
    } catch (error) {
      this.logger.warn(`Vector search failed: ${error}`);
      // Fallback: return recent chunks without vector search
      const chunks = await this.prisma.knowledgeChunk.findMany({
        where: { projectId },
        take: limit,
        orderBy: { createdAt: 'desc' },
      });
      return chunks.map((c) => ({
        id: c.id,
        text: c.text,
        documentId: c.documentId,
        score: 0,
      }));
    }
  }

  private calculateConfidence(
    chunks: Array<{ score: number }>,
  ): number {
    if (chunks.length === 0) return 0;
    const avgScore =
      chunks.reduce((sum, c) => sum + c.score, 0) / chunks.length;
    return Math.min(Math.round(avgScore * 100), 100);
  }

  private async generateWithFallback(params: {
    prompt: string;
    systemPrompt?: string;
    context?: string;
  }): Promise<string> {
    // Try Gemini first
    if (this.gemini.isAvailable) {
      try {
        return await this.gemini.generate(params);
      } catch (error) {
        this.logger.warn(`Gemini generation failed, falling back to OpenAI: ${error}`);
      }
    }

    // Fallback to OpenAI
    if (this.openai.isAvailable) {
      return await this.openai.generate(params);
    }

    throw new Error('No AI provider available');
  }

  private async generateJsonWithFallback<T>(
    prompt: string,
    systemPrompt?: string,
  ): Promise<T> {
    if (this.gemini.isAvailable) {
      try {
        return await this.gemini.generateJson<T>({ prompt, systemPrompt });
      } catch (error) {
        this.logger.warn(`Gemini JSON failed, falling back to OpenAI: ${error}`);
      }
    }

    if (this.openai.isAvailable) {
      return await this.openai.generateJson<T>({ prompt, systemPrompt });
    }

    throw new Error('No AI provider available');
  }

  /**
   * Generate JSON with schema validation + retry logic.
   */
  private async generateWithValidation<T>(
    prompt: string,
    systemPrompt: string,
    validateFn: (data: any) => T | null,
  ): Promise<T> {
    let lastError: string[] = [];

    for (let attempt = 0; attempt <= this.MAX_RETRIES; attempt++) {
      const currentPrompt =
        attempt === 0
          ? prompt
          : this.validator.buildRepairPrompt(prompt, lastError);

      try {
        const raw = await this.generateJsonWithFallback<any>(
          currentPrompt,
          systemPrompt,
        );

        const validated = validateFn(raw);
        if (validated !== null) {
          return validated;
        }

        lastError = ['Output did not match expected schema'];
        this.logger.warn(
          `Validation failed on attempt ${attempt + 1}, retrying...`,
        );
      } catch (error) {
        lastError = [`Parse error: ${error}`];
        this.logger.warn(
          `Generation attempt ${attempt + 1} failed: ${error}`,
        );
      }
    }

    throw new Error(
      `AI generation failed after ${this.MAX_RETRIES + 1} attempts. Last errors: ${lastError.join(', ')}`,
    );
  }
}
