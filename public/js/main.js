// Main initialization script for GoKart Racing Game

// Global variables
let game = null;

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing game...');
    
    // Check for required browser features
    if (!checkBrowserCompatibility()) {
        showCompatibilityError();
        return;
    }
    
    // Show loading screen
    showLoadingScreen();
    
    // Initialize game with a slight delay to show loading screen
    setTimeout(() => {
        try {
            game = new Game();
            window.game = game; // Make game globally accessible for debugging
        } catch (error) {
            console.error('Failed to initialize game:', error);
            showInitializationError(error);
        }
    }, 500);
});

// Check browser compatibility
function checkBrowserCompatibility() {
    const requirements = {
        canvas: 'Canvas is required for graphics',
        webAudio: 'Web Audio API is required for sound',
        websocket: 'WebSocket is required for multiplayer',
        localStorage: 'LocalStorage is required for settings',
        deviceOrientation: 'Device orientation is recommended for mobile controls'
    };
    
    const results = {
        canvas: !!document.createElement('canvas').getContext,
        webAudio: !!(window.AudioContext || window.webkitAudioContext),
        websocket: !!window.WebSocket,
        localStorage: !!window.localStorage,
        deviceOrientation: 'DeviceOrientationEvent' in window
    };
    
    const critical = ['canvas', 'webAudio', 'websocket', 'localStorage'];
    const missing = critical.filter(feature => !results[feature]);
    
    if (missing.length > 0) {
        console.error('Missing critical browser features:', missing);
        return false;
    }
    
    // Log feature support
    Object.keys(results).forEach(feature => {
        console.log(`${feature}: ${results[feature] ? 'supported' : 'not supported'}`);
    });
    
    return true;
}

// Show loading screen
function showLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.classList.remove('hidden');
        
        // Simulate loading progress
        let progress = 0;
        const progressBar = document.getElementById('loadingProgress');
        
        const updateProgress = setInterval(() => {
            progress += Math.random() * 15;
            if (progress >= 100) {
                progress = 100;
                clearInterval(updateProgress);
            }
            
            if (progressBar) {
                progressBar.style.width = progress + '%';
            }
        }, 200);
    }
}

// Show compatibility error
function showCompatibilityError() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.innerHTML = `
            <div class="loading-content">
                <h1>🏁 GoKart Racing</h1>
                <div style="color: #ff4444; margin: 20px 0;">
                    <h2>Browser Not Supported</h2>
                    <p>Your browser doesn't support all the required features for this game.</p>
                    <p>Please try using a modern browser like Chrome, Firefox, Safari, or Edge.</p>
                </div>
                <div style="margin: 20px 0;">
                    <h3>Required Features:</h3>
                    <ul style="text-align: left; display: inline-block;">
                        <li>HTML5 Canvas</li>
                        <li>Web Audio API</li>
                        <li>WebSocket</li>
                        <li>Local Storage</li>
                    </ul>
                </div>
                <button onclick="window.location.reload()" style="
                    background: #667eea;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    margin-top: 20px;
                ">Try Again</button>
            </div>
        `;
    }
}

// Show initialization error
function showInitializationError(error) {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.innerHTML = `
            <div class="loading-content">
                <h1>🏁 GoKart Racing</h1>
                <div style="color: #ff4444; margin: 20px 0;">
                    <h2>Initialization Error</h2>
                    <p>Failed to start the game. Please refresh the page and try again.</p>
                    <details style="margin: 10px 0; text-align: left;">
                        <summary>Error Details</summary>
                        <pre style="background: rgba(0,0,0,0.5); padding: 10px; border-radius: 5px; font-size: 12px; overflow: auto;">
${error.stack || error.message || error}
                        </pre>
                    </details>
                </div>
                <button onclick="window.location.reload()" style="
                    background: #667eea;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    margin-top: 20px;
                ">Reload Game</button>
            </div>
        `;
    }
}

// Handle page visibility changes (pause game when tab is not active)
document.addEventListener('visibilitychange', function() {
    if (game && game.state === 'playing') {
        if (document.hidden) {
            game.pauseGame();
        }
    }
});

// Handle window beforeunload (cleanup when leaving page)
window.addEventListener('beforeunload', function() {
    if (game) {
        game.destroy();
    }
});

