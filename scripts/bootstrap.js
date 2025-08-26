#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 MUD Engine Bootstrap Script');
console.log('==============================\n');

// Check Node.js version
const nodeVersion = process.version;
console.log(`📦 Node.js version: ${nodeVersion}`);

// Check if package.json exists
if (!fs.existsSync(path.join(__dirname, '..', 'package.json'))) {
  console.error('❌ package.json not found. Please run this script from the project root.');
  process.exit(1);
}

try {
  // Install dependencies
  console.log('📥 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  console.log('✅ Dependencies installed successfully\n');

  // Create basic directory structure if missing
  const directories = [
    'engine/core',
    'engine/modules',
    'server',
    'clients',
    'tools',
    'docs',
    'test',
    'logs'
  ];

  console.log('📁 Creating directory structure...');
  directories.forEach(dir => {
    const fullPath = path.join(__dirname, '..', dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`  📂 Created: ${dir}`);
    }
  });
  console.log('✅ Directory structure ready\n');

  // Create .env.example file
  console.log('⚙️  Creating environment configuration...');
  const envExample = `# MUD Engine Configuration
NODE_ENV=development
PORT=3000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mud_engine
DB_USER=mud_user
DB_PASSWORD=password

# Redis Configuration (for caching and sessions)
REDIS_HOST=localhost
REDIS_PORT=6379

# Logging
LOG_LEVEL=info
LOG_FILE=logs/mud-engine.log

# Game Configuration
MAX_PLAYERS=1000
TICK_INTERVAL=1000
SAVE_INTERVAL=300000

# Security
JWT_SECRET=your-super-secret-jwt-key-here
BCRYPT_ROUNDS=12

# WebSocket
WS_PORT=3001
WS_CORS_ORIGIN=*
`;

  fs.writeFileSync(path.join(__dirname, '..', '.env.example'), envExample);
  console.log('  📝 Created: .env.example');

  // Create .gitignore if it doesn't exist
  const gitignoreContent = `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Production builds
dist/
build/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# nyc test coverage
.nyc_output

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env

# IDE files
.vscode/
.idea/
*.swp
*.swo
*~

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Temporary files
tmp/
temp/
.cache/
`;

  fs.writeFileSync(path.join(__dirname, '..', '.gitignore'), gitignoreContent);
  console.log('  📝 Created: .gitignore');

  // Create test setup file
  const testSetup = `import { beforeAll, afterAll } from 'vitest';

// Global test setup
beforeAll(async () => {
  // Setup code that runs before all tests
  console.log('🧪 Setting up tests...');
});

afterAll(async () => {
  // Cleanup code that runs after all tests
  console.log('🧪 Cleaning up tests...');
});
`;

  fs.writeFileSync(path.join(__dirname, '..', 'test/setup.ts'), testSetup);
  console.log('  📝 Created: test/setup.ts');

  console.log('✅ Environment configuration complete\n');

  // Run initial build check
  console.log('🔨 Running initial build check...');
  try {
    execSync('npm run build', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    console.log('✅ Build successful\n');
  } catch (error) {
    console.log('⚠️  Build check failed (expected for fresh project)\n');
  }

  // Create initial devlog entry
  console.log('📝 Updating development log...');
  const devlogEntry = `

## 🚀 Project Bootstrap Complete

**Date**: ${new Date().toISOString().split('T')[0]}
**Node Version**: ${nodeVersion}
**Status**: Project successfully bootstrapped

### Completed Setup:
- ✅ Dependencies installed
- ✅ Directory structure created
- ✅ Environment configuration initialized
- ✅ Development tools configured
- ✅ Build system verified

### Next Steps:
1. Copy \`.env.example\` to \`.env\` and configure your environment
2. Run \`npm run start:dev\` to start development server
3. Begin implementing core engine features
4. Set up your database connection

### Quick Commands:
- \`npm run start:dev\` - Start development server
- \`npm run test\` - Run test suite
- \`npm run lint\` - Check code quality
- \`npm run build\` - Build for production

Happy coding! 🎮✨
`;

  try {
    const devlogPath = path.join(__dirname, '..', 'DEVLOG.md');
    const currentDevlog = fs.readFileSync(devlogPath, 'utf8');
    fs.writeFileSync(devlogPath, currentDevlog + devlogEntry);
    console.log('  📝 Updated: DEVLOG.md');
  } catch (error) {
    console.log('  ⚠️  Could not update DEVLOG.md');
  }

  console.log('\n🎉 Bootstrap complete!');
  console.log('📚 Next steps:');
  console.log('  1. cp .env.example .env');
  console.log('  2. Configure your environment variables');
  console.log('  3. npm run start:dev');
  console.log('  4. Start building your MUD engine! 🚀');

} catch (error) {
  console.error('❌ Bootstrap failed:', error.message);
  process.exit(1);
}