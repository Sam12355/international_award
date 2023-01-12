import prisma from '../../config/database';
import { ApiError } from '../../utils/ApiError';
import { registerDoi } from '../../services/crossref.service';
import { submitToScholar } from '../../services/scholar.service';
import { toArticleResource, ArticleResourceOutput } from '../articles/article.resource';
import logger from '../../utils/logger';
import type { PaginatedResponse } from '../../types';

const publishInclude = {
  journal: { select: { id: true, name: true, issn: true } },
  user: { select: { id: true, name: true } },
} as const;

export async function listApprovedArticles(
  page: number,
  perPage: number,
): Promise<PaginatedResponse<ArticleResourceOutput>> {
  const where = { status: 'APPROVED' as const };

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where,
      include: publishInclude,
      orderBy: { reviewedAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.article.count({ where }),
  ]);

  return {
    data: articles.map(toArticleResource),
    meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) },
  };
}

interface PublishResult {
  article: ArticleResourceOutput;
  warnings: string[];
}

export async function publishArticle(articleId: number): Promise<PublishResult> {
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: {
      journal: { select: { id: true, name: true, issn: true } },
      user: { select: { id: true, name: true } },
    },
  });

  if (!article) {
    throw ApiError.notFound('Article not found');
  }

  if (article.status !== 'APPROVED') {
    throw ApiError.forbidden('Only approved articles can be published');
  }

  const warnings: string[] = [];

  // 1. Register DOI with CrossRef
  const doiResult = await registerDoi({
    id: article.id,
    title: article.title,
    abstract: article.abstract,
    journal: article.journal,
    user: article.user,
  });

  let doiStatus = 'failed';
  let doi = doiResult.doi || null;

  if (doiResult.success) {
    doiStatus = 'registered';
  } else {
    warnings.push(`DOI registration: ${doiResult.error}`);
  }

  // 2. Submit to Google Scholar
  const scholarResult = await submitToScholar({
    id: article.id,
    title: article.title,
    abstract: article.abstract,
    keywords: article.keywords,
    doi,
    journal: article.journal,
    user: article.user,
  });

  let indexStatus = 'failed';
  if (scholarResult.success) {
    indexStatus = 'submitted';
  } else {
    warnings.push(`Scholar indexing: ${scholarResult.error}`);
  }

  // 3. Update article to published
  const updated = await prisma.article.update({
    where: { id: articleId },
    data: {
      status: 'PUBLISHED',
      doi,
      doiStatus,
      indexStatus,
      publishedAt: new Date(),
    },
    include: publishInclude,
  });

  logger.info('Article published', {
    articleId,
    doi,
    doiStatus,
    indexStatus,
    warnings,
  });

  return {
    article: toArticleResource(updated),
    warnings,
  };
}