// Handle fullscreen changes
document.addEventListener('fullscreenchange', function() {
    if (game && game.graphics) {
        // Slight delay to ensure fullscreen transition is complete
        setTimeout(() => {
            game.resizeCanvas();
        }, 100);
    }
});

// Handle orientation changes on mobile
window.addEventListener('orientationchange', function() {
    if (game && game.graphics) {
        // Delay to ensure orientation change is complete
        setTimeout(() => {
            game.resizeCanvas();
        }, 500);
    }
});

// Debug functions (accessible from browser console)
window.debug = {
    getGameInfo: () => game ? game.getDebugInfo() : null,
    toggleAudio: () => game ? game.audio.toggle() : null,
    setGraphicsQuality: (quality) => game ? game.graphics.setGraphicsQuality(quality) : null,
    calibrateTilt: () => game ? game.input.calibrateTilt() : null,
    getNetworkStats: () => game ? game.multiplayer.getNetworkStats() : null,
    skipToRace: (difficulty = 'medium') => {
        if (game) {
            game.startSinglePlayer(difficulty);
        }
    },
    showFPS: () => {
        if (game) {
            const info = document.createElement('div');
            info.id = 'fps-counter';
            info.style.cssText = `
                position: fixed;
                top: 10px;
                left: 10px;
                background: rgba(0,0,0,0.7);
                color: white;
                padding: 5px 10px;
                border-radius: 5px;
                font-family: monospace;
                font-size: 14px;
                z-index: 9999;
            `;
            document.body.appendChild(info);
            
            const updateFPS = () => {
                info.textContent = `FPS: ${game.fps}`;
                requestAnimationFrame(updateFPS);
            };
            updateFPS();
        }
    },
    enableTiltIndicator: () => {
        if (game && game.input) {
            const indicator = document.createElement('div');
            indicator.className = 'tilt-indicator active';
            indicator.innerHTML = '<div class="tilt-ball"></div>';
            document.body.appendChild(indicator);
            
            const updateTilt = () => {
                if (game.input.tiltEnabled) {
                    const tilt = game.input.getCalibratedTilt();
                    const ball = indicator.querySelector('.tilt-ball');
                    const maxTilt = 45; // degrees
                    const percentage = 50 + (tilt.x / maxTilt) * 50;
                    ball.style.left = Utils.clamp(percentage, 5, 95) + '%';
                }
                requestAnimationFrame(updateTilt);
            };
            updateTilt();
        }
    }
};

// Service Worker registration for PWA functionality
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('ServiceWorker registration successful:', registration.scope);
            })
            .catch(function(err) {
                console.log('ServiceWorker registration failed:', err);
            });
    });
}

// PWA install prompt
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    console.log('PWA install prompt available');
    e.preventDefault();
    deferredPrompt = e;
    
    // Show install button if desired
    showInstallButton();
});

function showInstallButton() {
    // Create install button
    const installButton = document.createElement('button');
    installButton.textContent = '📱 Install App';
    installButton.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #667eea;
        color: white;
        border: none;
        padding: 10px 15px;
        border-radius: 25px;
        cursor: pointer;
        font-size: 14px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        z-index: 1000;
        display: none;
    `;
    
    installButton.addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`PWA install outcome: ${outcome}`);
            deferredPrompt = null;
            installButton.style.display = 'none';
        }
    });
    
    document.body.appendChild(installButton);
    
    // Show button after a delay
    setTimeout(() => {
        installButton.style.display = 'block';
    }, 5000);
}

// Log startup information
console.log('%c🏁 GoKart Racing Game', 'font-size: 20px; color: #667eea; font-weight: bold;');
console.log('%cGame loading...', 'color: #888;');
console.log('%cType "debug" in console for debug functions', 'color: #888;');

// Performance monitoring
if (window.performance && window.performance.mark) {
    performance.mark('game-start');
}

// Error handling for uncaught errors
window.addEventListener('error', (event) => {
    console.error('Uncaught error:', event.error);
    
    if (game && game.audio) {
        Utils.handleError(event.error, 'Global');
    }
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    
    if (game && game.audio) {
        Utils.handleError(event.reason, 'Promise');
    }
});

// Export for ES6 modules if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { game, debug: window.debug };
}