---
inclusion: auto
---

# Game Coding Standards for Flappy Kiro

## Overview

This document defines coding standards, patterns, and best practices for implementing Flappy Kiro in vanilla JavaScript. These guidelines ensure maintainable, performant, and consistent code throughout the project.

## Core Principles

1. **Clarity over Cleverness**: Write code that's easy to understand
2. **Performance Matters**: Target 120 FPS, optimize hot paths
3. **Separation of Concerns**: Keep logic, rendering, and data separate
4. **Fail Gracefully**: Handle errors without crashing the game
5. **Test-Driven**: Write tests for core game logic

---

## JavaScript Language Standards

### ES6+ Features

**Use Modern JavaScript**:
```javascript
// ✅ GOOD: Use ES6+ features
import GameConfig from './config.js';
const { gravity, jumpVelocity } = config.physics;
const pipes = [...existingPipes, newPipe];
class Ghost extends Entity { }

// ❌ BAD: Avoid old-style JavaScript
var config = require('./config.js');
var gravity = config.physics.gravity;
var pipes = existingPipes.concat([newPipe]);
function Ghost() { }
```

**Use const/let, Never var**:
```javascript
// ✅ GOOD: Use const for immutable, let for mutable
const MAX_SPEED = 240;
let currentSpeed = 120;

// ❌ BAD: Never use var
var maxSpeed = 240;
```

**Use Arrow Functions Appropriately**:
```javascript
// ✅ GOOD: Arrow functions for callbacks and short functions
particles.filter(p => p.isAlive());
const add = (a, b) => a + b;

// ✅ GOOD: Regular functions for methods
class Ghost {
  update(deltaTime) {
    this.velocity += this.gravity * deltaTime;
  }
}

// ❌ BAD: Arrow functions for methods (loses 'this' context)
class Ghost {
  update = (deltaTime) => {
    this.velocity += this.gravity * deltaTime;
  }
}
```

### Module System

**Use ES6 Modules**:
```javascript
// ✅ GOOD: Named exports for utilities
export class Ghost { }
export function calculateDistance(a, b) { }

// ✅ GOOD: Default export for main class
export default class Game { }

// ✅ GOOD: Import what you need
import Game from './game.js';
import { Ghost, Pipe } from './entities.js';

// ❌ BAD: Don't use require/module.exports
const Game = require('./game.js');
module.exports = Game;
```

---

## Naming Conventions

### Classes

**PascalCase for Classes**:
```javascript
// ✅ GOOD: PascalCase
class Game { }
class StateManager { }
class PhysicsEngine { }
class CollisionSystem { }
class AudioManager { }

// ❌ BAD: Other cases
class game { }
class state_manager { }
class physicsEngine { }
```

### Functions and Methods

**camelCase for Functions**:
```javascript
// ✅ GOOD: camelCase, descriptive names
function calculateVelocity(gravity, deltaTime) { }
function checkCollision(ghost, pipe) { }
function generatePipes() { }

// ❌ BAD: Other cases or unclear names
function CalculateVelocity() { }
function check_collision() { }
function gen() { }
```

### Variables

**camelCase for Variables**:
```javascript
// ✅ GOOD: camelCase, descriptive
const currentScore = 0;
const highScore = 42;
const pipeSpeed = 120;
let isGameOver = false;

// ❌ BAD: Other cases or unclear
const CurrentScore = 0;
const high_score = 42;
const ps = 120;
let flag = false;
```

### Constants

**UPPER_SNAKE_CASE for True Constants**:
```javascript
// ✅ GOOD: UPPER_SNAKE_CASE for compile-time constants
const MAX_PIPES = 10;
const TARGET_FPS = 120;
const GRAVITY_CONSTANT = 800;

// ✅ GOOD: camelCase for runtime constants
const config = GameConfig;
const canvas = document.getElementById('game');

// ❌ BAD: UPPER_SNAKE_CASE for runtime values
const CURRENT_SCORE = 0; // This changes!
```

### Private Members

**Prefix with Underscore (Convention)**:
```javascript
// ✅ GOOD: Underscore prefix for private
class Ghost {
  constructor() {
    this._internalState = 0;
    this.publicProperty = 1;
  }
  
  _privateMethod() { }
  publicMethod() { }
}

// ✅ BETTER: Use # for true private (ES2022)
class Ghost {
  #internalState = 0;
  
  #privateMethod() { }
  publicMethod() { }
}
```

---

## Game Architecture Patterns

### Entity-Component Pattern

