/**
 * Player entity with persistent state management
 */

import { BaseEntity } from '../../core/entity';
import {
  IPlayer,
  IPlayerSaveData,
  IItemInstance,
  IQuestProgress
} from './types';

export class Player extends BaseEntity implements IPlayer {
  public readonly type = 'player' as const;
  public username: string;
  public sessionId: string;
  public stats: Record<string, any>;
  public inventory: IItemInstance[];
  public equipment: Record<string, string>;
  public currentRoomId: string;
  public flags: string[];
  public quests: IQuestProgress[];
  public skills: Record<string, number>;
  public currency: Record<string, number>;
  public factionRelations: Record<string, number>;
  public lastLogin: Date;
  public playTime: number;

  constructor(
    username: string,
    sessionId: string,
    initialRoomId: string = 'tavern'
  ) {
    super(username, 'player');
    this.username = username;
    this.sessionId = sessionId;
    this.currentRoomId = initialRoomId;
    this.stats = {
      level: 1,
      experience: 0,
      health: 100,
      maxHealth: 100,
      mana: 50,
      maxMana: 50,
      strength: 10,
      dexterity: 10,
      intelligence: 10,
      constitution: 10
    };
    this.inventory = [];
    this.equipment = {};
    this.flags = [];
    this.quests = [];
    this.skills = {};
    this.currency = { gold: 0, silver: 0 };
    this.factionRelations = {};
    this.lastLogin = new Date();
    this.playTime = 0;
  }

  /**
   * Add item to inventory
   */
  addItem(itemId: string, quantity: number = 1): boolean {
    if (quantity <= 0) return false;

    // Check if item already exists in inventory
    const existingItem = this.inventory.find(item => item.itemId === itemId);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      this.inventory.push({
        itemId,
        quantity,
        flags: []
      });
    }

