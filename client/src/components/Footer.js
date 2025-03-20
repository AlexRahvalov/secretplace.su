// Footer.js - Компонент подвала сайта
import { createElement } from '../utils/dom.js';
import { getRepositoryUrl } from '../services/appService.js';

/**
 * Создает компонент подвала сайта
 * @param {Object} props - Свойства компонента
 * @param {string} props.version - Версия приложения
 * @returns {HTMLElement} HTML-элемент подвала
 */
export default function Footer({ version }) {
  // Получаем текущий год
  const currentYear = new Date().getFullYear();
  
  // Создаем элементы для нижней части подвала
  const copyright = createElement('div', { className: 'copyright' }, 
    `© ${currentYear} SecretPlace.su - Minecraft сервер. Все права защищены.`
  );
  
  // Создаем элемент версии
  const versionElement = createElement('div', { className: 'version' }, 
    `Версия: ${version}`
  );
  
  // Создаем ссылку на GitHub репозиторий
  const repoLink = createElement('a', 
    { 
      id: 'repo-link',
      href: '#',
      className: 'repo-link',
      target: '_blank',
      rel: 'noopener noreferrer' 
    }, 
    [
      createElement('span', { className: 'repo-icon' }, ''),
      'GitHub'
    ]
  );
  
  // Получаем URL репозитория и устанавливаем в ссылку
  getRepositoryUrl().then(url => {
    repoLink.href = url;
  });
  
  // Создаем блоки для подвала
  const leftBlock = createElement('div', { className: 'footer-block' }, [
    createElement('div', { className: 'footer-heading' }, 'О нас'),
    createElement('p', {}, 'SecretPlace.su - уютный Minecraft сервер с дружелюбным комьюнити и множеством возможностей для игроков любого уровня.')
  ]);
  
  const centerBlock = createElement('div', { className: 'footer-block' }, [
    createElement('div', { className: 'footer-heading' }, 'Ссылки'),
    createElement('ul', { className: 'footer-links' }, [
      createElement('li', {}, createElement('a', { href: '/rules' }, 'Правила')),
      createElement('li', {}, createElement('a', { href: '/about' }, 'О сервере')),
      createElement('li', {}, createElement('a', { href: '/donate' }, 'Поддержать')),
      createElement('li', {}, createElement('a', { href: '/admin' }, 'Панель администратора'))
    ])
  ]);
  
  const rightBlock = createElement('div', { className: 'footer-block' }, [
    createElement('div', { className: 'footer-heading' }, 'Контакты'),
    createElement('ul', { className: 'footer-links' }, [
      createElement('li', {}, createElement('a', { href: 'https://discord.gg' }, 'Discord')),
      createElement('li', {}, createElement('a', { href: 'https://t.me' }, 'Telegram')),
      createElement('li', {}, createElement('a', { href: 'mailto:info@secretplace.su' }, 'Email'))
    ])
  ]);
  
  // Создаем верхнюю часть подвала с блоками
  const topSection = createElement('div', { className: 'footer-top' }, [
    leftBlock,
    centerBlock,
    rightBlock
  ]);
  
  // Создаем нижнюю часть подвала с копирайтом и версией
  const bottomSection = createElement('div', { className: 'footer-bottom' }, [
    copyright,
    createElement('div', { className: 'footer-meta' }, [
      versionElement,
      repoLink
    ])
  ]);
  
  // Создаем элемент подвала
  const footer = createElement('footer', 
    { 
      className: 'site-footer',
      style: {
        padding: '30px 20px 15px',
        backgroundColor: '#222',
        color: '#f5f5f5'
      }
    }, 
    [
      createElement('div', { className: 'footer-container' }, [
        topSection,
        bottomSection
      ])
    ]
  );
  
  return footer;
} 