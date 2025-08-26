#!/usr/bin/env node

const express = require('express');
const path = require('path');
const app = express();
const port = process.env.MUD_WEB_PORT || 3000;

// Serve static files from clients directory
app.use(express.static(path.join(__dirname, '..', 'clients')));

// Serve the web client at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'clients', 'index.html'));
});

// API endpoints for testing
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'MUD Engine Web Client API',
    timestamp: new Date().toISOString()
  });
});

console.log('🌐 Starting web client server...');
console.log(`📡 Server will be available at http://localhost:${port}`);
console.log('🎮 Open your browser to start playing!');

app.listen(port, () => {
  console.log(`✅ Web client server running on port ${port}`);
});