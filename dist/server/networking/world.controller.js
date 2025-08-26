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
exports.WorldController = void 0;
const common_1 = require("@nestjs/common");
const world_manager_1 = require("../../engine/modules/world/world-manager");
const player_manager_1 = require("../../engine/modules/persistence/player-manager");
let WorldController = class WorldController {
    constructor(worldManager, playerManager) {
        this.worldManager = worldManager;
        this.playerManager = playerManager;
    }
    async getWorldData() {
        const rooms = this.worldManager.getAllRooms().map(r => ({
            id: r.id,
            name: r.name,
            description: r.description,
            exits: r.exits.map(e => e.direction),
            players: r.players,
        }));
        const players = this.playerManager.getAllActivePlayers().map(p => ({
            id: p.sessionId,
            name: p.username,
            location: p.currentRoomId,
            status: 'online',
        }));
        return {
            name: 'MUD Engine World',
            description: 'Live world data',
            rooms,
            players,
        };
    }
    async getRooms() {
        return this.worldManager.getAllRooms().map(r => ({
            id: r.id,
            name: r.name,
            description: r.description,
            exits: r.exits.map(e => e.direction),
            players: r.players,
        }));
    }
    async getRoom(roomId) {
        const room = this.worldManager.getRoom(roomId);
        if (!room)
            return { error: 'Room not found' };
        return {
            id: room.id,
            name: room.name,
            description: room.description,
            exits: room.exits.map(e => e.direction),
            players: room.players,
        };
    }
    async getPlayers() {
        return this.playerManager.getAllActivePlayers().map(p => ({
            id: p.sessionId,
            name: p.username,
            location: p.currentRoomId,
            status: 'online',
        }));
    }
    async getPlayer(playerId) {
        const player = this.playerManager.getAllActivePlayers().find(p => p.sessionId === playerId);
        if (!player)
            return { error: 'Player not found' };
        return {
            id: player.sessionId,
            name: player.username,
            location: player.currentRoomId,
            status: 'online',
        };
    }
    async getWorldStats() {
        const players = this.playerManager.getPlayerCount();
        const rooms = this.worldManager.getAllRooms().length;
        return {
            totalPlayers: players,
            activePlayers: players,
            totalRooms: rooms,
            uptime: 'unknown',
        };
    }
};
exports.WorldController = WorldController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WorldController.prototype, "getWorldData", null);
__decorate([
    (0, common_1.Get)('rooms'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WorldController.prototype, "getRooms", null);
__decorate([
    (0, common_1.Get)('rooms/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WorldController.prototype, "getRoom", null);
__decorate([
    (0, common_1.Get)('players'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WorldController.prototype, "getPlayers", null);
__decorate([
    (0, common_1.Get)('players/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WorldController.prototype, "getPlayer", null);
__decorate([
    (0, common_1.Get)('stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WorldController.prototype, "getWorldStats", null);
exports.WorldController = WorldController = __decorate([
    (0, common_1.Controller)('world'),
    __metadata("design:paramtypes", [world_manager_1.WorldManager,
        player_manager_1.PlayerManager])
], WorldController);
//# sourceMappingURL=world.controller.js.map