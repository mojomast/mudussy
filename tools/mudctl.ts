#!/usr/bin/env node

/**
 * MUD Engine Control Tool (mudctl)
 *
 * A comprehensive CLI tool for MUD engine development, administration, and content management.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';

// Import command modules
import { WorldCommands } from './commands/world.js';
import { AdminCommands } from './commands/admin.js';
import { UserServiceCommands } from './commands/user-service.js';
import { ContentCommands } from './commands/content.js';
import { DevCommands } from './commands/dev.js';
import { ServerCommands } from './commands/server.js';

// CLI Configuration
const CLI_NAME = 'mudctl';
const CLI_DESCRIPTION = 'MUD Engine Control Tool - Development, Administration & Content Management';
const CLI_VERSION = '1.0.0';

// Initialize CLI
const program = new Command();

// Basic CLI setup
program
  .name(CLI_NAME)
  .description(CLI_DESCRIPTION)
  .version(CLI_VERSION)
  .option('-v, --verbose', 'enable verbose output')
  .option('-q, --quiet', 'suppress non-error output')
  .option('--config <path>', 'path to config file', './.env')
  .option('--project-root <path>', 'path to project root', process.cwd());

// Global error handler
process.on('uncaughtException', (error) => {
  console.error(chalk.red('Uncaught Exception:'), error.message);
  if (program.opts().verbose) {
    console.error(error.stack);
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('Unhandled Rejection at:'), promise, 'reason:', reason);
  process.exit(1);
});

// Initialize commands
async function initializeCommands() {
  try {
    const options = program.opts();

    // Load configuration
    const configPath = path.resolve(options.projectRoot, options.config);
    if (fs.existsSync(configPath)) {
      require('dotenv').config({ path: configPath });
    }

    // Initialize command modules
    const worldCommands = new WorldCommands(options);
    const adminCommands = new AdminCommands(options);
  const userServiceCommands = new UserServiceCommands(options);
    const contentCommands = new ContentCommands(options);
    const devCommands = new DevCommands(options);
    const serverCommands = new ServerCommands(options);

    // Register world commands
    program
      .command('world')
      .description('World creation, validation, and management commands')
      .addCommand(worldCommands.getCreateCommand())
      .addCommand(worldCommands.getValidateCommand())
      .addCommand(worldCommands.getEditCommand())
      .addCommand(worldCommands.getImportCommand())
      .addCommand(worldCommands.getExportCommand())
      .addCommand(worldCommands.getStatsCommand());

    // Register admin commands
    program
      .command('admin')
      .description('User management and administrative tools')
      .addCommand(adminCommands.getUserCommand())
      .addCommand(adminCommands.getRoleCommand())
      .addCommand(adminCommands.getAuthCommand())
  .addCommand(adminCommands.getMonitorCommand())
  // UserService-backed user management (roles: admin/mod/player)
  .addCommand(userServiceCommands.getUserCommand());

    // Register content commands
    program
      .command('content')
      .description('Content development and management tools')
      .addCommand(contentCommands.getNewCommand())
      .addCommand(contentCommands.getValidateCommand())
      .addCommand(contentCommands.getTestCommand())
      .addCommand(contentCommands.getMigrateCommand())
      .addCommand(contentCommands.getPackageCommand());

    // Register development commands
    program
      .command('dev')
      .description('Development utilities and tools')
      .addCommand(devCommands.getSeedCommand())
      .addCommand(devCommands.getProfileCommand())
      .addCommand(devCommands.getLogCommand())
      .addCommand(devCommands.getBackupCommand())
      .addCommand(devCommands.getRestoreCommand());

    // Register server commands
    program
      .command('server')
      .description('Server management commands')
      .addCommand(serverCommands.getStartCommand())
      .addCommand(serverCommands.getStopCommand())
      .addCommand(serverCommands.getStatusCommand())
      .addCommand(serverCommands.getRestartCommand())
      .addCommand(serverCommands.getLogsCommand());

    // Add utility commands
    program
      .command('init')
      .description('Initialize a new MUD project')
      .option('-t, --template <template>', 'project template to use', 'basic')
      .option('-f, --force', 'overwrite existing files')
      .action(async (options) => {
        console.log(chalk.blue('🚀 Initializing new MUD project...'));
        // TODO: Implement project initialization
      });

    program
      .command('doctor')
      .description('Check system health and diagnose issues')
      .action(async () => {
        console.log(chalk.blue('🔍 Running system diagnostics...'));
        // TODO: Implement system health checks
      });

    program
      .command('version')
      .description('Show version information')
      .action(() => {
        console.log(`${CLI_NAME} v${CLI_VERSION}`);
        console.log('MUD Engine Control Tool');
      });

    // Add help examples
    program.addHelpText('after', `
Examples:
  $ mudctl world create --name "My World" --template fantasy
  $ mudctl world validate --path ./world-data
  $ mudctl server start --env production
  $ mudctl admin user add --username admin --role administrator
  $ mudctl admin user add --username newuser --password secret --role player
  $ mudctl admin user promote --username moderator
  $ mudctl admin user demote --username adminuser
  $ mudctl admin user list --role admin
  $ mudctl admin user delete --username olduser --force
  $ mudctl content new dialogue --name "village-elder"
  $ mudctl dev seed --type world --count 10
  $ mudctl dev profile --type memory
`);

  } catch (error) {
    console.error(chalk.red('Failed to initialize commands:'), error.message);
    if (program.opts().verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Main execution
async function main() {
  await initializeCommands();

  // Handle no arguments by showing help
  if (process.argv.length === 2) {
    program.help();
  }

  // Parse CLI arguments
  program.parse(process.argv);
}

// Run the CLI
if (require.main === module) {
  main().catch((error) => {
    console.error(chalk.red('CLI Error:'), error.message);
    if (program.opts().verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  });
}

export { CLI_NAME, CLI_VERSION };