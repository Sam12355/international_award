import apiClient from './client';
import type { Article, PaginatedResponse, SingleResponse } from '../types';

export const reviewsApi = {
  list: (params?: { page?: number; perPage?: number }) =>
    apiClient.get<PaginatedResponse<Article>>('/reviews', { params }),

  get: (id: number) =>
    apiClient.get<SingleResponse<Article>>(`/reviews/${id}`),

  updateStatus: (id: number, data: { status: string; reviewer_notes?: string }) =>
    apiClient.patch<SingleResponse<Article>>(`/reviews/${id}/status`, data),
};
