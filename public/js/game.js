// Main Game Logic for GoKart Racing Game

class Game {
    constructor() {
        this.state = 'loading';
        this.previousState = null;
        
        // Core systems
        this.input = null;
        this.graphics = null;
        this.physics = null;
        this.audio = null;
        this.ai = null;
        this.multiplayer = null;
        
        // Game data
        this.karts = [];
        this.playerKart = null;
        this.trackData = null;
        this.raceConfig = {
            laps: 3,
            maxPlayers: 4,
            difficulty: 'medium',
            gameMode: 'singleplayer' // 'singleplayer' or 'multiplayer'
        };
        
        // Game timing
        this.lastTime = 0;
        this.deltaTime = 0;
        this.gameTime = 0;
        
        // Race state
        this.raceState = {
            started: false,
            finished: false,
            countdown: 0,
            leaderboard: [],
            raceStartTime: 0
        };
        
        // UI elements
        this.canvas = null;
        this.uiElements = {};
        
        // Performance monitoring
        this.fps = 0;
        this.frameCount = 0;
        this.lastFpsUpdate = 0;
        
        this.initialize();
    }

    async initialize() {
        console.log('Initializing GoKart Racing Game...');
        
        try {
            // Initialize canvas
            this.setupCanvas();
            
            // Initialize core systems
            await this.initializeSystems();
            
            // Setup UI event handlers
            this.setupUI();
            
            // Load settings
            this.loadSettings();
            
            // Start game loop
            this.setState('menu');
            this.startGameLoop();
            
            console.log('Game initialized successfully');
        } catch (error) {
            console.error('Failed to initialize game:', error);
            this.setState('error');
        }
    }

    setupCanvas() {
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) {
            throw new Error('Game canvas not found');
        }
        
        // Resize canvas to fill screen
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Prevent context menu on canvas
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    resizeCanvas() {
        const container = document.getElementById('gameContainer');
        const rect = container.getBoundingClientRect();
        
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        
        if (this.graphics) {
            this.graphics.resize();
        }
    }

    async initializeSystems() {
        // Initialize input system
        this.input = new InputManager();
        
        // Initialize graphics system
        this.graphics = new GraphicsEngine(this.canvas);
        
        // Initialize physics system
        this.physics = new PhysicsEngine();
        
        // Initialize audio system
        this.audio = new AudioManager();
        
        // Initialize AI system
        this.ai = new AIManager();
        
        // Initialize multiplayer system
        this.multiplayer = new MultiplayerManager();
        
        // Wait for systems to be ready
        await this.waitForSystemsReady();
        
        // Initialize track data
        this.trackData = this.graphics.track;
        this.physics.initialize(this.trackData);
        this.ai.initialize(this.trackData);
    }

