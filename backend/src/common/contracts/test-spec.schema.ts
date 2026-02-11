import { z } from 'zod';

export const QuestionSchema = z.object({
  id: z.string(),
  type: z.enum(['multiple_choice', 'short_answer']),
  text: z.string(),
  options: z.array(z.string()).optional(),
  correctAnswer: z.union([z.string(), z.array(z.number())]),
  explanation: z.string(),
  points: z.number().default(1),
});

export const TestSpecSchema = z.object({
  topic: z.string(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  questions: z.array(QuestionSchema).min(3).max(20),
  passingScore: z.number().min(0).max(100).default(70),
  metadata: z.record(z.unknown()).optional(),
});

export type Question = z.output<typeof QuestionSchema>;
export type TestSpec = z.output<typeof TestSpecSchema>;
