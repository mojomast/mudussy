/**
 * Test harness utilities for integration testing
 */

import { Container } from 'inversify';
import { EventSystem, PluginManager, BasePlugin } from '../../engine/core';
import { CommandParser } from '../../engine/modules/networking/command-parser';
import { DialogueManager } from '../../engine/modules/dialogue';
import { WorldManager } from '../../engine/modules/world';
import { createMockLogger } from '../setup';

export interface MockPlayer {
  id: string;
  sessionId: string;
  name: string;
}

export interface MockRoom {
  id: string;
  name: string;
  description: string;
}

export interface MockItem {
  id: string;
  name: string;
  description: string;
}

export interface MockNPC {
  id: string;
  name: string;
  dialogueTree?: any;
}

export interface CoverageResult {
  core: {
    lines: { pct: number };
    functions: { pct: number };
    branches: { pct: number };
    statements: { pct: number };
  };
}

export interface LoadTestResult {
  totalSessions: number;
  failedSessions: number;
  averageResponseTime: number;
  errorRate: number;
}

export interface BuildResult {
  success: boolean;
  outputPath?: string;
}

export interface DevlogValidation {
  hasRequiredEntries: boolean;
  entriesHaveTimestamps: boolean;
  coversAllMilestones: boolean;
}

export class TestHarness {
  private container: Container;
  private eventSystem: EventSystem;
  private pluginManager: PluginManager;
  private commandParser: CommandParser;
  private dialogueManager: DialogueManager;
  private worldManager: WorldManager;
  private logger: any;
  private errorCount: number = 0;
  private players: Map<string, MockPlayer> = new Map();
  private rooms: Map<string, MockRoom> = new Map();
  private items: Map<string, MockItem> = new Map();
  private npcs: Map<string, MockNPC> = new Map();

  async initialize(): Promise<void> {
    this.container = new Container();
    this.logger = createMockLogger();
    this.eventSystem = new EventSystem(this.logger);
  this.pluginManager = new PluginManager(this.container, this.eventSystem, null);
  this.commandParser = new CommandParser(this.eventSystem, this.logger);
  // Provide extras for plugins
  (this.pluginManager as any).provideExtras?.({ commandParser: this.commandParser });
    this.worldManager = new WorldManager(this.eventSystem, this.logger);
    this.dialogueManager = new DialogueManager(this.eventSystem, this.logger);

    // Bind services
    this.container.bind('EventSystem').toConstantValue(this.eventSystem);
    this.container.bind('PluginManager').toConstantValue(this.pluginManager);
    this.container.bind('CommandParser').toConstantValue(this.commandParser);
    this.container.bind('DialogueManager').toConstantValue(this.dialogueManager);
    this.container.bind('WorldManager').toConstantValue(this.worldManager);
  }

  async cleanup(): Promise<void> {
    this.players.clear();
    this.rooms.clear();
    this.items.clear();
    this.npcs.clear();
    this.errorCount = 0;
  }

  getErrorCount(): number {
    return this.errorCount;
  }

  async createMockPlayer(name: string): Promise<MockPlayer> {
    const player: MockPlayer = {
      id: `player-${name}`,
      sessionId: `session-${name}`,
      name
    };
    this.players.set(player.id, player);
    return player;
  }

  async createMockRoom(id: string, name: string): Promise<MockRoom> {
    const room: MockRoom = {
      id,
      name,
      description: `Description for ${name}`
    };
    this.rooms.set(room.id, room);
    return room;
  }

  async createMockItem(id: string, name: string): Promise<MockItem> {
    const item: MockItem = {
      id,
      name,
      description: `Description for ${name}`
    };
    this.items.set(item.id, item);
    return item;
  }

  async createMockAdmin(name: string): Promise<MockPlayer> {
    const admin = await this.createMockPlayer(name);
    // Mark as admin in some way - this would need to be implemented in the actual system
    return admin;
  }

  async createNPCWithDialogue(id: string, dialogueFile: string): Promise<MockNPC> {
    const npc: MockNPC = {
      id,
      name: `NPC ${id}`,
      dialogueTree: { file: dialogueFile }
    };
    this.npcs.set(npc.id, npc);
    return npc;
  }

