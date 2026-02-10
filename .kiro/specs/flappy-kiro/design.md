# Design Document: Flappy Kiro

## Overview

Flappy Kiro is a browser-based endless scroller game implemented in vanilla JavaScript with HTML5 Canvas. The game features a ghost character that the player controls through pipe obstacles using simple tap/click/spacebar mechanics. The design emphasizes smooth physics, precise collision detection, and a polished retro aesthetic with visual and audio feedback.

### Core Technologies
- **Language**: Vanilla JavaScript (ES6+)
- **Rendering**: HTML5 Canvas API
- **Audio**: Web Audio API / HTML5 Audio
- **Storage**: Browser LocalStorage API
- **Input**: Mouse, Touch, and Keyboard events

### Design Principles
1. **Simplicity**: Clean, maintainable code with clear separation of concerns
2. **Performance**: 120 FPS target with efficient rendering and collision detection
3. **Responsiveness**: Smooth physics and immediate input feedback
4. **Extensibility**: Modular architecture allowing easy feature additions

## Architecture

### High-Level Architecture

The game follows a component-based architecture with a central game loop coordinating all subsystems:

```
┌─────────────────────────────────────────────────────────────┐
│                         Game Loop                            │
│  (Update → Physics → Collision → Render → Audio)            │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ State Manager│    │Physics Engine│    │Render Engine │
└──────────────┘    └──────────────┘    └──────────────┘
        │                   │                    │
        ▼                   ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│Input Handler │    │Collision Sys │    │Audio Manager │
└──────────────┘    └──────────────┘    └──────────────┘
        │                   │                    │
        └───────────────────┴────────────────────┘
                            │
                            ▼
                  ┌──────────────────┐
                  │  Game Entities   │
                  │ (Ghost, Pipes)   │
                  └──────────────────┘
```

### Module Structure

```
flappy-kiro/
├── index.html              # Main HTML file
├── styles.css              # Minimal styling
├── js/
│   ├── main.js            # Entry point, game initialization
│   ├── game.js            # Core game loop and coordination
│   ├── config.js          # Game configuration and constants
│   ├── state.js           # Game state management
│   ├── entities/
│   │   ├── ghost.js       # Ghost entity
│   │   ├── pipe.js        # Pipe entity
│   │   └── particle.js    # Particle effects
│   ├── systems/
│   │   ├── physics.js     # Physics calculations
│   │   ├── collision.js   # Collision detection
│   │   ├── renderer.js    # Canvas rendering
│   │   └── audio.js       # Audio management
│   ├── input.js           # Input handling
│   └── storage.js         # LocalStorage wrapper
└── assets/
    ├── ghosty.png
    ├── jump.wav
    └── game_over.wav
```


## Components and Interfaces

### 0. Game Configuration (config.js)

A centralized configuration object that makes all game constants easily adjustable.

```javascript
const GameConfig = {
  // Canvas dimensions
  canvas: {
    width: 400,
    height: 600
  },
  
  // Physics constants
  physics: {
    gravity: 0.6,              // Downward acceleration per frame
    jumpVelocity: -10,         // Initial upward velocity on jump
    terminalVelocity: 12,      // Maximum falling speed
    maxUpwardVelocity: -12     // Maximum upward speed
  },
  
  // Ghost properties
  ghost: {
    x: 100,                    // Fixed horizontal position
    y: 300,                    // Starting vertical position
    width: 34,                 // Sprite width
    height: 24,                // Sprite height
    hitboxWidth: 28,           // Collision box width (forgiving)
    hitboxHeight: 20,          // Collision box height (forgiving)
    hitboxOffsetX: 3,
    hitboxOffsetY: 2,
    spritePath: '/Users/usman.sajid/Documents/kiro-introduction/assets/ghosty.png'
  },
  
  // Pipe generation
  pipes: {
    width: 52,                 // Pipe width
    spacing: 200,              // Horizontal distance between pipes
    gapSize: 150,              // Vertical gap size
    minGapY: 100,              // Minimum gap center Y
    maxGapY: 500,              // Maximum gap center Y
    baseSpeed: 2,              // Initial scroll speed
    maxSpeed: 5,               // Maximum scroll speed
    speedIncreaseThreshold: 5, // Score interval for speed increase
    speedIncrement: 0.2        // Speed increase amount
  },
  
  // Collision and invincibility
  collision: {
    invincibilityDuration: 120, // Frames (~1 second at 120fps)
    screenShakeIntensity: 10,  // Shake intensity on collision
    screenShakeDuration: 30    // Shake duration in frames
  },
  
  // Particle effects
  particles: {
    spawnChance: 0.3,          // Probability per frame (0-1)
    maxActive: 50,             // Maximum active particles
    minSize: 2,                // Minimum particle size
    maxSize: 5,                // Maximum particle size
    decay: 0.02,               // Life decay rate per frame
    velocityRange: 2           // Random velocity range
  },
  
  // Score indicators
  scoreIndicators: {
    floatSpeed: -1,            // Upward velocity
    decay: 0.03,               // Life decay rate per frame
    fontSize: 24,              // Font size in pixels
    color: '#FFD700'           // Gold color
  },
  
  // Visual settings
  visual: {
    backgroundColor: '#87CEEB', // Light blue
    pipeColor: '#00AA00',       // Green
    pipeCapColor: '#00CC00',    // Lighter green
    textColor: '#000000',       // Black
    overlayColor: 'rgba(0, 0, 0, 0.5)'
  },
  
  // Audio settings
  audio: {
    defaultVolume: 1.0,
    jumpSound: 'assets/jump.wav',
    gameOverSound: 'assets/game_over.wav'
  },
  
  // Storage
  storage: {
    highScoreKey: 'flappyKiroHighScore'
  },
  
  // Performance
  performance: {
    targetFPS: 120,
    maxDeltaTime: 2.0          // Clamp delta time to prevent large jumps
  }
};

// Make config immutable (optional, for safety)
Object.freeze(GameConfig);

export default GameConfig;
```

**Usage Example**:

```javascript
import GameConfig from './config.js';

// Easy to reference anywhere in the codebase
const gravity = GameConfig.physics.gravity;
const pipeSpeed = GameConfig.pipes.baseSpeed;

// Easy to modify for testing or balancing
// Just change values in config.js and reload
```

**Benefits**:
- All constants in one place for easy tuning
- Clear organization by category
- Easy to create difficulty presets (easy, normal, hard)
- Simple to add configuration UI later
- Makes testing with different values straightforward

### Design Philosophy: Separation of Code and Data

**Yes, separating code from numerical values is recommended.** Here's the approach:

**What Goes in Config (Data)**:
- ✅ Numerical constants (gravity, speeds, sizes)
- ✅ Color values and visual settings
- ✅ File paths for assets
- ✅ Timing values (durations, intervals)
- ✅ Thresholds and limits
- ✅ Spawn rates and probabilities

**What Stays in Code (Logic)**:
- ✅ Algorithms (collision detection, physics calculations)
- ✅ State machine logic
- ✅ Event handling
- ✅ Rendering procedures
- ✅ Game loop structure

**Example - Good Separation**:

```javascript
// ❌ BAD: Logic mixed with values
class Ghost {
  update(deltaTime) {
    this.velocity += 0.6 * deltaTime;  // Magic number!
    if (this.velocity > 12) {          // What does 12 mean?
      this.velocity = 12;
    }
  }
}

// ✅ GOOD: Logic uses config values
class Ghost {
  update(deltaTime) {
    const { gravity, terminalVelocity } = this.config.physics;
    this.velocity += gravity * deltaTime;
    if (this.velocity > terminalVelocity) {
      this.velocity = terminalVelocity;
    }
  }
}
```

**Benefits of This Separation**:
1. **Tweaking**: Change values without touching code
2. **Testing**: Easy to test with different parameter sets
3. **Balancing**: Game designers can adjust without programming
4. **Maintenance**: Clear what each value represents
5. **Versioning**: Can load different configs for different game modes

**Advanced: External Configuration Files**

For even better separation, you could load config from JSON:

```javascript
// config.json (external file)
{
  "physics": {
    "gravity": 0.6,
    "jumpVelocity": -10
  },
  "pipes": {
    "spacing": 200,
    "gapSize": 150
  }
}

// config.js (loads and validates)
async function loadConfig() {
  const response = await fetch('config.json');
  const config = await response.json();
  return validateConfig(config);
}
```

This allows non-programmers to modify game balance by editing a JSON file!

### Configuration Presets (Optional Enhancement)

For different difficulty levels or game modes:

```javascript
const DifficultyPresets = {
  easy: {
    physics: { gravity: 0.4, jumpVelocity: -9 },
    pipes: { gapSize: 180, baseSpeed: 1.5, maxSpeed: 3 }
  },
  
  normal: {
    physics: { gravity: 0.6, jumpVelocity: -10 },
    pipes: { gapSize: 150, baseSpeed: 2, maxSpeed: 5 }
  },
  
  hard: {
    physics: { gravity: 0.8, jumpVelocity: -11 },
    pipes: { gapSize: 120, baseSpeed: 2.5, maxSpeed: 7 }
  }
};

// Apply a preset
function applyDifficultyPreset(preset) {
  Object.assign(GameConfig.physics, DifficultyPresets[preset].physics);
  Object.assign(GameConfig.pipes, DifficultyPresets[preset].pipes);
}
```

### Runtime Configuration Adjustments

For debugging and testing:

