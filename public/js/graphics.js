// Graphics Engine for GoKart Racing Game

class GraphicsEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        
        // Camera
        this.camera = {
            x: 0,
            y: 0,
            zoom: 1,
            targetX: 0,
            targetY: 0,
            targetZoom: 1,
            smoothing: 0.1
        };
        
        // Assets
        this.images = {};
        this.loadingProgress = 0;
        
        // Graphics settings
        this.settings = {
            quality: 'medium',
            shadows: true,
            particles: true,
            antialiasing: true,
            backgroundDetail: true
        };
        
        // Color schemes
        this.colors = {
            track: '#4a4a4a',
            trackLines: '#ffffff',
            grass: '#2d5a2d',
            dirt: '#8b7355',
            sky: '#87ceeb',
            karts: ['#ff4444', '#4444ff', '#44ff44', '#ffff44', '#ff44ff', '#44ffff'],
            ui: {
                background: 'rgba(0, 0, 0, 0.7)',
                text: '#ffffff',
                accent: '#667eea'
            }
        };
        
        // Particle systems
        this.particleSystems = [];
        
        this.initialize();
    }

    initialize() {
        this.setupCanvas();
        this.loadGraphicsSettings();
        this.createTrackData();
        this.preloadAssets();
        
        console.log('Graphics Engine initialized');
    }

    setupCanvas() {
        // Set up canvas for crisp rendering
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        
        this.ctx.scale(dpr, dpr);
        
        this.width = rect.width;
        this.height = rect.height;
        
        // Set rendering settings
        this.ctx.imageSmoothingEnabled = this.settings.antialiasing;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
    }

    // Create procedural track data
    createTrackData() {
        this.track = {
            path: [],
            bounds: [],
            checkpoints: [],
            startLine: { x: 500, y: 300, angle: 0 },
            width: 80
        };
        
        // Create a simple oval track
        this.generateOvalTrack(1000, 600, 300, 200);
    }

    generateOvalTrack(centerX, centerY, radiusX, radiusY) {
        const segments = 64;
        const path = [];
        const checkpoints = [];
        
        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const x = centerX + Math.cos(angle) * radiusX;
            const y = centerY + Math.sin(angle) * radiusY;
            
            path.push({ x, y, angle: angle + Math.PI / 2 });
            
            // Add checkpoints every 8 segments
            if (i % 8 === 0) {
                checkpoints.push({ 
                    x, 
                    y, 
                    radius: 30,
                    id: checkpoints.length 
                });
            }
        }
        
        this.track.path = path;
        this.track.checkpoints = checkpoints;
        this.track.bounds = this.generateTrackBounds(path, this.track.width);
        
        // Set start line
        this.track.startLine = {
            x: path[0].x,
            y: path[0].y,
            angle: path[0].angle
        };
    }

    generateTrackBounds(path, width) {
        const innerBounds = [];
        const outerBounds = [];
        
        for (const point of path) {
            const perpAngle = point.angle;
            const halfWidth = width / 2;
            
            // Inner bound
            innerBounds.push({
                x: point.x + Math.cos(perpAngle) * halfWidth,
                y: point.y + Math.sin(perpAngle) * halfWidth
            });
            
            // Outer bound
            outerBounds.push({
                x: point.x - Math.cos(perpAngle) * halfWidth,
                y: point.y - Math.sin(perpAngle) * halfWidth
            });
        }
        
        return { inner: innerBounds, outer: outerBounds };
    }

    // Asset loading
    async preloadAssets() {
        const assetList = [
            // We'll generate procedural graphics instead of loading images
        ];
        
        this.generateProceduralAssets();
        this.loadingProgress = 1;
    }

    generateProceduralAssets() {
        // Generate kart sprite
        this.images.kart = this.createKartSprite(40, 20);
        
        // Generate tire marks
        this.images.tireMark = this.createTireMarkSprite();
        
        // Generate particle sprites
        this.images.spark = this.createSparkSprite();
        this.images.smoke = this.createSmokeSprite();
        
        console.log('Procedural assets generated');
    }

    createKartSprite(width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // Draw kart body
        ctx.fillStyle = '#ff4444';
        ctx.beginPath();
        ctx.roundRect(5, 3, width - 10, height - 6, 3);
        ctx.fill();
        
        // Draw windshield
        ctx.fillStyle = '#87ceeb';
        ctx.beginPath();
        ctx.roundRect(8, 6, width - 16, height / 3, 2);
        ctx.fill();
        
        // Draw wheels
        ctx.fillStyle = '#333333';
        const wheelSize = 6;
        ctx.beginPath();
        ctx.arc(wheelSize, wheelSize, wheelSize / 2, 0, Math.PI * 2);
        ctx.arc(width - wheelSize, wheelSize, wheelSize / 2, 0, Math.PI * 2);
        ctx.arc(wheelSize, height - wheelSize, wheelSize / 2, 0, Math.PI * 2);
        ctx.arc(width - wheelSize, height - wheelSize, wheelSize / 2, 0, Math.PI * 2);
        ctx.fill();
        
        return canvas;
    }

    createTireMarkSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 4;
        canvas.height = 8;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 0, 4, 8);
        
        return canvas;
    }

    createSparkSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 4;
        canvas.height = 4;
        const ctx = canvas.getContext('2d');
        
        const gradient = ctx.createRadialGradient(2, 2, 0, 2, 2, 2);
        gradient.addColorStop(0, '#ffff00');
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 4, 4);
        
        return canvas;
    }

    createSmokeSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 8;
        canvas.height = 8;
        const ctx = canvas.getContext('2d');
        
        const gradient = ctx.createRadialGradient(4, 4, 0, 4, 4, 4);
        gradient.addColorStop(0, 'rgba(128, 128, 128, 0.5)');
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 8, 8);
        
        return canvas;
    }

    // Camera system
    updateCamera(targetKart) {
        if (!targetKart) return;
        
        // Calculate target camera position
        const leadDistance = 100;
        this.camera.targetX = targetKart.x + Math.cos(targetKart.rotation) * leadDistance - this.width / 2;
        this.camera.targetY = targetKart.y + Math.sin(targetKart.rotation) * leadDistance - this.height / 2;
        
        // Smooth camera movement
        this.camera.x = Utils.lerp(this.camera.x, this.camera.targetX, this.camera.smoothing);
        this.camera.y = Utils.lerp(this.camera.y, this.camera.targetY, this.camera.smoothing);
        this.camera.zoom = Utils.lerp(this.camera.zoom, this.camera.targetZoom, this.camera.smoothing * 0.5);
    }

    // Screen to world coordinate conversion
    screenToWorld(screenX, screenY) {
        return {
            x: (screenX / this.camera.zoom) + this.camera.x,
            y: (screenY / this.camera.zoom) + this.camera.y
        };
    }

    worldToScreen(worldX, worldY) {
        return {
            x: (worldX - this.camera.x) * this.camera.zoom,
            y: (worldY - this.camera.y) * this.camera.zoom
        };
    }

    // Main render function
    render(gameState) {
        this.clearCanvas();
        
        this.ctx.save();
        
        // Apply camera transform
        this.ctx.scale(this.camera.zoom, this.camera.zoom);
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        // Render game world
        this.renderBackground();
        this.renderTrack();
        this.renderCheckpoints(gameState.checkpoints);
        this.renderTireMarks(gameState.tireMarks);
        this.renderKarts(gameState.karts);
        this.renderParticles();
        this.renderEffects(gameState.effects);
        
        this.ctx.restore();
        
        // Render UI (not affected by camera)
        this.renderUI(gameState);
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    renderBackground() {
        // Sky gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, this.colors.sky);
        gradient.addColorStop(1, '#f0f8ff');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(this.camera.x, this.camera.y, this.width / this.camera.zoom, this.height / this.camera.zoom);
        
        // Grass
        this.ctx.fillStyle = this.colors.grass;
        this.ctx.fillRect(this.camera.x, this.camera.y, this.width / this.camera.zoom, this.height / this.camera.zoom);
        
        // Add grass texture if enabled
        if (this.settings.backgroundDetail) {
            this.renderGrassTexture();
        }
    }

    renderGrassTexture() {
        const ctx = this.ctx;
        const tileSize = 20;
        const startX = Math.floor(this.camera.x / tileSize) * tileSize;
        const startY = Math.floor(this.camera.y / tileSize) * tileSize;
        const endX = startX + (this.width / this.camera.zoom) + tileSize;
        const endY = startY + (this.height / this.camera.zoom) + tileSize;
        
        ctx.strokeStyle = 'rgba(0, 100, 0, 0.1)';
        ctx.lineWidth = 1;
        
        for (let x = startX; x < endX; x += tileSize) {
            for (let y = startY; y < endY; y += tileSize) {
                if (Math.random() > 0.8) {
                    ctx.beginPath();
                    ctx.moveTo(x + Math.random() * tileSize, y + Math.random() * tileSize);
                    ctx.lineTo(x + Math.random() * tileSize, y + Math.random() * tileSize);
                    ctx.stroke();
                }
            }
        }
    }

    renderTrack() {
        const track = this.track;
        
        // Draw track surface
        this.ctx.fillStyle = this.colors.track;
        this.ctx.strokeStyle = this.colors.trackLines;
        this.ctx.lineWidth = 2;
        
        // Draw track path
        if (track.path.length > 0) {
            this.ctx.beginPath();
            
            // Create track outline
            const outerPath = [];
            const innerPath = [];
            
            for (let i = 0; i < track.path.length; i++) {
                const point = track.path[i];
                const perpAngle = point.angle;
                const halfWidth = track.width / 2;
                
                outerPath.push({
                    x: point.x - Math.cos(perpAngle) * halfWidth,
                    y: point.y - Math.sin(perpAngle) * halfWidth
                });
                
                innerPath.push({
                    x: point.x + Math.cos(perpAngle) * halfWidth,
                    y: point.y + Math.sin(perpAngle) * halfWidth
                });
            }
            
            // Draw outer edge
            this.ctx.moveTo(outerPath[0].x, outerPath[0].y);
            for (let i = 1; i < outerPath.length; i++) {
                this.ctx.lineTo(outerPath[i].x, outerPath[i].y);
            }
            this.ctx.closePath();
            
            // Draw inner edge (reverse direction for hole)
            this.ctx.moveTo(innerPath[0].x, innerPath[0].y);
            for (let i = innerPath.length - 1; i >= 0; i--) {
                this.ctx.lineTo(innerPath[i].x, innerPath[i].y);
            }
            this.ctx.closePath();
            
            this.ctx.fill('evenodd');
            
            // Draw track center line
            this.ctx.strokeStyle = this.colors.trackLines;
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([10, 10]);
            this.ctx.beginPath();
            this.ctx.moveTo(track.path[0].x, track.path[0].y);
            for (let i = 1; i < track.path.length; i++) {
                this.ctx.lineTo(track.path[i].x, track.path[i].y);
            }
            this.ctx.closePath();
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }
        
        // Draw start/finish line
        this.renderStartLine();
    }

    renderStartLine() {
        const startLine = this.track.startLine;
        const width = this.track.width;
        
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 3;
        
        const perpAngle = startLine.angle;
        const halfWidth = width / 2;
        
        const x1 = startLine.x - Math.cos(perpAngle) * halfWidth;
        const y1 = startLine.y - Math.sin(perpAngle) * halfWidth;
        const x2 = startLine.x + Math.cos(perpAngle) * halfWidth;
        const y2 = startLine.y + Math.sin(perpAngle) * halfWidth;
        
        // Checkered pattern
        const segments = 8;
        const segmentLength = width / segments;
        
        for (let i = 0; i < segments; i++) {
            const t1 = i / segments;
            const t2 = (i + 1) / segments;
            
            const sx1 = Utils.lerp(x1, x2, t1);
            const sy1 = Utils.lerp(y1, y2, t1);
            const sx2 = Utils.lerp(x1, x2, t2);
            const sy2 = Utils.lerp(y1, y2, t2);
            
            this.ctx.strokeStyle = i % 2 === 0 ? '#ffffff' : '#000000';
            this.ctx.beginPath();
            this.ctx.moveTo(sx1, sy1);
            this.ctx.lineTo(sx2, sy2);
            this.ctx.stroke();
        }
    }

    renderCheckpoints(checkpoints) {
        if (!checkpoints || this.settings.quality === 'low') return;
        
        this.ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        
        for (const checkpoint of checkpoints) {
            this.ctx.beginPath();
            this.ctx.arc(checkpoint.x, checkpoint.y, checkpoint.radius, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        
        this.ctx.setLineDash([]);
    }

    renderTireMarks(tireMarks) {
        if (!tireMarks || !this.settings.particles) return;
        
        this.ctx.globalAlpha = 0.3;
        
        for (const mark of tireMarks) {
            if (mark.life > 0) {
                this.ctx.save();
                this.ctx.translate(mark.x, mark.y);
                this.ctx.rotate(mark.angle);
                this.ctx.drawImage(this.images.tireMark, -2, -4);
                this.ctx.restore();
            }
        }
        
        this.ctx.globalAlpha = 1;
    }

    renderKarts(karts) {
        if (!karts) return;
        
        // Sort karts by Y position for proper depth
        const sortedKarts = [...karts].sort((a, b) => a.y - b.y);
        
        for (const kart of sortedKarts) {
            this.renderKart(kart);
        }
    }

    renderKart(kart) {
        this.ctx.save();
        
        // Kart shadow
        if (this.settings.shadows) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.beginPath();
            this.ctx.ellipse(kart.x + 2, kart.y + 2, 20, 10, kart.rotation, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Kart body
        this.ctx.translate(kart.x, kart.y);
        this.ctx.rotate(kart.rotation);
        
        // Change color based on kart type/player
        const colorIndex = kart.playerId ? kart.playerId.charCodeAt(0) % this.colors.karts.length : 0;
        const kartColor = kart.color || this.colors.karts[colorIndex];
        
        // Custom kart rendering with color
        this.renderKartWithColor(kartColor, kart.isPlayer);
        
        this.ctx.restore();
        
        // Player name
        if (kart.name) {
            this.renderKartName(kart);
        }
        
        // Speed effects
        if (kart.physics && kart.physics.speed > 80) {
            this.renderSpeedEffects(kart);
        }
    }

    renderKartWithColor(color, isPlayer = false) {
        const width = 40;
        const height = 20;
        
        // Kart body
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.roundRect(-width/2, -height/2, width, height, 3);
        this.ctx.fill();
        
        // Player indicator
        if (isPlayer) {
            this.ctx.strokeStyle = '#ffff00';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }
        
        // Windshield
        this.ctx.fillStyle = 'rgba(135, 206, 235, 0.7)';
        this.ctx.beginPath();
        this.ctx.roundRect(-width/2 + 5, -height/2 + 3, width - 10, height/3, 2);
        this.ctx.fill();
        
        // Wheels
        this.ctx.fillStyle = '#333333';
        const wheelSize = 3;
        this.ctx.beginPath();
        this.ctx.arc(-width/2 + 8, -height/2 + 4, wheelSize, 0, Math.PI * 2);
        this.ctx.arc(width/2 - 8, -height/2 + 4, wheelSize, 0, Math.PI * 2);
        this.ctx.arc(-width/2 + 8, height/2 - 4, wheelSize, 0, Math.PI * 2);
        this.ctx.arc(width/2 - 8, height/2 - 4, wheelSize, 0, Math.PI * 2);
        this.ctx.fill();
    }

    renderKartName(kart) {
        this.ctx.save();
        this.ctx.fillStyle = '#ffffff';
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 2;
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'bottom';
        
        const nameX = kart.x;
        const nameY = kart.y - 25;
        
        this.ctx.strokeText(kart.name, nameX, nameY);
        this.ctx.fillText(kart.name, nameX, nameY);
        
        this.ctx.restore();
    }

    renderSpeedEffects(kart) {
        if (!this.settings.particles) return;
        
        // Speed lines
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 1;
        
        for (let i = 0; i < 3; i++) {
            const offsetX = (Math.random() - 0.5) * 10;
            const offsetY = (Math.random() - 0.5) * 10;
            const lineLength = 20 + Math.random() * 10;
            
            const startX = kart.x - Math.cos(kart.rotation) * 30 + offsetX;
            const startY = kart.y - Math.sin(kart.rotation) * 30 + offsetY;
            const endX = startX - Math.cos(kart.rotation) * lineLength;
            const endY = startY - Math.sin(kart.rotation) * lineLength;
            
            this.ctx.beginPath();
            this.ctx.moveTo(startX, startY);
            this.ctx.lineTo(endX, endY);
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }

    renderParticles() {
        if (!this.settings.particles) return;
        
        for (const system of this.particleSystems) {
            for (const particle of system.particles) {
                if (particle.life > 0) {
                    this.ctx.save();
                    this.ctx.globalAlpha = particle.life / particle.maxLife;
                    this.ctx.translate(particle.x, particle.y);
                    this.ctx.scale(particle.scale, particle.scale);
                    
                    if (particle.type === 'spark') {
                        this.ctx.drawImage(this.images.spark, -2, -2);
                    } else if (particle.type === 'smoke') {
                        this.ctx.drawImage(this.images.smoke, -4, -4);
                    }
                    
                    this.ctx.restore();
                }
            }
        }
    }

    renderEffects(effects) {
        if (!effects) return;
        
        // Collision effects, power-ups, etc.
        for (const effect of effects) {
            this.renderEffect(effect);
        }
    }

    renderEffect(effect) {
        switch (effect.type) {
            case 'collision':
                this.renderCollisionEffect(effect);
                break;
            case 'boost':
                this.renderBoostEffect(effect);
                break;
        }
    }

    renderCollisionEffect(effect) {
        this.ctx.save();
        this.ctx.translate(effect.x, effect.y);
        
        const progress = 1 - (effect.life / effect.maxLife);
        const radius = progress * 30;
        
        this.ctx.strokeStyle = `rgba(255, 255, 0, ${1 - progress})`;
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
        this.ctx.stroke();
        
        this.ctx.restore();
    }

    renderBoostEffect(effect) {
        this.ctx.save();
        this.ctx.translate(effect.x, effect.y);
        
        const progress = 1 - (effect.life / effect.maxLife);
        
        this.ctx.fillStyle = `rgba(0, 255, 255, ${1 - progress})`;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 15 * (1 + progress), 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }

    renderUI(gameState) {
        // UI rendering is handled by the main game UI elements
        // This can be used for additional HUD elements
    }

    // Minimap rendering
    renderMinimap(gameState, minimapCanvas) {
        const ctx = minimapCanvas.getContext('2d');
        const width = minimapCanvas.width;
        const height = minimapCanvas.height;
        
        ctx.clearRect(0, 0, width, height);
        
        // Scale factor for minimap
        const scaleX = width / 2000;  // Assuming 2000x2000 world
        const scaleY = height / 2000;
        
        ctx.save();
        ctx.scale(scaleX, scaleY);
        
        // Draw track outline
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 3 / Math.min(scaleX, scaleY);
        
        if (this.track.path.length > 0) {
            ctx.beginPath();
            ctx.moveTo(this.track.path[0].x, this.track.path[0].y);
            for (let i = 1; i < this.track.path.length; i++) {
                ctx.lineTo(this.track.path[i].x, this.track.path[i].y);
            }
            ctx.closePath();
            ctx.stroke();
        }
        
        // Draw karts
        if (gameState.karts) {
            for (const kart of gameState.karts) {
                ctx.fillStyle = kart.isPlayer ? '#ffff00' : '#ff4444';
                ctx.beginPath();
                ctx.arc(kart.x, kart.y, 5 / Math.min(scaleX, scaleY), 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        ctx.restore();
        
        // Draw border
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, width, height);
    }

    // Particle system management
    createParticleSystem(x, y, type, count = 10) {
        const system = {
            x, y, type,
            particles: []
        };
        
        for (let i = 0; i < count; i++) {
            system.particles.push(this.createParticle(x, y, type));
        }
        
        this.particleSystems.push(system);
        
        // Clean up old systems
        this.particleSystems = this.particleSystems.filter(sys => 
            sys.particles.some(p => p.life > 0)
        );
    }

    createParticle(x, y, type) {
        const particle = {
            x: x + (Math.random() - 0.5) * 10,
            y: y + (Math.random() - 0.5) * 10,
            vx: (Math.random() - 0.5) * 100,
            vy: (Math.random() - 0.5) * 100,
            life: 1,
            maxLife: 1,
            scale: 0.5 + Math.random() * 0.5,
            type
        };
        
        if (type === 'spark') {
            particle.life = 0.5 + Math.random() * 0.5;
            particle.maxLife = particle.life;
        } else if (type === 'smoke') {
            particle.life = 1 + Math.random();
            particle.maxLife = particle.life;
            particle.vy -= 20; // Rise up
        }
        
        return particle;
    }

    updateParticles(deltaTime) {
        for (const system of this.particleSystems) {
            for (const particle of system.particles) {
                if (particle.life > 0) {
                    particle.x += particle.vx * deltaTime;
                    particle.y += particle.vy * deltaTime;
                    particle.life -= deltaTime;
                    
                    // Gravity for smoke
                    if (particle.type === 'smoke') {
                        particle.vy += 10 * deltaTime;
                    }
                }
            }
        }
    }

    // Settings management
    loadGraphicsSettings() {
        const settings = Utils.loadFromLocalStorage('graphicsSettings', {});
        
        this.settings = {
            ...this.settings,
            ...settings
        };
        
        this.applyGraphicsSettings();
    }

    applyGraphicsSettings() {
        this.ctx.imageSmoothingEnabled = this.settings.antialiasing;
        
        // Adjust particle systems based on quality
        if (this.settings.quality === 'low') {
            this.settings.particles = false;
            this.settings.shadows = false;
        }
    }

    setGraphicsQuality(quality) {
        this.settings.quality = quality;
        
        switch (quality) {
            case 'low':
                this.settings.shadows = false;
                this.settings.particles = false;
                this.settings.backgroundDetail = false;
                break;
            case 'medium':
                this.settings.shadows = true;
                this.settings.particles = true;
                this.settings.backgroundDetail = false;
                break;
            case 'high':
                this.settings.shadows = true;
                this.settings.particles = true;
                this.settings.backgroundDetail = true;
                break;
        }
        
        this.applyGraphicsSettings();
        this.saveGraphicsSettings();
    }

    saveGraphicsSettings() {
        Utils.saveToLocalStorage('graphicsSettings', this.settings);
    }

    // Resize handling
    resize() {
        this.setupCanvas();
    }

    // Cleanup
    destroy() {
        this.particleSystems = [];
        console.log('Graphics Engine destroyed');
    }
}

// Global graphics engine instance
window.GraphicsEngine = GraphicsEngine;