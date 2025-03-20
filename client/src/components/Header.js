// Header.js - Компонент шапки сайта
import { createElement } from '../utils/dom.js';
import LoginForm from './LoginForm.js';
import { isAuthenticated, getCurrentUser } from '../services/authService.js';

/**
 * Создает компонент шапки сайта
 * @returns {HTMLElement} HTML-элемент шапки
 */
export default function Header() {
  // Создаем лого
  const logo = createElement('a', 
    { 
      href: '/', 
      className: 'logo'
    }, 
    [
      createElement('img', { 
        src: '/src/assets/images/logo.svg', 
        alt: 'Логотип'
      }),
      'SecretPlace.su'
    ]
  );
  
  // Создаем навигационное меню
  const nav = createElement('nav', { className: 'main-nav' }, [
    createElement('ul', { className: 'nav-list' }, [
      createElement('li', { className: 'nav-item' }, 
        createElement('a', { 
          href: '/', 
          className: 'nav-link'
        }, 'Главная')
      ),
      createElement('li', { className: 'nav-item' }, 
        createElement('a', { 
          href: '/shop', 
          className: 'nav-link'
        }, 'Магазин')
      ),
      createElement('li', { className: 'nav-item' }, 
        createElement('a', { 
          href: '/forum', 
          className: 'nav-link'
        }, 'Форум')
      )
    ])
  ]);
  
  // Проверяем, авторизован ли пользователь
  const user = isAuthenticated() ? getCurrentUser() : null;
  
  // Определяем текст кнопки кабинета в зависимости от статуса авторизации
  const cabinetText = user ? `${user.displayName}` : 'Кабинет →';
  
  // Кнопки действий в шапке
  const headerButtons = createElement('div', { className: 'header-buttons' }, [
    createElement('button', { 
      className: 'header-btn header-btn-dark',
      onClick: openLoginForm
    }, cabinetText),
    createElement('a', { 
      href: '/play',
      className: 'header-btn header-btn-primary'
    }, [
      'Начать игру ',
      createElement('span', { className: 'download-icon' }, '↓')
    ])
  ]);
  
  // Создаем элемент шапки
  const header = createElement('header', { className: 'site-header' }, [
    createElement('div', { className: 'header-container' }, [
      logo,
      nav,
      headerButtons
    ])
  ]);
  
  // Контейнер для модального окна авторизации
  const modalContainer = document.createElement('div');
  modalContainer.id = 'login-modal-container';
  
  // Инициализация переменных для отслеживания скролла
  let lastScrollY = window.scrollY;
  let ticking = false;
  
  // Функция обработки скролла
  const handleScroll = () => {
    const currentScrollY = window.scrollY;
    
    if (currentScrollY > lastScrollY) {
      // Скролл вниз - скрываем шапку
      header.style.transform = 'translate(-50%, -150%)';
    } else {
      // Скролл вверх - показываем шапку
      header.style.transform = 'translateX(-50%)';
    }
    
    lastScrollY = currentScrollY;
    ticking = false;
  };
  
  // Добавляем слушатель события скролла
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(handleScroll);
      ticking = true;
    }
  });
  
  // Функция для открытия формы авторизации
  function openLoginForm(event) {
    event.preventDefault();
    
    // Удаляем предыдущую форму, если она существует
    if (document.querySelector('.auth-modal')) {
      document.querySelector('.auth-modal').remove();
    }
    
    // Создаем и добавляем форму авторизации
    const loginForm = LoginForm({
      onClose: () => {
        if (document.querySelector('.auth-modal')) {
          document.querySelector('.auth-modal').remove();
        }
      }
    });
    
    document.body.appendChild(loginForm);
  }
  
  return header;
} 