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
exports.AdminWorldController = void 0;
const common_1 = require("@nestjs/common");
const permission_guard_1 = require("../../networking/permission.guard");
let AdminWorldController = class AdminWorldController {
    constructor() { }
    async getWorldOverview() {
        const sectors = [
            {
                id: 'town',
                name: 'Town',
                description: 'The main town area with shops and residences',
                rooms: [
                    {
                        id: 'town_square',
                        name: 'Town Square',
                        description: 'A bustling town square with a fountain in the center',
                        exits: { north: 'market_street', south: 'gate', east: 'bakery', west: 'blacksmith' },
                        npcs: ['town_guard', 'merchant'],
                        items: [],
                        players: ['player1', 'player2'],
                        coordinates: { x: 0, y: 0, z: 0 }
                    },
                    {
                        id: 'blacksmith',
                        name: 'Blacksmith Shop',
                        description: 'A smithy with the sound of hammering metal',
                        exits: { east: 'town_square' },
                        npcs: ['blacksmith'],
                        items: ['sword', 'armor'],
                        players: [],
                        coordinates: { x: -1, y: 0, z: 0 }
                    }
                ],
                npcs: [
                    {
                        id: 'blacksmith',
                        name: 'Grumpy the Blacksmith',
                        description: 'A burly dwarf with a long beard',
                        location: 'blacksmith',
                        template: 'blacksmith_template',
                        dialogueTree: 'blacksmith_dialogue',
                        stats: { health: 100, level: 5, aggression: 'friendly' }
                    }
                ],
                items: []
            }
        ];
        return {
            totalRooms: 25,
            totalNPCs: 15,
            totalItems: 50,
            activePlayers: 8,
            sectors
        };
    }
    async getAllRooms() {
        return [
            {
                id: 'town_square',
                name: 'Town Square',
                description: 'A bustling town square with a fountain in the center',
                exits: { north: 'market_street', south: 'gate', east: 'bakery', west: 'blacksmith' },
                npcs: ['town_guard', 'merchant'],
                items: [],
                players: ['player1', 'player2'],
                coordinates: { x: 0, y: 0, z: 0 }
            },
            {
                id: 'blacksmith',
                name: 'Blacksmith Shop',
                description: 'A smithy with the sound of hammering metal',
                exits: { east: 'town_square' },
                npcs: ['blacksmith'],
                items: ['sword', 'armor'],
                players: [],
                coordinates: { x: -1, y: 0, z: 0 }
            }
        ];
    }
    async getRoom(roomId) {
        const rooms = {
            'town_square': {
                id: 'town_square',
                name: 'Town Square',
                description: 'A bustling town square with a fountain in the center',
                exits: { north: 'market_street', south: 'gate', east: 'bakery', west: 'blacksmith' },
                npcs: ['town_guard', 'merchant'],
                items: [],
                players: ['player1', 'player2'],
                coordinates: { x: 0, y: 0, z: 0 }
            }
        };
        const room = rooms[roomId];
        if (!room) {
            return { error: 'Room not found' };
        }
        return room;
    }
    async createRoom(roomData) {
        try {
            const newRoom = {
                id: `room_${Date.now()}`,
                ...roomData
            };
            return {
                success: true,
                room: newRoom,
                message: 'Room created successfully'
            };
        }
        catch (error) {
            return {
                success: false,
                message: 'Failed to create room'
            };
        }
    }
    async updateRoom(roomId, roomData) {
        try {
            const updatedRoom = {
                id: roomId,
                name: roomData.name || 'Updated Room',
                description: roomData.description || 'Updated description',
                exits: roomData.exits || {},
                npcs: roomData.npcs || [],
                items: roomData.items || [],
                players: roomData.players || [],
                coordinates: roomData.coordinates || { x: 0, y: 0, z: 0 }
            };
            return {
                success: true,
                room: updatedRoom,
                message: 'Room updated successfully'
            };
        }
        catch (error) {
            return {
                success: false,
                message: 'Failed to update room'
            };
        }
    }
    async deleteRoom(roomId) {
        try {
            return {
                success: true,
                message: 'Room deleted successfully'
            };
        }
        catch (error) {
            return {
                success: false,
                message: 'Failed to delete room'
            };
        }
    }
    async getAllNPCs() {
        return [
            {
                id: 'blacksmith',
                name: 'Grumpy the Blacksmith',
                description: 'A burly dwarf with a long beard',
                location: 'blacksmith',
                template: 'blacksmith_template',
                dialogueTree: 'blacksmith_dialogue',
                stats: { health: 100, level: 5, aggression: 'friendly' }
            },
            {
                id: 'town_guard',
                name: 'Town Guard',
                description: 'A vigilant guard protecting the town',
                location: 'town_square',
                template: 'guard_template',
                dialogueTree: 'guard_dialogue',
                stats: { health: 120, level: 8, aggression: 'neutral' }
            }
        ];
    }
    async moveNPC(moveData) {
        try {
            return {
                success: true,
                message: `NPC moved to ${moveData.newLocation}`
            };
        }
        catch (error) {
            return {
                success: false,
                message: 'Failed to move NPC'
            };
        }
    }
    async getWorldSectors() {
        return [
            {
                id: 'town',
                name: 'Town',
                description: 'The main town area',
                rooms: [],
                npcs: [],
                items: []
            },
            {
                id: 'forest',
                name: 'Dark Forest',
                description: 'A mysterious and dangerous forest',
                rooms: [],
                npcs: [],
                items: []
            }
        ];
    }
    async getAllItems() {
        return [
            {
                id: 'sword',
                name: 'Iron Sword',
                description: 'A sturdy iron sword',
                type: 'weapon',
                value: 50
            },
            {
                id: 'armor',
                name: 'Leather Armor',
                description: 'Basic leather armor for protection',
                type: 'armor',
                value: 30
            },
            {
                id: 'potion',
                name: 'Health Potion',
                description: 'Restores health when consumed',
                type: 'consumable',
                value: 10
            }
        ];
    }
    async createItem(itemData) {
        try {
            const newItem = {
                id: itemData.id || `item_${Date.now()}`,
                ...itemData
            };
            return {
                success: true,
                item: newItem,
                message: 'Item created successfully'
            };
        }
        catch (error) {
            return {
                success: false,
                message: 'Failed to create item'
            };
        }
    }
    async moveItem(moveData) {
        try {
            return {
                success: true,
                message: `Item moved from ${moveData.fromRoomId} to ${moveData.toRoomId}`
            };
        }
        catch (error) {
            return {
                success: false,
                message: 'Failed to move item'
            };
        }
    }
    async deleteItem(itemId) {
        try {
            return {
                success: true,
                message: 'Item deleted successfully'
            };
        }
        catch (error) {
            return {
                success: false,
                message: 'Failed to delete item'
            };
        }
    }
};
exports.AdminWorldController = AdminWorldController;
__decorate([
    (0, common_1.Get)('overview'),
    (0, common_1.UseGuards)(permission_guard_1.PermissionGuard),
    (0, permission_guard_1.RequireModerator)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminWorldController.prototype, "getWorldOverview", null);
__decorate([
    (0, common_1.Get)('rooms'),
    (0, common_1.UseGuards)(permission_guard_1.PermissionGuard),
    (0, permission_guard_1.RequireModerator)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminWorldController.prototype, "getAllRooms", null);
__decorate([
    (0, common_1.Get)('rooms/:id'),
    (0, common_1.UseGuards)(permission_guard_1.PermissionGuard),
    (0, permission_guard_1.RequireModerator)(),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminWorldController.prototype, "getRoom", null);
__decorate([
    (0, common_1.Post)('rooms'),
    (0, common_1.UseGuards)(permission_guard_1.PermissionGuard),
    (0, permission_guard_1.RequireAdmin)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminWorldController.prototype, "createRoom", null);
__decorate([
    (0, common_1.Put)('rooms/:id'),
    (0, common_1.UseGuards)(permission_guard_1.PermissionGuard),
    (0, permission_guard_1.RequireAdmin)(),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminWorldController.prototype, "updateRoom", null);
__decorate([
    (0, common_1.Delete)('rooms/:id'),
    (0, common_1.UseGuards)(permission_guard_1.PermissionGuard),
    (0, permission_guard_1.RequireAdmin)(),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminWorldController.prototype, "deleteRoom", null);
__decorate([
    (0, common_1.Get)('npcs'),
    (0, common_1.UseGuards)(permission_guard_1.PermissionGuard),
    (0, permission_guard_1.RequireModerator)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminWorldController.prototype, "getAllNPCs", null);
__decorate([
    (0, common_1.Post)('npcs/move'),
    (0, common_1.UseGuards)(permission_guard_1.PermissionGuard),
    (0, permission_guard_1.RequireAdmin)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminWorldController.prototype, "moveNPC", null);
__decorate([
    (0, common_1.Get)('sectors'),
    (0, common_1.UseGuards)(permission_guard_1.PermissionGuard),
    (0, permission_guard_1.RequireModerator)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminWorldController.prototype, "getWorldSectors", null);
__decorate([
    (0, common_1.Get)('items'),
    (0, common_1.UseGuards)(permission_guard_1.PermissionGuard),
    (0, permission_guard_1.RequireModerator)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminWorldController.prototype, "getAllItems", null);
__decorate([
    (0, common_1.Post)('items'),
    (0, common_1.UseGuards)(permission_guard_1.PermissionGuard),
    (0, permission_guard_1.RequireAdmin)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminWorldController.prototype, "createItem", null);
__decorate([
    (0, common_1.Post)('items/move'),
    (0, common_1.UseGuards)(permission_guard_1.PermissionGuard),
    (0, permission_guard_1.RequireAdmin)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminWorldController.prototype, "moveItem", null);
__decorate([
    (0, common_1.Delete)('items/:id'),
    (0, common_1.UseGuards)(permission_guard_1.PermissionGuard),
    (0, permission_guard_1.RequireAdmin)(),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminWorldController.prototype, "deleteItem", null);
exports.AdminWorldController = AdminWorldController = __decorate([
    (0, common_1.Controller)('admin/world'),
    __metadata("design:paramtypes", [])
], AdminWorldController);
//# sourceMappingURL=admin-world.controller.js.map