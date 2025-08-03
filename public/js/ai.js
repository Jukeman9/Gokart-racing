// AI System for GoKart Racing Game

class AIManager {
    constructor() {
        this.bots = [];
        this.trackPath = [];
        this.difficultySettings = {
            easy: {
                reactionTime: 0.3,
                maxSpeed: 0.7,
                corneringSkill: 0.6,
                aggressiveness: 0.3,
                mistakeFrequency: 0.15,
                lookAheadDistance: 50
            },
            medium: {
                reactionTime: 0.2,
                maxSpeed: 0.85,
                corneringSkill: 0.8,
                aggressiveness: 0.6,
                mistakeFrequency: 0.08,
                lookAheadDistance: 80
            },
            hard: {
                reactionTime: 0.1,
                maxSpeed: 0.95,
                corneringSkill: 0.95,
                aggressiveness: 0.8,
                mistakeFrequency: 0.03,
                lookAheadDistance: 120
            }
        };
    }

    initialize(trackData) {
        this.trackPath = trackData.path || [];
        this.checkpoints = trackData.checkpoints || [];
        console.log('AI Manager initialized with track data');
    }

    // Create AI bot
    createBot(id, difficulty = 'medium', kartType = 'balanced') {
        const settings = this.difficultySettings[difficulty];
        
        const bot = {
            id: id,
            difficulty: difficulty,
            settings: { ...settings },
            
            // Navigation
            currentTarget: 0,
            targetPosition: { x: 0, y: 0 },
            pathProgress: 0,
            
            // Behavior state
            reactionDelay: 0,
            nextMistake: this.calculateNextMistake(settings.mistakeFrequency),
            mistakeTimer: 0,
            
            // Combat AI
            lastCollisionTime: 0,
            aggressionCooldown: 0,
            
            // Performance tracking
            cornersLeft: 0,
            overallPerformance: 1.0,
            
            // Controls output
            controls: {
                accelerate: 0,
                brake: 0,
                steer: 0
            }
        };
        
        this.bots.push(bot);
        return bot;
    }

    // Update all AI bots
    update(deltaTime, karts, playerKart) {
        for (const bot of this.bots) {
            const kart = karts.find(k => k.id === bot.id);
            if (kart) {
                this.updateBot(bot, kart, deltaTime, karts, playerKart);
            }
        }
    }

    // Update individual bot
    updateBot(bot, kart, deltaTime, allKarts, playerKart) {
        // Update timers
        bot.reactionDelay = Math.max(0, bot.reactionDelay - deltaTime);
        bot.mistakeTimer = Math.max(0, bot.mistakeTimer - deltaTime);
        bot.aggressionCooldown = Math.max(0, bot.aggressionCooldown - deltaTime);
        
        // Navigation
        this.updateNavigation(bot, kart);
        
        // Behavioral decisions
        this.updateBehavior(bot, kart, deltaTime, allKarts, playerKart);
        
        // Generate controls
        this.generateControls(bot, kart, deltaTime);
        
        // Apply controls to kart
        if (kart.controls) {
            kart.controls = { ...bot.controls };
        }
    }

    // Update navigation and pathfinding
    updateNavigation(bot, kart) {
        if (this.trackPath.length === 0) return;
        
        // Find closest point on track
        let closestDistance = Infinity;
        let closestIndex = 0;
        
        for (let i = 0; i < this.trackPath.length; i++) {
            const distance = Utils.distance(
                kart.x, kart.y,
                this.trackPath[i].x, this.trackPath[i].y
            );
            
            if (distance < closestDistance) {
                closestDistance = distance;
                closestIndex = i;
            }
        }
        
        // Set target ahead of current position
        const lookAhead = Math.floor(bot.settings.lookAheadDistance / 30); // Convert to path segments
        bot.currentTarget = (closestIndex + lookAhead) % this.trackPath.length;
        bot.targetPosition = {
            x: this.trackPath[bot.currentTarget].x,
            y: this.trackPath[bot.currentTarget].y
        };
        
        // Calculate path progress (0-1)
        bot.pathProgress = closestIndex / this.trackPath.length;
    }

