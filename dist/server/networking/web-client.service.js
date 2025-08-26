"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebClientService = void 0;
const common_1 = require("@nestjs/common");
const event_1 = require("../../engine/core/event");
const telnet_server_1 = require("../../engine/modules/networking/telnet-server");
const ansi_1 = require("../../engine/modules/networking/ansi");
const types_1 = require("../../engine/modules/networking/types");
const world_manager_1 = require("../../engine/modules/world/world-manager");
const player_manager_1 = require("../../engine/modules/persistence/player-manager");
const user_service_1 = require("./user.service");
const user_types_1 = require("./user.types");
let WebClientService = class WebClientService {
    constructor(userService, eventSystem, telnetServer, worldManager, playerManager) {
        this.logger = new common_1.Logger('WebClientService');
        this.webSessions = new Map();
        this.outbound = new Map();
        this.userService = userService;
        this.eventSystem = eventSystem;
        this.telnetServer = telnetServer;
        this.worldManager = worldManager;
        this.playerManager = playerManager;
        this.sessionManager = this.telnetServer.getSessionManager();
        this.commandParser = this.telnetServer.getCommandParser();
        this.setupEventHandlers();
    }
    setupEventHandlers() {
        this.eventSystem.on(event_1.EventTypes.PLAYER_MESSAGE, (event) => {
            if (!event.data)
                return;
            const { message, type } = event.data;
            const senderId = String(event.source);
            const senderPlayer = this.playerManager.getPlayerBySessionId(senderId);
            if (!senderPlayer)
                return;
            const payload = { type: type === 'global' ? 'broadcast' : 'user', content: `${senderPlayer.username}: ${message}` };
            if (type === 'global') {
                for (const [webId, engineId] of this.webSessions) {
                    if (engineId !== senderId)
                        this.emitToWeb(webId, payload);
                }
            }
            else {
                const roomId = senderPlayer.currentRoomId;
                for (const [webId, engineId] of this.webSessions) {
                    if (engineId === senderId)
                        continue;
                    const p = this.playerManager.getPlayerBySessionId(engineId);
                    if (p && p.currentRoomId === roomId) {
                        this.emitToWeb(webId, payload);
                    }
                }
            }
        });
        this.eventSystem.on('player.move', (event) => {
            const sessionId = String(event.source);
            const { direction, fromRoomId } = event.data || {};
            const player = this.playerManager.getPlayerBySessionId(sessionId);
            const webClientId = this.getWebClientIdBySessionId(sessionId);
            if (!player || !direction || !webClientId)
                return;
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
        this.eventSystem.on(types_1.NetworkEventTypes.SESSION_AUTHENTICATED, (event) => {
            const sessionId = String(event.source);
            const webClientId = this.getWebClientIdBySessionId(sessionId);
            if (webClientId) {
                const username = (event.data && (event.data.username || event.data.session?.username)) || 'player';
                this.emitToWeb(webClientId, { type: 'system', content: `Authenticated as ${username}` });
            }
        });
    }
    async createWebSession(webClientId) {
        this.logger.log(`Creating web session for client: ${webClientId}`);
        const engineSessionId = `web_${webClientId}_${Date.now()}`;
        this.webSessions.set(webClientId, engineSessionId);
        return engineSessionId;
    }
    async authenticateWebSession(webClientId, username, password) {
        const engineSessionId = this.webSessions.get(webClientId);
        if (!engineSessionId) {
            return { success: false, message: 'Web session not found' };
        }
        const startRoomIdResolved = this.worldManager.getStartingRoomId() || this.worldManager.getAllRooms()[0]?.id || this.worldManager['config']?.defaultRoomId || 'tavern';
        const player = this.playerManager.createPlayer(engineSessionId, username, startRoomIdResolved);
        const startRoomId = player.currentRoomId;
        const room = this.worldManager.getRoom(startRoomId);
        if (room && !room.players.includes(engineSessionId)) {
            room.players.push(engineSessionId);
        }
        await this.eventSystem.emit(new event_1.GameEvent(types_1.NetworkEventTypes.SESSION_AUTHENTICATED, 'web', engineSessionId, { username, webClientId }));
        await this.eventSystem.emit(new event_1.GameEvent(event_1.EventTypes.PLAYER_JOINED, engineSessionId));
        return {
            success: true,
            username,
            message: `Welcome, ${username}!`
        };
    }
    async authenticateWebSessionWithRole(webClientId, username, password, userId, role) {
        const engineSessionId = this.webSessions.get(webClientId);
        if (!engineSessionId) {
            return { success: false, message: 'Web session not found' };
        }
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
        this.eventSystem.emit(new event_1.GameEvent(types_1.NetworkEventTypes.SESSION_AUTHENTICATED, 'web-client', engineSessionId, { username, webClientId, userId, role }));
        return {
            success: true,
            username,
            message: `Welcome, ${username}!`
        };
    }
    async executeCommand(webClientId, command) {
        const engineSessionId = this.webSessions.get(webClientId);
        if (!engineSessionId) {
            throw new Error('Web session not found');
        }
        const trimmed = command.trim();
        if (!trimmed)
            return '';
        const args = [];
        let current = '';
        let inQuotes = false;
        let quoteChar = '';
        for (let i = 0; i < trimmed.length; i++) {
            const ch = trimmed[i];
            if (!inQuotes && (ch === '"' || ch === '\'')) {
                inQuotes = true;
                quoteChar = ch;
            }
            else if (inQuotes && ch === quoteChar) {
                inQuotes = false;
                quoteChar = '';
            }
            else if (!inQuotes && ch === ' ') {
                if (current.length > 0) {
                    args.push(current);
                    current = '';
                }
            }
            else {
                current += ch;
            }
        }
        if (current.length > 0)
            args.push(current);
        if (args.length === 0)
            return '';
        const cmd = (args.shift() || '').toLowerCase();
        const handler = this.commandParser.getCommandHandler(cmd);
        if (!handler) {
            return ansi_1.ColorScheme.error(`Unknown command: ${cmd}. Type 'help' for available commands.`);
        }
        const response = await handler.handler(engineSessionId, args, trimmed);
        return typeof response === 'string' ? response : '';
    }
    async getGameState(webClientId) {
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
    async disconnectWebSession(webClientId) {
        const engineSessionId = this.webSessions.get(webClientId);
        if (engineSessionId) {
            this.eventSystem.emit(new event_1.GameEvent(event_1.EventTypes.PLAYER_LEFT, engineSessionId, undefined, { reason: 'Web client disconnected' }));
            this.webSessions.delete(webClientId);
            this.logger.log(`Web session disconnected: ${webClientId} -> ${engineSessionId}`);
        }
    }
    getWebClientIdBySessionId(sessionId) {
        for (const [webClientId, engineSessionId] of this.webSessions) {
            if (engineSessionId === sessionId) {
                return webClientId;
            }
        }
        return undefined;
    }
    getWebClientId(sessionId) {
        return this.getWebClientIdBySessionId(sessionId);
    }
    getActiveWebSessions() {
        return Array.from(this.webSessions.keys());
    }
    async checkUserPermission(userId, requiredRole) {
        return await this.userService.checkPermission({ userId, requiredRole });
    }
    async checkAdminOperation(webClientId, operation) {
        const sessionData = await this.userService.getSessionData(webClientId);
        if (!sessionData || !sessionData.userId) {
            return false;
        }
        return await this.userService.checkPermission({
            userId: sessionData.userId,
            requiredRole: user_types_1.UserRole.ADMIN,
            action: operation
        });
    }
    async storeSessionData(webClientId, sessionData) {
        await this.userService.saveSessionData(webClientId, sessionData);
    }
    async getSessionData(webClientId) {
        return await this.userService.getSessionData(webClientId);
    }
    async loadPersistentSession(webClientId, userId) {
        const sessionData = await this.userService.getSessionData(webClientId);
        if (sessionData) {
            return sessionData;
        }
        this.logger.log(`No persistent session found for web client ${webClientId}, user ${userId}`);
        return null;
    }
    async saveSessionForPersistence(webClientId) {
        const sessionData = await this.getSessionData(webClientId);
        if (sessionData) {
            await this.storeSessionData(webClientId, {
                ...sessionData,
                lastSaved: new Date()
            });
            this.logger.log(`Saved session data for persistence: ${webClientId}`);
        }
    }
    registerOutbound(webClientId, fn) {
        this.outbound.set(webClientId, fn);
    }
    unregisterOutbound(webClientId) {
        this.outbound.delete(webClientId);
    }
    emitToWeb(webClientId, payload) {
        const fn = this.outbound.get(webClientId);
        if (fn)
            fn(payload);
    }
    stripAnsi(input) {
        if (!input)
            return input;
        const ansiRegex = /[\u001B\u009B][[\]()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;
        return input.replace(ansiRegex, '');
    }
};
exports.WebClientService = WebClientService;
exports.WebClientService = WebClientService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [user_service_1.UserService,
        event_1.EventSystem,
        telnet_server_1.TelnetServer,
        world_manager_1.WorldManager,
        player_manager_1.PlayerManager])
], WebClientService);
//# sourceMappingURL=web-client.service.js.map