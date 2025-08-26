/**
 * World Commands Module
 *
 * Handles world creation, validation, editing, import/export operations
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import { WorldManager } from '../../engine/modules/world/world-manager.js';
import { EventSystem } from '../../engine/core/event.js';
import { IWorldData, IWorldConfig } from '../../engine/modules/world/types.js';

interface WorldCommandOptions {
  verbose?: boolean;
  quiet?: boolean;
  config?: string;
  projectRoot?: string;
}

export class WorldCommands {
  private options: WorldCommandOptions;

  constructor(options: WorldCommandOptions) {
    this.options = options;
  }

  /**
   * Create world command
   */
  getCreateCommand(): Command {
    const command = new Command('create')
      .description('Create a new world')
      .option('-n, --name <name>', 'world name', 'New World')
      .option('-d, --description <desc>', 'world description', 'A new MUD world')
      .option('-t, --template <template>', 'world template', 'basic')
      .option('-p, --path <path>', 'output path', './world-data')
      .option('-f, --force', 'overwrite existing world')
      .action(async (options) => {
        await this.createWorld(options);
      });

    return command;
  }

  /**
   * Validate world command
   */
  getValidateCommand(): Command {
    const command = new Command('validate')
      .description('Validate world data integrity')
      .option('-p, --path <path>', 'world data path', './engine/modules/world/content')
      .option('-f, --fix', 'attempt to fix validation errors')
      .action(async (options) => {
        await this.validateWorld(options);
      });

    return command;
  }

  /**
   * Edit world command
   */
  getEditCommand(): Command {
    const command = new Command('edit')
      .description('Edit world entities interactively')
      .addCommand(this.getEditRoomCommand())
      .addCommand(this.getEditItemCommand())
      .addCommand(this.getEditNPCCommand())
      .addCommand(this.getEditExitCommand());

    return command;
  }

  /**
   * Import world command
   */
  getImportCommand(): Command {
    const command = new Command('import')
      .description('Import world data from file')
      .argument('<file>', 'file to import')
      .option('-f, --format <format>', 'file format (json, yaml)', 'json')
      .option('-p, --path <path>', 'world data path', './engine/modules/world/content')
      .option('--overwrite', 'overwrite existing data')
      .action(async (file, options) => {
        await this.importWorld(file, options);
      });

    return command;
  }

  /**
   * Export world command
   */
  getExportCommand(): Command {
    const command = new Command('export')
      .description('Export world data to file')
      .argument('<file>', 'output file')
      .option('-f, --format <format>', 'export format (json, yaml)', 'json')
      .option('-p, --path <path>', 'world data path', './engine/modules/world/content')
      .option('-t, --type <type>', 'export type (full, rooms, items, npcs)', 'full')
      .action(async (file, options) => {
        await this.exportWorld(file, options);
      });

    return command;
  }

  /**
   * World statistics command
   */
  getStatsCommand(): Command {
    const command = new Command('stats')
      .description('Show world statistics')
      .option('-p, --path <path>', 'world data path', './engine/modules/world/content')
      .option('-d, --detailed', 'show detailed statistics')
      .action(async (options) => {
        await this.showStats(options);
      });

    return command;
  }

  /**
   * Edit room subcommand
   */
  private getEditRoomCommand(): Command {
    return new Command('room')
      .description('Edit rooms')
      .argument('<action>', 'action (create, update, delete, list)')
      .argument('[id]', 'room ID')
      .option('-n, --name <name>', 'room name')
      .option('-d, --description <desc>', 'room description')
      .option('-a, --area <area>', 'area name')
      .action(async (action, id, options) => {
        await this.editRoom(action, id, options);
      });
  }

  /**
   * Edit item subcommand
   */
  private getEditItemCommand(): Command {
    return new Command('item')
      .description('Edit items')
      .argument('<action>', 'action (create, update, delete, list)')
      .argument('[id]', 'item ID')
      .option('-n, --name <name>', 'item name')
      .option('-d, --description <desc>', 'item description')
      .option('-t, --type <type>', 'item type (weapon, armor, consumable, key, misc)')
      .action(async (action, id, options) => {
        await this.editItem(action, id, options);
      });
  }

  /**
   * Edit NPC subcommand
   */
  private getEditNPCCommand(): Command {
    return new Command('npc')
      .description('Edit NPCs')
      .argument('<action>', 'action (create, update, delete, list)')
      .argument('[id]', 'NPC ID')
      .option('-n, --name <name>', 'NPC name')
      .option('-d, --description <desc>', 'NPC description')
      .option('-r, --room <roomId>', 'room ID to place NPC')
      .action(async (action, id, options) => {
        await this.editNPC(action, id, options);
      });
  }

  /**
   * Edit exit subcommand
   */
  private getEditExitCommand(): Command {
    return new Command('exit')
      .description('Edit exits')
      .argument('<action>', 'action (create, update, delete, list)')
      .argument('[id]', 'exit ID')
      .option('-f, --from <roomId>', 'from room ID')
      .option('-t, --to <roomId>', 'to room ID')
      .option('-d, --direction <dir>', 'exit direction')
      .action(async (action, id, options) => {
        await this.editExit(action, id, options);
      });
  }

  /**
   * Create a new world
   */
  private async createWorld(options: any) {
    try {
      const worldPath = path.resolve(this.options.projectRoot!, options.path);

      if (fs.existsSync(worldPath) && !options.force) {
        console.error(chalk.red(`World already exists at ${worldPath}. Use --force to overwrite.`));
        return;
      }

      if (!this.options.quiet) {
        console.log(chalk.blue(`🌍 Creating world "${options.name}"...`));
      }

      // Create world configuration
      const worldConfig: IWorldConfig = {
        defaultRoomId: 'start',
        maxItemsPerRoom: 50,
        maxPlayersPerRoom: 10,
        allowRoomCreation: true,
        contentPath: worldPath
      };

      // Initialize event system and world manager
      const eventSystem = new EventSystem();
      const worldManager = new WorldManager(eventSystem, worldConfig);

      // Create basic world structure
      const startRoom = worldManager.createRoom(
        'Starting Room',
        'You find yourself in a simple starting room. There is a door to the north.',
        'tutorial'
      );

      // Create a second room and connect them
      const secondRoom = worldManager.createRoom(
        'Second Room',
        'This is another room connected to the starting area.',
        'tutorial'
      );

      worldManager.createExit(startRoom.id, secondRoom.id, 'north');

      // Save the world
      await worldManager.saveWorld(worldPath);

      if (!this.options.quiet) {
        console.log(chalk.green(`✅ World created successfully!`));
        console.log(`📁 World saved to: ${worldPath}`);
        console.log(`🏠 Starting room ID: ${startRoom.id}`);
        console.log(`📊 Total rooms: 2`);
      }

    } catch (error) {
      console.error(chalk.red('Failed to create world:'), error.message);
      if (this.options.verbose) {
        console.error(error);
      }
    }
  }

  /**
   * Validate world data
   */
  private async validateWorld(options: any) {
    try {
      const worldPath = path.resolve(this.options.projectRoot!, options.path);

      if (!this.options.quiet) {
        console.log(chalk.blue(`🔍 Validating world at ${worldPath}...`));
      }

      // Load world data
      const worldConfig: IWorldConfig = {
        defaultRoomId: 'start',
        maxItemsPerRoom: 50,
        maxPlayersPerRoom: 10,
        allowRoomCreation: true,
        contentPath: worldPath
      };

      const eventSystem = new EventSystem();
      const worldManager = new WorldManager(eventSystem, worldConfig);

      await worldManager.loadWorld(worldPath);

      // Run validation
      const validation = worldManager.validateWorld();

      if (validation.valid) {
        console.log(chalk.green('✅ World validation passed!'));
        console.log(`📊 Statistics:`);
        const stats = worldManager.getStatistics();
        console.log(`   Rooms: ${stats.rooms}`);
        console.log(`   Items: ${stats.items}`);
        console.log(`   NPCs: ${stats.npcs}`);
        console.log(`   Areas: ${stats.areas}`);
      } else {
        console.log(chalk.red('❌ World validation failed:'));
        validation.errors.forEach(error => {
          console.log(`   • ${error}`);
        });

        if (options.fix) {
          console.log(chalk.yellow('🔧 Attempting to fix validation errors...'));
          // TODO: Implement auto-fix logic
        }
      }

    } catch (error) {
      console.error(chalk.red('Failed to validate world:'), error.message);
      if (this.options.verbose) {
        console.error(error);
      }
    }
  }

  /**
   * Edit room operations
   */
  private async editRoom(action: string, id: string, options: any) {
    try {
      const worldPath = path.resolve(this.options.projectRoot!, './engine/modules/world/content');

      const worldConfig: IWorldConfig = {
        defaultRoomId: 'start',
        maxItemsPerRoom: 50,
        maxPlayersPerRoom: 10,
        allowRoomCreation: true,
        contentPath: worldPath
      };

      const eventSystem = new EventSystem();
      const worldManager = new WorldManager(eventSystem, worldConfig);

      await worldManager.loadWorld(worldPath);

      switch (action) {
        case 'list':
          const rooms = worldManager.getAllRooms();
          console.log(chalk.blue('🏠 Rooms:'));
          rooms.forEach(room => {
            console.log(`  ${room.id}: ${room.name}`);
            if (this.options.verbose) {
              console.log(`    Description: ${room.description}`);
              console.log(`    Area: ${room.area}`);
              console.log(`    Exits: ${room.exits.length}`);
            }
          });
          break;

        case 'create':
          if (!options.name) {
            console.error(chalk.red('Room name is required. Use --name option.'));
            return;
          }
          const newRoom = worldManager.createRoom(
            options.name,
            options.description || 'A new room',
            options.area || 'default'
          );
          await worldManager.saveWorld();
          console.log(chalk.green(`✅ Room created: ${newRoom.id}`));
          break;

        case 'delete':
          if (!id) {
            console.error(chalk.red('Room ID is required for delete operation.'));
            return;
          }
          // TODO: Implement room deletion
          console.log(chalk.yellow('⚠️ Room deletion not yet implemented'));
          break;

        default:
          console.error(chalk.red(`Unknown action: ${action}`));
      }

    } catch (error) {
      console.error(chalk.red('Failed to edit room:'), error.message);
      if (this.options.verbose) {
        console.error(error);
      }
    }
  }

  /**
   * Edit item operations
   */
  private async editItem(action: string, id: string, options: any) {
    try {
      const worldPath = path.resolve(this.options.projectRoot!, './engine/modules/world/content');

      const worldConfig: IWorldConfig = {
        defaultRoomId: 'start',
        maxItemsPerRoom: 50,
        maxPlayersPerRoom: 10,
        allowRoomCreation: true,
        contentPath: worldPath
      };

      const eventSystem = new EventSystem();
      const worldManager = new WorldManager(eventSystem, worldConfig);

      await worldManager.loadWorld(worldPath);

      switch (action) {
        case 'list':
          const items = worldManager.getAllItems();
          console.log(chalk.blue('📦 Items:'));
          items.forEach(item => {
            console.log(`  ${item.id}: ${item.name} (${item.type})`);
            if (this.options.verbose) {
              console.log(`    Description: ${item.description}`);
            }
          });
          break;

        case 'create':
          if (!options.name) {
            console.error(chalk.red('Item name is required. Use --name option.'));
            return;
          }
          // TODO: Implement item creation
          console.log(chalk.yellow('⚠️ Item creation not yet implemented'));
          break;

        default:
          console.error(chalk.red(`Unknown action: ${action}`));
      }

    } catch (error) {
      console.error(chalk.red('Failed to edit item:'), error.message);
      if (this.options.verbose) {
        console.error(error);
      }
    }
  }

  /**
   * Edit NPC operations
   */
  private async editNPC(action: string, id: string, options: any) {
    try {
      const worldPath = path.resolve(this.options.projectRoot!, './engine/modules/world/content');

      const worldConfig: IWorldConfig = {
        defaultRoomId: 'start',
        maxItemsPerRoom: 50,
        maxPlayersPerRoom: 10,
        allowRoomCreation: true,
        contentPath: worldPath
      };

      const eventSystem = new EventSystem();
      const worldManager = new WorldManager(eventSystem, worldConfig);

      await worldManager.loadWorld(worldPath);

      switch (action) {
        case 'list':
          const npcs = worldManager.getAllNPCs();
          console.log(chalk.blue('👥 NPCs:'));
          npcs.forEach(npc => {
            console.log(`  ${npc.id}: ${npc.name}`);
            if (this.options.verbose) {
              console.log(`    Description: ${npc.description}`);
              console.log(`    Room: ${npc.roomId}`);
            }
          });
          break;

        case 'create':
          if (!options.name) {
            console.error(chalk.red('NPC name is required. Use --name option.'));
            return;
          }
          // TODO: Implement NPC creation
          console.log(chalk.yellow('⚠️ NPC creation not yet implemented'));
          break;

        default:
          console.error(chalk.red(`Unknown action: ${action}`));
      }

    } catch (error) {
      console.error(chalk.red('Failed to edit NPC:'), error.message);
      if (this.options.verbose) {
        console.error(error);
      }
    }
  }

  /**
   * Edit exit operations
   */
  private async editExit(action: string, id: string, options: any) {
    try {
      const worldPath = path.resolve(this.options.projectRoot!, './engine/modules/world/content');

      const worldConfig: IWorldConfig = {
        defaultRoomId: 'start',
        maxItemsPerRoom: 50,
        maxPlayersPerRoom: 10,
        allowRoomCreation: true,
        contentPath: worldPath
      };

      const eventSystem = new EventSystem();
      const worldManager = new WorldManager(eventSystem, worldConfig);

      await worldManager.loadWorld(worldPath);

      switch (action) {
        case 'create':
          if (!options.from || !options.to || !options.direction) {
            console.error(chalk.red('From room (--from), to room (--to), and direction (--direction) are required.'));
            return;
          }
          const exit = worldManager.createExit(options.from, options.to, options.direction);
          if (exit) {
            await worldManager.saveWorld();
            console.log(chalk.green(`✅ Exit created: ${options.from} -> ${options.to} (${options.direction})`));
          } else {
            console.error(chalk.red('Failed to create exit'));
          }
          break;

        default:
          console.error(chalk.red(`Unknown action: ${action}`));
      }

    } catch (error) {
      console.error(chalk.red('Failed to edit exit:'), error.message);
      if (this.options.verbose) {
        console.error(error);
      }
    }
  }

  /**
   * Import world data
   */
  private async importWorld(file: string, options: any) {
    try {
      const filePath = path.resolve(this.options.projectRoot!, file);
      const worldPath = path.resolve(this.options.projectRoot!, options.path);

      if (!this.options.quiet) {
        console.log(chalk.blue(`📥 Importing world from ${filePath}...`));
      }

      // TODO: Implement world import logic
      console.log(chalk.yellow('⚠️ World import not yet implemented'));

    } catch (error) {
      console.error(chalk.red('Failed to import world:'), error.message);
      if (this.options.verbose) {
        console.error(error);
      }
    }
  }

  /**
   * Export world data
   */
  private async exportWorld(file: string, options: any) {
    try {
      const filePath = path.resolve(this.options.projectRoot!, file);
      const worldPath = path.resolve(this.options.projectRoot!, options.path);

      if (!this.options.quiet) {
        console.log(chalk.blue(`📤 Exporting world to ${filePath}...`));
      }

      // Load world data
      const worldConfig: IWorldConfig = {
        defaultRoomId: 'start',
        maxItemsPerRoom: 50,
        maxPlayersPerRoom: 10,
        allowRoomCreation: true,
        contentPath: worldPath
      };

      const eventSystem = new EventSystem();
      const worldManager = new WorldManager(eventSystem, worldConfig);

      await worldManager.loadWorld(worldPath);

      // Export world data by reconstructing it from the manager
      const worldData: IWorldData = {
        areas: Array.from(worldManager['areas'].values()),
        rooms: Array.from(worldManager['rooms'].values()),
        items: Array.from(worldManager['items'].values()),
        npcs: Array.from(worldManager['npcs'].values()),
        metadata: {
          version: '1.0.0',
          created: new Date(),
          updated: new Date()
        }
      };
      fs.writeFileSync(filePath, JSON.stringify(worldData, null, 2), 'utf8');

      console.log(chalk.green(`✅ World exported to ${filePath}`));

    } catch (error) {
      console.error(chalk.red('Failed to export world:'), error.message);
      if (this.options.verbose) {
        console.error(error);
      }
    }
  }

  /**
   * Show world statistics
   */
  private async showStats(options: any) {
    try {
      const worldPath = path.resolve(this.options.projectRoot!, options.path);

      if (!this.options.quiet) {
        console.log(chalk.blue(`📊 Loading world statistics...`));
      }

      // Load world data
      const worldConfig: IWorldConfig = {
        defaultRoomId: 'start',
        maxItemsPerRoom: 50,
        maxPlayersPerRoom: 10,
        allowRoomCreation: true,
        contentPath: worldPath
      };

      const eventSystem = new EventSystem();
      const worldManager = new WorldManager(eventSystem, worldConfig);

      await worldManager.loadWorld(worldPath);

      // Get statistics
      const stats = worldManager.getStatistics();

      console.log(chalk.blue('📊 World Statistics:'));
      console.log(`🏠 Rooms: ${stats.rooms}`);
      console.log(`📦 Items: ${stats.items}`);
      console.log(`👥 NPCs: ${stats.npcs}`);
      console.log(`🗺️  Areas: ${stats.areas}`);

      if (options.detailed) {
        console.log(`\n📋 Details:`);
        console.log(`   Version: ${stats.metadata.version}`);
        console.log(`   Created: ${new Date(stats.metadata.created).toLocaleString()}`);
        console.log(`   Updated: ${new Date(stats.metadata.updated).toLocaleString()}`);
        console.log(`   Author: ${stats.metadata.author || 'Unknown'}`);
      }

    } catch (error) {
      console.error(chalk.red('Failed to show statistics:'), error.message);
      if (this.options.verbose) {
        console.error(error);
      }
    }
  }
}