import { Injectable } from '@nestjs/common';
import { Container } from 'inversify';
import { BaseEntity, EntityManager } from './entity';
import { EventSystem, GameEvent, EventTypes } from './event';
import { PluginManager, PluginLoader, BasePlugin } from './plugin';
import { TelnetServer, INetworkConfig, Ansi, ColorScheme } from '../modules/networking';
import { WorldManager, IWorldConfig } from '../modules/world';
import { SaveManager, IPersistenceConfig, PlayerManager } from '../modules/persistence';
import { DialogueManager, IDialogueConfig } from '../modules/dialogue';
import { ILogger, SimpleLogger } from './logger';

/**
 * Engine configuration interface
 */
export interface IEngineConfig {
  maxEntities: number;
  tickInterval: number;
  enablePlugins: boolean;
  pluginDirectory?: string;
  saveInterval: number;
  logLevel: string;
  // Networking configuration
  enableNetworking: boolean;
  networkHost: string;
  networkPort: number;
  maxConnections: number;
  connectionTimeout: number;
  idleTimeout: number;
  rateLimitWindow: number;
  rateLimitMaxRequests: number;

  // World configuration
  enableWorld: boolean;
  worldPath: string;
  defaultRoomId: string;
  maxItemsPerRoom: number;
  maxPlayersPerRoom: number;
  allowRoomCreation: boolean;

  // Persistence configuration
  enablePersistence: boolean;
  savePath: string;
  backupPath: string;
  maxBackups: number;
  validateOnLoad: boolean;
  compressionEnabled: boolean;
  migrationEnabled: boolean;

  // Dialogue configuration
  enableDialogue: boolean;
  dialogueContentPath: string;
  maxConversationsPerPlayer: number;
  conversationTimeoutMinutes: number;
}

/**
 * Default engine configuration
 */
const DEFAULT_CONFIG: IEngineConfig = {
  maxEntities: 10000,
  tickInterval: 1000,
  enablePlugins: true,
  saveInterval: 300000, // 5 minutes
  logLevel: 'info',
  // Networking defaults
  enableNetworking: true,
  networkHost: '0.0.0.0',
  networkPort: 4000,
  maxConnections: 100,
  connectionTimeout: 30000, // 30 seconds
  idleTimeout: 300000, // 5 minutes
  rateLimitWindow: 10000, // 10 seconds
  rateLimitMaxRequests: 20,

  // World defaults
  enableWorld: true,
  worldPath: './engine/modules/world/content',
  defaultRoomId: 'tavern',
  maxItemsPerRoom: 50,
  maxPlayersPerRoom: 10,
  allowRoomCreation: false,
  pluginDirectory: './plugins',

  // Persistence defaults
  enablePersistence: true,
  savePath: './saves',
  backupPath: './backups',
  maxBackups: 10,
  validateOnLoad: true,
  compressionEnabled: false,
  migrationEnabled: true,

  // Dialogue defaults
  enableDialogue: true,
  dialogueContentPath: './engine/modules/world/content',
  maxConversationsPerPlayer: 5,
  conversationTimeoutMinutes: 30
};

/**
 * Main game engine service
 */
@Injectable()
export class EngineService {
  private container: Container;
  private entityManager: EntityManager;
  private eventSystem: EventSystem;
  private pluginManager: PluginManager;
  private pluginLoader: PluginLoader;
  private config: IEngineConfig;
  private isRunning: boolean = false;
  private tickInterval?: NodeJS.Timeout;
  private saveInterval?: NodeJS.Timeout;
  private telnetServer?: TelnetServer;
  private worldManager?: WorldManager;
  private saveManager?: SaveManager;
  private dialogueManager?: DialogueManager;
  private playerManager?: PlayerManager;
  private logger: ILogger;

  constructor() {
    this.config = { ...DEFAULT_CONFIG };
    this.logger = new SimpleLogger(this.config.logLevel);
    this.container = new Container();
    this.entityManager = new EntityManager();
    this.eventSystem = new EventSystem(this.logger);
    this.pluginManager = new PluginManager(
      this.container,
      this.eventSystem,
      this.entityManager,
      this.logger
    );
    this.pluginLoader = new PluginLoader(this.pluginManager);

    this.initializeEngine();
  }

