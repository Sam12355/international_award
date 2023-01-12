import { makeReference } from '../../utils/reference';

/**
 * Represents the raw Article model shape from the database.
 */
interface ArticleModel {
  id: number;
  title: string;
  userId: number;
  journalId: number;
  abstract: string | null;
  keywords: string | null;
  filePath: string;
  fileSize: number | bigint;
  originalFilename: string;
  status: string;
  reviewerNotes: string | null;
  doi: string | null;
  doiStatus: string | null;
  indexStatus: string | null;
  reviewedAt: Date | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ArticleWithRelations extends ArticleModel {
  journal?: { id: number; name: string; issn: string } | null;
  user?: { id: number; name: string } | null;
  reviewAssignments?: Array<{
    reviewer: { name: string };
    status: string;
    dueDate: Date | null;
  }>;
}

export interface ArticleResourceOutput {
  id: number;
  reference: string;
  title: string;
  abstract: string | null;
  keywords: string | null;
  status: string;
  doi?: string;
  originalFilename: string;
  fileSize: number;
  createdAt: string;
  reviewedAt: string | null;
  publishedAt: string | null;
  journal?: { id: number; name: string; issn: string };
  user?: { id: number; name: string };
  reviewAssignments?: Array<{
    reviewer: string;
    status: string;
    dueDate: string | null;
  }>;
}

/**
 * Transform an Article model into a clean API response.
 * Excludes internal fields: filePath, doiStatus, indexStatus.
 */
export function toArticleResource(article: ArticleWithRelations): ArticleResourceOutput {
  const resource: ArticleResourceOutput = {
    id: article.id,
    reference: makeReference(article.journalId, article.id),
    title: article.title,
    abstract: article.abstract,
    keywords: article.keywords,
    status: article.status,
    originalFilename: article.originalFilename,
    fileSize: Number(article.fileSize),
    createdAt: article.createdAt.toISOString(),
    reviewedAt: article.reviewedAt?.toISOString() ?? null,
    publishedAt: article.publishedAt?.toISOString() ?? null,
  };

  if (article.doi) {
    resource.doi = article.doi;
  }

  if (article.journal) {
    resource.journal = {
      id: article.journal.id,
      name: article.journal.name,
      issn: article.journal.issn,
    };
  }

  if (article.user) {
    resource.user = {
      id: article.user.id,
      name: article.user.name,
    };
  }

  if (article.reviewAssignments) {
    resource.reviewAssignments = article.reviewAssignments.map((ra) => ({
      reviewer: ra.reviewer.name,
      status: ra.status,
      dueDate: ra.dueDate?.toISOString() ?? null,
    }));
  }

  return resource;
}
