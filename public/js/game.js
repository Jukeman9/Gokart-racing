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
        const systemsStatus = {
            input: false,
            graphics: false,
            physics: false,
            audio: false,
            ai: false,
            multiplayer: false
        };

        // Initialize input system
        try {
            this.input = new InputManager();
            systemsStatus.input = true;
            console.log('✅ Input system initialized');
        } catch (error) {
            console.error('❌ Input system failed:', error);
            this.input = this.createFallbackInputManager();
        }
        
        // Initialize graphics system
        try {
            this.graphics = new GraphicsEngine(this.canvas);
            systemsStatus.graphics = true;
            console.log('✅ Graphics system initialized');
        } catch (error) {
            console.error('❌ Graphics system failed:', error);
            this.graphics = this.createFallbackGraphicsEngine();
        }
        
        // Initialize physics system
        try {
            this.physics = new PhysicsEngine();
            systemsStatus.physics = true;
            console.log('✅ Physics system initialized');
        } catch (error) {
            console.error('❌ Physics system failed:', error);
            this.physics = this.createFallbackPhysicsEngine();
        }
        
        // Initialize audio system
        try {
            this.audio = new AudioManager();
            systemsStatus.audio = true;
            console.log('✅ Audio system initialized');
        } catch (error) {
            console.error('❌ Audio system failed:', error);
            this.audio = this.createFallbackAudioManager();
        }
        
        // Initialize AI system
        try {
            this.ai = new AIManager();
            systemsStatus.ai = true;
            console.log('✅ AI system initialized');
        } catch (error) {
            console.error('❌ AI system failed:', error);
            this.ai = this.createFallbackAIManager();
        }
        
        // Initialize multiplayer system
        try {
            this.multiplayer = new MultiplayerManager();
            systemsStatus.multiplayer = true;
            console.log('✅ Multiplayer system initialized');
        } catch (error) {
            console.error('❌ Multiplayer system failed:', error);
            this.multiplayer = this.createFallbackMultiplayerManager();
        }
        
        // Log system status
        const successCount = Object.values(systemsStatus).filter(Boolean).length;
        console.log(`🎮 Game systems: ${successCount}/6 initialized successfully`);
        
        // Wait for systems to be ready (with timeout)
        try {
            await this.waitForSystemsReady();
        } catch (error) {
            console.warn('⚠️ Some systems took too long to initialize, continuing anyway');
        }
        
        // Initialize track data
        try {
            this.trackData = this.graphics.track || this.createFallbackTrackData();
            this.physics.initialize(this.trackData);
            this.ai.initialize(this.trackData);
        } catch (error) {
            console.error('❌ Track initialization failed:', error);
            this.trackData = this.createFallbackTrackData();
        }
    }

    async waitForSystemsReady() {
        const maxWaitTime = 10000; // 10 seconds timeout
        const startTime = Date.now();
        
        // Wait for graphics assets to load (with timeout)
        while (this.graphics.loadingProgress < 1) {
            if (Date.now() - startTime > maxWaitTime) {
                console.warn('⚠️ Graphics loading timeout, continuing anyway');
                break;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Wait for audio to initialize (with timeout)
        while (!this.audio.initialized) {
            if (Date.now() - startTime > maxWaitTime) {
                console.warn('⚠️ Audio initialization timeout, continuing anyway');
                break;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.log('✅ All systems ready (or timeout reached)');
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
        
        // Disable multiplayer button if not available
        this.updateMultiplayerButtonState();
        
        // Setup game UI handlers
        this.setupGameUIHandlers();
        
        // Setup settings handlers
        this.setupSettingsHandlers();
    }

    setupMenuHandlers() {
        // Helper function to add both click and touch events to buttons
        const addButtonEvents = (buttonId, handler) => {
            const button = document.getElementById(buttonId);
            if (button) {
                // Add click event
                button.addEventListener('click', handler);
                
                // Add touch event for mobile
                button.addEventListener('touchstart', (e) => {
                    e.preventDefault(); // Prevent ghost clicks
                    handler(e);
                }, { passive: false });
            }
        };

        // Main menu buttons
        addButtonEvents('singlePlayerBtn', () => {
            this.audio.playMenuClick();
            this.showGameModeSelection();
        });
        
        addButtonEvents('multiPlayerBtn', () => {
            this.audio.playMenuClick();
            
            // Check if multiplayer is available
            if (window.MULTIPLAYER_AVAILABLE === false) {
                alert('Multiplayer is not available on this platform. The game is optimized for single-player mode on static hosting.');
                return;
            }
            
            this.startMultiplayer();
        });
        
        addButtonEvents('settingsBtn', () => {
            this.audio.playMenuClick();
            this.showSettings();
        });
        
        addButtonEvents('instructionsBtn', () => {
            this.audio.playMenuClick();
            this.showInstructions();
        });
        
        // Game mode selection
        addButtonEvents('easyModeBtn', () => {
            this.audio.playMenuClick();
            this.startSinglePlayer('easy');
        });
        
        addButtonEvents('mediumModeBtn', () => {
            this.audio.playMenuClick();
            this.startSinglePlayer('medium');
        });
        
        addButtonEvents('hardModeBtn', () => {
            this.audio.playMenuClick();
            this.startSinglePlayer('hard');
        });
        
        addButtonEvents('backToMenuBtn', () => {
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
            addButtonEvents(id, () => {
                this.audio.playMenuClick();
                this.showMainMenu();
            });
        });
        
        // Results screen
        addButtonEvents('raceAgainBtn', () => {
            this.audio.playMenuClick();
            this.restartRace();
        });
    }

    setupGameUIHandlers() {
        // Helper function to add both click and touch events to buttons
        const addButtonEvents = (buttonId, handler) => {
            const button = document.getElementById(buttonId);
            if (button) {
                // Add click event
                button.addEventListener('click', handler);
                
                // Add touch event for mobile
                button.addEventListener('touchstart', (e) => {
                    e.preventDefault(); // Prevent ghost clicks
                    handler(e);
                }, { passive: false });
            }
        };
        
        // Pause functionality
        addButtonEvents('pauseBtn', () => {
            this.pauseGame();
        });
        
        addButtonEvents('resumeBtn', () => {
            this.resumeGame();
        });
        
        addButtonEvents('restartBtn', () => {
            this.restartRace();
        });
        
        addButtonEvents('quitBtn', () => {
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

    // Update multiplayer button state based on availability
    updateMultiplayerButtonState() {
        const multiplayerBtn = document.getElementById('multiPlayerBtn');
        if (multiplayerBtn) {
            if (window.MULTIPLAYER_AVAILABLE === false) {
                multiplayerBtn.style.opacity = '0.5';
                multiplayerBtn.style.cursor = 'not-allowed';
                multiplayerBtn.title = 'Multiplayer not available on this platform';
                
                // Add disabled class for additional styling
                multiplayerBtn.classList.add('disabled');
            } else {
                multiplayerBtn.style.opacity = '1';
                multiplayerBtn.style.cursor = 'pointer';
                multiplayerBtn.title = 'Play with friends online';
                multiplayerBtn.classList.remove('disabled');
            }
        }
    }

    // Game state management
    setState(newState) {
        this.previousState = this.state;
        this.state = newState;
        
        console.log(`Game state changed: ${this.previousState} -> ${this.state}`);
        
        // Force hide all screens - use both CSS classes and direct style
        Object.values(this.uiElements).forEach(element => {
            if (element) {
                element.classList.add('hidden');
                element.style.display = 'none'; // Force hide with style
                element.style.zIndex = '1'; // Ensure low z-index
            }
        });
        
        // Explicitly hide the canvas for menu states
        if (this.canvas) {
            if (['menu', 'gameMode', 'settings', 'instructions', 'multiplayerLobby', 'results'].includes(newState)) {
                this.canvas.classList.add('hidden');
                this.canvas.style.display = 'none';
            }
        }
        
        // Show appropriate screen
        switch (this.state) {
            case 'loading':
                this.showScreen('loadingScreen');
                break;
            case 'menu':
                this.showScreen('mainMenu');
                if (this.audio && this.audio.playMusic) {
                    this.audio.playMusic('menu', { fadeIn: 1 });
                }
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
                // Hide all menu screens first
                Object.values(this.uiElements).forEach(element => {
                    if (element && element.id !== 'gameUI') {
                        element.classList.add('hidden');
                        element.style.display = 'none';
                    }
                });
                
                // Show game UI and canvas
                this.showScreen('gameUI');
                if (this.canvas) {
                    this.canvas.classList.remove('hidden');
                    this.canvas.style.display = 'block';
                    this.canvas.style.zIndex = '1';
                }
                
                if (this.audio && this.audio.playMusic) {
                    this.audio.playMusic('race', { fadeIn: 1 });
                }
                break;
            case 'paused':
                this.showScreen('pauseMenu');
                break;
            case 'results':
                this.showScreen('resultsScreen');
                if (this.audio && this.audio.playMusic) {
                    this.audio.playMusic('results');
                }
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
            screen.style.display = 'flex'; // Force display
            screen.style.zIndex = '10'; // Ensure high z-index for menus
            
            // Special handling for game UI
            if (screenId === 'gameUI') {
                screen.style.zIndex = '5'; // Lower z-index for game UI
                screen.style.pointerEvents = 'none'; // Allow clicks to pass through
                
                // Re-enable pointer events for interactive elements
                const interactiveElements = screen.querySelectorAll('button, .control-btn, .pause-btn');
                interactiveElements.forEach(el => {
                    el.style.pointerEvents = 'auto';
                });
            }
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

    // Fallback system creators (minimal functional versions)
    createFallbackInputManager() {
        return {
            getInputState: () => ({ accelerate: 0, brake: 0, steer: 0, pause: false }),
            update: () => {},
            resetFrameInputs: () => {},
            setTiltSensitivity: () => {},
            calibrateTilt: () => {},
            getDebugInfo: () => ({ status: 'fallback mode' }),
            destroy: () => {}
        };
    }

    createFallbackGraphicsEngine() {
        return {
            render: () => {
                const ctx = this.canvas.getContext('2d');
                ctx.fillStyle = '#2d5a2d';
                ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                ctx.fillStyle = '#ffffff';
                ctx.font = '24px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('Game Running in Safe Mode', this.canvas.width/2, this.canvas.height/2);
            },
            updateCamera: () => {},
            updateParticles: () => {},
            setGraphicsQuality: () => {},
            resize: () => {},
            renderMinimap: () => {},
            loadingProgress: 1,
            track: this.createFallbackTrackData(),
            destroy: () => {}
        };
    }

    createFallbackPhysicsEngine() {
        return {
            initialize: () => {},
            update: () => {},
            checkCheckpoints: () => null,
            getRacePosition: () => 1,
            destroy: () => {}
        };
    }

    createFallbackAudioManager() {
        return {
            playMenuClick: () => {},
            playMusic: () => {},
            setSFXVolume: () => {},
            setMusicVolume: () => {},
            getVolumes: () => ({ sfx: 0.7, music: 0.5 }),
            startEngineSound: () => {},
            stopEngineSound: () => {},
            updateEngineSound: () => {},
            playCountdown: () => {},
            playRaceStart: () => {},
            playLapComplete: () => {},
            playCheckpoint: () => {},
            playRaceFinish: () => {},
            initialized: true,
            getDebugInfo: () => ({ status: 'fallback mode - no audio' }),
            destroy: () => {}
        };
    }

    createFallbackAIManager() {
        return {
            initialize: () => {},
            createRace: () => {},
            update: () => {},
            bots: [],
            destroy: () => {}
        };
    }

    createFallbackMultiplayerManager() {
        return {
            connect: () => Promise.reject(new Error('Multiplayer unavailable')),
            disconnect: () => {},
            playerId: 'fallback_player',
            playerName: 'Player',
            sendPlayerUpdate: () => {},
            getNetworkStats: () => ({ status: 'unavailable' }),
            destroy: () => {}
        };
    }

    createFallbackTrackData() {
        return {
            path: [],
            bounds: [],
            checkpoints: [],
            obstacles: [],
            startLine: { x: 100, y: 100, angle: 0 }
        };
    }

    destroy() {
        this.cleanup();
        
        if (this.input && this.input.destroy) this.input.destroy();
        if (this.graphics && this.graphics.destroy) this.graphics.destroy();
        if (this.physics && this.physics.destroy) this.physics.destroy();
        if (this.audio && this.audio.destroy) this.audio.destroy();
        if (this.ai && this.ai.destroy) this.ai.destroy();
        if (this.multiplayer && this.multiplayer.destroy) this.multiplayer.destroy();
        
        console.log('Game destroyed');
    }
}

// Global game instance
window.Game = Game;