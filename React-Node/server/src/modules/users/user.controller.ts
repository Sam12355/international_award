import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../../config/database';
import { AuthenticatedRequest } from '../../types';
import { ApiError } from '../../utils/ApiError';
import { updateProfileSchema, updatePasswordSchema } from './user.schema';

export async function me(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerifiedAt: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    if (!user) throw ApiError.notFound('User not found');

    res.json({ data: user });
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const input = updateProfileSchema.parse(req.body);

    // Check email uniqueness if changing email
    if (input.email && input.email !== req.user!.email) {
      const existing = await prisma.user.findUnique({ where: { email: input.email } });
      if (existing) {
        throw ApiError.conflict('A user with this email already exists');
      }
    }

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        ...(input.name && { name: input.name }),
        ...(input.email && { email: input.email }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    res.json({ data: user });
  } catch (error) {
    next(error);
  }
}

export async function updatePassword(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const input = updatePasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { password: true },
    });

    if (!user) throw ApiError.notFound('User not found');

    const isValid = await bcrypt.compare(input.currentPassword, user.password);
    if (!isValid) {
      throw ApiError.unauthorized('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(input.password, 12);

    await prisma.user.update({
      where: { id: req.user!.id },
      data: { password: hashedPassword },
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
}

export async function deleteAccount(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await prisma.user.delete({ where: { id: req.user!.id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
