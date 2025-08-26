import { OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { MetricsService } from '../metrics/metrics.service';
import { Logger as AppLogger } from '../logger/logger.service';
export declare class ShutdownService implements OnModuleDestroy {
    private readonly configService;
    private readonly metricsService;
    private readonly logger;
    private shutdownTimeout;
    private isShuttingDown;
    private readonly shutdownGracePeriod;
    constructor(configService: ConfigService, metricsService: MetricsService, logger: AppLogger);
    private registerShutdownHandlers;
    private handleShutdown;
    private performGracefulShutdown;
    private stopAcceptingConnections;
    private waitForConnections;
    private saveGameState;
    private closeDatabaseConnections;
    private flushMetrics;
    private closeLogger;
    isShutdownInProgress(): boolean;
    getShutdownStatus(): {
        isShuttingDown: boolean;
        gracePeriod: number;
        uptime: number;
        memoryUsage: NodeJS.MemoryUsage;
    };
    onModuleDestroy(): void;
}
