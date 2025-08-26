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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EngineService = void 0;
const common_1 = require("@nestjs/common");
const inversify_1 = require("inversify");
const entity_1 = require("./entity");
const event_1 = require("./event");
const plugin_1 = require("./plugin");
const networking_1 = require("../modules/networking");
const world_1 = require("../modules/world");
const persistence_1 = require("../modules/persistence");
const dialogue_1 = require("../modules/dialogue");
const logger_1 = require("./logger");
const DEFAULT_CONFIG = {
    maxEntities: 10000,
    tickInterval: 1000,
    enablePlugins: true,
    saveInterval: 300000,
    logLevel: 'info',
    enableNetworking: true,
    networkHost: '0.0.0.0',
    networkPort: 4000,
    maxConnections: 100,
    connectionTimeout: 30000,
    idleTimeout: 300000,
    rateLimitWindow: 10000,
    rateLimitMaxRequests: 20,
    enableWorld: true,
    worldPath: './engine/modules/world/content',
    defaultRoomId: 'tavern',
    maxItemsPerRoom: 50,
    maxPlayersPerRoom: 10,
    allowRoomCreation: false,
    pluginDirectory: './plugins',
    enablePersistence: true,
    savePath: './saves',
    backupPath: './backups',
    maxBackups: 10,
    validateOnLoad: true,
    compressionEnabled: false,
    migrationEnabled: true,
    enableDialogue: true,
    dialogueContentPath: './engine/modules/world/content',
    maxConversationsPerPlayer: 5,
    conversationTimeoutMinutes: 30
};
let EngineService = class EngineService {
    constructor() {
        this.isRunning = false;
        this.config = { ...DEFAULT_CONFIG };
        this.logger = new logger_1.SimpleLogger(this.config.logLevel);
        this.container = new inversify_1.Container();
        this.entityManager = new entity_1.EntityManager();
        this.eventSystem = new event_1.EventSystem(this.logger);
        this.pluginManager = new plugin_1.PluginManager(this.container, this.eventSystem, this.entityManager, this.logger);
        this.pluginLoader = new plugin_1.PluginLoader(this.pluginManager);
        this.initializeEngine();
    }
    async initializeEngine() {
        this.logger.info('🚀 Initializing MUD Engine...');
        this.container.bind('EntityManager').toConstantValue(this.entityManager);
        this.container.bind('EventSystem').toConstantValue(this.eventSystem);
        this.container.bind('PluginManager').toConstantValue(this.pluginManager);
        this.container.bind('EngineService').toConstantValue(this);
        if (this.config.enableNetworking) {
            await this.initializeNetworking();
        }
        if (this.config.enableWorld) {
            await this.initializeWorld();
        }
        if (this.config.enablePersistence) {
            await this.initializePersistence();
        }
        if (this.config.enableDialogue) {
            await this.initializeDialogue();
            if (this.config.enableNetworking && this.telnetServer) {
                this.registerDialogueCommands(this.telnetServer.getCommandParser());
            }
        }
        if (this.config.enablePersistence && this.config.enableNetworking && this.telnetServer) {
            this.registerSaveCommands(this.telnetServer.getCommandParser());
        }
        this.setupEventHandlers();
        this.logger.info('✅ Engine initialized');
    }
    async initializeNetworking() {
        console.log('🌐 Initializing networking...');
        const networkConfig = {
            host: this.config.networkHost,
            port: this.config.networkPort,
            maxConnections: this.config.maxConnections,
            connectionTimeout: this.config.connectionTimeout,
            idleTimeout: this.config.idleTimeout,
            rateLimitWindow: this.config.rateLimitWindow,
            rateLimitMaxRequests: this.config.rateLimitMaxRequests,
            enableLogging: this.config.logLevel === 'debug',
            logLevel: this.config.logLevel
        };
        this.telnetServer = new networking_1.TelnetServer(this.eventSystem, networkConfig, this.playerManager, console);
        console.log('✅ Networking initialized');
    }
    async initializeWorld() {
        this.logger.info('🌍 Initializing world...');
        const worldConfig = {
            contentPath: this.config.worldPath,
            defaultRoomId: this.config.defaultRoomId,
            maxItemsPerRoom: this.config.maxItemsPerRoom,
            maxPlayersPerRoom: this.config.maxPlayersPerRoom,
            allowRoomCreation: this.config.allowRoomCreation
        };
        this.worldManager = new world_1.WorldManager(this.eventSystem, worldConfig, this.logger, this.playerManager);
        try {
            await this.worldManager.loadWorld();
            this.logger.info('✅ World loaded successfully');
        }
        catch (error) {
            this.logger.warn('⚠️  Failed to load world, creating empty world:', error);
        }
        this.logger.info('✅ World initialized');
    }
    async initializePersistence() {
        console.log('💾 Initializing persistence...');
        const persistenceConfig = {
            savePath: this.config.savePath,
            backupPath: this.config.backupPath,
            autoSaveInterval: this.config.saveInterval,
            maxBackups: this.config.maxBackups,
            compressionEnabled: this.config.compressionEnabled,
            validateOnLoad: this.config.validateOnLoad,
            migrationEnabled: this.config.migrationEnabled
        };
        this.saveManager = new persistence_1.SaveManager(persistenceConfig, this.eventSystem, console);
        this.playerManager = new persistence_1.PlayerManager(this.eventSystem, console);
        if (this.worldManager) {
            this.worldManager.setPlayerManager(this.playerManager);
        }
        console.log('✅ Persistence initialized');
    }
    async initializeDialogue() {
        this.logger.info('💬 Initializing dialogue...');
        this.dialogueManager = new dialogue_1.DialogueManager(this.eventSystem, this.logger);
        const dialogueConfig = {
            enablePersistence: this.config.enablePersistence,
            maxConversationsPerPlayer: this.config.maxConversationsPerPlayer,
            conversationTimeoutMinutes: this.config.conversationTimeoutMinutes,
            autoSaveIntervalSeconds: 300,
            defaultProvider: 'canned-branching',
            providers: {},
            contentPath: this.config.dialogueContentPath
        };
        await this.dialogueManager.initialize(dialogueConfig);
        this.logger.info('✅ Dialogue initialized');
    }
    setupEventHandlers() {
        this.eventSystem.on(event_1.EventTypes.ENTITY_CREATED, (event) => {
            this.logger.debug(`📦 Entity created: ${event.data?.entity?.name || 'Unknown'}`);
        });
        this.eventSystem.on(event_1.EventTypes.ENTITY_DESTROYED, (event) => {
            this.logger.debug(`💥 Entity destroyed: ${event.data?.entityId || 'Unknown'}`);
        });
        this.eventSystem.on(event_1.EventTypes.PLAYER_JOINED, (event) => {
            this.logger.info(`👤 Player joined: ${event.source}`);
        });
        this.eventSystem.on(event_1.EventTypes.PLAYER_LEFT, (event) => {
            this.logger.info(`👋 Player left: ${event.source}`);
            if (this.playerManager && this.worldManager) {
                const leaving = this.playerManager.getPlayerBySessionId(event.source);
                if (leaving) {
                    const roomPlayers = this.worldManager.getPlayersInRoom(leaving.currentRoomId).filter(id => id !== leaving.sessionId);
                    if (roomPlayers.length) {
                        const msg = `${networking_1.Ansi.brightGreen(leaving.username)} has left the room.`;
                        for (const id of roomPlayers)
                            this.sendMessageToSession(id, msg, 'info');
                    }
                    this.eventSystem.emit(new event_1.GameEvent('world.room.left', 'engine', leaving.sessionId, { fromRoomId: leaving.currentRoomId, toRoomId: null }));
                }
            }
        });
        this.eventSystem.on(event_1.EventTypes.PLAYER_MESSAGE, this.handlePlayerMessage.bind(this));
        this.eventSystem.on('world.room.entered', this.handleRoomEntered.bind(this));
        this.eventSystem.on('world.room.left', this.handleRoomLeft.bind(this));
        this.eventSystem.on('player.move', this.handlePlayerMove.bind(this));
        this.eventSystem.on(event_1.EventTypes.GAME_STARTED, (event) => {
            this.logger.info('🎮 Game started');
        });
        this.eventSystem.on(event_1.EventTypes.GAME_ENDED, (event) => {
            this.logger.info('🏁 Game ended');
        });
    }
    async start() {
        if (this.isRunning) {
            this.logger.warn('⚠️  Engine already running');
            return;
        }
        this.logger.info('▶️  Starting MUD Engine...');
        if (this.config.enablePlugins) {
            await this.loadPlugins();
        }
        this.startGameLoop();
        this.startAutoSave();
        if (this.config.enableNetworking && this.telnetServer) {
            await this.telnetServer.start();
        }
        if (this.config.enableWorld && this.worldManager) {
        }
        this.isRunning = true;
        await this.eventSystem.emit(new event_1.GameEvent(event_1.EventTypes.GAME_STARTED, 'engine', undefined, { timestamp: new Date() }));
        this.logger.info('✅ Engine started successfully');
    }
    async stop() {
        if (!this.isRunning) {
            this.logger.warn('⚠️  Engine not running');
            return;
        }
        this.logger.info('⏹️  Stopping MUD Engine...');
        if (this.tickInterval) {
            clearInterval(this.tickInterval);
            this.tickInterval = undefined;
        }
        if (this.saveInterval) {
            clearInterval(this.saveInterval);
            this.saveInterval = undefined;
        }
        if (this.config.enableNetworking && this.telnetServer) {
            await this.telnetServer.stop();
        }
        if (this.config.enablePlugins) {
            await this.pluginManager.unloadAllPlugins();
        }
        this.isRunning = false;
        await this.eventSystem.emit(new event_1.GameEvent(event_1.EventTypes.GAME_ENDED, 'engine', undefined, { timestamp: new Date() }));
        this.logger.info('✅ Engine stopped successfully');
    }
    async loadPlugins() {
        if (!this.config.pluginDirectory) {
            console.log('📁 No plugin directory configured');
            return;
        }
        try {
            console.log(`📦 Loading plugins from: ${this.config.pluginDirectory}`);
            await this.pluginLoader.loadFromDirectory(this.config.pluginDirectory);
            await this.pluginManager.loadAllPlugins();
            console.log('✅ Plugins loaded successfully');
        }
        catch (error) {
            console.error('❌ Failed to load plugins:', error);
        }
    }
    startGameLoop() {
        this.tickInterval = setInterval(async () => {
            try {
                await this.gameTick();
            }
            catch (error) {
                console.error('❌ Error in game tick:', error);
            }
        }, this.config.tickInterval);
    }
    async gameTick() {
        const tickEvent = new event_1.GameEvent(event_1.EventTypes.GAME_TICK, 'engine', undefined, {
            timestamp: new Date(),
            entityCount: this.entityManager.getEntityCount()
        });
        await this.eventSystem.emit(tickEvent);
    }
    startAutoSave() {
        this.saveInterval = setInterval(() => {
            this.saveGameState();
        }, this.config.saveInterval);
    }
    async saveGameState() {
        if (!this.config.enablePersistence || !this.saveManager) {
            this.logger.debug('💾 Persistence not enabled, skipping save');
            return;
        }
        try {
            this.logger.info('💾 Auto-saving game state...');
            await this.saveManager.saveFullGame('Auto-save');
            this.logger.info('✅ Game state saved');
        }
        catch (error) {
            this.logger.error('❌ Failed to save game state:', error);
        }
    }
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.logger.info('⚙️  Engine configuration updated');
    }
    async handlePlayerMessage(event) {
        const { message, type } = event.data;
        const sessionId = event.source;
        if (!message || !sessionId)
            return;
        if (!this.playerManager || !this.worldManager || !this.telnetServer) {
            this.logger.warn('Missing components for communication');
            return;
        }
        const senderPlayer = this.playerManager.getPlayerBySessionId(sessionId);
        if (!senderPlayer) {
            this.logger.warn(`Player not found for session: ${sessionId}`);
            return;
        }
        if (type === 'global') {
            const formattedMessage = `${networking_1.Ansi.brightMagenta('[GLOBAL]')} ${networking_1.Ansi.brightCyan(senderPlayer.username)} says: ${message}`;
            this.telnetServer.broadcastMessage({ content: formattedMessage, type: 'broadcast', timestamp: new Date() }, sessionId);
        }
        else {
            const roomId = senderPlayer.currentRoomId;
            const playersInRoom = this.worldManager.getPlayersInRoom(roomId);
            const recipients = playersInRoom.filter(playerId => playerId !== sessionId);
            if (recipients.length > 0) {
                const formattedMessage = `${networking_1.Ansi.brightCyan(senderPlayer.username)} says: ${message}`;
                for (const recipientId of recipients) {
                    this.sendMessageToSession(recipientId, formattedMessage, 'info');
                }
            }
        }
    }
    async handleRoomEntered(event) {
        if (!event.data)
            return;
        const { fromRoomId, toRoomId } = event.data;
        const playerId = event.target || event.source;
        if (!playerId || !toRoomId)
            return;
        if (!this.playerManager || !this.worldManager || !this.telnetServer) {
            this.logger.warn('Missing components for room notifications');
            return;
        }
        const enteringPlayer = this.playerManager.getPlayerBySessionId(playerId);
        if (!enteringPlayer) {
            this.logger.warn(`Player not found for session: ${playerId}`);
            return;
        }
        const playersInRoom = this.worldManager.getPlayersInRoom(toRoomId);
        const recipients = playersInRoom.filter(sessionId => sessionId !== playerId);
        if (recipients.length > 0) {
            const notificationMessage = `${networking_1.Ansi.brightGreen(enteringPlayer.username)} has entered the room.`;
            for (const recipientId of recipients) {
                this.sendMessageToSession(recipientId, notificationMessage, 'info');
            }
            console.log(`${enteringPlayer.username} entered room ${toRoomId}, notified ${recipients.length} other players`);
        }
    }
    async handleRoomLeft(event) {
        if (!event.data)
            return;
        const { fromRoomId } = event.data;
        const playerId = event.target || event.source;
        if (!playerId || !fromRoomId)
            return;
        if (!this.playerManager || !this.worldManager)
            return;
        const leaving = this.playerManager.getPlayerBySessionId(playerId);
        if (!leaving)
            return;
        const playersInRoom = this.worldManager.getPlayersInRoom(fromRoomId).filter(id => id !== playerId);
        if (playersInRoom.length) {
            const msg = `${networking_1.Ansi.brightGreen(leaving.username)} has left the room.`;
            for (const id of playersInRoom)
                this.sendMessageToSession(id, msg, 'info');
        }
    }
    async handlePlayerMove(event) {
        if (!event.data)
            return;
        const { direction, fromRoomId } = event.data;
        const playerId = event.source;
        if (!playerId || !direction)
            return;
        if (!this.playerManager || !this.worldManager || !this.telnetServer) {
            console.warn('Missing components for player movement');
            return;
        }
        const player = this.playerManager.getPlayerBySessionId(playerId);
        if (!player) {
            console.warn(`Player not found for session: ${playerId}`);
            return;
        }
        const exit = this.worldManager.findExit(fromRoomId, direction);
        if (!exit) {
            this.sendMessageToSession(playerId, networking_1.ColorScheme.error(`You cannot go ${direction} from here.`), 'error');
            return;
        }
        const success = this.worldManager.movePlayer(playerId, fromRoomId, exit.toRoomId);
        if (!success) {
            this.sendMessageToSession(playerId, networking_1.ColorScheme.error('Failed to move to that location.'), 'error');
            return;
        }
        player.currentRoomId = exit.toRoomId;
        this.sendMessageToSession(playerId, networking_1.ColorScheme.success(`You move ${direction}.`), 'info');
        const roomDescription = this.worldManager.getRoomDescription(exit.toRoomId, playerId);
        this.sendMessageToSession(playerId, roomDescription, 'info');
        console.log(`${player.username} moved ${direction} from ${fromRoomId} to ${exit.toRoomId}`);
    }
    getStatus() {
        const status = {
            isRunning: this.isRunning,
            entityCount: this.entityManager.getEntityCount(),
            loadedPlugins: this.pluginManager.getLoadedPlugins().length,
            config: this.config,
            eventStats: this.eventSystem.getStatistics(),
            networking: null,
            world: null,
            persistence: null,
            players: null
        };
        if (this.config.enableNetworking && this.telnetServer) {
            status.networking = {
                isRunning: this.telnetServer.getIsRunning(),
                ...this.telnetServer.getStatistics()
            };
        }
        if (this.config.enableWorld && this.worldManager) {
            status.world = this.worldManager.getStatistics();
        }
        if (this.config.enablePersistence && this.saveManager) {
            status.persistence = this.saveManager.getStatus();
        }
        if (this.config.enablePersistence && this.playerManager) {
            status.players = this.playerManager.getStatistics();
        }
        return status;
    }
    createEntity(entityClass, ...args) {
        if (this.entityManager.getEntityCount() >= this.config.maxEntities) {
            throw new Error(`Maximum entity limit reached: ${this.config.maxEntities}`);
        }
        const entity = new entityClass(...args);
        this.entityManager.addEntity(entity);
        this.eventSystem.emit(new event_1.GameEvent(event_1.EventTypes.ENTITY_CREATED, 'engine', entity.id, { entity: entity.toJSON() }));
        return entity;
    }
    removeEntity(entityId) {
        const result = this.entityManager.removeEntity(entityId);
        if (result) {
            this.eventSystem.emit(new event_1.GameEvent(event_1.EventTypes.ENTITY_DESTROYED, 'engine', undefined, { entityId }));
        }
        return result;
    }
    getEntity(entityId) {
        return this.entityManager.getEntity(entityId);
    }
    getAllEntities() {
        return this.entityManager.getAllEntities();
    }
    getEntitiesByType(type) {
        return this.entityManager.getEntitiesByType(type);
    }
    async emitEvent(event) {
        await this.eventSystem.emit(event);
    }
    on(eventType, handler) {
        this.eventSystem.on(eventType, handler);
    }
    off(eventType, handler) {
        this.eventSystem.off(eventType, handler);
    }
    registerPlugin(plugin) {
        this.pluginManager.registerPlugin(plugin);
    }
    registerSaveCommands(commandParser) {
        if (!this.config.enablePersistence || !this.saveManager) {
            return;
        }
        commandParser.registerCommand({
            command: 'save',
            aliases: ['sav'],
            description: 'Save the current game state',
            usage: 'save [description]',
            handler: async (sessionId, args) => {
                try {
                    const description = args.length > 0 ? args.join(' ') : 'Manual save';
                    const saveId = await this.saveFullGame(description);
                    return `Game saved successfully as: ${saveId}`;
                }
                catch (error) {
                    return `Failed to save game: ${error.message}`;
                }
            },
            adminOnly: true
        });
        commandParser.registerCommand({
            command: 'load',
            aliases: ['ld'],
            description: 'Load a game state',
            usage: 'load <save_id>',
            handler: async (sessionId, args) => {
                try {
                    if (args.length === 0) {
                        return 'Please specify a save ID. Use "saves" to list available saves.';
                    }
                    const saveId = args[0];
                    await this.loadFullGame(saveId);
                    return `Game loaded successfully from: ${saveId}`;
                }
                catch (error) {
                    return `Failed to load game: ${error.message}`;
                }
            },
            adminOnly: true
        });
        commandParser.registerCommand({
            command: 'saves',
            aliases: ['savelist'],
            description: 'List all available saves',
            usage: 'saves [type]',
            handler: async (sessionId, args) => {
                try {
                    const saves = await this.listSaves();
                    if (saves.length === 0) {
                        return 'No saves found.';
                    }
                    let result = 'Available saves:\n\n';
                    result += 'ID'.padEnd(40) + 'Type'.padEnd(12) + 'Date'.padEnd(20) + 'Description\n';
                    result += '-'.repeat(80) + '\n';
                    for (const save of saves) {
                        const id = save.id.substring(0, 39);
                        const type = save.type.padEnd(11);
                        const date = new Date(save.timestamp).toLocaleDateString();
                        const desc = save.description || 'No description';
                        result += `${id} ${type} ${date.padEnd(19)} ${desc}\n`;
                    }
                    return result;
                }
                catch (error) {
                    return `Failed to list saves: ${error.message}`;
                }
            },
            adminOnly: true
        });
        commandParser.registerCommand({
            command: 'deletesave',
            aliases: ['delsave'],
            description: 'Delete a save file',
            usage: 'deletesave <save_id>',
            handler: async (sessionId, args) => {
                try {
                    if (args.length === 0) {
                        return 'Please specify a save ID to delete.';
                    }
                    const saveId = args[0];
                    const deleted = await this.deleteSave(saveId);
                    if (deleted) {
                        return `Save ${saveId} deleted successfully.`;
                    }
                    else {
                        return `Save ${saveId} not found or could not be deleted.`;
                    }
                }
                catch (error) {
                    return `Failed to delete save: ${error.message}`;
                }
            },
            adminOnly: true
        });
        commandParser.registerCommand({
            command: 'backup',
            aliases: ['bak'],
            description: 'Create a backup of a save file',
            usage: 'backup <save_id> [reason]',
            handler: async (sessionId, args) => {
                try {
                    if (args.length === 0) {
                        return 'Please specify a save ID to backup.';
                    }
                    const saveId = args[0];
                    const reason = args.slice(1).join(' ') || 'Manual backup';
                    const backupId = await this.getSaveManager()?.backupSave(saveId, reason);
                    if (backupId) {
                        return `Backup created: ${backupId}`;
                    }
                    else {
                        return `Failed to create backup for save ${saveId}.`;
                    }
                }
                catch (error) {
                    return `Failed to create backup: ${error.message}`;
                }
            },
            adminOnly: true
        });
        commandParser.registerCommand({
            command: 'cleanup',
            aliases: ['clean'],
            description: 'Clean up old backup files',
            handler: async (sessionId, args) => {
                try {
                    const removedCount = await this.cleanupOldBackups();
                    return `Cleaned up ${removedCount} old backup files.`;
                }
                catch (error) {
                    return `Failed to cleanup backups: ${error.message}`;
                }
            },
            adminOnly: true
        });
    }
    registerDialogueCommands(commandParser) {
        if (!this.config.enableDialogue || !this.dialogueManager) {
            return;
        }
        Promise.resolve().then(() => __importStar(require('../modules/dialogue/dialogue-commands'))).then(({ DialogueCommandHandlers }) => {
            const dialogueCommands = new DialogueCommandHandlers(this.dialogueManager, this);
            const commandHandlers = dialogueCommands.getCommandHandlers();
            for (const [commandName, handler] of Object.entries(commandHandlers)) {
                commandParser.registerCommand(handler);
            }
            console.log('💬 Dialogue commands registered');
        }).catch(error => {
            console.error('❌ Failed to register dialogue commands:', error);
        });
        console.log('💬 Dialogue commands registered');
    }
    async loadPlugin(pluginId) {
        await this.pluginManager.loadPlugin(pluginId);
    }
    async unloadPlugin(pluginId) {
        await this.pluginManager.unloadPlugin(pluginId);
    }
    getPlugin(pluginId) {
        return this.pluginManager.getPlugin(pluginId);
    }
    getLoadedPlugins() {
        return this.pluginManager.getLoadedPlugins();
    }
    getTelnetServer() {
        return this.telnetServer;
    }
    sendMessageToSession(sessionId, content, type = 'info') {
        if (!this.telnetServer)
            return false;
        return this.telnetServer.sendMessage(sessionId, { content, type, timestamp: new Date() });
    }
    broadcastMessage(content, type = 'broadcast', excludeSessionId) {
        if (!this.telnetServer)
            return;
        this.telnetServer.broadcastMessage({ content, type, timestamp: new Date() }, excludeSessionId);
    }
    registerNetworkCommand(handler) {
        if (!this.telnetServer)
            return;
        this.telnetServer.registerCommand(handler);
    }
    unregisterNetworkCommand(command) {
        if (!this.telnetServer)
            return false;
        return this.telnetServer.unregisterCommand(command);
    }
    getWorldManager() {
        return this.worldManager;
    }
    getRoom(roomId) {
        return this.worldManager?.getRoom(roomId);
    }
    getAllRooms() {
        return this.worldManager?.getAllRooms() || [];
    }
    getItem(itemId) {
        return this.worldManager?.getItem(itemId);
    }
    getAllItems() {
        return this.worldManager?.getAllItems() || [];
    }
    getNPC(npcId) {
        return this.worldManager?.getNPC(npcId);
    }
    getAllNPCs() {
        return this.worldManager?.getAllNPCs() || [];
    }
    movePlayer(playerId, fromRoomId, toRoomId) {
        return this.worldManager?.movePlayer(playerId, fromRoomId, toRoomId) || false;
    }
    getRoomDescription(roomId) {
        return this.worldManager?.getRoomDescription(roomId) || 'Room not found.';
    }
    findExit(roomId, direction) {
        return this.worldManager?.findExit(roomId, direction);
    }
    getPlayersInRoom(roomId) {
        return this.worldManager?.getPlayersInRoom(roomId) || [];
    }
    getItemsInRoom(roomId) {
        return this.worldManager?.getItemsInRoom(roomId) || [];
    }
    getNPCsInRoom(roomId) {
        return this.worldManager?.getNPCsInRoom(roomId) || [];
    }
    getSaveManager() {
        return this.saveManager;
    }
    getDialogueManager() {
        return this.dialogueManager;
    }
    getPlayerManager() {
        return this.playerManager;
    }
    async saveFullGame(description) {
        if (!this.saveManager)
            return null;
        return this.saveManager.saveFullGame(description);
    }
    async loadFullGame(saveId) {
        if (!this.saveManager)
            return;
        return this.saveManager.loadFullGame(saveId);
    }
    async listSaves() {
        if (!this.saveManager)
            return [];
        return this.saveManager.listSaves();
    }
    async deleteSave(saveId) {
        if (!this.saveManager)
            return false;
        return this.saveManager.deleteSave(saveId);
    }
    async cleanupOldBackups() {
        if (!this.saveManager)
            return 0;
        return this.saveManager.cleanupOldBackups();
    }
};
exports.EngineService = EngineService;
exports.EngineService = EngineService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], EngineService);
//# sourceMappingURL=engine.service.js.map