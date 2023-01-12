/**
 * Manual Jest mock for src/config/database.ts
 * 
 * Jest automatically picks this up when any test calls:
 *   jest.mock('../../src/config/database')  (or equivalent path)
 * 
 * All Prisma methods are jest.fn() mocks that can be configured per-test.
 */
const fn = () => jest.fn() as jest.Mock<any, any>;

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
