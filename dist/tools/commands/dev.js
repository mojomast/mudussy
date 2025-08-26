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
exports.DevCommands = void 0;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const world_manager_js_1 = require("../../engine/modules/world/world-manager.js");
const event_js_1 = require("../../engine/core/event.js");
class DevCommands {
    constructor(options) {
        this.options = options;
    }
    getSeedCommand() {
        const command = new commander_1.Command('seed')
            .description('Seed database with sample content')
            .argument('<type>', 'content type to seed (world, users, dialogue)')
            .option('-c, --count <number>', 'number of items to generate', '10')
            .option('-f, --force', 'overwrite existing data')
            .option('-p, --path <path>', 'output path', './engine/modules/world/content')
            .action(async (type, options) => {
            await this.seedContent(type, options);
        });
        return command;
    }
    getProfileCommand() {
        const command = new commander_1.Command('profile')
            .description('Profile application performance')
            .argument('<type>', 'profile type (memory, cpu, performance)')
            .option('-d, --duration <seconds>', 'profiling duration', '30')
            .option('-o, --output <file>', 'output file', './logs/profile.json')
            .action(async (type, options) => {
            await this.profileApplication(type, options);
        });
        return command;
    }
    getLogCommand() {
        const command = new commander_1.Command('log')
            .description('Log analysis and debugging tools')
            .addCommand(this.getLogAnalyzeCommand())
            .addCommand(this.getLogTailCommand())
            .addCommand(this.getLogSearchCommand());
        return command;
    }
    getBackupCommand() {
        const command = new commander_1.Command('backup')
            .description('Create backup of world data')
            .argument('<name>', 'backup name')
            .option('-p, --path <path>', 'world data path', './engine/modules/world/content')
            .option('-o, --output <dir>', 'backup output directory', './backups')
            .option('-t, --type <type>', 'backup type (full, incremental)', 'full')
            .action(async (name, options) => {
            await this.createBackup(name, options);
        });
        return command;
    }
    getRestoreCommand() {
        const command = new commander_1.Command('restore')
            .description('Restore world data from backup')
            .argument('<name>', 'backup name')
            .option('-p, --path <path>', 'restore destination path', './engine/modules/world/content')
            .option('-b, --backup-dir <dir>', 'backup directory', './backups')
            .option('-f, --force', 'overwrite existing data')
            .action(async (name, options) => {
            await this.restoreBackup(name, options);
        });
        return command;
    }
    getLogAnalyzeCommand() {
        return new commander_1.Command('analyze')
            .description('Analyze log files')
            .argument('[file]', 'log file to analyze')
            .option('-s, --since <time>', 'analyze logs since time (e.g., "1h", "30m")')
            .option('-l, --level <level>', 'filter by log level', 'all')
            .action(async (file, options) => {
            await this.analyzeLogs(file, options);
        });
    }
    getLogTailCommand() {
        return new commander_1.Command('tail')
            .description('Tail log files in real-time')
            .argument('[file]', 'log file to tail')
            .option('-f, --follow', 'follow log file')
            .option('-n, --lines <number>', 'number of lines to show', '20')
            .action(async (file, options) => {
            await this.tailLogs(file, options);
        });
    }
    getLogSearchCommand() {
        return new commander_1.Command('search')
            .description('Search log files')
            .argument('<pattern>', 'search pattern')
            .argument('[file]', 'log file to search')
            .option('-i, --ignore-case', 'case insensitive search')
            .option('-c, --context <lines>', 'lines of context', '3')
            .action(async (pattern, file, options) => {
            await this.searchLogs(pattern, file, options);
        });
    }
    async seedContent(type, options) {
        try {
            const count = parseInt(options.count);
            const outputPath = path.resolve(this.options.projectRoot, options.path);
            if (!this.options.quiet) {
                console.log(chalk_1.default.blue(`🌱 Seeding ${type} content (${count} items)...`));
            }
            switch (type) {
                case 'world':
                    await this.seedWorldContent(count, outputPath, options);
                    break;
                case 'users':
                    await this.seedUserContent(count, options);
                    break;
                case 'dialogue':
                    await this.seedDialogueContent(count, outputPath, options);
                    break;
                default:
                    console.error(chalk_1.default.red(`Unknown seed type: ${type}`));
                    return;
            }
            console.log(chalk_1.default.green(`✅ Successfully seeded ${count} ${type} items`));
        }
        catch (error) {
            console.error(chalk_1.default.red('Failed to seed content:'), error.message);
            if (this.options.verbose) {
                console.error(error);
            }
        }
    }
    async seedWorldContent(count, outputPath, options) {
        const worldConfig = {
            defaultRoomId: 'town_square',
            maxItemsPerRoom: 50,
            maxPlayersPerRoom: 10,
            allowRoomCreation: true,
            contentPath: outputPath
        };
        const eventSystem = new event_js_1.EventSystem();
        const worldManager = new world_manager_js_1.WorldManager(eventSystem, worldConfig);
        const townSquare = worldManager.createRoom('Town Square', 'A bustling town square with shops and people all around. The center of town life.', 'town');
        const roomTemplates = [
            { name: 'General Store', description: 'A well-stocked general store selling basic supplies.' },
            { name: 'Tavern', description: 'A cozy tavern where locals gather to drink and share stories.' },
            { name: 'Blacksmith', description: 'The ringing of hammer on anvil echoes from this workshop.' },
            { name: 'Library', description: 'A quiet library filled with ancient tomes and scrolls.' },
            { name: 'Temple', description: 'A place of worship dedicated to the local deity.' },
            { name: 'Bank', description: 'A secure building where citizens store their valuables.' },
            { name: 'Inn', description: 'A comfortable inn offering rooms for travelers.' },
            { name: 'Market', description: 'A lively market with vendors selling various goods.' }
        ];
        const directions = ['north', 'south', 'east', 'west', 'northeast', 'northwest', 'southeast', 'southwest'];
        for (let i = 0; i < Math.min(count - 1, roomTemplates.length); i++) {
            const template = roomTemplates[i];
            const room = worldManager.createRoom(template.name, template.description, 'town');
            const direction = directions[i % directions.length];
            worldManager.createExit(townSquare.id, room.id, direction);
        }
        const sampleItems = [
            { name: 'Rusty Sword', type: 'weapon', description: 'An old sword with a worn blade.' },
            { name: 'Health Potion', type: 'consumable', description: 'A red potion that restores health.' },
            { name: 'Leather Armor', type: 'armor', description: 'Basic leather armor for protection.' },
            { name: 'Gold Coin', type: 'misc', description: 'A shiny gold coin.' },
            { name: 'Iron Key', type: 'key', description: 'A key made of iron.' }
        ];
        sampleItems.forEach(itemTemplate => {
            console.log(`Would create item: ${itemTemplate.name}`);
        });
        await worldManager.saveWorld(outputPath);
        console.log(`🏠 Created town with ${Math.min(count, roomTemplates.length + 1)} rooms`);
    }
    async seedUserContent(count, options) {
        console.log(chalk_1.default.yellow('⚠️ User seeding not yet implemented'));
    }
    async seedDialogueContent(count, outputPath, options) {
        const dialogueDir = path.join(outputPath, 'dialogue');
        if (!fs.existsSync(dialogueDir)) {
            fs.mkdirSync(dialogueDir, { recursive: true });
        }
        const dialogues = [
            {
                name: 'shopkeeper',
                npc: 'Shopkeeper',
                content: {
                    dialogue: {
                        id: 'shopkeeper-dialogue',
                        name: 'Shopkeeper Dialogue',
                        npc: 'Shopkeeper',
                        initial_state: 'greeting',
                        states: {
                            greeting: {
                                message: 'Welcome to my shop! How can I help you today?',
                                responses: [
                                    { text: 'What do you sell?', next_state: 'shop' },
                                    { text: 'Just browsing', next_state: 'browse' },
                                    { text: 'Goodbye', next_state: 'farewell' }
                                ]
                            },
                            shop: {
                                message: 'I have weapons, armor, potions, and various supplies.',
                                responses: [
                                    { text: 'Show me weapons', action: 'show_weapons' },
                                    { text: 'Show me potions', action: 'show_potions' },
                                    { text: 'Back', next_state: 'greeting' }
                                ]
                            },
                            browse: {
                                message: 'Take your time looking around. Call me if you need anything!',
                                responses: [
                                    { text: 'Thanks', next_state: 'farewell' }
                                ]
                            },
                            farewell: {
                                message: 'Come back soon!',
                                responses: []
                            }
                        }
                    }
                }
            },
            {
                name: 'guard',
                npc: 'Town Guard',
                content: {
                    dialogue: {
                        id: 'guard-dialogue',
                        name: 'Guard Dialogue',
                        npc: 'Town Guard',
                        initial_state: 'greeting',
                        states: {
                            greeting: {
                                message: 'Hail, citizen! All is well in the town today.',
                                responses: [
                                    { text: 'Any news?', next_state: 'news' },
                                    { text: 'Is it safe here?', next_state: 'safety' },
                                    { text: 'Goodbye', next_state: 'farewell' }
                                ]
                            },
                            news: {
                                message: 'The town is peaceful. Trade routes are secure.',
                                responses: [
                                    { text: 'Thanks for the information', next_state: 'farewell' }
                                ]
                            },
                            safety: {
                                message: 'Very safe! We guards keep watch day and night.',
                                responses: [
                                    { text: 'Good to know', next_state: 'farewell' }
                                ]
                            },
                            farewell: {
                                message: 'Stay safe out there!',
                                responses: []
                            }
                        }
                    }
                }
            }
        ];
        for (let i = 0; i < Math.min(count, dialogues.length); i++) {
            const dialogue = dialogues[i];
            const filePath = path.join(dialogueDir, `${dialogue.name}.json`);
            fs.writeFileSync(filePath, JSON.stringify(dialogue.content, null, 2), 'utf8');
            console.log(`📝 Created dialogue: ${dialogue.name}`);
        }
    }
    async profileApplication(type, options) {
        try {
            const duration = parseInt(options.duration);
            const outputFile = path.resolve(this.options.projectRoot, options.output);
            if (!this.options.quiet) {
                console.log(chalk_1.default.blue(`📊 Profiling ${type} for ${duration} seconds...`));
            }
            switch (type) {
                case 'memory':
                    await this.profileMemory(duration, outputFile);
                    break;
                case 'cpu':
                    await this.profileCPU(duration, outputFile);
                    break;
                case 'performance':
                    await this.profilePerformance(duration, outputFile);
                    break;
                default:
                    console.error(chalk_1.default.red(`Unknown profile type: ${type}`));
                    return;
            }
            console.log(chalk_1.default.green(`✅ Profiling complete. Results saved to: ${outputFile}`));
        }
        catch (error) {
            console.error(chalk_1.default.red('Failed to profile application:'), error.message);
            if (this.options.verbose) {
                console.error(error);
            }
        }
    }
    async profileMemory(duration, outputFile) {
        const samples = [];
        const interval = Math.max(1000, duration * 1000 / 30);
        for (let i = 0; i < duration; i++) {
            const memUsage = process.memoryUsage();
            samples.push({
                timestamp: new Date(),
                ...memUsage
            });
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        fs.writeFileSync(outputFile, JSON.stringify({
            type: 'memory',
            duration,
            samples
        }, null, 2), 'utf8');
    }
    async profileCPU(duration, outputFile) {
        const samples = [];
        const interval = Math.max(1000, duration * 1000 / 30);
        for (let i = 0; i < duration; i++) {
            const cpuUsage = process.cpuUsage();
            samples.push({
                timestamp: new Date(),
                ...cpuUsage
            });
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        fs.writeFileSync(outputFile, JSON.stringify({
            type: 'cpu',
            duration,
            samples
        }, null, 2), 'utf8');
    }
    async profilePerformance(duration, outputFile) {
        const startTime = process.hrtime.bigint();
        const startMemory = process.memoryUsage();
        const startCPU = process.cpuUsage();
        for (let i = 0; i < 1000000; i++) {
            Math.random() * Math.random();
        }
        await new Promise(resolve => setTimeout(resolve, duration * 1000));
        const endTime = process.hrtime.bigint();
        const endMemory = process.memoryUsage();
        const endCPU = process.cpuUsage(startCPU);
        const results = {
            type: 'performance',
            duration,
            executionTime: Number(endTime - startTime) / 1000000,
            memoryDelta: {
                rss: endMemory.rss - startMemory.rss,
                heapUsed: endMemory.heapUsed - startMemory.heapUsed,
                heapTotal: endMemory.heapTotal - startMemory.heapTotal
            },
            cpuUsage: endCPU
        };
        fs.writeFileSync(outputFile, JSON.stringify(results, null, 2), 'utf8');
    }
    async analyzeLogs(file, options) {
        try {
            const logDir = path.join(this.options.projectRoot, 'logs');
            let logFiles;
            if (file) {
                logFiles = [path.resolve(this.options.projectRoot, file)];
            }
            else {
                if (!fs.existsSync(logDir)) {
                    console.error(chalk_1.default.red('No logs directory found'));
                    return;
                }
                logFiles = fs.readdirSync(logDir)
                    .filter(f => f.endsWith('.log'))
                    .map(f => path.join(logDir, f));
            }
            if (logFiles.length === 0) {
                console.log(chalk_1.default.yellow('No log files found'));
                return;
            }
            console.log(chalk_1.default.blue(`📊 Analyzing ${logFiles.length} log files...`));
            console.log(chalk_1.default.yellow('⚠️ Log analysis not yet implemented'));
            logFiles.forEach(logFile => {
                console.log(`📁 Found log: ${path.basename(logFile)}`);
            });
        }
        catch (error) {
            console.error(chalk_1.default.red('Failed to analyze logs:'), error.message);
            if (this.options.verbose) {
                console.error(error);
            }
        }
    }
    async tailLogs(file, options) {
        try {
            let logFile;
            if (file) {
                logFile = path.resolve(this.options.projectRoot, file);
            }
            else {
                logFile = path.join(this.options.projectRoot, 'logs', 'mud-engine.log');
            }
            if (!fs.existsSync(logFile)) {
                console.error(chalk_1.default.red(`Log file not found: ${logFile}`));
                return;
            }
            if (options.follow) {
                console.log(chalk_1.default.blue(`👀 Tailing log file: ${logFile}`));
                console.log(chalk_1.default.yellow('Press Ctrl+C to stop'));
                console.log(chalk_1.default.yellow('⚠️ Log tailing not yet implemented'));
            }
            else {
                const lines = parseInt(options.lines);
                console.log(chalk_1.default.blue(`📄 Showing last ${lines} lines from: ${logFile}`));
                console.log(chalk_1.default.yellow('⚠️ Log reading not yet implemented'));
            }
        }
        catch (error) {
            console.error(chalk_1.default.red('Failed to tail logs:'), error.message);
            if (this.options.verbose) {
                console.error(error);
            }
        }
    }
    async searchLogs(pattern, file, options) {
        try {
            const logDir = path.join(this.options.projectRoot, 'logs');
            let logFiles;
            if (file) {
                logFiles = [path.resolve(this.options.projectRoot, file)];
            }
            else {
                if (!fs.existsSync(logDir)) {
                    console.error(chalk_1.default.red('No logs directory found'));
                    return;
                }
                logFiles = fs.readdirSync(logDir)
                    .filter(f => f.endsWith('.log'))
                    .map(f => path.join(logDir, f));
            }
            console.log(chalk_1.default.blue(`🔍 Searching for "${pattern}" in ${logFiles.length} log files...`));
            console.log(chalk_1.default.yellow('⚠️ Log search not yet implemented'));
        }
        catch (error) {
            console.error(chalk_1.default.red('Failed to search logs:'), error.message);
            if (this.options.verbose) {
                console.error(error);
            }
        }
    }
    async createBackup(name, options) {
        try {
            const sourcePath = path.resolve(this.options.projectRoot, options.path);
            const backupDir = path.resolve(this.options.projectRoot, options.output);
            if (!fs.existsSync(sourcePath)) {
                console.error(chalk_1.default.red(`Source path not found: ${sourcePath}`));
                return;
            }
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true });
            }
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupName = `${name}-${timestamp}`;
            const backupPath = path.join(backupDir, backupName);
            if (!this.options.quiet) {
                console.log(chalk_1.default.blue(`💾 Creating backup "${backupName}"...`));
            }
            this.copyDirectory(sourcePath, backupPath);
            const metadata = {
                name: backupName,
                type: options.type,
                created: new Date(),
                source: sourcePath,
                files: this.getDirectoryContents(backupPath)
            };
            fs.writeFileSync(path.join(backupPath, 'backup.json'), JSON.stringify(metadata, null, 2), 'utf8');
            console.log(chalk_1.default.green(`✅ Backup created successfully!`));
            console.log(`📁 Location: ${backupPath}`);
        }
        catch (error) {
            console.error(chalk_1.default.red('Failed to create backup:'), error.message);
            if (this.options.verbose) {
                console.error(error);
            }
        }
    }
    async restoreBackup(name, options) {
        try {
            const backupDir = path.resolve(this.options.projectRoot, options.backupDir);
            const restorePath = path.resolve(this.options.projectRoot, options.path);
            const backupPath = path.join(backupDir, name);
            if (!fs.existsSync(backupPath)) {
                console.error(chalk_1.default.red(`Backup not found: ${backupPath}`));
                return;
            }
            if (!this.options.quiet) {
                console.log(chalk_1.default.blue(`🔄 Restoring backup "${name}"...`));
            }
            if (!options.force && fs.existsSync(restorePath)) {
                console.log(chalk_1.default.yellow(`⚠️ Destination exists. Use --force to overwrite.`));
                return;
            }
            this.copyDirectory(backupPath, restorePath);
            console.log(chalk_1.default.green(`✅ Backup restored successfully!`));
            console.log(`📁 Restored to: ${restorePath}`);
        }
        catch (error) {
            console.error(chalk_1.default.red('Failed to restore backup:'), error.message);
            if (this.options.verbose) {
                console.error(error);
            }
        }
    }
    copyDirectory(source, destination) {
        if (!fs.existsSync(destination)) {
            fs.mkdirSync(destination, { recursive: true });
        }
        const entries = fs.readdirSync(source, { withFileTypes: true });
        for (const entry of entries) {
            const srcPath = path.join(source, entry.name);
            const destPath = path.join(destination, entry.name);
            if (entry.isDirectory()) {
                this.copyDirectory(srcPath, destPath);
            }
            else {
                fs.copyFileSync(srcPath, destPath);
            }
        }
    }
    getDirectoryContents(dirPath) {
        const contents = [];
        function scanDir(currentPath, relativePath = '') {
            const entries = fs.readdirSync(currentPath, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(currentPath, entry.name);
                const relPath = path.join(relativePath, entry.name);
                if (entry.isDirectory()) {
                    scanDir(fullPath, relPath);
                }
                else {
                    contents.push(relPath);
                }
            }
        }
        scanDir(dirPath);
        return contents;
    }
}
exports.DevCommands = DevCommands;
//# sourceMappingURL=dev.js.map