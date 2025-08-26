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
exports.MetricsService = void 0;
const common_1 = require("@nestjs/common");
const prom_client_1 = require("prom-client");
const config_service_1 = require("../config/config.service");
const logger_service_1 = require("../logger/logger.service");
let MetricsService = class MetricsService {
    constructor(configService, logger) {
        this.configService = configService;
        this.logger = logger;
        this.httpRequestsTotal = new prom_client_1.Counter({
            name: 'mud_http_requests_total',
            help: 'Total number of HTTP requests',
            labelNames: ['method', 'path', 'status_code']
        });
        this.httpRequestDuration = new prom_client_1.Histogram({
            name: 'mud_http_request_duration_seconds',
            help: 'Duration of HTTP requests in seconds',
            labelNames: ['method', 'path'],
            buckets: [0.1, 0.5, 1, 2, 5, 10]
        });
        this.activeConnections = new prom_client_1.Gauge({
            name: 'mud_active_connections',
            help: 'Number of active connections'
        });
        this.activePlayers = new prom_client_1.Gauge({
            name: 'mud_active_players',
            help: 'Number of active players'
        });
        this.totalCommands = new prom_client_1.Counter({
            name: 'mud_commands_total',
            help: 'Total number of commands processed',
            labelNames: ['command_type', 'session_id']
        });
        this.commandDuration = new prom_client_1.Histogram({
            name: 'mud_command_duration_seconds',
            help: 'Duration of command processing in seconds',
            labelNames: ['command_type'],
            buckets: [0.01, 0.05, 0.1, 0.5, 1, 2]
        });
        this.engineTickDuration = new prom_client_1.Histogram({
            name: 'mud_engine_tick_duration_seconds',
            help: 'Duration of engine ticks in seconds',
            buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5]
        });
        this.memoryUsage = new prom_client_1.Gauge({
            name: 'mud_memory_usage_bytes',
            help: 'Memory usage in bytes',
            labelNames: ['type']
        });
        this.cpuUsage = new prom_client_1.Gauge({
            name: 'mud_cpu_usage_percentage',
            help: 'CPU usage percentage'
        });
        this.uptime = new prom_client_1.Gauge({
            name: 'mud_uptime_seconds',
            help: 'Application uptime in seconds'
        });
        this.errorsTotal = new prom_client_1.Counter({
            name: 'mud_errors_total',
            help: 'Total number of errors',
            labelNames: ['type', 'component']
        });
    }
    onModuleInit() {
        (0, prom_client_1.collectDefaultMetrics)({
            prefix: 'mud_node_',
            gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5]
        });
        this.startSystemMetricsCollection();
        this.logger.logWithContext('info', 'Metrics service initialized', {
            component: 'metrics',
            operation: 'initialization'
        });
    }
    startSystemMetricsCollection() {
        setInterval(() => {
            this.updateSystemMetrics();
        }, 30000);
        this.updateSystemMetrics();
    }
    updateSystemMetrics() {
        try {
            const memUsage = process.memoryUsage();
            const uptime = process.uptime();
            this.memoryUsage.set({ type: 'heap_used' }, memUsage.heapUsed);
            this.memoryUsage.set({ type: 'heap_total' }, memUsage.heapTotal);
            this.memoryUsage.set({ type: 'external' }, memUsage.external);
            this.memoryUsage.set({ type: 'rss' }, memUsage.rss);
            this.uptime.set(uptime);
            this.cpuUsage.set(0);
        }
        catch (error) {
            this.logger.logError('metrics-update', error, undefined, {
                component: 'metrics',
                operation: 'system-metrics-update'
            });
        }
    }
    recordHttpRequest(method, path, statusCode, duration) {
        this.httpRequestsTotal.inc({ method, path, status_code: statusCode.toString() });
        this.httpRequestDuration.observe({ method, path }, duration / 1000);
    }
    updateActiveConnections(count) {
        this.activeConnections.set(count);
    }
    incrementActiveConnections() {
        this.activeConnections.inc();
    }
    decrementActiveConnections() {
        this.activeConnections.dec();
    }
    updateActivePlayers(count) {
        this.activePlayers.set(count);
    }
    incrementActivePlayers() {
        this.activePlayers.inc();
    }
    decrementActivePlayers() {
        this.activePlayers.dec();
    }
    recordCommand(commandType, sessionId, duration) {
        this.totalCommands.inc({ command_type: commandType, session_id: sessionId });
        if (duration !== undefined) {
            this.commandDuration.observe({ command_type: commandType }, duration / 1000);
        }
    }
    recordEngineTick(duration) {
        this.engineTickDuration.observe(duration / 1000);
    }
    recordError(type, component) {
        this.errorsTotal.inc({ type, component });
    }
    createGauge(name, help, labelNames) {
        return new prom_client_1.Gauge({
            name: `mud_${name}`,
            help,
            labelNames
        });
    }
    createCounter(name, help, labelNames) {
        return new prom_client_1.Counter({
            name: `mud_${name}`,
            help,
            labelNames
        });
    }
    createHistogram(name, help, labelNames, buckets) {
        return new prom_client_1.Histogram({
            name: `mud_${name}`,
            help,
            labelNames,
            buckets
        });
    }
    createSummary(name, help, labelNames) {
        return new prom_client_1.Summary({
            name: `mud_${name}`,
            help,
            labelNames
        });
    }
    async getMetrics() {
        return prom_client_1.register.metrics();
    }
    async getMetricsAsJSON() {
        return prom_client_1.register.getMetricsAsJSON();
    }
    async getHealthMetrics() {
        const [activeConnections, activePlayers, totalCommands, totalErrors, uptime, memoryUsage] = await Promise.all([
            this.activeConnections.get(),
            this.activePlayers.get(),
            this.totalCommands.get(),
            this.errorsTotal.get(),
            this.uptime.get(),
            this.memoryUsage.get()
        ]);
        return {
            activeConnections: activeConnections.values[0]?.value || 0,
            activePlayers: activePlayers.values[0]?.value || 0,
            totalCommands: totalCommands.values.reduce((sum, v) => sum + v.value, 0),
            totalErrors: totalErrors.values.reduce((sum, v) => sum + v.value, 0),
            uptime: uptime.values[0]?.value || 0,
            memoryUsage: {
                heapUsed: memoryUsage.values.find(v => v.labels?.type === 'heap_used')?.value || 0,
                heapTotal: memoryUsage.values.find(v => v.labels?.type === 'heap_total')?.value || 0
            }
        };
    }
};
exports.MetricsService = MetricsService;
exports.MetricsService = MetricsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_service_1.ConfigService,
        logger_service_1.Logger])
], MetricsService);
//# sourceMappingURL=metrics.service.js.map