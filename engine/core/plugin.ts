import { Container, injectable, inject, interfaces } from 'inversify';
import { EventSystem, GameEvent } from './event';
import { BaseEntity } from './entity';
import { ILogger } from './logger';

// Global registries to allow multiple PluginManager instances (and CJS/ESM boundaries) to share state
const g: any = globalThis as any;
if (!g.__mud_plugins) {
  g.__mud_plugins = {
    registry: new Map<string, IPlugin>(),
    loaded: new Set<string>()
  };
}
const GLOBAL_PLUGIN_REGISTRY: Map<string, IPlugin> = g.__mud_plugins.registry;
const GLOBAL_LOADED_PLUGINS: Set<string> = g.__mud_plugins.loaded;

/**
 * Plugin metadata interface
 */
export interface IPluginMetadata {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  dependencies?: string[];
  provides?: string[];
}

/**
 * Plugin lifecycle hooks
 */
export interface IPluginHooks {
  onLoad?: () => void | Promise<void>;
  onUnload?: () => void | Promise<void>;
  onEnable?: () => void | Promise<void>;
  onDisable?: () => void | Promise<void>;
}

/**
 * Plugin interface
 */
export interface IPlugin extends IPluginHooks {
  metadata: IPluginMetadata;
  container?: Container;
  eventSystem?: EventSystem;
  entityManager?: any; // Will be properly typed later

  // Plugin methods
  initialize?: (context: IPluginContext) => void | Promise<void>;
  destroy?: () => void | Promise<void>;
}

/**
 * Plugin context provided to plugins
 */
export interface IPluginContext {
  container: Container;
  eventSystem: EventSystem;
  entityManager: any;
  logger: any;
  config: Map<string, any>;
  // Optional utilities provided by host app
  commandParser?: any;
}

/**
 * Base plugin class
 */
@injectable()
export abstract class BasePlugin implements IPlugin {
  public metadata: IPluginMetadata;
  public container?: Container;
  public eventSystem?: EventSystem;
  public entityManager?: any;
  protected logger?: ILogger;

  constructor(metadata: IPluginMetadata) {
    this.metadata = metadata;
  }

  // Lifecycle hooks - can be overridden by subclasses
  async onLoad(): Promise<void> {
    this.logger?.info(`📦 Loading plugin: ${this.metadata.name} v${this.metadata.version}`);
  }

  async onUnload(): Promise<void> {
    this.logger?.info(`📦 Unloading plugin: ${this.metadata.name}`);
  }

  async onEnable(): Promise<void> {
    this.logger?.info(`✅ Enabling plugin: ${this.metadata.name}`);
  }

  async onDisable(): Promise<void> {
    this.logger?.info(`❌ Disabling plugin: ${this.metadata.name}`);
  }

  // Plugin initialization
  async initialize(context: IPluginContext): Promise<void> {
    this.container = context.container;
    this.eventSystem = context.eventSystem;
    this.entityManager = context.entityManager;
    this.logger = context.logger;

    // Bind plugin to container
    if (this.container) {
      this.container.bind(this.metadata.id).toConstantValue(this);
    }

    await this.onLoad();
  }

  // Plugin destruction
  async destroy(): Promise<void> {
    await this.onUnload();

    // Unbind from container
    if (this.container) {
      this.container.unbind(this.metadata.id);
    }
  }

  /**
   * Register an event handler
   */
  protected on(eventType: string, handler: (event: GameEvent) => void): void {
    if (this.eventSystem) {
      this.eventSystem.on(eventType, handler);
    }
  }

  /**
   * Remove an event handler
   */
  protected off(eventType: string, handler: (event: GameEvent) => void): void {
    if (this.eventSystem) {
      this.eventSystem.off(eventType, handler);
    }
  }

  /**
   * Emit an event
   */
  protected emit(event: GameEvent): void {
    if (this.eventSystem) {
      this.eventSystem.emit(event);
    }
  }

  /**
   * Get service from container
   */
  protected getService<T>(serviceId: string | symbol): T {
    if (!this.container) {
      throw new Error('Plugin container not available');
    }
    return this.container.get<T>(serviceId);
  }

