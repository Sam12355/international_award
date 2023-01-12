import type { ArticleStatus } from '../types';

/**
 * Format a date string to a readable date.
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a date string to a readable datetime.
 */
export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format file size in human-readable format.
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

/**
 * Truncate text to a specified length.
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '…';
}

/**
 * Get CSS classes for article status badge.
 */
export function getStatusColor(status: ArticleStatus): string {
  const colors: Record<ArticleStatus, string> = {
    SUBMITTED: 'bg-blue-100 text-blue-800',
    UNDER_REVIEW: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
    PUBLISHED: 'bg-purple-100 text-purple-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

/**
 * Get friendly label for article status.
 */
export function getStatusLabel(status: ArticleStatus): string {
  const labels: Record<ArticleStatus, string> = {
    SUBMITTED: 'Submitted',
    UNDER_REVIEW: 'Under Review',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    PUBLISHED: 'Published',
  };
  return labels[status] || status;
}

/**
 * Extract error message from an API error response.
 */
export function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error;

  if (error && typeof error === 'object') {
    // Axios error
    if ('response' in error) {
      const response = (error as { response?: { data?: { error?: string } } }).response;
      if (response?.data?.error) return response.data.error;
    }
    if ('message' in error) return (error as { message: string }).message;
  }

  return 'An unexpected error occurred';
}
