"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShutdownModule = void 0;
const common_1 = require("@nestjs/common");
const shutdown_service_1 = require("./shutdown.service");
const config_service_1 = require("../config/config.service");
const metrics_module_1 = require("../metrics/metrics.module");
const logger_service_1 = require("../logger/logger.service");
let ShutdownModule = class ShutdownModule {
};
exports.ShutdownModule = ShutdownModule;
exports.ShutdownModule = ShutdownModule = __decorate([
    (0, common_1.Module)({
        imports: [metrics_module_1.MetricsModule],
        providers: [shutdown_service_1.ShutdownService, config_service_1.ConfigService, logger_service_1.Logger],
        exports: [shutdown_service_1.ShutdownService]
    })
], ShutdownModule);
//# sourceMappingURL=shutdown.module.js.map