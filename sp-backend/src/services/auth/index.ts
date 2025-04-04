import { Router } from 'express';
import type { DatabaseConnection } from '../database/connection';
import { AuthService } from './auth-service';
import { AuthController } from './controllers/auth.controller';
import { AuthMiddleware } from './middleware/auth.middleware';
import { AuthRoutes } from './routes/auth.routes';
import { AuthErrorHandler } from './error-handler/auth.error-handler';
import type { Config } from '../../config/types';
import { EasyAuthController } from '../database/controllers/easy-auth-controller';

export class AuthModule {
  private router: Router;
  private authService: AuthService;
  private authController: AuthController;
  private authMiddleware: AuthMiddleware;
  private authRoutes: AuthRoutes;

  constructor(
    dbConnection: DatabaseConnection,
    config: Config
  ) {
    // Создаем контроллер аутентификации
    const easyAuthController = new EasyAuthController(dbConnection);

    // Инициализация сервисов
    this.authService = new AuthService(easyAuthController, config);
    this.authController = new AuthController(this.authService);
    this.authMiddleware = new AuthMiddleware(this.authService);
    this.authRoutes = new AuthRoutes(this.authController, this.authMiddleware);

    // Создание роутера
    this.router = Router();
    this.initializeModule();
  }

  private initializeModule(): void {
    // Подключение маршрутов
    this.router.use('/auth', this.authRoutes.getRouter());

    // Подключение обработчика ошибок
    this.router.use(AuthErrorHandler.handleError);
  }

  public getRouter(): Router {
    return this.router;
  }
} 