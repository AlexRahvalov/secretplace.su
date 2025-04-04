import bcrypt from 'bcrypt';
import { DatabaseConnection } from '../connection';
import { BaseAuthController } from './base-auth-controller';
import type { BaseUser, AuthResult } from './base-auth-controller';
import type { ServerData } from '../modules/server';
import { serverModule } from '../modules/server';

export interface EasyAuthUser {
  id: number;
  username: string;
  username_lower: string;
  uuid: string;
  data: {
    password: string;
    last_ip: string;
    last_authenticated_date: string;
    login_tries: number;
    last_kicked_date: string;
    online_account: string;
    registration_date: string;
    data_version: number;
    is_online: boolean;
  };
}

export class EasyAuthController extends BaseAuthController {
  private tableName = 'easyauth';
  private currentServerId?: number;
  private serverConnection?: DatabaseConnection;

  constructor(private readonly mainDbConnection: DatabaseConnection) {
    super(mainDbConnection);
  }

  // Инициализация подключения к базе данных сервера
  private async initServerConnection(serverId: number): Promise<void> {
    // Если уже подключены к этому серверу, не создаем новое подключение
    if (this.currentServerId === serverId && this.serverConnection) {
      return;
    }

    // Получаем данные сервера
    const server = await serverModule.getServerById(serverId);
    if (!server) {
      throw new Error('Сервер не найден');
    }

    // Создаем новое подключение к базе данных сервера
    this.serverConnection = DatabaseConnection.createServerConnection({
      host: server.db_host,
      port: server.db_port,
      user: server.db_user,
      password: server.db_password,
      database: server.db_name
    });

    this.currentServerId = serverId;
  }

  // Аутентификация пользователя
  public async authenticate(username: string, password: string, serverId: number): Promise<AuthResult> {
    try {
      // Инициализируем подключение к базе данных сервера
      await this.initServerConnection(serverId);
      if (!this.serverConnection) {
        return {
          success: false,
          message: 'Не удалось подключиться к базе данных сервера'
        };
      }

      const user = await this.getUserByUsername(username);
      
      if (!user) {
        return {
          success: false,
          message: 'Пользователь не найден'
        };
      }

      // Проверяем пароль
      const isMatch = await bcrypt.compare(password, user.data.password);
      
      if (!isMatch) {
        // Увеличиваем счетчик неудачных попыток
        await this.incrementLoginTries(username);
        
        return {
          success: false,
          message: 'Неверный пароль'
        };
      }

      // Сбросить счетчик неудачных попыток и обновить время последней аутентификации
      await this.resetLoginTries(username);

      return {
        success: true,
        message: 'Успешная авторизация'
      };
    } catch (error) {
      console.error('Ошибка аутентификации:', error);
      throw error;
    }
  }

