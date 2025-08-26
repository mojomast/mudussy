import { Injectable, Logger } from '@nestjs/common';
import { EventSystem, GameEvent, EventTypes } from '../../engine/core/event';
import { TelnetServer } from '../../engine/modules/networking/telnet-server';
import { SessionManager } from '../../engine/modules/networking/session';
import { CommandParser } from '../../engine/modules/networking/command-parser';
import { ColorScheme } from '../../engine/modules/networking/ansi';
import { NetworkEventTypes } from '../../engine/modules/networking/types';
import { WorldManager } from '../../engine/modules/world/world-manager';
import { PlayerManager } from '../../engine/modules/persistence/player-manager';
import { UserService } from './user.service';
import { UserRole } from './user.types';

@Injectable()
export class WebClientService {
  private logger = new Logger('WebClientService');
  private webSessions: Map<string, string> = new Map(); // webClientId -> engineSessionId
  private telnetServer: TelnetServer;
  private eventSystem: EventSystem;
  private userService: UserService;
  private worldManager: WorldManager;
  private playerManager: PlayerManager;
  private sessionManager: SessionManager;
  private commandParser: CommandParser;
  // transport callbacks wired by the websocket gateway
  private outbound: Map<string, (payload: { type: string; content: string }) => void> = new Map();

  constructor(
    userService: UserService,
    eventSystem: EventSystem,
    telnetServer: TelnetServer,
    worldManager: WorldManager,
    playerManager: PlayerManager,
  ) {
    this.userService = userService;
    this.eventSystem = eventSystem;
    this.telnetServer = telnetServer;
    this.worldManager = worldManager;
    this.playerManager = playerManager;

    // Use underlying TelnetServer components for web clients
    this.sessionManager = this.telnetServer.getSessionManager();
    this.commandParser = this.telnetServer.getCommandParser();

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    // Forward player messages to appropriate web clients (room-local or global)
    this.eventSystem.on(EventTypes.PLAYER_MESSAGE, (event) => {
      if (!event.data) return;
      const { message, type } = event.data as any;
      const senderId = String(event.source);
      const senderPlayer = this.playerManager.getPlayerBySessionId(senderId);
      if (!senderPlayer) return;

  const payload = { type: type === 'global' ? 'broadcast' : 'user', content: `${senderPlayer.username}: ${message}` };

      if (type === 'global') {
        for (const [webId, engineId] of this.webSessions) {
          if (engineId !== senderId) this.emitToWeb(webId, payload);
        }
      } else {
        // local chat: only players in the same room
        const roomId = senderPlayer.currentRoomId;
        for (const [webId, engineId] of this.webSessions) {
          if (engineId === senderId) continue;
          const p = this.playerManager.getPlayerBySessionId(engineId);
          if (p && p.currentRoomId === roomId) {
            this.emitToWeb(webId, payload);
          }
        }
      }
    });

    // Handle movement requests emitted by command parser
    this.eventSystem.on('player.move', (event) => {
  const sessionId = String(event.source);
      const { direction, fromRoomId } = event.data || {};
      const player = this.playerManager.getPlayerBySessionId(sessionId);
      const webClientId = this.getWebClientIdBySessionId(sessionId);
      if (!player || !direction || !webClientId) return;

      const exit = this.worldManager.findExit(fromRoomId || player.currentRoomId, direction);
      if (!exit) {
        this.emitToWeb(webClientId, { type: 'error', content: `You cannot go ${direction} from here.` });
        return;
      }

      const moved = this.worldManager.movePlayer(sessionId, fromRoomId || player.currentRoomId, exit.toRoomId);
      if (!moved) {
        this.emitToWeb(webClientId, { type: 'error', content: 'Failed to move to that location.' });
        return;
      }

      player.currentRoomId = exit.toRoomId;
      this.emitToWeb(webClientId, { type: 'info', content: `You move ${direction}.` });
  const desc = this.worldManager.getRoomDescription(exit.toRoomId);
  this.emitToWeb(webClientId, { type: 'info', content: this.stripAnsi(desc) });
    });

    // After authentication, notify client
    this.eventSystem.on(NetworkEventTypes.SESSION_AUTHENTICATED, (event) => {
      const sessionId = String(event.source);
      const webClientId = this.getWebClientIdBySessionId(sessionId);
      if (webClientId) {
        const username = (event.data && (event.data.username || event.data.session?.username)) || 'player';
        this.emitToWeb(webClientId, { type: 'system', content: `Authenticated as ${username}` });
      }
    });
  }

