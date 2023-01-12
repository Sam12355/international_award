import { Request, Response, NextFunction } from 'express';
import * as reviewService from './review.service';
import { updateStatusSchema } from './review.schema';
import { ApiError } from '../../utils/ApiError';

export async function index(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const perPage = Math.min(100, Math.max(1, parseInt(req.query.perPage as string, 10) || 15));

    const result = await reviewService.listReviewableArticles(page, perPage);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function show(req: Request, res: Response, next: NextFunction) {
  try {
    const articleId = parseInt(req.params.id as string, 10);
    if (isNaN(articleId)) throw ApiError.badRequest('Invalid article ID');

    const article = await reviewService.getArticleForReview(articleId);
    res.json({ data: article });
  } catch (error) {
    next(error);
  }
}

export async function updateStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const articleId = parseInt(req.params.id as string, 10);
    if (isNaN(articleId)) throw ApiError.badRequest('Invalid article ID');

    const input = updateStatusSchema.parse(req.body);
    const article = await reviewService.updateArticleStatus(articleId, input);

    res.json({ data: article });
  } catch (error) {
    next(error);
  }
}
