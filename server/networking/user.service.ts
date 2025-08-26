import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { IUser, UserRole, ICreateUserRequest, IAuthWithRoleResult, IPermissionCheck } from './user.types';

@Injectable()
export class UserService {
  private logger = new Logger('UserService');
  private usersFilePath = join(process.cwd(), 'data', 'users.json');
  private sessionsFilePath = join(process.cwd(), 'data', 'sessions.json');
  private users: Map<string, IUser> = new Map();
  private sessions: Map<string, any> = new Map();

  constructor() {
    this.initializeStorage();
  }

  private async initializeStorage(): Promise<void> {
    try {
      // Ensure data directory exists
      await fs.mkdir(join(process.cwd(), 'data'), { recursive: true });

      // Load users from file
      await this.loadUsers();

      // Load sessions from file
      await this.loadSessions();

      // Create default admin user if no users exist
      if (this.users.size === 0) {
        await this.createDefaultAdmin();
      }

      this.logger.log(`User service initialized with ${this.users.size} users`);
    } catch (error) {
      this.logger.error('Failed to initialize user storage:', error);
      throw error;
    }
  }

  private async loadUsers(): Promise<void> {
    try {
      const data = await fs.readFile(this.usersFilePath, 'utf8');
      const users: IUser[] = JSON.parse(data);

      // Convert createdAt strings back to Date objects
      users.forEach(user => {
        user.createdAt = new Date(user.createdAt);
        if (user.lastLogin) {
          user.lastLogin = new Date(user.lastLogin);
        }
        this.users.set(user.id, user);
      });
    } catch (error) {
      // File doesn't exist or is corrupted, start with empty users
      this.logger.warn('Users file not found or corrupted, starting with empty user store');
    }
  }

  private async loadSessions(): Promise<void> {
    try {
      const data = await fs.readFile(this.sessionsFilePath, 'utf8');
      const sessions = JSON.parse(data);

      // Convert date strings back to Date objects
      Object.entries(sessions).forEach(([sessionId, sessionData]: [string, any]) => {
        if (sessionData.createdAt) {
          sessionData.createdAt = new Date(sessionData.createdAt);
        }
        if (sessionData.lastActivity) {
          sessionData.lastActivity = new Date(sessionData.lastActivity);
        }
        this.sessions.set(sessionId, sessionData);
      });
    } catch (error) {
      // File doesn't exist or is corrupted, start with empty sessions
      this.logger.warn('Sessions file not found or corrupted, starting with empty session store');
    }
  }

  private async saveUsers(): Promise<void> {
    try {
      const users = Array.from(this.users.values());
      await fs.writeFile(this.usersFilePath, JSON.stringify(users, null, 2));
    } catch (error) {
      this.logger.error('Failed to save users:', error);
      throw error;
    }
  }

  private async saveSessions(): Promise<void> {
    try {
      const sessions = Object.fromEntries(this.sessions);
      await fs.writeFile(this.sessionsFilePath, JSON.stringify(sessions, null, 2));
    } catch (error) {
      this.logger.error('Failed to save sessions:', error);
      throw error;
    }
  }

  private async createDefaultAdmin(): Promise<void> {
    const adminUser: ICreateUserRequest = {
      username: 'admin',
      password: 'admin123',
      role: UserRole.ADMIN
    };

    await this.createUser(adminUser);
    this.logger.log('Created default admin user: admin/admin123');
  }

  async createUser(request: ICreateUserRequest): Promise<IUser> {
    // Check if username already exists
    const existingUser = Array.from(this.users.values()).find(u => u.username === request.username);
    if (existingUser) {
      throw new Error(`User ${request.username} already exists`);
    }

    const user: IUser = {
      id: uuidv4(),
      username: request.username,
      password: request.password, // Plaintext for testing
      role: request.role || UserRole.PLAYER,
      createdAt: new Date(),
      isActive: true
    };

    this.users.set(user.id, user);
    await this.saveUsers();

    this.logger.log(`Created user: ${user.username} with role ${user.role}`);
    return user;
  }

  async authenticateUser(username: string, password: string): Promise<IAuthWithRoleResult> {
    const user = Array.from(this.users.values()).find(u => u.username === username && u.isActive);

    if (!user) {
      return { success: false, message: 'User not found' };
    }

    if (user.password !== password) {
      return { success: false, message: 'Invalid password' };
    }

    // Update last login
    user.lastLogin = new Date();
    await this.saveUsers();

    return {
      success: true,
      username: user.username,
      role: user.role,
      userId: user.id,
      message: `Welcome back, ${user.username}!`
    };
  }

  async getUserById(userId: string): Promise<IUser | undefined> {
    return this.users.get(userId);
  }

  async getUserByUsername(username: string): Promise<IUser | undefined> {
    return Array.from(this.users.values()).find(u => u.username === username);
  }

  async updateUserRole(userId: string, newRole: UserRole): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) {
      return false;
    }

    user.role = newRole;
    await this.saveUsers();
    this.logger.log(`Updated user ${user.username} role to ${newRole}`);
    return true;
  }

  async deactivateUser(userId: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) {
      return false;
    }

    user.isActive = false;
    await this.saveUsers();
    this.logger.log(`Deactivated user ${user.username}`);
    return true;
  }

  async activateUser(userId: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) {
      return false;
    }

    user.isActive = true;
    await this.saveUsers();
    this.logger.log(`Activated user ${user.username}`);
    return true;
  }

  async resetUserPassword(userId: string, newPassword: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) {
      return false;
    }

    user.password = newPassword;
    await this.saveUsers();
    this.logger.log(`Reset password for user ${user.username}`);
    return true;
  }

  async checkPermission(check: IPermissionCheck): Promise<boolean> {
    const user = this.users.get(check.userId);
    if (!user || !user.isActive) {
      return false;
    }

    // Role hierarchy: admin > moderator > player
    const roleHierarchy = {
      [UserRole.PLAYER]: 1,
      [UserRole.MODERATOR]: 2,
      [UserRole.ADMIN]: 3
    };

    const userLevel = roleHierarchy[user.role] || 0;
    const requiredLevel = roleHierarchy[check.requiredRole] || 0;

    return userLevel >= requiredLevel;
  }

  // Session persistence methods
  async saveSessionData(sessionId: string, sessionData: any): Promise<void> {
    this.sessions.set(sessionId, {
      ...sessionData,
      lastSaved: new Date()
    });
    await this.saveSessions();
  }

  async getSessionData(sessionId: string): Promise<any | undefined> {
    return this.sessions.get(sessionId);
  }

  async removeSessionData(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
    await this.saveSessions();
  }

  async getAllUsers(): Promise<IUser[]> {
    return Array.from(this.users.values());
  }

  async getUsersByRole(role: UserRole): Promise<IUser[]> {
    return Array.from(this.users.values()).filter(u => u.role === role && u.isActive);
  }

  // Utility methods for role hierarchy
  getRoleHierarchy(): { [key in UserRole]: number } {
    return {
      [UserRole.PLAYER]: 1,
      [UserRole.MODERATOR]: 2,
      [UserRole.ADMIN]: 3
    };
  }

  getRoleDisplayName(role: UserRole): string {
    switch (role) {
      case UserRole.ADMIN:
        return 'Administrator';
      case UserRole.MODERATOR:
        return 'Moderator';
      case UserRole.PLAYER:
        return 'Player';
      default:
        return 'Unknown';
    }
  }
}