"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const plugin_1 = require("../../engine/core/plugin");
const event_1 = require("../../engine/core/event");
const inversify_1 = require("inversify");
class TestPlugin extends plugin_1.BasePlugin {
    constructor(metadata) {
        super(metadata);
        this.loadCount = 0;
        this.unloadCount = 0;
        this.enableCount = 0;
        this.disableCount = 0;
    }
    async onLoad() {
        this.loadCount++;
        await super.onLoad();
    }
    async onUnload() {
        this.unloadCount++;
        await super.onUnload();
    }
    async onEnable() {
        this.enableCount++;
        await super.onEnable();
    }
    async onDisable() {
        this.disableCount++;
        await super.onDisable();
    }
    testOn(eventType, handler) {
        this.on(eventType, handler);
    }
    testEmit(event) {
        this.emit(event);
    }
    testGetService(serviceId) {
        return this.getService(serviceId);
    }
    testBindService(serviceId, implementation) {
        this.bindService(serviceId, implementation);
    }
}
(0, vitest_1.describe)('Plugin System', () => {
    (0, vitest_1.describe)('BasePlugin', () => {
        let plugin;
        let mockContainer;
        let mockEventSystem;
        let mockContext;
        (0, vitest_1.beforeEach)(() => {
            const metadata = {
                id: 'test-plugin',
                name: 'Test Plugin',
                version: '1.0.0',
                description: 'A test plugin'
            };
            plugin = new TestPlugin(metadata);
            mockContainer = new inversify_1.Container();
            mockEventSystem = new event_1.EventSystem();
            mockContext = {
                container: mockContainer,
                eventSystem: mockEventSystem,
                entityManager: null,
                logger: console,
                config: new Map()
            };
        });
        (0, vitest_1.it)('should initialize with correct metadata', () => {
            (0, vitest_1.expect)(plugin.metadata.id).toBe('test-plugin');
            (0, vitest_1.expect)(plugin.metadata.name).toBe('Test Plugin');
            (0, vitest_1.expect)(plugin.metadata.version).toBe('1.0.0');
            (0, vitest_1.expect)(plugin.metadata.description).toBe('A test plugin');
        });
        (0, vitest_1.it)('should initialize plugin context correctly', async () => {
            await plugin.initialize(mockContext);
            (0, vitest_1.expect)(plugin.container).toBe(mockContainer);
            (0, vitest_1.expect)(plugin.eventSystem).toBe(mockEventSystem);
            (0, vitest_1.expect)(plugin.loadCount).toBe(1);
        });
        (0, vitest_1.it)('should bind plugin to container during initialization', async () => {
            const bindSpy = vitest_1.vi.spyOn(mockContainer, 'bind');
            await plugin.initialize(mockContext);
            (0, vitest_1.expect)(bindSpy).toHaveBeenCalledWith('test-plugin');
        });
        (0, vitest_1.it)('should call lifecycle hooks in correct order', async () => {
            await plugin.initialize(mockContext);
            (0, vitest_1.expect)(plugin.loadCount).toBe(1);
            await plugin.destroy();
            (0, vitest_1.expect)(plugin.unloadCount).toBe(1);
        });
        (0, vitest_1.it)('should handle event system methods', async () => {
            await plugin.initialize(mockContext);
            const handler = vitest_1.vi.fn();
            plugin.testOn('test.event', handler);
            const event = { eventType: 'test.event', source: 'test', timestamp: new Date() };
            await mockEventSystem.emit(event);
            (0, vitest_1.expect)(handler).toHaveBeenCalledWith(event);
        });
        (0, vitest_1.it)('should handle event emission', async () => {
            await plugin.initialize(mockContext);
            const emitSpy = vitest_1.vi.spyOn(mockEventSystem, 'emit');
            const event = { eventType: 'test.event', source: 'test', timestamp: new Date() };
            plugin.testEmit(event);
            (0, vitest_1.expect)(emitSpy).toHaveBeenCalledWith(event);
        });
        (0, vitest_1.it)('should get services from container', async () => {
            const mockService = { test: true };
            mockContainer.bind('test-service').toConstantValue(mockService);
            await plugin.initialize(mockContext);
            const service = plugin.testGetService('test-service');
            (0, vitest_1.expect)(service).toBe(mockService);
        });
        (0, vitest_1.it)('should bind services to container', async () => {
            const mockService = { test: true };
            const bindSpy = vitest_1.vi.spyOn(mockContainer, 'bind');
            await plugin.initialize(mockContext);
            plugin.testBindService('new-service', mockService);
            (0, vitest_1.expect)(bindSpy).toHaveBeenCalledWith('new-service');
        });
        (0, vitest_1.it)('should throw error when accessing services without container', () => {
            (0, vitest_1.expect)(() => plugin.testGetService('test')).toThrow('Plugin container not available');
        });
        (0, vitest_1.it)('should throw error when binding services without container', () => {
            (0, vitest_1.expect)(() => plugin.testBindService('test', {})).toThrow('Plugin container not available');
        });
    });
    (0, vitest_1.describe)('PluginManager', () => {
        let pluginManager;
        let mockContainer;
        let mockEventSystem;
        let mockEntityManager;
        (0, vitest_1.beforeEach)(() => {
            mockContainer = new inversify_1.Container();
            mockEventSystem = new event_1.EventSystem();
            mockEntityManager = {};
            pluginManager = new plugin_1.PluginManager(mockContainer, mockEventSystem, mockEntityManager);
        });
        (0, vitest_1.it)('should register plugins', () => {
            const plugin = new TestPlugin({
                id: 'test-plugin',
                name: 'Test Plugin',
                version: '1.0.0'
            });
            pluginManager.registerPlugin(plugin);
            (0, vitest_1.expect)(pluginManager.isPluginLoaded('test-plugin')).toBe(false);
        });
        (0, vitest_1.it)('should load plugins', async () => {
            const plugin = new TestPlugin({
                id: 'test-plugin',
                name: 'Test Plugin',
                version: '1.0.0'
            });
            pluginManager.registerPlugin(plugin);
            await pluginManager.loadPlugin('test-plugin');
            (0, vitest_1.expect)(pluginManager.isPluginLoaded('test-plugin')).toBe(true);
            (0, vitest_1.expect)(plugin.loadCount).toBe(1);
        });
        (0, vitest_1.it)('should throw error for non-existent plugins', async () => {
            await (0, vitest_1.expect)(pluginManager.loadPlugin('non-existent')).rejects.toThrow('Plugin not found: non-existent');
        });
        (0, vitest_1.it)('should handle plugin dependencies', async () => {
            const plugin1 = new TestPlugin({
                id: 'plugin1',
                name: 'Plugin 1',
                version: '1.0.0'
            });
            const plugin2 = new TestPlugin({
                id: 'plugin2',
                name: 'Plugin 2',
                version: '1.0.0',
                dependencies: ['plugin1']
            });
            pluginManager.registerPlugin(plugin1);
            pluginManager.registerPlugin(plugin2);
            await (0, vitest_1.expect)(pluginManager.loadPlugin('plugin2')).rejects.toThrow('Dependency not loaded: plugin1');
            await pluginManager.loadPlugin('plugin1');
            await pluginManager.loadPlugin('plugin2');
            (0, vitest_1.expect)(pluginManager.isPluginLoaded('plugin1')).toBe(true);
            (0, vitest_1.expect)(pluginManager.isPluginLoaded('plugin2')).toBe(true);
        });
        (0, vitest_1.it)('should unload plugins', async () => {
            const plugin = new TestPlugin({
                id: 'test-plugin',
                name: 'Test Plugin',
                version: '1.0.0'
            });
            pluginManager.registerPlugin(plugin);
            await pluginManager.loadPlugin('test-plugin');
            (0, vitest_1.expect)(pluginManager.isPluginLoaded('test-plugin')).toBe(true);
            await pluginManager.unloadPlugin('test-plugin');
            (0, vitest_1.expect)(pluginManager.isPluginLoaded('test-plugin')).toBe(false);
            (0, vitest_1.expect)(plugin.unloadCount).toBe(1);
        });
        (0, vitest_1.it)('should load all plugins in dependency order', async () => {
            const plugin1 = new TestPlugin({
                id: 'plugin1',
                name: 'Plugin 1',
                version: '1.0.0'
            });
            const plugin2 = new TestPlugin({
                id: 'plugin2',
                name: 'Plugin 2',
                version: '1.0.0',
                dependencies: ['plugin1']
            });
            const plugin3 = new TestPlugin({
                id: 'plugin3',
                name: 'Plugin 3',
                version: '1.0.0',
                dependencies: ['plugin2']
            });
            pluginManager.registerPlugin(plugin3);
            pluginManager.registerPlugin(plugin1);
            pluginManager.registerPlugin(plugin2);
            await pluginManager.loadAllPlugins();
            (0, vitest_1.expect)(pluginManager.isPluginLoaded('plugin1')).toBe(true);
            (0, vitest_1.expect)(pluginManager.isPluginLoaded('plugin2')).toBe(true);
            (0, vitest_1.expect)(pluginManager.isPluginLoaded('plugin3')).toBe(true);
            (0, vitest_1.expect)(plugin1.loadCount).toBe(1);
            (0, vitest_1.expect)(plugin2.loadCount).toBe(1);
            (0, vitest_1.expect)(plugin3.loadCount).toBe(1);
        });
        (0, vitest_1.it)('should unload all plugins in reverse order', async () => {
            const plugin1 = new TestPlugin({
                id: 'plugin1',
                name: 'Plugin 1',
                version: '1.0.0'
            });
            const plugin2 = new TestPlugin({
                id: 'plugin2',
                name: 'Plugin 2',
                version: '1.0.0',
                dependencies: ['plugin1']
            });
            pluginManager.registerPlugin(plugin1);
            pluginManager.registerPlugin(plugin2);
            await pluginManager.loadAllPlugins();
            await pluginManager.unloadAllPlugins();
            (0, vitest_1.expect)(pluginManager.isPluginLoaded('plugin1')).toBe(false);
            (0, vitest_1.expect)(pluginManager.isPluginLoaded('plugin2')).toBe(false);
            (0, vitest_1.expect)(plugin1.unloadCount).toBe(1);
            (0, vitest_1.expect)(plugin2.unloadCount).toBe(1);
        });
        (0, vitest_1.it)('should get loaded plugins', async () => {
            const plugin1 = new TestPlugin({
                id: 'plugin1',
                name: 'Plugin 1',
                version: '1.0.0'
            });
            const plugin2 = new TestPlugin({
                id: 'plugin2',
                name: 'Plugin 2',
                version: '1.0.0'
            });
            pluginManager.registerPlugin(plugin1);
            pluginManager.registerPlugin(plugin2);
            await pluginManager.loadPlugin('plugin1');
            const loadedPlugins = pluginManager.getLoadedPlugins();
            (0, vitest_1.expect)(loadedPlugins).toHaveLength(1);
            (0, vitest_1.expect)(loadedPlugins[0]).toBe(plugin1);
        });
        (0, vitest_1.it)('should get plugin metadata', () => {
            const plugin = new TestPlugin({
                id: 'test-plugin',
                name: 'Test Plugin',
                version: '1.0.0',
                description: 'A test plugin'
            });
            pluginManager.registerPlugin(plugin);
            const metadata = pluginManager.getPluginMetadata();
            (0, vitest_1.expect)(metadata).toHaveLength(1);
            (0, vitest_1.expect)(metadata[0]).toEqual(plugin.metadata);
        });
        (0, vitest_1.it)('should detect circular dependencies', async () => {
            const plugin1 = new TestPlugin({
                id: 'plugin1',
                name: 'Plugin 1',
                version: '1.0.0',
                dependencies: ['plugin2']
            });
            const plugin2 = new TestPlugin({
                id: 'plugin2',
                name: 'Plugin 2',
                version: '1.0.0',
                dependencies: ['plugin1']
            });
            pluginManager.registerPlugin(plugin1);
            pluginManager.registerPlugin(plugin2);
            await (0, vitest_1.expect)(pluginManager.loadAllPlugins()).rejects.toThrow('Circular dependency detected');
        });
        (0, vitest_1.it)('should handle plugin loading errors gracefully', async () => {
            const plugin = new TestPlugin({
                id: 'failing-plugin',
                name: 'Failing Plugin',
                version: '1.0.0'
            });
            const initializeSpy = vitest_1.vi.spyOn(plugin, 'initialize').mockRejectedValue(new Error('Init failed'));
            pluginManager.registerPlugin(plugin);
            await (0, vitest_1.expect)(pluginManager.loadPlugin('failing-plugin')).rejects.toThrow('Init failed');
            (0, vitest_1.expect)(pluginManager.isPluginLoaded('failing-plugin')).toBe(false);
        });
    });
    (0, vitest_1.describe)('Plugin Integration', () => {
        let pluginManager;
        let mockContainer;
        let mockEventSystem;
        (0, vitest_1.beforeEach)(() => {
            mockContainer = new inversify_1.Container();
            mockEventSystem = new event_1.EventSystem();
            pluginManager = new plugin_1.PluginManager(mockContainer, mockEventSystem, {});
        });
        (0, vitest_1.it)('should support inter-plugin communication', async () => {
            let receivedMessage = '';
            const senderPlugin = new TestPlugin({
                id: 'sender',
                name: 'Sender Plugin',
                version: '1.0.0'
            });
            const receiverPlugin = new TestPlugin({
                id: 'receiver',
                name: 'Receiver Plugin',
                version: '1.0.0'
            });
            const originalOnLoad = receiverPlugin.onLoad.bind(receiverPlugin);
            receiverPlugin.onLoad = async () => {
                await originalOnLoad();
                mockEventSystem.on('plugin.message', (event) => {
                    receivedMessage = event.data.message;
                });
            };
            pluginManager.registerPlugin(senderPlugin);
            pluginManager.registerPlugin(receiverPlugin);
            await pluginManager.loadAllPlugins();
            const event = { eventType: 'plugin.message', source: 'sender', data: { message: 'Hello!' }, timestamp: new Date() };
            await mockEventSystem.emit(event);
            (0, vitest_1.expect)(receivedMessage).toBe('Hello!');
        });
        (0, vitest_1.it)('should handle plugin service dependencies', async () => {
            const servicePlugin = new TestPlugin({
                id: 'service-provider',
                name: 'Service Provider',
                version: '1.0.0'
            });
            const consumerPlugin = new TestPlugin({
                id: 'service-consumer',
                name: 'Service Consumer',
                version: '1.0.0',
                dependencies: ['service-provider']
            });
            const originalOnLoad = servicePlugin.onLoad.bind(servicePlugin);
            servicePlugin.onLoad = async () => {
                await originalOnLoad();
                mockContainer.bind('test-service').toConstantValue({ value: 42 });
            };
            let consumedValue = 0;
            const consumerOnLoad = consumerPlugin.onLoad.bind(consumerPlugin);
            consumerPlugin.onLoad = async () => {
                await consumerOnLoad();
                const service = mockContainer.get('test-service');
                consumedValue = service.value;
            };
            pluginManager.registerPlugin(servicePlugin);
            pluginManager.registerPlugin(consumerPlugin);
            await pluginManager.loadAllPlugins();
            (0, vitest_1.expect)(consumedValue).toBe(42);
        });
        (0, vitest_1.it)('should maintain plugin lifecycle state correctly', async () => {
            const plugin = new TestPlugin({
                id: 'lifecycle-test',
                name: 'Lifecycle Test',
                version: '1.0.0'
            });
            pluginManager.registerPlugin(plugin);
            (0, vitest_1.expect)(plugin.loadCount).toBe(0);
            (0, vitest_1.expect)(plugin.unloadCount).toBe(0);
            await pluginManager.loadPlugin('lifecycle-test');
            (0, vitest_1.expect)(plugin.loadCount).toBe(1);
            (0, vitest_1.expect)(plugin.unloadCount).toBe(0);
            await pluginManager.unloadPlugin('lifecycle-test');
            (0, vitest_1.expect)(plugin.loadCount).toBe(1);
            (0, vitest_1.expect)(plugin.unloadCount).toBe(1);
        });
    });
});
//# sourceMappingURL=plugin.test.js.map