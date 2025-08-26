/**
 * Canned Branching Dialogue Provider
 * Handles YAML/JSON dialogue trees with branching conversations
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { GameEvent, EventSystem } from '../../core/event';
import { IPlayer } from '../persistence/types';
import { BaseDialogueProvider } from './providers';
import {
  IDialogueResponse,
  IDialogueTree,
  IDialogueNode,
  IVariableContext,
  IDialogueCondition,
  IDialogueAction,
  DialogueEventTypes
} from './types';

export class CannedBranchingProvider extends BaseDialogueProvider {
  private dialogueTrees: Map<string, IDialogueTree> = new Map();
  private npcToTreeMapping: Map<string, string> = new Map(); // npcId -> treeId

  constructor(eventSystem: EventSystem, logger?: any) {
    super('canned-branching', 'Canned Branching Provider', 'canned', eventSystem, logger);
  }

  /**
   * Initialize the provider with dialogue tree files
   */
  async initialize(config?: any): Promise<void> {
    await super.initialize(config);

    if (config?.contentPath) {
      await this.loadDialogueTrees(config.contentPath);
    }

    if (config?.npcMappings) {
      this.loadNPCMappings(config.npcMappings);
    }
  }

  /**
   * Load dialogue trees from YAML/JSON files
   */
  private async loadDialogueTrees(contentPath: string): Promise<void> {
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
            let dialogueTree: IDialogueTree;

            if (file.endsWith('.json')) {
              dialogueTree = JSON.parse(content);
            } else {
              dialogueTree = yaml.load(content) as IDialogueTree;
            }

            // Validate dialogue tree structure
            if (!this.validateDialogueTree(dialogueTree)) {
              this.logger.error(`Invalid dialogue tree in ${file}`);
              continue;
            }

            this.dialogueTrees.set(dialogueTree.id, dialogueTree);
            loadedCount++;

            this.logger.log(`Loaded dialogue tree: ${dialogueTree.name} (${dialogueTree.id})`);

          } catch (error) {
            this.logger.error(`Error loading dialogue tree from ${file}: ${error}`);
          }
        }
      }

      this.logger.log(`Loaded ${loadedCount} dialogue trees from ${dialoguePath}`);

    } catch (error) {
      this.logger.error(`Error loading dialogue trees: ${error}`);
    }
  }

  /**
   * Load NPC to dialogue tree mappings
   */
  private loadNPCMappings(mappings: Record<string, string>): void {
    for (const [npcId, treeId] of Object.entries(mappings)) {
      this.npcToTreeMapping.set(npcId, treeId);
      this.logger.log(`Mapped NPC ${npcId} to dialogue tree ${treeId}`);
    }
  }

  /**
   * Validate dialogue tree structure
   */
  private validateDialogueTree(tree: IDialogueTree): boolean {
    if (!tree.id || !tree.name || !tree.startNodeId || !tree.nodes) {
      return false;
    }

    if (!tree.nodes[tree.startNodeId]) {
      return false;
    }

    // Validate all nodes have required fields
    for (const [nodeId, node] of Object.entries(tree.nodes)) {
      if (!node.id || node.id !== nodeId || !node.npcMessage) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if provider can handle a specific NPC
   */
  canHandle(npcId: string): boolean {
    return this.npcToTreeMapping.has(npcId);
  }

  /**
   * Start a conversation with an NPC
   */
  async startConversation(player: IPlayer, npcId: string, context?: any): Promise<IDialogueResponse> {
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

    // Initialize conversation variables from tree
    conversationState.variables = { ...dialogueTree.variables };

    const startNode = dialogueTree.nodes[dialogueTree.startNodeId];
    const variableContext = this.createVariableContext(player, npcId, conversationState);

    // Process node actions
    if (startNode.actions) {
      for (const action of startNode.actions) {
        if (!action.condition || this.evaluateCondition(action.condition, variableContext)) {
          await this.executeAction(action, variableContext);
        }
      }
    }

    // Emit conversation started event
    this.eventSystem.emit(new GameEvent(
      DialogueEventTypes.CONVERSATION_STARTED,
      conversationState.conversationId,
      player.id,
      {
        conversationId: conversationState.conversationId,
        playerId: player.id,
        npcId,
        treeId,
        providerId: this.id
      }
    ));

    // Emit node reached event
    this.eventSystem.emit(new GameEvent(
      DialogueEventTypes.DIALOGUE_NODE_REACHED,
      conversationState.conversationId,
      player.id,
      {
        conversationId: conversationState.conversationId,
        nodeId: startNode.id,
        treeId
      }
    ));

    return this.createDialogueResponse(startNode, conversationState, variableContext);
  }

  /**
   * Continue a conversation with player input
   */
  async continueConversation(
    player: IPlayer,
    npcId: string,
    playerInput: string,
    conversationId: string
  ): Promise<IDialogueResponse> {
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

    // Find matching choice
    let selectedChoice: any = null;
    let nextNodeId = currentNode.nextNodeId;

    if (currentNode.choices && currentNode.choices.length > 0) {
      for (const choice of currentNode.choices) {
        if (!choice.condition || this.evaluateCondition(choice.condition, variableContext)) {
          // Simple text matching for now - could be enhanced with NLP
          if (this.matchesChoice(choice, playerInput)) {
            selectedChoice = choice;
            break;
          }
        }
      }

      if (selectedChoice) {
        // Process choice actions
        if (selectedChoice.actions) {
          for (const action of selectedChoice.actions) {
            if (!action.condition || this.evaluateCondition(action.condition, variableContext)) {
              await this.executeAction(action, variableContext);
            }
          }
        }

        // Use choice-specific next node or default
        nextNodeId = selectedChoice.nextNodeId || currentNode.nextNodeId;

        // Emit choice made event
        this.eventSystem.emit(new GameEvent(
          DialogueEventTypes.DIALOGUE_CHOICE_MADE,
          conversationId,
          player.id,
          {
            conversationId,
            choiceId: selectedChoice.id,
            choiceText: selectedChoice.text,
            nodeId: currentNodeId
          }
        ));
      } else {
        // No matching choice found - stay on current node or show error
        return this.createDialogueResponse(currentNode, conversationState, variableContext, true);
      }
    }

    // Check if conversation should end
    if (!nextNodeId || currentNode.isEnd) {
      conversationState.isActive = false;
      return this.createDialogueResponse(currentNode, conversationState, variableContext, false, true);
    }

    // Move to next node
    const nextNode = dialogueTree.nodes[nextNodeId];
    if (!nextNode) {
      throw new Error(`Next node not found: ${nextNodeId}`);
    }

    conversationState.currentNodeId = nextNodeId;
    this.updateConversationState(conversationId, conversationState);

    // Process next node actions
    if (nextNode.actions) {
      for (const action of nextNode.actions) {
        if (!action.condition || this.evaluateCondition(action.condition, variableContext)) {
          await this.executeAction(action, variableContext);
        }
      }
    }

    // Update conversation variables from node
    if (nextNode.variables) {
      conversationState.variables = { ...conversationState.variables, ...nextNode.variables };
    }

    // Emit node reached event
    this.eventSystem.emit(new GameEvent(
      DialogueEventTypes.DIALOGUE_NODE_REACHED,
      conversationId,
      player.id,
      {
        conversationId,
        nodeId: nextNodeId,
        treeId
      }
    ));

    // Emit conversation continued event
    this.eventSystem.emit(new GameEvent(
      DialogueEventTypes.CONVERSATION_CONTINUED,
      conversationId,
      player.id,
      {
        conversationId,
        playerInput,
        currentNodeId: nextNodeId,
        treeId
      }
    ));

    return this.createDialogueResponse(nextNode, conversationState, variableContext);
  }

  /**
   * Check if player input matches a choice
   */
  private matchesChoice(choice: any, playerInput: string): boolean {
    const input = playerInput.toLowerCase().trim();

    // Check choice ID (numeric choice)
    if (choice.id && !isNaN(parseInt(input))) {
      return parseInt(input) === parseInt(choice.id);
    }

    // Check keywords in choice text
    const choiceText = choice.text.toLowerCase();
    const words = input.split(' ');

    for (const word of words) {
      if (word.length > 2 && choiceText.includes(word)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Create dialogue response from node
   */
  private createDialogueResponse(
    node: IDialogueNode,
    conversationState: any,
    variableContext: IVariableContext,
    noMatch: boolean = false,
    isComplete: boolean = false
  ): IDialogueResponse {
    let message = node.npcMessage;
    let choices = node.choices || [];

    // Resolve variables in message
    message = this.resolveVariables(message, variableContext);

    // Filter choices based on conditions
    choices = choices.filter(choice =>
      !choice.condition || this.evaluateCondition(choice.condition, variableContext)
    );

    // Resolve variables in choice text
    choices = choices.map(choice => ({
      ...choice,
      text: this.resolveVariables(choice.text, variableContext)
    }));

    // Add helpful message if no choices matched
    if (noMatch && choices.length === 0) {
      message += "\n\nI didn't understand that. Please try again.";
      // Re-show original choices
      const originalChoices = node.choices || [];
      choices = originalChoices.filter(choice =>
        !choice.condition || this.evaluateCondition(choice.condition, variableContext)
      ).map(choice => ({
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

  /**
   * Resolve variables in text
   */
  private resolveVariables(text: string, context: IVariableContext): string {
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
   * Get dialogue tree by ID
   */
  getDialogueTree(treeId: string): IDialogueTree | undefined {
    return this.dialogueTrees.get(treeId);
  }

  /**
   * Get all dialogue trees
   */
  getAllDialogueTrees(): IDialogueTree[] {
    return Array.from(this.dialogueTrees.values());
  }

  /**
   * Add or update dialogue tree at runtime
   */
  setDialogueTree(tree: IDialogueTree): void {
    if (this.validateDialogueTree(tree)) {
      this.dialogueTrees.set(tree.id, tree);
      this.logger.log(`Updated dialogue tree: ${tree.name} (${tree.id})`);
    } else {
      throw new Error(`Invalid dialogue tree: ${tree.id}`);
    }
  }

  /**
   * Map NPC to dialogue tree
   */
  mapNPCToTree(npcId: string, treeId: string): void {
    if (!this.dialogueTrees.has(treeId)) {
      throw new Error(`Dialogue tree not found: ${treeId}`);
    }
    this.npcToTreeMapping.set(npcId, treeId);
    this.logger.log(`Mapped NPC ${npcId} to dialogue tree ${treeId}`);
  }
}