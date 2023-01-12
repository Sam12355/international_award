import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service';
import { RegisterInput, LoginInput, RefreshTokenInput, ForgotPasswordInput, ResetPasswordInput } from './auth.schema';

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.register(req.body as RegisterInput);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.login(req.body as LoginInput);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body as RefreshTokenInput;
    const tokens = await authService.refreshTokens(refreshToken);
    res.json(tokens);
  } catch (error) {
    next(error);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body as RefreshTokenInput;
    await authService.logout(refreshToken);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = req.body as ForgotPasswordInput;
    await authService.forgotPassword(email);
    // Always return success to prevent email enumeration
    res.json({ message: 'If an account with that email exists, a reset link has been sent.' });
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, token, password } = req.body as ResetPasswordInput;
    await authService.resetPassword(email, token, password);
    res.json({ message: 'Password has been reset successfully.' });
  } catch (error) {
    next(error);
  }
}
