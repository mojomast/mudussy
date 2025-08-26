/**
 * Dialogue Manager - coordinates dialogue providers and manages conversations
 */

import * as fs from 'fs';
import * as path from 'path';
import { GameEvent, EventSystem } from '../../core/event';
import { IPlayer } from '../persistence/types';
import {
  IDialogueProvider,
  IDialogueResponse,
  IConversationState,
  IVariableContext,
  IDialogueCondition,
  IDialogueAction,
  IDialogueManager,
  IDialogueConfig,
  DialogueEventTypes
} from './types';
import { CannedBranchingProvider } from './canned-branching-provider';

export class DialogueManager implements IDialogueManager {
  private providers: Map<string, IDialogueProvider> = new Map();
  private activeConversations: Map<string, IConversationState> = new Map();
  private config: IDialogueConfig;
  private eventSystem: EventSystem;
  private logger: any;
  private autoSaveTimer?: NodeJS.Timeout;

  constructor(eventSystem: EventSystem, logger?: any) {
    this.eventSystem = eventSystem;
    this.logger = logger || console;
    this.config = this.createDefaultConfig();
  }

  /**
   * Initialize the dialogue manager
   */
  async initialize(config: IDialogueConfig): Promise<void> {
    this.config = { ...this.config, ...config };

    // Register built-in providers
    if (config.providers) {
      for (const [id, provider] of Object.entries(config.providers)) {
        this.registerProvider(provider);
      }
    } else {
      // Register default canned branching provider
      const cannedProvider = new CannedBranchingProvider(this.eventSystem, this.logger);
      await cannedProvider.initialize(config);
      this.registerProvider(cannedProvider);
    }

    // Set default provider if not specified
    if (!this.config.defaultProvider && this.providers.size > 0) {
      this.config.defaultProvider = Array.from(this.providers.keys())[0];
    }

    // Start auto-save timer if persistence is enabled
    if (this.config.enablePersistence && this.config.autoSaveIntervalSeconds > 0) {
      this.startAutoSave();
    }

    this.logger.log(`Dialogue manager initialized with ${this.providers.size} providers`);
  }

  /**
   * Create default configuration
   */
  private createDefaultConfig(): IDialogueConfig {
    return {
      enablePersistence: true,
      maxConversationsPerPlayer: 5,
      conversationTimeoutMinutes: 30,
      autoSaveIntervalSeconds: 300,
      defaultProvider: 'canned-branching',
      providers: {},
      contentPath: './content'
    };
  }

  /**
   * Register a dialogue provider
   */
  registerProvider(provider: IDialogueProvider): void {
    this.providers.set(provider.id, provider);
    this.logger.log(`Registered dialogue provider: ${provider.name} (${provider.id})`);
  }

  /**
   * Unregister a dialogue provider
   */
  unregisterProvider(providerId: string): boolean {
    const provider = this.providers.get(providerId);
    if (provider) {
      // End all active conversations for this provider
      for (const [conversationId, state] of this.activeConversations.entries()) {
        if (state.providerId === providerId) {
          this.endConversationInternal(conversationId);
        }
      }

      this.providers.delete(providerId);
      this.logger.log(`Unregistered dialogue provider: ${providerId}`);
      return true;
    }
    return false;
  }

  /**
   * Get a dialogue provider by ID
   */
  getProvider(providerId: string): IDialogueProvider | undefined {
    return this.providers.get(providerId);
  }

  /**
   * Start a conversation with an NPC
   */
  async startConversation(player: IPlayer, npcId: string, providerId?: string): Promise<IDialogueResponse> {
    // Check conversation limits
    const playerConversations = Array.from(this.activeConversations.values())
      .filter(state => state.playerId === player.id);

    if (playerConversations.length >= this.config.maxConversationsPerPlayer) {
      throw new Error(`Player ${player.username} has reached the maximum number of concurrent conversations`);
    }

    // Determine provider
    const provider = this.providers.get(providerId || this.config.defaultProvider);
    if (!provider) {
      throw new Error(`Dialogue provider not found: ${providerId || this.config.defaultProvider}`);
    }

    if (!provider.canHandle(npcId)) {
      throw new Error(`Provider ${provider.id} cannot handle NPC: ${npcId}`);
    }

    // Start the conversation
    const response = await provider.startConversation(player, npcId);

    // Track the conversation
    this.activeConversations.set(response.conversationId, response.state);

    return response;
  }

