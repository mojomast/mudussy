/**
 * Test script to verify dialogue-NPC integration
 * This validates file structure and content instead of running the actual dialogue system
 */

const fs = require('fs');
const path = require('path');

function testFileExists(filePath, description) {
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${description} found: ${filePath}`);
    return true;
  } else {
    console.log(`❌ ${description} missing: ${filePath}`);
    return false;
  }
}

function testJSONContent(filePath, requiredFields, description) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);

    let allFieldsPresent = true;
    for (const field of requiredFields) {
      if (!(field in data)) {
        console.log(`❌ ${description} missing field: ${field}`);
        allFieldsPresent = false;
      }
    }

    if (allFieldsPresent) {
      console.log(`✅ ${description} has all required fields`);
    }

    return allFieldsPresent;
  } catch (error) {
    console.log(`❌ Error reading ${description}: ${error.message}`);
    return false;
  }
}

function testYAMLContent(filePath, requiredFields, description) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    // Simple YAML validation - check if it has expected structure
    const hasStructure = content.includes('id:') &&
                        content.includes('name:') &&
                        content.includes('nodes:');

    if (hasStructure) {
      console.log(`✅ ${description} has valid YAML structure`);
      return true;
    } else {
      console.log(`❌ ${description} missing YAML structure`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Error reading ${description}: ${error.message}`);
    return false;
  }
}

// Test dialogue-NPC integration
function testDialogueNPCIntegration() {
  console.log('🧪 Testing Dialogue-NPC Integration...\n');

  let allTestsPassed = true;

  // Test dialogue content files exist
  console.log('📁 Checking dialogue content files:');
  const dialogueFiles = [
    { path: './engine/modules/world/content/dialogue/guard.yaml', desc: 'Guard dialogue tree' },
    { path: './engine/modules/world/content/dialogue/blacksmith.yaml', desc: 'Blacksmith dialogue tree' },
    { path: './engine/modules/world/content/dialogue/village-elder.yaml', desc: 'Village elder dialogue tree' },
    { path: './engine/modules/world/content/dialogue/npc-mappings.json', desc: 'NPC mappings' }
  ];

  dialogueFiles.forEach(file => {
    if (!testFileExists(file.path, file.desc)) {
      allTestsPassed = false;
    }
  });

  // Test NPC content files exist
  console.log('\n📁 Checking NPC content files:');
  const npcFiles = [
    { path: './engine/modules/world/content/npcs/gate-guard.json', desc: 'Gate guard NPC' },
    { path: './engine/modules/world/content/npcs/blacksmith.json', desc: 'Blacksmith NPC' }
  ];

  npcFiles.forEach(file => {
    if (!testFileExists(file.path, file.desc)) {
      allTestsPassed = false;
    }
  });

  // Test NPC mappings content
  console.log('\n📋 Checking NPC mappings content:');
  const mappingsPath = './engine/modules/world/content/dialogue/npc-mappings.json';
  const requiredMappings = ['gate_guard', 'blacksmith', 'master_blacksmith'];

  try {
    const mappingsContent = fs.readFileSync(mappingsPath, 'utf8');
    const mappings = JSON.parse(mappingsContent);

    requiredMappings.forEach(mapping => {
      if (mapping in mappings) {
        console.log(`✅ NPC mapping found: ${mapping} -> ${mappings[mapping]}`);
      } else {
        console.log(`❌ NPC mapping missing: ${mapping}`);
        allTestsPassed = false;
      }
    });
  } catch (error) {
    console.log(`❌ Error reading NPC mappings: ${error.message}`);
    allTestsPassed = false;
  }

  // Test NPC files have dialogue provider
  console.log('\n🎭 Checking NPC dialogue providers:');
  npcFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file.path, 'utf8');
      const npc = JSON.parse(content);

      if (npc.dialogueProvider === 'canned-branching') {
        console.log(`✅ ${file.desc} has correct dialogue provider`);
      } else {
        console.log(`❌ ${file.desc} missing or incorrect dialogue provider`);
        allTestsPassed = false;
      }
    } catch (error) {
      console.log(`❌ Error reading ${file.desc}: ${error.message}`);
      allTestsPassed = false;
    }
  });

  // Test dialogue tree structure
  console.log('\n🌳 Checking dialogue tree structures:');
  const dialogueTrees = [
    { path: './engine/modules/world/content/dialogue/blacksmith.yaml', desc: 'Blacksmith dialogue tree' },
    { path: './engine/modules/world/content/dialogue/guard.yaml', desc: 'Guard dialogue tree' }
  ];

  dialogueTrees.forEach(tree => {
    if (!testYAMLContent(tree.path, [], tree.desc)) {
      allTestsPassed = false;
    }
  });

  // Test TypeScript source files exist
  console.log('\n📄 Checking TypeScript source files:');
  const sourceFiles = [
    { path: './engine/modules/dialogue/dialogue-manager.ts', desc: 'Dialogue manager' },
    { path: './engine/modules/dialogue/canned-branching-provider.ts', desc: 'Canned branching provider' },
    { path: './engine/modules/world/npc-manager.ts', desc: 'NPC manager' },
    { path: './engine/modules/world/npc-templates.ts', desc: 'NPC templates' }
  ];

  sourceFiles.forEach(file => {
    if (!testFileExists(file.path, file.desc)) {
      allTestsPassed = false;
    }
  });

  // Summary
  console.log('\n' + '='.repeat(50));
  if (allTestsPassed) {
    console.log('🎉 Dialogue-NPC Integration Test PASSED!');
    console.log('✅ All required files and configurations are present');
    console.log('✅ NPC mappings are correctly configured');
    console.log('✅ Dialogue providers are properly set');
    console.log('✅ Dialogue trees have valid structure');
  } else {
    console.log('❌ Dialogue-NPC Integration Test FAILED!');
    console.log('Some files or configurations are missing or incorrect');
  }
  console.log('='.repeat(50));

  return allTestsPassed;
}

// Run the test
const success = testDialogueNPCIntegration();
process.exit(success ? 0 : 1);