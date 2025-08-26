import { Module } from '@nestjs/common';
import { ShutdownService } from './shutdown.service';
import { ConfigService } from '../config/config.service';
import { MetricsModule } from '../metrics/metrics.module';
import { Logger } from '../logger/logger.service';

@Module({
  imports: [MetricsModule],
  providers: [ShutdownService, ConfigService, Logger],
  exports: [ShutdownService]
})
export class ShutdownModule {}