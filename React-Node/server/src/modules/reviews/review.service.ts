import prisma from '../../config/database';
import { ApiError } from '../../utils/ApiError';
import { makeReference } from '../../utils/reference';
import { sendArticleStatusChanged } from '../../services/email.service';
import { toArticleResource, ArticleResourceOutput } from '../articles/article.resource';
import logger from '../../utils/logger';
import type { UpdateStatusInput } from './review.schema';
import type { PaginatedResponse } from '../../types';

const reviewInclude = {
  journal: { select: { id: true, name: true, issn: true } },
  user: { select: { id: true, name: true, email: true } },
  reviewAssignments: {
    include: { reviewer: { select: { name: true } } },
  },
} as const;

export async function listReviewableArticles(
  page: number,
  perPage: number,
): Promise<PaginatedResponse<ArticleResourceOutput>> {
  const where = {
    status: { in: ['SUBMITTED' as const, 'UNDER_REVIEW' as const] },
  };

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where,
      include: reviewInclude,
      orderBy: { createdAt: 'desc' },
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

export async function getArticleForReview(articleId: number): Promise<ArticleResourceOutput> {
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: reviewInclude,
  });

  if (!article) {
    throw ApiError.notFound('Article not found');
  }

  return toArticleResource(article);
}

export async function updateArticleStatus(
  articleId: number,
  input: UpdateStatusInput,
): Promise<ArticleResourceOutput> {
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: {
      journal: { select: { id: true, name: true, issn: true } },
      user: { select: { id: true, name: true, email: true } },
    },
  });

  if (!article) {
    throw ApiError.notFound('Article not found');
  }

  const previousStatus = article.status;

  const updated = await prisma.article.update({
    where: { id: articleId },
    data: {
      status: input.status,
      reviewerNotes: input.reviewer_notes ?? null,
      reviewedAt: new Date(),
    },
    include: reviewInclude,
  });

  const reference = makeReference(article.journalId, article.id);

  logger.info('Article status updated', {
    articleId,
    reference,
    from: previousStatus,
    to: input.status,
  });

  // Send notification email to author (non-blocking)
  if (article.user) {
    sendArticleStatusChanged(article.user.email, {
      reference,
      title: article.title,
      previousStatus,
      newStatus: input.status,
      reviewerNotes: input.reviewer_notes,
      articleId: article.id,
    }).catch(() => {});
  }

  return toArticleResource(updated);
}
