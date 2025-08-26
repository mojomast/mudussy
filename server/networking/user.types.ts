/**
 * User and role management types
 */

export enum UserRole {
  PLAYER = 'player',
  MODERATOR = 'moderator',
  ADMIN = 'admin'
}

export interface IUser {
  id: string;
  username: string;
  password: string; // Plaintext for testing purposes
  role: UserRole;
  createdAt: Date;
  lastLogin?: Date;
  isActive: boolean;
}

export interface ICreateUserRequest {
  username: string;
  password: string;
  role?: UserRole;
}

export interface IAuthWithRoleResult {
  success: boolean;
  username?: string;
  role?: UserRole;
  message?: string;
  userId?: string;
}

export interface IPermissionCheck {
  userId: string;
  requiredRole: UserRole;
  resource?: string;
  action?: string;
}