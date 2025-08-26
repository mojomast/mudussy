import { EventSystem } from '../../core/event';
import { IPlayer } from '../persistence/types';
import { BaseDialogueProvider } from './providers';
import { IDialogueResponse, IDialogueTree } from './types';
export declare class CannedBranchingProvider extends BaseDialogueProvider {
    private dialogueTrees;
    private npcToTreeMapping;
    constructor(eventSystem: EventSystem, logger?: any);
    initialize(config?: any): Promise<void>;
    private loadDialogueTrees;
    private loadNPCMappings;
    private validateDialogueTree;
    canHandle(npcId: string): boolean;
    startConversation(player: IPlayer, npcId: string, context?: any): Promise<IDialogueResponse>;
    continueConversation(player: IPlayer, npcId: string, playerInput: string, conversationId: string): Promise<IDialogueResponse>;
    private matchesChoice;
    private createDialogueResponse;
    private resolveVariables;
    private getVariableValue;
    getDialogueTree(treeId: string): IDialogueTree | undefined;
    getAllDialogueTrees(): IDialogueTree[];
    setDialogueTree(tree: IDialogueTree): void;
    mapNPCToTree(npcId: string, treeId: string): void;
}
