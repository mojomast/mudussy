/**
 * Session management with authentication, rate limiting, and timeout handling
 */

import { EventEmitter } from 'events';
import { Socket } from 'net';
import { v4 as uuidv4 } from 'uuid';
import { GameEvent, EventSystem } from '../../core/event';
import {
  ISession,
  SessionState,
  IAuthResult,
  INetworkConfig,
  NetworkEventTypes,
  TelnetCommand,
  TelnetOption,
  UserRole
} from './types';

export class SessionManager extends EventEmitter {
  private sessions: Map<string, ISession> = new Map();
  private eventSystem: EventSystem;
  private config: INetworkConfig;
  private idleTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private rateLimitData: Map<string, { count: number; resetTime: number }> = new Map();
  private logger: any;

  constructor(eventSystem: EventSystem, config: INetworkConfig, logger?: any) {
    super();
    this.eventSystem = eventSystem;
    this.config = config;
    this.logger = logger || console;

    // Set up periodic cleanup
    setInterval(() => this.cleanup(), 60000); // Clean up every minute
  }

  /**
   * Create a new session for a socket connection
   */
  createSession(socket: Socket): ISession {
    const sessionId = uuidv4();
    const session: ISession = {
      id: sessionId,
      socket,
      state: SessionState.AUTHENTICATING,
      authenticated: false,
      connectedAt: new Date(),
      lastActivity: new Date(),
      remoteAddress: socket.remoteAddress || 'unknown',
      remotePort: socket.remotePort || 0
    };

    this.sessions.set(sessionId, session);

    // Set up socket event handlers
    this.setupSocketHandlers(session);

    // Start idle timeout
    this.startIdleTimeout(session);

    // Emit session created event
    this.eventSystem.emit(new GameEvent(
      NetworkEventTypes.SESSION_CONNECTED,
      'network',
      sessionId,
      { session: this.getSessionInfo(session) }
    ));

    this.logger.log(`Session created: ${sessionId} from ${session.remoteAddress}:${session.remotePort}`);
    return session;
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): ISession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Get all active sessions
   */
  getAllSessions(): ISession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Get sessions by state
   */
  getSessionsByState(state: SessionState): ISession[] {
    return this.getAllSessions().filter(session => session.state === state);
  }

  /**
   * Get session count
   */
  getSessionCount(): number {
    return this.sessions.size;
  }

