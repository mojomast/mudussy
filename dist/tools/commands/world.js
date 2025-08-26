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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorldCommands = void 0;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const world_manager_js_1 = require("../../engine/modules/world/world-manager.js");
const event_js_1 = require("../../engine/core/event.js");
class WorldCommands {
    constructor(options) {
        this.options = options;
    }
    getCreateCommand() {
        const command = new commander_1.Command('create')
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
    getValidateCommand() {
        const command = new commander_1.Command('validate')
            .description('Validate world data integrity')
            .option('-p, --path <path>', 'world data path', './engine/modules/world/content')
            .option('-f, --fix', 'attempt to fix validation errors')
            .action(async (options) => {
            await this.validateWorld(options);
        });
        return command;
    }
    getEditCommand() {
        const command = new commander_1.Command('edit')
            .description('Edit world entities interactively')
            .addCommand(this.getEditRoomCommand())
            .addCommand(this.getEditItemCommand())
            .addCommand(this.getEditNPCCommand())
            .addCommand(this.getEditExitCommand());
        return command;
    }
    getImportCommand() {
        const command = new commander_1.Command('import')
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
    getExportCommand() {
        const command = new commander_1.Command('export')
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
    getStatsCommand() {
        const command = new commander_1.Command('stats')
            .description('Show world statistics')
            .option('-p, --path <path>', 'world data path', './engine/modules/world/content')
            .option('-d, --detailed', 'show detailed statistics')
            .action(async (options) => {
            await this.showStats(options);
        });
        return command;
    }
    getEditRoomCommand() {
        return new commander_1.Command('room')
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
    getEditItemCommand() {
        return new commander_1.Command('item')
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
    getEditNPCCommand() {
        return new commander_1.Command('npc')
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
    getEditExitCommand() {
        return new commander_1.Command('exit')
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
    async createWorld(options) {
        try {
            const worldPath = path.resolve(this.options.projectRoot, options.path);
            if (fs.existsSync(worldPath) && !options.force) {
                console.error(chalk_1.default.red(`World already exists at ${worldPath}. Use --force to overwrite.`));
                return;
            }
            if (!this.options.quiet) {
                console.log(chalk_1.default.blue(`🌍 Creating world "${options.name}"...`));
            }
            const worldConfig = {
                defaultRoomId: 'start',
                maxItemsPerRoom: 50,
                maxPlayersPerRoom: 10,
                allowRoomCreation: true,
                contentPath: worldPath
            };
            const eventSystem = new event_js_1.EventSystem();
            const worldManager = new world_manager_js_1.WorldManager(eventSystem, worldConfig);
            const startRoom = worldManager.createRoom('Starting Room', 'You find yourself in a simple starting room. There is a door to the north.', 'tutorial');
            const secondRoom = worldManager.createRoom('Second Room', 'This is another room connected to the starting area.', 'tutorial');
            worldManager.createExit(startRoom.id, secondRoom.id, 'north');
            await worldManager.saveWorld(worldPath);
            if (!this.options.quiet) {
                console.log(chalk_1.default.green(`✅ World created successfully!`));
                console.log(`📁 World saved to: ${worldPath}`);
                console.log(`🏠 Starting room ID: ${startRoom.id}`);
                console.log(`📊 Total rooms: 2`);
            }
        }
        catch (error) {
            console.error(chalk_1.default.red('Failed to create world:'), error.message);
            if (this.options.verbose) {
                console.error(error);
            }
        }
    }
    async validateWorld(options) {
        try {
            const worldPath = path.resolve(this.options.projectRoot, options.path);
            if (!this.options.quiet) {
                console.log(chalk_1.default.blue(`🔍 Validating world at ${worldPath}...`));
            }
            const worldConfig = {
                defaultRoomId: 'start',
                maxItemsPerRoom: 50,
                maxPlayersPerRoom: 10,
                allowRoomCreation: true,
                contentPath: worldPath
            };
            const eventSystem = new event_js_1.EventSystem();
            const worldManager = new world_manager_js_1.WorldManager(eventSystem, worldConfig);
            await worldManager.loadWorld(worldPath);
            const validation = worldManager.validateWorld();
            if (validation.valid) {
                console.log(chalk_1.default.green('✅ World validation passed!'));
                console.log(`📊 Statistics:`);
                const stats = worldManager.getStatistics();
                console.log(`   Rooms: ${stats.rooms}`);
                console.log(`   Items: ${stats.items}`);
                console.log(`   NPCs: ${stats.npcs}`);
                console.log(`   Areas: ${stats.areas}`);
            }
            else {
                console.log(chalk_1.default.red('❌ World validation failed:'));
                validation.errors.forEach(error => {
                    console.log(`   • ${error}`);
                });
                if (options.fix) {
                    console.log(chalk_1.default.yellow('🔧 Attempting to fix validation errors...'));
                }
            }
        }
        catch (error) {
            console.error(chalk_1.default.red('Failed to validate world:'), error.message);
            if (this.options.verbose) {
                console.error(error);
            }
        }
    }
    async editRoom(action, id, options) {
        try {
            const worldPath = path.resolve(this.options.projectRoot, './engine/modules/world/content');
            const worldConfig = {
                defaultRoomId: 'start',
                maxItemsPerRoom: 50,
                maxPlayersPerRoom: 10,
                allowRoomCreation: true,
                contentPath: worldPath
            };
            const eventSystem = new event_js_1.EventSystem();
            const worldManager = new world_manager_js_1.WorldManager(eventSystem, worldConfig);
            await worldManager.loadWorld(worldPath);
            switch (action) {
                case 'list':
                    const rooms = worldManager.getAllRooms();
                    console.log(chalk_1.default.blue('🏠 Rooms:'));
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
                        console.error(chalk_1.default.red('Room name is required. Use --name option.'));
                        return;
                    }
                    const newRoom = worldManager.createRoom(options.name, options.description || 'A new room', options.area || 'default');
                    await worldManager.saveWorld();
                    console.log(chalk_1.default.green(`✅ Room created: ${newRoom.id}`));
                    break;
                case 'delete':
                    if (!id) {
                        console.error(chalk_1.default.red('Room ID is required for delete operation.'));
                        return;
                    }
                    console.log(chalk_1.default.yellow('⚠️ Room deletion not yet implemented'));
                    break;
                default:
                    console.error(chalk_1.default.red(`Unknown action: ${action}`));
            }
        }
        catch (error) {
            console.error(chalk_1.default.red('Failed to edit room:'), error.message);
            if (this.options.verbose) {
                console.error(error);
            }
        }
    }
    async editItem(action, id, options) {
        try {
            const worldPath = path.resolve(this.options.projectRoot, './engine/modules/world/content');
            const worldConfig = {
                defaultRoomId: 'start',
                maxItemsPerRoom: 50,
                maxPlayersPerRoom: 10,
                allowRoomCreation: true,
                contentPath: worldPath
            };
            const eventSystem = new event_js_1.EventSystem();
            const worldManager = new world_manager_js_1.WorldManager(eventSystem, worldConfig);
            await worldManager.loadWorld(worldPath);
            switch (action) {
                case 'list':
                    const items = worldManager.getAllItems();
                    console.log(chalk_1.default.blue('📦 Items:'));
                    items.forEach(item => {
                        console.log(`  ${item.id}: ${item.name} (${item.type})`);
                        if (this.options.verbose) {
                            console.log(`    Description: ${item.description}`);
                        }
                    });
                    break;
                case 'create':
                    if (!options.name) {
                        console.error(chalk_1.default.red('Item name is required. Use --name option.'));
                        return;
                    }
                    console.log(chalk_1.default.yellow('⚠️ Item creation not yet implemented'));
                    break;
                default:
                    console.error(chalk_1.default.red(`Unknown action: ${action}`));
            }
        }
        catch (error) {
            console.error(chalk_1.default.red('Failed to edit item:'), error.message);
            if (this.options.verbose) {
                console.error(error);
            }
        }
    }
    async editNPC(action, id, options) {
        try {
            const worldPath = path.resolve(this.options.projectRoot, './engine/modules/world/content');
            const worldConfig = {
                defaultRoomId: 'start',
                maxItemsPerRoom: 50,
                maxPlayersPerRoom: 10,
                allowRoomCreation: true,
                contentPath: worldPath
            };
            const eventSystem = new event_js_1.EventSystem();
            const worldManager = new world_manager_js_1.WorldManager(eventSystem, worldConfig);
            await worldManager.loadWorld(worldPath);
            switch (action) {
                case 'list':
                    const npcs = worldManager.getAllNPCs();
                    console.log(chalk_1.default.blue('👥 NPCs:'));
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
                        console.error(chalk_1.default.red('NPC name is required. Use --name option.'));
                        return;
                    }
                    console.log(chalk_1.default.yellow('⚠️ NPC creation not yet implemented'));
                    break;
                default:
                    console.error(chalk_1.default.red(`Unknown action: ${action}`));
            }
        }
        catch (error) {
            console.error(chalk_1.default.red('Failed to edit NPC:'), error.message);
            if (this.options.verbose) {
                console.error(error);
            }
        }
    }
    async editExit(action, id, options) {
        try {
            const worldPath = path.resolve(this.options.projectRoot, './engine/modules/world/content');
            const worldConfig = {
                defaultRoomId: 'start',
                maxItemsPerRoom: 50,
                maxPlayersPerRoom: 10,
                allowRoomCreation: true,
                contentPath: worldPath
            };
            const eventSystem = new event_js_1.EventSystem();
            const worldManager = new world_manager_js_1.WorldManager(eventSystem, worldConfig);
            await worldManager.loadWorld(worldPath);
            switch (action) {
                case 'create':
                    if (!options.from || !options.to || !options.direction) {
                        console.error(chalk_1.default.red('From room (--from), to room (--to), and direction (--direction) are required.'));
                        return;
                    }
                    const exit = worldManager.createExit(options.from, options.to, options.direction);
                    if (exit) {
                        await worldManager.saveWorld();
                        console.log(chalk_1.default.green(`✅ Exit created: ${options.from} -> ${options.to} (${options.direction})`));
                    }
                    else {
                        console.error(chalk_1.default.red('Failed to create exit'));
                    }
                    break;
                default:
                    console.error(chalk_1.default.red(`Unknown action: ${action}`));
            }
        }
        catch (error) {
            console.error(chalk_1.default.red('Failed to edit exit:'), error.message);
            if (this.options.verbose) {
                console.error(error);
            }
        }
    }
    async importWorld(file, options) {
        try {
            const filePath = path.resolve(this.options.projectRoot, file);
            const worldPath = path.resolve(this.options.projectRoot, options.path);
            if (!this.options.quiet) {
                console.log(chalk_1.default.blue(`📥 Importing world from ${filePath}...`));
            }
            console.log(chalk_1.default.yellow('⚠️ World import not yet implemented'));
        }
        catch (error) {
            console.error(chalk_1.default.red('Failed to import world:'), error.message);
            if (this.options.verbose) {
                console.error(error);
            }
        }
    }
    async exportWorld(file, options) {
        try {
            const filePath = path.resolve(this.options.projectRoot, file);
            const worldPath = path.resolve(this.options.projectRoot, options.path);
            if (!this.options.quiet) {
                console.log(chalk_1.default.blue(`📤 Exporting world to ${filePath}...`));
            }
            const worldConfig = {
                defaultRoomId: 'start',
                maxItemsPerRoom: 50,
                maxPlayersPerRoom: 10,
                allowRoomCreation: true,
                contentPath: worldPath
            };
            const eventSystem = new event_js_1.EventSystem();
            const worldManager = new world_manager_js_1.WorldManager(eventSystem, worldConfig);
            await worldManager.loadWorld(worldPath);
            const worldData = {
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
            console.log(chalk_1.default.green(`✅ World exported to ${filePath}`));
        }
        catch (error) {
            console.error(chalk_1.default.red('Failed to export world:'), error.message);
            if (this.options.verbose) {
                console.error(error);
            }
        }
    }
    async showStats(options) {
        try {
            const worldPath = path.resolve(this.options.projectRoot, options.path);
            if (!this.options.quiet) {
                console.log(chalk_1.default.blue(`📊 Loading world statistics...`));
            }
            const worldConfig = {
                defaultRoomId: 'start',
                maxItemsPerRoom: 50,
                maxPlayersPerRoom: 10,
                allowRoomCreation: true,
                contentPath: worldPath
            };
            const eventSystem = new event_js_1.EventSystem();
            const worldManager = new world_manager_js_1.WorldManager(eventSystem, worldConfig);
            await worldManager.loadWorld(worldPath);
            const stats = worldManager.getStatistics();
            console.log(chalk_1.default.blue('📊 World Statistics:'));
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
        }
        catch (error) {
            console.error(chalk_1.default.red('Failed to show statistics:'), error.message);
            if (this.options.verbose) {
                console.error(error);
            }
        }
    }
}
exports.WorldCommands = WorldCommands;
//# sourceMappingURL=world.js.map