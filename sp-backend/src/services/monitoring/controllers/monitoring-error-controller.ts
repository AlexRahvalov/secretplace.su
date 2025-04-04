import type { Request, Response } from 'express';
import { catchDatabaseErrors } from '../../database/middleware/database-error-middleware';
import { MonitoringErrorHandler, MonitoringErrorType } from '../error-handler/monitoring-error-handler';
import { DatabaseConnection } from '../../database/connection';

/**
 * Получение последних ошибок мониторинга для всех серверов
 */
export const getMonitoringErrors = catchDatabaseErrors(async (req: Request, res: Response) => {
  // Здесь можно было бы добавить хранение ошибок в базе данных или реализовать in-memory хранилище
  
  // Пока просто получаем серверы со статусом offline
  const connection = DatabaseConnection.getInstance();
  
  const servers = await connection.query(`
    SELECT 
      id, name, ip, port, status, 
      TIMESTAMPDIFF(SECOND, last_online, NOW()) as seconds_offline,
      TIMESTAMPDIFF(SECOND, last_ping, NOW()) as seconds_since_last_ping
    FROM servers
    WHERE status = 'offline'
    ORDER BY last_ping DESC
  `);
  
  // Формируем список серверов с ошибками и добавляем рекомендации
  const serversWithErrors = servers.map((server: any) => {
    // Определяем тип ошибки на основе времени с последнего успешного пинга
    let errorType = MonitoringErrorType.UNKNOWN_ERROR;
    
    if (server.seconds_offline === null) {
      errorType = MonitoringErrorType.SERVER_OFFLINE;
    } else if (server.seconds_offline > 86400) { // Больше суток
      errorType = MonitoringErrorType.SERVER_OFFLINE;
    } else {
      errorType = MonitoringErrorType.CONNECTION_REFUSED;
    }
    
    // Создаем ошибку для получения рекомендаций
    const error = {
      type: errorType,
      message: `Сервер ${server.name} не в сети`,
      serverId: server.id,
      serverName: server.name,
      serverIp: server.ip,
      serverPort: server.port,
      timestamp: new Date()
    };
    
    // Получаем рекомендации
    const troubleshootingTips = MonitoringErrorHandler.getTroubleshootingTips(error);
    
    return {
      id: server.id,
      name: server.name,
      ip: server.ip,
      port: server.port,
      status: server.status,
      errorType,
      secondsOffline: server.seconds_offline,
      lastPing: server.last_ping,
      troubleshootingTips
    };
  });
  
  return res.json({
    status: 'success',
    data: serversWithErrors
  });
}); 