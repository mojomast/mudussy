import { Container } from 'inversify';
import { EventSystem, GameEvent } from './event';
import { ILogger } from './logger';
export interface IPluginMetadata {
    id: string;
    name: string;
    version: string;
    description?: string;
    author?: string;
    dependencies?: string[];
    provides?: string[];
}
export interface IPluginHooks {
    onLoad?: () => void | Promise<void>;
    onUnload?: () => void | Promise<void>;
    onEnable?: () => void | Promise<void>;
    onDisable?: () => void | Promise<void>;
}
export interface IPlugin extends IPluginHooks {
    metadata: IPluginMetadata;
    container?: Container;
    eventSystem?: EventSystem;
    entityManager?: any;
    initialize?: (context: IPluginContext) => void | Promise<void>;
    destroy?: () => void | Promise<void>;
}
export interface IPluginContext {
    container: Container;
    eventSystem: EventSystem;
    entityManager: any;
    logger: any;
    config: Map<string, any>;
    commandParser?: any;
}
export declare abstract class BasePlugin implements IPlugin {
    metadata: IPluginMetadata;
    container?: Container;
    eventSystem?: EventSystem;
    entityManager?: any;
    protected logger?: ILogger;
    constructor(metadata: IPluginMetadata);
    onLoad(): Promise<void>;
    onUnload(): Promise<void>;
    onEnable(): Promise<void>;
    onDisable(): Promise<void>;
    initialize(context: IPluginContext): Promise<void>;
    destroy(): Promise<void>;
    protected on(eventType: string, handler: (event: GameEvent) => void): void;
    protected off(eventType: string, handler: (event: GameEvent) => void): void;
    protected emit(event: GameEvent): void;
    protected getService<T>(serviceId: string | symbol): T;
    protected bindService(serviceId: string | symbol, implementation: any): void;
}
export declare class PluginManager {
    private container;
    private eventSystem;
    private entityManager;
    private logger?;
    private extras;
    private plugins;
    private loadedPlugins;
    private pluginOrder;
    constructor(container: Container, eventSystem: EventSystem, entityManager: any, logger?: ILogger);
    provideExtras(extras: {
        commandParser?: any;
    }): void;
    registerPlugin(plugin: IPlugin): void;
    loadPlugin(pluginId: string): Promise<void>;
    unloadPlugin(pluginId: string): Promise<void>;
    loadAllPlugins(): Promise<void>;
    unloadAllPlugins(): Promise<void>;
    getPlugin(pluginId: string): IPlugin | undefined;
    getLoadedPlugins(): IPlugin[];
    getPluginMetadata(): IPluginMetadata[];
    isPluginLoaded(pluginId: string): boolean;
    private topologicalSort;
}
export declare class PluginLoader {
    private pluginManager;
    constructor(pluginManager: PluginManager);
    loadFromPath(pluginPath: string): Promise<void>;
    loadFromDirectory(directoryPath: string): Promise<void>;
}
