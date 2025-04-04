import type { Request, Response } from 'express';
import type { AuthService } from '../auth-service';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  public login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { username, password, serverId } = req.body;

      if (!username || !password || !serverId) {
        res.status(400).json({
          success: false,
          message: 'Не указаны все необходимые параметры'
        });
        return;
      }

      const result = await this.authService.login({ username, password, serverId });
      res.json(result);
    } catch (error) {
      console.error('Ошибка при авторизации:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка сервера при авторизации'
      });
    }
  };

  public logout = async (req: Request, res: Response): Promise<void> => {
    try {
      const { username } = req.user as { username: string };
      const { serverId } = req.body;

      if (!username || !serverId) {
        res.status(400).json({
          success: false,
          message: 'Не указаны все необходимые параметры'
        });
        return;
      }

      const result = await this.authService.logout(username, serverId);
      res.json(result);
    } catch (error) {
      console.error('Ошибка при выходе:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка сервера при выходе'
      });
    }
  };

  public verify = async (req: Request, res: Response): Promise<void> => {
    try {
      const token = req.headers.authorization?.split(' ')[1];

      if (!token) {
        res.status(401).json({
          success: false,
          message: 'Токен не предоставлен'
        });
        return;
      }

      const result = await this.authService.verify(token);
      res.json(result);
    } catch (error) {
      console.error('Ошибка при верификации токена:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка сервера при верификации токена'
      });
    }
  };
} 