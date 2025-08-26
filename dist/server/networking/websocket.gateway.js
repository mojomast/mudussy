"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const web_client_service_1 = require("./web-client.service");
let WebSocketGateway = class WebSocketGateway {
    constructor(webClientService) {
        this.webClientService = webClientService;
        this.logger = new common_1.Logger('WebSocketGateway');
    }
    async handleConnection(client, ...args) {
        this.logger.log(`WebSocket client connected: ${client.id}`);
        const sessionId = await this.webClientService.createWebSession(client.id);
        this.webClientService.registerOutbound(client.id, (payload) => {
            client.emit('message', {
                type: payload.type,
                content: payload.content,
                timestamp: new Date(),
            });
        });
        client.emit('message', {
            type: 'system',
            content: 'Welcome to MUD Engine Web Client!',
            timestamp: new Date(),
        });
        client.emit('auth_required', {
            message: 'Please enter your username:',
            timestamp: new Date(),
        });
    }
    async handleDisconnect(client) {
        this.logger.log(`WebSocket client disconnected: ${client.id}`);
        this.webClientService.unregisterOutbound(client.id);
        await this.webClientService.disconnectWebSession(client.id);
    }
    async handleAuthentication(client, data) {
        try {
            const result = await this.webClientService.authenticateWebSession(client.id, data.username, data.password || 'password');
            if (result.success) {
                client.emit('authenticated', {
                    username: result.username,
                    message: result.message,
                    timestamp: new Date(),
                });
                const gameState = await this.webClientService.getGameState(client.id);
                client.emit('game_state', gameState);
                const look = await this.webClientService.executeCommand(client.id, 'look');
                if (look) {
                    client.emit('command_response', { command: 'look', response: look, timestamp: new Date() });
                }
            }
            else {
                client.emit('auth_failed', {
                    message: result.message || 'Authentication failed',
                    timestamp: new Date(),
                });
            }
        }
        catch (error) {
            this.logger.error('Authentication error:', error);
            client.emit('auth_failed', {
                message: 'Authentication error',
                timestamp: new Date(),
            });
        }
    }
    async handleCommand(client, data) {
        try {
            const result = await this.webClientService.executeCommand(client.id, data.command);
            client.emit('command_response', {
                command: data.command,
                response: result,
                timestamp: new Date(),
            });
        }
        catch (error) {
            this.logger.error('Command execution error:', error);
            client.emit('command_error', {
                command: data.command,
                error: error.message,
                timestamp: new Date(),
            });
        }
    }
    sendToClient(clientId, event, data) {
        const client = this.server.sockets.sockets.get(clientId);
        if (client) {
            client.emit(event, data);
        }
    }
    broadcast(event, data, excludeClientId) {
        this.server.sockets.sockets.forEach((client) => {
            if (client.id !== excludeClientId) {
                client.emit(event, data);
            }
        });
    }
};
exports.WebSocketGateway = WebSocketGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], WebSocketGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('authenticate'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], WebSocketGateway.prototype, "handleAuthentication", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('command'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], WebSocketGateway.prototype, "handleCommand", null);
exports.WebSocketGateway = WebSocketGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
            credentials: true,
        },
    }),
    __metadata("design:paramtypes", [web_client_service_1.WebClientService])
], WebSocketGateway);
//# sourceMappingURL=websocket.gateway.js.map