import { mainDatabaseConnection, DatabaseConnection } from '../connection';
import type { DatabaseConfig } from '../connection';

export interface ServerData {
  id: number;
  name: string;
  host: string;
  port: number;
  status: string;
  auth_type: string;
  db_host: string;
  db_port: number;
  db_user: string;
  db_password: string;
  db_name: string;
  created_at: Date;
  updated_at: Date;
  online_players: number;
  max_players: number;
}

// Класс для работы с серверами
export class ServerModule {
  private static instance: ServerModule;
  private serverConnections: Map<number, DatabaseConnection> = new Map();

  private constructor(private dbConnection: DatabaseConnection) {}

  // Singleton паттерн
  public static getInstance(): ServerModule {
    if (!ServerModule.instance) {
      ServerModule.instance = new ServerModule(mainDatabaseConnection);
    }
    return ServerModule.instance;
  }

  // Получить все серверы
  public async getAllServers(): Promise<ServerData[]> {
    const query = 'SELECT * FROM servers';
    return this.dbConnection.query(query);
  }

  // Получить сервер по ID
  public async getServerById(id: number): Promise<ServerData | null> {
    const query = 'SELECT * FROM servers WHERE id = ?';
    const [server] = await this.dbConnection.query(query, [id]);
    return server || null;
  }

  // Получить подключение к базе данных сервера
  public async getServerConnection(serverId: number): Promise<DatabaseConnection> {
    // Проверяем, есть ли уже соединение в кэше
    if (this.serverConnections.has(serverId)) {
      return this.serverConnections.get(serverId)!;
    }

    // Получаем информацию о сервере
    const server = await this.getServerById(serverId);
    if (!server) {
      throw new Error(`Server with id ${serverId} not found`);
    }

    // Создаем новое подключение
    const connection = DatabaseConnection.createServerConnection({
      host: server.db_host,
      port: server.db_port,
      user: server.db_user,
      password: server.db_password,
      database: server.db_name
    });
    
    // Сохраняем в кэш
    this.serverConnections.set(serverId, connection);
    
    return connection;
  }

  // Обновить статус сервера
  public async updateServerStatus(id: number, status: 'online' | 'offline' | 'maintenance'): Promise<void> {
    try {
      const query = 'UPDATE servers SET status = ? WHERE id = ?';
      await mainDatabaseConnection.query(query, [status, id]);
    } catch (error) {
      console.error(`Error updating status for server ${id}:`, error);
      throw error;
    }
  }
}

// Экспортируем экземпляр для использования
export const serverModule = ServerModule.getInstance(); 