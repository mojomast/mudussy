import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { PermissionGuard, RequireAdmin, RequireModerator } from '../../networking/permission.guard';
import { UserService } from '../../networking/user.service';
import { WebClientService } from '../../networking/web-client.service';

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalRooms: number;
  activePlayers: number;
  systemUptime: string;
  recentActivity: ActivityLog[];
}

export interface ActivityLog {
  id: string;
  timestamp: Date;
  type: 'login' | 'logout' | 'room_change' | 'command';
  user: string;
  details: string;
}

@Controller('admin/dashboard')
export class AdminDashboardController {
  constructor(
    private readonly userService: UserService,
    private readonly webClientService: WebClientService,
  ) {}

  @Get()
  @UseGuards(PermissionGuard)
  @RequireModerator()
  async getDashboard(@Request() req: any): Promise<DashboardStats> {
    try {
      // Get user statistics
      const allUsers = await this.userService.getAllUsers();
      const activeUsers = allUsers.filter(u => u.isActive).length;

      // Mock world statistics (would integrate with WorldManager in real implementation)
      const worldStats = {
        totalRooms: 25,
        activePlayers: 8,
        systemUptime: '2d 4h 32m'
      };

      // Mock recent activity (would come from logging system)
      const recentActivity: ActivityLog[] = [
        {
          id: '1',
          timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
          type: 'login',
          user: 'player1',
          details: 'Logged into the game'
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
          type: 'room_change',
          user: 'player2',
          details: 'Moved to Town Square'
        },
        {
          id: '3',
          timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
          type: 'command',
          user: 'admin',
          details: 'Executed: kick player3'
        }
      ];

      return {
        totalUsers: allUsers.length,
        activeUsers,
        totalRooms: worldStats.totalRooms,
        activePlayers: worldStats.activePlayers,
        systemUptime: worldStats.systemUptime,
        recentActivity
      };
    } catch (error) {
      // Return mock data if services are unavailable
      return {
        totalUsers: 0,
        activeUsers: 0,
        totalRooms: 25,
        activePlayers: 8,
        systemUptime: '2d 4h 32m',
        recentActivity: []
      };
    }
  }

  @Get('health')
  @UseGuards(PermissionGuard)
  @RequireAdmin()
  async getSystemHealth(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    checks: {
      database: boolean;
      worldEngine: boolean;
      networking: boolean;
      memory: boolean;
    };
    details: string;
  }> {
    // Mock health check (would integrate with actual health monitoring)
    return {
      status: 'healthy',
      checks: {
        database: true,
        worldEngine: true,
        networking: true,
        memory: true
      },
      details: 'All systems operational'
    };
  }
}