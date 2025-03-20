// NotFoundPage.js - Компонент страницы 404 (не найдено)
import { createElement } from '../utils/dom.js';

/**
 * Создает компонент страницы "Не найдено"
 * @returns {HTMLElement} HTML-элемент страницы 404
 */
export default function NotFoundPage() {
  const notFoundPage = createElement('div', { className: 'not-found-page' }, [
    createElement('div', { className: 'not-found-content' }, [
      createElement('h1', { className: 'not-found-title' }, '404'),
      createElement('h2', { className: 'not-found-subtitle' }, 'Страница не найдена'),
      createElement('p', { className: 'not-found-text' }, 'Страница, которую вы ищете, не существует или была удалена.'),
      createElement('a', { href: '/', className: 'btn btn-primary' }, 'Вернуться на главную')
    ])
  ]);
  
  return notFoundPage;
} 