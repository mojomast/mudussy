/**
 * Development Commands Module
 *
 * Handles development utilities, seeding, profiling, backup, and restore
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { WorldManager } from '../../engine/modules/world/world-manager.js';
import { EventSystem } from '../../engine/core/event.js';
import { IWorldConfig } from '../../engine/modules/world/types.js';

interface DevCommandOptions {
  verbose?: boolean;
  quiet?: boolean;
  config?: string;
  projectRoot?: string;
}

export class DevCommands {
  private options: DevCommandOptions;

  constructor(options: DevCommandOptions) {
    this.options = options;
  }

  /**
   * Seed command
   */
  getSeedCommand(): Command {
    const command = new Command('seed')
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

  /**
   * Profile command
   */
  getProfileCommand(): Command {
    const command = new Command('profile')
      .description('Profile application performance')
      .argument('<type>', 'profile type (memory, cpu, performance)')
      .option('-d, --duration <seconds>', 'profiling duration', '30')
      .option('-o, --output <file>', 'output file', './logs/profile.json')
      .action(async (type, options) => {
        await this.profileApplication(type, options);
      });

    return command;
  }

  /**
   * Log command
   */
  getLogCommand(): Command {
    const command = new Command('log')
      .description('Log analysis and debugging tools')
      .addCommand(this.getLogAnalyzeCommand())
      .addCommand(this.getLogTailCommand())
      .addCommand(this.getLogSearchCommand());

    return command;
  }

  /**
   * Backup command
   */
  getBackupCommand(): Command {
    const command = new Command('backup')
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

  /**
   * Restore command
   */
  getRestoreCommand(): Command {
    const command = new Command('restore')
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

  /**
   * Log analyze subcommand
   */
  private getLogAnalyzeCommand(): Command {
    return new Command('analyze')
      .description('Analyze log files')
      .argument('[file]', 'log file to analyze')
      .option('-s, --since <time>', 'analyze logs since time (e.g., "1h", "30m")')
      .option('-l, --level <level>', 'filter by log level', 'all')
      .action(async (file, options) => {
        await this.analyzeLogs(file, options);
      });
  }

  /**
   * Log tail subcommand
   */
  private getLogTailCommand(): Command {
    return new Command('tail')
      .description('Tail log files in real-time')
      .argument('[file]', 'log file to tail')
      .option('-f, --follow', 'follow log file')
      .option('-n, --lines <number>', 'number of lines to show', '20')
      .action(async (file, options) => {
        await this.tailLogs(file, options);
      });
  }

  /**
   * Log search subcommand
   */
  private getLogSearchCommand(): Command {
    return new Command('search')
      .description('Search log files')
      .argument('<pattern>', 'search pattern')
      .argument('[file]', 'log file to search')
      .option('-i, --ignore-case', 'case insensitive search')
      .option('-c, --context <lines>', 'lines of context', '3')
      .action(async (pattern, file, options) => {
        await this.searchLogs(pattern, file, options);
      });
  }

  /**
   * Seed content with sample data
   */
  private async seedContent(type: string, options: any) {
    try {
      const count = parseInt(options.count);
      const outputPath = path.resolve(this.options.projectRoot!, options.path);

      if (!this.options.quiet) {
        console.log(chalk.blue(`🌱 Seeding ${type} content (${count} items)...`));
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
          console.error(chalk.red(`Unknown seed type: ${type}`));
          return;
      }

      console.log(chalk.green(`✅ Successfully seeded ${count} ${type} items`));

    } catch (error) {
      console.error(chalk.red('Failed to seed content:'), error.message);
      if (this.options.verbose) {
        console.error(error);
      }
    }
  }

  /**
   * Seed world content
   */
  private async seedWorldContent(count: number, outputPath: string, options: any) {
    const worldConfig: IWorldConfig = {
      defaultRoomId: 'town_square',
      maxItemsPerRoom: 50,
      maxPlayersPerRoom: 10,
      allowRoomCreation: true,
      contentPath: outputPath
    };

    const eventSystem = new EventSystem();
    const worldManager = new WorldManager(eventSystem, worldConfig);

    // Create a central town square
    const townSquare = worldManager.createRoom(
      'Town Square',
      'A bustling town square with shops and people all around. The center of town life.',
      'town'
    );

    // Create surrounding rooms
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

    // Add some sample items
    const sampleItems = [
      { name: 'Rusty Sword', type: 'weapon' as const, description: 'An old sword with a worn blade.' },
      { name: 'Health Potion', type: 'consumable' as const, description: 'A red potion that restores health.' },
      { name: 'Leather Armor', type: 'armor' as const, description: 'Basic leather armor for protection.' },
      { name: 'Gold Coin', type: 'misc' as const, description: 'A shiny gold coin.' },
      { name: 'Iron Key', type: 'key' as const, description: 'A key made of iron.' }
    ];

    sampleItems.forEach(itemTemplate => {
      // TODO: Add item creation to WorldManager
      console.log(`Would create item: ${itemTemplate.name}`);
    });

    // Save the world
    await worldManager.saveWorld(outputPath);
    console.log(`🏠 Created town with ${Math.min(count, roomTemplates.length + 1)} rooms`);
  }

  /**
   * Seed user content
   */
  private async seedUserContent(count: number, options: any) {
    // TODO: Implement user seeding
    console.log(chalk.yellow('⚠️ User seeding not yet implemented'));
  }

  /**
   * Seed dialogue content
   */
  private async seedDialogueContent(count: number, outputPath: string, options: any) {
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

  /**
   * Profile application performance
   */
  private async profileApplication(type: string, options: any) {
    try {
      const duration = parseInt(options.duration);
      const outputFile = path.resolve(this.options.projectRoot!, options.output);

      if (!this.options.quiet) {
        console.log(chalk.blue(`📊 Profiling ${type} for ${duration} seconds...`));
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
          console.error(chalk.red(`Unknown profile type: ${type}`));
          return;
      }

      console.log(chalk.green(`✅ Profiling complete. Results saved to: ${outputFile}`));

    } catch (error) {
      console.error(chalk.red('Failed to profile application:'), error.message);
      if (this.options.verbose) {
        console.error(error);
      }
    }
  }

  /**
   * Profile memory usage
   */
  private async profileMemory(duration: number, outputFile: string) {
    const samples = [];
    const interval = Math.max(1000, duration * 1000 / 30); // Sample every second or up to 30 samples

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

  /**
   * Profile CPU usage
   */
  private async profileCPU(duration: number, outputFile: string) {
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

  /**
   * Profile application performance
   */
  private async profilePerformance(duration: number, outputFile: string) {
    const startTime = process.hrtime.bigint();
    const startMemory = process.memoryUsage();
    const startCPU = process.cpuUsage();

    // Simulate some work
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
      executionTime: Number(endTime - startTime) / 1000000, // milliseconds
      memoryDelta: {
        rss: endMemory.rss - startMemory.rss,
        heapUsed: endMemory.heapUsed - startMemory.heapUsed,
        heapTotal: endMemory.heapTotal - startMemory.heapTotal
      },
      cpuUsage: endCPU
    };

    fs.writeFileSync(outputFile, JSON.stringify(results, null, 2), 'utf8');
  }

  /**
   * Analyze log files
   */
  private async analyzeLogs(file: string, options: any) {
    try {
      const logDir = path.join(this.options.projectRoot!, 'logs');
      let logFiles: string[];

      if (file) {
        logFiles = [path.resolve(this.options.projectRoot!, file)];
      } else {
        // Find all log files
        if (!fs.existsSync(logDir)) {
          console.error(chalk.red('No logs directory found'));
          return;
        }
        logFiles = fs.readdirSync(logDir)
          .filter(f => f.endsWith('.log'))
          .map(f => path.join(logDir, f));
      }

      if (logFiles.length === 0) {
        console.log(chalk.yellow('No log files found'));
        return;
      }

      console.log(chalk.blue(`📊 Analyzing ${logFiles.length} log files...`));

      // TODO: Implement log analysis
      console.log(chalk.yellow('⚠️ Log analysis not yet implemented'));

      logFiles.forEach(logFile => {
        console.log(`📁 Found log: ${path.basename(logFile)}`);
      });

    } catch (error) {
      console.error(chalk.red('Failed to analyze logs:'), error.message);
      if (this.options.verbose) {
        console.error(error);
      }
    }
  }

  /**
   * Tail log files
   */
  private async tailLogs(file: string, options: any) {
    try {
      let logFile: string;

      if (file) {
        logFile = path.resolve(this.options.projectRoot!, file);
      } else {
        // Default to main log file
        logFile = path.join(this.options.projectRoot!, 'logs', 'mud-engine.log');
      }

      if (!fs.existsSync(logFile)) {
        console.error(chalk.red(`Log file not found: ${logFile}`));
        return;
      }

      if (options.follow) {
        console.log(chalk.blue(`👀 Tailing log file: ${logFile}`));
        console.log(chalk.yellow('Press Ctrl+C to stop'));
        // TODO: Implement real tailing
        console.log(chalk.yellow('⚠️ Log tailing not yet implemented'));
      } else {
        // Show last N lines
        const lines = parseInt(options.lines);
        console.log(chalk.blue(`📄 Showing last ${lines} lines from: ${logFile}`));
        // TODO: Implement line reading
        console.log(chalk.yellow('⚠️ Log reading not yet implemented'));
      }

    } catch (error) {
      console.error(chalk.red('Failed to tail logs:'), error.message);
      if (this.options.verbose) {
        console.error(error);
      }
    }
  }

  /**
   * Search log files
   */
  private async searchLogs(pattern: string, file: string, options: any) {
    try {
      const logDir = path.join(this.options.projectRoot!, 'logs');
      let logFiles: string[];

      if (file) {
        logFiles = [path.resolve(this.options.projectRoot!, file)];
      } else {
        if (!fs.existsSync(logDir)) {
          console.error(chalk.red('No logs directory found'));
          return;
        }
        logFiles = fs.readdirSync(logDir)
          .filter(f => f.endsWith('.log'))
          .map(f => path.join(logDir, f));
      }

      console.log(chalk.blue(`🔍 Searching for "${pattern}" in ${logFiles.length} log files...`));

      // TODO: Implement log search
      console.log(chalk.yellow('⚠️ Log search not yet implemented'));

    } catch (error) {
      console.error(chalk.red('Failed to search logs:'), error.message);
      if (this.options.verbose) {
        console.error(error);
      }
    }
  }

  /**
   * Create backup of world data
   */
  private async createBackup(name: string, options: any) {
    try {
      const sourcePath = path.resolve(this.options.projectRoot!, options.path);
      const backupDir = path.resolve(this.options.projectRoot!, options.output);

      if (!fs.existsSync(sourcePath)) {
        console.error(chalk.red(`Source path not found: ${sourcePath}`));
        return;
      }

      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = `${name}-${timestamp}`;
      const backupPath = path.join(backupDir, backupName);

      if (!this.options.quiet) {
        console.log(chalk.blue(`💾 Creating backup "${backupName}"...`));
      }

      // Copy world data
      this.copyDirectory(sourcePath, backupPath);

      // Create backup metadata
      const metadata = {
        name: backupName,
        type: options.type,
        created: new Date(),
        source: sourcePath,
        files: this.getDirectoryContents(backupPath)
      };

      fs.writeFileSync(
        path.join(backupPath, 'backup.json'),
        JSON.stringify(metadata, null, 2),
        'utf8'
      );

      console.log(chalk.green(`✅ Backup created successfully!`));
      console.log(`📁 Location: ${backupPath}`);

    } catch (error) {
      console.error(chalk.red('Failed to create backup:'), error.message);
      if (this.options.verbose) {
        console.error(error);
      }
    }
  }

  /**
   * Restore backup of world data
   */
  private async restoreBackup(name: string, options: any) {
    try {
      const backupDir = path.resolve(this.options.projectRoot!, options.backupDir);
      const restorePath = path.resolve(this.options.projectRoot!, options.path);

      const backupPath = path.join(backupDir, name);

      if (!fs.existsSync(backupPath)) {
        console.error(chalk.red(`Backup not found: ${backupPath}`));
        return;
      }

      if (!this.options.quiet) {
        console.log(chalk.blue(`🔄 Restoring backup "${name}"...`));
      }

      if (!options.force && fs.existsSync(restorePath)) {
        console.log(chalk.yellow(`⚠️ Destination exists. Use --force to overwrite.`));
        return;
      }

      // Copy backup to destination
      this.copyDirectory(backupPath, restorePath);

      console.log(chalk.green(`✅ Backup restored successfully!`));
      console.log(`📁 Restored to: ${restorePath}`);

    } catch (error) {
      console.error(chalk.red('Failed to restore backup:'), error.message);
      if (this.options.verbose) {
        console.error(error);
      }
    }
  }

  /**
   * Copy directory recursively
   */
  private copyDirectory(source: string, destination: string) {
    if (!fs.existsSync(destination)) {
      fs.mkdirSync(destination, { recursive: true });
    }

    const entries = fs.readdirSync(source, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(source, entry.name);
      const destPath = path.join(destination, entry.name);

      if (entry.isDirectory()) {
        this.copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  /**
   * Get directory contents recursively
   */
  private getDirectoryContents(dirPath: string): string[] {
    const contents: string[] = [];

    function scanDir(currentPath: string, relativePath: string = '') {
      const entries = fs.readdirSync(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        const relPath = path.join(relativePath, entry.name);

        if (entry.isDirectory()) {
          scanDir(fullPath, relPath);
        } else {
          contents.push(relPath);
        }
      }
    }

    scanDir(dirPath);
    return contents;
  }
}