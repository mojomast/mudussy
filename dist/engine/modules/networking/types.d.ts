import { Socket } from 'net';
export declare enum SessionState {
    CONNECTING = "connecting",
    AUTHENTICATING = "authenticating",
    CONNECTED = "connected",
    DISCONNECTING = "disconnecting",
    DISCONNECTED = "disconnected"
}
export declare enum UserRole {
    PLAYER = "player",
    MODERATOR = "moderator",
    ADMIN = "admin"
}
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
export declare enum TelnetOption {
    ECHO = 1,
    SUPPRESS_GO_AHEAD = 3,
    TERMINAL_TYPE = 24,
    WINDOW_SIZE = 31,
    TERMINAL_SPEED = 32,
    REMOTE_FLOW_CONTROL = 33,
    LINEMODE = 34,
    ENVIRONMENT_VARIABLES = 36
}
export declare enum TelnetCommand {
    SE = 240,
    NOP = 241,
    DM = 242,
    BRK = 243,
    IP = 244,
    AO = 245,
    AYT = 246,
    EC = 247,
    EL = 248,
    GA = 249,
    SB = 250,
    WILL = 251,
    WONT = 252,
    DO = 253,
    DONT = 254,
    IAC = 255
}
export interface ICommand {
    sessionId: string;
    command: string;
    args: string[];
    raw: string;
    timestamp: Date;
}
export interface IMessage {
    sessionId?: string;
    content: string;
    type: 'system' | 'user' | 'error' | 'info' | 'broadcast';
    timestamp: Date;
    formatted?: boolean;
}
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
export interface IAuthResult {
    success: boolean;
    username?: string;
    message?: string;
    sessionData?: any;
}
export declare const NetworkEventTypes: {
    readonly SESSION_CONNECTED: "network.session.connected";
    readonly SESSION_DISCONNECTED: "network.session.disconnected";
    readonly SESSION_AUTHENTICATED: "network.session.authenticated";
    readonly SESSION_IDLE_TIMEOUT: "network.session.idle_timeout";
    readonly SESSION_RATE_LIMITED: "network.session.rate_limited";
    readonly COMMAND_RECEIVED: "network.command.received";
    readonly MESSAGE_SENT: "network.message.sent";
    readonly SERVER_STARTED: "network.server.started";
    readonly SERVER_STOPPED: "network.server.stopped";
    readonly SERVER_ERROR: "network.server.error";
};
