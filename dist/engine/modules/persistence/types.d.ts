import { BaseEntity } from '../../core/entity';
export interface IPersistenceConfig {
    savePath: string;
    backupPath: string;
    autoSaveInterval: number;
    maxBackups: number;
    compressionEnabled: boolean;
    validateOnLoad: boolean;
    migrationEnabled: boolean;
}
export interface ISaveMetadata {
    version: string;
    timestamp: Date;
    gameVersion: string;
    checksum: string;
    compressed: boolean;
    saveType: SaveType;
    description?: string;
}
export declare enum SaveType {
    FULL = "full",
    PLAYERS = "players",
    WORLD = "world",
    GAME_STATE = "game_state",
    INCREMENTAL = "incremental"
}
export interface ISaveFile {
    metadata: ISaveMetadata;
    data: any;
}
export interface IPlayerSaveData {
    id: string;
    username: string;
    sessionId: string;
    stats: Record<string, any>;
    inventory: IItemInstance[];
    equipment: Record<string, string>;
    location: {
        roomId: string;
        areaId: string;
    };
    flags: string[];
    quests: IQuestProgress[];
    skills: Record<string, number>;
    currency: Record<string, number>;
    factionRelations: Record<string, number>;
    lastLogin: Date;
    playTime: number;
    created: Date;
    updated: Date;
}
export interface IItemInstance {
    itemId: string;
    quantity: number;
    durability?: number;
    customStats?: Record<string, any>;
    flags: string[];
}
export interface IQuestProgress {
    questId: string;
    status: 'not_started' | 'in_progress' | 'completed' | 'failed';
    objectives: Record<string, boolean>;
    variables: Record<string, any>;
    started: Date;
    completed?: Date;
}
export interface IGameStateSaveData {
    globalFlags: Record<string, any>;
    factionRelations: Record<string, Record<string, number>>;
    questProgress: Record<string, IQuestProgress>;
    worldVariables: Record<string, any>;
    eventHistory: IGameEvent[];
    scheduledEvents: IScheduledEvent[];
    created: Date;
    updated: Date;
}
export interface IGameEvent {
    id: string;
    type: string;
    timestamp: Date;
    data: any;
}
export interface IScheduledEvent {
    id: string;
    type: string;
    scheduledTime: Date;
    data: any;
    recurring?: boolean;
    interval?: number;
}
export interface IWorldSaveData {
    areas: any[];
    rooms: any[];
    items: any[];
    npcs: any[];
    modifiedRooms: Record<string, any>;
    modifiedItems: Record<string, any>;
    modifiedNPCs: Record<string, any>;
    metadata: {
        version: string;
        created: Date;
        updated: Date;
        author?: string;
    };
}
export interface IBackupInfo {
    originalPath: string;
    backupPath: string;
    timestamp: Date;
    reason: string;
    checksum: string;
}
export interface ISaveValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
    checksumValid: boolean;
    versionCompatible: boolean;
}
export interface IMigrationResult {
    success: boolean;
    fromVersion: string;
    toVersion: string;
    changes: string[];
    errors: string[];
}
export interface ISaveSystem {
    save(data: any, type: SaveType, description?: string): Promise<string>;
    load(saveId: string): Promise<any>;
    listSaves(type?: SaveType): Promise<ISaveInfo[]>;
    delete(saveId: string): Promise<boolean>;
    validate(saveId: string): Promise<ISaveValidationResult>;
    backup(saveId: string, reason: string): Promise<string>;
}
export interface ISaveInfo {
    id: string;
    type: SaveType;
    timestamp: Date;
    description?: string;
    size: number;
    checksum: string;
}
export interface IPersistenceEventTypes {
    SAVE_STARTED: 'persistence.save.started';
    SAVE_COMPLETED: 'persistence.save.completed';
    SAVE_FAILED: 'persistence.save.failed';
    LOAD_STARTED: 'persistence.load.started';
    LOAD_COMPLETED: 'persistence.load.completed';
    LOAD_FAILED: 'persistence.load.failed';
    BACKUP_CREATED: 'persistence.backup.created';
    MIGRATION_STARTED: 'persistence.migration.started';
    MIGRATION_COMPLETED: 'persistence.migration.completed';
    VALIDATION_FAILED: 'persistence.validation.failed';
}
export declare const PersistenceEventTypes: IPersistenceEventTypes;
export interface IPlayer extends BaseEntity {
    type: 'player';
    username: string;
    sessionId: string;
    stats: Record<string, any>;
    inventory: IItemInstance[];
    equipment: Record<string, string>;
    currentRoomId: string;
    flags: string[];
    quests: IQuestProgress[];
    skills: Record<string, number>;
    currency: Record<string, number>;
    factionRelations: Record<string, number>;
    lastLogin: Date;
    playTime: number;
    addItem(itemId: string, quantity?: number): boolean;
    removeItem(itemId: string, quantity?: number): boolean;
    hasItem(itemId: string, quantity?: number): boolean;
    getItemQuantity(itemId: string): number;
    setStat(statName: string, value: any): void;
    getStat(statName: string): any;
    hasFlag(flag: string): boolean;
    addFlag(flag: string): void;
    removeFlag(flag: string): void;
    updateQuestProgress(questId: string, objective: string, completed: boolean): void;
    getQuestProgress(questId: string): IQuestProgress | undefined;
    addSkill(skillName: string, level: number): void;
    getSkillLevel(skillName: string): number;
    addCurrency(currencyType: string, amount: number): void;
    getCurrency(currencyType: string): number;
    setFactionRelation(factionName: string, relation: number): void;
    getFactionRelation(factionName: string): number;
    moveToRoom(roomId: string): boolean;
    getCurrentRoom(): string;
    updatePlayTime(additionalTime: number): void;
    toSaveData(): IPlayerSaveData;
}
