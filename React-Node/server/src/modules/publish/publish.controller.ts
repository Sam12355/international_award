import { Request, Response, NextFunction } from 'express';
import * as publishService from './publish.service';
import { ApiError } from '../../utils/ApiError';

export async function index(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const perPage = Math.min(100, Math.max(1, parseInt(req.query.perPage as string, 10) || 15));

    const result = await publishService.listApprovedArticles(page, perPage);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function publish(req: Request, res: Response, next: NextFunction) {
  try {
    const articleId = parseInt(req.params.id as string, 10);
    if (isNaN(articleId)) throw ApiError.badRequest('Invalid article ID');

    const result = await publishService.publishArticle(articleId);

    res.json({
      data: result.article,
      ...(result.warnings.length > 0 && { warnings: result.warnings }),
    });
  } catch (error) {
    next(error);
  }
}
