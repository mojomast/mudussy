/**
 * Dialogue command handlers for the command parser
 */

import { ColorScheme, Ansi } from '../networking/ansi';
import { IPlayer } from '../persistence/types';
import { IDialogueManager, IDialogueResponse } from './types';
import { EngineService } from '../../core/engine.service';
import { INPC } from '../world/types';

export class DialogueCommandHandlers {
  private dialogueManager: IDialogueManager;
  private engine?: EngineService;

  constructor(dialogueManager: IDialogueManager, engine?: EngineService) {
    this.dialogueManager = dialogueManager;
    this.engine = engine;
  }

  /**
   * Get the engine service instance
   */
  private getEngine(): EngineService | undefined {
    return this.engine;
  }

  /**
   * Find NPC in current room by name
   */
  private findNPCInRoom(engine: EngineService, roomId: string, npcName: string): INPC | undefined {
    const worldManager = engine.getWorldManager();
    if (!worldManager) return undefined;

    const npcsInRoom = worldManager.getNPCsInRoom(roomId);
    return npcsInRoom.find(npc =>
      npc.name.toLowerCase().includes(npcName.toLowerCase()) ||
      npc.shortDescription?.toLowerCase().includes(npcName.toLowerCase())
    );
  }

  /**
   * Get player by session ID
   */
  private getPlayer(sessionId: string): IPlayer | undefined {
    if (!this.engine) return undefined;

    const playerManager = this.engine.getPlayerManager();
    if (!playerManager) return undefined;

    return playerManager.getPlayerBySessionId(sessionId);
  }

  /**
   * Talk command - start or continue dialogue with an NPC
   */
  async talk(sessionId: string, args: string[], raw: string): Promise<string | void> {
    if (args.length === 0) {
      return ColorScheme.error('Talk to whom? Usage: talk <npc name>');
    }

    const npcName = args.join(' ');

    // Get player and NPC from engine
    const engine = this.getEngine();
    if (!engine) {
      return ColorScheme.error('Dialogue system not available.');
    }

    const player = this.getPlayer(sessionId);
    if (!player) {
      return ColorScheme.error('Player not found.');
    }

    // Find NPC in current room
    const currentRoomId = player.currentRoomId;
    const npc = this.findNPCInRoom(engine, currentRoomId, npcName);

    if (!npc) {
      return ColorScheme.error(`You don't see ${npcName} here.`);
    }

    // Check if NPC has dialogue provider
    if (!npc.dialogueProvider) {
      return ColorScheme.info(`${npc.name} doesn't seem interested in talking.`);
    }

    try {
      // Start conversation
      const response = await this.dialogueManager.startConversation(player, npc.id, npc.dialogueProvider);

      // Format and return response
      return this.formatDialogueResponse(response);
    } catch (error) {
      return ColorScheme.error(`Failed to start conversation: ${error.message}`);
    }
  }

  /**
   * Converse command - more formal dialogue initiation
   */
  async converse(sessionId: string, args: string[], raw: string): Promise<string | void> {
    if (args.length === 0) {
      return ColorScheme.error('Converse with whom? Usage: converse <npc name>');
    }

    const npcName = args.join(' ');

    // Get player and NPC from engine
    const engine = this.getEngine();
    if (!engine) {
      return ColorScheme.error('Dialogue system not available.');
    }

    const player = this.getPlayer(sessionId);
    if (!player) {
      return ColorScheme.error('Player not found.');
    }

    // Find NPC in current room
    const currentRoomId = player.currentRoomId;
    const npc = this.findNPCInRoom(engine, currentRoomId, npcName);

    if (!npc) {
      return ColorScheme.error(`You don't see ${npcName} here.`);
    }

    // Check if NPC has dialogue provider
    if (!npc.dialogueProvider) {
      return ColorScheme.info(`${npc.name} doesn't seem interested in conversing formally.`);
    }

    try {
      // Start conversation
      const response = await this.dialogueManager.startConversation(player, npc.id, npc.dialogueProvider);

      // Format and return response
      return this.formatDialogueResponse(response);
    } catch (error) {
      return ColorScheme.error(`Failed to start conversation: ${error.message}`);
    }
  }

