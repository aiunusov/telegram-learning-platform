import { Module } from '@nestjs/common';
import { AiCoreService } from './ai-core.service';
import { GeminiProvider } from './providers/gemini.provider';
import { OpenAIProvider } from './providers/openai.provider';
import { SchemaValidator } from './validators/schema.validator';

@Module({
  providers: [AiCoreService, GeminiProvider, OpenAIProvider, SchemaValidator],
  exports: [AiCoreService],
})
export class AiCoreModule {}
