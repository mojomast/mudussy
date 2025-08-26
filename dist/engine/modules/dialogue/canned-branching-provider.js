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
exports.CannedBranchingProvider = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const yaml = __importStar(require("js-yaml"));
const event_1 = require("../../core/event");
const providers_1 = require("./providers");
const types_1 = require("./types");
class CannedBranchingProvider extends providers_1.BaseDialogueProvider {
    constructor(eventSystem, logger) {
        super('canned-branching', 'Canned Branching Provider', 'canned', eventSystem, logger);
        this.dialogueTrees = new Map();
        this.npcToTreeMapping = new Map();
    }
    async initialize(config) {
        await super.initialize(config);
        if (config?.contentPath) {
            await this.loadDialogueTrees(config.contentPath);
        }
        if (config?.npcMappings) {
            this.loadNPCMappings(config.npcMappings);
        }
    }
    async loadDialogueTrees(contentPath) {
        try {
            const dialoguePath = path.join(contentPath, 'dialogue');
            if (!fs.existsSync(dialoguePath)) {
                this.logger.log(`Dialogue path does not exist: ${dialoguePath}`);
                return;
            }
            const files = fs.readdirSync(dialoguePath);
            let loadedCount = 0;
            for (const file of files) {
                if (file.endsWith('.yaml') || file.endsWith('.yml') || file.endsWith('.json')) {
                    const filePath = path.join(dialoguePath, file);
                    const content = fs.readFileSync(filePath, 'utf8');
                    try {
                        let dialogueTree;
                        if (file.endsWith('.json')) {
                            dialogueTree = JSON.parse(content);
                        }
                        else {
                            dialogueTree = yaml.load(content);
                        }
                        if (!this.validateDialogueTree(dialogueTree)) {
                            this.logger.error(`Invalid dialogue tree in ${file}`);
                            continue;
                        }
                        this.dialogueTrees.set(dialogueTree.id, dialogueTree);
                        loadedCount++;
                        this.logger.log(`Loaded dialogue tree: ${dialogueTree.name} (${dialogueTree.id})`);
                    }
                    catch (error) {
                        this.logger.error(`Error loading dialogue tree from ${file}: ${error}`);
                    }
                }
            }
            this.logger.log(`Loaded ${loadedCount} dialogue trees from ${dialoguePath}`);
        }
        catch (error) {
            this.logger.error(`Error loading dialogue trees: ${error}`);
        }
    }
    loadNPCMappings(mappings) {
        for (const [npcId, treeId] of Object.entries(mappings)) {
            this.npcToTreeMapping.set(npcId, treeId);
            this.logger.log(`Mapped NPC ${npcId} to dialogue tree ${treeId}`);
        }
    }
    validateDialogueTree(tree) {
        if (!tree.id || !tree.name || !tree.startNodeId || !tree.nodes) {
            return false;
        }
        if (!tree.nodes[tree.startNodeId]) {
            return false;
        }
        for (const [nodeId, node] of Object.entries(tree.nodes)) {
            if (!node.id || node.id !== nodeId || !node.npcMessage) {
                return false;
            }
        }
        return true;
    }
    canHandle(npcId) {
        return this.npcToTreeMapping.has(npcId);
    }
    async startConversation(player, npcId, context) {
        const treeId = this.npcToTreeMapping.get(npcId);
        if (!treeId) {
            throw new Error(`No dialogue tree mapped for NPC: ${npcId}`);
        }
        const dialogueTree = this.dialogueTrees.get(treeId);
        if (!dialogueTree) {
            throw new Error(`Dialogue tree not found: ${treeId}`);
        }
        const conversationState = this.createConversationState(player, npcId);
        conversationState.currentNodeId = dialogueTree.startNodeId;
        conversationState.variables = { ...dialogueTree.variables };
        const startNode = dialogueTree.nodes[dialogueTree.startNodeId];
        const variableContext = this.createVariableContext(player, npcId, conversationState);
        if (startNode.actions) {
            for (const action of startNode.actions) {
                if (!action.condition || this.evaluateCondition(action.condition, variableContext)) {
                    await this.executeAction(action, variableContext);
                }
            }
        }
        this.eventSystem.emit(new event_1.GameEvent(types_1.DialogueEventTypes.CONVERSATION_STARTED, conversationState.conversationId, player.id, {
            conversationId: conversationState.conversationId,
            playerId: player.id,
            npcId,
            treeId,
            providerId: this.id
        }));
        this.eventSystem.emit(new event_1.GameEvent(types_1.DialogueEventTypes.DIALOGUE_NODE_REACHED, conversationState.conversationId, player.id, {
            conversationId: conversationState.conversationId,
            nodeId: startNode.id,
            treeId
        }));
        return this.createDialogueResponse(startNode, conversationState, variableContext);
    }
    async continueConversation(player, npcId, playerInput, conversationId) {
        const conversationState = this.activeConversations.get(conversationId);
        if (!conversationState || !conversationState.isActive) {
            throw new Error(`No active conversation found: ${conversationId}`);
        }
        const treeId = this.npcToTreeMapping.get(npcId);
        if (!treeId) {
            throw new Error(`No dialogue tree mapped for NPC: ${npcId}`);
        }
        const dialogueTree = this.dialogueTrees.get(treeId);
        if (!dialogueTree) {
            throw new Error(`Dialogue tree not found: ${treeId}`);
        }
        const currentNodeId = conversationState.currentNodeId;
        if (!currentNodeId) {
            throw new Error(`No current node in conversation: ${conversationId}`);
        }
        const currentNode = dialogueTree.nodes[currentNodeId];
        if (!currentNode) {
            throw new Error(`Current node not found: ${currentNodeId}`);
        }
        const variableContext = this.createVariableContext(player, npcId, conversationState);
        let selectedChoice = null;
        let nextNodeId = currentNode.nextNodeId;
        if (currentNode.choices && currentNode.choices.length > 0) {
            for (const choice of currentNode.choices) {
                if (!choice.condition || this.evaluateCondition(choice.condition, variableContext)) {
                    if (this.matchesChoice(choice, playerInput)) {
                        selectedChoice = choice;
                        break;
                    }
                }
            }
            if (selectedChoice) {
                if (selectedChoice.actions) {
                    for (const action of selectedChoice.actions) {
                        if (!action.condition || this.evaluateCondition(action.condition, variableContext)) {
                            await this.executeAction(action, variableContext);
                        }
                    }
                }
                nextNodeId = selectedChoice.nextNodeId || currentNode.nextNodeId;
                this.eventSystem.emit(new event_1.GameEvent(types_1.DialogueEventTypes.DIALOGUE_CHOICE_MADE, conversationId, player.id, {
                    conversationId,
                    choiceId: selectedChoice.id,
                    choiceText: selectedChoice.text,
                    nodeId: currentNodeId
                }));
            }
            else {
                return this.createDialogueResponse(currentNode, conversationState, variableContext, true);
            }
        }
        if (!nextNodeId || currentNode.isEnd) {
            conversationState.isActive = false;
            return this.createDialogueResponse(currentNode, conversationState, variableContext, false, true);
        }
        const nextNode = dialogueTree.nodes[nextNodeId];
        if (!nextNode) {
            throw new Error(`Next node not found: ${nextNodeId}`);
        }
        conversationState.currentNodeId = nextNodeId;
        this.updateConversationState(conversationId, conversationState);
        if (nextNode.actions) {
            for (const action of nextNode.actions) {
                if (!action.condition || this.evaluateCondition(action.condition, variableContext)) {
                    await this.executeAction(action, variableContext);
                }
            }
        }
        if (nextNode.variables) {
            conversationState.variables = { ...conversationState.variables, ...nextNode.variables };
        }
        this.eventSystem.emit(new event_1.GameEvent(types_1.DialogueEventTypes.DIALOGUE_NODE_REACHED, conversationId, player.id, {
            conversationId,
            nodeId: nextNodeId,
            treeId
        }));
        this.eventSystem.emit(new event_1.GameEvent(types_1.DialogueEventTypes.CONVERSATION_CONTINUED, conversationId, player.id, {
            conversationId,
            playerInput,
            currentNodeId: nextNodeId,
            treeId
        }));
        return this.createDialogueResponse(nextNode, conversationState, variableContext);
    }
    matchesChoice(choice, playerInput) {
        const input = playerInput.toLowerCase().trim();
        if (choice.id && !isNaN(parseInt(input))) {
            return parseInt(input) === parseInt(choice.id);
        }
        const choiceText = choice.text.toLowerCase();
        const words = input.split(' ');
        for (const word of words) {
            if (word.length > 2 && choiceText.includes(word)) {
                return true;
            }
        }
        return false;
    }
    createDialogueResponse(node, conversationState, variableContext, noMatch = false, isComplete = false) {
        let message = node.npcMessage;
        let choices = node.choices || [];
        message = this.resolveVariables(message, variableContext);
        choices = choices.filter(choice => !choice.condition || this.evaluateCondition(choice.condition, variableContext));
        choices = choices.map(choice => ({
            ...choice,
            text: this.resolveVariables(choice.text, variableContext)
        }));
        if (noMatch && choices.length === 0) {
            message += "\n\nI didn't understand that. Please try again.";
            const originalChoices = node.choices || [];
            choices = originalChoices.filter(choice => !choice.condition || this.evaluateCondition(choice.condition, variableContext)).map(choice => ({
                ...choice,
                text: this.resolveVariables(choice.text, variableContext)
            }));
        }
        return {
            conversationId: conversationState.conversationId,
            message,
            choices: choices.length > 0 ? choices : undefined,
            isComplete,
            state: conversationState,
            variables: conversationState.variables,
            actions: node.actions
        };
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
    getDialogueTree(treeId) {
        return this.dialogueTrees.get(treeId);
    }
    getAllDialogueTrees() {
        return Array.from(this.dialogueTrees.values());
    }
    setDialogueTree(tree) {
        if (this.validateDialogueTree(tree)) {
            this.dialogueTrees.set(tree.id, tree);
            this.logger.log(`Updated dialogue tree: ${tree.name} (${tree.id})`);
        }
        else {
            throw new Error(`Invalid dialogue tree: ${tree.id}`);
        }
    }
    mapNPCToTree(npcId, treeId) {
        if (!this.dialogueTrees.has(treeId)) {
            throw new Error(`Dialogue tree not found: ${treeId}`);
        }
        this.npcToTreeMapping.set(npcId, treeId);
        this.logger.log(`Mapped NPC ${npcId} to dialogue tree ${treeId}`);
    }
}
exports.CannedBranchingProvider = CannedBranchingProvider;
//# sourceMappingURL=canned-branching-provider.js.map