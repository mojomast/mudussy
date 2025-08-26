import { NestMiddleware } from '@nestjs/common';
import { Response, NextFunction } from 'express';
import { MetricsService } from '../metrics/metrics.service';
import { RequestWithCorrelation } from './correlation-id.middleware';
export declare class MetricsMiddleware implements NestMiddleware {
    private readonly metricsService;
    constructor(metricsService: MetricsService);
    use(req: RequestWithCorrelation, res: Response, next: NextFunction): void;
}
