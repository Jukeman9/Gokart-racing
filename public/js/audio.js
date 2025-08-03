// Audio System for GoKart Racing Game

class AudioManager {
    constructor() {
        this.audioContext = null;
        this.sounds = {};
        this.music = {};
        this.currentMusic = null;
        this.musicGain = null;
        this.sfxGain = null;
        
        // Volume settings
        this.volumes = {
            master: 0.7,
            music: 0.5,
            sfx: 0.7
        };
        
        // Audio enabled state
        this.enabled = true;
        this.initialized = false;
        
        // Preload queue
        this.loadQueue = [];
        this.loadProgress = 0;
        
        this.initialize();
    }

    async initialize() {
        try {
            this.loadVolumeSettings();
            await this.initializeWebAudio();
            this.createProceduralSounds();
            this.loadProceduralMusic();
            this.initialized = true;
            console.log('Audio Manager initialized');
        } catch (error) {
            console.warn('Audio initialization failed:', error);
            this.enabled = false;
        }
    }

    async initializeWebAudio() {
        // Create audio context (requires user interaction on modern browsers)
        this.audioContext = Utils.createAudioContext();
        
        if (this.audioContext.state === 'suspended') {
            // Will be resumed on first user interaction
            document.addEventListener('click', this.resumeAudioContext.bind(this), { once: true });
            document.addEventListener('touchstart', this.resumeAudioContext.bind(this), { once: true });
        }
        
        // Create gain nodes for volume control
        this.masterGain = this.audioContext.createGain();
        this.musicGain = this.audioContext.createGain();
        this.sfxGain = this.audioContext.createGain();
        
        // Connect gain nodes
        this.musicGain.connect(this.masterGain);
        this.sfxGain.connect(this.masterGain);
        this.masterGain.connect(this.audioContext.destination);
        
        // Set initial volumes
        this.updateVolumes();
    }

