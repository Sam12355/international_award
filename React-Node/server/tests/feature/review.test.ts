import '../setup';
import request from 'supertest';
import app from '../../src/app';
import mockPrisma from '../mocks/prisma';
import { createTestUser, createTestArticle, createTestJournal, actingAs } from '../helpers/testUtils';

jest.mock('../../src/services/email.service', () => ({
  sendArticleSubmitted: jest.fn().mockResolvedValue(undefined),
  sendArticleStatusChanged: jest.fn().mockResolvedValue(undefined),
}));

describe('Review Endpoints', () => {
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
    it('should deny author access to review queue', async () => {
      const res = await request(app)
        .get('/api/reviews')
        .set('Authorization', `Bearer ${authorToken}`);

      expect(res.status).toBe(403);
    });

    it('should deny unauthenticated access', async () => {
      const res = await request(app).get('/api/reviews');
      expect(res.status).toBe(401);
    });
  });

  // ───────── List reviewable articles ─────────
  describe('GET /api/reviews', () => {
    it('should allow reviewer to list reviewable articles', async () => {
      const journal = createTestJournal();
      const articles = [
        createTestArticle({
          id: 1,
          userId: author.id,
          status: 'SUBMITTED',
          journal,
          user: { id: author.id, name: author.name },
          reviewAssignments: [],
        }),
      ];

      mockPrisma.article.findMany.mockResolvedValue(articles);
      mockPrisma.article.count.mockResolvedValue(1);

      const res = await request(app)
        .get('/api/reviews')
        .set('Authorization', `Bearer ${reviewerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.meta).toHaveProperty('total', 1);
    });

    it('should allow admin to list reviewable articles', async () => {
      mockPrisma.article.findMany.mockResolvedValue([]);
      mockPrisma.article.count.mockResolvedValue(0);

      const res = await request(app)
        .get('/api/reviews')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
    });
  });

  // ───────── View article for review ─────────
  describe('GET /api/reviews/:id', () => {
    it('should allow reviewer to view article for review', async () => {
      const article = createTestArticle({
        id: 1,
        userId: author.id,
        status: 'SUBMITTED',
        journal: createTestJournal(),
        user: { id: author.id, name: author.name },
        reviewAssignments: [],
      });

      mockPrisma.article.findUnique.mockResolvedValue(article);

      const res = await request(app)
        .get('/api/reviews/1')
        .set('Authorization', `Bearer ${reviewerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('reference');
    });

    it('should return 404 for non-existent article', async () => {
      mockPrisma.article.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/reviews/999')
        .set('Authorization', `Bearer ${reviewerToken}`);

      expect(res.status).toBe(404);
    });
  });

  // ───────── Update status ─────────
  describe('PATCH /api/reviews/:id/status', () => {
    it('should allow reviewer to approve article', async () => {
      const article = createTestArticle({
        id: 1,
        userId: author.id,
        status: 'SUBMITTED',
        journal: createTestJournal(),
        user: { id: author.id, name: author.name, email: author.email },
        reviewAssignments: [],
      });

      mockPrisma.article.findUnique.mockResolvedValue(article);
      mockPrisma.article.update.mockResolvedValue({
        ...article,
        status: 'APPROVED',
        reviewedAt: new Date(),
      });

      const res = await request(app)
        .patch('/api/reviews/1/status')
        .set('Authorization', `Bearer ${reviewerToken}`)
        .send({ status: 'APPROVED' });

      expect(res.status).toBe(200);
    });

    it('should allow reviewer to reject article with notes', async () => {
      const article = createTestArticle({
        id: 1,
        userId: author.id,
        status: 'SUBMITTED',
        journal: createTestJournal(),
        user: { id: author.id, name: author.name, email: author.email },
        reviewAssignments: [],
      });

      mockPrisma.article.findUnique.mockResolvedValue(article);
      mockPrisma.article.update.mockResolvedValue({
        ...article,
        status: 'REJECTED',
        reviewerNotes: 'Insufficient methodology',
        reviewedAt: new Date(),
      });

      const res = await request(app)
        .patch('/api/reviews/1/status')
        .set('Authorization', `Bearer ${reviewerToken}`)
        .send({ status: 'REJECTED', reviewer_notes: 'Insufficient methodology' });

      expect(res.status).toBe(200);
    });

    it('should reject invalid status values', async () => {
      const res = await request(app)
        .patch('/api/reviews/1/status')
        .set('Authorization', `Bearer ${reviewerToken}`)
        .send({ status: 'INVALID_STATUS' });

      expect([400, 422]).toContain(res.status);
    });

    it('should deny author from updating article status', async () => {
      const res = await request(app)
        .patch('/api/reviews/1/status')
        .set('Authorization', `Bearer ${authorToken}`)
        .send({ status: 'APPROVED' });

      expect(res.status).toBe(403);
    });

    it('should return 404 for non-existent article', async () => {
      mockPrisma.article.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .patch('/api/reviews/999/status')
        .set('Authorization', `Bearer ${reviewerToken}`)
        .send({ status: 'APPROVED' });

      expect(res.status).toBe(404);
    });
  });
});