  /**
   * Update session activity timestamp
   */
  updateActivity(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivity = new Date();
      this.resetIdleTimeout(session);
    }
  }

  /**
   * Authenticate a session with role support
   */
  async authenticateSession(sessionId: string, username: string, password: string, userId?: string, role?: UserRole): Promise<IAuthResult> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { success: false, message: 'Session not found' };
    }

    if (session.authenticated) {
      return { success: false, message: 'Already authenticated' };
    }

    // For now, accept any username/password combination
    // In production, this would validate against a user database
    const authResult: IAuthResult = {
      success: true,
      username: username,
      message: `Welcome, ${username}!`
    };

    if (authResult.success) {
      session.username = authResult.username;
      session.userId = userId;
      session.role = role || UserRole.PLAYER; // Default to player role
      session.authenticated = true;
      session.state = SessionState.CONNECTED;

      // Emit authentication success event with role information
      this.eventSystem.emit(new GameEvent(
        NetworkEventTypes.SESSION_AUTHENTICATED,
        'network',
        sessionId,
        {
          session: this.getSessionInfo(session),
          username: authResult.username,
          userId: userId,
          role: session.role
        }
      ));

      this.logger.log(`Session authenticated: ${sessionId} as ${username} with role ${session.role}`);
    }

    return authResult;
  }

  /**
   * Load persistent session data for returning users
   */
  async loadPersistentSession(sessionId: string, userId: string): Promise<boolean> {
    // This would typically load from a persistent storage system
    // For now, we'll just return false to indicate no persistent session exists
    // In a real implementation, this would check a database or file system
    this.logger.log(`Attempting to load persistent session for user ${userId}`);
    return false;
  }

  /**
   * Save session data for persistence
   */
  async savePersistentSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session || !session.authenticated) {
      return;
    }

    // In a real implementation, this would save to persistent storage
    // For now, we'll just log the action
    this.logger.log(`Saving persistent session data for ${sessionId} (${session.username})`);

    // Emit event for persistent storage systems to handle
    this.eventSystem.emit(new GameEvent(
      'network.session.persist',
      'network',
      sessionId,
      {
        session: this.getSessionInfo(session),
        action: 'save'
      }
    ));
  }

  /**
   * Restore session from persistent data
   */
  async restorePersistentSession(sessionId: string, persistentData: any): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    try {
      if (persistentData.username) {
        session.username = persistentData.username;
      }
      if (persistentData.userId) {
        session.userId = persistentData.userId;
      }
      if (persistentData.role) {
        session.role = persistentData.role;
      }
      if (persistentData.authenticated) {
        session.authenticated = true;
        session.state = SessionState.CONNECTED;
      }

      this.logger.log(`Restored persistent session for ${sessionId} (${session.username})`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to restore persistent session ${sessionId}:`, error);
      return false;
    }
  }

  /**
   * Disconnect a session
   */
  disconnectSession(sessionId: string, reason: string = 'Disconnected by server'): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.state = SessionState.DISCONNECTING;

    // Clear timeouts
    this.clearIdleTimeout(sessionId);

    // Send disconnect message
    this.sendToSession(sessionId, `\n${reason}\n`, 'system');

    // Close socket
    session.socket.end();

    // Emit disconnect event
    this.eventSystem.emit(new GameEvent(
      NetworkEventTypes.SESSION_DISCONNECTED,
      'network',
      sessionId,
      {
        session: this.getSessionInfo(session),
        reason
      }
    ));

    this.logger.log(`Session disconnected: ${sessionId} (${reason})`);
  }

  /**
   * Send message to a specific session
   */
  sendToSession(sessionId: string, content: string, type: 'system' | 'user' | 'error' | 'info' | 'broadcast' = 'info'): boolean {
    const session = this.sessions.get(sessionId);
    if (!session || session.state !== SessionState.CONNECTED) {
      return false;
    }

    try {
      session.socket.write(content + '\n');
      return true;
    } catch (error) {
      this.logger.error(`Failed to send message to session ${sessionId}:`, error);
      return false;
    }
  }

  /**
   * Broadcast message to all connected sessions
   */
  broadcastMessage(content: string, type: 'system' | 'user' | 'error' | 'info' | 'broadcast' = 'broadcast', excludeSessionId?: string): void {
    for (const [sessionId, session] of this.sessions) {
      if (sessionId !== excludeSessionId && session.state === SessionState.CONNECTED) {
        this.sendToSession(sessionId, content, type);
      }
    }
  }

  /**
   * Check if session is rate limited
   */
  isRateLimited(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    const now = Date.now();
    const rateData = this.rateLimitData.get(sessionId);

    if (!rateData) {
      this.rateLimitData.set(sessionId, { count: 1, resetTime: now + this.config.rateLimitWindow });
      return false;
    }

    if (now > rateData.resetTime) {
      // Reset the window
      rateData.count = 1;
      rateData.resetTime = now + this.config.rateLimitWindow;
      return false;
    }

    if (rateData.count >= this.config.rateLimitMaxRequests) {
      this.eventSystem.emit(new GameEvent(
        NetworkEventTypes.SESSION_RATE_LIMITED,
        'network',
        sessionId,
        { session: this.getSessionInfo(session) }
      ));
      return true;
    }

    rateData.count++;
    return false;
  }

  /**
   * Set up socket event handlers
   */
  private setupSocketHandlers(session: ISession): void {
    const socket = session.socket;

    socket.on('data', (data) => {
      this.handleSocketData(session, data);
    });

    socket.on('close', (hadError) => {
      this.handleSocketClose(session, hadError);
    });

    socket.on('error', (error) => {
      this.handleSocketError(session, error);
    });

    socket.on('timeout', () => {
      this.handleSocketTimeout(session);
    });

    // Set socket timeout
    socket.setTimeout(this.config.connectionTimeout);
  }

  /**
   * Handle incoming socket data
   */
  private handleSocketData(session: ISession, data: Buffer): void {
    // Check rate limiting
    if (this.isRateLimited(session.id)) {
      this.sendToSession(session.id, 'Rate limit exceeded. Please slow down.', 'error');
      return;
    }

    // Update activity
    this.updateActivity(session.id);

    const dataStr = data.toString('utf8').trim();

    // Handle Telnet protocol commands
    if (this.handleTelnetCommands(session, data)) {
      return;
    }

    // Handle regular input
    if (dataStr.length > 0) {
      this.handleUserInput(session, dataStr);
    }
  }

  /**
   * Handle Telnet protocol commands
   */
  private handleTelnetCommands(session: ISession, data: Buffer): boolean {
    let hasTelnetCommands = false;

    for (let i = 0; i < data.length; i++) {
      if (data[i] === TelnetCommand.IAC) {
        hasTelnetCommands = true;
        // Handle Telnet command sequence
        // For now, just acknowledge and continue
        i += this.processTelnetCommand(session, data, i);
      }
    }

    return hasTelnetCommands;
  }

  /**
   * Process a single Telnet command
   */
  private processTelnetCommand(session: ISession, data: Buffer, index: number): number {
    if (index + 1 >= data.length) return 1;

    const command = data[index + 1];

    switch (command) {
      case TelnetCommand.WILL:
      case TelnetCommand.WONT:
      case TelnetCommand.DO:
      case TelnetCommand.DONT: {
        // Handle option negotiation
        if (index + 2 >= data.length) return 2;
        const option = data[index + 2];
        this.handleTelnetOption(session, command, option);
        return 3;
      }

      default:
        return 2;
    }
  }

  /**
   * Handle Telnet option negotiation
   */
  private handleTelnetOption(session: ISession, command: number, option: number): void {
    // For now, accept all options to keep it simple
    // In a full implementation, you'd handle specific options like terminal type, window size, etc.
    const response = Buffer.from([TelnetCommand.IAC]);

    switch (command) {
      case TelnetCommand.WILL:
        response[1] = TelnetCommand.DO;
        break;
      case TelnetCommand.WONT:
        response[1] = TelnetCommand.DONT;
        break;
      case TelnetCommand.DO:
        response[1] = TelnetCommand.WILL;
        break;
      case TelnetCommand.DONT:
        response[1] = TelnetCommand.WONT;
        break;
    }

    response[2] = option;
    session.socket.write(response);
  }

  /**
   * Handle user input
   */
  private handleUserInput(session: ISession, input: string): void {
    // Emit command received event
    this.eventSystem.emit(new GameEvent(
      NetworkEventTypes.COMMAND_RECEIVED,
      session.id,
      undefined,
      {
        sessionId: session.id,
        command: input,
        timestamp: new Date()
      }
    ));
  }

  /**
   * Handle socket close
   */
  private handleSocketClose(session: ISession, hadError: boolean): void {
    this.logger.log(`Socket closed for session ${session.id}, error: ${hadError}`);
    this.removeSession(session.id, hadError ? 'Socket error' : 'Connection closed');
  }

  /**
   * Handle socket error
   */
  private handleSocketError(session: ISession, error: Error): void {
    this.logger.error(`Socket error for session ${session.id}:`, error);
    this.removeSession(session.id, `Socket error: ${error.message}`);
  }

  /**
   * Handle socket timeout
   */
  private handleSocketTimeout(session: ISession): void {
    this.logger.log(`Socket timeout for session ${session.id}`);
    this.disconnectSession(session.id, 'Connection timeout');
  }

  /**
   * Remove session completely
   */
  private removeSession(sessionId: string, reason: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    // Clear timeouts and rate limiting data
    this.clearIdleTimeout(sessionId);
    this.rateLimitData.delete(sessionId);

    // Remove from sessions map
    this.sessions.delete(sessionId);

    // Emit final disconnect event if not already emitted
    if (session.state !== SessionState.DISCONNECTED) {
      session.state = SessionState.DISCONNECTED;
      this.eventSystem.emit(new GameEvent(
        NetworkEventTypes.SESSION_DISCONNECTED,
        'network',
        sessionId,
        {
          session: this.getSessionInfo(session),
          reason
        }
      ));
    }

    this.logger.log(`Session removed: ${sessionId} (${reason})`);
  }

  /**
   * Start idle timeout for session
   */
  private startIdleTimeout(session: ISession): void {
    const timeout = setTimeout(() => {
      this.handleIdleTimeout(session.id);
    }, this.config.idleTimeout);

    this.idleTimeouts.set(session.id, timeout);
  }

  /**
   * Reset idle timeout for session
   */
  private resetIdleTimeout(session: ISession): void {
    this.clearIdleTimeout(session.id);
    this.startIdleTimeout(session);
  }

  /**
   * Clear idle timeout for session
   */
  private clearIdleTimeout(sessionId: string): void {
    const timeout = this.idleTimeouts.get(sessionId);
    if (timeout) {
      clearTimeout(timeout);
      this.idleTimeouts.delete(sessionId);
    }
  }

  /**
   * Handle idle timeout
   */
  private handleIdleTimeout(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    this.eventSystem.emit(new GameEvent(
      NetworkEventTypes.SESSION_IDLE_TIMEOUT,
      'network',
      sessionId,
      { session: this.getSessionInfo(session) }
    ));

    this.disconnectSession(sessionId, 'Idle timeout');
  }

  /**
   * Get sanitized session info for events
   */
  private getSessionInfo(session: ISession): any {
    return {
      id: session.id,
      username: session.username,
      userId: session.userId,
      role: session.role,
      authenticated: session.authenticated,
      state: session.state,
      remoteAddress: session.remoteAddress,
      remotePort: session.remotePort,
      connectedAt: session.connectedAt,
      lastActivity: session.lastActivity
    };
  }

  /**
   * Clean up expired rate limiting data and idle sessions
   */
  private cleanup(): void {
    const now = Date.now();

    // Clean up expired rate limiting data
    for (const [sessionId, rateData] of this.rateLimitData) {
      if (now > rateData.resetTime) {
        this.rateLimitData.delete(sessionId);
      }
    }

    // Clean up idle sessions (additional safety check)
    for (const [sessionId, session] of this.sessions) {
      const idleTime = now - session.lastActivity.getTime();
      if (idleTime > this.config.idleTimeout * 2) { // 2x timeout as grace period
        this.logger.warn(`Force disconnecting idle session: ${sessionId}`);
        this.disconnectSession(sessionId, 'Forced idle cleanup');
      }
    }
  }

  /**
   * Get session statistics
   */
  getStatistics(): any {
    const sessions = this.getAllSessions();
    const stats = {
      totalSessions: sessions.length,
      authenticatedSessions: sessions.filter(s => s.authenticated).length,
      connectingSessions: sessions.filter(s => s.state === SessionState.CONNECTING).length,
      connectedSessions: sessions.filter(s => s.state === SessionState.CONNECTED).length,
      sessionsByState: {} as Record<string, number>
    };

    // Count sessions by state
    for (const state of Object.values(SessionState)) {
      stats.sessionsByState[state] = sessions.filter(s => s.state === state).length;
    }

    return stats;
  }
}