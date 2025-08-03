const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Configure Socket.IO with CORS
const io = socketIo(server, {
    cors: {
        origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:3000', 'http://127.0.0.1:3000'],
        methods: ['GET', 'POST']
    },
    pingTimeout: 60000,
    pingInterval: 25000
});

// Server configuration
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Game state management
class GameServer {
    constructor() {
        this.rooms = new Map();
        this.players = new Map();
        this.roomCodes = new Set();
        
        console.log('Game Server initialized');
    }

    // Generate unique room code
    generateRoomCode() {
        let code;
        do {
            code = Math.random().toString(36).substring(2, 6).toUpperCase();
        } while (this.roomCodes.has(code));
        
        this.roomCodes.add(code);
        return code;
    }

    // Create new room
    createRoom(hostId, hostName) {
        const roomCode = this.generateRoomCode();
        const room = {
            code: roomCode,
            hostId: hostId,
            players: new Map(),
            gameState: 'lobby', // 'lobby', 'racing', 'finished'
            raceData: null,
            createdAt: Date.now()
        };

        // Add host to room
        room.players.set(hostId, {
            id: hostId,
            name: hostName,
            isHost: true,
            ready: false,
            position: { x: 0, y: 0, rotation: 0 },
            joinedAt: Date.now()
        });

        this.rooms.set(roomCode, room);
        console.log(`Room ${roomCode} created by ${hostName}`);
        
        return room;
    }

    // Join existing room
    joinRoom(roomCode, playerId, playerName) {
        const room = this.rooms.get(roomCode);
        if (!room) {
            throw new Error('Room not found');
        }

        if (room.players.size >= 4) {
            throw new Error('Room is full');
        }

        if (room.gameState === 'racing') {
            throw new Error('Race in progress');
        }

        // Add player to room
        room.players.set(playerId, {
            id: playerId,
            name: playerName,
            isHost: false,
            ready: false,
            position: { x: 0, y: 0, rotation: 0 },
            joinedAt: Date.now()
        });

        console.log(`${playerName} joined room ${roomCode}`);
        return room;
    }

    // Leave room
    leaveRoom(roomCode, playerId) {
        const room = this.rooms.get(roomCode);
        if (!room) return null;

        const player = room.players.get(playerId);
        if (!player) return null;

        room.players.delete(playerId);
        console.log(`${player.name} left room ${roomCode}`);

        // If host left, assign new host or delete room
        if (player.isHost) {
            if (room.players.size > 0) {
                const newHost = room.players.values().next().value;
                newHost.isHost = true;
                room.hostId = newHost.id;
                console.log(`${newHost.name} is now host of room ${roomCode}`);
            } else {
                // Delete empty room
                this.rooms.delete(roomCode);
                this.roomCodes.delete(roomCode);
                console.log(`Room ${roomCode} deleted (empty)`);
            }
        }

        return room;
    }

    // Update player position
    updatePlayerPosition(roomCode, playerId, positionData) {
        const room = this.rooms.get(roomCode);
        if (!room) return false;

        const player = room.players.get(playerId);
        if (!player) return false;

        player.position = {
            ...positionData,
            timestamp: Date.now()
        };

        return true;
    }

    // Get room info
    getRoomInfo(roomCode) {
        const room = this.rooms.get(roomCode);
        if (!room) return null;

        return {
            code: room.code,
            hostId: room.hostId,
            gameState: room.gameState,
            playerCount: room.players.size,
            players: Object.fromEntries(
                Array.from(room.players.entries()).map(([id, player]) => [
                    id,
                    {
                        id: player.id,
                        name: player.name,
                        isHost: player.isHost,
                        ready: player.ready
                    }
                ])
            )
        };
    }

    // Get server stats
    getStats() {
        return {
            rooms: this.rooms.size,
            players: this.players.size,
            totalConnections: this.players.size,
            uptime: process.uptime()
        };
    }

    // Cleanup old rooms
    cleanup() {
        const now = Date.now();
        const maxAge = 2 * 60 * 60 * 1000; // 2 hours

        for (const [roomCode, room] of this.rooms.entries()) {
            if (now - room.createdAt > maxAge) {
                this.rooms.delete(roomCode);
                this.roomCodes.delete(roomCode);
                console.log(`Cleaned up old room ${roomCode}`);
            }
        }
    }
}

// Initialize game server
const gameServer = new GameServer();

// Middleware
app.use(helmet({
    contentSecurityPolicy: false, // Disable for game assets
    crossOriginEmbedderPolicy: false
}));
app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        stats: gameServer.getStats()
    });
});

