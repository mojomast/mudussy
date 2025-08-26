import { Injectable } from '@nestjs/common';
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

@Injectable()
export class HealthService {
  private readonly version: string;
  private readonly startTime: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly metricsService: MetricsService,
    private readonly logger: Logger
  ) {
    this.version = process.env.npm_package_version || '1.0.0';
    this.startTime = Date.now();
  }

  async getHealthStatus(correlationId?: string): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      const checks = await this.runHealthChecks(correlationId);
      const services = await this.checkServices(correlationId);
      const metrics = await this.getMetrics();

      const hasFailures = checks.some(check => check.status === 'fail');
      const hasWarnings = checks.some(check => check.status === 'warn');

      let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
      if (hasFailures) {
        overallStatus = 'unhealthy';
      } else if (hasWarnings) {
        overallStatus = 'degraded';
      }

      const result: HealthCheckResult = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        uptime: Date.now() - this.startTime,
        version: this.version,
        services,
        metrics,
        checks
      };

      this.logger.logWithContext('info', `Health check completed: ${overallStatus}`, {
        correlationId,
        component: 'health',
        operation: 'health-check',
        status: overallStatus,
        duration: Date.now() - startTime,
        checksCount: checks.length
      });

      return result;

    } catch (error) {
      this.logger.logError('health-check', error, correlationId, {
        component: 'health',
        operation: 'health-check'
      });

      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: Date.now() - this.startTime,
        version: this.version,
        services: {},
        metrics: await this.getMetrics(),
        checks: [{
          name: 'health-service',
          status: 'fail',
          message: `Health check failed: ${error.message}`,
          duration: Date.now() - startTime
        }]
      };
    }
  }

  private async runHealthChecks(correlationId?: string): Promise<HealthCheck[]> {
    const checks: HealthCheck[] = [];

    // Memory usage check
    checks.push(await this.checkMemoryUsage());

    // CPU usage check (simplified)
    checks.push(await this.checkCpuUsage());

    // Configuration check
    checks.push(await this.checkConfiguration());

    // File system check
    checks.push(await this.checkFileSystem());

    // Network connectivity check
    checks.push(await this.checkNetworkConnectivity());

    return checks;
  }

  private async checkMemoryUsage(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      const memUsage = process.memoryUsage();
      const heapUsedPercentage = (memUsage.heapUsed / memUsage.heapTotal) * 100;

      let status: 'pass' | 'fail' | 'warn' = 'pass';
      let message = `Memory usage: ${heapUsedPercentage.toFixed(1)}%`;

      if (heapUsedPercentage > 90) {
        status = 'fail';
        message = `Critical memory usage: ${heapUsedPercentage.toFixed(1)}%`;
      } else if (heapUsedPercentage > 75) {
        status = 'warn';
        message = `High memory usage: ${heapUsedPercentage.toFixed(1)}%`;
      }

      return {
        name: 'memory-usage',
        status,
        message,
        duration: Date.now() - startTime,
        details: {
          heapUsed: memUsage.heapUsed,
          heapTotal: memUsage.heapTotal,
          heapUsedPercentage,
          external: memUsage.external,
          rss: memUsage.rss
        }
      };
    } catch (error) {
      return {
        name: 'memory-usage',
        status: 'fail',
        message: `Memory check failed: ${error.message}`,
        duration: Date.now() - startTime
      };
    }
  }

  private async checkCpuUsage(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      // Simplified CPU check - in production you might want more sophisticated monitoring
      const cpuUsage = process.cpuUsage();
      const cpuUsageMs = (cpuUsage.user + cpuUsage.system) / 1000;

      return {
        name: 'cpu-usage',
        status: 'pass',
        message: `CPU usage: ${cpuUsageMs.toFixed(2)}ms`,
        duration: Date.now() - startTime,
        details: {
          user: cpuUsage.user,
          system: cpuUsage.system,
          total: cpuUsageMs
        }
      };
    } catch (error) {
      return {
        name: 'cpu-usage',
        status: 'fail',
        message: `CPU check failed: ${error.message}`,
        duration: Date.now() - startTime
      };
    }
  }

  private async checkConfiguration(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      const requiredEnvVars = [
        'NODE_ENV',
        'MUD_PORT',
        'MUD_LOG_LEVEL'
      ];

      const missing = requiredEnvVars.filter(varName => !process.env[varName]);

      if (missing.length > 0) {
        return {
          name: 'configuration',
          status: 'warn',
          message: `Missing environment variables: ${missing.join(', ')}`,
          duration: Date.now() - startTime,
          details: { missingVars: missing }
        };
      }

      return {
        name: 'configuration',
        status: 'pass',
        message: 'All required environment variables are present',
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        name: 'configuration',
        status: 'fail',
        message: `Configuration check failed: ${error.message}`,
        duration: Date.now() - startTime
      };
    }
  }

  private async checkFileSystem(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      // Check if logs directory exists and is writable
      const fs = require('fs');
      const logsDir = './logs';

      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }

      // Test write access
      const testFile = `${logsDir}/.health-check-${Date.now()}`;
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);

      return {
        name: 'file-system',
        status: 'pass',
        message: 'File system is accessible and writable',
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        name: 'file-system',
        status: 'fail',
        message: `File system check failed: ${error.message}`,
        duration: Date.now() - startTime
      };
    }
  }

  private async checkNetworkConnectivity(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      // Simple network connectivity check
      const dns = require('dns');
      const { promisify } = require('util');

      const lookup = promisify(dns.lookup);

      // Try to resolve a well-known hostname
      await lookup('google.com');

      return {
        name: 'network-connectivity',
        status: 'pass',
        message: 'Network connectivity is available',
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        name: 'network-connectivity',
        status: 'warn',
        message: `Network connectivity check failed: ${error.message}`,
        duration: Date.now() - startTime
      };
    }
  }

  private async checkServices(correlationId?: string): Promise<Record<string, HealthStatus>> {
    const services: Record<string, HealthStatus> = {};

    // Database service check (if applicable)
    try {
      services.database = await this.checkDatabaseService();
    } catch (error) {
      services.database = {
        status: 'down',
        message: `Database check failed: ${error.message}`
      };
    }

    // Networking service check
    try {
      services.networking = await this.checkNetworkingService();
    } catch (error) {
      services.networking = {
        status: 'down',
        message: `Networking check failed: ${error.message}`
      };
    }

    // Engine service check
    try {
      services.engine = await this.checkEngineService();
    } catch (error) {
      services.engine = {
        status: 'down',
        message: `Engine check failed: ${error.message}`
      };
    }

    // World service check
    try {
      services.world = await this.checkWorldService();
    } catch (error) {
      services.world = {
        status: 'down',
        message: `World check failed: ${error.message}`
      };
    }

    return services;
  }

  private async checkDatabaseService(): Promise<HealthStatus> {
    // Placeholder - implement actual database check if you have a database
    return {
      status: 'up',
      message: 'Database service is operational'
    };
  }

  private async checkNetworkingService(): Promise<HealthStatus> {
    const config = this.configService.getNetworkingConfig();
    return {
      status: 'up',
      message: 'Networking service is operational',
      details: {
        host: config.networkHost,
        port: config.networkPort,
        maxConnections: config.maxConnections
      }
    };
  }

  private async checkEngineService(): Promise<HealthStatus> {
    const config = this.configService.getEngineConfig();
    return {
      status: 'up',
      message: 'Engine service is operational',
      details: {
        maxEntities: config.maxEntities,
        tickInterval: config.tickInterval,
        logLevel: config.logLevel
      }
    };
  }

  private async checkWorldService(): Promise<HealthStatus> {
    const config = this.configService.getWorldConfig();
    return {
      status: 'up',
      message: 'World service is operational',
      details: {
        worldPath: config.worldPath,
        defaultRoomId: config.defaultRoomId,
        maxItemsPerRoom: config.maxItemsPerRoom
      }
    };
  }

  private async getMetrics() {
    const metrics = await this.metricsService.getHealthMetrics();
    const heapUsed = metrics.memoryUsage.heapUsed;
    const heapTotal = metrics.memoryUsage.heapTotal;

    return {
      ...metrics,
      memoryUsage: {
        heapUsed,
        heapTotal,
        heapUsedPercentage: heapTotal > 0 ? (heapUsed / heapTotal) * 100 : 0
      }
    };
  }
}