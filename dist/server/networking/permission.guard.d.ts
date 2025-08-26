import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserService } from './user.service';
import { UserRole } from './user.types';
export declare const REQUIRED_ROLE_KEY = "requiredRole";
export declare const REQUIRED_PERMISSIONS_KEY = "requiredPermissions";
export declare const AUDIT_LOG_KEY = "auditLog";
export interface PermissionCheck {
    userId: string;
    requiredRole?: UserRole;
    requiredPermissions?: string[];
    resource?: string;
    action?: string;
}
export interface AuditLogEntry {
    userId: string;
    username: string;
    action: string;
    resource: string;
    details: any;
    timestamp: Date;
    ipAddress?: string;
    userAgent?: string;
}
export declare class PermissionGuard implements CanActivate {
    private reflector;
    private userService;
    private readonly logger;
    constructor(reflector: Reflector, userService: UserService);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private extractUserIdFromRequest;
    private checkSpecificPermissions;
    private getRolePermissions;
    private logAuditEntry;
    private sanitizeRequestBody;
}
export declare const RequireRole: (role: UserRole) => (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void;
export declare const RequirePermissions: (...permissions: string[]) => (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void;
export declare const EnableAuditLog: () => (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void;
export declare const RequireAdmin: () => (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void;
export declare const RequireModerator: () => (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void;
export declare const RequireUserManagement: () => (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void;
export declare const RequireWorldManagement: () => (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void;
export declare const RequireDialogueManagement: () => (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void;
export declare const RequireSystemAdmin: () => (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void;
