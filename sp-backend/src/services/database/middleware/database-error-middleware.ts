import type { Request, Response, NextFunction } from 'express';
import { DatabaseErrorHandler, DatabaseErrorType } from '../error-handlers/database-error-handler';

/**
 * Middleware для обработки ошибок базы данных
 * Преобразует ошибки базы данных в структурированные HTTP-ответы с правильными статус-кодами
 */
export function databaseErrorMiddleware(err: any, req: Request, res: Response, next: NextFunction) {
  // Если это не ошибка базы данных или у нее нет свойства code, передаем дальше
  if (!err || (!err.code && !err.errno && !err.sqlMessage)) {
    return next(err);
  }
  
  // Обрабатываем ошибку базы данных
  const dbError = DatabaseErrorHandler.handleMariaDbError(err);
  const userMessage = DatabaseErrorHandler.logAndGetUserMessage(dbError);
  
  // Определяем HTTP-статус в зависимости от типа ошибки
  let statusCode = 500;
  
  switch (dbError.type) {
    case DatabaseErrorType.NOT_FOUND:
      statusCode = 404; // Not Found
      break;
      
    case DatabaseErrorType.DUPLICATE_ENTRY:
      statusCode = 409; // Conflict
      break;
      
    case DatabaseErrorType.CONNECTION_ERROR:
    case DatabaseErrorType.CONNECTION_TIMEOUT:
    case DatabaseErrorType.ACCESS_DENIED:
      statusCode = 503; // Service Unavailable
      break;
      
    case DatabaseErrorType.QUERY_ERROR:
      statusCode = 400; // Bad Request
      break;
      
    case DatabaseErrorType.FK_CONSTRAINT:
      statusCode = 409; // Conflict
      break;
      
    default:
      statusCode = 500; // Internal Server Error
  }
  
  // Формируем полное сообщение для разработчика
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[API Error] ${req.method} ${req.path} - ${dbError.type} (${dbError.code}): ${dbError.message}`);
  }
  
  // Отправляем ответ клиенту
  res.status(statusCode).json({
    status: 'error',
    message: userMessage,
    code: dbError.code,
    type: dbError.type,
    // В продакшн-режиме скрываем технические детали
    ...(process.env.NODE_ENV !== 'production' && {
      devInfo: {
        sqlState: dbError.sqlState,
        sql: dbError.sql
      }
    })
  });
}

/**
 * Обертка для обработки ошибок в асинхронных обработчиках маршрутов
 * @param fn Асинхронная функция-обработчик маршрута
 */
export function catchDatabaseErrors(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
} 