    // Update AI behavior and decision making
    updateBehavior(bot, kart, deltaTime, allKarts, playerKart) {
        // Performance adjustment based on position
        const position = this.calculateRacePosition(kart, allKarts);
        this.adjustPerformanceBasedOnPosition(bot, position, allKarts.length);
        
        // Collision avoidance
        this.updateCollisionAvoidance(bot, kart, allKarts);
        
        // Defensive/aggressive behavior
        this.updateCombatBehavior(bot, kart, allKarts, playerKart);
        
        // Mistake simulation
        this.updateMistakeBehavior(bot, deltaTime);
    }

    // Calculate race position
    calculateRacePosition(kart, allKarts) {
        if (!kart.raceData) return allKarts.length;
        
        const sortedKarts = allKarts
            .filter(k => k.raceData)
            .sort((a, b) => {
                if (a.raceData.lapCount !== b.raceData.lapCount) {
                    return b.raceData.lapCount - a.raceData.lapCount;
                }
                return b.raceData.currentCheckpoint - a.raceData.currentCheckpoint;
            });
        
        return sortedKarts.findIndex(k => k.id === kart.id) + 1;
    }

    // Adjust performance based on race position
    adjustPerformanceBasedOnPosition(bot, position, totalKarts) {
        const relativePosition = position / totalKarts;
        
        // Rubber band AI - make trailing bots faster, leading bots slower
        if (relativePosition > 0.7) { // Trailing
            bot.overallPerformance = 1.0 + (relativePosition - 0.7) * 0.5;
        } else if (relativePosition < 0.3) { // Leading
            bot.overallPerformance = 1.0 - (0.3 - relativePosition) * 0.3;
        } else {
            bot.overallPerformance = 1.0;
        }
        
        bot.overallPerformance = Utils.clamp(bot.overallPerformance, 0.6, 1.3);
    }

    // Collision avoidance behavior
    updateCollisionAvoidance(bot, kart, allKarts) {
        bot.avoidanceVector = { x: 0, y: 0 };
        
        for (const otherKart of allKarts) {
            if (otherKart.id === kart.id) continue;
            
            const distance = Utils.distance(kart.x, kart.y, otherKart.x, otherKart.y);
            const avoidanceRadius = 80;
            
            if (distance < avoidanceRadius && distance > 0) {
                // Calculate avoidance vector
                const avoidanceStrength = (avoidanceRadius - distance) / avoidanceRadius;
                const angle = Utils.angle(otherKart.x, otherKart.y, kart.x, kart.y);
                
                bot.avoidanceVector.x += Math.cos(angle) * avoidanceStrength;
                bot.avoidanceVector.y += Math.sin(angle) * avoidanceStrength;
            }
        }
    }

    // Combat and racing behavior
    updateCombatBehavior(bot, kart, allKarts, playerKart) {
        if (!kart.physics) return;
        
        // Check for nearby opponents
        const nearbyOpponents = allKarts.filter(otherKart => {
            if (otherKart.id === kart.id) return false;
            const distance = Utils.distance(kart.x, kart.y, otherKart.x, otherKart.y);
            return distance < 100;
        });
        
        bot.inCombat = nearbyOpponents.length > 0;
        
        // Increase aggression when near player (if applicable)
        if (playerKart && bot.aggressionCooldown <= 0) {
            const distanceToPlayer = Utils.distance(kart.x, kart.y, playerKart.x, playerKart.y);
            if (distanceToPlayer < 60) {
                bot.aggressionBonus = bot.settings.aggressiveness * 0.5;
                bot.aggressionCooldown = 2.0; // 2 second cooldown
            }
        }
        
        bot.aggressionBonus = bot.aggressionBonus || 0;
        bot.aggressionBonus = Math.max(0, bot.aggressionBonus - 0.1);
    }

