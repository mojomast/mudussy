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
exports.CorrelationIdMiddleware = void 0;
exports.getCurrentCorrelationId = getCurrentCorrelationId;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
const logger_service_1 = require("../logger/logger.service");
let CorrelationIdMiddleware = class CorrelationIdMiddleware {
    constructor(logger) {
        this.logger = logger;
    }
    use(req, res, next) {
        const correlationId = req.headers['x-correlation-id'] || (0, uuid_1.v4)();
        req.correlationId = correlationId;
        res.set('x-correlation-id', correlationId);
        this.logger.logWithContext('info', `${req.method} ${req.path}`, {
            correlationId,
            component: 'http',
            operation: 'request',
            method: req.method,
            path: req.path,
            userAgent: req.get('User-Agent'),
            ip: req.ip
        });
        const asyncLocalStorage = require('async_hooks').AsyncLocalStorage;
        if (!global.correlationStorage) {
            global.correlationStorage = new asyncLocalStorage();
        }
        global.correlationStorage.run({ correlationId }, () => {
            next();
        });
    }
};
exports.CorrelationIdMiddleware = CorrelationIdMiddleware;
exports.CorrelationIdMiddleware = CorrelationIdMiddleware = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [logger_service_1.Logger])
], CorrelationIdMiddleware);
function getCurrentCorrelationId() {
    if (global.correlationStorage) {
        const store = global.correlationStorage.getStore();
        return store?.correlationId;
    }
    return undefined;
}
//# sourceMappingURL=correlation-id.middleware.js.map