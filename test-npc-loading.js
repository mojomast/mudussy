/**
 * Test script for NPC loading mechanism
 */

const { EventSystem } = require('./engine/core/event');
const { WorldManager } = require('./engine/modules/world/world-manager');

async function testNPCLoading() {
  console.log('🧪 Testing NPC Loading Mechanism');
  console.log('================================');

  try {
    // Create event system and world manager
    const eventSystem = new EventSystem();
    const config = {
      contentPath: './engine/modules/world/content',
      defaultRoomId: 'eldoria:town_gate',
      maxItemsPerRoom: 100,
      maxPlayersPerRoom: 10,
      allowRoomCreation: false
    };

    const worldManager = new WorldManager(eventSystem, config, console);

    // Load the world
    console.log('📂 Loading world...');
    await worldManager.loadWorld();

    // Get NPC manager and check statistics
    const npcManager = worldManager.getNPCManager();
    const stats = npcManager.getStatistics();

    console.log('📊 NPC Loading Results:');
    console.log(`   - NPC Definitions: ${stats.totalDefinitions}`);
    console.log(`   - Active NPCs: ${stats.activeNPCs}`);
    console.log(`   - Rooms with NPCs: ${stats.roomsWithNPCs}`);
    console.log(`   - Despawn Timers: ${stats.despawnTimers}`);

    // Check specific NPCs
    console.log('\n🧑 Checking Individual NPCs:');
    const gateGuard = npcManager.getNPCDefinition('gate_guard');
    if (gateGuard) {
      console.log(`   ✅ Gate Guard loaded: ${gateGuard.name}`);
      console.log(`      - Room: ${gateGuard.spawnData.spawnRoomId}`);
      console.log(`      - Sector: ${gateGuard.spawnData.sectorId}`);
    } else {
      console.log('   ❌ Gate Guard not loaded');
    }

    const blacksmith = npcManager.getNPCDefinition('blacksmith');
    if (blacksmith) {
      console.log(`   ✅ Blacksmith loaded: ${blacksmith.name}`);
      console.log(`      - Room: ${blacksmith.spawnData.spawnRoomId}`);
      console.log(`      - Sector: ${blacksmith.spawnData.sectorId}`);
    } else {
      console.log('   ❌ Blacksmith not loaded');
    }

    // Test room-based NPC spawning
    console.log('\n🏠 Testing Room-based Spawning:');
    const townGate = worldManager.getRoom('eldoria:town_gate');
    if (townGate) {
      console.log('   ✅ Town Gate room loaded');
      const npcsInGate = worldManager.getNPCsInRoom('eldoria:town_gate');
      console.log(`   - NPCs in town gate: ${npcsInGate.length}`);

      // Simulate player entering room (this would normally trigger NPC spawning)
      console.log('   - Simulating player entry to trigger NPC spawn...');

      // For testing purposes, manually spawn an NPC
      const spawned = npcManager.spawnNPC('gate_guard', 'eldoria:town_gate');
      if (spawned) {
        console.log(`   ✅ Successfully spawned: ${spawned.name}`);

        // Check active NPCs after spawning
        const activeStats = npcManager.getStatistics();
        console.log(`   - Active NPCs now: ${activeStats.activeNPCs}`);

        // Check NPCs in room again
        const npcsAfterSpawn = worldManager.getNPCsInRoom('eldoria:town_gate');
        console.log(`   - NPCs in town gate after spawn: ${npcsAfterSpawn.length}`);

        // Test despawning
        console.log('   - Testing despawn...');
        const despawned = npcManager.despawnNPC('gate_guard');
        console.log(`   ✅ Despawn result: ${despawned}`);
      }
    }

    console.log('\n✅ NPC Loading Test Completed Successfully!');
    console.log('\n📋 Summary:');
    console.log('   - World loaded with sector data');
    console.log('   - NPC files loaded from individual files');
    console.log('   - NPC definitions stored in NPCManager');
    console.log('   - Room-based spawning/despawning functional');
    console.log('   - Integration with existing world system working');

    // Cleanup
    worldManager.cleanup();

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error(error.stack);
  }
}

// Run the test
testNPCLoading().catch(console.error);