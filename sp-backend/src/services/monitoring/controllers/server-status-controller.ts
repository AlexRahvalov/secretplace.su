import type { Request, Response } from 'express';
import { DatabaseConnection } from '../../database/connection';
import { catchDatabaseErrors } from '../../database/middleware/database-error-middleware';

/**
 * Получение статуса всех серверов
 */
export const getServersStatus = catchDatabaseErrors(async (req: Request, res: Response) => {
  const connection = DatabaseConnection.getInstance();
  
  const servers = await connection.query(`
    SELECT 
      id, name, description, ip, port, status, 
      online_players, max_players, version, motd, 
      latency, last_ping, last_online
    FROM servers
    ORDER BY name ASC
  `);
  
  return res.json({
    status: 'success',
    data: servers
  });
});

/**
 * Получение статуса конкретного сервера по ID
 */
export const getServerStatus = catchDatabaseErrors(async (req: Request, res: Response) => {
  const { id } = req.params;
  const connection = DatabaseConnection.getInstance();
  
  const [server] = await connection.query(`
    SELECT 
      id, name, description, ip, port, status, 
      online_players, max_players, version, motd, 
      latency, last_ping, last_online
    FROM servers
    WHERE id = ?
  `, [id]);
  
  if (!server) {
    return res.status(404).json({
      status: 'error',
      message: 'Сервер не найден'
    });
  }
  
  return res.json({
    status: 'success',
    data: server
  });
}); 