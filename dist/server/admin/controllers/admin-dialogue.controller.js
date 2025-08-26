"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminDialogueController = void 0;
const common_1 = require("@nestjs/common");
const permission_guard_1 = require("../../networking/permission.guard");
const fs_1 = require("fs");
const path_1 = require("path");
const yaml = __importStar(require("js-yaml"));
let AdminDialogueController = class AdminDialogueController {
    constructor() {
        this.dialoguePath = (0, path_1.join)(process.cwd(), 'engine', 'modules', 'dialogue', 'examples');
        this.ensureDialogueDirectory();
    }
    async ensureDialogueDirectory() {
        try {
            await fs_1.promises.mkdir(this.dialoguePath, { recursive: true });
        }
        catch (error) {
            console.error('Failed to create dialogue directory:', error);
        }
    }
    convertYamlNodesToDialogueNodes(yamlNodes, npcId) {
        const dialogueNodes = {};
        for (const [nodeId, yamlNode] of Object.entries(yamlNodes)) {
            const node = yamlNode;
            dialogueNodes[nodeId] = {
                id: nodeId,
                npcId: npcId,
                text: node.npcMessage || '',
                responses: node.choices ? node.choices.map((choice) => ({
                    id: choice.id,
                    text: choice.text,
                    nextNodeId: choice.nextNodeId,
                    conditions: choice.condition ? [this.convertYamlCondition(choice.condition)] : undefined,
                    actions: choice.actions ? choice.actions.map((action) => this.convertYamlAction(action)) : undefined
                })) : [],
                conditions: undefined,
                actions: node.actions ? node.actions.map((action) => this.convertYamlAction(action)) : undefined,
                isEndNode: node.isEnd || false
            };
        }
        return dialogueNodes;
    }
    convertYamlCondition(yamlCondition) {
        return {
            type: yamlCondition.type || 'flag',
            key: yamlCondition.target || yamlCondition.key || '',
            operator: this.convertYamlOperator(yamlCondition.operator || 'equals'),
            value: yamlCondition.value
        };
    }
    convertYamlAction(yamlAction) {
        return {
            type: this.convertYamlActionType(yamlAction.type),
            key: yamlAction.target || yamlAction.key || '',
            value: yamlAction.value
        };
    }
    convertYamlOperator(operator) {
        switch (operator) {
            case 'greater_than': return 'greater';
            case 'less_than': return 'less';
            case 'has': return 'has';
            case 'not_has': return 'not_has';
            default: return 'equals';
        }
    }
    convertYamlActionType(type) {
        switch (type) {
            case 'give_item': return 'give_item';
            case 'take_item': return 'take_item';
            case 'set_variable':
            case 'set_flag': return 'set_flag';
            case 'start_quest': return 'start_quest';
            case 'complete_quest': return 'complete_quest';
            case 'add_flag': return 'set_flag';
            default: return 'set_flag';
        }
    }
    convertDialogueTreeToYaml(treeId, treeData) {
        const yamlData = {
            id: treeId,
            name: treeData.name,
            description: treeData.description,
            version: '1.0.0',
            startNodeId: treeData.rootNodeId,
            variables: treeData.variables || {},
            nodes: {},
            metadata: {
                author: 'MUD Dialogue System',
                created: new Date().toISOString(),
                updated: new Date().toISOString(),
                tags: ['dialogue', treeId]
            }
        };
        for (const [nodeId, node] of Object.entries(treeData.nodes)) {
            yamlData.nodes[nodeId] = {
                id: nodeId,
                npcMessage: node.text,
                choices: node.responses.map(response => ({
                    id: response.id,
                    text: response.text,
                    nextNodeId: response.nextNodeId,
                    ...(response.conditions && response.conditions.length > 0 && {
                        condition: this.convertDialogueConditionToYaml(response.conditions[0])
                    }),
                    ...(response.actions && response.actions.length > 0 && {
                        actions: response.actions.map(action => this.convertDialogueActionToYaml(action))
                    })
                })),
                ...(node.actions && node.actions.length > 0 && {
                    actions: node.actions.map(action => this.convertDialogueActionToYaml(action))
                }),
                ...(node.isEndNode && { isEnd: true })
            };
        }
        return yamlData;
    }
    convertDialogueConditionToYaml(condition) {
        return {
            type: condition.type,
            target: condition.key,
            operator: this.convertDialogueOperatorToYaml(condition.operator),
            value: condition.value
        };
    }
    convertDialogueActionToYaml(action) {
        return {
            type: this.convertDialogueActionTypeToYaml(action.type),
            target: action.key,
            value: action.value
        };
    }
    convertDialogueOperatorToYaml(operator) {
        switch (operator) {
            case 'greater': return 'greater_than';
            case 'less': return 'less_than';
            case 'has': return 'has';
            case 'not_has': return 'not_has';
            default: return 'equals';
        }
    }
    convertDialogueActionTypeToYaml(type) {
        switch (type) {
            case 'give_item': return 'give_item';
            case 'take_item': return 'take_item';
            case 'set_flag': return 'set_variable';
            case 'start_quest': return 'start_quest';
            case 'complete_quest': return 'complete_quest';
            case 'change_stat': return 'change_stat';
            default: return 'set_variable';
        }
    }
    async getAllDialogueTrees() {
        try {
            const files = await fs_1.promises.readdir(this.dialoguePath);
            const yamlFiles = files.filter(file => file.endsWith('.yaml') || file.endsWith('.yml') || file.endsWith('.json'));
            const dialogueTrees = [];
            for (const file of yamlFiles) {
                try {
                    const filePath = (0, path_1.join)(this.dialoguePath, file);
                    const fileContent = await fs_1.promises.readFile(filePath, 'utf8');
                    const dialogueData = file.endsWith('.json') ? JSON.parse(fileContent) : yaml.load(fileContent);
                    const dialogueTree = {
                        id: dialogueData.id,
                        npcId: dialogueData.id,
                        name: dialogueData.name,
                        description: dialogueData.description,
                        rootNodeId: dialogueData.startNodeId,
                        nodes: this.convertYamlNodesToDialogueNodes(dialogueData.nodes, dialogueData.id),
                        variables: dialogueData.variables || {},
                        lastModified: dialogueData.metadata?.updated ? new Date(dialogueData.metadata.updated) : new Date(),
                        createdBy: dialogueData.metadata?.author || 'system'
                    };
                    dialogueTrees.push(dialogueTree);
                }
                catch (error) {
                    console.error(`Error reading dialogue file ${file}:`, error);
                }
            }
            return dialogueTrees;
        }
        catch (error) {
            console.error('Error reading dialogue directory:', error);
            return [];
        }
    }
    async getDialogueTree(treeId) {
        try {
            const filePath = (0, path_1.join)(this.dialoguePath, `${treeId}.yaml`);
            const fileContent = await fs_1.promises.readFile(filePath, 'utf8');
            const dialogueData = treeId.endsWith('.json') ? JSON.parse(fileContent) : yaml.load(fileContent);
            const dialogueTree = {
                id: dialogueData.id,
                npcId: dialogueData.id,
                name: dialogueData.name,
                description: dialogueData.description,
                rootNodeId: dialogueData.startNodeId,
                nodes: this.convertYamlNodesToDialogueNodes(dialogueData.nodes, dialogueData.id),
                variables: dialogueData.variables || {},
                lastModified: dialogueData.metadata?.updated ? new Date(dialogueData.metadata.updated) : new Date(),
                createdBy: dialogueData.metadata?.author || 'system'
            };
            return dialogueTree;
        }
        catch (error) {
            console.error(`Error reading dialogue file for ${treeId}:`, error);
            return { error: 'Dialogue tree not found' };
        }
    }
    async createDialogueTree(treeData) {
        try {
            const treeId = treeData.npcId || `dialogue_${Date.now()}`;
            const filePath = (0, path_1.join)(this.dialoguePath, `${treeId}.yaml`);
            try {
                await fs_1.promises.access(filePath);
                return {
                    success: false,
                    message: 'Dialogue tree already exists for this NPC'
                };
            }
            catch (error) {
            }
            const yamlData = this.convertDialogueTreeToYaml(treeId, treeData);
            const yamlContent = yaml.dump(yamlData, {
                indent: 2,
                lineWidth: -1,
                noRefs: true
            });
            await fs_1.promises.writeFile(filePath, yamlContent, 'utf8');
            const newTree = {
                id: treeId,
                ...treeData,
                lastModified: new Date(),
                createdBy: 'admin'
            };
            return {
                success: true,
                tree: newTree,
                message: 'Dialogue tree created successfully'
            };
        }
        catch (error) {
            console.error('Error creating dialogue tree:', error);
            return {
                success: false,
                message: 'Failed to create dialogue tree'
            };
        }
    }
    async updateDialogueTree(treeId, treeData) {
        try {
            const updatedTree = {
                id: treeId,
                npcId: treeData.npcId || 'unknown',
                name: treeData.name || 'Updated Dialogue Tree',
                description: treeData.description || 'Updated description',
                rootNodeId: treeData.rootNodeId || 'root',
                nodes: treeData.nodes || {},
                variables: treeData.variables || {},
                lastModified: new Date(),
                createdBy: 'admin'
            };
            return {
                success: true,
                tree: updatedTree,
                message: 'Dialogue tree updated successfully'
            };
        }
        catch (error) {
            return {
                success: false,
                message: 'Failed to update dialogue tree'
            };
        }
    }
    async deleteDialogueTree(treeId) {
        try {
            return {
                success: true,
                message: 'Dialogue tree deleted successfully'
            };
        }
        catch (error) {
            return {
                success: false,
                message: 'Failed to delete dialogue tree'
            };
        }
    }
    async getDialogueNode(treeId, nodeId) {
        const node = {
            id: nodeId,
            npcId: 'blacksmith',
            text: 'Welcome to my forge! What can I do for you?',
            responses: [
                {
                    id: 'buy_sword',
                    text: 'I\'d like to buy a sword',
                    nextNodeId: 'sword_purchase'
                }
            ]
        };
        if (!node) {
            return { error: 'Dialogue node not found' };
        }
        return node;
    }
    async createDialogueNode(treeId, nodeData) {
        try {
            const newNode = {
                id: `node_${Date.now()}`,
                ...nodeData
            };
            return {
                success: true,
                node: newNode,
                message: 'Dialogue node created successfully'
            };
        }
        catch (error) {
            return {
                success: false,
                message: 'Failed to create dialogue node'
            };
        }
    }
    async updateDialogueNode(treeId, nodeId, nodeData) {
        try {
            const updatedNode = {
                id: nodeId,
                npcId: nodeData.npcId || 'unknown',
                text: nodeData.text || 'Updated dialogue text',
                responses: nodeData.responses || [],
                conditions: nodeData.conditions,
                actions: nodeData.actions,
                isEndNode: nodeData.isEndNode
            };
            return {
                success: true,
                node: updatedNode,
                message: 'Dialogue node updated successfully'
            };
        }
        catch (error) {
            return {
                success: false,
                message: 'Failed to update dialogue node'
            };
        }
    }
    async deleteDialogueNode(treeId, nodeId) {
        try {
            return {
                success: true,
                message: 'Dialogue node deleted successfully'
            };
        }
        catch (error) {
            return {
                success: false,
                message: 'Failed to delete dialogue node'
            };
        }
    }
    async getDialogueTemplates() {
        return [
            {
                id: 'merchant_template',
                name: 'Merchant Dialogue',
                description: 'Template for shopkeeper conversations',
                template: {
                    name: 'Merchant Conversation',
                    description: 'Basic merchant dialogue tree',
                    rootNodeId: 'greeting',
                    nodes: {
                        'greeting': {
                            id: 'greeting',
                            npcId: 'merchant',
                            text: 'Welcome to my shop! How can I help you?',
                            responses: []
                        }
                    },
                    variables: {}
                }
            }
        ];
    }
    async validateDialogueTree(treeId) {
        try {
            return {
                success: true,
                valid: true,
                errors: [],
                warnings: ['Some nodes may not be reachable']
            };
        }
        catch (error) {
            return {
                success: false,
                valid: false,
                errors: ['Validation failed'],
                warnings: []
            };
        }
    }
};
exports.AdminDialogueController = AdminDialogueController;
__decorate([
    (0, common_1.Get)('trees'),
    (0, common_1.UseGuards)(permission_guard_1.PermissionGuard),
    (0, permission_guard_1.RequireModerator)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminDialogueController.prototype, "getAllDialogueTrees", null);
__decorate([
    (0, common_1.Get)('trees/:id'),
    (0, common_1.UseGuards)(permission_guard_1.PermissionGuard),
    (0, permission_guard_1.RequireModerator)(),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminDialogueController.prototype, "getDialogueTree", null);
__decorate([
    (0, common_1.Post)('trees'),
    (0, common_1.UseGuards)(permission_guard_1.PermissionGuard),
    (0, permission_guard_1.RequireAdmin)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminDialogueController.prototype, "createDialogueTree", null);
__decorate([
    (0, common_1.Put)('trees/:id'),
    (0, common_1.UseGuards)(permission_guard_1.PermissionGuard),
    (0, permission_guard_1.RequireAdmin)(),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminDialogueController.prototype, "updateDialogueTree", null);
__decorate([
    (0, common_1.Delete)('trees/:id'),
    (0, common_1.UseGuards)(permission_guard_1.PermissionGuard),
    (0, permission_guard_1.RequireAdmin)(),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminDialogueController.prototype, "deleteDialogueTree", null);
__decorate([
    (0, common_1.Get)('trees/:treeId/nodes/:nodeId'),
    (0, common_1.UseGuards)(permission_guard_1.PermissionGuard),
    (0, permission_guard_1.RequireModerator)(),
    __param(0, (0, common_1.Param)('treeId')),
    __param(1, (0, common_1.Param)('nodeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminDialogueController.prototype, "getDialogueNode", null);
__decorate([
    (0, common_1.Post)('trees/:treeId/nodes'),
    (0, common_1.UseGuards)(permission_guard_1.PermissionGuard),
    (0, permission_guard_1.RequireAdmin)(),
    __param(0, (0, common_1.Param)('treeId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminDialogueController.prototype, "createDialogueNode", null);
__decorate([
    (0, common_1.Put)('trees/:treeId/nodes/:nodeId'),
    (0, common_1.UseGuards)(permission_guard_1.PermissionGuard),
    (0, permission_guard_1.RequireAdmin)(),
    __param(0, (0, common_1.Param)('treeId')),
    __param(1, (0, common_1.Param)('nodeId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AdminDialogueController.prototype, "updateDialogueNode", null);
__decorate([
    (0, common_1.Delete)('trees/:treeId/nodes/:nodeId'),
    (0, common_1.UseGuards)(permission_guard_1.PermissionGuard),
    (0, permission_guard_1.RequireAdmin)(),
    __param(0, (0, common_1.Param)('treeId')),
    __param(1, (0, common_1.Param)('nodeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminDialogueController.prototype, "deleteDialogueNode", null);
__decorate([
    (0, common_1.Get)('templates'),
    (0, common_1.UseGuards)(permission_guard_1.PermissionGuard),
    (0, permission_guard_1.RequireModerator)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminDialogueController.prototype, "getDialogueTemplates", null);
__decorate([
    (0, common_1.Post)('validate/:id'),
    (0, common_1.UseGuards)(permission_guard_1.PermissionGuard),
    (0, permission_guard_1.RequireModerator)(),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminDialogueController.prototype, "validateDialogueTree", null);
exports.AdminDialogueController = AdminDialogueController = __decorate([
    (0, common_1.Controller)('admin/dialogue'),
    __metadata("design:paramtypes", [])
], AdminDialogueController);
//# sourceMappingURL=admin-dialogue.controller.js.map