/**
 * Сервис для работы с WebSocket соединением для получения обновлений о серверах в реальном времени
 */
class ServerWebSocket {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectTimer = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectInterval = 5000; // 5 секунд
    this.sessionId = Date.now().toString(); // Уникальный ID сессии для отслеживания переподключений
    this.callbacks = {
      onServerList: () => {},
      onServerUpdate: () => {},
      onError: () => {},
      onConnectionChange: () => {}
    };
  }
  
  connect() {
    // Используем динамический WebSocket URL на основе текущего хоста
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host; // Автоматически получаем текущий хост и порт
    const wsUrl = import.meta.env.VITE_WS_URL || `${protocol}//${host}/api/server-ping/live`;
    
    // Не подключаемся, если соединение уже в процессе установки
    if (this.socket && (this.socket.readyState === WebSocket.CONNECTING || 
                       this.socket.readyState === WebSocket.OPEN)) {
      console.log('WebSocket соединение уже установлено или устанавливается');
      return;
    }
    
    // Закрываем предыдущее соединение, если оно было
    if (this.socket) {
      this.socket.close();
    }
    
    try {
      console.log(`Подключение к WebSocket: ${wsUrl} (попытка ${this.reconnectAttempts + 1})`);
      this.socket = new WebSocket(wsUrl);
      
      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
    } catch (err) {
      console.error('Ошибка при создании WebSocket соединения:', err);
      this.callbacks.onError({ 
        message: `Не удалось создать WebSocket соединение: ${err.message}`,
        type: 'connection_error'
      });
      this.scheduleReconnect();
    }
  }
  
  handleOpen() {
    console.log('WebSocket соединение установлено успешно');
    this.isConnected = true;
    this.reconnectAttempts = 0; // Сбрасываем счетчик попыток
    this.callbacks.onConnectionChange(true);
    this.identify();
  }
  
  identify() {
    // Отправляем идентификацию клиента при подключении
    this.send({
      type: 'client_identify',
      data: {
        client_type: 'frontend',
        session_id: this.sessionId, // Добавляем ID сессии
        client_info: {
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        }
      }
    });
  }
  
  handleMessage(event) {
    try {
      const message = JSON.parse(event.data);
      console.log('WebSocket сообщение:', message.type);
      
      switch (message.type) {
        case 'server_list':
          this.callbacks.onServerList(message.data.servers);
          break;
        case 'server_update':
          this.callbacks.onServerUpdate(message.data);
          break;
        case 'error':
          console.error('WebSocket ошибка от сервера:', message.data.message);
          this.callbacks.onError(message.data);
          break;
        case 'pong':
          console.log('Получен ответ pong от сервера');
          break;
        default:
          console.warn('Неизвестный тип сообщения WebSocket:', message.type);
      }
    } catch (err) {
      console.error('Ошибка обработки сообщения WebSocket:', err, 'Данные:', event.data);
      this.callbacks.onError({ 
        message: 'Не удалось обработать сообщение от сервера',
        error: err.message
      });
    }
  }
  
  handleClose(event) {
    const reason = event.reason ? ` Причина: ${event.reason}` : '';
    console.log(`WebSocket соединение закрыто. Код: ${event.code}.${reason}`);
    this.isConnected = false;
    this.callbacks.onConnectionChange(false);
    
    // Расшифровка кодов закрытия
    let closeReason = 'Неизвестная причина';
    switch (event.code) {
      case 1000: closeReason = 'Нормальное закрытие'; break;
      case 1001: closeReason = 'Уходящий'; break;
      case 1002: closeReason = 'Ошибка протокола'; break;
      case 1003: closeReason = 'Неприемлемый тип данных'; break;
      case 1005: closeReason = 'Закрытие без статуса'; break;
      case 1006: closeReason = 'Аномальное закрытие'; break;
      case 1007: closeReason = 'Неверные данные'; break;
      case 1008: closeReason = 'Нарушение политики'; break;
      case 1009: closeReason = 'Слишком большое сообщение'; break;
      case 1010: closeReason = 'Требуемое расширение отсутствует'; break;
      case 1011: closeReason = 'Внутренняя ошибка'; break;
      case 1012: closeReason = 'Перезапуск сервиса'; break;
      case 1013: closeReason = 'Попробуйте позже'; break;
      case 1014: closeReason = 'Ошибка прокси'; break;
      case 1015: closeReason = 'Ошибка TLS'; break;
    }
    
    this.callbacks.onError({ 
      message: `WebSocket соединение закрыто. ${closeReason}.`,
      code: event.code,
      type: 'connection_closed'
    });
    
    // Пытаемся переподключиться, если это не было явное закрытие
    if (event.code !== 1000) {
      this.scheduleReconnect();
    }
  }
  
  handleError(error) {
    console.error('WebSocket ошибка:', error);
    
    // Собираем контекст ошибки
    const errorContext = {
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      readyState: this.socket ? this.socket.readyState : 'unknown',
    };
    
    console.error('Контекст ошибки WebSocket:', errorContext);
    
    this.callbacks.onError({ 
      message: 'Ошибка WebSocket соединения', 
      context: errorContext,
      type: 'socket_error'
    });
  }
  
  scheduleReconnect() {
    // Очищаем предыдущий таймер, если он был
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    // Проверяем, не превысили ли лимит попыток
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`Превышено максимальное число попыток (${this.maxReconnectAttempts}) подключения к WebSocket. Остановка попыток.`);
      this.callbacks.onError({ 
        message: `Не удалось подключиться к серверу после ${this.maxReconnectAttempts} попыток. Попробуйте обновить страницу.`,
        type: 'max_reconnects_exceeded'
      });
      return;
    }
    
    // Увеличиваем счетчик попыток
    this.reconnectAttempts++;
    
    // Экспоненциальная задержка с оптимизацией для первых попыток
    let delay;
    if (this.reconnectAttempts === 1) {
      // Первая попытка - быстрое переподключение через 1 секунду
      delay = 1000;
    } else if (this.reconnectAttempts === 2) {
      // Вторая попытка - 3 секунды
      delay = 3000;
    } else {
      // Последующие попытки - экспоненциальная задержка
      delay = Math.min(30000, this.reconnectInterval * Math.pow(1.5, this.reconnectAttempts - 3)) 
                 + Math.floor(Math.random() * 1000);
    }
    
    console.log(`Попытка переподключения WebSocket через ${Math.round(delay/1000)} секунд (попытка ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
    // Повторное подключение через рассчитанный интервал
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }
  
  send(data) {
    if (this.isConnected && this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(JSON.stringify(data));
      } catch (err) {
        console.error('Ошибка при отправке данных через WebSocket:', err);
        this.callbacks.onError({ 
          message: 'Не удалось отправить данные',
          error: err.message
        });
      }
    } else {
      console.warn('Попытка отправить сообщение при закрытом WebSocket соединении');
    }
  }
  
  pingServer(serverId) {
    console.log('Отправка запроса на пинг сервера через WebSocket:', serverId);
    this.send({
      type: 'ping_request',
      data: {
        server_id: serverId
      }
    });
  }
  
  // Метод для отправки ping на сервер для проверки соединения
  sendPing() {
    this.send({
      type: 'ping',
      data: {
        timestamp: Date.now()
      }
    });
  }
  
  // Методы для установки обработчиков событий
  onServerList(callback) {
    this.callbacks.onServerList = callback;
  }
  
  onServerUpdate(callback) {
    this.callbacks.onServerUpdate = callback;
  }
  
  onError(callback) {
    this.callbacks.onError = callback;
  }
  
  onConnectionChange(callback) {
    this.callbacks.onConnectionChange = callback;
  }
  
  disconnect() {
    console.log('Отключение WebSocket соединения');
    
    // Очищаем таймер переподключения
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    // Удаляем обработчики перед закрытием
    if (this.socket) {
      // Сначала отключаем обработчики событий для предотвращения новых вызовов
      const emptyFn = () => {};
      this.socket.onopen = emptyFn;
      this.socket.onmessage = emptyFn;
      this.socket.onerror = emptyFn;
      
      // Установим более простой обработчик закрытия
      this.socket.onclose = (event) => {
        console.log(`WebSocket соединение закрыто при отключении. Код: ${event.code}`);
      };
      
      // Проверяем состояние соединения перед закрытием
      if (this.socket.readyState === WebSocket.OPEN) {
        // Если соединение открыто, закрываем его нормально
        this.socket.close(1000, 'Клиент отключен');
      } else if (this.socket.readyState === WebSocket.CONNECTING) {
        // Если соединение в процессе установки, закрываем его и подавляем ошибки
        try {
          this.socket.close(1000, 'Клиент отключен до установки соединения');
        } catch (err) {
          console.log('Невозможно закрыть соединение в процессе установки:', err.message);
        }
      }
      
      this.socket = null;
    }
    
    this.isConnected = false;
    this.callbacks.onConnectionChange(false);
  }
  
  // Геттер для проверки статуса соединения
  get connected() {
    return this.isConnected;
  }
  
  // Геттер для проверки состояния сокета
  get socketState() {
    if (!this.socket) return 'CLOSED';
    
    const states = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'];
    return states[this.socket.readyState];
  }
}

// Создаем и экспортируем синглтон
export default new ServerWebSocket(); 