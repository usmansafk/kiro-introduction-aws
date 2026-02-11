---
inclusion: auto
---

# Game Architecture Patterns for Flappy Kiro

## Overview

This document defines architectural patterns for building modular, maintainable game systems with clear separation of concerns, event-driven communication, and robust state management.

## Core Architecture Principles

1. **Separation of Concerns**: Each system has a single, well-defined responsibility
2. **Loose Coupling**: Systems communicate through events, not direct references
3. **High Cohesion**: Related functionality grouped together
4. **Dependency Injection**: Pass dependencies through constructors
5. **Composition over Inheritance**: Favor composition for flexibility

---

## Modular System Design

### System Interface Pattern

**Define Clear System Contracts**:
```javascript
// ✅ GOOD: System with clear interface
class PhysicsEngine {
  constructor(config) {
    this.config = config;
    this.gravity = config.physics.gravity;
    this.terminalVelocity = config.physics.terminalVelocity;
  }
  
  // Public API
  applyGravity(entity, deltaTime) {
    entity.velocity += this.gravity * deltaTime;
    entity.velocity = Math.min(entity.velocity, this.terminalVelocity);
  }
  
  updatePosition(entity, deltaTime) {
    entity.y += entity.velocity * deltaTime;
  }
  
  reset() {
    // Reset system state
  }
}

// ❌ BAD: System with unclear responsibilities
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

### System Lifecycle

**Initialize, Update, Cleanup Pattern**:
```javascript
// ✅ GOOD: Complete system lifecycle
class AudioManager {
  constructor(config) {
    this.config = config;
    this.sounds = {};
    this.muted = false;
    this.initialized = false;
  }
  
  // Initialize system
  async init() {
    if (this.initialized) return;
    
    try {
      await this.preloadAssets();
      this.initialized = true;
      console.log('AudioManager initialized');
    } catch (err) {
      console.error('AudioManager init failed:', err);
    }
  }
  
  // Update system (if needed)
  update(deltaTime) {
    // Update playing sounds, fade effects, etc.
  }
  
  // Cleanup system
  cleanup() {
    // Stop all sounds
    Object.values(this.sounds).forEach(sound => {
      sound.pause();
      sound.currentTime = 0;
    });
    
    this.sounds = {};
    this.initialized = false;
    console.log('AudioManager cleaned up');
  }
}
```

### Dependency Injection

**Pass Dependencies, Don't Create Them**:
```javascript
// ✅ GOOD: Dependencies injected
class Game {
  constructor(canvas, config) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.config = config;
    
    // Inject dependencies
    this.state = new StateManager(config);
    this.physics = new PhysicsEngine(config);
    this.collision = new CollisionSystem(config);
    this.renderer = new Renderer(this.ctx, config);
    this.audio = new AudioManager(config);
    this.input = new InputHandler(canvas);
    this.storage = new StorageManager(config);
  }
}

// ❌ BAD: Systems create their own dependencies
class PhysicsEngine {
  constructor() {
    this.config = GameConfig; // Global dependency!
    this.audio = new AudioManager(); // Creates dependency!
  }
}
```

### System Communication

**Systems Don't Call Each Other Directly**:
```javascript
// ✅ GOOD: Game coordinates systems
class Game {
  update(deltaTime) {
    if (!this.state.isPlaying()) return;
    
    // Update physics
    this.physics.applyGravity(this.entities.ghost, deltaTime);
    this.physics.updatePosition(this.entities.ghost, deltaTime);
    
    // Check collisions
    const collision = this.collision.checkAllCollisions(
      this.entities.ghost,
      this.entities.pipes,
      this.canvas.height,
      this.state.isInvincible()
    );
    
    // Handle collision result
    if (collision.collided) {
      this.handleCollision(collision);
    }
  }
  
  handleCollision(collision) {
    // Coordinate systems
    this.collision.triggerScreenShake(10, 30);
    this.audio.playSound('gameOver');
    this.state.setState(GameStates.GAME_OVER);
  }
}

