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
    
    // Создаем скрипт для виджета
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', botName);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '8');
    script.setAttribute('data-request-access', 'write');
    script.setAttribute('data-userpic', 'false');
    script.setAttribute('data-onauth', 'window.onTelegramAuth(user)');
    
    // Добавляем скрипт в контейнер
    container.appendChild(script);
    
    // Создаем глобальную функцию обратного вызова
    window.onTelegramAuth = function(user) {
      handleTelegramAuth(user);
    };
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
      const result = await loginWithTelegramWidget(user);
      
      // Если пользователь успешно авторизовался
      if (result.user && result.session) {
        // Показываем профиль пользователя
        showUserProfile(result);
      } else if (result.needsBinding) {
        // Если требуется привязка аккаунта, сохраняем данные Telegram
        sessionStorage.setItem('telegramBindData', JSON.stringify(result.telegramData));
        
        // Показываем сообщение о необходимости привязки
        errorContainer.innerHTML = 
          'Ваш Telegram аккаунт не привязан к учетной записи.<br>' +
          'Войдите, используя логин и пароль, затем нажмите кнопку "Привязать Telegram".';
      }
    } catch (error) {
      errorContainer.textContent = error.message || 'Ошибка авторизации через Telegram';
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
  
  // Показывает профиль пользователя после авторизации
  function showUserProfile(userData) {
    // Скрываем форму
    form.style.display = 'none';
    
    // Очищаем профиль
    userProfile.innerHTML = '';
    userProfile.style.display = 'block';
    
    // Заголовок профиля
    const profileTitle = createElement('h2', { className: 'profile-title' }, 'Профиль пользователя');
    
    // Имя пользователя
    const username = createElement('p', { className: 'profile-username' }, [
      createElement('strong', {}, 'Имя пользователя: '),
      createElement('span', {}, userData.user.username)
    ]);
    
    // UUID пользователя
    const uuid = createElement('p', { className: 'profile-uuid' }, [
      createElement('strong', {}, 'UUID: '),
      createElement('span', {}, userData.user.uuid)
    ]);
    
    // Информация о сессии
    const session = createElement('p', { className: 'profile-session' }, [
      createElement('strong', {}, 'Сессия до: '),
      createElement('span', {}, new Date(userData.session.expiration).toLocaleString())
    ]);
    
    // Кнопка выхода
    const logoutButton = createElement('button', { 
      className: 'btn-logout',
      onClick: handleLogout
    }, 'Выйти');
    
    // Кнопка привязки Telegram (если есть данные для привязки)
    let bindTelegramButton = null;
    const telegramBindData = sessionStorage.getItem('telegramBindData');
    
    if (telegramBindData) {
      bindTelegramButton = createElement('button', { 
        className: 'btn-bind-telegram',
        onClick: handleBindTelegram
      }, 'Привязать Telegram');
    }
    
    // Добавляем элементы в профиль
    userProfile.appendChild(profileTitle);
    userProfile.appendChild(username);
    userProfile.appendChild(uuid);
    userProfile.appendChild(session);
    
    if (bindTelegramButton) {
      userProfile.appendChild(bindTelegramButton);
    }
    
    userProfile.appendChild(logoutButton);
  }
  
  // Обработчик привязки Telegram
  async function handleBindTelegram() {
    try {
      // Получаем данные Telegram из сессии
      const telegramBindDataStr = sessionStorage.getItem('telegramBindData');
      if (!telegramBindDataStr) {
        alert('Нет данных для привязки Telegram аккаунта');
        return;
      }
      
      // Парсим данные
      const telegramData = JSON.parse(telegramBindDataStr);
      
      // Получаем текущего пользователя
      const currentUser = getCurrentUser();
      if (!currentUser || !currentUser.user || !currentUser.user.username) {
        alert('Необходимо войти в систему');
        return;
      }
      
      // Запрашиваем пароль
      const password = prompt('Введите ваш пароль для подтверждения привязки Telegram:');
      if (!password) return;
      
      // Привязываем аккаунт
      const result = await bindTelegramWithWidget(telegramData, currentUser.user.username, password);
      
      if (result && result.success) {
        // Очищаем данные привязки
        sessionStorage.removeItem('telegramBindData');
        
        // Успешно привязали
        alert(`Telegram аккаунт успешно привязан к ${result.username}`);
        
        // Перезагружаем страницу
        window.location.reload();
      } else {
        alert('Не удалось привязать Telegram аккаунт');
      }
    } catch (error) {
      alert(error.message || 'Ошибка при привязке Telegram аккаунта');
    }
  }
  
  // Проверяем, авторизован ли пользователь
  if (isAuthenticated()) {
    const user = getCurrentUser();
    showUserProfile(user);
  }
  
  return modal;
} 