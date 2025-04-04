/**
 * Интерфейс для хранения информации о статусе Minecraft сервера
 */
export interface ServerStatus {
  online: boolean;
  onlinePlayers: number;
  maxPlayers: number;
  version?: string;
  motd?: string;
  latency?: number;
} 