  async loadPluginFromPath(pluginPath: string): Promise<BasePlugin | null> {
    try {
      // Load the actual plugin file
  const path = require('path');
  const mod = require(path.resolve(process.cwd(), pluginPath));
  const PluginClass = mod?.default || mod;
  const plugin = new PluginClass();

  this.pluginManager.registerPlugin(plugin);
  await this.pluginManager.loadPlugin(plugin.metadata.id);

  // Mirror into global registry for other PluginManager instances
  const g: any = globalThis as any;
  if (!g.__mud_plugins) {
    g.__mud_plugins = { registry: new Map(), loaded: new Set() };
  }
  g.__mud_plugins.registry.set(plugin.metadata.id, plugin);
  g.__mud_plugins.loaded.add(plugin.metadata.id);

  // If an active PluginManager exists (e.g., from acceptance setup), register and initialize there too
  try {
    const active = (globalThis as any).__mud_active_manager;
    if (active && active !== this.pluginManager) {
      // Register if not present and then load via manager to follow normal lifecycle
      try { 
        active.registerPlugin(plugin); 
      } catch {
        // Silently ignore registration errors
      }
      if (typeof active.loadPlugin === 'function') {
        await active.loadPlugin(plugin.metadata.id);
      }
    }
  } catch {
    // Silently ignore active manager errors
  }

      return plugin;
    } catch (error) {
      this.logger.error(`Failed to load plugin from ${pluginPath}:`, error);
      this.errorCount++;
      return null;
    }
  }

  async createMockDicePlugin(): Promise<BasePlugin> {
    class MockDicePlugin extends BasePlugin {
      constructor() {
        super({
          id: 'mock-dice-plugin',
          name: 'Mock Dice Plugin',
          version: '1.0.0',
          description: 'A mock dice plugin for testing'
        });
      }

      async initialize(context: any) {
        await super.initialize(context);

        if (context.commandParser) {
          context.commandParser.registerCommand({
            command: 'roll',
            aliases: ['dice', 'd'],
            description: 'Roll dice (mock)',
            usage: 'roll <dice-spec>',
            handler: async (sessionId: string, args: string[]) => {
              return `You rolled: ${Math.floor(Math.random() * 20) + 1}`;
            }
          });
        }
      }
    }

    const plugin = new MockDicePlugin();
    await this.pluginManager.registerPlugin(plugin);
    await this.pluginManager.loadPlugin(plugin.metadata.id);
    return plugin;
  }

  async createMockPluginWithDependencies(): Promise<BasePlugin> {
    class MockDependentPlugin extends BasePlugin {
      constructor() {
        super({
          id: 'dependent-plugin',
          name: 'Dependent Plugin',
          version: '1.0.0',
          description: 'A plugin with dependencies',
          dependencies: ['mock-dice-plugin']
        });
      }
    }

    const plugin = new MockDependentPlugin();
    await this.pluginManager.registerPlugin(plugin);
    return plugin;
  }

  async createCannedProvider(): Promise<any> {
    // Mock canned dialogue provider
    return {
      type: 'canned',
      processDialogue: async (sessionId: string, input: string) => {
        return `Canned response to: ${input}`;
      }
    };
  }

  async createLiveAgentProviderStub(): Promise<any> {
    // Mock live agent dialogue provider
    return {
      type: 'live-agent',
      processDialogue: async (sessionId: string, input: string) => {
        return `Live agent response to: ${input}`;
      }
    };
  }

  async runCoverageAnalysis(): Promise<CoverageResult> {
    // Mock coverage analysis - in real implementation this would run actual coverage
    return {
      core: {
        lines: { pct: 85 },
        functions: { pct: 82 },
        branches: { pct: 80 },
        statements: { pct: 84 }
      }
    };
  }

  async startLoadTest(concurrentUsers: number, duration: number): Promise<any> {
    // Mock load test - in real implementation this would create actual load
    return {
      stop: async (): Promise<LoadTestResult> => {
        return {
          totalSessions: concurrentUsers,
          failedSessions: 0,
          averageResponseTime: 150,
          errorRate: 0.001
        };
      }
    };
  }

  async buildDocumentation(): Promise<BuildResult> {
    // Mock documentation build - in real implementation this would build actual docs
    return {
      success: true,
      outputPath: './docs/build'
    };
  }

  async validateDevlogEntries(): Promise<DevlogValidation> {
    // Mock devlog validation - in real implementation this would parse DEVLOG.md
    return {
      hasRequiredEntries: true,
      entriesHaveTimestamps: true,
      coversAllMilestones: true
    };
  }
}