// main.js - Точка входа в приложение
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
    header: Header(),
    content: router.getCurrentView(),
    footer: Footer({ version })
  });
  
  // Слушаем изменения маршрута
  window.addEventListener('popstate', () => {
    renderApp({
      header: Header(),
      content: router.getCurrentView(),
      footer: Footer({ version })
    });
  });
}

// Запускаем приложение при загрузке DOM
document.addEventListener('DOMContentLoaded', initApp); 