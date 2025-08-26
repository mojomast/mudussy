"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandParser = void 0;
const event_1 = require("../../core/event");
const event_2 = require("../../core/event");
const ansi_1 = require("./ansi");
const types_1 = require("./types");
class CommandParser {
    constructor(eventSystem, sessionManager, playerManager, logger, worldManager) {
        this.handlers = new Map();
        this.movementCommandNames = new Set();
        this.hiddenCommandNames = new Set();
        this.eventSystem = eventSystem;
        this.sessionManager = sessionManager;
        this.playerManager = playerManager;
        this.logger = logger || console;
        this.worldManager = worldManager;
        this.registerDefaultCommands();
    }
    registerCommand(handler) {
        this.handlers.set(handler.command.toLowerCase(), handler);
        if (handler.aliases) {
            for (const alias of handler.aliases) {
                this.handlers.set(alias.toLowerCase(), handler);
            }
        }
        this.logger.log(`Registered command: ${handler.command} (${handler.aliases?.join(', ') || 'no aliases'})`);
    }
    unregisterCommand(command) {
        const handler = this.handlers.get(command.toLowerCase());
        if (!handler)
            return false;
        this.handlers.delete(command.toLowerCase());
        if (handler.aliases) {
            for (const alias of handler.aliases) {
                this.handlers.delete(alias.toLowerCase());
            }
        }
        this.logger.log(`Unregistered command: ${command}`);
        return true;
    }
    async parseCommand(sessionId, input) {
        try {
            const command = this.parseInput(input);
            if (!command)
                return;
            this.eventSystem.emit(new event_1.GameEvent(types_1.NetworkEventTypes.COMMAND_RECEIVED, sessionId, undefined, {
                sessionId,
                command: command.command,
                args: command.args,
                raw: command.raw,
                timestamp: new Date()
            }));
            const handler = this.handlers.get(command.command.toLowerCase());
            if (!handler) {
                return ansi_1.ColorScheme.error(`Unknown command: ${command.command}. Type 'help' for available commands.`);
            }
            this.logger.log(`Executing command: ${command.command} for session ${sessionId}`);
            return await handler.handler(sessionId, command.args, command.raw);
        }
        catch (error) {
            this.logger.error(`Error parsing command '${input}' for session ${sessionId}:`, error);
            return ansi_1.ColorScheme.error('An error occurred while processing your command.');
        }
    }
    parseInput(input) {
        const trimmed = input.trim();
        if (!trimmed)
            return null;
        if (trimmed.length === 0)
            return null;
        const args = this.parseArguments(trimmed);
        if (args.length === 0)
            return null;
        const command = args.shift() || '';
        return {
            sessionId: '',
            command,
            args,
            raw: trimmed,
            timestamp: new Date()
        };
    }
    parseArguments(input) {
        const args = [];
        let current = '';
        let inQuotes = false;
        let quoteChar = '';
        for (let i = 0; i < input.length; i++) {
            const char = input[i];
            if (!inQuotes && (char === '"' || char === "'")) {
                inQuotes = true;
                quoteChar = char;
            }
            else if (inQuotes && char === quoteChar) {
                inQuotes = false;
                quoteChar = '';
            }
            else if (!inQuotes && char === ' ') {
                if (current.length > 0) {
                    args.push(current);
                    current = '';
                }
            }
            else {
                current += char;
            }
        }
        if (current.length > 0) {
            args.push(current);
        }
        return args;
    }
    getRegisteredCommands() {
        return Array.from(new Set(this.handlers.values()))
            .map(h => h.command)
            .filter(cmd => !this.movementCommandNames.has(cmd) && !this.hiddenCommandNames.has(cmd));
    }
    getCommandHandler(command) {
        return this.handlers.get(command.toLowerCase());
    }
    getCommandHelp(command) {
        const handler = this.getCommandHandler(command);
        if (!handler)
            return null;
        let help = `${ansi_1.ColorScheme.info('Command:')} ${handler.command}\n`;
        help += `${ansi_1.ColorScheme.info('Description:')} ${handler.description}\n`;
        if (handler.usage) {
            help += `${ansi_1.ColorScheme.info('Usage:')} ${handler.usage}\n`;
        }
        if (handler.aliases && handler.aliases.length > 0) {
            help += `${ansi_1.ColorScheme.info('Aliases:')} ${handler.aliases.join(', ')}\n`;
        }
        return help;
    }
    getAllCommandsHelp() {
        let help = ansi_1.ColorScheme.system('Available Commands:\n\n');
        const commands = Array.from(new Set(this.handlers.values()))
            .sort((a, b) => a.command.localeCompare(b.command));
        for (const handler of commands) {
            help += `${ansi_1.Ansi.brightCyan(handler.command.padEnd(12))} - ${handler.description}\n`;
        }
        help += '\n' + ansi_1.ColorScheme.info('Type "help <command>" for detailed information about a specific command.');
        return help;
    }
    registerDefaultCommands() {
        this.registerCommand({
            command: 'help',
            aliases: ['h', '?'],
            description: 'Show help information',
            usage: 'help [command]',
            handler: async (sessionId, args) => {
                if (args.length === 0) {
                    return this.getAllCommandsHelp();
                }
                const command = args[0];
                const helpText = this.getCommandHelp(command);
                if (!helpText) {
                    return ansi_1.ColorScheme.error(`Unknown command: ${command}`);
                }
                return helpText;
            }
        });
        this.registerCommand({
            command: 'quit',
            aliases: ['exit', 'logout', 'q'],
            description: 'Disconnect from the game',
            handler: async (sessionId, args) => {
                this.eventSystem.emit(new event_1.GameEvent(event_2.EventTypes.PLAYER_LEFT, sessionId, undefined, { reason: 'User quit' }));
                return 'Goodbye!';
            }
        });
        this.registerCommand({
            command: 'who',
            aliases: ['users', 'online'],
            description: 'Show online players',
            handler: async (sessionId, args) => {
                if (!this.sessionManager) {
                    return ansi_1.ColorScheme.error('Session manager not available');
                }
                const allSessions = this.sessionManager.getAllSessions();
                const connectedSessions = allSessions.filter(session => session.state === 'connected' && session.authenticated && session.username);
                if (connectedSessions.length === 0) {
                    return ansi_1.ColorScheme.info('No players are currently online.');
                }
                let output = ansi_1.ColorScheme.system('┌─ Online Players ──────────────────────────────┐\n');
                output += ansi_1.ColorScheme.system('│                                                │\n');
                for (const session of connectedSessions) {
                    const username = session.username.padEnd(20);
                    const idleTime = Math.floor((Date.now() - session.lastActivity.getTime()) / 1000 / 60);
                    const idleStr = idleTime === 0 ? 'active' : `${idleTime}m idle`;
                    const line = `│ ${ansi_1.Ansi.brightCyan(username)} ${ansi_1.Ansi.dim('[')}${idleStr}${ansi_1.Ansi.dim(']')} ${' '.repeat(20)} │\n`;
                    output += line;
                }
                output += ansi_1.ColorScheme.system('│                                                │\n');
                output += ansi_1.ColorScheme.system(`└─ Total: ${connectedSessions.length} player${connectedSessions.length === 1 ? '' : 's'} online ─┘\n`);
                return output;
            }
        });
        this.registerCommand({
            command: 'say',
            aliases: ['s'],
            description: 'Say something to other players in the same room',
            usage: 'say <message>',
            handler: async (sessionId, args, raw) => {
                if (args.length === 0) {
                    return ansi_1.ColorScheme.error('What do you want to say?');
                }
                const message = args.join(' ');
                this.eventSystem.emit(new event_1.GameEvent(event_2.EventTypes.PLAYER_MESSAGE, sessionId, undefined, {
                    message,
                    type: 'say',
                    timestamp: new Date()
                }));
                return ansi_1.ColorScheme.success(`You say: ${message}`);
            }
        });
        this.registerCommand({
            command: 'look',
            aliases: ['l'],
            description: 'Look around your current location',
            handler: async (sessionId, args) => {
                if (!this.playerManager || !this.worldManager) {
                    return ansi_1.ColorScheme.info('You look around, but the world fades in and out.');
                }
                const player = this.playerManager.getPlayerBySessionId(sessionId);
                if (!player) {
                    return ansi_1.ColorScheme.error('You are not present in the world.');
                }
                const desc = this.worldManager.getRoomDescription(player.currentRoomId);
                return desc;
            }
        });
        this.registerCommand({
            command: 'stats',
            aliases: ['status'],
            description: 'Show your character stats',
            handler: async (sessionId, args) => {
                return ansi_1.ColorScheme.info('Character Stats:\nLevel: 1\nHP: 100/100\nMP: 50/50\nExperience: 0');
            }
        });
        this.registerCommand({
            command: 'clear',
            aliases: ['cls', 'c'],
            description: 'Clear the screen',
            handler: async (sessionId, args) => {
                return '\x1b[2J\x1b[H';
            }
        });
        this.registerCommand({
            command: 'whisper',
            aliases: ['w', 'tell', 'msg', 'pm'],
            description: 'Send a private message to another player',
            usage: 'whisper <username> <message>',
            handler: async (sessionId, args, raw) => {
                if (args.length < 2) {
                    return ansi_1.ColorScheme.error('Usage: whisper <username> <message>');
                }
                if (!this.playerManager) {
                    return ansi_1.ColorScheme.error('Player manager not available');
                }
                if (!this.sessionManager) {
                    return ansi_1.ColorScheme.error('Session manager not available');
                }
                const sender = this.playerManager.getPlayerBySessionId(sessionId);
                if (!sender) {
                    return ansi_1.ColorScheme.error('You must be logged in to send private messages');
                }
                const targetUsername = args[0];
                const message = args.slice(1).join(' ');
                if (targetUsername === sender.username) {
                    return ansi_1.ColorScheme.error('You cannot whisper to yourself');
                }
                const targetPlayer = this.playerManager.getPlayerByUsername(targetUsername);
                if (!targetPlayer) {
                    return ansi_1.ColorScheme.error(`Player '${targetUsername}' not found or not online`);
                }
                const targetSession = this.sessionManager.getSession(targetPlayer.sessionId);
                if (!targetSession || targetSession.state !== 'connected' || !targetSession.authenticated) {
                    return ansi_1.ColorScheme.error(`Player '${targetUsername}' is not online`);
                }
                const targetMessage = ansi_1.ColorScheme.info(`[${sender.username} whispers]: ${message}`);
                const success = this.sessionManager.sendToSession(targetPlayer.sessionId, targetMessage, 'user');
                if (!success) {
                    return ansi_1.ColorScheme.error('Failed to send message');
                }
                const senderMessage = ansi_1.ColorScheme.success(`You whisper to ${targetUsername}: ${message}`);
                return senderMessage;
            }
        });
        this.registerCommand({
            command: 'chat',
            aliases: ['global', 'g'],
            description: 'Send a message to all online players',
            usage: 'chat <message>',
            handler: async (sessionId, args, raw) => {
                if (args.length === 0) {
                    return ansi_1.ColorScheme.error('What do you want to say globally?');
                }
                if (!this.playerManager) {
                    return ansi_1.ColorScheme.error('Player manager not available');
                }
                const player = this.playerManager.getPlayerBySessionId(sessionId);
                if (!player) {
                    return ansi_1.ColorScheme.error('You must be logged in to use global chat');
                }
                const message = args.join(' ');
                this.eventSystem.emit(new event_1.GameEvent(event_2.EventTypes.PLAYER_MESSAGE, sessionId, undefined, {
                    message,
                    type: 'global',
                    timestamp: new Date()
                }));
                return ansi_1.ColorScheme.success(`You say globally: ${message}`);
            }
        });
        const directions = ['north', 'south', 'east', 'west', 'up', 'down', 'northeast', 'northwest', 'southeast', 'southwest'];
        const aliases = {
            'north': ['n'],
            'south': ['s'],
            'east': ['e'],
            'west': [],
            'up': ['u'],
            'down': ['d'],
            'northeast': ['ne'],
            'northwest': ['nw'],
            'southeast': ['se'],
            'southwest': ['sw']
        };
        for (const direction of directions) {
            this.movementCommandNames.add(direction);
            this.registerCommand({
                command: direction,
                aliases: aliases[direction] || [],
                description: `Move ${direction}`,
                handler: async (sessionId, args) => {
                    if (!this.playerManager) {
                        return ansi_1.ColorScheme.error('Player manager not available');
                    }
                    const player = this.playerManager.getPlayerBySessionId(sessionId);
                    if (!player) {
                        return ansi_1.ColorScheme.error('You must be logged in to move');
                    }
                    if (!this.eventSystem) {
                        return ansi_1.ColorScheme.error('Event system not available');
                    }
                    this.eventSystem.emit(new event_1.GameEvent('player.move', sessionId, undefined, {
                        direction,
                        fromRoomId: player.currentRoomId,
                        timestamp: new Date()
                    }));
                    return ansi_1.ColorScheme.success(`You attempt to move ${direction}...`);
                }
            });
        }
        this.registerCommand({
            command: 'go',
            aliases: ['move'],
            description: 'Move in a direction',
            usage: 'go <direction>',
            handler: async (sessionId, args) => {
                if (args.length === 0) {
                    return ansi_1.ColorScheme.error('Which direction do you want to go?');
                }
                if (!this.playerManager) {
                    return ansi_1.ColorScheme.error('Player manager not available');
                }
                const player = this.playerManager.getPlayerBySessionId(sessionId);
                if (!player) {
                    return ansi_1.ColorScheme.error('You must be logged in to move');
                }
                const direction = args[0].toLowerCase();
                this.eventSystem.emit(new event_1.GameEvent('player.move', sessionId, undefined, {
                    direction,
                    fromRoomId: player.currentRoomId,
                    timestamp: new Date()
                }));
                return ansi_1.ColorScheme.success(`You attempt to move ${direction}...`);
            }
        });
        this.movementCommandNames.add('go');
        this.movementCommandNames.add('move');
        this.registerCommand({
            command: 'version',
            aliases: ['ver', 'v'],
            description: 'Show game version information',
            handler: async (sessionId, args) => {
                return ansi_1.ColorScheme.system('MUD Engine v0.1.0\nBuilt with TypeScript and Node.js');
            }
        });
        this.registerCommand({
            command: 'admin',
            description: 'Administrative commands',
            usage: 'admin <subcommand> ...',
            handler: async (sessionId, args) => {
                if (args.length === 0) {
                    return ansi_1.ColorScheme.error('Usage: admin <enable|create|set> ...');
                }
                const sub = args.shift().toLowerCase();
                if (sub === 'enable') {
                    return ansi_1.ColorScheme.success('Admin mode enabled');
                }
                if (sub === 'create') {
                    const target = args.shift()?.toLowerCase();
                    if (target !== 'room') {
                        return ansi_1.ColorScheme.error('Usage: admin create room <roomId> ["Name"] ["Description"]');
                    }
                    const roomId = args.shift();
                    if (!roomId) {
                        return ansi_1.ColorScheme.error('Usage: admin create room <roomId> ["Name"] ["Description"]');
                    }
                    const name = args.shift() ?? roomId;
                    const description = args.shift() ?? '';
                    this.eventSystem.emit(new event_1.GameEvent('admin.create.room', sessionId, undefined, { roomId, name, description }));
                    return ansi_1.ColorScheme.success(`Room created successfully: ${roomId}`);
                }
                if (sub === 'set') {
                    const target = args.shift()?.toLowerCase();
                    if (target !== 'description') {
                        return ansi_1.ColorScheme.error('Usage: admin set description <roomId> "Description"');
                    }
                    const roomId = args.shift();
                    const description = args.shift();
                    if (!roomId || description === undefined) {
                        return ansi_1.ColorScheme.error('Usage: admin set description <roomId> "Description"');
                    }
                    this.eventSystem.emit(new event_1.GameEvent('admin.set.description', sessionId, undefined, { roomId, description }));
                    return ansi_1.ColorScheme.success(`Room description updated: ${roomId}`);
                }
                return ansi_1.ColorScheme.error('Unknown admin subcommand');
            }
        });
        this.hiddenCommandNames.add('admin');
    }
}
exports.CommandParser = CommandParser;
//# sourceMappingURL=command-parser.js.map