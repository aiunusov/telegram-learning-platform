import { z } from 'zod';

export const HomeworkSubmissionPayloadSchema = z
  .object({
    projectId: z.string().uuid(),
    contentType: z.enum(['text', 'link', 'file']),
    contentText: z.string().optional(),
    fileUrl: z.string().url().optional(),
    assignmentId: z.string().uuid().optional(),
  })
  .refine(
    (data) => {
      if (data.contentType === 'text') return !!data.contentText;
      if (data.contentType === 'link') return !!data.contentText;
      if (data.contentType === 'file') return !!data.fileUrl;
      return false;
    },
    { message: 'Content must match contentType' },
  );

export const HomeworkReviewPayloadSchema = z.object({
  status: z.enum(['REVIEWED', 'NEEDS_FIX', 'APPROVED']),
  score: z.number().min(0).max(100).optional(),
  comment: z.string().min(10),
});

export type HomeworkSubmissionPayload = z.infer<
  typeof HomeworkSubmissionPayloadSchema
>;
export type HomeworkReviewPayload = z.infer<typeof HomeworkReviewPayloadSchema>;
