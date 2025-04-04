import jwt from 'jsonwebtoken';
import type { BaseAuthController, AuthResult } from '../database/controllers/base-auth-controller';
import type { Config } from '../../config/types';

export interface LoginDto {
  username: string;
  password: string;
  serverId: number;
}

export class AuthService {
  private readonly jwtSecret: string;

  constructor(
    private readonly authController: BaseAuthController,
    private readonly config: Config
  ) {
    this.jwtSecret = config.jwt.secret;
  }

  public async login(data: LoginDto): Promise<AuthResult> {
    try {
      const authResult = await this.authController.authenticate(
        data.username,
        data.password,
        data.serverId
      );

      if (!authResult.success) {
        return authResult;
      }

      // Создаем JWT токен
      const token = jwt.sign(
        {
          username: data.username,
          serverId: data.serverId
        },
        this.jwtSecret,
        { expiresIn: '24h' }
      );

      return {
        ...authResult,
        token
      };
    } catch (error) {
      console.error('Ошибка при авторизации:', error);
      return {
        success: false,
        message: 'Ошибка сервера при аутентификации'
      };
    }
  }

  public async logout(username: string, serverId: number): Promise<AuthResult> {
    try {
      const success = await this.authController.updateOnlineStatus(username, false, serverId);
      
      return {
        success,
        message: success ? 'Успешный выход' : 'Ошибка при выходе'
      };
    } catch (error) {
      console.error('Ошибка при выходе:', error);
      return {
        success: false,
        message: 'Ошибка сервера при выходе'
      };
    }
  }

  public async verify(token: string): Promise<AuthResult> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as { username: string; serverId: number };
      
      return {
        success: true,
        message: 'Токен действителен'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Недействительный токен'
      };
    }
  }

  public async updateOnlineStatus(username: string, isOnline: boolean, serverId: number): Promise<boolean> {
    return this.authController.updateOnlineStatus(username, isOnline, serverId);
  }
} 