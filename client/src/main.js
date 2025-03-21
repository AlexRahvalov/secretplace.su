// main.js - Точка входа в приложение
import { APP_CONFIG } from './config.js';
import { createRouter } from './utils/router.js';
import { renderApp } from './utils/dom.js';
import { getVersion } from './services/appService.js';

// Загружаем компоненты
import Header from './components/Header.js';
import Footer from './components/Footer.js';
import HomePage from './pages/HomePage.js';
import NotFoundPage from './pages/NotFoundPage.js';

// Инициализация приложения
async function initApp() {
  // Определяем маршруты
  const routes = [
    { path: '/', component: HomePage },
    { path: '*', component: NotFoundPage }
  ];

  // Создаем роутер
  const router = createRouter(routes);
  
  // Получаем версию приложения
  const version = await getVersion();
  
  // Рендерим приложение
  renderApp({
    header: Header({ title: APP_CONFIG.siteName }),
    content: router.getCurrentView(),
    footer: Footer({ version, social: APP_CONFIG.social })
  });
  
  // Слушаем изменения маршрута
  window.addEventListener('popstate', () => {
    renderApp({
      header: Header({ title: APP_CONFIG.siteName }),
      content: router.getCurrentView(),
      footer: Footer({ version, social: APP_CONFIG.social })
    });
  });
}

// Запускаем приложение при загрузке DOM
document.addEventListener('DOMContentLoaded', initApp); 