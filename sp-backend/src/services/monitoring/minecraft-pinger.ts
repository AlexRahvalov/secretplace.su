import * as mc from 'minecraft-server-util';
import type { ServerStatus } from './types/server-status';
import { MonitoringErrorHandler, MonitoringErrorType } from './error-handler/monitoring-error-handler';

/**
 * Класс для пинга Minecraft серверов
 */
export class MinecraftPinger {
  /**
   * Пингует Minecraft сервер и возвращает его статус
   * @param ip IP-адрес сервера
   * @param port Порт сервера
   * @param serverInfo Дополнительная информация о сервере для логирования
   * @returns Статус сервера
   */
  public static async pingServer(
    ip: string, 
    port: number, 
    serverInfo?: { id?: number; name?: string }
  ): Promise<ServerStatus> {
    try {
      console.log(`Выполняю пинг сервера ${ip}:${port}...`);
      
      // Засекаем время начала пинга для расчета задержки
      const startTime = Date.now();
      
      // Используем minecraft-server-util для получения информации о сервере
      const result = await mc.status(ip, port, { timeout: 5000 });
      
      // Рассчитываем задержку
      const latency = Date.now() - startTime;
      
      console.log(`Сервер ${ip}:${port} онлайн. Игроков: ${result.players.online}/${result.players.max}`);
      
      return {
        online: true,
        onlinePlayers: result.players.online,
        maxPlayers: result.players.max,
        version: result.version.name,
        motd: result.motd.clean,
        latency
      };
    } catch (error) {
      // Обрабатываем ошибку с помощью нашего обработчика
      const monitoringError = MonitoringErrorHandler.handleError(error, {
        id: serverInfo?.id,
        name: serverInfo?.name,
        ip,
        port
      });
      
      // Выводим рекомендации по устранению проблемы
      const tips = MonitoringErrorHandler.getTroubleshootingTips(monitoringError);
      console.log(`[Мониторинг] Рекомендации: ${tips}`);
      
      // Возвращаем структуру ServerStatus с offline статусом
      return {
        online: false,
        onlinePlayers: 0,
        maxPlayers: 0
      };
    }
  }
} 