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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthController = void 0;
const common_1 = require("@nestjs/common");
const health_service_1 = require("./health.service");
const metrics_service_1 = require("../metrics/metrics.service");
const config_service_1 = require("../config/config.service");
const logger_service_1 = require("../logger/logger.service");
let HealthController = class HealthController {
    constructor(healthService, metricsService, configService, logger) {
        this.healthService = healthService;
        this.metricsService = metricsService;
        this.configService = configService;
        this.logger = logger;
    }
    async getHealth(res) {
        const correlationId = this.logger.generateCorrelationId();
        const startTime = Date.now();
        try {
            const healthStatus = await this.healthService.getHealthStatus(correlationId);
            const statusCode = this.getStatusCode(healthStatus);
            res.status(statusCode);
            res.set('X-Health-Status', healthStatus.status);
            res.set('X-Health-Check-Time', healthStatus.timestamp);
            this.metricsService.recordHttpRequest('GET', '/health', statusCode, Date.now() - startTime);
            res.json(healthStatus);
        }
        catch (error) {
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
    async getLiveness(res) {
        const correlationId = this.logger.generateCorrelationId();
        const startTime = Date.now();
        try {
            const isLive = await this.checkLiveness();
            const statusCode = isLive ? 200 : 503;
            res.status(statusCode);
            res.set('X-Health-Status', isLive ? 'healthy' : 'unhealthy');
            this.metricsService.recordHttpRequest('GET', '/health/live', statusCode, Date.now() - startTime);
            res.json({
                status: isLive ? 'healthy' : 'unhealthy',
                timestamp: new Date().toISOString(),
                uptime: Date.now() - global.startTime || 0
            });
        }
        catch (error) {
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
    async getReadiness(res) {
        const correlationId = this.logger.generateCorrelationId();
        const startTime = Date.now();
        try {
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
        }
        catch (error) {
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
    async getMetrics(res) {
        const correlationId = this.logger.generateCorrelationId();
        const startTime = Date.now();
        try {
            const metrics = await this.metricsService.getMetrics();
            this.metricsService.recordHttpRequest('GET', '/health/metrics', 200, Date.now() - startTime);
            res.send(metrics);
        }
        catch (error) {
            this.logger.logError('metrics-endpoint', error, correlationId, {
                component: 'health',
                operation: 'metrics-endpoint'
            });
            res.status(500).send(`# Error generating metrics: ${error.message}`);
        }
    }
    async getSpecificCheck(checkName, res) {
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
        }
        catch (error) {
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
    getStatusCode(healthStatus) {
        switch (healthStatus.status) {
            case 'healthy':
                return 200;
            case 'degraded':
                return 200;
            case 'unhealthy':
                return 503;
            default:
                return 503;
        }
    }
    async checkLiveness() {
        return true;
    }
    async checkReadiness() {
        try {
            const healthStatus = await this.healthService.getHealthStatus();
            return healthStatus.status !== 'unhealthy';
        }
        catch (error) {
            this.logger.logError('readiness-check', error, undefined, {
                component: 'health',
                operation: 'readiness-check'
            });
            return false;
        }
    }
};
exports.HealthController = HealthController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.Header)('Content-Type', 'application/json'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "getHealth", null);
__decorate([
    (0, common_1.Get)('live'),
    (0, common_1.Header)('Content-Type', 'application/json'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "getLiveness", null);
__decorate([
    (0, common_1.Get)('ready'),
    (0, common_1.Header)('Content-Type', 'application/json'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "getReadiness", null);
__decorate([
    (0, common_1.Get)('metrics'),
    (0, common_1.Header)('Content-Type', 'text/plain; version=0.0.4; charset=utf-8'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "getMetrics", null);
__decorate([
    (0, common_1.Get)('checks/:checkName'),
    (0, common_1.Header)('Content-Type', 'application/json'),
    __param(0, (0, common_1.Param)('checkName')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "getSpecificCheck", null);
exports.HealthController = HealthController = __decorate([
    (0, common_1.Controller)('health'),
    __metadata("design:paramtypes", [health_service_1.HealthService,
        metrics_service_1.MetricsService,
        config_service_1.ConfigService,
        logger_service_1.Logger])
], HealthController);
//# sourceMappingURL=health.controller.js.map