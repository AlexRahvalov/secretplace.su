// Менеджер авторизации, который управляет адаптерами
const fs = require('fs');
const path = require('path');
const configModel = require('../models/configModel');

/**
 * Менеджер авторизации, который управляет различными адаптерами
 */
class AuthManager {
  constructor() {
    this.adapters = [];
    this.activeAdapter = null;
    this.config = {
      defaultAdapter: 'easyauth',
      enableMultipleAdapters: true
    };
  }
  
  /**
   * Инициализация менеджера и загрузка адаптеров
   */
  async init() {
    try {
      // Загружаем конфигурацию
      await this.loadConfig();
      
      // Загружаем адаптеры из директории
      await this.loadAdapters();
      
      // Выбираем активный адаптер
      await this.selectActiveAdapter();
      
      return this.activeAdapter !== null;
    } catch (error) {
      console.error('Ошибка при инициализации менеджера авторизации:', error);
      return false;
    }
  }
  
  /**
   * Загрузить конфигурацию из базы данных
   */
  async loadConfig() {
    try {
      // Получаем настройки авторизации из базы данных
      const config = await configModel.getConfigByNames([
        'auth_default_adapter',
        'auth_enable_multiple_adapters'
      ]);
      
      // Устанавливаем значения конфигурации
      if (config.auth_default_adapter) {
        this.config.defaultAdapter = config.auth_default_adapter;
      }
      
      if (config.auth_enable_multiple_adapters) {
        this.config.enableMultipleAdapters = config.auth_enable_multiple_adapters === 'true';
      }
      
      console.log('✅ Загружена конфигурация авторизации:', this.config);
    } catch (error) {
      console.error('Ошибка при загрузке конфигурации авторизации:', error);
      // Используем значения по умолчанию
    }
  }
  
  /**
   * Загрузить все доступные адаптеры авторизации
   */
  async loadAdapters() {
    try {
      this.adapters = [];
      
      // Путь к директории с адаптерами
      const adaptersDir = path.join(__dirname, 'adapters');
      
      // Проверяем, существует ли директория
      if (fs.existsSync(adaptersDir)) {
        // Получаем список файлов в директории
        const files = fs.readdirSync(adaptersDir);
        
        // Фильтруем только JavaScript файлы и не берем интерфейс
        const adapterFiles = files.filter(file => 
          file.endsWith('.js') && file !== 'AuthAdapterInterface.js'
        );
        
        // Загружаем каждый адаптер
        for (const file of adapterFiles) {
          try {
            const AdapterClass = require(path.join(adaptersDir, file));
            const adapter = new AdapterClass();
            
            // Проверяем, что адаптер валидный
            if (adapter.getName && adapter.isAvailable && adapter.authenticateUser) {
              // Проверяем доступность адаптера
              if (await adapter.isAvailable()) {
                this.adapters.push(adapter);
                console.log(`✅ Загружен адаптер авторизации: ${adapter.getName()}`);
              }
            }
          } catch (error) {
            console.error(`Ошибка при загрузке адаптера из файла ${file}:`, error);
          }
        }
      }
      
      console.log(`Загружено адаптеров авторизации: ${this.adapters.length}`);
    } catch (error) {
      console.error('Ошибка при загрузке адаптеров авторизации:', error);
      throw error;
    }
  }
  
  /**
   * Выбрать активный адаптер авторизации
   */
  async selectActiveAdapter() {
    try {
      if (this.adapters.length === 0) {
        console.error('Нет доступных адаптеров авторизации');
        return false;
      }
      
      // Сначала пытаемся найти адаптер по умолчанию из конфигурации
      const defaultAdapter = this.adapters.find(
        adapter => adapter.getName().toLowerCase() === this.config.defaultAdapter.toLowerCase()
      );
      
      if (defaultAdapter) {
        this.activeAdapter = defaultAdapter;
        console.log(`✅ Выбран адаптер авторизации по умолчанию: ${defaultAdapter.getName()}`);
        return true;
      }
      
      // Если не нашли адаптер по умолчанию, берем первый доступный
      this.activeAdapter = this.adapters[0];
      console.log(`⚠️ Адаптер авторизации по умолчанию не найден, используется: ${this.activeAdapter.getName()}`);
      
      return true;
    } catch (error) {
      console.error('Ошибка при выборе активного адаптера авторизации:', error);
      return false;
    }
  }
  
  /**
   * Авторизация пользователя
   * @param {string} username - Имя пользователя
   * @param {string} password - Пароль
   * @returns {Promise<Object|null>} - Данные пользователя или null при неудаче
   */
  async authenticateUser(username, password) {
    if (!this.activeAdapter) {
      console.error('❌ Нет активного адаптера авторизации');
      return null;
    }
    
    return await this.activeAdapter.authenticateUser(username, password);
  }
  
  /**
   * Получить пользователя по UUID
   * @param {string} uuid - UUID пользователя
   * @returns {Promise<Object|null>} - Данные пользователя или null при неудаче
   */
  async getUserByUuid(uuid) {
    if (!this.activeAdapter) {
      console.error('❌ Нет активного адаптера авторизации');
      return null;
    }
    
    return await this.activeAdapter.getUserByUuid(uuid);
  }
  
  /**
   * Получить имя активного адаптера
   * @returns {string|null} - Имя активного адаптера или null, если нет активного адаптера
   */
  getActiveAdapterName() {
    return this.activeAdapter ? this.activeAdapter.getName() : null;
  }
  
  /**
   * Получить список доступных адаптеров
   * @returns {Array} - Массив имен доступных адаптеров
   */
  getAvailableAdapters() {
    return this.adapters.map(adapter => adapter.getName());
  }
  
  /**
   * Получить адаптер по имени
   * @param {string} name - Имя адаптера
   * @returns {Object|null} - Адаптер или null, если не найден
   */
  getAdapterByName(name) {
    return this.adapters.find(adapter => 
      adapter.getName().toLowerCase() === name.toLowerCase()
    ) || null;
  }
}

// Создаем и экспортируем единственный экземпляр менеджера авторизации
const authManager = new AuthManager();

module.exports = authManager; 