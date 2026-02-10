import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class OpenAIProvider {
  private readonly logger = new Logger(OpenAIProvider.name);
  private readonly client: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      this.logger.warn('OPENAI_API_KEY not set, OpenAI provider disabled');
    }
    this.client = new OpenAI({ apiKey: apiKey || '' });
  }

  /** Generate text with optional system prompt and context. */
  async generate(params: {
    prompt: string;
    systemPrompt?: string;
    context?: string;
    temperature?: number;
  }): Promise<string> {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    if (params.systemPrompt) {
      messages.push({ role: 'system', content: params.systemPrompt });
    }

    let userContent = '';
    if (params.context) {
      userContent += `Context:\n${params.context}\n\n`;
    }
    userContent += params.prompt;

    messages.push({ role: 'user', content: userContent });

    const completion = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: params.temperature ?? 0.3,
      max_tokens: 4096,
    });

    return completion.choices[0]?.message?.content || '';
  }

  /** Generate structured JSON output. */
  async generateJson<T>(params: {
    prompt: string;
    systemPrompt?: string;
    context?: string;
  }): Promise<T> {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    if (params.systemPrompt) {
      messages.push({ role: 'system', content: params.systemPrompt });
    }

    let userContent = '';
    if (params.context) {
      userContent += `Context:\n${params.context}\n\n`;
    }
    userContent +=
      params.prompt +
      '\n\nReturn ONLY valid JSON. No explanations, no markdown.';

    messages.push({ role: 'user', content: userContent });

    const completion = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.1,
      max_tokens: 4096,
      response_format: { type: 'json_object' },
    });

    const text = completion.choices[0]?.message?.content || '{}';
    return JSON.parse(text) as T;
  }

  /** Generate embeddings for text. */
  async embed(text: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });
    return response.data[0].embedding;
  }

  get isAvailable(): boolean {
    return !!process.env.OPENAI_API_KEY;
  }
}
