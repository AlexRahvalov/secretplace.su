// Утилита для отладки WebSocket соединения
import serverWebSocket from './websocket';

export const debugWebSocket = () => {
  console.group('WebSocket отладка');
  console.log('Статус соединения:', serverWebSocket.connected ? 'Подключено' : 'Отключено');
  
  // Отобразить все обработчики событий
  console.log('Зарегистрированные обработчики:', Object.keys(serverWebSocket.callbacks));
  
  // Метод для тестового пинга сервера
  const testPing = (serverId = 1) => {
    console.log(`Отправка тестового ping запроса для сервера ID: ${serverId}`);
    serverWebSocket.pingServer(serverId);
  };
  
  // Метод для тестового подключения
  const testConnect = () => {
    console.log('Ручное подключение к WebSocket...');
    serverWebSocket.connect();
  };
  
  // Метод для тестового отключения
  const testDisconnect = () => {
    console.log('Ручное отключение WebSocket...');
    serverWebSocket.disconnect();
  };
  
  console.log('Методы отладки доступны: testPing(serverId), testConnect(), testDisconnect()');
  console.groupEnd();
  
  // Возвращаем методы для использования в консоли браузера
  return {
    status: serverWebSocket.connected,
    testPing,
    testConnect,
    testDisconnect
  };
};

// Добавляем в глобальный объект window для доступа из консоли браузера
if (typeof window !== 'undefined') {
  window.wsDebug = debugWebSocket;
}

export default debugWebSocket; 