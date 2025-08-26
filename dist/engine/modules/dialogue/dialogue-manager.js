"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DialogueManager = void 0;
const event_1 = require("../../core/event");
const types_1 = require("./types");
const canned_branching_provider_1 = require("./canned-branching-provider");
class DialogueManager {
    constructor(eventSystem, logger) {
        this.providers = new Map();
        this.activeConversations = new Map();
        this.eventSystem = eventSystem;
        this.logger = logger || console;
        this.config = this.createDefaultConfig();
    }
    async initialize(config) {
        this.config = { ...this.config, ...config };
        if (config.providers) {
            for (const [id, provider] of Object.entries(config.providers)) {
                this.registerProvider(provider);
            }
        }
        else {
            const cannedProvider = new canned_branching_provider_1.CannedBranchingProvider(this.eventSystem, this.logger);
            await cannedProvider.initialize(config);
            this.registerProvider(cannedProvider);
        }
        if (!this.config.defaultProvider && this.providers.size > 0) {
            this.config.defaultProvider = Array.from(this.providers.keys())[0];
        }
        if (this.config.enablePersistence && this.config.autoSaveIntervalSeconds > 0) {
            this.startAutoSave();
        }
        this.logger.log(`Dialogue manager initialized with ${this.providers.size} providers`);
    }
    createDefaultConfig() {
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
    registerProvider(provider) {
        this.providers.set(provider.id, provider);
        this.logger.log(`Registered dialogue provider: ${provider.name} (${provider.id})`);
    }
    unregisterProvider(providerId) {
        const provider = this.providers.get(providerId);
        if (provider) {
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
    getProvider(providerId) {
        return this.providers.get(providerId);
    }
    async startConversation(player, npcId, providerId) {
        const playerConversations = Array.from(this.activeConversations.values())
            .filter(state => state.playerId === player.id);
        if (playerConversations.length >= this.config.maxConversationsPerPlayer) {
            throw new Error(`Player ${player.username} has reached the maximum number of concurrent conversations`);
        }
        const provider = this.providers.get(providerId || this.config.defaultProvider);
        if (!provider) {
            throw new Error(`Dialogue provider not found: ${providerId || this.config.defaultProvider}`);
        }
        if (!provider.canHandle(npcId)) {
            throw new Error(`Provider ${provider.id} cannot handle NPC: ${npcId}`);
        }
        const response = await provider.startConversation(player, npcId);
        this.activeConversations.set(response.conversationId, response.state);
        return response;
    }
    async continueConversation(player, npcId, input, conversationId) {
        const conversation = this.activeConversations.get(conversationId);
        if (!conversation) {
            throw new Error(`Conversation not found: ${conversationId}`);
        }
        if (conversation.playerId !== player.id) {
            throw new Error(`Conversation ${conversationId} does not belong to player ${player.id}`);
        }
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
        if (response.isComplete) {
            this.activeConversations.delete(conversationId);
        }
        else {
            this.activeConversations.set(conversationId, response.state);
        }
        return response;
    }
    async endConversation(player, npcId, conversationId) {
        const conversation = this.activeConversations.get(conversationId);
        if (!conversation) {
            return;
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
    async endConversationInternal(conversationId) {
        const conversation = this.activeConversations.get(conversationId);
        if (!conversation) {
            return;
        }
        const provider = this.providers.get(conversation.providerId);
        if (provider) {
            const mockPlayer = { id: conversation.playerId };
            await provider.endConversation(mockPlayer, conversation.npcId, conversationId);
        }
        this.activeConversations.delete(conversationId);
    }
    getConversationState(conversationId) {
        return this.activeConversations.get(conversationId);
    }
    getPlayerConversations(playerId) {
        return Array.from(this.activeConversations.values())
            .filter(state => state.playerId === playerId);
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
        this.eventSystem.emit(new event_1.GameEvent(types_1.DialogueEventTypes.DIALOGUE_ACTION_EXECUTED, context.conversation.variables.conversationId, context.player.stats.id, { action, context }));
    }
    resolveVariables(text, context) {
        return text.replace(/\{\{([^}]+)\}\}/g, (match, variablePath) => {
            try {
                const value = this.getVariableValue(variablePath.trim(), context);
                return value !== undefined ? String(value) : match;
            }
            catch (error) {
                this.logger.warn(`Error resolving variable ${variablePath}: ${error}`);
                return match;
            }
        });
    }
    getVariableValue(path, context) {
        const parts = path.split('.');
        let current = context;
        for (const part of parts) {
            if (current && typeof current === 'object' && part in current) {
                current = current[part];
            }
            else {
                return undefined;
            }
        }
        return current;
    }
    startAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
        }
        this.autoSaveTimer = setInterval(() => {
            this.saveConversations();
        }, this.config.autoSaveIntervalSeconds * 1000);
    }
    async saveConversations() {
        if (!this.config.enablePersistence)
            return;
        try {
            const conversations = Array.from(this.activeConversations.values());
            this.logger.log(`Auto-saved ${conversations.length} conversations`);
        }
        catch (error) {
            this.logger.error(`Error auto-saving conversations: ${error}`);
        }
    }
    async loadConversations() {
        if (!this.config.enablePersistence)
            return;
        try {
            this.logger.log('Loaded conversations from persistence');
        }
        catch (error) {
            this.logger.error(`Error loading conversations: ${error}`);
        }
    }
    cleanupInactiveConversations() {
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
    getStatistics() {
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
    async shutdown() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
        }
        if (this.config.enablePersistence) {
            await this.saveConversations();
        }
        for (const conversationId of this.activeConversations.keys()) {
            await this.endConversationInternal(conversationId);
        }
        this.logger.log('Dialogue manager shut down');
    }
}
exports.DialogueManager = DialogueManager;
//# sourceMappingURL=dialogue-manager.js.map