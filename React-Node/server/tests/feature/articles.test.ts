import '../setup';
import request from 'supertest';
import app from '../../src/app';
import mockPrisma from '../mocks/prisma';
import { createTestUser, createTestArticle, createTestJournal, actingAs } from '../helpers/testUtils';

// Mock services
jest.mock('../../src/services/email.service', () => ({
  sendArticleSubmitted: jest.fn().mockResolvedValue(undefined),
  sendArticleStatusChanged: jest.fn().mockResolvedValue(undefined),
}));

describe('Article Endpoints', () => {
  let author = createTestUser({ id: 1, role: 'AUTHOR' });
  let reviewer = createTestUser({ id: 2, role: 'REVIEWER' });
  let admin = createTestUser({ id: 3, role: 'ADMIN' });
  let authorToken: string;
  let reviewerToken: string;
  let adminToken: string;

  beforeAll(() => {
    authorToken = actingAs(author);
    reviewerToken = actingAs(reviewer);
    adminToken = actingAs(admin);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // authenticate middleware looks up user
    mockPrisma.user.findUnique.mockImplementation(({ where }: { where: { id?: number; email?: string } }) => {
      if (where.id === 1) return Promise.resolve(author);
      if (where.id === 2) return Promise.resolve(reviewer);
      if (where.id === 3) return Promise.resolve(admin);
      return Promise.resolve(null);
    });
  });

  // ───────── Guest cannot access articles ─────────
  describe('Authentication required', () => {
    it('should reject unauthenticated request to GET /api/articles', async () => {
      const res = await request(app).get('/api/articles');
      expect(res.status).toBe(401);
    });

    it('should reject unauthenticated request to POST /api/articles', async () => {
      const res = await request(app).post('/api/articles');
      expect(res.status).toBe(401);
    });
  });

  // ───────── List articles ─────────
  describe('GET /api/articles', () => {
    it('should return paginated articles for authenticated user', async () => {
      const journal = createTestJournal();
      const articles = [
        createTestArticle({
          id: 1,
          userId: 1,
          journal,
          user: { id: 1, name: author.name },
        }),
      ];

      mockPrisma.article.findMany.mockResolvedValue(articles);
      mockPrisma.article.count.mockResolvedValue(1);

      const res = await request(app)
        .get('/api/articles')
        .set('Authorization', `Bearer ${authorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.meta).toHaveProperty('total', 1);
      expect(res.body.meta).toHaveProperty('page', 1);
    });
  });

  // ───────── Submit article ─────────
  describe('POST /api/articles', () => {
    it('should create an article for authenticated author', async () => {
      const journal = createTestJournal();
      const article = createTestArticle({
        userId: author.id,
        journal,
        user: { id: author.id, name: author.name },
      });

      mockPrisma.journal.findUnique.mockResolvedValue(journal);
      mockPrisma.article.create.mockResolvedValue(article);

      // Use JSON body (the storage mock already injects req.file)
      const res = await request(app)
        .post('/api/articles')
        .set('Authorization', `Bearer ${authorToken}`)
        .send({
          title: 'A Study on Testing',
          journal_id: 1,
          abstract: 'This paper explores automated testing strategies in great detail for modern applications.',
          keywords: 'testing, jest, node',
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('title');
    });

    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/articles')
        .set('Authorization', `Bearer ${authorToken}`)
        .send({});

      // 422 from Zod validation or missing file
      expect([400, 422]).toContain(res.status);
    });
  });

  // ───────── View article ─────────
  describe('GET /api/articles/:id', () => {
    it('should return article details for owner', async () => {
      const article = createTestArticle({
        id: 1,
        userId: author.id,
        journal: createTestJournal(),
        user: { id: author.id, name: author.name },
        reviewAssignments: [],
      });

      mockPrisma.article.findUnique.mockResolvedValue(article);
      mockPrisma.articleView.create.mockResolvedValue({});

      const res = await request(app)
        .get('/api/articles/1')
        .set('Authorization', `Bearer ${authorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('reference');
    });

    it('should forbid author from viewing another user article', async () => {
      const otherArticle = createTestArticle({
        id: 2,
        userId: 999, // not the author
        journal: createTestJournal(),
        user: { id: 999, name: 'Other User' },
        reviewAssignments: [],
      });

      mockPrisma.article.findUnique.mockResolvedValue(otherArticle);

      const res = await request(app)
        .get('/api/articles/2')
        .set('Authorization', `Bearer ${authorToken}`);

      expect(res.status).toBe(403);
    });

    it('should allow reviewer to view any article', async () => {
      const article = createTestArticle({
        id: 1,
        userId: author.id,
        journal: createTestJournal(),
        user: { id: author.id, name: author.name },
        reviewAssignments: [],
      });

      mockPrisma.article.findUnique.mockResolvedValue(article);
      mockPrisma.articleView.create.mockResolvedValue({});

      const res = await request(app)
        .get('/api/articles/1')
        .set('Authorization', `Bearer ${reviewerToken}`);

      expect(res.status).toBe(200);
    });

    it('should return 404 for non-existent article', async () => {
      mockPrisma.article.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/articles/999')
        .set('Authorization', `Bearer ${authorToken}`);

      expect(res.status).toBe(404);
    });
  });

  // ───────── Update article ─────────
  describe('PUT /api/articles/:id', () => {
    it('should update own submitted article', async () => {
      const existing = createTestArticle({ id: 1, userId: author.id, status: 'SUBMITTED' });
      const updated = { ...existing, title: 'Updated Title' };

      mockPrisma.article.findUnique.mockResolvedValue(existing);
      mockPrisma.article.update.mockResolvedValue({
        ...updated,
        journal: createTestJournal(),
        user: { id: author.id, name: author.name },
      });

      const res = await request(app)
        .put('/api/articles/1')
        .set('Authorization', `Bearer ${authorToken}`)
        .field('title', 'Updated Title');

      expect(res.status).toBe(200);
    });

    it('should forbid editing approved article', async () => {
      const existing = createTestArticle({ id: 1, userId: author.id, status: 'APPROVED' });

      mockPrisma.article.findUnique.mockResolvedValue(existing);

      const res = await request(app)
        .put('/api/articles/1')
        .set('Authorization', `Bearer ${authorToken}`)
        .field('title', 'Updated Title');

      expect(res.status).toBe(403);
    });

    it('should forbid editing another users article', async () => {
      const existing = createTestArticle({ id: 1, userId: 999, status: 'SUBMITTED' });

      mockPrisma.article.findUnique.mockResolvedValue(existing);

      const res = await request(app)
        .put('/api/articles/1')
        .set('Authorization', `Bearer ${authorToken}`)
        .field('title', 'Updated Title');

      expect(res.status).toBe(403);
    });
  });

  // ───────── Delete article ─────────
  describe('DELETE /api/articles/:id', () => {
    it('should allow author to delete own submitted article', async () => {
      const article = createTestArticle({ id: 1, userId: author.id, status: 'SUBMITTED' });

      mockPrisma.article.findUnique.mockResolvedValue(article);
      mockPrisma.article.delete.mockResolvedValue(article);

      const res = await request(app)
        .delete('/api/articles/1')
        .set('Authorization', `Bearer ${authorToken}`);

      expect(res.status).toBe(204);
    });

    it('should forbid author from deleting published article', async () => {
      const article = createTestArticle({ id: 1, userId: author.id, status: 'PUBLISHED' });

      mockPrisma.article.findUnique.mockResolvedValue(article);

      const res = await request(app)
        .delete('/api/articles/1')
        .set('Authorization', `Bearer ${authorToken}`);

      expect(res.status).toBe(403);
    });

    it('should forbid deleting another users article', async () => {
      const article = createTestArticle({ id: 1, userId: 999, status: 'SUBMITTED' });

      mockPrisma.article.findUnique.mockResolvedValue(article);

      const res = await request(app)
        .delete('/api/articles/1')
        .set('Authorization', `Bearer ${authorToken}`);

      expect(res.status).toBe(403);
    });

    it('should allow admin to delete any article', async () => {
      const article = createTestArticle({ id: 1, userId: author.id, status: 'SUBMITTED' });

      mockPrisma.article.findUnique.mockResolvedValue(article);
      mockPrisma.article.delete.mockResolvedValue(article);

      const res = await request(app)
        .delete('/api/articles/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(204);
    });
  });
});
