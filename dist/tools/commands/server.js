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
exports.ServerCommands = void 0;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
class ServerCommands {
    constructor(options) {
        this.options = options;
        this.serverPidFile = path.join(options.projectRoot, 'server.pid');
        this.logsDir = path.join(options.projectRoot, 'logs');
        if (!fs.existsSync(this.logsDir)) {
            fs.mkdirSync(this.logsDir, { recursive: true });
        }
    }
    getStartCommand() {
        const command = new commander_1.Command('start')
            .description('Start the MUD server')
            .option('-e, --env <environment>', 'environment (development, production)', 'development')
            .option('-p, --port <port>', 'server port', '3000')
            .option('-d, --daemon', 'run as daemon/background process')
            .option('--no-watch', 'disable file watching in development')
            .action(async (options) => {
            await this.startServer(options);
        });
        return command;
    }
    getStopCommand() {
        const command = new commander_1.Command('stop')
            .description('Stop the MUD server')
            .option('-f, --force', 'force stop (SIGKILL)')
            .action(async (options) => {
            await this.stopServer(options);
        });
        return command;
    }
    getStatusCommand() {
        const command = new commander_1.Command('status')
            .description('Check server status')
            .option('-v, --verbose', 'show detailed status')
            .action(async (options) => {
            await this.showStatus(options);
        });
        return command;
    }
    getRestartCommand() {
        const command = new commander_1.Command('restart')
            .description('Restart the MUD server')
            .option('-e, --env <environment>', 'environment (development, production)', 'development')
            .option('-p, --port <port>', 'server port', '3000')
            .action(async (options) => {
            await this.restartServer(options);
        });
        return command;
    }
    getLogsCommand() {
        const command = new commander_1.Command('logs')
            .description('View server logs')
            .option('-f, --follow', 'follow log output')
            .option('-n, --lines <number>', 'number of lines to show', '50')
            .option('-l, --level <level>', 'log level filter', 'all')
            .action(async (options) => {
            await this.showLogs(options);
        });
        return command;
    }
    async startServer(options) {
        try {
            if (this.isServerRunning()) {
                console.error(chalk_1.default.red('Server is already running'));
                return;
            }
            if (!this.options.quiet) {
                console.log(chalk_1.default.blue(`🚀 Starting MUD server in ${options.env} mode...`));
                if (options.port) {
                    console.log(`📡 Port: ${options.port}`);
                }
            }
            const env = {
                ...process.env,
                NODE_ENV: options.env,
                PORT: options.port,
                LOG_LEVEL: this.options.verbose ? 'debug' : 'info'
            };
            if (options.daemon) {
                const logFile = path.join(this.logsDir, 'server.log');
                const out = fs.openSync(logFile, 'a');
                const err = fs.openSync(logFile, 'a');
                const child = (0, child_process_1.spawn)('npm', ['run', options.env === 'production' ? 'start:prod' : 'start:dev'], {
                    detached: true,
                    stdio: ['ignore', out, err],
                    cwd: this.options.projectRoot,
                    env
                });
                child.unref();
                fs.writeFileSync(this.serverPidFile, child.pid.toString(), 'utf8');
                console.log(chalk_1.default.green(`✅ Server started as daemon (PID: ${child.pid})`));
                console.log(`📝 Logs: ${logFile}`);
            }
            else {
                const command = options.env === 'production' ? 'start:prod' : 'start:dev';
                console.log(chalk_1.default.yellow(`Running: npm run ${command}`));
                console.log(chalk_1.default.yellow('Press Ctrl+C to stop'));
                try {
                    (0, child_process_1.execSync)(`npm run ${command}`, {
                        stdio: 'inherit',
                        cwd: this.options.projectRoot,
                        env
                    });
                }
                catch (error) {
                    if (!this.options.quiet) {
                        console.log(chalk_1.default.blue('\n👋 Server stopped'));
                    }
                }
            }
        }
        catch (error) {
            console.error(chalk_1.default.red('Failed to start server:'), error.message);
            if (this.options.verbose) {
                console.error(error);
            }
        }
    }
    async stopServer(options) {
        try {
            if (!this.isServerRunning()) {
                console.log(chalk_1.default.yellow('Server is not running'));
                return;
            }
            const pid = this.getServerPid();
            if (!this.options.quiet) {
                console.log(chalk_1.default.blue(`🛑 Stopping server (PID: ${pid})...`));
            }
            try {
                if (options.force) {
                    process.kill(pid, 'SIGKILL');
                    console.log(chalk_1.default.green('✅ Server forcefully stopped'));
                }
                else {
                    process.kill(pid, 'SIGTERM');
                    console.log(chalk_1.default.green('✅ Server stopped gracefully'));
                }
                if (fs.existsSync(this.serverPidFile)) {
                    fs.unlinkSync(this.serverPidFile);
                }
            }
            catch (error) {
                console.error(chalk_1.default.red('Failed to stop server:'), error.message);
                console.log(chalk_1.default.yellow('You may need to manually kill the process'));
            }
        }
        catch (error) {
            console.error(chalk_1.default.red('Failed to stop server:'), error.message);
            if (this.options.verbose) {
                console.error(error);
            }
        }
    }
    async showStatus(options) {
        try {
            const isRunning = this.isServerRunning();
            if (isRunning) {
                const pid = this.getServerPid();
                console.log(chalk_1.default.green('🟢 Server is running'));
                console.log(`   PID: ${pid}`);
                if (options.verbose) {
                    try {
                        const memUsage = process.memoryUsage();
                        console.log(`   Memory: ${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`);
                        console.log(`   Uptime: ${Math.floor(process.uptime())} seconds`);
                    }
                    catch (error) {
                    }
                    const port = this.getConfiguredPort();
                    if (port) {
                        console.log(`   Port: ${port}`);
                    }
                }
            }
            else {
                console.log(chalk_1.default.red('🔴 Server is not running'));
            }
            if (options.verbose) {
                console.log('\n📊 System Status:');
                console.log(`   Node.js: ${process.version}`);
                console.log(`   Platform: ${process.platform}`);
                console.log(`   PID file: ${fs.existsSync(this.serverPidFile) ? 'exists' : 'not found'}`);
                const logFiles = fs.readdirSync(this.logsDir)
                    .filter(f => f.endsWith('.log'))
                    .slice(0, 5);
                if (logFiles.length > 0) {
                    console.log('   Recent logs:');
                    logFiles.forEach(log => {
                        const stat = fs.statSync(path.join(this.logsDir, log));
                        console.log(`     ${log} (${Math.round(stat.size / 1024)} KB)`);
                    });
                }
            }
        }
        catch (error) {
            console.error(chalk_1.default.red('Failed to check server status:'), error.message);
            if (this.options.verbose) {
                console.error(error);
            }
        }
    }
    async restartServer(options) {
        try {
            if (!this.options.quiet) {
                console.log(chalk_1.default.blue('🔄 Restarting server...'));
            }
            if (this.isServerRunning()) {
                await this.stopServer({ force: false });
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
            await this.startServer(options);
        }
        catch (error) {
            console.error(chalk_1.default.red('Failed to restart server:'), error.message);
            if (this.options.verbose) {
                console.error(error);
            }
        }
    }
    async showLogs(options) {
        try {
            const logFile = path.join(this.logsDir, 'server.log');
            if (!fs.existsSync(logFile)) {
                console.log(chalk_1.default.yellow('No server log file found'));
                return;
            }
            if (options.follow) {
                console.log(chalk_1.default.blue(`👀 Following server logs...`));
                console.log(chalk_1.default.yellow('Press Ctrl+C to stop'));
                console.log(chalk_1.default.yellow('⚠️ Real-time log following not yet implemented'));
            }
            else {
                const lines = parseInt(options.lines);
                console.log(chalk_1.default.blue(`📄 Showing last ${lines} lines from server log:`));
                console.log('─'.repeat(50));
                try {
                    const content = fs.readFileSync(logFile, 'utf8');
                    const logLines = content.split('\n').filter(line => line.trim());
                    const startIndex = Math.max(0, logLines.length - lines);
                    const selectedLines = logLines.slice(startIndex);
                    selectedLines.forEach((line, index) => {
                        if (line.includes('ERROR') || line.includes('error')) {
                            console.log(chalk_1.default.red(line));
                        }
                        else if (line.includes('WARN') || line.includes('warn')) {
                            console.log(chalk_1.default.yellow(line));
                        }
                        else if (line.includes('INFO') || line.includes('info')) {
                            console.log(chalk_1.default.blue(line));
                        }
                        else {
                            console.log(line);
                        }
                    });
                    if (selectedLines.length === 0) {
                        console.log(chalk_1.default.yellow('No log entries found'));
                    }
                }
                catch (error) {
                    console.error(chalk_1.default.red('Failed to read log file:'), error.message);
                }
            }
        }
        catch (error) {
            console.error(chalk_1.default.red('Failed to show logs:'), error.message);
            if (this.options.verbose) {
                console.error(error);
            }
        }
    }
    isServerRunning() {
        if (!fs.existsSync(this.serverPidFile)) {
            return false;
        }
        try {
            const pid = parseInt(fs.readFileSync(this.serverPidFile, 'utf8'));
            process.kill(pid, 0);
            return true;
        }
        catch (error) {
            if (fs.existsSync(this.serverPidFile)) {
                fs.unlinkSync(this.serverPidFile);
            }
            return false;
        }
    }
    getServerPid() {
        if (!fs.existsSync(this.serverPidFile)) {
            throw new Error('Server PID file not found');
        }
        const pid = parseInt(fs.readFileSync(this.serverPidFile, 'utf8'));
        if (isNaN(pid)) {
            throw new Error('Invalid PID in server PID file');
        }
        return pid;
    }
    getConfiguredPort() {
        try {
            const envFile = path.join(this.options.projectRoot, '.env');
            if (fs.existsSync(envFile)) {
                const envContent = fs.readFileSync(envFile, 'utf8');
                const portMatch = envContent.match(/^PORT=(\d+)$/m);
                if (portMatch) {
                    return portMatch[1];
                }
            }
        }
        catch (error) {
        }
        return null;
    }
    async getServerProcessInfo() {
        try {
            if (!this.isServerRunning()) {
                return null;
            }
            const pid = this.getServerPid();
            if (process.platform === 'win32') {
                return { pid, platform: 'windows' };
            }
            try {
                const output = (0, child_process_1.execSync)(`ps -p ${pid} -o pid,ppid,pcpu,pmem,etime,cmd --no-headers`, {
                    encoding: 'utf8'
                });
                const parts = output.trim().split(/\s+/);
                return {
                    pid: parseInt(parts[0]),
                    ppid: parseInt(parts[1]),
                    cpu: parseFloat(parts[2]),
                    memory: parseFloat(parts[3]),
                    elapsed: parts[4],
                    command: parts.slice(5).join(' ')
                };
            }
            catch (error) {
                return { pid };
            }
        }
        catch (error) {
            return null;
        }
    }
    async isPortListening(port) {
        try {
            if (process.platform === 'win32') {
                const output = (0, child_process_1.execSync)(`netstat -an | findstr :${port}`, { encoding: 'utf8' });
                return output.includes(`:${port}`) && output.includes('LISTENING');
            }
            else {
                try {
                    (0, child_process_1.execSync)(`lsof -i :${port}`, { stdio: 'ignore' });
                    return true;
                }
                catch (error) {
                    return false;
                }
            }
        }
        catch (error) {
            return false;
        }
    }
    async getSystemResources() {
        try {
            const memUsage = process.memoryUsage();
            const cpuUsage = process.cpuUsage();
            return {
                memory: {
                    used: Math.round(memUsage.heapUsed / 1024 / 1024),
                    total: Math.round(memUsage.heapTotal / 1024 / 1024),
                    external: Math.round(memUsage.external / 1024 / 1024)
                },
                cpu: {
                    user: Math.round(cpuUsage.user / 1000),
                    system: Math.round(cpuUsage.system / 1000)
                },
                uptime: Math.floor(process.uptime())
            };
        }
        catch (error) {
            return null;
        }
    }
}
exports.ServerCommands = ServerCommands;
//# sourceMappingURL=server.js.map