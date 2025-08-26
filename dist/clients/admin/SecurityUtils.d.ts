export function withPermissionCheck(WrappedComponent: any, requiredPermission: any): ({ user, ...props }: {
    [x: string]: any;
    user: any;
}) => any;
export function usePermissions(user: any): {
    hasPermission: (permission: any) => boolean;
    hasAnyPermission: (permissions: any) => any;
    hasAllPermissions: (permissions: any) => any;
    hasRole: (role: any) => boolean;
    canAccessAdminPanel: () => boolean;
    canManageUsers: () => boolean;
    canManageWorld: () => boolean;
    canManageDialogue: () => boolean;
    canViewDashboard: () => boolean;
    canSystemAdmin: () => boolean;
    getUserPermissions: () => string[];
    getAvailableTabs: () => {
        id: string;
        label: string;
        icon: string;
    }[];
};
export namespace PERMISSIONS {
    let READ_USERS: string;
    let WRITE_USERS: string;
    let DELETE_USERS: string;
    let READ_DASHBOARD: string;
    let WRITE_DASHBOARD: string;
    let READ_WORLD: string;
    let WRITE_WORLD: string;
    let DELETE_WORLD: string;
    let READ_DIALOGUE: string;
    let WRITE_DIALOGUE: string;
    let DELETE_DIALOGUE: string;
    let MODERATE_CHAT: string;
    let KICK_PLAYERS: string;
    let SYSTEM_ADMIN: string;
}
export namespace ROLES {
    let PLAYER: string;
    let MODERATOR: string;
    let ADMIN: string;
}
export class SecurityUtils {
    static hasPermission(user: any, permission: any): boolean;
    static hasAnyPermission(user: any, permissions: any): any;
    static hasAllPermissions(user: any, permissions: any): any;
    static hasRole(user: any, role: any): boolean;
    static canAccessAdminPanel(user: any): boolean;
    static canManageUsers(user: any): boolean;
    static canManageWorld(user: any): boolean;
    static canManageDialogue(user: any): boolean;
    static canViewDashboard(user: any): boolean;
    static canSystemAdmin(user: any): boolean;
    static getUserPermissions(user: any): string[];
    static getAvailableTabs(user: any): {
        id: string;
        label: string;
        icon: string;
    }[];
    static validateApiCall(user: any, endpoint: any, method?: string): any;
    static sanitizeUserData(user: any): any;
    static logSecurityEvent(event: any, user: any, details?: {}): void;
}
