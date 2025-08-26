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
exports.PluginLoader = exports.PluginManager = exports.BasePlugin = void 0;
const inversify_1 = require("inversify");
const g = globalThis;
if (!g.__mud_plugins) {
    g.__mud_plugins = {
        registry: new Map(),
        loaded: new Set()
    };
}
const GLOBAL_PLUGIN_REGISTRY = g.__mud_plugins.registry;
const GLOBAL_LOADED_PLUGINS = g.__mud_plugins.loaded;
let BasePlugin = class BasePlugin {
    constructor(metadata) {
        this.metadata = metadata;
    }
    async onLoad() {
        this.logger?.info(`📦 Loading plugin: ${this.metadata.name} v${this.metadata.version}`);
    }
    async onUnload() {
        this.logger?.info(`📦 Unloading plugin: ${this.metadata.name}`);
    }
    async onEnable() {
        this.logger?.info(`✅ Enabling plugin: ${this.metadata.name}`);
    }
    async onDisable() {
        this.logger?.info(`❌ Disabling plugin: ${this.metadata.name}`);
    }
    async initialize(context) {
        this.container = context.container;
        this.eventSystem = context.eventSystem;
        this.entityManager = context.entityManager;
        this.logger = context.logger;
        if (this.container) {
            this.container.bind(this.metadata.id).toConstantValue(this);
        }
        await this.onLoad();
    }
    async destroy() {
        await this.onUnload();
        if (this.container) {
            this.container.unbind(this.metadata.id);
        }
    }
    on(eventType, handler) {
        if (this.eventSystem) {
            this.eventSystem.on(eventType, handler);
        }
    }
    off(eventType, handler) {
        if (this.eventSystem) {
            this.eventSystem.off(eventType, handler);
        }
    }
    emit(event) {
        if (this.eventSystem) {
            this.eventSystem.emit(event);
        }
    }
    getService(serviceId) {
        if (!this.container) {
            throw new Error('Plugin container not available');
        }
        return this.container.get(serviceId);
    }
    bindService(serviceId, implementation) {
        if (!this.container) {
            throw new Error('Plugin container not available');
        }
        this.container.bind(serviceId).to(implementation);
    }
};
exports.BasePlugin = BasePlugin;
exports.BasePlugin = BasePlugin = __decorate([
    (0, inversify_1.injectable)(),
    __metadata("design:paramtypes", [Object])
], BasePlugin);
class PluginManager {
    constructor(container, eventSystem, entityManager, logger) {
        this.extras = {};
        this.plugins = new Map();
        this.loadedPlugins = new Set();
        this.pluginOrder = [];
        this.container = container;
        this.eventSystem = eventSystem;
        this.entityManager = entityManager;
        this.logger = logger;
        try {
            globalThis.__mud_active_manager = this;
        }
        catch {
        }
    }
    provideExtras(extras) {
        this.extras = { ...this.extras, ...extras };
    }
    registerPlugin(plugin) {
        const pluginId = plugin.metadata.id;
        if (this.plugins.has(pluginId)) {
            throw new Error(`Plugin already registered: ${pluginId}`);
        }
        this.plugins.set(pluginId, plugin);
        GLOBAL_PLUGIN_REGISTRY.set(pluginId, plugin);
        this.logger?.info(`📝 Registered plugin: ${plugin.metadata.name} (${pluginId})`);
    }
    async loadPlugin(pluginId) {
        let plugin = this.plugins.get(pluginId);
        if (!plugin) {
            const global = GLOBAL_PLUGIN_REGISTRY.get(pluginId);
            if (global) {
                this.plugins.set(pluginId, global);
                plugin = global;
            }
            else {
                throw new Error(`Plugin not found: ${pluginId}`);
            }
        }
        if (this.loadedPlugins.has(pluginId)) {
            this.logger?.warn(`⚠️  Plugin already loaded: ${pluginId}`);
            return;
        }
        if (plugin.metadata.dependencies) {
            for (const depId of plugin.metadata.dependencies) {
                if (!this.isPluginLoaded(depId)) {
                    throw new Error(`Dependency not loaded: ${depId} (required by ${pluginId})`);
                }
            }
        }
        try {
            const context = {
                container: this.container,
                eventSystem: this.eventSystem,
                entityManager: this.entityManager,
                logger: this.logger || console,
                config: new Map(),
                commandParser: this.extras.commandParser
            };
            await plugin.initialize?.(context);
            this.loadedPlugins.add(pluginId);
            GLOBAL_LOADED_PLUGINS.add(pluginId);
            this.pluginOrder.push(pluginId);
            this.logger?.info(`✅ Loaded plugin: ${plugin.metadata.name} v${plugin.metadata.version}`);
        }
        catch (error) {
            this.logger?.error(`❌ Failed to load plugin ${pluginId}:`, error);
            throw error;
        }
    }
    async unloadPlugin(pluginId) {
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
        }
        catch (error) {
            this.logger?.error(`❌ Failed to unload plugin ${pluginId}:`, error);
            throw error;
        }
    }
    async loadAllPlugins() {
        const pluginsToLoad = Array.from(this.plugins.keys());
        const sortedPlugins = this.topologicalSort(pluginsToLoad);
        for (const pluginId of sortedPlugins) {
            await this.loadPlugin(pluginId);
        }
    }
    async unloadAllPlugins() {
        const pluginsToUnload = [...this.pluginOrder].reverse();
        for (const pluginId of pluginsToUnload) {
            await this.unloadPlugin(pluginId);
        }
    }
    getPlugin(pluginId) {
        return this.plugins.get(pluginId);
    }
    getLoadedPlugins() {
        return Array.from(this.loadedPlugins)
            .map(id => this.plugins.get(id))
            .filter(plugin => plugin !== undefined);
    }
    getPluginMetadata() {
        return Array.from(this.plugins.values()).map(plugin => plugin.metadata);
    }
    isPluginLoaded(pluginId) {
        return this.loadedPlugins.has(pluginId) || GLOBAL_LOADED_PLUGINS.has(pluginId);
    }
    topologicalSort(pluginIds) {
        const visited = new Set();
        const visiting = new Set();
        const result = [];
        const visit = (pluginId) => {
            if (visited.has(pluginId))
                return;
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
exports.PluginManager = PluginManager;
class PluginLoader {
    constructor(pluginManager) {
        this.pluginManager = pluginManager;
    }
    async loadFromPath(pluginPath) {
        try {
            const pluginModule = require(pluginPath);
            if (typeof pluginModule.default === 'function') {
                const plugin = new pluginModule.default();
                this.pluginManager.registerPlugin(plugin);
            }
            else {
                throw new Error('Plugin must export a default class');
            }
        }
        catch (error) {
            console.error(`Failed to load plugin from ${pluginPath}:`, error);
            throw error;
        }
    }
    async loadFromDirectory(directoryPath) {
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
            }
            catch (error) {
                console.error(`Failed to load plugin ${file}:`, error);
            }
        }
    }
}
exports.PluginLoader = PluginLoader;
//# sourceMappingURL=plugin.js.map