/**
 * Game State Save System - handles global game state persistence
 */

import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import { GameEvent, EventSystem } from '../../core/event';
import {
  IPersistenceConfig,
  ISaveMetadata,
  ISaveFile,
  SaveType,
  ISaveInfo,
  IBackupInfo,
  ISaveValidationResult,
  PersistenceEventTypes,
  IGameStateSaveData,
  IQuestProgress,
  IGameEvent,
  IScheduledEvent,
  ISaveSystem
} from './types';

export class GameStateSaveSystem extends EventEmitter implements ISaveSystem {
  private config: IPersistenceConfig;
  private eventSystem: EventSystem;
  private logger: any;
  private savePath: string;
  private backupPath: string;

  // In-memory game state (would be populated from actual game systems)
  private globalFlags: Record<string, any> = {};
  private factionRelations: Record<string, Record<string, number>> = {};
  private questProgress: Record<string, IQuestProgress> = {};
  private worldVariables: Record<string, any> = {};
  private eventHistory: IGameEvent[] = [];
  private scheduledEvents: IScheduledEvent[] = [];

  constructor(config: IPersistenceConfig, eventSystem: EventSystem, logger?: any) {
    super();
    this.config = config;
    this.eventSystem = eventSystem;
    this.logger = logger || console;
    this.savePath = path.join(config.savePath, 'game-state');
    this.backupPath = path.join(config.backupPath, 'game-state');
  }

  /**
   * Save game state data
   */
  async save(data: IGameStateSaveData, type: SaveType, description?: string): Promise<string> {
    if (type !== SaveType.GAME_STATE && type !== SaveType.FULL) {
      throw new Error('Invalid save type for game state save system');
    }

    const saveId = uuidv4();
    const savePath = path.join(this.savePath, `${saveId}.json`);

    this.logger.log(`💾 Saving game state: ${saveId}`);

    try {
      // Create backup if file exists
      if (fs.existsSync(savePath)) {
        await this.createBackup(savePath, 'Auto-backup before save');
      }

      // Collect current game state
      const gameStateData: IGameStateSaveData = {
        globalFlags: { ...this.globalFlags },
        factionRelations: this.deepClone(this.factionRelations),
        questProgress: this.deepClone(this.questProgress),
        worldVariables: { ...this.worldVariables },
        eventHistory: [...this.eventHistory],
        scheduledEvents: [...this.scheduledEvents],
        created: new Date(),
        updated: new Date()
      };

      // Create save file
      const saveFile: ISaveFile = {
        metadata: this.createSaveMetadata(saveId, type, description, gameStateData),
        data: gameStateData
      };

      // Write to file
      const content = JSON.stringify(saveFile, null, 2);
      fs.writeFileSync(savePath, content, 'utf8');

      this.logger.log(`✅ Game state saved: ${saveId}`);

      // Emit save event
      this.eventSystem.emit(new GameEvent(
        PersistenceEventTypes.SAVE_COMPLETED,
        'game-state-save-system',
        saveId,
        { type, path: savePath, description }
      ));

      return saveId;
    } catch (error) {
      this.logger.error(`❌ Failed to save game state:`, error);
      throw error;
    }
  }

