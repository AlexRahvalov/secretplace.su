import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import '@assets/css/index.css'
import './services/websocket' // Инициализация WebSocket сервиса

// Добавляем отладку в режиме разработки
if (import.meta.env.DEV) {
  import('./services/wsDebug').then(({ default: debugWebSocket }) => {
    console.log('WebSocket отладка доступна через window.wsDebug()');
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
) 