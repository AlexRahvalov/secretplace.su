import { Router } from 'express';
import { getServersStatus, getServerStatus } from '../controllers/server-status-controller';
import { getMonitoringErrors } from '../controllers/monitoring-error-controller';

const router = Router();

/**
 * @route GET /api/servers/status
 * @desc Получить статус всех серверов
 * @access Public
 */
router.get('/status', getServersStatus);

/**
 * @route GET /api/servers/:id/status
 * @desc Получить статус конкретного сервера
 * @access Public
 */
router.get('/:id/status', getServerStatus);

/**
 * @route GET /api/servers/errors
 * @desc Получить информацию о серверах с ошибками
 * @access Public
 */
router.get('/errors', getMonitoringErrors);

export default router; 