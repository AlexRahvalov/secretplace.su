import React, { useState, useEffect } from 'react';
import '@assets/css/components/ServerInfo.css';
import '@assets/css/components/ServerCard.css';
import { getServersInfo, pingServer } from '../../services/api';
import serverWebSocket from '../../services/websocket';

const ServerInfo = () => {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [changedValues, setChangedValues] = useState({});
  const [animateIn, setAnimateIn] = useState(false);
  const [copyStates, setCopyStates] = useState({});
  const [wsStatus, setWsStatus] = useState({
    connected: false,
    error: null,
    reconnecting: false
  });

  // Функция для получения данных о серверах через REST API
  const fetchServersData = async (abortSignal) => {
    try {
      setLoading(true);
      const data = await getServersInfo(abortSignal);
      
      // Трансформируем данные для совместимости с UI
      const formattedServers = data.map(server => ({
        id: server.id,
        name: server.name,
        description: server.description || 'Minecraft Server',
        is_online: server.status === 'online',
        players_online: server.players_online || 0,
        max_players: server.players_max || 0,
        ping: server.response_time || 0,
        server_ip: server.ip,
        server_port: server.port,
        status: server.status || (server.online ? 'online' : 'offline'),
        version: server.version,
        lastCheck: server.last_check || server.lastCheck
      }));
      
      if (!abortSignal || !abortSignal.aborted) {
        setServers(formattedServers);
        setError(null);
        // Анимация появления серверов
        setTimeout(() => setAnimateIn(true), 100);
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Запрос данных о серверах был отменен');
        return;
      }
      console.error('Ошибка при получении данных о серверах:', err);
      setError('Не удалось загрузить информацию о серверах');
    } finally {
      if (!abortSignal || !abortSignal.aborted) {
        setLoading(false);
      }
    }
  };

  // Обработчик для получения списка серверов от WebSocket
  const handleServerList = (serversList) => {
    console.log('Получен список серверов через WebSocket:', serversList.length);
    
    // Форматируем серверы для совместимости с UI
    const formattedServers = serversList.map(server => ({
      id: server.id,
      name: server.name,
      description: server.description || 'Minecraft Server',
      is_online: server.status === 'online',
      players_online: server.players_online || 0,
      max_players: server.players_max || 0,
      ping: server.response_time || 0,
      server_ip: server.ip,
      server_port: server.port,
      status: server.status,
      version: server.version,
      lastCheck: server.last_check
    }));
    
    setServers(formattedServers);
    setLoading(false);
    setError(null);
    
    // Анимация появления серверов
    setTimeout(() => setAnimateIn(true), 100);
  };

  // Обработчик для обновления отдельного сервера
  const handleServerUpdate = (updatedServer) => {
    console.log('Получено обновление сервера через WebSocket:', updatedServer.id);
    
    setServers(prevServers => {
      const index = prevServers.findIndex(s => s.id === updatedServer.id);
      
      if (index === -1) return prevServers; // Сервер не найден
      
      const oldServer = prevServers[index];
      const newChanges = {};
      
      // Определяем, какие данные изменились для анимации
      if (oldServer.is_online !== (updatedServer.status === 'online'))
        newChanges.status = true;
      if (oldServer.players_online !== updatedServer.players_online)
        newChanges.players = true;
      if (oldServer.ping !== updatedServer.response_time)
        newChanges.ping = true;
      
      // Сохраняем изменения для анимации
      setChangedValues(prev => ({
        ...prev,
        [updatedServer.id]: newChanges
      }));
      
      // Через 2 секунды сбрасываем анимацию
      setTimeout(() => {
        setChangedValues(prev => ({
          ...prev,
          [updatedServer.id]: {}
        }));
      }, 2000);
      
      // Обновляем данные сервера
      const newServers = [...prevServers];
      newServers[index] = {
        ...newServers[index],
        is_online: updatedServer.status === 'online',
        status: updatedServer.status,
        players_online: updatedServer.players_online || 0,
        max_players: updatedServer.players_max || 0,
        ping: updatedServer.response_time || 0,
        version: updatedServer.version,
        lastCheck: updatedServer.last_check,
        // Сбрасываем индикатор обновления, если он был
        isRefreshing: false
      };
      
      return newServers;
    });
  };

  // Функция для обработки ошибок
  const handleError = (errorData) => {
    console.error('Получена ошибка WebSocket:', errorData.message);
    // Если WebSocket дал ошибку, но у нас уже есть данные, не показываем ошибку пользователю
    if (servers.length === 0) {
      setError('Не удалось загрузить информацию о серверах');
    }
  };

  // Функция для пинга сервера
  const handlePingServer = (serverId) => {
    console.log('Запрос на пинг сервера:', serverId);
    
    // Устанавливаем индикатор загрузки для сервера
    setServers(prevServers => {
      const index = prevServers.findIndex(s => s.id === serverId);
      if (index === -1) return prevServers;
      
      const updatedServers = [...prevServers];
      updatedServers[index] = { 
        ...updatedServers[index],
        isRefreshing: true 
      };
      
      return updatedServers;
    });
    
    // Если WebSocket подключен, используем его для пинга
    if (wsConnected) {
      serverWebSocket.pingServer(serverId);
    } else {
      // Иначе используем REST API
      const controller = new AbortController();
      pingServer(serverId, controller.signal)
        .then(pingResult => {
          console.log(`Сервер ${serverId} пингован через REST API:`, pingResult);
          // Обновляем все данные после пинга
          fetchServersData();
        })
        .catch(err => {
          if (err.name === 'AbortError') {
            console.log(`Запрос пинга сервера ${serverId} был отменен`);
            return;
          }
          console.error(`Ошибка при пинге сервера ${serverId}:`, err);
          // Сбрасываем индикатор загрузки в случае ошибки
          setServers(prevServers => {
            const index = prevServers.findIndex(s => s.id === serverId);
            if (index === -1) return prevServers;
            
            const updatedServers = [...prevServers];
            updatedServers[index] = { 
              ...updatedServers[index],
              isRefreshing: false 
            };
            
            return updatedServers;
          });
        });
    }
  };

  // Форматирование времени последней проверки
  const formatLastCheckTime = (isoString) => {
    if (!isoString) return 'Н/Д';
    
    try {
      const date = new Date(isoString);
      return date.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return 'Некорректная дата';
    }
  };

  // Инициализация WebSocket и первоначальная загрузка данных
  useEffect(() => {
    console.log('Инициализация компонента ServerInfo');
    
    const controller = new AbortController();
    const signal = controller.signal;
    let timeoutId = null;

    const setupWebSocket = () => {
      // Настраиваем обработчики для WebSocket
      serverWebSocket.onServerList(handleServerList);
      serverWebSocket.onServerUpdate(handleServerUpdate);
      serverWebSocket.onError(handleError);
      serverWebSocket.onConnectionChange(isConnected => {
        console.log('Статус WebSocket соединения изменен:', isConnected);
        setWsConnected(isConnected);
        setWsStatus(prev => ({
          ...prev,
          connected: isConnected,
          error: isConnected ? null : prev.error
        }));
      });
      
      // Подключаемся к WebSocket
      serverWebSocket.connect();
    };
    
    // Инициализация соединения
    setupWebSocket();
    
    // Резервный вариант: если WebSocket не отвечает за 3 секунды, используем REST API
    timeoutId = setTimeout(() => {
      if (loading && servers.length === 0) {
        console.log('WebSocket не отвечает, используем REST API для начальной загрузки');
        fetchServersData(signal).catch(err => {
          if (!signal.aborted) {
            console.error('Ошибка при загрузке данных:', err);
          }
        });
      }
    }, 3000);
    
    // Очистка при размонтировании компонента
    return () => {
      console.log('Размонтирование компонента ServerInfo');
      
      // Отмена всех запросов
      controller.abort();
      
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      // Отключаем WebSocket только если это последний компонент, использующий его
      if (serverWebSocket.connected) {
        serverWebSocket.disconnect();
      }
    };
  }, []);

  // Функция для определения цвета индикатора заполненности
  const getPlayerBarColor = (current, max) => {
    if (max === 0) return '#4CAF50';
    
    const percentage = (current / max) * 100;
    if (percentage === 0) return '#555';
    if (percentage < 50) return '#4CAF50';
    if (percentage < 80) return '#FFC107';
    return '#FF4655';
  };

  // Функция для копирования IP-адреса
  const handleCopyIP = (e, ip) => {
    e.preventDefault();
    navigator.clipboard.writeText(ip).then(() => {
      // Отображаем уведомление о копировании
      setCopyStates(prev => ({
        ...prev,
        [ip]: true
      }));
      
      // Скрываем уведомление через 2 секунды
      setTimeout(() => {
        setCopyStates(prev => ({
          ...prev,
          [ip]: false
        }));
      }, 2000);
    }).catch(err => {
      console.error('Ошибка при копировании IP:', err);
    });
  };

  if (loading && servers.length === 0) {
    return (
      <section className="server-info">
        <div className="container">
          <h2 className="section-title">Наши сервера</h2>
          <div className="server-grid">
            <div className="server-card loading">
              <div className="loading-text">Загрузка...</div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error && servers.length === 0) {
    return (
      <section className="server-info">
        <div className="container">
          <h2 className="section-title">Наши сервера</h2>
          <div className="error-message">
            {error}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="server-info">
      <div className="container">
        <div className="server-info-header">
          <h2 className="section-title">Наши сервера</h2>
        </div>
        
        <div className={`server-grid ${animateIn ? 'animate-in' : ''}`}>
          {servers.length === 0 ? (
            <div className="no-servers-message">
              Серверы не найдены. Попробуйте обновить страницу.
            </div>
          ) : (
            servers.map((server, index) => (
              <div 
                key={server.id || index} 
                className="server-card"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Статус-индикатор (зеленая точка) */}
                <div 
                  className={`status-indicator-dot ${server.status === 'online' ? 'online' : 'offline'}`}
                  title={server.status === 'online' ? 'Online' : 'Offline'}
                />
                
                {/* Название сервера */}
                <h3 className="server-name">{server.name}</h3>
                
                {/* Упрощенная информация о сервере */}
                <div className="server-info-minimal">
                  {/* Строка с информацией о сервере */}
                  <div className="server-info-row">
                    {/* Количество игроков */}
                    <div className={`players-count ${server.players_online === 0 ? 'empty' : ''}`}>
                      <div className="player-icon"></div>
                      <span className="player-count-text">
                        {server.players_online}/{server.max_players}
                      </span>
                    </div>
                    
                    {/* Версия сервера */}
                    {server.version && (
                      <div className="server-version">
                        <span className="version-icon">⚙️</span>
                        {server.version}
                      </div>
                    )}
                  </div>
                  
                  {/* IP сервера */}
                  <div 
                    className="server-ip-container" 
                    onClick={(e) => handleCopyIP(e, server.server_ip)}
                    title="Нажмите, чтобы скопировать IP"
                  >
                    <span className="server-ip">{server.server_ip}{server.server_port !== 25565 ? `:${server.server_port}` : ''}</span>
                    <span className="copy-icon">📋</span>
                    {copyStates[`${server.server_ip}${server.server_port !== 25565 ? `:${server.server_port}` : ''}`] && (
                      <div className="copy-toast">IP скопирован</div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* WebSocket статус для информирования пользователя */}
        {wsStatus.error && !loading && (
          <div className="realtime-status error">
            <span className="status-icon">⚠️</span>
            {wsStatus.error}
          </div>
        )}
      </div>
    </section>
  );
};

export default ServerInfo; 