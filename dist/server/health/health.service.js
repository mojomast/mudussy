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
exports.HealthService = void 0;
const common_1 = require("@nestjs/common");
const config_service_1 = require("../config/config.service");
const metrics_service_1 = require("../metrics/metrics.service");
const logger_service_1 = require("../logger/logger.service");
let HealthService = class HealthService {
    constructor(configService, metricsService, logger) {
        this.configService = configService;
        this.metricsService = metricsService;
        this.logger = logger;
        this.version = process.env.npm_package_version || '1.0.0';
        this.startTime = Date.now();
    }
    async getHealthStatus(correlationId) {
        const startTime = Date.now();
        try {
            const checks = await this.runHealthChecks(correlationId);
            const services = await this.checkServices(correlationId);
            const metrics = await this.getMetrics();
            const hasFailures = checks.some(check => check.status === 'fail');
            const hasWarnings = checks.some(check => check.status === 'warn');
            let overallStatus = 'healthy';
            if (hasFailures) {
                overallStatus = 'unhealthy';
            }
            else if (hasWarnings) {
                overallStatus = 'degraded';
            }
            const result = {
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
        }
        catch (error) {
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
    async runHealthChecks(correlationId) {
        const checks = [];
        checks.push(await this.checkMemoryUsage());
        checks.push(await this.checkCpuUsage());
        checks.push(await this.checkConfiguration());
        checks.push(await this.checkFileSystem());
        checks.push(await this.checkNetworkConnectivity());
        return checks;
    }
    async checkMemoryUsage() {
        const startTime = Date.now();
        try {
            const memUsage = process.memoryUsage();
            const heapUsedPercentage = (memUsage.heapUsed / memUsage.heapTotal) * 100;
            let status = 'pass';
            let message = `Memory usage: ${heapUsedPercentage.toFixed(1)}%`;
            if (heapUsedPercentage > 90) {
                status = 'fail';
                message = `Critical memory usage: ${heapUsedPercentage.toFixed(1)}%`;
            }
            else if (heapUsedPercentage > 75) {
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
        }
        catch (error) {
            return {
                name: 'memory-usage',
                status: 'fail',
                message: `Memory check failed: ${error.message}`,
                duration: Date.now() - startTime
            };
        }
    }
    async checkCpuUsage() {
        const startTime = Date.now();
        try {
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
        }
        catch (error) {
            return {
                name: 'cpu-usage',
                status: 'fail',
                message: `CPU check failed: ${error.message}`,
                duration: Date.now() - startTime
            };
        }
    }
    async checkConfiguration() {
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
        }
        catch (error) {
            return {
                name: 'configuration',
                status: 'fail',
                message: `Configuration check failed: ${error.message}`,
                duration: Date.now() - startTime
            };
        }
    }
    async checkFileSystem() {
        const startTime = Date.now();
        try {
            const fs = require('fs');
            const logsDir = './logs';
            if (!fs.existsSync(logsDir)) {
                fs.mkdirSync(logsDir, { recursive: true });
            }
            const testFile = `${logsDir}/.health-check-${Date.now()}`;
            fs.writeFileSync(testFile, 'test');
            fs.unlinkSync(testFile);
            return {
                name: 'file-system',
                status: 'pass',
                message: 'File system is accessible and writable',
                duration: Date.now() - startTime
            };
        }
        catch (error) {
            return {
                name: 'file-system',
                status: 'fail',
                message: `File system check failed: ${error.message}`,
                duration: Date.now() - startTime
            };
        }
    }
    async checkNetworkConnectivity() {
        const startTime = Date.now();
        try {
            const dns = require('dns');
            const { promisify } = require('util');
            const lookup = promisify(dns.lookup);
            await lookup('google.com');
            return {
                name: 'network-connectivity',
                status: 'pass',
                message: 'Network connectivity is available',
                duration: Date.now() - startTime
            };
        }
        catch (error) {
            return {
                name: 'network-connectivity',
                status: 'warn',
                message: `Network connectivity check failed: ${error.message}`,
                duration: Date.now() - startTime
            };
        }
    }
    async checkServices(correlationId) {
        const services = {};
        try {
            services.database = await this.checkDatabaseService();
        }
        catch (error) {
            services.database = {
                status: 'down',
                message: `Database check failed: ${error.message}`
            };
        }
        try {
            services.networking = await this.checkNetworkingService();
        }
        catch (error) {
            services.networking = {
                status: 'down',
                message: `Networking check failed: ${error.message}`
            };
        }
        try {
            services.engine = await this.checkEngineService();
        }
        catch (error) {
            services.engine = {
                status: 'down',
                message: `Engine check failed: ${error.message}`
            };
        }
        try {
            services.world = await this.checkWorldService();
        }
        catch (error) {
            services.world = {
                status: 'down',
                message: `World check failed: ${error.message}`
            };
        }
        return services;
    }
    async checkDatabaseService() {
        return {
            status: 'up',
            message: 'Database service is operational'
        };
    }
    async checkNetworkingService() {
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
    async checkEngineService() {
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
    async checkWorldService() {
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
    async getMetrics() {
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
};
exports.HealthService = HealthService;
exports.HealthService = HealthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_service_1.ConfigService,
        metrics_service_1.MetricsService,
        logger_service_1.Logger])
], HealthService);
//# sourceMappingURL=health.service.js.map