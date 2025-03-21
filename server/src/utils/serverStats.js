// Утилиты для генерации статистики сервера

/**
 * Генерирует историю онлайна сервера
 * @param {string} period - Период (day, week, month)
 * @returns {Array} - История онлайна
 */
function generateServerOnlineHistory(period = 'day') {
  // В реальном приложении здесь был бы запрос к БД
  // Для примера генерируем тестовые данные
  const history = [];
  const now = new Date();
  let totalPoints = 24; // По умолчанию за день
  
  // Определяем количество точек и интервал между ними
  switch (period.toLowerCase()) {
    case 'week':
      totalPoints = 7 * 24; // Неделя, точки каждый час
      break;
    case 'month':
      totalPoints = 30; // Месяц, точки каждый день
      break;
    default:
      totalPoints = 24; // День, точки каждый час
  }
  
  // Генерируем данные
  for (let i = 0; i < totalPoints; i++) {
    const timestamp = new Date(now);
    
    if (period.toLowerCase() === 'month') {
      // Для месяца - отступаем по дням
      timestamp.setDate(timestamp.getDate() - (totalPoints - i - 1));
      timestamp.setHours(12, 0, 0, 0); // Полдень
    } else {
      // Для дня и недели - отступаем по часам
      timestamp.setHours(timestamp.getHours() - (totalPoints - i - 1), 0, 0, 0);
    }
    
    // Базовое количество игроков + случайное отклонение
    let baseValue;
    const hour = timestamp.getHours();
    
    // Моделируем суточные колебания (меньше ночью, больше вечером)
    if (hour >= 22 || hour < 6) {
      baseValue = 5; // Ночь
    } else if (hour >= 17 && hour < 22) {
      baseValue = 20; // Вечер - пик
    } else {
      baseValue = 10; // День
    }
    
    // Для выходных дней увеличиваем онлайн
    const dayOfWeek = timestamp.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) { // Суббота и воскресенье
      baseValue *= 1.5;
    }
    
    // Добавляем случайность
    const randomFactor = 0.3; // 30% случайности
    const value = Math.round(baseValue * (1 + (Math.random() * 2 - 1) * randomFactor));
    
    history.push({
      timestamp: timestamp.toISOString(),
      value: Math.max(0, value) // Не менее 0 игроков
    });
  }
  
  return history;
}

module.exports = {
  generateServerOnlineHistory
}; 