  async createWebSession(webClientId: string): Promise<string> {
    this.logger.log(`Creating web session for client: ${webClientId}`);
    // Create a virtual session without a TCP socket
    // We'll simulate a socket by registering an outbound callback
    const engineSessionId = `web_${webClientId}_${Date.now()}`;
    // Register minimal session in SessionManager for bookkeeping
    // Note: SessionManager currently expects a real net.Socket; for web we track in-memory
    // We'll keep a lightweight map and rely on CommandParser/EventSystem flows
    this.webSessions.set(webClientId, engineSessionId);
    return engineSessionId;
  }

  async authenticateWebSession(
    webClientId: string,
    username: string,
    password: string,
  ): Promise<{ success: boolean; username?: string; message?: string }> {
    const engineSessionId = this.webSessions.get(webClientId);
    if (!engineSessionId) {
      return { success: false, message: 'Web session not found' };
    }

  // Create player entity in PlayerManager and place in a start room
  const startRoomIdResolved = this.worldManager.getStartingRoomId() || this.worldManager.getAllRooms()[0]?.id || this.worldManager['config']?.defaultRoomId || 'tavern';
  const player = this.playerManager.createPlayer(engineSessionId, username, startRoomIdResolved);

    // Place the player in the start room in world state
    const startRoomId = player.currentRoomId;
    const room = this.worldManager.getRoom(startRoomId);
    if (room && !room.players.includes(engineSessionId)) {
      room.players.push(engineSessionId);
    }

    // Emit authentication and joined events
    await this.eventSystem.emit(new GameEvent(
      NetworkEventTypes.SESSION_AUTHENTICATED,
      'web',
      engineSessionId,
      { username, webClientId }
    ));
    await this.eventSystem.emit(new GameEvent(EventTypes.PLAYER_JOINED, engineSessionId));

    return {
      success: true,
      username,
      message: `Welcome, ${username}!`
    };
  }

  async authenticateWebSessionWithRole(
    webClientId: string,
    username: string,
    password: string,
    userId: string,
    role: string,
  ): Promise<{ success: boolean; username?: string; message?: string }> {
    const engineSessionId = this.webSessions.get(webClientId);
    if (!engineSessionId) {
      return { success: false, message: 'Web session not found' };
    }

    // Store session data with user information for persistence
    const sessionData = {
      engineSessionId,
      username,
      userId,
      role,
      authenticated: true,
      createdAt: new Date(),
      lastActivity: new Date()
    };

    await this.storeSessionData(webClientId, sessionData);

    // Emit authentication event with role information
    this.eventSystem.emit(new GameEvent(
      NetworkEventTypes.SESSION_AUTHENTICATED,
      'web-client',
      engineSessionId,
      { username, webClientId, userId, role }
    ));

    return {
      success: true,
      username,
      message: `Welcome, ${username}!`
    };
  }

  async executeCommand(webClientId: string, command: string): Promise<string> {
    const engineSessionId = this.webSessions.get(webClientId);
    if (!engineSessionId) {
      throw new Error('Web session not found');
    }
    // Manually parse and dispatch to handler to avoid re-emitting COMMAND_RECEIVED
    const trimmed = command.trim();
    if (!trimmed) return '';

    const args: string[] = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';
    for (let i = 0; i < trimmed.length; i++) {
      const ch = trimmed[i];
      if (!inQuotes && (ch === '"' || ch === '\'')) {
        inQuotes = true; quoteChar = ch;
      } else if (inQuotes && ch === quoteChar) {
        inQuotes = false; quoteChar = '';
      } else if (!inQuotes && ch === ' ') {
        if (current.length > 0) { args.push(current); current = ''; }
      } else {
        current += ch;
      }
    }
    if (current.length > 0) args.push(current);

    if (args.length === 0) return '';
    const cmd = (args.shift() || '').toLowerCase();
    const handler = this.commandParser.getCommandHandler(cmd);
    if (!handler) {
      return ColorScheme.error(`Unknown command: ${cmd}. Type 'help' for available commands.`);
    }
    const response = await handler.handler(engineSessionId, args, trimmed);
    return typeof response === 'string' ? response : '';
  }

