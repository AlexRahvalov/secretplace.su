/**
 * Типы ошибок мониторинга серверов
 */
export enum MonitoringErrorType {
  CONNECTION_REFUSED = 'CONNECTION_REFUSED',
  CONNECTION_TIMEOUT = 'CONNECTION_TIMEOUT',
  CONNECTION_RESET = 'CONNECTION_RESET',
  UNKNOWN_HOST = 'UNKNOWN_HOST',
  INVALID_RESPONSE = 'INVALID_RESPONSE',
  SERVER_OFFLINE = 'SERVER_OFFLINE',
  DATABASE_ERROR = 'DATABASE_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Интерфейс ошибки мониторинга
 */
export interface MonitoringError {
  type: MonitoringErrorType;
  code?: string;
  message: string;
  serverId?: number;
  serverName?: string;
  serverIp?: string;
  serverPort?: number;
  originalError?: Error;
  timestamp: Date;
}

/**
 * Класс для обработки ошибок мониторинга серверов
 */
export class MonitoringErrorHandler {
  /**
   * Обрабатывает ошибку мониторинга и возвращает структурированный объект ошибки
   * @param error Исходная ошибка
   * @param serverInfo Информация о сервере (опционально)
   * @returns Структурированная ошибка мониторинга
   */
  public static handleError(error: any, serverInfo?: { id?: number; name?: string; ip?: string; port?: number }): MonitoringError {
    // Если ошибка уже обработана, возвращаем ее
    if (error.type && Object.values(MonitoringErrorType).includes(error.type)) {
      return error as MonitoringError;
    }

    // Определяем тип ошибки
    let errorType = MonitoringErrorType.UNKNOWN_ERROR;
    let errorMessage = 'Неизвестная ошибка мониторинга';

    // Анализируем ошибку
    if (error.code) {
      switch (error.code) {
        case 'ECONNREFUSED':
          errorType = MonitoringErrorType.CONNECTION_REFUSED;
          errorMessage = `Подключение отклонено сервером ${serverInfo?.ip}:${serverInfo?.port}`;
          break;
        case 'ECONNRESET':
          errorType = MonitoringErrorType.CONNECTION_RESET;
          errorMessage = `Соединение сброшено сервером ${serverInfo?.ip}:${serverInfo?.port}`;
          break;
        case 'ETIMEDOUT':
          errorType = MonitoringErrorType.CONNECTION_TIMEOUT;
          errorMessage = `Превышено время ожидания подключения к серверу ${serverInfo?.ip}:${serverInfo?.port}`;
          break;
        case 'ENOTFOUND':
          errorType = MonitoringErrorType.UNKNOWN_HOST;
          errorMessage = `Не удалось найти хост ${serverInfo?.ip}`;
          break;
      }
    } else if (error.message) {
      if (error.message.includes('timeout')) {
        errorType = MonitoringErrorType.CONNECTION_TIMEOUT;
        errorMessage = `Превышено время ожидания ответа от сервера ${serverInfo?.ip}:${serverInfo?.port}`;
      } else if (error.message.includes('Invalid server response')) {
        errorType = MonitoringErrorType.INVALID_RESPONSE;
        errorMessage = `Некорректный ответ от сервера ${serverInfo?.ip}:${serverInfo?.port}`;
      } else if (error.message.includes('Failed to connect')) {
        errorType = MonitoringErrorType.CONNECTION_REFUSED;
        errorMessage = `Не удалось подключиться к серверу ${serverInfo?.ip}:${serverInfo?.port}`;
      }
    }

    // Если это ошибка базы данных
    if (error.sql || error.sqlMessage) {
      errorType = MonitoringErrorType.DATABASE_ERROR;
      errorMessage = `Ошибка базы данных при мониторинге сервера ${serverInfo?.name || 'неизвестно'}`;
    }

    // Создаем структурированную ошибку
    const monitoringError: MonitoringError = {
      type: errorType,
      code: error.code || undefined,
      message: errorMessage,
      serverId: serverInfo?.id,
      serverName: serverInfo?.name,
      serverIp: serverInfo?.ip,
      serverPort: serverInfo?.port,
      originalError: error instanceof Error ? error : new Error(String(error)),
      timestamp: new Date()
    };

    // Логируем ошибку
    this.logError(monitoringError);

    return monitoringError;
  }

  /**
   * Логирует ошибку мониторинга
   * @param error Ошибка мониторинга
   */
  private static logError(error: MonitoringError): void {
    const serverInfo = error.serverName 
      ? `${error.serverName} (${error.serverIp}:${error.serverPort})` 
      : `${error.serverIp}:${error.serverPort}`;
    
    console.error(`[Мониторинг] ${error.timestamp.toISOString()} - ${error.type}: ${error.message}`);
    console.error(`[Мониторинг] Сервер: ${serverInfo}`);
    
    if (error.originalError && error.originalError.stack) {
      console.error(`[Мониторинг] Стек: ${error.originalError.stack.split('\n')[0]}`);
    }
  }

  /**
   * Получает рекомендации по устранению ошибки
   * @param error Ошибка мониторинга
   * @returns Рекомендации по устранению ошибки
   */
  public static getTroubleshootingTips(error: MonitoringError): string {
    switch (error.type) {
      case MonitoringErrorType.CONNECTION_REFUSED:
        return 'Проверьте, что сервер запущен и порт открыт. Возможно, брандмауэр блокирует подключение.';
      
      case MonitoringErrorType.CONNECTION_TIMEOUT:
        return 'Проверьте сетевое подключение. Возможно, сервер перегружен или сеть нестабильна.';
      
      case MonitoringErrorType.CONNECTION_RESET:
        return 'Сервер прервал соединение. Возможно, произошла ошибка на стороне сервера или у него проблемы с сетью.';
      
      case MonitoringErrorType.UNKNOWN_HOST:
        return 'Не удалось определить IP-адрес по указанному хосту. Проверьте правильность указанного адреса сервера.';
      
      case MonitoringErrorType.INVALID_RESPONSE:
        return 'Сервер отправил некорректный ответ. Возможно, версия протокола не поддерживается или это не Minecraft сервер.';
      
      case MonitoringErrorType.SERVER_OFFLINE:
        return 'Сервер не в сети. Это нормальное состояние, если сервер был выключен или перезагружается.';
      
      case MonitoringErrorType.DATABASE_ERROR:
        return 'Произошла ошибка при работе с базой данных. Проверьте подключение к БД и корректность запросов.';
      
      default:
        return 'Неизвестная ошибка. Проверьте логи сервера для более подробной информации.';
    }
  }
} 