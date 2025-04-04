// Перечисление с типами ошибок базы данных
export enum DatabaseErrorType {
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  CONNECTION_TIMEOUT = 'CONNECTION_TIMEOUT',
  ACCESS_DENIED = 'ACCESS_DENIED',
  QUERY_ERROR = 'QUERY_ERROR',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  FK_CONSTRAINT = 'FK_CONSTRAINT',
  NOT_FOUND = 'NOT_FOUND',
  UNKNOWN = 'UNKNOWN'
}

// Интерфейс для ошибки базы данных
export interface DatabaseError {
  type: DatabaseErrorType;
  code?: string | number;
  message: string;
  originalError?: Error;
  details?: string;
  sqlState?: string;
  sql?: string;
}

// Класс для обработки ошибок базы данных
export class DatabaseErrorHandler {
  // Обработка ошибок MariaDB/MySQL
  public static handleMariaDbError(error: any): DatabaseError {
    // Если ошибка уже обработана, возвращаем как есть
    if (error.type && Object.values(DatabaseErrorType).includes(error.type)) {
      return error as DatabaseError;
    }

    // Получаем детали об ошибке
    const errorCode = error.code || error.errno;
    const sqlMessage = error.sqlMessage || error.message;
    const sqlState = error.sqlState;
    const sql = error.sql;
    
    // Форматируем полное сообщение
    let details = '';
    if (error.stack) {
      const stackLines = error.stack.split('\n');
      // Берем только первые несколько строк стека для компактности
      details = stackLines.slice(0, 3).join('\n');
    }

    // Обработка ошибок таймаута подключения
    if (errorCode === 'ER_GET_CONNECTION_TIMEOUT' || 
        (sqlMessage && sqlMessage.includes('pool timeout'))) {
      return {
        type: DatabaseErrorType.CONNECTION_TIMEOUT,
        code: errorCode,
        message: this.formatErrorMessage(sqlMessage),
        details,
        sqlState,
        sql,
        originalError: error
      };
    }
    
    // Обработка ошибок доступа
    if (errorCode === 'ER_ACCESS_DENIED_ERROR' || errorCode === 1045) {
      return {
        type: DatabaseErrorType.ACCESS_DENIED,
        code: errorCode,
        message: this.formatErrorMessage(sqlMessage),
        details,
        sqlState,
        sql,
        originalError: error
      };
    }

    // Обработка ошибок подключения
    if (
      errorCode === 'ECONNREFUSED' ||
      errorCode === 'ETIMEDOUT' ||
      errorCode === 'EPIPE' ||
      errorCode === 'PROTOCOL_CONNECTION_LOST' ||
      errorCode === 1040 || // Too many connections
      errorCode === 1042 || // Unable to connect
      errorCode === 1043 || // Bad handshake
      errorCode === 1129    // Host blocked
    ) {
      return {
        type: DatabaseErrorType.CONNECTION_ERROR,
        code: errorCode,
        message: this.formatErrorMessage(sqlMessage),
        details,
        sqlState,
        sql,
        originalError: error
      };
    }
    
    // Обработка ошибок дублирования
    if (errorCode === 1062) { // Duplicate entry
      return {
        type: DatabaseErrorType.DUPLICATE_ENTRY,
        code: errorCode,
        message: this.formatErrorMessage(sqlMessage),
        details,
        sqlState,
        sql,
        originalError: error
      };
    }
    
    // Нарушение ограничения внешнего ключа
    if (errorCode === 1216 || errorCode === 1217 || errorCode === 1451 || errorCode === 1452) {
      return {
        type: DatabaseErrorType.FK_CONSTRAINT,
        code: errorCode,
        message: this.formatErrorMessage(sqlMessage),
        details,
        sqlState,
        sql,
        originalError: error
      };
    }
    
    // Общие ошибки запросов
    if (
      errorCode === 1064 || // Syntax error
      errorCode === 1146 || // Table doesn't exist
      errorCode === 1054    // Unknown column
    ) {
      return {
        type: DatabaseErrorType.QUERY_ERROR,
        code: errorCode,
        message: this.formatErrorMessage(sqlMessage),
        details,
        sqlState,
        sql,
        originalError: error
      };
    }
    
    // Если не удалось определить тип ошибки, возвращаем UNKNOWN
    return {
      type: DatabaseErrorType.UNKNOWN,
      code: errorCode,
      message: this.formatErrorMessage(sqlMessage || 'Неизвестная ошибка базы данных'),
      details,
      sqlState,
      sql,
      originalError: error
    };
  }
  
