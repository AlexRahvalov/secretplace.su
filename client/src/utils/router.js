// router.js - Простой роутер для SPA

/**
 * Создает роутер для навигации по приложению
 * @param {Array} routes - Массив маршрутов {path, component}
 * @returns {Object} Объект роутера с методами
 */
export function createRouter(routes) {
  // Текущий путь
  let currentPath = window.location.pathname;
  
  // Находит компонент для текущего пути
  function findComponentForPath(path) {
    // Ищем точное совпадение
    const route = routes.find(r => r.path === path);
    
    if (route) {
      return route.component;
    }
    
    // Ищем маршрут по умолчанию (*)
    const defaultRoute = routes.find(r => r.path === '*');
    return defaultRoute ? defaultRoute.component : null;
  }
  
  /**
   * Переходит по указанному пути
   * @param {string} path - Путь для перехода
   */
  function navigate(path) {
    // Если тот же путь, ничего не делаем
    if (path === currentPath) return;
    
    // Обновляем историю браузера
    window.history.pushState(null, '', path);
    
    // Обновляем текущий путь
    currentPath = path;
    
    // Генерируем событие для перерисовки
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
  
  /**
   * Возвращает текущий компонент для отображения
   * @returns {HTMLElement} Компонент для текущего пути
   */
  function getCurrentView() {
    const Component = findComponentForPath(currentPath);
    return Component ? Component() : null;
  }
  
  // Обрабатываем клики по ссылкам внутри приложения
  document.addEventListener('click', (e) => {
    // Проверяем, что клик был по ссылке
    if (e.target.tagName === 'A' && e.target.href) {
      // Проверяем, что ссылка ведет на тот же домен
      const url = new URL(e.target.href);
      if (url.origin === window.location.origin) {
        e.preventDefault();
        navigate(url.pathname);
      }
    }
  });
  
  return {
    navigate,
    getCurrentView
  };
} 