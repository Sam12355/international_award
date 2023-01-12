import '../setup';
import request from 'supertest';
import * as bcrypt from 'bcryptjs';
import app from '../../src/app';
import mockPrisma from '../mocks/prisma';
import { createTestUser } from '../helpers/testUtils';

// Mock email service
jest.mock('../../src/services/email.service', () => ({
  sendArticleSubmitted: jest.fn().mockResolvedValue(undefined),
  sendArticleStatusChanged: jest.fn().mockResolvedValue(undefined),
}));

describe('Auth Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ───────── Registration ─────────
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const hashedPassword = await bcrypt.hash('password123', 12);
      const newUser = createTestUser({
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        password: hashedPassword,
      });

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(newUser);
      mockPrisma.refreshToken.create.mockResolvedValue({
        id: 1,
        token: 'refresh-token',
        userId: 1,
        expiresAt: new Date(),
        createdAt: new Date(),
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          passwordConfirmation: 'password123',
        });

      expect(res.status).toBe(201);
      expect(res.body.user).toHaveProperty('email', 'test@example.com');
      expect(res.body.tokens).toHaveProperty('accessToken');
      expect(res.body.tokens).toHaveProperty('refreshToken');
    });

    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({});

      expect(res.status).toBe(422);
      expect(res.body).toHaveProperty('errors');
    });

    it('should reject mismatched passwords', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          passwordConfirmation: 'different123',
        });

      expect(res.status).toBe(422);
    });
  });

  // ───────── Login ─────────
  describe('POST /api/auth/login', () => {
    it('should authenticate user with valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('password', 12);
      const user = createTestUser({ password: hashedPassword });

      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.user.update.mockResolvedValue(user);
      mockPrisma.refreshToken.create.mockResolvedValue({
        id: 1,
        token: 'refresh-token',
        userId: user.id,
        expiresAt: new Date(),
        createdAt: new Date(),
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: user.email, password: 'password' });

      expect(res.status).toBe(200);
      expect(res.body.user).toHaveProperty('id', user.id);
      expect(res.body.tokens).toHaveProperty('accessToken');
    });

    it('should reject invalid password', async () => {
      const hashedPassword = await bcrypt.hash('password', 12);
      const user = createTestUser({ password: hashedPassword });

      mockPrisma.user.findUnique.mockResolvedValue(user);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: user.email, password: 'wrong-password' });

      expect(res.status).toBe(401);
    });

    it('should reject non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'noone@test.dev', password: 'password' });

      expect(res.status).toBe(401);
    });
  });

  // ───────── Logout ─────────
  describe('POST /api/auth/logout', () => {
    it('should delete the refresh token', async () => {
      mockPrisma.refreshToken.findFirst.mockResolvedValue({
        id: 1,
        token: 'valid-refresh',
        userId: 1,
        expiresAt: new Date(Date.now() + 86400000),
        createdAt: new Date(),
      });
      mockPrisma.refreshToken.delete.mockResolvedValue({});

      const res = await request(app)
        .post('/api/auth/logout')
        .send({ refreshToken: 'valid-refresh' });

      expect(res.status).toBe(204);
    });
  });
});
