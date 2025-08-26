import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WebClientService } from './web-client.service';
export declare class WebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly webClientService;
    server: Server;
    private logger;
    constructor(webClientService: WebClientService);
    handleConnection(client: Socket, ...args: any[]): Promise<void>;
    handleDisconnect(client: Socket): Promise<void>;
    handleAuthentication(client: Socket, data: {
        username: string;
        password?: string;
    }): Promise<void>;
    handleCommand(client: Socket, data: {
        command: string;
    }): Promise<void>;
    sendToClient(clientId: string, event: string, data: any): void;
    broadcast(event: string, data: any, excludeClientId?: string): void;
}
