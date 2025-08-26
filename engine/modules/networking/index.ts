/**
 * Networking module for MUD Engine
 *
 * This module provides:
 * - Telnet server with ANSI color support
 * - Session management with authentication
 * - Command parsing and routing
 * - Rate limiting and idle timeout handling
 * - Message routing and broadcasting
 */

// Core networking components
export { TelnetServer } from './telnet-server';
export { SessionManager } from './session';
export { CommandParser } from './command-parser';

// ANSI and formatting utilities
export { Ansi, ColorScheme, formatMessage, stripAnsi, hasAnsi } from './ansi';

// Types and interfaces
export type {
  ISession,
  SessionState,
  IAuthResult,
  IMessage,
  ICommand,
  INetworkConfig,
  TelnetCommand,
  TelnetOption
} from './types';

// Event types
export { NetworkEventTypes } from './types';

// Command handler interface
export type { ICommandHandler } from './command-parser';