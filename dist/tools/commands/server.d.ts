import { Command } from 'commander';
interface ServerCommandOptions {
    verbose?: boolean;
    quiet?: boolean;
    config?: string;
    projectRoot?: string;
}
export declare class ServerCommands {
    private options;
    private serverPidFile;
    private logsDir;
    constructor(options: ServerCommandOptions);
    getStartCommand(): Command;
    getStopCommand(): Command;
    getStatusCommand(): Command;
    getRestartCommand(): Command;
    getLogsCommand(): Command;
    private startServer;
    private stopServer;
    private showStatus;
    private restartServer;
    private showLogs;
    private isServerRunning;
    private getServerPid;
    private getConfiguredPort;
    private getServerProcessInfo;
    private isPortListening;
    private getSystemResources;
}
export {};
