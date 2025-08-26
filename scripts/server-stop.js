#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('📴 Stopping MUD Engine Server...');

function cleanup() {
  if (fs.existsSync(pidFile)) {
    fs.unlinkSync(pidFile);
    console.log('🧹 Cleaned up PID file');
  }
}

const pidFile = path.join(__dirname, '..', 'server.pid');

if (!fs.existsSync(pidFile)) {
  console.log('❌ No server PID file found. Server may not be running.');
  process.exit(1);
}

try {
  const pid = parseInt(fs.readFileSync(pidFile, 'utf8').trim());

  console.log(`📍 Found server process with PID: ${pid}`);

  // Check if process is still running
  try {
    process.kill(pid, 0); // This will throw if process doesn't exist
  } catch (error) {
    console.log('❌ Server process is not running');
    fs.unlinkSync(pidFile);
    process.exit(1);
  }

  // Send SIGTERM first
  console.log('📴 Sending SIGTERM to server process...');
  process.kill(pid, 'SIGTERM');

  // Wait for graceful shutdown
  let attempts = 0;
  const maxAttempts = 30; // 30 seconds timeout
  const checkInterval = 1000; // 1 second

  const checkProcess = setInterval(() => {
    attempts++;

    try {
      process.kill(pid, 0);
      if (attempts >= maxAttempts) {
        console.log('⏰ Timeout reached, force killing server process...');
        process.kill(pid, 'SIGKILL');
        clearInterval(checkInterval);
        cleanup();
        return;
      }
      console.log(`⏳ Waiting for server to shutdown gracefully... (${attempts}/${maxAttempts})`);
    } catch (error) {
      // Process has exited
      clearInterval(checkInterval);
      console.log('✅ Server stopped successfully');
      cleanup();
    }
  }, checkInterval);

} catch (error) {
  console.error('❌ Error stopping server:', error);
  process.exit(1);
}