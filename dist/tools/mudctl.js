#!/usr/bin/env node
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
exports.CLI_VERSION = exports.CLI_NAME = void 0;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const world_js_1 = require("./commands/world.js");
const admin_js_1 = require("./commands/admin.js");
const user_service_js_1 = require("./commands/user-service.js");
const content_js_1 = require("./commands/content.js");
const dev_js_1 = require("./commands/dev.js");
const server_js_1 = require("./commands/server.js");
const CLI_NAME = 'mudctl';
exports.CLI_NAME = CLI_NAME;
const CLI_DESCRIPTION = 'MUD Engine Control Tool - Development, Administration & Content Management';
const CLI_VERSION = '1.0.0';
exports.CLI_VERSION = CLI_VERSION;
const program = new commander_1.Command();
program
    .name(CLI_NAME)
    .description(CLI_DESCRIPTION)
    .version(CLI_VERSION)
    .option('-v, --verbose', 'enable verbose output')
    .option('-q, --quiet', 'suppress non-error output')
    .option('--config <path>', 'path to config file', './.env')
    .option('--project-root <path>', 'path to project root', process.cwd());
process.on('uncaughtException', (error) => {
    console.error(chalk_1.default.red('Uncaught Exception:'), error.message);
    if (program.opts().verbose) {
        console.error(error.stack);
    }
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error(chalk_1.default.red('Unhandled Rejection at:'), promise, 'reason:', reason);
    process.exit(1);
});
async function initializeCommands() {
    try {
        const options = program.opts();
        const configPath = path.resolve(options.projectRoot, options.config);
        if (fs.existsSync(configPath)) {
            require('dotenv').config({ path: configPath });
        }
        const worldCommands = new world_js_1.WorldCommands(options);
        const adminCommands = new admin_js_1.AdminCommands(options);
        const userServiceCommands = new user_service_js_1.UserServiceCommands(options);
        const contentCommands = new content_js_1.ContentCommands(options);
        const devCommands = new dev_js_1.DevCommands(options);
        const serverCommands = new server_js_1.ServerCommands(options);
        program
            .command('world')
            .description('World creation, validation, and management commands')
            .addCommand(worldCommands.getCreateCommand())
            .addCommand(worldCommands.getValidateCommand())
            .addCommand(worldCommands.getEditCommand())
            .addCommand(worldCommands.getImportCommand())
            .addCommand(worldCommands.getExportCommand())
            .addCommand(worldCommands.getStatsCommand());
        program
            .command('admin')
            .description('User management and administrative tools')
            .addCommand(adminCommands.getUserCommand())
            .addCommand(adminCommands.getRoleCommand())
            .addCommand(adminCommands.getAuthCommand())
            .addCommand(adminCommands.getMonitorCommand())
            .addCommand(userServiceCommands.getUserCommand());
        program
            .command('content')
            .description('Content development and management tools')
            .addCommand(contentCommands.getNewCommand())
            .addCommand(contentCommands.getValidateCommand())
            .addCommand(contentCommands.getTestCommand())
            .addCommand(contentCommands.getMigrateCommand())
            .addCommand(contentCommands.getPackageCommand());
        program
            .command('dev')
            .description('Development utilities and tools')
            .addCommand(devCommands.getSeedCommand())
            .addCommand(devCommands.getProfileCommand())
            .addCommand(devCommands.getLogCommand())
            .addCommand(devCommands.getBackupCommand())
            .addCommand(devCommands.getRestoreCommand());
        program
            .command('server')
            .description('Server management commands')
            .addCommand(serverCommands.getStartCommand())
            .addCommand(serverCommands.getStopCommand())
            .addCommand(serverCommands.getStatusCommand())
            .addCommand(serverCommands.getRestartCommand())
            .addCommand(serverCommands.getLogsCommand());
        program
            .command('init')
            .description('Initialize a new MUD project')
            .option('-t, --template <template>', 'project template to use', 'basic')
            .option('-f, --force', 'overwrite existing files')
            .action(async (options) => {
            console.log(chalk_1.default.blue('🚀 Initializing new MUD project...'));
        });
        program
            .command('doctor')
            .description('Check system health and diagnose issues')
            .action(async () => {
            console.log(chalk_1.default.blue('🔍 Running system diagnostics...'));
        });
        program
            .command('version')
            .description('Show version information')
            .action(() => {
            console.log(`${CLI_NAME} v${CLI_VERSION}`);
            console.log('MUD Engine Control Tool');
        });
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
    }
    catch (error) {
        console.error(chalk_1.default.red('Failed to initialize commands:'), error.message);
        if (program.opts().verbose) {
            console.error(error.stack);
        }
        process.exit(1);
    }
}
async function main() {
    await initializeCommands();
    if (process.argv.length === 2) {
        program.help();
    }
    program.parse(process.argv);
}
if (require.main === module) {
    main().catch((error) => {
        console.error(chalk_1.default.red('CLI Error:'), error.message);
        if (program.opts().verbose) {
            console.error(error.stack);
        }
        process.exit(1);
    });
}
//# sourceMappingURL=mudctl.js.map