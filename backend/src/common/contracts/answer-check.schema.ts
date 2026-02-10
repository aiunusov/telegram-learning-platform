import { z } from 'zod';

export const MistakeSchema = z.object({
  questionId: z.string(),
  userAnswer: z.union([z.string(), z.array(z.number())]),
  correctAnswer: z.union([z.string(), z.array(z.number())]),
  explanation: z.string(),
});

export const AnswerCheckResultSchema = z.object({
  score: z.number().min(0).max(100),
  passed: z.boolean(),
  mistakes: z.array(MistakeSchema),
  feedback: z.string(),
  recommendation: z.enum(['repeat', 'proceed', 'review_topic']),
  strengths: z.array(z.string()).optional(),
  weaknesses: z.array(z.string()).optional(),
});

export type Mistake = z.infer<typeof MistakeSchema>;
export type AnswerCheckResult = z.infer<typeof AnswerCheckResultSchema>;
