// MUD Engine Networking Debug Utilities
// Tests Telnet and WebSocket connections

const net = require('net');
const WebSocket = require('ws');
const http = require('http');
require('dotenv').config();

console.log('🔧 MUD Engine Networking Debug');
console.log('==============================\n');

// Test HTTP endpoint
function testHttpEndpoint(port) {
  console.log('🌐 Testing HTTP endpoint on port ' + port + '...');

  return new Promise((resolve) => {
    const req = http.get('http://localhost:' + port, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log('✅ HTTP Response:', data.trim());
        resolve(true);
      });
    });

    req.on('error', (err) => {
      console.log('❌ HTTP Error:', err.message);
      resolve(false);
    });

    req.setTimeout(5000, () => {
      console.log('❌ HTTP Timeout');
      req.destroy();
      resolve(false);
    });
  });
}

// Test Telnet connection
function testTelnetConnection(host, port) {
  console.log('📡 Testing Telnet connection to ' + host + ':' + port + '...');

  return new Promise((resolve) => {
    const client = net.createConnection(port, host, () => {
      console.log('✅ Telnet connection established');
      client.write('test\r\n');
    });

    client.on('data', (data) => {
      console.log('📨 Telnet Response:', data.toString().trim());
      client.end();
      resolve(true);
    });

    client.on('error', (err) => {
      console.log('❌ Telnet Error:', err.message);
      resolve(false);
    });

    client.setTimeout(5000, () => {
      console.log('❌ Telnet Timeout');
      client.end();
      resolve(false);
    });
  });
}

// Test WebSocket connection
function testWebSocketConnection(port) {
  console.log('🔌 Testing WebSocket connection on port ' + port + '...');

  return new Promise((resolve) => {
    const ws = new WebSocket('ws://localhost:' + port);

    ws.on('open', () => {
      console.log('✅ WebSocket connection established');
      ws.send(JSON.stringify({ type: 'test', data: 'hello' }));
    });

    ws.on('message', (data) => {
      console.log('📨 WebSocket Response:', data.toString());
      ws.close();
      resolve(true);
    });

    ws.on('error', (err) => {
      console.log('❌ WebSocket Error:', err.message);
      resolve(false);
    });

    setTimeout(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
        resolve(true);
      } else {
        resolve(false);
      }
    }, 5000);
  });
}

// Network port scanner
function scanPorts(startPort, endPort) {
  console.log('🔍 Scanning ports ' + startPort + ' to ' + endPort + '...');

  const promises = [];
  for (let port = startPort; port <= endPort; port++) {
    promises.push(new Promise((resolve) => {
      const server = net.createServer();
      server.listen(port, () => {
        server.close(() => resolve({ port, available: true }));
      });
      server.on('error', () => resolve({ port, available: false }));
    }));
  }

  return Promise.all(promises);
}

// Main testing function
async function runNetworkingTests() {
  const httpPort = parseInt(process.env.MUD_WEB_PORT || '3000');
  const networkPort = parseInt(process.env.MUD_NETWORK_PORT || '4000');

  console.log('📊 Testing configuration:');
  console.log('  HTTP Port:', httpPort);
  console.log('  Network Port:', networkPort);
  console.log('');

  // Test HTTP endpoint
  await testHttpEndpoint(httpPort);
  console.log('');

  // Test Telnet connection
  await testTelnetConnection('localhost', networkPort);
  console.log('');

  // Test WebSocket connection
  await testWebSocketConnection(httpPort);
  console.log('');

  // Scan common ports
  const portResults = await scanPorts(3000, 4010);
  console.log('🔍 Port availability:');
  portResults.forEach(result => {
    if (!result.available) {
      console.log('  Port ' + result.port + ': ✅ In use');
    }
  });

  console.log('\n🎮 Networking tests completed!');
  console.log('\n💡 Debugging tips:');
  console.log('  - Use "telnet localhost ' + networkPort + '" for manual Telnet testing');
  console.log('  - Use browser dev tools to test WebSocket connections');
  console.log('  - Check firewall settings if connections are blocked');
}

// Handle command line arguments
if (process.argv[2] === '--help') {
  console.log('Usage: node debug-networking.js [options]');
  console.log('Options:');
  console.log('  --help     Show this help message');
  console.log('  --ports    Scan for available ports only');
  process.exit(0);
} else if (process.argv[2] === '--ports') {
  scanPorts(3000, 4010).then(results => {
    console.log('🔍 Port scan results:');
    results.forEach(result => {
      console.log('  Port ' + result.port + ': ' + (result.available ? '✅ Available' : '❌ In use'));
    });
  });
} else {
  runNetworkingTests().catch(console.error);
}