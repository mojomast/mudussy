const net = require('net');

const client = net.createConnection({ port: 4000, host: 'localhost' }, () => {
  console.log('Connected to MUD server');
});

client.on('data', (data) => {
  console.log('Received:', data.toString());
  // Wait a moment then send 'look' command
  setTimeout(() => {
    console.log('Sending: look');
    client.write('look\n');
  }, 1000);
});

client.on('end', () => {
  console.log('Disconnected from server');
});

client.on('error', (err) => {
  console.error('Connection error:', err);
});

// Send initial commands after connection
setTimeout(() => {
  console.log('Sending: help');
  client.write('help\n');
}, 2000);

// Close connection after a few seconds
setTimeout(() => {
  client.end();
}, 5000);