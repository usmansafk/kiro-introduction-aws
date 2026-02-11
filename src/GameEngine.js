/**
 * GameEngine Class
 * 
 * Central coordinator for Flappy Kiro game loop and subsystems.
 * Orchestrates physics, collision detection, rendering, audio, and state management.
 * 
 * Architecture:
 * - Main game loop (Update → Physics → Collision → Render → Audio)
 * - State machine (MENU, PLAYING, PAUSED, GAME_OVER)
 * - Entity management (Ghosty, pipes, particles)
 * - Frame-rate independent timing (target 120 FPS)
 * 
 * Design Principles:
 * - Separation of concerns (each system has single responsibility)
 * - Dependency injection (systems receive config, not globals)
 * - Event-driven communication (systems don't call each other directly)
 */

class GameEngine {
  /**
   * Create a new GameEngine instance
   * @param {HTMLCanvasElement} canvas - Canvas element for rendering
   * @param {Object} config - Game configuration object
   */
  constructor(canvas, config) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.config = config;
    
    // Game state
    this.state = 'menu'; // 'menu', 'playing', 'paused', 'game_over'
    this.score = 0;
    this.highScore = 0;
    this.invincibilityFrames = 0;
    this.timeScale = 1.0;
    
    // Timing
    this.lastFrameTime = 0;
    this.deltaTime = 0;
    this.frameCount = 0;
    this.isRunning = false;
    
    // Entities
    this.entities = {
      ghost: null,
      pipes: [],
      particles: [],
      scoreIndicators: []
    };
    
    // Pipe generation
    this.lastPipeX = this.canvas.width;
    this.pipeSpacing = config.pipes.spacing;
    
    // Difficulty
    this.currentPipeSpeed = config.pipes.baseSpeed;
    
    // Screen shake
    this.screenShake = {
      active: false,
      intensity: 0,
      duration: 0,
      elapsed: 0,
      offsetX: 0,
      offsetY: 0
    };
    
    // Input callbacks
    this.inputCallbacks = {
      jump: null,
      pause: null
    };
    
