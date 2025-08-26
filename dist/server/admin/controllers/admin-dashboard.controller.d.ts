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
export declare class AdminDashboardController {
    private readonly userService;
    private readonly webClientService;
    constructor(userService: UserService, webClientService: WebClientService);
    getDashboard(req: any): Promise<DashboardStats>;
    getSystemHealth(): Promise<{
        status: 'healthy' | 'warning' | 'critical';
        checks: {
            database: boolean;
            worldEngine: boolean;
            networking: boolean;
            memory: boolean;
        };
        details: string;
    }>;
}
