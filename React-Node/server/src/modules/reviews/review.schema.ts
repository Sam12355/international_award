import { z } from 'zod';

export const updateStatusSchema = z.object({
  status: z.enum(['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'], {
    errorMap: () => ({ message: 'Status must be one of: submitted, under_review, approved, rejected' }),
  }),
  reviewer_notes: z.string().max(5000, 'Reviewer notes cannot exceed 5000 characters').optional().nullable(),
});

export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
