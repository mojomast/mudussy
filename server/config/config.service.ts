import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class ConfigService {
  constructor(private readonly configService: NestConfigService) {}

  /**
   * Get a configuration value by key with optional default
   */
  get<T = string>(key: string, defaultValue?: T): T {
    const value = this.configService.get<T>(key);
    return value !== undefined ? value : (defaultValue as T);
  }

  /**
   * Get a number configuration value
   */
  getNumber(key: string, defaultValue?: number): number {
    const value = this.get(key, defaultValue?.toString());
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? defaultValue || 0 : parsed;
    }
    return defaultValue || 0;
  }

  /**
   * Get a boolean configuration value
   */
  getBoolean(key: string, defaultValue = false): boolean {
    const value = this.get(key);
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return defaultValue;
  }

  /**
   * Get server configuration
   */
  getServerConfig() {
    return {
      port: this.getNumber('MUD_PORT', 4000),
      host: this.get('MUD_HOST', '0.0.0.0'),
      environment: this.get('NODE_ENV', 'development'),
    };
  }

  /**
   * Get engine configuration
   */
  getEngineConfig() {
    return {
      maxEntities: this.getNumber('MUD_MAX_ENTITIES', 10000),
      tickInterval: this.getNumber('MUD_TICK_INTERVAL', 1000),
      enablePlugins: this.getBoolean('MUD_ENABLE_PLUGINS', true),
      saveInterval: this.getNumber('MUD_SAVE_INTERVAL', 300000),
      logLevel: this.get('MUD_LOG_LEVEL', 'info'),
    };
  }

  /**
   * Get networking configuration
   */
  getNetworkingConfig() {
    return {
      enableNetworking: this.getBoolean('MUD_ENABLE_NETWORKING', true),
      networkHost: this.get('MUD_NETWORK_HOST', '0.0.0.0'),
      networkPort: this.getNumber('MUD_NETWORK_PORT', 4000),
      maxConnections: this.getNumber('MUD_MAX_CONNECTIONS', 100),
      connectionTimeout: this.getNumber('MUD_CONNECTION_TIMEOUT', 30000),
      idleTimeout: this.getNumber('MUD_IDLE_TIMEOUT', 300000),
      rateLimitWindow: this.getNumber('MUD_RATE_LIMIT_WINDOW', 10000),
      rateLimitMaxRequests: this.getNumber('MUD_RATE_LIMIT_MAX_REQUESTS', 20),
    };
  }

  /**
   * Get world configuration
   */
  getWorldConfig() {
    return {
      enableWorld: this.getBoolean('MUD_ENABLE_WORLD', true),
      worldPath: this.get('MUD_WORLD_PATH', './engine/modules/world/content'),
      defaultRoomId: this.get('MUD_DEFAULT_ROOM_ID', 'tavern'),
      maxItemsPerRoom: this.getNumber('MUD_MAX_ITEMS_PER_ROOM', 50),
      maxPlayersPerRoom: this.getNumber('MUD_MAX_PLAYERS_PER_ROOM', 10),
      allowRoomCreation: this.getBoolean('MUD_ALLOW_ROOM_CREATION', false),
    };
  }
}