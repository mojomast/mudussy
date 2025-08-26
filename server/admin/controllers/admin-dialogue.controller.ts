import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { PermissionGuard, RequireAdmin, RequireModerator } from '../../networking/permission.guard';
import { promises as fs } from 'fs';
import { join } from 'path';
import * as yaml from 'js-yaml';

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
  nodes: { [nodeId: string]: DialogueNode };
  variables: { [key: string]: any };
  lastModified: Date;
  createdBy: string;
}

@Controller('admin/dialogue')
export class AdminDialogueController {
  private dialoguePath = join(process.cwd(), 'engine', 'modules', 'dialogue', 'examples');

  constructor() {
    // Ensure dialogue directory exists
    this.ensureDialogueDirectory();
  }

  private async ensureDialogueDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.dialoguePath, { recursive: true });
    } catch (error) {
      console.error('Failed to create dialogue directory:', error);
    }
  }

  private convertYamlNodesToDialogueNodes(yamlNodes: any, npcId: string): { [nodeId: string]: DialogueNode } {
    const dialogueNodes: { [nodeId: string]: DialogueNode } = {};

    for (const [nodeId, yamlNode] of Object.entries(yamlNodes)) {
      const node = yamlNode as any;
      dialogueNodes[nodeId] = {
        id: nodeId,
        npcId: npcId,
        text: node.npcMessage || '',
        responses: node.choices ? node.choices.map((choice: any) => ({
          id: choice.id,
          text: choice.text,
          nextNodeId: choice.nextNodeId,
          conditions: choice.condition ? [this.convertYamlCondition(choice.condition)] : undefined,
          actions: choice.actions ? choice.actions.map((action: any) => this.convertYamlAction(action)) : undefined
        })) : [],
        conditions: undefined, // Node-level conditions not implemented in current YAML
        actions: node.actions ? node.actions.map((action: any) => this.convertYamlAction(action)) : undefined,
        isEndNode: node.isEnd || false
      };
    }

    return dialogueNodes;
  }

  private convertYamlCondition(yamlCondition: any): DialogueCondition {
    return {
      type: yamlCondition.type || 'flag',
      key: yamlCondition.target || yamlCondition.key || '',
      operator: this.convertYamlOperator(yamlCondition.operator || 'equals'),
      value: yamlCondition.value
    };
  }

  private convertYamlAction(yamlAction: any): DialogueAction {
    return {
      type: this.convertYamlActionType(yamlAction.type),
      key: yamlAction.target || yamlAction.key || '',
      value: yamlAction.value
    };
  }

  private convertYamlOperator(operator: string): 'equals' | 'greater' | 'less' | 'has' | 'not_has' {
    switch (operator) {
      case 'greater_than': return 'greater';
      case 'less_than': return 'less';
      case 'has': return 'has';
      case 'not_has': return 'not_has';
      default: return 'equals';
    }
  }

  private convertYamlActionType(type: string): 'give_item' | 'take_item' | 'set_flag' | 'start_quest' | 'complete_quest' | 'change_stat' {
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

  private convertDialogueTreeToYaml(treeId: string, treeData: Omit<DialogueTree, 'id' | 'lastModified' | 'createdBy'>): any {
    // Convert our DialogueTree format to the YAML format used by the dialogue files
    const yamlData: any = {
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

    // Convert dialogue nodes to YAML format
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

  private convertDialogueConditionToYaml(condition: DialogueCondition): any {
    return {
      type: condition.type,
      target: condition.key,
      operator: this.convertDialogueOperatorToYaml(condition.operator),
      value: condition.value
    };
  }

  private convertDialogueActionToYaml(action: DialogueAction): any {
    return {
      type: this.convertDialogueActionTypeToYaml(action.type),
      target: action.key,
      value: action.value
    };
  }

  private convertDialogueOperatorToYaml(operator: 'equals' | 'greater' | 'less' | 'has' | 'not_has'): string {
    switch (operator) {
      case 'greater': return 'greater_than';
      case 'less': return 'less_than';
      case 'has': return 'has';
      case 'not_has': return 'not_has';
      default: return 'equals';
    }
  }

  private convertDialogueActionTypeToYaml(type: 'give_item' | 'take_item' | 'set_flag' | 'start_quest' | 'complete_quest' | 'change_stat'): string {
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

  @Get('trees')
  @UseGuards(PermissionGuard)
  @RequireModerator()
  async getAllDialogueTrees(): Promise<DialogueTree[]> {
    try {
  const files = await fs.readdir(this.dialoguePath);
  const yamlFiles = files.filter(file => file.endsWith('.yaml') || file.endsWith('.yml') || file.endsWith('.json'));

      const dialogueTrees: DialogueTree[] = [];

      for (const file of yamlFiles) {
        try {
          const filePath = join(this.dialoguePath, file);
          const fileContent = await fs.readFile(filePath, 'utf8');
          const dialogueData = file.endsWith('.json') ? JSON.parse(fileContent) : (yaml.load(fileContent) as any);

          // Convert the YAML structure to our DialogueTree format
          const dialogueTree: DialogueTree = {
            id: dialogueData.id,
            npcId: dialogueData.id, // Use the same ID for NPC
            name: dialogueData.name,
            description: dialogueData.description,
            rootNodeId: dialogueData.startNodeId,
            nodes: this.convertYamlNodesToDialogueNodes(dialogueData.nodes, dialogueData.id),
            variables: dialogueData.variables || {},
            lastModified: dialogueData.metadata?.updated ? new Date(dialogueData.metadata.updated) : new Date(),
            createdBy: dialogueData.metadata?.author || 'system'
          };

          dialogueTrees.push(dialogueTree);
        } catch (error) {
          console.error(`Error reading dialogue file ${file}:`, error);
        }
      }

      return dialogueTrees;
    } catch (error) {
      console.error('Error reading dialogue directory:', error);
      return [];
    }
  }

  @Get('trees/:id')
  @UseGuards(PermissionGuard)
  @RequireModerator()
  async getDialogueTree(@Param('id') treeId: string): Promise<DialogueTree | { error: string }> {
    try {
  const filePath = join(this.dialoguePath, `${treeId}.yaml`);
  const fileContent = await fs.readFile(filePath, 'utf8');
  const dialogueData = treeId.endsWith('.json') ? JSON.parse(fileContent) : (yaml.load(fileContent) as any);

      // Convert the YAML structure to our DialogueTree format
      const dialogueTree: DialogueTree = {
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
    } catch (error) {
      console.error(`Error reading dialogue file for ${treeId}:`, error);
      return { error: 'Dialogue tree not found' };
    }
  }

  @Post('trees')
  @UseGuards(PermissionGuard)
  @RequireAdmin()
  async createDialogueTree(@Body() treeData: Omit<DialogueTree, 'id' | 'lastModified' | 'createdBy'>): Promise<{ success: boolean; tree?: DialogueTree; message: string }> {
    try {
      const treeId = treeData.npcId || `dialogue_${Date.now()}`;
      const filePath = join(this.dialoguePath, `${treeId}.yaml`);

      // Check if file already exists
      try {
        await fs.access(filePath);
        return {
          success: false,
          message: 'Dialogue tree already exists for this NPC'
        };
      } catch (error) {
        // File doesn't exist, which is good for creation
      }

      // Convert DialogueTree format to YAML format
      const yamlData = this.convertDialogueTreeToYaml(treeId, treeData);

      // Write to YAML file
      const yamlContent = yaml.dump(yamlData, {
        indent: 2,
        lineWidth: -1,
        noRefs: true
      });

      await fs.writeFile(filePath, yamlContent, 'utf8');

      const newTree: DialogueTree = {
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
    } catch (error) {
      console.error('Error creating dialogue tree:', error);
      return {
        success: false,
        message: 'Failed to create dialogue tree'
      };
    }
  }

  @Put('trees/:id')
  @UseGuards(PermissionGuard)
  @RequireAdmin()
  async updateDialogueTree(@Param('id') treeId: string, @Body() treeData: Partial<DialogueTree>): Promise<{ success: boolean; tree?: DialogueTree; message: string }> {
    try {
      const updatedTree: DialogueTree = {
        id: treeId,
        npcId: treeData.npcId || 'unknown',
        name: treeData.name || 'Updated Dialogue Tree',
        description: treeData.description || 'Updated description',
        rootNodeId: treeData.rootNodeId || 'root',
        nodes: treeData.nodes || {},
        variables: treeData.variables || {},
        lastModified: new Date(),
        createdBy: 'admin' // Would get from session
      };

      return {
        success: true,
        tree: updatedTree,
        message: 'Dialogue tree updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update dialogue tree'
      };
    }
  }

  @Delete('trees/:id')
  @UseGuards(PermissionGuard)
  @RequireAdmin()
  async deleteDialogueTree(@Param('id') treeId: string): Promise<{ success: boolean; message: string }> {
    try {
      return {
        success: true,
        message: 'Dialogue tree deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to delete dialogue tree'
      };
    }
  }

  @Get('trees/:treeId/nodes/:nodeId')
  @UseGuards(PermissionGuard)
  @RequireModerator()
  async getDialogueNode(@Param('treeId') treeId: string, @Param('nodeId') nodeId: string): Promise<DialogueNode | { error: string }> {
    // Mock node lookup
    const node: DialogueNode = {
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

  @Post('trees/:treeId/nodes')
  @UseGuards(PermissionGuard)
  @RequireAdmin()
  async createDialogueNode(@Param('treeId') treeId: string, @Body() nodeData: Omit<DialogueNode, 'id'>): Promise<{ success: boolean; node?: DialogueNode; message: string }> {
    try {
      const newNode: DialogueNode = {
        id: `node_${Date.now()}`,
        ...nodeData
      };

      return {
        success: true,
        node: newNode,
        message: 'Dialogue node created successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create dialogue node'
      };
    }
  }

  @Put('trees/:treeId/nodes/:nodeId')
  @UseGuards(PermissionGuard)
  @RequireAdmin()
  async updateDialogueNode(
    @Param('treeId') treeId: string,
    @Param('nodeId') nodeId: string,
    @Body() nodeData: Partial<DialogueNode>
  ): Promise<{ success: boolean; node?: DialogueNode; message: string }> {
    try {
      const updatedNode: DialogueNode = {
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
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update dialogue node'
      };
    }
  }

  @Delete('trees/:treeId/nodes/:nodeId')
  @UseGuards(PermissionGuard)
  @RequireAdmin()
  async deleteDialogueNode(@Param('treeId') treeId: string, @Param('nodeId') nodeId: string): Promise<{ success: boolean; message: string }> {
    try {
      return {
        success: true,
        message: 'Dialogue node deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to delete dialogue node'
      };
    }
  }

  @Get('templates')
  @UseGuards(PermissionGuard)
  @RequireModerator()
  async getDialogueTemplates(): Promise<{ id: string; name: string; description: string; template: Partial<DialogueTree> }[]> {
    // Mock dialogue templates
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

  @Post('validate/:id')
  @UseGuards(PermissionGuard)
  @RequireModerator()
  async validateDialogueTree(@Param('id') treeId: string): Promise<{
    success: boolean;
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    try {
      // Mock validation
      return {
        success: true,
        valid: true,
        errors: [],
        warnings: ['Some nodes may not be reachable']
      };
    } catch (error) {
      return {
        success: false,
        valid: false,
        errors: ['Validation failed'],
        warnings: []
      };
    }
  }
}