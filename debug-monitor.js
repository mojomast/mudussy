// MUD Engine Monitoring and Debugging Dashboard
// Real-time monitoring, logging, and debugging tools

const net = require('net');
const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
require('dotenv').config();

console.log('📊 MUD Engine Monitoring Dashboard');
console.log('===================================\n');

// Monitoring state
let monitoringState = {
  serverStatus: 'unknown',
  connections: {
    telnet: { active: 0, total: 0 },
    websocket: { active: 0, total: 0 }
  },
  performance: {
    uptime: 0,
    memory: { used: 0, total: 0 },
    cpu: 0
  },
  gameState: {
    players: 0,
    rooms: 0,
    activeGames: 0
  },
  logs: []
};

// Health check function
function performHealthCheck() {
  const telnetPort = parseInt(process.env.MUD_NETWORK_PORT || '4000');
  const webPort = parseInt(process.env.MUD_WEB_PORT || '3000');

  return Promise.all([
    checkPort(telnetPort),
    checkPort(webPort),
    getSystemStats()
  ]);
}

// Check if a port is open
function checkPort(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection(port, 'localhost', () => {
      socket.end();
      resolve({ port, status: 'open' });
    });

    socket.on('error', () => resolve({ port, status: 'closed' }));
    socket.setTimeout(2000, () => {
      socket.destroy();
      resolve({ port, status: 'timeout' });
    });
  });
}

// Get system performance stats
function getSystemStats() {
  const memUsage = process.memoryUsage();
  return {
    uptime: process.uptime(),
    memory: {
      used: Math.round(memUsage.heapUsed / 1024 / 1024),
      total: Math.round(memUsage.heapTotal / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024)
    },
    cpu: process.cpuUsage()
  };
}

// Test Telnet connection
function testTelnetConnection() {
  const port = parseInt(process.env.MUD_NETWORK_PORT || '4000');

  return new Promise((resolve) => {
    const client = net.createConnection(port, 'localhost', () => {
      setTimeout(() => {
        client.write('look\r\n');
        setTimeout(() => {
          client.end();
          resolve(true);
        }, 500);
      }, 500);
    });

    client.on('error', () => resolve(false));
    client.setTimeout(3000, () => {
      client.destroy();
      resolve(false);
    });
  });
}

// Test WebSocket connection
function testWebSocketConnection() {
  const port = parseInt(process.env.MUD_WEB_PORT || '3000');

  return new Promise((resolve) => {
    const ws = new WebSocket('ws://localhost:' + port);

    ws.on('open', () => {
      ws.send(JSON.stringify({ type: 'command', command: 'help' }));
      setTimeout(() => {
        ws.close();
        resolve(true);
      }, 1000);
    });

    ws.on('error', () => resolve(false));
    ws.on('close', () => resolve(true));

    setTimeout(() => {
      ws.close();
      resolve(false);
    }, 3000);
  });
}

// Generate status report
function generateStatusReport() {
  const report = {
    timestamp: new Date().toISOString(),
    status: monitoringState.serverStatus,
    connections: monitoringState.connections,
    performance: monitoringState.performance,
    gameState: monitoringState.gameState,
    checks: {}
  };

  return performHealthCheck().then(([telnetCheck, webCheck, systemStats]) => {
    report.checks = {
      telnetPort: telnetCheck,
      webPort: webCheck,
      systemStats: systemStats
    };

    return Promise.all([
      testTelnetConnection(),
      testWebSocketConnection()
    ]).then(([telnetTest, webSocketTest]) => {
      report.checks.telnetConnection = telnetTest;
      report.checks.webSocketConnection = webSocketTest;
      return report;
    });
  });
}

// Display dashboard
function displayDashboard() {
  console.clear();
  console.log('📊 MUD Engine Monitoring Dashboard');
  console.log('===================================');
  console.log('Time:', new Date().toLocaleString());
  console.log('');

  console.log('🔧 Server Status:', monitoringState.serverStatus);
  console.log('');

  console.log('🌐 Connections:');
  console.log('  Telnet:   ', monitoringState.connections.telnet.active, 'active /', monitoringState.connections.telnet.total, 'total');
  console.log('  WebSocket:', monitoringState.connections.websocket.active, 'active /', monitoringState.connections.websocket.total, 'total');
  console.log('');

  console.log('⚡ Performance:');
  console.log('  Uptime:    ', Math.floor(monitoringState.performance.uptime / 60), 'minutes');
  console.log('  Memory:    ', monitoringState.performance.memory.used, 'MB used /', monitoringState.performance.memory.total, 'MB total');
  console.log('  CPU:       ', monitoringState.performance.cpu ? 'Active' : 'Idle');
  console.log('');

  console.log('🎮 Game State:');
  console.log('  Players:    ', monitoringState.gameState.players);
  console.log('  Rooms:      ', monitoringState.gameState.rooms);
  console.log('  Active Games:', monitoringState.gameState.activeGames);
  console.log('');

  if (monitoringState.logs.length > 0) {
    console.log('📋 Recent Logs:');
    monitoringState.logs.slice(-5).forEach(log => {
      console.log('  [' + log.timestamp + ']', log.level + ':', log.message);
    });
    console.log('');
  }

  console.log('💡 Commands:');
  console.log('  h, help    - Show help');
  console.log('  s, status  - Full status report');
  console.log('  t, telnet  - Test Telnet connection');
  console.log('  w, ws      - Test WebSocket connection');
  console.log('  r, refresh - Refresh dashboard');
  console.log('  q, quit    - Exit monitor');
  console.log('');
}

