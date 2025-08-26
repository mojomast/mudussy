import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { MetricsModule } from '../metrics/metrics.module';
import { ConfigService } from '../config/config.service';
import { Logger } from '../logger/logger.service';

@Module({
  imports: [MetricsModule],
  controllers: [HealthController],
  providers: [HealthService, ConfigService, Logger],
  exports: [HealthService]
})
export class HealthModule {}