import { Module, Global } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { ConfigService } from '../config/config.service';
import { Logger } from '../logger/logger.service';

@Global()
@Module({
  providers: [MetricsService, ConfigService, Logger],
  exports: [MetricsService]
})
export class MetricsModule {}