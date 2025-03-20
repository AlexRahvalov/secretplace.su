/**
 * Интерфейс для адаптеров авторизации различных плагинов/модов Minecraft
 * Каждый адаптер должен реализовать эти методы
 */
class AuthAdapterInterface {
  /**
   * Авторизация пользователя
   * @param {string} username - Имя пользователя
   * @param {string} password - Пароль
   * @returns {Promise<Object|null>} - Данные пользователя или null при неудаче
   */
  async authenticateUser(username, password) {
    throw new Error('Метод authenticateUser должен быть реализован в адаптере');
  }
  
  /**
   * Получить пользователя по UUID
   * @param {string} uuid - UUID пользователя
   * @returns {Promise<Object|null>} - Данные пользователя или null при неудаче
   */
  async getUserByUuid(uuid) {
    throw new Error('Метод getUserByUuid должен быть реализован в адаптере');
  }
  
  /**
   * Получить имя адаптера
   * @returns {string} - Имя адаптера
   */
  getName() {
    throw new Error('Метод getName должен быть реализован в адаптере');
  }
  
  /**
   * Проверка доступности адаптера
   * @returns {Promise<boolean>} - true, если адаптер доступен
   */
  async isAvailable() {
    throw new Error('Метод isAvailable должен быть реализован в адаптере');
  }
}

module.exports = AuthAdapterInterface; 