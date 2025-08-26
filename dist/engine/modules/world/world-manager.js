"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorldManager = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const events_1 = require("events");
const uuid_1 = require("uuid");
const event_1 = require("../../core/event");
const types_1 = require("./types");
const npc_manager_1 = require("./npc-manager");
class WorldManager extends events_1.EventEmitter {
    constructor(eventSystem, config, logger, playerManager) {
        super();
        this.rooms = new Map();
        this.items = new Map();
        this.npcs = new Map();
        this.areas = new Map();
        this.eventSystem = eventSystem;
        this.config = config;
        this.logger = logger || console;
        this.worldData = this.createEmptyWorld();
        this.npcManager = new npc_manager_1.NPCManager(eventSystem, logger);
        this.playerManager = playerManager;
        this.setupEventHandlers();
    }
    setPlayerManager(playerManager) {
        this.playerManager = playerManager;
    }
    createEmptyWorld() {
        return {
            sectors: [],
            areas: [],
            rooms: [],
            items: [],
            npcs: [],
            metadata: {
                version: '1.0.0',
                created: new Date(),
                updated: new Date()
            }
        };
    }
    mergeSectorData(sectorData) {
        if (sectorData.areas) {
            this.worldData.areas.push(...sectorData.areas);
        }
        if (sectorData.rooms) {
            this.worldData.rooms.push(...sectorData.rooms);
        }
        if (sectorData.items) {
            this.worldData.items.push(...sectorData.items);
        }
        if (sectorData.npcs) {
            this.worldData.npcs.push(...sectorData.npcs);
        }
        if (sectorData.npcFiles) {
            if (!this.worldData.npcFiles) {
                this.worldData.npcFiles = [];
            }
            this.worldData.npcFiles.push(...sectorData.npcFiles);
        }
    }
    async loadWorld(worldPath) {
        const contentPath = worldPath || this.config.contentPath;
        try {
            this.logger.log(`Loading world from: ${contentPath}`);
            const worldFile = path.join(contentPath, 'world.json');
            const worldYamlFile = path.join(contentPath, 'world.yaml');
            let data;
            if (fs.existsSync(worldFile)) {
                const content = fs.readFileSync(worldFile, 'utf8');
                data = JSON.parse(content);
            }
            else if (fs.existsSync(worldYamlFile)) {
                throw new Error('YAML support not implemented yet');
            }
            else {
                throw new Error(`No world file found at ${contentPath}`);
            }
            this.worldData = {
                ...data,
                areas: data.areas || [],
                rooms: data.rooms || [],
                items: data.items || [],
                npcs: data.npcs || [],
                npcFiles: data.npcFiles || []
            };
            if (data.sectors && data.sectors.length > 0) {
                this.logger.log(`Loading ${data.sectors.length} sectors...`);
                for (const sectorPath of data.sectors) {
                    const fullSectorPath = path.join(contentPath, sectorPath);
                    if (fs.existsSync(fullSectorPath)) {
                        const sectorContent = fs.readFileSync(fullSectorPath, 'utf8');
                        const sectorData = JSON.parse(sectorContent);
                        this.mergeSectorData(sectorData);
                        this.logger.log(`Loaded sector: ${sectorPath}`);
                    }
                    else {
                        this.logger.warn(`Sector file not found: ${fullSectorPath}`);
                    }
                }
            }
            if (data.npcFiles && data.npcFiles.length > 0) {
                this.logger.log(`Loading ${data.npcFiles.length} NPC files...`);
                for (const npcPath of data.npcFiles) {
                    const fullNPCPath = path.join(contentPath, npcPath);
                    if (fs.existsSync(fullNPCPath)) {
                        await this.npcManager.loadNPC(fullNPCPath);
                    }
                    else {
                        this.logger.warn(`NPC file not found: ${fullNPCPath}`);
                    }
                }
            }
            this.buildLookupMaps();
            const npcStats = this.npcManager.getStatistics();
            this.eventSystem.emit(new event_1.GameEvent(types_1.WorldEventTypes.WORLD_LOADED, 'world', undefined, {
                roomCount: this.rooms.size,
                itemCount: this.items.size,
                legacyNpcCount: this.npcs.size,
                npcDefinitionCount: npcStats.totalDefinitions,
                areaCount: this.areas.size
            }));
            this.logger.log(`World loaded: ${this.rooms.size} rooms, ${this.items.size} items, ${this.npcs.size} legacy NPCs, ${npcStats.totalDefinitions} NPC definitions`);
        }
        catch (error) {
            this.logger.error('Failed to load world:', error);
            throw error;
        }
    }
    async saveWorld(worldPath) {
        const contentPath = worldPath || this.config.contentPath;
        try {
            this.worldData.metadata.updated = new Date();
            this.worldData.rooms = Array.from(this.rooms.values());
            this.worldData.items = Array.from(this.items.values());
            this.worldData.npcs = Array.from(this.npcs.values());
            this.worldData.areas = Array.from(this.areas.values());
            if (!fs.existsSync(contentPath)) {
                fs.mkdirSync(contentPath, { recursive: true });
            }
            const worldFile = path.join(contentPath, 'world.json');
            fs.writeFileSync(worldFile, JSON.stringify(this.worldData, null, 2), 'utf8');
            this.eventSystem.emit(new event_1.GameEvent(types_1.WorldEventTypes.WORLD_SAVED, 'world', undefined, { path: worldFile }));
            this.logger.log(`World saved to: ${worldFile}`);
        }
        catch (error) {
            this.logger.error('Failed to save world:', error);
            throw error;
        }
    }
    buildLookupMaps() {
        this.rooms.clear();
        this.items.clear();
        this.npcs.clear();
        this.areas.clear();
        for (const room of this.worldData.rooms) {
            room.exits = room.exits || [];
            room.items = room.items || [];
            room.npcs = room.npcs || [];
            room.players = room.players || [];
            this.rooms.set(room.id, room);
        }
        for (const item of this.worldData.items) {
            this.items.set(item.id, item);
        }
        for (const npc of this.worldData.npcs) {
            this.npcs.set(npc.id, npc);
        }
        for (const area of this.worldData.areas) {
            this.areas.set(area.id, area);
        }
    }
    getRoom(roomId) {
        return this.rooms.get(roomId);
    }
    getAllRooms() {
        return Array.from(this.rooms.values());
    }
    getItem(itemId) {
        return this.items.get(itemId);
    }
    getAllItems() {
        return Array.from(this.items.values());
    }
    getItemsInRoom(roomId) {
        const room = this.getRoom(roomId);
        if (!room)
            return [];
        return room.items
            .map(itemId => this.getItem(itemId))
            .filter((item) => item !== undefined);
    }
    getNPC(npcId) {
        return this.npcs.get(npcId);
    }
    getAllNPCs() {
        return Array.from(this.npcs.values());
    }
    getNPCsInRoom(roomId) {
        const room = this.getRoom(roomId);
        if (!room)
            return [];
        const legacyNPCs = room.npcs
            .map(npcId => this.getNPC(npcId))
            .filter((npc) => npc !== undefined);
        const activeNPCs = this.npcManager.getNPCsInRoom(roomId);
        return [...legacyNPCs, ...activeNPCs];
    }
    getPlayersInRoom(roomId) {
        const room = this.getRoom(roomId);
        return room ? room.players : [];
    }
    movePlayer(playerId, fromRoomId, toRoomId) {
        const fromRoom = this.getRoom(fromRoomId);
        const toRoom = this.getRoom(toRoomId);
        if (!fromRoom || !toRoom)
            return false;
        fromRoom.players = fromRoom.players.filter(id => id !== playerId);
        if (!toRoom.players.includes(playerId)) {
            toRoom.players.push(playerId);
        }
        this.eventSystem.emit(new event_1.GameEvent(types_1.WorldEventTypes.ROOM_LEFT, 'world', playerId, { fromRoomId, toRoomId }));
        this.eventSystem.emit(new event_1.GameEvent(types_1.WorldEventTypes.ROOM_ENTERED, 'world', playerId, { fromRoomId, toRoomId }));
        return true;
    }
    addItemToRoom(itemId, roomId) {
        const room = this.getRoom(roomId);
        let item = this.getItem(itemId);
        if (!room)
            return false;
        if (!item) {
            item = {
                id: itemId,
                name: itemId,
                description: '',
                type: 'generic',
                flags: [],
                created: new Date(),
                updated: new Date()
            };
            this.items.set(itemId, item);
            this.worldData.items.push(item);
        }
        if (!room.items.includes(itemId)) {
            room.items.push(itemId);
            return true;
        }
        return false;
    }
    removeItemFromRoom(itemId, roomId) {
        const room = this.getRoom(roomId);
        if (!room)
            return false;
        const index = room.items.indexOf(itemId);
        if (index !== -1) {
            room.items.splice(index, 1);
            return true;
        }
        return false;
    }
    createRoom(name, description, areaId = 'default') {
        const roomId = (0, uuid_1.v4)();
        const room = {
            id: roomId,
            name,
            description,
            area: areaId,
            exits: [],
            items: [],
            npcs: [],
            players: [],
            flags: [],
            created: new Date(),
            updated: new Date()
        };
        this.rooms.set(roomId, room);
        this.worldData.rooms.push(room);
        return room;
    }
    createExit(fromRoomId, toRoomId, direction, description) {
        const fromRoom = this.getRoom(fromRoomId);
        const toRoom = this.getRoom(toRoomId);
        if (!fromRoom || !toRoom)
            return null;
        const existingExit = fromRoom.exits.find(exit => exit.direction === direction);
        if (existingExit)
            return null;
        const exitId = (0, uuid_1.v4)();
        const exit = {
            id: exitId,
            direction,
            toRoomId,
            description,
            verbs: [direction],
            flags: []
        };
        fromRoom.exits.push(exit);
        const reverseDirection = types_1.DirectionMap[direction];
        if (reverseDirection) {
            const reverseExit = {
                id: (0, uuid_1.v4)(),
                direction: reverseDirection,
                toRoomId: fromRoomId,
                description,
                verbs: [reverseDirection],
                flags: []
            };
            toRoom.exits.push(reverseExit);
        }
        return exit;
    }
    findExit(roomId, directionOrVerb) {
        const room = this.getRoom(roomId);
        if (!room)
            return null;
        const normalized = types_1.DirectionAliases[directionOrVerb] || directionOrVerb;
        return room.exits.find(exit => exit.direction === normalized ||
            exit.verbs.includes(normalized)) || null;
    }
    getRoomDescription(roomId, viewerSessionId) {
        const room = this.getRoom(roomId);
        if (!room)
            return 'Room not found.';
        let description = `${room.name}\n\n${room.description}\n\n`;
        if (room.exits.length > 0) {
            const exitList = room.exits.map(exit => exit.direction).join(', ');
            description += `Exits: ${exitList}\n`;
        }
        else {
            description += 'There are no obvious exits.\n';
        }
        const items = this.getItemsInRoom(roomId);
        if (items.length > 0) {
            description += '\nItems here:\n';
            items.forEach(item => {
                description += `  ${item.name}\n`;
            });
        }
        const npcs = this.getNPCsInRoom(roomId);
        if (npcs.length > 0) {
            description += '\nYou see:\n';
            npcs.forEach(npc => {
                description += `  ${npc.name}\n`;
            });
        }
        const players = this.getPlayersInRoom(roomId);
        const others = viewerSessionId ? players.filter(p => p !== viewerSessionId) : players;
        if (others.length > 0) {
            description += '\nAlso here:\n';
            others.forEach(sessionId => {
                const name = this.playerManager?.getPlayerBySessionId(sessionId)?.username || `Player ${sessionId}`;
                description += `  ${name}\n`;
            });
        }
        return description;
    }
    validateWorld() {
        const errors = [];
        for (const room of this.rooms.values()) {
            if (!this.areas.has(room.area)) {
                errors.push(`Room ${room.id} references non-existent area ${room.area}`);
            }
        }
        for (const room of this.rooms.values()) {
            for (const exit of room.exits) {
                if (!this.rooms.has(exit.toRoomId)) {
                    errors.push(`Room ${room.id} has exit to non-existent room ${exit.toRoomId}`);
                }
            }
        }
        for (const item of this.items.values()) {
            let found = false;
            for (const room of this.rooms.values()) {
                if (room.items.includes(item.id)) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                errors.push(`Item ${item.id} is not in any room`);
            }
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
    getStatistics() {
        const npcStats = this.npcManager.getStatistics();
        return {
            rooms: this.rooms.size,
            items: this.items.size,
            legacyNpcs: this.npcs.size,
            npcDefinitions: npcStats.totalDefinitions,
            activeNpcs: npcStats.activeNPCs,
            areas: this.areas.size,
            metadata: this.worldData.metadata
        };
    }
    getStartingRoomId() {
        const preferred = this.config?.defaultRoomId;
        if (preferred && this.rooms.has(preferred)) {
            return preferred;
        }
        const first = this.getAllRooms()[0]?.id;
        return first || null;
    }
    getNPCManager() {
        return this.npcManager;
    }
    setupEventHandlers() {
        this.eventSystem.on(types_1.WorldEventTypes.ROOM_ENTERED, (event) => {
            this.handleRoomEntered(event);
        });
        this.eventSystem.on(types_1.WorldEventTypes.ROOM_LEFT, (event) => {
            this.handleRoomLeft(event);
        });
        this.eventSystem.on('admin.create.room', (event) => {
            const { roomId, name, description } = event.data || {};
            if (!roomId)
                return;
            if (this.getRoom(roomId))
                return;
            const room = {
                id: roomId,
                name: name ?? roomId,
                description: description ?? '',
                area: 'default',
                exits: [],
                items: [],
                npcs: [],
                players: [],
                flags: [],
                created: new Date(),
                updated: new Date()
            };
            this.rooms.set(roomId, room);
            this.worldData.rooms.push(room);
            this.logger.log(`Admin created room ${roomId}`);
        });
        this.eventSystem.on('admin.set.description', (event) => {
            const { roomId, description } = event.data || {};
            if (!roomId)
                return;
            const room = this.getRoom(roomId);
            if (room) {
                room.description = description ?? room.description;
                room.updated = new Date();
                this.logger.log(`Admin updated description for ${roomId}`);
            }
        });
    }
    handleRoomEntered(event) {
        if (!event.data)
            return;
        const { fromRoomId, toRoomId } = event.data;
        const playerId = event.target;
        const room = this.getRoom(toRoomId);
        if (room && !room.players.includes(playerId)) {
            room.players.push(playerId);
            this.logger.log(`Player ${playerId} entered room ${toRoomId}`);
        }
    }
    handleRoomLeft(event) {
        if (!event.data)
            return;
        const { fromRoomId, toRoomId } = event.data;
        const playerId = event.target;
        const room = this.getRoom(fromRoomId);
        if (room) {
            room.players = room.players.filter(id => id !== playerId);
            this.logger.log(`Player ${playerId} left room ${fromRoomId}`);
        }
    }
    cleanup() {
        this.npcManager.cleanup();
        this.rooms.clear();
        this.items.clear();
        this.npcs.clear();
        this.areas.clear();
    }
}
exports.WorldManager = WorldManager;
//# sourceMappingURL=world-manager.js.map