// ❌ BAD: Systems call each other
class CollisionSystem {
  checkCollision(ghost, pipe) {
    if (this.detectCollision(ghost, pipe)) {
      // Directly calls other systems (tight coupling!)
      this.audio.playSound('gameOver');
      this.state.setState(GameStates.GAME_OVER);
    }
  }
}
```

---

## Event Handling Patterns

### Event Emitter Pattern

**Decouple Systems with Events**:
```javascript
// ✅ GOOD: Event emitter for loose coupling
class EventEmitter {
  constructor() {
    this.events = {};
  }
  
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }
  
  off(event, callback) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(cb => cb !== callback);
  }
  
  emit(event, data) {
    if (!this.events[event]) return;
    this.events[event].forEach(callback => callback(data));
  }
  
  once(event, callback) {
    const wrapper = (data) => {
      callback(data);
      this.off(event, wrapper);
    };
    this.on(event, wrapper);
  }
}

// Usage in Game
class Game extends EventEmitter {
  constructor(canvas, config) {
    super();
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    // Systems listen for events
    this.on('collision', (data) => {
      this.audio.playSound('gameOver');
      this.collision.triggerScreenShake(10, 30);
    });
    
    this.on('score', (data) => {
      this.audio.playSound('score');
      this.state.incrementScore();
    });
    
    this.on('stateChange', (data) => {
      console.log(`State changed: ${data.from} → ${data.to}`);
    });
  }
  
  handleCollision(collision) {
    // Emit event instead of calling systems directly
    this.emit('collision', { type: collision.type });
    this.state.setState(GameStates.GAME_OVER);
  }
}
```

### Input Event Handling

**Centralized Input Management**:
```javascript
// ✅ GOOD: Input handler with callbacks
class InputHandler {
  constructor(canvas) {
    this.canvas = canvas;
    this.callbacks = {
      jump: [],
      pause: [],
      start: []
    };
    
    this.setupListeners();
  }
  
  setupListeners() {
    // Keyboard
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    
    // Mouse
    this.canvas.addEventListener('click', (e) => this.handleClick(e));
    
    // Touch
    this.canvas.addEventListener('touchstart', (e) => this.handleTouch(e));
  }
  
  handleKeyDown(e) {
    switch (e.key) {
      case ' ':
      case 'Spacebar':
        e.preventDefault();
        this.trigger('jump');
        break;
      case 'Escape':
        e.preventDefault();
        this.trigger('pause');
        break;
    }
  }
  
  handleClick(e) {
    this.trigger('jump');
  }
  
  handleTouch(e) {
    e.preventDefault();
    this.trigger('jump');
  }
  
  // Register callbacks
  onJump(callback) {
    this.callbacks.jump.push(callback);
  }
  
  onPause(callback) {
    this.callbacks.pause.push(callback);
  }
  
  // Trigger callbacks
  trigger(action) {
    if (this.callbacks[action]) {
      this.callbacks[action].forEach(cb => cb());
    }
  }
  
  // Cleanup
  cleanup() {
    window.removeEventListener('keydown', this.handleKeyDown);
    this.canvas.removeEventListener('click', this.handleClick);
    this.canvas.removeEventListener('touchstart', this.handleTouch);
  }
}

// Usage
class Game {
  init() {
    this.input.onJump(() => this.handleJump());
    this.input.onPause(() => this.handlePause());
  }
  
  handleJump() {
    if (this.state.isMenu()) {
      this.startGame();
    } else if (this.state.isPlaying()) {
      this.entities.ghost.jump(this.config.physics.jumpVelocity);
      this.audio.playSound('jump');
    } else if (this.state.isGameOver()) {
      this.restartGame();
    }
  }
}
```

### Custom Game Events

**Domain-Specific Events**:
```javascript
// ✅ GOOD: Game-specific event system
class GameEvents {
  static COLLISION = 'collision';
  static SCORE = 'score';
  static STATE_CHANGE = 'stateChange';
  static PIPE_PASSED = 'pipePassed';
  static GAME_START = 'gameStart';
  static GAME_OVER = 'gameOver';
  static PAUSE = 'pause';
  static RESUME = 'resume';
}

class Game extends EventEmitter {
  handlePipePass(pipe) {
    this.emit(GameEvents.PIPE_PASSED, { pipe });
    this.emit(GameEvents.SCORE, { score: this.state.score + 1 });
  }
  
  startGame() {
    this.emit(GameEvents.GAME_START);
    this.state.setState(GameStates.PLAYING);
  }
}
```

---

## State Management

### State Machine Pattern

**Explicit State Transitions**:
```javascript
// ✅ GOOD: State machine with clear transitions
const GameStates = {
  MENU: 'menu',
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAME_OVER: 'game_over'
};