  /**
   * Initialize the engine
   */
  private async initializeEngine(): Promise<void> {
    this.logger.info('🚀 Initializing MUD Engine...');

    // Bind core services to container
    this.container.bind('EntityManager').toConstantValue(this.entityManager);
    this.container.bind('EventSystem').toConstantValue(this.eventSystem);
    this.container.bind('PluginManager').toConstantValue(this.pluginManager);
    this.container.bind('EngineService').toConstantValue(this);

    // Initialize networking if enabled
    if (this.config.enableNetworking) {
      await this.initializeNetworking();
    }

    // Initialize world if enabled
    if (this.config.enableWorld) {
      await this.initializeWorld();
    }

    // Initialize persistence if enabled
    if (this.config.enablePersistence) {
      await this.initializePersistence();
    }

    // Initialize dialogue if enabled
    if (this.config.enableDialogue) {
      await this.initializeDialogue();

      // Register dialogue commands with the command parser if networking is enabled
      if (this.config.enableNetworking && this.telnetServer) {
        this.registerDialogueCommands(this.telnetServer.getCommandParser());
      }
    }

    // Register save commands with the command parser if persistence and networking are enabled
    if (this.config.enablePersistence && this.config.enableNetworking && this.telnetServer) {
      this.registerSaveCommands(this.telnetServer.getCommandParser());
    }

    // Set up event handlers
    this.setupEventHandlers();

    this.logger.info('✅ Engine initialized');
  }

