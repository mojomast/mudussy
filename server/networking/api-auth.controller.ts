import { Controller, Post, Body } from '@nestjs/common';
import { WebClientService } from './web-client.service';
import { UserService } from './user.service';
import { UserRole } from './user.types';

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

@Controller('api/auth')
export class ApiAuthController {
  constructor(
    private readonly webClientService: WebClientService,
    private readonly userService: UserService
  ) {}

  @Post('login')
  async login(@Body() authRequest: AuthRequest): Promise<AuthResponse> {
    try {
      const authResult = await this.userService.authenticateUser(
        authRequest.username,
        authRequest.password || 'password'
      );

      if (authResult.success && authResult.userId) {
        const tempClientId = `rest_${Date.now()}_${Math.random()}`;
        await this.webClientService.createWebSession(tempClientId);

        const persistentData = await this.webClientService.loadPersistentSession(tempClientId, authResult.userId);

        const result = await this.webClientService.authenticateWebSessionWithRole(
          tempClientId,
          authResult.username!,
          authRequest.password || 'password',
          authResult.userId,
          authResult.role!
        );

        if (result.success) {
          await this.webClientService.saveSessionForPersistence(tempClientId);

          // Shim: use userId as Bearer for guard compatibility; sessionId provided for tests
          const token = `${authResult.userId}`;

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
}
