import { WebClientService } from './web-client.service';
import { UserService } from './user.service';
import { UserRole } from './user.types';
export interface AuthRequest {
    username: string;
    password?: string;
}
export interface AuthResponse {
    success: boolean;
    username?: string;
    role?: UserRole;
    userId?: string;
    message?: string;
    token?: string;
    sessionRestored?: boolean;
    sessionId?: string;
}
export declare class ApiAuthController {
    private readonly webClientService;
    private readonly userService;
    constructor(webClientService: WebClientService, userService: UserService);
    login(authRequest: AuthRequest): Promise<AuthResponse>;
}
