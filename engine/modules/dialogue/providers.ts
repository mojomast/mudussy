/**
 * Dialogue providers - implementations of IDialogueProvider
 */

import { GameEvent, EventSystem } from '../../core/event';
import { IPlayer } from '../persistence/types';
import {
  IDialogueProvider,
  IDialogueResponse,
  IConversationState,
  IDialogueTree,
  IDialogueNode,
  IVariableContext,
  IDialogueCondition,
  IDialogueAction,
  DialogueEventTypes
} from './types';

/**
 * Abstract base class for dialogue providers
 */
export abstract class BaseDialogueProvider implements IDialogueProvider {
  public id: string;
  public name: string;
  public type: 'canned' | 'ai' | 'custom';
  protected eventSystem: EventSystem;
  protected config: any;
  protected activeConversations: Map<string, IConversationState> = new Map();
  protected logger: any;

  constructor(id: string, name: string, type: 'canned' | 'ai' | 'custom', eventSystem: EventSystem, logger?: any) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.eventSystem = eventSystem;
    this.logger = logger || console;
  }

  /**
   * Initialize the dialogue provider
   */
  async initialize(config?: any): Promise<void> {
    this.config = config || {};
    this.logger.log(`Initialized dialogue provider: ${this.name} (${this.type})`);
  }

  /**
   * Check if provider can handle a specific NPC
   */
  abstract canHandle(npcId: string): boolean;

  /**
   * Start a conversation with an NPC
   */
  abstract startConversation(player: IPlayer, npcId: string, context?: any): Promise<IDialogueResponse>;

  /**
   * Continue a conversation with player input
   */
  abstract continueConversation(
    player: IPlayer,
    npcId: string,
    playerInput: string,
    conversationId: string
  ): Promise<IDialogueResponse>;

  /**
   * End a conversation
   */
  async endConversation(player: IPlayer, npcId: string, conversationId: string): Promise<void> {
    const conversation = this.activeConversations.get(conversationId);
    if (conversation) {
      conversation.isActive = false;
      this.activeConversations.delete(conversationId);

      // Emit conversation ended event
      this.eventSystem.emit(new GameEvent(
        DialogueEventTypes.CONVERSATION_ENDED,
        conversationId,
        player.id,
        {
          conversationId,
          playerId: player.id,
          npcId,
          providerId: this.id,
          duration: Date.now() - conversation.started.getTime()
        }
      ));
    }
  }

  /**
   * Get conversation state
   */
  getConversationState(conversationId: string): IConversationState | undefined {
    return this.activeConversations.get(conversationId);
  }

  /**
   * Create a new conversation state
   */
  protected createConversationState(player: IPlayer, npcId: string): IConversationState {
    const conversationId = `${this.id}_${player.id}_${npcId}_${Date.now()}`;
    const state: IConversationState = {
      conversationId,
      playerId: player.id,
      npcId,
      providerId: this.id,
      variables: {},
      flags: [],
      started: new Date(),
      lastActivity: new Date(),
      isActive: true
    };

    this.activeConversations.set(conversationId, state);
    return state;
  }

  /**
   * Update conversation state
   */
  protected updateConversationState(conversationId: string, updates: Partial<IConversationState>): void {
    const conversation = this.activeConversations.get(conversationId);
    if (conversation) {
      Object.assign(conversation, updates);
      conversation.lastActivity = new Date();
      this.activeConversations.set(conversationId, conversation);
    }
  }

  /**
   * Create variable context for evaluation
   */
  protected createVariableContext(player: IPlayer, npcId: string, conversationState: IConversationState): IVariableContext {
    return {
      player: {
        stats: player.stats,
        inventory: player.inventory.map(item => item.itemId),
        flags: player.flags,
        quests: Object.fromEntries(player.quests.map(q => [q.questId, q])),
        skills: player.skills,
        level: player.stats.level || 1,
        currency: player.currency,
        factionRelations: player.factionRelations
      },
      npc: {
        id: npcId,
        name: npcId, // Will be resolved by world manager
        flags: [], // Will be resolved by world manager
        stats: {} // Will be resolved by world manager
      },
      conversation: {
        variables: conversationState.variables,
        turnCount: 0, // TODO: Implement turn counting
        started: conversationState.started,
        lastActivity: conversationState.lastActivity
      },
      world: {
        time: new Date(),
        globalFlags: {}, // TODO: Get from game state
        factionRelations: {} // TODO: Get from game state
      }
    };
  }

  /**
   * Evaluate a dialogue condition
   */
  protected evaluateCondition(condition: IDialogueCondition, context: IVariableContext): boolean {
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
  protected async executeAction(action: IDialogueAction, context: IVariableContext): Promise<void> {
    try {
      const { type, target, value } = action;

      // Emit action execution event
      this.eventSystem.emit(new GameEvent(
        DialogueEventTypes.DIALOGUE_ACTION_EXECUTED,
        context.conversation.variables.conversationId,
        context.player.stats.id,
        { action, context: { ...context, npc: undefined } } // Remove npc to avoid circular reference
      ));

      switch (type) {
        case 'set_variable':
          context.conversation.variables[target!] = value;
          break;
        case 'give_item':
          // TODO: Implement item giving through world manager
          this.logger.log(`Giving item ${target} to player ${context.player.stats.id}`);
          break;
        case 'take_item':
          // TODO: Implement item taking through world manager
          this.logger.log(`Taking item ${target} from player ${context.player.stats.id}`);
          break;
        case 'add_flag':
          if (!context.player.flags.includes(target!)) {
            context.player.flags.push(target!);
          }
          break;
        case 'remove_flag': {
          const index = context.player.flags.indexOf(target!);
          if (index !== -1) {
            context.player.flags.splice(index, 1);
          }
          break;
        }
        case 'start_quest':
          // TODO: Implement quest system integration
          this.logger.log(`Starting quest ${target} for player ${context.player.stats.id}`);
          break;
        case 'complete_quest':
          // TODO: Implement quest system integration
          this.logger.log(`Completing quest ${target} for player ${context.player.stats.id}`);
          break;
        case 'custom':
          // Custom actions handled by subclasses
          await this.executeCustomAction(action, context);
          break;
        default:
          this.logger.warn(`Unknown action type: ${type}`);
      }
    } catch (error) {
      this.logger.error(`Error executing action: ${error}`);
    }
  }

  /**
   * Execute custom action (override in subclasses)
   */
  protected async executeCustomAction(action: IDialogueAction, context: IVariableContext): Promise<void> {
    // Default implementation - do nothing
  }
}