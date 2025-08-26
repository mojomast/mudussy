import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  BasePlugin,
  PluginManager,
  IPluginMetadata,
  IPluginContext
} from '../../engine/core/plugin';
import { EventSystem } from '../../engine/core/event';
import { Container } from 'inversify';

// Concrete plugin implementation for testing
class TestPlugin extends BasePlugin {
  public loadCount = 0;
  public unloadCount = 0;
  public enableCount = 0;
  public disableCount = 0;

  constructor(metadata: IPluginMetadata) {
    super(metadata);
  }

  async onLoad(): Promise<void> {
    this.loadCount++;
    await super.onLoad();
  }

  async onUnload(): Promise<void> {
    this.unloadCount++;
    await super.onUnload();
  }

  async onEnable(): Promise<void> {
    this.enableCount++;
    await super.onEnable();
  }

  async onDisable(): Promise<void> {
    this.disableCount++;
    await super.onDisable();
  }

  // Public wrappers for testing protected methods
  public testOn(eventType: string, handler: (event: any) => void): void {
    this.on(eventType, handler);
  }

  public testEmit(event: any): void {
    this.emit(event);
  }

  public testGetService<T>(serviceId: string | symbol): T {
    return this.getService<T>(serviceId);
  }

  public testBindService(serviceId: string | symbol, implementation: any): void {
    this.bindService(serviceId, implementation);
  }
}

