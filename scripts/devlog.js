#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const devlogPath = path.join(__dirname, '..', 'DEVLOG.md');

console.log('📝 MUD Engine Development Log Tool');
console.log('==================================\n');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function addDevlogEntry() {
  try {
    console.log('What type of entry would you like to add?');
    console.log('1. Feature Implementation');
    console.log('2. Bug Fix');
    console.log('3. Refactoring');
    console.log('4. Documentation');
    console.log('5. Testing');
    console.log('6. Configuration');
    console.log('7. Other');

    const typeChoice = await ask('Enter choice (1-7): ');
    const types = {
      '1': '🚀 Feature Implementation',
      '2': '🐛 Bug Fix',
      '3': '🔄 Refactoring',
      '4': '📚 Documentation',
      '5': '🧪 Testing',
      '6': '⚙️ Configuration',
      '7': '📝 Other'
    };

    const entryType = types[typeChoice] || '📝 Entry';

    const title = await ask('Entry title: ');
    const description = await ask('Description: ');
    const status = await ask('Status (completed/in-progress/planned/blocked): ');

    // Get current date
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0];

    // Create entry
    const entry = `

## ${entryType}

**Date**: ${dateStr} ${timeStr}
**Title**: ${title}
**Status**: ${status}

### Description
${description}

### Files Changed
- Add your changed files here

### Notes
- Any additional notes or considerations

### Testing
- [ ] Tests written
- [ ] Tests passing
- [ ] Integration tested
`;

    // Read current devlog
    let currentDevlog = '';
    if (fs.existsSync(devlogPath)) {
      currentDevlog = fs.readFileSync(devlogPath, 'utf8');
    } else {
      console.log('❌ DEVLOG.md not found. Creating new file...');
      currentDevlog = `# Development Log

This document tracks the development progress, decisions, and milestones for the MUD Engine project.

## 📅 Development Timeline
`;
    }

    // Add entry to devlog
    const updatedDevlog = currentDevlog + entry;
    fs.writeFileSync(devlogPath, updatedDevlog);

    console.log('✅ Entry added to DEVLOG.md successfully!');

  } catch (error) {
    console.error('❌ Error adding devlog entry:', error.message);
  } finally {
    rl.close();
  }
}

async function showRecentEntries() {
  try {
    if (!fs.existsSync(devlogPath)) {
      console.log('❌ DEVLOG.md not found.');
      return;
    }

    const content = fs.readFileSync(devlogPath, 'utf8');
    const lines = content.split('\n');

    console.log('\n📋 Recent Devlog Entries:');
    console.log('========================\n');

    let inEntry = false;
    let entryCount = 0;
    const maxEntries = 5;

    for (let i = 0; i < lines.length && entryCount < maxEntries; i++) {
      const line = lines[i];

      if (line.startsWith('## 🚀') ||
          line.startsWith('## 🐛') ||
          line.startsWith('## 🔄') ||
          line.startsWith('## 📚') ||
          line.startsWith('## 🧪') ||
          line.startsWith('## ⚙️') ||
          line.startsWith('## 📝')) {

        if (entryCount > 0) console.log('---');
        inEntry = true;
        entryCount++;
      }

      if (inEntry) {
        console.log(line);
        if (line.trim() === '' && lines[i + 1] &&
            (lines[i + 1].startsWith('## 🚀') ||
             lines[i + 1].startsWith('## 🐛') ||
             lines[i + 1].startsWith('## 🔄') ||
             lines[i + 1].startsWith('## 📚') ||
             lines[i + 1].startsWith('## 🧪') ||
             lines[i + 1].startsWith('## ⚙️') ||
             lines[i + 1].startsWith('## 📝'))) {
          inEntry = false;
        }
      }
    }

  } catch (error) {
    console.error('❌ Error reading devlog:', error.message);
  } finally {
    rl.close();
  }
}

async function showStats() {
  try {
    if (!fs.existsSync(devlogPath)) {
      console.log('❌ DEVLOG.md not found.');
      return;
    }

    const content = fs.readFileSync(devlogPath, 'utf8');
    const lines = content.split('\n');

    const stats = {
      features: 0,
      bugs: 0,
      refactors: 0,
      docs: 0,
      tests: 0,
      config: 0,
      other: 0,
      completed: 0,
      inProgress: 0,
      planned: 0,
      blocked: 0
    };

    for (const line of lines) {
      if (line.includes('## 🚀 Feature Implementation')) stats.features++;
      if (line.includes('## 🐛 Bug Fix')) stats.bugs++;
      if (line.includes('## 🔄 Refactoring')) stats.refactors++;
      if (line.includes('## 📚 Documentation')) stats.docs++;
      if (line.includes('## 🧪 Testing')) stats.tests++;
      if (line.includes('## ⚙️ Configuration')) stats.config++;
      if (line.includes('## 📝 Other')) stats.other++;
      if (line.includes('**Status**: completed')) stats.completed++;
      if (line.includes('**Status**: in-progress')) stats.inProgress++;
      if (line.includes('**Status**: planned')) stats.planned++;
      if (line.includes('**Status**: blocked')) stats.blocked++;
    }

    console.log('\n📊 Development Statistics:');
    console.log('=========================\n');

    console.log('📝 Entry Types:');
    console.log(`  🚀 Features: ${stats.features}`);
    console.log(`  🐛 Bug Fixes: ${stats.bugs}`);
    console.log(`  🔄 Refactors: ${stats.refactors}`);
    console.log(`  📚 Documentation: ${stats.docs}`);
    console.log(`  🧪 Testing: ${stats.tests}`);
    console.log(`  ⚙️ Configuration: ${stats.config}`);
    console.log(`  📝 Other: ${stats.other}`);

    console.log('\n📈 Status Breakdown:');
    console.log(`  ✅ Completed: ${stats.completed}`);
    console.log(`  🔄 In Progress: ${stats.inProgress}`);
    console.log(`  📋 Planned: ${stats.planned}`);
    console.log(`  🚫 Blocked: ${stats.blocked}`);

    const total = stats.completed + stats.inProgress + stats.planned + stats.blocked;
    if (total > 0) {
      const completionRate = ((stats.completed / total) * 100).toFixed(1);
      console.log(`\n📊 Completion Rate: ${completionRate}%`);
    }

  } catch (error) {
    console.error('❌ Error calculating stats:', error.message);
  } finally {
    rl.close();
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  console.log('Available commands:');
  console.log('  add     - Add a new devlog entry');
  console.log('  recent  - Show recent entries');
  console.log('  stats   - Show development statistics');
  console.log('');

  if (command === 'add') {
    await addDevlogEntry();
  } else if (command === 'recent') {
    await showRecentEntries();
  } else if (command === 'stats') {
    await showStats();
  } else {
    const choice = await ask('What would you like to do? (add/recent/stats): ');

    switch (choice.toLowerCase()) {
      case 'add':
        await addDevlogEntry();
        break;
      case 'recent':
        await showRecentEntries();
        break;
      case 'stats':
        await showStats();
        break;
      default:
        console.log('❌ Invalid choice. Exiting...');
        rl.close();
    }
  }
}

main().catch(console.error);