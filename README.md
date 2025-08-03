# 🏁 GoKart Racing - Mobile Game

A fully-featured go-kart racing game built for mobile browsers with HTML5 Canvas, featuring realistic physics, AI bots with multiple difficulty levels, multiplayer support, and comprehensive mobile controls including tilt steering.

![GoKart Racing](https://img.shields.io/badge/Status-Production%20Ready-green)
![HTML5](https://img.shields.io/badge/HTML5-Canvas-orange)
![Mobile](https://img.shields.io/badge/Mobile-Optimized-blue)
![PWA](https://img.shields.io/badge/PWA-Enabled-purple)
![Multiplayer](https://img.shields.io/badge/Multiplayer-WebSocket-red)

## 🎮 Features

### Core Gameplay
- **Realistic Physics Engine**: Custom-built physics system with proper kart handling, momentum, and collision detection
- **Mobile-First Design**: Optimized for touch devices with tilt controls and responsive UI
- **Three Difficulty Levels**: Easy, Medium, and Hard AI opponents with distinct behaviors
- **Multiplayer Racing**: Real-time multiplayer with WebSocket synchronization
- **Progressive Web App**: Installable on mobile devices for native-like experience

### Controls
- **Tilt Steering**: Use device orientation to steer (mobile)
- **Touch Controls**: Gas and brake pedals optimized for mobile
- **Keyboard Support**: WASD/Arrow keys for desktop testing
- **Gamepad Support**: Xbox/PlayStation controller compatibility

### Game Modes
- **Single Player**: Race against AI bots with selectable difficulty
- **Multiplayer**: Create or join rooms with up to 4 players
- **Time Trials**: Beat your best lap times
- **Championship Mode**: Race through multiple tracks (extensible)

### Technical Features
- **WebSocket Multiplayer**: Real-time position synchronization with interpolation
- **Procedural Audio**: Dynamic engine sounds and musical compositions
- **Particle Systems**: Tire marks, sparks, and visual effects
- **Performance Optimized**: 60 FPS gameplay with quality settings
- **Cross-Platform**: Works on iOS, Android, and desktop browsers

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Mobile device for full experience (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/gokart-racing.git
   cd gokart-racing
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   - Navigate to `http://localhost:3000`
   - For mobile testing, use your local IP address

### One-Click Deployment

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/yourusername/gokart-racing)

## 📱 Mobile Setup

### iOS Setup
1. Open in Safari
2. Tap the Share button
3. Select "Add to Home Screen"
4. Allow device orientation access when prompted

### Android Setup
1. Open in Chrome
2. Tap the menu (⋮)
3. Select "Add to Home screen"
4. Grant orientation permissions

### Calibrating Controls
1. Hold device in landscape orientation
2. Go to Settings → Tilt Sensitivity
3. Tap "Calibrate Tilt" while holding device level
4. Adjust sensitivity as needed

## 🎯 How to Play

### Basic Controls
- **Steering**: Tilt device left/right (mobile) or use A/D keys (desktop)
- **Accelerate**: Hold gas pedal (mobile) or W/Up arrow (desktop)
- **Brake**: Tap brake pedal (mobile) or S/Down arrow (desktop)
- **Pause**: Tap pause button or press Escape

### Race Mechanics
- **Laps**: Complete 3 laps to finish the race
- **Checkpoints**: Drive through yellow checkpoint circles
- **Slipstream**: Follow behind other karts for speed boost
- **Track Position**: Stay on the gray track surface for best grip
- **Collision**: Bumping other karts will slow you down

### Game Modes

#### Single Player
1. Select "Single Player" from main menu
2. Choose difficulty: Easy, Medium, or Hard
3. Race against 3 AI opponents
4. Complete 3 laps to win

#### Multiplayer
1. Select "Multiplayer" from main menu
2. Create a room or join with room code
3. Wait for other players to join
4. Host starts the race when ready

## 🏗️ Architecture

### Client-Side Structure
```
public/
├── index.html          # Main HTML file
├── css/
│   └── styles.css      # Responsive styling
├── js/
│   ├── utils.js        # Utility functions
│   ├── physics.js      # Physics engine
│   ├── graphics.js     # Rendering system
│   ├── audio.js        # Sound system
│   ├── input.js        # Input handling
│   ├── ai.js           # AI system
│   ├── multiplayer.js  # Network code
│   ├── game.js         # Main game logic
│   └── main.js         # Initialization
└── assets/             # Game assets
```

### Server-Side Structure
```
server/
└── server.js           # Node.js + Socket.IO server
```

### Key Systems

#### Physics Engine
- **Custom 2D Physics**: Realistic kart movement and collision
- **Surface Types**: Different friction for track vs. grass
- **Collision Detection**: Circle-based collision system
- **Checkpoint System**: Lap and race progress tracking

#### AI System
- **Pathfinding**: Follow optimal racing line
- **Difficulty Scaling**: Adjustable reaction time and skill
- **Rubber Band AI**: Dynamic difficulty based on player position
- **Collision Avoidance**: Smart opponent behavior

#### Multiplayer System
- **WebSocket Communication**: Real-time data sync
- **Client-Side Prediction**: Smooth movement interpolation
- **Room Management**: Create/join/leave room functionality
- **State Synchronization**: Host-authoritative game state

## ⚙️ Configuration

### Graphics Settings
```javascript
// Available quality levels: 'low', 'medium', 'high'
game.graphics.setGraphicsQuality('medium');
```

### Audio Settings
```javascript
// Volume levels (0.0 to 1.0)
game.audio.setMasterVolume(0.7);
game.audio.setMusicVolume(0.5);
game.audio.setSFXVolume(0.8);
```

### Input Settings
```javascript
// Tilt sensitivity (0.5 to 3.0)
game.input.setTiltSensitivity(1.5);

// Calibrate tilt controls
game.input.calibrateTilt();
```

## 🛠️ Development

### Project Structure
- **Frontend**: Pure HTML5/JavaScript/CSS (no frameworks)
- **Backend**: Node.js with Express and Socket.IO
- **Deployment**: Netlify for static hosting + serverless functions
- **Mobile**: Progressive Web App with native-like features

### Build Process
```bash
# Development
npm run dev          # Start dev server with hot reload
npm run client       # Frontend only
npm run server       # Backend only

# Production
npm run build        # Build for production
npm run start        # Start production server
npm run netlify-build # Build for Netlify deployment
```

### Code Style
- **ES6+ JavaScript**: Modern syntax with classes and modules
- **Modular Design**: Separate systems for physics, graphics, audio, etc.
- **Performance First**: 60 FPS target with efficient rendering
- **Mobile Optimized**: Touch-first interface design

### Debug Tools
Open browser console and use:
```javascript
debug.getGameInfo()          // Get game state
debug.showFPS()             // Display FPS counter
debug.enableTiltIndicator() // Show tilt visualization
debug.skipToRace('medium')  // Quick start race
debug.calibrateTilt()       // Calibrate tilt controls
```

## 🚀 Deployment

### Netlify Deployment
1. Fork this repository
2. Connect to Netlify
3. Deploy with default settings
4. Enable PWA features in Netlify settings

### Manual Deployment
1. Run `npm run build`
2. Upload `dist/` folder to your hosting provider
3. Configure server for SPA routing
4. Ensure HTTPS for PWA features

### Environment Variables
```bash
NODE_ENV=production     # Set to production for optimizations
PORT=3001              # Server port (Netlify auto-assigns)
```

## 🎨 Customization

### Adding New Tracks
1. Modify `graphics.js` → `generateTrackData()`
2. Create new track path coordinates
3. Define checkpoints and start positions
4. Test with AI pathfinding

### Custom Kart Types
```javascript
// Add new kart preset in physics.js
KartPhysics.createPreset('custom', {
    maxSpeed: 200,
    acceleration: 1000,
    handling: 4.0
});
```

### Audio Customization
- Modify `audio.js` procedural sound generation
- Add new sound effects and music tracks
- Implement spatial audio for 3D positioning

## 📊 Performance

### Optimization Features
- **Canvas Rendering**: Hardware-accelerated 2D graphics
- **Object Pooling**: Reuse particles and effects
- **LOD System**: Quality scaling based on device performance
- **Efficient Physics**: Spatial partitioning for collision detection

### Target Performance
- **Mobile**: 60 FPS on mid-range devices (2019+)
- **Desktop**: 60+ FPS on integrated graphics
- **Battery**: Optimized for mobile battery life
- **Memory**: <100MB RAM usage

## 🧪 Testing

### Manual Testing
1. Test on multiple devices (iOS/Android/Desktop)
2. Verify tilt controls work correctly
3. Test multiplayer with multiple players
4. Check PWA installation process

### Browser Compatibility
- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+
- ⚠️ IE not supported

## 🐛 Troubleshooting

### Common Issues

**Tilt Controls Not Working**
- Ensure HTTPS (required for device orientation)
- Grant orientation permissions in browser
- Calibrate tilt in settings

**Audio Not Playing**
- Chrome requires user interaction to start audio
- Check volume settings in game
- Verify audio context state

**Multiplayer Connection Failed**
- Check internet connection
- Verify WebSocket support
- Try different browser

**Poor Performance**
- Lower graphics quality in settings
- Close other browser tabs
- Check device battery/thermal throttling

### Debug Information
```javascript
// Get comprehensive debug info
console.log(debug.getGameInfo());

// Check specific systems
console.log(game.audio.getDebugInfo());
console.log(game.multiplayer.getNetworkStats());
```

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Make changes and test thoroughly
4. Commit changes: `git commit -m 'Add amazing feature'`
5. Push to branch: `git push origin feature/amazing-feature`
6. Open Pull Request

### Contribution Guidelines
- Follow existing code style
- Add comments for complex logic
- Test on mobile devices
- Update documentation as needed
- Ensure 60 FPS performance

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by classic kart racing games
- HTML5 Canvas and Web Audio API communities
- Mobile web gaming pioneers
- Open source game development resources

## 📞 Support

- 🐛 **Bug Reports**: Open an issue on GitHub
- 💡 **Feature Requests**: Discuss in GitHub Issues
- 🎮 **Gameplay Help**: Check the in-game instructions
- 🔧 **Technical Support**: See troubleshooting section

---

**Ready to Race? 🏁** [Play Now](https://your-game-url.netlify.app) | [View Demo](https://your-demo-url.com)

Made with ❤️ for mobile web gaming