class StateManager {
  constructor(config) {
    this.config = config;
    this.currentState = GameStates.MENU;
    this.previousState = null;
    this.score = 0;
    this.highScore = 0;
    this.invincibilityFrames = 0;
    
    // Define valid transitions
    this.transitions = {
      [GameStates.MENU]: [GameStates.PLAYING],
      [GameStates.PLAYING]: [GameStates.PAUSED, GameStates.GAME_OVER],
      [GameStates.PAUSED]: [GameStates.PLAYING, GameStates.MENU],
      [GameStates.GAME_OVER]: [GameStates.PLAYING, GameStates.MENU]
    };
  }
  
  setState(newState) {
    // Validate transition
    if (!this.canTransitionTo(newState)) {
      console.warn(`Invalid transition: ${this.currentState} → ${newState}`);
      return false;
    }
    
    // Store previous state
    this.previousState = this.currentState;
    this.currentState = newState;
    
    // Trigger state change callback
    this.onStateChange(newState, this.previousState);
    
    return true;
  }
  
  canTransitionTo(newState) {
    const validTransitions = this.transitions[this.currentState];
    return validTransitions && validTransitions.includes(newState);
  }
  
  onStateChange(newState, oldState) {
    console.log(`State: ${oldState} → ${newState}`);
    
    // State-specific logic
    switch (newState) {
      case GameStates.PLAYING:
        this.onEnterPlaying();
        break;
      case GameStates.PAUSED:
        this.onEnterPaused();
        break;
      case GameStates.GAME_OVER:
        this.onEnterGameOver();
        break;
    }
  }
  
  onEnterPlaying() {
    this.startInvincibility();
  }
  
  onEnterPaused() {
    // Pause logic
  }
  
  onEnterGameOver() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
    }
  }
  
  // State queries
  isMenu() { return this.currentState === GameStates.MENU; }
  isPlaying() { return this.currentState === GameStates.PLAYING; }
  isPaused() { return this.currentState === GameStates.PAUSED; }
  isGameOver() { return this.currentState === GameStates.GAME_OVER; }
}
```

### State Context Pattern

**Encapsulate State-Specific Behavior**:
```javascript
// ✅ ADVANCED: State pattern with context
class GameState {
  constructor(game) {
    this.game = game;
  }
  
  enter() {}
  exit() {}
  update(deltaTime) {}
  render() {}
  handleInput(input) {}
}

class MenuState extends GameState {
  enter() {
    console.log('Entering menu state');
    this.game.renderer.renderMenu(this.game.state.highScore);
  }
  
  handleInput(input) {
    if (input === 'jump') {
      this.game.changeState(new PlayingState(this.game));
    }
  }
  
  render() {
    this.game.renderer.renderMenu(this.game.state.highScore);
  }
}

class PlayingState extends GameState {
  enter() {
    console.log('Entering playing state');
    this.game.state.startInvincibility();
    this.game.resetEntities();
  }
  
  update(deltaTime) {
    // Update physics
    this.game.physics.update(deltaTime);
    
    // Check collisions
    this.game.checkCollisions();
    
    // Update entities
    this.game.updateEntities(deltaTime);
  }
  
  handleInput(input) {
    if (input === 'jump') {
      this.game.entities.ghost.jump(this.game.config.physics.jumpVelocity);
      this.game.audio.playSound('jump');
    } else if (input === 'pause') {
      this.game.changeState(new PausedState(this.game));
    }
  }
  
  render() {
    this.game.renderer.renderGame(this.game.entities, this.game.state);
  }
}

class PausedState extends GameState {
  enter() {
    console.log('Entering paused state');
  }
  
  handleInput(input) {
    if (input === 'pause' || input === 'jump') {
      this.game.changeState(new PlayingState(this.game));
    }
  }
  
  render() {
    // Render game in background
    this.game.renderer.renderGame(this.game.entities, this.game.state);
    // Render pause overlay
    this.game.renderer.renderPauseOverlay();
  }
}

class GameOverState extends GameState {
  enter() {
    console.log('Entering game over state');
    this.game.state.saveHighScore();
  }
  
  handleInput(input) {
    if (input === 'jump') {
      this.game.changeState(new PlayingState(this.game));
    }
  }
  
  render() {
    this.game.renderer.renderGameOver(
      this.game.state.score,
      this.game.state.highScore
    );
  }
}

// Game with state pattern
class Game {
  constructor(canvas, config) {
    this.canvas = canvas;
    this.config = config;
    this.currentState = new MenuState(this);
  }
  
