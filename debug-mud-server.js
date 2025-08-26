// Simplified MUD Engine Server for Debugging
// Supports both Telnet and WebSocket connections

const net = require('net');
const WebSocket = require('ws');
const http = require('http');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Simple world management system for debug server
class SimpleWorldManager {
  constructor(contentPath) {
    this.contentPath = contentPath;
    this.rooms = new Map();
    this.items = new Map();
    this.npcs = new Map();
    this.areas = new Map();
    this.players = new Map();
  }

  async loadWorld() {
    const fs = require('fs');
    const path = require('path');

    try {
      console.log(`Loading world from: ${this.contentPath}`);

      // Load main world file
      const worldFile = path.join(this.contentPath, 'world.json');
      if (!fs.existsSync(worldFile)) {
        throw new Error(`World file not found: ${worldFile}`);
      }

      const worldContent = fs.readFileSync(worldFile, 'utf8');
      const worldData = JSON.parse(worldContent);

      // Load sector files if specified
      if (worldData.sectors && worldData.sectors.length > 0) {
        console.log(`Loading ${worldData.sectors.length} sectors...`);
        for (const sectorPath of worldData.sectors) {
          const fullSectorPath = path.join(this.contentPath, sectorPath);
          if (fs.existsSync(fullSectorPath)) {
            const sectorContent = fs.readFileSync(fullSectorPath, 'utf8');
            const sectorData = JSON.parse(sectorContent);
            this.mergeSectorData(sectorData);
            console.log(`Loaded sector: ${sectorPath}`);
          } else {
            console.warn(`Sector file not found: ${fullSectorPath}`);
          }
        }
      }

      console.log(`World loaded: ${this.rooms.size} rooms, ${this.items.size} items, ${this.npcs.size} NPCs`);
    } catch (error) {
      console.error('Failed to load world:', error);
      throw error;
    }
  }

  mergeSectorData(sectorData) {
    if (sectorData.areas) {
      sectorData.areas.forEach(area => this.areas.set(area.id, area));
    }
    if (sectorData.rooms) {
      sectorData.rooms.forEach(room => this.rooms.set(room.id, room));
    }
    if (sectorData.items) {
      sectorData.items.forEach(item => this.items.set(item.id, item));
    }
    if (sectorData.npcs) {
      sectorData.npcs.forEach(npc => this.npcs.set(npc.id, npc));
    }
  }

  getRoom(roomId) {
    return this.rooms.get(roomId);
  }

  getAllRooms() {
    return Array.from(this.rooms.values());
  }

  movePlayer(playerId, fromRoomId, toRoomId) {
    const fromRoom = this.getRoom(fromRoomId);
    const toRoom = this.getRoom(toRoomId);

    if (!toRoom) return false;

    // Remove from old room if specified
    if (fromRoom && fromRoom.players) {
      fromRoom.players = fromRoom.players.filter(id => id !== playerId);
    }

    // Add to new room
    if (!toRoom.players) toRoom.players = [];
    if (!toRoom.players.includes(playerId)) {
      toRoom.players.push(playerId);
    }

    return true;
  }

  findExit(roomId, directionOrVerb) {
    const room = this.getRoom(roomId);
    if (!room || !room.exits) return null;

    return room.exits.find(exit =>
      exit.direction === directionOrVerb ||
      (exit.verbs && exit.verbs.includes(directionOrVerb))
    ) || null;
  }

  getRoomDescription(roomId) {
    const room = this.getRoom(roomId);
    if (!room) return 'Room not found.';

    let description = `${room.name}\n\n${room.description}\n\n`;

    // Add exits
    if (room.exits && room.exits.length > 0) {
      const exitList = room.exits.map(exit => exit.direction).join(', ');
      description += `Exits: ${exitList}\n`;
    } else {
      description += 'There are no obvious exits.\n';
    }

    return description;
  }

  getPlayersInRoom(roomId) {
    const room = this.getRoom(roomId);
    return room && room.players ? room.players : [];
  }

  getStatistics() {
    return {
      rooms: this.rooms.size,
      items: this.items.size,
      npcs: this.npcs.size,
      areas: this.areas.size
    };
  }
}

console.log('🎮 MUD Engine Debug Server');
console.log('===========================\n');

