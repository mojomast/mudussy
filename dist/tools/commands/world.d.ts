import { Command } from 'commander';
interface WorldCommandOptions {
    verbose?: boolean;
    quiet?: boolean;
    config?: string;
    projectRoot?: string;
}
export declare class WorldCommands {
    private options;
    constructor(options: WorldCommandOptions);
    getCreateCommand(): Command;
    getValidateCommand(): Command;
    getEditCommand(): Command;
    getImportCommand(): Command;
    getExportCommand(): Command;
    getStatsCommand(): Command;
    private getEditRoomCommand;
    private getEditItemCommand;
    private getEditNPCCommand;
    private getEditExitCommand;
    private createWorld;
    private validateWorld;
    private editRoom;
    private editItem;
    private editNPC;
    private editExit;
    private importWorld;
    private exportWorld;
    private showStats;
}
export {};
