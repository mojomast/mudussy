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
exports.PlayerSaveSystem = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const events_1 = require("events");
const uuid_1 = require("uuid");
const crypto = __importStar(require("crypto"));
const event_1 = require("../../core/event");
const types_1 = require("./types");
const player_1 = require("./player");
class PlayerSaveSystem extends events_1.EventEmitter {
    constructor(config, eventSystem, logger) {
        super();
        this.config = config;
        this.eventSystem = eventSystem;
        this.logger = logger || console;
        this.savePath = path.join(config.savePath, 'players');
        this.backupPath = path.join(config.backupPath, 'players');
    }
    async save(data, type, description) {
        if (type !== types_1.SaveType.PLAYERS && type !== types_1.SaveType.FULL) {
            throw new Error('Invalid save type for player save system');
        }
        const saveId = (0, uuid_1.v4)();
        const playerSaveData = data.toSaveData();
        const savePath = path.join(this.savePath, `${saveId}.json`);
        this.logger.log(`💾 Saving player: ${playerSaveData.username} (${saveId})`);
        try {
            if (fs.existsSync(savePath)) {
                await this.createBackup(savePath, 'Auto-backup before save');
            }
            const saveFile = {
                metadata: this.createSaveMetadata(saveId, type, description, playerSaveData),
                data: playerSaveData
            };
            const content = JSON.stringify(saveFile, null, 2);
            fs.writeFileSync(savePath, content, 'utf8');
            this.logger.log(`✅ Player saved: ${playerSaveData.username} (${saveId})`);
            this.eventSystem.emit(new event_1.GameEvent(types_1.PersistenceEventTypes.SAVE_COMPLETED, 'player-save-system', saveId, {
                playerId: playerSaveData.id,
                username: playerSaveData.username,
                type,
                path: savePath
            }));
            return saveId;
        }
        catch (error) {
            this.logger.error(`❌ Failed to save player ${playerSaveData.username}:`, error);
            throw error;
        }
    }
    async load(saveId) {
        const savePath = path.join(this.savePath, `${saveId}.json`);
        try {
            if (!fs.existsSync(savePath)) {
                throw new Error(`Player save file not found: ${saveId}`);
            }
            const content = fs.readFileSync(savePath, 'utf8');
            const saveFile = JSON.parse(content);
            if (this.config.validateOnLoad) {
                const validation = this.validateSaveFile(saveFile);
                if (!validation.valid) {
                    throw new Error(`Save validation failed: ${validation.errors.join(', ')}`);
                }
            }
            const playerSaveData = saveFile.data;
            const player = player_1.Player.fromSaveData(playerSaveData);
            this.logger.log(`📂 Player loaded: ${playerSaveData.username} (${saveId})`);
            this.eventSystem.emit(new event_1.GameEvent(types_1.PersistenceEventTypes.LOAD_COMPLETED, 'player-save-system', saveId, {
                playerId: playerSaveData.id,
                username: playerSaveData.username,
                path: savePath
            }));
            return player;
        }
        catch (error) {
            this.logger.error(`❌ Failed to load player ${saveId}:`, error);
            throw error;
        }
    }
    async saveAllPlayers(saveId, description) {
        this.logger.log(`💾 Saving all players: ${saveId}`);
        return saveId;
    }
    async loadAllPlayers(saveId) {
        this.logger.log(`📂 Loading all players: ${saveId}`);
    }
    async listSaves() {
        try {
            const saves = [];
            if (!fs.existsSync(this.savePath)) {
                return saves;
            }
            const files = fs.readdirSync(this.savePath)
                .filter(file => file.endsWith('.json'))
                .map(file => path.join(this.savePath, file));
            for (const filePath of files) {
                try {
                    const content = fs.readFileSync(filePath, 'utf8');
                    const saveFile = JSON.parse(content);
                    const stat = fs.statSync(filePath);
                    const playerData = saveFile.data;
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
            this.logger.error('Failed to list player saves:', error);
            return [];
        }
    }
    async delete(saveId) {
        const savePath = path.join(this.savePath, `${saveId}.json`);
        try {
            if (fs.existsSync(savePath)) {
                await this.createBackup(savePath, 'Backup before deletion');
                fs.unlinkSync(savePath);
                this.logger.log(`🗑️  Deleted player save: ${saveId}`);
                return true;
            }
            return false;
        }
        catch (error) {
            this.logger.error(`Failed to delete player save ${saveId}:`, error);
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
    getStatistics() {
        try {
            const saves = fs.readdirSync(this.savePath)
                .filter(file => file.endsWith('.json'));
            let totalSize = 0;
            for (const file of saves) {
                const stat = fs.statSync(path.join(this.savePath, file));
                totalSize += stat.size;
            }
            return {
                saveCount: saves.length,
                totalSize,
                averageSize: saves.length > 0 ? totalSize / saves.length : 0,
                lastModified: saves.length > 0 ? fs.statSync(path.join(this.savePath, saves[0])).mtime : null
            };
        }
        catch (error) {
            this.logger.error('Failed to get player save statistics:', error);
            return {
                saveCount: 0,
                totalSize: 0,
                averageSize: 0,
                lastModified: null
            };
        }
    }
    getStatus() {
        return {
            savePath: this.savePath,
            backupPath: this.backupPath,
            config: this.config,
            statistics: this.getStatistics()
        };
    }
    createSaveMetadata(saveId, type, description, playerData) {
        return {
            version: '1.0.0',
            timestamp: new Date(),
            gameVersion: '1.0.0',
            checksum: this.calculateChecksum(playerData),
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
        const requiredFields = ['id', 'username', 'stats', 'inventory'];
        const playerData = saveFile.data;
        for (const field of requiredFields) {
            if (!(field in playerData)) {
                errors.push(`Missing required field: ${field}`);
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
            this.eventSystem.emit(new event_1.GameEvent(types_1.PersistenceEventTypes.BACKUP_CREATED, 'player-save-system', (0, uuid_1.v4)(), backupInfo));
            return backupFileName;
        }
        catch (error) {
            this.logger.error('Failed to create backup:', error);
            throw error;
        }
    }
}
exports.PlayerSaveSystem = PlayerSaveSystem;
//# sourceMappingURL=player-save-system.js.map