import { z } from 'zod';

// ─── Auth Schemas ─────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  passwordConfirmation: z.string(),
}).refine((data) => data.password === data.passwordConfirmation, {
  message: 'Passwords do not match',
  path: ['passwordConfirmation'],
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  passwordConfirmation: z.string(),
}).refine((data) => data.password === data.passwordConfirmation, {
  message: 'Passwords do not match',
  path: ['passwordConfirmation'],
});

// ─── Article Schemas ──────────────────────────────────────

export const articleSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  journal_id: z.coerce.number().positive('Please select a journal'),
  abstract: z.string().min(50, 'Abstract must be at least 50 characters'),
  keywords: z.string().max(500).optional(),
});

// ─── Review Schema ────────────────────────────────────────

export const reviewStatusSchema = z.object({
  status: z.enum(['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED']),
  reviewer_notes: z.string().max(5000).optional(),
});

// ─── Profile Schemas ──────────────────────────────────────

export const profileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  email: z.string().email('Invalid email address'),
});

export const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  passwordConfirmation: z.string(),
}).refine((data) => data.password === data.passwordConfirmation, {
  message: 'Passwords do not match',
  path: ['passwordConfirmation'],
});

// ─── Types ────────────────────────────────────────────────

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type ArticleFormData = z.infer<typeof articleSchema>;
export type ReviewStatusFormData = z.infer<typeof reviewStatusSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
export type PasswordFormData = z.infer<typeof passwordSchema>;