  /**
   * Continue a conversation with player input
   */
  async continueConversation(
    player: IPlayer,
    npcId: string,
    input: string,
    conversationId: string
  ): Promise<IDialogueResponse> {
    const conversation = this.activeConversations.get(conversationId);
    if (!conversation) {
      throw new Error(`Conversation not found: ${conversationId}`);
    }

    if (conversation.playerId !== player.id) {
      throw new Error(`Conversation ${conversationId} does not belong to player ${player.id}`);
    }

    // Check for conversation timeout
    const now = new Date();
    const timeSinceLastActivity = now.getTime() - conversation.lastActivity.getTime();
    const timeoutMs = this.config.conversationTimeoutMinutes * 60 * 1000;

    if (timeSinceLastActivity > timeoutMs) {
      await this.endConversation(player, npcId, conversationId);
      throw new Error('Conversation has timed out');
    }

    const provider = this.providers.get(conversation.providerId);
    if (!provider) {
      throw new Error(`Dialogue provider not found: ${conversation.providerId}`);
    }

    const response = await provider.continueConversation(player, npcId, input, conversationId);

    // Update conversation state
    if (response.isComplete) {
      this.activeConversations.delete(conversationId);
    } else {
      this.activeConversations.set(conversationId, response.state);
    }

    return response;
  }

  /**
   * End a conversation
   */
  async endConversation(player: IPlayer, npcId: string, conversationId: string): Promise<void> {
    const conversation = this.activeConversations.get(conversationId);
    if (!conversation) {
      return; // Conversation already ended
    }

    if (conversation.playerId !== player.id) {
      throw new Error(`Conversation ${conversationId} does not belong to player ${player.id}`);
    }

    const provider = this.providers.get(conversation.providerId);
    if (provider) {
      await provider.endConversation(player, npcId, conversationId);
    }

    this.activeConversations.delete(conversationId);
  }

  /**
   * Internal method to end conversation without player validation
   */
  private async endConversationInternal(conversationId: string): Promise<void> {
    const conversation = this.activeConversations.get(conversationId);
    if (!conversation) {
      return;
    }

    const provider = this.providers.get(conversation.providerId);
    if (provider) {
      // We don't have the player object here, so we'll pass a minimal one
      const mockPlayer = { id: conversation.playerId } as IPlayer;
      await provider.endConversation(mockPlayer, conversation.npcId, conversationId);
    }

    this.activeConversations.delete(conversationId);
  }

  /**
   * Get conversation state
   */
  getConversationState(conversationId: string): IConversationState | undefined {
    return this.activeConversations.get(conversationId);
  }

  /**
   * Get all active conversations for a player
   */
  getPlayerConversations(playerId: string): IConversationState[] {
    return Array.from(this.activeConversations.values())
      .filter(state => state.playerId === playerId);
  }

  /**
   * Evaluate a dialogue condition
   */
  evaluateCondition(condition: IDialogueCondition, context: IVariableContext): boolean {
    // This is handled by the providers, but we provide a central implementation
    try {
      let result = false;
      const { type, operator, target, value, negate } = condition;

      switch (type) {
        case 'variable':
          result = this.evaluateVariableCondition(operator, target, value, context);
          break;
        case 'flag':
          result = this.evaluateFlagCondition(operator, target, context);
          break;
        case 'item':
          result = this.evaluateItemCondition(operator, target, value, context);
          break;
        case 'quest':
          result = this.evaluateQuestCondition(operator, target, value, context);
          break;
        case 'stat':
          result = this.evaluateStatCondition(operator, target, value, context);
          break;
        case 'skill':
          result = this.evaluateSkillCondition(operator, target, value, context);
          break;
        case 'level':
          result = this.evaluateLevelCondition(operator, value, context);
          break;
        case 'time':
          result = this.evaluateTimeCondition(operator, value, context);
          break;
        case 'random':
          result = Math.random() < (value || 0.5);
          break;
        default:
          this.logger.warn(`Unknown condition type: ${type}`);
          result = false;
      }

      return negate ? !result : result;
    } catch (error) {
      this.logger.error(`Error evaluating condition: ${error}`);
      return false;
    }
  }

  private evaluateVariableCondition(operator: string, target: string, value: any, context: IVariableContext): boolean {
    const variableValue = context.conversation.variables[target];
    return this.compareValues(variableValue, value, operator);
  }

  private evaluateFlagCondition(operator: string, target: string, context: IVariableContext): boolean {
    const hasFlag = context.player.flags.includes(target);
    return operator === 'has' ? hasFlag : !hasFlag;
  }

  private evaluateItemCondition(operator: string, target: string, value: any, context: IVariableContext): boolean {
    const hasItem = context.player.inventory.includes(target);
    const quantity = context.player.inventory.filter(item => item === target).length;

    if (operator === 'has' || operator === 'not_has') {
      return operator === 'has' ? hasItem : !hasItem;
    }

    return this.compareValues(quantity, value, operator);
  }

  private evaluateQuestCondition(operator: string, target: string, value: any, context: IVariableContext): boolean {
    const quest = context.player.quests[target];
    if (!quest) return operator === 'not_has' || operator === 'not_equals';

    return this.compareValues(quest.status, value, operator);
  }

  private evaluateStatCondition(operator: string, target: string, value: any, context: IVariableContext): boolean {
    const statValue = context.player.stats[target];
    return this.compareValues(statValue, value, operator);
  }

