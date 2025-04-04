import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

// Функция для проверки валидности токена
const isValidToken = (token) => {
  if (!token || typeof token !== 'string') return false;
  
  // Проверяем базовую структуру JWT токена (header.payload.signature)
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  
  try {
    // Декодируем payload (вторую часть токена)
    const payload = JSON.parse(atob(parts[1]));
    console.log('JWT payload:', payload);
    
    // Проверяем наличие необходимых полей в соответствии с JwtPayload из документации
    if (!payload.userId || !payload.username || !payload.serverId) {
      console.warn('Отсутствуют обязательные поля в токене:', { payload });
      return false;
    }
    
    // Проверяем срок действия токена
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      console.warn('Токен истек:', { 
        exp: payload.exp, 
        now: Math.floor(Date.now() / 1000),
        diff: payload.exp - Math.floor(Date.now() / 1000)
      });
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Ошибка при проверке токена:', error);
    return false;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // При инициализации проверяем localStorage на наличие данных авторизации
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    
    if (storedUser && storedToken && isValidToken(storedToken)) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    } else {
      // Если токен невалиден, очищаем хранилище
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('isAuthenticated');
    }
    
    setLoading(false);
  }, []);

  // Функция для авторизации
  const login = (userData, authToken) => {
    if (!isValidToken(authToken)) {
      throw new Error('Некорректный формат токена');
    }
    
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', authToken);
    localStorage.setItem('isAuthenticated', 'true');
  };

  // Функция для выхода
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('isAuthenticated');
  };

  // Проверка авторизации
  const isAuthenticated = !!token && isValidToken(token);

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Хук для использования контекста
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 