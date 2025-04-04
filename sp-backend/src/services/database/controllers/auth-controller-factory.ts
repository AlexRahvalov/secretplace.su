import type { DatabaseConnection } from '../connection';
import { BaseAuthController } from './base-auth-controller';
import { EasyAuthController } from './easy-auth-controller';
import { serverModule } from '../modules/server';

// Класс-фабрика для создания контроллеров авторизации в зависимости от типа сервера
export class AuthControllerFactory {
  private static instance: AuthControllerFactory;
  
  // Кэш для контроллеров, чтобы не создавать их каждый раз
  private controllers: Map<number, BaseAuthController> = new Map();

  private constructor() {}

  // Singleton паттерн
  public static getInstance(): AuthControllerFactory {
    if (!AuthControllerFactory.instance) {
      AuthControllerFactory.instance = new AuthControllerFactory();
    }
    return AuthControllerFactory.instance;
  }

  // Получение контроллера авторизации для конкретного сервера
  public async getAuthController(serverId: number): Promise<BaseAuthController> {
    // Проверяем кэш
    if (this.controllers.has(serverId)) {
      return this.controllers.get(serverId)!;
    }

    // Получаем информацию о сервере
    const server = await serverModule.getServerById(serverId);
    if (!server) {
      throw new Error(`Сервер с ID ${serverId} не найден`);
    }

    // Получаем подключение к БД сервера
    const connection = await serverModule.getServerConnection(serverId);

    // Создаем контроллер в зависимости от типа авторизации сервера
    let controller: BaseAuthController;

    switch(server.authType.toLowerCase()) {
      case 'easyauth':
        controller = new EasyAuthController(connection);
        break;
      // Здесь могут быть другие типы контроллеров авторизации
      // case 'authme':
      //   controller = new AuthmeController(connection);
      //   break;
      default:
        throw new Error(`Неподдерживаемый тип авторизации: ${server.authType}`);
    }

    // Сохраняем в кэш
    this.controllers.set(serverId, controller);

    return controller;
  }

  // Очистить кэш контроллера для сервера (например, при изменении подключения)
  public clearController(serverId: number): void {
    this.controllers.delete(serverId);
  }

  // Очистить весь кэш контроллеров
  public clearAllControllers(): void {
    this.controllers.clear();
  }
}

// Экспортируем экземпляр фабрики
export const authControllerFactory = AuthControllerFactory.getInstance(); 