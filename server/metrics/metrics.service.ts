import { Injectable, OnModuleInit } from '@nestjs/common';
import { register, collectDefaultMetrics, Gauge, Counter, Histogram, Summary } from 'prom-client';
import { ConfigService } from '../config/config.service';
import { Logger } from '../logger/logger.service';

@Injectable()
export class MetricsService implements OnModuleInit {
  // Request metrics
  private readonly httpRequestsTotal: Counter<string>;
  private readonly httpRequestDuration: Histogram<string>;
  private readonly activeConnections: Gauge<string>;

  // Game metrics
  private readonly activePlayers: Gauge<string>;
  private readonly totalCommands: Counter<string>;
  private readonly commandDuration: Histogram<string>;
  private readonly engineTickDuration: Histogram<string>;

  // System metrics
  private readonly memoryUsage: Gauge<string>;
  private readonly cpuUsage: Gauge<string>;
  private readonly uptime: Gauge<string>;

  // Error metrics
  private readonly errorsTotal: Counter<string>;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: Logger
  ) {
    // HTTP metrics
    this.httpRequestsTotal = new Counter({
      name: 'mud_http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'path', 'status_code']
    });

    this.httpRequestDuration = new Histogram({
      name: 'mud_http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'path'],
      buckets: [0.1, 0.5, 1, 2, 5, 10]
    });

    this.activeConnections = new Gauge({
      name: 'mud_active_connections',
      help: 'Number of active connections'
    });

    // Game metrics
    this.activePlayers = new Gauge({
      name: 'mud_active_players',
      help: 'Number of active players'
    });

    this.totalCommands = new Counter({
      name: 'mud_commands_total',
      help: 'Total number of commands processed',
      labelNames: ['command_type', 'session_id']
    });

    this.commandDuration = new Histogram({
      name: 'mud_command_duration_seconds',
      help: 'Duration of command processing in seconds',
      labelNames: ['command_type'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2]
    });

    this.engineTickDuration = new Histogram({
      name: 'mud_engine_tick_duration_seconds',
      help: 'Duration of engine ticks in seconds',
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5]
    });

    // System metrics
    this.memoryUsage = new Gauge({
      name: 'mud_memory_usage_bytes',
      help: 'Memory usage in bytes',
      labelNames: ['type']
    });

    this.cpuUsage = new Gauge({
      name: 'mud_cpu_usage_percentage',
      help: 'CPU usage percentage'
    });

    this.uptime = new Gauge({
      name: 'mud_uptime_seconds',
      help: 'Application uptime in seconds'
    });

    // Error metrics
    this.errorsTotal = new Counter({
      name: 'mud_errors_total',
      help: 'Total number of errors',
      labelNames: ['type', 'component']
    });
  }

  onModuleInit() {
    // Collect default Node.js metrics
    collectDefaultMetrics({
      prefix: 'mud_node_',
      gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5]
    });

    // Start system metrics collection
    this.startSystemMetricsCollection();

    this.logger.logWithContext('info', 'Metrics service initialized', {
      component: 'metrics',
      operation: 'initialization'
    });
  }

  private startSystemMetricsCollection() {
    // Update system metrics every 30 seconds
    setInterval(() => {
      this.updateSystemMetrics();
    }, 30000);

    // Initial update
    this.updateSystemMetrics();
  }

  private updateSystemMetrics() {
    try {
      const memUsage = process.memoryUsage();
      const uptime = process.uptime();

      this.memoryUsage.set({ type: 'heap_used' }, memUsage.heapUsed);
      this.memoryUsage.set({ type: 'heap_total' }, memUsage.heapTotal);
      this.memoryUsage.set({ type: 'external' }, memUsage.external);
      this.memoryUsage.set({ type: 'rss' }, memUsage.rss);

      this.uptime.set(uptime);

      // Note: CPU usage would require additional calculation
      // This is a simplified version
      this.cpuUsage.set(0); // Placeholder

    } catch (error) {
      this.logger.logError('metrics-update', error, undefined, {
        component: 'metrics',
        operation: 'system-metrics-update'
      });
    }
  }

  // HTTP metrics methods
  recordHttpRequest(method: string, path: string, statusCode: number, duration: number) {
    this.httpRequestsTotal.inc({ method, path, status_code: statusCode.toString() });
    this.httpRequestDuration.observe({ method, path }, duration / 1000); // Convert to seconds
  }

  updateActiveConnections(count: number) {
    this.activeConnections.set(count);
  }

  incrementActiveConnections() {
    this.activeConnections.inc();
  }

  decrementActiveConnections() {
    this.activeConnections.dec();
  }

  // Game metrics methods
  updateActivePlayers(count: number) {
    this.activePlayers.set(count);
  }

  incrementActivePlayers() {
    this.activePlayers.inc();
  }

  decrementActivePlayers() {
    this.activePlayers.dec();
  }

  recordCommand(commandType: string, sessionId: string, duration?: number) {
    this.totalCommands.inc({ command_type: commandType, session_id: sessionId });
    if (duration !== undefined) {
      this.commandDuration.observe({ command_type: commandType }, duration / 1000);
    }
  }

  recordEngineTick(duration: number) {
    this.engineTickDuration.observe(duration / 1000);
  }

  // Error metrics methods
  recordError(type: string, component: string) {
    this.errorsTotal.inc({ type, component });
  }

  // Custom metrics methods
  createGauge(name: string, help: string, labelNames?: string[]): Gauge<string> {
    return new Gauge({
      name: `mud_${name}`,
      help,
      labelNames
    });
  }

  createCounter(name: string, help: string, labelNames?: string[]): Counter<string> {
    return new Counter({
      name: `mud_${name}`,
      help,
      labelNames
    });
  }

  createHistogram(name: string, help: string, labelNames?: string[], buckets?: number[]): Histogram<string> {
    return new Histogram({
      name: `mud_${name}`,
      help,
      labelNames,
      buckets
    });
  }

  createSummary(name: string, help: string, labelNames?: string[]): Summary<string> {
    return new Summary({
      name: `mud_${name}`,
      help,
      labelNames
    });
  }

  // Metrics exposition
  async getMetrics(): Promise<string> {
    return register.metrics();
  }

  async getMetricsAsJSON(): Promise<Record<string, any>> {
    return register.getMetricsAsJSON();
  }

  // Health check integration
  async getHealthMetrics() {
    const [
      activeConnections,
      activePlayers,
      totalCommands,
      totalErrors,
      uptime,
      memoryUsage
    ] = await Promise.all([
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
}