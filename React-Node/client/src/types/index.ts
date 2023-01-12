// ─── User ───────────────────────────────────────────────
export type UserRole = 'AUTHOR' | 'REVIEWER' | 'ADMIN';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  emailVerifiedAt?: string | null;
  lastLoginAt?: string | null;
  createdAt?: string;
}

// ─── Auth ───────────────────────────────────────────────
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  passwordConfirmation: string;
}

// ─── Journal ────────────────────────────────────────────
export interface Journal {
  id: number;
  name: string;
  issn: string;
}

// ─── Article ────────────────────────────────────────────
export type ArticleStatus = 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'PUBLISHED';

export interface Article {
  id: number;
  reference: string;
  title: string;
  abstract: string | null;
  keywords: string | null;
  status: ArticleStatus;
  doi?: string;
  originalFilename: string;
  fileSize: number;
  createdAt: string;
  reviewedAt: string | null;
  publishedAt: string | null;
  journal?: Journal;
  user?: { id: number; name: string };
  reviewAssignments?: ReviewAssignment[];
}

export interface ReviewAssignment {
  reviewer: string;
  status: string;
  dueDate: string | null;
}

// ─── Pagination ─────────────────────────────────────────
export interface PaginationMeta {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface SingleResponse<T> {
  data: T;
}

export interface PublishResponse {
  data: Article;
  warnings?: string[];
}

// ─── API Error ──────────────────────────────────────────
export interface ApiErrorResponse {
  error: string;
  errors?: Record<string, string[]>;
}
