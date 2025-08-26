import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { UserService } from '../networking/user.service';
export interface AuthenticatedRequest extends Request {
    user?: any;
    session?: any;
}
export declare class SessionMiddleware implements NestMiddleware {
    private readonly userService;
    private readonly logger;
    constructor(userService: UserService);
    use(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    private extractUserId;
    private extractToken;
    private getUserPermissions;
    private isAdminOperation;
}
