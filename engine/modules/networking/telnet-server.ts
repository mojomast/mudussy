/**
 * Telnet server implementation with ANSI support and session management
 */

import * as net from 'net';
import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';
import { GameEvent, EventSystem } from '../../core/event';
import { EventTypes } from '../../core/event';
import { ColorScheme, Ansi, formatMessage } from './ansi';
import { SessionManager } from './session';
import { CommandParser } from './command-parser';
import { UsernameValidator } from './username-validator';
import { PlayerManager } from '../persistence/player-manager';
import { WorldManager } from '../world/world-manager';
import {
  INetworkConfig,
  ISession,
  IMessage,
  SessionState,
  NetworkEventTypes
} from './types';

export class TelnetServer extends EventEmitter {
  private server?: net.Server;
  private sessionManager: SessionManager;
  private commandParser: CommandParser;
  private config: INetworkConfig;
  private eventSystem: EventSystem;
  private logger: any;
  private playerManager?: PlayerManager;
  private worldManager?: WorldManager;
  private isRunning: boolean = false;

  constructor(
    eventSystem: EventSystem,
    config: INetworkConfig,
    playerManager?: PlayerManager,
    logger?: any,
    worldManager?: WorldManager,
  ) {
    super();
    this.eventSystem = eventSystem;
    this.config = config;
  this.playerManager = playerManager;
  this.worldManager = worldManager;
    this.logger = logger || console;

    // Initialize session manager and command parser
  this.sessionManager = new SessionManager(eventSystem, config, logger);
  this.commandParser = new CommandParser(eventSystem, this.sessionManager, playerManager, logger, worldManager);

    this.setupEventHandlers();
  }

  /**
   * Start the Telnet server
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Telnet server is already running');
    }

    return new Promise((resolve, reject) => {
      try {
        this.server = net.createServer((socket) => {
          this.handleConnection(socket);
        });

        this.server.on('error', (error) => {
          this.logger.error('Telnet server error:', error);
          this.eventSystem.emit(new GameEvent(
            NetworkEventTypes.SERVER_ERROR,
            'network',
            undefined,
            { error: error.message }
          ));
        });

        this.server.listen(this.config.port, this.config.host, () => {
          this.isRunning = true;
          this.logger.log(`Telnet server started on ${this.config.host}:${this.config.port}`);

          // Emit server started event
          this.eventSystem.emit(new GameEvent(
            NetworkEventTypes.SERVER_STARTED,
            'network',
            undefined,
            {
              host: this.config.host,
              port: this.config.port,
              maxConnections: this.config.maxConnections
            }
          ));

          resolve();
        });

        // Handle server close
        this.server.on('close', () => {
          this.isRunning = false;
          this.logger.log('Telnet server stopped');

          this.eventSystem.emit(new GameEvent(
            NetworkEventTypes.SERVER_STOPPED,
            'network',
            undefined,
            { timestamp: new Date() }
          ));
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Stop the Telnet server
   */
  async stop(): Promise<void> {
    if (!this.isRunning || !this.server) {
      return;
    }

    return new Promise((resolve) => {
      // Disconnect all sessions
      const sessions = this.sessionManager.getAllSessions();
      for (const session of sessions) {
        this.sessionManager.disconnectSession(session.id, 'Server shutting down');
      }

      this.server.close(() => {
        resolve();
      });
    });
  }

  /**
   * Handle new socket connection
   */
  private handleConnection(socket: net.Socket): void {
    // Check connection limit
    if (this.sessionManager.getSessionCount() >= this.config.maxConnections) {
      socket.write(ColorScheme.error('Server is full. Please try again later.\n'));
      socket.end();
      return;
    }

    // Create new session
    const session = this.sessionManager.createSession(socket);

    // Send welcome message
    this.sendWelcomeMessage(session);

    // Set up session-specific event handlers
    this.setupSessionEventHandlers(session);
  }

