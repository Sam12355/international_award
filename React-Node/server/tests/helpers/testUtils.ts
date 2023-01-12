/**
 * Test helper utilities — mirrors Laravel's factory/actingAs patterns.
 */
import { signAccessToken } from '../../src/utils/jwt';
import type { JwtPayload } from '../../src/types';

export interface TestUser {
  id: number;
  name: string;
  email: string;
  password: string;
  role: 'AUTHOR' | 'REVIEWER' | 'ADMIN';
  emailVerifiedAt: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

let userIdCounter = 1;

/**
 * Create a fake user object (like a Laravel factory).
 */
export function createTestUser(overrides: Partial<TestUser> = {}): TestUser {
  const id = overrides.id ?? userIdCounter++;
  return {
    id,
    name: `User ${id}`,
    email: `user${id}@test.dev`,
    password: '$2a$12$hashedpassword', // bcrypt of "password"
    role: 'AUTHOR',
    emailVerifiedAt: new Date(),
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Create a fake journal object.
 */
export function createTestJournal(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    name: 'Test Journal',
    description: 'A test journal',
    issn: '1234-5678',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Create a fake article object.
 */
export function createTestArticle(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    title: 'Test Article Title',
    userId: 1,
    journalId: 1,
    abstract: 'This is a test abstract that is long enough to pass the minimum length validation requirement for testing.',
    keywords: 'testing, jest, node',
    filePath: 'test-file.pdf',
    fileSize: BigInt(2048),
    originalFilename: 'manuscript.pdf',
    status: 'SUBMITTED',
    reviewerNotes: null,
    doi: null,
    doiStatus: null,
    indexStatus: null,
    reviewedAt: null,
    publishedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Generate a valid JWT access token for a test user (like Laravel's actingAs).
 */
export function actingAs(user: TestUser): string {
  const payload: JwtPayload = {
    userId: user.id,
    role: user.role,
  };
  return signAccessToken(payload);
}

/**
 * Reset the user ID counter between test suites.
 */
export function resetFactories(): void {
  userIdCounter = 1;
}
