# MUD Engine Networking Module

This module provides a complete networking layer for the MUD Engine, including Telnet server functionality, session management, ANSI color support, and command parsing.

## Features

- ✅ **Telnet Server**: Full-featured Telnet server with protocol support
- ✅ **ANSI Colors**: Rich text formatting with color and style support
- ✅ **Session Management**: Connection handling with authentication
- ✅ **Rate Limiting**: Protection against spam and abuse
- ✅ **Idle Timeouts**: Automatic disconnection of inactive users
- ✅ **Command System**: Extensible command parsing and routing
- ✅ **Message Broadcasting**: Send messages to individual sessions or all users
- ✅ **Event Integration**: Full integration with the engine's event system

## Quick Start

### Basic Setup

```typescript
import { EngineService } from '../core/engine.service';

// Create engine with networking enabled (default)
const engine = new EngineService();

// Start the engine (this also starts the networking server)
await engine.start();
```

### Configuration

```typescript
// Update networking configuration
engine.updateConfig({
  networkHost: '0.0.0.0',        // Bind address
  networkPort: 4000,             // Server port
  maxConnections: 100,           // Maximum concurrent connections
  connectionTimeout: 30000,      // Connection timeout (30s)
  idleTimeout: 300000,           // Idle timeout (5 minutes)
  rateLimitWindow: 10000,        // Rate limit window (10s)
  rateLimitMaxRequests: 20,      // Max requests per window
  logLevel: 'info'               // Logging level
});
```

## Usage Examples

### Sending Messages

```typescript
// Send message to specific session
engine.sendMessageToSession(sessionId, 'Hello, player!', 'info');

// Broadcast to all players
engine.broadcastMessage('Server announcement!', 'system');

// Broadcast to all except one player
engine.broadcastMessage('Secret message', 'info', excludeSessionId);
```

### Custom Commands

```typescript
// Register a custom command
engine.registerNetworkCommand({
  command: 'roll',
  aliases: ['dice'],
  description: 'Roll a dice',
  usage: 'roll [sides]',
  handler: async (sessionId, args) => {
    const sides = parseInt(args[0]) || 6;
    const result = Math.floor(Math.random() * sides) + 1;
    return `You rolled a ${result} on a ${sides}-sided dice!`;
  }
});
```

### Session Management

```typescript
// Get networking server instance
const server = engine.getTelnetServer();

// Get session statistics
const stats = server.getStatistics();
console.log('Connected players:', stats.sessionStats.authenticatedSessions);

// Get all sessions
const sessions = server.getSessionManager().getAllSessions();
```

## Testing

### Manual Testing

1. **Start the server**:
   ```bash
   npm run build
   node scripts/test-networking.js
   ```

2. **Connect with Telnet**:
   ```bash
   telnet 127.0.0.1 4000
   ```

3. **Test commands**:
   - Enter a username when prompted
   - Use password "password" for authentication
   - Try: `help`, `who`, `say hello`, `look`, `stats`, `clear`

### Multiple Connections

Open multiple terminal windows and connect simultaneously to test:
- Concurrent connections
- Broadcasting messages
- Session isolation

## Architecture

### Core Components

- **TelnetServer**: Main server class handling connections
- **SessionManager**: Manages user sessions and authentication
- **CommandParser**: Parses and routes user commands
- **Ansi**: ANSI color and formatting utilities

### Event Integration

The networking module integrates with the engine's event system:

```typescript
// Listen for networking events
engine.on('network.session.connected', (event) => {
  console.log('New player connected:', event.data.sessionId);
});

engine.on('network.command.received', (event) => {
  console.log('Command received:', event.data.command);
});
```

### Command System

Commands are registered with handlers that receive:
- `sessionId`: Unique session identifier
- `args`: Array of command arguments
- `raw`: Raw command string

Return strings are sent back to the user, or use the message system for advanced formatting.

## API Reference

### TelnetServer

- `start()`: Start the server
- `stop()`: Stop the server
- `sendMessage(sessionId, message)`: Send message to session
- `broadcastMessage(message, excludeSessionId?)`: Broadcast to all
- `registerCommand(handler)`: Register custom command
- `getStatistics()`: Get server statistics

### EngineService Networking Methods

- `getTelnetServer()`: Get server instance
- `sendMessageToSession(sessionId, content, type)`: Send message
- `broadcastMessage(content, type, excludeSessionId?)`: Broadcast
- `registerNetworkCommand(handler)`: Register command
- `unregisterNetworkCommand(command)`: Unregister command

## Security Features

- **Rate Limiting**: Prevents command spam
- **Idle Timeouts**: Disconnects inactive users
- **Connection Limits**: Prevents server overload
- **Input Validation**: Sanitizes user input
- **Session Isolation**: Each user has isolated session

## Troubleshooting

### Common Issues

1. **Port already in use**:
   - Change the port in configuration
   - Kill processes using the port: `lsof -ti:4000 | xargs kill`

2. **Connection refused**:
   - Ensure server is running
   - Check firewall settings
   - Verify host binding (0.0.0.0 vs 127.0.0.1)

3. **Authentication fails**:
   - Use password "password" in test mode
   - Check session state and logs

### Debug Mode

Enable debug logging for detailed information:

```typescript
engine.updateConfig({
  logLevel: 'debug'
});
```

## Future Enhancements

- WebSocket support for web clients
- SSL/TLS encryption
- Advanced authentication (OAuth, certificates)
- Connection pooling and load balancing
- Chat rooms and private messaging
- File transfer capabilities
- Advanced Telnet options (MCCP, MSP)