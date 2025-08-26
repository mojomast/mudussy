import { EventSystem } from '../../engine/core/event';
import { TelnetServer } from '../../engine/modules/networking/telnet-server';
import { WorldManager } from '../../engine/modules/world/world-manager';
import { PlayerManager } from '../../engine/modules/persistence/player-manager';
import { UserService } from './user.service';
import { UserRole } from './user.types';
export declare class WebClientService {
    private logger;
    private webSessions;
    private telnetServer;
    private eventSystem;
    private userService;
    private worldManager;
    private playerManager;
    private sessionManager;
    private commandParser;
    private outbound;
    constructor(userService: UserService, eventSystem: EventSystem, telnetServer: TelnetServer, worldManager: WorldManager, playerManager: PlayerManager);
    private setupEventHandlers;
    createWebSession(webClientId: string): Promise<string>;
    authenticateWebSession(webClientId: string, username: string, password: string): Promise<{
        success: boolean;
        username?: string;
        message?: string;
    }>;
    authenticateWebSessionWithRole(webClientId: string, username: string, password: string, userId: string, role: string): Promise<{
        success: boolean;
        username?: string;
        message?: string;
    }>;
    executeCommand(webClientId: string, command: string): Promise<string>;
    getGameState(webClientId: string): Promise<any>;
    disconnectWebSession(webClientId: string): Promise<void>;
    private getWebClientIdBySessionId;
    getWebClientId(sessionId: string): string | undefined;
    getActiveWebSessions(): string[];
    checkUserPermission(userId: string, requiredRole: UserRole): Promise<boolean>;
    checkAdminOperation(webClientId: string, operation: string): Promise<boolean>;
    storeSessionData(webClientId: string, sessionData: any): Promise<void>;
    getSessionData(webClientId: string): Promise<any>;
    loadPersistentSession(webClientId: string, userId: string): Promise<any>;
    saveSessionForPersistence(webClientId: string): Promise<void>;
    registerOutbound(webClientId: string, fn: (payload: {
        type: string;
        content: string;
    }) => void): void;
    unregisterOutbound(webClientId: string): void;
    private emitToWeb;
    private stripAnsi;
}
