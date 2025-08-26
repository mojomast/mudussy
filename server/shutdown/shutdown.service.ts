import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { MetricsService } from '../metrics/metrics.service';
import { Logger as AppLogger } from '../logger/logger.service';

@Injectable()
export class ShutdownService implements OnModuleDestroy {
  private shutdownTimeout: NodeJS.Timeout;
  private isShuttingDown = false;
  private readonly shutdownGracePeriod: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly metricsService: MetricsService,
    private readonly logger: AppLogger
  ) {
    this.shutdownGracePeriod = this.configService.getNumber('MUD_SHUTDOWN_GRACE_PERIOD', 30000);

    // Register shutdown handlers
    this.registerShutdownHandlers();
  }

  private registerShutdownHandlers() {
    // Handle SIGTERM (standard termination signal)
    process.on('SIGTERM', async () => {
      await this.handleShutdown('SIGTERM');
    });

    // Handle SIGINT (Ctrl+C)
    process.on('SIGINT', async () => {
      await this.handleShutdown('SIGINT');
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', async (error) => {
      this.logger.logError('uncaught-exception', error, undefined, {
        component: 'shutdown',
        operation: 'uncaught-exception'
      });
      await this.handleShutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', async (reason, promise) => {
      this.logger.logError('unhandled-rejection', reason as Error, undefined, {
        component: 'shutdown',
        operation: 'unhandled-rejection',
        promise: promise.toString()
      });
      await this.handleShutdown('unhandledRejection');
    });

    this.logger.logWithContext('info', 'Shutdown handlers registered', {
      component: 'shutdown',
      operation: 'initialization',
      gracePeriod: this.shutdownGracePeriod
    });
  }

  private async handleShutdown(signal: string) {
    if (this.isShuttingDown) {
      this.logger.logWithContext('warning', `Shutdown already in progress, ignoring ${signal}`, {
        component: 'shutdown',
        operation: 'shutdown',
        signal
      });
      return;
    }

    this.isShuttingDown = true;

    const correlationId = this.logger.generateCorrelationId();

    this.logger.logWithContext('info', `Received ${signal}, initiating graceful shutdown`, {
      correlationId,
      component: 'shutdown',
      operation: 'shutdown-start',
      signal,
      gracePeriod: this.shutdownGracePeriod
    });

    try {
      // Set shutdown timeout
      this.shutdownTimeout = setTimeout(() => {
        this.logger.logWithContext('error', 'Shutdown timeout reached, forcing exit', {
          correlationId,
          component: 'shutdown',
          operation: 'shutdown-timeout',
          signal
        });
        process.exit(1);
      }, this.shutdownGracePeriod);

      // Perform graceful shutdown steps
      await this.performGracefulShutdown(correlationId);

      // Clear shutdown timeout
      clearTimeout(this.shutdownTimeout);

      this.logger.logWithContext('info', 'Graceful shutdown completed', {
        correlationId,
        component: 'shutdown',
        operation: 'shutdown-complete',
        signal
      });

      process.exit(0);

    } catch (error) {
      this.logger.logError('shutdown-error', error, correlationId, {
        component: 'shutdown',
        operation: 'shutdown-error',
        signal
      });

      process.exit(1);
    }
  }

  private async performGracefulShutdown(correlationId: string): Promise<void> {
    const shutdownSteps = [
      { name: 'Stop accepting new connections', fn: this.stopAcceptingConnections.bind(this) },
      { name: 'Wait for active connections to close', fn: this.waitForConnections.bind(this) },
      { name: 'Save game state', fn: this.saveGameState.bind(this) },
      { name: 'Close database connections', fn: this.closeDatabaseConnections.bind(this) },
      { name: 'Flush metrics', fn: this.flushMetrics.bind(this) },
      { name: 'Close logger', fn: this.closeLogger.bind(this) }
    ];

    for (const step of shutdownSteps) {
      try {
        this.logger.logWithContext('info', `Shutdown step: ${step.name}`, {
          correlationId,
          component: 'shutdown',
          operation: 'shutdown-step',
          step: step.name
        });

        await step.fn(correlationId);

        this.logger.logWithContext('info', `Shutdown step completed: ${step.name}`, {
          correlationId,
          component: 'shutdown',
          operation: 'shutdown-step-complete',
          step: step.name
        });
      } catch (error) {
        this.logger.logError(`shutdown-step-${step.name}`, error, correlationId, {
          component: 'shutdown',
          operation: 'shutdown-step-error',
          step: step.name
        });
        // Continue with other steps even if one fails
      }
    }
  }

  private async stopAcceptingConnections(correlationId: string): Promise<void> {
    // Signal to stop accepting new connections
    // This would typically involve setting a flag that the networking layer checks
    global.acceptingConnections = false;

    // If you have a web server, you could close it here
    // Example: if (this.httpServer) this.httpServer.close();
  }

  private async waitForConnections(correlationId: string): Promise<void> {
    // Wait for active connections to naturally close
    // You might want to implement connection counting here
    const waitTime = Math.min(this.shutdownGracePeriod * 0.5, 10000); // Wait up to 50% of grace period or 10 seconds

    this.logger.logWithContext('info', `Waiting ${waitTime}ms for connections to close`, {
      correlationId,
      component: 'shutdown',
      operation: 'wait-connections'
    });

    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  private async saveGameState(correlationId: string): Promise<void> {
    // Save any in-memory game state to persistent storage
    // This would involve calling your persistence layer
    this.logger.logWithContext('info', 'Saving game state...', {
      correlationId,
      component: 'shutdown',
      operation: 'save-game-state'
    });

    // Example: await this.gameStateService.saveAll();
  }

  private async closeDatabaseConnections(correlationId: string): Promise<void> {
    // Close any database connections
    this.logger.logWithContext('info', 'Closing database connections...', {
      correlationId,
      component: 'shutdown',
      operation: 'close-database'
    });

    // Example: await this.databaseService.close();
  }

  private async flushMetrics(correlationId: string): Promise<void> {
    // Flush any pending metrics
    this.logger.logWithContext('info', 'Flushing metrics...', {
      correlationId,
      component: 'shutdown',
      operation: 'flush-metrics'
    });

    // The prom-client handles this automatically, but you could add custom flushing here
  }

  private async closeLogger(correlationId: string): Promise<void> {
    // Close logger transports if needed
    this.logger.logWithContext('info', 'Closing logger...', {
      correlationId,
      component: 'shutdown',
      operation: 'close-logger'
    });

    // Winston handles this automatically, but you could add custom cleanup here
  }

  // Method to check if shutdown is in progress
  isShutdownInProgress(): boolean {
    return this.isShuttingDown;
  }

  // Method to get shutdown status
  getShutdownStatus() {
    return {
      isShuttingDown: this.isShuttingDown,
      gracePeriod: this.shutdownGracePeriod,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage()
    };
  }

  onModuleDestroy() {
    // This is called when the module is being destroyed
    // We don't need to do anything here as we handle shutdown in the signal handlers
  }
}