  /**
   * Send welcome message to new session
   */
  private sendWelcomeMessage(session: ISession): void {
    const welcome = [
      Ansi.clearScreen(),
      Ansi.brightWhite('╔══════════════════════════════════════════════════════════════╗'),
      Ansi.brightWhite('║                    Welcome to MUD Engine                     ║'),
      Ansi.brightWhite('╚══════════════════════════════════════════════════════════════╝'),
      '',
      ColorScheme.info('Please enter your username to begin:'),
      '',
      ColorScheme.info('Username Rules:'),
      ColorScheme.info('• 3-20 characters long'),
      ColorScheme.info('• Letters, numbers, underscores, and hyphens only'),
      ColorScheme.info('• No reserved names or inappropriate content'),
      '',
      Ansi.brightGreen('Username: '),
      ''
    ].join('\n');

    this.sessionManager.sendToSession(session.id, welcome, 'system');
  }

  /**
   * Set up event handlers for session events
   */
  private setupEventHandlers(): void {
    // Handle command received events
    this.eventSystem.on(NetworkEventTypes.COMMAND_RECEIVED, async (event) => {
      if (!event.data) return;

      const { sessionId, command, args, raw } = event.data;

      try {
        // Parse and execute the command
        const response = await this.commandParser.parseCommand(sessionId, raw);

        if (response) {
          this.sessionManager.sendToSession(sessionId, response);
        }

        // Send prompt after command execution
        this.sendPrompt(sessionId);

      } catch (error) {
        this.logger.error(`Error handling command '${raw}' for session ${sessionId}:`, error);
        this.sessionManager.sendToSession(sessionId, ColorScheme.error('An error occurred processing your command.'));
        this.sendPrompt(sessionId);
      }
    });

    // Handle player messages (say command)
    this.eventSystem.on(EventTypes.PLAYER_MESSAGE, (event) => {
      if (!event.data) return;

      const { message, type } = event.data;
      const senderId = event.source;

      // Get sender session to get username
      const senderSession = this.sessionManager.getSession(senderId);
      const username = senderSession?.username || 'Unknown';

      // Format message for broadcasting
      let formattedMessage: string;
      if (type === 'say') {
        formattedMessage = ColorScheme.user(`${username}`, message);
      } else {
        formattedMessage = `${username}: ${message}`;
      }

      // Broadcast to all connected sessions except sender
      this.sessionManager.broadcastMessage(
        formattedMessage,
        'user',
        senderId
      );
    });

    // Handle player joined events
    this.eventSystem.on(EventTypes.PLAYER_JOINED, (event) => {
      const sessionId = event.source;
      const session = this.sessionManager.getSession(sessionId);

      if (session?.username) {
        const joinMessage = ColorScheme.system(`${session.username} has joined the game.`);

        // Broadcast join message to all other players
        this.sessionManager.broadcastMessage(joinMessage, 'system', sessionId);

        // Send welcome message to the player
        this.sessionManager.sendToSession(sessionId,
          ColorScheme.success(`\nWelcome, ${session.username}! You are now connected.\n`)
        );

        this.sendPrompt(sessionId);
      }
    });

    // Handle player left events
    this.eventSystem.on(EventTypes.PLAYER_LEFT, (event) => {
      const sessionId = event.source;
      const session = this.sessionManager.getSession(sessionId);

      if (session?.username) {
        const leaveMessage = ColorScheme.system(`${session.username} has left the game.`);

        // Broadcast leave message to all other players
        this.sessionManager.broadcastMessage(leaveMessage, 'system', sessionId);

        // Remove player from player manager
        if (this.playerManager) {
          this.playerManager.removePlayerBySessionId(sessionId);
        }
      }
    });

    // Handle session authentication
    this.eventSystem.on(NetworkEventTypes.SESSION_AUTHENTICATED, (event) => {
      const sessionId = event.source;
      const session = this.sessionManager.getSession(sessionId);

      if (session?.username) {
        // Emit player joined event
        this.eventSystem.emit(new GameEvent(
          EventTypes.PLAYER_JOINED,
          sessionId,
          undefined,
          { username: session.username }
        ));
      }
    });
  }

