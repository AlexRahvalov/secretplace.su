// LoginForm.js - Компонент формы авторизации
import { createElement } from '../utils/dom.js';
import { login, isAuthenticated, getCurrentUser, logout, getAuthInfo, loginWithTelegramWidget, bindTelegramWithWidget } from '../services/authService.js';

/**
 * Создает компонент формы авторизации
 * @param {Object} props - Свойства компонента
 * @param {Function} props.onClose - Функция, вызываемая при закрытии формы
 * @returns {HTMLElement} HTML-элемент формы авторизации
 */
export default function LoginForm({ onClose }) {
  // Создаем обертку модального окна
  const modal = createElement('div', { className: 'auth-modal' });
  
  // Создаем форму
  const form = createElement('form', { className: 'login-form' });
  
  // Создаем заголовок
  const title = createElement('h2', { className: 'login-title' }, 'Войти с помощью');
  
  // Контейнер для альтернативных методов авторизации
  const altAuthContainer = createElement('div', { className: 'alt-auth-methods' });
  
  // Контейнер для сообщений об ошибках
  const errorContainer = createElement('div', { className: 'login-error' });
  
  // Разделитель
  const divider = createElement('div', { className: 'auth-divider' }, [
    createElement('span', {}, 'Или используя')
  ]);
  
  // Поле для имени пользователя
  const usernameField = createElement('div', { className: 'form-field' }, [
    createElement('label', { htmlFor: 'username' }, 'Имя пользователя'),
    createElement('input', { 
      id: 'username',
      type: 'text',
      name: 'username',
      placeholder: 'Введите имя пользователя',
      required: 'true'
    })
  ]);
  
  // Поле для пароля
  const passwordField = createElement('div', { className: 'form-field' }, [
    createElement('label', { htmlFor: 'password' }, 'Пароль'),
    createElement('input', { 
      id: 'password',
      type: 'password',
      name: 'password',
      placeholder: 'Введите пароль',
      required: 'true'
    })
  ]);
  
  // Кнопки действий
  const buttonsContainer = createElement('div', { className: 'form-buttons' });
  
  // Кнопка входа
  const loginButton = createElement('button', { 
    type: 'submit',
    className: 'btn-login'
  }, 'Войти');
  
  // Кнопка отмены
  const cancelButton = createElement('button', { 
    type: 'button',
    className: 'btn-cancel',
    onClick: onClose
  }, 'Отмена');
  
  // Добавляем кнопки в контейнер
  buttonsContainer.appendChild(loginButton);
  buttonsContainer.appendChild(cancelButton);
  
  // Профиль пользователя (отображается после авторизации)
  const userProfile = createElement('div', { className: 'user-profile', style: { display: 'none' } });
  
  // Функция инициализации Telegram виджета
  function initTelegramLoginWidget(containerId, botName) {
    // Проверяем, существует ли контейнер
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Очищаем контейнер
    container.innerHTML = '';
    
    // Создаем IFrame для виджета
    const widgetFrame = document.createElement('iframe');
    widgetFrame.id = 'telegram-login-widget-iframe';
    widgetFrame.frameBorder = '0';
    widgetFrame.scrolling = 'no';
    widgetFrame.width = '100%';
    widgetFrame.height = '54px';
    widgetFrame.style.overflow = 'hidden';
    
    // Формируем URL для виджета
    const widgetUrl = `https://oauth.telegram.org/embed/${botName}?origin=${encodeURIComponent(window.location.origin)}&return_to=${encodeURIComponent(window.location.origin)}&size=large&radius=8&request_access=write&lang=ru`;
    
    // Устанавливаем источник для IFrame
    widgetFrame.src = widgetUrl;
    
    // Добавляем IFrame в контейнер
    container.appendChild(widgetFrame);
    
    // Слушаем сообщения от виджета
    window.addEventListener('message', function(event) {
      // Проверяем, что сообщение от разрешенного источника
      if (event.origin === 'https://oauth.telegram.org') {
        try {
          // Проверяем, что это сообщение с данными пользователя
          if (event.data && typeof event.data === 'string' && event.data.startsWith('{')) {
            const user = JSON.parse(event.data);
            
            // Проверяем, что это объект пользователя от Telegram
            if (user && user.id && user.first_name) {
              // Вызываем функцию авторизации
              handleTelegramAuth(user);
            }
          }
        } catch (error) {
          // Обрабатываем ошибки разбора JSON
        }
      }
    });
  }
  
  // Функция создания контейнера для Telegram Login Widget
  function createTelegramLoginContainer() {
    const container = createElement('div', {
      id: 'telegram-login-container',
      className: 'telegram-login-container'
    });
    
    // Добавляем контейнер для виджета
    altAuthContainer.appendChild(container);
    
    return container.id;
  }
  
  // Обработчик авторизации через Telegram Widget
  async function handleTelegramAuth(user) {
    if (!user) {
      errorContainer.textContent = 'Ошибка получения данных от Telegram';
      return;
    }
    
    try {
      // Пытаемся авторизоваться через Telegram
      const userData = await loginWithTelegramWidget(user);
      
      // Показываем профиль пользователя
      showUserProfile(userData);
    } catch (error) {
      // Если пользователь не найден, предлагаем привязать аккаунт
      if (error.message.includes('не найден')) {
        errorContainer.innerHTML = 
          'Ваш Telegram аккаунт не привязан к учетной записи.<br>' +
          'Чтобы привязать аккаунт, войдите с помощью логина и пароля,<br>' +
          'затем нажмите "Привязать Telegram" в профиле.';
      } else {
        errorContainer.textContent = error.message || 'Ошибка авторизации через Telegram';
      }
    }
  }
  
  // Загружаем информацию об авторизации
  async function loadAuthInfo() {
    try {
      const authInfo = await getAuthInfo();
      
      // Если Telegram авторизация включена, добавляем виджет
      if (authInfo && authInfo.telegramEnabled) {
        const containerId = createTelegramLoginContainer();
        
        // Получаем данные о боте из API
        fetch('/api/auth/telegram/info')
          .then(response => response.json())
          .then(data => {
            if (data.success && data.botUsername) {
              // Инициализируем виджет Telegram
              initTelegramLoginWidget(containerId, data.botUsername);
            } else {
              errorContainer.textContent = 'Не удалось загрузить Telegram виджет';
            }
          })
          .catch(error => {
            errorContainer.textContent = 'Ошибка загрузки Telegram виджета';
          });
        
        // Добавляем контейнер для альтернативных методов и разделитель
        form.insertBefore(altAuthContainer, errorContainer);
        form.insertBefore(divider, usernameField);
      }
    } catch (error) {
      // Ошибка при загрузке информации об авторизации
    }
  }
  
  // Добавляем все элементы в форму
  form.appendChild(title);
  form.appendChild(errorContainer);
  form.appendChild(usernameField);
  form.appendChild(passwordField);
  form.appendChild(buttonsContainer);
  
  // Добавляем содержимое в модальное окно
  modal.appendChild(form);
  modal.appendChild(userProfile);
  
  // Загружаем информацию об авторизации
  loadAuthInfo();
  
  // Обработчик отправки формы
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    
    // Очищаем контейнер ошибок
    errorContainer.textContent = '';
    
    // Получаем значения полей
    const usernameInput = form.querySelector('#username');
    const passwordInput = form.querySelector('#password');
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    
    if (!username || !password) {
      errorContainer.textContent = 'Заполните все поля';
      return;
    }
    
    try {
      // Блокируем кнопку на время авторизации
      loginButton.disabled = true;
      loginButton.textContent = 'Вход...';
      
      // Авторизуемся
      const user = await login(username, password);
      
      // Показываем профиль
      showUserProfile(user);
      
    } catch (error) {
      // Показываем ошибку
      errorContainer.textContent = error.message || 'Ошибка авторизации';
      
      // Разблокируем кнопку
      loginButton.disabled = false;
      loginButton.textContent = 'Войти';
    }
  });
  
  // Добавляем клик по фону для закрытия модального окна
  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      onClose();
    }
  });
  
  // Функция для отображения профиля пользователя
  function showUserProfile(user) {
    // Скрываем форму
    form.style.display = 'none';
    
    // Очищаем содержимое профиля
    userProfile.innerHTML = '';
    
    // Заголовок профиля
    const profileTitle = createElement('h2', { className: 'profile-title' }, 'Мой профиль');
    
    // Аватар пользователя
    const avatar = createElement('div', { className: 'user-avatar' }, user.displayName.charAt(0).toUpperCase());
    
    // Данные пользователя
    const userData = createElement('div', { className: 'user-data' }, [
      createElement('div', { className: 'user-displayname' }, user.displayName),
      createElement('div', { className: 'user-username' }, `@${user.username || 'пользователь'}`)
    ]);
    
    // Если пользователь авторизован через Telegram, показываем это
    if (user.telegramId || user.authType === 'telegram') {
      userData.appendChild(
        createElement('div', { className: 'user-auth-type' }, 'Авторизация через Telegram')
      );
    }
    
    // Контейнер для кнопок действий
    const profileActions = createElement('div', { className: 'profile-actions' });
    
    // Кнопка выхода
    const logoutButton = createElement('button', { 
      className: 'btn-logout',
      onClick: () => {
        logout();
        onClose();
      }
    }, 'Выйти');
    
    profileActions.appendChild(logoutButton);
    
    // Добавляем кнопку привязки Telegram, если пользователь не авторизован через Telegram
    if (!user.telegramId && user.authType !== 'telegram') {
      const bindTelegramButton = createElement('button', {
        className: 'btn-bind-telegram',
        onClick: handleBindTelegram
      }, [
        createElement('img', {
          src: '../assets/images/telegram-icon.svg',
          alt: 'Telegram',
          className: 'telegram-icon-small'
        }),
        createElement('span', {}, 'Привязать Telegram')
      ]);
      
      profileActions.appendChild(bindTelegramButton);
    }
    
    // Добавляем элементы в профиль
    userProfile.appendChild(profileTitle);
    userProfile.appendChild(avatar);
    userProfile.appendChild(userData);
    userProfile.appendChild(profileActions);
    
    // Показываем профиль
    userProfile.style.display = 'block';
  }
  
  // Обработчик привязки Telegram
  async function handleBindTelegram() {
    const user = getCurrentUser();
    if (!user) return;
    
    // Создаем контейнер для привязки Telegram
    const bindContainer = createElement('div', { className: 'bind-telegram-container' });
    
    // Заголовок
    bindContainer.appendChild(
      createElement('div', { className: 'bind-telegram-title' }, 'Привязка Telegram аккаунта')
    );
    
    // Описание
    bindContainer.appendChild(
      createElement('div', { className: 'bind-telegram-description' }, 
        'Для привязки Telegram аккаунта к вашему профилю, нажмите на кнопку ниже и авторизуйтесь в Telegram.'
      )
    );
    
    // Запрашиваем подтверждение пароля
    const password = prompt('Введите пароль для подтверждения привязки');
    if (!password) return;
    
    // Создаем контейнер для виджета
    const widgetContainer = createElement('div', {
      id: 'telegram-bind-container',
      className: 'telegram-login-container'
    });
    
    bindContainer.appendChild(widgetContainer);
    
    // Кнопка закрытия
    const closeButton = createElement('button', {
      className: 'btn-close-bind',
      onClick: () => bindContainer.remove()
    }, 'Закрыть');
    
    bindContainer.appendChild(closeButton);
    
    // Добавляем контейнер привязки в профиль
    userProfile.appendChild(bindContainer);
    
    // Получаем данные о боте из API
    try {
      const response = await fetch('/api/auth/telegram/info');
      const data = await response.json();
      
      if (data.success && data.botUsername) {
        // Сохраняем данные для привязки
        const username = user.username;
        const userPassword = password;
        
        // Создаем iframe для виджета
        const widgetFrame = document.createElement('iframe');
        widgetFrame.id = 'telegram-bind-widget-iframe';
        widgetFrame.frameBorder = '0';
        widgetFrame.scrolling = 'no';
        widgetFrame.width = '100%';
        widgetFrame.height = '54px';
        widgetFrame.style.overflow = 'hidden';
        
        // Формируем URL для виджета
        const widgetUrl = `https://oauth.telegram.org/embed/${data.botUsername}?origin=${encodeURIComponent(window.location.origin)}&return_to=${encodeURIComponent(window.location.origin)}&size=large&radius=8&request_access=write&lang=ru`;
        
        // Устанавливаем источник для IFrame
        widgetFrame.src = widgetUrl;
        
        // Очищаем контейнер
        widgetContainer.innerHTML = '';
        
        // Добавляем IFrame в контейнер
        widgetContainer.appendChild(widgetFrame);
        
        // Обработчик сообщений от iframe
        const messageHandler = async function(event) {
          if (event.origin === 'https://oauth.telegram.org') {
            try {
              if (event.data && typeof event.data === 'string' && event.data.startsWith('{')) {
                const telegramUser = JSON.parse(event.data);
                
                // Проверяем, что это объект пользователя от Telegram
                if (telegramUser && telegramUser.id && telegramUser.first_name) {
                  // Отключаем обработчик сообщений
                  window.removeEventListener('message', messageHandler);
                  
                  try {
                    // Привязываем Telegram к аккаунту
                    const result = await bindTelegramWithWidget(telegramUser, username, userPassword);
                    
                    if (result.success) {
                      // Обновляем информацию о пользователе
                      const updatedUser = {
                        ...user,
                        telegramId: telegramUser.id,
                        authType: 'telegram'
                      };
                      
                      // Сохраняем обновленные данные
                      localStorage.setItem('user', JSON.stringify(updatedUser));
                      
                      // Обновляем профиль
                      bindContainer.innerHTML = '<div class="bind-success">✅ Telegram аккаунт успешно привязан!</div>';
                      
                      // Добавляем кнопку закрытия
                      bindContainer.appendChild(closeButton);
                      
                      // Обновляем отображение после небольшой задержки
                      setTimeout(() => {
                        bindContainer.remove();
                        showUserProfile(updatedUser);
                      }, 2000);
                    } else {
                      bindContainer.innerHTML = `<div class="bind-error">❌ ${result.error || 'Ошибка привязки'}</div>`;
                      bindContainer.appendChild(closeButton);
                    }
                  } catch (error) {
                    bindContainer.innerHTML = `<div class="bind-error">❌ ${error.message || 'Ошибка привязки'}</div>`;
                    bindContainer.appendChild(closeButton);
                  }
                }
              }
            } catch (error) {
              // Ошибка обработки данных
            }
          }
        };
        
        // Добавляем обработчик сообщений
        window.addEventListener('message', messageHandler);
      } else {
        bindContainer.innerHTML = '<div class="bind-error">❌ Не удалось получить информацию о Telegram боте</div>';
        bindContainer.appendChild(closeButton);
      }
    } catch (error) {
      bindContainer.innerHTML = '<div class="bind-error">❌ Ошибка загрузки Telegram виджета</div>';
      bindContainer.appendChild(closeButton);
    }
  }
  
  // Проверяем, авторизован ли пользователь
  if (isAuthenticated()) {
    const user = getCurrentUser();
    showUserProfile(user);
  }
  
  return modal;
} 