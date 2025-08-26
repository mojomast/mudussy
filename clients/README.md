# MUD Engine Web Client

A web-based client for the MUD Engine that provides real-time communication via WebSocket and REST API integration.

## Features

- **Real-time WebSocket Communication**: Experience the MUD in real-time with instant message updates
- **REST API Integration**: Access game data and execute commands via HTTP endpoints
- **Responsive Design**: Clean, terminal-inspired interface that works on desktop and mobile
- **Session Management**: Persistent sessions with authentication
- **Command History**: Full command history and auto-completion support

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- MUD Engine server running

### Installation

1. Ensure the MUD Engine is built:
   ```bash
   npm run build
   ```

2. Start the web client server:
   ```bash
   npm run web:serve
   ```

3. Open your browser to `http://localhost:3000`

## Usage

### WebSocket Connection

The client automatically connects to the WebSocket server at `/socket.io` and provides:

- Real-time game updates
- Live player communication
- Instant command responses

### Authentication

1. Enter your username when prompted
2. The client will authenticate you with the server
3. You'll receive confirmation and be able to start playing

### Commands

Use the command input at the bottom to execute game commands:

- `look` - Examine your surroundings
- `help` - Get help information
- `say <message>` - Communicate with other players
- `quit` - Leave the game

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/status` - Authentication status

### Commands
- `POST /api/commands/execute` - Execute a command
- `GET /api/commands/available` - List available commands
- `GET /api/commands/help/:command` - Get help for specific command

### World Data
- `GET /api/world` - Get world information
- `GET /api/world/rooms` - Get all rooms
- `GET /api/world/rooms/:id` - Get specific room
- `GET /api/world/players` - Get all players
- `GET /api/world/players/:id` - Get specific player
- `GET /api/world/stats` - Get world statistics

## Development

### File Structure

```
clients/
├── index.html      # Main web client interface
├── client.js       # WebSocket and game logic
└── README.md       # This documentation
```

### Customization

The web client uses CSS variables for easy theming:

```css
:root {
  --bg-color: #000;
  --text-color: #0f0;
  --border-color: #0f0;
}
```

## Troubleshooting

### Connection Issues

- Ensure the MUD Engine server is running
- Check that port 3000 is available
- Verify WebSocket connection in browser developer tools

### Authentication Problems

- Clear browser cache and cookies
- Check server logs for authentication errors
- Verify username format (no special characters)

### Performance

- The client is optimized for real-time communication
- Command responses should be near-instantaneous
- If experiencing lag, check network connection

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see the main project LICENSE file for details.