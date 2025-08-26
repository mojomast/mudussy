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
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const fs_1 = require("fs");
const path_1 = require("path");
const uuid_1 = require("uuid");
const user_types_1 = require("./user.types");
let UserService = class UserService {
    constructor() {
        this.logger = new common_1.Logger('UserService');
        this.usersFilePath = (0, path_1.join)(process.cwd(), 'data', 'users.json');
        this.sessionsFilePath = (0, path_1.join)(process.cwd(), 'data', 'sessions.json');
        this.users = new Map();
        this.sessions = new Map();
        this.initializeStorage();
    }
    async initializeStorage() {
        try {
            await fs_1.promises.mkdir((0, path_1.join)(process.cwd(), 'data'), { recursive: true });
            await this.loadUsers();
            await this.loadSessions();
            if (this.users.size === 0) {
                await this.createDefaultAdmin();
            }
            this.logger.log(`User service initialized with ${this.users.size} users`);
        }
        catch (error) {
            this.logger.error('Failed to initialize user storage:', error);
            throw error;
        }
    }
    async loadUsers() {
        try {
            const data = await fs_1.promises.readFile(this.usersFilePath, 'utf8');
            const users = JSON.parse(data);
            users.forEach(user => {
                user.createdAt = new Date(user.createdAt);
                if (user.lastLogin) {
                    user.lastLogin = new Date(user.lastLogin);
                }
                this.users.set(user.id, user);
            });
        }
        catch (error) {
            this.logger.warn('Users file not found or corrupted, starting with empty user store');
        }
    }
    async loadSessions() {
        try {
            const data = await fs_1.promises.readFile(this.sessionsFilePath, 'utf8');
            const sessions = JSON.parse(data);
            Object.entries(sessions).forEach(([sessionId, sessionData]) => {
                if (sessionData.createdAt) {
                    sessionData.createdAt = new Date(sessionData.createdAt);
                }
                if (sessionData.lastActivity) {
                    sessionData.lastActivity = new Date(sessionData.lastActivity);
                }
                this.sessions.set(sessionId, sessionData);
            });
        }
        catch (error) {
            this.logger.warn('Sessions file not found or corrupted, starting with empty session store');
        }
    }
    async saveUsers() {
        try {
            const users = Array.from(this.users.values());
            await fs_1.promises.writeFile(this.usersFilePath, JSON.stringify(users, null, 2));
        }
        catch (error) {
            this.logger.error('Failed to save users:', error);
            throw error;
        }
    }
    async saveSessions() {
        try {
            const sessions = Object.fromEntries(this.sessions);
            await fs_1.promises.writeFile(this.sessionsFilePath, JSON.stringify(sessions, null, 2));
        }
        catch (error) {
            this.logger.error('Failed to save sessions:', error);
            throw error;
        }
    }
    async createDefaultAdmin() {
        const adminUser = {
            username: 'admin',
            password: 'admin123',
            role: user_types_1.UserRole.ADMIN
        };
        await this.createUser(adminUser);
        this.logger.log('Created default admin user: admin/admin123');
    }
    async createUser(request) {
        const existingUser = Array.from(this.users.values()).find(u => u.username === request.username);
        if (existingUser) {
            throw new Error(`User ${request.username} already exists`);
        }
        const user = {
            id: (0, uuid_1.v4)(),
            username: request.username,
            password: request.password,
            role: request.role || user_types_1.UserRole.PLAYER,
            createdAt: new Date(),
            isActive: true
        };
        this.users.set(user.id, user);
        await this.saveUsers();
        this.logger.log(`Created user: ${user.username} with role ${user.role}`);
        return user;
    }
    async authenticateUser(username, password) {
        const user = Array.from(this.users.values()).find(u => u.username === username && u.isActive);
        if (!user) {
            return { success: false, message: 'User not found' };
        }
        if (user.password !== password) {
            return { success: false, message: 'Invalid password' };
        }
        user.lastLogin = new Date();
        await this.saveUsers();
        return {
            success: true,
            username: user.username,
            role: user.role,
            userId: user.id,
            message: `Welcome back, ${user.username}!`
        };
    }
    async getUserById(userId) {
        return this.users.get(userId);
    }
    async getUserByUsername(username) {
        return Array.from(this.users.values()).find(u => u.username === username);
    }
    async updateUserRole(userId, newRole) {
        const user = this.users.get(userId);
        if (!user) {
            return false;
        }
        user.role = newRole;
        await this.saveUsers();
        this.logger.log(`Updated user ${user.username} role to ${newRole}`);
        return true;
    }
    async deactivateUser(userId) {
        const user = this.users.get(userId);
        if (!user) {
            return false;
        }
        user.isActive = false;
        await this.saveUsers();
        this.logger.log(`Deactivated user ${user.username}`);
        return true;
    }
    async activateUser(userId) {
        const user = this.users.get(userId);
        if (!user) {
            return false;
        }
        user.isActive = true;
        await this.saveUsers();
        this.logger.log(`Activated user ${user.username}`);
        return true;
    }
    async resetUserPassword(userId, newPassword) {
        const user = this.users.get(userId);
        if (!user) {
            return false;
        }
        user.password = newPassword;
        await this.saveUsers();
        this.logger.log(`Reset password for user ${user.username}`);
        return true;
    }
    async checkPermission(check) {
        const user = this.users.get(check.userId);
        if (!user || !user.isActive) {
            return false;
        }
        const roleHierarchy = {
            [user_types_1.UserRole.PLAYER]: 1,
            [user_types_1.UserRole.MODERATOR]: 2,
            [user_types_1.UserRole.ADMIN]: 3
        };
        const userLevel = roleHierarchy[user.role] || 0;
        const requiredLevel = roleHierarchy[check.requiredRole] || 0;
        return userLevel >= requiredLevel;
    }
    async saveSessionData(sessionId, sessionData) {
        this.sessions.set(sessionId, {
            ...sessionData,
            lastSaved: new Date()
        });
        await this.saveSessions();
    }
    async getSessionData(sessionId) {
        return this.sessions.get(sessionId);
    }
    async removeSessionData(sessionId) {
        this.sessions.delete(sessionId);
        await this.saveSessions();
    }
    async getAllUsers() {
        return Array.from(this.users.values());
    }
    async getUsersByRole(role) {
        return Array.from(this.users.values()).filter(u => u.role === role && u.isActive);
    }
    getRoleHierarchy() {
        return {
            [user_types_1.UserRole.PLAYER]: 1,
            [user_types_1.UserRole.MODERATOR]: 2,
            [user_types_1.UserRole.ADMIN]: 3
        };
    }
    getRoleDisplayName(role) {
        switch (role) {
            case user_types_1.UserRole.ADMIN:
                return 'Administrator';
            case user_types_1.UserRole.MODERATOR:
                return 'Moderator';
            case user_types_1.UserRole.PLAYER:
                return 'Player';
            default:
                return 'Unknown';
        }
    }
};
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], UserService);
//# sourceMappingURL=user.service.js.map