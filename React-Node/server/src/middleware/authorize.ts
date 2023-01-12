import { Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { AuthenticatedRequest, UserRole } from '../types';

/**
 * Middleware factory that restricts access to users with specific roles.
 * Usage: authorize('REVIEWER', 'ADMIN')
 */
export function authorize(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(ApiError.unauthorized());
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(ApiError.forbidden('You do not have permission to access this resource'));
      return;
    }

    next();
  };
}
