"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerManager = void 0;
const events_1 = require("events");
const event_1 = require("../../core/event");
const event_2 = require("../../core/event");
const player_1 = require("./player");
class PlayerManager extends events_1.EventEmitter {
    constructor(eventSystem, logger) {
        super();
        this.activePlayers = new Map();
        this.eventSystem = eventSystem;
        this.logger = logger || console;
        this.setupEventHandlers();
    }
    setupEventHandlers() {
        this.eventSystem.on(event_2.EventTypes.PLAYER_JOINED, (event) => {
            this.logger.log(`Player joined: ${event.source}`);
        });
        this.eventSystem.on(event_2.EventTypes.PLAYER_LEFT, (event) => {
            this.logger.log(`Player left: ${event.source}`);
            this.removePlayerBySessionId(event.source);
        });
    }
    addPlayer(sessionId, player) {
        this.activePlayers.set(sessionId, player);
        this.logger.log(`Player added: ${player.username} (session: ${sessionId})`);
        this.eventSystem.emit(new event_1.GameEvent(event_2.EventTypes.PLAYER_JOINED, sessionId, undefined, { username: player.username, playerId: player.id }));
    }
    getPlayerBySessionId(sessionId) {
        return this.activePlayers.get(sessionId);
    }
    getPlayerByUsername(username) {
        for (const player of this.activePlayers.values()) {
            if (player.username === username) {
                return player;
            }
        }
        return undefined;
    }
    removePlayerBySessionId(sessionId) {
        const player = this.activePlayers.get(sessionId);
        if (player) {
            this.activePlayers.delete(sessionId);
            this.logger.log(`Player removed: ${player.username} (session: ${sessionId})`);
            return true;
        }
        return false;
    }
    getAllActivePlayers() {
        return Array.from(this.activePlayers.values());
    }
    getAllActiveSessionIds() {
        return Array.from(this.activePlayers.keys());
    }
    hasActivePlayer(sessionId) {
        return this.activePlayers.has(sessionId);
    }
    getPlayerCount() {
        return this.activePlayers.size;
    }
    createPlayer(sessionId, username, initialRoomId = 'tavern') {
        const player = new player_1.Player(username, sessionId, initialRoomId);
        this.addPlayer(sessionId, player);
        return player;
    }
    loadPlayer(sessionId, playerData) {
        const player = player_1.Player.fromSaveData(playerData);
        player.sessionId = sessionId;
        this.addPlayer(sessionId, player);
        return player;
    }
    getStatistics() {
        return {
            activePlayers: this.activePlayers.size,
            players: Array.from(this.activePlayers.values()).map(player => ({
                id: player.id,
                username: player.username,
                sessionId: player.sessionId,
                currentRoomId: player.currentRoomId,
                level: player.stats.level
            }))
        };
    }
    cleanup() {
        this.activePlayers.clear();
        this.logger.log('Player manager cleaned up');
    }
}
exports.PlayerManager = PlayerManager;
//# sourceMappingURL=player-manager.js.map