**Entities as Classes**:
```javascript
// ✅ GOOD: Entity with clear responsibilities
class Ghost {
  constructor(x, y, config) {
    // Position
    this.x = x;
    this.y = y;
    
    // Physics
    this.velocity = 0;
    this.rotation = 0;
    
    // Configuration
    this.config = config;
    this.width = config.ghost.width;
    this.height = config.ghost.height;
  }
  
  update(deltaTime) {
    // Update logic only
  }
  
  getHitbox() {
    // Return collision data
    return {
      x: this.x + this.config.ghost.hitboxOffsetX,
      y: this.y + this.config.ghost.hitboxOffsetY,
      width: this.config.ghost.hitboxWidth,
      height: this.config.ghost.hitboxHeight
    };
  }
}

// ❌ BAD: Entity with rendering logic
class Ghost {
  render(ctx) {
    ctx.drawImage(this.sprite, this.x, this.y);
  }
}
```

### System Pattern

**Systems Process Entities**:
```javascript
// ✅ GOOD: System handles one concern
class PhysicsEngine {
  constructor(config) {
    this.gravity = config.physics.gravity;
    this.terminalVelocity = config.physics.terminalVelocity;
  }
  
  applyGravity(entity, deltaTime) {
    entity.velocity += this.gravity * deltaTime;
    entity.velocity = Math.min(entity.velocity, this.terminalVelocity);
  }
  
  updatePosition(entity, deltaTime) {
    entity.y += entity.velocity * deltaTime;
  }
}

// ❌ BAD: System with mixed concerns
class PhysicsEngine {
  update(entity, deltaTime) {
    // Physics
    entity.velocity += this.gravity * deltaTime;
    
    // Rendering (wrong!)
    ctx.drawImage(entity.sprite, entity.x, entity.y);
    
    // Audio (wrong!)
    this.audio.play('jump');
  }
}
```

### Game Loop Pattern

**Fixed Timestep with Delta Time**:
```javascript
// ✅ GOOD: Proper game loop
class Game {
  constructor(canvas) {
    this.lastFrameTime = 0;
    this.targetFPS = 120;
    this.maxDeltaTime = 2.0;
  }
  
  gameLoop(timestamp) {
    // Calculate delta time
    const deltaTime = (timestamp - this.lastFrameTime) / 1000;
    this.lastFrameTime = timestamp;
    
    // Clamp delta time to prevent large jumps
    const clampedDelta = Math.min(deltaTime, this.maxDeltaTime);
    
    // Update game state
    if (this.state.isPlaying()) {
      this.update(clampedDelta);
    }
    
    // Render frame
    this.render();
    
    // Request next frame
    requestAnimationFrame((t) => this.gameLoop(t));
  }
  
  update(deltaTime) {
    // Update physics
    this.physics.update(deltaTime);
    
    // Check collisions
    this.collision.check();
    
    // Update entities
    this.entities.forEach(e => e.update(deltaTime));
  }
}

// ❌ BAD: No delta time, frame-dependent
class Game {
  gameLoop() {
    this.ghost.y += 5; // Moves 5px per frame (FPS-dependent!)
    requestAnimationFrame(() => this.gameLoop());
  }
}
```

### State Machine Pattern

**Clear State Management**:
```javascript
// ✅ GOOD: State machine with clear transitions
const GameStates = {
  MENU: 'menu',
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAME_OVER: 'game_over'
};

class StateManager {
  constructor() {
    this.currentState = GameStates.MENU;
    this.previousState = null;
  }
  
  setState(newState) {
    if (this.currentState === newState) return;
    
    this.previousState = this.currentState;
    this.currentState = newState;
    
    this.onStateChange(newState);
  }
  
  onStateChange(newState) {
    switch (newState) {
      case GameStates.PLAYING:
        this.startGame();
        break;
      case GameStates.PAUSED:
        this.pauseGame();
        break;
      case GameStates.GAME_OVER:
        this.endGame();
        break;
    }
  }
  
  isPlaying() {
    return this.currentState === GameStates.PLAYING;
  }
}

// ❌ BAD: Boolean flags for states
class StateManager {
  constructor() {
    this.isMenu = true;
    this.isPlaying = false;
    this.isPaused = false;
    this.isGameOver = false;
  }
  
  // Can have multiple states true at once (bug!)
}
```

---

## Performance Optimization Guidelines

### Object Pooling

