import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { WebClientService } from './web-client.service';
import { UserService } from './user.service';
import { UserRole } from './user.types';
import { PermissionGuard, RequireAdmin, RequireRole } from './permission.guard';

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

@Controller('auth')
export class AuthController {
  constructor(
    private readonly webClientService: WebClientService,
    private readonly userService: UserService
  ) {}

  @Post('login')
  async login(@Body() authRequest: AuthRequest): Promise<AuthResponse> {
    try {
      // Authenticate user using UserService
      const authResult = await this.userService.authenticateUser(
        authRequest.username,
        authRequest.password || 'password'
      );

      if (authResult.success && authResult.userId) {
        // Create a temporary web session for REST API authentication
        const tempClientId = `rest_${Date.now()}_${Math.random()}`;
        await this.webClientService.createWebSession(tempClientId);

        // Check for persistent session data
        const persistentData = await this.webClientService.loadPersistentSession(tempClientId, authResult.userId);

        // Authenticate the web session with role information
        const result = await this.webClientService.authenticateWebSessionWithRole(
          tempClientId,
          authResult.username!,
          authRequest.password || 'password',
          authResult.userId,
          authResult.role!
        );

        if (result.success) {
          // Save session for future persistence
          await this.webClientService.saveSessionForPersistence(tempClientId);

          // Generate a simple token (in production, use JWT)
          const token = `${authResult.userId}`; // shim: use userId as bearer for guard compatibility

          return {
            success: true,
            username: authResult.username,
            role: authResult.role,
            userId: authResult.userId,
            message: authResult.message,
            token,
            sessionId: tempClientId,
            sessionRestored: persistentData !== null
          };
        } else {
          return {
            success: false,
            message: result.message || 'Web session authentication failed',
          };
        }
      } else {
        return {
          success: false,
          message: authResult.message || 'Authentication failed',
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Authentication error',
      };
    }
  }

  // Compatibility alias for tests expecting /api/auth/login
  @Post('/api/auth/login')
  async loginApi(@Body() body: AuthRequest): Promise<AuthResponse> {
    return this.login(body);
  }

  @Post('register')
  async register(@Body() authRequest: AuthRequest): Promise<AuthResponse> {
    // For demo purposes, registration is simplified
    // In a real implementation, this would create a new user account

    try {
      const tempClientId = `rest_${Date.now()}_${Math.random()}`;
      await this.webClientService.createWebSession(tempClientId);

      const result = await this.webClientService.authenticateWebSession(
        tempClientId,
        authRequest.username,
        authRequest.password || 'password'
      );

      if (result.success) {
        const token = `web_token_${tempClientId}_${Date.now()}`;

        return {
          success: true,
          username: result.username,
          message: `Account created and logged in as ${result.username}`,
          token,
        };
      } else {
        return {
          success: false,
          message: 'Registration failed',
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Registration error',
      };
    }
  }

  @Get('status')
  async getStatus(): Promise<{ authenticated: boolean; message: string }> {
    // This would check the current session in a real implementation
    return {
      authenticated: false,
      message: 'Authentication status endpoint - use WebSocket for full authentication',
    };
  }

  // Admin endpoints for user management
  @Post('admin/create-user')
  @UseGuards(PermissionGuard)
  @RequireAdmin()
  async createUser(@Body() createUserRequest: { username: string; password: string; role?: UserRole }, @Request() req: any): Promise<AuthResponse> {
    try {
      const user = await this.userService.createUser(createUserRequest);
      return {
        success: true,
        username: user.username,
        role: user.role,
        userId: user.id,
        message: `User ${user.username} created successfully with role ${user.role}`
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to create user'
      };
    }
  }

  @Post('admin/update-role')
  @UseGuards(PermissionGuard)
  @RequireAdmin()
  async updateUserRole(@Body() updateRequest: { userId: string; newRole: UserRole }, @Request() req: any): Promise<AuthResponse> {
    try {
      const success = await this.userService.updateUserRole(updateRequest.userId, updateRequest.newRole);
      if (success) {
        return {
          success: true,
          message: `User role updated to ${updateRequest.newRole}`
        };
      } else {
        return {
          success: false,
          message: 'User not found or update failed'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update user role'
      };
    }
  }

  @Get('admin/users')
  @UseGuards(PermissionGuard)
  @RequireAdmin()
  async getAllUsers(@Request() req: any): Promise<any> {
    try {
      const users = await this.userService.getAllUsers();
      return {
        success: true,
        users: users.map(u => ({
          id: u.id,
          username: u.username,
          role: u.role,
          createdAt: u.createdAt,
          lastLogin: u.lastLogin,
          isActive: u.isActive
        }))
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve users'
      };
    }
  }

  @Post('admin/deactivate-user')
  @UseGuards(PermissionGuard)
  @RequireAdmin()
  async deactivateUser(@Body() request: { userId: string }, @Request() req: any): Promise<AuthResponse> {
    try {
      const success = await this.userService.deactivateUser(request.userId);
      if (success) {
        return {
          success: true,
          message: 'User deactivated successfully'
        };
      } else {
        return {
          success: false,
          message: 'User not found'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Failed to deactivate user'
      };
    }
  }
}