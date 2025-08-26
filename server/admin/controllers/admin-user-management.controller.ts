import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { PermissionGuard, RequireAdmin, RequireModerator, RequireUserManagement, EnableAuditLog } from '../../networking/permission.guard';
import { UserService } from '../../networking/user.service';
import { UserRole, IUser } from '../../networking/user.types';

export interface UserManagementResponse {
  success: boolean;
  message: string;
  user?: Partial<IUser>;
  users?: Partial<IUser>[];
}

@Controller('admin/users')
export class AdminUserManagementController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @UseGuards(PermissionGuard)
  @RequireModerator()
  async getAllUsers(): Promise<UserManagementResponse> {
    try {
      const users = await this.userService.getAllUsers();
      return {
        success: true,
        message: `Found ${users.length} users`,
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

  @Get(':id')
  @UseGuards(PermissionGuard)
  @RequireModerator()
  async getUserById(@Param('id') userId: string): Promise<UserManagementResponse> {
    try {
      const user = await this.userService.getUserById(userId);
      if (user) {
        return {
          success: true,
          message: 'User found',
          user: {
            id: user.id,
            username: user.username,
            role: user.role,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin,
            isActive: user.isActive
          }
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
        message: 'Failed to retrieve user'
      };
    }
  }

  @Post()
  @UseGuards(PermissionGuard)
  @RequireUserManagement()
  @EnableAuditLog()
  async createUser(@Body() createData: { username: string; password: string; role?: UserRole }, @Request() req: any): Promise<UserManagementResponse> {
    try {
      const user = await this.userService.createUser(createData);
      return {
        success: true,
        message: `User ${user.username} created successfully`,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          createdAt: user.createdAt,
          isActive: user.isActive
        }
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to create user'
      };
    }
  }

  @Put(':id/role')
  @UseGuards(PermissionGuard)
  @RequireUserManagement()
  @EnableAuditLog()
  async updateUserRole(@Param('id') userId: string, @Body() updateData: { role: UserRole }, @Request() req: any): Promise<UserManagementResponse> {
    try {
      const success = await this.userService.updateUserRole(userId, updateData.role);
      if (success) {
        const user = await this.userService.getUserById(userId);
        return {
          success: true,
          message: `User role updated to ${updateData.role}`,
          user: user ? {
            id: user.id,
            username: user.username,
            role: user.role,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin,
            isActive: user.isActive
          } : undefined
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

  @Put(':id/password')
  @UseGuards(PermissionGuard)
  @RequireUserManagement()
  @EnableAuditLog()
  async resetUserPassword(@Param('id') userId: string, @Body() passwordData: { password: string }, @Request() req: any): Promise<UserManagementResponse> {
    try {
      const success = await this.userService.resetUserPassword(userId, passwordData.password);
      if (success) {
        return {
          success: true,
          message: 'Password reset successfully'
        };
      } else {
        return {
          success: false,
          message: 'User not found or password reset failed'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Failed to reset password'
      };
    }
  }

  @Put(':id/deactivate')
  @UseGuards(PermissionGuard)
  @RequireUserManagement()
  @EnableAuditLog()
  async deactivateUser(@Param('id') userId: string, @Request() req: any): Promise<UserManagementResponse> {
    try {
      const success = await this.userService.deactivateUser(userId);
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

  @Put(':id/activate')
  @UseGuards(PermissionGuard)
  @RequireUserManagement()
  @EnableAuditLog()
  async activateUser(@Param('id') userId: string, @Request() req: any): Promise<UserManagementResponse> {
    try {
      const success = await this.userService.activateUser(userId);
      if (success) {
        return {
          success: true,
          message: 'User activated successfully'
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
        message: 'Failed to activate user'
      };
    }
  }

  @Get('stats/roles')
  @UseGuards(PermissionGuard)
  @RequireModerator()
  async getRoleStatistics(): Promise<{
    success: boolean;
    stats?: { role: UserRole; count: number }[];
    message: string;
  }> {
    try {
      const users = await this.userService.getAllUsers();
      const roleStats = users.reduce((acc, user) => {
        const existing = acc.find(stat => stat.role === user.role);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ role: user.role, count: 1 });
        }
        return acc;
      }, [] as { role: UserRole; count: number }[]);

      return {
        success: true,
        stats: roleStats,
        message: 'Role statistics retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve role statistics'
      };
    }
  }
}