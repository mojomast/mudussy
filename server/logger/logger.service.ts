import { Injectable, Logger as NestLogger } from '@nestjs/common';
import { createLogger, format, transports, Logger as WinstonLogger } from 'winston';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '../config/config.service';

export interface LogContext {
  correlationId?: string;
  sessionId?: string;
  playerId?: string;
  userId?: string;
  requestId?: string;
  component?: string;
  operation?: string;
  metadata?: Record<string, any>;
  [key: string]: any; // Allow additional properties
}

@Injectable()
export class Logger extends NestLogger {
  private winstonLogger: WinstonLogger;
  private configService: ConfigService;

  constructor(configService: ConfigService) {
    super('MUD-Engine');
    this.configService = configService;
    this.initializeWinstonLogger();
  }

  private initializeWinstonLogger() {
    const logLevel = this.configService.get('MUD_LOG_LEVEL', 'info');
    const logFormat = this.configService.get('MUD_LOG_FORMAT', 'json');

    const customFormat = format.combine(
      format.timestamp({ format: 'ISO' }),
      format.errors({ stack: true }),
      format.json(),
      format.printf(({ timestamp, level, message, correlationId, ...meta }) => {
        const logEntry = {
          timestamp,
          level: level.toUpperCase(),
          message,
          correlationId,
          service: 'mud-engine',
          ...meta
        };
        return JSON.stringify(logEntry);
      })
    );

    const consoleFormat = format.combine(
      format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      format.errors({ stack: true }),
      format.colorize(),
      format.printf(({ timestamp, level, message, correlationId, ...meta }) => {
        const correlation = correlationId ? `[${correlationId}] ` : '';
        const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
        return `${timestamp} ${level}: ${correlation}${message}${metaStr}`;
      })
    );

    this.winstonLogger = createLogger({
      level: logLevel,
      format: logFormat === 'json' ? customFormat : consoleFormat,
      defaultMeta: { service: 'mud-engine' },
      transports: [
        new transports.Console({
          format: logFormat === 'json' ? customFormat : consoleFormat,
        }),
        // Add file transport for production
        ...(process.env.NODE_ENV === 'production' ? [
          new transports.File({
            filename: 'logs/error.log',
            level: 'error',
            format: customFormat,
          }),
          new transports.File({
            filename: 'logs/combined.log',
            format: customFormat,
          })
        ] : [])
      ],
    });
  }

  // Generate correlation ID for request tracking
  generateCorrelationId(): string {
    return uuidv4();
  }

  // Structured logging with context
  logWithContext(level: string, message: string, context?: LogContext) {
    const logData = {
      message,
      correlationId: context?.correlationId || this.generateCorrelationId(),
      ...context
    };

    this.winstonLogger.log(level, message, logData);
  }

  // Override NestJS Logger methods with structured logging
  log(message: any, context?: string | LogContext) {
    if (typeof context === 'object' && 'correlationId' in context) {
      this.logWithContext('info', message, context);
    } else {
      this.winstonLogger.info(message, { context });
    }
  }

  error(message: any, stack?: string, context?: string | LogContext) {
    if (typeof context === 'object' && 'correlationId' in context) {
      this.logWithContext('error', message, { ...context, stack });
    } else {
      this.winstonLogger.error(message, { context, stack });
    }
  }

  warn(message: any, context?: string | LogContext) {
    if (typeof context === 'object' && 'correlationId' in context) {
      this.logWithContext('warn', message, context);
    } else {
      this.winstonLogger.warn(message, { context });
    }
  }

  debug(message: any, context?: string | LogContext) {
    if (typeof context === 'object' && 'correlationId' in context) {
      this.logWithContext('debug', message, context);
    } else {
      this.winstonLogger.debug(message, { context });
    }
  }

  verbose(message: any, context?: string | LogContext) {
    if (typeof context === 'object' && 'correlationId' in context) {
      this.logWithContext('verbose', message, context);
    } else {
      this.winstonLogger.verbose(message, { context });
    }
  }

  // MUD-specific logging methods
  logCommand(sessionId: string, command: string, correlationId?: string) {
    this.logWithContext('info', `Command received: ${command}`, {
      correlationId,
      sessionId,
      component: 'networking',
      operation: 'command',
      command
    });
  }

  logPlayerAction(playerId: string, action: string, correlationId?: string, metadata?: Record<string, any>) {
    this.logWithContext('info', `Player action: ${action}`, {
      correlationId,
      playerId,
      component: 'gameplay',
      operation: 'player-action',
      action,
      metadata
    });
  }

  logEngineEvent(event: string, correlationId?: string, metadata?: Record<string, any>) {
    this.logWithContext('info', `Engine event: ${event}`, {
      correlationId,
      component: 'engine',
      operation: 'event',
      event,
      metadata
    });
  }

  logPerformance(operation: string, duration: number, correlationId?: string, metadata?: Record<string, any>) {
    this.logWithContext('info', `Performance: ${operation} took ${duration}ms`, {
      correlationId,
      component: 'performance',
      operation,
      duration,
      metadata
    });
  }

  logError(context: string, error: any, correlationId?: string, metadata?: Record<string, any>) {
    this.logWithContext('error', `Error in ${context}: ${error.message}`, {
      correlationId,
      component: 'error',
      operation: context,
      error: error.message,
      stack: error.stack,
      metadata
    });
  }

  // Create child logger with persistent context
  createChildLogger(context: LogContext): Logger {
    const childLogger = new Logger(this.configService);
    childLogger.setChildContext(context);
    return childLogger;
  }

  private setChildContext(context: LogContext) {
    // This would require extending Winston with child loggers
    // For now, we'll use the context in each call
  }
}