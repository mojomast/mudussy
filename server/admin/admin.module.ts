import { Module } from '@nestjs/common';
import { AdminDashboardController } from './controllers/admin-dashboard.controller';
import { AdminUserManagementController } from './controllers/admin-user-management.controller';
import { AdminWorldController } from './controllers/admin-world.controller';
import { AdminDialogueController } from './controllers/admin-dialogue.controller';
import { NetworkingModule } from '../networking/networking.module';

@Module({
  imports: [NetworkingModule],
  controllers: [
    AdminDashboardController,
    AdminUserManagementController,
    AdminWorldController,
    AdminDialogueController,
  ],
  providers: [],
  exports: [],
})
export class AdminModule {}