// Footer.js - Компонент подвала сайта
import { createElement } from '../utils/dom.js';
import { getRepositoryUrl } from '../services/appService.js';
import { getMultipleConfigs } from '../services/configService.js';

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
      createElement('span', { className: 'repo-icon' }, '')
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
  
  // Создаем центральный блок с ссылками
  const centerBlock = createElement('div', { className: 'footer-block' }, [
    createElement('div', { className: 'footer-heading' }, 'Ссылки'),
    createElement('ul', { className: 'footer-links' }, [
      createElement('li', {}, createElement('a', { href: '/rules' }, 'Правила')),
      createElement('li', {}, createElement('a', { href: '/about' }, 'О сервере')),
      createElement('li', {}, createElement('a', { href: '/donate' }, 'Поддержать')),
      createElement('li', {}, createElement('a', { href: '/admin' }, 'Панель администратора'))
    ])
  ]);
  
  // Создаем блок с контактами (с временными ссылками)
  const rightBlock = createElement('div', { className: 'footer-block' }, [
    createElement('div', { className: 'footer-heading' }, 'Контакты'),
    createElement('ul', { className: 'footer-links', id: 'contact-links' }, [
      createElement('li', {}, createElement('a', { href: '#', id: 'discord-link', target: '_blank' }, 'Discord')),
      createElement('li', {}, createElement('a', { href: '#', id: 'telegram-link', target: '_blank' }, 'Telegram')),
      createElement('li', {}, createElement('a', { href: '#', id: 'email-link' }, 'Email'))
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
  
  // Загружаем контактные данные из конфигурации
  loadContactInfo();
  
  /**
   * Загружает контактные данные из конфигурации и обновляет ссылки
   */
  async function loadContactInfo() {
    try {
      // Загружаем конфигурации для контактов
      const configs = await getMultipleConfigs([
        'contact_discord',
        'contact_telegram',
        'contact_email'
      ]);
      
      // Обновляем ссылку на Discord
      if (configs.contact_discord) {
        const discordLink = document.getElementById('discord-link');
        if (discordLink) {
          // Проверяем, содержит ли ссылка полный URL
          let discordUrl = configs.contact_discord;
          if (!discordUrl.startsWith('http')) {
            // Если это только код приглашения
            if (!discordUrl.includes('discord.com') && !discordUrl.includes('discord.gg')) {
              discordUrl = `https://discord.gg/${discordUrl}`;
            } else {
              discordUrl = `https://${discordUrl}`;
            }
          }
          discordLink.href = discordUrl;
        }
      }
      
      // Обновляем ссылку на Telegram
      if (configs.contact_telegram) {
        const telegramLink = document.getElementById('telegram-link');
        if (telegramLink) {
          // Проверяем, содержит ли ссылка полный URL
          let telegramUrl = configs.contact_telegram;
          if (!telegramUrl.startsWith('http')) {
            // Если это только код приглашения или имя канала
            if (!telegramUrl.includes('t.me')) {
              telegramUrl = `https://t.me/${telegramUrl}`;
            } else {
              telegramUrl = `https://${telegramUrl}`;
            }
          }
          telegramLink.href = telegramUrl;
        }
      }
      
      // Обновляем ссылку на Email
      if (configs.contact_email) {
        const emailLink = document.getElementById('email-link');
        if (emailLink) {
          // Проверяем, содержит ли значение уже mailto:
          let emailUrl = configs.contact_email;
          if (!emailUrl.startsWith('mailto:')) {
            emailUrl = `mailto:${emailUrl}`;
          }
          emailLink.href = emailUrl;
        }
      }
    } catch (error) {
      console.error('Ошибка при загрузке контактной информации:', error);
    }
  }
  
  return footer;
} 