```javascript
// Expose config to browser console for live tweaking
window.GameConfig = GameConfig;

// Example: Adjust gravity in console
// > GameConfig.physics.gravity = 0.8

// Add debug UI (optional)
class DebugPanel {
  constructor(game) {
    this.game = game;
    this.createUI();
  }
  
  createUI() {
    // Create sliders for key parameters
    this.addSlider('Gravity', 'physics.gravity', 0.1, 2.0, 0.1);
    this.addSlider('Jump Power', 'physics.jumpVelocity', -20, -5, 0.5);
    this.addSlider('Pipe Speed', 'pipes.baseSpeed', 0.5, 5, 0.1);
    this.addSlider('Gap Size', 'pipes.gapSize', 80, 250, 10);
  }
  
  addSlider(label, configPath, min, max, step) {
    // Create HTML slider that updates config in real-time
  }
}
```

### 1. Game Core (game.js)

The central coordinator that manages the game loop and orchestrates all subsystems.

```javascript
import GameConfig from './config.js';

class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.config = GameConfig;
    this.state = new StateManager(this.config);
    this.physics = new PhysicsEngine(this.config);
    this.collision = new CollisionSystem(this.config);
    this.renderer = new Renderer(this.ctx, this.config);
    this.audio = new AudioManager(this.config);
    this.input = new InputHandler(canvas);
    this.storage = new StorageManager(this.config);
    
    this.entities = {
      ghost: null,
      pipes: [],
      particles: [],
      scoreIndicators: []
    };
    
    this.lastFrameTime = 0;
    this.deltaTime = 0;
  }
  
  init() {
    // Load assets, initialize game state, set up event listeners
  }
  
  gameLoop(timestamp) {
    // Calculate delta time
    // Update game state
    // Update physics
    // Check collisions
    // Render frame
    // Request next frame
  }
  
  update(deltaTime) {
    // Update all entities based on current state
  }
  
  reset() {
    // Reset game for new session
  }
}
```


### 2. State Manager (state.js)

Manages game state transitions and state-specific behavior.

```javascript
import GameConfig from './config.js';

const GameStates = {
  MENU: 'menu',
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAME_OVER: 'game_over'
};

class StateManager {
  constructor(config = GameConfig) {
    this.config = config;
    this.currentState = GameStates.MENU;
    this.score = 0;
    this.highScore = 0;
    this.invincibilityFrames = 0;
    this.invincibilityDuration = config.collision.invincibilityDuration;
  }
  
  setState(newState) {
    // Transition to new state with appropriate callbacks
  }
  
  isPlaying() {
    return this.currentState === GameStates.PLAYING;
  }
  
  isPaused() {
    return this.currentState === GameStates.PAUSED;
  }
  
  isGameOver() {
    return this.currentState === GameStates.GAME_OVER;
  }
  
  isMenu() {
    return this.currentState === GameStates.MENU;
  }
  
  incrementScore() {
    this.score++;
    if (this.score > this.highScore) {
      this.highScore = this.score;
    }
  }
  
  resetScore() {
    this.score = 0;
  }
  
  startInvincibility() {
    this.invincibilityFrames = this.invincibilityDuration;
  }
  
  updateInvincibility() {
    if (this.invincibilityFrames > 0) {
      this.invincibilityFrames--;
    }
  }
  
  isInvincible() {
    return this.invincibilityFrames > 0;
  }
}
```


### 3. Ghost Entity (entities/ghost.js)

Represents the player-controlled character.

```javascript
import GameConfig from '../config.js';

class Ghost {
  constructor(x, y, spriteImage, config = GameConfig) {
    this.config = config;
    this.x = x;
    this.y = y;
    this.sprite = spriteImage;
    
    // Physics properties
    this.velocity = 0;
    this.rotation = 0; // For visual tilt effect
    
    // Dimensions from config
    this.width = config.ghost.width;
    this.height = config.ghost.height;
    
    // Hitbox from config (slightly smaller for forgiving collision)
    this.hitbox = {
      width: config.ghost.hitboxWidth,
      height: config.ghost.hitboxHeight,
      offsetX: config.ghost.hitboxOffsetX,
      offsetY: config.ghost.hitboxOffsetY
    };
  }
  
  getHitbox() {
    return {
      x: this.x + this.hitbox.offsetX,
      y: this.y + this.hitbox.offsetY,
      width: this.hitbox.width,
      height: this.hitbox.height
    };
  }
  
  jump(jumpVelocity) {
    this.velocity = jumpVelocity;
  }
  
  update(deltaTime, gravity, terminalVelocity, maxUpwardVelocity) {
    // Apply gravity
    this.velocity += gravity * deltaTime;
    
    // Clamp velocity
    this.velocity = Math.min(this.velocity, terminalVelocity);
    this.velocity = Math.max(this.velocity, maxUpwardVelocity);
    
    // Update position
    this.y += this.velocity * deltaTime;
    
    // Update rotation for visual effect
    this.rotation = Math.max(-25, Math.min(25, this.velocity * 2));
  }
  
  reset(x, y) {
    this.x = x;
    this.y = y;
    this.velocity = 0;
    this.rotation = 0;
  }
}
```


### 4. Pipe Entity (entities/pipe.js)

Represents obstacle pipes.

```javascript
import GameConfig from '../config.js';

class Pipe {
  constructor(x, gapY, gapSize, canvasHeight, config = GameConfig) {
    this.config = config;
    this.x = x;
    this.gapY = gapY;           // Center Y position of the gap
    this.gapSize = gapSize;
    this.width = config.pipes.width;
    this.canvasHeight = canvasHeight;
    this.scored = false;        // Track if player passed this pipe
    
    // Calculate top and bottom pipe heights
    this.topHeight = gapY - (gapSize / 2);
    this.bottomY = gapY + (gapSize / 2);
    this.bottomHeight = canvasHeight - this.bottomY;
  }
  
  getTopHitbox() {
    return {
      x: this.x,
      y: 0,
      width: this.width,
      height: this.topHeight
    };
  }
  
  getBottomHitbox() {
    return {
      x: this.x,
      y: this.bottomY,
      width: this.width,
      height: this.bottomHeight
    };
  }
  
  update(deltaTime, speed) {
    this.x -= speed * deltaTime;
  }
  
  isOffScreen() {
    return this.x + this.width < 0;
  }
  
  hasPassedGhost(ghostX) {
    return !this.scored && this.x + this.width < ghostX;
  }
  
  markScored() {
    this.scored = true;
  }
}
```


### 5. Particle System (entities/particle.js)

Creates visual effects for the ghost trail.

```javascript
class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 2;
    this.vy = (Math.random() - 0.5) * 2;
    this.life = 1.0;
    this.decay = 0.02;
    this.size = Math.random() * 3 + 2;
    this.color = `rgba(255, 255, 255, ${this.life})`;
  }
  
  update(deltaTime) {
    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;
    this.life -= this.decay;
    this.color = `rgba(255, 255, 255, ${this.life})`;
  }
  
  isDead() {
    return this.life <= 0;
  }
}

class ScoreIndicator {
  constructor(x, y, value) {
    this.x = x;
    this.y = y;
    this.value = value;
    this.life = 1.0;
    this.decay = 0.03;
    this.vy = -1; // Float upward
  }
  
  update(deltaTime) {
    this.y += this.vy * deltaTime;
    this.life -= this.decay;
  }
  
  isDead() {
    return this.life <= 0;
  }
}
```


### 6. Physics Engine (systems/physics.js)

Handles all physics calculations and constants.

```javascript
import GameConfig from '../config.js';

class PhysicsEngine {
  constructor(config = GameConfig) {
    this.config = config;
    
    // Physics constants from config
    this.gravity = config.physics.gravity;
    this.jumpVelocity = config.physics.jumpVelocity;
    this.terminalVelocity = config.physics.terminalVelocity;
    this.maxUpwardVelocity = config.physics.maxUpwardVelocity;
    
    // Pipe generation constants from config
    this.pipeSpacing = config.pipes.spacing;
    this.gapSize = config.pipes.gapSize;
    this.minGapY = config.pipes.minGapY;
    this.maxGapY = config.pipes.maxGapY;
    
    // Pipe movement from config
    this.basePipeSpeed = config.pipes.baseSpeed;
    this.pipeSpeed = this.basePipeSpeed;
    this.maxPipeSpeed = config.pipes.maxSpeed;
    this.speedIncreaseThreshold = config.pipes.speedIncreaseThreshold;
    this.speedIncrement = config.pipes.speedIncrement;
  }
  
  applyGravity(entity, deltaTime) {
    entity.velocity += this.gravity * deltaTime;
    entity.velocity = Math.min(entity.velocity, this.terminalVelocity);
    entity.velocity = Math.max(entity.velocity, this.maxUpwardVelocity);
  }
  
  updatePosition(entity, deltaTime) {
    entity.y += entity.velocity * deltaTime;
  }
  
  generateGapPosition() {
    return Math.random() * (this.maxGapY - this.minGapY) + this.minGapY;
  }
  
  increaseDifficulty(score) {
    if (score > 0 && score % this.speedIncreaseThreshold === 0) {
      this.pipeSpeed = Math.min(
        this.pipeSpeed + this.speedIncrement,
        this.maxPipeSpeed
      );
    }
  }
  
  resetDifficulty() {
    this.pipeSpeed = this.basePipeSpeed;
  }
}
```


### 7. Collision System (systems/collision.js)

Implements precise collision detection with circular collision for Ghosty and rectangular bounds for walls.

