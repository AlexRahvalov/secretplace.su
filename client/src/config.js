// Конфигурация клиентского приложения

// URL API сервера
export const API_URL = process.env.API_URL || 'http://localhost:3001/api';

// Настройки дебага
export const DEBUG = process.env.DEBUG === 'true' || false;

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