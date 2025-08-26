import { Injectable, NestMiddleware, Logger, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { UserService } from '../networking/user.service';

export interface AuthenticatedRequest extends Request {
  user?: any;
  session?: any;
}

@Injectable()
export class SessionMiddleware implements NestMiddleware {
  private readonly logger = new Logger('SessionMiddleware');

  constructor(private readonly userService: UserService) {}

  async use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const startTime = Date.now();

    try {
      // Extract session information from headers
      const userId = this.extractUserId(req);
      const token = this.extractToken(req);

      if (!userId) {
        // No user ID provided, continue without authentication
        return next();
      }

      // Validate the user exists and is active
      const user = await this.userService.getUserById(userId);
      if (!user || !user.isActive) {
        this.logger.warn(`Invalid or inactive user attempted access: ${userId}`);
        throw new UnauthorizedException('User not found or inactive');
      }

      // Validate session if token is provided
      if (token) {
        const sessionData = await this.userService.getSessionData(userId);
        if (!sessionData) {
          this.logger.warn(`No session found for user: ${userId}`);
          throw new UnauthorizedException('Invalid session');
        }

        // Check session expiry (24 hours)
        const sessionAge = Date.now() - (sessionData.createdAt || 0);
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours

        if (sessionAge > maxAge) {
          this.logger.warn(`Session expired for user: ${userId}`);
          await this.userService.removeSessionData(userId);
          throw new UnauthorizedException('Session expired');
        }

        // Update session activity
        sessionData.lastActivity = new Date();
        await this.userService.saveSessionData(userId, sessionData);

        req.session = sessionData;
      }

      // Attach user info to request
      req.user = {
        id: user.id,
        username: user.username,
        role: user.role,
        permissions: this.getUserPermissions(user)
      };

      // Log access for admin operations
      if (this.isAdminOperation(req)) {
        this.logger.log(`Admin access: ${user.username} (${user.role}) - ${req.method} ${req.path}`);
      }

      next();

    } catch (error) {
      // Log security events
      this.logger.error(`Session validation failed: ${error.message}`, error.stack);

      if (error instanceof UnauthorizedException) {
        res.status(401).json({
          success: false,
          message: error.message,
          code: 'SESSION_INVALID'
        });
        return;
      }

      // For other errors, continue without authentication
      next();
    }
  }

  private extractUserId(req: Request): string | null {
    return (
      req.headers['x-user-id'] as string ||
      req.headers['user-id'] as string ||
      req.query.userId as string ||
      req.body?.userId ||
      null
    );
  }

  private extractToken(req: Request): string | null {
    return (
      req.headers['authorization']?.replace('Bearer ', '') ||
      req.headers['x-token'] as string ||
      req.query.token as string ||
      req.body?.token ||
      null
    );
  }

  private getUserPermissions(user: any): string[] {
    // Return permissions based on user role
    const rolePermissions = {
      'player': ['read:own_profile', 'play:game'],
      'moderator': [
        'read:own_profile', 'play:game',
        'read:users', 'read:dashboard', 'read:world_overview',
        'moderate:chat', 'kick:players'
      ],
      'admin': [
        'read:own_profile', 'play:game',
        'read:users', 'write:users', 'delete:users',
        'read:dashboard', 'write:dashboard',
        'read:world_overview', 'write:world', 'delete:world',
        'read:dialogue', 'write:dialogue', 'delete:dialogue',
        'moderate:chat', 'kick:players', 'system:admin'
      ]
    };

    return rolePermissions[user.role] || [];
  }

  private isAdminOperation(req: Request): boolean {
    const adminPaths = [
      '/admin/',
      '/auth/admin/',
      '/system/'
    ];

    return adminPaths.some(path => req.path.startsWith(path));
  }
}