  /**
   * Load game state data
   */
  async load(saveId: string): Promise<IGameStateSaveData> {
    const savePath = path.join(this.savePath, `${saveId}.json`);

    try {
      if (!fs.existsSync(savePath)) {
        throw new Error(`Game state save file not found: ${saveId}`);
      }

      const content = fs.readFileSync(savePath, 'utf8');
      const saveFile: ISaveFile = JSON.parse(content);

      // Validate save file
      if (this.config.validateOnLoad) {
        const validation = this.validateSaveFile(saveFile);
        if (!validation.valid) {
          throw new Error(`Save validation failed: ${validation.errors.join(', ')}`);
        }
      }

      const gameStateData = saveFile.data as IGameStateSaveData;

      // Apply loaded game state
      this.globalFlags = { ...gameStateData.globalFlags };
      this.factionRelations = this.deepClone(gameStateData.factionRelations);
      this.questProgress = this.deepClone(gameStateData.questProgress);
      this.worldVariables = { ...gameStateData.worldVariables };
      this.eventHistory = [...gameStateData.eventHistory];
      this.scheduledEvents = [...gameStateData.scheduledEvents];

      this.logger.log(`📂 Game state loaded: ${saveId}`);

      // Emit load event
      this.eventSystem.emit(new GameEvent(
        PersistenceEventTypes.LOAD_COMPLETED,
        'game-state-save-system',
        saveId,
        { type: SaveType.GAME_STATE, path: savePath }
      ));

      return gameStateData;
    } catch (error) {
      this.logger.error(`❌ Failed to load game state ${saveId}:`, error);
      throw error;
    }
  }

  /**
   * Save current game state
   */
  async saveGameState(saveId: string, description?: string): Promise<string> {
    const gameStateData: IGameStateSaveData = {
      globalFlags: { ...this.globalFlags },
      factionRelations: this.deepClone(this.factionRelations),
      questProgress: this.deepClone(this.questProgress),
      worldVariables: { ...this.worldVariables },
      eventHistory: [...this.eventHistory],
      scheduledEvents: [...this.scheduledEvents],
      created: new Date(),
      updated: new Date()
    };

    return this.save(gameStateData, SaveType.GAME_STATE, description);
  }

  /**
   * Load game state
   */
  async loadGameState(saveId: string): Promise<void> {
    await this.load(saveId);
  }

