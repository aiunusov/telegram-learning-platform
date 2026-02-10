import { Injectable, Logger } from '@nestjs/common';
import { z, ZodSchema } from 'zod';

@Injectable()
export class SchemaValidator {
  private readonly logger = new Logger(SchemaValidator.name);

  /**
   * Validate data against a Zod schema.
   * Returns parsed data on success, null on failure.
   */
  validate<T>(schema: ZodSchema<T>, data: unknown): T | null {
    const result = schema.safeParse(data);
    if (result.success) {
      return result.data;
    }

    this.logger.warn(`Validation failed: ${JSON.stringify(result.error.issues)}`);
    return null;
  }

  /**
   * Validate with detailed error info for repair prompts.
   */
  validateWithErrors<T>(
    schema: ZodSchema<T>,
    data: unknown,
  ): { data: T | null; errors: string[] } {
    const result = schema.safeParse(data);
    if (result.success) {
      return { data: result.data, errors: [] };
    }

    const errors = result.error.issues.map(
      (issue) => `${issue.path.join('.')}: ${issue.message}`,
    );

    return { data: null, errors };
  }

  /**
   * Build a repair prompt from validation errors.
   */
  buildRepairPrompt(originalPrompt: string, errors: string[]): string {
    return (
      `The previous response had validation errors:\n` +
      errors.map((e) => `- ${e}`).join('\n') +
      `\n\nPlease fix these issues and try again.\n\n` +
      `Original request: ${originalPrompt}`
    );
  }
}
