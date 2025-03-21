// Конфигурация клиентского приложения

// URL API сервера
export const API_URL = import.meta.env.PROD ? 'https://secretplace.su/api' : '/api';

// Настройки дебага
export const DEBUG = import.meta.env.DEV;

// Настройки приложения
export const APP_CONFIG = {
  // Название сайта
  siteName: 'SecretPlace.su',
  
  // Адрес Minecraft сервера
  minecraftServer: 'play.secretplace.su',
  
  // Порт Minecraft сервера
  minecraftPort: 25565,
  
  // Социальные сети
  social: {
    discord: 'https://discord.com/invite/Q9sSfEpZrb',
    telegram: 'https://t.me/+VlOy7UKB6Ng2ZTdi',
    email: 'info@secretplace.su'
  }
}; 