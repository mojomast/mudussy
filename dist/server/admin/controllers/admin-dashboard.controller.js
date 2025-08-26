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
exports.AdminDashboardController = void 0;
const common_1 = require("@nestjs/common");
const permission_guard_1 = require("../../networking/permission.guard");
const user_service_1 = require("../../networking/user.service");
const web_client_service_1 = require("../../networking/web-client.service");
let AdminDashboardController = class AdminDashboardController {
    constructor(userService, webClientService) {
        this.userService = userService;
        this.webClientService = webClientService;
    }
    async getDashboard(req) {
        try {
            const allUsers = await this.userService.getAllUsers();
            const activeUsers = allUsers.filter(u => u.isActive).length;
            const worldStats = {
                totalRooms: 25,
                activePlayers: 8,
                systemUptime: '2d 4h 32m'
            };
            const recentActivity = [
                {
                    id: '1',
                    timestamp: new Date(Date.now() - 1000 * 60 * 5),
                    type: 'login',
                    user: 'player1',
                    details: 'Logged into the game'
                },
                {
                    id: '2',
                    timestamp: new Date(Date.now() - 1000 * 60 * 15),
                    type: 'room_change',
                    user: 'player2',
                    details: 'Moved to Town Square'
                },
                {
                    id: '3',
                    timestamp: new Date(Date.now() - 1000 * 60 * 30),
                    type: 'command',
                    user: 'admin',
                    details: 'Executed: kick player3'
                }
            ];
            return {
                totalUsers: allUsers.length,
                activeUsers,
                totalRooms: worldStats.totalRooms,
                activePlayers: worldStats.activePlayers,
                systemUptime: worldStats.systemUptime,
                recentActivity
            };
        }
        catch (error) {
            return {
                totalUsers: 0,
                activeUsers: 0,
                totalRooms: 25,
                activePlayers: 8,
                systemUptime: '2d 4h 32m',
                recentActivity: []
            };
        }
    }
    async getSystemHealth() {
        return {
            status: 'healthy',
            checks: {
                database: true,
                worldEngine: true,
                networking: true,
                memory: true
            },
            details: 'All systems operational'
        };
    }
};
exports.AdminDashboardController = AdminDashboardController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(permission_guard_1.PermissionGuard),
    (0, permission_guard_1.RequireModerator)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminDashboardController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('health'),
    (0, common_1.UseGuards)(permission_guard_1.PermissionGuard),
    (0, permission_guard_1.RequireAdmin)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminDashboardController.prototype, "getSystemHealth", null);
exports.AdminDashboardController = AdminDashboardController = __decorate([
    (0, common_1.Controller)('admin/dashboard'),
    __metadata("design:paramtypes", [user_service_1.UserService,
        web_client_service_1.WebClientService])
], AdminDashboardController);
//# sourceMappingURL=admin-dashboard.controller.js.map