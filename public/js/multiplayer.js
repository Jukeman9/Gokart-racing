// Multiplayer System for GoKart Racing Game

class MultiplayerManager {
    constructor() {
        this.socket = null;
        this.connected = false;
        this.playerId = null;
        this.playerName = '';
        this.roomCode = null;
        this.isHost = false;
        this.players = {};
        this.gameState = null;
        this.serverUrl = this.getServerUrl();
        
        // Network synchronization
        this.lastSyncTime = 0;
        this.syncInterval = 1000 / 20; // 20 Hz sync rate
        this.interpolationDelay = 100; // ms
        
        // Event handlers
        this.eventHandlers = {};
        
        // Connection status
        this.connectionStatus = 'disconnected';
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        
        this.initialize();
    }

    getServerUrl() {
        // For development and production
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        
        // Use environment variable or fallback to current host
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return `${protocol}//${host}`;
        } else {
            // Production server URL (will be set during deployment)
            return `${protocol}//${host}`;
        }
    }

    initialize() {
        this.playerId = Utils.generatePlayerId();
        this.playerName = this.loadPlayerName();
        
        console.log('Multiplayer Manager initialized');
        console.log('Player ID:', this.playerId);
        console.log('Server URL:', this.serverUrl);
    }

    // Connection management
    async connect() {
        if (this.connected || this.socket) {
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            try {
                this.socket = new WebSocket(this.serverUrl);
                this.connectionStatus = 'connecting';
                this.updateConnectionStatus();

                this.socket.onopen = () => {
                    console.log('Connected to multiplayer server');
                    this.connected = true;
                    this.connectionStatus = 'connected';
                    this.reconnectAttempts = 0;
                    
                    // Send initial player data
                    this.sendMessage('playerJoin', {
                        playerId: this.playerId,
                        playerName: this.playerName
                    });
                    
                    this.updateConnectionStatus();
                    resolve();
                };

                this.socket.onmessage = (event) => {
                    this.handleMessage(JSON.parse(event.data));
                };

                this.socket.onclose = (event) => {
                    console.log('Disconnected from server:', event.code, event.reason);
                    this.handleDisconnection();
                };

                this.socket.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    this.connectionStatus = 'error';
                    this.updateConnectionStatus();
                    reject(error);
                };

                // Timeout after 10 seconds
                setTimeout(() => {
                    if (this.connectionStatus === 'connecting') {
                        this.socket.close();
                        reject(new Error('Connection timeout'));
                    }
                }, 10000);

            } catch (error) {
                console.error('Failed to create WebSocket connection:', error);
                this.connectionStatus = 'error';
                this.updateConnectionStatus();
                reject(error);
            }
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.close();
        }
        this.cleanup();
    }

    handleDisconnection() {
        this.connected = false;
        this.socket = null;
        this.connectionStatus = 'disconnected';
        this.updateConnectionStatus();
        
        this.emit('disconnected');
        
        // Auto-reconnect if in a room and not intentional disconnect
        if (this.roomCode && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.attemptReconnect();
        }
    }

    async attemptReconnect() {
        this.reconnectAttempts++;
        this.connectionStatus = 'reconnecting';
        this.updateConnectionStatus();
        
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        
        setTimeout(async () => {
            try {
                await this.connect();
                if (this.roomCode) {
                    await this.joinRoom(this.roomCode);
                }
            } catch (error) {
                console.error('Reconnection failed:', error);
                if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                    this.emit('reconnectionFailed');
                }
            }
        }, 2000 * this.reconnectAttempts); // Exponential backoff
    }

    // Message handling
    sendMessage(type, data = {}) {
        if (!this.connected || !this.socket) {
            console.warn('Cannot send message: not connected');
            return false;
        }

        const message = {
            type,
            playerId: this.playerId,
            timestamp: Date.now(),
            ...data
        };

        try {
            this.socket.send(JSON.stringify(message));
            return true;
        } catch (error) {
            console.error('Failed to send message:', error);
            return false;
        }
    }

    handleMessage(message) {
        const { type, data } = message;

        switch (type) {
            case 'playerJoined':
                this.handlePlayerJoined(data);
                break;
            case 'playerLeft':
                this.handlePlayerLeft(data);
                break;
            case 'roomCreated':
                this.handleRoomCreated(data);
                break;
            case 'roomJoined':
                this.handleRoomJoined(data);
                break;
            case 'roomLeft':
                this.handleRoomLeft(data);
                break;
            case 'gameStateUpdate':
                this.handleGameStateUpdate(data);
                break;
            case 'raceStarted':
                this.handleRaceStarted(data);
                break;
            case 'raceFinished':
                this.handleRaceFinished(data);
                break;
            case 'playerPositionUpdate':
                this.handlePlayerPositionUpdate(data);
                break;
            case 'chatMessage':
                this.handleChatMessage(data);
                break;
            case 'error':
                this.handleError(data);
                break;
            default:
                console.warn('Unknown message type:', type);
        }

        this.emit(type, data);
    }

    // Room management
    async createRoom() {
        if (!this.connected) {
            await this.connect();
        }

        this.roomCode = Utils.generateRoomCode();
        this.isHost = true;

        this.sendMessage('createRoom', {
            roomCode: this.roomCode,
            hostId: this.playerId,
            hostName: this.playerName
        });

        return this.roomCode;
    }

    async joinRoom(roomCode) {
        if (!this.connected) {
            await this.connect();
        }

        this.sendMessage('joinRoom', {
            roomCode: roomCode,
            playerId: this.playerId,
            playerName: this.playerName
        });

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Join room timeout'));
            }, 10000);

            const handleJoined = (data) => {
                clearTimeout(timeout);
                this.off('roomJoined', handleJoined);
                this.off('error', handleError);
                resolve(data);
            };

            const handleError = (error) => {
                clearTimeout(timeout);
                this.off('roomJoined', handleJoined);
                this.off('error', handleError);
                reject(new Error(error.message || 'Failed to join room'));
            };

            this.on('roomJoined', handleJoined);
            this.on('error', handleError);
        });
    }

    leaveRoom() {
        if (this.roomCode) {
            this.sendMessage('leaveRoom', {
                roomCode: this.roomCode
            });
        }
        
        this.roomCode = null;
        this.isHost = false;
        this.players = {};
        this.gameState = null;
    }

    // Game synchronization
    sendPlayerUpdate(kart) {
        if (!this.connected || !this.roomCode || !kart) return;

        const now = Date.now();
        if (now - this.lastSyncTime < this.syncInterval) return;

        this.lastSyncTime = now;

        const playerData = {
            x: kart.x,
            y: kart.y,
            rotation: kart.rotation,
            velocity: {
                x: kart.physics.velocityX,
                y: kart.physics.velocityY
            },
            speed: kart.physics.speed,
            timestamp: now
        };

        this.sendMessage('playerPositionUpdate', playerData);
    }

    sendGameStateUpdate(gameState) {
        if (!this.isHost || !this.connected) return;

        this.sendMessage('gameStateUpdate', {
            gameState: gameState,
            timestamp: Date.now()
        });
    }

    startRace() {
        if (!this.isHost) return;

        this.sendMessage('startRace', {
            timestamp: Date.now()
        });
    }

    // Event handlers
    handlePlayerJoined(data) {
        this.players[data.playerId] = data;
        console.log('Player joined:', data.playerName);
    }

    handlePlayerLeft(data) {
        delete this.players[data.playerId];
        console.log('Player left:', data.playerName);
    }

    handleRoomCreated(data) {
        this.roomCode = data.roomCode;
        this.isHost = true;
        console.log('Room created:', this.roomCode);
    }

    handleRoomJoined(data) {
        this.roomCode = data.roomCode;
        this.players = data.players || {};
        this.isHost = data.hostId === this.playerId;
        console.log('Joined room:', this.roomCode);
    }

    handleRoomLeft(data) {
        this.roomCode = null;
        this.isHost = false;
        this.players = {};
        console.log('Left room');
    }

    handleGameStateUpdate(data) {
        this.gameState = data.gameState;
    }

    handleRaceStarted(data) {
        console.log('Race started by host');
    }

    handleRaceFinished(data) {
        console.log('Race finished:', data.results);
    }

    handlePlayerPositionUpdate(data) {
        if (data.playerId === this.playerId) return; // Ignore own updates

        const player = this.players[data.playerId];
        if (player) {
            // Store position data with timestamp for interpolation
            if (!player.positionHistory) {
                player.positionHistory = [];
            }

            player.positionHistory.push({
                x: data.x,
                y: data.y,
                rotation: data.rotation,
                velocity: data.velocity,
                timestamp: data.timestamp
            });

            // Keep only recent history (last 500ms)
            const cutoff = Date.now() - 500;
            player.positionHistory = player.positionHistory.filter(p => p.timestamp > cutoff);
        }
    }

    handleChatMessage(data) {
        console.log(`${data.playerName}: ${data.message}`);
    }

    handleError(data) {
        console.error('Server error:', data.message);
    }

    // Position interpolation for smooth multiplayer movement
    getInterpolatedPlayerPosition(playerId) {
        const player = this.players[playerId];
        if (!player || !player.positionHistory || player.positionHistory.length === 0) {
            return null;
        }

        const now = Date.now() - this.interpolationDelay;
        const history = player.positionHistory;

        // Find the two positions to interpolate between
        let before = null;
        let after = null;

        for (let i = 0; i < history.length - 1; i++) {
            if (history[i].timestamp <= now && history[i + 1].timestamp >= now) {
                before = history[i];
                after = history[i + 1];
                break;
            }
        }

        if (!before || !after) {
            // Use the most recent position
            return history[history.length - 1];
        }

        // Interpolate between the two positions
        const timeDiff = after.timestamp - before.timestamp;
        const factor = (now - before.timestamp) / timeDiff;

        return {
            x: Utils.lerp(before.x, after.x, factor),
            y: Utils.lerp(before.y, after.y, factor),
            rotation: Utils.lerp(before.rotation, after.rotation, factor),
            velocity: {
                x: Utils.lerp(before.velocity.x, after.velocity.x, factor),
                y: Utils.lerp(before.velocity.y, after.velocity.y, factor)
            }
        };
    }

    // Player management
    setPlayerName(name) {
        this.playerName = Utils.sanitizePlayerName(name);
        this.savePlayerName();
        
        if (this.connected) {
            this.sendMessage('updatePlayerInfo', {
                playerName: this.playerName
            });
        }
    }

    getPlayerList() {
        return Object.values(this.players);
    }

    getPlayerCount() {
        return Object.keys(this.players).length;
    }

    isRoomHost() {
        return this.isHost;
    }

    getRoomCode() {
        return this.roomCode;
    }

    // Chat system
    sendChatMessage(message) {
        if (!this.connected || !this.roomCode) return false;

        this.sendMessage('chatMessage', {
            message: message.trim().substring(0, 200), // Limit message length
            playerName: this.playerName
        });

        return true;
    }

    // Event system
    on(event, handler) {
        if (!this.eventHandlers[event]) {
            this.eventHandlers[event] = [];
        }
        this.eventHandlers[event].push(handler);
    }

    off(event, handler) {
        if (this.eventHandlers[event]) {
            this.eventHandlers[event] = this.eventHandlers[event].filter(h => h !== handler);
        }
    }

    emit(event, data) {
        if (this.eventHandlers[event]) {
            this.eventHandlers[event].forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error('Error in event handler:', error);
                }
            });
        }
    }

    // Connection status UI updates
    updateConnectionStatus() {
        const statusElement = document.getElementById('connectionStatus');
        if (statusElement) {
            let statusText = '';
            let statusClass = '';

            switch (this.connectionStatus) {
                case 'connecting':
                    statusText = 'Connecting...';
                    statusClass = 'connecting';
                    break;
                case 'connected':
                    statusText = 'Connected';
                    statusClass = 'connected';
                    break;
                case 'reconnecting':
                    statusText = `Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`;
                    statusClass = 'reconnecting';
                    break;
                case 'disconnected':
                    statusText = 'Disconnected';
                    statusClass = 'disconnected';
                    break;
                case 'error':
                    statusText = 'Connection Error';
                    statusClass = 'error';
                    break;
            }

            statusElement.textContent = statusText;
            statusElement.className = `connection-status ${statusClass}`;
        }
    }

    // Settings persistence
    loadPlayerName() {
        return Utils.loadFromLocalStorage('playerName', '') || 
               `Player${Math.floor(Math.random() * 1000)}`;
    }

    savePlayerName() {
        Utils.saveToLocalStorage('playerName', this.playerName);
    }

    // Network statistics
    getNetworkStats() {
        return {
            connected: this.connected,
            playerId: this.playerId,
            playerName: this.playerName,
            roomCode: this.roomCode,
            isHost: this.isHost,
            playerCount: this.getPlayerCount(),
            reconnectAttempts: this.reconnectAttempts,
            connectionStatus: this.connectionStatus
        };
    }

    // Cleanup
    cleanup() {
        this.connected = false;
        this.socket = null;
        this.roomCode = null;
        this.isHost = false;
        this.players = {};
        this.gameState = null;
        this.eventHandlers = {};
        this.connectionStatus = 'disconnected';
        this.updateConnectionStatus();
    }

    destroy() {
        this.disconnect();
        this.cleanup();
        console.log('Multiplayer Manager destroyed');
    }
}

// Global multiplayer manager instance
window.MultiplayerManager = MultiplayerManager;