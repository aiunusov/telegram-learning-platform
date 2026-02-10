import { z } from 'zod';

export enum LearningState {
  IDLE = 'IDLE',
  LEARNING = 'LEARNING',
  TESTING = 'TESTING',
  SUBMITTING = 'SUBMITTING',
  REVIEWING = 'REVIEWING',
  HOMEWORK_PENDING = 'HOMEWORK_PENDING',
  HOMEWORK_SUBMITTED = 'HOMEWORK_SUBMITTED',
  COMPLETED = 'COMPLETED',
}

export const SendMessageAction = z.object({
  type: z.literal('send_message'),
  text: z.string(),
  parse_mode: z.enum(['Markdown', 'HTML']).optional(),
});

export const ShowButtonsAction = z.object({
  type: z.literal('show_buttons'),
  text: z.string().optional(),
  buttons: z.array(
    z.object({
      text: z.string(),
      payload: z.string(),
    }),
  ),
  inline: z.boolean().default(true),
});

export const ShowTestAction = z.object({
  type: z.literal('show_test'),
  testId: z.string().uuid(),
  spec: z.any(),
});

export const RequestHomeworkAction = z.object({
  type: z.literal('request_homework'),
  prompt: z.string(),
  miniAppUrl: z.string(),
});

export const BotActionSchema = z.discriminatedUnion('type', [
  SendMessageAction,
  ShowButtonsAction,
  ShowTestAction,
  RequestHomeworkAction,
]);

export const BotResponseSchema = z.object({
  actions: z.array(BotActionSchema),
  sessionState: z.nativeEnum(LearningState).optional(),
});

export type BotAction = z.infer<typeof BotActionSchema>;
export type BotResponse = z.infer<typeof BotResponseSchema>;
