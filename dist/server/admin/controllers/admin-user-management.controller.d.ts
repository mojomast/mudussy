import { UserService } from '../../networking/user.service';
import { UserRole, IUser } from '../../networking/user.types';
export interface UserManagementResponse {
    success: boolean;
    message: string;
    user?: Partial<IUser>;
    users?: Partial<IUser>[];
}
export declare class AdminUserManagementController {
    private readonly userService;
    constructor(userService: UserService);
    getAllUsers(): Promise<UserManagementResponse>;
    getUserById(userId: string): Promise<UserManagementResponse>;
    createUser(createData: {
        username: string;
        password: string;
        role?: UserRole;
    }, req: any): Promise<UserManagementResponse>;
    updateUserRole(userId: string, updateData: {
        role: UserRole;
    }, req: any): Promise<UserManagementResponse>;
    resetUserPassword(userId: string, passwordData: {
        password: string;
    }, req: any): Promise<UserManagementResponse>;
    deactivateUser(userId: string, req: any): Promise<UserManagementResponse>;
    activateUser(userId: string, req: any): Promise<UserManagementResponse>;
    getRoleStatistics(): Promise<{
        success: boolean;
        stats?: {
            role: UserRole;
            count: number;
        }[];
        message: string;
    }>;
}
