/**
 * Simple debug test to understand data flow
 */

const net = require('net');

const server = net.createServer((socket) => {
    console.log('Client connected');

    socket.write('Welcome to the MUD Test Server!\r\n');
    socket.write('What is your name? ');

    socket.on('data', (data) => {
        const input = data.toString().trim();
        console.log(`Received: "${input}"`);

        if (input) {
            socket.write(`\r\nWelcome, ${input}!\r\n`);
            socket.write('> ');
        }
    });

    socket.on('close', () => {
        console.log('Client disconnected');
    });
});

server.listen(3002, () => {
    console.log('Debug server listening on port 3002');
});

// Test client
setTimeout(() => {
    const client = net.createConnection(3002, 'localhost');

    let buffer = '';

    client.on('data', (data) => {
        const chunk = data.toString();
        console.log(`Client received: "${chunk.replace(/\r?\n/g, '\\n')}"`);
        buffer += chunk;

        // Process complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop();

        lines.forEach(line => {
            const trimmed = line.trim();
            if (trimmed) {
                console.log(`Client line: "${trimmed}"`);
            }
        });
    });

    client.on('connect', () => {
        console.log('Client connected');

        setTimeout(() => {
            console.log('Sending username...');
            client.write('TestUser\r\n');
        }, 1000);
    });

    client.on('close', () => {
        console.log('Client disconnected');
        server.close();
    });

}, 1000);