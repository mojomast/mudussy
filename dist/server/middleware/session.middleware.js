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
exports.SessionMiddleware = void 0;
const common_1 = require("@nestjs/common");
const user_service_1 = require("../networking/user.service");
let SessionMiddleware = class SessionMiddleware {
    constructor(userService) {
        this.userService = userService;
        this.logger = new common_1.Logger('SessionMiddleware');
    }
    async use(req, res, next) {
        const startTime = Date.now();
        try {
            const userId = this.extractUserId(req);
            const token = this.extractToken(req);
            if (!userId) {
                return next();
            }
            const user = await this.userService.getUserById(userId);
            if (!user || !user.isActive) {
                this.logger.warn(`Invalid or inactive user attempted access: ${userId}`);
                throw new common_1.UnauthorizedException('User not found or inactive');
            }
            if (token) {
                const sessionData = await this.userService.getSessionData(userId);
                if (!sessionData) {
                    this.logger.warn(`No session found for user: ${userId}`);
                    throw new common_1.UnauthorizedException('Invalid session');
                }
                const sessionAge = Date.now() - (sessionData.createdAt || 0);
                const maxAge = 24 * 60 * 60 * 1000;
                if (sessionAge > maxAge) {
                    this.logger.warn(`Session expired for user: ${userId}`);
                    await this.userService.removeSessionData(userId);
                    throw new common_1.UnauthorizedException('Session expired');
                }
                sessionData.lastActivity = new Date();
                await this.userService.saveSessionData(userId, sessionData);
                req.session = sessionData;
            }
            req.user = {
                id: user.id,
                username: user.username,
                role: user.role,
                permissions: this.getUserPermissions(user)
            };
            if (this.isAdminOperation(req)) {
                this.logger.log(`Admin access: ${user.username} (${user.role}) - ${req.method} ${req.path}`);
            }
            next();
        }
        catch (error) {
            this.logger.error(`Session validation failed: ${error.message}`, error.stack);
            if (error instanceof common_1.UnauthorizedException) {
                res.status(401).json({
                    success: false,
                    message: error.message,
                    code: 'SESSION_INVALID'
                });
                return;
            }
            next();
        }
    }
    extractUserId(req) {
        return (req.headers['x-user-id'] ||
            req.headers['user-id'] ||
            req.query.userId ||
            req.body?.userId ||
            null);
    }
    extractToken(req) {
        return (req.headers['authorization']?.replace('Bearer ', '') ||
            req.headers['x-token'] ||
            req.query.token ||
            req.body?.token ||
            null);
    }
    getUserPermissions(user) {
        const rolePermissions = {
            'player': ['read:own_profile', 'play:game'],
            'moderator': [
                'read:own_profile', 'play:game',
                'read:users', 'read:dashboard', 'read:world_overview',
                'moderate:chat', 'kick:players'
            ],
            'admin': [
                'read:own_profile', 'play:game',
                'read:users', 'write:users', 'delete:users',
                'read:dashboard', 'write:dashboard',
                'read:world_overview', 'write:world', 'delete:world',
                'read:dialogue', 'write:dialogue', 'delete:dialogue',
                'moderate:chat', 'kick:players', 'system:admin'
            ]
        };
        return rolePermissions[user.role] || [];
    }
    isAdminOperation(req) {
        const adminPaths = [
            '/admin/',
            '/auth/admin/',
            '/system/'
        ];
        return adminPaths.some(path => req.path.startsWith(path));
    }
};
exports.SessionMiddleware = SessionMiddleware;
exports.SessionMiddleware = SessionMiddleware = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [user_service_1.UserService])
], SessionMiddleware);
//# sourceMappingURL=session.middleware.js.map