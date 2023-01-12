import '../setup';
import request from 'supertest';
import app from '../../src/app';
import mockPrisma from '../mocks/prisma';
import { createTestUser, actingAs } from '../helpers/testUtils';

jest.mock('../../src/services/email.service', () => ({
  sendArticleSubmitted: jest.fn().mockResolvedValue(undefined),
  sendArticleStatusChanged: jest.fn().mockResolvedValue(undefined),
}));

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('$2a$12$hashedpassword'),
  compare: jest.fn(),
  __esModule: false,
}));

import bcrypt from 'bcryptjs';

describe('Profile / User Endpoints', () => {
  const user = createTestUser({ id: 1, role: 'AUTHOR' });
  let token: string;

  beforeAll(() => {
    token = actingAs(user);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.user.findUnique.mockImplementation(({ where }: { where: { id?: number; email?: string } }) => {
      if (where.id === user.id) return Promise.resolve(user);
      return Promise.resolve(null);
    });
  });

  // ───────── View profile ─────────
  describe('GET /api/users/me', () => {
    it('should return authenticated user profile', async () => {
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('id', user.id);
      expect(res.body.data).toHaveProperty('name', user.name);
      expect(res.body.data).toHaveProperty('email', user.email);
    });

    it('should reject unauthenticated request', async () => {
      const res = await request(app).get('/api/users/me');
      expect(res.status).toBe(401);
    });
  });

  // ───────── Update profile ─────────
  describe('PATCH /api/users/me', () => {
    it('should update user name', async () => {
      const updatedUser = { ...user, name: 'Updated Name' };
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const res = await request(app)
        .patch('/api/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Name' });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('name');
    });

    it('should update user email', async () => {
      // No existing user with this email
      mockPrisma.user.findUnique.mockImplementation(({ where }: { where: { id?: number; email?: string } }) => {
        if (where.id === user.id) return Promise.resolve(user);
        if (where.email === 'new@example.com') return Promise.resolve(null);
        return Promise.resolve(null);
      });

      const updatedUser = { ...user, email: 'new@example.com' };
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const res = await request(app)
        .patch('/api/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ email: 'new@example.com' });

      expect(res.status).toBe(200);
    });

    it('should reject duplicate email', async () => {
      // Another user already has this email
      mockPrisma.user.findUnique.mockImplementation(({ where }: { where: { id?: number; email?: string } }) => {
        if (where.id === user.id) return Promise.resolve(user);
        if (where.email === 'taken@example.com') return Promise.resolve(createTestUser({ id: 99 }));
        return Promise.resolve(null);
      });

      const res = await request(app)
        .patch('/api/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ email: 'taken@example.com' });

      expect(res.status).toBe(409);
    });
  });

  // ───────── Update password ─────────
  describe('PUT /api/users/me/password', () => {
    it('should update password with valid current password', async () => {
      // First findUnique for auth middleware, then for password check
      mockPrisma.user.findUnique.mockImplementation(({ where, select }: { where: { id?: number }; select?: Record<string, boolean> }) => {
        if (select?.password) {
          return Promise.resolve({ password: '$2a$12$existing_hash' });
        }
        if (where.id === user.id) return Promise.resolve(user);
        return Promise.resolve(null);
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockPrisma.user.update.mockResolvedValue(user);

      const res = await request(app)
        .put('/api/users/me/password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'OldPassword123!',
          password: 'NewPassword456!',
          passwordConfirmation: 'NewPassword456!',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message');
    });

    it('should reject incorrect current password', async () => {
      mockPrisma.user.findUnique.mockImplementation(({ where, select }: { where: { id?: number }; select?: Record<string, boolean> }) => {
        if (select?.password) {
          return Promise.resolve({ password: '$2a$12$existing_hash' });
        }
        if (where.id === user.id) return Promise.resolve(user);
        return Promise.resolve(null);
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const res = await request(app)
        .put('/api/users/me/password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'WrongPassword',
          password: 'NewPassword456!',
          passwordConfirmation: 'NewPassword456!',
        });

      expect(res.status).toBe(401);
    });
  });

  // ───────── Delete account ─────────
  describe('DELETE /api/users/me', () => {
    it('should delete own account', async () => {
      mockPrisma.user.delete.mockResolvedValue(user);

      const res = await request(app)
        .delete('/api/users/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(204);
    });

    it('should reject unauthenticated delete', async () => {
      const res = await request(app).delete('/api/users/me');
      expect(res.status).toBe(401);
    });
  });
});
