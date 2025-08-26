import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { MetricsService } from '../metrics/metrics.service';
import { RequestWithCorrelation } from './correlation-id.middleware';

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  constructor(private readonly metricsService: MetricsService) {}

  use(req: RequestWithCorrelation, res: Response, next: NextFunction) {
    const startTime = Date.now();

    // Track active connections
    this.metricsService.incrementActiveConnections();

    // Record metrics on finish (successful or errored responses)
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      this.metricsService.recordHttpRequest(
        req.method,
        // Prefer originalUrl to include route params; fall back to path
        (req as Request).originalUrl || req.path,
        res.statusCode,
        duration
      );
      this.metricsService.decrementActiveConnections();
    });

    // Safety net: ensure active connection gauge decrements even if connection closes early
    res.on('close', () => {
      this.metricsService.decrementActiveConnections();
    });

    next();
  }
}