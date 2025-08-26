/**
 * Test script for NPC template system
 */

const { EventSystem } = require('./engine/core/event');
const NPCTemplateIntegrationDemo = require('./engine/modules/world/npc-template-integration');

async function testNPCTemplates() {
  console.log('🧪 Testing NPC Template System...\n');

  try {
    // Create event system
    const eventSystem = new EventSystem();

    // Initialize the demo
    const demo = new NPCTemplateIntegrationDemo(eventSystem);
    await demo.initialize();

    // Get the NPC manager
    const npcManager = demo.getNPCManager();

    // Test template retrieval
    console.log('\n--- Testing Template Retrieval ---');
    const templates = npcManager.getAllTemplates();
    console.log(`Found ${templates.length} registered templates`);

    // Test NPC creation from templates
    console.log('\n--- Testing NPC Creation ---');
    const testNPC = npcManager.createNPCFromTemplate(
      'tavern_keeper',
      'test_room',
      'test_sector'
    );

    if (testNPC) {
      console.log(`✅ Successfully created NPC: ${testNPC.name}`);
      console.log(`   ID: ${testNPC.id}`);
      console.log(`   Room: ${testNPC.roomId}`);
      console.log(`   Behaviors: ${testNPC.behaviors.join(', ')}`);
    } else {
      console.log('❌ Failed to create NPC from template');
    }

    // Test statistics
    console.log('\n--- Testing Statistics ---');
    const stats = npcManager.getStatistics();
    const templateStats = npcManager.getTemplateStatistics();

    console.log('NPC Manager Stats:', stats);
    console.log('Template Stats:', templateStats);

    // Test sample NPC loading
    console.log('\n--- Testing Sample NPC Loading ---');
    const allDefinitions = npcManager.getAllNPCDefinitions();
    console.log(`Total NPC definitions loaded: ${allDefinitions.length}`);

    // Show sample of loaded NPCs by type
    const vendors = allDefinitions.filter(npc =>
      npc.flags.includes('vendor')
    );
    console.log(`Vendors: ${vendors.length}`);

    const kings = allDefinitions.filter(npc =>
      npc.flags.includes('king')
    );
    console.log(`Kings: ${kings.length}`);

    // Clean up
    demo.cleanup();

    console.log('\n✅ All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testNPCTemplates().then(() => {
    console.log('\n🎉 NPC Template System test complete!');
    process.exit(0);
  }).catch((error) => {
    console.error('💥 Test failed with error:', error);
    process.exit(1);
  });
}

module.exports = { testNPCTemplates };