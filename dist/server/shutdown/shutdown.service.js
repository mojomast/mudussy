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
exports.ShutdownService = void 0;
const common_1 = require("@nestjs/common");
const config_service_1 = require("../config/config.service");
const metrics_service_1 = require("../metrics/metrics.service");
const logger_service_1 = require("../logger/logger.service");
let ShutdownService = class ShutdownService {
    constructor(configService, metricsService, logger) {
        this.configService = configService;
        this.metricsService = metricsService;
        this.logger = logger;
        this.isShuttingDown = false;
        this.shutdownGracePeriod = this.configService.getNumber('MUD_SHUTDOWN_GRACE_PERIOD', 30000);
        this.registerShutdownHandlers();
    }
    registerShutdownHandlers() {
        process.on('SIGTERM', async () => {
            await this.handleShutdown('SIGTERM');
        });
        process.on('SIGINT', async () => {
            await this.handleShutdown('SIGINT');
        });
        process.on('uncaughtException', async (error) => {
            this.logger.logError('uncaught-exception', error, undefined, {
                component: 'shutdown',
                operation: 'uncaught-exception'
            });
            await this.handleShutdown('uncaughtException');
        });
        process.on('unhandledRejection', async (reason, promise) => {
            this.logger.logError('unhandled-rejection', reason, undefined, {
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
    async handleShutdown(signal) {
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
            this.shutdownTimeout = setTimeout(() => {
                this.logger.logWithContext('error', 'Shutdown timeout reached, forcing exit', {
                    correlationId,
                    component: 'shutdown',
                    operation: 'shutdown-timeout',
                    signal
                });
                process.exit(1);
            }, this.shutdownGracePeriod);
            await this.performGracefulShutdown(correlationId);
            clearTimeout(this.shutdownTimeout);
            this.logger.logWithContext('info', 'Graceful shutdown completed', {
                correlationId,
                component: 'shutdown',
                operation: 'shutdown-complete',
                signal
            });
            process.exit(0);
        }
        catch (error) {
            this.logger.logError('shutdown-error', error, correlationId, {
                component: 'shutdown',
                operation: 'shutdown-error',
                signal
            });
            process.exit(1);
        }
    }
    async performGracefulShutdown(correlationId) {
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
            }
            catch (error) {
                this.logger.logError(`shutdown-step-${step.name}`, error, correlationId, {
                    component: 'shutdown',
                    operation: 'shutdown-step-error',
                    step: step.name
                });
            }
        }
    }
    async stopAcceptingConnections(correlationId) {
        global.acceptingConnections = false;
    }
    async waitForConnections(correlationId) {
        const waitTime = Math.min(this.shutdownGracePeriod * 0.5, 10000);
        this.logger.logWithContext('info', `Waiting ${waitTime}ms for connections to close`, {
            correlationId,
            component: 'shutdown',
            operation: 'wait-connections'
        });
        await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    async saveGameState(correlationId) {
        this.logger.logWithContext('info', 'Saving game state...', {
            correlationId,
            component: 'shutdown',
            operation: 'save-game-state'
        });
    }
    async closeDatabaseConnections(correlationId) {
        this.logger.logWithContext('info', 'Closing database connections...', {
            correlationId,
            component: 'shutdown',
            operation: 'close-database'
        });
    }
    async flushMetrics(correlationId) {
        this.logger.logWithContext('info', 'Flushing metrics...', {
            correlationId,
            component: 'shutdown',
            operation: 'flush-metrics'
        });
    }
    async closeLogger(correlationId) {
        this.logger.logWithContext('info', 'Closing logger...', {
            correlationId,
            component: 'shutdown',
            operation: 'close-logger'
        });
    }
    isShutdownInProgress() {
        return this.isShuttingDown;
    }
    getShutdownStatus() {
        return {
            isShuttingDown: this.isShuttingDown,
            gracePeriod: this.shutdownGracePeriod,
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage()
        };
    }
    onModuleDestroy() {
    }
};
exports.ShutdownService = ShutdownService;
exports.ShutdownService = ShutdownService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_service_1.ConfigService,
        metrics_service_1.MetricsService,
        logger_service_1.Logger])
], ShutdownService);
//# sourceMappingURL=shutdown.service.js.map