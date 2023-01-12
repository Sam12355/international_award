import '../setup';
import { ApiError } from '../../src/utils/ApiError';

describe('ApiError', () => {
  it('should create a 400 bad request error', () => {
    const err = ApiError.badRequest('Invalid input');
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toBeInstanceOf(Error);
    expect(err.statusCode).toBe(400);
    expect(err.message).toBe('Invalid input');
  });

  it('should create a 401 unauthorized error with default message', () => {
    const err = ApiError.unauthorized();
    expect(err.statusCode).toBe(401);
    expect(err.message).toBe('Unauthorized');
  });

  it('should create a 403 forbidden error', () => {
    const err = ApiError.forbidden('No access');
    expect(err.statusCode).toBe(403);
    expect(err.message).toBe('No access');
  });

  it('should create a 404 not found error', () => {
    const err = ApiError.notFound('Article not found');
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe('Article not found');
  });

  it('should create a 409 conflict error', () => {
    const err = ApiError.conflict('Already exists');
    expect(err.statusCode).toBe(409);
    expect(err.message).toBe('Already exists');
  });

  it('should create a 422 unprocessable error with field errors', () => {
    const errors = { title: ['Title is required'] };
    const err = ApiError.unprocessable('Validation failed', errors);
    expect(err.statusCode).toBe(422);
    expect(err.message).toBe('Validation failed');
    expect(err.errors).toEqual(errors);
  });

  it('should create a 415 unsupported media type error', () => {
    const err = ApiError.unsupportedMediaType('Only PDF allowed');
    expect(err.statusCode).toBe(415);
    expect(err.message).toBe('Only PDF allowed');
  });
});
