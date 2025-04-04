import { ServerMonitor } from './server-monitor';
import { MonitoringDatabaseUpdater } from './database-updater';
import serverStatusRoutes from './routes/server-status-routes';
import { MonitoringErrorHandler, MonitoringErrorType } from './error-handler/monitoring-error-handler';

/**
 * Инициализирует мониторинг серверов
 */
export async function initializeMonitoring(): Promise<void> {
  try {
    // Обновляем схему базы данных
    await MonitoringDatabaseUpdater.updateSchema();
    
    // Запускаем мониторинг серверов
    const monitor = ServerMonitor.getInstance();
    await monitor.startMonitoring();
    
    console.log('Мониторинг серверов успешно инициализирован');
  } catch (error) {
    console.error('Ошибка инициализации мониторинга серверов:', error);
    throw error;
  }
}

/**
 * Останавливает мониторинг серверов
 */
export function stopMonitoring(): void {
  const monitor = ServerMonitor.getInstance();
  monitor.stopMonitoring();
}

// Экспортируем обработчик ошибок и типы
export { MonitoringErrorHandler, MonitoringErrorType };

// Экспортируем маршруты для использования в Express
export { serverStatusRoutes }; 