  /**
   * Check if a username already exists in the player saves
   */
  private async usernameExists(username: string): Promise<boolean> {
    try {
      // Look for player save files in the persistence directory
      // This is a simplified implementation - in production, you'd use a database
      const dataDir = path.join(process.cwd(), 'data');
      const playersDir = path.join(dataDir, 'players');

      if (!fs.existsSync(playersDir)) {
        return false; // No saves directory means no existing users
      }

      // Read all player save files and check usernames
      const files = fs.readdirSync(playersDir).filter(file => file.endsWith('.json'));

      for (const file of files) {
        try {
          const filePath = path.join(playersDir, file);
          const content = fs.readFileSync(filePath, 'utf8');
          const saveData = JSON.parse(content);

          // Check if this save file contains the username we're looking for
          if (saveData.data && saveData.data.username === username) {
            return true;
          }
        } catch (error) {
          // Skip malformed files
          this.logger.warn(`Skipping malformed player save file: ${file}`);
        }
      }

      return false;
    } catch (error) {
      this.logger.error('Error checking username existence:', error);
      return false; // On error, assume username doesn't exist to avoid blocking
    }
  }

  /**
   * Set up session-specific event handlers
   */
  private setupSessionEventHandlers(session: ISession): void {
    // Handle authentication process
    if (session.state === SessionState.AUTHENTICATING) {
      // Start the username authentication process
      this.startAuthenticationProcess(session);
    }
  }

  /**
   * Start the authentication process for a session
   */
  private async startAuthenticationProcess(session: ISession): Promise<void> {
    // Wait for username input
    const usernameHandler = async (event: GameEvent) => {
      if (event.source !== session.id || !event.data) return;

      const { command } = event.data;
      const username = UsernameValidator.sanitizeUsername(command);

      // Validate the username
      const validation = UsernameValidator.validateUsername(username);

      if (!validation.valid) {
        // Send validation errors
        const errorMessage = '\n' + validation.errors.map(error => ColorScheme.error(`• ${error}`)).join('\n');
        this.sessionManager.sendToSession(session.id, errorMessage);

        // Send warnings if any
        if (validation.warnings.length > 0) {
          const warningMessage = '\n' + validation.warnings.map(warning => ColorScheme.info(`• ${warning}`)).join('\n');
          this.sessionManager.sendToSession(session.id, warningMessage);
        }

        // Prompt for username again
        this.sessionManager.sendToSession(session.id, '\n' + Ansi.brightGreen('Username: '));
        return;
      }

      // Check if username already exists
      const exists = await this.usernameExists(username);
      if (exists) {
        this.sessionManager.sendToSession(session.id,
          ColorScheme.error(`\nUsername '${username}' is already taken. Please choose a different username.`)
        );
        this.sessionManager.sendToSession(session.id, '\n' + Ansi.brightGreen('Username: '));
        return;
      }

      // Remove the temporary handler
      this.eventSystem.off(NetworkEventTypes.COMMAND_RECEIVED, usernameHandler);

      // Authenticate with a simple password (in real implementation, use proper auth)
      await this.authenticateSession(session.id, username, 'password');
    };

    // Register temporary handler for username input
    this.eventSystem.on(NetworkEventTypes.COMMAND_RECEIVED, usernameHandler);
  }

