// Security utilities for role-based access control

// Permission definitions
export const PERMISSIONS = {
  // User management
  READ_USERS: 'read:users',
  WRITE_USERS: 'write:users',
  DELETE_USERS: 'delete:users',

  // Dashboard
  READ_DASHBOARD: 'read:dashboard',
  WRITE_DASHBOARD: 'write:dashboard',

  // World management
  READ_WORLD: 'read:world_overview',
  WRITE_WORLD: 'write:world',
  DELETE_WORLD: 'delete:world',

  // Dialogue management
  READ_DIALOGUE: 'read:dialogue',
  WRITE_DIALOGUE: 'write:dialogue',
  DELETE_DIALOGUE: 'delete:dialogue',

  // Moderation
  MODERATE_CHAT: 'moderate:chat',
  KICK_PLAYERS: 'kick:players',

  // System admin
  SYSTEM_ADMIN: 'system:admin'
};

// Role definitions
export const ROLES = {
  PLAYER: 'player',
  MODERATOR: 'moderator',
  ADMIN: 'admin'
};

// Role hierarchy and permissions mapping
const ROLE_PERMISSIONS = {
  [ROLES.PLAYER]: [
    'read:own_profile',
    'write:own_profile',
    'play:game'
  ],
  [ROLES.MODERATOR]: [
    'read:own_profile',
    'write:own_profile',
    'play:game',
    PERMISSIONS.READ_USERS,
    PERMISSIONS.READ_DASHBOARD,
    PERMISSIONS.READ_WORLD,
    PERMISSIONS.MODERATE_CHAT,
    PERMISSIONS.KICK_PLAYERS
  ],
  [ROLES.ADMIN]: [
    'read:own_profile',
    'write:own_profile',
    'play:game',
    PERMISSIONS.READ_USERS,
    PERMISSIONS.WRITE_USERS,
    PERMISSIONS.DELETE_USERS,
    PERMISSIONS.READ_DASHBOARD,
    PERMISSIONS.WRITE_DASHBOARD,
    PERMISSIONS.READ_WORLD,
    PERMISSIONS.WRITE_WORLD,
    PERMISSIONS.DELETE_WORLD,
    PERMISSIONS.READ_DIALOGUE,
    PERMISSIONS.WRITE_DIALOGUE,
    PERMISSIONS.DELETE_DIALOGUE,
    PERMISSIONS.MODERATE_CHAT,
    PERMISSIONS.KICK_PLAYERS,
    PERMISSIONS.SYSTEM_ADMIN
  ]
};

// Security utility functions
export class SecurityUtils {
  static hasPermission(user, permission) {
    if (!user || !user.role) return false;

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
    if (!user || !user.role) return false;

    const roleHierarchy = {
      [ROLES.PLAYER]: 1,
      [ROLES.MODERATOR]: 2,
      [ROLES.ADMIN]: 3
    };

    const userLevel = roleHierarchy[user.role] || 0;
    const requiredLevel = roleHierarchy[role] || 0;

    return userLevel >= requiredLevel;
  }

  static canAccessAdminPanel(user) {
    return this.hasRole(user, ROLES.MODERATOR);
  }

  static canManageUsers(user) {
    return this.hasPermission(user, PERMISSIONS.WRITE_USERS);
  }

  static canManageWorld(user) {
    return this.hasPermission(user, PERMISSIONS.WRITE_WORLD);
  }

  static canManageDialogue(user) {
    return this.hasPermission(user, PERMISSIONS.WRITE_DIALOGUE);
  }

  static canViewDashboard(user) {
    return this.hasPermission(user, PERMISSIONS.READ_DASHBOARD);
  }

  static canSystemAdmin(user) {
    return this.hasPermission(user, PERMISSIONS.SYSTEM_ADMIN);
  }

  static getUserPermissions(user) {
    if (!user || !user.role) return [];
    return ROLE_PERMISSIONS[user.role] || [];
  }

  static getAvailableTabs(user) {
    const tabs = [];

    if (this.canViewDashboard(user)) {
      tabs.push({ id: 'dashboard', label: 'Dashboard', icon: '📊' });
    }

    if (this.hasPermission(user, PERMISSIONS.READ_USERS)) {
      tabs.push({ id: 'users', label: 'Users', icon: '👥' });
    }

    if (this.hasPermission(user, PERMISSIONS.READ_WORLD)) {
      tabs.push({ id: 'world', label: 'World', icon: '🌍' });
    }

    if (this.hasPermission(user, PERMISSIONS.READ_DIALOGUE)) {
      tabs.push({ id: 'dialogue', label: 'Dialogue', icon: '💬' });
    }

    return tabs;
  }

  static validateApiCall(user, endpoint, method = 'GET') {
    // This function can be used to validate API calls before making them
    const endpointPermissions = {
      '/admin/dashboard': [PERMISSIONS.READ_DASHBOARD],
      '/admin/users': [PERMISSIONS.READ_USERS],
      '/admin/users POST': [PERMISSIONS.WRITE_USERS],
      '/admin/users PUT': [PERMISSIONS.WRITE_USERS],
      '/admin/users DELETE': [PERMISSIONS.DELETE_USERS],
      '/admin/world': [PERMISSIONS.READ_WORLD],
      '/admin/world POST': [PERMISSIONS.WRITE_WORLD],
      '/admin/world PUT': [PERMISSIONS.WRITE_WORLD],
      '/admin/world DELETE': [PERMISSIONS.DELETE_WORLD],
      '/admin/dialogue': [PERMISSIONS.READ_DIALOGUE],
      '/admin/dialogue POST': [PERMISSIONS.WRITE_DIALOGUE],
      '/admin/dialogue PUT': [PERMISSIONS.WRITE_DIALOGUE],
      '/admin/dialogue DELETE': [PERMISSIONS.DELETE_DIALOGUE]
    };

    const key = method === 'GET' ? endpoint : `${endpoint} ${method}`;
    const requiredPermissions = endpointPermissions[key];

    if (!requiredPermissions) {
      return true; // No specific permission required
    }

    return this.hasAnyPermission(user, requiredPermissions);
  }

  static sanitizeUserData(user) {
    if (!user) return null;

    // Remove sensitive information that shouldn't be exposed to frontend
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

    // In a real implementation, this would send to a logging service
    console.log('SECURITY:', logEntry);
  }
}

// Higher-order component for protecting components
export function withPermissionCheck(WrappedComponent, requiredPermission) {
  return function ProtectedComponent({ user, ...props }) {
    if (!SecurityUtils.hasPermission(user, requiredPermission)) {
      return (
        <div className="bg-red-900 border border-red-600 p-4 rounded-lg text-red-300">
          <h3 className="font-bold">Access Denied</h3>
          <p>You don't have permission to access this feature.</p>
          <p className="text-sm mt-2">Required: {requiredPermission}</p>
        </div>
      );
    }

    return <WrappedComponent user={user} {...props} />;
  };
}

// Hook for checking permissions in functional components
export function usePermissions(user) {
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