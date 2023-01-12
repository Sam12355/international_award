import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../../config/database';
import { config } from '../../config';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import { ApiError } from '../../utils/ApiError';
import logger from '../../utils/logger';
import type { RegisterInput, LoginInput } from './auth.schema';

const BCRYPT_ROUNDS = 12;
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthResult {
  user: { id: number; name: string; email: string; role: string };
  tokens: AuthTokens;
}

export async function register(input: RegisterInput): Promise<AuthResult> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw ApiError.conflict('A user with this email already exists');
  }

  const hashedPassword = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      password: hashedPassword,
      role: 'AUTHOR',
    },
    select: { id: true, name: true, email: true, role: true },
  });

  const tokens = await generateTokens(user.id, user.role);

  logger.info('User registered', { userId: user.id, email: user.email });

  return { user, tokens };
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true, name: true, email: true, role: true, password: true },
  });

  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const isValidPassword = await bcrypt.compare(input.password, user.password);
  if (!isValidPassword) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const tokens = await generateTokens(user.id, user.role);

  logger.info('User logged in', { userId: user.id });

  const { password: _, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, tokens };
}

export async function refreshTokens(refreshToken: string): Promise<AuthTokens> {
  // Verify the token signature
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized('Invalid refresh token');
  }

  // Check if token exists in DB (not revoked)
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
  });

  if (!storedToken || storedToken.expiresAt < new Date()) {
    // If token was used before but doesn't exist, it might be a reuse attack — revoke all
    if (!storedToken) {
      await prisma.refreshToken.deleteMany({ where: { userId: payload.userId } });
      logger.warn('Possible refresh token reuse detected', { userId: payload.userId });
    }
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  // Delete the old refresh token (rotation)
  await prisma.refreshToken.delete({ where: { id: storedToken.id } });

  // Get current user role (may have changed)
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, role: true },
  });

  if (!user) {
    throw ApiError.unauthorized('User not found');
  }

  return generateTokens(user.id, user.role);
}

export async function logout(refreshToken: string): Promise<void> {
  await prisma.refreshToken.deleteMany({
    where: { token: refreshToken },
  });
}

export async function forgotPassword(email: string): Promise<void> {
  // Always return success to prevent email enumeration
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return;

  // In a real app, generate a token, store it, and send a reset email
  const resetToken = crypto.randomBytes(32).toString('hex');
  logger.info('Password reset requested', {
    userId: user.id,
    resetToken, // In production, send this via email, don't log it
  });

  // TODO: Send email with reset link containing the token
}

export async function resetPassword(
  _email: string,
  _token: string,
  newPassword: string,
): Promise<void> {
  // In a real app, verify the token from DB
  // For now, this is a placeholder showing the pattern
  const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

  // TODO: Look up user by reset token, verify expiry, update password
  logger.info('Password reset completed', { hashedPassword: '***' });
  void hashedPassword; // Prevent unused variable warning
}

// ─── Helpers ────────────────────────────────────────────

async function generateTokens(userId: number, role: string): Promise<AuthTokens> {
  const jwtPayload = { userId, role: role as 'AUTHOR' | 'REVIEWER' | 'ADMIN' };

  const accessToken = signAccessToken(jwtPayload);
  const refreshToken = signRefreshToken(jwtPayload);

  // Store refresh token in DB
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId,
      expiresAt,
    },
  });

  return { accessToken, refreshToken };
}
