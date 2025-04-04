import type { Request, Response, NextFunction } from 'express';
import type { AuthService } from '../auth-service';
import jwt from 'jsonwebtoken';

export interface JWTPayload {
  username: string;
  serverId: number;
}

// Расширяем интерфейс Request для добавления пользователя
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export class AuthMiddleware {
  constructor(private authService: AuthService) {}

  // Middleware для проверки JWT токена
  public verifyToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Получаем токен из заголовка Authorization
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ 
          success: false,
          message: 'Токен не предоставлен' 
        });
      }

      const token = authHeader.split(' ')[1];
      if (!token) {
        return res.status(401).json({ 
          success: false,
          message: 'Неверный формат токена' 
        });
      }

      // Верифицируем токен
      const result = await this.authService.verify(token);
      if (!result.success) {
        return res.status(401).json(result);
      }

      // Декодируем токен для получения данных пользователя
      const decoded = jwt.decode(token) as JWTPayload;
      req.user = decoded;
      next();
    } catch (error) {
      console.error('Ошибка при проверке токена:', error);
      return res.status(500).json({ 
        success: false,
        message: 'Ошибка сервера при проверке токена' 
      });
    }
  };

  // Middleware для проверки роли пользователя
  public checkRole = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({ 
          success: false,
          message: 'Пользователь не авторизован' 
        });
      }

      // Здесь можно добавить проверку ролей, если они будут реализованы
      next();
    };
  };
} 