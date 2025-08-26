import { IPlayer } from '../persistence/types';
export interface IDialogueProvider {
    id: string;
    name: string;
    type: 'canned' | 'ai' | 'custom';
    initialize(config?: any): Promise<void>;
    startConversation(player: IPlayer, npcId: string, context?: any): Promise<IDialogueResponse>;
    continueConversation(player: IPlayer, npcId: string, playerInput: string, conversationId: string): Promise<IDialogueResponse>;
    endConversation(player: IPlayer, npcId: string, conversationId: string): Promise<void>;
    getConversationState(conversationId: string): IConversationState | undefined;
    canHandle(npcId: string): boolean;
}
export interface IDialogueResponse {
    conversationId: string;
    message: string;
    choices?: IDialogueChoice[];
    isComplete: boolean;
    state: IConversationState;
    variables: Record<string, any>;
    actions?: IDialogueAction[];
}
export interface IDialogueChoice {
    id: string;
    text: string;
    condition?: IDialogueCondition;
    actions?: IDialogueAction[];
}
export interface IDialogueAction {
    type: 'set_variable' | 'give_item' | 'take_item' | 'add_flag' | 'remove_flag' | 'start_quest' | 'complete_quest' | 'custom';
    target?: string;
    value?: any;
    condition?: IDialogueCondition;
}
export interface IDialogueCondition {
    type: 'variable' | 'flag' | 'item' | 'quest' | 'stat' | 'skill' | 'level' | 'time' | 'random' | 'custom';
    operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'has' | 'not_has' | 'in' | 'not_in';
    target: string;
    value?: any;
    negate?: boolean;
}
export interface IDialogueNode {
    id: string;
    npcMessage: string;
    choices?: IDialogueChoice[];
    conditions?: IDialogueCondition[];
    actions?: IDialogueAction[];
    isEnd?: boolean;
    nextNodeId?: string;
    variables?: Record<string, any>;
}
export interface IDialogueTree {
    id: string;
    name: string;
    description?: string;
    version: string;
    startNodeId: string;
    nodes: Record<string, IDialogueNode>;
    variables: Record<string, any>;
    metadata: {
        author?: string;
        created: Date;
        updated: Date;
        tags?: string[];
    };
}
export interface IConversationState {
    conversationId: string;
    playerId: string;
    npcId: string;
    providerId: string;
    currentNodeId?: string;
    variables: Record<string, any>;
    flags: string[];
    started: Date;
    lastActivity: Date;
    isActive: boolean;
}
export interface IVariableContext {
    player: {
        stats: Record<string, any>;
        inventory: string[];
        flags: string[];
        quests: Record<string, any>;
        skills: Record<string, number>;
        level: number;
        currency: Record<string, number>;
        factionRelations: Record<string, number>;
    };
    npc: {
        id: string;
        name: string;
        flags: string[];
        stats: Record<string, any>;
    };
    conversation: {
        variables: Record<string, any>;
        turnCount: number;
        started: Date;
        lastActivity: Date;
    };
    world: {
        time: Date;
        globalFlags: Record<string, any>;
        factionRelations: Record<string, Record<string, number>>;
    };
}
export declare enum DialogueEventTypes {
    CONVERSATION_STARTED = "dialogue.conversation.started",
    CONVERSATION_CONTINUED = "dialogue.conversation.continued",
    CONVERSATION_ENDED = "dialogue.conversation.ended",
    DIALOGUE_NODE_REACHED = "dialogue.node.reached",
    DIALOGUE_CHOICE_MADE = "dialogue.choice.made",
    DIALOGUE_ACTION_EXECUTED = "dialogue.action.executed",
    DIALOGUE_VARIABLE_CHANGED = "dialogue.variable.changed",
    PROVIDER_SWITCHED = "dialogue.provider.switched"
}
export interface IDialogueConfig {
    enablePersistence: boolean;
    maxConversationsPerPlayer: number;
    conversationTimeoutMinutes: number;
    autoSaveIntervalSeconds: number;
    defaultProvider: string;
    providers: Record<string, IDialogueProvider>;
    contentPath: string;
}
export interface IDialogueManager {
    initialize(config: IDialogueConfig): Promise<void>;
    registerProvider(provider: IDialogueProvider): void;
    unregisterProvider(providerId: string): boolean;
    getProvider(providerId: string): IDialogueProvider | undefined;
    startConversation(player: IPlayer, npcId: string, providerId?: string): Promise<IDialogueResponse>;
    continueConversation(player: IPlayer, npcId: string, input: string, conversationId: string): Promise<IDialogueResponse>;
    endConversation(player: IPlayer, npcId: string, conversationId: string): Promise<void>;
    getConversationState(conversationId: string): IConversationState | undefined;
    getPlayerConversations(playerId: string): IConversationState[];
    evaluateCondition(condition: IDialogueCondition, context: IVariableContext): boolean;
    executeAction(action: IDialogueAction, context: IVariableContext): Promise<void>;
    resolveVariables(text: string, context: IVariableContext): string;
}