  async getGameState(webClientId: string): Promise<any> {
    const engineSessionId = this.webSessions.get(webClientId);
    if (!engineSessionId) {
      throw new Error('Web session not found');
    }
    const player = this.playerManager.getPlayerBySessionId(engineSessionId);
    const roomId = player?.currentRoomId || 'tavern';
    const room = this.worldManager.getRoom(roomId);
    const description = this.worldManager.getRoomDescription(roomId);
    return {
      location: room?.name || roomId,
      description: this.stripAnsi(description),
      players: room?.players || [],
      roomId,
      timestamp: new Date(),
    };
  }

  async disconnectWebSession(webClientId: string): Promise<void> {
    const engineSessionId = this.webSessions.get(webClientId);
    if (engineSessionId) {
      // Clean up the session
      this.eventSystem.emit(new GameEvent(
        EventTypes.PLAYER_LEFT,
        engineSessionId,
        undefined,
        { reason: 'Web client disconnected' }
      ));

      this.webSessions.delete(webClientId);
      this.logger.log(`Web session disconnected: ${webClientId} -> ${engineSessionId}`);
    }
  }

  private getWebClientIdBySessionId(sessionId: string): string | undefined {
    for (const [webClientId, engineSessionId] of this.webSessions) {
      if (engineSessionId === sessionId) {
        return webClientId;
      }
    }
    return undefined;
  }

  getWebClientId(sessionId: string): string | undefined {
    return this.getWebClientIdBySessionId(sessionId);
  }

  // Get all active web sessions
  getActiveWebSessions(): string[] {
    return Array.from(this.webSessions.keys());
  }

  // Permission checking methods
  async checkUserPermission(userId: string, requiredRole: UserRole): Promise<boolean> {
    return await this.userService.checkPermission({ userId, requiredRole });
  }

  async checkAdminOperation(webClientId: string, operation: string): Promise<boolean> {
    // Get user ID from session data (this would need to be stored when session is created)
    // For now, we'll need to get this from the session data that should be stored
    const sessionData = await this.userService.getSessionData(webClientId);
    if (!sessionData || !sessionData.userId) {
      return false;
    }

    return await this.userService.checkPermission({
      userId: sessionData.userId,
      requiredRole: UserRole.ADMIN,
      action: operation
    });
  }

  // Store session data with user information
  async storeSessionData(webClientId: string, sessionData: any): Promise<void> {
    await this.userService.saveSessionData(webClientId, sessionData);
  }

  // Get session data
  async getSessionData(webClientId: string): Promise<any> {
    return await this.userService.getSessionData(webClientId);
  }

  // Load persistent session for returning users
  async loadPersistentSession(webClientId: string, userId: string): Promise<any> {
    // First check if there's persistent session data in user service
    const sessionData = await this.userService.getSessionData(webClientId);
    if (sessionData) {
      return sessionData;
    }

    // If no session data, check if user has persistent data
    // This would integrate with the SessionManager's persistent session methods
    this.logger.log(`No persistent session found for web client ${webClientId}, user ${userId}`);
    return null;
  }

  // Save session for future restoration
  async saveSessionForPersistence(webClientId: string): Promise<void> {
    const sessionData = await this.getSessionData(webClientId);
    if (sessionData) {
      await this.storeSessionData(webClientId, {
        ...sessionData,
        lastSaved: new Date()
      });
      this.logger.log(`Saved session data for persistence: ${webClientId}`);
    }
  }

  // Allow the gateway to wire an outbound sink so server responses can be forwarded
  registerOutbound(webClientId: string, fn: (payload: { type: string; content: string }) => void) {
    this.outbound.set(webClientId, fn);
  }

  unregisterOutbound(webClientId: string) {
    this.outbound.delete(webClientId);
  }

  private emitToWeb(webClientId: string, payload: { type: string; content: string }) {
    const fn = this.outbound.get(webClientId);
    if (fn) fn(payload);
  }

  // Remove ANSI escape sequences for clean web rendering
  private stripAnsi(input: string): string {
    if (!input) return input;
    // Regex to match ANSI escape codes
    const ansiRegex = /[\u001B\u009B][[\]()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;
    return input.replace(ansiRegex, '');
  }
}