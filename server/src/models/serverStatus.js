const DataValidator = require('../utils/DataValidator');
const SafeQuery = require('../utils/SafeQuery');
const cacheManager = require('../utils/CacheManager');
const TABLES = require('../config/tables');

// Константы для кэширования
const CACHE_KEYS = {
  SERVER_BY_ID: (id) => `model:server:${id}`,
  SERVER_STATUS: (id) => `model:server_status:${id}`
};

const CACHE_TTL = {
  SERVER_STATUS: 30 // 30 секунд
};

/**
 * Получить сервер по ID
 * @param {number} id ID сервера
 * @returns {Promise<Object|null>} Информация о сервере или null, если сервер не найден
 */
async function getServerById(id) {
  return cacheManager.getOrSet(CACHE_KEYS.SERVER_BY_ID(id), async () => {
    try {
      const servers = await SafeQuery.select(
        TABLES.SERVERS,
        ['id', 'server_name', 'ip', 'query_port', 'description', 'created_at', 'updated_at'],
        { id }
      );
      
      return servers && servers.length > 0 ? servers[0] : null;
    } catch (error) {
      console.error('Ошибка при получении сервера по ID:', error);
      throw error;
    }
  }, CACHE_TTL.SERVER_STATUS);
}

/**
 * Получить текущий статус сервера (онлайн, игроки, TPS)
 * @param {number} serverId ID сервера
 * @returns {Promise<Object>} Информация о статусе сервера
 */
async function getServerStatus(serverId) {
  return cacheManager.getOrSet(CACHE_KEYS.SERVER_STATUS(serverId), async () => {
    try {
      // Получим информацию о сервере из кэша или БД
      const serverInfo = await getServerById(serverId);
      
      if (!serverInfo) {
        throw new Error(`Сервер с ID ${serverId} не найден`);
      }

      const serverIp = DataValidator.validateString(serverInfo.ip, 'IP сервера');
      const serverName = DataValidator.validateString(serverInfo.server_name, 'Имя сервера');
      
      // Получаем данные о состоянии сервера из БД
      const serverStatus = await SafeQuery.select(
        TABLES.SERVER_STATS, 
        [
          'id',
          'server_id',
          'online_count AS onlinePlayers',
          'max_players AS maxPlayers',
          'tps',
          'uptime',
          'version',
          'timestamp AS lastUpdated'
        ], 
        { server_id: serverId }, 
        { orderBy: { field: 'timestamp', dir: 'DESC' }, limit: 1 }
      );
      
      if (serverStatus && serverStatus.length > 0) {
        // Форматируем данные
        const status = serverStatus[0];
        
        // Проверяем свежесть данных (не старше 5 минут)
        const lastUpdated = new Date(status.lastUpdated);
        const now = new Date();
        const diffMinutes = Math.floor((now - lastUpdated) / (1000 * 60));
        const isOnline = diffMinutes < 5; // Считаем сервер онлайн, если данные не старше 5 минут
        
        // Валидация и преобразование данных
        const onlinePlayers = DataValidator.validateNumber(
          status.onlinePlayers, 'Игроков онлайн', { min: 0, integer: true, default: 0 }
        );
        
        const maxPlayers = DataValidator.validateNumber(
          status.maxPlayers, 'Макс. игроков', { min: 1, integer: true, default: 100 }
        );
        
        return {
          online: isOnline,
          onlinePlayers,
          maxPlayers,
          tps: status.tps || 20,
          uptime: status.uptime || 100,
          version: DataValidator.validateString(status.version, 'Версия', { default: '1.20.4' }),
          motd: isOnline ? `${serverName} - Майнкрафт сервер для всех!` : `${serverName} - Статус сервера неизвестен`,
          lastUpdated: status.lastUpdated || new Date().toISOString(),
          serverIp
        };
      }

      // Если данных в БД нет, возвращаем данные по умолчанию
      console.warn(`Данные о статусе сервера ${serverId} не найдены в таблице`);
      return {
        online: false,
        onlinePlayers: 0,
        maxPlayers: 100,
        tps: 20,
        uptime: 100,
        version: '1.20.4',
        motd: `${serverName} - Статус сервера неизвестен`,
        lastUpdated: new Date().toISOString(),
        serverIp
      };
    } catch (error) {
      console.error('Ошибка при получении статуса сервера из БД:', error);
      throw error;
    }
  }, CACHE_TTL.SERVER_STATUS);
}

module.exports = {
  getServerStatus
}; 