```javascript
class CollisionSystem {
  constructor(config = GameConfig) {
    this.config = config;
    this.screenShake = {
      active: false,
      intensity: 0,
      duration: 0,
      offsetX: 0,
      offsetY: 0
    };
  }
  
  /**
   * Circular collision detection for Ghosty
   * Uses a circle centered on the ghost sprite for more forgiving collision
   */
  getGhostCircle(ghost) {
    const hitbox = ghost.getHitbox();
    return {
      x: hitbox.x + hitbox.width / 2,   // Center X
      y: hitbox.y + hitbox.height / 2,  // Center Y
      radius: Math.min(hitbox.width, hitbox.height) / 2  // Use smaller dimension
    };
  }
  
  /**
   * Check if a circle intersects with a rectangle
   * Used for ghost (circle) vs pipe (rectangle) collision
   */
  checkCircleRectIntersection(circle, rect) {
    // Find the closest point on the rectangle to the circle center
    const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
    const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));
    
    // Calculate distance from circle center to closest point
    const distanceX = circle.x - closestX;
    const distanceY = circle.y - closestY;
    const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);
    
    // Check if distance is less than radius (collision detected)
    return distanceSquared < (circle.radius * circle.radius);
  }
  
  /**
   * Standard rectangular intersection detection
   * Used for rectangular hitbox fallback and debugging
   */
  checkRectIntersection(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  }
  
  /**
   * Check collision between ghost (circular) and pipe (rectangular)
   * Uses circle-rectangle intersection for more accurate detection
   */
  checkGhostPipeCollision(ghost, pipe) {
    const ghostCircle = this.getGhostCircle(ghost);
    const topPipeHitbox = pipe.getTopHitbox();
    const bottomPipeHitbox = pipe.getBottomHitbox();
    
    // Check collision with top pipe
    if (this.checkCircleRectIntersection(ghostCircle, topPipeHitbox)) {
      return { collided: true, type: 'pipe_top', pipe };
    }
    
    // Check collision with bottom pipe
    if (this.checkCircleRectIntersection(ghostCircle, bottomPipeHitbox)) {
      return { collided: true, type: 'pipe_bottom', pipe };
    }
    
    return { collided: false };
  }
  
  /**
   * Check collision with screen boundaries (ceiling and ground)
   * Uses precise circular bounds for ghost
   */
  checkGhostBoundaryCollision(ghost, canvasHeight) {
    const ghostCircle = this.getGhostCircle(ghost);
    
    // Ceiling collision - check if top of circle touches ceiling
    if (ghostCircle.y - ghostCircle.radius <= 0) {
      return { collided: true, type: 'ceiling' };
    }
    
    // Ground collision - check if bottom of circle touches ground
    if (ghostCircle.y + ghostCircle.radius >= canvasHeight) {
      return { collided: true, type: 'ground' };
    }
    
    return { collided: false };
  }
  
  /**
   * Master collision check that tests all collision types
   * Returns detailed collision information for debugging and effects
   */
  checkAllCollisions(ghost, pipes, canvasHeight, isInvincible) {
    if (isInvincible) {
      return { collided: false, type: 'invincible' };
    }
    
    // Check boundary collisions first (ceiling and ground)
    const boundaryCollision = this.checkGhostBoundaryCollision(ghost, canvasHeight);
    if (boundaryCollision.collided) {
      return boundaryCollision;
    }
    
    // Check pipe collisions
    for (const pipe of pipes) {
      const pipeCollision = this.checkGhostPipeCollision(ghost, pipe);
      if (pipeCollision.collided) {
        return pipeCollision;
      }
    }
    
    return { collided: false };
  }
  
  /**
   * Optimized collision check that only tests nearby pipes
   * Improves performance by using spatial partitioning
   */
  checkNearbyCollisions(ghost, pipes, canvasHeight, isInvincible) {
    if (isInvincible) {
      return { collided: false, type: 'invincible' };
    }
    
    // Check boundary collisions
    const boundaryCollision = this.checkGhostBoundaryCollision(ghost, canvasHeight);
    if (boundaryCollision.collided) {
      return boundaryCollision;
    }
    
    // Only check pipes within collision range (optimization)
    const ghostX = ghost.x;
    const collisionRange = 100; // Only check pipes within this range
    
    for (const pipe of pipes) {
      // Skip pipes that are too far away
      if (pipe.x + pipe.width < ghostX - collisionRange || 
          pipe.x > ghostX + collisionRange) {
        continue;
      }
      
      const pipeCollision = this.checkGhostPipeCollision(ghost, pipe);
      if (pipeCollision.collided) {
        return pipeCollision;
      }
    }
    
    return { collided: false };
  }
  
  /**
   * Debug visualization of collision bounds
   * Draws hitboxes and collision circles for debugging
   */
  debugDrawCollisionBounds(ctx, ghost, pipes) {
    ctx.save();
    
    // Draw ghost circular collision bound
    const ghostCircle = this.getGhostCircle(ghost);
    ctx.strokeStyle = '#FF0000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(ghostCircle.x, ghostCircle.y, ghostCircle.radius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw ghost rectangular hitbox (for comparison)
    const ghostHitbox = ghost.getHitbox();
    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 1;
    ctx.strokeRect(ghostHitbox.x, ghostHitbox.y, ghostHitbox.width, ghostHitbox.height);
    
    // Draw pipe rectangular bounds
    ctx.strokeStyle = '#0000FF';
    ctx.lineWidth = 2;
    for (const pipe of pipes) {
      const topHitbox = pipe.getTopHitbox();
      const bottomHitbox = pipe.getBottomHitbox();
      ctx.strokeRect(topHitbox.x, topHitbox.y, topHitbox.width, topHitbox.height);
      ctx.strokeRect(bottomHitbox.x, bottomHitbox.y, bottomHitbox.width, bottomHitbox.height);
    }
    
    ctx.restore();
  }
  
  triggerScreenShake(intensity = 10, duration = 15) {
    this.screenShake.active = true;
    this.screenShake.intensity = intensity;
    this.screenShake.duration = duration;
  }
  
  updateScreenShake() {
    if (!this.screenShake.active) {
      this.screenShake.offsetX = 0;
      this.screenShake.offsetY = 0;
      return;
    }
    
    if (this.screenShake.duration > 0) {
      const progress = this.screenShake.duration / 15;
      const currentIntensity = this.screenShake.intensity * progress;
      
      this.screenShake.offsetX = (Math.random() - 0.5) * currentIntensity;
      this.screenShake.offsetY = (Math.random() - 0.5) * currentIntensity;
      this.screenShake.duration--;
    } else {
      this.screenShake.active = false;
      this.screenShake.offsetX = 0;
      this.screenShake.offsetY = 0;
    }
  }
  
  getScreenShakeOffset() {
    return {
      x: this.screenShake.offsetX,
      y: this.screenShake.offsetY
    };
  }
}
```


### 8. Renderer (systems/renderer.js)

Handles all canvas drawing operations.

```javascript
class Renderer {
  constructor(ctx) {
    this.ctx = ctx;
    this.canvas = ctx.canvas;
    this.backgroundColor = '#87CEEB'; // Light blue
  }
  
  clear() {
    this.ctx.fillStyle = this.backgroundColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  renderGhost(ghost) {
    this.ctx.save();
    this.ctx.translate(ghost.x + ghost.width / 2, ghost.y + ghost.height / 2);
    this.ctx.rotate(ghost.rotation * Math.PI / 180);
    this.ctx.drawImage(
      ghost.sprite,
      -ghost.width / 2,
      -ghost.height / 2,
      ghost.width,
      ghost.height
    );
    this.ctx.restore();
  }
  
  renderPipe(pipe) {
    this.ctx.fillStyle = '#00AA00'; // Green
    
    // Top pipe
    this.ctx.fillRect(pipe.x, 0, pipe.width, pipe.topHeight);
    
    // Bottom pipe
    this.ctx.fillRect(pipe.x, pipe.bottomY, pipe.width, pipe.bottomHeight);
    
    // Pipe caps (decorative)
    this.ctx.fillStyle = '#00CC00';
    this.ctx.fillRect(pipe.x - 2, pipe.topHeight - 20, pipe.width + 4, 20);
    this.ctx.fillRect(pipe.x - 2, pipe.bottomY, pipe.width + 4, 20);
  }
  
  renderParticle(particle) {
    this.ctx.fillStyle = particle.color;
    this.ctx.beginPath();
    this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    this.ctx.fill();
  }
  
  renderScoreIndicator(indicator) {
    this.ctx.save();
    this.ctx.globalAlpha = indicator.life;
    this.ctx.fillStyle = '#FFD700'; // Gold
    this.ctx.font = 'bold 24px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`+${indicator.value}`, indicator.x, indicator.y);
    this.ctx.restore();
  }
  
  renderScore(score, highScore) {
    this.ctx.fillStyle = '#000000';
    this.ctx.font = '20px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
      `Score: ${score} | High: ${highScore}`,
      this.canvas.width / 2,
      this.canvas.height - 20
    );
  }
  
  renderMenu(highScore) {
    this.ctx.fillStyle = '#000000';
    this.ctx.font = 'bold 48px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Flappy Kiro', this.canvas.width / 2, 150);
    
    this.ctx.font = '24px Arial';
    this.ctx.fillText(`High Score: ${highScore}`, this.canvas.width / 2, 220);
    
    this.ctx.font = '20px Arial';
    this.ctx.fillText(
      'Press SPACE or Click to Start',
      this.canvas.width / 2,
      300
    );
  }
  
  renderPauseOverlay() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = 'bold 48px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('PAUSED', this.canvas.width / 2, 200);
    
    this.ctx.font = '20px Arial';
    this.ctx.fillText(
      'Press SPACE to Resume',
      this.canvas.width / 2,
      260
    );
  }
  
  renderGameOver(score, highScore) {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = 'bold 48px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('GAME OVER', this.canvas.width / 2, 150);
    
    this.ctx.font = '28px Arial';
    this.ctx.fillText(`Score: ${score}`, this.canvas.width / 2, 210);
    this.ctx.fillText(`High Score: ${highScore}`, this.canvas.width / 2, 250);
    
    this.ctx.font = '20px Arial';
    this.ctx.fillText(
      'Press SPACE or Click to Restart',
      this.canvas.width / 2,
      320
    );
  }
  
  renderInvincibilityIndicator(ghost) {
    // Flash effect during invincibility
    if (Math.floor(Date.now() / 100) % 2 === 0) {
      this.ctx.strokeStyle = '#FFD700';
      this.ctx.lineWidth = 2;
      const hitbox = ghost.getHitbox();
      this.ctx.strokeRect(hitbox.x, hitbox.y, hitbox.width, hitbox.height);
    }
  }
  
  applyScreenShake(offset) {
    this.ctx.translate(offset.x, offset.y);
  }
}
```


