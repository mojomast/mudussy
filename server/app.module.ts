import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
// import { ServeStaticModule } from '@nestjs/serve-static';
// import * as path from 'path';
import { WebController } from './web/web.controller';
import { ConfigModule } from '@nestjs/config';
import { EngineModule } from './engine/engine.module';
import { NetworkingModule } from './networking/networking.module';
import { WorldModule } from './world/world.module';
import { AdminModule } from './admin/admin.module';
import { HealthModule } from './health/health.module';
import { MetricsModule } from './metrics/metrics.module';
import { ShutdownModule } from './shutdown/shutdown.module';
import { ConfigService } from './config/config.service';
import { Logger } from './logger/logger.service';
import { CorrelationIdMiddleware } from './middleware/correlation-id.middleware';
import { MetricsMiddleware } from './middleware/metrics.middleware';

@Module({
  imports: [
    // Global configuration module
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      cache: true,
    }),

  // NOTE: ServeStaticModule omitted due to peer version mismatch.
  // WebController serves clients/index.html at '/'.

    // Core engine modules
    EngineModule,
    NetworkingModule,
    WorldModule,
    AdminModule,

    // Observability modules
    HealthModule,
    MetricsModule,
    ShutdownModule,
  ],
  controllers: [WebController],
  providers: [
    ConfigService,
    Logger,
  ],
  exports: [
    ConfigService,
    Logger,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply correlation ID middleware globally
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');

    // Apply metrics middleware globally
    consumer.apply(MetricsMiddleware).forRoutes('*');
  }
}