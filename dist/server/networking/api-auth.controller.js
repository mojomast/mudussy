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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiAuthController = void 0;
const common_1 = require("@nestjs/common");
const web_client_service_1 = require("./web-client.service");
const user_service_1 = require("./user.service");
let ApiAuthController = class ApiAuthController {
    constructor(webClientService, userService) {
        this.webClientService = webClientService;
        this.userService = userService;
    }
    async login(authRequest) {
        try {
            const authResult = await this.userService.authenticateUser(authRequest.username, authRequest.password || 'password');
            if (authResult.success && authResult.userId) {
                const tempClientId = `rest_${Date.now()}_${Math.random()}`;
                await this.webClientService.createWebSession(tempClientId);
                const persistentData = await this.webClientService.loadPersistentSession(tempClientId, authResult.userId);
                const result = await this.webClientService.authenticateWebSessionWithRole(tempClientId, authResult.username, authRequest.password || 'password', authResult.userId, authResult.role);
                if (result.success) {
                    await this.webClientService.saveSessionForPersistence(tempClientId);
                    const token = `${authResult.userId}`;
                    return {
                        success: true,
                        username: authResult.username,
                        role: authResult.role,
                        userId: authResult.userId,
                        message: authResult.message,
                        token,
                        sessionId: tempClientId,
                        sessionRestored: persistentData !== null
                    };
                }
                else {
                    return {
                        success: false,
                        message: result.message || 'Web session authentication failed',
                    };
                }
            }
            else {
                return {
                    success: false,
                    message: authResult.message || 'Authentication failed',
                };
            }
        }
        catch (error) {
            return {
                success: false,
                message: 'Authentication error',
            };
        }
    }
};
exports.ApiAuthController = ApiAuthController;
__decorate([
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ApiAuthController.prototype, "login", null);
exports.ApiAuthController = ApiAuthController = __decorate([
    (0, common_1.Controller)('api/auth'),
    __metadata("design:paramtypes", [web_client_service_1.WebClientService,
        user_service_1.UserService])
], ApiAuthController);
//# sourceMappingURL=api-auth.controller.js.map