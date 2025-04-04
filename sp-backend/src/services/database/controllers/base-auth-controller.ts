import type { DatabaseConnection } from '../connection';

// Базовый интерфейс для пользователя (общие поля для всех методов авторизации)
export interface BaseUser {
  id: number;
  username: string;
  uuid: string;
  registrationDate: Date;
  isOnline: boolean;
  lastIp: string;
}

// Базовый интерфейс для авторизации
export interface AuthResult {
  success: boolean;
  message: string;
  token?: string;
}

// Базовый класс контроллера авторизации
export abstract class BaseAuthController {
  protected constructor(protected readonly dbConnection: DatabaseConnection) {}

  // Методы, которые должны быть реализованы в каждом контроллере
  
  // Аутентификация пользователя
  abstract authenticate(username: string, password: string, serverId: number): Promise<AuthResult>;
  
  // Проверка существования пользователя
  abstract userExists(username: string, serverId: number): Promise<boolean>;
  
  // Получение информации о пользователе
  abstract getUser(username: string, serverId: number): Promise<BaseUser | null>;
  
  // Обновление пароля пользователя
  abstract updatePassword(username: string, newPassword: string, serverId: number): Promise<boolean>;
  
  // Обновление статуса онлайн пользователя
  abstract updateOnlineStatus(username: string, isOnline: boolean, serverId: number): Promise<boolean>;
  
  // Удаление пользователя
  abstract deleteUser(username: string, serverId: number): Promise<boolean>;
} 