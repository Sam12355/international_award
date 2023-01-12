import '../setup';
import { toArticleResource } from '../../src/modules/articles/article.resource';

describe('toArticleResource', () => {
  const baseArticle = {
    id: 1,
    title: 'Test Article',
    userId: 10,
    journalId: 2,
    abstract: 'A detailed abstract.',
    keywords: 'testing, jest',
    filePath: 'uploads/abc123.pdf',
    fileSize: BigInt(5120),
    originalFilename: 'manuscript.pdf',
    status: 'SUBMITTED' as const,
    reviewerNotes: null,
    doi: null,
    doiStatus: null,
    indexStatus: null,
    reviewedAt: null,
    publishedAt: null,
    createdAt: new Date('2025-01-15T10:00:00Z'),
    updatedAt: new Date('2025-01-15T10:00:00Z'),
  };

  it('should transform article to resource format', () => {
    const result = toArticleResource(baseArticle);

    expect(result.id).toBe(1);
    expect(result.reference).toBe('SJP-02-00001');
    expect(result.title).toBe('Test Article');
    expect(result.abstract).toBe('A detailed abstract.');
    expect(result.keywords).toBe('testing, jest');
    expect(result.status).toBe('SUBMITTED');
    expect(result.originalFilename).toBe('manuscript.pdf');
    expect(result.fileSize).toBe(5120);
    expect(result.createdAt).toBe('2025-01-15T10:00:00.000Z');
    expect(result.reviewedAt).toBeNull();
    expect(result.publishedAt).toBeNull();
  });

  it('should exclude internal fields (filePath, doiStatus, indexStatus)', () => {
    const result = toArticleResource(baseArticle);
    expect(result).not.toHaveProperty('filePath');
    expect(result).not.toHaveProperty('doiStatus');
    expect(result).not.toHaveProperty('indexStatus');
    expect(result).not.toHaveProperty('reviewerNotes');
    expect(result).not.toHaveProperty('userId');
  });

  it('should include doi when present', () => {
    const article = { ...baseArticle, doi: '10.1234/sjp.00001' };
    const result = toArticleResource(article);
    expect(result.doi).toBe('10.1234/sjp.00001');
  });

  it('should not include doi when null', () => {
    const result = toArticleResource(baseArticle);
    expect(result.doi).toBeUndefined();
  });

  it('should include journal relation when present', () => {
    const article = {
      ...baseArticle,
      journal: { id: 2, name: 'Science Journal', issn: '1234-5678' },
    };
    const result = toArticleResource(article);
    expect(result.journal).toEqual({ id: 2, name: 'Science Journal', issn: '1234-5678' });
  });

  it('should include user relation when present', () => {
    const article = {
      ...baseArticle,
      user: { id: 10, name: 'John Doe' },
    };
    const result = toArticleResource(article);
    expect(result.user).toEqual({ id: 10, name: 'John Doe' });
  });

  it('should transform review assignments', () => {
    const article = {
      ...baseArticle,
      reviewAssignments: [
        { reviewer: { name: 'Reviewer A' }, status: 'PENDING', dueDate: new Date('2025-02-01') },
        { reviewer: { name: 'Reviewer B' }, status: 'COMPLETED', dueDate: null },
      ],
    };
    const result = toArticleResource(article);
    expect(result.reviewAssignments).toHaveLength(2);
    expect(result.reviewAssignments![0].reviewer).toBe('Reviewer A');
    expect(result.reviewAssignments![0].dueDate).toBe('2025-02-01T00:00:00.000Z');
    expect(result.reviewAssignments![1].dueDate).toBeNull();
  });

  it('should convert BigInt fileSize to number', () => {
    const result = toArticleResource(baseArticle);
    expect(typeof result.fileSize).toBe('number');
    expect(result.fileSize).toBe(5120);
  });

  it('should format dates as ISO strings', () => {
    const article = {
      ...baseArticle,
      reviewedAt: new Date('2025-03-01T12:00:00Z'),
      publishedAt: new Date('2025-04-01T08:00:00Z'),
    };
    const result = toArticleResource(article);
    expect(result.reviewedAt).toBe('2025-03-01T12:00:00.000Z');
    expect(result.publishedAt).toBe('2025-04-01T08:00:00.000Z');
  });
});
