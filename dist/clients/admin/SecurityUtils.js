"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityUtils = exports.ROLES = exports.PERMISSIONS = void 0;
exports.withPermissionCheck = withPermissionCheck;
exports.usePermissions = usePermissions;
exports.PERMISSIONS = {
    READ_USERS: 'read:users',
    WRITE_USERS: 'write:users',
    DELETE_USERS: 'delete:users',
    READ_DASHBOARD: 'read:dashboard',
    WRITE_DASHBOARD: 'write:dashboard',
    READ_WORLD: 'read:world_overview',
    WRITE_WORLD: 'write:world',
    DELETE_WORLD: 'delete:world',
    READ_DIALOGUE: 'read:dialogue',
    WRITE_DIALOGUE: 'write:dialogue',
    DELETE_DIALOGUE: 'delete:dialogue',
    MODERATE_CHAT: 'moderate:chat',
    KICK_PLAYERS: 'kick:players',
    SYSTEM_ADMIN: 'system:admin'
};
exports.ROLES = {
    PLAYER: 'player',
    MODERATOR: 'moderator',
    ADMIN: 'admin'
};
const ROLE_PERMISSIONS = {
    [exports.ROLES.PLAYER]: [
        'read:own_profile',
        'write:own_profile',
        'play:game'
    ],
    [exports.ROLES.MODERATOR]: [
        'read:own_profile',
        'write:own_profile',
        'play:game',
        exports.PERMISSIONS.READ_USERS,
        exports.PERMISSIONS.READ_DASHBOARD,
        exports.PERMISSIONS.READ_WORLD,
        exports.PERMISSIONS.MODERATE_CHAT,
        exports.PERMISSIONS.KICK_PLAYERS
    ],
    [exports.ROLES.ADMIN]: [
        'read:own_profile',
        'write:own_profile',
        'play:game',
        exports.PERMISSIONS.READ_USERS,
        exports.PERMISSIONS.WRITE_USERS,
        exports.PERMISSIONS.DELETE_USERS,
        exports.PERMISSIONS.READ_DASHBOARD,
        exports.PERMISSIONS.WRITE_DASHBOARD,
        exports.PERMISSIONS.READ_WORLD,
        exports.PERMISSIONS.WRITE_WORLD,
        exports.PERMISSIONS.DELETE_WORLD,
        exports.PERMISSIONS.READ_DIALOGUE,
        exports.PERMISSIONS.WRITE_DIALOGUE,
        exports.PERMISSIONS.DELETE_DIALOGUE,
        exports.PERMISSIONS.MODERATE_CHAT,
        exports.PERMISSIONS.KICK_PLAYERS,
        exports.PERMISSIONS.SYSTEM_ADMIN
    ]
};
class SecurityUtils {
    static hasPermission(user, permission) {
        if (!user || !user.role)
            return false;
        const userPermissions = ROLE_PERMISSIONS[user.role] || [];
        return userPermissions.includes(permission);
    }
    static hasAnyPermission(user, permissions) {
        return permissions.some(permission => this.hasPermission(user, permission));
    }
    static hasAllPermissions(user, permissions) {
        return permissions.every(permission => this.hasPermission(user, permission));
    }
    static hasRole(user, role) {
        if (!user || !user.role)
            return false;
        const roleHierarchy = {
            [exports.ROLES.PLAYER]: 1,
            [exports.ROLES.MODERATOR]: 2,
            [exports.ROLES.ADMIN]: 3
        };
        const userLevel = roleHierarchy[user.role] || 0;
        const requiredLevel = roleHierarchy[role] || 0;
        return userLevel >= requiredLevel;
    }
    static canAccessAdminPanel(user) {
        return this.hasRole(user, exports.ROLES.MODERATOR);
    }
    static canManageUsers(user) {
        return this.hasPermission(user, exports.PERMISSIONS.WRITE_USERS);
    }
    static canManageWorld(user) {
        return this.hasPermission(user, exports.PERMISSIONS.WRITE_WORLD);
    }
    static canManageDialogue(user) {
        return this.hasPermission(user, exports.PERMISSIONS.WRITE_DIALOGUE);
    }
    static canViewDashboard(user) {
        return this.hasPermission(user, exports.PERMISSIONS.READ_DASHBOARD);
    }
    static canSystemAdmin(user) {
        return this.hasPermission(user, exports.PERMISSIONS.SYSTEM_ADMIN);
    }
    static getUserPermissions(user) {
        if (!user || !user.role)
            return [];
        return ROLE_PERMISSIONS[user.role] || [];
    }
    static getAvailableTabs(user) {
        const tabs = [];
        if (this.canViewDashboard(user)) {
            tabs.push({ id: 'dashboard', label: 'Dashboard', icon: '📊' });
        }
        if (this.hasPermission(user, exports.PERMISSIONS.READ_USERS)) {
            tabs.push({ id: 'users', label: 'Users', icon: '👥' });
        }
        if (this.hasPermission(user, exports.PERMISSIONS.READ_WORLD)) {
            tabs.push({ id: 'world', label: 'World', icon: '🌍' });
        }
        if (this.hasPermission(user, exports.PERMISSIONS.READ_DIALOGUE)) {
            tabs.push({ id: 'dialogue', label: 'Dialogue', icon: '💬' });
        }
        return tabs;
    }
    static validateApiCall(user, endpoint, method = 'GET') {
        const endpointPermissions = {
            '/admin/dashboard': [exports.PERMISSIONS.READ_DASHBOARD],
            '/admin/users': [exports.PERMISSIONS.READ_USERS],
            '/admin/users POST': [exports.PERMISSIONS.WRITE_USERS],
            '/admin/users PUT': [exports.PERMISSIONS.WRITE_USERS],
            '/admin/users DELETE': [exports.PERMISSIONS.DELETE_USERS],
            '/admin/world': [exports.PERMISSIONS.READ_WORLD],
            '/admin/world POST': [exports.PERMISSIONS.WRITE_WORLD],
            '/admin/world PUT': [exports.PERMISSIONS.WRITE_WORLD],
            '/admin/world DELETE': [exports.PERMISSIONS.DELETE_WORLD],
            '/admin/dialogue': [exports.PERMISSIONS.READ_DIALOGUE],
            '/admin/dialogue POST': [exports.PERMISSIONS.WRITE_DIALOGUE],
            '/admin/dialogue PUT': [exports.PERMISSIONS.WRITE_DIALOGUE],
            '/admin/dialogue DELETE': [exports.PERMISSIONS.DELETE_DIALOGUE]
        };
        const key = method === 'GET' ? endpoint : `${endpoint} ${method}`;
        const requiredPermissions = endpointPermissions[key];
        if (!requiredPermissions) {
            return true;
        }
        return this.hasAnyPermission(user, requiredPermissions);
    }
    static sanitizeUserData(user) {
        if (!user)
            return null;
        const { password, ...sanitizedUser } = user;
        return sanitizedUser;
    }
    static logSecurityEvent(event, user, details = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            event,
            userId: user?.id,
            username: user?.username,
            role: user?.role,
            ...details
        };
        console.log('SECURITY:', logEntry);
    }
}
exports.SecurityUtils = SecurityUtils;
function withPermissionCheck(WrappedComponent, requiredPermission) {
    return function ProtectedComponent({ user, ...props }) {
        if (!SecurityUtils.hasPermission(user, requiredPermission)) {
            return (<div className="bg-red-900 border border-red-600 p-4 rounded-lg text-red-300">
          <h3 className="font-bold">Access Denied</h3>
          <p>You don't have permission to access this feature.</p>
          <p className="text-sm mt-2">Required: {requiredPermission}</p>
        </div>);
        }
        return <WrappedComponent user={user} {...props}/>;
    };
}
function usePermissions(user) {
    return {
        hasPermission: (permission) => SecurityUtils.hasPermission(user, permission),
        hasAnyPermission: (permissions) => SecurityUtils.hasAnyPermission(user, permissions),
        hasAllPermissions: (permissions) => SecurityUtils.hasAllPermissions(user, permissions),
        hasRole: (role) => SecurityUtils.hasRole(user, role),
        canAccessAdminPanel: () => SecurityUtils.canAccessAdminPanel(user),
        canManageUsers: () => SecurityUtils.canManageUsers(user),
        canManageWorld: () => SecurityUtils.canManageWorld(user),
        canManageDialogue: () => SecurityUtils.canManageDialogue(user),
        canViewDashboard: () => SecurityUtils.canViewDashboard(user),
        canSystemAdmin: () => SecurityUtils.canSystemAdmin(user),
        getUserPermissions: () => SecurityUtils.getUserPermissions(user),
        getAvailableTabs: () => SecurityUtils.getAvailableTabs(user)
    };
}
//# sourceMappingURL=SecurityUtils.js.map