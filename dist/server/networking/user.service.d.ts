import { IUser, UserRole, ICreateUserRequest, IAuthWithRoleResult, IPermissionCheck } from './user.types';
export declare class UserService {
    private logger;
    private usersFilePath;
    private sessionsFilePath;
    private users;
    private sessions;
    constructor();
    private initializeStorage;
    private loadUsers;
    private loadSessions;
    private saveUsers;
    private saveSessions;
    private createDefaultAdmin;
    createUser(request: ICreateUserRequest): Promise<IUser>;
    authenticateUser(username: string, password: string): Promise<IAuthWithRoleResult>;
    getUserById(userId: string): Promise<IUser | undefined>;
    getUserByUsername(username: string): Promise<IUser | undefined>;
    updateUserRole(userId: string, newRole: UserRole): Promise<boolean>;
    deactivateUser(userId: string): Promise<boolean>;
    activateUser(userId: string): Promise<boolean>;
    resetUserPassword(userId: string, newPassword: string): Promise<boolean>;
    checkPermission(check: IPermissionCheck): Promise<boolean>;
    saveSessionData(sessionId: string, sessionData: any): Promise<void>;
    getSessionData(sessionId: string): Promise<any | undefined>;
    removeSessionData(sessionId: string): Promise<void>;
    getAllUsers(): Promise<IUser[]>;
    getUsersByRole(role: UserRole): Promise<IUser[]>;
    getRoleHierarchy(): {
        [key in UserRole]: number;
    };
    getRoleDisplayName(role: UserRole): string;
}