  changeState(newState) {
    if (this.currentState) {
      this.currentState.exit();
    }
    this.currentState = newState;
    this.currentState.enter();
  }
  
  update(deltaTime) {
    this.currentState.update(deltaTime);
  }
  
  render() {
    this.currentState.render();
  }
  
  handleInput(input) {
    this.currentState.handleInput(input);
  }
}
```

### Persistent State

**Save and Load Game State**:
```javascript
// ✅ GOOD: Storage manager for persistence
class StorageManager {
  constructor(config) {
    this.config = config;
    this.storageKey = config.storage.highScoreKey;
    this.available = this.checkAvailability();
  }
  
  checkAvailability() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      console.warn('LocalStorage not available');
      return false;
    }
  }
  
  loadHighScore() {
    if (!this.available) return 0;
    
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? parseInt(stored, 10) : 0;
    } catch (err) {
      console.error('Error loading high score:', err);
      return 0;
    }
  }
  
  saveHighScore(score) {
    if (!this.available) return false;
    
    try {
      localStorage.setItem(this.storageKey, score.toString());
      return true;
    } catch (err) {
      console.error('Error saving high score:', err);
      return false;
    }
  }
  
  clearHighScore() {
    if (!this.available) return;
    
    try {
      localStorage.removeItem(this.storageKey);
    } catch (err) {
      console.error('Error clearing high score:', err);
    }
  }
}
```

---

## Entity Management

### Entity Registry Pattern

**Centralized Entity Management**:
```javascript
// ✅ GOOD: Entity manager
class EntityManager {
  constructor() {
    this.entities = {
      ghost: null,
      pipes: [],
      particles: [],
      scoreIndicators: []
    };
  }
  
  setGhost(ghost) {
    this.entities.ghost = ghost;
  }
  
  addPipe(pipe) {
    this.entities.pipes.push(pipe);
  }
  
  removePipe(pipe) {
    const index = this.entities.pipes.indexOf(pipe);
    if (index > -1) {
      this.entities.pipes.splice(index, 1);
    }
  }
  
  addParticle(particle) {
    this.entities.particles.push(particle);
  }
  
  updateAll(deltaTime) {
    // Update ghost
    if (this.entities.ghost) {
      this.entities.ghost.update(deltaTime);
    }
    
    // Update pipes
    for (const pipe of this.entities.pipes) {
      pipe.update(deltaTime);
    }
    
    // Update particles
    for (let i = this.entities.particles.length - 1; i >= 0; i--) {
      const particle = this.entities.particles[i];
      particle.update(deltaTime);
      
      if (particle.isDead()) {
        this.entities.particles.splice(i, 1);
      }
    }
  }
  
  clearAll() {
    this.entities.ghost = null;
    this.entities.pipes = [];
    this.entities.particles = [];
    this.entities.scoreIndicators = [];
  }
  
  getAll() {
    return this.entities;
  }
}
```

### Entity Factory Pattern

**Create Entities Consistently**:
```javascript
// ✅ GOOD: Entity factory
class EntityFactory {
  constructor(config) {
    this.config = config;
    this.ghostSprite = null;
  }
  
  async init() {
    // Load assets
    this.ghostSprite = await this.loadImage(this.config.ghost.spritePath);
  }
  
  createGhost() {
    return new Ghost(
      this.config.ghost.x,
      this.config.ghost.y,
      this.ghostSprite,
      this.config
    );
  }
  
  createPipe(x, gapY) {
    return new Pipe(
      x,
      gapY,
      this.config.pipes.gapSize,
      this.config.canvas.height,
      this.config
    );
  }
  
  createParticle(x, y) {
    return new Particle(x, y);
  }
  
  createScoreIndicator(x, y, value) {
    return new ScoreIndicator(x, y, value);
  }
  
