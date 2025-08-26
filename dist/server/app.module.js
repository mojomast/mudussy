"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const web_controller_1 = require("./web/web.controller");
const config_1 = require("@nestjs/config");
const engine_module_1 = require("./engine/engine.module");
const networking_module_1 = require("./networking/networking.module");
const world_module_1 = require("./world/world.module");
const admin_module_1 = require("./admin/admin.module");
const health_module_1 = require("./health/health.module");
const metrics_module_1 = require("./metrics/metrics.module");
const shutdown_module_1 = require("./shutdown/shutdown.module");
const config_service_1 = require("./config/config.service");
const logger_service_1 = require("./logger/logger.service");
const correlation_id_middleware_1 = require("./middleware/correlation-id.middleware");
const metrics_middleware_1 = require("./middleware/metrics.middleware");
let AppModule = class AppModule {
    configure(consumer) {
        consumer.apply(correlation_id_middleware_1.CorrelationIdMiddleware).forRoutes('*');
        consumer.apply(metrics_middleware_1.MetricsMiddleware).forRoutes('*');
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: ['.env.local', '.env'],
                cache: true,
            }),
            engine_module_1.EngineModule,
            networking_module_1.NetworkingModule,
            world_module_1.WorldModule,
            admin_module_1.AdminModule,
            health_module_1.HealthModule,
            metrics_module_1.MetricsModule,
            shutdown_module_1.ShutdownModule,
        ],
        controllers: [web_controller_1.WebController],
        providers: [
            config_service_1.ConfigService,
            logger_service_1.Logger,
        ],
        exports: [
            config_service_1.ConfigService,
            logger_service_1.Logger,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map