import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError';
import logger from '../utils/logger';

/**
 * Type guard for Prisma known request errors.
 */
function isPrismaKnownRequestError(
  err: unknown,
): err is { code: string; meta?: Record<string, unknown> } {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    typeof (err as Record<string, unknown>).code === 'string' &&
    (err as Record<string, unknown>).constructor?.name === 'PrismaClientKnownRequestError'
  );
}

/**
 * Global error handler middleware.
 * Maps known error types to appropriate HTTP responses.
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Custom API errors
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      error: err.message,
      ...(err.errors && { errors: err.errors }),
    });
    return;
  }

  // Zod validation errors
  if (err instanceof ZodError) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const field = issue.path.join('.');
      if (!fieldErrors[field]) {
        fieldErrors[field] = [];
      }
      fieldErrors[field].push(issue.message);
    }
    res.status(422).json({
      error: 'Validation failed',
      errors: fieldErrors,
    });
    return;
  }

  // Prisma errors
  if (isPrismaKnownRequestError(err)) {
    switch (err.code) {
      case 'P2002': {
        const fields = (err.meta?.target as string[]) || ['field'];
        res.status(409).json({
          error: `A record with this ${fields.join(', ')} already exists`,
        });
        return;
      }
      case 'P2025':
        res.status(404).json({ error: 'Record not found' });
        return;
      default:
        logger.error('Prisma error', { code: err.code, meta: err.meta });
    }
  }

  // Multer errors
  if (err instanceof multer.MulterError) {
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        res.status(413).json({ error: 'File size exceeds the 10MB limit' });
        return;
      case 'LIMIT_UNEXPECTED_FILE':
        res.status(400).json({ error: 'Unexpected file field' });
        return;
      default:
        res.status(400).json({ error: `Upload error: ${err.message}` });
        return;
    }
  }

  // Unknown errors
  logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
    name: err.name,
  });

  res.status(500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
  });
}