  // Очистка и форматирование сообщения об ошибке
  private static formatErrorMessage(message: string): string {
    if (!message) return 'Неизвестная ошибка базы данных';
    
    // Удаляем специальные escape-последовательности и лишние пробелы
    let cleanMessage = message
      .replace(/\\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Если сообщение слишком длинное, обрезаем его
    if (cleanMessage.length > 200) {
      cleanMessage = cleanMessage.substring(0, 197) + '...';
    }
    
    // Извлекаем основную информацию из сообщения MariaDB
    if (cleanMessage.includes('(conn:')) {
      const match = cleanMessage.match(/\(conn:.*?\)\s*(.*?)(\s*\(pool connections:.*)?$/);
      if (match && match[1]) {
        cleanMessage = match[1].trim();
      }
    }
    
    return cleanMessage;
  }
  
  // Логирование ошибки и возврат сообщения для пользователя
  public static logAndGetUserMessage(error: DatabaseError): string {
    // Логирование ошибки с полными деталями
    console.error(`[Database Error] ${error.type} (${error.code}): ${error.message}`);
    
    if (error.details) {
      console.error(`[Error Details] ${error.details}`);
    }
    
    if (error.sql) {
      console.error(`[SQL Query] ${error.sql}`);
    }
    
    // Возвращаем сообщение для пользователя в зависимости от типа ошибки
    switch (error.type) {
      case DatabaseErrorType.CONNECTION_ERROR:
        return 'Не удалось подключиться к базе данных. Пожалуйста, проверьте, что сервер базы данных запущен и доступен.';
      
      case DatabaseErrorType.CONNECTION_TIMEOUT:
        return 'Превышено время ожидания подключения к базе данных. Пожалуйста, проверьте доступность сервера базы данных.';
      
      case DatabaseErrorType.ACCESS_DENIED:
        return 'Отказано в доступе к базе данных. Проверьте правильность учетных данных для подключения.';
      
      case DatabaseErrorType.DUPLICATE_ENTRY:
        return 'Запись с такими данными уже существует.';
      
      case DatabaseErrorType.FK_CONSTRAINT:
        return 'Невозможно выполнить операцию из-за связей с другими данными.';
      
      case DatabaseErrorType.NOT_FOUND:
        return 'Запрашиваемые данные не найдены.';
      
      case DatabaseErrorType.QUERY_ERROR:
        return 'Произошла ошибка при выполнении запроса.';
      
      default:
        return 'Произошла неизвестная ошибка базы данных. Пожалуйста, попробуйте позже или обратитесь к администратору.';
    }
  }

  // Предоставляет рекомендации по решению проблемы
  public static getSolutionMessage(error: DatabaseError): string {
    switch (error.type) {
      case DatabaseErrorType.CONNECTION_ERROR:
        return 'Убедитесь, что сервер MariaDB/MySQL запущен и правильно настроен. ' +
               'Проверьте параметры подключения (host, port) в файле .env.';
      
      case DatabaseErrorType.CONNECTION_TIMEOUT:
        return 'Проверьте, что сервер базы данных не перегружен и доступен по сети. ' +
               'Возможно, требуется увеличить таймауты подключения или проверить сетевые настройки.';
      
      case DatabaseErrorType.ACCESS_DENIED:
        return 'Проверьте параметры DB_USER и DB_PASSWORD в файле .env. ' +
               'Убедитесь, что пользователь существует и имеет необходимые права доступа к базе данных.';
      
      case DatabaseErrorType.DUPLICATE_ENTRY:
        return 'Попробуйте использовать уникальные значения для полей с ограничением уникальности.';
      
      case DatabaseErrorType.FK_CONSTRAINT:
        return 'Проверьте связанные записи в других таблицах перед выполнением операции.';
      
      case DatabaseErrorType.NOT_FOUND:
        return 'Убедитесь, что запрашиваемая запись существует в базе данных.';
      
      case DatabaseErrorType.QUERY_ERROR:
        return 'Проверьте синтаксис SQL-запроса и убедитесь, что таблицы и поля существуют.';
      
      default:
        return 'Проверьте логи сервера для получения дополнительной информации об ошибке.';
    }
  }
} 