describe('Plugin System', () => {
  describe('BasePlugin', () => {
    let plugin: TestPlugin;
    let mockContainer: Container;
    let mockEventSystem: EventSystem;
    let mockContext: IPluginContext;

    beforeEach(() => {
      const metadata: IPluginMetadata = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'A test plugin'
      };

      plugin = new TestPlugin(metadata);
      mockContainer = new Container();
      mockEventSystem = new EventSystem();
      mockContext = {
        container: mockContainer,
        eventSystem: mockEventSystem,
        entityManager: null,
        logger: console,
        config: new Map()
      };
    });

    it('should initialize with correct metadata', () => {
      expect(plugin.metadata.id).toBe('test-plugin');
      expect(plugin.metadata.name).toBe('Test Plugin');
      expect(plugin.metadata.version).toBe('1.0.0');
      expect(plugin.metadata.description).toBe('A test plugin');
    });

    it('should initialize plugin context correctly', async () => {
      await plugin.initialize(mockContext);

      expect(plugin.container).toBe(mockContainer);
      expect(plugin.eventSystem).toBe(mockEventSystem);
      expect(plugin.loadCount).toBe(1);
    });

    it('should bind plugin to container during initialization', async () => {
      const bindSpy = vi.spyOn(mockContainer, 'bind');

      await plugin.initialize(mockContext);

      expect(bindSpy).toHaveBeenCalledWith('test-plugin');
    });

    it('should call lifecycle hooks in correct order', async () => {
      await plugin.initialize(mockContext);
      expect(plugin.loadCount).toBe(1);

      await plugin.destroy();
      expect(plugin.unloadCount).toBe(1);
    });

    it('should handle event system methods', async () => {
      await plugin.initialize(mockContext);

      const handler = vi.fn();
      plugin.testOn('test.event', handler);

      const event = { eventType: 'test.event', source: 'test', timestamp: new Date() };
      await mockEventSystem.emit(event as any);

      expect(handler).toHaveBeenCalledWith(event);
    });

    it('should handle event emission', async () => {
      await plugin.initialize(mockContext);

      const emitSpy = vi.spyOn(mockEventSystem, 'emit');
      const event = { eventType: 'test.event', source: 'test', timestamp: new Date() };

      plugin.testEmit(event as any);

      expect(emitSpy).toHaveBeenCalledWith(event);
    });

    it('should get services from container', async () => {
      const mockService = { test: true };
      mockContainer.bind('test-service').toConstantValue(mockService);

      await plugin.initialize(mockContext);

      const service = plugin.testGetService('test-service');
      expect(service).toBe(mockService);
    });

    it('should bind services to container', async () => {
      const mockService = { test: true };
      const bindSpy = vi.spyOn(mockContainer, 'bind');

      await plugin.initialize(mockContext);
      plugin.testBindService('new-service', mockService);

      expect(bindSpy).toHaveBeenCalledWith('new-service');
    });

    it('should throw error when accessing services without container', () => {
      expect(() => plugin.testGetService('test')).toThrow('Plugin container not available');
    });

    it('should throw error when binding services without container', () => {
      expect(() => plugin.testBindService('test', {})).toThrow('Plugin container not available');
    });
  });

  describe('PluginManager', () => {
    let pluginManager: PluginManager;
    let mockContainer: Container;
    let mockEventSystem: EventSystem;
    let mockEntityManager: any;

    beforeEach(() => {
      mockContainer = new Container();
      mockEventSystem = new EventSystem();
      mockEntityManager = {};
      pluginManager = new PluginManager(mockContainer, mockEventSystem, mockEntityManager);
    });

    it('should register plugins', () => {
      const plugin = new TestPlugin({
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0'
      });

      pluginManager.registerPlugin(plugin);

      expect(pluginManager.isPluginLoaded('test-plugin')).toBe(false);
    });

    it('should load plugins', async () => {
      const plugin = new TestPlugin({
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0'
      });

      pluginManager.registerPlugin(plugin);
      await pluginManager.loadPlugin('test-plugin');

      expect(pluginManager.isPluginLoaded('test-plugin')).toBe(true);
      expect(plugin.loadCount).toBe(1);
    });

    it('should throw error for non-existent plugins', async () => {
      await expect(pluginManager.loadPlugin('non-existent')).rejects.toThrow('Plugin not found: non-existent');
    });

    it('should handle plugin dependencies', async () => {
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

      // Should fail without dependency
      await expect(pluginManager.loadPlugin('plugin2')).rejects.toThrow('Dependency not loaded: plugin1');

      // Should succeed with dependency
      await pluginManager.loadPlugin('plugin1');
      await pluginManager.loadPlugin('plugin2');

      expect(pluginManager.isPluginLoaded('plugin1')).toBe(true);
      expect(pluginManager.isPluginLoaded('plugin2')).toBe(true);
    });

    it('should unload plugins', async () => {
      const plugin = new TestPlugin({
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0'
      });

      pluginManager.registerPlugin(plugin);
      await pluginManager.loadPlugin('test-plugin');

      expect(pluginManager.isPluginLoaded('test-plugin')).toBe(true);

      await pluginManager.unloadPlugin('test-plugin');

      expect(pluginManager.isPluginLoaded('test-plugin')).toBe(false);
      expect(plugin.unloadCount).toBe(1);
    });

    it('should load all plugins in dependency order', async () => {
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

      // Register in wrong order to test sorting
      pluginManager.registerPlugin(plugin3);
      pluginManager.registerPlugin(plugin1);
      pluginManager.registerPlugin(plugin2);

      await pluginManager.loadAllPlugins();

      expect(pluginManager.isPluginLoaded('plugin1')).toBe(true);
      expect(pluginManager.isPluginLoaded('plugin2')).toBe(true);
      expect(pluginManager.isPluginLoaded('plugin3')).toBe(true);

      expect(plugin1.loadCount).toBe(1);
      expect(plugin2.loadCount).toBe(1);
      expect(plugin3.loadCount).toBe(1);
    });

    it('should unload all plugins in reverse order', async () => {
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

      expect(pluginManager.isPluginLoaded('plugin1')).toBe(false);
      expect(pluginManager.isPluginLoaded('plugin2')).toBe(false);

      expect(plugin1.unloadCount).toBe(1);
      expect(plugin2.unloadCount).toBe(1);
    });

    it('should get loaded plugins', async () => {
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
      expect(loadedPlugins).toHaveLength(1);
      expect(loadedPlugins[0]).toBe(plugin1);
    });

    it('should get plugin metadata', () => {
      const plugin = new TestPlugin({
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'A test plugin'
      });

      pluginManager.registerPlugin(plugin);

      const metadata = pluginManager.getPluginMetadata();
      expect(metadata).toHaveLength(1);
      expect(metadata[0]).toEqual(plugin.metadata);
    });

    it('should detect circular dependencies', async () => {
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

      await expect(pluginManager.loadAllPlugins()).rejects.toThrow('Circular dependency detected');
    });

    it('should handle plugin loading errors gracefully', async () => {
      const plugin = new TestPlugin({
        id: 'failing-plugin',
        name: 'Failing Plugin',
        version: '1.0.0'
      });

      // Mock the initialize method to throw
      const initializeSpy = vi.spyOn(plugin, 'initialize').mockRejectedValue(new Error('Init failed'));

      pluginManager.registerPlugin(plugin);

      await expect(pluginManager.loadPlugin('failing-plugin')).rejects.toThrow('Init failed');
      expect(pluginManager.isPluginLoaded('failing-plugin')).toBe(false);
    });
  });

  describe('Plugin Integration', () => {
    let pluginManager: PluginManager;
    let mockContainer: Container;
    let mockEventSystem: EventSystem;

    beforeEach(() => {
      mockContainer = new Container();
      mockEventSystem = new EventSystem();
      pluginManager = new PluginManager(mockContainer, mockEventSystem, {});
    });

    it('should support inter-plugin communication', async () => {
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

      // Override receiver to listen for messages
      const originalOnLoad = receiverPlugin.onLoad.bind(receiverPlugin);
      receiverPlugin.onLoad = async () => {
        await originalOnLoad();
        mockEventSystem.on('plugin.message', (event: any) => {
          receivedMessage = event.data.message;
        });
      };

      pluginManager.registerPlugin(senderPlugin);
      pluginManager.registerPlugin(receiverPlugin);

      await pluginManager.loadAllPlugins();

      // Sender emits message
      const event = { eventType: 'plugin.message', source: 'sender', data: { message: 'Hello!' }, timestamp: new Date() };
      await mockEventSystem.emit(event as any);

      expect(receivedMessage).toBe('Hello!');
    });

    it('should handle plugin service dependencies', async () => {
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

      // Service provider registers a service
      const originalOnLoad = servicePlugin.onLoad.bind(servicePlugin);
      servicePlugin.onLoad = async () => {
        await originalOnLoad();
        mockContainer.bind('test-service').toConstantValue({ value: 42 });
      };

      // Consumer uses the service
      let consumedValue = 0;
      const consumerOnLoad = consumerPlugin.onLoad.bind(consumerPlugin);
      consumerPlugin.onLoad = async () => {
        await consumerOnLoad();
        const service = mockContainer.get('test-service') as { value: number };
        consumedValue = service.value;
      };

      pluginManager.registerPlugin(servicePlugin);
      pluginManager.registerPlugin(consumerPlugin);

      await pluginManager.loadAllPlugins();

      expect(consumedValue).toBe(42);
    });

    it('should maintain plugin lifecycle state correctly', async () => {
      const plugin = new TestPlugin({
        id: 'lifecycle-test',
        name: 'Lifecycle Test',
        version: '1.0.0'
      });

      pluginManager.registerPlugin(plugin);

      expect(plugin.loadCount).toBe(0);
      expect(plugin.unloadCount).toBe(0);

      await pluginManager.loadPlugin('lifecycle-test');
      expect(plugin.loadCount).toBe(1);
      expect(plugin.unloadCount).toBe(0);

      await pluginManager.unloadPlugin('lifecycle-test');
      expect(plugin.loadCount).toBe(1);
      expect(plugin.unloadCount).toBe(1);
    });
  });
});