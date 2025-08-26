"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseDialogueProvider = void 0;
const event_1 = require("../../core/event");
const types_1 = require("./types");
class BaseDialogueProvider {
    constructor(id, name, type, eventSystem, logger) {
        this.activeConversations = new Map();
        this.id = id;
        this.name = name;
        this.type = type;
        this.eventSystem = eventSystem;
        this.logger = logger || console;
    }
    async initialize(config) {
        this.config = config || {};
        this.logger.log(`Initialized dialogue provider: ${this.name} (${this.type})`);
    }
    async endConversation(player, npcId, conversationId) {
        const conversation = this.activeConversations.get(conversationId);
        if (conversation) {
            conversation.isActive = false;
            this.activeConversations.delete(conversationId);
            this.eventSystem.emit(new event_1.GameEvent(types_1.DialogueEventTypes.CONVERSATION_ENDED, conversationId, player.id, {
                conversationId,
                playerId: player.id,
                npcId,
                providerId: this.id,
                duration: Date.now() - conversation.started.getTime()
            }));
        }
    }
    getConversationState(conversationId) {
        return this.activeConversations.get(conversationId);
    }
    createConversationState(player, npcId) {
        const conversationId = `${this.id}_${player.id}_${npcId}_${Date.now()}`;
        const state = {
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
    updateConversationState(conversationId, updates) {
        const conversation = this.activeConversations.get(conversationId);
        if (conversation) {
            Object.assign(conversation, updates);
            conversation.lastActivity = new Date();
            this.activeConversations.set(conversationId, conversation);
        }
    }
    createVariableContext(player, npcId, conversationState) {
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
                name: npcId,
                flags: [],
                stats: {}
            },
            conversation: {
                variables: conversationState.variables,
                turnCount: 0,
                started: conversationState.started,
                lastActivity: conversationState.lastActivity
            },
            world: {
                time: new Date(),
                globalFlags: {},
                factionRelations: {}
            }
        };
    }
    evaluateCondition(condition, context) {
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
        }
        catch (error) {
            this.logger.error(`Error evaluating condition: ${error}`);
            return false;
        }
    }
    evaluateVariableCondition(operator, target, value, context) {
        const variableValue = context.conversation.variables[target];
        return this.compareValues(variableValue, value, operator);
    }
    evaluateFlagCondition(operator, target, context) {
        const hasFlag = context.player.flags.includes(target);
        return operator === 'has' ? hasFlag : !hasFlag;
    }
    evaluateItemCondition(operator, target, value, context) {
        const hasItem = context.player.inventory.includes(target);
        const quantity = context.player.inventory.filter(item => item === target).length;
        if (operator === 'has' || operator === 'not_has') {
            return operator === 'has' ? hasItem : !hasItem;
        }
        return this.compareValues(quantity, value, operator);
    }
    evaluateQuestCondition(operator, target, value, context) {
        const quest = context.player.quests[target];
        if (!quest)
            return operator === 'not_has' || operator === 'not_equals';
        return this.compareValues(quest.status, value, operator);
    }
    evaluateStatCondition(operator, target, value, context) {
        const statValue = context.player.stats[target];
        return this.compareValues(statValue, value, operator);
    }
    evaluateSkillCondition(operator, target, value, context) {
        const skillValue = context.player.skills[target] || 0;
        return this.compareValues(skillValue, value, operator);
    }
    evaluateLevelCondition(operator, value, context) {
        return this.compareValues(context.player.level, value, operator);
    }
    evaluateTimeCondition(operator, value, context) {
        const now = new Date();
        const targetTime = new Date(value);
        const diff = now.getTime() - targetTime.getTime();
        return this.compareValues(diff, 0, operator);
    }
    compareValues(actual, expected, operator) {
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
    async executeAction(action, context) {
        try {
            const { type, target, value } = action;
            this.eventSystem.emit(new event_1.GameEvent(types_1.DialogueEventTypes.DIALOGUE_ACTION_EXECUTED, context.conversation.variables.conversationId, context.player.stats.id, { action, context: { ...context, npc: undefined } }));
            switch (type) {
                case 'set_variable':
                    context.conversation.variables[target] = value;
                    break;
                case 'give_item':
                    this.logger.log(`Giving item ${target} to player ${context.player.stats.id}`);
                    break;
                case 'take_item':
                    this.logger.log(`Taking item ${target} from player ${context.player.stats.id}`);
                    break;
                case 'add_flag':
                    if (!context.player.flags.includes(target)) {
                        context.player.flags.push(target);
                    }
                    break;
                case 'remove_flag': {
                    const index = context.player.flags.indexOf(target);
                    if (index !== -1) {
                        context.player.flags.splice(index, 1);
                    }
                    break;
                }
                case 'start_quest':
                    this.logger.log(`Starting quest ${target} for player ${context.player.stats.id}`);
                    break;
                case 'complete_quest':
                    this.logger.log(`Completing quest ${target} for player ${context.player.stats.id}`);
                    break;
                case 'custom':
                    await this.executeCustomAction(action, context);
                    break;
                default:
                    this.logger.warn(`Unknown action type: ${type}`);
            }
        }
        catch (error) {
            this.logger.error(`Error executing action: ${error}`);
        }
    }
    async executeCustomAction(action, context) {
    }
}
exports.BaseDialogueProvider = BaseDialogueProvider;
//# sourceMappingURL=providers.js.map