import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  email: z.string().email('Invalid email address').max(255).transform((v) => v.toLowerCase()),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  passwordConfirmation: z.string(),
}).refine((data) => data.password === data.passwordConfirmation, {
  message: 'Passwords do not match',
  path: ['passwordConfirmation'],
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').transform((v) => v.toLowerCase()),
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address').transform((v) => v.toLowerCase()),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  email: z.string().email('Invalid email address').transform((v) => v.toLowerCase()),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  passwordConfirmation: z.string(),
}).refine((data) => data.password === data.passwordConfirmation, {
  message: 'Passwords do not match',
  path: ['passwordConfirmation'],
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
