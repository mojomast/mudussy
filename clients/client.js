class MUDWebClient {
    constructor() {
        this.socket = null;
        this.connected = false;
        this.authenticated = false;
        this.username = null;

        this.initElements();
        this.initEventListeners();
    }

    initElements() {
        this.statusElement = document.getElementById('status');
        this.authForm = document.getElementById('authForm');
        this.gameContainer = document.getElementById('gameContainer');
        this.usernameInput = document.getElementById('usernameInput');
        this.authButton = document.getElementById('authButton');
        this.outputElement = document.getElementById('output');
        this.commandInput = document.getElementById('commandInput');
        this.sendButton = document.getElementById('sendButton');
    this.dialogueIndicator = document.getElementById('dialogueIndicator');
    }

    initEventListeners() {
        // Authentication
        this.authButton.addEventListener('click', () => this.authenticate());
        this.usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.authenticate();
        });

        // Command input
        this.sendButton.addEventListener('click', () => this.sendCommand());
        this.commandInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendCommand();
        });
    }

    connect() {
        try {
            // Connect to Socket.IO server (served by Nest at the same origin)
            this.socket = io('/', { transports: ['websocket', 'polling'] });

            this.socket.on('connect', () => {
                this.connected = true;
                this.updateStatus('Connected', 'connected');
                this.addMessage('Connected to MUD Engine', 'system');
            });

            this.socket.on('disconnect', () => {
                this.connected = false;
                this.authenticated = false;
                this.updateStatus('Disconnected', 'disconnected');
                this.addMessage('Disconnected from server', 'error');
                this.showAuthForm();
            });

            this.socket.on('message', (payload) => {
                // Generic message from gateway
                if (payload?.content) {
                    this.addMessage(payload.content, 'system');
                    // Toggle dialogue indicator based on hints
                    const text = String(payload.content).toLowerCase();
                    if (text.includes('[dialogue mode enabled]')) {
                        this.setDialogueIndicator(true);
                    } else if (text.includes('[dialogue mode disabled]') || text.includes('[this conversation has ended]')) {
                        this.setDialogueIndicator(false);
                    }
                }
            });

            this.socket.on('auth_required', (payload) => {
                this.addMessage(payload?.message || 'Authentication required', 'system');
            });

            this.socket.on('authenticated', (payload) => {
                this.authenticated = true;
                this.username = payload?.username || this.username;
                this.updateStatus(`Connected as ${this.username}`, 'connected');
                this.hideAuthForm();
                this.showGameInterface();
                if (payload?.message) this.addMessage(payload.message, 'system');
            });

            this.socket.on('game_state', (game) => {
                if (game?.location) {
                    this.addMessage(`Location: ${game.location}`, 'system');
                }
                if (game?.description) this.addMessage(game.description, 'system');
            });

            this.socket.on('command_response', (resp) => {
                if (resp?.response) {
                    const msg = String(resp.response);
                    this.addMessage(msg, 'system');
                    if (msg.toLowerCase().includes('[this conversation has ended]')) {
                        this.setDialogueIndicator(false);
                    }
                }
            });

            this.socket.on('command_error', (err) => {
                if (err?.error) this.addMessage(String(err.error), 'error');
            });

        } catch (error) {
            this.addMessage('Failed to connect to server', 'error');
            console.error('Connection error:', error);
        }
    }

    setDialogueIndicator(on) {
        if (!this.dialogueIndicator) return;
        if (on) this.dialogueIndicator.classList.add('show');
        else this.dialogueIndicator.classList.remove('show');
    }

    authenticate() {
        const username = this.usernameInput.value.trim();
        if (!username) {
            alert('Please enter a username');
            return;
        }

    this.updateStatus('Authenticating...', 'authenticating');
    this.username = username;
    // Send authenticate event to server
    this.socket.emit('authenticate', { username });
    }

    sendCommand() {
        if (!this.connected) return;

        const command = this.commandInput.value.trim();
        if (!command) return;

        // Add command to output
        this.addMessage(`> ${command}`, 'user');

        // Send command to server
    this.socket.emit('command', { command });

        // Clear input
        this.commandInput.value = '';
    }

    addMessage(content, type = 'system') {
    const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
    messageDiv.textContent = this.stripAnsi(String(content));
        this.outputElement.appendChild(messageDiv);

        // Auto-scroll to bottom
        this.outputElement.scrollTop = this.outputElement.scrollHeight;
    }

    updateStatus(text, className) {
        this.statusElement.textContent = text;
        this.statusElement.className = `status ${className}`;
    }

    showAuthForm() {
        this.authForm.classList.add('show');
        this.gameContainer.style.display = 'none';
        this.usernameInput.focus();
    }

    hideAuthForm() {
        this.authForm.classList.remove('show');
    }

    showGameInterface() {
        this.gameContainer.style.display = 'flex';
        this.commandInput.disabled = false;
        this.sendButton.disabled = false;
        this.commandInput.focus();
    }

    // Format exits array into direction names
    formatExits(exits) {
        if (!exits || !Array.isArray(exits)) {
            return 'none';
        }
        const directions = exits.map(exit => exit.direction || 'unknown');
        return directions.join(', ');
    }

    // Initialize when page loads
    initialize() {
        this.connect();
    }

    // Strip ANSI escape sequences
    stripAnsi(input) {
        if (!input) return input;
        const ansiRegex = /[\u001B\u009B][[\]()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;
        return input.replace(ansiRegex, '');
    }
}

// Create and initialize the client
const mudClient = new MUDWebClient();

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    mudClient.initialize();
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (mudClient.socket && mudClient.socket.readyState === WebSocket.OPEN) {
        mudClient.socket.close();
    }
});