    // Simulate mistakes and imperfect driving
    updateMistakeBehavior(bot, deltaTime) {
        if (bot.mistakeTimer <= 0 && Math.random() < bot.settings.mistakeFrequency * deltaTime) {
            // Trigger mistake
            const mistakeTypes = ['overcorrect', 'brake_early', 'miss_apex', 'wheelspin'];
            const mistakeType = Utils.randomChoice(mistakeTypes);
            
            switch (mistakeType) {
                case 'overcorrect':
                    bot.steerMistake = (Math.random() - 0.5) * 2;
                    bot.mistakeTimer = 0.5;
                    break;
                case 'brake_early':
                    bot.brakeMistake = 1.0;
                    bot.mistakeTimer = 0.3;
                    break;
                case 'miss_apex':
                    bot.targetOffset = (Math.random() - 0.5) * 40;
                    bot.mistakeTimer = 1.0;
                    break;
                case 'wheelspin':
                    bot.accelerateMistake = -0.5;
                    bot.mistakeTimer = 0.4;
                    break;
            }
            
            bot.nextMistake = this.calculateNextMistake(bot.settings.mistakeFrequency);
        }
        
        // Decay mistakes
        if (bot.steerMistake) {
            bot.steerMistake *= 0.9;
            if (Math.abs(bot.steerMistake) < 0.1) bot.steerMistake = 0;
        }
        
        if (bot.brakeMistake) {
            bot.brakeMistake *= 0.8;
            if (bot.brakeMistake < 0.1) bot.brakeMistake = 0;
        }
        
        if (bot.accelerateMistake) {
            bot.accelerateMistake *= 0.9;
            if (Math.abs(bot.accelerateMistake) < 0.1) bot.accelerateMistake = 0;
        }
        
        if (bot.targetOffset) {
            bot.targetOffset *= 0.95;
            if (Math.abs(bot.targetOffset) < 5) bot.targetOffset = 0;
        }
    }

    // Generate control inputs
    generateControls(bot, kart, deltaTime) {
        if (!kart.physics) return;
        
        // Calculate steering
        let targetX = bot.targetPosition.x + (bot.targetOffset || 0);
        let targetY = bot.targetPosition.y;
        
        // Apply avoidance
        if (bot.avoidanceVector) {
            targetX += bot.avoidanceVector.x * 50;
            targetY += bot.avoidanceVector.y * 50;
        }
        
        const targetAngle = Utils.angle(kart.x, kart.y, targetX, targetY);
        const angleDiff = Utils.angleDifference(kart.rotation, targetAngle);
        
        // Steering calculation
        let steerInput = angleDiff / Math.PI; // Normalize to -1, 1
        steerInput = Utils.clamp(steerInput, -1, 1);
        
        // Apply cornering skill
        steerInput *= bot.settings.corneringSkill;
        
        // Apply mistakes
        if (bot.steerMistake) {
            steerInput += bot.steerMistake;
        }
        
        // Apply reaction delay
        if (bot.reactionDelay > 0) {
            steerInput *= 0.5; // Delayed reaction
        }
        
        bot.controls.steer = Utils.clamp(steerInput, -1, 1);
        
        // Calculate acceleration
        const currentSpeed = kart.physics.speed;
        const maxSpeed = kart.physics.maxSpeed * bot.settings.maxSpeed * bot.overallPerformance;
        
        let accelerateInput = 1.0;
        
        // Speed management
        if (currentSpeed > maxSpeed * 0.9) {
            accelerateInput = 0.5;
        }
        
        // Corner braking
        const cornerSeverity = Math.abs(angleDiff) / Math.PI;
        if (cornerSeverity > 0.3) {
            const brakingFactor = (cornerSeverity - 0.3) / 0.7;
            accelerateInput = Math.max(0.3, 1.0 - brakingFactor * bot.settings.corneringSkill);
        }
        
        // Apply mistakes
        if (bot.accelerateMistake) {
            accelerateInput += bot.accelerateMistake;
        }
        
        bot.controls.accelerate = Utils.clamp(accelerateInput, 0, 1);
        
        // Calculate braking
        let brakeInput = 0;
        
        // Emergency braking for collisions
        if (bot.avoidanceVector && Utils.vectorMagnitude(bot.avoidanceVector) > 0.5) {
            brakeInput = 0.6;
        }
        
        // Corner braking
        if (cornerSeverity > 0.5 && currentSpeed > maxSpeed * 0.6) {
            brakeInput = Math.max(brakeInput, (cornerSeverity - 0.5) * 2 * bot.settings.corneringSkill);
        }
        
        // Apply mistakes
        if (bot.brakeMistake) {
            brakeInput = Math.max(brakeInput, bot.brakeMistake);
        }
        
        bot.controls.brake = Utils.clamp(brakeInput, 0, 1);
        
        // Prevent accelerate and brake at same time
        if (bot.controls.brake > 0.3) {
            bot.controls.accelerate = Math.min(bot.controls.accelerate, 0.3);
        }
    }