### 9. Audio Manager (systems/audio.js)

Manages sound effects and background music.

```javascript
class AudioManager {
  constructor() {
    this.sounds = {};
    this.muted = false;
    this.volume = 1.0;
  }
  
  loadSound(name, path) {
    const audio = new Audio(path);
    audio.volume = this.volume;
    this.sounds[name] = audio;
  }
  
  playSound(name) {
    if (this.muted || !this.sounds[name]) return;
    
    // Clone audio for overlapping sounds
    const sound = this.sounds[name].cloneNode();
    sound.volume = this.volume;
    sound.play().catch(err => console.warn('Audio play failed:', err));
  }
  
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    Object.values(this.sounds).forEach(sound => {
      sound.volume = this.volume;
    });
  }
  
  toggleMute() {
    this.muted = !this.muted;
  }
  
  preloadAssets() {
    this.loadSound('jump', 'assets/jump.wav');
    this.loadSound('gameOver', 'assets/game_over.wav');
  }
}
```


### 10. Input Handler (input.js)

Manages keyboard, mouse, and touch input.

```javascript
class InputHandler {
  constructor(canvas) {
    this.canvas = canvas;
    this.callbacks = {
      jump: null,
      pause: null,
      start: null
    };
    
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    // Keyboard
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        this.handleJumpOrStart();
      } else if (e.code === 'Escape') {
        this.handlePause();
      }
    });
    
    // Mouse
    this.canvas.addEventListener('click', () => {
      this.handleJumpOrStart();
    });
    
    // Touch
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.handleJumpOrStart();
    });
  }
  
  handleJumpOrStart() {
    if (this.callbacks.jump) {
      this.callbacks.jump();
    }
  }
  
  handlePause() {
    if (this.callbacks.pause) {
      this.callbacks.pause();
    }
  }
  
  onJump(callback) {
    this.callbacks.jump = callback;
  }
  
  onPause(callback) {
    this.callbacks.pause = callback;
  }
}
```


### 11. Storage Manager (storage.js)

Wrapper for LocalStorage operations.

```javascript
class StorageManager {
  constructor() {
    this.storageKey = 'flappyKiroHighScore';
  }
  
  loadHighScore() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? parseInt(stored, 10) : 0;
    } catch (e) {
      console.warn('LocalStorage unavailable:', e);
      return 0;
    }
  }
  
  saveHighScore(score) {
    try {
      localStorage.setItem(this.storageKey, score.toString());
    } catch (e) {
      console.warn('Failed to save high score:', e);
    }
  }
  
  clearHighScore() {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (e) {
      console.warn('Failed to clear high score:', e);
    }
  }
}
```

## Data Models

### Ghost Data Structure
```javascript
{
  x: number,              // X position (fixed horizontal position)
  y: number,              // Y position (vertical, changes with physics)
  velocity: number,       // Current vertical velocity
  rotation: number,       // Visual rotation angle in degrees
  width: number,          // Sprite width
  height: number,         // Sprite height
  sprite: Image,          // Loaded sprite image
  hitbox: {
    width: number,
    height: number,
    offsetX: number,
    offsetY: number
  }
}
```


### Pipe Data Structure
```javascript
{
  x: number,              // X position (moves left)
  gapY: number,           // Center Y position of the gap
  gapSize: number,        // Height of the gap
  width: number,          // Pipe width
  topHeight: number,      // Height of top pipe
  bottomY: number,        // Y position where bottom pipe starts
  bottomHeight: number,   // Height of bottom pipe
  scored: boolean,        // Whether player has passed this pipe
  canvasHeight: number    // Reference to canvas height
}
```

### Particle Data Structure
```javascript
{
  x: number,              // X position
  y: number,              // Y position
  vx: number,             // X velocity
  vy: number,             // Y velocity
  life: number,           // Opacity/life (1.0 to 0.0)
  decay: number,          // Life decay rate per frame
  size: number,           // Particle radius
  color: string           // RGBA color string
}
```

### Score Indicator Data Structure
```javascript
{
  x: number,              // X position
  y: number,              // Y position
  value: number,          // Score increment value (usually 1)
  life: number,           // Opacity (1.0 to 0.0)
  decay: number,          // Life decay rate per frame
  vy: number              // Upward velocity
}
```

### Game State Data Structure
```javascript
{
  currentState: string,           // 'menu' | 'playing' | 'paused' | 'game_over'
  score: number,                  // Current session score
  highScore: number,              // All-time high score
  invincibilityFrames: number,    // Remaining invincibility frames
  invincibilityDuration: number   // Total invincibility duration
}
```


## Game Loop Implementation

### Main Game Loop

The game loop follows the standard pattern: **Update → Physics → Collision → Render**

```javascript
gameLoop(timestamp) {
  // Calculate delta time for frame-rate independence
  this.deltaTime = (timestamp - this.lastFrameTime) / 8.33; // Normalize to 120fps
  this.lastFrameTime = timestamp;
  
  // Clamp delta time to prevent large jumps
  this.deltaTime = Math.min(this.deltaTime, 2);
  
  // Update based on current state
  if (this.state.isPlaying()) {
    this.updatePlaying(this.deltaTime);
  }
  
  // Render current frame
  this.render();
  
  // Request next frame
  requestAnimationFrame((t) => this.gameLoop(t));
}
```

### Update Phase (Playing State)

```javascript
updatePlaying(deltaTime) {
  // Update invincibility
  this.state.updateInvincibility();
  
  // Update ghost physics
  this.entities.ghost.update(
    deltaTime,
    this.physics.gravity,
    this.physics.terminalVelocity,
    this.physics.maxUpwardVelocity
  );
  
  // Update pipes
  this.updatePipes(deltaTime);
  
  // Generate new pipes if needed
  this.generatePipes();
  
  // Update particles
  this.updateParticles(deltaTime);
  
  // Update score indicators
  this.updateScoreIndicators(deltaTime);
  
  // Check collisions
  this.checkCollisions();
  
  // Update screen shake
  this.collision.updateScreenShake();
}
```


### Pipe Management

```javascript
updatePipes(deltaTime) {
  // Move all pipes
  for (const pipe of this.entities.pipes) {
    pipe.update(deltaTime, this.physics.pipeSpeed);
    
    // Check if ghost passed this pipe
    if (pipe.hasPassedGhost(this.entities.ghost.x)) {
      pipe.markScored();
      this.state.incrementScore();
      this.physics.increaseDifficulty(this.state.score);
      this.audio.playSound('score');
      
      // Create score indicator
      this.entities.scoreIndicators.push(
        new ScoreIndicator(pipe.x + pipe.width / 2, pipe.gapY, 1)
      );
    }
  }
  
  // Remove off-screen pipes
  this.entities.pipes = this.entities.pipes.filter(pipe => !pipe.isOffScreen());
}

generatePipes() {
  // Check if we need a new pipe
  const lastPipe = this.entities.pipes[this.entities.pipes.length - 1];
  const spawnX = this.canvas.width;
  
  if (!lastPipe || lastPipe.x < spawnX - this.physics.pipeSpacing) {
    const gapY = this.physics.generateGapPosition();
    this.entities.pipes.push(
      new Pipe(spawnX, gapY, this.physics.gapSize, this.canvas.height)
    );
  }
}
```

### Particle Management

```javascript
updateParticles(deltaTime) {
  // Generate new particles
  if (Math.random() < 0.3) { // 30% chance per frame
    this.entities.particles.push(
      new Particle(this.entities.ghost.x, this.entities.ghost.y + this.entities.ghost.height / 2)
    );
  }
  
  // Update existing particles
  for (const particle of this.entities.particles) {
    particle.update(deltaTime);
  }
  
  // Remove dead particles
  this.entities.particles = this.entities.particles.filter(p => !p.isDead());
}

updateScoreIndicators(deltaTime) {
  for (const indicator of this.entities.scoreIndicators) {
    indicator.update(deltaTime);
  }
  
  this.entities.scoreIndicators = this.entities.scoreIndicators.filter(
    i => !i.isDead()
  );
}
```


### Collision Detection

