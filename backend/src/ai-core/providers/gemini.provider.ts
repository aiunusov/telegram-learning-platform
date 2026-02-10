import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class GeminiProvider {
  private readonly logger = new Logger(GeminiProvider.name);
  private readonly client: GoogleGenerativeAI;
  private readonly model;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY not set, Gemini provider disabled');
    }
    this.client = new GoogleGenerativeAI(apiKey || '');
    this.model = this.client.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  /** Generate text with optional system prompt and context. */
  async generate(params: {
    prompt: string;
    systemPrompt?: string;
    context?: string;
    temperature?: number;
  }): Promise<string> {
    const parts: string[] = [];

    if (params.systemPrompt) {
      parts.push(`System: ${params.systemPrompt}`);
    }
    if (params.context) {
      parts.push(`Context:\n${params.context}`);
    }
    parts.push(`User: ${params.prompt}`);

    const result = await this.model.generateContent({
      contents: [{ role: 'user', parts: [{ text: parts.join('\n\n') }] }],
      generationConfig: {
        temperature: params.temperature ?? 0.3,
        maxOutputTokens: 4096,
      },
    });

    const response = result.response;
    return response.text();
  }

  /** Generate structured JSON output. */
  async generateJson<T>(params: {
    prompt: string;
    systemPrompt?: string;
    context?: string;
  }): Promise<T> {
    const jsonPrompt =
      params.prompt +
      '\n\nIMPORTANT: Return ONLY valid JSON. No explanations, no markdown, no code blocks. Just raw JSON.';

    const text = await this.generate({
      ...params,
      prompt: jsonPrompt,
      temperature: 0.1,
    });

    // Extract JSON from possible markdown code blocks
    const cleaned = text
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();

    return JSON.parse(cleaned) as T;
  }

  /** Generate embeddings for text. */
  async embed(text: string): Promise<number[]> {
    const embeddingModel = this.client.getGenerativeModel({
      model: 'text-embedding-004',
    });
    const result = await embeddingModel.embedContent(text);
    return result.embedding.values;
  }

  get isAvailable(): boolean {
    return !!process.env.GEMINI_API_KEY;
  }
}
