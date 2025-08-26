
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