  /**
   * Respond command - continue existing dialogue
   */
  async respond(sessionId: string, args: string[], raw: string): Promise<string | void> {
    if (args.length === 0) {
      return ColorScheme.error('Respond with what? Usage: respond <choice number or text>');
    }

    const player = this.getPlayer(sessionId);
    if (!player) {
      return ColorScheme.error('Player not found.');
    }

    // Get player's active conversations
    const conversations = this.dialogueManager.getPlayerConversations(player.id);
    if (conversations.length === 0) {
      return ColorScheme.error('You have no active conversations.');
    }

    // For now, use the first active conversation
    // TODO: Allow specifying which conversation to continue
    const conversation = conversations[0];
    const playerInput = args.join(' ');

    try {
      // Continue conversation
      const response = await this.dialogueManager.continueConversation(
        player,
        conversation.npcId,
        playerInput,
        conversation.conversationId
      );

      // Format and return response
      return this.formatDialogueResponse(response);
    } catch (error) {
      return ColorScheme.error(`Failed to continue conversation: ${error.message}`);
    }
  }

  /**
   * Dialogue command - general dialogue interaction
   */
  async dialogue(sessionId: string, args: string[], raw: string): Promise<string | void> {
    if (args.length < 2) {
      return ColorScheme.error('Usage: dialogue <action> <target> [input]');
    }

    const action = args[0].toLowerCase();
    const target = args.slice(1).join(' ');

    switch (action) {
      case 'start':
      case 'begin':
        return this.talk(sessionId, [target], raw);

      case 'continue':
      case 'reply':
        return this.respond(sessionId, [target], raw);

      case 'end':
      case 'stop':
        return this.endDialogue(sessionId, [target], raw);

      case 'status':
        return this.getDialogueStatus(sessionId, args.slice(1), raw);

      default:
        return ColorScheme.error(`Unknown dialogue action: ${action}. Available actions: start, continue, end, status`);
    }
  }

  /**
   * End dialogue command
   */
  async endDialogue(sessionId: string, args: string[], raw: string): Promise<string | void> {
    // TODO: Get player's current conversation and end it
    return ColorScheme.info('No active dialogue to end.');
  }

  /**
   * Get dialogue status command
   */
  async getDialogueStatus(sessionId: string, args: string[], raw: string): Promise<string | void> {
    // TODO: Get player's active conversations
    return ColorScheme.info('No active dialogues.');
  }

  /**
   * Format dialogue response for display
   */
  private formatDialogueResponse(response: IDialogueResponse): string {
    let output = '';

    // Add NPC message
    output += ColorScheme.system(`[Dialogue] ${response.message}\n\n`);

    // Add choices if available
    if (response.choices && response.choices.length > 0) {
      output += ColorScheme.info('Choices:\n');
      response.choices.forEach((choice, index) => {
        const choiceNumber = index + 1;
        output += `${ColorScheme.success(choiceNumber.toString())}. ${choice.text}\n`;
      });
      output += '\n';
      output += ColorScheme.info('Type "respond <number>" or "respond <text>" to choose.\n');
    }

    // Add conversation ID for debugging
    output += ColorScheme.system(`[Conversation: ${response.conversationId}]`);

    if (response.isComplete) {
      output += ColorScheme.info('\n\n[This conversation has ended]');
    }

    return output;
  }

  /**
   * Create command handler objects for the command parser
   */
  getCommandHandlers() {
    return {
      talk: {
        command: 'talk',
        aliases: ['t'],
        description: 'Talk to an NPC to start a conversation',
        usage: 'talk <npc name>',
        handler: this.talk.bind(this)
      },

      converse: {
        command: 'converse',
        aliases: ['con', 'c'],
        description: 'Converse formally with an NPC',
        usage: 'converse <npc name>',
        handler: this.converse.bind(this)
      },

      respond: {
        command: 'respond',
        aliases: ['reply', 'r'],
        description: 'Respond to an active dialogue',
        usage: 'respond <choice number or text>',
        handler: this.respond.bind(this)
      },

      dialogue: {
        command: 'dialogue',
        aliases: ['dia'],
        description: 'General dialogue commands',
        usage: 'dialogue <start|end|continue|status> [target]',
        handler: this.dialogue.bind(this)
      }
    };
  }
}