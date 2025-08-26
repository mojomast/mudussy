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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NPCManager = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const events_1 = require("events");
const event_1 = require("../../core/event");
const types_1 = require("./types");
const npc_templates_1 = __importDefault(require("./npc-templates"));
const sample_npcs_1 = __importDefault(require("./sample-npcs"));
class NPCManager extends events_1.EventEmitter {
    constructor(eventSystem, logger) {
        super();
        this.npcDefinitions = new Map();
        this.activeNPCs = new Map();
        this.roomNPCs = new Map();
        this.npcTemplates = new Map();
        this.despawnTimers = new Map();
        this.eventSystem = eventSystem;
        this.logger = logger || console;
        this.eventSystem.on(types_1.WorldEventTypes.ROOM_ENTERED, this.handleRoomEnter.bind(this));
        this.eventSystem.on(types_1.WorldEventTypes.ROOM_LEFT, this.handleRoomLeave.bind(this));
    }
    async loadNPC(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const npcData = JSON.parse(content);
            npcData.metadata.created = new Date(npcData.metadata.created);
            npcData.metadata.updated = new Date(npcData.metadata.updated);
            this.npcDefinitions.set(npcData.id, npcData);
            this.logger.log(`Loaded NPC: ${npcData.name} (${npcData.id})`);
        }
        catch (error) {
            this.logger.error(`Failed to load NPC from ${filePath}:`, error);
            throw error;
        }
    }
    async loadNPCsFromDirectory(directoryPath) {
        try {
            const files = fs.readdirSync(directoryPath);
            const npcFiles = files.filter(file => file.endsWith('.json'));
            this.logger.log(`Loading ${npcFiles.length} NPCs from ${directoryPath}...`);
            for (const file of npcFiles) {
                const filePath = path.join(directoryPath, file);
                await this.loadNPC(filePath);
            }
            this.logger.log(`Successfully loaded ${npcFiles.length} NPCs`);
        }
        catch (error) {
            this.logger.error(`Failed to load NPCs from directory ${directoryPath}:`, error);
            throw error;
        }
    }
    spawnNPC(npcId, roomId) {
        const npcData = this.npcDefinitions.get(npcId);
        if (!npcData) {
            this.logger.warn(`Cannot spawn NPC ${npcId}: definition not found`);
            return null;
        }
        if (this.activeNPCs.has(npcId)) {
            this.logger.warn(`NPC ${npcId} is already active`);
            return this.activeNPCs.get(npcId);
        }
        const npc = {
            id: npcId,
            name: npcData.name,
            description: npcData.description,
            shortDescription: npcData.shortDescription,
            roomId: roomId,
            dialogueProvider: npcData.dialogueProvider,
            behaviors: [...npcData.behaviors],
            stats: { ...npcData.stats },
            flags: [...npcData.flags],
            created: new Date(),
            updated: new Date()
        };
        this.activeNPCs.set(npcId, npc);
        if (!this.roomNPCs.has(roomId)) {
            this.roomNPCs.set(roomId, new Set());
        }
        this.roomNPCs.get(roomId).add(npcId);
        this.eventSystem.emit(new event_1.GameEvent(types_1.WorldEventTypes.NPC_SPAWNED, 'npc', npcId, {
            npcId,
            roomId,
            npcData: npc
        }));
        this.logger.log(`Spawned NPC: ${npc.name} in room ${roomId}`);
        return npc;
    }
    despawnNPC(npcId, delay = 0) {
        const npc = this.activeNPCs.get(npcId);
        if (!npc) {
            return false;
        }
        const doDespawn = () => {
            const roomId = npc.roomId;
            this.activeNPCs.delete(npcId);
            const roomSet = this.roomNPCs.get(roomId);
            if (roomSet) {
                roomSet.delete(npcId);
                if (roomSet.size === 0) {
                    this.roomNPCs.delete(roomId);
                }
            }
            const existingTimer = this.despawnTimers.get(npcId);
            if (existingTimer) {
                clearTimeout(existingTimer);
                this.despawnTimers.delete(npcId);
            }
            this.eventSystem.emit(new event_1.GameEvent(types_1.WorldEventTypes.NPC_DESPAWNED, 'npc', npcId, {
                npcId,
                roomId,
                npcData: npc
            }));
            this.logger.log(`Despawned NPC: ${npc.name} from room ${roomId}`);
        };
        if (delay > 0) {
            const timer = setTimeout(doDespawn, delay);
            this.despawnTimers.set(npcId, timer);
            return true;
        }
        else {
            doDespawn();
            return true;
        }
    }
    handleRoomEnter(event) {
        const { fromRoomId, toRoomId } = event.data;
        const playerId = event.target;
        const npcsToSpawn = this.getNPCsForRoom(toRoomId);
        for (const npcId of npcsToSpawn) {
            const npcData = this.npcDefinitions.get(npcId);
            if (!npcData)
                continue;
            if (this.checkSpawnConditions(npcData.spawnData, toRoomId, playerId)) {
                this.spawnNPC(npcId, toRoomId);
            }
        }
    }
    handleRoomLeave(event) {
        const { fromRoomId, toRoomId } = event.data;
        const roomNPCs = this.roomNPCs.get(fromRoomId);
        if (!roomNPCs || roomNPCs.size === 0)
            return;
        for (const npcId of roomNPCs) {
            const npcData = this.npcDefinitions.get(npcId);
            if (!npcData)
                continue;
            if (this.checkDespawnConditions(npcData.spawnData, fromRoomId)) {
                const delay = npcData.spawnData.despawnConditions?.find(c => c.delay)?.delay || 0;
                this.despawnNPC(npcId, delay);
            }
        }
    }
    getNPCsForRoom(roomId) {
        const npcs = [];
        for (const [npcId, npcData] of this.npcDefinitions) {
            if (npcData.spawnData.spawnRoomId === roomId) {
                npcs.push(npcId);
            }
        }
        return npcs;
    }
    checkSpawnConditions(spawnData, roomId, playerId) {
        if (!spawnData.spawnConditions || spawnData.spawnConditions.length === 0) {
            return true;
        }
        for (const condition of spawnData.spawnConditions) {
            switch (condition.type) {
                case 'player_enter':
                    return true;
                case 'time':
                    return true;
                case 'event':
                    return true;
                default:
                    return true;
            }
        }
        return true;
    }
    checkDespawnConditions(spawnData, roomId) {
        if (!spawnData.despawnConditions || spawnData.despawnConditions.length === 0) {
            return false;
        }
        for (const condition of spawnData.despawnConditions) {
            switch (condition.type) {
                case 'no_players':
                    return true;
                case 'time':
                    return true;
                case 'room_empty':
                    return true;
                default:
                    return false;
            }
        }
        return false;
    }
    getActiveNPC(npcId) {
        return this.activeNPCs.get(npcId);
    }
    getAllActiveNPCs() {
        return Array.from(this.activeNPCs.values());
    }
    getNPCsInRoom(roomId) {
        const npcIds = this.roomNPCs.get(roomId);
        if (!npcIds)
            return [];
        return Array.from(npcIds)
            .map(npcId => this.activeNPCs.get(npcId))
            .filter((npc) => npc !== undefined);
    }
    getNPCDefinition(npcId) {
        return this.npcDefinitions.get(npcId);
    }
    getAllNPCDefinitions() {
        return Array.from(this.npcDefinitions.values());
    }
    isNPCActive(npcId) {
        return this.activeNPCs.has(npcId);
    }
    getStatistics() {
        return {
            totalDefinitions: this.npcDefinitions.size,
            activeNPCs: this.activeNPCs.size,
            roomsWithNPCs: this.roomNPCs.size,
            despawnTimers: this.despawnTimers.size
        };
    }
    registerTemplate(templateId, template) {
        this.npcTemplates.set(templateId, template);
        this.logger.log(`Registered NPC template: ${templateId} (${template.metadata.type})`);
    }
    registerTemplates(templates) {
        for (const [templateId, template] of Object.entries(templates)) {
            this.registerTemplate(templateId, template);
        }
    }
    getTemplate(templateId) {
        return this.npcTemplates.get(templateId);
    }
    getAllTemplates() {
        return Array.from(this.npcTemplates.values());
    }
    createNPCFromTemplate(templateId, spawnRoomId, sectorId = 'default', customizations) {
        const template = this.npcTemplates.get(templateId);
        if (!template) {
            this.logger.warn(`Cannot create NPC from template ${templateId}: template not found`);
            return null;
        }
        const npcData = npc_templates_1.default.templateToNPCData(template, spawnRoomId, sectorId);
        if (customizations) {
            Object.assign(npcData, customizations);
        }
        this.npcDefinitions.set(npcData.id, npcData);
        return this.spawnNPC(npcData.id, spawnRoomId);
    }
    loadSampleNPCs() {
        const sampleNPCs = sample_npcs_1.default.getAllSampleNPCs();
        for (const npcData of sampleNPCs) {
            this.npcDefinitions.set(npcData.id, npcData);
            this.logger.log(`Loaded sample NPC: ${npcData.name} (${npcData.id})`);
        }
        this.logger.log(`Loaded ${sampleNPCs.length} sample NPCs`);
    }
    loadSampleNPCsByType(type) {
        const sampleNPCs = sample_npcs_1.default.getSampleNPCsByType(type);
        for (const npcData of sampleNPCs) {
            this.npcDefinitions.set(npcData.id, npcData);
            this.logger.log(`Loaded sample ${type} NPC: ${npcData.name} (${npcData.id})`);
        }
        this.logger.log(`Loaded ${sampleNPCs.length} sample ${type} NPCs`);
    }
    spawnNPCsFromTemplates(templateConfigs) {
        const spawnedNPCs = [];
        for (const config of templateConfigs) {
            const npc = this.createNPCFromTemplate(config.templateId, config.spawnRoomId, config.sectorId, config.customizations);
            if (npc) {
                spawnedNPCs.push(npc);
            }
        }
        this.logger.log(`Spawned ${spawnedNPCs.length} NPCs from templates`);
        return spawnedNPCs;
    }
    getTemplateStatistics() {
        const templateTypes = {};
        for (const template of this.npcTemplates.values()) {
            const type = template.metadata.type;
            templateTypes[type] = (templateTypes[type] || 0) + 1;
        }
        return {
            totalTemplates: this.npcTemplates.size,
            templatesByType: templateTypes
        };
    }
    cleanup() {
        for (const timer of this.despawnTimers.values()) {
            clearTimeout(timer);
        }
        this.despawnTimers.clear();
        this.npcDefinitions.clear();
        this.activeNPCs.clear();
        this.roomNPCs.clear();
        this.npcTemplates.clear();
    }
}
exports.NPCManager = NPCManager;
//# sourceMappingURL=npc-manager.js.map