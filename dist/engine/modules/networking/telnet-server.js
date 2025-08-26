"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelnetServer = void 0;
const net = __importStar(require("net"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const events_1 = require("events");
const event_1 = require("../../core/event");
const event_2 = require("../../core/event");
const ansi_1 = require("./ansi");
const session_1 = require("./session");
const command_parser_1 = require("./command-parser");
const username_validator_1 = require("./username-validator");
const types_1 = require("./types");
class TelnetServer extends events_1.EventEmitter {
    constructor(eventSystem, config, playerManager, logger, worldManager) {
        super();
        this.isRunning = false;
        this.eventSystem = eventSystem;
        this.config = config;
        this.playerManager = playerManager;
        this.worldManager = worldManager;
        this.logger = logger || console;
        this.sessionManager = new session_1.SessionManager(eventSystem, config, logger);
        this.commandParser = new command_parser_1.CommandParser(eventSystem, this.sessionManager, playerManager, logger, worldManager);
        this.setupEventHandlers();
    }
    async start() {
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
                    this.eventSystem.emit(new event_1.GameEvent(types_1.NetworkEventTypes.SERVER_ERROR, 'network', undefined, { error: error.message }));
                });
                this.server.listen(this.config.port, this.config.host, () => {
                    this.isRunning = true;
                    this.logger.log(`Telnet server started on ${this.config.host}:${this.config.port}`);
                    this.eventSystem.emit(new event_1.GameEvent(types_1.NetworkEventTypes.SERVER_STARTED, 'network', undefined, {
                        host: this.config.host,
                        port: this.config.port,
                        maxConnections: this.config.maxConnections
                    }));
                    resolve();
                });
                this.server.on('close', () => {
                    this.isRunning = false;
                    this.logger.log('Telnet server stopped');
                    this.eventSystem.emit(new event_1.GameEvent(types_1.NetworkEventTypes.SERVER_STOPPED, 'network', undefined, { timestamp: new Date() }));
                });
            }
            catch (error) {
                reject(error);
            }
        });
    }
    async stop() {
        if (!this.isRunning || !this.server) {
            return;
        }
        return new Promise((resolve) => {
            const sessions = this.sessionManager.getAllSessions();
            for (const session of sessions) {
                this.sessionManager.disconnectSession(session.id, 'Server shutting down');
            }
            this.server.close(() => {
                resolve();
            });
        });
    }
    handleConnection(socket) {
        if (this.sessionManager.getSessionCount() >= this.config.maxConnections) {
            socket.write(ansi_1.ColorScheme.error('Server is full. Please try again later.\n'));
            socket.end();
            return;
        }
        const session = this.sessionManager.createSession(socket);
        this.sendWelcomeMessage(session);
        this.setupSessionEventHandlers(session);
    }
    sendWelcomeMessage(session) {
        const welcome = [
            ansi_1.Ansi.clearScreen(),
            ansi_1.Ansi.brightWhite('╔══════════════════════════════════════════════════════════════╗'),
            ansi_1.Ansi.brightWhite('║                    Welcome to MUD Engine                     ║'),
            ansi_1.Ansi.brightWhite('╚══════════════════════════════════════════════════════════════╝'),
            '',
            ansi_1.ColorScheme.info('Please enter your username to begin:'),
            '',
            ansi_1.ColorScheme.info('Username Rules:'),
            ansi_1.ColorScheme.info('• 3-20 characters long'),
            ansi_1.ColorScheme.info('• Letters, numbers, underscores, and hyphens only'),
            ansi_1.ColorScheme.info('• No reserved names or inappropriate content'),
            '',
            ansi_1.Ansi.brightGreen('Username: '),
            ''
        ].join('\n');
        this.sessionManager.sendToSession(session.id, welcome, 'system');
    }
    setupEventHandlers() {
        this.eventSystem.on(types_1.NetworkEventTypes.COMMAND_RECEIVED, async (event) => {
            if (!event.data)
                return;
            const { sessionId, command, args, raw } = event.data;
            try {
                const response = await this.commandParser.parseCommand(sessionId, raw);
                if (response) {
                    this.sessionManager.sendToSession(sessionId, response);
                }
                this.sendPrompt(sessionId);
            }
            catch (error) {
                this.logger.error(`Error handling command '${raw}' for session ${sessionId}:`, error);
                this.sessionManager.sendToSession(sessionId, ansi_1.ColorScheme.error('An error occurred processing your command.'));
                this.sendPrompt(sessionId);
            }
        });
        this.eventSystem.on(event_2.EventTypes.PLAYER_JOINED, (event) => {
            const sessionId = event.source;
            const session = this.sessionManager.getSession(sessionId);
            if (session?.username) {
                const joinMessage = ansi_1.ColorScheme.system(`${session.username} has joined the game.`);
                this.sessionManager.broadcastMessage(joinMessage, 'system', sessionId);
                this.sessionManager.sendToSession(sessionId, ansi_1.ColorScheme.success(`\nWelcome, ${session.username}! You are now connected.\n`));
                this.sendPrompt(sessionId);
            }
        });
        this.eventSystem.on(event_2.EventTypes.PLAYER_LEFT, (event) => {
            const sessionId = event.source;
            const session = this.sessionManager.getSession(sessionId);
            if (session?.username) {
                const leaveMessage = ansi_1.ColorScheme.system(`${session.username} has left the game.`);
                this.sessionManager.broadcastMessage(leaveMessage, 'system', sessionId);
                if (this.playerManager) {
                    this.playerManager.removePlayerBySessionId(sessionId);
                }
            }
        });
        this.eventSystem.on(types_1.NetworkEventTypes.SESSION_AUTHENTICATED, (event) => {
            const sessionId = event.source;
            const session = this.sessionManager.getSession(sessionId);
            if (session?.username) {
                this.eventSystem.emit(new event_1.GameEvent(event_2.EventTypes.PLAYER_JOINED, sessionId, undefined, { username: session.username }));
            }
        });
    }
    async usernameExists(username) {
        try {
            const dataDir = path.join(process.cwd(), 'data');
            const playersDir = path.join(dataDir, 'players');
            if (!fs.existsSync(playersDir)) {
                return false;
            }
            const files = fs.readdirSync(playersDir).filter(file => file.endsWith('.json'));
            for (const file of files) {
                try {
                    const filePath = path.join(playersDir, file);
                    const content = fs.readFileSync(filePath, 'utf8');
                    const saveData = JSON.parse(content);
                    if (saveData.data && saveData.data.username === username) {
                        return true;
                    }
                }
                catch (error) {
                    this.logger.warn(`Skipping malformed player save file: ${file}`);
                }
            }
            return false;
        }
        catch (error) {
            this.logger.error('Error checking username existence:', error);
            return false;
        }
    }
    setupSessionEventHandlers(session) {
        if (session.state === types_1.SessionState.AUTHENTICATING) {
            this.startAuthenticationProcess(session);
        }
    }
    async startAuthenticationProcess(session) {
        const usernameHandler = async (event) => {
            if (event.source !== session.id || !event.data)
                return;
            const { command } = event.data;
            const username = username_validator_1.UsernameValidator.sanitizeUsername(command);
            const validation = username_validator_1.UsernameValidator.validateUsername(username);
            if (!validation.valid) {
                const errorMessage = '\n' + validation.errors.map(error => ansi_1.ColorScheme.error(`• ${error}`)).join('\n');
                this.sessionManager.sendToSession(session.id, errorMessage);
                if (validation.warnings.length > 0) {
                    const warningMessage = '\n' + validation.warnings.map(warning => ansi_1.ColorScheme.info(`• ${warning}`)).join('\n');
                    this.sessionManager.sendToSession(session.id, warningMessage);
                }
                this.sessionManager.sendToSession(session.id, '\n' + ansi_1.Ansi.brightGreen('Username: '));
                return;
            }
            const exists = await this.usernameExists(username);
            if (exists) {
                this.sessionManager.sendToSession(session.id, ansi_1.ColorScheme.error(`\nUsername '${username}' is already taken. Please choose a different username.`));
                this.sessionManager.sendToSession(session.id, '\n' + ansi_1.Ansi.brightGreen('Username: '));
                return;
            }
            this.eventSystem.off(types_1.NetworkEventTypes.COMMAND_RECEIVED, usernameHandler);
            await this.authenticateSession(session.id, username, 'password');
        };
        this.eventSystem.on(types_1.NetworkEventTypes.COMMAND_RECEIVED, usernameHandler);
    }
    async authenticateSession(sessionId, username, password) {
        this.sessionManager.sendToSession(sessionId, ansi_1.Ansi.brightGreen(`\nAuthenticating as ${username}...\n`));
        try {
            const authResult = await this.sessionManager.authenticateSession(sessionId, username, password);
            if (authResult.success) {
                if (this.playerManager) {
                    let player = this.playerManager.getPlayerByUsername(username);
                    if (!player) {
                        player = this.playerManager.createPlayer(sessionId, username, 'tavern');
                    }
                    else {
                        player.sessionId = sessionId;
                        this.playerManager.addPlayer(sessionId, player);
                    }
                    if (this.eventSystem && player) {
                        this.eventSystem.emit(new event_1.GameEvent('world.room.entered', 'network', sessionId, {
                            fromRoomId: null,
                            toRoomId: player.currentRoomId,
                            username: player.username
                        }));
                    }
                }
                this.sessionManager.sendToSession(sessionId, ansi_1.ColorScheme.success(`\n🎉 Authentication successful! Welcome, ${username}!\n`));
                this.sessionManager.sendToSession(sessionId, ansi_1.ColorScheme.info('You are now connected to the MUD Engine.\n'));
                this.logger.log(`User ${username} authenticated successfully from session ${sessionId}`);
            }
            else {
                this.sessionManager.sendToSession(sessionId, ansi_1.ColorScheme.error(`\n❌ Authentication failed: ${authResult.message || 'Unknown error'}\n`));
                if (authResult.message?.includes('password')) {
                    this.sessionManager.sendToSession(sessionId, ansi_1.ColorScheme.info('Note: This is a demo server. The password is currently set to "password".\n'));
                }
                this.sessionManager.sendToSession(sessionId, ansi_1.ColorScheme.info('\nPlease try a different username or check the password.\n'));
                this.sessionManager.sendToSession(sessionId, ansi_1.Ansi.brightGreen('Username: '));
                const session = this.sessionManager.getSession(sessionId);
                if (session) {
                    this.startAuthenticationProcess(session);
                }
                this.logger.warn(`Authentication failed for username ${username} in session ${sessionId}: ${authResult.message}`);
            }
        }
        catch (error) {
            this.logger.error(`Error during authentication for session ${sessionId}:`, error);
            this.sessionManager.sendToSession(sessionId, ansi_1.ColorScheme.error('\n❌ An error occurred during authentication. Please try again.\n'));
            this.sessionManager.sendToSession(sessionId, ansi_1.Ansi.brightGreen('Username: '));
            const session = this.sessionManager.getSession(sessionId);
            if (session) {
                this.startAuthenticationProcess(session);
            }
        }
    }
    sendPrompt(sessionId) {
        const session = this.sessionManager.getSession(sessionId);
        if (session?.state === types_1.SessionState.CONNECTED) {
            const promptText = this.commandParser.getPromptFor(sessionId);
            this.sessionManager.sendToSession(sessionId, ansi_1.ColorScheme.prompt(promptText));
        }
    }
    sendMessage(sessionId, message) {
        const formattedMessage = (0, ansi_1.formatMessage)(message);
        return this.sessionManager.sendToSession(sessionId, formattedMessage, message.type);
    }
    broadcastMessage(message, excludeSessionId) {
        const formattedMessage = (0, ansi_1.formatMessage)(message);
        this.sessionManager.broadcastMessage(formattedMessage, message.type, excludeSessionId);
    }
    getStatistics() {
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
    registerCommand(handler) {
        this.commandParser.registerCommand(handler);
    }
    unregisterCommand(command) {
        return this.commandParser.unregisterCommand(command);
    }
    getSessionManager() {
        return this.sessionManager;
    }
    getCommandParser() {
        return this.commandParser;
    }
    getIsRunning() {
        return this.isRunning;
    }
}
exports.TelnetServer = TelnetServer;
//# sourceMappingURL=telnet-server.js.map