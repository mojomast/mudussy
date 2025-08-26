/**
 * Networking module types and interfaces
 */

import { Socket } from 'net';

/**
 * Session states for user connections
 */
export enum SessionState {
  CONNECTING = 'connecting',
  AUTHENTICATING = 'authenticating',
  CONNECTED = 'connected',
  DISCONNECTING = 'disconnecting',
  DISCONNECTED = 'disconnected'
}

/**
 * User role enumeration
 */
export enum UserRole {
  PLAYER = 'player',
  MODERATOR = 'moderator',
  ADMIN = 'admin'
}

/**
 * User session interface
 */
export interface ISession {
  id: string;
  socket: Socket;
  state: SessionState;
  username?: string;
  userId?: string;
  role?: UserRole;
  authenticated: boolean;
  connectedAt: Date;
  lastActivity: Date;
  remoteAddress: string;
  remotePort: number;
  terminalType?: string;
  terminalWidth?: number;
  terminalHeight?: number;
}

/**
 * Telnet protocol options
 */
export enum TelnetOption {
  ECHO = 1,
  SUPPRESS_GO_AHEAD = 3,
  TERMINAL_TYPE = 24,
  WINDOW_SIZE = 31,
  TERMINAL_SPEED = 32,
  REMOTE_FLOW_CONTROL = 33,
  LINEMODE = 34,
  ENVIRONMENT_VARIABLES = 36
}

/**
 * Telnet command codes
 */
export enum TelnetCommand {
  SE = 240,  // End of subnegotiation
  NOP = 241, // No operation
  DM = 242,  // Data mark
  BRK = 243, // Break
  IP = 244,  // Interrupt process
  AO = 245,  // Abort output
  AYT = 246, // Are you there
  EC = 247,  // Erase character
  EL = 248,  // Erase line
  GA = 249,  // Go ahead
  SB = 250,  // Subnegotiation begin
  WILL = 251, // Will perform
  WONT = 252, // Won't perform
  DO = 253,   // Do perform
  DONT = 254, // Don't perform
  IAC = 255   // Interpret as command
}

/**
 * Command interface for user input
 */
export interface ICommand {
  sessionId: string;
  command: string;
  args: string[];
  raw: string;
  timestamp: Date;
}

/**
 * Message interface for output
 */
export interface IMessage {
  sessionId?: string;
  content: string;
  type: 'system' | 'user' | 'error' | 'info' | 'broadcast';
  timestamp: Date;
  formatted?: boolean;
}

/**
 * Server configuration
 */
export interface INetworkConfig {
  host: string;
  port: number;
  maxConnections: number;
  connectionTimeout: number;
  idleTimeout: number;
  rateLimitWindow: number;
  rateLimitMaxRequests: number;
  enableLogging: boolean;
  logLevel: string;
}

/**
 * Authentication result
 */
export interface IAuthResult {
  success: boolean;
  username?: string;
  message?: string;
  sessionData?: any;
}

/**
 * Network event types
 */
export const NetworkEventTypes = {
  SESSION_CONNECTED: 'network.session.connected',
  SESSION_DISCONNECTED: 'network.session.disconnected',
  SESSION_AUTHENTICATED: 'network.session.authenticated',
  SESSION_IDLE_TIMEOUT: 'network.session.idle_timeout',
  SESSION_RATE_LIMITED: 'network.session.rate_limited',
  COMMAND_RECEIVED: 'network.command.received',
  MESSAGE_SENT: 'network.message.sent',
  SERVER_STARTED: 'network.server.started',
  SERVER_STOPPED: 'network.server.stopped',
  SERVER_ERROR: 'network.server.error'
} as const;