import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as express from 'express';

// Load environment variables
dotenv.config();

async function bootstrap() {
  console.log('🚀 Starting MUD Engine Server with Web Client...');

  try {
    // Create NestJS application
    const app = await NestFactory.create(AppModule);

    // Enable CORS for web client
    app.enableCors({
      origin: true, // Allow all origins for development
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
    });

    // Get port from environment or default
    const port = process.env.MUD_WEB_PORT ? parseInt(process.env.MUD_WEB_PORT) : 3000;
    const host = process.env.MUD_WEB_HOST || 'localhost';

    // Serve static web client at root using Express (not affected by global prefix)
    const clientsPath = path.join(process.cwd(), 'clients');
    app.use(express.static(clientsPath));

    // Fallback root route to SPA index (avoid intercepting /api or /socket.io)
    const httpAdapter = app.getHttpAdapter();
    const instance = httpAdapter?.getInstance?.();
    if (instance && instance.get) {
      instance.get('/', (_req: any, res: any) => res.sendFile(path.join(clientsPath, 'index.html')));
    }

    // Set global API prefix for Nest controllers
    app.setGlobalPrefix('api');

    // Start the server
    await app.listen(port, host);

  // Static web client is served by ServeStaticModule at '/'

    console.log('✅ MUD Engine Server started successfully!');
    console.log(`🌐 Web client available at http://${host}:${port}`);
    console.log(`📡 WebSocket server running on ws://${host}:${port}`);
    console.log(`📡 REST API available at http://${host}:${port}/api`);
    console.log('🎮 Ready to accept web connections');

    // Handle graceful shutdown
    const shutdown = async (signal: string) => {
      console.log(`\n📴 Received ${signal}, shutting down gracefully...`);
      try {
        await app.close();
        console.log('✅ Server stopped successfully');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught exception:', error);
      shutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled rejection at:', promise, 'reason:', reason);
      shutdown('unhandledRejection');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();