/**
 * Server Commands Module
 *
 * Handles server management, monitoring, and control operations
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import { execSync, spawn } from 'child_process';

interface ServerCommandOptions {
  verbose?: boolean;
  quiet?: boolean;
  config?: string;
  projectRoot?: string;
}

export class ServerCommands {
  private options: ServerCommandOptions;
  private serverPidFile: string;
  private logsDir: string;

  constructor(options: ServerCommandOptions) {
    this.options = options;
    this.serverPidFile = path.join(options.projectRoot!, 'server.pid');
    this.logsDir = path.join(options.projectRoot!, 'logs');

    // Ensure logs directory exists
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }

  /**
   * Start server command
   */
  getStartCommand(): Command {
    const command = new Command('start')
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

  /**
   * Stop server command
   */
  getStopCommand(): Command {
    const command = new Command('stop')
      .description('Stop the MUD server')
      .option('-f, --force', 'force stop (SIGKILL)')
      .action(async (options) => {
        await this.stopServer(options);
      });

    return command;
  }

  /**
   * Server status command
   */
  getStatusCommand(): Command {
    const command = new Command('status')
      .description('Check server status')
      .option('-v, --verbose', 'show detailed status')
      .action(async (options) => {
        await this.showStatus(options);
      });

    return command;
  }

  /**
   * Restart server command
   */
  getRestartCommand(): Command {
    const command = new Command('restart')
      .description('Restart the MUD server')
      .option('-e, --env <environment>', 'environment (development, production)', 'development')
      .option('-p, --port <port>', 'server port', '3000')
      .action(async (options) => {
        await this.restartServer(options);
      });

    return command;
  }

  /**
   * Server logs command
   */
  getLogsCommand(): Command {
    const command = new Command('logs')
      .description('View server logs')
      .option('-f, --follow', 'follow log output')
      .option('-n, --lines <number>', 'number of lines to show', '50')
      .option('-l, --level <level>', 'log level filter', 'all')
      .action(async (options) => {
        await this.showLogs(options);
      });

    return command;
  }

  /**
   * Start the MUD server
   */
  private async startServer(options: any) {
    try {
      // Check if server is already running
      if (this.isServerRunning()) {
        console.error(chalk.red('Server is already running'));
        return;
      }

      if (!this.options.quiet) {
        console.log(chalk.blue(`🚀 Starting MUD server in ${options.env} mode...`));
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
        // Start as daemon
        const logFile = path.join(this.logsDir, 'server.log');
        const out = fs.openSync(logFile, 'a');
        const err = fs.openSync(logFile, 'a');

        const child = spawn(
          'npm',
          ['run', options.env === 'production' ? 'start:prod' : 'start:dev'],
          {
            detached: true,
            stdio: ['ignore', out, err],
            cwd: this.options.projectRoot,
            env
          }
        );

        child.unref();

        // Save PID
        fs.writeFileSync(this.serverPidFile, child.pid!.toString(), 'utf8');

        console.log(chalk.green(`✅ Server started as daemon (PID: ${child.pid})`));
        console.log(`📝 Logs: ${logFile}`);

      } else {
        // Start in foreground
        const command = options.env === 'production' ? 'start:prod' : 'start:dev';
        console.log(chalk.yellow(`Running: npm run ${command}`));
        console.log(chalk.yellow('Press Ctrl+C to stop'));

        try {
          execSync(`npm run ${command}`, {
            stdio: 'inherit',
            cwd: this.options.projectRoot,
            env
          });
        } catch (error) {
          // This is expected when user presses Ctrl+C
          if (!this.options.quiet) {
            console.log(chalk.blue('\n👋 Server stopped'));
          }
        }
      }

    } catch (error) {
      console.error(chalk.red('Failed to start server:'), error.message);
      if (this.options.verbose) {
        console.error(error);
      }
    }
  }

  /**
   * Stop the MUD server
   */
  private async stopServer(options: any) {
    try {
      if (!this.isServerRunning()) {
        console.log(chalk.yellow('Server is not running'));
        return;
      }

      const pid = this.getServerPid();
      if (!this.options.quiet) {
        console.log(chalk.blue(`🛑 Stopping server (PID: ${pid})...`));
      }

      try {
        if (options.force) {
          process.kill(pid, 'SIGKILL');
          console.log(chalk.green('✅ Server forcefully stopped'));
        } else {
          process.kill(pid, 'SIGTERM');
          console.log(chalk.green('✅ Server stopped gracefully'));
        }

        // Clean up PID file
        if (fs.existsSync(this.serverPidFile)) {
          fs.unlinkSync(this.serverPidFile);
        }

      } catch (error) {
        console.error(chalk.red('Failed to stop server:'), error.message);
        console.log(chalk.yellow('You may need to manually kill the process'));
      }

    } catch (error) {
      console.error(chalk.red('Failed to stop server:'), error.message);
      if (this.options.verbose) {
        console.error(error);
      }
    }
  }

  /**
   * Show server status
   */
  private async showStatus(options: any) {
    try {
      const isRunning = this.isServerRunning();

      if (isRunning) {
        const pid = this.getServerPid();
        console.log(chalk.green('🟢 Server is running'));
        console.log(`   PID: ${pid}`);

        if (options.verbose) {
          try {
            // Get process information
            const memUsage = process.memoryUsage();
            console.log(`   Memory: ${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`);
            console.log(`   Uptime: ${Math.floor(process.uptime())} seconds`);
          } catch (error) {
            // Process info might not be available for different process
          }

          // Check if port is listening
          const port = this.getConfiguredPort();
          if (port) {
            console.log(`   Port: ${port}`);
            // TODO: Check if port is actually listening
          }
        }
      } else {
        console.log(chalk.red('🔴 Server is not running'));
      }

      // Show additional status information
      if (options.verbose) {
        console.log('\n📊 System Status:');
        console.log(`   Node.js: ${process.version}`);
        console.log(`   Platform: ${process.platform}`);
        console.log(`   PID file: ${fs.existsSync(this.serverPidFile) ? 'exists' : 'not found'}`);

        // Check for log files
        const logFiles = fs.readdirSync(this.logsDir)
          .filter(f => f.endsWith('.log'))
          .slice(0, 5); // Show max 5 log files

        if (logFiles.length > 0) {
          console.log('   Recent logs:');
          logFiles.forEach(log => {
            const stat = fs.statSync(path.join(this.logsDir, log));
            console.log(`     ${log} (${Math.round(stat.size / 1024)} KB)`);
          });
        }
      }

    } catch (error) {
      console.error(chalk.red('Failed to check server status:'), error.message);
      if (this.options.verbose) {
        console.error(error);
      }
    }
  }

  /**
   * Restart the MUD server
   */
  private async restartServer(options: any) {
    try {
      if (!this.options.quiet) {
        console.log(chalk.blue('🔄 Restarting server...'));
      }

      // Stop server if running
      if (this.isServerRunning()) {
        await this.stopServer({ force: false });
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      }

      // Start server
      await this.startServer(options);

    } catch (error) {
      console.error(chalk.red('Failed to restart server:'), error.message);
      if (this.options.verbose) {
        console.error(error);
      }
    }
  }

  /**
   * Show server logs
   */
  private async showLogs(options: any) {
    try {
      const logFile = path.join(this.logsDir, 'server.log');

      if (!fs.existsSync(logFile)) {
        console.log(chalk.yellow('No server log file found'));
        return;
      }

      if (options.follow) {
        console.log(chalk.blue(`👀 Following server logs...`));
        console.log(chalk.yellow('Press Ctrl+C to stop'));

        // TODO: Implement real-time log following
        console.log(chalk.yellow('⚠️ Real-time log following not yet implemented'));

      } else {
        // Show last N lines
        const lines = parseInt(options.lines);
        console.log(chalk.blue(`📄 Showing last ${lines} lines from server log:`));
        console.log('─'.repeat(50));

        try {
          const content = fs.readFileSync(logFile, 'utf8');
          const logLines = content.split('\n').filter(line => line.trim());

          const startIndex = Math.max(0, logLines.length - lines);
          const selectedLines = logLines.slice(startIndex);

          selectedLines.forEach((line, index) => {
            // Apply basic log level coloring
            if (line.includes('ERROR') || line.includes('error')) {
              console.log(chalk.red(line));
            } else if (line.includes('WARN') || line.includes('warn')) {
              console.log(chalk.yellow(line));
            } else if (line.includes('INFO') || line.includes('info')) {
              console.log(chalk.blue(line));
            } else {
              console.log(line);
            }
          });

          if (selectedLines.length === 0) {
            console.log(chalk.yellow('No log entries found'));
          }

        } catch (error) {
          console.error(chalk.red('Failed to read log file:'), error.message);
        }
      }

    } catch (error) {
      console.error(chalk.red('Failed to show logs:'), error.message);
      if (this.options.verbose) {
        console.error(error);
      }
    }
  }

  /**
   * Check if server is running
   */
  private isServerRunning(): boolean {
    if (!fs.existsSync(this.serverPidFile)) {
      return false;
    }

    try {
      const pid = parseInt(fs.readFileSync(this.serverPidFile, 'utf8'));
      process.kill(pid, 0); // Check if process exists
      return true;
    } catch (error) {
      // Process doesn't exist, clean up PID file
      if (fs.existsSync(this.serverPidFile)) {
        fs.unlinkSync(this.serverPidFile);
      }
      return false;
    }
  }

  /**
   * Get server PID
   */
  private getServerPid(): number {
    if (!fs.existsSync(this.serverPidFile)) {
      throw new Error('Server PID file not found');
    }

    const pid = parseInt(fs.readFileSync(this.serverPidFile, 'utf8'));
    if (isNaN(pid)) {
      throw new Error('Invalid PID in server PID file');
    }

    return pid;
  }

  /**
   * Get configured port
   */
  private getConfiguredPort(): string | null {
    try {
      const envFile = path.join(this.options.projectRoot!, '.env');
      if (fs.existsSync(envFile)) {
        const envContent = fs.readFileSync(envFile, 'utf8');
        const portMatch = envContent.match(/^PORT=(\d+)$/m);
        if (portMatch) {
          return portMatch[1];
        }
      }
    } catch (error) {
      // Ignore errors reading env file
    }
    return null;
  }

  /**
   * Get server process information
   */
  private async getServerProcessInfo(): Promise<any> {
    try {
      if (!this.isServerRunning()) {
        return null;
      }

      const pid = this.getServerPid();

      // On Windows, we can't get detailed process info easily
      if (process.platform === 'win32') {
        return { pid, platform: 'windows' };
      }

      // On Unix-like systems, try to get process info
      try {
        const output = execSync(`ps -p ${pid} -o pid,ppid,pcpu,pmem,etime,cmd --no-headers`, {
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
      } catch (error) {
        // ps command failed
        return { pid };
      }

    } catch (error) {
      return null;
    }
  }

  /**
   * Check if port is listening
   */
  private async isPortListening(port: number): Promise<boolean> {
    try {
      if (process.platform === 'win32') {
        // Use netstat on Windows
        const output = execSync(`netstat -an | findstr :${port}`, { encoding: 'utf8' });
        return output.includes(`:${port}`) && output.includes('LISTENING');
      } else {
        // Use lsof on Unix-like systems
        try {
          execSync(`lsof -i :${port}`, { stdio: 'ignore' });
          return true;
        } catch (error) {
          return false;
        }
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Get system resource usage
   */
  private async getSystemResources(): Promise<any> {
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
    } catch (error) {
      return null;
    }
  }
}