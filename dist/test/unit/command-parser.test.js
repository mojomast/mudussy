"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const command_parser_1 = require("../../engine/modules/networking/command-parser");
const event_1 = require("../../engine/core/event");
const ansi_1 = require("../../engine/modules/networking/ansi");
const types_1 = require("../../engine/modules/networking/types");
const player_1 = require("../../engine/modules/persistence/player");
(0, vitest_1.describe)('Command Parser', () => {
    let commandParser;
    let mockEventSystem;
    let mockSessionManager;
    let mockPlayerManager;
    let mockLogger;
    (0, vitest_1.beforeEach)(() => {
        mockEventSystem = new event_1.EventSystem();
        mockSessionManager = {
            getAllSessions: vitest_1.vi.fn(),
            getSessionCount: vitest_1.vi.fn(),
            getSession: vitest_1.vi.fn(),
            sendToSession: vitest_1.vi.fn(),
        };
        mockPlayerManager = {
            getPlayerBySessionId: vitest_1.vi.fn(),
            getPlayerByUsername: vitest_1.vi.fn(),
            getAllActivePlayers: vitest_1.vi.fn(),
        };
        mockLogger = {
            log: vitest_1.vi.fn(),
            error: vitest_1.vi.fn(),
            warn: vitest_1.vi.fn(),
            info: vitest_1.vi.fn(),
            debug: vitest_1.vi.fn(),
        };
        commandParser = new command_parser_1.CommandParser(mockEventSystem, mockSessionManager, mockPlayerManager, mockLogger);
    });
    (0, vitest_1.describe)('Command Registration', () => {
        (0, vitest_1.it)('should register commands correctly', () => {
            const handler = {
                command: 'test',
                description: 'Test command',
                handler: vitest_1.vi.fn().mockResolvedValue('Test executed'),
            };
            commandParser.registerCommand(handler);
            (0, vitest_1.expect)(mockLogger.log).toHaveBeenCalledWith('Registered command: test (no aliases)');
        });
        (0, vitest_1.it)('should register commands with aliases', () => {
            const handler = {
                command: 'test',
                aliases: ['t', 'testing'],
                description: 'Test command',
                handler: vitest_1.vi.fn().mockResolvedValue('Test executed'),
            };
            commandParser.registerCommand(handler);
            (0, vitest_1.expect)(mockLogger.log).toHaveBeenCalledWith('Registered command: test (t, testing)');
        });
        (0, vitest_1.it)('should handle duplicate aliases', () => {
            const handler1 = {
                command: 'test1',
                aliases: ['t'],
                description: 'Test command 1',
                handler: vitest_1.vi.fn(),
            };
            const handler2 = {
                command: 'test2',
                aliases: ['t'],
                description: 'Test command 2',
                handler: vitest_1.vi.fn(),
            };
            commandParser.registerCommand(handler1);
            commandParser.registerCommand(handler2);
            const result = commandParser.getCommandHandler('t');
            (0, vitest_1.expect)(result).toBe(handler2);
        });
        (0, vitest_1.it)('should unregister commands', () => {
            const handler = {
                command: 'test',
                aliases: ['t'],
                description: 'Test command',
                handler: vitest_1.vi.fn(),
            };
            commandParser.registerCommand(handler);
            (0, vitest_1.expect)(commandParser.getCommandHandler('test')).toBe(handler);
            const result = commandParser.unregisterCommand('test');
            (0, vitest_1.expect)(result).toBe(true);
            (0, vitest_1.expect)(commandParser.getCommandHandler('test')).toBeUndefined();
            (0, vitest_1.expect)(commandParser.getCommandHandler('t')).toBeUndefined();
            (0, vitest_1.expect)(mockLogger.log).toHaveBeenCalledWith('Unregistered command: test');
        });
        (0, vitest_1.it)('should handle unregistering non-existent commands', () => {
            const result = commandParser.unregisterCommand('nonexistent');
            (0, vitest_1.expect)(result).toBe(false);
        });
    });
    (0, vitest_1.describe)('Command Parsing', () => {
        (0, vitest_1.it)('should parse simple commands', async () => {
            const handler = {
                command: 'test',
                description: 'Test command',
                handler: vitest_1.vi.fn().mockResolvedValue('Test executed'),
            };
            commandParser.registerCommand(handler);
            const result = await commandParser.parseCommand('session1', 'test');
            (0, vitest_1.expect)(result).toBe('Test executed');
            (0, vitest_1.expect)(handler.handler).toHaveBeenCalledWith('session1', [], 'test');
        });
        (0, vitest_1.it)('should parse commands with arguments', async () => {
            const handler = {
                command: 'say',
                description: 'Say something',
                handler: vitest_1.vi.fn(),
            };
            commandParser.registerCommand(handler);
            await commandParser.parseCommand('session1', 'say hello world');
            (0, vitest_1.expect)(handler.handler).toHaveBeenCalledWith('session1', ['hello', 'world'], 'say hello world');
        });
        (0, vitest_1.it)('should handle quoted arguments', async () => {
            const handler = {
                command: 'say',
                description: 'Say something',
                handler: vitest_1.vi.fn(),
            };
            commandParser.registerCommand(handler);
            await commandParser.parseCommand('session1', 'say "hello world"');
            (0, vitest_1.expect)(handler.handler).toHaveBeenCalledWith('session1', ['hello world'], 'say "hello world"');
        });
        (0, vitest_1.it)('should handle mixed quoted and unquoted arguments', async () => {
            const handler = {
                command: 'command',
                description: 'Test command',
                handler: vitest_1.vi.fn(),
            };
            commandParser.registerCommand(handler);
            await commandParser.parseCommand('session1', 'command arg1 "arg 2" arg3');
            (0, vitest_1.expect)(handler.handler).toHaveBeenCalledWith('session1', ['arg1', 'arg 2', 'arg3'], 'command arg1 "arg 2" arg3');
        });
        (0, vitest_1.it)('should handle empty input', async () => {
            const result = await commandParser.parseCommand('session1', '');
            (0, vitest_1.expect)(result).toBeUndefined();
        });
        (0, vitest_1.it)('should handle whitespace-only input', async () => {
            const result = await commandParser.parseCommand('session1', '   ');
            (0, vitest_1.expect)(result).toBeUndefined();
        });
        (0, vitest_1.it)('should handle unknown commands', async () => {
            const result = await commandParser.parseCommand('session1', 'unknown');
            (0, vitest_1.expect)(result).toBe(ansi_1.ColorScheme.error('Unknown command: unknown. Type \'help\' for available commands.'));
        });
        (0, vitest_1.it)('should handle commands with different cases', async () => {
            const handler = {
                command: 'test',
                description: 'Test command',
                handler: vitest_1.vi.fn().mockResolvedValue('Test executed'),
            };
            commandParser.registerCommand(handler);
            const result1 = await commandParser.parseCommand('session1', 'TEST');
            const result2 = await commandParser.parseCommand('session1', 'Test');
            const result3 = await commandParser.parseCommand('session1', 'test');
            (0, vitest_1.expect)(result1).toBe('Test executed');
            (0, vitest_1.expect)(result2).toBe('Test executed');
            (0, vitest_1.expect)(result3).toBe('Test executed');
        });
    });
    (0, vitest_1.describe)('Event Emission', () => {
        (0, vitest_1.it)('should emit command received event', async () => {
            const handler = {
                command: 'test',
                description: 'Test command',
                handler: vitest_1.vi.fn().mockResolvedValue('Test executed'),
            };
            commandParser.registerCommand(handler);
            const emitSpy = vitest_1.vi.spyOn(mockEventSystem, 'emit');
            await commandParser.parseCommand('session1', 'test arg1 arg2');
            (0, vitest_1.expect)(emitSpy).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                eventType: 'network.command.received',
                source: 'session1',
                data: vitest_1.expect.objectContaining({
                    sessionId: 'session1',
                    command: 'test',
                    args: ['arg1', 'arg2'],
                    raw: 'test arg1 arg2',
                    timestamp: vitest_1.expect.any(Date),
                }),
            }));
        });
    });
    (0, vitest_1.describe)('Command Information', () => {
        (0, vitest_1.it)('should get registered commands', () => {
            const handler1 = {
                command: 'test1',
                description: 'Test command 1',
                handler: vitest_1.vi.fn(),
            };
            const handler2 = {
                command: 'test2',
                description: 'Test command 2',
                handler: vitest_1.vi.fn(),
            };
            commandParser.registerCommand(handler1);
            commandParser.registerCommand(handler2);
            const commands = commandParser.getRegisteredCommands();
            (0, vitest_1.expect)(commands).toContain('test1');
            (0, vitest_1.expect)(commands).toContain('test2');
            (0, vitest_1.expect)(commands).toHaveLength(12);
        });
        (0, vitest_1.it)('should get command handler', () => {
            const handler = {
                command: 'test',
                description: 'Test command',
                handler: vitest_1.vi.fn(),
            };
            commandParser.registerCommand(handler);
            (0, vitest_1.expect)(commandParser.getCommandHandler('test')).toBe(handler);
            (0, vitest_1.expect)(commandParser.getCommandHandler('nonexistent')).toBeUndefined();
        });
        (0, vitest_1.it)('should get command help', () => {
            const handler = {
                command: 'test',
                aliases: ['t'],
                description: 'Test command',
                usage: 'test [arg]',
                handler: vitest_1.vi.fn(),
            };
            commandParser.registerCommand(handler);
            const help = commandParser.getCommandHelp('test');
            (0, vitest_1.expect)(help).toContain('test');
            (0, vitest_1.expect)(help).toContain('Test command');
            (0, vitest_1.expect)(help).toContain('test [arg]');
            (0, vitest_1.expect)(help).toContain('t');
        });
        (0, vitest_1.it)('should return null for unknown command help', () => {
            const help = commandParser.getCommandHelp('nonexistent');
            (0, vitest_1.expect)(help).toBeNull();
        });
    });
    (0, vitest_1.describe)('Default Commands', () => {
        (0, vitest_1.it)('should have help command registered', () => {
            const handler = commandParser.getCommandHandler('help');
            (0, vitest_1.expect)(handler).toBeDefined();
            (0, vitest_1.expect)(handler.description).toBe('Show help information');
        });
        (0, vitest_1.it)('should have quit command registered', () => {
            const handler = commandParser.getCommandHandler('quit');
            (0, vitest_1.expect)(handler).toBeDefined();
            (0, vitest_1.expect)(handler.description).toBe('Disconnect from the game');
        });
        (0, vitest_1.it)('should have say command registered', () => {
            const handler = commandParser.getCommandHandler('say');
            (0, vitest_1.expect)(handler).toBeDefined();
            (0, vitest_1.expect)(handler.description).toBe('Say something to other players in the same room');
        });
        (0, vitest_1.it)('should have look command registered', () => {
            const handler = commandParser.getCommandHandler('look');
            (0, vitest_1.expect)(handler).toBeDefined();
            (0, vitest_1.expect)(handler.description).toBe('Look around your current location');
        });
        (0, vitest_1.it)('should have stats command registered', () => {
            const handler = commandParser.getCommandHandler('stats');
            (0, vitest_1.expect)(handler).toBeDefined();
            (0, vitest_1.expect)(handler.description).toBe('Show your character stats');
        });
        (0, vitest_1.it)('should have clear command registered', () => {
            const handler = commandParser.getCommandHandler('clear');
            (0, vitest_1.expect)(handler).toBeDefined();
            (0, vitest_1.expect)(handler.description).toBe('Clear the screen');
        });
        (0, vitest_1.it)('should have version command registered', () => {
            const handler = commandParser.getCommandHandler('version');
            (0, vitest_1.expect)(handler).toBeDefined();
            (0, vitest_1.expect)(handler.description).toBe('Show game version information');
        });
        (0, vitest_1.it)('should have who command registered', () => {
            const handler = commandParser.getCommandHandler('who');
            (0, vitest_1.expect)(handler).toBeDefined();
            (0, vitest_1.expect)(handler.description).toBe('Show online players');
        });
        (0, vitest_1.it)('should have who command aliases registered', () => {
            const handler = commandParser.getCommandHandler('users');
            (0, vitest_1.expect)(handler).toBeDefined();
            (0, vitest_1.expect)(handler.command).toBe('who');
            const handler2 = commandParser.getCommandHandler('online');
            (0, vitest_1.expect)(handler2).toBeDefined();
            (0, vitest_1.expect)(handler2.command).toBe('who');
        });
        (0, vitest_1.it)('should have chat command registered', () => {
            const handler = commandParser.getCommandHandler('chat');
            (0, vitest_1.expect)(handler).toBeDefined();
            (0, vitest_1.expect)(handler.description).toBe('Send a message to all online players');
        });
        (0, vitest_1.it)('should have chat command aliases registered', () => {
            const aliases = ['global', 'g'];
            aliases.forEach(alias => {
                const handler = commandParser.getCommandHandler(alias);
                (0, vitest_1.expect)(handler).toBeDefined();
                (0, vitest_1.expect)(handler.command).toBe('chat');
            });
        });
    });
    (0, vitest_1.describe)('Whisper Command', () => {
        (0, vitest_1.beforeEach)(() => {
            mockPlayerManager.getPlayerBySessionId.mockReset();
            mockPlayerManager.getPlayerByUsername.mockReset();
            mockSessionManager.getSession.mockReset();
            mockSessionManager.sendToSession.mockReset();
        });
        (0, vitest_1.it)('should have whisper command registered', () => {
            const handler = commandParser.getCommandHandler('whisper');
            (0, vitest_1.expect)(handler).toBeDefined();
            (0, vitest_1.expect)(handler.description).toBe('Send a private message to another player');
            (0, vitest_1.expect)(handler.usage).toBe('whisper <username> <message>');
        });
        (0, vitest_1.it)('should have whisper command aliases registered', () => {
            const aliases = ['w', 'tell', 'msg', 'pm'];
            aliases.forEach(alias => {
                const handler = commandParser.getCommandHandler(alias);
                (0, vitest_1.expect)(handler).toBeDefined();
                (0, vitest_1.expect)(handler.command).toBe('whisper');
            });
        });
        (0, vitest_1.it)('should handle missing arguments', async () => {
            const result = await commandParser.parseCommand('session1', 'whisper');
            (0, vitest_1.expect)(result).toBe(ansi_1.ColorScheme.error('Usage: whisper <username> <message>'));
        });
        (0, vitest_1.it)('should handle only username without message', async () => {
            const result = await commandParser.parseCommand('session1', 'whisper Alice');
            (0, vitest_1.expect)(result).toBe(ansi_1.ColorScheme.error('Usage: whisper <username> <message>'));
        });
        (0, vitest_1.it)('should handle missing player manager', async () => {
            const parserWithoutPlayerManager = new command_parser_1.CommandParser(mockEventSystem, mockSessionManager, null, mockLogger);
            const result = await parserWithoutPlayerManager.parseCommand('session1', 'whisper Alice hello');
            (0, vitest_1.expect)(result).toBe(ansi_1.ColorScheme.error('Player manager not available'));
        });
        (0, vitest_1.it)('should handle missing session manager', async () => {
            const parserWithoutSessionManager = new command_parser_1.CommandParser(mockEventSystem, null, mockPlayerManager, mockLogger);
            const result = await parserWithoutSessionManager.parseCommand('session1', 'whisper Alice hello');
            (0, vitest_1.expect)(result).toBe(ansi_1.ColorScheme.error('Session manager not available'));
        });
        (0, vitest_1.it)('should handle sender not logged in', async () => {
            mockPlayerManager.getPlayerBySessionId.mockReturnValue(null);
            const result = await commandParser.parseCommand('session1', 'whisper Alice hello world');
            (0, vitest_1.expect)(result).toBe(ansi_1.ColorScheme.error('You must be logged in to send private messages'));
        });
        (0, vitest_1.it)('should prevent whispering to self', async () => {
            const senderPlayer = new player_1.Player('Alice', 'session1', 'room1');
            mockPlayerManager.getPlayerBySessionId.mockReturnValue(senderPlayer);
            const result = await commandParser.parseCommand('session1', 'whisper Alice hello world');
            (0, vitest_1.expect)(result).toBe(ansi_1.ColorScheme.error('You cannot whisper to yourself'));
        });
        (0, vitest_1.it)('should handle target user not found', async () => {
            const senderPlayer = new player_1.Player('Alice', 'session1', 'room1');
            mockPlayerManager.getPlayerBySessionId.mockReturnValue(senderPlayer);
            mockPlayerManager.getPlayerByUsername.mockReturnValue(null);
            const result = await commandParser.parseCommand('session1', 'whisper Bob hello world');
            (0, vitest_1.expect)(result).toBe(ansi_1.ColorScheme.error('Player \'Bob\' not found or not online'));
        });
        (0, vitest_1.it)('should handle target user offline', async () => {
            const senderPlayer = new player_1.Player('Alice', 'session1', 'room1');
            const targetPlayer = new player_1.Player('Bob', 'session2', 'room1');
            mockPlayerManager.getPlayerBySessionId.mockReturnValue(senderPlayer);
            mockPlayerManager.getPlayerByUsername.mockReturnValue(targetPlayer);
            mockSessionManager.getSession.mockReturnValue(null);
            const result = await commandParser.parseCommand('session1', 'whisper Bob hello world');
            (0, vitest_1.expect)(result).toBe(ansi_1.ColorScheme.error('Player \'Bob\' is not online'));
        });
        (0, vitest_1.it)('should handle target user not authenticated', async () => {
            const senderPlayer = new player_1.Player('Alice', 'session1', 'room1');
            const targetPlayer = new player_1.Player('Bob', 'session2', 'room1');
            mockPlayerManager.getPlayerBySessionId.mockReturnValue(senderPlayer);
            mockPlayerManager.getPlayerByUsername.mockReturnValue(targetPlayer);
            mockSessionManager.getSession.mockReturnValue({
                id: 'session2',
                state: types_1.SessionState.CONNECTED,
                authenticated: false,
                username: 'Bob'
            });
            const result = await commandParser.parseCommand('session1', 'whisper Bob hello world');
            (0, vitest_1.expect)(result).toBe(ansi_1.ColorScheme.error('Player \'Bob\' is not online'));
        });
        (0, vitest_1.it)('should handle target user not in connected state', async () => {
            const senderPlayer = new player_1.Player('Alice', 'session1', 'room1');
            const targetPlayer = new player_1.Player('Bob', 'session2', 'room1');
            mockPlayerManager.getPlayerBySessionId.mockReturnValue(senderPlayer);
            mockPlayerManager.getPlayerByUsername.mockReturnValue(targetPlayer);
            mockSessionManager.getSession.mockReturnValue({
                id: 'session2',
                state: types_1.SessionState.CONNECTING,
                authenticated: true,
                username: 'Bob'
            });
            const result = await commandParser.parseCommand('session1', 'whisper Bob hello world');
            (0, vitest_1.expect)(result).toBe(ansi_1.ColorScheme.error('Player \'Bob\' is not online'));
        });
        (0, vitest_1.it)('should successfully send whisper message', async () => {
            const senderPlayer = new player_1.Player('Alice', 'session1', 'room1');
            const targetPlayer = new player_1.Player('Bob', 'session2', 'room1');
            mockPlayerManager.getPlayerBySessionId.mockReturnValue(senderPlayer);
            mockPlayerManager.getPlayerByUsername.mockReturnValue(targetPlayer);
            mockSessionManager.getSession.mockReturnValue({
                id: 'session2',
                state: types_1.SessionState.CONNECTED,
                authenticated: true,
                username: 'Bob'
            });
            mockSessionManager.sendToSession.mockReturnValue(true);
            const result = await commandParser.parseCommand('session1', 'whisper Bob hello world');
            (0, vitest_1.expect)(result).toBe(ansi_1.ColorScheme.success('You whisper to Bob: hello world'));
            (0, vitest_1.expect)(mockSessionManager.sendToSession).toHaveBeenCalledWith('session2', ansi_1.ColorScheme.info('[Alice whispers]: hello world'), 'user');
        });
        (0, vitest_1.it)('should handle send failure', async () => {
            const senderPlayer = new player_1.Player('Alice', 'session1', 'room1');
            const targetPlayer = new player_1.Player('Bob', 'session2', 'room1');
            mockPlayerManager.getPlayerBySessionId.mockReturnValue(senderPlayer);
            mockPlayerManager.getPlayerByUsername.mockReturnValue(targetPlayer);
            mockSessionManager.getSession.mockReturnValue({
                id: 'session2',
                state: types_1.SessionState.CONNECTED,
                authenticated: true,
                username: 'Bob'
            });
            mockSessionManager.sendToSession.mockReturnValue(false);
            const result = await commandParser.parseCommand('session1', 'whisper Bob hello world');
            (0, vitest_1.expect)(result).toBe(ansi_1.ColorScheme.error('Failed to send message'));
        });
        (0, vitest_1.it)('should work with aliases', async () => {
            const senderPlayer = new player_1.Player('Alice', 'session1', 'room1');
            const targetPlayer = new player_1.Player('Bob', 'session2', 'room1');
            mockPlayerManager.getPlayerBySessionId.mockReturnValue(senderPlayer);
            mockPlayerManager.getPlayerByUsername.mockReturnValue(targetPlayer);
            mockSessionManager.getSession.mockReturnValue({
                id: 'session2',
                state: types_1.SessionState.CONNECTED,
                authenticated: true,
                username: 'Bob'
            });
            mockSessionManager.sendToSession.mockReturnValue(true);
            const aliases = ['w', 'tell', 'msg', 'pm'];
            for (const alias of aliases) {
                mockSessionManager.sendToSession.mockClear();
                const result = await commandParser.parseCommand('session1', `${alias} Bob hello world`);
                (0, vitest_1.expect)(result).toBe(ansi_1.ColorScheme.success('You whisper to Bob: hello world'));
                (0, vitest_1.expect)(mockSessionManager.sendToSession).toHaveBeenCalledWith('session2', ansi_1.ColorScheme.info('[Alice whispers]: hello world'), 'user');
            }
        });
        (0, vitest_1.it)('should handle messages with spaces and special characters', async () => {
            const senderPlayer = new player_1.Player('Alice', 'session1', 'room1');
            const targetPlayer = new player_1.Player('Bob', 'session2', 'room1');
            mockPlayerManager.getPlayerBySessionId.mockReturnValue(senderPlayer);
            mockPlayerManager.getPlayerByUsername.mockReturnValue(targetPlayer);
            mockSessionManager.getSession.mockReturnValue({
                id: 'session2',
                state: types_1.SessionState.CONNECTED,
                authenticated: true,
                username: 'Bob'
            });
            mockSessionManager.sendToSession.mockReturnValue(true);
            const result = await commandParser.parseCommand('session1', 'whisper Bob hello world! How are you?');
            (0, vitest_1.expect)(result).toBe(ansi_1.ColorScheme.success('You whisper to Bob: hello world! How are you?'));
            (0, vitest_1.expect)(mockSessionManager.sendToSession).toHaveBeenCalledWith('session2', ansi_1.ColorScheme.info('[Alice whispers]: hello world! How are you?'), 'user');
        });
    });
    (0, vitest_1.describe)('Global Chat Command', () => {
        (0, vitest_1.beforeEach)(() => {
            mockPlayerManager.getPlayerBySessionId.mockReset();
        });
        (0, vitest_1.it)('should have chat command registered', () => {
            const handler = commandParser.getCommandHandler('chat');
            (0, vitest_1.expect)(handler).toBeDefined();
            (0, vitest_1.expect)(handler.description).toBe('Send a message to all online players');
            (0, vitest_1.expect)(handler.usage).toBe('chat <message>');
        });
        (0, vitest_1.it)('should have chat command aliases registered', () => {
            const aliases = ['global', 'g'];
            aliases.forEach(alias => {
                const handler = commandParser.getCommandHandler(alias);
                (0, vitest_1.expect)(handler).toBeDefined();
                (0, vitest_1.expect)(handler.command).toBe('chat');
            });
        });
        (0, vitest_1.it)('should handle missing arguments', async () => {
            const result = await commandParser.parseCommand('session1', 'chat');
            (0, vitest_1.expect)(result).toBe(ansi_1.ColorScheme.error('What do you want to say globally?'));
        });
        (0, vitest_1.it)('should handle missing player manager', async () => {
            const parserWithoutPlayerManager = new command_parser_1.CommandParser(mockEventSystem, mockSessionManager, null, mockLogger);
            const result = await parserWithoutPlayerManager.parseCommand('session1', 'chat hello world');
            (0, vitest_1.expect)(result).toBe(ansi_1.ColorScheme.error('Player manager not available'));
        });
        (0, vitest_1.it)('should handle sender not logged in', async () => {
            mockPlayerManager.getPlayerBySessionId.mockReturnValue(null);
            const result = await commandParser.parseCommand('session1', 'chat hello world');
            (0, vitest_1.expect)(result).toBe(ansi_1.ColorScheme.error('You must be logged in to use global chat'));
        });
        (0, vitest_1.it)('should successfully send global chat message', async () => {
            const senderPlayer = new player_1.Player('Alice', 'session1', 'room1');
            mockPlayerManager.getPlayerBySessionId.mockReturnValue(senderPlayer);
            const emitSpy = vitest_1.vi.spyOn(mockEventSystem, 'emit');
            const result = await commandParser.parseCommand('session1', 'chat hello world');
            (0, vitest_1.expect)(result).toBe(ansi_1.ColorScheme.success('You say globally: hello world'));
            (0, vitest_1.expect)(emitSpy).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                eventType: 'player.message',
                source: 'session1',
                data: vitest_1.expect.objectContaining({
                    message: 'hello world',
                    type: 'global',
                    timestamp: vitest_1.expect.any(Date),
                }),
            }));
        });
        (0, vitest_1.it)('should work with aliases', async () => {
            const senderPlayer = new player_1.Player('Alice', 'session1', 'room1');
            mockPlayerManager.getPlayerBySessionId.mockReturnValue(senderPlayer);
            const aliases = ['global', 'g'];
            for (const alias of aliases) {
                const emitSpy = vitest_1.vi.spyOn(mockEventSystem, 'emit');
                emitSpy.mockClear();
                const result = await commandParser.parseCommand('session1', `${alias} hello world`);
                (0, vitest_1.expect)(result).toBe(ansi_1.ColorScheme.success('You say globally: hello world'));
                (0, vitest_1.expect)(emitSpy).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                    eventType: 'player.message',
                    source: 'session1',
                    data: vitest_1.expect.objectContaining({
                        message: 'hello world',
                        type: 'global',
                        timestamp: vitest_1.expect.any(Date),
                    }),
                }));
            }
        });
        (0, vitest_1.it)('should handle messages with spaces and special characters', async () => {
            const senderPlayer = new player_1.Player('Alice', 'session1', 'room1');
            mockPlayerManager.getPlayerBySessionId.mockReturnValue(senderPlayer);
            const emitSpy = vitest_1.vi.spyOn(mockEventSystem, 'emit');
            const result = await commandParser.parseCommand('session1', 'chat hello world! How are you today?');
            (0, vitest_1.expect)(result).toBe(ansi_1.ColorScheme.success('You say globally: hello world! How are you today?'));
            (0, vitest_1.expect)(emitSpy).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                eventType: 'player.message',
                source: 'session1',
                data: vitest_1.expect.objectContaining({
                    message: 'hello world! How are you today?',
                    type: 'global',
                    timestamp: vitest_1.expect.any(Date),
                }),
            }));
        });
        (0, vitest_1.it)('should handle quoted messages', async () => {
            const senderPlayer = new player_1.Player('Alice', 'session1', 'room1');
            mockPlayerManager.getPlayerBySessionId.mockReturnValue(senderPlayer);
            const emitSpy = vitest_1.vi.spyOn(mockEventSystem, 'emit');
            const result = await commandParser.parseCommand('session1', 'chat "hello world"');
            (0, vitest_1.expect)(result).toBe(ansi_1.ColorScheme.success('You say globally: hello world'));
            (0, vitest_1.expect)(emitSpy).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                eventType: 'player.message',
                source: 'session1',
                data: vitest_1.expect.objectContaining({
                    message: 'hello world',
                    type: 'global',
                    timestamp: vitest_1.expect.any(Date),
                }),
            }));
        });
    });
    (0, vitest_1.describe)('Who Command', () => {
        (0, vitest_1.beforeEach)(() => {
            mockSessionManager.getAllSessions.mockReset();
        });
        (0, vitest_1.it)('should show "No players are currently online" when no sessions', async () => {
            mockSessionManager.getAllSessions.mockReturnValue([]);
            const result = await commandParser.parseCommand('session1', 'who');
            (0, vitest_1.expect)(result).toContain('No players are currently online');
        });
        (0, vitest_1.it)('should show "No players are currently online" when only non-authenticated sessions', async () => {
            const sessions = [
                {
                    id: 'session1',
                    state: types_1.SessionState.CONNECTED,
                    authenticated: false,
                    username: undefined,
                    lastActivity: new Date()
                }
            ];
            mockSessionManager.getAllSessions.mockReturnValue(sessions);
            const result = await commandParser.parseCommand('session2', 'who');
            (0, vitest_1.expect)(result).toContain('No players are currently online');
        });
        (0, vitest_1.it)('should show online players with usernames', async () => {
            const sessions = [
                {
                    id: 'session1',
                    state: types_1.SessionState.CONNECTED,
                    authenticated: true,
                    username: 'Alice',
                    lastActivity: new Date()
                },
                {
                    id: 'session2',
                    state: types_1.SessionState.CONNECTED,
                    authenticated: true,
                    username: 'Bob',
                    lastActivity: new Date(Date.now() - 5 * 60 * 1000)
                }
            ];
            mockSessionManager.getAllSessions.mockReturnValue(sessions);
            const result = await commandParser.parseCommand('session1', 'who');
            (0, vitest_1.expect)(result).toContain('┌─ Online Players ──────────────────────────────┐');
            (0, vitest_1.expect)(result).toContain('Alice');
            (0, vitest_1.expect)(result).toContain('Bob');
            (0, vitest_1.expect)(result).toContain('active');
            (0, vitest_1.expect)(result).toContain('5m idle');
            (0, vitest_1.expect)(result).toContain('└─ Total: 2 players online ─┘');
        });
        (0, vitest_1.it)('should handle session with no username', async () => {
            const sessions = [
                {
                    id: 'session1',
                    state: types_1.SessionState.CONNECTED,
                    authenticated: true,
                    username: 'Alice',
                    lastActivity: new Date()
                },
                {
                    id: 'session2',
                    state: types_1.SessionState.CONNECTED,
                    authenticated: true,
                    username: undefined,
                    lastActivity: new Date()
                }
            ];
            mockSessionManager.getAllSessions.mockReturnValue(sessions);
            const result = await commandParser.parseCommand('session1', 'who');
            (0, vitest_1.expect)(result).toContain('Alice');
            (0, vitest_1.expect)(result).toContain('Total: 1 player online');
        });
        (0, vitest_1.it)('should handle idle time calculation correctly', async () => {
            const sessions = [
                {
                    id: 'session1',
                    state: types_1.SessionState.CONNECTED,
                    authenticated: true,
                    username: 'IdleUser',
                    lastActivity: new Date(Date.now() - 120 * 1000)
                }
            ];
            mockSessionManager.getAllSessions.mockReturnValue(sessions);
            const result = await commandParser.parseCommand('session2', 'who');
            (0, vitest_1.expect)(result).toContain('IdleUser');
            (0, vitest_1.expect)(result).toContain('2m idle');
        });
        (0, vitest_1.it)('should handle singular "player" when only one online', async () => {
            const sessions = [
                {
                    id: 'session1',
                    state: types_1.SessionState.CONNECTED,
                    authenticated: true,
                    username: 'SinglePlayer',
                    lastActivity: new Date()
                }
            ];
            mockSessionManager.getAllSessions.mockReturnValue(sessions);
            const result = await commandParser.parseCommand('session1', 'who');
            (0, vitest_1.expect)(result).toContain('SinglePlayer');
            (0, vitest_1.expect)(result).toContain('Total: 1 player online');
        });
        (0, vitest_1.it)('should work with aliases', async () => {
            const sessions = [
                {
                    id: 'session1',
                    state: types_1.SessionState.CONNECTED,
                    authenticated: true,
                    username: 'TestUser',
                    lastActivity: new Date()
                }
            ];
            mockSessionManager.getAllSessions.mockReturnValue(sessions);
            const result1 = await commandParser.parseCommand('session2', 'users');
            const result2 = await commandParser.parseCommand('session2', 'online');
            (0, vitest_1.expect)(result1).toContain('TestUser');
            (0, vitest_1.expect)(result2).toContain('TestUser');
        });
    });
    (0, vitest_1.describe)('Help System', () => {
        (0, vitest_1.it)('should show all commands help', () => {
            const help = commandParser.getAllCommandsHelp();
            (0, vitest_1.expect)(help).toContain('Available Commands:');
            (0, vitest_1.expect)(help).toContain('help');
            (0, vitest_1.expect)(help).toContain('quit');
            (0, vitest_1.expect)(help).toContain('say');
            (0, vitest_1.expect)(help).toContain('look');
            (0, vitest_1.expect)(help).toContain('stats');
            (0, vitest_1.expect)(help).toContain('clear');
            (0, vitest_1.expect)(help).toContain('version');
            (0, vitest_1.expect)(help).toContain('who');
        });
        (0, vitest_1.it)('should show specific command help', async () => {
            const result = await commandParser.parseCommand('session1', 'help help');
            (0, vitest_1.expect)(result).toContain('help');
            (0, vitest_1.expect)(result).toContain('Show help information');
            (0, vitest_1.expect)(result).toContain('help [command]');
        });
        (0, vitest_1.it)('should show help for commands with aliases', async () => {
            const result = await commandParser.parseCommand('session1', 'help quit');
            (0, vitest_1.expect)(result).toContain('quit');
            (0, vitest_1.expect)(result).toContain('exit');
            (0, vitest_1.expect)(result).toContain('logout');
            (0, vitest_1.expect)(result).toContain('q');
        });
    });
    (0, vitest_1.describe)('Error Handling', () => {
        (0, vitest_1.it)('should handle handler errors gracefully', async () => {
            const errorHandler = {
                command: 'error',
                description: 'Error command',
                handler: vitest_1.vi.fn().mockRejectedValue(new Error('Handler error')),
            };
            commandParser.registerCommand(errorHandler);
            const result = await commandParser.parseCommand('session1', 'error');
            (0, vitest_1.expect)(result).toBe(ansi_1.ColorScheme.error('An error occurred while processing your command.'));
            (0, vitest_1.expect)(mockLogger.error).toHaveBeenCalledWith('Error parsing command \'error\' for session session1:', vitest_1.expect.any(Error));
        });
        (0, vitest_1.it)('should handle async handler errors', async () => {
            const errorHandler = {
                command: 'asyncerror',
                description: 'Async error command',
                handler: vitest_1.vi.fn().mockImplementation(async () => {
                    throw new Error('Async handler error');
                }),
            };
            commandParser.registerCommand(errorHandler);
            const result = await commandParser.parseCommand('session1', 'asyncerror');
            (0, vitest_1.expect)(result).toBe(ansi_1.ColorScheme.error('An error occurred while processing your command.'));
        });
    });
    (0, vitest_1.describe)('Integration with Event System', () => {
        (0, vitest_1.it)('should work with real event system', async () => {
            const realEventSystem = new event_1.EventSystem();
            const parser = new command_parser_1.CommandParser(realEventSystem, mockLogger);
            let receivedEvent = null;
            realEventSystem.on('network.command.received', (event) => {
                receivedEvent = event;
            });
            const handler = {
                command: 'integration',
                description: 'Integration test command',
                handler: vitest_1.vi.fn().mockResolvedValue('Integration test'),
            };
            parser.registerCommand(handler);
            const result = await parser.parseCommand('session1', 'integration test');
            (0, vitest_1.expect)(result).toBe('Integration test');
            (0, vitest_1.expect)(receivedEvent).toBeDefined();
            (0, vitest_1.expect)(receivedEvent.source).toBe('session1');
            (0, vitest_1.expect)(receivedEvent.data.command).toBe('integration');
            (0, vitest_1.expect)(receivedEvent.data.args).toEqual(['test']);
        });
    });
});
//# sourceMappingURL=command-parser.test.js.map