app.get('/api/stats', (req, res) => {
    res.json(gameServer.getStats());
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);
    
    let currentRoom = null;
    let playerId = null;
    let playerName = 'Anonymous';

    // Handle player join
    socket.on('playerJoin', (data) => {
        playerId = data.playerId || socket.id;
        playerName = data.playerName || 'Anonymous';
        
        gameServer.players.set(playerId, {
            socketId: socket.id,
            name: playerName,
            joinedAt: Date.now()
        });

        console.log(`Player ${playerName} (${playerId}) joined`);
    });

    // Handle room creation
    socket.on('createRoom', (data) => {
        try {
            const room = gameServer.createRoom(playerId, playerName);
            currentRoom = room.code;
            
            socket.join(currentRoom);
            
            socket.emit('roomCreated', {
                roomCode: room.code,
                hostId: room.hostId
            });

            console.log(`Room ${room.code} created by ${playerName}`);
        } catch (error) {
            socket.emit('error', { message: error.message });
        }
    });

    // Handle room joining
    socket.on('joinRoom', (data) => {
        try {
            const room = gameServer.joinRoom(data.roomCode, playerId, playerName);
            currentRoom = room.code;
            
            socket.join(currentRoom);
            
            // Notify all players in room
            const roomInfo = gameServer.getRoomInfo(currentRoom);
            io.to(currentRoom).emit('playerJoined', {
                playerId: playerId,
                playerName: playerName
            });
            
            socket.emit('roomJoined', roomInfo);
            
            console.log(`${playerName} joined room ${currentRoom}`);
        } catch (error) {
            socket.emit('error', { message: error.message });
        }
    });

    // Handle room leaving
    socket.on('leaveRoom', (data) => {
        if (currentRoom) {
            const room = gameServer.leaveRoom(currentRoom, playerId);
            
            socket.leave(currentRoom);
            
            // Notify remaining players
            if (room && room.players.size > 0) {
                io.to(currentRoom).emit('playerLeft', {
                    playerId: playerId,
                    playerName: playerName
                });
                
                // Send updated room info
                const roomInfo = gameServer.getRoomInfo(currentRoom);
                io.to(currentRoom).emit('roomUpdated', roomInfo);
            }
            
            currentRoom = null;
        }
    });

    // Handle player position updates
    socket.on('playerPositionUpdate', (data) => {
        if (currentRoom && gameServer.updatePlayerPosition(currentRoom, playerId, data)) {
            // Broadcast to other players in room
            socket.to(currentRoom).emit('playerPositionUpdate', {
                playerId: playerId,
                ...data
            });
        }
    });

    // Handle game state updates (host only)
    socket.on('gameStateUpdate', (data) => {
        if (currentRoom) {
            const room = gameServer.rooms.get(currentRoom);
            if (room && room.hostId === playerId) {
                room.gameState = data.gameState || room.gameState;
                room.raceData = data.raceData || room.raceData;
                
                // Broadcast to all players in room
                io.to(currentRoom).emit('gameStateUpdate', data);
            }
        }
    });

    // Handle race start (host only)
    socket.on('startRace', (data) => {
        if (currentRoom) {
            const room = gameServer.rooms.get(currentRoom);
            if (room && room.hostId === playerId) {
                room.gameState = 'racing';
                room.raceData = {
                    startTime: Date.now(),
                    ...data
                };
                
                // Broadcast race start to all players
                io.to(currentRoom).emit('raceStarted', {
                    timestamp: Date.now(),
                    ...data
                });
                
                console.log(`Race started in room ${currentRoom}`);
            }
        }
    });

    // Handle race finish
    socket.on('raceFinished', (data) => {
        if (currentRoom) {
            const room = gameServer.rooms.get(currentRoom);
            if (room && room.hostId === playerId) {
                room.gameState = 'finished';
                
                // Broadcast race results
                io.to(currentRoom).emit('raceFinished', data);
                
                console.log(`Race finished in room ${currentRoom}`);
            }
        }
    });

    // Handle chat messages
    socket.on('chatMessage', (data) => {
        if (currentRoom) {
            const message = {
                playerId: playerId,
                playerName: playerName,
                message: data.message,
                timestamp: Date.now()
            };
            
            // Broadcast to all players in room
            io.to(currentRoom).emit('chatMessage', message);
        }
    });

    // Handle player ready state
    socket.on('playerReady', (data) => {
        if (currentRoom) {
            const room = gameServer.rooms.get(currentRoom);
            if (room) {
                const player = room.players.get(playerId);
                if (player) {
                    player.ready = data.ready;
                    
                    // Broadcast ready state
                    io.to(currentRoom).emit('playerReadyUpdate', {
                        playerId: playerId,
                        ready: data.ready
                    });
                }
            }
        }
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
        console.log(`Player ${playerName} disconnected: ${reason}`);
        
        // Remove from current room
        if (currentRoom) {
            gameServer.leaveRoom(currentRoom, playerId);
            
            // Notify remaining players
            socket.to(currentRoom).emit('playerLeft', {
                playerId: playerId,
                playerName: playerName
            });
        }
        
        // Remove from players map
        gameServer.players.delete(playerId);
    });

    // Handle errors
    socket.on('error', (error) => {
        console.error(`Socket error for ${playerName}:`, error);
    });
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Cleanup task - run every hour
setInterval(() => {
    gameServer.cleanup();
}, 60 * 60 * 1000);

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down gracefully');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

// Start server
server.listen(PORT, () => {
    console.log(`GoKart Racing Server running on port ${PORT}`);
    console.log(`Environment: ${NODE_ENV}`);
    console.log(`Time: ${new Date().toISOString()}`);
    
    if (NODE_ENV === 'development') {
        console.log(`Game available at: http://localhost:${PORT}`);
    }
});

module.exports = { app, server, io, gameServer };