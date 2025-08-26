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
exports.SaveManager = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const events_1 = require("events");
const uuid_1 = require("uuid");
const event_1 = require("../../core/event");
const types_1 = require("./types");
const player_save_system_1 = require("./player-save-system");
const game_state_save_system_1 = require("./game-state-save-system");
const world_save_system_1 = require("./world-save-system");
class SaveManager extends events_1.EventEmitter {
    constructor(config, eventSystem, logger) {
        super();
        this.isInitialized = false;
        this.config = config;
        this.eventSystem = eventSystem;
        this.logger = logger || console;
        this.initializeSaveSystems();
    }
    async initializeSaveSystems() {
        try {
            await this.ensureDirectories();
            this.playerSaveSystem = new player_save_system_1.PlayerSaveSystem(this.config, this.eventSystem, this.logger);
            this.gameStateSaveSystem = new game_state_save_system_1.GameStateSaveSystem(this.config, this.eventSystem, this.logger);
            this.worldSaveSystem = new world_save_system_1.WorldSaveSystem(this.config, this.eventSystem, this.logger);
            this.isInitialized = true;
            this.logger.log('✅ Save systems initialized');
        }
        catch (error) {
            this.logger.error('❌ Failed to initialize save systems:', error);
            throw error;
        }
    }
    async ensureDirectories() {
        const directories = [
            this.config.savePath,
            this.config.backupPath,
            path.join(this.config.savePath, 'players'),
            path.join(this.config.savePath, 'world'),
            path.join(this.config.savePath, 'game-state'),
            path.join(this.config.backupPath, 'players'),
            path.join(this.config.backupPath, 'world'),
            path.join(this.config.backupPath, 'game-state')
        ];
        for (const dir of directories) {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                this.logger.log(`📁 Created directory: ${dir}`);
            }
        }
    }
    async saveFullGame(description) {
        if (!this.isInitialized) {
            throw new Error('Save systems not initialized');
        }
        const saveId = (0, uuid_1.v4)();
        const startTime = Date.now();
        this.logger.log(`💾 Starting full game save: ${saveId}`);
        this.eventSystem.emit(new event_1.GameEvent(types_1.PersistenceEventTypes.SAVE_STARTED, 'save-manager', saveId, { type: types_1.SaveType.FULL, description }));
        try {
            const results = await Promise.allSettled([
                this.playerSaveSystem.saveAllPlayers(saveId, description),
                this.gameStateSaveSystem.saveGameState(saveId, description),
                this.worldSaveSystem.saveWorldState(saveId, description)
            ]);
            const failures = results.filter(result => result.status === 'rejected');
            if (failures.length > 0) {
                this.logger.warn(`⚠️  Some save operations failed: ${failures.length}`);
                failures.forEach((failure, index) => {
                    this.logger.error(`Save system ${index} failed:`, failure.reason);
                });
            }
            const manifest = this.createSaveManifest(saveId, types_1.SaveType.FULL, description);
            const duration = Date.now() - startTime;
            this.logger.log(`✅ Full game save completed: ${saveId} (${duration}ms)`);
            this.eventSystem.emit(new event_1.GameEvent(types_1.PersistenceEventTypes.SAVE_COMPLETED, 'save-manager', saveId, {
                type: types_1.SaveType.FULL,
                duration,
                description,
                manifest
            }));
            return saveId;
        }
        catch (error) {
            this.logger.error(`❌ Full game save failed: ${saveId}`, error);
            this.eventSystem.emit(new event_1.GameEvent(types_1.PersistenceEventTypes.SAVE_FAILED, 'save-manager', saveId, { type: types_1.SaveType.FULL, error: error.message }));
            throw error;
        }
    }
    async loadFullGame(saveId) {
        if (!this.isInitialized) {
            throw new Error('Save systems not initialized');
        }
        this.logger.log(`📂 Starting full game load: ${saveId}`);
        this.eventSystem.emit(new event_1.GameEvent(types_1.PersistenceEventTypes.LOAD_STARTED, 'save-manager', saveId, { type: types_1.SaveType.FULL }));
        try {
            if (this.config.validateOnLoad) {
                const validation = await this.validateSave(saveId);
                if (!validation.valid) {
                    throw new Error(`Save validation failed: ${validation.errors.join(', ')}`);
                }
            }
            await Promise.all([
                this.playerSaveSystem.loadAllPlayers(saveId),
                this.gameStateSaveSystem.loadGameState(saveId),
                this.worldSaveSystem.loadWorldState(saveId)
            ]);
            this.logger.log(`✅ Full game load completed: ${saveId}`);
            this.eventSystem.emit(new event_1.GameEvent(types_1.PersistenceEventTypes.LOAD_COMPLETED, 'save-manager', saveId, { type: types_1.SaveType.FULL }));
        }
        catch (error) {
            this.logger.error(`❌ Full game load failed: ${saveId}`, error);
            this.eventSystem.emit(new event_1.GameEvent(types_1.PersistenceEventTypes.LOAD_FAILED, 'save-manager', saveId, { type: types_1.SaveType.FULL, error: error.message }));
            throw error;
        }
    }
    async savePlayers(description) {
        return this.playerSaveSystem.saveAllPlayers((0, uuid_1.v4)(), description);
    }
    async loadPlayers(saveId) {
        return this.playerSaveSystem.loadAllPlayers(saveId);
    }
    async saveGameState(description) {
        return this.gameStateSaveSystem.saveGameState((0, uuid_1.v4)(), description);
    }
    async loadGameState(saveId) {
        return this.gameStateSaveSystem.loadGameState(saveId);
    }
    async saveWorldState(description) {
        return this.worldSaveSystem.saveWorldState((0, uuid_1.v4)(), description);
    }
    async loadWorldState(saveId) {
        return this.worldSaveSystem.loadWorldState(saveId);
    }
    async listSaves(type) {
        const saves = [];
        try {
            const [playerSaves, gameStateSaves, worldSaves] = await Promise.all([
                this.playerSaveSystem.listSaves(),
                this.gameStateSaveSystem.listSaves(),
                this.worldSaveSystem.listSaves()
            ]);
            if (!type || type === types_1.SaveType.PLAYERS) {
                saves.push(...playerSaves);
            }
            if (!type || type === types_1.SaveType.GAME_STATE) {
                saves.push(...gameStateSaves);
            }
            if (!type || type === types_1.SaveType.WORLD) {
                saves.push(...worldSaves);
            }
            saves.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
            return saves;
        }
        catch (error) {
            this.logger.error('Failed to list saves:', error);
            return [];
        }
    }
    async deleteSave(saveId) {
        try {
            const results = await Promise.allSettled([
                this.playerSaveSystem.delete(saveId),
                this.gameStateSaveSystem.delete(saveId),
                this.worldSaveSystem.delete(saveId)
            ]);
            return results.some(result => result.status === 'fulfilled' && result.value);
        }
        catch (error) {
            this.logger.error(`Failed to delete save ${saveId}:`, error);
            return false;
        }
    }
    async validateSave(saveId) {
        try {
            const results = await Promise.allSettled([
                this.playerSaveSystem.validate(saveId),
                this.gameStateSaveSystem.validate(saveId),
                this.worldSaveSystem.validate(saveId)
            ]);
            const combined = {
                valid: true,
                errors: [],
                warnings: [],
                checksumValid: true,
                versionCompatible: true
            };
            results.forEach(result => {
                if (result.status === 'fulfilled') {
                    const validation = result.value;
                    combined.valid = combined.valid && validation.valid;
                    combined.checksumValid = combined.checksumValid && validation.checksumValid;
                    combined.versionCompatible = combined.versionCompatible && validation.versionCompatible;
                    combined.errors.push(...validation.errors);
                    combined.warnings.push(...validation.warnings);
                }
            });
            return combined;
        }
        catch (error) {
            this.logger.error(`Failed to validate save ${saveId}:`, error);
            return {
                valid: false,
                errors: [`Validation failed: ${error.message}`],
                warnings: [],
                checksumValid: false,
                versionCompatible: false
            };
        }
    }
    async backupSave(saveId, reason) {
        try {
            const results = await Promise.allSettled([
                this.playerSaveSystem.backup(saveId, reason),
                this.gameStateSaveSystem.backup(saveId, reason),
                this.worldSaveSystem.backup(saveId, reason)
            ]);
            for (const result of results) {
                if (result.status === 'fulfilled') {
                    return result.value;
                }
            }
            throw new Error('No backup was created');
        }
        catch (error) {
            this.logger.error(`Failed to backup save ${saveId}:`, error);
            throw error;
        }
    }
    async getSaveStatistics() {
        try {
            const [playerStats, gameStateStats, worldStats] = await Promise.all([
                this.playerSaveSystem.getStatistics(),
                this.gameStateSaveSystem.getStatistics(),
                this.worldSaveSystem.getStatistics()
            ]);
            return {
                players: playerStats,
                gameState: gameStateStats,
                world: worldStats,
                totalSize: playerStats.totalSize + gameStateStats.totalSize + worldStats.totalSize,
                lastFullSave: new Date()
            };
        }
        catch (error) {
            this.logger.error('Failed to get save statistics:', error);
            return {};
        }
    }
    async cleanupOldBackups() {
        let removedCount = 0;
        try {
            const backupDirs = [
                path.join(this.config.backupPath, 'players'),
                path.join(this.config.backupPath, 'game-state'),
                path.join(this.config.backupPath, 'world')
            ];
            for (const backupDir of backupDirs) {
                if (!fs.existsSync(backupDir))
                    continue;
                const files = fs.readdirSync(backupDir);
                if (files.length > this.config.maxBackups) {
                    const fileStats = files.map(file => ({
                        name: file,
                        path: path.join(backupDir, file),
                        mtime: fs.statSync(path.join(backupDir, file)).mtime
                    }));
                    fileStats.sort((a, b) => a.mtime.getTime() - b.mtime.getTime());
                    const filesToRemove = fileStats.slice(0, files.length - this.config.maxBackups);
                    for (const file of filesToRemove) {
                        fs.unlinkSync(file.path);
                        removedCount++;
                    }
                }
            }
            if (removedCount > 0) {
                this.logger.log(`🧹 Cleaned up ${removedCount} old backups`);
            }
        }
        catch (error) {
            this.logger.error('Failed to cleanup old backups:', error);
        }
        return removedCount;
    }
    createSaveManifest(saveId, type, description) {
        return {
            version: '1.0.0',
            timestamp: new Date(),
            gameVersion: '1.0.0',
            checksum: '',
            compressed: this.config.compressionEnabled,
            saveType: type,
            description
        };
    }
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            config: this.config,
            systems: {
                players: this.playerSaveSystem?.getStatus(),
                gameState: this.gameStateSaveSystem?.getStatus(),
                world: this.worldSaveSystem?.getStatus()
            }
        };
    }
}
exports.SaveManager = SaveManager;
//# sourceMappingURL=save-manager.js.map