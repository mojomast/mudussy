/**
 * Test script for the complete persistence system
 * Run with: node test-persistence.js
 */

const { EngineService } = require('./engine/core/engine.service');
const { Player } = require('./engine/modules/persistence/player');
const { v4 as uuidv4 } = require('uuid');

async function testPersistenceSystem() {
  console.log('🧪 Testing MUD Engine Persistence System...\n');

  try {
    // Create engine configuration with persistence enabled
    const config = {
      maxEntities: 1000,
      tickInterval: 1000,
      enablePlugins: false,
      saveInterval: 30000, // 30 seconds
      logLevel: 'info',
      enableNetworking: false, // Disable networking for this test
      enableWorld: true,
      worldPath: './engine/modules/world/content',
      defaultRoomId: 'tavern',
      maxItemsPerRoom: 50,
      maxPlayersPerRoom: 10,
      allowRoomCreation: false,
      // Persistence configuration
      enablePersistence: true,
      savePath: './test-saves',
      backupPath: './test-backups',
      maxBackups: 5,
      validateOnLoad: true,
      compressionEnabled: false,
      migrationEnabled: true
    };

    console.log('⚙️  Creating engine with persistence...');
    const engine = new EngineService();
    engine.updateConfig(config);

    // Initialize the engine
    console.log('🚀 Initializing engine...');
    await engine.initializeEngine();

    // Create a test player
    console.log('👤 Creating test player...');
    const player = new Player('TestPlayer', uuidv4(), 'tavern');
    player.addItem('sword', 1);
    player.addItem('potion', 3);
    player.setStat('level', 5);
    player.addCurrency('gold', 100);
    player.addFlag('test_flag');
    player.updatePlayTime(3600); // 1 hour

    console.log('📊 Player created:', {
      name: player.username,
      level: player.getStat('level'),
      items: player.inventory.length,
      gold: player.getCurrency('gold'),
      flags: player.flags,
      playTime: player.playTime
    });

    // Test manual save
    console.log('\n💾 Testing manual save...');
    const saveId = await engine.saveFullGame('Integration test save');
    console.log('✅ Manual save completed:', saveId);

    // Test listing saves
    console.log('\n📋 Testing save listing...');
    const saves = await engine.listSaves();
    console.log('Available saves:', saves.length);
    saves.forEach(save => {
      console.log(`  - ${save.id} (${save.type}) - ${save.timestamp.toISOString()}`);
    });

    // Create another player to test multiple player handling
    console.log('\n👥 Creating second test player...');
    const player2 = new Player('TestPlayer2', uuidv4(), 'tavern');
    player2.addItem('bow', 1);
    player2.setStat('level', 3);
    player2.addCurrency('gold', 50);

    // Save again
    console.log('💾 Saving with second player...');
    const saveId2 = await engine.saveFullGame('Second integration test save');
    console.log('✅ Second save completed:', saveId2);

    // Test loading the first save
    console.log('\n📂 Testing save loading...');
    await engine.loadFullGame(saveId);
    console.log('✅ Save loaded successfully');

    // Test backup creation
    console.log('\n📦 Testing backup creation...');
    const backupId = await engine.getSaveManager()?.backupSave(saveId, 'Test backup');
    if (backupId) {
      console.log('✅ Backup created:', backupId);
    }

    // Test cleanup
    console.log('\n🧹 Testing backup cleanup...');
    const cleaned = await engine.cleanupOldBackups();
    console.log('✅ Cleaned up', cleaned, 'old backups');

    // Get status
    console.log('\n📊 Getting system status...');
    const status = engine.getStatus();
    console.log('Persistence status:', JSON.stringify(status.persistence, null, 2));

    // Test deleting a save
    console.log('\n🗑️  Testing save deletion...');
    const deleted = await engine.deleteSave(saveId2);
    console.log('Save deletion result:', deleted ? 'Success' : 'Failed');

    console.log('\n✅ All persistence tests completed successfully!');
    console.log('🎉 The save/load system is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testPersistenceSystem()
    .then(() => {
      console.log('\n🎯 Test script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test script failed:', error);
      process.exit(1);
    });
}

module.exports = { testPersistenceSystem };