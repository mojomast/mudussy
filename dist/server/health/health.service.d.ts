import { ConfigService } from '../config/config.service';
import { MetricsService } from '../metrics/metrics.service';
import { Logger } from '../logger/logger.service';
export interface HealthCheckResult {
    status: 'healthy' | 'unhealthy' | 'degraded';
    timestamp: string;
    uptime: number;
    version: string;
    services: {
        database?: HealthStatus;
        networking?: HealthStatus;
        engine?: HealthStatus;
        world?: HealthStatus;
    };
    metrics: {
        activeConnections: number;
        activePlayers: number;
        totalCommands: number;
        totalErrors: number;
        memoryUsage: {
            heapUsed: number;
            heapTotal: number;
            heapUsedPercentage: number;
        };
    };
    checks: HealthCheck[];
}
export interface HealthStatus {
    status: 'up' | 'down' | 'degraded';
    responseTime?: number;
    message?: string;
    details?: Record<string, any>;
}
export interface HealthCheck {
    name: string;
    status: 'pass' | 'fail' | 'warn';
    message?: string;
    duration?: number;
    details?: Record<string, any>;
}
export declare class HealthService {
    private readonly configService;
    private readonly metricsService;
    private readonly logger;
    private readonly version;
    private readonly startTime;
    constructor(configService: ConfigService, metricsService: MetricsService, logger: Logger);
    getHealthStatus(correlationId?: string): Promise<HealthCheckResult>;
    private runHealthChecks;
    private checkMemoryUsage;
    private checkCpuUsage;
    private checkConfiguration;
    private checkFileSystem;
    private checkNetworkConnectivity;
    private checkServices;
    private checkDatabaseService;
    private checkNetworkingService;
    private checkEngineService;
    private checkWorldService;
    private getMetrics;
}
