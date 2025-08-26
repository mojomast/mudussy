// MUD Engine Debugging Server
// This script helps identify and resolve circular dependencies and startup issues

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 MUD Engine Debug Server');
console.log('===========================\n');

// Check for circular dependencies
function checkCircularDependencies() {
  console.log('🔍 Checking for circular dependencies...');

  const files = [
    'server/index.ts',
    'server/app.module.ts',
    'server/engine/engine.module.ts',
    'server/networking/networking.module.ts'
  ];

  files.forEach(function(file) {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      console.log('📄 ' + file + ':');
      const imports = content.match(/import.*from ['"]([^'"]+)['"]/g) || [];
      imports.forEach(function(imp) {
        console.log('  ' + imp);
      });
      console.log('');
    }
  });
}

// Simple server without complex dependencies
function startSimpleServer() {
  console.log('🚀 Starting simple debug server...');

  const serverCode = `
const http = require('http');
require('dotenv').config();

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('MUD Engine Debug Server - Port: ' + (process.env.MUD_PORT || 4000));
});

const port = process.env.MUD_PORT || 4000;
server.listen(port, () => {
  console.log('✅ Debug server running on port ' + port);
  console.log('🌐 Test connection: http://localhost:' + port);
});
`;

  fs.writeFileSync('debug-simple.js', serverCode);

  const debugProcess = spawn('node', ['debug-simple.js'], {
    stdio: 'inherit',
    shell: true
  });

  return debugProcess;
}

// Health check function
function healthCheck() {
  console.log('🏥 Running health checks...');

  const checks = [
    { name: 'Node.js version', cmd: 'node --version' },
    { name: 'NPM version', cmd: 'npm --version' },
    { name: 'Environment file', check: function() { return fs.existsSync('.env'); } },
    { name: 'Dependencies', check: function() { return fs.existsSync('node_modules'); } },
    { name: 'Server directory', check: function() { return fs.existsSync('server'); } },
    { name: 'Engine directory', check: function() { return fs.existsSync('engine'); } }
  ];

  checks.forEach(function(check) {
    if (check.cmd) {
      try {
        const result = require('child_process').execSync(check.cmd, { encoding: 'utf8' }).trim();
        console.log('✅ ' + check.name + ': ' + result);
      } catch (error) {
        console.log('❌ ' + check.name + ': Failed');
      }
    } else if (check.check) {
      const result = check.check();
      console.log((result ? '✅' : '❌') + ' ' + check.name + ': ' + (result ? 'Present' : 'Missing'));
    }
  });
}

// Main execution
function main() {
  healthCheck();
  console.log('');

  checkCircularDependencies();
  console.log('');

  // Try to start simple server
  const debugProcess = startSimpleServer();

  // Handle graceful shutdown
  process.on('SIGINT', function() {
    console.log('\n📴 Shutting down debug server...');
    debugProcess.kill('SIGINT');
    if (fs.existsSync('debug-simple.js')) {
      fs.unlinkSync('debug-simple.js');
    }
    process.exit(0);
  });
}

main();