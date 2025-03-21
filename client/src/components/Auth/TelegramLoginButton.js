// Компонент кнопки аутентификации через Telegram
import { createElement } from '../../utils/dom.js';

/**
 * Создает компонент кнопки для входа через Telegram
 * @param {Object} options - Параметры компонента
 * @param {string} options.botName - Имя Telegram бота
 * @param {Function} options.onAuth - Функция обратного вызова при успешной аутентификации
 * @returns {HTMLElement} HTML-элемент кнопки
 */
export default function TelegramLoginButton({ botName, onAuth }) {
  // Создаем контейнер для виджета
  const container = createElement('div', { 
    id: 'telegram-login-container',
    className: 'telegram-login-widget' 
  });
  
  // Инициализируем виджет после добавления в DOM
  setTimeout(() => {
    // Проверяем, загружен ли скрипт Telegram
    if (!window.Telegram || !window.Telegram.Login) {
      // Загружаем скрипт, если он еще не загружен
      const script = document.createElement('script');
      script.src = 'https://telegram.org/js/telegram-widget.js?22';
      script.setAttribute('data-telegram-login', botName);
      script.setAttribute('data-size', 'medium');
      script.setAttribute('data-radius', '4');
      script.setAttribute('data-onauth', 'onTelegramAuth');
      script.setAttribute('data-request-access', 'write');
      script.async = true;
      
      // Добавляем обработчик аутентификации в глобальную область видимости
      window.onTelegramAuth = (user) => {
        // Вызываем обработчик с данными пользователя
        if (typeof onAuth === 'function') {
          onAuth(user);
        }
      };
      
      // Добавляем скрипт на страницу
      container.appendChild(script);
    } else {
      // Если скрипт уже загружен, инициализируем виджет напрямую
      window.Telegram.Login.auth({ 
        bot_id: botName,
        element: container,
        request_access: 'write',
        onAuth: (user) => {
          if (typeof onAuth === 'function') {
            onAuth(user);
          }
        }
      });
    }
  }, 0);
  
  return container;
} 