  // Проверка существования пользователя
  public async userExists(username: string, serverId: number): Promise<boolean> {
    try {
      await this.initServerConnection(serverId);
      if (!this.serverConnection) {
        throw new Error('Нет подключения к базе данных сервера');
      }

      const query = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE username_lower = ?`;
      const [result] = await this.serverConnection.query(query, [username.toLowerCase()]);
      
      return result.count > 0;
    } catch (error) {
      console.error('Ошибка проверки существования пользователя:', error);
      throw error;
    }
  }

  // Получение информации о пользователе
  public async getUser(username: string, serverId: number): Promise<BaseUser | null> {
    try {
      await this.initServerConnection(serverId);
      const user = await this.getUserByUsername(username);
      
      if (!user) {
        return null;
      }
      
      return this.mapToBaseUser(user);
    } catch (error) {
      console.error('Ошибка получения пользователя:', error);
      throw error;
    }
  }

  // Обновление пароля пользователя
  public async updatePassword(username: string, newPassword: string, serverId: number): Promise<boolean> {
    try {
      await this.initServerConnection(serverId);
      if (!this.serverConnection) {
        throw new Error('Нет подключения к базе данных сервера');
      }

      // Проверяем существование пользователя
      const user = await this.getUserByUsername(username);
      
      if (!user) {
        return false;
      }
      
      // Хешируем новый пароль
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      
      // Обновляем данные пользователя
      const userData = { ...user.data, password: hashedPassword };
      
      // Обновляем запись в базе
      const query = `UPDATE ${this.tableName} SET data = ? WHERE username_lower = ?`;
      await this.serverConnection.query(query, [JSON.stringify(userData), username.toLowerCase()]);
      
      return true;
    } catch (error) {
      console.error('Ошибка обновления пароля:', error);
      return false;
    }
  }

  // Обновление статуса онлайн пользователя
  public async updateOnlineStatus(username: string, isOnline: boolean, serverId: number): Promise<boolean> {
    try {
      await this.initServerConnection(serverId);
      if (!this.serverConnection) {
        throw new Error('Нет подключения к базе данных сервера');
      }

      // Проверяем существование пользователя
      const user = await this.getUserByUsername(username);
      
      if (!user) {
        return false;
      }
      
      // Обновляем данные пользователя
      const userData = { 
        ...user.data, 
        is_online: isOnline,
        online_account: isOnline ? 'TRUE' : 'FALSE'
      };
      
      // Обновляем запись в базе
      const query = `UPDATE ${this.tableName} SET data = ? WHERE username_lower = ?`;
      await this.serverConnection.query(query, [JSON.stringify(userData), username.toLowerCase()]);
      
      return true;
    } catch (error) {
      console.error('Ошибка обновления статуса онлайн:', error);
      return false;
    }
  }

  // Удаление пользователя
  public async deleteUser(username: string, serverId: number): Promise<boolean> {
    try {
      await this.initServerConnection(serverId);
      if (!this.serverConnection) {
        throw new Error('Нет подключения к базе данных сервера');
      }

      const query = `DELETE FROM ${this.tableName} WHERE username_lower = ?`;
      const result = await this.serverConnection.query(query, [username.toLowerCase()]);
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Ошибка удаления пользователя:', error);
      return false;
    }
  }

  // Вспомогательные методы
  
  // Получение пользователя по имени (внутренний метод)
  private async getUserByUsername(username: string): Promise<EasyAuthUser | null> {
    try {
      if (!this.serverConnection) {
        throw new Error('Нет подключения к базе данных сервера');
      }

      const query = `SELECT * FROM ${this.tableName} WHERE username_lower = ?`;
      const [user] = await this.serverConnection.query(query, [username.toLowerCase()]);
      
      if (!user) {
        return null;
      }

      // Проверяем, является ли data строкой JSON или уже объектом
      if (typeof user.data === 'string') {
        user.data = JSON.parse(user.data);
      }
      
      return user as EasyAuthUser;
    } catch (error) {
      console.error('Ошибка получения пользователя по имени:', error);
      throw error;
    }
  }

  // Увеличение счетчика неудачных попыток входа
  private async incrementLoginTries(username: string): Promise<void> {
    try {
      if (!this.serverConnection) {
        throw new Error('Нет подключения к базе данных сервера');
      }

      const user = await this.getUserByUsername(username);
      if (!user) return;

      const updatedData = {
        ...user.data,
        login_tries: (user.data.login_tries || 0) + 1
      };

      const query = `UPDATE ${this.tableName} SET data = ? WHERE username_lower = ?`;
      await this.serverConnection.query(query, [JSON.stringify(updatedData), username.toLowerCase()]);
    } catch (error) {
      console.error('Ошибка увеличения счетчика попыток:', error);
      throw error;
    }
  }

  // Сброс счетчика неудачных попыток входа
  private async resetLoginTries(username: string): Promise<void> {
    try {
      if (!this.serverConnection) {
        throw new Error('Нет подключения к базе данных сервера');
      }

      const user = await this.getUserByUsername(username);
      if (!user) return;

      const now = new Date();
      const updatedData = {
        ...user.data,
        login_tries: 0,
        last_authenticated_date: now.toISOString()
      };

      const query = `UPDATE ${this.tableName} SET data = ? WHERE username_lower = ?`;
      await this.serverConnection.query(query, [JSON.stringify(updatedData), username.toLowerCase()]);
    } catch (error) {
      console.error('Ошибка сброса счетчика попыток:', error);
      throw error;
    }
  }

  // Преобразование в базовый тип пользователя
  private mapToBaseUser(user: EasyAuthUser): BaseUser {
    return {
      id: user.id,
      username: user.username,
      uuid: user.uuid,
      registrationDate: new Date(user.data.registration_date),
      isOnline: user.data.is_online,
      lastIp: user.data.last_ip
    };
  }
} 