import { EventSystem } from '../../core/event';
import { NPCManager } from './npc-manager';
export declare class NPCTemplateIntegrationDemo {
    private npcManager;
    private eventSystem;
    constructor(eventSystem: EventSystem);
    initialize(): Promise<void>;
    private registerCustomTemplates;
    private loadSampleNPCs;
    private demonstrateTemplateCreation;
    private displayStatistics;
    demonstrateDynamicCreation(): Promise<void>;
    getNPCManager(): NPCManager;
    cleanup(): void;
}
export declare function quickStartNPCTemplates(eventSystem: EventSystem): Promise<NPCManager>;
export default NPCTemplateIntegrationDemo;
