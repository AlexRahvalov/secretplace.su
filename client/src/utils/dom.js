// dom.js - Утилиты для работы с DOM

/**
 * Создает DOM-элемент с указанными атрибутами и дочерними элементами
 * @param {string} tag - Тег элемента 
 * @param {Object} props - Атрибуты элемента
 * @param {Array|String} children - Дочерние элементы или текст
 * @returns {HTMLElement} Созданный элемент
 */
export function createElement(tag, props = {}, children = []) {
  const element = document.createElement(tag);
  
  // Устанавливаем атрибуты
  Object.keys(props).forEach(key => {
    if (key === 'className') {
      element.className = props[key];
    } else if (key === 'style' && typeof props[key] === 'object') {
      Object.assign(element.style, props[key]);
    } else if (key.startsWith('on') && typeof props[key] === 'function') {
      const eventName = key.substring(2).toLowerCase();
      element.addEventListener(eventName, props[key]);
    } else {
      element.setAttribute(key, props[key]);
    }
  });
  
  // Добавляем дочерние элементы
  if (Array.isArray(children)) {
    children.forEach(child => {
      appendChild(element, child);
    });
  } else if (children !== null && children !== undefined) {
    appendChild(element, children);
  }
  
  return element;
}

/**
 * Добавляет дочерний элемент к родительскому
 * @param {HTMLElement} parent - Родительский элемент
 * @param {HTMLElement|String} child - Дочерний элемент или текст
 */
function appendChild(parent, child) {
  if (child === null || child === undefined) return;
  
  if (child instanceof HTMLElement) {
    parent.appendChild(child);
  } else {
    parent.appendChild(document.createTextNode(child.toString()));
  }
}

/**
 * Рендерит приложение в DOM
 * @param {Object} options - Объект с компонентами приложения
 */
export function renderApp({ header, content, footer }) {
  const app = document.getElementById('app');
  
  // Очищаем содержимое
  app.innerHTML = '';
  
  // Добавляем компоненты
  if (header) {
    app.appendChild(header);
  }
  
  if (content) {
    const mainElement = createElement('main', { className: 'main-content' }, content);
    app.appendChild(mainElement);
  }
  
  if (footer) {
    app.appendChild(footer);
  }
} 