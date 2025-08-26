import { Module } from '@nestjs/common';
import { WebSocketGateway } from './websocket.gateway';
import { AuthController } from './auth.controller';
import { ApiAuthController } from './api-auth.controller';
import { CommandsController } from './commands.controller';
import { WorldController } from './world.controller';
import { WebClientService } from './web-client.service';
import { UserService } from './user.service';
import { PermissionGuard } from './permission.guard';
import { EngineModule } from '../engine/engine.module';

@Module({
  imports: [EngineModule],
  controllers: [AuthController, ApiAuthController, CommandsController, WorldController],
  providers: [WebSocketGateway, WebClientService, UserService, PermissionGuard],
  exports: [WebClientService, WebSocketGateway, UserService],
})
export class NetworkingModule {}