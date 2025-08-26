import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  CommandParser,
  ICommandHandler
} from '../../engine/modules/networking/command-parser';
import { EventSystem } from '../../engine/core/event';
import { ColorScheme } from '../../engine/modules/networking/ansi';
import { SessionManager } from '../../engine/modules/networking/session';
import { SessionState } from '../../engine/modules/networking/types';
import { PlayerManager } from '../../engine/modules/persistence/player-manager';
import { Player } from '../../engine/modules/persistence/player';
import { createMockEventSystem } from '../utils/test-helpers';

describe('Command Parser', () => {
  let commandParser: CommandParser;
  let mockEventSystem: EventSystem;
  let mockSessionManager: any;
  let mockPlayerManager: any;
  let mockLogger: any;

  beforeEach(() => {
    // Create a real EventSystem for testing
    mockEventSystem = new EventSystem();

    // Create a mock SessionManager
    mockSessionManager = {
      getAllSessions: vi.fn(),
      getSessionCount: vi.fn(),
      getSession: vi.fn(),
      sendToSession: vi.fn(),
    };

    // Create a mock PlayerManager
    mockPlayerManager = {
      getPlayerBySessionId: vi.fn(),
      getPlayerByUsername: vi.fn(),
      getAllActivePlayers: vi.fn(),
    };

    mockLogger = {
      log: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      debug: vi.fn(),
    };
    commandParser = new CommandParser(mockEventSystem, mockSessionManager, mockPlayerManager, mockLogger);
  });

  describe('Command Registration', () => {
    it('should register commands correctly', () => {
      const handler: ICommandHandler = {
        command: 'test',
        description: 'Test command',
        handler: vi.fn().mockResolvedValue('Test executed'),
      };

      commandParser.registerCommand(handler);

      expect(mockLogger.log).toHaveBeenCalledWith('Registered command: test (no aliases)');
    });

    it('should register commands with aliases', () => {
      const handler: ICommandHandler = {
        command: 'test',
        aliases: ['t', 'testing'],
        description: 'Test command',
        handler: vi.fn().mockResolvedValue('Test executed'),
      };

      commandParser.registerCommand(handler);

      expect(mockLogger.log).toHaveBeenCalledWith('Registered command: test (t, testing)');
    });

    it('should handle duplicate aliases', () => {
      const handler1: ICommandHandler = {
        command: 'test1',
        aliases: ['t'],
        description: 'Test command 1',
        handler: vi.fn(),
      };

      const handler2: ICommandHandler = {
        command: 'test2',
        aliases: ['t'],
        description: 'Test command 2',
        handler: vi.fn(),
      };

      commandParser.registerCommand(handler1);
      commandParser.registerCommand(handler2);

      // Both should be registered, with the last one winning
      const result = commandParser.getCommandHandler('t');
      expect(result).toBe(handler2);
    });

    it('should unregister commands', () => {
      const handler: ICommandHandler = {
        command: 'test',
        aliases: ['t'],
        description: 'Test command',
        handler: vi.fn(),
      };

      commandParser.registerCommand(handler);
      expect(commandParser.getCommandHandler('test')).toBe(handler);

      const result = commandParser.unregisterCommand('test');
      expect(result).toBe(true);
      expect(commandParser.getCommandHandler('test')).toBeUndefined();
      expect(commandParser.getCommandHandler('t')).toBeUndefined();

      expect(mockLogger.log).toHaveBeenCalledWith('Unregistered command: test');
    });

    it('should handle unregistering non-existent commands', () => {
      const result = commandParser.unregisterCommand('nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('Command Parsing', () => {
    it('should parse simple commands', async () => {
      const handler: ICommandHandler = {
        command: 'test',
        description: 'Test command',
        handler: vi.fn().mockResolvedValue('Test executed'),
      };

      commandParser.registerCommand(handler);

      const result = await commandParser.parseCommand('session1', 'test');
      expect(result).toBe('Test executed');
      expect(handler.handler).toHaveBeenCalledWith('session1', [], 'test');
    });

    it('should parse commands with arguments', async () => {
      const handler: ICommandHandler = {
        command: 'say',
        description: 'Say something',
        handler: vi.fn(),
      };

      commandParser.registerCommand(handler);

      await commandParser.parseCommand('session1', 'say hello world');

      expect(handler.handler).toHaveBeenCalledWith('session1', ['hello', 'world'], 'say hello world');
    });

    it('should handle quoted arguments', async () => {
      const handler: ICommandHandler = {
        command: 'say',
        description: 'Say something',
        handler: vi.fn(),
      };

      commandParser.registerCommand(handler);

      await commandParser.parseCommand('session1', 'say "hello world"');

      expect(handler.handler).toHaveBeenCalledWith('session1', ['hello world'], 'say "hello world"');
    });

    it('should handle mixed quoted and unquoted arguments', async () => {
      const handler: ICommandHandler = {
        command: 'command',
        description: 'Test command',
        handler: vi.fn(),
      };

      commandParser.registerCommand(handler);

      await commandParser.parseCommand('session1', 'command arg1 "arg 2" arg3');

      expect(handler.handler).toHaveBeenCalledWith('session1', ['arg1', 'arg 2', 'arg3'], 'command arg1 "arg 2" arg3');
    });

    it('should handle empty input', async () => {
      const result = await commandParser.parseCommand('session1', '');
      expect(result).toBeUndefined();
    });

    it('should handle whitespace-only input', async () => {
      const result = await commandParser.parseCommand('session1', '   ');
      expect(result).toBeUndefined();
    });

    it('should handle unknown commands', async () => {
      const result = await commandParser.parseCommand('session1', 'unknown');
      expect(result).toBe(ColorScheme.error('Unknown command: unknown. Type \'help\' for available commands.'));
    });

    it('should handle commands with different cases', async () => {
      const handler: ICommandHandler = {
        command: 'test',
        description: 'Test command',
        handler: vi.fn().mockResolvedValue('Test executed'),
      };

      commandParser.registerCommand(handler);

      const result1 = await commandParser.parseCommand('session1', 'TEST');
      const result2 = await commandParser.parseCommand('session1', 'Test');
      const result3 = await commandParser.parseCommand('session1', 'test');

      expect(result1).toBe('Test executed');
      expect(result2).toBe('Test executed');
      expect(result3).toBe('Test executed');
    });
  });

  describe('Event Emission', () => {
    it('should emit command received event', async () => {
      const handler: ICommandHandler = {
        command: 'test',
        description: 'Test command',
        handler: vi.fn().mockResolvedValue('Test executed'),
      };

      commandParser.registerCommand(handler);

      // Spy on the event system's emit method
      const emitSpy = vi.spyOn(mockEventSystem, 'emit');

      await commandParser.parseCommand('session1', 'test arg1 arg2');

      expect(emitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'network.command.received',
          source: 'session1',
          data: expect.objectContaining({
            sessionId: 'session1',
            command: 'test',
            args: ['arg1', 'arg2'],
            raw: 'test arg1 arg2',
            timestamp: expect.any(Date),
          }),
        })
      );
    });
  });

  describe('Command Information', () => {
    it('should get registered commands', () => {
      const handler1: ICommandHandler = {
        command: 'test1',
        description: 'Test command 1',
        handler: vi.fn(),
      };

      const handler2: ICommandHandler = {
        command: 'test2',
        description: 'Test command 2',
        handler: vi.fn(),
      };

      commandParser.registerCommand(handler1);
      commandParser.registerCommand(handler2);

      const commands = commandParser.getRegisteredCommands();
      expect(commands).toContain('test1');
      expect(commands).toContain('test2');
      // Should have default commands (9) + chat command (1) + 2 new commands = 12 total
      expect(commands).toHaveLength(12);
    });

    it('should get command handler', () => {
      const handler: ICommandHandler = {
        command: 'test',
        description: 'Test command',
        handler: vi.fn(),
      };

      commandParser.registerCommand(handler);

      expect(commandParser.getCommandHandler('test')).toBe(handler);
      expect(commandParser.getCommandHandler('nonexistent')).toBeUndefined();
    });

    it('should get command help', () => {
      const handler: ICommandHandler = {
        command: 'test',
        aliases: ['t'],
        description: 'Test command',
        usage: 'test [arg]',
        handler: vi.fn(),
      };

      commandParser.registerCommand(handler);

      const help = commandParser.getCommandHelp('test');
      expect(help).toContain('test'); // Command name should be present
      expect(help).toContain('Test command'); // Description should be present
      expect(help).toContain('test [arg]'); // Usage should be present
      expect(help).toContain('t'); // Alias should be present
    });

    it('should return null for unknown command help', () => {
      const help = commandParser.getCommandHelp('nonexistent');
      expect(help).toBeNull();
    });
  });

  describe('Default Commands', () => {
    it('should have help command registered', () => {
      const handler = commandParser.getCommandHandler('help');
      expect(handler).toBeDefined();
      expect(handler!.description).toBe('Show help information');
    });

    it('should have quit command registered', () => {
      const handler = commandParser.getCommandHandler('quit');
      expect(handler).toBeDefined();
      expect(handler!.description).toBe('Disconnect from the game');
    });

    it('should have say command registered', () => {
      const handler = commandParser.getCommandHandler('say');
      expect(handler).toBeDefined();
      expect(handler!.description).toBe('Say something to other players in the same room');
    });

    it('should have look command registered', () => {
      const handler = commandParser.getCommandHandler('look');
      expect(handler).toBeDefined();
      expect(handler!.description).toBe('Look around your current location');
    });

    it('should have stats command registered', () => {
      const handler = commandParser.getCommandHandler('stats');
      expect(handler).toBeDefined();
      expect(handler!.description).toBe('Show your character stats');
    });

    it('should have clear command registered', () => {
      const handler = commandParser.getCommandHandler('clear');
      expect(handler).toBeDefined();
      expect(handler!.description).toBe('Clear the screen');
    });

    it('should have version command registered', () => {
      const handler = commandParser.getCommandHandler('version');
      expect(handler).toBeDefined();
      expect(handler!.description).toBe('Show game version information');
    });

    it('should have who command registered', () => {
      const handler = commandParser.getCommandHandler('who');
      expect(handler).toBeDefined();
      expect(handler!.description).toBe('Show online players');
    });

    it('should have who command aliases registered', () => {
      const handler = commandParser.getCommandHandler('users');
      expect(handler).toBeDefined();
      expect(handler!.command).toBe('who');

      const handler2 = commandParser.getCommandHandler('online');
      expect(handler2).toBeDefined();
      expect(handler2!.command).toBe('who');
    });

    it('should have chat command registered', () => {
      const handler = commandParser.getCommandHandler('chat');
      expect(handler).toBeDefined();
      expect(handler!.description).toBe('Send a message to all online players');
    });

    it('should have chat command aliases registered', () => {
      const aliases = ['global', 'g'];
      aliases.forEach(alias => {
        const handler = commandParser.getCommandHandler(alias);
        expect(handler).toBeDefined();
        expect(handler!.command).toBe('chat');
      });
    });
  });

  describe('Whisper Command', () => {
    beforeEach(() => {
      // Reset mocks before each test
      mockPlayerManager.getPlayerBySessionId.mockReset();
      mockPlayerManager.getPlayerByUsername.mockReset();
      mockSessionManager.getSession.mockReset();
      mockSessionManager.sendToSession.mockReset();
    });

    it('should have whisper command registered', () => {
      const handler = commandParser.getCommandHandler('whisper');
      expect(handler).toBeDefined();
      expect(handler!.description).toBe('Send a private message to another player');
      expect(handler!.usage).toBe('whisper <username> <message>');
    });

    it('should have whisper command aliases registered', () => {
      const aliases = ['w', 'tell', 'msg', 'pm'];
      aliases.forEach(alias => {
        const handler = commandParser.getCommandHandler(alias);
        expect(handler).toBeDefined();
        expect(handler!.command).toBe('whisper');
      });
    });

    it('should handle missing arguments', async () => {
      const result = await commandParser.parseCommand('session1', 'whisper');
      expect(result).toBe(ColorScheme.error('Usage: whisper <username> <message>'));
    });

    it('should handle only username without message', async () => {
      const result = await commandParser.parseCommand('session1', 'whisper Alice');
      expect(result).toBe(ColorScheme.error('Usage: whisper <username> <message>'));
    });

    it('should handle missing player manager', async () => {
      const parserWithoutPlayerManager = new CommandParser(mockEventSystem, mockSessionManager, null, mockLogger);
      const result = await parserWithoutPlayerManager.parseCommand('session1', 'whisper Alice hello');
      expect(result).toBe(ColorScheme.error('Player manager not available'));
    });

    it('should handle missing session manager', async () => {
      const parserWithoutSessionManager = new CommandParser(mockEventSystem, null, mockPlayerManager, mockLogger);
      const result = await parserWithoutSessionManager.parseCommand('session1', 'whisper Alice hello');
      expect(result).toBe(ColorScheme.error('Session manager not available'));
    });

    it('should handle sender not logged in', async () => {
      mockPlayerManager.getPlayerBySessionId.mockReturnValue(null);

      const result = await commandParser.parseCommand('session1', 'whisper Alice hello world');
      expect(result).toBe(ColorScheme.error('You must be logged in to send private messages'));
    });

    it('should prevent whispering to self', async () => {
      const senderPlayer = new Player('Alice', 'session1', 'room1');
      mockPlayerManager.getPlayerBySessionId.mockReturnValue(senderPlayer);

      const result = await commandParser.parseCommand('session1', 'whisper Alice hello world');
      expect(result).toBe(ColorScheme.error('You cannot whisper to yourself'));
    });

    it('should handle target user not found', async () => {
      const senderPlayer = new Player('Alice', 'session1', 'room1');
      mockPlayerManager.getPlayerBySessionId.mockReturnValue(senderPlayer);
      mockPlayerManager.getPlayerByUsername.mockReturnValue(null);

      const result = await commandParser.parseCommand('session1', 'whisper Bob hello world');
      expect(result).toBe(ColorScheme.error('Player \'Bob\' not found or not online'));
    });

    it('should handle target user offline', async () => {
      const senderPlayer = new Player('Alice', 'session1', 'room1');
      const targetPlayer = new Player('Bob', 'session2', 'room1');
      mockPlayerManager.getPlayerBySessionId.mockReturnValue(senderPlayer);
      mockPlayerManager.getPlayerByUsername.mockReturnValue(targetPlayer);
      mockSessionManager.getSession.mockReturnValue(null); // Target not connected

      const result = await commandParser.parseCommand('session1', 'whisper Bob hello world');
      expect(result).toBe(ColorScheme.error('Player \'Bob\' is not online'));
    });

    it('should handle target user not authenticated', async () => {
      const senderPlayer = new Player('Alice', 'session1', 'room1');
      const targetPlayer = new Player('Bob', 'session2', 'room1');
      mockPlayerManager.getPlayerBySessionId.mockReturnValue(senderPlayer);
      mockPlayerManager.getPlayerByUsername.mockReturnValue(targetPlayer);
      mockSessionManager.getSession.mockReturnValue({
        id: 'session2',
        state: SessionState.CONNECTED,
        authenticated: false, // Not authenticated
        username: 'Bob'
      });

      const result = await commandParser.parseCommand('session1', 'whisper Bob hello world');
      expect(result).toBe(ColorScheme.error('Player \'Bob\' is not online'));
    });

    it('should handle target user not in connected state', async () => {
      const senderPlayer = new Player('Alice', 'session1', 'room1');
      const targetPlayer = new Player('Bob', 'session2', 'room1');
      mockPlayerManager.getPlayerBySessionId.mockReturnValue(senderPlayer);
      mockPlayerManager.getPlayerByUsername.mockReturnValue(targetPlayer);
      mockSessionManager.getSession.mockReturnValue({
        id: 'session2',
        state: SessionState.CONNECTING, // Not connected
        authenticated: true,
        username: 'Bob'
      });

      const result = await commandParser.parseCommand('session1', 'whisper Bob hello world');
      expect(result).toBe(ColorScheme.error('Player \'Bob\' is not online'));
    });

    it('should successfully send whisper message', async () => {
      const senderPlayer = new Player('Alice', 'session1', 'room1');
      const targetPlayer = new Player('Bob', 'session2', 'room1');
      mockPlayerManager.getPlayerBySessionId.mockReturnValue(senderPlayer);
      mockPlayerManager.getPlayerByUsername.mockReturnValue(targetPlayer);
      mockSessionManager.getSession.mockReturnValue({
        id: 'session2',
        state: SessionState.CONNECTED,
        authenticated: true,
        username: 'Bob'
      });
      mockSessionManager.sendToSession.mockReturnValue(true);

      const result = await commandParser.parseCommand('session1', 'whisper Bob hello world');
      expect(result).toBe(ColorScheme.success('You whisper to Bob: hello world'));
      expect(mockSessionManager.sendToSession).toHaveBeenCalledWith(
        'session2',
        ColorScheme.info('[Alice whispers]: hello world'),
        'user'
      );
    });

    it('should handle send failure', async () => {
      const senderPlayer = new Player('Alice', 'session1', 'room1');
      const targetPlayer = new Player('Bob', 'session2', 'room1');
      mockPlayerManager.getPlayerBySessionId.mockReturnValue(senderPlayer);
      mockPlayerManager.getPlayerByUsername.mockReturnValue(targetPlayer);
      mockSessionManager.getSession.mockReturnValue({
        id: 'session2',
        state: SessionState.CONNECTED,
        authenticated: true,
        username: 'Bob'
      });
      mockSessionManager.sendToSession.mockReturnValue(false); // Send failed

      const result = await commandParser.parseCommand('session1', 'whisper Bob hello world');
      expect(result).toBe(ColorScheme.error('Failed to send message'));
    });

    it('should work with aliases', async () => {
      const senderPlayer = new Player('Alice', 'session1', 'room1');
      const targetPlayer = new Player('Bob', 'session2', 'room1');
      mockPlayerManager.getPlayerBySessionId.mockReturnValue(senderPlayer);
      mockPlayerManager.getPlayerByUsername.mockReturnValue(targetPlayer);
      mockSessionManager.getSession.mockReturnValue({
        id: 'session2',
        state: SessionState.CONNECTED,
        authenticated: true,
        username: 'Bob'
      });
      mockSessionManager.sendToSession.mockReturnValue(true);

      const aliases = ['w', 'tell', 'msg', 'pm'];
      for (const alias of aliases) {
        mockSessionManager.sendToSession.mockClear();
        const result = await commandParser.parseCommand('session1', `${alias} Bob hello world`);
        expect(result).toBe(ColorScheme.success('You whisper to Bob: hello world'));
        expect(mockSessionManager.sendToSession).toHaveBeenCalledWith(
          'session2',
          ColorScheme.info('[Alice whispers]: hello world'),
          'user'
        );
      }
    });

    it('should handle messages with spaces and special characters', async () => {
      const senderPlayer = new Player('Alice', 'session1', 'room1');
      const targetPlayer = new Player('Bob', 'session2', 'room1');
      mockPlayerManager.getPlayerBySessionId.mockReturnValue(senderPlayer);
      mockPlayerManager.getPlayerByUsername.mockReturnValue(targetPlayer);
      mockSessionManager.getSession.mockReturnValue({
        id: 'session2',
        state: SessionState.CONNECTED,
        authenticated: true,
        username: 'Bob'
      });
      mockSessionManager.sendToSession.mockReturnValue(true);

      const result = await commandParser.parseCommand('session1', 'whisper Bob hello world! How are you?');
      expect(result).toBe(ColorScheme.success('You whisper to Bob: hello world! How are you?'));
      expect(mockSessionManager.sendToSession).toHaveBeenCalledWith(
        'session2',
        ColorScheme.info('[Alice whispers]: hello world! How are you?'),
        'user'
      );
    });
  });

  describe('Global Chat Command', () => {
    beforeEach(() => {
      // Reset mocks before each test
      mockPlayerManager.getPlayerBySessionId.mockReset();
    });

    it('should have chat command registered', () => {
      const handler = commandParser.getCommandHandler('chat');
      expect(handler).toBeDefined();
      expect(handler!.description).toBe('Send a message to all online players');
      expect(handler!.usage).toBe('chat <message>');
    });

    it('should have chat command aliases registered', () => {
      const aliases = ['global', 'g'];
      aliases.forEach(alias => {
        const handler = commandParser.getCommandHandler(alias);
        expect(handler).toBeDefined();
        expect(handler!.command).toBe('chat');
      });
    });

    it('should handle missing arguments', async () => {
      const result = await commandParser.parseCommand('session1', 'chat');
      expect(result).toBe(ColorScheme.error('What do you want to say globally?'));
    });

    it('should handle missing player manager', async () => {
      const parserWithoutPlayerManager = new CommandParser(mockEventSystem, mockSessionManager, null, mockLogger);
      const result = await parserWithoutPlayerManager.parseCommand('session1', 'chat hello world');
      expect(result).toBe(ColorScheme.error('Player manager not available'));
    });

    it('should handle sender not logged in', async () => {
      mockPlayerManager.getPlayerBySessionId.mockReturnValue(null);

      const result = await commandParser.parseCommand('session1', 'chat hello world');
      expect(result).toBe(ColorScheme.error('You must be logged in to use global chat'));
    });

    it('should successfully send global chat message', async () => {
      const senderPlayer = new Player('Alice', 'session1', 'room1');
      mockPlayerManager.getPlayerBySessionId.mockReturnValue(senderPlayer);

      // Spy on the event system's emit method
      const emitSpy = vi.spyOn(mockEventSystem, 'emit');

      const result = await commandParser.parseCommand('session1', 'chat hello world');
      expect(result).toBe(ColorScheme.success('You say globally: hello world'));

      // Verify that the PLAYER_MESSAGE event was emitted with global type
      expect(emitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'player.message',
          source: 'session1',
          data: expect.objectContaining({
            message: 'hello world',
            type: 'global',
            timestamp: expect.any(Date),
          }),
        })
      );
    });

    it('should work with aliases', async () => {
      const senderPlayer = new Player('Alice', 'session1', 'room1');
      mockPlayerManager.getPlayerBySessionId.mockReturnValue(senderPlayer);

      const aliases = ['global', 'g'];

      for (const alias of aliases) {
        const emitSpy = vi.spyOn(mockEventSystem, 'emit');
        emitSpy.mockClear();

        const result = await commandParser.parseCommand('session1', `${alias} hello world`);
        expect(result).toBe(ColorScheme.success('You say globally: hello world'));

        expect(emitSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            eventType: 'player.message',
            source: 'session1',
            data: expect.objectContaining({
              message: 'hello world',
              type: 'global',
              timestamp: expect.any(Date),
            }),
          })
        );
      }
    });

    it('should handle messages with spaces and special characters', async () => {
      const senderPlayer = new Player('Alice', 'session1', 'room1');
      mockPlayerManager.getPlayerBySessionId.mockReturnValue(senderPlayer);

      const emitSpy = vi.spyOn(mockEventSystem, 'emit');

      const result = await commandParser.parseCommand('session1', 'chat hello world! How are you today?');
      expect(result).toBe(ColorScheme.success('You say globally: hello world! How are you today?'));

      expect(emitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'player.message',
          source: 'session1',
          data: expect.objectContaining({
            message: 'hello world! How are you today?',
            type: 'global',
            timestamp: expect.any(Date),
          }),
        })
      );
    });

    it('should handle quoted messages', async () => {
      const senderPlayer = new Player('Alice', 'session1', 'room1');
      mockPlayerManager.getPlayerBySessionId.mockReturnValue(senderPlayer);

      const emitSpy = vi.spyOn(mockEventSystem, 'emit');

      const result = await commandParser.parseCommand('session1', 'chat "hello world"');
      expect(result).toBe(ColorScheme.success('You say globally: hello world'));

      expect(emitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'player.message',
          source: 'session1',
          data: expect.objectContaining({
            message: 'hello world',
            type: 'global',
            timestamp: expect.any(Date),
          }),
        })
      );
    });
  });

  describe('Who Command', () => {
    beforeEach(() => {
      // Reset mock before each test
      mockSessionManager.getAllSessions.mockReset();
    });

    it('should show "No players are currently online" when no sessions', async () => {
      mockSessionManager.getAllSessions.mockReturnValue([]);

      const result = await commandParser.parseCommand('session1', 'who');

      expect(result).toContain('No players are currently online');
    });

    it('should show "No players are currently online" when only non-authenticated sessions', async () => {
      const sessions = [
        {
          id: 'session1',
          state: SessionState.CONNECTED,
          authenticated: false,
          username: undefined,
          lastActivity: new Date()
        }
      ];
      mockSessionManager.getAllSessions.mockReturnValue(sessions);

      const result = await commandParser.parseCommand('session2', 'who');

      expect(result).toContain('No players are currently online');
    });

    it('should show online players with usernames', async () => {
      const sessions = [
        {
          id: 'session1',
          state: SessionState.CONNECTED,
          authenticated: true,
          username: 'Alice',
          lastActivity: new Date()
        },
        {
          id: 'session2',
          state: SessionState.CONNECTED,
          authenticated: true,
          username: 'Bob',
          lastActivity: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
        }
      ];
      mockSessionManager.getAllSessions.mockReturnValue(sessions);

      const result = await commandParser.parseCommand('session1', 'who');

      expect(result).toContain('┌─ Online Players ──────────────────────────────┐');
      expect(result).toContain('Alice');
      expect(result).toContain('Bob');
      expect(result).toContain('active');
      expect(result).toContain('5m idle');
      expect(result).toContain('└─ Total: 2 players online ─┘');
    });

    it('should handle session with no username', async () => {
      const sessions = [
        {
          id: 'session1',
          state: SessionState.CONNECTED,
          authenticated: true,
          username: 'Alice',
          lastActivity: new Date()
        },
        {
          id: 'session2',
          state: SessionState.CONNECTED,
          authenticated: true,
          username: undefined, // This should be filtered out
          lastActivity: new Date()
        }
      ];
      mockSessionManager.getAllSessions.mockReturnValue(sessions);

      const result = await commandParser.parseCommand('session1', 'who');

      expect(result).toContain('Alice');
      expect(result).toContain('Total: 1 player online');
    });

    it('should handle idle time calculation correctly', async () => {
      const sessions = [
        {
          id: 'session1',
          state: SessionState.CONNECTED,
          authenticated: true,
          username: 'IdleUser',
          lastActivity: new Date(Date.now() - 120 * 1000) // 2 minutes ago
        }
      ];
      mockSessionManager.getAllSessions.mockReturnValue(sessions);

      const result = await commandParser.parseCommand('session2', 'who');

      expect(result).toContain('IdleUser');
      expect(result).toContain('2m idle');
    });

    it('should handle singular "player" when only one online', async () => {
      const sessions = [
        {
          id: 'session1',
          state: SessionState.CONNECTED,
          authenticated: true,
          username: 'SinglePlayer',
          lastActivity: new Date()
        }
      ];
      mockSessionManager.getAllSessions.mockReturnValue(sessions);

      const result = await commandParser.parseCommand('session1', 'who');

      expect(result).toContain('SinglePlayer');
      expect(result).toContain('Total: 1 player online');
    });

    it('should work with aliases', async () => {
      const sessions = [
        {
          id: 'session1',
          state: SessionState.CONNECTED,
          authenticated: true,
          username: 'TestUser',
          lastActivity: new Date()
        }
      ];
      mockSessionManager.getAllSessions.mockReturnValue(sessions);

      const result1 = await commandParser.parseCommand('session2', 'users');
      const result2 = await commandParser.parseCommand('session2', 'online');

      expect(result1).toContain('TestUser');
      expect(result2).toContain('TestUser');
    });
  });

  describe('Help System', () => {
    it('should show all commands help', () => {
      const help = commandParser.getAllCommandsHelp();
      expect(help).toContain('Available Commands:');
      expect(help).toContain('help');
      expect(help).toContain('quit');
      expect(help).toContain('say');
      expect(help).toContain('look');
      expect(help).toContain('stats');
      expect(help).toContain('clear');
      expect(help).toContain('version');
      expect(help).toContain('who');
    });

    it('should show specific command help', async () => {
      const result = await commandParser.parseCommand('session1', 'help help');
      expect(result).toContain('help'); // Command name should be present
      expect(result).toContain('Show help information'); // Description should be present
      expect(result).toContain('help [command]'); // Usage should be present
    });

    it('should show help for commands with aliases', async () => {
      const result = await commandParser.parseCommand('session1', 'help quit');
      expect(result).toContain('quit'); // Command name should be present
      expect(result).toContain('exit'); // Should contain aliases
      expect(result).toContain('logout');
      expect(result).toContain('q');
    });
  });

  describe('Error Handling', () => {
    it('should handle handler errors gracefully', async () => {
      const errorHandler: ICommandHandler = {
        command: 'error',
        description: 'Error command',
        handler: vi.fn().mockRejectedValue(new Error('Handler error')),
      };

      commandParser.registerCommand(errorHandler);

      const result = await commandParser.parseCommand('session1', 'error');
      expect(result).toBe(ColorScheme.error('An error occurred while processing your command.'));

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error parsing command \'error\' for session session1:',
        expect.any(Error)
      );
    });

    it('should handle async handler errors', async () => {
      const errorHandler: ICommandHandler = {
        command: 'asyncerror',
        description: 'Async error command',
        handler: vi.fn().mockImplementation(async () => {
          throw new Error('Async handler error');
        }),
      };

      commandParser.registerCommand(errorHandler);

      const result = await commandParser.parseCommand('session1', 'asyncerror');
      expect(result).toBe(ColorScheme.error('An error occurred while processing your command.'));
    });
  });

  describe('Integration with Event System', () => {
    it('should work with real event system', async () => {
      const realEventSystem = new EventSystem();
      const parser = new CommandParser(realEventSystem, mockLogger);

      let receivedEvent: any = null;
      realEventSystem.on('network.command.received', (event) => {
        receivedEvent = event;
      });

      const handler: ICommandHandler = {
        command: 'integration',
        description: 'Integration test command',
        handler: vi.fn().mockResolvedValue('Integration test'),
      };

      parser.registerCommand(handler);

      const result = await parser.parseCommand('session1', 'integration test');

      expect(result).toBe('Integration test');
      expect(receivedEvent).toBeDefined();
      expect(receivedEvent!.source).toBe('session1');
      expect(receivedEvent!.data.command).toBe('integration');
      expect(receivedEvent!.data.args).toEqual(['test']);
    });
  });
});