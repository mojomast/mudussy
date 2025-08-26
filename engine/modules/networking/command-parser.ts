/**
 * Command parsing and routing system
 */

import { GameEvent, EventSystem } from '../../core/event';
import { EventTypes } from '../../core/event';
import { ColorScheme, Ansi } from './ansi';
import { ICommand, IMessage, NetworkEventTypes } from './types';
import { SessionManager } from './session';
import { PlayerManager } from '../persistence/player-manager';
import { WorldManager } from '../world/world-manager';

export interface ICommandHandler {
  command: string;
  aliases?: string[];
  description: string;
  usage?: string;
  handler: (sessionId: string, args: string[], raw: string) => Promise<string | void>;
  requiresAuth?: boolean;
  adminOnly?: boolean;
}

export class CommandParser {
  private handlers: Map<string, ICommandHandler> = new Map();
  private eventSystem: EventSystem;
  private sessionManager?: SessionManager;
  private playerManager?: PlayerManager;
  private logger: any;
  private worldManager?: WorldManager;
  // Track movement commands to exclude from listings and avoid alias collisions
  private movementCommandNames: Set<string> = new Set();
  // Track hidden/utility commands we don't want in generic listings
  private hiddenCommandNames: Set<string> = new Set();

  constructor(eventSystem: EventSystem, sessionManager?: SessionManager, playerManager?: PlayerManager, logger?: any, worldManager?: WorldManager) {
    this.eventSystem = eventSystem;
    this.sessionManager = sessionManager;
    this.playerManager = playerManager;
    this.logger = logger || console;
    this.worldManager = worldManager;
    this.registerDefaultCommands();
  }

  /**
   * Register a command handler
   */
  registerCommand(handler: ICommandHandler): void {
    this.handlers.set(handler.command.toLowerCase(), handler);

    // Register aliases
    if (handler.aliases) {
      for (const alias of handler.aliases) {
        this.handlers.set(alias.toLowerCase(), handler);
      }
    }

    this.logger.log(`Registered command: ${handler.command} (${handler.aliases?.join(', ') || 'no aliases'})`);
  }

  /**
   * Unregister a command handler
   */
  unregisterCommand(command: string): boolean {
    const handler = this.handlers.get(command.toLowerCase());
    if (!handler) return false;

    this.handlers.delete(command.toLowerCase());

    // Remove aliases
    if (handler.aliases) {
      for (const alias of handler.aliases) {
        this.handlers.delete(alias.toLowerCase());
      }
    }

    this.logger.log(`Unregistered command: ${command}`);
    return true;
  }

  /**
   * Parse and execute a command
   */
  async parseCommand(sessionId: string, input: string): Promise<string | void> {
    try {
      const command = this.parseInput(input);
      if (!command) return;

      // Emit command event
      this.eventSystem.emit(new GameEvent(
        NetworkEventTypes.COMMAND_RECEIVED,
        sessionId,
        undefined,
        {
          sessionId,
          command: command.command,
          args: command.args,
          raw: command.raw,
          timestamp: new Date()
        }
      ));

      const handler = this.handlers.get(command.command.toLowerCase());
      if (!handler) {
        return ColorScheme.error(`Unknown command: ${command.command}. Type 'help' for available commands.`);
      }

      // TODO: Check authentication and admin requirements
      // if (handler.requiresAuth && !isAuthenticated(sessionId)) {
      //   return ColorScheme.error('You must be authenticated to use this command.');
      // }

      // if (handler.adminOnly && !isAdmin(sessionId)) {
      //   return ColorScheme.error('You do not have permission to use this command.');
      // }

      this.logger.log(`Executing command: ${command.command} for session ${sessionId}`);
      return await handler.handler(sessionId, command.args, command.raw);

    } catch (error) {
      this.logger.error(`Error parsing command '${input}' for session ${sessionId}:`, error);
      return ColorScheme.error('An error occurred while processing your command.');
    }
  }

  /**
   * Parse raw input into command structure
   */
  private parseInput(input: string): ICommand | null {
    const trimmed = input.trim();
    if (!trimmed) return null;

    // Handle empty input
    if (trimmed.length === 0) return null;

    // Split by whitespace, handling quoted strings
    const args = this.parseArguments(trimmed);
    if (args.length === 0) return null;

    const command = args.shift() || '';

    return {
      sessionId: '', // Will be set by caller
      command,
      args,
      raw: trimmed,
      timestamp: new Date()
    };
  }

