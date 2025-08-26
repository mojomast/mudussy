import { EventEmitter } from 'events';
import { EventSystem } from '../../core/event';
import { IPersistenceConfig, SaveType, ISaveInfo, ISaveValidationResult, ISaveSystem } from './types';
import { Player } from './player';
export declare class PlayerSaveSystem extends EventEmitter implements ISaveSystem {
    private config;
    private eventSystem;
    private logger;
    private savePath;
    private backupPath;
    constructor(config: IPersistenceConfig, eventSystem: EventSystem, logger?: any);
    save(data: Player, type: SaveType, description?: string): Promise<string>;
    load(saveId: string): Promise<Player>;
    saveAllPlayers(saveId: string, description?: string): Promise<string>;
    loadAllPlayers(saveId: string): Promise<void>;
    listSaves(): Promise<ISaveInfo[]>;
    delete(saveId: string): Promise<boolean>;
    validate(saveId: string): Promise<ISaveValidationResult>;
    backup(saveId: string, reason: string): Promise<string>;
    getStatistics(): any;
    getStatus(): any;
    private createSaveMetadata;
    private calculateChecksum;
    private validateSaveFile;
    private createBackup;
}
