/**
 * Game Configuration
 * Centralized configuration for all game constants
 */

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
    spritePath: 'assets/ghosty.png'
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

// Make config immutable for safety
Object.freeze(GameConfig);

export default GameConfig;
