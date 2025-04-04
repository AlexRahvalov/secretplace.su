import type { Request, Response, NextFunction } from 'express';

export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export class AuthErrorHandler {
  public static handleError(
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    console.error('Auth Error:', error);

    if (error instanceof AuthError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
        code: error.code
      });
      return;
    }

    // Обработка JWT ошибок
    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({
        success: false,
        message: 'Недействительный токен',
        code: 'INVALID_TOKEN'
      });
      return;
    }

    if (error.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        message: 'Срок действия токена истек',
        code: 'TOKEN_EXPIRED'
      });
      return;
    }

    // Обработка остальных ошибок
    res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
} 