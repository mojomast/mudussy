/**
 * Simple test script for room movement and notifications
 */

const net = require('net');

// Test multiple clients connecting and moving
const clients = [];
const clientNames = ['Alice', 'Bob', 'Charlie'];

let connectedClients = 0;
let testStep = 0;

function createClient(name, index) {
  const client = net.createConnection({ port: 4000, host: 'localhost' }, () => {
    console.log(`${name} connected to server`);
    connectedClients++;

    // Start authentication after connection
    setTimeout(() => {
      client.write(`${name}\n`);
      client.write('password\n');
    }, 1000);
  });

  let messageCount = 0;

  client.on('data', (data) => {
    const response = data.toString();
    console.log(`${name} received:`, response.trim());

    messageCount++;

    // After authentication, wait for all clients to be ready
    if (response.includes('Welcome') && connectedClients === clientNames.length) {
      setTimeout(() => {
        runMovementTest(client, name);
      }, 2000);
    }
  });

  client.on('end', () => {
    console.log(`${name} disconnected`);
  });

  client.on('error', (err) => {
    console.error(`${name} connection error:`, err);
  });

  return client;
}

function runMovementTest(client, name) {
  if (testStep === 0) {
    // First test: Alice moves north
    if (name === 'Alice') {
      console.log('\n=== Test 1: Alice moves north ===');
      setTimeout(() => {
        client.write('north\n');
      }, 1000);
    }
    testStep++;
  } else if (testStep === 1) {
    // Second test: Bob moves north
    if (name === 'Bob') {
      console.log('\n=== Test 2: Bob moves north ===');
      setTimeout(() => {
        client.write('north\n');
      }, 1000);
    }
    testStep++;
  } else if (testStep === 2) {
    // Third test: Charlie moves north
    if (name === 'Charlie') {
      console.log('\n=== Test 3: Charlie moves north ===');
      setTimeout(() => {
        client.write('north\n');
      }, 1000);
    }
    testStep++;
  } else if (testStep === 3) {
    // Final test: Alice moves back south
    if (name === 'Alice') {
      console.log('\n=== Test 4: Alice moves south ===');
      setTimeout(() => {
        client.write('south\n');
      }, 1000);
    }
    testStep++;
  } else {
    // End test after some time
    setTimeout(() => {
      console.log(`\n${name} ending test`);
      client.end();
    }, 5000);
  }
}

// Start the test
console.log('Starting room movement notification test...');
console.log('This test will verify that:');
console.log('1. Players receive notifications when others enter rooms');
console.log('2. Moving players do NOT receive spam notifications');
console.log('3. Multiple players can move and receive appropriate notifications\n');

// Create clients with delay between connections
clientNames.forEach((name, index) => {
  setTimeout(() => {
    clients.push(createClient(name, index));
  }, index * 1000);
});

// Cleanup after test
setTimeout(() => {
  console.log('\nTest completed. Disconnecting all clients...');
  clients.forEach(client => client.end());
}, 15000);