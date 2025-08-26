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
var Logger_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const common_1 = require("@nestjs/common");
const winston_1 = require("winston");
const uuid_1 = require("uuid");
const config_service_1 = require("../config/config.service");
let Logger = Logger_1 = class Logger extends common_1.Logger {
    constructor(configService) {
        super('MUD-Engine');
        this.configService = configService;
        this.initializeWinstonLogger();
    }
    initializeWinstonLogger() {
        const logLevel = this.configService.get('MUD_LOG_LEVEL', 'info');
        const logFormat = this.configService.get('MUD_LOG_FORMAT', 'json');
        const customFormat = winston_1.format.combine(winston_1.format.timestamp({ format: 'ISO' }), winston_1.format.errors({ stack: true }), winston_1.format.json(), winston_1.format.printf(({ timestamp, level, message, correlationId, ...meta }) => {
            const logEntry = {
                timestamp,
                level: level.toUpperCase(),
                message,
                correlationId,
                service: 'mud-engine',
                ...meta
            };
            return JSON.stringify(logEntry);
        }));
        const consoleFormat = winston_1.format.combine(winston_1.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.format.errors({ stack: true }), winston_1.format.colorize(), winston_1.format.printf(({ timestamp, level, message, correlationId, ...meta }) => {
            const correlation = correlationId ? `[${correlationId}] ` : '';
            const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
            return `${timestamp} ${level}: ${correlation}${message}${metaStr}`;
        }));
        this.winstonLogger = (0, winston_1.createLogger)({
            level: logLevel,
            format: logFormat === 'json' ? customFormat : consoleFormat,
            defaultMeta: { service: 'mud-engine' },
            transports: [
                new winston_1.transports.Console({
                    format: logFormat === 'json' ? customFormat : consoleFormat,
                }),
                ...(process.env.NODE_ENV === 'production' ? [
                    new winston_1.transports.File({
                        filename: 'logs/error.log',
                        level: 'error',
                        format: customFormat,
                    }),
                    new winston_1.transports.File({
                        filename: 'logs/combined.log',
                        format: customFormat,
                    })
                ] : [])
            ],
        });
    }
    generateCorrelationId() {
        return (0, uuid_1.v4)();
    }
    logWithContext(level, message, context) {
        const logData = {
            message,
            correlationId: context?.correlationId || this.generateCorrelationId(),
            ...context
        };
        this.winstonLogger.log(level, message, logData);
    }
    log(message, context) {
        if (typeof context === 'object' && 'correlationId' in context) {
            this.logWithContext('info', message, context);
        }
        else {
            this.winstonLogger.info(message, { context });
        }
    }
    error(message, stack, context) {
        if (typeof context === 'object' && 'correlationId' in context) {
            this.logWithContext('error', message, { ...context, stack });
        }
        else {
            this.winstonLogger.error(message, { context, stack });
        }
    }
    warn(message, context) {
        if (typeof context === 'object' && 'correlationId' in context) {
            this.logWithContext('warn', message, context);
        }
        else {
            this.winstonLogger.warn(message, { context });
        }
    }
    debug(message, context) {
        if (typeof context === 'object' && 'correlationId' in context) {
            this.logWithContext('debug', message, context);
        }
        else {
            this.winstonLogger.debug(message, { context });
        }
    }
    verbose(message, context) {
        if (typeof context === 'object' && 'correlationId' in context) {
            this.logWithContext('verbose', message, context);
        }
        else {
            this.winstonLogger.verbose(message, { context });
        }
    }
    logCommand(sessionId, command, correlationId) {
        this.logWithContext('info', `Command received: ${command}`, {
            correlationId,
            sessionId,
            component: 'networking',
            operation: 'command',
            command
        });
    }
    logPlayerAction(playerId, action, correlationId, metadata) {
        this.logWithContext('info', `Player action: ${action}`, {
            correlationId,
            playerId,
            component: 'gameplay',
            operation: 'player-action',
            action,
            metadata
        });
    }
    logEngineEvent(event, correlationId, metadata) {
        this.logWithContext('info', `Engine event: ${event}`, {
            correlationId,
            component: 'engine',
            operation: 'event',
            event,
            metadata
        });
    }
    logPerformance(operation, duration, correlationId, metadata) {
        this.logWithContext('info', `Performance: ${operation} took ${duration}ms`, {
            correlationId,
            component: 'performance',
            operation,
            duration,
            metadata
        });
    }
    logError(context, error, correlationId, metadata) {
        this.logWithContext('error', `Error in ${context}: ${error.message}`, {
            correlationId,
            component: 'error',
            operation: context,
            error: error.message,
            stack: error.stack,
            metadata
        });
    }
    createChildLogger(context) {
        const childLogger = new Logger_1(this.configService);
        childLogger.setChildContext(context);
        return childLogger;
    }
    setChildContext(context) {
    }
};
exports.Logger = Logger;
exports.Logger = Logger = Logger_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_service_1.ConfigService])
], Logger);
//# sourceMappingURL=logger.service.js.map