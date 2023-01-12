import { Response, NextFunction } from 'express';
import * as articleService from './article.service';
import { AuthenticatedRequest } from '../../types';
import { storeArticleSchema, updateArticleSchema, articleQuerySchema } from './article.schema';
import { ApiError } from '../../utils/ApiError';

export async function index(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const query = articleQuerySchema.parse(req.query);
    const result = await articleService.listArticles(req.user!.id, req.user!.role, query);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function show(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const articleId = parseInt(req.params.id as string, 10);
    if (isNaN(articleId)) throw ApiError.badRequest('Invalid article ID');

    const article = await articleService.getArticle(articleId, req.user!.id, req.user!.role);

    // Track view (fire-and-forget)
    articleService.trackView(articleId, req.ip, req.get('user-agent')).catch(() => {});

    res.json({ data: article });
  } catch (error) {
    next(error);
  }
}

export async function store(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      throw ApiError.unprocessable('Manuscript file is required');
    }

    const input = storeArticleSchema.parse(req.body);
    const article = await articleService.createArticle(
      req.user!.id,
      req.user!.email,
      input,
      req.file,
    );

    res.status(201).json({ data: article });
  } catch (error) {
    next(error);
  }
}

export async function update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const articleId = parseInt(req.params.id as string, 10);
    if (isNaN(articleId)) throw ApiError.badRequest('Invalid article ID');

    const input = updateArticleSchema.parse(req.body);
    const article = await articleService.updateArticle(
      articleId,
      req.user!.id,
      input,
      req.file,
    );

    res.json({ data: article });
  } catch (error) {
    next(error);
  }
}

export async function destroy(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const articleId = parseInt(req.params.id as string, 10);
    if (isNaN(articleId)) throw ApiError.badRequest('Invalid article ID');

    await articleService.deleteArticle(articleId, req.user!.id, req.user!.role);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