    // Initialize
    this.init();
  }
  
  /**
   * Initialize game engine
   * Load assets, create entities, setup input handlers
   */
  init() {
    console.log('Initializing GameEngine...');
    
    // Load high score from localStorage
    this.loadHighScore();
    
    // Create initial entities
    this.createGhost();
    
    // Setup input handlers
    this.setupInput();
    
    console.log('GameEngine initialized');
  }
  
  /**
   * Load high score from localStorage
   */
  loadHighScore() {
    try {
      const stored = localStorage.getItem(this.config.storage.highScoreKey);
      this.highScore = stored ? parseInt(stored, 10) : 0;
      console.log(`High score loaded: ${this.highScore}`);
    } catch (err) {
      console.warn('Failed to load high score:', err);
      this.highScore = 0;
    }
  }
  
  /**
   * Save high score to localStorage
   */
  saveHighScore() {
    try {
      localStorage.setItem(this.config.storage.highScoreKey, this.highScore.toString());
      console.log(`High score saved: ${this.highScore}`);
    } catch (err) {
      console.warn('Failed to save high score:', err);
    }
  }
  
  /**
   * Create Ghosty entity
   */
  createGhost() {
    this.entities.ghost = new Ghosty(
      this.config.ghost.x,
      this.config.ghost.y,
      this.config
    );
  }
  
  /**
   * Setup input event handlers
   */
  setupInput() {
    // Keyboard input
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        this.handleJumpInput();
      } else if (e.code === 'Escape') {
        e.preventDefault();
        this.handlePauseInput();
      }
    });
    
    // Mouse input
    this.canvas.addEventListener('click', () => {
      this.handleJumpInput();
    });
    
    // Touch input
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.handleJumpInput();
    });
  }
  
  /**
   * Handle jump/start/restart input
   */
  handleJumpInput() {
    if (this.state === 'menu') {
      this.startGame();
    } else if (this.state === 'playing') {
      this.jump();
    } else if (this.state === 'game_over') {
      this.restartGame();
    }
  }
  
  /**
   * Handle pause input
   */
  handlePauseInput() {
    if (this.state === 'playing') {
      this.pauseGame();
    } else if (this.state === 'paused') {
      this.resumeGame();
    }
  }
  
  /**
   * Start new game session
   */
  startGame() {
    console.log('Starting game...');
    
    // Reset game state
    this.state = 'playing';
    this.score = 0;
    this.frameCount = 0;
    
    // Reset difficulty
    this.currentPipeSpeed = this.config.pipes.baseSpeed;
    
    // Reset entities
    this.entities.ghost.reset(this.config.ghost.x, this.config.ghost.y);
    this.entities.pipes = [];
    this.entities.particles = [];
    this.entities.scoreIndicators = [];
    
    // Reset pipe generation
    this.lastPipeX = this.canvas.width;
    
    // Start invincibility
    this.startInvincibility();
    
    // Reset screen shake
    this.screenShake.active = false;
    this.screenShake.elapsed = 0;
    
    console.log('Game started');
  }
  
  /**
   * Restart game (from game over)
   */
  restartGame() {
    this.startGame();
  }
  
  /**
   * Pause game
   */
  pauseGame() {
    if (this.state !== 'playing') return;
    
    this.state = 'paused';
    console.log('Game paused');
  }
  
  /**
   * Resume game from pause
   */
  resumeGame() {
    if (this.state !== 'paused') return;
    
    this.state = 'playing';
    console.log('Game resumed');
  }
  
  /**
   * Make Ghosty jump
   */
  jump() {
    if (!this.entities.ghost || !this.entities.ghost.isAlive()) return;
    
    this.entities.ghost.jump();
    // TODO: Play jump sound when audio system is integrated
  }
  
  /**
   * Start invincibility period
   */
  startInvincibility() {
    this.invincibilityFrames = this.config.collision.invincibilityDuration;
    this.entities.ghost.setInvincible(true);
    console.log('Invincibility started');
  }
  
  /**
   * Update invincibility state
   */
  updateInvincibility() {
    if (this.invincibilityFrames > 0) {
      this.invincibilityFrames--;
      
      if (this.invincibilityFrames === 0) {
        this.entities.ghost.setInvincible(false);
        console.log('Invincibility ended');
      }
    }
  }
  
  /**
   * Start main game loop
   */
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.gameLoop(this.lastFrameTime);
    
    console.log('Game loop started');
  }
  
  /**
   * Stop game loop
   */
  stop() {
    this.isRunning = false;
    console.log('Game loop stopped');
  }
  
  /**
   * Main game loop
   * Update → Physics → Collision → Render
   * @param {number} timestamp - Current timestamp from requestAnimationFrame
   */
  gameLoop(timestamp) {
    if (!this.isRunning) return;
    
    // Calculate delta time (in seconds)
    this.deltaTime = (timestamp - this.lastFrameTime) / 1000;
    this.lastFrameTime = timestamp;
    
    // Clamp delta time to prevent large jumps
    this.deltaTime = Math.min(this.deltaTime, this.config.performance.maxDeltaTime);
    
    // Apply time scale
    const scaledDelta = this.deltaTime * this.timeScale;
    
    // Update based on state
    if (this.state === 'playing') {
      this.updatePlaying(scaledDelta);
    } else if (this.state === 'game_over') {
      this.updateGameOver(scaledDelta);
    }
    
    // Always update effects
    this.updateScreenShake();
    
    // Render
    this.render();
    
    // Increment frame count
    this.frameCount++;
    
    // Request next frame
    requestAnimationFrame((t) => this.gameLoop(t));
  }
  
  /**
   * Update game during playing state
   * @param {number} deltaTime - Time since last frame in seconds
   */
  updatePlaying(deltaTime) {
    // Update invincibility
    this.updateInvincibility();
    
    // Update Ghosty physics
    this.entities.ghost.update(deltaTime);
    
    // Update pipes
    this.updatePipes(deltaTime);
    
    // Generate new pipes
    this.generatePipes();
    
    // Update particles
    this.updateParticles(deltaTime);
    
    // Update score indicators
    this.updateScoreIndicators(deltaTime);
    
    // Check collisions
    this.checkCollisions();
  }
  
  /**
   * Update game during game over state
   * @param {number} deltaTime - Time since last frame in seconds
   */
  updateGameOver(deltaTime) {
    // Continue Ghosty death animation
    this.entities.ghost.update(deltaTime);
    
    // Update particles
    this.updateParticles(deltaTime);
  }
  
  /**
   * Update pipes (movement, scoring, removal)
   * @param {number} deltaTime - Time since last frame in seconds
   */
  updatePipes(deltaTime) {
    const ghostX = this.entities.ghost.x;
    
    for (let i = this.entities.pipes.length - 1; i >= 0; i--) {
      const pipe = this.entities.pipes[i];
      
      // Update pipe position
      pipe.update(deltaTime, this.currentPipeSpeed);
      
      // Check if ghost passed this pipe
      if (pipe.hasPassedGhost(ghostX)) {
        pipe.markScored();
        this.incrementScore();
      }
      
      // Remove off-screen pipes
      if (pipe.isOffScreen()) {
        this.entities.pipes.splice(i, 1);
      }
    }
  }
  
  /**
   * Generate new pipes ahead of the player
   */
  generatePipes() {
    const spawnX = this.canvas.width + 100;
    
    // Generate pipes until we have coverage ahead
    while (this.lastPipeX < spawnX + this.pipeSpacing) {
      const x = this.lastPipeX + this.pipeSpacing;
      const pipe = WallObstacle.create(x, this.config, this.canvas.height);
      
      this.entities.pipes.push(pipe);
      this.lastPipeX = x;
    }
  }
  
  /**
   * Increment score and handle difficulty progression
   */
  incrementScore() {
    this.score++;
    
    // Update high score
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.saveHighScore();
    }
    
    // Increase difficulty
    this.increaseDifficulty();
    
    // Create score indicator
    const lastPipe = this.entities.pipes.find(p => p.scored);
    if (lastPipe) {
      this.createScoreIndicator(
        lastPipe.x + lastPipe.width / 2,
        lastPipe.gapY
      );
    }
    
    // TODO: Play score sound when audio system is integrated
    
    console.log(`Score: ${this.score}`);
  }
  
  /**
   * Increase game difficulty based on score
   */
  increaseDifficulty() {
    const threshold = this.config.pipes.speedIncreaseThreshold;
    const increment = this.config.pipes.speedIncrement;
    const maxSpeed = this.config.pipes.maxSpeed;
    
    // Increase speed every N points
    if (this.score > 0 && this.score % threshold === 0) {
      this.currentPipeSpeed = Math.min(
        this.currentPipeSpeed + increment,
        maxSpeed
      );
      
      console.log(`Speed increased to ${this.currentPipeSpeed} px/s at score ${this.score}`);
    }
  }
  
  /**
   * Update particles (spawn, update, remove dead)
   * @param {number} deltaTime - Time since last frame in seconds
   */
  updateParticles(deltaTime) {
    // Spawn new particles during gameplay
    if (this.state === 'playing' && Math.random() < this.config.particles.spawnChance) {
      if (this.entities.particles.length < this.config.particles.maxActive) {
        this.createParticle();
      }
    }
    
    // Update existing particles
    for (let i = this.entities.particles.length - 1; i >= 0; i--) {
      const particle = this.entities.particles[i];
      particle.update(deltaTime);
      
      // Remove dead particles
      if (particle.isDead()) {
        this.entities.particles.splice(i, 1);
      }
    }
  }
  
  /**
   * Create a new particle near Ghosty
   */
  createParticle() {
    const ghost = this.entities.ghost;
    const circle = ghost.getCircle();
    
    const particle = {
      x: circle.x + (Math.random() - 0.5) * 10,
      y: circle.y + (Math.random() - 0.5) * 10,
      vx: (Math.random() - 0.5) * this.config.particles.velocityRange * 2,
      vy: (Math.random() - 0.5) * this.config.particles.velocityRange * 2,
      life: 1.0,
      decay: this.config.particles.decay,
      size: this.config.particles.minSize + 
            Math.random() * (this.config.particles.maxSize - this.config.particles.minSize),
      
      update(deltaTime) {
        this.x += this.vx * deltaTime * 60;
        this.y += this.vy * deltaTime * 60;
        this.life -= this.decay;
      },
      
      isDead() {
        return this.life <= 0;
      }
    };
    
    this.entities.particles.push(particle);
  }
  
  /**
   * Update score indicators (float, fade, remove dead)
   * @param {number} deltaTime - Time since last frame in seconds
   */
  updateScoreIndicators(deltaTime) {
    for (let i = this.entities.scoreIndicators.length - 1; i >= 0; i--) {
      const indicator = this.entities.scoreIndicators[i];
      indicator.update(deltaTime);
      
      // Remove dead indicators
      if (indicator.isDead()) {
        this.entities.scoreIndicators.splice(i, 1);
      }
    }
  }
  
  /**
   * Create a score indicator at the specified position
   * @param {number} x - X position
   * @param {number} y - Y position
   */
  createScoreIndicator(x, y) {
    const indicator = {
      x: x,
      y: y,
      value: 1,
      life: 1.0,
      decay: this.config.scoreIndicators.decay,
      vy: this.config.scoreIndicators.floatSpeed,
      
      update(deltaTime) {
        this.y += this.vy * deltaTime * 60;
        this.life -= this.decay;
      },
      
      isDead() {
        return this.life <= 0;
      }
    };
    
    this.entities.scoreIndicators.push(indicator);
  }
  
  /**
   * Check collisions between Ghosty and obstacles
   */
  checkCollisions() {
    // Skip if invincible
    if (this.entities.ghost.isInvincible()) {
      return;
    }
    
    const ghost = this.entities.ghost;
    const ghostCircle = ghost.getCircle();
    
    // Check boundary collisions
    if (this.checkBoundaryCollision(ghostCircle)) {
      this.handleCollision('boundary');
      return;
    }
    
    // Check pipe collisions
    for (const pipe of this.entities.pipes) {
      // Skip pipes too far away (optimization)
      if (pipe.x + pipe.width < ghostCircle.x - 100) {
        continue;
      }
      
      if (pipe.x > ghostCircle.x + 100) {
        break;
      }
      
      const collision = pipe.checkCircleCollision(ghostCircle);
      if (collision.collided) {
        this.handleCollision(collision.type);
        return;
      }
    }
  }
  
  /**
   * Check if Ghosty collided with screen boundaries
   * @param {Object} circle - Ghosty's circular collision bounds
   * @returns {boolean} True if collision detected
   */
  checkBoundaryCollision(circle) {
    // Ceiling collision
    if (circle.y - circle.radius <= 0) {
      return true;
    }
    
    // Ground collision
    if (circle.y + circle.radius >= this.canvas.height) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Handle collision (trigger game over)
   * @param {string} type - Collision type ('boundary', 'pipe_top', 'pipe_bottom')
   */
  handleCollision(type) {
    console.log(`Collision detected: ${type}`);
    
    // Kill Ghosty
    this.entities.ghost.kill();
    
    // Trigger screen shake
    this.triggerScreenShake(
      this.config.collision.screenShakeIntensity,
      this.config.collision.screenShakeDuration
    );
    
    // Spawn collision particles
    this.spawnCollisionParticles();
    
    // Change to game over state
    this.state = 'game_over';
    
    // TODO: Play game over sound when audio system is integrated
    
    console.log('Game over');
  }
  
  /**
   * Spawn particles at collision point
   */
  spawnCollisionParticles() {
    const ghost = this.entities.ghost;
    const circle = ghost.getCircle();
    const count = 15;
    
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 100 + Math.random() * 100;
      
      const particle = {
        x: circle.x,
        y: circle.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.8,
        decay: 0.015,
        size: 3 + Math.random() * 3,
        
        update(deltaTime) {
          this.x += this.vx * deltaTime;
          this.y += this.vy * deltaTime;
          this.life -= this.decay;
        },
        
        isDead() {
          return this.life <= 0;
        }
      };
      
      this.entities.particles.push(particle);
    }
  }
  
  /**
   * Trigger screen shake effect
   * @param {number} intensity - Shake intensity in pixels
   * @param {number} duration - Shake duration in frames
   */
  triggerScreenShake(intensity, duration) {
    this.screenShake.active = true;
    this.screenShake.intensity = intensity;
    this.screenShake.duration = duration;
    this.screenShake.elapsed = 0;
  }
  
  /**
   * Update screen shake effect
   */
  updateScreenShake() {
    if (!this.screenShake.active) {
      this.screenShake.offsetX = 0;
      this.screenShake.offsetY = 0;
      return;
    }
    
    this.screenShake.elapsed++;
    
    if (this.screenShake.elapsed >= this.screenShake.duration) {
      this.screenShake.active = false;
      this.screenShake.offsetX = 0;
      this.screenShake.offsetY = 0;
      return;
    }
    
    // Calculate decay
    const progress = this.screenShake.elapsed / this.screenShake.duration;
    const currentIntensity = this.screenShake.intensity * (1 - progress);
    
    // Random offset
    this.screenShake.offsetX = (Math.random() - 0.5) * currentIntensity * 2;
    this.screenShake.offsetY = (Math.random() - 0.5) * currentIntensity * 2;
  }
  
  /**
   * Render current frame
   */
  render() {
    this.ctx.save();
    
    // Apply screen shake
    if (this.screenShake.active) {
      this.ctx.translate(this.screenShake.offsetX, this.screenShake.offsetY);
    }
    
    // Clear canvas
    this.ctx.fillStyle = this.config.visual.backgroundColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Render based on state
    if (this.state === 'menu') {
      this.renderMenu();
    } else if (this.state === 'playing' || this.state === 'game_over') {
      this.renderGame();
      
      if (this.state === 'game_over') {
        this.renderGameOver();
      }
    } else if (this.state === 'paused') {
      this.renderGame();
      this.renderPauseOverlay();
    }
    
    this.ctx.restore();
  }
  
  /**
   * Render menu screen
   */
  renderMenu() {
    this.ctx.fillStyle = this.config.visual.textColor;
    this.ctx.font = 'bold 48px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Flappy Kiro', this.canvas.width / 2, 150);
    
    this.ctx.font = '24px Arial';
    this.ctx.fillText(`High Score: ${this.highScore}`, this.canvas.width / 2, 220);
    
    this.ctx.font = '20px Arial';
    this.ctx.fillText(
      'Press SPACE or Click to Start',
      this.canvas.width / 2,
      300
    );
  }
  
  /**
   * Render game (entities and UI)
   */
  renderGame() {
    // Render particles (behind everything)
    for (const particle of this.entities.particles) {
      this.renderParticle(particle);
    }
    
    // Render pipes
    for (const pipe of this.entities.pipes) {
      pipe.render(this.ctx);
    }
    
    // Render Ghosty
    this.entities.ghost.render(this.ctx);
    
    // Render invincibility indicator
    if (this.entities.ghost.isInvincible()) {
      this.entities.ghost.renderInvincibilityIndicator(this.ctx);
    }
    
    // Render score indicators
    for (const indicator of this.entities.scoreIndicators) {
      this.renderScoreIndicator(indicator);
    }
    
    // Render score
    this.renderScore();
  }
  
  /**
   * Render a particle
   * @param {Object} particle - Particle object
   */
  renderParticle(particle) {
    this.ctx.save();
    this.ctx.globalAlpha = particle.life;
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.beginPath();
    this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();
  }
  
  /**
   * Render a score indicator
   * @param {Object} indicator - Score indicator object
   */
  renderScoreIndicator(indicator) {
    this.ctx.save();
    this.ctx.globalAlpha = indicator.life;
    this.ctx.fillStyle = this.config.scoreIndicators.color;
    this.ctx.font = `bold ${this.config.scoreIndicators.fontSize}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`+${indicator.value}`, indicator.x, indicator.y);
    this.ctx.restore();
  }
  
  /**
   * Render current score and high score
   */
  renderScore() {
    this.ctx.fillStyle = this.config.visual.textColor;
    this.ctx.font = '20px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
      `Score: ${this.score} | High: ${this.highScore}`,
      this.canvas.width / 2,
      this.canvas.height - 20
    );
  }
  
  /**
   * Render pause overlay
   */
  renderPauseOverlay() {
    this.ctx.fillStyle = this.config.visual.overlayColor;
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
  
  /**
   * Render game over screen
   */
  renderGameOver() {
    this.ctx.fillStyle = this.config.visual.overlayColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = 'bold 48px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('GAME OVER', this.canvas.width / 2, 150);
    
    this.ctx.font = '28px Arial';
    this.ctx.fillText(`Score: ${this.score}`, this.canvas.width / 2, 210);
    this.ctx.fillText(`High Score: ${this.highScore}`, this.canvas.width / 2, 250);
    
    this.ctx.font = '20px Arial';
    this.ctx.fillText(
      'Press SPACE or Click to Restart',
      this.canvas.width / 2,
      320
    );
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameEngine;
}
