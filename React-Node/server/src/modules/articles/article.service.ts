import prisma from '../../config/database';
import { ApiError } from '../../utils/ApiError';
import { makeReference } from '../../utils/reference';
import { deleteFile } from '../../services/storage.service';
import { sendArticleSubmitted } from '../../services/email.service';
import logger from '../../utils/logger';
import type { StoreArticleInput, UpdateArticleInput, ArticleQueryInput } from './article.schema';
import type { PaginatedResponse } from '../../types';
import { toArticleResource, ArticleResourceOutput } from './article.resource';

const articleInclude = {
  journal: { select: { id: true, name: true, issn: true } },
  user: { select: { id: true, name: true } },
} as const;

export async function listArticles(
  userId: number,
  userRole: string,
  query: ArticleQueryInput,
): Promise<PaginatedResponse<ArticleResourceOutput>> {
  const { page, perPage, status } = query;

  const where: Record<string, unknown> = {};

  // Authors only see their own articles; reviewers/admins see all
  if (userRole === 'AUTHOR') {
    where.userId = userId;
  }

  if (status) {
    where.status = status;
  }

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where,
      include: articleInclude,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.article.count({ where }),
  ]);

  return {
    data: articles.map(toArticleResource),
    meta: {
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    },
  };
}

export async function getArticle(
  articleId: number,
  userId: number,
  userRole: string,
): Promise<ArticleResourceOutput> {
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: {
      ...articleInclude,
      reviewAssignments: {
        include: { reviewer: { select: { name: true } } },
      },
    },
  });

  if (!article) {
    throw ApiError.notFound('Article not found');
  }

  // Authorization: own article, reviewer, or admin
  if (userRole === 'AUTHOR' && article.userId !== userId) {
    throw ApiError.forbidden('You can only view your own articles');
  }

  return toArticleResource(article);
}

export async function createArticle(
  userId: number,
  userEmail: string,
  input: StoreArticleInput,
  file: Express.Multer.File,
): Promise<ArticleResourceOutput> {
  // Verify journal exists
  const journal = await prisma.journal.findUnique({
    where: { id: input.journal_id },
  });

  if (!journal || !journal.isActive) {
    throw ApiError.unprocessable('Invalid or inactive journal');
  }

  const article = await prisma.article.create({
    data: {
      title: input.title,
      userId,
      journalId: input.journal_id,
      abstract: input.abstract,
      keywords: input.keywords ?? null,
      filePath: file.filename,
      fileSize: file.size,
      originalFilename: file.originalname,
      status: 'SUBMITTED',
    },
    include: articleInclude,
  });

  const reference = makeReference(article.journalId, article.id);

  logger.info('Article created', { articleId: article.id, reference });

  // Send confirmation email (non-blocking)
  sendArticleSubmitted(userEmail, {
    reference,
    title: article.title,
    articleId: article.id,
  }).catch(() => {});

  return toArticleResource(article);
}

export async function updateArticle(
  articleId: number,
  userId: number,
  input: UpdateArticleInput,
  file?: Express.Multer.File,
): Promise<ArticleResourceOutput> {
  const existing = await prisma.article.findUnique({
    where: { id: articleId },
  });

  if (!existing) {
    throw ApiError.notFound('Article not found');
  }

  if (existing.userId !== userId) {
    throw ApiError.forbidden('You can only edit your own articles');
  }

  if (existing.status !== 'SUBMITTED') {
    throw ApiError.forbidden('Articles can only be edited while in submitted status');
  }

  const updateData: Record<string, unknown> = {};

  if (input.title) updateData.title = input.title;
  if (input.abstract) updateData.abstract = input.abstract;
  if (input.keywords !== undefined) updateData.keywords = input.keywords;

  if (file) {
    // Delete old file
    deleteFile(existing.filePath);

    updateData.filePath = file.filename;
    updateData.fileSize = file.size;
    updateData.originalFilename = file.originalname;
  }

  const article = await prisma.article.update({
    where: { id: articleId },
    data: updateData,
    include: articleInclude,
  });

  logger.info('Article updated', { articleId: article.id });

  return toArticleResource(article);
}

export async function deleteArticle(articleId: number, userId: number, userRole: string): Promise<void> {
  const article = await prisma.article.findUnique({
    where: { id: articleId },
  });

  if (!article) {
    throw ApiError.notFound('Article not found');
  }

  // Admins can delete any article; authors only their own
  if (userRole !== 'ADMIN' && article.userId !== userId) {
    throw ApiError.forbidden('You can only delete your own articles');
  }

  if (['APPROVED', 'PUBLISHED'].includes(article.status)) {
    throw ApiError.forbidden('Approved or published articles cannot be deleted');
  }

  // Delete file from disk
  deleteFile(article.filePath);

  await prisma.article.delete({ where: { id: articleId } });

  logger.info('Article deleted', { articleId });
}

export async function trackView(
  articleId: number,
  ipAddress: string | undefined,
  userAgent: string | undefined,
): Promise<void> {
  await prisma.articleView.create({
    data: {
      articleId,
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null,
    },
  });
}