    // Calculate when next mistake should occur
    calculateNextMistake(frequency) {
        return Utils.now() + (1 / frequency) * (0.5 + Math.random());
    }

    // Get bot by ID
    getBot(id) {
        return this.bots.find(bot => bot.id === id);
    }

    // Remove bot
    removeBot(id) {
        this.bots = this.bots.filter(bot => bot.id !== id);
    }

    // Set difficulty for specific bot
    setBotDifficulty(id, difficulty) {
        const bot = this.getBot(id);
        if (bot && this.difficultySettings[difficulty]) {
            bot.difficulty = difficulty;
            bot.settings = { ...this.difficultySettings[difficulty] };
        }
    }

    // Get all bots of specific difficulty
    getBotsByDifficulty(difficulty) {
        return this.bots.filter(bot => bot.difficulty === difficulty);
    }

    // Performance analysis
    getBotPerformance(id) {
        const bot = this.getBot(id);
        if (!bot) return null;
        
        return {
            difficulty: bot.difficulty,
            performance: bot.overallPerformance,
            mistakes: bot.mistakeTimer > 0,
            inCombat: bot.inCombat,
            pathProgress: bot.pathProgress
        };
    }

    // Create multiple bots for race
    createRace(difficulty, count = 3) {
        // Clear existing bots
        this.bots = [];
        
        const kartTypes = ['speed', 'handling', 'balanced'];
        const botNames = [
            'Speed Demon', 'Corner King', 'Road Warrior', 
            'Drift Master', 'Track Terror', 'Race Ace',
            'Turbo Tim', 'Swift Sarah', 'Lightning Lee'
        ];
        
        for (let i = 0; i < count; i++) {
            const kartType = Utils.randomChoice(kartTypes);
            const botName = botNames[i % botNames.length];
            
            this.createBot(`bot_${i}`, difficulty, kartType);
        }
        
        console.log(`Created ${count} ${difficulty} bots for race`);
    }

    // Update difficulty settings dynamically
    updateDifficultySettings(difficulty, settings) {
        if (this.difficultySettings[difficulty]) {
            this.difficultySettings[difficulty] = {
                ...this.difficultySettings[difficulty],
                ...settings
            };
        }
    }

    // Debug information
    getDebugInfo() {
        return {
            botsCount: this.bots.length,
            trackPathLength: this.trackPath.length,
            difficulties: Object.keys(this.difficultySettings),
            activeBots: this.bots.map(bot => ({
                id: bot.id,
                difficulty: bot.difficulty,
                performance: bot.overallPerformance,
                controls: bot.controls
            }))
        };
    }

    // Cleanup
    destroy() {
        this.bots = [];
        console.log('AI Manager destroyed');
    }
}

// Global AI manager instance
window.AIManager = AIManager;