    async resumeAudioContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
            console.log('Audio context resumed');
        }
    }

    // Create procedural sound effects using Web Audio API
    createProceduralSounds() {
        // Engine sound
        this.sounds.engine = this.createEngineSound();
        
        // Collision sound
        this.sounds.collision = this.createCollisionSound();
        
        // Brake sound
        this.sounds.brake = this.createBrakeSound();
        
        // Tire screech
        this.sounds.tireScreech = this.createTireScreechSound();
        
        // Boost sound
        this.sounds.boost = this.createBoostSound();
        
        // Checkpoint sound
        this.sounds.checkpoint = this.createCheckpointSound();
        
        // Lap complete sound
        this.sounds.lapComplete = this.createLapCompleteSound();
        
        // Race finish sound
        this.sounds.raceFinish = this.createRaceFinishSound();
        
        // Menu click sound
        this.sounds.menuClick = this.createMenuClickSound();
        
        // Countdown sounds
        this.sounds.countdown = this.createCountdownSound();
        
        // Start race sound
        this.sounds.raceStart = this.createRaceStartSound();
        
        console.log('Procedural sounds created');
    }

    createEngineSound() {
        const duration = 0.5;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const frequency = 80 + Math.sin(t * 20) * 20; // Variable frequency
            const noise = (Math.random() - 0.5) * 0.3;
            data[i] = Math.sin(t * frequency * 2 * Math.PI) * 0.3 + noise;
        }
        
        return buffer;
    }

    createCollisionSound() {
        const duration = 0.3;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const decay = Math.exp(-t * 10);
            const noise = (Math.random() - 0.5) * 2;
            data[i] = noise * decay * 0.5;
        }
        
        return buffer;
    }

    createBrakeSound() {
        const duration = 0.8;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const frequency = 200 + Math.sin(t * 30) * 50;
            const envelope = Math.exp(-t * 2);
            const noise = (Math.random() - 0.5) * 0.4;
            data[i] = (Math.sin(t * frequency * 2 * Math.PI) * 0.3 + noise) * envelope;
        }
        
        return buffer;
    }

    createTireScreechSound() {
        const duration = 1.0;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const frequency = 800 + Math.sin(t * 15) * 200;
            const envelope = Math.max(0, 1 - t);
            const noise = (Math.random() - 0.5) * 0.6;
            data[i] = (Math.sin(t * frequency * 2 * Math.PI) * 0.2 + noise * 0.4) * envelope;
        }
        
        return buffer;
    }

    createBoostSound() {
        const duration = 0.5;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const frequency = 200 + t * 800; // Rising frequency
            const envelope = Math.exp(-t * 3);
            data[i] = Math.sin(t * frequency * 2 * Math.PI) * envelope * 0.4;
        }
        
        return buffer;
    }

    createCheckpointSound() {
        const duration = 0.3;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const frequency = 440 * Math.pow(2, Math.floor(t * 8) / 12); // Arpeggio
            const envelope = Math.max(0, 1 - t * 3);
            data[i] = Math.sin(t * frequency * 2 * Math.PI) * envelope * 0.3;
        }
        
        return buffer;
    }

    createLapCompleteSound() {
        const duration = 1.0;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        
        const notes = [261.63, 329.63, 392.00, 523.25]; // C-E-G-C major chord
        
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const noteIndex = Math.floor(t * 4) % notes.length;
            const frequency = notes[noteIndex];
            const envelope = Math.max(0, 1 - t);
            data[i] = Math.sin(t * frequency * 2 * Math.PI) * envelope * 0.3;
        }
        
        return buffer;
    }

    createRaceFinishSound() {
        const duration = 2.0;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const frequency = 440 + Math.sin(t * 4) * 100; // Victory fanfare
            const envelope = Math.exp(-t * 0.5);
            data[i] = Math.sin(t * frequency * 2 * Math.PI) * envelope * 0.4;
        }
        
        return buffer;
    }

    createMenuClickSound() {
        const duration = 0.1;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const frequency = 800;
            const envelope = Math.exp(-t * 50);
            data[i] = Math.sin(t * frequency * 2 * Math.PI) * envelope * 0.2;
        }
        
        return buffer;
    }

    createCountdownSound() {
        const duration = 0.5;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const frequency = 1000;
            const envelope = Math.exp(-t * 5);
            data[i] = Math.sin(t * frequency * 2 * Math.PI) * envelope * 0.3;
        }
        
        return buffer;
    }

    createRaceStartSound() {
        const duration = 0.8;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const frequency = 1500;
            const envelope = Math.exp(-t * 3);
            data[i] = Math.sin(t * frequency * 2 * Math.PI) * envelope * 0.4;
        }
        
        return buffer;
    }

    // Create procedural background music
    loadProceduralMusic() {
        this.music.menu = this.createMenuMusic();
        this.music.race = this.createRaceMusic();
        this.music.results = this.createResultsMusic();
        
        console.log('Procedural music created');
    }

    createMenuMusic() {
        const duration = 30; // 30 seconds loop
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(2, duration * sampleRate, sampleRate);
        const leftData = buffer.getChannelData(0);
        const rightData = buffer.getChannelData(1);
        
        const bpm = 120;
        const beatDuration = 60 / bpm;
        
        for (let i = 0; i < leftData.length; i++) {
            const t = i / sampleRate;
            const beat = Math.floor(t / beatDuration) % 4;
            
            // Simple chord progression
            const chords = [
                [261.63, 329.63, 392.00], // C major
                [196.00, 246.94, 293.66], // G major
                [220.00, 277.18, 329.63], // A minor
                [174.61, 220.00, 261.63]  // F major
            ];
            
            const chord = chords[Math.floor(t / (beatDuration * 4)) % chords.length];
            
            let sample = 0;
            for (const freq of chord) {
                sample += Math.sin(t * freq * 2 * Math.PI) * 0.1;
            }
            
            // Add some rhythm
            const envelope = Math.sin(t * Math.PI * bpm / 60) * 0.3 + 0.7;
            sample *= envelope;
            
            leftData[i] = sample;
            rightData[i] = sample * 0.8; // Slightly different for stereo effect
        }
        
        return buffer;
    }

    createRaceMusic() {
        const duration = 45; // 45 seconds loop
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(2, duration * sampleRate, sampleRate);
        const leftData = buffer.getChannelData(0);
        const rightData = buffer.getChannelData(1);
        
        const bpm = 140; // Faster tempo for racing
        
        for (let i = 0; i < leftData.length; i++) {
            const t = i / sampleRate;
            
            // Bass line
            const bassFreq = 80 + Math.sin(t * 0.5) * 20;
            const bass = Math.sin(t * bassFreq * 2 * Math.PI) * 0.3;
            
            // Lead melody
            const leadFreq = 440 + Math.sin(t * 2) * 100;
            const lead = Math.sin(t * leadFreq * 2 * Math.PI) * 0.2;
            
            // Percussion-like effect
            const percussion = (Math.random() - 0.5) * 0.1 * Math.sin(t * bpm / 60 * Math.PI * 4);
            
            const sample = bass + lead + percussion;
            
            leftData[i] = sample;
            rightData[i] = sample * 0.9;
        }
        
        return buffer;
    }

    createResultsMusic() {
        const duration = 20; // 20 seconds
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(2, duration * sampleRate, sampleRate);
        const leftData = buffer.getChannelData(0);
        const rightData = buffer.getChannelData(1);
        
        for (let i = 0; i < leftData.length; i++) {
            const t = i / sampleRate;
            
            // Victory melody
            const frequency = 523.25 + Math.sin(t * 0.5) * 50; // High C with vibrato
            const envelope = Math.exp(-t * 0.1); // Slow fade
            const sample = Math.sin(t * frequency * 2 * Math.PI) * envelope * 0.3;
            
            leftData[i] = sample;
            rightData[i] = sample;
        }
        
        return buffer;
    }

    // Play sound effect
    playSound(soundName, options = {}) {
        if (!this.enabled || !this.initialized || !this.sounds[soundName]) {
            return null;
        }

        try {
            const source = this.audioContext.createBufferSource();
            source.buffer = this.sounds[soundName];
            
            // Create gain node for this sound
            const gainNode = this.audioContext.createGain();
            source.connect(gainNode);
            gainNode.connect(this.sfxGain);
            
            // Apply options
            if (options.volume !== undefined) {
                gainNode.gain.value = options.volume;
            }
            
            if (options.loop) {
                source.loop = true;
            }
            
            if (options.playbackRate) {
                source.playbackRate.value = options.playbackRate;
            }
            
            source.start(0);
            
            if (options.duration) {
                source.stop(this.audioContext.currentTime + options.duration);
            }
            
            return source;
        } catch (error) {
            console.warn('Error playing sound:', error);
            return null;
        }
    }

    // Play background music
    playMusic(musicName, options = {}) {
        if (!this.enabled || !this.initialized || !this.music[musicName]) {
            return;
        }

        // Stop current music
        this.stopMusic();

        try {
            const source = this.audioContext.createBufferSource();
            source.buffer = this.music[musicName];
            source.loop = options.loop !== false; // Default to loop
            
            source.connect(this.musicGain);
            source.start(0);
            
            this.currentMusic = source;
            
            // Fade in
            if (options.fadeIn) {
                this.musicGain.gain.setValueAtTime(0, this.audioContext.currentTime);
                this.musicGain.gain.linearRampToValueAtTime(
                    this.volumes.music, 
                    this.audioContext.currentTime + options.fadeIn
                );
            }
            
        } catch (error) {
            console.warn('Error playing music:', error);
        }
    }

    // Stop current music
    stopMusic(fadeOut = 0.5) {
        if (this.currentMusic) {
            if (fadeOut > 0) {
                this.musicGain.gain.linearRampToValueAtTime(
                    0, 
                    this.audioContext.currentTime + fadeOut
                );
                setTimeout(() => {
                    if (this.currentMusic) {
                        this.currentMusic.stop();
                        this.currentMusic = null;
                    }
                }, fadeOut * 1000);
            } else {
                this.currentMusic.stop();
                this.currentMusic = null;
            }
        }
    }

    // Engine sound management for dynamic engine noise
    startEngineSound(kart) {
        if (!kart.audioSource) {
            kart.audioSource = this.playSound('engine', { 
                loop: true, 
                volume: 0.1 
            });
            
            if (kart.audioSource) {
                kart.audioGain = this.audioContext.createGain();
                kart.audioSource.disconnect();
                kart.audioSource.connect(kart.audioGain);
                kart.audioGain.connect(this.sfxGain);
            }
        }
    }

    updateEngineSound(kart) {
        if (kart.audioSource && kart.audioGain && kart.physics) {
            const speed = kart.physics.speed;
            const maxSpeed = kart.physics.maxSpeed;
            
            // Adjust pitch based on speed
            const pitchMultiplier = 0.5 + (speed / maxSpeed) * 1.5;
            kart.audioSource.playbackRate.value = pitchMultiplier;
            
            // Adjust volume based on distance to player (if not player's kart)
            let volume = 0.1;
            if (!kart.isPlayer && window.game && window.game.playerKart) {
                const distance = Utils.distance(
                    kart.x, kart.y,
                    window.game.playerKart.x, window.game.playerKart.y
                );
                volume = Math.max(0.02, 0.1 * (1 - distance / 500));
            }
            
            kart.audioGain.gain.value = volume;
        }
    }

    stopEngineSound(kart) {
        if (kart.audioSource) {
            kart.audioSource.stop();
            kart.audioSource = null;
            kart.audioGain = null;
        }
    }

    // Volume control
    setMasterVolume(volume) {
        this.volumes.master = Utils.clamp(volume, 0, 1);
        this.updateVolumes();
        this.saveVolumeSettings();
    }

    setMusicVolume(volume) {
        this.volumes.music = Utils.clamp(volume, 0, 1);
        this.updateVolumes();
        this.saveVolumeSettings();
    }

    setSFXVolume(volume) {
        this.volumes.sfx = Utils.clamp(volume, 0, 1);
        this.updateVolumes();
        this.saveVolumeSettings();
    }

    updateVolumes() {
        if (this.masterGain) {
            this.masterGain.gain.value = this.volumes.master;
        }
        if (this.musicGain) {
            this.musicGain.gain.value = this.volumes.music;
        }
        if (this.sfxGain) {
            this.sfxGain.gain.value = this.volumes.sfx;
        }
    }

    // Settings persistence
    loadVolumeSettings() {
        const settings = Utils.loadFromLocalStorage('audioSettings', {});
        
        this.volumes.master = settings.master || 0.7;
        this.volumes.music = settings.music || 0.5;
        this.volumes.sfx = settings.sfx || 0.7;
        this.enabled = settings.enabled !== false;
    }

    saveVolumeSettings() {
        const settings = {
            master: this.volumes.master,
            music: this.volumes.music,
            sfx: this.volumes.sfx,
            enabled: this.enabled
        };
        
        Utils.saveToLocalStorage('audioSettings', settings);
    }

    // Audio enable/disable
    enable() {
        this.enabled = true;
        this.saveVolumeSettings();
    }

    disable() {
        this.enabled = false;
        this.stopMusic();
        this.saveVolumeSettings();
    }

    toggle() {
        if (this.enabled) {
            this.disable();
        } else {
            this.enable();
        }
    }

    // Game-specific audio cues
    playCollisionSound(intensity = 1) {
        this.playSound('collision', { 
            volume: Math.min(intensity * 0.5, 1),
            playbackRate: 0.8 + Math.random() * 0.4 
        });
    }

    playTireScreech(intensity = 1) {
        this.playSound('tireScreech', { 
            volume: Math.min(intensity * 0.3, 0.5),
            playbackRate: 0.9 + Math.random() * 0.2 
        });
    }

    playBoost() {
        this.playSound('boost', { volume: 0.4 });
    }

    playCheckpoint() {
        this.playSound('checkpoint', { volume: 0.3 });
    }

    playLapComplete() {
        this.playSound('lapComplete', { volume: 0.4 });
    }

    playRaceFinish() {
        this.playSound('raceFinish', { volume: 0.5 });
    }

    playMenuClick() {
        this.playSound('menuClick', { volume: 0.2 });
    }

    playCountdown() {
        this.playSound('countdown', { volume: 0.4 });
    }

    playRaceStart() {
        this.playSound('raceStart', { volume: 0.5 });
    }

    // Context management
    getAudioContext() {
        return this.audioContext;
    }

    isEnabled() {
        return this.enabled && this.initialized;
    }

    getVolumes() {
        return { ...this.volumes };
    }

    // Debug info
    getDebugInfo() {
        return {
            enabled: this.enabled,
            initialized: this.initialized,
            contextState: this.audioContext ? this.audioContext.state : 'none',
            volumes: this.volumes,
            currentMusic: this.currentMusic ? 'playing' : 'none',
            soundsLoaded: Object.keys(this.sounds).length,
            musicLoaded: Object.keys(this.music).length
        };
    }

    // Cleanup
    destroy() {
        this.stopMusic();
        
        if (this.audioContext) {
            this.audioContext.close();
        }
        
        this.sounds = {};
        this.music = {};
        this.currentMusic = null;
        
        console.log('Audio Manager destroyed');
    }
}

// Global audio manager instance
window.AudioManager = AudioManager;