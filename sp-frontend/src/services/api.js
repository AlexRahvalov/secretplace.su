// src/services/api.js

const API_KEY = import.meta.env.VITE_API_KEY;

// Проверяем наличие API ключа
if (!API_KEY) {
  console.error('API ключ не определен в переменных окружения!');
}

// Обратите внимание: в vite.config.js настроен прокси, который перенаправляет
// все запросы, начинающиеся с /api, на URL VITE_API_URL
// Поэтому нам здесь нужно использовать относительный путь /api вместо абсолютного URL

const headers = {
  'X-API-Key': API_KEY,
  'Content-Type': 'application/json',
};

// Получение заголовков с токеном авторизации
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Токен авторизации отсутствует');
  }
  
  // Проверяем срок действия токена
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]));
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        // Токен истек, удаляем его
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('isAuthenticated');
        throw new Error('Токен авторизации истек');
      }
    }
  } catch (error) {
    console.error('Ошибка при проверке токена:', error);
    // Если произошла ошибка при проверке токена, удаляем его
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    throw new Error('Некорректный токен авторизации');
  }
  
  return {
    ...headers,
    'Authorization': `Bearer ${token}`
  };
};

export const login = async (identifier, password, serverId = 1) => {
  try {
    const apiUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/site-auth/login`;
    
    console.log('Отправка запроса авторизации:', {
      url: apiUrl,
      headers: { ...headers, 'X-API-Key': 'API_KEY_HIDDEN' },
      body: { identifier, serverId }
    });

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        identifier,
        password,
        serverId
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Ошибка сервера: ${response.status} ${response.statusText}` }));
      throw new Error(errorData.message || 'Ошибка авторизации');
    }

    const data = await response.json();
    console.log('Оригинальный ответ от сервера:', JSON.stringify(data, null, 2));
    
    // Проверяем только наличие обязательных полей в ответе
    if (!data.token) {
      throw new Error('Получен ответ без токена авторизации');
    }
    
    if (!data.user) {
      throw new Error('Получен ответ без данных пользователя');
    }
    
    // Сохраняем токен в localStorage
    localStorage.setItem('token', data.token);
    
    // Сохраняем время истечения токена, если оно есть
    if (data.expiresIn) {
      const expirationTime = Date.now() + data.expiresIn * 1000;
      localStorage.setItem('tokenExpiration', expirationTime.toString());
    }
    
    return data;
  } catch (error) {
    console.error('Ошибка авторизации:', error);
    throw error;
  }
};

// Получение базовой информации профиля
export const getProfile = async () => {
  try {
    const response = await fetch('/api/profile', {
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Если токен недействителен, очищаем его
        localStorage.removeItem('token');
      }
      throw new Error('Ошибка получения профиля');
    }

    return await response.json();
  } catch (error) {
    console.error('Ошибка получения профиля:', error);
    throw error;
  }
};

// Получение детальной информации профиля
export const getProfileDetails = async () => {
  try {
    const response = await fetch('/api/profile/details', {
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
      }
      throw new Error('Ошибка получения деталей профиля');
    }

    return await response.json();
  } catch (error) {
    console.error('Ошибка получения деталей профиля:', error);
    throw error;
  }
};

// Получение истории активности
export const getProfileActivity = async () => {
  try {
    const response = await fetch('/api/profile/activity', {
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
      }
      throw new Error('Ошибка получения истории активности');
    }

    return await response.json();
  } catch (error) {
    console.error('Ошибка получения истории активности:', error);
    throw error;
  }
};

// Получение списка серверов для авторизации
export const getServers = async () => {
  try {
    console.log('Отправка запроса на получение серверов для авторизации');
    
    // Используем полный URL включая хост и порт
    const apiUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/site-auth/servers`;
    
    console.log('URL запроса:', apiUrl);
    
    // Используем API пинга серверов для получения списка серверов
    const response = await fetch(apiUrl, {
      headers,
    });

    if (!response.ok) {
      console.error('Ошибка получения серверов:', response.status, response.statusText);
      throw new Error(`Не удалось получить список серверов: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Получены данные о серверах:', data);
    
    // API возвращает объект с полями count и servers
    if (!data || !data.servers || !Array.isArray(data.servers) || data.servers.length === 0) {
      console.warn('Серверы не найдены в ответе API или ответ в неожиданном формате');
      
      // Пробуем использовать API пинга серверов как запасной вариант
      return getServerInfoAsAuthServers();
    }
    
    // Преобразуем данные в формат, который ожидает компонент авторизации
    return data.servers.map(server => ({
      id: server.id,
      name: server.name || `Сервер ${server.id}`,
      description: server.description || server.name || `Сервер ${server.id}`,
      is_online: server.status === 'online',
      status: server.status || 'unknown',
      ip: server.ip,
      port: server.port
    }));
  } catch (error) {
    console.error('Ошибка получения списка серверов:', error);
    console.log('Пробуем использовать API пинга серверов как запасной вариант');
    
    // В случае ошибки пробуем использовать API пинга серверов
    return getServerInfoAsAuthServers();
  }
};