    this.update();
    return true;
  }

  /**
   * Remove item from inventory
   */
  removeItem(itemId: string, quantity: number = 1): boolean {
    const itemIndex = this.inventory.findIndex(item => item.itemId === itemId);
    if (itemIndex === -1) return false;

    const item = this.inventory[itemIndex];
    if (item.quantity < quantity) return false;

    item.quantity -= quantity;
    if (item.quantity <= 0) {
      this.inventory.splice(itemIndex, 1);
    }

    this.update();
    return true;
  }

  /**
   * Check if player has item in inventory
   */
  hasItem(itemId: string, quantity: number = 1): boolean {
    const item = this.inventory.find(item => item.itemId === itemId);
    return item ? item.quantity >= quantity : false;
  }

  /**
   * Get item quantity in inventory
   */
  getItemQuantity(itemId: string): number {
    const item = this.inventory.find(item => item.itemId === itemId);
    return item ? item.quantity : 0;
  }

  /**
   * Set player stat
   */
  setStat(statName: string, value: any): void {
    this.stats[statName] = value;
    this.update();
  }

  /**
   * Get player stat
   */
  getStat(statName: string): any {
    return this.stats[statName];
  }

  /**
   * Check if player has flag
   */
  hasFlag(flag: string): boolean {
    return this.flags.includes(flag);
  }

  /**
   * Add flag to player
   */
  addFlag(flag: string): void {
    if (!this.hasFlag(flag)) {
      this.flags.push(flag);
      this.update();
    }
  }

  /**
   * Remove flag from player
   */
  removeFlag(flag: string): void {
    const index = this.flags.indexOf(flag);
    if (index !== -1) {
      this.flags.splice(index, 1);
      this.update();
    }
  }

  /**
   * Update quest progress
   */
  updateQuestProgress(questId: string, objective: string, completed: boolean): void {
    let quest = this.quests.find(q => q.questId === questId);
    if (!quest) {
      quest = {
        questId,
        status: 'in_progress',
        objectives: {},
        variables: {},
        started: new Date()
      };
      this.quests.push(quest);
    }

    quest.objectives[objective] = completed;

    // Check if all objectives are completed
    const allCompleted = Object.values(quest.objectives).every(obj => obj === true);
    if (allCompleted && quest.status !== 'completed') {
      quest.status = 'completed';
      quest.completed = new Date();
    }

    this.update();
  }

  /**
   * Get quest progress
   */
  getQuestProgress(questId: string): IQuestProgress | undefined {
    return this.quests.find(q => q.questId === questId);
  }

  /**
   * Add or update skill
   */
  addSkill(skillName: string, level: number): void {
    this.skills[skillName] = level;
    this.update();
  }

  /**
   * Get skill level
   */
  getSkillLevel(skillName: string): number {
    return this.skills[skillName] || 0;
  }

  /**
   * Add currency
   */
  addCurrency(currencyType: string, amount: number): void {
    if (amount < 0) return;

    this.currency[currencyType] = (this.currency[currencyType] || 0) + amount;
    this.update();
  }

  /**
   * Get currency amount
   */
  getCurrency(currencyType: string): number {
    return this.currency[currencyType] || 0;
  }

  /**
   * Set faction relation
   */
  setFactionRelation(factionName: string, relation: number): void {
    this.factionRelations[factionName] = Math.max(-100, Math.min(100, relation));
    this.update();
  }

  /**
   * Get faction relation
   */
  getFactionRelation(factionName: string): number {
    return this.factionRelations[factionName] || 0;
  }

  /**
   * Move player to different room
   */
  moveToRoom(roomId: string): boolean {
    this.currentRoomId = roomId;
    this.update();
    return true;
  }

  /**
   * Get current room ID
   */
  getCurrentRoom(): string {
    return this.currentRoomId;
  }

  /**
   * Update play time
   */
  updatePlayTime(additionalTime: number): void {
    this.playTime += additionalTime;
    this.update();
  }

  /**
   * Convert player to save data
   */
  toSaveData(): IPlayerSaveData {
    return {
      id: this.id,
      username: this.username,
      sessionId: this.sessionId,
      stats: { ...this.stats },
      inventory: this.inventory.map(item => ({ ...item })),
      equipment: { ...this.equipment },
      location: {
        roomId: this.currentRoomId,
        areaId: 'default' // TODO: Get actual area from room
      },
      flags: [...this.flags],
      quests: this.quests.map(quest => ({ ...quest })),
      skills: { ...this.skills },
      currency: { ...this.currency },
      factionRelations: { ...this.factionRelations },
      lastLogin: new Date(this.lastLogin),
      playTime: this.playTime,
      created: new Date(this.created),
      updated: new Date(this.updated)
    };
  }

  /**
   * Load player from save data
   */
  static fromSaveData(saveData: IPlayerSaveData): Player {
    const player = new Player(saveData.username, saveData.sessionId, saveData.location.roomId);

    // Override base entity properties
    player.id = saveData.id;
    player.created = new Date(saveData.created);
    player.updated = new Date(saveData.updated);

    // Load all other properties
    player.stats = { ...saveData.stats };
    player.inventory = saveData.inventory.map(item => ({ ...item }));
    player.equipment = { ...saveData.equipment };
    player.flags = [...saveData.flags];
    player.quests = saveData.quests.map(quest => ({ ...quest }));
    player.skills = { ...saveData.skills };
    player.currency = { ...saveData.currency };
    player.factionRelations = { ...saveData.factionRelations };
    player.lastLogin = new Date(saveData.lastLogin);
    player.playTime = saveData.playTime;

    return player;
  }

  /**
   * Convert to JSON representation
   */
  toJSON(): object {
    return {
      ...super.toJSON(),
      username: this.username,
      sessionId: this.sessionId,
      stats: this.stats,
      inventory: this.inventory,
      equipment: this.equipment,
      currentRoomId: this.currentRoomId,
      flags: this.flags,
      quests: this.quests,
      skills: this.skills,
      currency: this.currency,
      factionRelations: this.factionRelations,
      lastLogin: this.lastLogin.toISOString(),
      playTime: this.playTime
    };
  }
}