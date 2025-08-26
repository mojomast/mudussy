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
export declare class AuthController {
    private readonly webClientService;
    private readonly userService;
    constructor(webClientService: WebClientService, userService: UserService);
    login(authRequest: AuthRequest): Promise<AuthResponse>;
    loginApi(body: AuthRequest): Promise<AuthResponse>;
    register(authRequest: AuthRequest): Promise<AuthResponse>;
    getStatus(): Promise<{
        authenticated: boolean;
        message: string;
    }>;
    createUser(createUserRequest: {
        username: string;
        password: string;
        role?: UserRole;
    }, req: any): Promise<AuthResponse>;
    updateUserRole(updateRequest: {
        userId: string;
        newRole: UserRole;
    }, req: any): Promise<AuthResponse>;
    getAllUsers(req: any): Promise<any>;
    deactivateUser(request: {
        userId: string;
    }, req: any): Promise<AuthResponse>;
}