**Reuse Objects Instead of Creating New Ones**:
```javascript
// ✅ GOOD: Object pool for particles
class ParticlePool {
  constructor(size = 50) {
    this.pool = [];
    this.active = [];
    
    // Pre-allocate particles
    for (let i = 0; i < size; i++) {
      this.pool.push(new Particle());
    }
  }
  
  spawn(x, y) {
    let particle;
    
    if (this.pool.length > 0) {
      // Reuse from pool
      particle = this.pool.pop();
      particle.reset(x, y);
    } else {
      // Create new if pool empty
      particle = new Particle(x, y);
    }
    
    this.active.push(particle);
    return particle;
  }
  
  update(deltaTime) {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const particle = this.active[i];
      particle.update(deltaTime);
      
      if (particle.isDead()) {
        // Return to pool
        this.active.splice(i, 1);
        this.pool.push(particle);
      }
    }
  }
}

// ❌ BAD: Create new objects every frame
class ParticleSystem {
  update() {
    // Creates garbage every frame!
    this.particles.push(new Particle(x, y));
    
    this.particles = this.particles.filter(p => !p.isDead());
  }
}
```

### Avoid Allocations in Hot Paths

**Reuse Objects, Avoid Creating New Ones**:
```javascript
// ✅ GOOD: Reuse hitbox object
class Ghost {
  constructor() {
    this._hitboxCache = { x: 0, y: 0, width: 0, height: 0 };
  }
  
  getHitbox() {
    // Update cached object
    this._hitboxCache.x = this.x + this.hitboxOffsetX;
    this._hitboxCache.y = this.y + this.hitboxOffsetY;
    this._hitboxCache.width = this.hitboxWidth;
    this._hitboxCache.height = this.hitboxHeight;
    
    return this._hitboxCache;
  }
}

// ❌ BAD: Create new object every call
class Ghost {
  getHitbox() {
    // Creates garbage every frame!
    return {
      x: this.x + this.hitboxOffsetX,
      y: this.y + this.hitboxOffsetY,
      width: this.hitboxWidth,
      height: this.hitboxHeight
    };
  }
}
```

### Batch Rendering

**Minimize State Changes**:
```javascript
// ✅ GOOD: Batch similar rendering operations
class Renderer {
  renderPipes(pipes) {
    // Set style once
    this.ctx.fillStyle = '#00AA00';
    
    // Draw all pipes with same style
    for (const pipe of pipes) {
      this.ctx.fillRect(pipe.x, 0, pipe.width, pipe.topHeight);
      this.ctx.fillRect(pipe.x, pipe.bottomY, pipe.width, pipe.bottomHeight);
    }
    
    // Set cap style once
    this.ctx.fillStyle = '#00CC00';
    
    // Draw all caps
    for (const pipe of pipes) {
      this.ctx.fillRect(pipe.x - 2, pipe.topHeight - 20, pipe.width + 4, 20);
      this.ctx.fillRect(pipe.x - 2, pipe.bottomY, pipe.width + 4, 20);
    }
  }
}

// ❌ BAD: Change state for each pipe
class Renderer {
  renderPipes(pipes) {
    for (const pipe of pipes) {
      // State change per pipe (slow!)
      this.ctx.fillStyle = '#00AA00';
      this.ctx.fillRect(pipe.x, 0, pipe.width, pipe.topHeight);
      
      this.ctx.fillStyle = '#00CC00';
      this.ctx.fillRect(pipe.x - 2, pipe.topHeight - 20, pipe.width + 4, 20);
    }
  }
}
```

### Spatial Partitioning

**Only Check Nearby Objects**:
```javascript
// ✅ GOOD: Only check nearby pipes
class CollisionSystem {
  checkNearbyCollisions(ghost, pipes) {
    const ghostX = ghost.x;
    const collisionRange = 100;
    
    for (const pipe of pipes) {
      // Skip pipes too far away
      if (pipe.x + pipe.width < ghostX - collisionRange || 
          pipe.x > ghostX + collisionRange) {
        continue;
      }
      
      // Only check nearby pipes
      if (this.checkGhostPipeCollision(ghost, pipe)) {
        return true;
      }
    }
    
    return false;
  }
}

// ❌ BAD: Check all pipes every frame
class CollisionSystem {
  checkCollisions(ghost, pipes) {
    for (const pipe of pipes) {
      // Checks pipes off-screen (wasteful!)
      if (this.checkGhostPipeCollision(ghost, pipe)) {
        return true;
      }
    }
  }
}
```

### Cache Calculations

