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
exports.AdminUserManagementController = void 0;
const common_1 = require("@nestjs/common");
const permission_guard_1 = require("../../networking/permission.guard");
const user_service_1 = require("../../networking/user.service");
let AdminUserManagementController = class AdminUserManagementController {
    constructor(userService) {
        this.userService = userService;
    }
    async getAllUsers() {
        try {
            const users = await this.userService.getAllUsers();
            return {
                success: true,
                message: `Found ${users.length} users`,
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
    async getUserById(userId) {
        try {
            const user = await this.userService.getUserById(userId);
            if (user) {
                return {
                    success: true,
                    message: 'User found',
                    user: {
                        id: user.id,
                        username: user.username,
                        role: user.role,
                        createdAt: user.createdAt,
                        lastLogin: user.lastLogin,
                        isActive: user.isActive
                    }
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
                message: 'Failed to retrieve user'
            };
        }
    }
    async createUser(createData, req) {
        try {
            const user = await this.userService.createUser(createData);
            return {
                success: true,
                message: `User ${user.username} created successfully`,
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    createdAt: user.createdAt,
                    isActive: user.isActive
                }
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Failed to create user'
            };
        }
    }
    async updateUserRole(userId, updateData, req) {
        try {
            const success = await this.userService.updateUserRole(userId, updateData.role);
            if (success) {
                const user = await this.userService.getUserById(userId);
                return {
                    success: true,
                    message: `User role updated to ${updateData.role}`,
                    user: user ? {
                        id: user.id,
                        username: user.username,
                        role: user.role,
                        createdAt: user.createdAt,
                        lastLogin: user.lastLogin,
                        isActive: user.isActive
                    } : undefined
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
    async resetUserPassword(userId, passwordData, req) {
        try {
            const success = await this.userService.resetUserPassword(userId, passwordData.password);
            if (success) {
                return {
                    success: true,
                    message: 'Password reset successfully'
                };
            }
            else {
                return {
                    success: false,
                    message: 'User not found or password reset failed'
                };
            }
        }
        catch (error) {
            return {
                success: false,
                message: 'Failed to reset password'
            };
        }
    }
    async deactivateUser(userId, req) {
        try {
            const success = await this.userService.deactivateUser(userId);
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
    async activateUser(userId, req) {
        try {
            const success = await this.userService.activateUser(userId);
            if (success) {
                return {
                    success: true,
                    message: 'User activated successfully'
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
                message: 'Failed to activate user'
            };
        }
    }
    async getRoleStatistics() {
        try {
            const users = await this.userService.getAllUsers();
            const roleStats = users.reduce((acc, user) => {
                const existing = acc.find(stat => stat.role === user.role);
                if (existing) {
                    existing.count++;
                }
                else {
                    acc.push({ role: user.role, count: 1 });
                }
                return acc;
            }, []);
            return {
                success: true,
                stats: roleStats,
                message: 'Role statistics retrieved successfully'
            };
        }
        catch (error) {
            return {
                success: false,
                message: 'Failed to retrieve role statistics'
            };
        }
    }
};
exports.AdminUserManagementController = AdminUserManagementController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(permission_guard_1.PermissionGuard),
    (0, permission_guard_1.RequireModerator)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminUserManagementController.prototype, "getAllUsers", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(permission_guard_1.PermissionGuard),
    (0, permission_guard_1.RequireModerator)(),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminUserManagementController.prototype, "getUserById", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(permission_guard_1.PermissionGuard),
    (0, permission_guard_1.RequireUserManagement)(),
    (0, permission_guard_1.EnableAuditLog)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminUserManagementController.prototype, "createUser", null);
__decorate([
    (0, common_1.Put)(':id/role'),
    (0, common_1.UseGuards)(permission_guard_1.PermissionGuard),
    (0, permission_guard_1.RequireUserManagement)(),
    (0, permission_guard_1.EnableAuditLog)(),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminUserManagementController.prototype, "updateUserRole", null);
__decorate([
    (0, common_1.Put)(':id/password'),
    (0, common_1.UseGuards)(permission_guard_1.PermissionGuard),
    (0, permission_guard_1.RequireUserManagement)(),
    (0, permission_guard_1.EnableAuditLog)(),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminUserManagementController.prototype, "resetUserPassword", null);
__decorate([
    (0, common_1.Put)(':id/deactivate'),
    (0, common_1.UseGuards)(permission_guard_1.PermissionGuard),
    (0, permission_guard_1.RequireUserManagement)(),
    (0, permission_guard_1.EnableAuditLog)(),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminUserManagementController.prototype, "deactivateUser", null);
__decorate([
    (0, common_1.Put)(':id/activate'),
    (0, common_1.UseGuards)(permission_guard_1.PermissionGuard),
    (0, permission_guard_1.RequireUserManagement)(),
    (0, permission_guard_1.EnableAuditLog)(),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminUserManagementController.prototype, "activateUser", null);
__decorate([
    (0, common_1.Get)('stats/roles'),
    (0, common_1.UseGuards)(permission_guard_1.PermissionGuard),
    (0, permission_guard_1.RequireModerator)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminUserManagementController.prototype, "getRoleStatistics", null);
exports.AdminUserManagementController = AdminUserManagementController = __decorate([
    (0, common_1.Controller)('admin/users'),
    __metadata("design:paramtypes", [user_service_1.UserService])
], AdminUserManagementController);
//# sourceMappingURL=admin-user-management.controller.js.map