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
exports.WorldSaveSystem = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const events_1 = require("events");
const uuid_1 = require("uuid");
const crypto = __importStar(require("crypto"));
const event_1 = require("../../core/event");
const types_1 = require("./types");
class WorldSaveSystem extends events_1.EventEmitter {
    constructor(config, eventSystem, worldManager, logger) {
        super();
        this.config = config;
        this.eventSystem = eventSystem;
        this.logger = logger || console;
        this.savePath = path.join(config.savePath, 'world');
        this.backupPath = path.join(config.backupPath, 'world');
        this.worldManager = worldManager;
    }
    async save(data, type, description) {
        if (type !== types_1.SaveType.WORLD && type !== types_1.SaveType.FULL) {
            throw new Error('Invalid save type for world save system');
        }
        const saveId = (0, uuid_1.v4)();
        const savePath = path.join(this.savePath, `${saveId}.json`);
        this.logger.log(`💾 Saving world: ${saveId}`);
        try {
            if (fs.existsSync(savePath)) {
                await this.createBackup(savePath, 'Auto-backup before save');
            }
            const worldData = {
                areas: [],
                rooms: [],
                items: [],
                npcs: [],
                modifiedRooms: {},
                modifiedItems: {},
                modifiedNPCs: {},
                metadata: {
                    version: '1.0.0',
                    created: new Date(),
                    updated: new Date()
                }
            };
            await this.worldManager.saveWorld(this.savePath);
            const worldFilePath = path.join(this.savePath, 'world.json');
            if (fs.existsSync(worldFilePath)) {
                const content = fs.readFileSync(worldFilePath, 'utf8');
                const baseWorldData = JSON.parse(content);
                worldData.areas = baseWorldData.areas || [];
                worldData.rooms = baseWorldData.rooms || [];
                worldData.items = baseWorldData.items || [];
                worldData.npcs = baseWorldData.npcs || [];
                worldData.metadata = baseWorldData.metadata || worldData.metadata;
            }
            const saveFile = {
                metadata: this.createSaveMetadata(saveId, type, description, worldData),
                data: worldData
            };
            const content = JSON.stringify(saveFile, null, 2);
            fs.writeFileSync(savePath, content, 'utf8');
            this.logger.log(`✅ World saved: ${saveId}`);
            this.eventSystem.emit(new event_1.GameEvent(types_1.PersistenceEventTypes.SAVE_COMPLETED, 'world-save-system', saveId, {
                type,
                path: savePath,
                description,
                roomCount: worldData.rooms.length,
                itemCount: worldData.items.length,
                npcCount: worldData.npcs.length
            }));
            return saveId;
        }
        catch (error) {
            this.logger.error(`❌ Failed to save world:`, error);
            throw error;
        }
    }
    async load(saveId) {
        const savePath = path.join(this.savePath, `${saveId}.json`);
        try {
            if (!fs.existsSync(savePath)) {
                throw new Error(`World save file not found: ${saveId}`);
            }
            const content = fs.readFileSync(savePath, 'utf8');
            const saveFile = JSON.parse(content);
            if (this.config.validateOnLoad) {
                const validation = this.validateSaveFile(saveFile);
                if (!validation.valid) {
                    throw new Error(`Save validation failed: ${validation.errors.join(', ')}`);
                }
            }
            const worldData = saveFile.data;
            const worldFilePath = path.join(this.savePath, 'world.json');
            fs.writeFileSync(worldFilePath, JSON.stringify({
                areas: worldData.areas,
                rooms: worldData.rooms,
                items: worldData.items,
                npcs: worldData.npcs,
                metadata: worldData.metadata
            }, null, 2));
            await this.worldManager.loadWorld(this.savePath);
            this.logger.log(`📂 World loaded: ${saveId} (${worldData.rooms.length} rooms, ${worldData.items.length} items, ${worldData.npcs.length} NPCs)`);
            this.eventSystem.emit(new event_1.GameEvent(types_1.PersistenceEventTypes.LOAD_COMPLETED, 'world-save-system', saveId, {
                type: types_1.SaveType.WORLD,
                path: savePath,
                roomCount: worldData.rooms.length,
                itemCount: worldData.items.length,
                npcCount: worldData.npcs.length
            }));
            return worldData;
        }
        catch (error) {
            this.logger.error(`❌ Failed to load world ${saveId}:`, error);
            throw error;
        }
    }
    async saveWorldState(saveId, description) {
        const worldData = {
            areas: [],
            rooms: [],
            items: [],
            npcs: [],
            modifiedRooms: {},
            modifiedItems: {},
            modifiedNPCs: {},
            metadata: {
                version: '1.0.0',
                created: new Date(),
                updated: new Date()
            }
        };
        return this.save(worldData, types_1.SaveType.WORLD, description);
    }
    async loadWorldState(saveId) {
        await this.load(saveId);
    }
    async listSaves() {
        try {
            const saves = [];
            if (!fs.existsSync(this.savePath)) {
                return saves;
            }
            const files = fs.readdirSync(this.savePath)
                .filter(file => file.endsWith('.json') && file !== 'world.json')
                .map(file => path.join(this.savePath, file));
            for (const filePath of files) {
                try {
                    const content = fs.readFileSync(filePath, 'utf8');
                    const saveFile = JSON.parse(content);
                    const stat = fs.statSync(filePath);
                    saves.push({
                        id: path.basename(filePath, '.json'),
                        type: saveFile.metadata.saveType,
                        timestamp: new Date(saveFile.metadata.timestamp),
                        description: saveFile.metadata.description,
                        size: stat.size,
                        checksum: saveFile.metadata.checksum
                    });
                }
                catch (error) {
                    this.logger.warn(`Failed to read save file ${filePath}:`, error);
                }
            }
            saves.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
            return saves;
        }
        catch (error) {
            this.logger.error('Failed to list world saves:', error);
            return [];
        }
    }
    async delete(saveId) {
        const savePath = path.join(this.savePath, `${saveId}.json`);
        try {
            if (fs.existsSync(savePath)) {
                await this.createBackup(savePath, 'Backup before deletion');
                fs.unlinkSync(savePath);
                this.logger.log(`🗑️  Deleted world save: ${saveId}`);
                return true;
            }
            return false;
        }
        catch (error) {
            this.logger.error(`Failed to delete world save ${saveId}:`, error);
            return false;
        }
    }
    async validate(saveId) {
        const savePath = path.join(this.savePath, `${saveId}.json`);
        try {
            if (!fs.existsSync(savePath)) {
                return {
                    valid: false,
                    errors: ['Save file not found'],
                    warnings: [],
                    checksumValid: false,
                    versionCompatible: false
                };
            }
            const content = fs.readFileSync(savePath, 'utf8');
            const saveFile = JSON.parse(content);
            return this.validateSaveFile(saveFile);
        }
        catch (error) {
            return {
                valid: false,
                errors: [`Failed to validate save: ${error.message}`],
                warnings: [],
                checksumValid: false,
                versionCompatible: false
            };
        }
    }
    async backup(saveId, reason) {
        const savePath = path.join(this.savePath, `${saveId}.json`);
        return this.createBackup(savePath, reason);
    }
    trackRoomModification(roomId, modifications) {
        this.logger.log(`📝 Tracking modifications for room: ${roomId}`);
    }
    trackItemModification(itemId, modifications) {
        this.logger.log(`📝 Tracking modifications for item: ${itemId}`);
    }
    trackNPCModification(npcId, modifications) {
        this.logger.log(`📝 Tracking modifications for NPC: ${npcId}`);
    }
    getModifiedElements() {
        return {
            rooms: {},
            items: {},
            npcs: {},
            lastTracked: new Date()
        };
    }
    resetModificationTracking() {
        this.logger.log('🔄 Reset modification tracking');
    }
    getWorldStatistics() {
        const worldStats = this.worldManager.getStatistics();
        return {
            ...worldStats,
            modifiedRooms: Object.keys(this.getModifiedElements().rooms).length,
            modifiedItems: Object.keys(this.getModifiedElements().items).length,
            modifiedNPCs: Object.keys(this.getModifiedElements().npcs).length,
            lastModified: new Date()
        };
    }
    getStatistics() {
        try {
            const saves = fs.readdirSync(this.savePath)
                .filter(file => file.endsWith('.json') && file !== 'world.json');
            let totalSize = 0;
            for (const file of saves) {
                const stat = fs.statSync(path.join(this.savePath, file));
                totalSize += stat.size;
            }
            return {
                saveCount: saves.length,
                totalSize,
                averageSize: saves.length > 0 ? totalSize / saves.length : 0,
                worldStatistics: this.getWorldStatistics(),
                lastModified: saves.length > 0 ? fs.statSync(path.join(this.savePath, saves[0])).mtime : null
            };
        }
        catch (error) {
            this.logger.error('Failed to get world save statistics:', error);
            return {
                saveCount: 0,
                totalSize: 0,
                averageSize: 0,
                worldStatistics: {},
                lastModified: null
            };
        }
    }
    getStatus() {
        return {
            savePath: this.savePath,
            backupPath: this.backupPath,
            config: this.config,
            statistics: this.getStatistics(),
            worldManagerStatus: this.worldManager.getStatistics()
        };
    }
    createSaveMetadata(saveId, type, description, worldData) {
        return {
            version: '1.0.0',
            timestamp: new Date(),
            gameVersion: '1.0.0',
            checksum: this.calculateChecksum(worldData),
            compressed: false,
            saveType: type,
            description
        };
    }
    calculateChecksum(data) {
        const content = JSON.stringify(data);
        return crypto.createHash('sha256').update(content).digest('hex');
    }
    validateSaveFile(saveFile) {
        const errors = [];
        const warnings = [];
        let checksumValid = true;
        let versionCompatible = true;
        if (!saveFile.metadata) {
            errors.push('Missing metadata');
            return { valid: false, errors, warnings, checksumValid: false, versionCompatible: false };
        }
        const requiredFields = ['areas', 'rooms', 'items', 'npcs', 'metadata'];
        const worldData = saveFile.data;
        for (const field of requiredFields) {
            if (!(field in worldData)) {
                errors.push(`Missing required field: ${field}`);
            }
        }
        if (worldData.rooms) {
            for (const room of worldData.rooms) {
                if (!room.id || !room.name) {
                    errors.push(`Invalid room data: missing id or name`);
                    break;
                }
            }
        }
        if (worldData.items) {
            for (const item of worldData.items) {
                if (!item.id || !item.name) {
                    errors.push(`Invalid item data: missing id or name`);
                    break;
                }
            }
        }
        if (worldData.npcs) {
            for (const npc of worldData.npcs) {
                if (!npc.id || !npc.name) {
                    errors.push(`Invalid NPC data: missing id or name`);
                    break;
                }
            }
        }
        if (saveFile.metadata.checksum) {
            const calculatedChecksum = this.calculateChecksum(saveFile.data);
            if (calculatedChecksum !== saveFile.metadata.checksum) {
                errors.push('Checksum mismatch - file may be corrupted');
                checksumValid = false;
            }
        }
        const currentVersion = '1.0.0';
        if (saveFile.metadata.version !== currentVersion) {
            warnings.push(`Save version ${saveFile.metadata.version} may not be fully compatible with current version ${currentVersion}`);
            versionCompatible = false;
        }
        return {
            valid: errors.length === 0,
            errors,
            warnings,
            checksumValid,
            versionCompatible
        };
    }
    async createBackup(originalPath, reason) {
        try {
            if (!fs.existsSync(originalPath)) {
                throw new Error('Original file does not exist');
            }
            if (!fs.existsSync(this.backupPath)) {
                fs.mkdirSync(this.backupPath, { recursive: true });
            }
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFileName = `${path.basename(originalPath)}.${timestamp}.bak`;
            const backupPath = path.join(this.backupPath, backupFileName);
            fs.copyFileSync(originalPath, backupPath);
            const backupInfo = {
                originalPath,
                backupPath,
                timestamp: new Date(),
                reason,
                checksum: this.calculateChecksum(fs.readFileSync(originalPath))
            };
            const metadataPath = `${backupPath}.meta`;
            fs.writeFileSync(metadataPath, JSON.stringify(backupInfo, null, 2), 'utf8');
            this.logger.log(`📦 Created backup: ${backupFileName}`);
            this.eventSystem.emit(new event_1.GameEvent(types_1.PersistenceEventTypes.BACKUP_CREATED, 'world-save-system', (0, uuid_1.v4)(), backupInfo));
            return backupFileName;
        }
        catch (error) {
            this.logger.error('Failed to create backup:', error);
            throw error;
        }
    }
}
exports.WorldSaveSystem = WorldSaveSystem;
//# sourceMappingURL=world-save-system.js.map