  /**
   * Parse arguments with support for quoted strings
   */
  private parseArguments(input: string): string[] {
    const args: string[] = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';

    for (let i = 0; i < input.length; i++) {
      const char = input[i];

      if (!inQuotes && (char === '"' || char === "'")) {
        inQuotes = true;
        quoteChar = char;
      } else if (inQuotes && char === quoteChar) {
        inQuotes = false;
        quoteChar = '';
      } else if (!inQuotes && char === ' ') {
        if (current.length > 0) {
          args.push(current);
          current = '';
        }
      } else {
        current += char;
      }
    }

    if (current.length > 0) {
      args.push(current);
    }

    return args;
  }

  /**
   * Get all registered commands
   */
  getRegisteredCommands(): string[] {
    // Exclude movement-related commands from the public list
    return Array.from(new Set(this.handlers.values()))
      .map(h => h.command)
  .filter(cmd => !this.movementCommandNames.has(cmd) && !this.hiddenCommandNames.has(cmd));
  }

  /**
   * Get command handler for a specific command
   */
  getCommandHandler(command: string): ICommandHandler | undefined {
    return this.handlers.get(command.toLowerCase());
  }

  /**
   * Get help text for a command
   */
  getCommandHelp(command: string): string | null {
    const handler = this.getCommandHandler(command);
    if (!handler) return null;

    let help = `${ColorScheme.info('Command:')} ${handler.command}\n`;
    help += `${ColorScheme.info('Description:')} ${handler.description}\n`;

    if (handler.usage) {
      help += `${ColorScheme.info('Usage:')} ${handler.usage}\n`;
    }

    if (handler.aliases && handler.aliases.length > 0) {
      help += `${ColorScheme.info('Aliases:')} ${handler.aliases.join(', ')}\n`;
    }

    return help;
  }

  /**
   * Get help for all commands
   */
  getAllCommandsHelp(): string {
    let help = ColorScheme.system('Available Commands:\n\n');

    const commands = Array.from(new Set(this.handlers.values()))
      .sort((a, b) => a.command.localeCompare(b.command));

    for (const handler of commands) {
      help += `${Ansi.brightCyan(handler.command.padEnd(12))} - ${handler.description}\n`;
    }

    help += '\n' + ColorScheme.info('Type "help <command>" for detailed information about a specific command.');
    return help;
  }

  /**
   * Register default commands
   */
  private registerDefaultCommands(): void {
    // Help command
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
          return ColorScheme.error(`Unknown command: ${command}`);
        }

