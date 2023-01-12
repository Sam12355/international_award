import apiClient from './client';
import type { Journal, SingleResponse } from '../types';

export const journalsApi = {
  list: () =>
    apiClient.get<{ data: Journal[] }>('/journals'),
};

export const usersApi = {
  me: () =>
    apiClient.get<SingleResponse<import('../types').User>>('/users/me'),

  updateProfile: (data: { name?: string; email?: string }) =>
    apiClient.patch<SingleResponse<import('../types').User>>('/users/me', data),

  updatePassword: (data: {
    currentPassword: string;
    password: string;
    passwordConfirmation: string;
  }) => apiClient.put('/users/me/password', data),

  deleteAccount: () =>
    apiClient.delete('/users/me'),
};
