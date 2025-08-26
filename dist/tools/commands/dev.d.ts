import { Command } from 'commander';
interface DevCommandOptions {
    verbose?: boolean;
    quiet?: boolean;
    config?: string;
    projectRoot?: string;
}
export declare class DevCommands {
    private options;
    constructor(options: DevCommandOptions);
    getSeedCommand(): Command;
    getProfileCommand(): Command;
    getLogCommand(): Command;
    getBackupCommand(): Command;
    getRestoreCommand(): Command;
    private getLogAnalyzeCommand;
    private getLogTailCommand;
    private getLogSearchCommand;
    private seedContent;
    private seedWorldContent;
    private seedUserContent;
    private seedDialogueContent;
    private profileApplication;
    private profileMemory;
    private profileCPU;
    private profilePerformance;
    private analyzeLogs;
    private tailLogs;
    private searchLogs;
    private createBackup;
    private restoreBackup;
    private copyDirectory;
    private getDirectoryContents;
}
export {};
