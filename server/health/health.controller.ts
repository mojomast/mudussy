import { Controller, Get, Header, Res, Param } from '@nestjs/common';
import { Response } from 'express';
import { HealthService, HealthCheckResult } from './health.service';
import { MetricsService } from '../metrics/metrics.service';
import { ConfigService } from '../config/config.service';
import { Logger } from '../logger/logger.service';

@Controller('health')
export class HealthController {
  constructor(
    private readonly healthService: HealthService,
    private readonly metricsService: MetricsService,
    private readonly configService: ConfigService,
    private readonly logger: Logger
  ) {}

  @Get()
  @Header('Content-Type', 'application/json')
  async getHealth(@Res() res: Response): Promise<void> {
    const correlationId = this.logger.generateCorrelationId();
    const startTime = Date.now();

    try {
      const healthStatus = await this.healthService.getHealthStatus(correlationId);

      // Set appropriate HTTP status code based on health status
      const statusCode = this.getStatusCode(healthStatus);
      res.status(statusCode);

      // Add health status to response headers
      res.set('X-Health-Status', healthStatus.status);
      res.set('X-Health-Check-Time', healthStatus.timestamp);

      // Record metrics
      this.metricsService.recordHttpRequest('GET', '/health', statusCode, Date.now() - startTime);

      res.json(healthStatus);

    } catch (error) {
      this.logger.logError('health-endpoint', error, correlationId, {
        component: 'health',
        operation: 'health-endpoint'
      });

      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  }

  @Get('live')
  @Header('Content-Type', 'application/json')
  async getLiveness(@Res() res: Response): Promise<void> {
    const correlationId = this.logger.generateCorrelationId();
    const startTime = Date.now();

    try {
      // Liveness probe - simple check if the application is running
      const isLive = await this.checkLiveness();

      const statusCode = isLive ? 200 : 503;
      res.status(statusCode);

      res.set('X-Health-Status', isLive ? 'healthy' : 'unhealthy');

      this.metricsService.recordHttpRequest('GET', '/health/live', statusCode, Date.now() - startTime);

      res.json({
        status: isLive ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: Date.now() - (global as any).startTime || 0
      });

    } catch (error) {
      this.logger.logError('liveness-endpoint', error, correlationId, {
        component: 'health',
        operation: 'liveness-endpoint'
      });

      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  }

  @Get('ready')
  @Header('Content-Type', 'application/json')
  async getReadiness(@Res() res: Response): Promise<void> {
    const correlationId = this.logger.generateCorrelationId();
    const startTime = Date.now();

    try {
      // Readiness probe - check if the application is ready to serve requests
      const isReady = await this.checkReadiness();

      const statusCode = isReady ? 200 : 503;
      res.status(statusCode);

      res.set('X-Health-Status', isReady ? 'healthy' : 'unhealthy');

      this.metricsService.recordHttpRequest('GET', '/health/ready', statusCode, Date.now() - startTime);

      res.json({
        status: isReady ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        checks: isReady ? ['application-ready'] : ['application-not-ready']
      });

    } catch (error) {
      this.logger.logError('readiness-endpoint', error, correlationId, {
        component: 'health',
        operation: 'readiness-endpoint'
      });

      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  }

  @Get('metrics')
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  async getMetrics(@Res() res: Response): Promise<void> {
    const correlationId = this.logger.generateCorrelationId();
    const startTime = Date.now();

    try {
      const metrics = await this.metricsService.getMetrics();

      this.metricsService.recordHttpRequest('GET', '/health/metrics', 200, Date.now() - startTime);

      res.send(metrics);

    } catch (error) {
      this.logger.logError('metrics-endpoint', error, correlationId, {
        component: 'health',
        operation: 'metrics-endpoint'
      });

      res.status(500).send(`# Error generating metrics: ${error.message}`);
    }
  }

  @Get('checks/:checkName')
  @Header('Content-Type', 'application/json')
  async getSpecificCheck(@Param('checkName') checkName: string, @Res() res: Response): Promise<void> {
    const correlationId = this.logger.generateCorrelationId();
    const startTime = Date.now();

    try {
      const healthStatus = await this.healthService.getHealthStatus(correlationId);
      const check = healthStatus.checks.find(c => c.name === checkName);

      if (!check) {
        res.status(404).json({
          error: `Health check '${checkName}' not found`,
          availableChecks: healthStatus.checks.map(c => c.name)
        });
        return;
      }

      const statusCode = check.status === 'pass' ? 200 : check.status === 'warn' ? 200 : 503;
      res.status(statusCode);

      this.metricsService.recordHttpRequest('GET', `/health/checks/${checkName}`, statusCode, Date.now() - startTime);

      res.json({
        name: check.name,
        status: check.status,
        message: check.message,
        duration: check.duration,
        details: check.details,
        timestamp: healthStatus.timestamp
      });

    } catch (error) {
      this.logger.logError('specific-check-endpoint', error, correlationId, {
        component: 'health',
        operation: 'specific-check-endpoint',
        checkName
      });

      res.status(503).json({
        error: error.message,
        checkName
      });
    }
  }

  private getStatusCode(healthStatus: HealthCheckResult): number {
    switch (healthStatus.status) {
      case 'healthy':
        return 200;
      case 'degraded':
        return 200; // Still return 200 for degraded, but with warning status
      case 'unhealthy':
        return 503;
      default:
        return 503;
    }
  }

  private async checkLiveness(): Promise<boolean> {
    // Simple liveness check - if the application is running and responding
    return true; // Application is running if this code executes
  }

  private async checkReadiness(): Promise<boolean> {
    try {
      // Check if all critical services are available
      const healthStatus = await this.healthService.getHealthStatus();

      // Consider the application ready if it's not unhealthy
      return healthStatus.status !== 'unhealthy';
    } catch (error) {
      this.logger.logError('readiness-check', error, undefined, {
        component: 'health',
        operation: 'readiness-check'
      });
      return false;
    }
  }
}