// Add log entry
function addLog(level, message) {
  monitoringState.logs.push({
    timestamp: new Date().toISOString().substring(11, 19),
    level: level,
    message: message
  });

  // Keep only last 100 logs
  if (monitoringState.logs.length > 100) {
    monitoringState.logs = monitoringState.logs.slice(-100);
  }
}

// Interactive monitoring
function startInteractiveMode() {
  const readline = require('readline');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'monitor> '
  });

  displayDashboard();
  rl.prompt();

  rl.on('line', (line) => {
    const command = line.trim().toLowerCase();

    if (command === 'q' || command === 'quit') {
      console.log('👋 Goodbye!');
      rl.close();
      process.exit(0);
    } else if (command === 'h' || command === 'help') {
      console.log('\n📚 Available Commands:');
      console.log('  h, help    - Show this help');
      console.log('  s, status  - Full status report');
      console.log('  t, telnet  - Test Telnet connection');
      console.log('  w, ws      - Test WebSocket connection');
      console.log('  r, refresh - Refresh dashboard');
      console.log('  q, quit    - Exit monitor');
      console.log('');
      rl.prompt();
    } else if (command === 's' || command === 'status') {
      console.log('\n📋 Generating status report...');
      generateStatusReport().then(report => {
        console.log(JSON.stringify(report, null, 2));
        console.log('');
        rl.prompt();
      }).catch(err => {
        console.log('❌ Error generating report:', err.message);
        rl.prompt();
      });
    } else if (command === 't' || command === 'telnet') {
      console.log('\n📡 Testing Telnet connection...');
      testTelnetConnection().then(success => {
        console.log(success ? '✅ Telnet connection successful' : '❌ Telnet connection failed');
        console.log('');
        rl.prompt();
      });
    } else if (command === 'w' || command === 'ws') {
      console.log('\n🔌 Testing WebSocket connection...');
      testWebSocketConnection().then(success => {
        console.log(success ? '✅ WebSocket connection successful' : '❌ WebSocket connection failed');
        console.log('');
        rl.prompt();
      });
    } else if (command === 'r' || command === 'refresh') {
      displayDashboard();
      rl.prompt();
    } else if (command) {
      console.log('❓ Unknown command:', command);
      console.log('Type "help" for available commands');
      console.log('');
      rl.prompt();
    } else {
      rl.prompt();
    }
  });

  rl.on('close', () => {
    console.log('👋 Monitor closed');
    process.exit(0);
  });
}

// Main monitoring loop
function startMonitoring() {
  addLog('INFO', 'Monitoring dashboard started');

  // Update monitoring state every 5 seconds
  setInterval(() => {
    performHealthCheck().then(([telnetCheck, webCheck, systemStats]) => {
      monitoringState.serverStatus = (telnetCheck.status === 'open' && webCheck.status === 'open') ? 'online' : 'offline';
      monitoringState.performance = systemStats;
      monitoringState.gameState.players = Math.floor(Math.random() * 10); // Mock data
      monitoringState.gameState.rooms = 2;
      monitoringState.gameState.activeGames = 1;
    });
  }, 5000);

  // Auto-refresh dashboard every 10 seconds
  if (process.argv[2] === '--interactive' || process.argv[2] === '-i') {
    startInteractiveMode();
  } else {
    // Simple monitoring mode
    setInterval(() => {
      displayDashboard();
    }, 10000);

    displayDashboard();
  }
}

// Command line interface
if (process.argv[2] === '--help' || process.argv[2] === '-h') {
  console.log('MUD Engine Monitoring Dashboard');
  console.log('Usage: node debug-monitor.js [options]');
  console.log('');
  console.log('Options:');
  console.log('  -i, --interactive    Start interactive mode');
  console.log('  -h, --help          Show this help');
  console.log('  -s, --status        Show status report');
  console.log('');
  console.log('Interactive Commands:');
  console.log('  h, help    - Show help');
  console.log('  s, status  - Full status report');
  console.log('  t, telnet  - Test Telnet connection');
  console.log('  w, ws      - Test WebSocket connection');
  console.log('  r, refresh - Refresh dashboard');
  console.log('  q, quit    - Exit monitor');
  process.exit(0);
} else if (process.argv[2] === '--status' || process.argv[2] === '-s') {
  generateStatusReport().then(report => {
    console.log(JSON.stringify(report, null, 2));
  }).catch(err => {
    console.error('Error generating report:', err.message);
    process.exit(1);
  });
} else {
  startMonitoring();
}