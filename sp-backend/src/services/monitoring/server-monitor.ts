import { DatabaseConnection } from '../database/connection';
import { MinecraftPinger } from './minecraft-pinger';
import type { ServerStatus } from './types/server-status';
import { MonitoringErrorHandler, MonitoringErrorType } from './error-handler/monitoring-error-handler';

/**
 * Класс для мониторинга статуса Minecraft серверов
 */
export class ServerMonitor {
  private static instance: ServerMonitor;
  private monitoringIntervals: Map<number, NodeJS.Timeout> = new Map();
  private connection: DatabaseConnection;
  private errorCounts: Map<number, number> = new Map(); // Счетчик ошибок для каждого сервера
  private readonly MAX_CONSECUTIVE_ERRORS = 5; // Максимальное количество последовательных ошибок
  
  private constructor() {
    this.connection = DatabaseConnection.getInstance();
  }
  
  /**
   * Получает или создает экземпляр ServerMonitor (Singleton)
   * @returns Экземпляр ServerMonitor
   */
  public static getInstance(): ServerMonitor {
    if (!ServerMonitor.instance) {
      ServerMonitor.instance = new ServerMonitor();
    }
    return ServerMonitor.instance;
  }
  
  /**
   * Запускает мониторинг всех серверов
   */
  public async startMonitoring(): Promise<void> {
    try {
      console.log('Запуск мониторинга серверов...');
      
      // Получаем список всех серверов
      const servers = await this.connection.query('SELECT id, name, ip, port, status FROM servers');
      
      if (!servers.length) {
        console.log('Серверы для мониторинга не найдены');
        return;
      }
      
      // Запускаем мониторинг для каждого сервера
      for (const server of servers) {
        this.startServerMonitoring(server);
      }
      
      console.log(`Мониторинг запущен для ${servers.length} серверов`);
    } catch (error) {
      console.error('Ошибка запуска мониторинга:', error);
    }
  }
  
  /**
   * Запускает мониторинг одного сервера
   * @param server Объект сервера
   */
  private startServerMonitoring(server: any): void {
    console.log(`Запуск мониторинга сервера ${server.name} (${server.ip}:${server.port})...`);
    
    // Немедленно проверяем статус сервера
    this.checkServerStatus(server);
    
    // Определяем начальный интервал проверки (30 или 60 секунд)
    const initialInterval = server.status === 'online' ? 30000 : 60000;
    
    // Запускаем периодическую проверку
    const intervalId = setInterval(() => this.checkServerStatus(server), initialInterval);
    
    // Сохраняем идентификатор интервала
    this.monitoringIntervals.set(server.id, intervalId);
    
    console.log(`Мониторинг сервера ${server.name} запущен с интервалом ${initialInterval / 1000} секунд`);
  }
  
  /**
   * Проверяет статус сервера и обновляет данные в БД
   * @param server Объект сервера
   */
  private async checkServerStatus(server: any): Promise<void> {
    try {
      // Получаем статус сервера с передачей дополнительной информации для логирования
      const status = await MinecraftPinger.pingServer(
        server.ip, 
        server.port,
        { id: server.id, name: server.name }
      );
      
      // Сбрасываем счетчик ошибок, если запрос успешен
      if (status.online) {
        this.errorCounts.set(server.id, 0);
      }
      
      // Обновляем данные в БД
      await this.updateServerStatus(server.id, status);
      
      // Регулируем интервал проверки в зависимости от статуса
      this.adjustCheckInterval(server.id, status.online, server);
      
    } catch (error) {
      // Используем наш обработчик ошибок
      const monitoringError = MonitoringErrorHandler.handleError(error, {
        id: server.id,
        name: server.name,
        ip: server.ip,
        port: server.port
      });
      
      // Увеличиваем счетчик ошибок
      const currentErrorCount = (this.errorCounts.get(server.id) || 0) + 1;
      this.errorCounts.set(server.id, currentErrorCount);
      
      // Если количество последовательных ошибок превышает порог, увеличиваем интервал проверки
      if (currentErrorCount >= this.MAX_CONSECUTIVE_ERRORS) {
        this.increaseCheckIntervalAfterErrors(server.id, server);
      }
      
      // Устанавливаем статус сервера как offline
      await this.updateServerStatus(server.id, {
        online: false,
        onlinePlayers: 0,
        maxPlayers: 0
      });
    }
  }
  