// Initialize world management system
const worldConfig = {
  defaultRoomId: 'eldoria:tavern',
  contentPath: path.join(__dirname, 'engine/modules/world/content')
};

const worldManager = new SimpleWorldManager(worldConfig.contentPath);

// Load world data
async function initializeWorld() {
  try {
    await worldManager.loadWorld();
    console.log('✅ World loaded successfully');
    const stats = worldManager.getStatistics();
    console.log(`📊 World stats: ${stats.rooms} rooms, ${stats.items} items, ${stats.npcs} NPCs`);
  } catch (error) {
    console.error('❌ Failed to load world:', error);
    process.exit(1);
  }
}

// Game state (now simplified - just players)
const gameState = {
   players: new Map()
};

// Telnet server
function createTelnetServer(port) {
  console.log('📡 Starting Telnet server on port ' + port);

  const server = net.createServer((socket) => {
    const clientId = socket.remoteAddress + ':' + socket.remotePort;
    console.log('📡 Telnet client connected:', clientId);

    // Initialize player
    const defaultRoomId = worldConfig.defaultRoomId;
    gameState.players.set(clientId, {
      id: clientId,
      name: 'Anonymous',
      room: defaultRoomId,
      type: 'telnet'
    });

    // Add player to room
    worldManager.movePlayer(clientId, '', defaultRoomId);

    // Get room info
    const room = worldManager.getRoom(defaultRoomId);
    const roomDescription = worldManager.getRoomDescription(defaultRoomId);

    // Send welcome message
    socket.write('\r\nWelcome to MUD Engine Debug Server!\r\n');
    socket.write(roomDescription + '\r\n');
    socket.write('\r\n> ');

    socket.on('data', (data) => {
      const command = data.toString().trim().toLowerCase();
      console.log('📨 Telnet command:', clientId, command);

      if (command === 'quit' || command === 'exit') {
        socket.write('Goodbye!\r\n');
        socket.end();
        return;
      }

      if (command === 'look' || command === 'l') {
        const player = gameState.players.get(clientId);
        const roomDescription = worldManager.getRoomDescription(player.room);
        socket.write('\r\n' + roomDescription + '\r\n');

        const playersInRoom = worldManager.getPlayersInRoom(player.room);
        const otherPlayers = playersInRoom.filter(id => id !== clientId);
        if (otherPlayers.length > 0) {
          socket.write('Players here: ' + otherPlayers.length + '\r\n');
        }
      } else if (command.startsWith('go ') || command.startsWith('move ')) {
        const direction = command.split(' ')[1];
        const player = gameState.players.get(clientId);
        const currentRoomId = player.room;

        // Find exit using world manager
        const exit = worldManager.findExit(currentRoomId, direction);

        if (exit) {
          const newRoomId = exit.toRoomId;

          // Move player using world manager
          const moveSuccess = worldManager.movePlayer(clientId, currentRoomId, newRoomId);

          if (moveSuccess) {
            player.room = newRoomId;
            const roomDescription = worldManager.getRoomDescription(newRoomId);

            socket.write('\r\nYou move ' + direction + '.\r\n');
            socket.write(roomDescription + '\r\n');
          } else {
            socket.write('\r\nYou cannot go that way.\r\n');
          }
        } else {
          socket.write('\r\nYou cannot go that way.\r\n');
        }
      } else if (command === 'help' || command === '?') {
        socket.write('\r\nAvailable commands:\r\n');
        socket.write('  look (l)     - Look around\r\n');
        socket.write('  go <dir>     - Move in a direction\r\n');
        socket.write('  help (?)     - Show this help\r\n');
        socket.write('  quit (exit)  - Leave the game\r\n');
      } else if (command) {
        socket.write('\r\nUnknown command: ' + command + '\r\n');
        socket.write('Type "help" for available commands.\r\n');
      }

      socket.write('\r\n> ');
    });

    socket.on('end', () => {
      console.log('📡 Telnet client disconnected:', clientId);
      // Clean up player
      const player = gameState.players.get(clientId);
      if (player) {
        gameState.rooms[player.room].players.delete(clientId);
        gameState.players.delete(clientId);
      }
    });

    socket.on('error', (err) => {
      console.log('📡 Telnet client error:', clientId, err.message);
    });
  });

  server.listen(port, () => {
    console.log('✅ Telnet server listening on port ' + port);
  });

  return server;
}

