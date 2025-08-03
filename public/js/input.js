// Input System for GoKart Racing Game

class InputManager {
    constructor() {
        this.keys = {};
        this.touches = {};
        this.mouse = { x: 0, y: 0, down: false };
        this.gamepad = null;
        this.orientation = { alpha: 0, beta: 0, gamma: 0 };
        this.tiltCalibration = { x: 0, y: 0 };
        this.tiltSensitivity = 1.5;
        this.tiltEnabled = false;
        
        // Input states
        this.inputState = {
            accelerate: 0,    // 0-1
            brake: 0,         // 0-1
            steer: 0,         // -1 to 1
            pause: false,
            restart: false
        };
        
        // Touch controls
        this.touchControls = {
            gas: { element: null, active: false, startTime: 0 },
            brake: { element: null, active: false, startTime: 0 }
        };
        
        // Event handlers
        this.boundHandlers = {};
        
        this.initialize();
    }

    initialize() {
        this.setupKeyboardEvents();
        this.setupMouseEvents();
        this.setupTouchEvents();
        this.setupDeviceOrientation();
        this.setupGamepadEvents();
        this.setupTouchControls();
        
        // Load settings
        this.loadSettings();
        
        console.log('Input Manager initialized');
    }

    // Keyboard Events
    setupKeyboardEvents() {
        this.boundHandlers.keydown = (e) => this.handleKeyDown(e);
        this.boundHandlers.keyup = (e) => this.handleKeyUp(e);
        
        document.addEventListener('keydown', this.boundHandlers.keydown);
        document.addEventListener('keyup', this.boundHandlers.keyup);
    }

    handleKeyDown(event) {
        this.keys[event.code] = true;
        
        // Prevent default behavior for game keys
        const gameKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD'];
        if (gameKeys.includes(event.code)) {
            event.preventDefault();
        }
        
        // Special keys
        if (event.code === 'Escape') {
            this.inputState.pause = true;
        }
        if (event.code === 'KeyR' && event.ctrlKey) {
            this.inputState.restart = true;
            event.preventDefault();
        }
    }

    handleKeyUp(event) {
        this.keys[event.code] = false;
    }

    // Mouse Events
    setupMouseEvents() {
        this.boundHandlers.mousedown = (e) => this.handleMouseDown(e);
        this.boundHandlers.mouseup = (e) => this.handleMouseUp(e);
        this.boundHandlers.mousemove = (e) => this.handleMouseMove(e);
        
        document.addEventListener('mousedown', this.boundHandlers.mousedown);
        document.addEventListener('mouseup', this.boundHandlers.mouseup);
        document.addEventListener('mousemove', this.boundHandlers.mousemove);
    }

    handleMouseDown(event) {
        this.mouse.down = true;
        this.updateMousePosition(event);
    }

    handleMouseUp(event) {
        this.mouse.down = false;
        this.updateMousePosition(event);
    }

    handleMouseMove(event) {
        this.updateMousePosition(event);
    }

    updateMousePosition(event) {
        const rect = event.target.getBoundingClientRect();
        this.mouse.x = event.clientX - rect.left;
        this.mouse.y = event.clientY - rect.top;
    }

    // Touch Events
    setupTouchEvents() {
        this.boundHandlers.touchstart = (e) => this.handleTouchStart(e);
        this.boundHandlers.touchend = (e) => this.handleTouchEnd(e);
        this.boundHandlers.touchmove = (e) => this.handleTouchMove(e);
        this.boundHandlers.touchcancel = (e) => this.handleTouchCancel(e);
        
        document.addEventListener('touchstart', this.boundHandlers.touchstart, { passive: false });
        document.addEventListener('touchend', this.boundHandlers.touchend, { passive: false });
        document.addEventListener('touchmove', this.boundHandlers.touchmove, { passive: false });
        document.addEventListener('touchcancel', this.boundHandlers.touchcancel, { passive: false });
    }

    handleTouchStart(event) {
        event.preventDefault();
        
        for (let i = 0; i < event.changedTouches.length; i++) {
            const touch = event.changedTouches[i];
            this.touches[touch.identifier] = {
                x: touch.clientX,
                y: touch.clientY,
                startX: touch.clientX,
                startY: touch.clientY,
                startTime: Date.now()
            };
        }
    }

