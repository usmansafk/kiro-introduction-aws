/**
 * Game class - Core game loop and coordination
 * Manages the main game loop, subsystems, and entity lifecycle
 */

import GameConfig from './config.js';
import StateManager, { GameStates } from './state.js';
import PhysicsEngine from './systems/physics.js';
import CollisionSystem from './systems/collision.js';
import Renderer from './systems/renderer.js';
import AudioManager from './systems/audio.js';
import InputHandler from './input.js';
import StorageManager from './storage.js';
import Ghost from './entities/ghost.js';
import Pipe from './entities/pipe.js';

class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.config = GameConfig;
    
    // Subsystems will be initialized in init()
    this.state = null;
    this.physics = null;
    this.collision = null;
    this.renderer = null;
    this.audio = null;
    this.input = null;
    this.storage = null;
    
    // Game entities
    this.entities = {
      ghost: null,
      pipes: [],
      particles: [],
      scoreIndicators: []
    };
    
    // Pipe generation tracking
    this.lastPipeX = 0;
    
    // Frame timing for delta time calculation
    this.lastFrameTime = 0;
    this.deltaTime = 0;
    
    // Game loop control
    this.isRunning = false;
    this.animationFrameId = null;
  }
  
  /**
   * Initialize the game
   * Load assets, set up event listeners, initialize state
   */
  async init() {
    try {
      console.log('Initializing Flappy Kiro...');
      
      // Validate canvas context
      if (!this.canvas || !this.ctx) {
        throw new Error('Canvas not supported in this browser');
      }
      
      if (typeof this.ctx.fillRect !== 'function') {
        throw new Error('Canvas 2D context not available');
      }
      
      // Initialize subsystems
      this.state = new StateManager(this.config);
      this.physics = new PhysicsEngine(this.config);
      this.collision = new CollisionSystem(this.config);
      this.renderer = new Renderer(this.ctx, this.config);
      this.audio = new AudioManager(this.config);
      this.input = new InputHandler(this.canvas);
      this.storage = new StorageManager(this.config);
      
      // Load assets (sprites, sounds)
      await this.loadAssets();
      
      // Initialize entities
      this.initializeEntities();
      
      // Set up input event listeners
      this.setupInputHandlers();
      
      // Load high score from storage
      this.state.highScore = this.storage.loadHighScore();
      
      console.log('Game initialized successfully');
      
      // Start the game loop
      this.start();
      
    } catch (error) {
      console.error('Failed to initialize game:', error);
      throw error;
    }
  }
  
  /**
   * Load game assets (sprites and sounds)
   */
  async loadAssets() {
    // Load ghost sprite
    const ghostSprite = new Image();
    await new Promise((resolve, reject) => {
      ghostSprite.onload = resolve;
      ghostSprite.onerror = () => {
        console.warn('Failed to load ghost sprite, using fallback');
        resolve(); // Continue even if sprite fails
      };
      ghostSprite.src = this.config.ghost.spritePath;
    });
    
    this.ghostSprite = ghostSprite;
    
    // Preload audio assets
    this.audio.preloadAssets();
  }
  
  /**
   * Initialize game entities
   */
  initializeEntities() {
    // Create ghost entity
    this.entities.ghost = new Ghost(
      this.config.ghost.x,
      this.config.ghost.y,
      this.ghostSprite,
      this.config
    );
    
    // Initialize empty arrays for other entities
    this.entities.pipes = [];
    this.entities.particles = [];
    this.entities.scoreIndicators = [];
    
    // Set initial pipe position for generation
    this.lastPipeX = this.canvas.width;
  }
  
  /**
   * Set up input event handlers
   */
  setupInputHandlers() {
    // Wire jump/start input to handleInput method
    this.input.onJump(() => this.handleInput());
    
    // Wire pause input to handlePauseInput method
    this.input.onPause(() => this.handlePauseInput());
  }
  
  /**
   * Start the game loop
   */
  start() {
    if (this.isRunning) {
      console.warn('Game loop already running');
      return;
    }
    
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    
    // Start the game loop
    this.animationFrameId = requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    
    console.log('Game loop started');
  }
  
  /**
   * Stop the game loop
   */
  stop() {
    if (!this.isRunning) {
      return;
    }
    
    this.isRunning = false;
    
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    console.log('Game loop stopped');
  }
  
  /**
   * Main game loop
   * Calculates delta time, updates game state, renders frame, requests next frame
   * 
   * @param {number} timestamp - High-resolution timestamp from requestAnimationFrame
   */
  gameLoop(timestamp) {
    if (!this.isRunning) {
      return;
    }
    
    // Calculate delta time in milliseconds
    const deltaTimeMs = timestamp - this.lastFrameTime;
    this.lastFrameTime = timestamp;
    
    // Normalize delta time to 120 FPS target (8.33ms per frame)
    // This makes physics calculations frame-rate independent
    this.deltaTime = deltaTimeMs / 8.33;
    
    // Clamp delta time to prevent large jumps (e.g., when tab is inactive)
    // Maximum of 2.0 means we won't simulate more than ~16.66ms of game time per frame
    this.deltaTime = Math.min(this.deltaTime, this.config.performance.maxDeltaTime);
    
    // Update game state
    this.update(this.deltaTime);
    
    // Render current frame
    this.render();
    
    // Request next frame
    this.animationFrameId = requestAnimationFrame((t) => this.gameLoop(t));
  }
  
  /**
   * Update game state based on delta time
   * 
   * @param {number} deltaTime - Normalized delta time (1.0 = one frame at 120 FPS)
   */
  update(deltaTime) {
    // Update based on game state
    if (this.state && this.state.isPlaying()) {
      this.updatePlaying(deltaTime);
    }
  }
  
  /**
   * Update game entities during playing state
   * 
   * @param {number} deltaTime - Normalized delta time
   */
  updatePlaying(deltaTime) {
    // Update invincibility frames
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
  
  /**
   * Update all pipes - move them, check scoring, remove off-screen
   * @param {number} deltaTime - Normalized delta time
   */
  updatePipes(deltaTime) {
    // Move all pipes
    for (const pipe of this.entities.pipes) {
      pipe.update(deltaTime, this.physics.pipeSpeed);
      
      // Check if ghost passed this pipe
      if (pipe.hasPassedGhost(this.entities.ghost.x)) {
        pipe.markScored();
        this.state.incrementScore();
        this.physics.increaseDifficulty(this.state.score);
        
        // Create score indicator
        this.entities.scoreIndicators.push({
          x: pipe.x + pipe.width / 2,
          y: pipe.gapY,
          value: 1,
          life: 1.0,
          decay: this.config.scoreIndicators.decay,
          vy: this.config.scoreIndicators.floatSpeed
        });
      }
    }
    
    // Remove off-screen pipes
    this.entities.pipes = this.entities.pipes.filter(pipe => !pipe.isOffScreen());
    
    // Update last pipe position for generation
    if (this.entities.pipes.length > 0) {
      this.lastPipeX = this.entities.pipes[this.entities.pipes.length - 1].x;
    }
  }
  
  /**
   * Generate new pipes at correct spacing
   */
  generatePipes() {
    const spawnX = this.canvas.width;
    
    // Check if we need a new pipe
    if (this.lastPipeX < spawnX - this.physics.pipeSpacing) {
      const gapY = this.physics.generateGapPosition();
      const newPipe = new Pipe(
        spawnX,
        gapY,
        this.physics.gapSize,
        this.canvas.height,
        this.config
      );
      this.entities.pipes.push(newPipe);
      this.lastPipeX = spawnX;
    }
  }
  
  /**
   * Update particles - generate new ones, update existing, remove dead
   * @param {number} deltaTime - Normalized delta time
   */
  updateParticles(deltaTime) {
    // Generate new particles (30% chance per frame)
    if (Math.random() < this.config.particles.spawnChance) {
      const particle = {
        x: this.entities.ghost.x,
        y: this.entities.ghost.y + this.entities.ghost.height / 2,
        vx: (Math.random() - 0.5) * this.config.particles.velocityRange,
        vy: (Math.random() - 0.5) * this.config.particles.velocityRange,
        life: 1.0,
        decay: this.config.particles.decay,
        size: Math.random() * (this.config.particles.maxSize - this.config.particles.minSize) + this.config.particles.minSize,
        color: `rgba(255, 255, 255, 1.0)`
      };
      this.entities.particles.push(particle);
    }
    
    // Update existing particles
    for (const particle of this.entities.particles) {
      particle.x += particle.vx * deltaTime;
      particle.y += particle.vy * deltaTime;
      particle.life -= particle.decay;
      particle.color = `rgba(255, 255, 255, ${particle.life})`;
    }
    
    // Remove dead particles
    this.entities.particles = this.entities.particles.filter(p => p.life > 0);
    
    // Enforce maximum particle count
    if (this.entities.particles.length > this.config.particles.maxActive) {
      this.entities.particles = this.entities.particles.slice(-this.config.particles.maxActive);
    }
  }
  
  /**
   * Update score indicators - float upward and fade
   * @param {number} deltaTime - Normalized delta time
   */
  updateScoreIndicators(deltaTime) {
    for (const indicator of this.entities.scoreIndicators) {
      indicator.y += indicator.vy * deltaTime;
      indicator.life -= indicator.decay;
    }
    
    // Remove dead indicators
    this.entities.scoreIndicators = this.entities.scoreIndicators.filter(i => i.life > 0);
  }
  
  /**
   * Check collisions and handle game over
   */
  checkCollisions() {
    const collision = this.collision.checkAllCollisions(
      this.entities.ghost,
      this.entities.pipes,
      this.canvas.height,
      this.state.isInvincible()
    );
    
    if (collision.collided) {
      this.handleGameOver();
    }
  }
  
  /**
   * Handle game over state
   */
  handleGameOver() {
    this.state.setState(GameStates.GAME_OVER);
    this.audio.playSound('gameOver');
    this.collision.triggerScreenShake();
    
    // Save high score if it's a new record
    if (this.state.score > this.state.highScore) {
      this.state.highScore = this.state.score;
      this.storage.saveHighScore(this.state.score);
    }
  }
  
  /**
   * Handle input based on current game state
   */
  handleInput() {
    const currentState = this.state.currentState;
    
    if (currentState === GameStates.MENU) {
      this.startGame();
    } else if (currentState === GameStates.PLAYING) {
      this.jump();
    } else if (currentState === GameStates.GAME_OVER) {
      this.restartGame();
    } else if (currentState === GameStates.PAUSED) {
      // Resume game
      this.state.setState(GameStates.PLAYING);
    }
  }
  
  /**
   * Handle pause input
   */
  handlePauseInput() {
    if (this.state.isPlaying()) {
      this.state.setState(GameStates.PAUSED);
    } else if (this.state.isPaused()) {
      this.state.setState(GameStates.PLAYING);
    }
  }
  
  /**
   * Start a new game
   */
  startGame() {
    this.state.setState(GameStates.PLAYING);
    this.state.resetScore();
    this.state.startInvincibility();
    this.resetEntities();
    this.physics.resetDifficulty();
  }
  
  /**
   * Make the ghost jump
   */
  jump() {
    this.entities.ghost.jump(this.physics.jumpVelocity);
    this.audio.playSound('jump');
  }
  
  /**
   * Restart the game after game over
   */
  restartGame() {
    this.startGame();
  }
  
  /**
   * Reset all entities for a new game
   */
  resetEntities() {
    // Reset ghost
    this.entities.ghost.reset(this.config.ghost.x, this.config.ghost.y);
    
    // Clear all pipes
    this.entities.pipes = [];
    
    // Clear particles and score indicators
    this.entities.particles = [];
    this.entities.scoreIndicators = [];
    
    // Reset pipe generation
    this.lastPipeX = this.canvas.width;
  }
  
  /**
   * Render current frame
   */
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
  
  /**
   * Render playing state with all entities
   */
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
  
  /**
   * Reset game for new session
   */
  reset() {
    // Clear all entities
    this.resetEntities();
    
    // Reset state
    this.state.setState(GameStates.MENU);
    this.state.resetScore();
    
    // Reset physics
    this.physics.resetDifficulty();
    
    // Load high score from storage
    this.state.highScore = this.storage.loadHighScore();
  }
  
  /**
   * Cleanup game resources
   */
  cleanup() {
    // Stop the game loop
    this.stop();
    
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Nullify references to prevent memory leaks
    this.entities.ghost = null;
    this.entities.pipes = [];
    this.entities.particles = [];
    this.entities.scoreIndicators = [];
    
    console.log('Game cleaned up');
  }
}

export default Game;
