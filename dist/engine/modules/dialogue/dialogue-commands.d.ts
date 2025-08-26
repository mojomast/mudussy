import { IDialogueManager } from './types';
import { EngineService } from '../../core/engine.service';
export declare class DialogueCommandHandlers {
    private dialogueManager;
    private engine?;
    constructor(dialogueManager: IDialogueManager, engine?: EngineService);
    private getEngine;
    private findNPCInRoom;
    private getPlayer;
    talk(sessionId: string, args: string[], raw: string): Promise<string | void>;
    converse(sessionId: string, args: string[], raw: string): Promise<string | void>;
    respond(sessionId: string, args: string[], raw: string): Promise<string | void>;
    dialogue(sessionId: string, args: string[], raw: string): Promise<string | void>;
    endDialogue(sessionId: string, args: string[], raw: string): Promise<string | void>;
    getDialogueStatus(sessionId: string, args: string[], raw: string): Promise<string | void>;
    private formatDialogueResponse;
    getCommandHandlers(): {
        talk: {
            command: string;
            aliases: string[];
            description: string;
            usage: string;
            handler: any;
        };
        converse: {
            command: string;
            aliases: string[];
            description: string;
            usage: string;
            handler: any;
        };
        respond: {
            command: string;
            aliases: string[];
            description: string;
            usage: string;
            handler: any;
        };
        dialogue: {
            command: string;
            aliases: string[];
            description: string;
            usage: string;
            handler: any;
        };
    };
}
