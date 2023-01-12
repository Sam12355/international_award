import { Request } from 'express';

export interface JwtPayload {
  userId: number;
  role: 'AUTHOR' | 'REVIEWER' | 'ADMIN';
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    name: string;
    role: 'AUTHOR' | 'REVIEWER' | 'ADMIN';
  };
}

export type ArticleStatus = 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'PUBLISHED';
export type UserRole = 'AUTHOR' | 'REVIEWER' | 'ADMIN';
export type ReviewAssignmentStatus = 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'DECLINED';

export interface PaginationQuery {
  page?: number;
  perPage?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}
