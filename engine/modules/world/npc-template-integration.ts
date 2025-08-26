/**
 * NPC Template Integration Demo - shows how to use the template system
 */

import { EventSystem } from '../../core/event';
import { NPCManager } from './npc-manager';
import NPCTemplateFactory from './npc-templates';
import SampleNPCs from './sample-npcs';

/**
 * Demonstration of the NPC template system integration
 */
export class NPCTemplateIntegrationDemo {

  private npcManager: NPCManager;
  private eventSystem: EventSystem;

  constructor(eventSystem: EventSystem) {
    this.eventSystem = eventSystem;
    this.npcManager = new NPCManager(eventSystem);
  }

  /**
   * Initialize the NPC template system with sample data
   */
  async initialize(): Promise<void> {
    console.log('=== NPC Template Integration Demo ===');

    // Register some custom templates
    this.registerCustomTemplates();

    // Load sample NPCs from templates
    this.loadSampleNPCs();

    // Demonstrate template-based NPC creation
    this.demonstrateTemplateCreation();

    // Show statistics
    this.displayStatistics();

    console.log('=== Demo Complete ===');
  }

  /**
   * Register custom NPC templates
   */
  private registerCustomTemplates(): void {
    console.log('\n--- Registering Custom Templates ---');

    // Create a custom tavern keeper template
    const tavernKeeper = NPCTemplateFactory.createVendorTemplate(
      'tavern_keeper_template',
      'a gruff tavern keeper',
      'A burly man with a stained apron polishes mugs behind the bar. He has a no-nonsense attitude but serves good ale.',
      ['ale', 'wine', 'bread', 'cheese', 'room_key'],
      {
        'ale': 3,
        'wine': 8,
        'bread': 2,
        'cheese': 4,
        'room_key': 15
      },
      ['beverages', 'food', 'lodging']
    );

    this.npcManager.registerTemplate('tavern_keeper', tavernKeeper);

    // Create a custom bandit template
    const banditTemplate = NPCTemplateFactory.createCommonerTemplate(
      'bandit_template',
      'a menacing bandit',
      'A rough-looking individual with a scar across their cheek eyes you suspiciously. They seem ready for trouble.',
      'bandit',
      'Outskirts'
    );

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

  /**
   * Load sample NPCs from the template system
   */
  private loadSampleNPCs(): void {
    console.log('\n--- Loading Sample NPCs ---');

    // Load all sample NPCs
    this.npcManager.loadSampleNPCs();

    // Alternatively, load specific types:
    // this.npcManager.loadSampleNPCsByType('vendor');
    // this.npcManager.loadSampleNPCsByType('king');

    console.log('Sample NPCs loaded successfully');
  }

  /**
   * Demonstrate creating NPCs from templates
   */
  private demonstrateTemplateCreation(): void {
    console.log('\n--- Template-based NPC Creation ---');

    // Create NPCs using the template system
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

  /**
   * Display system statistics
   */
  private displayStatistics(): void {
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

  /**
   * Demonstrate dynamic NPC creation during runtime
   */
  async demonstrateDynamicCreation(): Promise<void> {
    console.log('\n--- Dynamic NPC Creation Demo ---');

    // Simulate player entering a room that should spawn dynamic NPCs
    const roomId = 'eldoria:market_square';
    const sectorId = 'town-sector';

    // Create some dynamic vendors for a busy market day
    const dynamicVendors = [
      {
        templateId: 'tavern_keeper', // Reusing tavern keeper as a fruit seller
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

    // Simulate despawning after some time
    setTimeout(() => {
      spawned.forEach(npc => {
        this.npcManager.despawnNPC(npc.id);
      });
      console.log('Dynamically created NPCs have been despawned');
    }, 30000); // Despawn after 30 seconds
  }

  /**
   * Get the NPC manager instance for external use
   */
  getNPCManager(): NPCManager {
    return this.npcManager;
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    this.npcManager.cleanup();
    console.log('NPC Template Integration Demo cleaned up');
  }
}

/**
 * Quick start function for the template system
 */
export async function quickStartNPCTemplates(eventSystem: EventSystem): Promise<NPCManager> {
  const demo = new NPCTemplateIntegrationDemo(eventSystem);
  await demo.initialize();

  // Return the configured NPC manager for use in the main application
  return demo.getNPCManager();
}

export default NPCTemplateIntegrationDemo;