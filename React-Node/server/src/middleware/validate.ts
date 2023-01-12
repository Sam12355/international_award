import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ApiError } from '../utils/ApiError';

/**
 * Middleware factory that validates request body/query/params against a Zod schema.
 * On validation failure, returns a 422 response with structured errors.
 */
export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[source]);
      // Replace the source with parsed (and coerced) values
      (req as unknown as Record<string, unknown>)[source] = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldErrors: Record<string, string[]> = {};
        for (const issue of error.issues) {
          const field = issue.path.join('.');
          if (!fieldErrors[field]) {
            fieldErrors[field] = [];
          }
          fieldErrors[field].push(issue.message);
        }
        next(ApiError.unprocessable('Validation failed', fieldErrors));
      } else {
        next(error);
      }
    }
  };
}