  /**
   * Увеличивает интервал проверки после серии ошибок
   * @param serverId ID сервера
   * @param server Объект сервера
   */
  private increaseCheckIntervalAfterErrors(serverId: number, server: any): void {
    const currentInterval = this.monitoringIntervals.get(serverId);
    if (currentInterval) {
      clearInterval(currentInterval);
      
      // Увеличиваем интервал до 5 минут после серии ошибок
      const extendedInterval = 300000; // 5 минут
      const intervalId = setInterval(() => this.checkServerStatus({...server, status: 'offline'}), extendedInterval);
      
      this.monitoringIntervals.set(serverId, intervalId);
      console.log(`[Мониторинг] Слишком много ошибок для сервера ${server.name} (${server.ip}:${server.port}). Интервал проверки увеличен до 5 минут.`);
      
      // Сбрасываем счетчик ошибок
      this.errorCounts.set(serverId, 0);
    }
  }
  
  /**
   * Обновляет информацию о статусе сервера в БД
   * @param serverId ID сервера
   * @param status Статус сервера
   */
  private async updateServerStatus(serverId: number, status: ServerStatus): Promise<void> {
    try {
      const query = `
        UPDATE servers 
        SET 
          status = ?,
          online_players = ?,
          max_players = ?,
          version = ?,
          motd = ?,
          latency = ?,
          last_ping = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      
      const params = [
        status.online ? 'online' : 'offline',
        status.onlinePlayers,
        status.maxPlayers,
        status.version || null,
        status.motd || null,
        status.latency || 0,
        serverId
      ];
      
      await this.connection.query(query, params);
      
      // Если сервер онлайн, обновляем last_online
      if (status.online) {
        await this.connection.query(
          'UPDATE servers SET last_online = CURRENT_TIMESTAMP WHERE id = ?', 
          [serverId]
        );
      }
      
      console.log(`Статус сервера ${serverId} обновлен: ${status.online ? 'онлайн' : 'оффлайн'}`);
      
    } catch (error) {
      // Используем наш обработчик ошибок для ошибок БД
      MonitoringErrorHandler.handleError(error, { id: serverId });
    }
  }
  
  /**
   * Регулирует интервал проверки в зависимости от статуса сервера
   * @param serverId ID сервера
   * @param isOnline Статус сервера (онлайн/оффлайн)
   * @param server Объект сервера
   */
  private adjustCheckInterval(serverId: number, isOnline: boolean, server: any): void {
    const currentInterval = this.monitoringIntervals.get(serverId);
    if (currentInterval) {
      // Получаем текущий статус сервера в БД
      const currentStatus = server.status;
      
      // Если статус изменился, изменяем интервал проверки
      if ((currentStatus === 'online' && !isOnline) || (currentStatus === 'offline' && isOnline)) {
        clearInterval(currentInterval);
        
        // Устанавливаем новый интервал
        const newInterval = isOnline ? 30000 : 60000; // 30 сек для онлайн, 60 сек для оффлайн
        const intervalId = setInterval(() => this.checkServerStatus({...server, status: isOnline ? 'online' : 'offline'}), newInterval);
        
        this.monitoringIntervals.set(serverId, intervalId);
        console.log(`Интервал проверки сервера ${serverId} изменен на ${newInterval / 1000} секунд`);
      }
    }
  }
  
  /**
   * Останавливает мониторинг всех серверов
   */
  public stopMonitoring(): void {
    for (const [serverId, intervalId] of this.monitoringIntervals.entries()) {
      clearInterval(intervalId);
      console.log(`Мониторинг сервера ${serverId} остановлен`);
    }
    
    this.monitoringIntervals.clear();
    console.log('Мониторинг всех серверов остановлен');
  }
} 