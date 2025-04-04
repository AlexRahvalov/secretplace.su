// Экспорты из подключения к БД
export { mainDatabaseConnection, DatabaseConnection } from './connection';
export type { DatabaseConfig } from './connection';

// Экспорты модулей
export { serverModule } from './modules/server';
export type { ServerData } from './modules/server';

// Экспорты контроллеров
export { BaseAuthController } from './controllers/base-auth-controller';
export type { BaseUser, AuthResult } from './controllers/base-auth-controller';
export { EasyAuthController } from './controllers/easy-auth-controller';
export { authControllerFactory } from './controllers/auth-controller-factory';

// Экспорты обработчиков ошибок
export { DatabaseErrorHandler, DatabaseErrorType } from './error-handlers/database-error-handler';
export type { DatabaseError } from './error-handlers/database-error-handler';

// Экспорты утилит
export { DatabaseInitializer } from './utils/database-initializer';

// Экспорты middleware
export { databaseErrorMiddleware, catchDatabaseErrors } from './middleware/database-error-middleware'; 