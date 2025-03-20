// Header.js - Компонент шапки сайта
import { createElement } from '../utils/dom.js';

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
    'SecretPlace.su'
  );
  
  // Создаем навигационное меню
  const nav = createElement('nav', { className: 'main-nav' }, [
    createElement('ul', { className: 'nav-list' }, [
      createElement('li', { className: 'nav-item' }, 
        createElement('a', { href: '/', className: 'nav-link' }, 'Главная')
      ),
      createElement('li', { className: 'nav-item' }, 
        createElement('a', { href: '/about', className: 'nav-link' }, 'О сервере')
      ),
      createElement('li', { className: 'nav-item' }, 
        createElement('a', { href: '/rules', className: 'nav-link' }, 'Правила')
      ),
      createElement('li', { className: 'nav-item' }, 
        createElement('a', { href: '/donate', className: 'nav-link' }, 'Поддержать')
      )
    ])
  ]);
  
  // Кнопка для мобильной навигации
  const mobileNavButton = createElement('button', 
    { 
      className: 'mobile-nav-toggle',
      type: 'button',
      ariaLabel: 'Открыть меню',
      onClick: () => document.body.classList.toggle('menu-open') 
    }, 
    [
      createElement('span', { className: 'sr-only' }, 'Переключить меню'),
      createElement('span', { className: 'burger-icon' }, '')
    ]
  );
  
  // Создаем элемент шапки
  const header = createElement('header', 
    { 
      className: 'site-header',
      style: {
        margin: '20px',
        padding: '15px 30px',
        borderRadius: '15px',
        backdropFilter: 'blur(10px)',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }
    }, 
    [
      createElement('div', { className: 'header-container' }, [
        logo,
        nav,
        mobileNavButton
      ])
    ]
  );
  
  return header;
} 