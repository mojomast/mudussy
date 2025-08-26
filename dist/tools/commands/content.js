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
exports.ContentCommands = void 0;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const uuid_1 = require("uuid");
class ContentCommands {
    constructor(options) {
        this.options = options;
        this.templatesDir = path.join(options.projectRoot, 'tools', 'templates');
        this.contentDir = path.join(options.projectRoot, 'engine', 'modules', 'world', 'content');
        if (!fs.existsSync(this.templatesDir)) {
            fs.mkdirSync(this.templatesDir, { recursive: true });
        }
    }
    getNewCommand() {
        const command = new commander_1.Command('new')
            .description('Create new content from templates')
            .addCommand(this.getNewModuleCommand())
            .addCommand(this.getNewDialogueCommand())
            .addCommand(this.getNewRoomCommand())
            .addCommand(this.getNewItemCommand())
            .addCommand(this.getNewNPCCommand())
            .addCommand(this.getNewPluginCommand());
        return command;
    }
    getValidateCommand() {
        const command = new commander_1.Command('validate')
            .description('Validate content files')
            .argument('<type>', 'content type (dialogue, world, plugin)')
            .argument('[file]', 'specific file to validate')
            .option('-f, --fix', 'attempt to fix validation errors')
            .action(async (type, file, options) => {
            await this.validateContent(type, file, options);
        });
        return command;
    }
    getTestCommand() {
        const command = new commander_1.Command('test')
            .description('Test content functionality')
            .argument('<type>', 'content type to test')
            .argument('[file]', 'specific file to test')
            .option('-v, --verbose', 'verbose test output')
            .action(async (type, file, options) => {
            await this.testContent(type, file, options);
        });
        return command;
    }
    getMigrateCommand() {
        const command = new commander_1.Command('migrate')
            .description('Migrate content schema changes')
            .argument('<from>', 'source version')
            .argument('<to>', 'target version')
            .option('-d, --dry-run', 'show what would be migrated without making changes')
            .action(async (from, to, options) => {
            await this.migrateContent(from, to, options);
        });
        return command;
    }
    getPackageCommand() {
        const command = new commander_1.Command('package')
            .description('Package content for deployment')
            .argument('<name>', 'package name')
            .option('-t, --type <type>', 'package type (world, plugin, dialogue)', 'world')
            .option('-o, --output <dir>', 'output directory', './dist')
            .option('-v, --version <ver>', 'package version', '1.0.0')
            .action(async (name, options) => {
            await this.packageContent(name, options);
        });
        return command;
    }
    getNewModuleCommand() {
        return new commander_1.Command('module')
            .description('Create a new engine module')
            .argument('<name>', 'module name')
            .option('-t, --type <type>', 'module type (world, networking, dialogue)', 'world')
            .option('-d, --description <desc>', 'module description')
            .action(async (name, options) => {
            await this.createModule(name, options);
        });
    }
    getNewDialogueCommand() {
        return new commander_1.Command('dialogue')
            .description('Create new dialogue content')
            .argument('<name>', 'dialogue name')
            .option('-t, --type <type>', 'dialogue type (yaml, json)', 'yaml')
            .option('-n, --npc <npc>', 'associated NPC name')
            .action(async (name, options) => {
            await this.createDialogue(name, options);
        });
    }
    getNewRoomCommand() {
        return new commander_1.Command('room')
            .description('Create a new room template')
            .argument('<name>', 'room name')
            .option('-a, --area <area>', 'area name', 'default')
            .option('-d, --description <desc>', 'room description')
            .action(async (name, options) => {
            await this.createRoom(name, options);
        });
    }
    getNewItemCommand() {
        return new commander_1.Command('item')
            .description('Create a new item template')
            .argument('<name>', 'item name')
            .option('-t, --type <type>', 'item type (weapon, armor, consumable, key, misc)', 'misc')
            .option('-d, --description <desc>', 'item description')
            .action(async (name, options) => {
            await this.createItem(name, options);
        });
    }
    getNewNPCCommand() {
        return new commander_1.Command('npc')
            .description('Create a new NPC template')
            .argument('<name>', 'NPC name')
            .option('-d, --description <desc>', 'NPC description')
            .option('-r, --room <room>', 'starting room ID')
            .action(async (name, options) => {
            await this.createNPC(name, options);
        });
    }
    getNewPluginCommand() {
        return new commander_1.Command('plugin')
            .description('Create a new plugin')
            .argument('<name>', 'plugin name')
            .option('-t, --type <type>', 'plugin type (system, content, utility)', 'content')
            .option('-d, --description <desc>', 'plugin description')
            .action(async (name, options) => {
            await this.createPlugin(name, options);
        });
    }
    async createModule(name, options) {
        try {
            const moduleDir = path.join(this.options.projectRoot, 'engine', 'modules', name);
            if (fs.existsSync(moduleDir)) {
                console.error(chalk_1.default.red(`Module "${name}" already exists`));
                return;
            }
            if (!this.options.quiet) {
                console.log(chalk_1.default.blue(`📦 Creating module "${name}"...`));
            }
            fs.mkdirSync(moduleDir, { recursive: true });
            fs.mkdirSync(path.join(moduleDir, 'types'), { recursive: true });
            const indexContent = `/**
 * ${name} Module
 *
 * ${options.description || `Handles ${name} functionality`}
 */

import { IPlugin, IPluginMetadata } from '../../core/plugin';

export interface I${this.capitalize(name)}Config {
  // Add configuration options here
}

export class ${this.capitalize(name)}Module implements IPlugin {
  private config: I${this.capitalize(name)}Config;

  constructor(config: I${this.capitalize(name)}Config = {}) {
    this.config = config;
  }

  getMetadata(): IPluginMetadata {
    return {
      name: '${name}',
      version: '1.0.0',
      description: '${options.description || `${name} module`}',
      dependencies: []
    };
  }

  async initialize(): Promise<void> {
    // Initialize module
    console.log('${name} module initialized');
  }

  async destroy(): Promise<void> {
    // Cleanup module
    console.log('${name} module destroyed');
  }

  // Add module-specific methods here
}

// Export types and classes
export * from './types';
`;
            fs.writeFileSync(path.join(moduleDir, 'index.ts'), indexContent);
            const typesContent = `/**
 * ${name} Module Types
 */

export interface I${this.capitalize(name)}Data {
  id: string;
  name: string;
  // Add type definitions here
}
`;
            fs.writeFileSync(path.join(moduleDir, 'types.ts'), typesContent);
            const readmeContent = `# ${this.capitalize(name)} Module

${options.description || `Handles ${name} functionality`}

## Features

- Feature 1
- Feature 2

## Usage

\`\`\`typescript
import { ${this.capitalize(name)}Module } from './engine/modules/${name}';

const module = new ${this.capitalize(name)}Module();
// Use module
\`\`\`

## Configuration

\`\`\`typescript
interface I${this.capitalize(name)}Config {
  // Configuration options
}
\`\`\`
`;
            fs.writeFileSync(path.join(moduleDir, 'README.md'), readmeContent);
            console.log(chalk_1.default.green(`✅ Module "${name}" created successfully!`));
            console.log(`📁 Location: ${moduleDir}`);
        }
        catch (error) {
            console.error(chalk_1.default.red('Failed to create module:'), error.message);
            if (this.options.verbose) {
                console.error(error);
            }
        }
    }
    async createDialogue(name, options) {
        try {
            const dialogueDir = path.join(this.contentDir, 'dialogue');
            const fileName = `${name}.${options.type}`;
            const filePath = path.join(dialogueDir, fileName);
            if (fs.existsSync(filePath)) {
                console.error(chalk_1.default.red(`Dialogue "${name}" already exists`));
                return;
            }
            if (!this.options.quiet) {
                console.log(chalk_1.default.blue(`💬 Creating dialogue "${name}"...`));
            }
            if (!fs.existsSync(dialogueDir)) {
                fs.mkdirSync(dialogueDir, { recursive: true });
            }
            let content;
            if (options.type === 'yaml') {
                content = `dialogue:
  id: ${(0, uuid_1.v4)()}
  name: "${name}"
  npc: "${options.npc || 'Unknown NPC'}"
  initial_state: greeting

  states:
    greeting:
      message: "Hello, adventurer! How can I help you?"
      responses:
        - text: "Who are you?"
          next_state: introduction
        - text: "Goodbye"
          next_state: farewell

    introduction:
      message: "I am a humble merchant in this town."
      responses:
        - text: "What do you sell?"
          next_state: shop
        - text: "Goodbye"
          next_state: farewell

    shop:
      message: "I have many fine goods for sale."
      responses:
        - text: "Show me your wares"
          action: show_inventory
        - text: "Goodbye"
          next_state: farewell

    farewell:
      message: "Safe travels, friend!"
      responses: []
`;
            }
            else {
                content = JSON.stringify({
                    dialogue: {
                        id: (0, uuid_1.v4)(),
                        name: name,
                        npc: options.npc || 'Unknown NPC',
                        initial_state: 'greeting',
                        states: {
                            greeting: {
                                message: 'Hello, adventurer! How can I help you?',
                                responses: [
                                    { text: 'Who are you?', next_state: 'introduction' },
                                    { text: 'Goodbye', next_state: 'farewell' }
                                ]
                            },
                            introduction: {
                                message: 'I am a humble merchant in this town.',
                                responses: [
                                    { text: 'What do you sell?', next_state: 'shop' },
                                    { text: 'Goodbye', next_state: 'farewell' }
                                ]
                            },
                            shop: {
                                message: 'I have many fine goods for sale.',
                                responses: [
                                    { text: 'Show me your wares', action: 'show_inventory' },
                                    { text: 'Goodbye', next_state: 'farewell' }
                                ]
                            },
                            farewell: {
                                message: 'Safe travels, friend!',
                                responses: []
                            }
                        }
                    }
                }, null, 2);
            }
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(chalk_1.default.green(`✅ Dialogue "${name}" created successfully!`));
            console.log(`📁 Location: ${filePath}`);
        }
        catch (error) {
            console.error(chalk_1.default.red('Failed to create dialogue:'), error.message);
            if (this.options.verbose) {
                console.error(error);
            }
        }
    }
    async createRoom(name, options) {
        try {
            const templatePath = path.join(this.templatesDir, 'room-template.json');
            const roomTemplate = {
                id: (0, uuid_1.v4)(),
                name: name,
                description: options.description || `A ${name.toLowerCase()}`,
                area: options.area,
                exits: [],
                items: [],
                npcs: [],
                players: [],
                flags: [],
                created: new Date(),
                updated: new Date()
            };
            fs.writeFileSync(templatePath, JSON.stringify(roomTemplate, null, 2), 'utf8');
            console.log(chalk_1.default.green(`✅ Room template "${name}" created successfully!`));
            console.log(`📁 Location: ${templatePath}`);
        }
        catch (error) {
            console.error(chalk_1.default.red('Failed to create room template:'), error.message);
            if (this.options.verbose) {
                console.error(error);
            }
        }
    }
    async createItem(name, options) {
        try {
            const templatePath = path.join(this.templatesDir, 'item-template.json');
            const itemTemplate = {
                id: (0, uuid_1.v4)(),
                name: name,
                description: options.description || `A ${name.toLowerCase()}`,
                shortDescription: options.description || `A ${name.toLowerCase()}`,
                type: options.type,
                portable: true,
                container: false,
                stats: {},
                flags: [],
                created: new Date(),
                updated: new Date()
            };
            fs.writeFileSync(templatePath, JSON.stringify(itemTemplate, null, 2), 'utf8');
            console.log(chalk_1.default.green(`✅ Item template "${name}" created successfully!`));
            console.log(`📁 Location: ${templatePath}`);
        }
        catch (error) {
            console.error(chalk_1.default.red('Failed to create item template:'), error.message);
            if (this.options.verbose) {
                console.error(error);
            }
        }
    }
    async createNPC(name, options) {
        try {
            const templatePath = path.join(this.templatesDir, 'npc-template.json');
            const npcTemplate = {
                id: (0, uuid_1.v4)(),
                name: name,
                description: options.description || `A ${name.toLowerCase()}`,
                shortDescription: options.description || `A ${name.toLowerCase()}`,
                roomId: options.room || '',
                dialogueProvider: `${name.toLowerCase().replace(/\s+/g, '_')}_dialogue`,
                behaviors: [],
                stats: {},
                flags: [],
                created: new Date(),
                updated: new Date()
            };
            fs.writeFileSync(templatePath, JSON.stringify(npcTemplate, null, 2), 'utf8');
            console.log(chalk_1.default.green(`✅ NPC template "${name}" created successfully!`));
            console.log(`📁 Location: ${templatePath}`);
        }
        catch (error) {
            console.error(chalk_1.default.red('Failed to create NPC template:'), error.message);
            if (this.options.verbose) {
                console.error(error);
            }
        }
    }
    async createPlugin(name, options) {
        try {
            const pluginDir = path.join(this.options.projectRoot, 'plugins', name);
            if (fs.existsSync(pluginDir)) {
                console.error(chalk_1.default.red(`Plugin "${name}" already exists`));
                return;
            }
            if (!this.options.quiet) {
                console.log(chalk_1.default.blue(`🔌 Creating plugin "${name}"...`));
            }
            fs.mkdirSync(pluginDir, { recursive: true });
            const packageContent = {
                name: name,
                version: '1.0.0',
                description: options.description || `${name} plugin`,
                main: 'dist/index.js',
                scripts: {
                    build: 'tsc',
                    dev: 'tsc --watch'
                },
                dependencies: {
                    'mud-engine': '^1.0.0'
                },
                devDependencies: {
                    typescript: '^5.0.0'
                }
            };
            fs.writeFileSync(path.join(pluginDir, 'package.json'), JSON.stringify(packageContent, null, 2), 'utf8');
            const tsconfigContent = {
                compilerOptions: {
                    target: 'ES2020',
                    module: 'commonjs',
                    outDir: './dist',
                    rootDir: './src',
                    strict: true,
                    esModuleInterop: true,
                    skipLibCheck: true,
                    forceConsistentCasingInFileNames: true
                },
                include: ['src/**/*'],
                exclude: ['node_modules', 'dist']
            };
            fs.writeFileSync(path.join(pluginDir, 'tsconfig.json'), JSON.stringify(tsconfigContent, null, 2), 'utf8');
            const srcDir = path.join(pluginDir, 'src');
            fs.mkdirSync(srcDir, { recursive: true });
            const pluginContent = `import { IPlugin, IPluginMetadata, IPluginContext } from 'mud-engine';

export class ${this.capitalize(name)}Plugin implements IPlugin {
  private context?: IPluginContext;

  getMetadata(): IPluginMetadata {
    return {
      name: '${name}',
      version: '1.0.0',
      description: '${options.description || `${name} plugin`}',
      dependencies: []
    };
  }

  async initialize(context: IPluginContext): Promise<void> {
    this.context = context;
    console.log('${name} plugin initialized');

    // Register event listeners, commands, etc.
    // context.eventSystem.on('event', this.handleEvent.bind(this));
  }

  async destroy(): Promise<void> {
    console.log('${name} plugin destroyed');

    // Cleanup resources
  }

  // Add plugin methods here
  // private handleEvent(data: any) {
  //   // Handle events
  // }
}

export default ${this.capitalize(name)}Plugin;
`;
            fs.writeFileSync(path.join(srcDir, 'index.ts'), pluginContent);
            const readmeContent = `# ${this.capitalize(name)} Plugin

${options.description || `${name} plugin for MUD engine`}

## Installation

\`\`\`bash
npm install
npm run build
\`\`\`

## Usage

\`\`\`typescript
import ${this.capitalize(name)}Plugin from './plugins/${name}';

// Plugin will be loaded automatically by the engine
\`\`\`

## Features

- Feature 1
- Feature 2

## Configuration

Add configuration options in your plugin's \`initialize\` method.
`;
            fs.writeFileSync(path.join(pluginDir, 'README.md'), readmeContent);
            console.log(chalk_1.default.green(`✅ Plugin "${name}" created successfully!`));
            console.log(`📁 Location: ${pluginDir}`);
        }
        catch (error) {
            console.error(chalk_1.default.red('Failed to create plugin:'), error.message);
            if (this.options.verbose) {
                console.error(error);
            }
        }
    }
    async validateContent(type, file, options) {
        try {
            if (!this.options.quiet) {
                console.log(chalk_1.default.blue(`🔍 Validating ${type} content...`));
            }
            console.log(chalk_1.default.yellow(`⚠️ ${type} validation not yet implemented`));
            if (file) {
                const filePath = path.resolve(this.options.projectRoot, file);
                if (!fs.existsSync(filePath)) {
                    console.error(chalk_1.default.red(`File not found: ${filePath}`));
                    return;
                }
                console.log(chalk_1.default.green(`✅ File exists: ${filePath}`));
            }
        }
        catch (error) {
            console.error(chalk_1.default.red('Failed to validate content:'), error.message);
            if (this.options.verbose) {
                console.error(error);
            }
        }
    }
    async testContent(type, file, options) {
        try {
            if (!this.options.quiet) {
                console.log(chalk_1.default.blue(`🧪 Testing ${type} content...`));
            }
            console.log(chalk_1.default.yellow(`⚠️ ${type} testing not yet implemented`));
        }
        catch (error) {
            console.error(chalk_1.default.red('Failed to test content:'), error.message);
            if (this.options.verbose) {
                console.error(error);
            }
        }
    }
    async migrateContent(from, to, options) {
        try {
            if (!this.options.quiet) {
                console.log(chalk_1.default.blue(`🔄 Migrating content from ${from} to ${to}...`));
            }
            if (options.dryRun) {
                console.log(chalk_1.default.yellow('🔍 Dry run mode - no changes will be made'));
            }
            console.log(chalk_1.default.yellow(`⚠️ Content migration not yet implemented`));
        }
        catch (error) {
            console.error(chalk_1.default.red('Failed to migrate content:'), error.message);
            if (this.options.verbose) {
                console.error(error);
            }
        }
    }
    async packageContent(name, options) {
        try {
            const outputDir = path.resolve(this.options.projectRoot, options.output);
            if (!this.options.quiet) {
                console.log(chalk_1.default.blue(`📦 Packaging ${options.type} content: ${name}...`));
            }
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }
            console.log(chalk_1.default.yellow(`⚠️ Content packaging not yet implemented`));
            console.log(chalk_1.default.green(`✅ Package "${name}" created successfully!`));
            console.log(`📁 Location: ${outputDir}`);
        }
        catch (error) {
            console.error(chalk_1.default.red('Failed to package content:'), error.message);
            if (this.options.verbose) {
                console.error(error);
            }
        }
    }
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}
exports.ContentCommands = ContentCommands;
//# sourceMappingURL=content.js.map