  /**
   * List all game state saves
   */
  async listSaves(): Promise<ISaveInfo[]> {
    try {
      const saves: ISaveInfo[] = [];

      if (!fs.existsSync(this.savePath)) {
        return saves;
      }

      const files = fs.readdirSync(this.savePath)
        .filter(file => file.endsWith('.json'))
        .map(file => path.join(this.savePath, file));

      for (const filePath of files) {
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          const saveFile: ISaveFile = JSON.parse(content);

          const stat = fs.statSync(filePath);

          saves.push({
            id: path.basename(filePath, '.json'),
            type: saveFile.metadata.saveType,
            timestamp: new Date(saveFile.metadata.timestamp),
            description: saveFile.metadata.description,
            size: stat.size,
            checksum: saveFile.metadata.checksum
          });
        } catch (error) {
          this.logger.warn(`Failed to read save file ${filePath}:`, error);
        }
      }

      // Sort by timestamp (newest first)
      saves.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      return saves;
    } catch (error) {
      this.logger.error('Failed to list game state saves:', error);
      return [];
    }
  }

  /**
   * Delete a game state save
   */
  async delete(saveId: string): Promise<boolean> {
    const savePath = path.join(this.savePath, `${saveId}.json`);

    try {
      if (fs.existsSync(savePath)) {
        // Create backup before deletion
        await this.createBackup(savePath, 'Backup before deletion');

        fs.unlinkSync(savePath);
        this.logger.log(`🗑️  Deleted game state save: ${saveId}`);
        return true;
      }
      return false;
    } catch (error) {
      this.logger.error(`Failed to delete game state save ${saveId}:`, error);
      return false;
    }
  }

  /**
   * Validate a game state save
   */
  async validate(saveId: string): Promise<ISaveValidationResult> {
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
      const saveFile: ISaveFile = JSON.parse(content);

      return this.validateSaveFile(saveFile);
    } catch (error) {
      return {
        valid: false,
        errors: [`Failed to validate save: ${error.message}`],
        warnings: [],
        checksumValid: false,
        versionCompatible: false
      };
    }
  }

  /**
   * Create a backup of a game state save
   */
  async backup(saveId: string, reason: string): Promise<string> {
    const savePath = path.join(this.savePath, `${saveId}.json`);
    return this.createBackup(savePath, reason);
  }

  /**
   * Game state management methods
   */
  setGlobalFlag(flagName: string, value: any): void {
    this.globalFlags[flagName] = value;
  }

  getGlobalFlag(flagName: string): any {
    return this.globalFlags[flagName];
  }

  hasGlobalFlag(flagName: string): boolean {
    return flagName in this.globalFlags;
  }

  removeGlobalFlag(flagName: string): void {
    delete this.globalFlags[flagName];
  }

  setFactionRelation(factionA: string, factionB: string, relation: number): void {
    if (!this.factionRelations[factionA]) {
      this.factionRelations[factionA] = {};
    }
    this.factionRelations[factionA][factionB] = Math.max(-100, Math.min(100, relation));

    // Set reverse relation
    if (!this.factionRelations[factionB]) {
      this.factionRelations[factionB] = {};
    }
    this.factionRelations[factionB][factionA] = Math.max(-100, Math.min(100, relation));
  }

  getFactionRelation(factionA: string, factionB: string): number {
    return this.factionRelations[factionA]?.[factionB] || 0;
  }

  updateQuestProgress(questId: string, playerId: string, objective: string, completed: boolean): void {
    const key = `${questId}:${playerId}`;
    if (!this.questProgress[key]) {
      this.questProgress[key] = {
        questId,
        status: 'in_progress',
        objectives: {},
        variables: {},
        started: new Date()
      };
    }

    const quest = this.questProgress[key];
    quest.objectives[objective] = completed;

    // Check if all objectives are completed
    const allCompleted = Object.values(quest.objectives).every(obj => obj === true);
    if (allCompleted && quest.status !== 'completed') {
      quest.status = 'completed';
      quest.completed = new Date();
    }
  }

  getQuestProgress(questId: string, playerId: string): IQuestProgress | undefined {
    return this.questProgress[`${questId}:${playerId}`];
  }

  setWorldVariable(key: string, value: any): void {
    this.worldVariables[key] = value;
  }

  getWorldVariable(key: string): any {
    return this.worldVariables[key];
  }

  addGameEvent(type: string, source: string, data: any): void {
    const gameEvent: IGameEvent = {
      id: uuidv4(),
      type,
      timestamp: new Date(),
      data
    };

    this.eventHistory.push(gameEvent);

    // Keep only recent events (last 1000)
    if (this.eventHistory.length > 1000) {
      this.eventHistory = this.eventHistory.slice(-1000);
    }
  }

  scheduleEvent(type: string, scheduledTime: Date, data: any, recurring?: boolean, interval?: number): string {
    const eventId = uuidv4();
    const scheduledEvent: IScheduledEvent = {
      id: eventId,
      type,
      scheduledTime,
      data,
      recurring,
      interval
    };

    this.scheduledEvents.push(scheduledEvent);
    return eventId;
  }

  cancelScheduledEvent(eventId: string): boolean {
    const index = this.scheduledEvents.findIndex(event => event.id === eventId);
    if (index !== -1) {
      this.scheduledEvents.splice(index, 1);
      return true;
    }
    return false;
  }

  getScheduledEvents(): IScheduledEvent[] {
    return [...this.scheduledEvents];
  }

  getExpiredScheduledEvents(): IScheduledEvent[] {
    const now = new Date();
    return this.scheduledEvents.filter(event => event.scheduledTime <= now);
  }

  /**
   * Get save system statistics
   */
  getStatistics(): any {
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
        globalFlagsCount: Object.keys(this.globalFlags).length,
        factionRelationsCount: Object.keys(this.factionRelations).length,
        questProgressCount: Object.keys(this.questProgress).length,
        worldVariablesCount: Object.keys(this.worldVariables).length,
        eventHistoryCount: this.eventHistory.length,
        scheduledEventsCount: this.scheduledEvents.length,
        lastModified: saves.length > 0 ? fs.statSync(path.join(this.savePath, saves[0])).mtime : null
      };
    } catch (error) {
      this.logger.error('Failed to get game state save statistics:', error);
      return {
        saveCount: 0,
        totalSize: 0,
        averageSize: 0,
        globalFlagsCount: 0,
        factionRelationsCount: 0,
        questProgressCount: 0,
        worldVariablesCount: 0,
        eventHistoryCount: 0,
        scheduledEventsCount: 0,
        lastModified: null
      };
    }
  }

  /**
   * Get system status
   */
  getStatus(): any {
    return {
      savePath: this.savePath,
      backupPath: this.backupPath,
      config: this.config,
      statistics: this.getStatistics(),
      currentState: {
        globalFlagsCount: Object.keys(this.globalFlags).length,
        factionRelationsCount: Object.keys(this.factionRelations).length,
        activeQuestsCount: Object.keys(this.questProgress).length,
        scheduledEventsCount: this.scheduledEvents.length
      }
    };
  }

  /**
   * Create save metadata
   */
  private createSaveMetadata(saveId: string, type: SaveType, description: string | undefined, gameStateData: IGameStateSaveData): ISaveMetadata {
    return {
      version: '1.0.0',
      timestamp: new Date(),
      gameVersion: '1.0.0', // TODO: Get from package.json
      checksum: this.calculateChecksum(gameStateData),
      compressed: false, // TODO: Implement compression
      saveType: type,
      description
    };
  }

  /**
   * Calculate checksum for data integrity
   */
  private calculateChecksum(data: any): string {
    const content = JSON.stringify(data);
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Deep clone an object
   */
  private deepClone(obj: any): any {
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * Validate save file
   */
  private validateSaveFile(saveFile: ISaveFile): ISaveValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let checksumValid = true;
    let versionCompatible = true;

    // Check metadata
    if (!saveFile.metadata) {
      errors.push('Missing metadata');
      return { valid: false, errors, warnings, checksumValid: false, versionCompatible: false };
    }

    // Check required fields
    const requiredFields = ['globalFlags', 'factionRelations', 'questProgress', 'worldVariables'];
    const gameStateData = saveFile.data as IGameStateSaveData;

    for (const field of requiredFields) {
      if (!(field in gameStateData)) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Validate checksum
    if (saveFile.metadata.checksum) {
      const calculatedChecksum = this.calculateChecksum(saveFile.data);
      if (calculatedChecksum !== saveFile.metadata.checksum) {
        errors.push('Checksum mismatch - file may be corrupted');
        checksumValid = false;
      }
    }

    // Check version compatibility
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

  /**
   * Create backup of a save file
   */
  private async createBackup(originalPath: string, reason: string): Promise<string> {
    try {
      if (!fs.existsSync(originalPath)) {
        throw new Error('Original file does not exist');
      }

      // Ensure backup directory exists
      if (!fs.existsSync(this.backupPath)) {
        fs.mkdirSync(this.backupPath, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `${path.basename(originalPath)}.${timestamp}.bak`;
      const backupPath = path.join(this.backupPath, backupFileName);

      // Copy file to backup location
      fs.copyFileSync(originalPath, backupPath);

      const backupInfo: IBackupInfo = {
        originalPath,
        backupPath,
        timestamp: new Date(),
        reason,
        checksum: this.calculateChecksum(fs.readFileSync(originalPath))
      };

      // Save backup metadata
      const metadataPath = `${backupPath}.meta`;
      fs.writeFileSync(metadataPath, JSON.stringify(backupInfo, null, 2), 'utf8');

      this.logger.log(`📦 Created backup: ${backupFileName}`);

      // Emit backup event
      this.eventSystem.emit(new GameEvent(
        PersistenceEventTypes.BACKUP_CREATED,
        'game-state-save-system',
        uuidv4(),
        backupInfo
      ));

      return backupFileName;
    } catch (error) {
      this.logger.error('Failed to create backup:', error);
      throw error;
    }
  }
}