    async waitForSystemsReady() {
        // Wait for graphics assets to load
        while (this.graphics.loadingProgress < 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Wait for audio to initialize
        while (!this.audio.initialized) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    setupUI() {
        // Cache UI elements
        this.uiElements = {
            loadingScreen: document.getElementById('loadingScreen'),
            mainMenu: document.getElementById('mainMenu'),
            gameModeScreen: document.getElementById('gameModeScreen'),
            multiplayerLobby: document.getElementById('multiplayerLobby'),
            settingsScreen: document.getElementById('settingsScreen'),
            instructionsScreen: document.getElementById('instructionsScreen'),
            gameUI: document.getElementById('gameUI'),
            resultsScreen: document.getElementById('resultsScreen'),
            pauseMenu: document.getElementById('pauseMenu')
        };
        
        // Setup menu event handlers
        this.setupMenuHandlers();
        
        // Setup game UI handlers
        this.setupGameUIHandlers();
        
        // Setup settings handlers
        this.setupSettingsHandlers();
    }

    setupMenuHandlers() {
        // Main menu buttons
        document.getElementById('singlePlayerBtn').addEventListener('click', () => {
            this.audio.playMenuClick();
            this.showGameModeSelection();
        });
        
        document.getElementById('multiPlayerBtn').addEventListener('click', () => {
            this.audio.playMenuClick();
            this.startMultiplayer();
        });
        
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.audio.playMenuClick();
            this.showSettings();
        });
        
        document.getElementById('instructionsBtn').addEventListener('click', () => {
            this.audio.playMenuClick();
            this.showInstructions();
        });
        
        // Game mode selection
        document.getElementById('easyModeBtn').addEventListener('click', () => {
            this.audio.playMenuClick();
            this.startSinglePlayer('easy');
        });
        
        document.getElementById('mediumModeBtn').addEventListener('click', () => {
            this.audio.playMenuClick();
            this.startSinglePlayer('medium');
        });
        
        document.getElementById('hardModeBtn').addEventListener('click', () => {
            this.audio.playMenuClick();
            this.startSinglePlayer('hard');
        });
        
        document.getElementById('backToMenuBtn').addEventListener('click', () => {
            this.audio.playMenuClick();
            this.showMainMenu();
        });
        
        // Back buttons
        const backButtons = [
            'backFromSettingsBtn',
            'backFromInstructionsBtn',
            'backToMenuFromResultsBtn'
        ];
        
        backButtons.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', () => {
                    this.audio.playMenuClick();
                    this.showMainMenu();
                });
            }
        });
        
        // Results screen
        document.getElementById('raceAgainBtn').addEventListener('click', () => {
            this.audio.playMenuClick();
            this.restartRace();
        });
    }

    setupGameUIHandlers() {
        // Pause functionality
        document.getElementById('pauseBtn').addEventListener('click', () => {
            this.pauseGame();
        });
        
        document.getElementById('resumeBtn').addEventListener('click', () => {
            this.resumeGame();
        });
        
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.restartRace();
        });
        
        document.getElementById('quitBtn').addEventListener('click', () => {
            this.quitToMenu();
        });
        
        // Keyboard pause
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Escape' && this.state === 'playing') {
                this.pauseGame();
            }
        });
    }

    setupSettingsHandlers() {
        // Volume controls
        const sfxSlider = document.getElementById('sfxVolume');
        const musicSlider = document.getElementById('musicVolume');
        const tiltSlider = document.getElementById('tiltSensitivity');
        const graphicsSelect = document.getElementById('graphicsQuality');
        
        if (sfxSlider) {
            sfxSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value) / 100;
                this.audio.setSFXVolume(value);
                document.getElementById('sfxVolumeText').textContent = e.target.value + '%';
            });
        }
        
        if (musicSlider) {
            musicSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value) / 100;
                this.audio.setMusicVolume(value);
                document.getElementById('musicVolumeText').textContent = e.target.value + '%';
            });
        }
        
        if (tiltSlider) {
            tiltSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                this.input.setTiltSensitivity(value);
                document.getElementById('tiltSensitivityText').textContent = value + 'x';
            });
        }
        
        if (graphicsSelect) {
            graphicsSelect.addEventListener('change', (e) => {
                this.graphics.setGraphicsQuality(e.target.value);
            });
        }
    }

    // Game state management
    setState(newState) {
        this.previousState = this.state;
        this.state = newState;
        
        console.log(`Game state changed: ${this.previousState} -> ${this.state}`);
        
        // Hide all screens
        Object.values(this.uiElements).forEach(element => {
            if (element) {
                element.classList.add('hidden');
            }
        });
        
        // Show appropriate screen
        switch (this.state) {
            case 'loading':
                this.showScreen('loadingScreen');
                break;
            case 'menu':
                this.showScreen('mainMenu');
                this.canvas.classList.add('hidden');
                this.audio.playMusic('menu', { fadeIn: 1 });
                break;
            case 'gameMode':
                this.showScreen('gameModeScreen');
                break;
            case 'multiplayerLobby':
                this.showScreen('multiplayerLobby');
                break;
            case 'settings':
                this.showScreen('settingsScreen');
                break;
            case 'instructions':
                this.showScreen('instructionsScreen');
                break;
            case 'playing':
                this.showScreen('gameUI');
                this.canvas.classList.remove('hidden');
                this.audio.playMusic('race', { fadeIn: 1 });
                break;
            case 'paused':
                this.showScreen('pauseMenu');
                break;
            case 'results':
                this.showScreen('resultsScreen');
                this.audio.playMusic('results');
                break;
            case 'error':
                alert('An error occurred. Please refresh the page.');
                break;
        }
    }

    showScreen(screenId) {
        const screen = this.uiElements[screenId];
        if (screen) {
            screen.classList.remove('hidden');
        }
    }

    // Menu navigation
    showMainMenu() {
        this.setState('menu');
    }

    showGameModeSelection() {
        this.setState('gameMode');
    }

    showSettings() {
        this.setState('settings');
        this.loadSettingsUI();
    }

    showInstructions() {
        this.setState('instructions');
    }

    loadSettingsUI() {
        const volumes = this.audio.getVolumes();
        
        document.getElementById('sfxVolume').value = Math.round(volumes.sfx * 100);
        document.getElementById('sfxVolumeText').textContent = Math.round(volumes.sfx * 100) + '%';
        
        document.getElementById('musicVolume').value = Math.round(volumes.music * 100);
        document.getElementById('musicVolumeText').textContent = Math.round(volumes.music * 100) + '%';
        
        document.getElementById('tiltSensitivity').value = this.input.tiltSensitivity;
        document.getElementById('tiltSensitivityText').textContent = this.input.tiltSensitivity + 'x';
        
        document.getElementById('graphicsQuality').value = this.graphics.settings.quality;
    }

    // Game modes
    async startSinglePlayer(difficulty) {
        this.raceConfig.gameMode = 'singleplayer';
        this.raceConfig.difficulty = difficulty;
        
        this.setState('playing');
        await this.initializeRace();
    }

    async startMultiplayer() {
        this.raceConfig.gameMode = 'multiplayer';
        this.setState('multiplayerLobby');
        
        try {
            await this.multiplayer.connect();
            const roomCode = await this.multiplayer.createRoom();
            document.getElementById('roomCodeText').textContent = roomCode;
        } catch (error) {
            console.error('Failed to start multiplayer:', error);
            alert('Failed to connect to multiplayer server');
            this.showMainMenu();
        }
    }

    // Race initialization
    async initializeRace() {
        console.log('Initializing race...');
        
        // Clear existing karts
        this.karts = [];
        
        // Create player kart
        this.createPlayerKart();
        
        // Create AI bots (for single player)
        if (this.raceConfig.gameMode === 'singleplayer') {
            this.createAIBots();
        }
        
        // Initialize race state
        this.raceState = {
            started: false,
            finished: false,
            countdown: 3,
            leaderboard: [],
            raceStartTime: 0
        };
        
        // Start countdown
        this.startCountdown();
    }

    createPlayerKart() {
        const startPos = this.trackData.startLine;
        
        this.playerKart = {
            id: 'player',
            playerId: this.multiplayer.playerId,
            name: this.multiplayer.playerName || 'Player',
            x: startPos.x,
            y: startPos.y,
            rotation: startPos.angle,
            radius: 20,
            physics: KartPhysics.createPreset('balanced'),
            controls: { accelerate: 0, brake: 0, steer: 0 },
            isPlayer: true,
            color: '#667eea'
        };
        
        this.karts.push(this.playerKart);
        
        // Start engine sound
        this.audio.startEngineSound(this.playerKart);
    }

    createAIBots() {
        const botCount = 3;
        this.ai.createRace(this.raceConfig.difficulty, botCount);
        
        const botNames = ['Speed Demon', 'Corner King', 'Road Warrior'];
        const startPos = this.trackData.startLine;
        
        for (let i = 0; i < botCount; i++) {
            const offset = (i + 1) * 50;
            const bot = {
                id: `bot_${i}`,
                name: botNames[i],
                x: startPos.x - Math.cos(startPos.angle) * offset,
                y: startPos.y - Math.sin(startPos.angle) * offset,
                rotation: startPos.angle,
                radius: 20,
                physics: KartPhysics.createPreset(['speed', 'handling', 'balanced'][i]),
                controls: { accelerate: 0, brake: 0, steer: 0 },
                isPlayer: false,
                color: this.graphics.colors.karts[i + 1]
            };
            
            this.karts.push(bot);
            this.audio.startEngineSound(bot);
        }
    }

    startCountdown() {
        this.audio.playCountdown();
        
        const countdownTimer = setInterval(() => {
            this.raceState.countdown--;
            
            if (this.raceState.countdown > 0) {
                this.audio.playCountdown();
            } else if (this.raceState.countdown === 0) {
                this.audio.playRaceStart();
                this.startRace();
                clearInterval(countdownTimer);
            }
        }, 1000);
    }

    startRace() {
        this.raceState.started = true;
        this.raceState.raceStartTime = Utils.now();
        console.log('Race started!');
    }

    // Game loop
    startGameLoop() {
        const gameLoop = (timestamp) => {
            this.update(timestamp);
            this.render();
            requestAnimationFrame(gameLoop);
        };
        
        requestAnimationFrame(gameLoop);
    }

    update(timestamp) {
        // Calculate delta time
        this.deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;
        
        // Convert to seconds
        const dt = this.deltaTime / 1000;
        this.gameTime += dt;
        
        // Update FPS counter
        this.updateFPS();
        
        // Update based on state
        switch (this.state) {
            case 'playing':
                this.updateGame(dt);
                break;
            case 'paused':
                // Game is paused, don't update game logic
                break;
        }
        
        // Always update input system
        this.input.update();
        this.input.resetFrameInputs();
    }

    updateGame(deltaTime) {
        if (!this.raceState.started) return;
        
        // Update player input
        this.updatePlayerInput();
        
        // Update AI
        if (this.raceConfig.gameMode === 'singleplayer') {
            this.ai.update(deltaTime, this.karts, this.playerKart);
        }
        
        // Update physics
        this.physics.update(deltaTime, this.karts);
        
        // Update audio
        this.updateAudio();
        
        // Update camera
        this.graphics.updateCamera(this.playerKart);
        
        // Update graphics particles
        this.graphics.updateParticles(deltaTime);
        
        // Check race progress
        this.updateRaceProgress();
        
        // Update UI
        this.updateGameUI();
        
        // Multiplayer sync
        if (this.raceConfig.gameMode === 'multiplayer') {
            this.multiplayer.sendPlayerUpdate(this.playerKart);
        }
    }

    updatePlayerInput() {
        const inputState = this.input.getInputState();
        
        if (this.playerKart && this.playerKart.controls) {
            this.playerKart.controls.accelerate = inputState.accelerate;
            this.playerKart.controls.brake = inputState.brake;
            this.playerKart.controls.steer = inputState.steer;
        }
        
        // Handle pause
        if (inputState.pause) {
            this.pauseGame();
        }
    }

    updateAudio() {
        // Update engine sounds
        for (const kart of this.karts) {
            this.audio.updateEngineSound(kart);
        }
    }

    updateRaceProgress() {
        for (const kart of this.karts) {
            const checkpointEvent = this.physics.checkCheckpoints(kart);
            
            if (checkpointEvent) {
                if (checkpointEvent.type === 'lap' && kart.isPlayer) {
                    this.audio.playLapComplete();
                    
                    // Check if race is finished
                    if (kart.raceData.lapCount >= this.raceConfig.laps) {
                        this.finishRace();
                    }
                } else if (checkpointEvent.type === 'checkpoint' && kart.isPlayer) {
                    this.audio.playCheckpoint();
                }
            }
        }
    }

    updateGameUI() {
        if (!this.playerKart || !this.playerKart.raceData) return;
        
        // Update lap counter
        const currentLap = Math.min(this.playerKart.raceData.lapCount + 1, this.raceConfig.laps);
        document.getElementById('currentLap').textContent = currentLap;
        
        // Update position
        const position = this.physics.getRacePosition(this.playerKart, this.karts);
        document.getElementById('currentPosition').textContent = position;
        
        // Update race time
        const raceTime = Utils.now() - this.raceState.raceStartTime;
        document.getElementById('raceTime').textContent = Utils.formatTime(raceTime);
        
        // Update speedometer
        const speed = Math.round(this.playerKart.physics.speed);
        document.getElementById('speedValue').textContent = speed;
        
        const speedPercentage = (speed / this.playerKart.physics.maxSpeed) * 100;
        document.getElementById('speedFill').style.width = speedPercentage + '%';
        
        // Update minimap
        this.graphics.renderMinimap({
            karts: this.karts,
            checkpoints: this.trackData.checkpoints
        }, document.getElementById('miniMapCanvas'));
    }

    updateFPS() {
        this.frameCount++;
        
        if (this.gameTime - this.lastFpsUpdate >= 1) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastFpsUpdate = this.gameTime;
        }
    }

    render() {
        if (this.state === 'playing' || this.state === 'paused') {
            this.graphics.render({
                karts: this.karts,
                checkpoints: this.trackData.checkpoints,
                effects: []
            });
            
            // Render countdown overlay
            if (!this.raceState.started && this.raceState.countdown > 0) {
                this.renderCountdown();
            }
        }
    }

    renderCountdown() {
        const ctx = this.canvas.getContext('2d');
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 72px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        
        const text = this.raceState.countdown > 0 ? this.raceState.countdown.toString() : 'GO!';
        ctx.strokeText(text, centerX, centerY);
        ctx.fillText(text, centerX, centerY);
        
        ctx.restore();
    }

    // Game control
    pauseGame() {
        if (this.state === 'playing') {
            this.setState('paused');
        }
    }

    resumeGame() {
        if (this.state === 'paused') {
            this.setState('playing');
        }
    }

    restartRace() {
        this.setState('playing');
        this.initializeRace();
    }

    quitToMenu() {
        this.cleanup();
        this.showMainMenu();
    }

    finishRace() {
        this.raceState.finished = true;
        this.audio.playRaceFinish();
        
        // Calculate final results
        this.calculateResults();
        this.setState('results');
    }

    calculateResults() {
        const results = this.karts
            .filter(kart => kart.raceData)
            .map(kart => ({
                name: kart.name,
                isPlayer: kart.isPlayer,
                lapCount: kart.raceData.lapCount,
                totalTime: Utils.now() - this.raceState.raceStartTime,
                bestLap: kart.raceData.lapTimes.length > 0 ? 
                    Math.min(...kart.raceData.lapTimes.map(lap => lap.time)) : 0
            }))
            .sort((a, b) => {
                if (a.lapCount !== b.lapCount) {
                    return b.lapCount - a.lapCount;
                }
                return a.totalTime - b.totalTime;
            });
        
        this.displayResults(results);
    }

    displayResults(results) {
        const resultsTable = document.getElementById('resultsTable');
        resultsTable.innerHTML = '';
        
        results.forEach((result, index) => {
            const row = document.createElement('div');
            row.className = `result-row ${result.isPlayer ? 'player' : ''}`;
            
            row.innerHTML = `
                <div class="result-position">${index + 1}</div>
                <div class="result-name">${result.name}</div>
                <div class="result-time">${Utils.formatTime(result.totalTime)}</div>
            `;
            
            resultsTable.appendChild(row);
        });
    }

    // Settings
    loadSettings() {
        // Settings are loaded by individual systems
    }

    saveSettings() {
        // Settings are saved by individual systems
    }

    // Cleanup
    cleanup() {
        // Stop engine sounds
        for (const kart of this.karts) {
            this.audio.stopEngineSound(kart);
        }
        
        // Reset game state
        this.karts = [];
        this.playerKart = null;
        this.raceState = {
            started: false,
            finished: false,
            countdown: 0,
            leaderboard: [],
            raceStartTime: 0
        };
        
        // Clear AI bots
        this.ai.bots = [];
        
        // Disconnect multiplayer
        if (this.raceConfig.gameMode === 'multiplayer') {
            this.multiplayer.leaveRoom();
        }
    }

    // Debug
    getDebugInfo() {
        return {
            state: this.state,
            fps: this.fps,
            gameTime: this.gameTime,
            kartsCount: this.karts.length,
            raceState: this.raceState,
            input: this.input ? this.input.getDebugInfo() : null,
            audio: this.audio ? this.audio.getDebugInfo() : null,
            multiplayer: this.multiplayer ? this.multiplayer.getNetworkStats() : null
        };
    }

    destroy() {
        this.cleanup();
        
        if (this.input) this.input.destroy();
        if (this.graphics) this.graphics.destroy();
        if (this.physics) this.physics.destroy();
        if (this.audio) this.audio.destroy();
        if (this.ai) this.ai.destroy();
        if (this.multiplayer) this.multiplayer.destroy();
        
        console.log('Game destroyed');
    }
}

// Global game instance
window.Game = Game;