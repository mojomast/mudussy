import { Response } from 'express';
import { HealthService } from './health.service';
import { MetricsService } from '../metrics/metrics.service';
import { ConfigService } from '../config/config.service';
import { Logger } from '../logger/logger.service';
export declare class HealthController {
    private readonly healthService;
    private readonly metricsService;
    private readonly configService;
    private readonly logger;
    constructor(healthService: HealthService, metricsService: MetricsService, configService: ConfigService, logger: Logger);
    getHealth(res: Response): Promise<void>;
    getLiveness(res: Response): Promise<void>;
    getReadiness(res: Response): Promise<void>;
    getMetrics(res: Response): Promise<void>;
    getSpecificCheck(checkName: string, res: Response): Promise<void>;
    private getStatusCode;
    private checkLiveness;
    private checkReadiness;
}
