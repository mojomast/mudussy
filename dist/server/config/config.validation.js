"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigValidationService = void 0;
class ConfigValidationService {
    constructor(configService, logger) {
        this.configService = configService;
        this.logger = logger;
    }
    validateConfiguration() {
        const result = {
            isValid: true,
            errors: [],
            warnings: []
        };
        this.validateCriticalConfig(result);
        this.validateEnvironmentConfig(result);
        this.validateNetworkingConfig(result);
        this.validateDatabaseConfig(result);
        this.validateSecurityConfig(result);
        this.validatePerformanceConfig(result);
        this.logValidationResults(result);
        return result;
    }
    validateCriticalConfig(result) {
        const nodeEnv = process.env.NODE_ENV;
        if (!nodeEnv || !['development', 'staging', 'production'].includes(nodeEnv)) {
            result.errors.push('NODE_ENV must be one of: development, staging, production');
            result.isValid = false;
        }
        const port = this.configService.getNumber('MUD_PORT', 3000);
        if (port < 1 || port > 65535) {
            result.errors.push('MUD_PORT must be between 1 and 65535');
            result.isValid = false;
        }
        const logLevel = this.configService.get('MUD_LOG_LEVEL', 'info');
        const validLogLevels = ['error', 'warn', 'info', 'debug', 'verbose'];
        if (!validLogLevels.includes(logLevel)) {
            result.errors.push(`MUD_LOG_LEVEL must be one of: ${validLogLevels.join(', ')}`);
            result.isValid = false;
        }
    }
    validateEnvironmentConfig(result) {
        const env = process.env.NODE_ENV;
        if (env === 'production') {
            if (!process.env.MUD_SESSION_SECRET) {
                result.errors.push('MUD_SESSION_SECRET is required in production');
                result.isValid = false;
            }
            const logFormat = this.configService.get('MUD_LOG_FORMAT', 'console');
            if (logFormat === 'console') {
                result.warnings.push('Consider using JSON log format in production for better parsing');
            }
        }
        if (env === 'production') {
            const dbType = this.configService.get('MUD_DATABASE_TYPE', 'redis');
            if (dbType === 'redis' && !process.env.MUD_REDIS_PASSWORD) {
                result.warnings.push('Consider setting MUD_REDIS_PASSWORD in production');
            }
        }
    }
    validateNetworkingConfig(result) {
        const maxConnections = this.configService.getNumber('MUD_MAX_CONNECTIONS', 100);
        if (maxConnections < 1 || maxConnections > 10000) {
            result.errors.push('MUD_MAX_CONNECTIONS must be between 1 and 10000');
            result.isValid = false;
        }
        const connectionTimeout = this.configService.getNumber('MUD_CONNECTION_TIMEOUT', 30000);
        if (connectionTimeout < 1000) {
            result.warnings.push('MUD_CONNECTION_TIMEOUT is very low, consider increasing to at least 1000ms');
        }
        const networkPort = this.configService.getNumber('MUD_NETWORK_PORT', 4000);
        if (networkPort < 1 || networkPort > 65535) {
            result.errors.push('MUD_NETWORK_PORT must be between 1 and 65535');
            result.isValid = false;
        }
        const httpPort = this.configService.getNumber('MUD_PORT', 3000);
        if (httpPort === networkPort) {
            result.errors.push('MUD_PORT and MUD_NETWORK_PORT cannot be the same');
            result.isValid = false;
        }
    }
    validateDatabaseConfig(result) {
        const dbType = this.configService.get('MUD_DATABASE_TYPE', 'redis');
        const validDbTypes = ['redis', 'mongodb', 'postgresql', 'sqlite'];
        if (!validDbTypes.includes(dbType)) {
            result.errors.push(`MUD_DATABASE_TYPE must be one of: ${validDbTypes.join(', ')}`);
            result.isValid = false;
            return;
        }
        if (dbType === 'redis') {
            const redisPort = this.configService.getNumber('MUD_REDIS_PORT', 6379);
            if (redisPort < 1 || redisPort > 65535) {
                result.errors.push('MUD_REDIS_PORT must be between 1 and 65535');
                result.isValid = false;
            }
            const redisHost = this.configService.get('MUD_REDIS_HOST', 'localhost');
            if (!redisHost) {
                result.errors.push('MUD_REDIS_HOST is required when using Redis');
                result.isValid = false;
            }
        }
        if (dbType === 'postgresql') {
            const required = ['MUD_POSTGRES_HOST', 'MUD_POSTGRES_DATABASE', 'MUD_POSTGRES_USERNAME'];
            for (const envVar of required) {
                if (!process.env[envVar]) {
                    result.errors.push(`${envVar} is required when using PostgreSQL`);
                    result.isValid = false;
                }
            }
        }
        if (dbType === 'mongodb') {
            const mongoUri = this.configService.get('MUD_MONGODB_URI', '');
            if (!mongoUri) {
                result.errors.push('MUD_MONGODB_URI is required when using MongoDB');
                result.isValid = false;
            }
        }
    }
    validateSecurityConfig(result) {
        const env = process.env.NODE_ENV;
        const enableSsl = this.configService.getBoolean('MUD_ENABLE_SSL', false);
        if (enableSsl) {
            const certPath = this.configService.get('MUD_SSL_CERT_PATH', '');
            const keyPath = this.configService.get('MUD_SSL_KEY_PATH', '');
            if (!certPath || !keyPath) {
                result.errors.push('MUD_SSL_CERT_PATH and MUD_SSL_KEY_PATH are required when SSL is enabled');
                result.isValid = false;
            }
        }
        if (env === 'production') {
            const sessionSecret = this.configService.get('MUD_SESSION_SECRET', '');
            if (!sessionSecret || sessionSecret.length < 32) {
                result.errors.push('MUD_SESSION_SECRET must be at least 32 characters long in production');
                result.isValid = false;
            }
        }
        const corsOrigin = this.configService.get('MUD_CORS_ORIGIN', '*');
        if (corsOrigin === '*' && env === 'production') {
            result.warnings.push('MUD_CORS_ORIGIN is set to "*" in production, consider restricting origins');
        }
    }
    validatePerformanceConfig(result) {
        const memoryLimit = this.configService.getNumber('MUD_MEMORY_LIMIT', 2048);
        if (memoryLimit < 256) {
            result.warnings.push('MUD_MEMORY_LIMIT is very low, consider increasing for better performance');
        }
        const workerProcesses = this.configService.getNumber('MUD_WORKER_PROCESSES', 0);
        if (workerProcesses < 0) {
            result.errors.push('MUD_WORKER_PROCESSES cannot be negative');
            result.isValid = false;
        }
        const shutdownGracePeriod = this.configService.getNumber('MUD_SHUTDOWN_GRACE_PERIOD', 30000);
        if (shutdownGracePeriod < 5000) {
            result.warnings.push('MUD_SHUTDOWN_GRACE_PERIOD is very low, consider increasing to at least 5000ms');
        }
        const maxEntities = this.configService.getNumber('MUD_MAX_ENTITIES', 10000);
        if (maxEntities < 100) {
            result.warnings.push('MUD_MAX_ENTITIES is very low, consider increasing for larger worlds');
        }
        const tickInterval = this.configService.getNumber('MUD_TICK_INTERVAL', 1000);
        if (tickInterval < 100) {
            result.errors.push('MUD_TICK_INTERVAL is too low, minimum recommended is 100ms');
            result.isValid = false;
        }
    }
    logValidationResults(result) {
        const correlationId = this.logger.generateCorrelationId();
        if (!result.isValid) {
            this.logger.logWithContext('error', 'Configuration validation failed', {
                correlationId,
                component: 'config-validation',
                operation: 'validation',
                errorCount: result.errors.length,
                warningCount: result.warnings.length,
                errors: result.errors
            });
        }
        else if (result.warnings.length > 0) {
            this.logger.logWithContext('warn', 'Configuration validation passed with warnings', {
                correlationId,
                component: 'config-validation',
                operation: 'validation',
                errorCount: result.errors.length,
                warningCount: result.warnings.length,
                warnings: result.warnings
            });
        }
        else {
            this.logger.logWithContext('info', 'Configuration validation passed', {
                correlationId,
                component: 'config-validation',
                operation: 'validation',
                errorCount: result.errors.length,
                warningCount: result.warnings.length
            });
        }
    }
    validateOnStartup() {
        const result = this.validateConfiguration();
        if (!result.isValid) {
            console.error('❌ Configuration validation failed:');
            result.errors.forEach(error => console.error(`  - ${error}`));
            console.error('\nPlease fix the configuration errors and restart the application.');
            process.exit(1);
        }
        if (result.warnings.length > 0) {
            console.warn('⚠️  Configuration validation passed with warnings:');
            result.warnings.forEach(warning => console.warn(`  - ${warning}`));
            console.warn('');
        }
        console.log('✅ Configuration validation passed');
    }
}
exports.ConfigValidationService = ConfigValidationService;
//# sourceMappingURL=config.validation.js.map