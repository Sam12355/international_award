import '../setup';
import request from 'supertest';
import app from '../../src/app';
import mockPrisma from '../mocks/prisma';
import { createTestUser, createTestArticle, createTestJournal, actingAs } from '../helpers/testUtils';

jest.mock('../../src/services/email.service', () => ({
  sendArticleSubmitted: jest.fn().mockResolvedValue(undefined),
  sendArticleStatusChanged: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../src/services/crossref.service', () => ({
  registerDoi: jest.fn().mockResolvedValue({ success: true, doi: '10.1234/test-doi' }),
}));

jest.mock('../../src/services/scholar.service', () => ({
  submitToScholar: jest.fn().mockResolvedValue({ success: true }),
}));

describe('Publish Endpoints', () => {
  const author = createTestUser({ id: 1, role: 'AUTHOR' });
  const reviewer = createTestUser({ id: 2, role: 'REVIEWER' });
  const admin = createTestUser({ id: 3, role: 'ADMIN' });

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
    mockPrisma.user.findUnique.mockImplementation(({ where }: { where: { id?: number; email?: string } }) => {
      if (where.id === 1) return Promise.resolve(author);
      if (where.id === 2) return Promise.resolve(reviewer);
      if (where.id === 3) return Promise.resolve(admin);
      return Promise.resolve(null);
    });
  });

  // ───────── Authorization ─────────
  describe('Authorization', () => {
    it('should deny author access to publish queue', async () => {
      const res = await request(app)
        .get('/api/publish')
        .set('Authorization', `Bearer ${authorToken}`);

      expect(res.status).toBe(403);
    });

    it('should deny reviewer access to publish queue', async () => {
      const res = await request(app)
        .get('/api/publish')
        .set('Authorization', `Bearer ${reviewerToken}`);

      expect(res.status).toBe(403);
    });

    it('should deny unauthenticated access', async () => {
      const res = await request(app).get('/api/publish');
      expect(res.status).toBe(401);
    });
  });

  // ───────── List approved articles ─────────
  describe('GET /api/publish', () => {
    it('should allow admin to list approved articles', async () => {
      const journal = createTestJournal();
      const articles = [
        createTestArticle({
          id: 1,
          userId: author.id,
          status: 'APPROVED',
          journal,
          user: { id: author.id, name: author.name },
        }),
      ];

      mockPrisma.article.findMany.mockResolvedValue(articles);
      mockPrisma.article.count.mockResolvedValue(1);

      const res = await request(app)
        .get('/api/publish')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.meta).toHaveProperty('total', 1);
    });
  });

  // ───────── Publish article ─────────
  describe('POST /api/publish/:id', () => {
    it('should allow admin to publish an approved article', async () => {
      const journal = createTestJournal();
      const user = { id: author.id, name: author.name };
      const article = createTestArticle({
        id: 1,
        userId: author.id,
        status: 'APPROVED',
        journal,
        user,
      });

      mockPrisma.article.findUnique.mockResolvedValue(article);
      mockPrisma.article.update.mockResolvedValue({
        ...article,
        status: 'PUBLISHED',
        doi: '10.1234/test-doi',
        doiStatus: 'registered',
        indexStatus: 'submitted',
        publishedAt: new Date(),
        journal,
        user,
      });

      const res = await request(app)
        .post('/api/publish/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
    });

    it('should reject publishing a non-approved article', async () => {
      const article = createTestArticle({
        id: 1,
        userId: author.id,
        status: 'SUBMITTED',
        journal: createTestJournal(),
        user: { id: author.id, name: author.name },
      });

      mockPrisma.article.findUnique.mockResolvedValue(article);

      const res = await request(app)
        .post('/api/publish/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(403);
    });

    it('should return 404 for non-existent article', async () => {
      mockPrisma.article.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/publish/999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });

    it('should return warnings when DOI registration fails', async () => {
      const { registerDoi } = require('../../src/services/crossref.service');
      registerDoi.mockResolvedValueOnce({ success: false, error: 'Service unavailable', doi: null });

      const journal = createTestJournal();
      const user = { id: author.id, name: author.name };
      const article = createTestArticle({
        id: 1,
        userId: author.id,
        status: 'APPROVED',
        journal,
        user,
      });

      mockPrisma.article.findUnique.mockResolvedValue(article);
      mockPrisma.article.update.mockResolvedValue({
        ...article,
        status: 'PUBLISHED',
        doi: null,
        doiStatus: 'failed',
        indexStatus: 'submitted',
        publishedAt: new Date(),
        journal,
        user,
      });

      const res = await request(app)
        .post('/api/publish/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.warnings).toBeDefined();
      expect(res.body.warnings.length).toBeGreaterThan(0);
    });

    it('should deny author from publishing', async () => {
      const res = await request(app)
        .post('/api/publish/1')
        .set('Authorization', `Bearer ${authorToken}`);

      expect(res.status).toBe(403);
    });
  });
});
