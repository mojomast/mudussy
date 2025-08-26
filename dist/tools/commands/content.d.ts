import { Command } from 'commander';
interface ContentCommandOptions {
    verbose?: boolean;
    quiet?: boolean;
    config?: string;
    projectRoot?: string;
}
export declare class ContentCommands {
    private options;
    private templatesDir;
    private contentDir;
    constructor(options: ContentCommandOptions);
    getNewCommand(): Command;
    getValidateCommand(): Command;
    getTestCommand(): Command;
    getMigrateCommand(): Command;
    getPackageCommand(): Command;
    private getNewModuleCommand;
    private getNewDialogueCommand;
    private getNewRoomCommand;
    private getNewItemCommand;
    private getNewNPCCommand;
    private getNewPluginCommand;
    private createModule;
    private createDialogue;
    private createRoom;
    private createItem;
    private createNPC;
    private createPlugin;
    private validateContent;
    private testContent;
    private migrateContent;
    private packageContent;
    private capitalize;
}
export {};
