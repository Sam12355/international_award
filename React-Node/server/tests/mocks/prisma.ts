/**
 * Prisma mock — replaces the real DB client with jest mocks.
 * 
 * IMPORTANT: Each test file must call jest.mock before importing the app:
 *   jest.mock('../../src/config/database', () => ({ __esModule: true, default: mockPrisma }));
 *   import mockPrisma from '../mocks/prisma';
 * 
 * OR just import this file which self-registers the mock via jest.mock (hoisted).
 */

// Helper: create a loosely-typed jest.fn() so mockResolvedValue accepts any arg
const fn = () => jest.fn() as jest.Mock<any, any>;

// Build a deeply-mocked Prisma client
const mockPrisma = {
  user: {
    create: fn(),
    findUnique: fn(),
    findFirst: fn(),
    findMany: fn(),
    update: fn(),
    delete: fn(),
    count: fn(),
    upsert: fn(),
  },
  journal: {
    findUnique: fn(),
    findMany: fn(),
    create: fn(),
    upsert: fn(),
  },
  article: {
    create: fn(),
    findUnique: fn(),
    findFirst: fn(),
    findMany: fn(),
    update: fn(),
    delete: fn(),
    count: fn(),
  },
  reviewAssignment: {
    create: fn(),
    findUnique: fn(),
    findMany: fn(),
    update: fn(),
    delete: fn(),
  },
  articleView: {
    create: fn(),
  },
  refreshToken: {
    create: fn(),
    findUnique: fn(),
    findFirst: fn(),
    delete: fn(),
    deleteMany: fn(),
  },
  $transaction: fn().mockImplementation((cb: (tx: typeof mockPrisma) => Promise<unknown>) => cb(mockPrisma)),
};

export default mockPrisma;
