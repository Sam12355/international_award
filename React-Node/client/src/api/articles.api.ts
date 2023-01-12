import apiClient from './client';
import type { Article, PaginatedResponse, SingleResponse } from '../types';

export const articlesApi = {
  list: (params?: { page?: number; perPage?: number; status?: string }) =>
    apiClient.get<PaginatedResponse<Article>>('/articles', { params }),

  get: (id: number) =>
    apiClient.get<SingleResponse<Article>>(`/articles/${id}`),

  create: (data: FormData) =>
    apiClient.post<SingleResponse<Article>>('/articles', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  update: (id: number, data: FormData) =>
    apiClient.put<SingleResponse<Article>>(`/articles/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  delete: (id: number) =>
    apiClient.delete(`/articles/${id}`),
};