**Don't Recalculate Unchanged Values**:
```javascript
// ✅ GOOD: Cache expensive calculations
class Pipe {
  constructor(x, gapY, gapSize, canvasHeight) {
    this.x = x;
    this.gapY = gapY;
    this.gapSize = gapSize;
    
    // Calculate once, cache results
    this.topHeight = gapY - (gapSize / 2);
    this.bottomY = gapY + (gapSize / 2);
    this.bottomHeight = canvasHeight - this.bottomY;
    
    // Cache hitboxes
    this._topHitbox = {
      x: this.x,
      y: 0,
      width: this.width,
      height: this.topHeight
    };
  }
  
  update(deltaTime, speed) {
    this.x -= speed * deltaTime;
    
    // Update cached hitbox
    this._topHitbox.x = this.x;
  }
  
  getTopHitbox() {
    return this._topHitbox;
  }
}

// ❌ BAD: Recalculate every time
class Pipe {
  getTopHitbox() {
    // Recalculates every frame (wasteful!)
    return {
      x: this.x,
      y: 0,
      width: this.width,
      height: this.gapY - (this.gapSize / 2)
    };
  }
}
```

---

## Code Organization

### File Structure

**Organize by Feature/Type**:
```
js/
├── main.js              # Entry point
├── game.js              # Core game class
├── config.js            # Configuration
├── entities/
│   ├── ghost.js         # Ghost entity
│   ├── pipe.js          # Pipe entity
│   └── particle.js      # Particle effects
├── systems/
│   ├── physics.js       # Physics system
│   ├── collision.js     # Collision detection
│   ├── renderer.js      # Rendering system
│   └── audio.js         # Audio management
├── state.js             # State management
├── input.js             # Input handling
└── storage.js           # LocalStorage wrapper
```

### Class Structure

**Consistent Class Organization**:
```javascript
// ✅ GOOD: Organized class structure
class Ghost {
  // 1. Constructor
  constructor(x, y, config) {
    // Public properties
    this.x = x;
    this.y = y;
    this.velocity = 0;
    
    // Private properties
    this._config = config;
    this._hitboxCache = {};
  }
  
  // 2. Public methods (alphabetical)
  getHitbox() { }
  
  jump(velocity) { }
  
  reset(x, y) { }
  
  update(deltaTime) { }
  
  // 3. Private methods (alphabetical)
  _calculateRotation() { }
  
  _updatePhysics(deltaTime) { }
}
```

---

## Error Handling

### Defensive Programming

**Handle Errors Gracefully**:
```javascript
// ✅ GOOD: Defensive error handling
class AudioManager {
  playSound(name) {
    if (this.muted) return;
    
    if (!this.sounds[name]) {
      console.warn(`Sound not found: ${name}`);
      return;
    }
    
    try {
      const sound = this.sounds[name].cloneNode();
      sound.volume = this.volume;
      sound.play().catch(err => {
        console.warn('Audio playback failed:', err);
      });
    } catch (err) {
      console.error('Error playing sound:', err);
    }
  }
}

// ❌ BAD: No error handling
class AudioManager {
  playSound(name) {
    // Crashes if sound doesn't exist!
    this.sounds[name].play();
  }
}
```

### Null Checks

**Check for Null/Undefined**:
```javascript
// ✅ GOOD: Check before using
class Game {
  update(deltaTime) {
    if (!this.entities.ghost) {
      console.warn('Ghost not initialized');
      return;
    }
    
    this.entities.ghost.update(deltaTime);
  }
}

// ❌ BAD: Assume it exists
class Game {
  update(deltaTime) {
    // Crashes if ghost is null!
    this.entities.ghost.update(deltaTime);
  }
}
```

---

## Comments and Documentation

### JSDoc Comments

**Document Public APIs**:
```javascript
// ✅ GOOD: JSDoc for public methods
/**
 * Check collision between ghost and pipe using circle-rectangle intersection
 * @param {Ghost} ghost - The ghost entity
 * @param {Pipe} pipe - The pipe entity
 * @returns {{collided: boolean, type: string}} Collision result
 */
checkGhostPipeCollision(ghost, pipe) {
  const ghostCircle = this.getGhostCircle(ghost);
  const topPipeHitbox = pipe.getTopHitbox();
  
  if (this.checkCircleRectIntersection(ghostCircle, topPipeHitbox)) {
    return { collided: true, type: 'pipe_top' };
  }
  
  return { collided: false };
}
```

### Inline Comments

**Explain Why, Not What**:
```javascript
// ✅ GOOD: Explain reasoning
// Clamp delta time to prevent physics explosions when tab is inactive
const clampedDelta = Math.min(deltaTime, this.maxDeltaTime);

// Use circular collision for more forgiving gameplay
const ghostCircle = this.getGhostCircle(ghost);

// ❌ BAD: State the obvious
// Set velocity to jump velocity
this.velocity = jumpVelocity;

// Add gravity to velocity
this.velocity += gravity;
```

