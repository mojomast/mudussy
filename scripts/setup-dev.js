#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🛠️  MUD Engine Development Environment Setup');
console.log('==========================================\n');

try {
  const projectRoot = path.join(__dirname, '..');

  // Check if .env exists, if not copy from example
  const envPath = path.join(projectRoot, '.env');
  const envExamplePath = path.join(projectRoot, '.env.example');

  if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
    console.log('📋 Setting up environment variables...');
    fs.copyFileSync(envExamplePath, envPath);
    console.log('  ✅ Created .env from .env.example');
    console.log('  ⚠️  Please edit .env with your specific configuration values\n');
  } else if (fs.existsSync(envPath)) {
    console.log('✅ Environment variables already configured\n');
  }

  // Create additional development directories
  const devDirs = [
    'test/fixtures',
    'test/mocks',
    'test/integration',
    'docs/api',
    'docs/tutorials',
    'tools/dev-scripts',
    'clients/web/public',
    'clients/web/src'
  ];

  console.log('📁 Setting up development directories...');
  devDirs.forEach(dir => {
    const fullPath = path.join(projectRoot, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`  📂 Created: ${dir}`);
    }
  });
  console.log('✅ Development directories ready\n');

  // Create basic NestJS application structure
  console.log('🏗️  Setting up NestJS application structure...');

  // Create main.ts
  const mainTs = `import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for web clients
  app.enableCors();

  // Set global prefix
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(\`🚀 MUD Engine server running on port \${port}\`);
  console.log(\`📚 API Documentation: http://localhost:\${port}/api\`);
}

bootstrap();
`;

  fs.writeFileSync(path.join(projectRoot, 'src', 'main.ts'), mainTs);
  console.log('  📝 Created: src/main.ts');

  // Create app.module.ts
  const appModule = `import { Module } from '@nestjs/common';
import { EngineModule } from './engine/engine.module';
import { ServerModule } from './server/server.module';

@Module({
  imports: [EngineModule, ServerModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
`;

  fs.writeFileSync(path.join(projectRoot, 'src', 'app.module.ts'), appModule);
  console.log('  📝 Created: src/app.module.ts');

  // Create src directory structure
  const srcDirs = [
    'src/engine',
    'src/server',
    'src/clients',
    'src/shared'
  ];

  srcDirs.forEach(dir => {
    const fullPath = path.join(projectRoot, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  });

  console.log('✅ NestJS application structure ready\n');

  // Create basic engine module
  const engineModule = `import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EntityService } from './core/entity.service';
import { EventService } from './core/event.service';

@Module({
  imports: [EventEmitterModule.forRoot()],
  providers: [EntityService, EventService],
  exports: [EntityService, EventService],
})
export class EngineModule {}
`;

  fs.writeFileSync(path.join(projectRoot, 'src', 'engine', 'engine.module.ts'), engineModule);
  console.log('  📝 Created: src/engine/engine.module.ts');

  // Create basic server module
  const serverModule = `import { Module } from '@nestjs/common';
import { EngineModule } from '../engine/engine.module';

@Module({
  imports: [EngineModule],
  providers: [],
  exports: [],
})
export class ServerModule {}
`;

  fs.writeFileSync(path.join(projectRoot, 'src', 'server', 'server.module.ts'), serverModule);
  console.log('  📝 Created: src/server/server.module.ts');

  console.log('✅ Development environment setup complete!\n');

  console.log('🎮 Ready for development!');
  console.log('📚 Quick start guide:');
  console.log('  1. Edit .env with your configuration');
  console.log('  2. npm run start:dev');
  console.log('  3. Visit http://localhost:3000');
  console.log('  4. Start building your MUD engine!\n');

} catch (error) {
  console.error('❌ Development setup failed:', error.message);
  process.exit(1);
}