  /**
   * Bind service to container
   */
  protected bindService(serviceId: string | symbol, implementation: any): void {
    if (!this.container) {
      throw new Error('Plugin container not available');
    }
    this.container.bind(serviceId).to(implementation);
  }
}

/**
 * Plugin manager for loading and managing plugins
 */
export class PluginManager {
  private container: Container;
  private eventSystem: EventSystem;
  private entityManager: any;
  private logger?: ILogger;
  private extras: { commandParser?: any } = {};
  private plugins: Map<string, IPlugin> = new Map();
  private loadedPlugins: Set<string> = new Set();
  private pluginOrder: string[] = [];

  constructor(
    container: Container,
    eventSystem: EventSystem,
    entityManager: any,
    logger?: ILogger
  ) {
    this.container = container;
    this.eventSystem = eventSystem;
    this.entityManager = entityManager;
    this.logger = logger;
    // Expose active manager for test harnesses or multi-manager coordination within the same runtime
    try {
      (globalThis as any).__mud_active_manager = this;
    } catch {
      // Silently ignore errors when setting global
    }
  }

  /**
   * Provide extra services to be passed into plugin initialize context
   */
  provideExtras(extras: { commandParser?: any }): void {
    this.extras = { ...this.extras, ...extras };
  }

  /**
   * Register a plugin
   */
  registerPlugin(plugin: IPlugin): void {
    const pluginId = plugin.metadata.id;

    if (this.plugins.has(pluginId)) {
      throw new Error(`Plugin already registered: ${pluginId}`);
    }

    this.plugins.set(pluginId, plugin);
    // Also register globally so other managers can discover it
    GLOBAL_PLUGIN_REGISTRY.set(pluginId, plugin);
    this.logger?.info(`📝 Registered plugin: ${plugin.metadata.name} (${pluginId})`);
  }

  /**
   * Load a plugin
   */
  async loadPlugin(pluginId: string): Promise<void> {
    let plugin = this.plugins.get(pluginId);
    if (!plugin) {
      // Try to discover from global registry (helps across different managers)
      const global = GLOBAL_PLUGIN_REGISTRY.get(pluginId);
      if (global) {
        this.plugins.set(pluginId, global);
        plugin = global;
      } else {
        throw new Error(`Plugin not found: ${pluginId}`);
      }
    }

    if (this.loadedPlugins.has(pluginId)) {
      this.logger?.warn(`⚠️  Plugin already loaded: ${pluginId}`);
      return;
    }

    // Check dependencies (must already be loaded either locally or globally)
    if (plugin.metadata.dependencies) {
      for (const depId of plugin.metadata.dependencies) {
        if (!this.isPluginLoaded(depId)) {
          throw new Error(`Dependency not loaded: ${depId} (required by ${pluginId})`);
        }
      }
    }

    try {
      // Create plugin context
      const context: IPluginContext = {
        container: this.container,
        eventSystem: this.eventSystem,
        entityManager: this.entityManager,
        logger: this.logger || console,
        config: new Map(),
        commandParser: this.extras.commandParser
      };

      // Initialize plugin
      await plugin.initialize?.(context);
      this.loadedPlugins.add(pluginId);
      GLOBAL_LOADED_PLUGINS.add(pluginId);
      this.pluginOrder.push(pluginId);

      this.logger?.info(`✅ Loaded plugin: ${plugin.metadata.name} v${plugin.metadata.version}`);

    } catch (error) {
      this.logger?.error(`❌ Failed to load plugin ${pluginId}:`, error);
      throw error;
    }
  }

