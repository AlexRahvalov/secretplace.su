// HomePage.js - Компонент главной страницы
import { createElement } from '../utils/dom.js';

/**
 * Создает компонент главной страницы
 * @returns {HTMLElement} HTML-элемент главной страницы
 */
export default function HomePage() {
  // Создаем элемент героя (верхний блок)
  const hero = createElement('section', { 
    className: 'hero-section',
    style: {
      backgroundImage: 'url("/src/assets/images/background.jpg")'
    }
  }, [
    createElement('div', { className: 'hero-overlay' }),
    createElement('div', { className: 'hero-content' }, [
      createElement('h1', { className: 'hero-title' }, 'ТАЙНОЕ'),
      createElement('h2', { className: 'hero-subtitle' }, 'МЕСТЕЧКО!'),
      createElement('p', { className: 'hero-description' }, 'Уютный сервер Minecraft с дружелюбным сообществом'),
      createElement('div', { className: 'hero-actions' }, [
        createElement('button', { className: 'btn btn-primary' }, 'Начать играть'),
        createElement('a', { href: '/about', className: 'btn btn-secondary' }, 'Узнать больше')
      ])
    ])
  ]);
  
  // Создаем блок с особенностями сервера
  const features = createElement('section', { className: 'features-section' }, [
    createElement('h2', { className: 'section-title' }, 'Что нас выделяет'),
    createElement('div', { className: 'features-grid' }, [
      createElement('div', { className: 'feature-card' }, [
        createElement('div', { className: 'feature-icon survival' }, ''),
        createElement('h3', { className: 'feature-title' }, 'Выживание'),
        createElement('p', { className: 'feature-description' }, 'Классическое выживание с множеством дополнительных возможностей и плагинов.')
      ]),
      createElement('div', { className: 'feature-card' }, [
        createElement('div', { className: 'feature-icon community' }, ''),
        createElement('h3', { className: 'feature-title' }, 'Сообщество'),
        createElement('p', { className: 'feature-description' }, 'Дружелюбные игроки и активная команда администраторов.')
      ]),
      createElement('div', { className: 'feature-card' }, [
        createElement('div', { className: 'feature-icon events' }, ''),
        createElement('h3', { className: 'feature-title' }, 'События'),
        createElement('p', { className: 'feature-description' }, 'Регулярные мероприятия, конкурсы и ивенты с призами.')
      ]),
      createElement('div', { className: 'feature-card' }, [
        createElement('div', { className: 'feature-icon performance' }, ''),
        createElement('h3', { className: 'feature-title' }, 'Производительность'),
        createElement('p', { className: 'feature-description' }, 'Стабильная работа сервера без лагов и с быстрыми загрузками чанков.')
      ])
    ])
  ]);
  
  // Создаем блок с информацией о сервере
  const serverInfo = createElement('section', { className: 'server-info-section' }, [
    createElement('h2', { className: 'section-title' }, 'Информация о сервере'),
    createElement('div', { className: 'server-stats' }, [
      createElement('div', { className: 'stat-card' }, [
        createElement('div', { className: 'stat-value', id: 'online-players' }, '0'),
        createElement('div', { className: 'stat-label' }, 'Игроков онлайн')
      ]),
      createElement('div', { className: 'stat-card' }, [
        createElement('div', { className: 'stat-value', id: 'tps' }, '20'),
        createElement('div', { className: 'stat-label' }, 'TPS')
      ]),
      createElement('div', { className: 'stat-card' }, [
        createElement('div', { className: 'stat-value', id: 'uptime' }, '100%'),
        createElement('div', { className: 'stat-label' }, 'Аптайм')
      ])
    ]),
    createElement('div', { className: 'server-address' }, [
      createElement('span', { className: 'label' }, 'IP адрес: '),
      createElement('span', { className: 'value' }, 'play.secretplace.su')
    ])
  ]);
  
  // Создаем блок с последними новостями
  const news = createElement('section', { className: 'news-section' }, [
    createElement('h2', { className: 'section-title' }, 'Последние новости'),
    createElement('div', { className: 'news-list', id: 'news-container' }, [
      // Здесь будут динамически загружаться новости
      createElement('div', { className: 'news-placeholder' }, 'Загрузка новостей...')
    ])
  ]);
  
  // Создаем контейнер страницы и добавляем все секции
  const homePage = createElement('div', { className: 'home-page' }, [
    hero,
    features,
    serverInfo,
    news
  ]);
  
  // Функция для обновления информации о сервере
  function updateServerInfo() {
    fetch('/api/server/status')
      .then(response => response.json())
      .then(data => {
        document.getElementById('online-players').textContent = data.onlinePlayers;
        document.getElementById('tps').textContent = data.tps;
        document.getElementById('uptime').textContent = data.uptime;
      })
      .catch(error => console.error('Ошибка при получении статуса сервера:', error));
  }
  
  // Функция для загрузки последних новостей
  function loadLatestNews() {
    fetch('/api/news/latest')
      .then(response => response.json())
      .then(news => {
        const newsContainer = document.getElementById('news-container');
        newsContainer.innerHTML = '';
        
        if (news.length === 0) {
          newsContainer.appendChild(
            createElement('p', { className: 'no-news' }, 'Нет новостей для отображения.')
          );
          return;
        }
        
        news.forEach(item => {
          const newsItem = createElement('article', { className: 'news-item' }, [
            createElement('h3', { className: 'news-title' }, item.title),
            createElement('div', { className: 'news-meta' }, [
              createElement('span', { className: 'news-date' }, new Date(item.date).toLocaleDateString('ru-RU')),
              createElement('span', { className: 'news-author' }, item.author)
            ]),
            createElement('p', { className: 'news-excerpt' }, item.excerpt),
            createElement('a', { href: `/news/${item.id}`, className: 'news-link' }, 'Читать далее')
          ]);
          
          newsContainer.appendChild(newsItem);
        });
      })
      .catch(error => console.error('Ошибка при загрузке новостей:', error));
  }
  
  // Запускаем обновление данных после добавления страницы в DOM
  setTimeout(() => {
    updateServerInfo();
    loadLatestNews();
    
    // Обновляем информацию о сервере каждые 60 секунд
    setInterval(updateServerInfo, 60000);
  }, 0);
  
  return homePage;
} 