// WebSocket server
function createWebSocketServer(port) {
   console.log('🔌 Starting WebSocket server on port ' + port);

   // Create HTTP server for serving web client and WebSocket upgrade
   const httpServer = http.createServer((req, res) => {
     const clientsPath = path.join(__dirname, 'clients');

     // Handle root path - serve index.html
     if (req.url === '/' || req.url === '/index.html') {
       const filePath = path.join(clientsPath, 'index.html');
       fs.readFile(filePath, (err, data) => {
         if (err) {
           res.writeHead(404, { 'Content-Type': 'text/plain' });
           res.end('File not found');
           return;
         }
         res.writeHead(200, { 'Content-Type': 'text/html' });
         res.end(data);
       });
       return;
     }

     // Handle client.js
     if (req.url === '/client.js') {
       const filePath = path.join(clientsPath, 'client.js');
       fs.readFile(filePath, (err, data) => {
         if (err) {
           res.writeHead(404, { 'Content-Type': 'text/plain' });
           res.end('File not found');
           return;
         }
         res.writeHead(200, { 'Content-Type': 'application/javascript' });
         res.end(data);
       });
       return;
     }

     // Handle other static files (CSS, images, etc.)
     if (req.url.match(/\.(css|png|jpg|jpeg|gif|ico|svg)$/)) {
       const filePath = path.join(clientsPath, req.url);
       fs.readFile(filePath, (err, data) => {
         if (err) {
           res.writeHead(404, { 'Content-Type': 'text/plain' });
           res.end('File not found');
           return;
         }
         const ext = path.extname(req.url).toLowerCase();
         const mimeTypes = {
           '.css': 'text/css',
           '.png': 'image/png',
           '.jpg': 'image/jpeg',
           '.jpeg': 'image/jpeg',
           '.gif': 'image/gif',
           '.ico': 'image/x-icon',
           '.svg': 'image/svg+xml'
         };
         res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
         res.end(data);
       });
       return;
     }

     // Default response for other paths
     res.writeHead(200, { 'Content-Type': 'text/plain' });
     res.end('MUD Engine WebSocket Server - Port: ' + port + '\nUse WebSocket connection at ws://localhost:' + port);
   });

  const wss = new WebSocket.Server({ server: httpServer });

  wss.on('connection', (ws, req) => {
    const clientId = req.socket.remoteAddress + ':' + req.socket.remotePort;
    console.log('🔌 WebSocket client connected:', clientId);

    // Initialize player
    const defaultRoomId = worldConfig.defaultRoomId;
    gameState.players.set(clientId, {
      id: clientId,
      name: 'Anonymous',
      room: defaultRoomId,
      type: 'websocket'
    });

    // Add player to room
    worldManager.movePlayer(clientId, '', defaultRoomId);

    // Get room info
    const room = worldManager.getRoom(defaultRoomId);

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'welcome',
      message: 'Welcome to MUD Engine Debug Server!',
      room: room
    }));

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log('📨 WebSocket message:', clientId, message);

        if (message.type === 'command') {
          const command = message.command.trim().toLowerCase();
          const player = gameState.players.get(clientId);

          if (command === 'quit' || command === 'exit') {
            ws.send(JSON.stringify({ type: 'goodbye', message: 'Goodbye!' }));
            ws.close();
            return;
          }

          if (command === 'look' || command === 'l') {
            const room = worldManager.getRoom(player.room);
            const playersInRoom = worldManager.getPlayersInRoom(player.room);
            ws.send(JSON.stringify({
              type: 'room_info',
              room: room,
              playerCount: playersInRoom.length - 1
            }));
          } else if (command.startsWith('go ') || command.startsWith('move ')) {
            const direction = command.split(' ')[1];
            const currentRoomId = player.room;

            // Find exit using world manager
            const exit = worldManager.findExit(currentRoomId, direction);

            if (exit) {
              const newRoomId = exit.toRoomId;

              // Move player using world manager
              const moveSuccess = worldManager.movePlayer(clientId, currentRoomId, newRoomId);

              if (moveSuccess) {
                player.room = newRoomId;
                const room = worldManager.getRoom(newRoomId);

                ws.send(JSON.stringify({
                  type: 'movement',
                  direction: direction,
                  room: room
                }));
              } else {
                ws.send(JSON.stringify({
                  type: 'error',
                  message: 'You cannot go that way.'
                }));
              }
            } else {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'You cannot go that way.'
              }));
            }
          } else if (command === 'help' || command === '?') {
            ws.send(JSON.stringify({
              type: 'help',
              commands: [
                { cmd: 'look (l)', desc: 'Look around' },
                { cmd: 'go <dir>', desc: 'Move in a direction' },
                { cmd: 'help (?)', desc: 'Show this help' },
                { cmd: 'quit (exit)', desc: 'Leave the game' }
              ]
            }));
          } else if (command) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Unknown command: ' + command
            }));
          }
        }
      } catch (error) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format'
        }));
      }
    });

    ws.on('close', () => {
      console.log('🔌 WebSocket client disconnected:', clientId);
      // Clean up player
      const player = gameState.players.get(clientId);
      if (player) {
        // Remove player from room using world manager
        worldManager.movePlayer(clientId, player.room, '');
        gameState.players.delete(clientId);
      }
    });

    ws.on('error', (err) => {
      console.log('🔌 WebSocket client error:', clientId, err.message);
    });
  });

  httpServer.listen(port, () => {
    console.log('✅ WebSocket server listening on port ' + port);
  });

  return { httpServer, wss };
}

