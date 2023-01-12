import apiClient from './client';
import type { AuthResponse, AuthTokens } from '../types';

export const authApi = {
  register: (data: {
    name: string;
    email: string;
    password: string;
    passwordConfirmation: string;
  }) => apiClient.post<AuthResponse>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    apiClient.post<AuthResponse>('/auth/login', data),

  refresh: (refreshToken: string) =>
    apiClient.post<AuthTokens>('/auth/refresh', { refreshToken }),

  logout: (refreshToken: string) =>
    apiClient.post('/auth/logout', { refreshToken }),

  forgotPassword: (email: string) =>
    apiClient.post('/auth/forgot-password', { email }),

  resetPassword: (data: {
    token: string;
    email: string;
    password: string;
    passwordConfirmation: string;
  }) => apiClient.post('/auth/reset-password', data),
};