    handleTouchEnd(event) {
        event.preventDefault();
        
        for (let i = 0; i < event.changedTouches.length; i++) {
            const touch = event.changedTouches[i];
            delete this.touches[touch.identifier];
        }
    }

    handleTouchMove(event) {
        event.preventDefault();
        
        for (let i = 0; i < event.changedTouches.length; i++) {
            const touch = event.changedTouches[i];
            if (this.touches[touch.identifier]) {
                this.touches[touch.identifier].x = touch.clientX;
                this.touches[touch.identifier].y = touch.clientY;
            }
        }
    }

    handleTouchCancel(event) {
        this.handleTouchEnd(event);
    }

    // Device Orientation (Tilt Controls)
    setupDeviceOrientation() {
        if (Utils.isMobile() && 'DeviceOrientationEvent' in window) {
            this.boundHandlers.deviceorientation = (e) => this.handleDeviceOrientation(e);
            
            // Request permission for iOS 13+
            if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                this.requestOrientationPermission();
            } else {
                window.addEventListener('deviceorientation', this.boundHandlers.deviceorientation);
                this.tiltEnabled = true;
            }
        }
    }

    async requestOrientationPermission() {
        try {
            const permission = await DeviceOrientationEvent.requestPermission();
            if (permission === 'granted') {
                window.addEventListener('deviceorientation', this.boundHandlers.deviceorientation);
                this.tiltEnabled = true;
                console.log('Device orientation permission granted');
            } else {
                console.log('Device orientation permission denied');
            }
        } catch (error) {
            console.error('Error requesting device orientation permission:', error);
        }
    }

    handleDeviceOrientation(event) {
        // Handle different device orientations
        let tiltX = 0;
        let tiltY = 0;
        
        if (screen.orientation && screen.orientation.angle) {
            const angle = screen.orientation.angle;
            
            switch (angle) {
                case 0: // Portrait
                    tiltX = event.gamma; // Left-right tilt
                    tiltY = event.beta;  // Front-back tilt
                    break;
                case 90: // Landscape (rotated left)
                    tiltX = -event.beta;
                    tiltY = event.gamma;
                    break;
                case -90: // Landscape (rotated right)
                    tiltX = event.beta;
                    tiltY = -event.gamma;
                    break;
                case 180: // Portrait (upside down)
                    tiltX = -event.gamma;
                    tiltY = -event.beta;
                    break;
            }
        } else {
            // Fallback for older browsers
            tiltX = event.gamma;
            tiltY = event.beta;
        }
        
        this.orientation = {
            alpha: event.alpha || 0,
            beta: tiltY,
            gamma: tiltX,
            raw: event
        };
    }

    // Calibrate tilt controls
    calibrateTilt() {
        if (this.tiltEnabled) {
            this.tiltCalibration.x = this.orientation.gamma;
            this.tiltCalibration.y = this.orientation.beta;
            console.log('Tilt calibrated:', this.tiltCalibration);
            
            // Save calibration
            Utils.saveToLocalStorage('tiltCalibration', this.tiltCalibration);
            
            return true;
        }
        return false;
    }

    // Get calibrated tilt values
    getCalibratedTilt() {
        return {
            x: (this.orientation.gamma - this.tiltCalibration.x) * this.tiltSensitivity,
            y: (this.orientation.beta - this.tiltCalibration.y) * this.tiltSensitivity
        };
    }

    // Gamepad Events
    setupGamepadEvents() {
        this.boundHandlers.gamepadconnected = (e) => this.handleGamepadConnected(e);
        this.boundHandlers.gamepaddisconnected = (e) => this.handleGamepadDisconnected(e);
        
        window.addEventListener('gamepadconnected', this.boundHandlers.gamepadconnected);
        window.addEventListener('gamepaddisconnected', this.boundHandlers.gamepaddisconnected);
    }

    handleGamepadConnected(event) {
        this.gamepad = event.gamepad;
        console.log('Gamepad connected:', this.gamepad.id);
    }

    handleGamepadDisconnected(event) {
        if (this.gamepad && this.gamepad.index === event.gamepad.index) {
            this.gamepad = null;
            console.log('Gamepad disconnected');
        }
    }

    // Touch Controls Setup
    setupTouchControls() {
        // Gas button
        const gasBtn = document.getElementById('gasBtn');
        if (gasBtn) {
            this.touchControls.gas.element = gasBtn;
            
            gasBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.touchControls.gas.active = true;
                this.touchControls.gas.startTime = Date.now();
                gasBtn.classList.add('active');
            });
            
            gasBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.touchControls.gas.active = false;
                gasBtn.classList.remove('active');
            });
            
            // Mouse events for desktop testing
            gasBtn.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.touchControls.gas.active = true;
                this.touchControls.gas.startTime = Date.now();
                gasBtn.classList.add('active');
            });
            
            gasBtn.addEventListener('mouseup', (e) => {
                e.preventDefault();
                this.touchControls.gas.active = false;
                gasBtn.classList.remove('active');
            });
        }
        
        // Brake button
        const brakeBtn = document.getElementById('brakeBtn');
        if (brakeBtn) {
            this.touchControls.brake.element = brakeBtn;
            
            brakeBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.touchControls.brake.active = true;
                this.touchControls.brake.startTime = Date.now();
                brakeBtn.classList.add('active');
            });
            
            brakeBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.touchControls.brake.active = false;
                brakeBtn.classList.remove('active');
            });
            
            // Mouse events for desktop testing
            brakeBtn.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.touchControls.brake.active = true;
                this.touchControls.brake.startTime = Date.now();
                brakeBtn.classList.add('active');
            });
            
            brakeBtn.addEventListener('mouseup', (e) => {
                e.preventDefault();
                this.touchControls.brake.active = false;
                brakeBtn.classList.remove('active');
            });
        }
    }

    // Update input state
    update() {
        this.updateKeyboardInput();
        this.updateTouchInput();
        this.updateTiltInput();
        this.updateGamepadInput();
        
        // Ensure values are within valid ranges
        this.inputState.accelerate = Utils.clamp(this.inputState.accelerate, 0, 1);
        this.inputState.brake = Utils.clamp(this.inputState.brake, 0, 1);
        this.inputState.steer = Utils.clamp(this.inputState.steer, -1, 1);
    }

    updateKeyboardInput() {
        // Reset values
        let accelerate = 0;
        let brake = 0;
        let steer = 0;
        
        // Acceleration
        if (this.keys['ArrowUp'] || this.keys['KeyW']) {
            accelerate = 1;
        }
        
        // Braking
        if (this.keys['ArrowDown'] || this.keys['KeyS']) {
            brake = 1;
        }
        
        // Steering
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
            steer -= 1;
        }
        if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            steer += 1;
        }
        
        // Apply keyboard input (don't override mobile controls)
        if (!Utils.isMobile()) {
            this.inputState.accelerate = accelerate;
            this.inputState.brake = brake;
            this.inputState.steer = steer;
        }
    }

    updateTouchInput() {
        // Gas pedal
        this.inputState.accelerate = this.touchControls.gas.active ? 1 : 0;
        
        // Brake pedal
        this.inputState.brake = this.touchControls.brake.active ? 1 : 0;
    }

    updateTiltInput() {
        if (this.tiltEnabled && Utils.isMobile()) {
            const tilt = this.getCalibratedTilt();
            
            // Convert tilt to steering input (-1 to 1)
            let steerInput = tilt.x / 45; // 45 degrees = full steering
            steerInput = Utils.clamp(steerInput, -1, 1);
            
            this.inputState.steer = steerInput;
        }
    }

    updateGamepadInput() {
        if (this.gamepad) {
            // Update gamepad state
            const gamepads = navigator.getGamepads();
            if (gamepads[this.gamepad.index]) {
                this.gamepad = gamepads[this.gamepad.index];
                
                // Right trigger for acceleration
                if (this.gamepad.buttons[7] && this.gamepad.buttons[7].pressed) {
                    this.inputState.accelerate = this.gamepad.buttons[7].value;
                }
                
                // Left trigger for braking
                if (this.gamepad.buttons[6] && this.gamepad.buttons[6].pressed) {
                    this.inputState.brake = this.gamepad.buttons[6].value;
                }
                
                // Left stick for steering
                if (this.gamepad.axes[0] !== undefined) {
                    let steerInput = this.gamepad.axes[0];
                    if (Math.abs(steerInput) > 0.1) { // Dead zone
                        this.inputState.steer = steerInput;
                    }
                }
                
                // Buttons
                if (this.gamepad.buttons[9] && this.gamepad.buttons[9].pressed) { // Start button
                    this.inputState.pause = true;
                }
            }
        }
    }

    // Get current input state
    getInputState() {
        return { ...this.inputState };
    }

    // Reset single-frame inputs
    resetFrameInputs() {
        this.inputState.pause = false;
        this.inputState.restart = false;
    }

    // Settings management
    loadSettings() {
        const settings = Utils.loadFromLocalStorage('inputSettings', {});
        
        this.tiltSensitivity = settings.tiltSensitivity || 1.5;
        this.tiltCalibration = settings.tiltCalibration || { x: 0, y: 0 };
        
        console.log('Input settings loaded:', settings);
    }

    saveSettings() {
        const settings = {
            tiltSensitivity: this.tiltSensitivity,
            tiltCalibration: this.tiltCalibration
        };
        
        Utils.saveToLocalStorage('inputSettings', settings);
        console.log('Input settings saved:', settings);
    }

    // Update tilt sensitivity
    setTiltSensitivity(sensitivity) {
        this.tiltSensitivity = Utils.clamp(sensitivity, 0.5, 3.0);
        this.saveSettings();
    }

    // Get debug info
    getDebugInfo() {
        return {
            keys: Object.keys(this.keys).filter(key => this.keys[key]),
            touches: Object.keys(this.touches).length,
            orientation: this.orientation,
            calibration: this.tiltCalibration,
            inputState: this.inputState,
            gamepad: this.gamepad ? this.gamepad.id : null,
            tiltEnabled: this.tiltEnabled
        };
    }

    // Enable/disable tilt controls
    toggleTilt() {
        if (this.tiltEnabled) {
            this.disableTilt();
        } else {
            this.enableTilt();
        }
    }

    enableTilt() {
        if (Utils.isMobile() && 'DeviceOrientationEvent' in window) {
            if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                this.requestOrientationPermission();
            } else {
                this.tiltEnabled = true;
            }
        }
    }

    disableTilt() {
        this.tiltEnabled = false;
        if (this.boundHandlers.deviceorientation) {
            window.removeEventListener('deviceorientation', this.boundHandlers.deviceorientation);
        }
    }

    // Vibration feedback (mobile)
    vibrate(duration = 50) {
        if (navigator.vibrate && Utils.isMobile()) {
            navigator.vibrate(duration);
        }
    }

    // Cleanup
    destroy() {
        // Remove all event listeners
        document.removeEventListener('keydown', this.boundHandlers.keydown);
        document.removeEventListener('keyup', this.boundHandlers.keyup);
        document.removeEventListener('mousedown', this.boundHandlers.mousedown);
        document.removeEventListener('mouseup', this.boundHandlers.mouseup);
        document.removeEventListener('mousemove', this.boundHandlers.mousemove);
        document.removeEventListener('touchstart', this.boundHandlers.touchstart);
        document.removeEventListener('touchend', this.boundHandlers.touchend);
        document.removeEventListener('touchmove', this.boundHandlers.touchmove);
        document.removeEventListener('touchcancel', this.boundHandlers.touchcancel);
        
        if (this.boundHandlers.deviceorientation) {
            window.removeEventListener('deviceorientation', this.boundHandlers.deviceorientation);
        }
        
        window.removeEventListener('gamepadconnected', this.boundHandlers.gamepadconnected);
        window.removeEventListener('gamepaddisconnected', this.boundHandlers.gamepaddisconnected);
        
        console.log('Input Manager destroyed');
    }
}

// Global input manager instance
window.InputManager = InputManager;