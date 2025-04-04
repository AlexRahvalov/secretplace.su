import { Router } from 'express';
import type { AuthController } from '../controllers/auth.controller';
import type { AuthMiddleware } from '../middleware/auth.middleware';

export class AuthRoutes {
  private router: Router;

  constructor(
    private authController: AuthController,
    private authMiddleware: AuthMiddleware
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Маршрут для входа
    this.router.post('/login', this.authController.login);

    // Маршрут для выхода (требует аутентификации)
    this.router.post(
      '/logout',
      this.authMiddleware.verifyToken,
      this.authController.logout
    );

    // Маршрут для проверки токена
    this.router.get(
      '/verify',
      this.authMiddleware.verifyToken,
      this.authController.verify
    );
  }

  public getRouter(): Router {
    return this.router;
  }
} 