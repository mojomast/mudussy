"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let ConfigService = class ConfigService {
    constructor(configService) {
        this.configService = configService;
    }
    get(key, defaultValue) {
        const value = this.configService.get(key);
        return value !== undefined ? value : defaultValue;
    }
    getNumber(key, defaultValue) {
        const value = this.get(key, defaultValue?.toString());
        if (typeof value === 'number')
            return value;
        if (typeof value === 'string') {
            const parsed = parseFloat(value);
            return isNaN(parsed) ? defaultValue || 0 : parsed;
        }
        return defaultValue || 0;
    }
    getBoolean(key, defaultValue = false) {
        const value = this.get(key);
        if (typeof value === 'boolean')
            return value;
        if (typeof value === 'string') {
            return value.toLowerCase() === 'true';
        }
        return defaultValue;
    }
    getServerConfig() {
        return {
            port: this.getNumber('MUD_PORT', 4000),
            host: this.get('MUD_HOST', '0.0.0.0'),
            environment: this.get('NODE_ENV', 'development'),
        };
    }
    getEngineConfig() {
        return {
            maxEntities: this.getNumber('MUD_MAX_ENTITIES', 10000),
            tickInterval: this.getNumber('MUD_TICK_INTERVAL', 1000),
            enablePlugins: this.getBoolean('MUD_ENABLE_PLUGINS', true),
            saveInterval: this.getNumber('MUD_SAVE_INTERVAL', 300000),
            logLevel: this.get('MUD_LOG_LEVEL', 'info'),
        };
    }
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
};
exports.ConfigService = ConfigService;
exports.ConfigService = ConfigService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ConfigService);
//# sourceMappingURL=config.service.js.map