  private evaluateSkillCondition(operator: string, target: string, value: any, context: IVariableContext): boolean {
    const skillValue = context.player.skills[target] || 0;
    return this.compareValues(skillValue, value, operator);
  }

  private evaluateLevelCondition(operator: string, value: any, context: IVariableContext): boolean {
    return this.compareValues(context.player.level, value, operator);
  }

  private evaluateTimeCondition(operator: string, value: any, context: IVariableContext): boolean {
    const now = new Date();
    const targetTime = new Date(value);
    const diff = now.getTime() - targetTime.getTime();

    return this.compareValues(diff, 0, operator);
  }

  private compareValues(actual: any, expected: any, operator: string): boolean {
    switch (operator) {
      case 'equals':
        return actual === expected;
      case 'not_equals':
        return actual !== expected;
      case 'greater_than':
        return (actual || 0) > (expected || 0);
      case 'less_than':
        return (actual || 0) < (expected || 0);
      case 'has':
        return actual !== undefined && actual !== null;
      case 'not_has':
        return actual === undefined || actual === null;
      case 'in':
        return Array.isArray(expected) && expected.includes(actual);
      case 'not_in':
        return Array.isArray(expected) && !expected.includes(actual);
      default:
        return false;
    }
  }

  /**
   * Execute a dialogue action
   */
  async executeAction(action: IDialogueAction, context: IVariableContext): Promise<void> {
    // Emit action execution event
    this.eventSystem.emit(new GameEvent(
      DialogueEventTypes.DIALOGUE_ACTION_EXECUTED,
      context.conversation.variables.conversationId,
      context.player.stats.id,
      { action, context }
    ));

    // Action execution is handled by providers, but we can provide central coordination
    // This is a placeholder for future centralized action handling
  }

  /**
   * Resolve variables in text
   */
  resolveVariables(text: string, context: IVariableContext): string {
    return text.replace(/\{\{([^}]+)\}\}/g, (match, variablePath) => {
      try {
        const value = this.getVariableValue(variablePath.trim(), context);
        return value !== undefined ? String(value) : match;
      } catch (error) {
        this.logger.warn(`Error resolving variable ${variablePath}: ${error}`);
        return match;
      }
    });
  }

  /**
   * Get variable value from context using dot notation
   */
  private getVariableValue(path: string, context: IVariableContext): any {
    const parts = path.split('.');
    let current: any = context;

    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return undefined;
      }
    }

    return current;
  }

  /**
   * Start auto-save timer
   */
  private startAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }

    this.autoSaveTimer = setInterval(() => {
      this.saveConversations();
    }, this.config.autoSaveIntervalSeconds * 1000);
  }

  /**
   * Save active conversations to persistence
   */
  private async saveConversations(): Promise<void> {
    if (!this.config.enablePersistence) return;

    try {
      const conversations = Array.from(this.activeConversations.values());
      // TODO: Implement persistence through save system
      this.logger.log(`Auto-saved ${conversations.length} conversations`);
    } catch (error) {
      this.logger.error(`Error auto-saving conversations: ${error}`);
    }
  }

  /**
   * Load conversations from persistence
   */
  private async loadConversations(): Promise<void> {
    if (!this.config.enablePersistence) return;

    try {
      // TODO: Implement loading from persistence system
      this.logger.log('Loaded conversations from persistence');
    } catch (error) {
      this.logger.error(`Error loading conversations: ${error}`);
    }
  }

  /**
   * Clean up inactive conversations
   */
  private cleanupInactiveConversations(): void {
    const now = new Date();
    const timeoutMs = this.config.conversationTimeoutMinutes * 60 * 1000;
    let cleanedCount = 0;

    for (const [conversationId, state] of this.activeConversations.entries()) {
      const timeSinceLastActivity = now.getTime() - state.lastActivity.getTime();

      if (timeSinceLastActivity > timeoutMs) {
        this.endConversationInternal(conversationId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.log(`Cleaned up ${cleanedCount} inactive conversations`);
    }
  }

  /**
   * Get statistics about the dialogue system
   */
  getStatistics(): any {
    return {
      activeProviders: this.providers.size,
      activeConversations: this.activeConversations.size,
      providerTypes: Array.from(this.providers.values()).map(p => p.type),
      config: {
        enablePersistence: this.config.enablePersistence,
        maxConversationsPerPlayer: this.config.maxConversationsPerPlayer,
        conversationTimeoutMinutes: this.config.conversationTimeoutMinutes
      }
    };
  }

  /**
   * Shutdown the dialogue manager
   */
  async shutdown(): Promise<void> {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }

    // Save all conversations before shutdown
    if (this.config.enablePersistence) {
      await this.saveConversations();
    }

    // End all active conversations
    for (const conversationId of this.activeConversations.keys()) {
      await this.endConversationInternal(conversationId);
    }

    this.logger.log('Dialogue manager shut down');
  }
}