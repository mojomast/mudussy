import {
  WebSocketGateway as WSGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { WebClientService } from './web-client.service';

@WSGateway({
  cors: {
    origin: '*', // Configure this for production
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
export class WebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('WebSocketGateway');

  constructor(private readonly webClientService: WebClientService) {}

  async handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`WebSocket client connected: ${client.id}`);

    // Create a web session for this client
    const sessionId = await this.webClientService.createWebSession(client.id);

    // Register outbound sink to forward engine messages
    this.webClientService.registerOutbound(client.id, (payload) => {
      client.emit('message', {
        type: payload.type,
        content: payload.content,
        timestamp: new Date(),
      });
    });

    // Send welcome message
    client.emit('message', {
      type: 'system',
      content: 'Welcome to MUD Engine Web Client!',
      timestamp: new Date(),
    });

    // Send authentication prompt
    client.emit('auth_required', {
      message: 'Please enter your username:',
      timestamp: new Date(),
    });
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`WebSocket client disconnected: ${client.id}`);
  this.webClientService.unregisterOutbound(client.id);
    await this.webClientService.disconnectWebSession(client.id);
  }

  @SubscribeMessage('authenticate')
  async handleAuthentication(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { username: string; password?: string },
  ) {
    try {
      const result = await this.webClientService.authenticateWebSession(
        client.id,
        data.username,
        data.password || 'password', // Default password for demo
      );

      if (result.success) {
        client.emit('authenticated', {
          username: result.username,
          message: result.message,
          timestamp: new Date(),
        });

        // Send initial game state
        const gameState = await this.webClientService.getGameState(client.id);
        client.emit('game_state', gameState);

        // Show current room description automatically
        const look = await this.webClientService.executeCommand(client.id, 'look');
        if (look) {
          client.emit('command_response', { command: 'look', response: look, timestamp: new Date() });
        }
      } else {
        client.emit('auth_failed', {
          message: result.message || 'Authentication failed',
          timestamp: new Date(),
        });
      }
    } catch (error) {
      this.logger.error('Authentication error:', error);
      client.emit('auth_failed', {
        message: 'Authentication error',
        timestamp: new Date(),
      });
    }
  }

  @SubscribeMessage('command')
  async handleCommand(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { command: string },
  ) {
    try {
      const result = await this.webClientService.executeCommand(
        client.id,
        data.command,
      );

      client.emit('command_response', {
        command: data.command,
        response: result,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error('Command execution error:', error);
      client.emit('command_error', {
        command: data.command,
        error: error.message,
        timestamp: new Date(),
      });
    }
  }

  // Send message to specific web client
  sendToClient(clientId: string, event: string, data: any) {
    const client = this.server.sockets.sockets.get(clientId);
    if (client) {
      client.emit(event, data);
    }
  }

  // Broadcast to all web clients
  broadcast(event: string, data: any, excludeClientId?: string) {
    this.server.sockets.sockets.forEach((client) => {
      if (client.id !== excludeClientId) {
        client.emit(event, data);
      }
    });
  }
}