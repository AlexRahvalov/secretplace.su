import type { BaseUser } from '../../database/controllers/base-auth-controller';
import type { SignOptions } from 'jsonwebtoken';

// Типы для запросов авторизации
export interface LoginRequest {
  username: string;
  password: string;
  serverId: number; // ID игрового сервера
}

export interface RegisterRequest extends LoginRequest {
  confirmPassword: string;
}

// Типы для ответов авторизации
export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: BaseUser;
  serverId?: number; // ID сервера, на котором произошла авторизация
}

// Тип для JWT payload
export interface JWTPayload {
  userId: number | string;
  username: string;
  serverId: number; // ID сервера, на котором авторизован пользователь
  iat?: number;
  exp?: number;
}

// Тип для конфигурации JWT
export interface JWTConfig {
  secret: string;
  expiresIn: SignOptions['expiresIn'];
}

// Тип для конфигурации сервиса авторизации
export interface AuthServiceConfig {
  jwt: JWTConfig;
  cookieName: string;
  cookieOptions: {
    httpOnly: boolean;
    secure: boolean;
    maxAge: number;
    sameSite: 'strict' | 'lax' | 'none';
  };
} 