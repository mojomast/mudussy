/**
 * Simple test networking server for multi-user functionality testing
 * This avoids NestJS complexity and focuses on core MUD functionality
 */

const net = require('net');

class TestServer {
    constructor(port = 3001) {
        this.port = port;
        this.server = null;
        this.sessions = new Map();
        this.players = new Map(); // Simple player storage
        this.setupBasicCommands();
    }

    setupBasicCommands() {
        this.commands = new Map();
        this.commands.set('help', (session, args) => 'Available commands: help, who, say, whisper, chat, look, quit');
        this.commands.set('who', (session, args) => {
            const onlineUsers = Array.from(this.players.values()).map(p => p.username);
            if (onlineUsers.length === 0) {
                return 'No players are currently online.';
            }
            return `Online players: ${onlineUsers.join(', ')}`;
        });
        this.commands.set('say', (session, args) => {
            if (args.length === 0) return 'What do you want to say?';
            const message = args.join(' ');
            const player = this.players.get(session.id);
            if (!player) return 'You must be logged in to chat';

            // Broadcast to all players
            this.broadcastToAll(`${player.username} says: ${message}`, session.id);
            return `You say: ${message}`;
        });
        this.commands.set('whisper', (session, args) => {
            if (args.length < 2) return 'Usage: whisper <username> <message>';
            const targetUsername = args[0];
            const message = args.slice(1).join(' ');
            const sender = this.players.get(session.id);
            if (!sender) return 'You must be logged in to send private messages';

            // Find target player
            const targetPlayer = Array.from(this.players.values()).find(p => p.username === targetUsername);
            if (!targetPlayer) return `Player '${targetUsername}' not found`;

            // Send to target
            const targetSession = targetPlayer.session;
            if (targetSession && targetSession.socket) {
                targetSession.socket.write(`\r\n${sender.username} whispers: ${message}\r\n${targetSession.prompt || '> '}`);
            }

            return `You whisper to ${targetUsername}: ${message}`;
        });
        this.commands.set('chat', (session, args) => {
            if (args.length === 0) return 'What do you want to say globally?';
            const message = args.join(' ');
            const player = this.players.get(session.id);
            if (!player) return 'You must be logged in to use global chat';

            // Broadcast globally
            this.broadcastToAll(`[Global] ${player.username}: ${message}`, session.id);
            return `You say globally: ${message}`;
        });
        this.commands.set('look', (session, args) => {
            return 'You are in a test room. This is a simple test implementation.';
        });
        this.commands.set('quit', (session, args) => {
            session.socket.end('Goodbye!\r\n');
            return null;
        });

        // Movement commands
        const directions = ['north', 'south', 'east', 'west', 'up', 'down'];
        for (const direction of directions) {
            this.commands.set(direction, (session, args) => {
                const player = this.players.get(session.id);
                if (!player) return 'You must be logged in to move';
                return `You attempt to move ${direction}...\r\nYou are still in the test area.`;
            });
        }

        // Go command (alternative movement syntax)
        this.commands.set('go', (session, args) => {
            if (args.length === 0) return 'Which direction do you want to go?';
            const direction = args[0].toLowerCase();
            const player = this.players.get(session.id);
            if (!player) return 'You must be logged in to move';
            return `You attempt to move ${direction}...\r\nYou are still in the test area.`;
        });

        // Talk command for NPC interactions
        this.commands.set('talk', (session, args) => {
            if (args.length === 0) return 'Talk to whom?';
            const npcName = args.join(' ');
            const player = this.players.get(session.id);
            if (!player) return 'You must be logged in to talk';

            if (npcName.toLowerCase().includes('blacksmith')) {
                return 'You don\'t see blacksmith here.';
            }
            return `${npcName} doesn't seem interested in talking.`;
        });

        // Respond command for dialogue continuation
        this.commands.set('respond', (session, args) => {
            const player = this.players.get(session.id);
            if (!player) return 'You must be logged in to respond';
            return 'No active dialogue to respond to.';
        });
    }