// Health monitoring
function createHealthMonitor(intervalMs) {
  console.log('🏥 Starting health monitor (every ' + (intervalMs / 1000) + 's)');

  const monitor = setInterval(() => {
    const worldStats = worldManager.getStatistics();
    const stats = {
      players: gameState.players.size,
      rooms: worldStats.rooms,
      uptime: process.uptime(),
      memory: process.memoryUsage()
    };

    console.log('📊 Health Check:', new Date().toISOString());
    console.log('  Players:', stats.players);
    console.log('  Rooms:', stats.rooms);
    console.log('  Uptime:', Math.floor(stats.uptime) + 's');
    console.log('  Memory:', Math.floor(stats.memory.heapUsed / 1024 / 1024) + 'MB used');
    console.log('');
  }, intervalMs);

  return monitor;
}

// Main server startup
async function startServers() {
  const telnetPort = parseInt(process.env.MUD_NETWORK_PORT || '4000');
  const webPort = parseInt(process.env.MUD_WEB_PORT || '3000');

  // Kill any existing debug server
  if (process.argv[2] === '--stop') {
    console.log('🛑 Stopping debug servers...');
    process.exit(0);
  }

  // Initialize world
  await initializeWorld();

  // Start servers
  const telnetServer = createTelnetServer(telnetPort);
  const webSocketServer = createWebSocketServer(webPort);

  // Start health monitoring
  const healthMonitor = createHealthMonitor(30000); // 30 seconds

  console.log('\n🎮 MUD Engine Debug Server Started!');
  console.log('📡 Telnet: telnet localhost ' + telnetPort);
  console.log('🔌 WebSocket: ws://localhost:' + webPort);
  console.log('🌐 HTTP: http://localhost:' + webPort);
  console.log('\nPress Ctrl+C to stop\n');

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n📴 Shutting down servers...');
    clearInterval(healthMonitor);
    telnetServer.close();
    webSocketServer.httpServer.close();
    process.exit(0);
  });
}

// Show usage if requested
if (process.argv[2] === '--help') {
  console.log('MUD Engine Debug Server');
  console.log('Usage: node debug-mud-server.js [options]');
  console.log('');
  console.log('Options:');
  console.log('  --help    Show this help message');
  console.log('  --stop    Stop the debug server');
  console.log('');
  console.log('Environment variables:');
  console.log('  MUD_NETWORK_PORT    Telnet server port (default: 4000)');
  console.log('  MUD_WEB_PORT        WebSocket/HTTP server port (default: 3000)');
  process.exit(0);
} else {
   startServers().catch(error => {
     console.error('❌ Failed to start servers:', error);
     process.exit(1);
   });
}