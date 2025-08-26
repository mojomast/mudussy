const net = require('net');

const client = net.createConnection({ port: 4000, host: 'localhost' }, () => {
  console.log('Connected to MUD server');
});

let commandQueue = ['look', 'go south', 'look', 'go north', 'look', 'go east', 'look', 'go west', 'look', 'go north', 'look', 'go up', 'look', 'go down', 'look'];
let commandIndex = 0;

client.on('data', (data) => {
  const response = data.toString();
  console.log('Received:', response);

  // Send next command after receiving response
  if (commandIndex < commandQueue.length) {
    setTimeout(() => {
      const command = commandQueue[commandIndex];
      console.log(`Sending: ${command}`);
      client.write(command + '\n');
      commandIndex++;
    }, 500);
  } else {
    // All commands sent, close connection
    setTimeout(() => {
      client.end();
    }, 1000);
  }
});

client.on('end', () => {
  console.log('Disconnected from server');
});

client.on('error', (err) => {
  console.error('Connection error:', err);
});

// Send first command after connection
setTimeout(() => {
  if (commandQueue.length > 0) {
    const command = commandQueue[commandIndex];
    console.log(`Sending: ${command}`);
    client.write(command + '\n');
    commandIndex++;
  }
}, 1000);