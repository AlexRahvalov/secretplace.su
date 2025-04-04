import { createPool } from 'mariadb';
import type { Pool, PoolConnection } from 'mariadb';
import dotenv from 'dotenv';

// Загружаем переменные окружения
dotenv.config();

// Интерфейс для конфигурации подключения
export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  connectionLimit?: number;
  connectTimeout?: number;
}

// Класс для управления подключениями к базам данных
export class DatabaseConnection {
  private pool: Pool;
  private static instance: DatabaseConnection;

  private constructor(config: DatabaseConfig) {
    this.pool = createPool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      connectionLimit: config.connectionLimit || 5,
      connectTimeout: config.connectTimeout || 10000
    });
  }

  // Singleton паттерн для доступа к основной БД сайта
  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      // Используем переменные окружения для основной БД
      const config: DatabaseConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'secretplace',
        connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10')
      };

      DatabaseConnection.instance = new DatabaseConnection(config);
    }
    return DatabaseConnection.instance;
  }

  // Создаем новое подключение к БД сервера
  public static createServerConnection(config: DatabaseConfig): DatabaseConnection {
    return new DatabaseConnection(config);
  }

  // Получить подключение из пула
  public async getConnection(): Promise<PoolConnection> {
    try {
      return await this.pool.getConnection();
    } catch (error) {
      console.error('Error getting database connection:', error);
      throw error;
    }
  }

  // Выполнить запрос и автоматически освободить соединение
  public async query(sql: string, params?: any[]): Promise<any> {
    let conn: PoolConnection | undefined;
    try {
      conn = await this.pool.getConnection();
      return await conn.query(sql, params);
    } catch (error) {
      console.error('Error executing query:', error);
      throw error;
    } finally {
      if (conn) await conn.release();
    }
  }

  // Завершить работу с пулом соединений
  public async end(): Promise<void> {
    try {
      await this.pool.end();
    } catch (error) {
      console.error('Error closing connection pool:', error);
      throw error;
    }
  }
}

// Экспортируем экземпляр для главной БД
export const mainDatabaseConnection = DatabaseConnection.getInstance(); 