  loadImage(path) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load: ${path}`));
      img.src = path;
    });
  }
}
```

---

## Game Initialization Pattern

### Proper Startup Sequence**:
```javascript
// ✅ GOOD: Complete initialization
class Game {
  constructor(canvas, config) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.config = config;
    this.isRunning = false;
    
    // Create systems
    this.state = new StateManager(config);
    this.physics = new PhysicsEngine(config);
    this.collision = new CollisionSystem(config);
    this.renderer = new Renderer(this.ctx, config);
    this.audio = new AudioManager(config);
    this.input = new InputHandler(canvas);
    this.storage = new StorageManager(config);
    this.entityManager = new EntityManager();
    this.entityFactory = new EntityFactory(config);
  }
  
  async init() {
    console.log('Initializing game...');
    
    try {
      // Load assets
      await this.entityFactory.init();
      await this.audio.init();
      
      // Load saved data
      this.state.highScore = this.storage.loadHighScore();
      
      // Setup input handlers
      this.setupInputHandlers();
      
      // Create initial entities
      this.createInitialEntities();
      
      console.log('Game initialized successfully');
      return true;
    } catch (err) {
      console.error('Game initialization failed:', err);
      return false;
    }
  }
  
  setupInputHandlers() {
    this.input.onJump(() => this.handleJump());
    this.input.onPause(() => this.handlePause());
  }
  
  createInitialEntities() {
    const ghost = this.entityFactory.createGhost();
    this.entityManager.setGhost(ghost);
  }
  
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.gameLoop(this.lastFrameTime);
  }
  
  stop() {
    this.isRunning = false;
  }
  
  cleanup() {
    this.stop();
    this.input.cleanup();
    this.audio.cleanup();
    this.entityManager.clearAll();
  }
}

// Usage
async function main() {
  const canvas = document.getElementById('game');
  const game = new Game(canvas, GameConfig);
  
  const initialized = await game.init();
  
  if (initialized) {
    game.start();
  } else {
    console.error('Failed to start game');
  }
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}
```

---

## Architecture Best Practices

### Single Responsibility Principle

Each system should have one reason to change:
- **PhysicsEngine**: Handles physics calculations only
- **CollisionSystem**: Handles collision detection only
- **Renderer**: Handles rendering only
- **AudioManager**: Handles audio playback only
- **StateManager**: Handles game state only

### Dependency Inversion

Depend on abstractions, not concretions:
- Systems receive config, not global variables
- Systems receive dependencies via constructor
- Systems don't create their own dependencies

### Open/Closed Principle

Open for extension, closed for modification:
- Use events to extend behavior
- Use composition to add features
- Use configuration to change behavior

### Interface Segregation

Systems expose only what they need:
- Public methods are minimal and clear
- Private methods are prefixed with underscore
- Internal state is not exposed

---

## Testing Architecture

### Testable Systems

**Design for Testability**:
```javascript
// ✅ GOOD: Pure functions are testable
class PhysicsEngine {
  calculateVelocity(currentVelocity, gravity, deltaTime, terminalVelocity) {
    let newVelocity = currentVelocity + gravity * deltaTime;
    return Math.min(newVelocity, terminalVelocity);
  }
  
  applyGravity(entity, deltaTime) {
    entity.velocity = this.calculateVelocity(
      entity.velocity,
      this.gravity,
      deltaTime,
      this.terminalVelocity
    );
  }
}

// Test
describe('PhysicsEngine', () => {
  it('should clamp velocity to terminal velocity', () => {
    const physics = new PhysicsEngine(config);
    const velocity = physics.calculateVelocity(1000, 800, 0.016, 600);
    expect(velocity).toBe(600);
  });
});
```

### Mock Systems for Testing

**Use Dependency Injection for Mocking**:
```javascript
// ✅ GOOD: Mockable dependencies
class Game {
  constructor(canvas, config, systems = {}) {
    this.canvas = canvas;
    this.config = config;
    
    // Allow injecting mock systems
    this.audio = systems.audio || new AudioManager(config);
    this.storage = systems.storage || new StorageManager(config);
  }
}

// Test with mocks
describe('Game', () => {
  it('should play sound on collision', () => {
    const mockAudio = {
      playSound: jest.fn()
    };
    
    const game = new Game(canvas, config, { audio: mockAudio });
    game.handleCollision({ type: 'pipe' });
    
    expect(mockAudio.playSound).toHaveBeenCalledWith('gameOver');
  });
});
```

---

## Architecture Checklist

Before implementing a new system:

- [ ] System has single, clear responsibility
- [ ] System receives dependencies via constructor
- [ ] System has init(), update(), cleanup() methods
- [ ] System exposes minimal public API
- [ ] System communicates via events, not direct calls
- [ ] System is testable (pure functions, dependency injection)
- [ ] System handles errors gracefully
- [ ] System logs important events

---

## References

- **Design Document**: `.kiro/specs/flappy-kiro/design.md`
- **Coding Standards**: `.kiro/steering/game-coding-standards.md`
- **Canvas Patterns**: `.kiro/steering/canvas-and-collision-patterns.md`
- **Game Programming Patterns**: https://gameprogrammingpatterns.com/