```javascript
checkCollisions() {
  const collisionDetected = this.collision.checkAllCollisions(
    this.entities.ghost,
    this.entities.pipes,
    this.canvas.height,
    this.state.isInvincible()
  );
  
  if (collisionDetected) {
    this.handleGameOver();
  }
}

handleGameOver() {
  this.state.setState(GameStates.GAME_OVER);
  this.audio.playSound('gameOver');
  this.collision.triggerScreenShake(10, 15);
  
  // Save high score
  if (this.state.score > this.state.highScore) {
    this.storage.saveHighScore(this.state.score);
  }
}
```

### Render Phase

```javascript
render() {
  // Apply screen shake offset
  this.ctx.save();
  const shakeOffset = this.collision.getScreenShakeOffset();
  this.renderer.applyScreenShake(shakeOffset);
  
  // Clear canvas
  this.renderer.clear();
  
  // Render based on state
  if (this.state.isMenu()) {
    this.renderer.renderMenu(this.state.highScore);
  } else if (this.state.isPlaying()) {
    this.renderPlaying();
  } else if (this.state.isPaused()) {
    this.renderPlaying();
    this.renderer.renderPauseOverlay();
  } else if (this.state.isGameOver()) {
    this.renderPlaying();
    this.renderer.renderGameOver(this.state.score, this.state.highScore);
  }
  
  this.ctx.restore();
}

renderPlaying() {
  // Render particles (behind ghost)
  for (const particle of this.entities.particles) {
    this.renderer.renderParticle(particle);
  }
  
  // Render pipes
  for (const pipe of this.entities.pipes) {
    this.renderer.renderPipe(pipe);
  }
  
  // Render ghost
  this.renderer.renderGhost(this.entities.ghost);
  
  // Render invincibility indicator
  if (this.state.isInvincible()) {
    this.renderer.renderInvincibilityIndicator(this.entities.ghost);
  }
  
  // Render score indicators
  for (const indicator of this.entities.scoreIndicators) {
    this.renderer.renderScoreIndicator(indicator);
  }
  
  // Render score
  this.renderer.renderScore(this.state.score, this.state.highScore);
}
```


## Input Handling Flow

### Input Event Flow

```
User Input (Space/Click/Touch)
         ↓
   InputHandler
         ↓
   Check Game State
         ↓
    ┌────┴────┐
    ↓         ↓
  MENU    PLAYING/GAME_OVER
    ↓         ↓
Start Game  Ghost Jump
    ↓         ↓
Set State   Apply Jump Velocity
  PLAYING   Play Jump Sound
```

### State Transition Handling

```javascript
handleInput() {
  const currentState = this.state.currentState;
  
  if (currentState === GameStates.MENU) {
    this.startGame();
  } else if (currentState === GameStates.PLAYING) {
    this.jump();
  } else if (currentState === GameStates.GAME_OVER) {
    this.restartGame();
  }
}

startGame() {
  this.state.setState(GameStates.PLAYING);
  this.state.resetScore();
  this.state.startInvincibility();
  this.resetEntities();
  this.physics.resetDifficulty();
}

jump() {
  this.entities.ghost.jump(this.physics.jumpVelocity);
  this.audio.playSound('jump');
}

restartGame() {
  this.startGame();
}

handlePauseInput() {
  if (this.state.isPlaying()) {
    this.state.setState(GameStates.PAUSED);
  } else if (this.state.isPaused()) {
    this.state.setState(GameStates.PLAYING);
  }
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified several redundant properties that can be consolidated:

**Redundancies Eliminated:**
- Properties 1.1.3 and 1.2 both test gravity application → Combined into Property 2
- Properties 2.1.7 and 2.3 both test pipe movement → Combined into Property 7
- Properties 3.1.9 and 3.1 both test pipe collision → Combined into Property 11
- Properties 3.3 and 7.4 both test collision state transition → Combined into Property 15
- Properties 7.2 and 7.1.4 both test menu to playing transition → Combined into Property 24
- Properties 7.5 and 7.1.14 both test game over restart → Combined into Property 26
- Properties 4.4 and 7.1.16 both test high score update → Combined into Property 18

### Physics Properties

**Property 1: Jump input sets upward velocity**
*For any* ghost with any initial velocity, when a jump is triggered, the ghost's velocity should be set to the negative jump velocity value (upward direction).
**Validates: Requirements 1.1.2**

**Property 2: Gravity continuously accelerates ghost downward**
*For any* ghost, when updated without input over multiple frames, the ghost's velocity should increase in the downward direction by the gravity constant each frame.
**Validates: Requirements 1.2, 1.1.3**

**Property 3: Terminal velocity limits falling speed**
*For any* ghost with velocity exceeding terminal velocity, after physics update, the ghost's velocity should be clamped to the terminal velocity maximum.
**Validates: Requirements 1.1.4**

**Property 4: Maximum upward velocity limits ascending speed**
*For any* ghost with velocity more negative than the maximum upward velocity, after physics update, the ghost's velocity should be clamped to the maximum upward velocity.
**Validates: Requirements 1.1.5**

**Property 5: Position updates by velocity integration**
*For any* ghost with a given velocity and delta time, the ghost's position change should equal velocity multiplied by delta time.
**Validates: Requirements 1.1.6**

**Property 6: Frame-rate independence through delta time**
*For any* ghost, updating with delta time D twice should produce the same result as updating once with delta time 2D (within floating point tolerance).
**Validates: Requirements 1.1.7**


### Pipe Generation and Movement Properties

**Property 7: Pipes move at current speed**
*For any* pipe, after updating with delta time D and speed S, the pipe's X position should decrease by S * D pixels.
**Validates: Requirements 2.3, 2.1.7**

**Property 8: Off-screen pipes are removed**
*For any* pipe whose right edge (x + width) is less than 0, that pipe should be removed from the active pipes list.
**Validates: Requirements 2.4**

**Property 9: Pipes are spaced correctly**
*For any* two consecutive pipes in the game, the horizontal distance between them should be equal to the pipe spacing constant.
**Validates: Requirements 2.1.2**

**Property 10: Gap positions are within valid range**
*For any* generated pipe, the gap center Y position should be between the minimum and maximum gap Y values (inclusive).
**Validates: Requirements 2.1.4, 2.1.5**

**Property 11: Difficulty increases at score thresholds**
*For any* score that is a multiple of the speed increase threshold, the pipe speed should be increased by the speed increment (up to maximum).
**Validates: Requirements 2.1.8**

**Property 12: Pipe speed never exceeds maximum**
*For any* game state, the current pipe speed should never exceed the maximum pipe speed constant.
**Validates: Requirements 2.1.9**

### Collision Detection Properties

**Property 13: Rectangular intersection detects overlapping hitboxes**
*For any* two rectangles that overlap in both X and Y dimensions, the rectangular intersection function should return true.
**Validates: Requirements 3.1.4**

**Property 14: Ghost-pipe collision detected when hitboxes intersect**
*For any* ghost and pipe where the ghost's hitbox intersects either the top or bottom pipe hitbox, collision should be detected.
**Validates: Requirements 3.1, 3.1.9**

**Property 15: Ceiling boundary collision detected**
*For any* ghost whose hitbox Y position is less than or equal to 0, a ceiling collision should be detected.
**Validates: Requirements 1.4, 3.2, 3.1.7**

**Property 16: Ground boundary collision detected**
*For any* ghost whose hitbox bottom edge (Y + height) is greater than or equal to canvas height, a ground collision should be detected.
**Validates: Requirements 1.3, 3.2, 3.1.8**

**Property 17: Collision triggers game over state**
*For any* collision detected when not invincible, the game state should transition to game_over.
**Validates: Requirements 3.3, 7.4**

**Property 18: Invincibility prevents collision detection**
*For any* collision scenario while invincibility frames are active, collision should be ignored and game should continue.
**Validates: Requirements 3.1.12**

**Property 19: Invincibility expires after duration**
*For any* game that starts with invincibility, after updating for the invincibility duration frames, invincibility should be inactive.
**Validates: Requirements 3.1.13**


### Score Tracking Properties

**Property 20: Score increments when passing pipes**
*For any* ghost that passes a pipe's right edge (ghost X > pipe X + pipe width), the score should increment by exactly one, and the pipe should be marked as scored.
**Validates: Requirements 4.1**

**Property 21: High score updates when current score exceeds it**
*For any* game session ending with a score greater than the stored high score, the high score should be updated to the current score.
**Validates: Requirements 4.4, 7.1.16**

**Property 22: Score resets to zero on new game**
*For any* new game session started from menu or game over, the score should be reset to 0.
**Validates: Requirements 4.5**

**Property 23: High score persistence round-trip**
*For any* valid high score value, saving it to local storage then loading it should return the same value.
**Validates: Requirements 4.6**

**Property 24: Local storage fallback to zero**
*For any* game initialization when local storage is empty or unavailable, the high score should be initialized to 0.
**Validates: Requirements 7.1.18**

### State Management Properties

**Property 25: Menu to playing transition on input**
*For any* game in menu state, when player input is received, the game state should transition to playing.
**Validates: Requirements 7.2, 7.1.4**

**Property 26: Game over to playing transition restarts game**
*For any* game in game_over state, when player input is received, the game should restart with score reset to 0, pipes cleared, and state set to playing.
**Validates: Requirements 7.5, 7.1.14, 7.6**

**Property 27: Playing to paused transition freezes updates**
*For any* game in playing state, when pause input is received, the game state should transition to paused and entity updates should stop.
**Validates: Requirements 7.1.6, 7.1.7**

**Property 28: Paused to playing transition resumes updates**
*For any* game in paused state, when input is received, the game state should transition to playing and entity updates should resume.
**Validates: Requirements 7.1.9**

**Property 29: Playing state updates all entities**
*For any* game in playing state, each frame update should modify entity positions, velocities, or states.
**Validates: Requirements 7.3**

**Property 30: Invincibility activates on game start**
*For any* game transitioning to playing state, invincibility frames should be set to the invincibility duration.
**Validates: Requirements 3.1.11**


### Visual Effects Properties

**Property 31: Screen shake activates on collision**
*For any* collision detected, screen shake should be activated with non-zero intensity and duration.
**Validates: Requirements 5.1.8**

**Property 32: Screen shake intensity decreases over time**
*For any* active screen shake, the intensity should decrease with each frame until reaching zero.
**Validates: Requirements 5.1.10**

**Property 33: Particles are generated during gameplay**
*For any* game in playing state over multiple frames, particles should be created near the ghost's position.
**Validates: Requirements 5.1.11, 5.1.12**

**Property 34: Particles fade and die**
*For any* particle, after updating over multiple frames, the particle's life should decrease until it reaches zero or below.
**Validates: Requirements 5.1.13**

**Property 35: Dead particles are removed**
*For any* particle with life <= 0, that particle should be removed from the active particles list.
**Validates: Requirements 5.1.17**

**Property 36: Score indicators created on score increment**
*For any* score increment event, a score indicator should be created at the pipe location.
**Validates: Requirements 5.1.14**

**Property 37: Score indicators float upward and fade**
*For any* score indicator, after updating over multiple frames, the Y position should decrease (move up) and life should decrease.
**Validates: Requirements 5.1.15**

**Property 38: Dead score indicators are removed**
*For any* score indicator with life <= 0, that indicator should be removed from the active indicators list.
**Validates: Requirements 5.1.17**

### Input Handling Properties

**Property 39: Jump input triggers velocity change**
*For any* game in playing state, when jump input is received, the ghost's velocity should be set to the jump velocity and jump sound should play.
**Validates: Requirements 1.1**

**Property 40: Multiple input types trigger same action**
*For any* input type (mouse click, touch, spacebar), the same game action should be triggered (jump in playing, start in menu, restart in game over).
**Validates: Requirements 8.2**


## Error Handling

### Asset Loading Errors

**Strategy**: Graceful degradation with fallbacks

```javascript
class AssetLoader {
  async loadImage(path) {
    try {
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = path;
      });
      return img;
    } catch (error) {
      console.error(`Failed to load image: ${path}`, error);
      // Return a colored rectangle as fallback
      return this.createFallbackImage();
    }
  }
  
  createFallbackImage() {
    const canvas = document.createElement('canvas');
    canvas.width = 34;
    canvas.height = 24;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 34, 24);
    return canvas;
  }
}
```

**Error Cases**:
- Missing sprite files → Use colored rectangles
- Missing audio files → Silent gameplay (log warning)
- Network errors → Continue with loaded assets

### LocalStorage Errors

**Strategy**: Fail silently with default values

```javascript
class StorageManager {
  loadHighScore() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? parseInt(stored, 10) : 0;
    } catch (e) {
      console.warn('LocalStorage unavailable:', e);
      return 0; // Default value
    }
  }
  
  saveHighScore(score) {
    try {
      localStorage.setItem(this.storageKey, score.toString());
    } catch (e) {
      console.warn('Failed to save high score:', e);
      // Continue gameplay without persistence
    }
  }
}
```

**Error Cases**:
- LocalStorage disabled → Use in-memory high score
- QuotaExceededError → Log warning, continue
- SecurityError (private browsing) → Use session storage fallback


### Audio Playback Errors

**Strategy**: Catch and log, continue without audio

```javascript
class AudioManager {
  playSound(name) {
    if (this.muted || !this.sounds[name]) return;
    
    try {
      const sound = this.sounds[name].cloneNode();
      sound.volume = this.volume;
      sound.play().catch(err => {
        console.warn('Audio play failed:', err);
        // Continue gameplay silently
      });
    } catch (error) {
      console.warn('Audio error:', error);
    }
  }
}
```

**Error Cases**:
- Autoplay policy blocks audio → Wait for user interaction
- Audio format not supported → Skip audio
- Audio context suspended → Resume on user gesture

### Canvas Rendering Errors

**Strategy**: Validate canvas context, fail fast on critical errors

```javascript
class Game {
  init() {
    if (!this.canvas || !this.ctx) {
      throw new Error('Canvas not supported in this browser');
    }
    
    if (typeof this.ctx.fillRect !== 'function') {
      throw new Error('Canvas 2D context not available');
    }
  }
}
```

**Error Cases**:
- Canvas not supported → Display error message
- Context lost → Attempt to restore, reload if necessary
- Out of memory → Reduce particle count, simplify rendering

### Input Handling Errors

**Strategy**: Defensive event handling

```javascript
class InputHandler {
  setupEventListeners() {
    document.addEventListener('keydown', (e) => {
      try {
        if (e.code === 'Space') {
          e.preventDefault();
          this.handleJumpOrStart();
        }
      } catch (error) {
        console.error('Input handling error:', error);
      }
    });
  }
}
```

**Error Cases**:
- Event listener fails → Log error, continue
- Callback throws → Catch and log, don't crash game loop
- Touch events not supported → Fall back to mouse only


## Testing Strategy

### Dual Testing Approach

The testing strategy employs both **unit tests** and **property-based tests** as complementary approaches:

- **Unit tests**: Verify specific examples, edge cases, and integration points
- **Property-based tests**: Verify universal properties across randomized inputs
- Together they provide comprehensive coverage: unit tests catch concrete bugs, property tests verify general correctness

### Property-Based Testing Framework

**Framework**: [fast-check](https://github.com/dubzzz/fast-check) for JavaScript

**Configuration**:
- Minimum 100 iterations per property test (due to randomization)
- Each test tagged with: `Feature: flappy-kiro, Property {number}: {property_text}`
- Tests organized by subsystem (physics, collision, state, etc.)

**Example Property Test Structure**:

```javascript
import fc from 'fast-check';