  /**
   * Authenticate a session
   */
  private async authenticateSession(sessionId: string, username: string, password: string): Promise<void> {
    this.sessionManager.sendToSession(sessionId, Ansi.brightGreen(`\nAuthenticating as ${username}...\n`));

    try {
      const authResult = await this.sessionManager.authenticateSession(sessionId, username, password);

      if (authResult.success) {
        // Create or load player in player manager
        if (this.playerManager) {
          // Try to load existing player, or create new one
          let player = this.playerManager.getPlayerByUsername(username);
          if (!player) {
            // Create new player with default room
            player = this.playerManager.createPlayer(sessionId, username, 'tavern');
          } else {
            // Update existing player's session ID
            player.sessionId = sessionId;
            this.playerManager.addPlayer(sessionId, player);
          }

          // Add player to world room
          if (this.eventSystem && player) {
            // Emit room entered event to add player to world
            this.eventSystem.emit(new GameEvent(
              'world.room.entered',
              'network',
              sessionId,
              {
                fromRoomId: null,
                toRoomId: player.currentRoomId,
                username: player.username
              }
            ));
          }
        }

        this.sessionManager.sendToSession(sessionId,
          ColorScheme.success(`\n🎉 Authentication successful! Welcome, ${username}!\n`)
        );
        this.sessionManager.sendToSession(sessionId,
          ColorScheme.info('You are now connected to the MUD Engine.\n')
        );

        this.logger.log(`User ${username} authenticated successfully from session ${sessionId}`);
      } else {
        this.sessionManager.sendToSession(sessionId,
          ColorScheme.error(`\n❌ Authentication failed: ${authResult.message || 'Unknown error'}\n`)
        );

        // Provide helpful feedback based on the error
        if (authResult.message?.includes('password')) {
          this.sessionManager.sendToSession(sessionId,
            ColorScheme.info('Note: This is a demo server. The password is currently set to "password".\n')
          );
        }

        // Return to username prompt for retry
        this.sessionManager.sendToSession(sessionId,
          ColorScheme.info('\nPlease try a different username or check the password.\n')
        );
        this.sessionManager.sendToSession(sessionId, Ansi.brightGreen('Username: '));

        // Restart the authentication process
        const session = this.sessionManager.getSession(sessionId);
        if (session) {
          this.startAuthenticationProcess(session);
        }

        this.logger.warn(`Authentication failed for username ${username} in session ${sessionId}: ${authResult.message}`);
      }
    } catch (error) {
      this.logger.error(`Error during authentication for session ${sessionId}:`, error);
      this.sessionManager.sendToSession(sessionId,
        ColorScheme.error('\n❌ An error occurred during authentication. Please try again.\n')
      );
      this.sessionManager.sendToSession(sessionId, Ansi.brightGreen('Username: '));

      // Restart the authentication process
      const session = this.sessionManager.getSession(sessionId);
      if (session) {
        this.startAuthenticationProcess(session);
      }
    }
  }

  /**
   * Send command prompt to session
   */
  private sendPrompt(sessionId: string): void {
    const session = this.sessionManager.getSession(sessionId);
    if (session?.state === SessionState.CONNECTED) {
      this.sessionManager.sendToSession(sessionId, ColorScheme.prompt());
    }
  }

  /**
   * Send a message to a specific session
   */
  sendMessage(sessionId: string, message: IMessage): boolean {
    const formattedMessage = formatMessage(message);
    return this.sessionManager.sendToSession(sessionId, formattedMessage, message.type);
  }

  /**
   * Broadcast a message to all connected sessions
   */
  broadcastMessage(message: IMessage, excludeSessionId?: string): void {
    const formattedMessage = formatMessage(message);
    this.sessionManager.broadcastMessage(formattedMessage, message.type, excludeSessionId);
  }

  /**
   * Get server statistics
   */
  getStatistics(): any {
    return {
      isRunning: this.isRunning,
      config: this.config,
      sessionStats: this.sessionManager.getStatistics(),
      registeredCommands: this.commandParser.getRegisteredCommands(),
      serverInfo: {
        host: this.config.host,
        port: this.config.port,
        maxConnections: this.config.maxConnections
      }
    };
  }

  /**
   * Register a custom command
   */
  registerCommand(handler: any): void {
    this.commandParser.registerCommand(handler);
  }

  /**
   * Unregister a custom command
   */
  unregisterCommand(command: string): boolean {
    return this.commandParser.unregisterCommand(command);
  }

  /**
   * Get session manager (for advanced operations)
   */
  getSessionManager(): SessionManager {
    return this.sessionManager;
  }

  /**
   * Get command parser (for advanced operations)
   */
  getCommandParser(): CommandParser {
    return this.commandParser;
  }

  /**
   * Check if server is running
   */
  getIsRunning(): boolean {
    return this.isRunning;
  }
}