        return helpText;
      }
    });

    // Quit command
    this.registerCommand({
      command: 'quit',
      aliases: ['exit', 'logout', 'q'],
      description: 'Disconnect from the game',
      handler: async (sessionId, args) => {
        // Emit player left event
        this.eventSystem.emit(new GameEvent(
          EventTypes.PLAYER_LEFT,
          sessionId,
          undefined,
          { reason: 'User quit' }
        ));

        return 'Goodbye!';
      }
    });

    // Who command
    this.registerCommand({
      command: 'who',
      aliases: ['users', 'online'],
      description: 'Show online players',
      handler: async (sessionId, args) => {
        if (!this.sessionManager) {
          return ColorScheme.error('Session manager not available');
        }

        const allSessions = this.sessionManager.getAllSessions();
        const connectedSessions = allSessions.filter(session =>
          session.state === 'connected' && session.authenticated && session.username
        );

        if (connectedSessions.length === 0) {
          return ColorScheme.info('No players are currently online.');
        }

        let output = ColorScheme.system('┌─ Online Players ──────────────────────────────┐\n');
        output += ColorScheme.system('│                                                │\n');

        for (const session of connectedSessions) {
          const username = session.username!.padEnd(20);
          const idleTime = Math.floor((Date.now() - session.lastActivity.getTime()) / 1000 / 60); // minutes
          const idleStr = idleTime === 0 ? 'active' : `${idleTime}m idle`;
          const line = `│ ${Ansi.brightCyan(username)} ${Ansi.dim('[')}${idleStr}${Ansi.dim(']')} ${' '.repeat(20)} │\n`;
          output += line;
        }

        output += ColorScheme.system('│                                                │\n');
        output += ColorScheme.system(`└─ Total: ${connectedSessions.length} player${connectedSessions.length === 1 ? '' : 's'} online ─┘\n`);

        return output;
      }
    });

    // Say command
    this.registerCommand({
      command: 'say',
      aliases: ['s'],
      description: 'Say something to other players in the same room',
      usage: 'say <message>',
      handler: async (sessionId, args, raw) => {
        if (args.length === 0) {
          return ColorScheme.error('What do you want to say?');
        }
        // For local say, allow echo even without player manager to support lightweight usage
        const message = args.join(' ');

        this.eventSystem.emit(new GameEvent(
          EventTypes.PLAYER_MESSAGE,
          sessionId,
          undefined,
          {
            message,
            type: 'say',
            timestamp: new Date()
          }
        ));

        return ColorScheme.success(`You say: ${message}`);
      }
    });

    // Look command
    this.registerCommand({
      command: 'look',
      aliases: ['l'],
      description: 'Look around your current location',
      handler: async (sessionId, args) => {
        if (!this.playerManager || !this.worldManager) {
          return ColorScheme.info('You look around, but the world fades in and out.');
        }
        const player = this.playerManager.getPlayerBySessionId(sessionId);
        if (!player) {
          return ColorScheme.error('You are not present in the world.');
        }
  const desc = this.worldManager.getRoomDescription(player.currentRoomId, sessionId);
        return desc;
      }
    });

    // Stats command
    this.registerCommand({
      command: 'stats',
      aliases: ['status'],
      description: 'Show your character stats',
      handler: async (sessionId, args) => {
        // TODO: Get actual player stats from engine
        return ColorScheme.info('Character Stats:\nLevel: 1\nHP: 100/100\nMP: 50/50\nExperience: 0');
      }
    });

    // Clear command
    this.registerCommand({
      command: 'clear',
      aliases: ['cls', 'c'],
      description: 'Clear the screen',
      handler: async (sessionId, args) => {
        // Return ANSI clear screen sequence
        return '\x1b[2J\x1b[H'; // Clear screen and move cursor to home
      }
    });

    // Whisper command
    this.registerCommand({
      command: 'whisper',
      aliases: ['w', 'tell', 'msg', 'pm'],
      description: 'Send a private message to another player',
      usage: 'whisper <username> <message>',
      handler: async (sessionId, args, raw) => {
        if (args.length < 2) {
          return ColorScheme.error('Usage: whisper <username> <message>');
        }

        if (!this.playerManager) {
          return ColorScheme.error('Player manager not available');
        }

        if (!this.sessionManager) {
          return ColorScheme.error('Session manager not available');
        }

        // Get sender player
        const sender = this.playerManager.getPlayerBySessionId(sessionId);
        if (!sender) {
          return ColorScheme.error('You must be logged in to send private messages');
        }

        const targetUsername = args[0];
        const message = args.slice(1).join(' ');

        // Check if trying to whisper to self
        if (targetUsername === sender.username) {
          return ColorScheme.error('You cannot whisper to yourself');
        }

        // Get target player
        const targetPlayer = this.playerManager.getPlayerByUsername(targetUsername);
        if (!targetPlayer) {
          return ColorScheme.error(`Player '${targetUsername}' not found or not online`);
        }

        // Check if target has an active session
        const targetSession = this.sessionManager.getSession(targetPlayer.sessionId);
        if (!targetSession || targetSession.state !== 'connected' || !targetSession.authenticated) {
          return ColorScheme.error(`Player '${targetUsername}' is not online`);
        }

        // Send message to target
        const targetMessage = ColorScheme.info(`[${sender.username} whispers]: ${message}`);
        const success = this.sessionManager.sendToSession(targetPlayer.sessionId, targetMessage, 'user');

        if (!success) {
          return ColorScheme.error('Failed to send message');
        }

        // Send confirmation to sender
        const senderMessage = ColorScheme.success(`You whisper to ${targetUsername}: ${message}`);
        return senderMessage;
      }
    });

    // Global chat command
    this.registerCommand({
      command: 'chat',
      aliases: ['global', 'g'],
      description: 'Send a message to all online players',
      usage: 'chat <message>',
      handler: async (sessionId, args, raw) => {
        if (args.length === 0) {
          return ColorScheme.error('What do you want to say globally?');
        }

        // Validate player exists
        if (!this.playerManager) {
          return ColorScheme.error('Player manager not available');
        }

        const player = this.playerManager.getPlayerBySessionId(sessionId);
        if (!player) {
          return ColorScheme.error('You must be logged in to use global chat');
        }

        const message = args.join(' ');

        // Emit global chat event
        this.eventSystem.emit(new GameEvent(
          EventTypes.PLAYER_MESSAGE,
          sessionId,
          undefined,
          {
            message,
            type: 'global',
            timestamp: new Date()
          }
        ));

        return ColorScheme.success(`You say globally: ${message}`);
      }
    });

    // Movement commands
    const directions = ['north', 'south', 'east', 'west', 'up', 'down', 'northeast', 'northwest', 'southeast', 'southwest'];
    const aliases = {
      'north': ['n'],
      'south': ['s'],
      'east': ['e'],
      // Avoid alias 'w' for west to prevent collision with 'whisper'
      'west': [],
      'up': ['u'],
      'down': ['d'],
      'northeast': ['ne'],
      'northwest': ['nw'],
      'southeast': ['se'],
      'southwest': ['sw']
    };

    // Register movement commands
    for (const direction of directions) {
      this.movementCommandNames.add(direction);
      this.registerCommand({
        command: direction,
        aliases: aliases[direction] || [],
        description: `Move ${direction}`,
        handler: async (sessionId, args) => {
          if (!this.playerManager) {
            return ColorScheme.error('Player manager not available');
          }

          const player = this.playerManager.getPlayerBySessionId(sessionId);
          if (!player) {
            return ColorScheme.error('You must be logged in to move');
          }

          // Get current room and find exit
          if (!this.eventSystem) {
            return ColorScheme.error('Event system not available');
          }

          // Emit movement event to be handled by engine service
          this.eventSystem.emit(new GameEvent(
            'player.move',
            sessionId,
            undefined,
            {
              direction,
              fromRoomId: player.currentRoomId,
              timestamp: new Date()
            }
          ));

          return ColorScheme.success(`You attempt to move ${direction}...`);
        }
      });
    }

    // Go command (alternative movement syntax)
    this.registerCommand({
      command: 'go',
      aliases: ['move'],
      description: 'Move in a direction',
      usage: 'go <direction>',
      handler: async (sessionId, args) => {
        if (args.length === 0) {
          return ColorScheme.error('Which direction do you want to go?');
        }

        if (!this.playerManager) {
          return ColorScheme.error('Player manager not available');
        }

        const player = this.playerManager.getPlayerBySessionId(sessionId);
        if (!player) {
          return ColorScheme.error('You must be logged in to move');
        }

        const direction = args[0].toLowerCase();

        // Emit movement event to be handled by engine service
        this.eventSystem.emit(new GameEvent(
          'player.move',
          sessionId,
          undefined,
          {
            direction,
            fromRoomId: player.currentRoomId,
            timestamp: new Date()
          }
        ));

        return ColorScheme.success(`You attempt to move ${direction}...`);
      }
    });

  // Exclude go/move from public listings as well
  this.movementCommandNames.add('go');
  this.movementCommandNames.add('move');

    // Version command
    this.registerCommand({
      command: 'version',
      aliases: ['ver', 'v'],
      description: 'Show game version information',
      handler: async (sessionId, args) => {
        return ColorScheme.system('MUD Engine v0.1.0\nBuilt with TypeScript and Node.js');
      }
    });

    // Admin command (hidden from listings)
    this.registerCommand({
      command: 'admin',
      description: 'Administrative commands',
      usage: 'admin <subcommand> ...',
      handler: async (sessionId, args) => {
        if (args.length === 0) {
          return ColorScheme.error('Usage: admin <enable|create|set> ...');
        }

        const sub = args.shift()!.toLowerCase();

        if (sub === 'enable') {
          // In a real system we would mark the session as admin
          return ColorScheme.success('Admin mode enabled');
        }

        if (sub === 'create') {
          const target = args.shift()?.toLowerCase();
          if (target !== 'room') {
            return ColorScheme.error('Usage: admin create room <roomId> ["Name"] ["Description"]');
          }
          const roomId = args.shift();
          if (!roomId) {
            return ColorScheme.error('Usage: admin create room <roomId> ["Name"] ["Description"]');
          }
          const name = args.shift() ?? roomId;
          const description = args.shift() ?? '';

          this.eventSystem.emit(new GameEvent(
            'admin.create.room',
            sessionId,
            undefined,
            { roomId, name, description }
          ));
          return ColorScheme.success(`Room created successfully: ${roomId}`);
        }

        if (sub === 'set') {
          const target = args.shift()?.toLowerCase();
          if (target !== 'description') {
            return ColorScheme.error('Usage: admin set description <roomId> "Description"');
          }
          const roomId = args.shift();
          const description = args.shift();
          if (!roomId || description === undefined) {
            return ColorScheme.error('Usage: admin set description <roomId> "Description"');
          }
          this.eventSystem.emit(new GameEvent(
            'admin.set.description',
            sessionId,
            undefined,
            { roomId, description }
          ));
          return ColorScheme.success(`Room description updated: ${roomId}`);
        }

        return ColorScheme.error('Unknown admin subcommand');
      }
    });
    this.hiddenCommandNames.add('admin');
  }
}