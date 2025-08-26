import { EventSystem } from '../../core/event';
import { SessionManager } from './session';
import { PlayerManager } from '../persistence/player-manager';
import { WorldManager } from '../world/world-manager';
export interface ICommandHandler {
    command: string;
    aliases?: string[];
    description: string;
    usage?: string;
    handler: (sessionId: string, args: string[], raw: string) => Promise<string | void>;
    requiresAuth?: boolean;
    adminOnly?: boolean;
}
export declare class CommandParser {
    private handlers;
    private eventSystem;
    private sessionManager?;
    private playerManager?;
    private logger;
    private worldManager?;
    private movementCommandNames;
    private hiddenCommandNames;
    constructor(eventSystem: EventSystem, sessionManager?: SessionManager, playerManager?: PlayerManager, logger?: any, worldManager?: WorldManager);
    registerCommand(handler: ICommandHandler): void;
    unregisterCommand(command: string): boolean;
    parseCommand(sessionId: string, input: string): Promise<string | void>;
    private parseInput;
    private parseArguments;
    getRegisteredCommands(): string[];
    getCommandHandler(command: string): ICommandHandler | undefined;
    getCommandHelp(command: string): string | null;
    getAllCommandsHelp(): string;
    private registerDefaultCommands;
}
