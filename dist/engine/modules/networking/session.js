"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionManager = void 0;
const events_1 = require("events");
const uuid_1 = require("uuid");
const event_1 = require("../../core/event");
const types_1 = require("./types");
class SessionManager extends events_1.EventEmitter {
    constructor(eventSystem, config, logger) {
        super();
        this.sessions = new Map();
        this.idleTimeouts = new Map();
        this.rateLimitData = new Map();
        this.eventSystem = eventSystem;
        this.config = config;
        this.logger = logger || console;
        setInterval(() => this.cleanup(), 60000);
    }
    createSession(socket) {
        const sessionId = (0, uuid_1.v4)();
        const session = {
            id: sessionId,
            socket,
            state: types_1.SessionState.AUTHENTICATING,
            authenticated: false,
            connectedAt: new Date(),
            lastActivity: new Date(),
            remoteAddress: socket.remoteAddress || 'unknown',
            remotePort: socket.remotePort || 0
        };
        this.sessions.set(sessionId, session);
        this.setupSocketHandlers(session);
        this.startIdleTimeout(session);
        this.eventSystem.emit(new event_1.GameEvent(types_1.NetworkEventTypes.SESSION_CONNECTED, 'network', sessionId, { session: this.getSessionInfo(session) }));
        this.logger.log(`Session created: ${sessionId} from ${session.remoteAddress}:${session.remotePort}`);
        return session;
    }
    getSession(sessionId) {
        return this.sessions.get(sessionId);
    }
    getAllSessions() {
        return Array.from(this.sessions.values());
    }
    getSessionsByState(state) {
        return this.getAllSessions().filter(session => session.state === state);
    }
    getSessionCount() {
        return this.sessions.size;
    }
    updateActivity(sessionId) {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.lastActivity = new Date();
            this.resetIdleTimeout(session);
        }
    }
    async authenticateSession(sessionId, username, password, userId, role) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return { success: false, message: 'Session not found' };
        }
        if (session.authenticated) {
            return { success: false, message: 'Already authenticated' };
        }
        const authResult = {
            success: true,
            username: username,
            message: `Welcome, ${username}!`
        };
        if (authResult.success) {
            session.username = authResult.username;
            session.userId = userId;
            session.role = role || types_1.UserRole.PLAYER;
            session.authenticated = true;
            session.state = types_1.SessionState.CONNECTED;
            this.eventSystem.emit(new event_1.GameEvent(types_1.NetworkEventTypes.SESSION_AUTHENTICATED, 'network', sessionId, {
                session: this.getSessionInfo(session),
                username: authResult.username,
                userId: userId,
                role: session.role
            }));
            this.logger.log(`Session authenticated: ${sessionId} as ${username} with role ${session.role}`);
        }
        return authResult;
    }
    async loadPersistentSession(sessionId, userId) {
        this.logger.log(`Attempting to load persistent session for user ${userId}`);
        return false;
    }
    async savePersistentSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session || !session.authenticated) {
            return;
        }
        this.logger.log(`Saving persistent session data for ${sessionId} (${session.username})`);
        this.eventSystem.emit(new event_1.GameEvent('network.session.persist', 'network', sessionId, {
            session: this.getSessionInfo(session),
            action: 'save'
        }));
    }
    async restorePersistentSession(sessionId, persistentData) {
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
                session.state = types_1.SessionState.CONNECTED;
            }
            this.logger.log(`Restored persistent session for ${sessionId} (${session.username})`);
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to restore persistent session ${sessionId}:`, error);
            return false;
        }
    }
    disconnectSession(sessionId, reason = 'Disconnected by server') {
        const session = this.sessions.get(sessionId);
        if (!session)
            return;
        session.state = types_1.SessionState.DISCONNECTING;
        this.clearIdleTimeout(sessionId);
        this.sendToSession(sessionId, `\n${reason}\n`, 'system');
        session.socket.end();
        this.eventSystem.emit(new event_1.GameEvent(types_1.NetworkEventTypes.SESSION_DISCONNECTED, 'network', sessionId, {
            session: this.getSessionInfo(session),
            reason
        }));
        this.logger.log(`Session disconnected: ${sessionId} (${reason})`);
    }
    sendToSession(sessionId, content, type = 'info') {
        const session = this.sessions.get(sessionId);
        if (!session || session.state !== types_1.SessionState.CONNECTED) {
            return false;
        }
        try {
            session.socket.write(content + '\n');
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to send message to session ${sessionId}:`, error);
            return false;
        }
    }
    broadcastMessage(content, type = 'broadcast', excludeSessionId) {
        for (const [sessionId, session] of this.sessions) {
            if (sessionId !== excludeSessionId && session.state === types_1.SessionState.CONNECTED) {
                this.sendToSession(sessionId, content, type);
            }
        }
    }
    isRateLimited(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return false;
        const now = Date.now();
        const rateData = this.rateLimitData.get(sessionId);
        if (!rateData) {
            this.rateLimitData.set(sessionId, { count: 1, resetTime: now + this.config.rateLimitWindow });
            return false;
        }
        if (now > rateData.resetTime) {
            rateData.count = 1;
            rateData.resetTime = now + this.config.rateLimitWindow;
            return false;
        }
        if (rateData.count >= this.config.rateLimitMaxRequests) {
            this.eventSystem.emit(new event_1.GameEvent(types_1.NetworkEventTypes.SESSION_RATE_LIMITED, 'network', sessionId, { session: this.getSessionInfo(session) }));
            return true;
        }
        rateData.count++;
        return false;
    }
    setupSocketHandlers(session) {
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
        socket.setTimeout(this.config.connectionTimeout);
    }
    handleSocketData(session, data) {
        if (this.isRateLimited(session.id)) {
            this.sendToSession(session.id, 'Rate limit exceeded. Please slow down.', 'error');
            return;
        }
        this.updateActivity(session.id);
        const dataStr = data.toString('utf8').trim();
        if (this.handleTelnetCommands(session, data)) {
            return;
        }
        if (dataStr.length > 0) {
            this.handleUserInput(session, dataStr);
        }
    }
    handleTelnetCommands(session, data) {
        let hasTelnetCommands = false;
        for (let i = 0; i < data.length; i++) {
            if (data[i] === types_1.TelnetCommand.IAC) {
                hasTelnetCommands = true;
                i += this.processTelnetCommand(session, data, i);
            }
        }
        return hasTelnetCommands;
    }
    processTelnetCommand(session, data, index) {
        if (index + 1 >= data.length)
            return 1;
        const command = data[index + 1];
        switch (command) {
            case types_1.TelnetCommand.WILL:
            case types_1.TelnetCommand.WONT:
            case types_1.TelnetCommand.DO:
            case types_1.TelnetCommand.DONT: {
                if (index + 2 >= data.length)
                    return 2;
                const option = data[index + 2];
                this.handleTelnetOption(session, command, option);
                return 3;
            }
            default:
                return 2;
        }
    }
    handleTelnetOption(session, command, option) {
        const response = Buffer.from([types_1.TelnetCommand.IAC]);
        switch (command) {
            case types_1.TelnetCommand.WILL:
                response[1] = types_1.TelnetCommand.DO;
                break;
            case types_1.TelnetCommand.WONT:
                response[1] = types_1.TelnetCommand.DONT;
                break;
            case types_1.TelnetCommand.DO:
                response[1] = types_1.TelnetCommand.WILL;
                break;
            case types_1.TelnetCommand.DONT:
                response[1] = types_1.TelnetCommand.WONT;
                break;
        }
        response[2] = option;
        session.socket.write(response);
    }
    handleUserInput(session, input) {
        this.eventSystem.emit(new event_1.GameEvent(types_1.NetworkEventTypes.COMMAND_RECEIVED, session.id, undefined, {
            sessionId: session.id,
            command: input,
            timestamp: new Date()
        }));
    }
    handleSocketClose(session, hadError) {
        this.logger.log(`Socket closed for session ${session.id}, error: ${hadError}`);
        this.removeSession(session.id, hadError ? 'Socket error' : 'Connection closed');
    }
    handleSocketError(session, error) {
        this.logger.error(`Socket error for session ${session.id}:`, error);
        this.removeSession(session.id, `Socket error: ${error.message}`);
    }
    handleSocketTimeout(session) {
        this.logger.log(`Socket timeout for session ${session.id}`);
        this.disconnectSession(session.id, 'Connection timeout');
    }
    removeSession(sessionId, reason) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return;
        this.clearIdleTimeout(sessionId);
        this.rateLimitData.delete(sessionId);
        this.sessions.delete(sessionId);
        if (session.state !== types_1.SessionState.DISCONNECTED) {
            session.state = types_1.SessionState.DISCONNECTED;
            this.eventSystem.emit(new event_1.GameEvent(types_1.NetworkEventTypes.SESSION_DISCONNECTED, 'network', sessionId, {
                session: this.getSessionInfo(session),
                reason
            }));
        }
        this.logger.log(`Session removed: ${sessionId} (${reason})`);
    }
    startIdleTimeout(session) {
        const timeout = setTimeout(() => {
            this.handleIdleTimeout(session.id);
        }, this.config.idleTimeout);
        this.idleTimeouts.set(session.id, timeout);
    }
    resetIdleTimeout(session) {
        this.clearIdleTimeout(session.id);
        this.startIdleTimeout(session);
    }
    clearIdleTimeout(sessionId) {
        const timeout = this.idleTimeouts.get(sessionId);
        if (timeout) {
            clearTimeout(timeout);
            this.idleTimeouts.delete(sessionId);
        }
    }
    handleIdleTimeout(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return;
        this.eventSystem.emit(new event_1.GameEvent(types_1.NetworkEventTypes.SESSION_IDLE_TIMEOUT, 'network', sessionId, { session: this.getSessionInfo(session) }));
        this.disconnectSession(sessionId, 'Idle timeout');
    }
    getSessionInfo(session) {
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
    cleanup() {
        const now = Date.now();
        for (const [sessionId, rateData] of this.rateLimitData) {
            if (now > rateData.resetTime) {
                this.rateLimitData.delete(sessionId);
            }
        }
        for (const [sessionId, session] of this.sessions) {
            const idleTime = now - session.lastActivity.getTime();
            if (idleTime > this.config.idleTimeout * 2) {
                this.logger.warn(`Force disconnecting idle session: ${sessionId}`);
                this.disconnectSession(sessionId, 'Forced idle cleanup');
            }
        }
    }
    getStatistics() {
        const sessions = this.getAllSessions();
        const stats = {
            totalSessions: sessions.length,
            authenticatedSessions: sessions.filter(s => s.authenticated).length,
            connectingSessions: sessions.filter(s => s.state === types_1.SessionState.CONNECTING).length,
            connectedSessions: sessions.filter(s => s.state === types_1.SessionState.CONNECTED).length,
            sessionsByState: {}
        };
        for (const state of Object.values(types_1.SessionState)) {
            stats.sessionsByState[state] = sessions.filter(s => s.state === state).length;
        }
        return stats;
    }
}
exports.SessionManager = SessionManager;
//# sourceMappingURL=session.js.map