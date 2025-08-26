import { ConfigService } from './config.service';
import { Logger } from '../logger/logger.service';
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}
export declare class ConfigValidationService {
    private readonly configService;
    private readonly logger;
    constructor(configService: ConfigService, logger: Logger);
    validateConfiguration(): ValidationResult;
    private validateCriticalConfig;
    private validateEnvironmentConfig;
    private validateNetworkingConfig;
    private validateDatabaseConfig;
    private validateSecurityConfig;
    private validatePerformanceConfig;
    private logValidationResults;
    validateOnStartup(): void;
}