### TODO Comments

**Mark Future Work**:
```javascript
// ✅ GOOD: Clear TODO with context
// TODO: Implement sprite sheet animation (currently using single sprite)
// TODO: Add background music support (audio system ready)
// TODO: Optimize particle system with WebGL (if FPS drops below 60)

// ❌ BAD: Vague TODO
// TODO: Fix this
// TODO: Make better
```

---

## Testing Guidelines

### Unit Tests

**Test Pure Functions**:
```javascript
// ✅ GOOD: Testable pure function
function calculateDistance(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

// Test
describe('calculateDistance', () => {
  it('should calculate distance between two points', () => {
    expect(calculateDistance(0, 0, 3, 4)).toBe(5);
  });
});
```

### Property-Based Tests

**Test Universal Properties**:
```javascript
// ✅ GOOD: Property test for physics
describe('Physics', () => {
  it('velocity should never exceed terminal velocity', () => {
    const ghost = new Ghost(100, 300, config);
    const physics = new PhysicsEngine(config);
    
    // Apply gravity many times
    for (let i = 0; i < 1000; i++) {
      physics.applyGravity(ghost, 0.016);
    }
    
    // Velocity should be clamped
    expect(ghost.velocity).toBeLessThanOrEqual(config.physics.terminalVelocity);
  });
});
```

---

## Common Pitfalls to Avoid

### 1. Frame-Rate Dependent Logic

```javascript
// ❌ BAD: Movement depends on frame rate
update() {
  this.x += 5; // Moves 5px per frame (varies with FPS!)
}

// ✅ GOOD: Use delta time
update(deltaTime) {
  this.x += this.speed * deltaTime; // Consistent across frame rates
}
```

### 2. Memory Leaks

```javascript
// ❌ BAD: Event listeners not removed
class Game {
  init() {
    window.addEventListener('keydown', this.handleKeyDown);
  }
  // Never removes listener!
}

// ✅ GOOD: Clean up listeners
class Game {
  init() {
    this.handleKeyDown = this.handleKeyDown.bind(this);
    window.addEventListener('keydown', this.handleKeyDown);
  }
  
  cleanup() {
    window.removeEventListener('keydown', this.handleKeyDown);
  }
}
```

### 3. Mutating Config

```javascript
// ❌ BAD: Mutating shared config
class PhysicsEngine {
  increaseDifficulty() {
    GameConfig.pipes.baseSpeed += 10; // Mutates global config!
  }
}

// ✅ GOOD: Use instance properties
class PhysicsEngine {
  constructor(config) {
    this.basePipeSpeed = config.pipes.baseSpeed;
    this.pipeSpeed = this.basePipeSpeed;
  }
  
  increaseDifficulty() {
    this.pipeSpeed += 10; // Only affects this instance
  }
}
```

### 4. Magic Numbers

```javascript
// ❌ BAD: Magic numbers everywhere
if (score > 5) {
  speed += 0.2;
}

// ✅ GOOD: Use named constants
const SPEED_INCREASE_THRESHOLD = 5;
const SPEED_INCREMENT = 0.2;

if (score > SPEED_INCREASE_THRESHOLD) {
  speed += SPEED_INCREMENT;
}
```

---

## Performance Checklist

Before committing code, verify:

- [ ] No object allocations in game loop (use object pooling)
- [ ] Delta time used for all movement/physics
- [ ] Rendering batched by material/style
- [ ] Collision checks use spatial partitioning
- [ ] Expensive calculations cached
- [ ] Event listeners properly cleaned up
- [ ] No console.log in production code
- [ ] Frame rate consistently above 100 FPS

---

## Code Review Checklist

Before submitting code:

- [ ] Follows naming conventions (PascalCase, camelCase, UPPER_SNAKE_CASE)
- [ ] No magic numbers (use config or constants)
- [ ] Error handling for all external operations (audio, storage)
- [ ] JSDoc comments for public APIs
- [ ] Unit tests for pure functions
- [ ] Property tests for game logic
- [ ] No frame-rate dependent logic
- [ ] No memory leaks (listeners cleaned up)
- [ ] Performance optimizations applied

---

## References

- **Design Document**: `.kiro/specs/flappy-kiro/design.md`
- **Tasks**: `.kiro/specs/flappy-kiro/tasks.md`
- **Config**: `kiro-introduction-starter-kit/game-config.json`
- **MDN JavaScript Guide**: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide
- **Game Programming Patterns**: https://gameprogrammingpatterns.com/
