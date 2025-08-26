import { Logger as NestLogger } from '@nestjs/common';
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
    [key: string]: any;
}
export declare class Logger extends NestLogger {
    private winstonLogger;
    private configService;
    constructor(configService: ConfigService);
    private initializeWinstonLogger;
    generateCorrelationId(): string;
    logWithContext(level: string, message: string, context?: LogContext): void;
    log(message: any, context?: string | LogContext): void;
    error(message: any, stack?: string, context?: string | LogContext): void;
    warn(message: any, context?: string | LogContext): void;
    debug(message: any, context?: string | LogContext): void;
    verbose(message: any, context?: string | LogContext): void;
    logCommand(sessionId: string, command: string, correlationId?: string): void;
    logPlayerAction(playerId: string, action: string, correlationId?: string, metadata?: Record<string, any>): void;
    logEngineEvent(event: string, correlationId?: string, metadata?: Record<string, any>): void;
    logPerformance(operation: string, duration: number, correlationId?: string, metadata?: Record<string, any>): void;
    logError(context: string, error: any, correlationId?: string, metadata?: Record<string, any>): void;
    createChildLogger(context: LogContext): Logger;
    private setChildContext;
}