describe('Physics Properties', () => {
  // Feature: flappy-kiro, Property 1: Jump input sets upward velocity
  test('Property 1: Jump sets velocity to jump velocity value', () => {
    fc.assert(
      fc.property(
        fc.float({ min: -20, max: 20 }), // Initial velocity
        (initialVelocity) => {
          const ghost = new Ghost(100, 200, mockSprite);
          ghost.velocity = initialVelocity;
          const jumpVelocity = -10;
          
          ghost.jump(jumpVelocity);
          
          expect(ghost.velocity).toBe(jumpVelocity);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  // Feature: flappy-kiro, Property 2: Gravity continuously accelerates downward
  test('Property 2: Gravity increases velocity each frame', () => {
    fc.assert(
      fc.property(
        fc.float({ min: -10, max: 10 }), // Initial velocity
        fc.float({ min: 0.5, max: 2 }),  // Delta time
        (initialVelocity, deltaTime) => {
          const ghost = new Ghost(100, 200, mockSprite);
          ghost.velocity = initialVelocity;
          const gravity = 0.6;
          
          const velocityBefore = ghost.velocity;
          ghost.update(deltaTime, gravity, 12, -12);
          
          // Velocity should increase (become more positive) by gravity * deltaTime
          expect(ghost.velocity).toBeGreaterThan(velocityBefore);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```


### Unit Testing Strategy

**Framework**: Jest for JavaScript

**Test Organization**:
```
tests/
├── unit/
│   ├── entities/
│   │   ├── ghost.test.js
│   │   ├── pipe.test.js
│   │   └── particle.test.js
│   ├── systems/
│   │   ├── physics.test.js
│   │   ├── collision.test.js
│   │   ├── renderer.test.js
│   │   └── audio.test.js
│   ├── state.test.js
│   ├── input.test.js
│   └── storage.test.js
├── property/
│   ├── physics.property.test.js
│   ├── collision.property.test.js
│   ├── state.property.test.js
│   └── effects.property.test.js
└── integration/
    └── game.integration.test.js
```

**Unit Test Focus Areas**:

1. **Specific Examples**:
   - Ghost sprite loads from correct path
   - Initial game state is menu
   - High score uses correct localStorage key
   - Background color is light blue (#87CEEB)

2. **Edge Cases**:
   - Ghost at exact boundary positions (y = 0, y = canvas.height)
   - Pipe with gap at minimum/maximum Y positions
   - Score increment at speed threshold boundaries
   - Empty localStorage returns 0

3. **Integration Points**:
   - Game loop coordinates all subsystems correctly
   - State transitions trigger appropriate callbacks
   - Input events propagate to correct handlers
   - Audio plays on correct game events

4. **Error Conditions**:
   - Missing asset files handled gracefully
   - localStorage unavailable doesn't crash
   - Invalid audio playback caught and logged
   - Canvas context errors handled

**Example Unit Tests**:

```javascript
describe('Ghost Entity', () => {
  test('should initialize with correct dimensions', () => {
    const ghost = new Ghost(100, 200, mockSprite);
    expect(ghost.width).toBe(34);
    expect(ghost.height).toBe(24);
  });
  
  test('should have hitbox smaller than sprite', () => {
    const ghost = new Ghost(100, 200, mockSprite);
    expect(ghost.hitbox.width).toBeLessThan(ghost.width);
    expect(ghost.hitbox.height).toBeLessThan(ghost.height);
  });
  
  test('should reset to initial position', () => {
    const ghost = new Ghost(100, 200, mockSprite);
    ghost.velocity = 5;
    ghost.y = 300;
    
    ghost.reset(100, 200);
    
    expect(ghost.y).toBe(200);
    expect(ghost.velocity).toBe(0);
  });
});

describe('StorageManager', () => {
  test('should use correct localStorage key', () => {
    const storage = new StorageManager();
    expect(storage.storageKey).toBe('flappyKiroHighScore');
  });
  
  test('should return 0 when localStorage is empty', () => {
    localStorage.clear();
    const storage = new StorageManager();
    expect(storage.loadHighScore()).toBe(0);
  });
  
  test('should save and load high score', () => {
    const storage = new StorageManager();
    storage.saveHighScore(42);
    expect(storage.loadHighScore()).toBe(42);
  });
});
```


### Property Test Generators

**Custom Generators for Game Entities**:

```javascript
// Arbitrary ghost generator
const arbGhost = () => fc.record({
  x: fc.float({ min: 0, max: 400 }),
  y: fc.float({ min: 0, max: 600 }),
  velocity: fc.float({ min: -15, max: 15 })
}).map(({ x, y, velocity }) => {
  const ghost = new Ghost(x, y, mockSprite);
  ghost.velocity = velocity;
  return ghost;
});

// Arbitrary pipe generator
const arbPipe = (canvasHeight = 600) => fc.record({
  x: fc.float({ min: 0, max: 800 }),
  gapY: fc.float({ min: 100, max: 500 }),
  gapSize: fc.constant(150)
}).map(({ x, gapY, gapSize }) => 
  new Pipe(x, gapY, gapSize, canvasHeight)
);

// Arbitrary game state generator
const arbGameState = () => fc.oneof(
  fc.constant(GameStates.MENU),
  fc.constant(GameStates.PLAYING),
  fc.constant(GameStates.PAUSED),
  fc.constant(GameStates.GAME_OVER)
);

// Delta time generator (normalized around 120fps)
const arbDeltaTime = () => fc.float({ min: 0.5, max: 2.0 });
```

### Test Coverage Goals

**Minimum Coverage Targets**:
- Line coverage: 80%
- Branch coverage: 75%
- Function coverage: 90%

**Critical Paths (100% coverage required)**:
- Collision detection logic
- State transition logic
- Score tracking and persistence
- Physics calculations

### Continuous Testing

**Pre-commit Hooks**:
- Run unit tests (fast feedback)
- Run linter and type checks

**CI Pipeline**:
- Run all unit tests
- Run all property tests (100 iterations)
- Generate coverage report
- Fail build if coverage drops below targets

### Manual Testing Checklist

**Gameplay Testing**:
- [ ] Ghost responds to all input types (mouse, touch, keyboard)
- [ ] Collision detection feels fair and accurate
- [ ] Difficulty progression feels balanced
- [ ] Audio plays at appropriate times
- [ ] Visual effects enhance gameplay without distraction
- [ ] Game runs smoothly at 120 FPS on capable hardware
- [ ] High score persists across browser sessions
- [ ] Pause functionality works correctly
- [ ] Game over and restart flow is smooth

**Browser Compatibility**:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

**Accessibility**:
- [ ] Keyboard controls work without mouse
- [ ] Touch controls work on mobile devices
- [ ] Game is playable without audio (visual feedback sufficient)
- [ ] Color contrast is sufficient for visibility


## Performance Considerations

### Target Performance

- **Frame Rate**: 120 FPS (8.33ms per frame budget)
- **Frame Time Budget**: 
  - Update logic: < 2.5ms
  - Collision detection: < 1ms
  - Rendering: < 4ms
  - Remaining: ~0.8ms buffer
- **Maximum Entities**: 
  - Pipes: ~10 active at once
  - Particles: ~50 active at once
  - Score Indicators: ~3 active at once
- **Memory**: < 50MB total
- **Load Time**: < 2 seconds on 3G connection
- **Garbage Collection**: Minimize allocations to avoid GC pauses

### Optimization Strategies

**1. Object Pooling for Particles**

Instead of creating/destroying particles constantly, reuse them to avoid garbage collection:

```javascript
class ParticlePool {
  constructor(size = 100) {
    this.pool = [];
    this.activeParticles = [];
    
    // Pre-allocate particle objects
    for (let i = 0; i < size; i++) {
      this.pool.push(new Particle(0, 0));
    }
  }
  
  spawn(x, y) {
    let particle;
    
    if (this.pool.length > 0) {
      // Reuse from pool
      particle = this.pool.pop();
      particle.reset(x, y);
    } else {
      // Create new if pool exhausted (rare)
      particle = new Particle(x, y);
    }
    
    this.activeParticles.push(particle);
    return particle;
  }
  
  update(deltaTime) {
    // Update and recycle dead particles
    for (let i = this.activeParticles.length - 1; i >= 0; i--) {
      const particle = this.activeParticles[i];
      particle.update(deltaTime);
      
      if (particle.isDead()) {
        // Remove from active and return to pool
        this.activeParticles.splice(i, 1);
        this.recycle(particle);
      }
    }
  }
  
  recycle(particle) {
    // Return to pool for reuse
    this.pool.push(particle);
  }
  
  clear() {
    // Return all active particles to pool
    while (this.activeParticles.length > 0) {
      this.recycle(this.activeParticles.pop());
    }
  }
}
```

**2. Object Pooling for Pipes (Obstacle Pooling)**

Reuse pipe objects instead of creating new ones:

```javascript
class PipePool {
  constructor(config, canvasHeight) {
    this.config = config;
    this.canvasHeight = canvasHeight;
    this.pool = [];
    this.activePipes = [];
    
    // Pre-allocate pipe objects
    const initialPoolSize = 15; // More than max active pipes
    for (let i = 0; i < initialPoolSize; i++) {
      this.pool.push(new Pipe(0, 0, 0, canvasHeight, config));
    }
  }
  
  spawn(x, gapY, gapSize) {
    let pipe;
    
    if (this.pool.length > 0) {
      // Reuse from pool
      pipe = this.pool.pop();
      pipe.reset(x, gapY, gapSize);
    } else {
      // Create new if pool exhausted
      pipe = new Pipe(x, gapY, gapSize, this.canvasHeight, this.config);
    }
    
    this.activePipes.push(pipe);
    return pipe;
  }
  
  update(deltaTime, speed) {
    // Update and recycle off-screen pipes
    for (let i = this.activePipes.length - 1; i >= 0; i--) {
      const pipe = this.activePipes[i];
      pipe.update(deltaTime, speed);
      
      if (pipe.isOffScreen()) {
        // Remove from active and return to pool
        this.activePipes.splice(i, 1);
        this.recycle(pipe);
      }
    }
  }
  
  recycle(pipe) {
    // Return to pool for reuse
    pipe.scored = false; // Reset state
    this.pool.push(pipe);
  }
  
  clear() {
    // Return all active pipes to pool
    while (this.activePipes.length > 0) {
      this.recycle(this.activePipes.pop());
    }
  }
  
  getActivePipes() {
    return this.activePipes;
  }
}

// Add reset method to Pipe class
class Pipe {
  // ... existing code ...
  
  reset(x, gapY, gapSize) {
    this.x = x;
    this.gapY = gapY;
    this.gapSize = gapSize;
    this.scored = false;
    
    // Recalculate pipe heights
    this.topHeight = gapY - (gapSize / 2);
    this.bottomY = gapY + (gapSize / 2);
    this.bottomHeight = this.canvasHeight - this.bottomY;
  }
}
```

**3. Efficient Sprite Batching**

Batch canvas operations to minimize state changes:

```javascript
class Renderer {
  constructor(ctx, config) {
    this.ctx = ctx;
    this.config = config;
    this.canvas = ctx.canvas;
    
    // Pre-render static backgrounds to off-screen canvas
    this.backgroundCanvas = document.createElement('canvas');
    this.backgroundCanvas.width = this.canvas.width;
    this.backgroundCanvas.height = this.canvas.height;
    this.prerenderBackground();
  }
  
  prerenderBackground() {
    const bgCtx = this.backgroundCanvas.getContext('2d');
    bgCtx.fillStyle = this.config.visual.backgroundColor;
    bgCtx.fillRect(0, 0, this.backgroundCanvas.width, this.backgroundCanvas.height);
    
    // Add any static background elements here (clouds, etc.)
  }
  
  clear() {
    // Use pre-rendered background instead of fillRect
    this.ctx.drawImage(this.backgroundCanvas, 0, 0);
  }
  
  /**
   * Batch render all pipes with minimal state changes
   */
  renderPipes(pipes) {
    if (pipes.length === 0) return;
    
    // Set pipe color once for all pipes
    this.ctx.fillStyle = this.config.visual.pipeColor;
    
    // Render all pipe bodies in one batch
    for (const pipe of pipes) {
      // Top pipe
      this.ctx.fillRect(pipe.x, 0, pipe.width, pipe.topHeight);
      // Bottom pipe
      this.ctx.fillRect(pipe.x, pipe.bottomY, pipe.width, pipe.bottomHeight);
    }
    
    // Set cap color once for all caps
    this.ctx.fillStyle = this.config.visual.pipeCapColor;
    
    // Render all pipe caps in one batch
    for (const pipe of pipes) {
      this.ctx.fillRect(pipe.x - 2, pipe.topHeight - 20, pipe.width + 4, 20);
      this.ctx.fillRect(pipe.x - 2, pipe.bottomY, pipe.width + 4, 20);
    }
  }
  
  /**
   * Batch render all particles with minimal state changes
   */
  renderParticles(particles) {
    if (particles.length === 0) return;
    
    // Group particles by opacity for batching
    this.ctx.save();
    
    for (const particle of particles) {
      this.ctx.globalAlpha = particle.life;
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
    
    this.ctx.restore();
  }
  
  /**
   * Batch render all score indicators
   */
  renderScoreIndicators(indicators) {
    if (indicators.length === 0) return;
    
    this.ctx.save();
    this.ctx.font = `bold ${this.config.scoreIndicators.fontSize}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = this.config.scoreIndicators.color;
    
    for (const indicator of indicators) {
      this.ctx.globalAlpha = indicator.life;
      this.ctx.fillText(`+${indicator.value}`, indicator.x, indicator.y);
    }
    
    this.ctx.restore();
  }
}
```

**4. Efficient Collision Detection**

Spatial partitioning and early exits:

```javascript
class CollisionSystem {
  // ... existing code ...
  
  /**
   * Optimized collision check with spatial partitioning
   */
  checkCollisionsOptimized(ghost, pipes, canvasHeight, isInvincible) {
    if (isInvincible) {
      return { collided: false, type: 'invincible' };
    }
    
    // Check boundary collisions first (fastest check)
    const boundaryCollision = this.checkGhostBoundaryCollision(ghost, canvasHeight);
    if (boundaryCollision.collided) {
      return boundaryCollision;
    }
    
    // Spatial partitioning: only check nearby pipes
    const ghostX = ghost.x;
    const collisionRange = 150; // Only check pipes within this range
    
    for (const pipe of pipes) {
      // Skip pipes outside collision range (optimization)
      if (pipe.x + pipe.width < ghostX - collisionRange) {
        continue; // Pipe is behind ghost
      }
      if (pipe.x > ghostX + collisionRange) {
        break; // Pipes are sorted, no need to check further
      }
      
      // Check collision with this pipe
      const pipeCollision = this.checkGhostPipeCollision(ghost, pipe);
      if (pipeCollision.collided) {
        return pipeCollision; // Early exit on first collision
      }
    }
    
    return { collided: false };
  }
  
  /**
   * Cache hitbox calculations to avoid repeated computation
   */
  getCachedGhostCircle(ghost) {
    // Cache circle calculation if ghost hasn't moved
    if (!this._cachedCircle || 
        this._cachedGhostY !== ghost.y) {
      this._cachedCircle = this.getGhostCircle(ghost);
      this._cachedGhostY = ghost.y;
    }
    return this._cachedCircle;
  }
}
```

**5. Memory Management Best Practices**

```javascript
class Game {
  // ... existing code ...
  
  /**
   * Clean up resources to prevent memory leaks
   */
  cleanup() {
    // Clear all entity pools
    this.particlePool.clear();
    this.pipePool.clear();
    this.scoreIndicatorPool.clear();
    
    // Remove event listeners
    this.input.removeAllListeners();
    
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Nullify references
    this.entities.ghost = null;
    this.entities.pipes = [];
    this.entities.particles = [];
    this.entities.scoreIndicators = [];
  }
  
  /**
   * Limit entity counts to prevent memory bloat
   */
  enforceEntityLimits() {
    const maxParticles = this.config.particles.maxActive;
    const maxScoreIndicators = 5;
    
    // Remove excess particles (oldest first)
    while (this.entities.particles.length > maxParticles) {
      const removed = this.entities.particles.shift();
      this.particlePool.recycle(removed);
    }
    
    // Remove excess score indicators
    while (this.entities.scoreIndicators.length > maxScoreIndicators) {
      const removed = this.entities.scoreIndicators.shift();
      this.scoreIndicatorPool.recycle(removed);
    }
  }
}
```

**6. Frame Rate Management**

Ensure consistent 120 FPS with delta time normalization:

```javascript
class Game {
  constructor(canvas) {
    // ... existing code ...
    this.targetFPS = 120;
    this.targetFrameTime = 1000 / this.targetFPS; // 8.33ms
    this.lastFrameTime = 0;
    this.deltaTime = 0;
    this.accumulatedTime = 0;
  }
  
  gameLoop(timestamp) {
    // Request next frame immediately
    requestAnimationFrame((t) => this.gameLoop(t));
    
    // Calculate delta time
    const frameTime = timestamp - this.lastFrameTime;
    this.lastFrameTime = timestamp;
    
    // Clamp delta time to prevent spiral of death
    const clampedFrameTime = Math.min(frameTime, this.config.performance.maxDeltaTime * this.targetFrameTime);
    
    // Normalize delta time (1.0 = 120fps)
    this.deltaTime = clampedFrameTime / this.targetFrameTime;
    
    // Update game state
    if (this.state.isPlaying()) {
      this.update(this.deltaTime);
      this.checkCollisions();
    }
    
    // Always render
    this.render();
    
    // Update performance monitor
    if (this.performanceMonitor) {
      this.performanceMonitor.update();
    }
  }
}
```

**7. Asset Loading Optimization**

```javascript
class AssetLoader {
  constructor() {
    this.assets = {
      images: {},
      sounds: {}
    };
    this.loadedCount = 0;
    this.totalCount = 0;
  }
  
  async loadAll(assetManifest) {
    this.totalCount = assetManifest.images.length + assetManifest.sounds.length;
    
    // Load images
    const imagePromises = assetManifest.images.map(img => 
      this.loadImage(img.name, img.path)
    );
    
    // Load sounds
    const soundPromises = assetManifest.sounds.map(snd => 
      this.loadSound(snd.name, snd.path)
    );
    
    // Load all assets in parallel
    await Promise.all([...imagePromises, ...soundPromises]);
    
    return this.assets;
  }
  
  loadImage(name, path) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.assets.images[name] = img;
        this.loadedCount++;
        resolve(img);
      };
      img.onerror = reject;
      img.src = path;
    });
  }
  
  loadSound(name, path) {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      audio.oncanplaythrough = () => {
        this.assets.sounds[name] = audio;
        this.loadedCount++;
        resolve(audio);
      };
      audio.onerror = reject;
      audio.src = path;
    });
  }
  
  getProgress() {
    return this.totalCount > 0 ? this.loadedCount / this.totalCount : 0;
  }
}
```

### Performance Monitoring

```javascript
class PerformanceMonitor {
  constructor() {
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.fps = 120;
    this.frameTimes = [];
    this.maxFrameTimeHistory = 120; // Track last 120 frames
  }
  
  update() {
    this.frameCount++;
    const currentTime = performance.now();
    const frameTime = currentTime - this.lastTime;
    
    // Track frame times for analysis
    this.frameTimes.push(frameTime);
    if (this.frameTimes.length > this.maxFrameTimeHistory) {
      this.frameTimes.shift();
    }
    
    // Calculate FPS every second
    if (currentTime >= this.lastTime + 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
      this.frameCount = 0;
      this.lastTime = currentTime;
      
      // Warn on low FPS
      if (this.fps < 100) {
        console.warn('Low FPS detected:', this.fps);
        this.diagnosePerformance();
      }
    }
  }
  
  diagnosePerformance() {
    const avgFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    const maxFrameTime = Math.max(...this.frameTimes);
    
    console.log('Performance Diagnostics:');
    console.log('- Average frame time:', avgFrameTime.toFixed(2), 'ms');
    console.log('- Max frame time:', maxFrameTime.toFixed(2), 'ms');
    console.log('- Target frame time: 8.33ms (120 FPS)');
    
    if (avgFrameTime > 8.33) {
      console.warn('Average frame time exceeds budget. Consider:');
      console.warn('- Reducing particle count');
      console.warn('- Simplifying collision detection');
      console.warn('- Optimizing render calls');
    }
  }
  
  getFPS() {
    return this.fps;
  }
  
  getAverageFrameTime() {
    return this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
  }
}
```

### Performance Checklist

**Before Release**:
- [ ] Verify 120 FPS on target devices (desktop with capable hardware)
- [ ] Verify graceful degradation to 60 FPS on lower-end devices
- [ ] Profile with browser DevTools to identify bottlenecks
- [ ] Test with performance monitor enabled
- [ ] Verify no memory leaks (check memory usage over time)
- [ ] Test garbage collection impact (should be minimal)
- [ ] Verify object pools are working correctly
- [ ] Check asset loading time on slow connections
- [ ] Test on low-end devices (should maintain 60 FPS minimum)

**Optimization Priorities**:
1. **Critical**: Maintain 120 FPS on high-refresh-rate displays
2. **Critical**: Maintain 60 FPS minimum on standard displays
3. **High**: Minimize garbage collection pauses
4. **High**: Efficient collision detection
5. **Medium**: Optimize rendering with batching
6. **Medium**: Reduce memory footprint
7. **Low**: Asset loading optimization

## Implementation Notes

### Development Workflow

1. **Phase 1**: Core game loop and physics
2. **Phase 2**: Collision detection and state management
3. **Phase 3**: Visual rendering and effects
4. **Phase 4**: Audio and polish
5. **Phase 5**: Testing and optimization

### Browser Compatibility Notes

- Use ES6+ features (supported in all modern browsers)
- Provide fallbacks for older browsers if needed
- Test touch events on actual mobile devices
- Handle autoplay policy for audio (require user interaction)

### Deployment Considerations

- Host on static file server (GitHub Pages, Netlify, etc.)
- Use relative paths for all assets
- Minify JavaScript for production
- Enable gzip compression on server
- Add service worker for offline play (optional enhancement)

---

**End of Design Document**
