"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NPCTemplateIntegrationDemo = void 0;
exports.quickStartNPCTemplates = quickStartNPCTemplates;
const npc_manager_1 = require("./npc-manager");
const npc_templates_1 = __importDefault(require("./npc-templates"));
class NPCTemplateIntegrationDemo {
    constructor(eventSystem) {
        this.eventSystem = eventSystem;
        this.npcManager = new npc_manager_1.NPCManager(eventSystem);
    }
    async initialize() {
        console.log('=== NPC Template Integration Demo ===');
        this.registerCustomTemplates();
        this.loadSampleNPCs();
        this.demonstrateTemplateCreation();
        this.displayStatistics();
        console.log('=== Demo Complete ===');
    }
    registerCustomTemplates() {
        console.log('\n--- Registering Custom Templates ---');
        const tavernKeeper = npc_templates_1.default.createVendorTemplate('tavern_keeper_template', 'a gruff tavern keeper', 'A burly man with a stained apron polishes mugs behind the bar. He has a no-nonsense attitude but serves good ale.', ['ale', 'wine', 'bread', 'cheese', 'room_key'], {
            'ale': 3,
            'wine': 8,
            'bread': 2,
            'cheese': 4,
            'room_key': 15
        }, ['beverages', 'food', 'lodging']);
        this.npcManager.registerTemplate('tavern_keeper', tavernKeeper);
        const banditTemplate = npc_templates_1.default.createCommonerTemplate('bandit_template', 'a menacing bandit', 'A rough-looking individual with a scar across their cheek eyes you suspiciously. They seem ready for trouble.', 'bandit', 'Outskirts');
        banditTemplate.behaviors = ['hostile', 'greedy', 'suspicious'];
        banditTemplate.stats = {
            level: 6,
            health: 90,
            strength: 12,
            defense: 8,
            agility: 14
        };
        banditTemplate.flags = ['bandit', 'human', 'hostile', 'criminal'];
        this.npcManager.registerTemplate('bandit', banditTemplate);
        console.log('Registered 2 custom templates');
    }
    loadSampleNPCs() {
        console.log('\n--- Loading Sample NPCs ---');
        this.npcManager.loadSampleNPCs();
        console.log('Sample NPCs loaded successfully');
    }
    demonstrateTemplateCreation() {
        console.log('\n--- Template-based NPC Creation ---');
        const spawnConfigs = [
            {
                templateId: 'tavern_keeper',
                spawnRoomId: 'eldoria:tavern',
                sectorId: 'town-sector'
            },
            {
                templateId: 'bandit',
                spawnRoomId: 'eldoria:forest_road',
                sectorId: 'forest-sector',
                customizations: {
                    name: 'Scarface the Bandit',
                    stats: {
                        level: 8,
                        health: 110,
                        strength: 15,
                        defense: 10,
                        agility: 16
                    }
                }
            }
        ];
        const spawnedNPCs = this.npcManager.spawnNPCsFromTemplates(spawnConfigs);
        console.log(`Created and spawned ${spawnedNPCs.length} NPCs from templates:`);
        spawnedNPCs.forEach(npc => {
            console.log(`  - ${npc.name} (ID: ${npc.id}) in room ${npc.roomId}`);
        });
    }
    displayStatistics() {
        console.log('\n--- System Statistics ---');
        const baseStats = this.npcManager.getStatistics();
        const templateStats = this.npcManager.getTemplateStatistics();
        console.log('NPC Manager Stats:', baseStats);
        console.log('Template System Stats:', templateStats);
        console.log('\nRegistered Templates:');
        const templates = this.npcManager.getAllTemplates();
        templates.forEach(template => {
            console.log(`  - ${template.name} (${template.metadata.type})`);
        });
    }
    async demonstrateDynamicCreation() {
        console.log('\n--- Dynamic NPC Creation Demo ---');
        const roomId = 'eldoria:market_square';
        const sectorId = 'town-sector';
        const dynamicVendors = [
            {
                templateId: 'tavern_keeper',
                spawnRoomId: roomId,
                sectorId,
                customizations: {
                    id: 'fruit_seller_dynamic',
                    name: 'a fruit seller',
                    description: 'A merchant displays fresh fruits and vegetables on a colorful cart.',
                    inventory: ['apple', 'orange', 'banana', 'carrot'],
                    prices: { apple: 1, orange: 2, banana: 1, carrot: 1 }
                }
            }
        ];
        const spawned = this.npcManager.spawnNPCsFromTemplates(dynamicVendors);
        console.log(`Dynamically created ${spawned.length} NPCs for market event`);
        setTimeout(() => {
            spawned.forEach(npc => {
                this.npcManager.despawnNPC(npc.id);
            });
            console.log('Dynamically created NPCs have been despawned');
        }, 30000);
    }
    getNPCManager() {
        return this.npcManager;
    }
    cleanup() {
        this.npcManager.cleanup();
        console.log('NPC Template Integration Demo cleaned up');
    }
}
exports.NPCTemplateIntegrationDemo = NPCTemplateIntegrationDemo;
async function quickStartNPCTemplates(eventSystem) {
    const demo = new NPCTemplateIntegrationDemo(eventSystem);
    await demo.initialize();
    return demo.getNPCManager();
}
exports.default = NPCTemplateIntegrationDemo;
//# sourceMappingURL=npc-template-integration.js.map