    async start() {
        return new Promise((resolve, reject) => {
            this.server = net.createServer((socket) => {
                this.handleConnection(socket);
            });

            this.server.listen(this.port, () => {
                console.log(`Test server listening on port ${this.port}`);
                resolve();
            });

            this.server.on('error', (err) => {
                console.error('Server error:', err);
                reject(err);
            });
        });
    }

    handleConnection(socket) {
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const session = {
            id: sessionId,
            socket,
            authenticated: false,
            username: null,
            prompt: '> '
        };

        this.sessions.set(sessionId, session);

        console.log(`New connection from ${socket.remoteAddress}:${socket.remotePort} (session: ${sessionId})`);

        // Send welcome message and username prompt
        socket.write('Welcome to the MUD Test Server!\r\n');
        socket.write('What is your name? ');

        let buffer = '';

        socket.on('data', (data) => {
            const chunk = data.toString();
            buffer += chunk;

            // Process complete lines
            const lines = buffer.split('\n');
            buffer = lines.pop(); // Keep incomplete line

            lines.forEach(line => {
                const input = line.trim();
                if (input) {
                    this.handleInput(session, input);
                }
            });
        });

        socket.on('close', () => {
            console.log(`Connection closed for session ${sessionId}`);
            this.sessions.delete(sessionId);

            if (session.username) {
                this.players.delete(sessionId);
                this.broadcastToOthers(sessionId, `${session.username} has left the game.`);
            }
        });

        socket.on('error', (err) => {
            console.error(`Socket error for session ${sessionId}:`, err);
        });
    }

    handleInput(session, input) {
        if (!session.authenticated || !session.username) {
            // Handle username input
            const username = input.trim();
            if (username && username.length > 0) {
                // Check if username is already taken
                const existingUser = Array.from(this.players.values()).find(p => p.username === username);
                if (existingUser) {
                    session.socket.write('Username already taken. Please choose another: ');
                    return;
                }

                session.username = username;
                session.authenticated = true;

                // Add to players
                this.players.set(session.id, {
                    username,
                    session,
                    connectedAt: new Date()
                });

                // Send welcome message
                session.socket.write(`\r\nWelcome, ${username}!\r\n`);
                session.socket.write('Type "help" for available commands.\r\n');
                session.socket.write(session.prompt);

                // Notify other players
                this.broadcastToOthers(session.id, `${username} has joined the game.`);
            } else {
                session.socket.write('Please enter a valid username: ');
            }
        } else {
            // Handle commands
            const parts = input.trim().split(' ');
            const command = parts[0].toLowerCase();
            const args = parts.slice(1);

            const commandHandler = this.commands.get(command);
            if (commandHandler) {
                const response = commandHandler(session, args);
                if (response) {
                    session.socket.write(response + '\r\n');
                }
                if (response !== null) { // null means disconnect
                    session.socket.write(session.prompt);
                }
            } else {
                session.socket.write(`Unknown command: ${command}. Type 'help' for available commands.\r\n`);
                session.socket.write(session.prompt);
            }
        }
    }

    broadcastToAll(message, excludeSessionId = null) {
        for (const [sessionId, session] of this.sessions) {
            if (sessionId !== excludeSessionId && session.authenticated && session.socket) {
                session.socket.write(message + '\r\n');
            }
        }
    }

    broadcastToOthers(excludeSessionId, message) {
        this.broadcastToAll(message, excludeSessionId);
    }

    async stop() {
        return new Promise((resolve) => {
            if (this.server) {
                this.server.close(() => {
                    console.log('Test server stopped');
                    resolve();
                });

                // Close all connections
                for (const [sessionId, session] of this.sessions) {
                    if (session.socket) {
                        session.socket.destroy();
                    }
                }
                this.sessions.clear();
                this.players.clear();
            } else {
                resolve();
            }
        });
    }
}

// Start server if run directly
if (require.main === module) {
    const server = new TestServer();
    server.start().then(() => {
        console.log('Test networking server started successfully');

        // Graceful shutdown
        process.on('SIGINT', async () => {
            console.log('\nShutting down...');
            await server.stop();
            process.exit(0);
        });

        process.on('SIGTERM', async () => {
            console.log('\nShutting down...');
            await server.stop();
            process.exit(0);
        });
    }).catch(console.error);
}

module.exports = TestServer;