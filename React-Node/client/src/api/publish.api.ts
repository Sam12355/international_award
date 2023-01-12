import apiClient from './client';
import type { Article, PaginatedResponse, PublishResponse } from '../types';

export const publishApi = {
  list: (params?: { page?: number; perPage?: number }) =>
    apiClient.get<PaginatedResponse<Article>>('/publish', { params }),

  publish: (id: number) =>
    apiClient.post<PublishResponse>(`/publish/${id}`),
};
