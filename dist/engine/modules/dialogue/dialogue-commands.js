"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DialogueCommandHandlers = void 0;
const ansi_1 = require("../networking/ansi");
class DialogueCommandHandlers {
    constructor(dialogueManager, engine) {
        this.dialogueManager = dialogueManager;
        this.engine = engine;
    }
    getEngine() {
        return this.engine;
    }
    findNPCInRoom(engine, roomId, npcName) {
        const worldManager = engine.getWorldManager();
        if (!worldManager)
            return undefined;
        const npcsInRoom = worldManager.getNPCsInRoom(roomId);
        return npcsInRoom.find(npc => npc.name.toLowerCase().includes(npcName.toLowerCase()) ||
            npc.shortDescription?.toLowerCase().includes(npcName.toLowerCase()));
    }
    getPlayer(sessionId) {
        if (!this.engine)
            return undefined;
        const playerManager = this.engine.getPlayerManager();
        if (!playerManager)
            return undefined;
        return playerManager.getPlayerBySessionId(sessionId);
    }
    async talk(sessionId, args, raw) {
        if (args.length === 0) {
            return ansi_1.ColorScheme.error('Talk to whom? Usage: talk <npc name>');
        }
        const npcName = args.join(' ');
        const engine = this.getEngine();
        if (!engine) {
            return ansi_1.ColorScheme.error('Dialogue system not available.');
        }
        const player = this.getPlayer(sessionId);
        if (!player) {
            return ansi_1.ColorScheme.error('Player not found.');
        }
        const currentRoomId = player.currentRoomId;
        const npc = this.findNPCInRoom(engine, currentRoomId, npcName);
        if (!npc) {
            return ansi_1.ColorScheme.error(`You don't see ${npcName} here.`);
        }
        if (!npc.dialogueProvider) {
            return ansi_1.ColorScheme.info(`${npc.name} doesn't seem interested in talking.`);
        }
        try {
            const response = await this.dialogueManager.startConversation(player, npc.id, npc.dialogueProvider);
            return this.formatDialogueResponse(response);
        }
        catch (error) {
            return ansi_1.ColorScheme.error(`Failed to start conversation: ${error.message}`);
        }
    }
    async converse(sessionId, args, raw) {
        if (args.length === 0) {
            return ansi_1.ColorScheme.error('Converse with whom? Usage: converse <npc name>');
        }
        const npcName = args.join(' ');
        const engine = this.getEngine();
        if (!engine) {
            return ansi_1.ColorScheme.error('Dialogue system not available.');
        }
        const player = this.getPlayer(sessionId);
        if (!player) {
            return ansi_1.ColorScheme.error('Player not found.');
        }
        const currentRoomId = player.currentRoomId;
        const npc = this.findNPCInRoom(engine, currentRoomId, npcName);
        if (!npc) {
            return ansi_1.ColorScheme.error(`You don't see ${npcName} here.`);
        }
        if (!npc.dialogueProvider) {
            return ansi_1.ColorScheme.info(`${npc.name} doesn't seem interested in conversing formally.`);
        }
        try {
            const response = await this.dialogueManager.startConversation(player, npc.id, npc.dialogueProvider);
            return this.formatDialogueResponse(response);
        }
        catch (error) {
            return ansi_1.ColorScheme.error(`Failed to start conversation: ${error.message}`);
        }
    }
    async respond(sessionId, args, raw) {
        if (args.length === 0) {
            return ansi_1.ColorScheme.error('Respond with what? Usage: respond <choice number or text>');
        }
        const player = this.getPlayer(sessionId);
        if (!player) {
            return ansi_1.ColorScheme.error('Player not found.');
        }
        const conversations = this.dialogueManager.getPlayerConversations(player.id);
        if (conversations.length === 0) {
            return ansi_1.ColorScheme.error('You have no active conversations.');
        }
        const conversation = conversations[0];
        const playerInput = args.join(' ');
        try {
            const response = await this.dialogueManager.continueConversation(player, conversation.npcId, playerInput, conversation.conversationId);
            return this.formatDialogueResponse(response);
        }
        catch (error) {
            return ansi_1.ColorScheme.error(`Failed to continue conversation: ${error.message}`);
        }
    }
    async dialogue(sessionId, args, raw) {
        if (args.length < 2) {
            return ansi_1.ColorScheme.error('Usage: dialogue <action> <target> [input]');
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
                return ansi_1.ColorScheme.error(`Unknown dialogue action: ${action}. Available actions: start, continue, end, status`);
        }
    }
    async endDialogue(sessionId, args, raw) {
        return ansi_1.ColorScheme.info('No active dialogue to end.');
    }
    async getDialogueStatus(sessionId, args, raw) {
        return ansi_1.ColorScheme.info('No active dialogues.');
    }
    formatDialogueResponse(response) {
        let output = '';
        output += ansi_1.ColorScheme.system(`[Dialogue] ${response.message}\n\n`);
        if (response.choices && response.choices.length > 0) {
            output += ansi_1.ColorScheme.info('Choices:\n');
            response.choices.forEach((choice, index) => {
                const choiceNumber = index + 1;
                output += `${ansi_1.ColorScheme.success(choiceNumber.toString())}. ${choice.text}\n`;
            });
            output += '\n';
            output += ansi_1.ColorScheme.info('Type "respond <number>" or "respond <text>" to choose.\n');
        }
        output += ansi_1.ColorScheme.system(`[Conversation: ${response.conversationId}]`);
        if (response.isComplete) {
            output += ansi_1.ColorScheme.info('\n\n[This conversation has ended]');
        }
        return output;
    }
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
exports.DialogueCommandHandlers = DialogueCommandHandlers;
//# sourceMappingURL=dialogue-commands.js.map