  /**
   * Unload a plugin
   */
  async unloadPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginId}`);
    }

    if (!this.loadedPlugins.has(pluginId)) {
      this.logger?.warn(`⚠️  Plugin not loaded: ${pluginId}`);
      return;
    }

    try {
      await plugin.destroy?.();
      this.loadedPlugins.delete(pluginId);
      GLOBAL_LOADED_PLUGINS.delete(pluginId);
      GLOBAL_PLUGIN_REGISTRY.delete(pluginId);
      this.pluginOrder = this.pluginOrder.filter(id => id !== pluginId);

      this.logger?.info(`✅ Unloaded plugin: ${plugin.metadata.name}`);

    } catch (error) {
      this.logger?.error(`❌ Failed to unload plugin ${pluginId}:`, error);
      throw error;
    }
  }

  /**
   * Load all registered plugins in dependency order
   */
  async loadAllPlugins(): Promise<void> {
    const pluginsToLoad = Array.from(this.plugins.keys());

    // Simple topological sort for dependencies
    const sortedPlugins = this.topologicalSort(pluginsToLoad);

    for (const pluginId of sortedPlugins) {
      await this.loadPlugin(pluginId);
    }
  }

  /**
   * Unload all plugins in reverse order
   */
  async unloadAllPlugins(): Promise<void> {
    const pluginsToUnload = [...this.pluginOrder].reverse();

    for (const pluginId of pluginsToUnload) {
      await this.unloadPlugin(pluginId);
    }
  }

  /**
   * Get loaded plugin
   */
  getPlugin(pluginId: string): IPlugin | undefined {
    return this.plugins.get(pluginId);
  }

  /**
   * Get all loaded plugins
   */
  getLoadedPlugins(): IPlugin[] {
    return Array.from(this.loadedPlugins)
      .map(id => this.plugins.get(id))
      .filter(plugin => plugin !== undefined) as IPlugin[];
  }

  /**
   * Get plugin metadata
   */
  getPluginMetadata(): IPluginMetadata[] {
    return Array.from(this.plugins.values()).map(plugin => plugin.metadata);
  }

  /**
   * Check if plugin is loaded
   */
  isPluginLoaded(pluginId: string): boolean {
    return this.loadedPlugins.has(pluginId) || GLOBAL_LOADED_PLUGINS.has(pluginId);
  }

  /**
   * Topological sort for plugin dependencies
   */
  private topologicalSort(pluginIds: string[]): string[] {
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const result: string[] = [];

    const visit = (pluginId: string) => {
      if (visited.has(pluginId)) return;
      if (visiting.has(pluginId)) {
        throw new Error(`Circular dependency detected: ${pluginId}`);
      }

      visiting.add(pluginId);

      const plugin = this.plugins.get(pluginId);
      if (plugin?.metadata.dependencies) {
        for (const depId of plugin.metadata.dependencies) {
          if (this.plugins.has(depId)) {
            visit(depId);
          }
        }
      }

      visiting.delete(pluginId);
      visited.add(pluginId);
      result.push(pluginId);
    };

    for (const pluginId of pluginIds) {
      if (!visited.has(pluginId)) {
        visit(pluginId);
      }
    }

    return result;
  }
}

/**
 * Plugin loader for dynamic plugin loading
 */
export class PluginLoader {
  private pluginManager: PluginManager;

  constructor(pluginManager: PluginManager) {
    this.pluginManager = pluginManager;
  }

  /**
   * Load plugin from file path
   */
  async loadFromPath(pluginPath: string): Promise<void> {
    try {
      // In a real implementation, this would use dynamic imports
      // For now, we'll simulate with a simple require
      const pluginModule = require(pluginPath);

      if (typeof pluginModule.default === 'function') {
        const plugin = new pluginModule.default();
        this.pluginManager.registerPlugin(plugin);
      } else {
        throw new Error('Plugin must export a default class');
      }

    } catch (error) {
      console.error(`Failed to load plugin from ${pluginPath}:`, error);
      throw error;
    }
  }

  /**
   * Load plugins from directory
   */
  async loadFromDirectory(directoryPath: string): Promise<void> {
    const fs = require('fs');
    const path = require('path');

    if (!fs.existsSync(directoryPath)) {
      console.log(`⚠️  Plugin directory not found: ${directoryPath}`);
      return;
    }

    const files = fs.readdirSync(directoryPath)
      .filter(file => file.endsWith('.js') || file.endsWith('.ts'))
      .map(file => path.join(directoryPath, file));

    for (const file of files) {
      try {
        await this.loadFromPath(file);
      } catch (error) {
        console.error(`Failed to load plugin ${file}:`, error);
        // Continue loading other plugins
      }
    }
  }
}
