import fs from 'fs';
import path from 'path';
import { DatabaseConnection } from '../database/connection';

/**
 * Класс для обновления схемы базы данных для поддержки мониторинга
 */
export class MonitoringDatabaseUpdater {
  /**
   * Проверяет и добавляет необходимые поля для мониторинга в таблицу servers
   */
  public static async updateSchema(): Promise<void> {
    const connection = DatabaseConnection.getInstance();
    
    try {
      console.log('Проверка и обновление схемы базы данных для мониторинга...');
      
      // Проверяем, есть ли колонка online_players в таблице servers
      const [result] = await connection.query(`
        SELECT COUNT(*) as count 
        FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'servers' 
        AND COLUMN_NAME = 'online_players'
      `);
      
      // Если колонка уже существует, обновление не требуется
      if (result.count > 0) {
        console.log('Схема базы данных для мониторинга уже обновлена');
        return;
      }
      
      console.log('Необходимо обновление схемы базы данных для мониторинга...');
      
      // Читаем SQL-скрипт для обновления
      const schemaPath = path.join(process.cwd(), 'src', 'services', 'database', 'schemas', 'server-monitoring.sql');
      const schemaContent = fs.readFileSync(schemaPath, 'utf8');
      
      // Выполняем SQL-скрипт для обновления схемы
      await connection.query(schemaContent);
      
      console.log('Схема базы данных успешно обновлена для поддержки мониторинга');
    } catch (error) {
      console.error('Ошибка обновления схемы базы данных для мониторинга:', error);
      throw error;
    }
  }
} 