// Функция для получения серверов из API пинга как запасной вариант
async function getServerInfoAsAuthServers() {
  try {
    const apiUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/server-ping/servers`;
    console.log('Пробуем получить серверы через API пинга:', apiUrl);
    
    const response = await fetch(apiUrl, {
      headers,
    });
    
    if (!response.ok) {
      throw new Error(`Ошибка получения данных из API пинга: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Получены данные от API пинга:', data);
    
    if (!data.servers || !Array.isArray(data.servers) || data.servers.length === 0) {
      throw new Error('Нет доступных серверов в API пинга');
    }
    
    return data.servers.map(server => ({
      id: server.id,
      name: server.name || `Сервер ${server.id}`,
      description: server.description || server.name || `Сервер ${server.id}`,
      is_online: server.status === 'online',
      status: server.status || 'unknown', 
      ip: server.ip,
      port: server.port
    }));
  } catch (error) {
    console.error('Ошибка при использовании запасного варианта:', error);
    
    // Возвращаем тестовый сервер как последний вариант
    return [{
      id: 1,
      name: "Тестовый сервер",
      description: "Тестовый сервер для авторизации (запасной)",
      is_online: true
    }];
  }
}

// Получение информации о всех серверах
export const getServersInfo = async (signal) => {
  try {
    console.log('Отправка запроса server-info:', {
      url: '/api/server-ping/servers',
      headers: { ...headers, 'X-API-Key': '[СКРЫТО]' }
    });

    const response = await fetch('/api/server-ping/servers', {
      headers,
      signal // Добавляем signal для возможности отмены запроса
    });

    if (!response.ok) {
      console.error('Не удалось загрузить Fetch:', response.method, `(${response.url}).`);
      throw new Error('Не удалось получить информацию о серверах');
    }

    const data = await response.json();
    
    // API возвращает объект с полем servers
    if (!data || !data.servers || !Array.isArray(data.servers)) {
      throw new Error('Некорректный формат ответа от сервера');
    }
    
    return data.servers;
  } catch (error) {
    console.error('Ошибка получения информации о серверах:', error);
    throw error;
  }
};

// Получение информации о конкретном сервере
export const getServerInfo = async (serverId) => {
  try {
    const response = await fetch(`/api/server-info/${serverId}`, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`Не удалось получить информацию о сервере с ID ${serverId}`);
    }

    const data = await response.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error(`Ошибка получения информации о сервере ${serverId}:`, error);
    throw error;
  }
};

// Обновить интервалы пинга для всех серверов
export const refreshServerPingIntervals = async () => {
  try {
    const response = await fetch('/api/server-info/refresh', {
      method: 'POST',
      headers,
    });

    if (!response.ok) {
      throw new Error('Не удалось обновить интервалы пинга серверов');
    }

    const data = await response.json();
    return data.success ? data : null;
  } catch (error) {
    console.error('Ошибка при обновлении интервалов пинга:', error);
    throw error;
  }
};

// Выполнить принудительный пинг конкретного сервера
export const pingServer = async (serverId, signal) => {
  try {
    const response = await fetch(`/api/server-ping/servers/${serverId}/ping`, {
      method: 'POST',
      headers,
      signal // Добавляем signal для возможности отмены запроса
    });

    if (!response.ok) {
      throw new Error(`Не удалось выполнить пинг сервера с ID ${serverId}`);
    }

    const data = await response.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error(`Ошибка при пинге сервера ${serverId}:`, error);
    throw error;
  }
};

// Получение статистики мониторинга (только для администраторов)
export const getMonitoringStats = async () => {
  try {
    const response = await fetch('/api/server-info/stats/monitoring', {
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
      }
      throw new Error('Ошибка получения статистики мониторинга');
    }

    return await response.json();
  } catch (error) {
    console.error('Ошибка получения статистики мониторинга:', error);
    throw error;
  }
};

// Методы для работы с настройками пользователя
export const updateEmail = async (email) => {
  const response = await fetch('/api/user-settings/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({ email })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Ошибка при обновлении email');
  }

  return response.json();
};

export const verifyEmailCode = async (code) => {
  const response = await fetch('/api/user-settings/email/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({ code })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Ошибка при подтверждении email');
  }

  return response.json();
};

export const resendVerificationCode = async () => {
  const response = await fetch('/api/user-settings/email/resend', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Ошибка при повторной отправке кода');
  }

  return response.json();
};

// Получение настроек пользователя
export const getUserSettings = async () => {
  try {
    const response = await fetch('/api/user-settings', {
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
      }
      throw new Error('Ошибка получения настроек пользователя');
    }

    return await response.json();
  } catch (error) {
    console.error('Ошибка получения настроек пользователя:', error);
    throw error;
  }
}; 