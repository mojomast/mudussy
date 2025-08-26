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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const web_client_service_1 = require("./web-client.service");
const user_service_1 = require("./user.service");
const permission_guard_1 = require("./permission.guard");
let AuthController = class AuthController {
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
    async loginApi(body) {
        return this.login(body);
    }
    async register(authRequest) {
        try {
            const tempClientId = `rest_${Date.now()}_${Math.random()}`;
            await this.webClientService.createWebSession(tempClientId);
            const result = await this.webClientService.authenticateWebSession(tempClientId, authRequest.username, authRequest.password || 'password');
            if (result.success) {
                const token = `web_token_${tempClientId}_${Date.now()}`;
                return {
                    success: true,
                    username: result.username,
                    message: `Account created and logged in as ${result.username}`,
                    token,
                };
            }
            else {
                return {
                    success: false,
                    message: 'Registration failed',
                };
            }
        }
        catch (error) {
            return {
                success: false,
                message: 'Registration error',
            };
        }
    }
    async getStatus() {
        return {
            authenticated: false,
            message: 'Authentication status endpoint - use WebSocket for full authentication',
        };
    }
    async createUser(createUserRequest, req) {
        try {
            const user = await this.userService.createUser(createUserRequest);
            return {
                success: true,
                username: user.username,
                role: user.role,
                userId: user.id,
                message: `User ${user.username} created successfully with role ${user.role}`
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Failed to create user'
            };
        }
    }
    async updateUserRole(updateRequest, req) {
        try {
            const success = await this.userService.updateUserRole(updateRequest.userId, updateRequest.newRole);
            if (success) {
                return {
                    success: true,
                    message: `User role updated to ${updateRequest.newRole}`
                };
            }
            else {
                return {
                    success: false,
                    message: 'User not found or update failed'
                };
            }
        }
        catch (error) {
            return {
                success: false,
                message: 'Failed to update user role'
            };
        }
    }
    async getAllUsers(req) {
        try {
            const users = await this.userService.getAllUsers();
            return {
                success: true,
                users: users.map(u => ({
                    id: u.id,
                    username: u.username,
                    role: u.role,
                    createdAt: u.createdAt,
                    lastLogin: u.lastLogin,
                    isActive: u.isActive
                }))
            };
        }
        catch (error) {
            return {
                success: false,
                message: 'Failed to retrieve users'
            };
        }
    }
    async deactivateUser(request, req) {
        try {
            const success = await this.userService.deactivateUser(request.userId);
            if (success) {
                return {
                    success: true,
                    message: 'User deactivated successfully'
                };
            }
            else {
                return {
                    success: false,
                    message: 'User not found'
                };
            }
        }
        catch (error) {
            return {
                success: false,
                message: 'Failed to deactivate user'
            };
        }
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('/api/auth/login'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "loginApi", null);
__decorate([
    (0, common_1.Post)('register'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Get)('status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Post)('admin/create-user'),
    (0, common_1.UseGuards)(permission_guard_1.PermissionGuard),
    (0, permission_guard_1.RequireAdmin)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "createUser", null);
__decorate([
    (0, common_1.Post)('admin/update-role'),
    (0, common_1.UseGuards)(permission_guard_1.PermissionGuard),
    (0, permission_guard_1.RequireAdmin)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "updateUserRole", null);
__decorate([
    (0, common_1.Get)('admin/users'),
    (0, common_1.UseGuards)(permission_guard_1.PermissionGuard),
    (0, permission_guard_1.RequireAdmin)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getAllUsers", null);
__decorate([
    (0, common_1.Post)('admin/deactivate-user'),
    (0, common_1.UseGuards)(permission_guard_1.PermissionGuard),
    (0, permission_guard_1.RequireAdmin)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "deactivateUser", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [web_client_service_1.WebClientService,
        user_service_1.UserService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map