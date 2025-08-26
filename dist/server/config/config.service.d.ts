import { ConfigService as NestConfigService } from '@nestjs/config';
export declare class ConfigService {
    private readonly configService;
    constructor(configService: NestConfigService);
    get<T = string>(key: string, defaultValue?: T): T;
    getNumber(key: string, defaultValue?: number): number;
    getBoolean(key: string, defaultValue?: boolean): boolean;
    getServerConfig(): {
        port: number;
        host: string;
        environment: string;
    };
    getEngineConfig(): {
        maxEntities: number;
        tickInterval: number;
        enablePlugins: boolean;
        saveInterval: number;
        logLevel: string;
    };
    getNetworkingConfig(): {
        enableNetworking: boolean;
        networkHost: string;
        networkPort: number;
        maxConnections: number;
        connectionTimeout: number;
        idleTimeout: number;
        rateLimitWindow: number;
        rateLimitMaxRequests: number;
    };
    getWorldConfig(): {
        enableWorld: boolean;
        worldPath: string;
        defaultRoomId: string;
        maxItemsPerRoom: number;
        maxPlayersPerRoom: number;
        allowRoomCreation: boolean;
    };
}
