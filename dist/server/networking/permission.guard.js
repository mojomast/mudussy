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
exports.RequireSystemAdmin = exports.RequireDialogueManagement = exports.RequireWorldManagement = exports.RequireUserManagement = exports.RequireModerator = exports.RequireAdmin = exports.EnableAuditLog = exports.RequirePermissions = exports.RequireRole = exports.PermissionGuard = exports.AUDIT_LOG_KEY = exports.REQUIRED_PERMISSIONS_KEY = exports.REQUIRED_ROLE_KEY = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const user_service_1 = require("./user.service");
const user_types_1 = require("./user.types");
exports.REQUIRED_ROLE_KEY = 'requiredRole';
exports.REQUIRED_PERMISSIONS_KEY = 'requiredPermissions';
exports.AUDIT_LOG_KEY = 'auditLog';
let PermissionGuard = class PermissionGuard {
    constructor(reflector, userService) {
        this.reflector = reflector;
        this.userService = userService;
        this.logger = new common_1.Logger('PermissionGuard');
    }
    async canActivate(context) {
        const requiredRole = this.reflector.get(exports.REQUIRED_ROLE_KEY, context.getHandler());
        const requiredPermissions = this.reflector.get(exports.REQUIRED_PERMISSIONS_KEY, context.getHandler());
        const auditLog = this.reflector.get(exports.AUDIT_LOG_KEY, context.getHandler());
        if (!requiredRole && !requiredPermissions) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        let userId = this.extractUserIdFromRequest(request);
        if (!userId) {
            const authHeader = request.headers?.authorization || request.headers?.Authorization;
            if (authHeader && typeof authHeader === 'string') {
                const parts = authHeader.split(' ');
                if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
                    const token = parts[1];
                    const session = await this.userService.getSessionData(token);
                    if (session?.userId) {
                        userId = session.userId;
                    }
                }
            }
        }
        if (!userId) {
            throw new common_1.ForbiddenException('Authentication required');
        }
        const user = await this.userService.getUserById(userId);
        if (!user || !user.isActive) {
            throw new common_1.ForbiddenException('User not found or inactive');
        }
        if (requiredRole) {
            const hasRolePermission = await this.userService.checkPermission({
                userId,
                requiredRole
            });
            if (!hasRolePermission) {
                this.logger.warn(`Access denied for user ${user.username} (${userId}) - insufficient role. Required: ${requiredRole}, Has: ${user.role}`);
                throw new common_1.ForbiddenException(`Insufficient permissions. Required role: ${requiredRole}`);
            }
        }
        if (requiredPermissions && requiredPermissions.length > 0) {
            const hasAllPermissions = await this.checkSpecificPermissions(userId, requiredPermissions);
            if (!hasAllPermissions) {
                this.logger.warn(`Access denied for user ${user.username} (${userId}) - missing permissions: ${requiredPermissions.join(', ')}`);
                throw new common_1.ForbiddenException(`Missing required permissions: ${requiredPermissions.join(', ')}`);
            }
        }
        if (auditLog) {
            await this.logAuditEntry(user, request, context);
        }
        request.user = user;
        return true;
    }
    extractUserIdFromRequest(request) {
        const headerUserId = request.headers?.['x-user-id'];
        if (headerUserId)
            return headerUserId;
        const authHeader = request.headers?.authorization || request.headers?.Authorization;
        if (authHeader && typeof authHeader === 'string') {
            const parts = authHeader.split(' ');
            if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
                const token = parts[1];
                if (/^[0-9a-fA-F-]{8}/.test(token) || token.length > 10) {
                    return token;
                }
            }
        }
        return (request.session?.userId ||
            request.userId ||
            request.body?.userId ||
            request.query?.userId ||
            null);
    }
    async checkSpecificPermissions(userId, permissions) {
        const user = await this.userService.getUserById(userId);
        if (!user)
            return false;
        const rolePermissions = this.getRolePermissions(user.role);
        return permissions.every(permission => rolePermissions.includes(permission));
    }
    getRolePermissions(role) {
        const permissionMap = {
            [user_types_1.UserRole.PLAYER]: [
                'read:own_profile',
                'write:own_profile',
                'play:game'
            ],
            [user_types_1.UserRole.MODERATOR]: [
                'read:own_profile',
                'write:own_profile',
                'play:game',
                'read:users',
                'read:dashboard',
                'read:world_overview',
                'moderate:chat',
                'kick:players'
            ],
            [user_types_1.UserRole.ADMIN]: [
                'read:own_profile',
                'write:own_profile',
                'play:game',
                'read:users',
                'write:users',
                'delete:users',
                'read:dashboard',
                'write:dashboard',
                'read:world_overview',
                'write:world',
                'delete:world',
                'read:dialogue',
                'write:dialogue',
                'delete:dialogue',
                'moderate:chat',
                'kick:players',
                'system:admin'
            ]
        };
        return permissionMap[role] || [];
    }
    async logAuditEntry(user, request, context) {
        const controller = context.getClass().name;
        const handler = context.getHandler().name;
        const method = request.method;
        const url = request.url;
        const auditEntry = {
            userId: user.id,
            username: user.username,
            action: `${method} ${url}`,
            resource: `${controller}.${handler}`,
            details: {
                method,
                url,
                body: this.sanitizeRequestBody(request.body),
                query: request.query,
                params: request.params
            },
            timestamp: new Date(),
            ipAddress: request.ip || request.connection?.remoteAddress,
            userAgent: request.get?.('User-Agent')
        };
        this.logger.log(`AUDIT: ${user.username} (${user.role}) performed ${auditEntry.action} on ${auditEntry.resource}`);
    }
    sanitizeRequestBody(body) {
        if (!body || typeof body !== 'object')
            return body;
        const sanitized = { ...body };
        const sensitiveFields = ['password', 'token', 'secret', 'key'];
        sensitiveFields.forEach(field => {
            if (sanitized[field]) {
                sanitized[field] = '[REDACTED]';
            }
        });
        return sanitized;
    }
};
exports.PermissionGuard = PermissionGuard;
exports.PermissionGuard = PermissionGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        user_service_1.UserService])
], PermissionGuard);
const RequireRole = (role) => {
    return (target, propertyKey, descriptor) => {
        core_1.Reflector.createDecorator({ key: exports.REQUIRED_ROLE_KEY })(role)(target, propertyKey, descriptor);
    };
};
exports.RequireRole = RequireRole;
const RequirePermissions = (...permissions) => {
    return (target, propertyKey, descriptor) => {
        core_1.Reflector.createDecorator({ key: exports.REQUIRED_PERMISSIONS_KEY })(permissions)(target, propertyKey, descriptor);
    };
};
exports.RequirePermissions = RequirePermissions;
const EnableAuditLog = () => {
    return (target, propertyKey, descriptor) => {
        core_1.Reflector.createDecorator({ key: exports.AUDIT_LOG_KEY })(true)(target, propertyKey, descriptor);
    };
};
exports.EnableAuditLog = EnableAuditLog;
const RequireAdmin = () => (0, exports.RequireRole)(user_types_1.UserRole.ADMIN);
exports.RequireAdmin = RequireAdmin;
const RequireModerator = () => (0, exports.RequireRole)(user_types_1.UserRole.MODERATOR);
exports.RequireModerator = RequireModerator;
const RequireUserManagement = () => (0, exports.RequirePermissions)('write:users', 'read:users');
exports.RequireUserManagement = RequireUserManagement;
const RequireWorldManagement = () => (0, exports.RequirePermissions)('write:world', 'read:world_overview');
exports.RequireWorldManagement = RequireWorldManagement;
const RequireDialogueManagement = () => (0, exports.RequirePermissions)('write:dialogue', 'read:dialogue');
exports.RequireDialogueManagement = RequireDialogueManagement;
const RequireSystemAdmin = () => (0, exports.RequirePermissions)('system:admin');
exports.RequireSystemAdmin = RequireSystemAdmin;
//# sourceMappingURL=permission.guard.js.map