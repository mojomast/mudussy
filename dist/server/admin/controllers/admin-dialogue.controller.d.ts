export interface DialogueNode {
    id: string;
    npcId: string;
    text: string;
    responses: DialogueResponse[];
    conditions?: DialogueCondition[];
    actions?: DialogueAction[];
    isEndNode?: boolean;
}
export interface DialogueResponse {
    id: string;
    text: string;
    nextNodeId?: string;
    conditions?: DialogueCondition[];
    actions?: DialogueAction[];
}
export interface DialogueCondition {
    type: 'quest' | 'item' | 'stat' | 'flag';
    key: string;
    operator: 'equals' | 'greater' | 'less' | 'has' | 'not_has';
    value: any;
}
export interface DialogueAction {
    type: 'give_item' | 'take_item' | 'set_flag' | 'start_quest' | 'complete_quest' | 'change_stat';
    key: string;
    value?: any;
}
export interface DialogueTree {
    id: string;
    npcId: string;
    name: string;
    description: string;
    rootNodeId: string;
    nodes: {
        [nodeId: string]: DialogueNode;
    };
    variables: {
        [key: string]: any;
    };
    lastModified: Date;
    createdBy: string;
}
export declare class AdminDialogueController {
    private dialoguePath;
    constructor();
    private ensureDialogueDirectory;
    private convertYamlNodesToDialogueNodes;
    private convertYamlCondition;
    private convertYamlAction;
    private convertYamlOperator;
    private convertYamlActionType;
    private convertDialogueTreeToYaml;
    private convertDialogueConditionToYaml;
    private convertDialogueActionToYaml;
    private convertDialogueOperatorToYaml;
    private convertDialogueActionTypeToYaml;
    getAllDialogueTrees(): Promise<DialogueTree[]>;
    getDialogueTree(treeId: string): Promise<DialogueTree | {
        error: string;
    }>;
    createDialogueTree(treeData: Omit<DialogueTree, 'id' | 'lastModified' | 'createdBy'>): Promise<{
        success: boolean;
        tree?: DialogueTree;
        message: string;
    }>;
    updateDialogueTree(treeId: string, treeData: Partial<DialogueTree>): Promise<{
        success: boolean;
        tree?: DialogueTree;
        message: string;
    }>;
    deleteDialogueTree(treeId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getDialogueNode(treeId: string, nodeId: string): Promise<DialogueNode | {
        error: string;
    }>;
    createDialogueNode(treeId: string, nodeData: Omit<DialogueNode, 'id'>): Promise<{
        success: boolean;
        node?: DialogueNode;
        message: string;
    }>;
    updateDialogueNode(treeId: string, nodeId: string, nodeData: Partial<DialogueNode>): Promise<{
        success: boolean;
        node?: DialogueNode;
        message: string;
    }>;
    deleteDialogueNode(treeId: string, nodeId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getDialogueTemplates(): Promise<{
        id: string;
        name: string;
        description: string;
        template: Partial<DialogueTree>;
    }[]>;
    validateDialogueTree(treeId: string): Promise<{
        success: boolean;
        valid: boolean;
        errors: string[];
        warnings: string[];
    }>;
}
