import React, { useState, useEffect } from 'react';
import './LoginForm.css';
import { login as apiLogin, getServers, getServersInfo } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const LoginForm = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [servers, setServers] = useState([]);
  const [selectedServerId, setSelectedServerId] = useState(1);
  const [loadingServers, setLoadingServers] = useState(true);
  const { login } = useAuth();

  // Загрузка списка серверов при монтировании компонента
  useEffect(() => {
    const fetchServersData = async () => {
      try {
        setLoadingServers(true);
        
        // Получаем список серверов из auth/servers
        const baseServers = await getServers();
        
        if (baseServers.length === 0) {
          // Если серверов нет, устанавливаем пустой массив
          setServers([]);
          setLoadingServers(false);
          return;
        }
        
        // Затем пытаемся получить дополнительную информацию
        let enrichedServers = [...baseServers];
        
        try {
          const serversInfo = await getServersInfo();
          
          // Обогащаем базовые данные серверов информацией из server-info
          enrichedServers = baseServers.map(server => {
            // Ищем дополнительную информацию для текущего сервера
            const serverInfo = serversInfo.find(info => info.server_id === server.id);
            
            return {
              ...server,
              // Добавляем дополнительные поля из serverInfo, если они есть
              description: serverInfo ? serverInfo.description : null,
              is_online: serverInfo ? serverInfo.is_online : 0,
              status: serverInfo ? serverInfo.status : 'unknown'
            };
          });
        } catch (infoError) {
          console.error('Ошибка при загрузке дополнительной информации о серверах:', infoError);
          // В случае ошибки продолжаем работу с базовым списком серверов
        }
        
        setServers(enrichedServers);
        
        // Если есть серверы, устанавливаем первый по умолчанию
        if (enrichedServers.length > 0) {
          setSelectedServerId(enrichedServers[0].id);
        }
      } catch (error) {
        console.error('Ошибка при загрузке списка серверов:', error);
        setError('Не удалось загрузить список серверов');
        setServers([]);
      } finally {
        setLoadingServers(false);
      }
    };

    fetchServersData();
  }, []);

  // Форматирование имени сервера для отображения в выпадающем списке
  const formatServerName = (server) => {
    // Основное имя сервера
    let name = server.name || `Сервер ${server.id}`;
    
    // Статус сервера (онлайн/оффлайн)
    let status = server.is_online ? '● ' : '○ ';
    
    // IP-адрес, если есть
    let ipInfo = server.ip ? ` (${server.ip})` : '';
    
    // Формируем итоговую строку
    return `${status}${name}${ipInfo}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    console.log('Начало процесса авторизации...');

    try {
      // Вызываем API для авторизации
      console.log('Отправка запроса авторизации с данными:', {
        identifier: username.trim(),
        serverId: selectedServerId
      });

      const response = await apiLogin(username.trim(), password, selectedServerId);
      
      console.log('Необработанный ответ от сервера:', response);
      console.log('Успешный ответ от сервера:', {
        token: response.token ? '[ТОКЕН ПОЛУЧЕН]' : '[ТОКЕН ОТСУТСТВУЕТ]',
        user: response.user
      });
      
      // Проверяем наличие необходимых данных
      if (!response.token) {
        throw new Error('Ответ сервера не содержит токен авторизации');
      }
      
      if (!response.user) {
        throw new Error('Ответ сервера не содержит данные пользователя');
      }
      
      // Сохраняем данные в контексте
      login(response.user, response.token);
      
      // Вызываем колбэк для закрытия модального окна
      onLogin(true);
    } catch (error) {
      console.error('Детальная информация об ошибке:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });

      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        setError('Не удалось соединиться с сервером. Проверьте подключение или убедитесь, что сервер запущен.');
      } else {
        setError(error.message || 'Ошибка авторизации. Проверьте введенные данные.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>Вход в систему</h2>
        {error && <div className="error-message">{error}</div>}
        <div className="form-group">
          <label htmlFor="username">Имя пользователя:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
            disabled={isLoading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Пароль:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            disabled={isLoading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="server">Выберите сервер:</label>
          <select
            id="server"
            value={selectedServerId}
            onChange={(e) => setSelectedServerId(Number(e.target.value))}
            disabled={isLoading || loadingServers}
            required
          >
            {loadingServers ? (
              <option value="">Загрузка серверов...</option>
            ) : servers.length === 0 ? (
              <option value="">Нет доступных серверов</option>
            ) : (
              servers.map(server => (
                <option 
                  key={server.id} 
                  value={server.id}
                  disabled={!server.is_online}
                >
                  {formatServerName(server)}
                </option>
              ))
            )}
          </select>
        </div>
        <button 
          type="submit" 
          className="login-button" 
          disabled={isLoading || loadingServers || servers.length === 0}
        >
          {isLoading ? 'Выполняется вход...' : 'Войти'}
        </button>
      </form>
    </div>
  );
};

export default LoginForm; 