  /**
   * Initialize networking components
   */
  private async initializeNetworking(): Promise<void> {
    console.log('🌐 Initializing networking...');

    const networkConfig: INetworkConfig = {
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

    this.telnetServer = new TelnetServer(
      this.eventSystem,
      networkConfig,
      this.playerManager,
  console
    );

    console.log('✅ Networking initialized');
  }

  /**
   * Initialize world components
   */
  private async initializeWorld(): Promise<void> {
    this.logger.info('🌍 Initializing world...');

    const worldConfig: IWorldConfig = {
      contentPath: this.config.worldPath,
      defaultRoomId: this.config.defaultRoomId,
      maxItemsPerRoom: this.config.maxItemsPerRoom,
      maxPlayersPerRoom: this.config.maxPlayersPerRoom,
      allowRoomCreation: this.config.allowRoomCreation
    };

    this.worldManager = new WorldManager(
      this.eventSystem,
      worldConfig,
      this.logger
    );

    // Load world content
    try {
      await this.worldManager.loadWorld();
      this.logger.info('✅ World loaded successfully');
    } catch (error) {
      this.logger.warn('⚠️  Failed to load world, creating empty world:', error);
    }

    this.logger.info('✅ World initialized');
  }

  /**
   * Initialize persistence components
   */
  private async initializePersistence(): Promise<void> {
    console.log('💾 Initializing persistence...');

    const persistenceConfig: IPersistenceConfig = {
      savePath: this.config.savePath,
      backupPath: this.config.backupPath,
      autoSaveInterval: this.config.saveInterval,
      maxBackups: this.config.maxBackups,
      compressionEnabled: this.config.compressionEnabled,
      validateOnLoad: this.config.validateOnLoad,
      migrationEnabled: this.config.migrationEnabled
    };

    this.saveManager = new SaveManager(
      persistenceConfig,
      this.eventSystem,
      console
    );

    // Initialize player manager
    this.playerManager = new PlayerManager(
      this.eventSystem,
      console
    );

    console.log('✅ Persistence initialized');
  }

  /**
   * Initialize dialogue components
   */
  private async initializeDialogue(): Promise<void> {
    this.logger.info('💬 Initializing dialogue...');

    this.dialogueManager = new DialogueManager(this.eventSystem, this.logger);

    const dialogueConfig: IDialogueConfig = {
      enablePersistence: this.config.enablePersistence,
      maxConversationsPerPlayer: this.config.maxConversationsPerPlayer,
      conversationTimeoutMinutes: this.config.conversationTimeoutMinutes,
      autoSaveIntervalSeconds: 300, // 5 minutes
      defaultProvider: 'canned-branching',
      providers: {},
      contentPath: this.config.dialogueContentPath
    };

    await this.dialogueManager.initialize(dialogueConfig);

    this.logger.info('✅ Dialogue initialized');
  }

  /**
   * Set up core event handlers
   */
  private setupEventHandlers(): void {
    // Entity lifecycle events
    this.eventSystem.on(EventTypes.ENTITY_CREATED, (event) => {
      this.logger.debug(`📦 Entity created: ${event.data?.entity?.name || 'Unknown'}`);
    });

    this.eventSystem.on(EventTypes.ENTITY_DESTROYED, (event) => {
      this.logger.debug(`💥 Entity destroyed: ${event.data?.entityId || 'Unknown'}`);
    });

    // Player events
    this.eventSystem.on(EventTypes.PLAYER_JOINED, (event) => {
      this.logger.info(`👤 Player joined: ${event.source}`);
    });

    this.eventSystem.on(EventTypes.PLAYER_LEFT, (event) => {
      this.logger.info(`👋 Player left: ${event.source}`);
    });

    // Room-based communication events
    this.eventSystem.on(EventTypes.PLAYER_MESSAGE, this.handlePlayerMessage.bind(this));

    // Room movement events
    this.eventSystem.on('world.room.entered', this.handleRoomEntered.bind(this));
    this.eventSystem.on('player.move', this.handlePlayerMove.bind(this));

    // Game events
    this.eventSystem.on(EventTypes.GAME_STARTED, (event) => {
      this.logger.info('🎮 Game started');
    });

    this.eventSystem.on(EventTypes.GAME_ENDED, (event) => {
      this.logger.info('🏁 Game ended');
    });
  }

  /**
   * Start the engine
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('⚠️  Engine already running');
      return;
    }

    this.logger.info('▶️  Starting MUD Engine...');

    // Load plugins if enabled
    if (this.config.enablePlugins) {
      await this.loadPlugins();
    }

    // Start game loop
    this.startGameLoop();

    // Start auto-save
    this.startAutoSave();

    // Start networking server if enabled
    if (this.config.enableNetworking && this.telnetServer) {
      await this.telnetServer.start();
    }

    // Load world if enabled
    if (this.config.enableWorld && this.worldManager) {
      // World is already loaded in initialization, but we could refresh here if needed
    }

    this.isRunning = true;

    // Emit game started event
    await this.eventSystem.emit(new GameEvent(
      EventTypes.GAME_STARTED,
      'engine',
      undefined,
      { timestamp: new Date() }
    ));

    this.logger.info('✅ Engine started successfully');
  }

  /**
   * Stop the engine
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      this.logger.warn('⚠️  Engine not running');
      return;
    }

    this.logger.info('⏹️  Stopping MUD Engine...');

    // Stop intervals
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = undefined;
    }

    if (this.saveInterval) {
      clearInterval(this.saveInterval);
      this.saveInterval = undefined;
    }

    // Stop networking server if enabled
    if (this.config.enableNetworking && this.telnetServer) {
      await this.telnetServer.stop();
    }

    // Unload plugins
    if (this.config.enablePlugins) {
      await this.pluginManager.unloadAllPlugins();
    }

    this.isRunning = false;

    // Emit game ended event
    await this.eventSystem.emit(new GameEvent(
      EventTypes.GAME_ENDED,
      'engine',
      undefined,
      { timestamp: new Date() }
    ));

    this.logger.info('✅ Engine stopped successfully');
  }

  /**
   * Load plugins
   */
  private async loadPlugins(): Promise<void> {
    if (!this.config.pluginDirectory) {
      console.log('📁 No plugin directory configured');
      return;
    }

    try {
      console.log(`📦 Loading plugins from: ${this.config.pluginDirectory}`);
      await this.pluginLoader.loadFromDirectory(this.config.pluginDirectory);
      await this.pluginManager.loadAllPlugins();
      console.log('✅ Plugins loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load plugins:', error);
    }
  }

  /**
   * Start the game loop
   */
  private startGameLoop(): void {
    this.tickInterval = setInterval(async () => {
      try {
        await this.gameTick();
      } catch (error) {
        console.error('❌ Error in game tick:', error);
      }
    }, this.config.tickInterval);
  }

  /**
   * Game tick - called every tick interval
   */
  private async gameTick(): Promise<void> {
    const tickEvent = new GameEvent(
      EventTypes.GAME_TICK,
      'engine',
      undefined,
      {
        timestamp: new Date(),
        entityCount: this.entityManager.getEntityCount()
      }
    );

    await this.eventSystem.emit(tickEvent);
  }

  /**
   * Start auto-save functionality
   */
  private startAutoSave(): void {
    this.saveInterval = setInterval(() => {
      this.saveGameState();
    }, this.config.saveInterval);
  }

  /**
   * Save game state
   */
  private async saveGameState(): Promise<void> {
    if (!this.config.enablePersistence || !this.saveManager) {
      this.logger.debug('💾 Persistence not enabled, skipping save');
      return;
    }

    try {
      this.logger.info('💾 Auto-saving game state...');
      await this.saveManager.saveFullGame('Auto-save');
      this.logger.info('✅ Game state saved');
    } catch (error) {
      this.logger.error('❌ Failed to save game state:', error);
    }
  }

  /**
   * Update engine configuration
   */
  updateConfig(newConfig: Partial<IEngineConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.logger.info('⚙️  Engine configuration updated');
  }

  /**
   * Handle player message events for room-based and global communication
   */
  private async handlePlayerMessage(event: GameEvent): Promise<void> {
    const { message, type } = event.data;
    const sessionId = event.source;

    if (!message || !sessionId) return;

    // Get player manager and world manager
    if (!this.playerManager || !this.worldManager || !this.telnetServer) {
      this.logger.warn('Missing components for communication');
      return;
    }

    // Get the player who sent the message
    const senderPlayer = this.playerManager.getPlayerBySessionId(sessionId);
    if (!senderPlayer) {
      this.logger.warn(`Player not found for session: ${sessionId}`);
      return;
    }

    if (type === 'global') {
      // Global chat - send to all connected players except sender
      const formattedMessage = `${Ansi.brightMagenta('[GLOBAL]')} ${Ansi.brightCyan(senderPlayer.username)} says: ${message}`;
      this.telnetServer.broadcastMessage({ content: formattedMessage, type: 'broadcast', timestamp: new Date() }, sessionId);
    } else {
      // Local chat - send to players in the same room
      // Get the player's current room
      const roomId = senderPlayer.currentRoomId;
      const playersInRoom = this.worldManager.getPlayersInRoom(roomId);

      // Filter out the sender and send to other players in the room
      const recipients = playersInRoom.filter(playerId => playerId !== sessionId);

      if (recipients.length > 0) {
        const formattedMessage = `${Ansi.brightCyan(senderPlayer.username)} says: ${message}`;

        // Send to all players in the room except sender
        for (const recipientId of recipients) {
          this.sendMessageToSession(recipientId, formattedMessage, 'info');
        }
      }
    }
  }

  /**
   * Handle room entered events for player movement notifications
   */
  private async handleRoomEntered(event: GameEvent): Promise<void> {
    if (!event.data) return;

    const { fromRoomId, toRoomId } = event.data;
    const playerId = event.source;

    if (!playerId || !toRoomId) return;

    // Get required components
    if (!this.playerManager || !this.worldManager || !this.telnetServer) {
      this.logger.warn('Missing components for room notifications');
      return;
    }

    // Get the player who entered the room
    const enteringPlayer = this.playerManager.getPlayerBySessionId(playerId);
    if (!enteringPlayer) {
      this.logger.warn(`Player not found for session: ${playerId}`);
      return;
    }

    // Get all players currently in the target room (excluding the player who just entered)
    const playersInRoom = this.worldManager.getPlayersInRoom(toRoomId);
    const recipients = playersInRoom.filter(sessionId => sessionId !== playerId);

    if (recipients.length > 0) {
      // Send notification to all other players in the room
      const notificationMessage = `${Ansi.brightGreen(enteringPlayer.username)} has entered the room.`;

      for (const recipientId of recipients) {
        this.sendMessageToSession(recipientId, notificationMessage, 'info');
      }

      console.log(`${enteringPlayer.username} entered room ${toRoomId}, notified ${recipients.length} other players`);
    }
  }

  /**
   * Handle player movement commands
   */
  private async handlePlayerMove(event: GameEvent): Promise<void> {
    if (!event.data) return;

    const { direction, fromRoomId } = event.data;
    const playerId = event.source;

    if (!playerId || !direction) return;

    // Get required components
    if (!this.playerManager || !this.worldManager || !this.telnetServer) {
      console.warn('Missing components for player movement');
      return;
    }

    // Get the player
    const player = this.playerManager.getPlayerBySessionId(playerId);
    if (!player) {
      console.warn(`Player not found for session: ${playerId}`);
      return;
    }

    // Find the exit in the current room
    const exit = this.worldManager.findExit(fromRoomId, direction);
    if (!exit) {
      this.sendMessageToSession(playerId, ColorScheme.error(`You cannot go ${direction} from here.`), 'error');
      return;
    }

    // Move the player using the world manager
    const success = this.worldManager.movePlayer(playerId, fromRoomId, exit.toRoomId);
    if (!success) {
      this.sendMessageToSession(playerId, ColorScheme.error('Failed to move to that location.'), 'error');
      return;
    }

    // Update player's current room
    player.currentRoomId = exit.toRoomId;

    // Send success message to the moving player
    this.sendMessageToSession(playerId, ColorScheme.success(`You move ${direction}.`), 'info');

    // Send room description to the moving player
    const roomDescription = this.worldManager.getRoomDescription(exit.toRoomId);
    this.sendMessageToSession(playerId, roomDescription, 'info');

    console.log(`${player.username} moved ${direction} from ${fromRoomId} to ${exit.toRoomId}`);
  }

  /**
   * Get engine status
   */
  getStatus(): object {
    const status: any = {
      isRunning: this.isRunning,
      entityCount: this.entityManager.getEntityCount(),
      loadedPlugins: this.pluginManager.getLoadedPlugins().length,
      config: this.config,
      eventStats: this.eventSystem.getStatistics(),
      networking: null as any,
      world: null as any,
      persistence: null as any,
      players: null as any
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

  /**
   * Create and add entity
   */
  createEntity(entityClass: new (...args: any[]) => BaseEntity, ...args: any[]): BaseEntity {
    if (this.entityManager.getEntityCount() >= this.config.maxEntities) {
      throw new Error(`Maximum entity limit reached: ${this.config.maxEntities}`);
    }

    const entity = new entityClass(...args);
    this.entityManager.addEntity(entity);

    // Emit entity created event
    this.eventSystem.emit(new GameEvent(
      EventTypes.ENTITY_CREATED,
      'engine',
      entity.id,
      { entity: entity.toJSON() }
    ));

    return entity;
  }

  /**
   * Remove entity
   */
  removeEntity(entityId: string): boolean {
    const result = this.entityManager.removeEntity(entityId);

    if (result) {
      // Emit entity destroyed event
      this.eventSystem.emit(new GameEvent(
        EventTypes.ENTITY_DESTROYED,
        'engine',
        undefined,
        { entityId }
      ));
    }

    return result;
  }

  /**
   * Get entity by ID
   */
  getEntity(entityId: string): BaseEntity | undefined {
    return this.entityManager.getEntity(entityId);
  }

  /**
   * Get all entities
   */
  getAllEntities(): BaseEntity[] {
    return this.entityManager.getAllEntities();
  }

  /**
   * Get entities by type
   */
  getEntitiesByType(type: string): BaseEntity[] {
    return this.entityManager.getEntitiesByType(type);
  }

  /**
   * Emit custom event
   */
  async emitEvent(event: GameEvent): Promise<void> {
    await this.eventSystem.emit(event);
  }

  /**
   * Register event handler
   */
  on(eventType: string, handler: (event: GameEvent) => void): void {
    this.eventSystem.on(eventType, handler);
  }

  /**
   * Remove event handler
   */
  off(eventType: string, handler: (event: GameEvent) => void): void {
    this.eventSystem.off(eventType, handler);
  }

  /**
   * Register plugin
   */
  registerPlugin(plugin: BasePlugin): void {
    this.pluginManager.registerPlugin(plugin);
  }

  /**
   * Register save/load commands with the command parser
   */
  registerSaveCommands(commandParser: any): void {
    if (!this.config.enablePersistence || !this.saveManager) {
      return;
    }

    // Save command
    commandParser.registerCommand({
      command: 'save',
      aliases: ['sav'],
      description: 'Save the current game state',
      usage: 'save [description]',
      handler: async (sessionId: string, args: string[]) => {
        try {
          const description = args.length > 0 ? args.join(' ') : 'Manual save';
          const saveId = await this.saveFullGame(description);
          return `Game saved successfully as: ${saveId}`;
        } catch (error) {
          return `Failed to save game: ${error.message}`;
        }
      },
      adminOnly: true
    });

    // Load command
    commandParser.registerCommand({
      command: 'load',
      aliases: ['ld'],
      description: 'Load a game state',
      usage: 'load <save_id>',
      handler: async (sessionId: string, args: string[]) => {
        try {
          if (args.length === 0) {
            return 'Please specify a save ID. Use "saves" to list available saves.';
          }

          const saveId = args[0];
          await this.loadFullGame(saveId);
          return `Game loaded successfully from: ${saveId}`;
        } catch (error) {
          return `Failed to load game: ${error.message}`;
        }
      },
      adminOnly: true
    });

    // Saves command
    commandParser.registerCommand({
      command: 'saves',
      aliases: ['savelist'],
      description: 'List all available saves',
      usage: 'saves [type]',
      handler: async (sessionId: string, args: string[]) => {
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
        } catch (error) {
          return `Failed to list saves: ${error.message}`;
        }
      },
      adminOnly: true
    });

    // Delete save command
    commandParser.registerCommand({
      command: 'deletesave',
      aliases: ['delsave'],
      description: 'Delete a save file',
      usage: 'deletesave <save_id>',
      handler: async (sessionId: string, args: string[]) => {
        try {
          if (args.length === 0) {
            return 'Please specify a save ID to delete.';
          }

          const saveId = args[0];
          const deleted = await this.deleteSave(saveId);

          if (deleted) {
            return `Save ${saveId} deleted successfully.`;
          } else {
            return `Save ${saveId} not found or could not be deleted.`;
          }
        } catch (error) {
          return `Failed to delete save: ${error.message}`;
        }
      },
      adminOnly: true
    });

    // Backup command
    commandParser.registerCommand({
      command: 'backup',
      aliases: ['bak'],
      description: 'Create a backup of a save file',
      usage: 'backup <save_id> [reason]',
      handler: async (sessionId: string, args: string[]) => {
        try {
          if (args.length === 0) {
            return 'Please specify a save ID to backup.';
          }

          const saveId = args[0];
          const reason = args.slice(1).join(' ') || 'Manual backup';

          const backupId = await this.getSaveManager()?.backupSave(saveId, reason);

          if (backupId) {
            return `Backup created: ${backupId}`;
          } else {
            return `Failed to create backup for save ${saveId}.`;
          }
        } catch (error) {
          return `Failed to create backup: ${error.message}`;
        }
      },
      adminOnly: true
    });

    // Cleanup backups command
    commandParser.registerCommand({
      command: 'cleanup',
      aliases: ['clean'],
      description: 'Clean up old backup files',
      handler: async (sessionId: string, args: string[]) => {
        try {
          const removedCount = await this.cleanupOldBackups();
          return `Cleaned up ${removedCount} old backup files.`;
        } catch (error) {
          return `Failed to cleanup backups: ${error.message}`;
        }
      },
      adminOnly: true
    });
  }

  /**
   * Register dialogue commands with the command parser
   */
  registerDialogueCommands(commandParser: any): void {
    if (!this.config.enableDialogue || !this.dialogueManager) {
      return;
    }

    // Import dialogue command handlers
    import('../modules/dialogue/dialogue-commands').then(({ DialogueCommandHandlers }) => {
      const dialogueCommands = new DialogueCommandHandlers(this.dialogueManager, this);
      const commandHandlers = dialogueCommands.getCommandHandlers();

      // Register each dialogue command
      for (const [commandName, handler] of Object.entries(commandHandlers)) {
        commandParser.registerCommand(handler);
      }

      console.log('💬 Dialogue commands registered');
    }).catch(error => {
      console.error('❌ Failed to register dialogue commands:', error);
    });

    console.log('💬 Dialogue commands registered');
  }

  /**
   * Load plugin
   */
  async loadPlugin(pluginId: string): Promise<void> {
    await this.pluginManager.loadPlugin(pluginId);
  }

  /**
   * Unload plugin
   */
  async unloadPlugin(pluginId: string): Promise<void> {
    await this.pluginManager.unloadPlugin(pluginId);
  }

  /**
   * Get plugin
   */
  getPlugin(pluginId: string): BasePlugin | undefined {
    return this.pluginManager.getPlugin(pluginId) as BasePlugin;
  }

  /**
   * Get all loaded plugins
   */
  getLoadedPlugins(): BasePlugin[] {
    return this.pluginManager.getLoadedPlugins() as BasePlugin[];
  }

  /**
   * Get networking server instance
   */
  getTelnetServer(): TelnetServer | undefined {
    return this.telnetServer;
  }

  /**
   * Send message to a specific session
   */
  sendMessageToSession(sessionId: string, content: string, type: 'system' | 'user' | 'error' | 'info' | 'broadcast' = 'info'): boolean {
    if (!this.telnetServer) return false;
    return this.telnetServer.sendMessage(sessionId, { content, type, timestamp: new Date() });
  }

  /**
   * Broadcast message to all connected sessions
   */
  broadcastMessage(content: string, type: 'system' | 'user' | 'error' | 'info' | 'broadcast' = 'broadcast', excludeSessionId?: string): void {
    if (!this.telnetServer) return;
    this.telnetServer.broadcastMessage({ content, type, timestamp: new Date() }, excludeSessionId);
  }

  /**
   * Register a custom networking command
   */
  registerNetworkCommand(handler: any): void {
    if (!this.telnetServer) return;
    this.telnetServer.registerCommand(handler);
  }

  /**
   * Unregister a custom networking command
   */
  unregisterNetworkCommand(command: string): boolean {
    if (!this.telnetServer) return false;
    return this.telnetServer.unregisterCommand(command);
  }

  /**
   * Get world manager instance
   */
  getWorldManager(): WorldManager | undefined {
    return this.worldManager;
  }

  /**
   * Get room by ID
   */
  getRoom(roomId: string): any {
    return this.worldManager?.getRoom(roomId);
  }

  /**
   * Get all rooms
   */
  getAllRooms(): any[] {
    return this.worldManager?.getAllRooms() || [];
  }

  /**
   * Get item by ID
   */
  getItem(itemId: string): any {
    return this.worldManager?.getItem(itemId);
  }

  /**
   * Get all items
   */
  getAllItems(): any[] {
    return this.worldManager?.getAllItems() || [];
  }

  /**
   * Get NPC by ID
   */
  getNPC(npcId: string): any {
    return this.worldManager?.getNPC(npcId);
  }

  /**
   * Get all NPCs
   */
  getAllNPCs(): any[] {
    return this.worldManager?.getAllNPCs() || [];
  }

  /**
   * Move player between rooms
   */
  movePlayer(playerId: string, fromRoomId: string, toRoomId: string): boolean {
    return this.worldManager?.movePlayer(playerId, fromRoomId, toRoomId) || false;
  }

  /**
   * Get room description with formatting
   */
  getRoomDescription(roomId: string): string {
    return this.worldManager?.getRoomDescription(roomId) || 'Room not found.';
  }

  /**
   * Find exit from a room
   */
  findExit(roomId: string, direction: string): any {
    return this.worldManager?.findExit(roomId, direction);
  }

  /**
   * Get players in a room
   */
  getPlayersInRoom(roomId: string): string[] {
    return this.worldManager?.getPlayersInRoom(roomId) || [];
  }

  /**
   * Get items in a room
   */
  getItemsInRoom(roomId: string): any[] {
    return this.worldManager?.getItemsInRoom(roomId) || [];
  }

  /**
   * Get NPCs in a room
   */
  getNPCsInRoom(roomId: string): any[] {
    return this.worldManager?.getNPCsInRoom(roomId) || [];
  }

  /**
   * Get save manager instance
   */
  getSaveManager(): SaveManager | undefined {
    return this.saveManager;
  }

  /**
   * Get dialogue manager instance
   */
  getDialogueManager(): DialogueManager | undefined {
    return this.dialogueManager;
  }

  /**
   * Get player manager instance
   */
  getPlayerManager(): PlayerManager | undefined {
    return this.playerManager;
  }

  /**
   * Save full game state manually
   */
  async saveFullGame(description?: string): Promise<string | null> {
    if (!this.saveManager) return null;
    return this.saveManager.saveFullGame(description);
  }

  /**
   * Load full game state
   */
  async loadFullGame(saveId: string): Promise<void> {
    if (!this.saveManager) return;
    return this.saveManager.loadFullGame(saveId);
  }

  /**
   * List all saves
   */
  async listSaves(): Promise<any[]> {
    if (!this.saveManager) return [];
    return this.saveManager.listSaves();
  }

  /**
   * Delete a save
   */
  async deleteSave(saveId: string): Promise<boolean> {
    if (!this.saveManager) return false;
    return this.saveManager.deleteSave(saveId);
  }

  /**
   * Clean up old backups
   */
  async cleanupOldBackups(): Promise<number> {
    if (!this.saveManager) return 0;
    return this.saveManager.cleanupOldBackups();
  }
}