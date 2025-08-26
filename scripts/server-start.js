#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting MUD Engine Server...');

// Check if we're in development or production
const isDevelopment = process.env.NODE_ENV !== 'production';

// Build the server if needed
if (!isDevelopment) {
  console.log('📦 Building production server...');
  const buildProcess = spawn('npm', ['run', 'build'], {
    stdio: 'inherit',
    shell: true
  });

  buildProcess.on('close', (code) => {
    if (code !== 0) {
      console.error('❌ Build failed');
      process.exit(1);
    }
    startServer();
  });
} else {
  startServer();
}

function startServer() {
  const serverPath = isDevelopment
    ? 'node -r ts-node/register -r tsconfig-paths/register server/index.ts'
    : 'node dist/server/index.js';

  console.log(`📡 Starting server with: ${serverPath}`);

  const serverProcess = spawn(serverPath, [], {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      NODE_ENV: isDevelopment ? 'development' : 'production'
    }
  });

  // Save PID for later stopping
  const pidFile = path.join(__dirname, '..', 'server.pid');
  fs.writeFileSync(pidFile, serverProcess.pid.toString());

  serverProcess.on('close', (code) => {
    console.log(`📴 Server process exited with code ${code}`);
    // Clean up PID file
    if (fs.existsSync(pidFile)) {
      fs.unlinkSync(pidFile);
    }
  });

  serverProcess.on('error', (error) => {
    console.error('❌ Failed to start server:', error);
    if (fs.existsSync(pidFile)) {
      fs.unlinkSync(pidFile);
    }
    process.exit(1);
  });

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n📴 Received SIGINT, stopping server...');
    serverProcess.kill('SIGINT');
  });

  process.on('SIGTERM', () => {
    console.log('\n📴 Received SIGTERM, stopping server...');
    serverProcess.kill('SIGTERM');
  });
}