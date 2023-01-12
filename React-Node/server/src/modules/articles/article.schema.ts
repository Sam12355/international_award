import { z } from 'zod';

export const storeArticleSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  journal_id: z.coerce.number().int().positive('Journal is required'),
  abstract: z.string().min(50, 'Abstract must be at least 50 characters'),
  keywords: z.string().max(500).optional().nullable(),
});

export const updateArticleSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255).optional(),
  abstract: z.string().min(50, 'Abstract must be at least 50 characters').optional(),
  keywords: z.string().max(500).optional().nullable(),
});

export const articleQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(100).default(15),
  status: z.enum(['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PUBLISHED']).optional(),
});

export type StoreArticleInput = z.infer<typeof storeArticleSchema>;
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>;
export type ArticleQueryInput = z.infer<typeof articleQuerySchema>;
