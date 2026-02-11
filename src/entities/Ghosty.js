/**
 * Ghosty Character Class
 * 
 * The player-controlled character in Flappy Kiro.
 * Implements frame-rate independent physics, animation states, and collision detection.
 * 
 * Physics Constants (from game-config.json):
 * - Gravity: 800 px/s²
 * - Jump Velocity: -300 px/s (negative = upward)
 * - Terminal Velocity: 600 px/s (max fall speed)
 * - Max Upward Velocity: -600 px/s
 * 
 * Dimensions:
 * - Sprite: 34x24 pixels
 * - Hitbox: 28x20 pixels (forgiving collision)
 * - Collision Radius: 12 pixels (circular)
 */

class Ghosty {
  /**
   * Create a new Ghosty instance
   * @param {number} x - Initial X position (fixed at 100)
   * @param {number} y - Initial Y position (center of screen)
   * @param {Object} config - Game configuration object
   */
  constructor(x, y, config) {
    this.config = config;
    
    // Position and movement
    this.x = x;                           // Fixed horizontal position
    this.y = y;                           // Vertical position (changes)
    this.velocity = 0;                    // Vertical velocity (px/s)
    
    // Dimensions from config
    this.width = config.ghost.width;      // 34px
    this.height = config.ghost.height;    // 24px
    
    // Hitbox configuration (smaller than sprite for forgiveness)
    this.hitboxWidth = config.ghost.hitboxWidth;       // 28px
    this.hitboxHeight = config.ghost.hitboxHeight;     // 20px
    this.hitboxOffsetX = config.ghost.hitboxOffsetX;   // 3px
    this.hitboxOffsetY = config.ghost.hitboxOffsetY;   // 2px
    this.hitboxRadius = 12;                            // Circular collision radius
    
    // Visual state
    this.rotation = 0;                    // Rotation angle (-25 to 25 degrees)
    this.sprite = null;                   // Sprite image
    this.spriteLoaded = false;
    
    // Animation state
    this.animationFrame = 0;
    this.animationSpeed = 0.1;
    this.bobOffset = 0;                   // Vertical bob for idle state
    this.bobSpeed = 2;                    // Bob speed
    
    // State flags
    this.alive = true;
    this.invincible = false;
    this.grounded = false;
    
    // Physics constants from config
    this.gravity = config.physics.gravity;                      // 800 px/s²
    this.jumpVelocity = config.physics.jumpVelocity;            // -300 px/s
    this.terminalVelocity = config.physics.terminalVelocity;    // 600 px/s
    this.maxUpwardVelocity = config.physics.maxUpwardVelocity;  // -600 px/s
    
    // Load sprite
    this.loadSprite();
  }
  
  /**
   * Load the Ghosty sprite image
   */
  loadSprite() {
    this.sprite = new Image();
    this.sprite.onload = () => {
      this.spriteLoaded = true;
      console.log('Ghosty sprite loaded successfully');
    };
    this.sprite.onerror = () => {
      console.error('Failed to load Ghosty sprite from:', this.config.ghost.spritePath);
    };
    this.sprite.src = this.config.ghost.spritePath;
  }
  
  /**
   * Update Ghosty's physics and animation
   * Frame-rate independent using deltaTime
   * @param {number} deltaTime - Time since last frame in seconds
   */
  update(deltaTime) {
    if (!this.alive) {
      this.updateDeathAnimation(deltaTime);
      return;
    }
    
    // 1. Apply gravity (pixels per second squared)
    this.velocity += this.gravity * deltaTime;
    
    // 2. Clamp velocity to limits
    this.velocity = Math.min(this.velocity, this.terminalVelocity);
    this.velocity = Math.max(this.velocity, this.maxUpwardVelocity);
    
    // 3. Update position (pixels per second)
    this.y += this.velocity * deltaTime;
    
    // 4. Update rotation based on velocity
    this.updateRotation();
    
    // 5. Update animation
    this.updateAnimation(deltaTime);
  }
  
  /**
   * Update rotation based on velocity for visual feedback
   * Falling: nose down (positive rotation)
   * Rising: nose up (negative rotation)
   */
  updateRotation() {
    // Calculate target rotation based on velocity
    const targetRotation = this.velocity * 0.05;
    
    // Smooth rotation transition
    const rotationSpeed = 0.2;
    this.rotation += (targetRotation - this.rotation) * rotationSpeed;
    
    // Clamp rotation to prevent extreme angles
    this.rotation = Math.max(-25, Math.min(25, this.rotation));
  }
  
  /**
   * Update animation state
   * @param {number} deltaTime - Time since last frame in seconds
   */
  updateAnimation(deltaTime) {
    // Simple bob animation when idle/rising
    if (this.velocity < 0) {
      this.bobOffset = Math.sin(Date.now() / 200) * 2;
    } else {
      this.bobOffset = 0;
    }
    
    // Frame animation (if sprite has multiple frames)
    this.animationFrame += this.animationSpeed * deltaTime * 60;
    if (this.animationFrame >= 1) {
      this.animationFrame = 0;
    }
  }
  
  /**
   * Update death animation (spinning fall)
   * @param {number} deltaTime - Time since last frame in seconds
   */
  updateDeathAnimation(deltaTime) {
    // Continue falling with gravity
    this.velocity += this.gravity * deltaTime;
    this.velocity = Math.min(this.velocity, this.terminalVelocity);
    this.y += this.velocity * deltaTime;
    
    // Spin rotation
    this.rotation += 360 * deltaTime;
    if (this.rotation > 360) {
      this.rotation -= 360;
    }
  }
  
  /**
   * Make Ghosty jump
   * Sets velocity to jump velocity (instant change)
   */
  jump() {
    if (!this.alive) return;
    
    // Set velocity to jump velocity (instant change, not gradual)
    this.velocity = this.jumpVelocity;
    
    // Reset rotation for visual feedback
    this.rotation = -20;
    
    console.log('Ghosty jumped');
  }
  
  /**
   * Kill Ghosty (collision occurred)
   */
  kill() {
    if (!this.alive) return;
    
    this.alive = false;
    console.log('Ghosty died');
  }
  
  /**
   * Reset Ghosty to initial state
   * @param {number} x - X position (optional, defaults to config)
   * @param {number} y - Y position (optional, defaults to config)
   */
  reset(x = this.config.ghost.x, y = this.config.ghost.y) {
    this.x = x;
    this.y = y;
    this.velocity = 0;
    this.rotation = 0;
    this.alive = true;
    this.grounded = false;
    this.bobOffset = 0;
    this.animationFrame = 0;
    this.invincible = false;
  }
  
  // ==================== Collision Detection ====================
  
  /**
   * Get rectangular hitbox for collision detection
   * Slightly smaller than sprite for forgiving collision
   * @returns {Object} Hitbox with x, y, width, height
   */
  getHitbox() {
    return {
      x: this.x + this.hitboxOffsetX,
      y: this.y + this.hitboxOffsetY,
      width: this.hitboxWidth,
      height: this.hitboxHeight
    };
  }
  
  /**
   * Get circular collision bounds (more forgiving)
   * Used for actual collision detection
   * @returns {Object} Circle with x, y, radius
   */
  getCircle() {
    const hitbox = this.getHitbox();
    return {
      x: hitbox.x + hitbox.width / 2,   // Center X
      y: hitbox.y + hitbox.height / 2,  // Center Y
      radius: this.hitboxRadius          // 12 pixel radius
    };
  }
  
  /**
   * Get sprite bounds (for rendering)
   * @returns {Object} Bounds with left, right, top, bottom
   */
  getBounds() {
    return {
      left: this.x,
      right: this.x + this.width,
      top: this.y,
      bottom: this.y + this.height
    };
  }
  
  // ==================== State Queries ====================
  
  /**
   * Check if Ghosty is alive
   * @returns {boolean}
   */
  isAlive() {
    return this.alive;
  }
  
  /**
   * Check if Ghosty is invincible
   * @returns {boolean}
   */
  isInvincible() {
    return this.invincible;
  }
  
  /**
   * Check if Ghosty is falling
   * @returns {boolean}
   */
  isFalling() {
    return this.velocity > 0;
  }
  
  /**
   * Check if Ghosty is rising
   * @returns {boolean}
   */
  isRising() {
    return this.velocity < 0;
  }
  
  /**
   * Check if Ghosty is grounded
   * @returns {boolean}
   */
  isGrounded() {
    return this.grounded;
  }
  
  /**
   * Set invincibility state
   * @param {boolean} invincible - Whether Ghosty should be invincible
   */
  setInvincible(invincible) {
    this.invincible = invincible;
  }
  
  /**
   * Set grounded state
   * @param {boolean} grounded - Whether Ghosty is on the ground
   */
  setGrounded(grounded) {
    this.grounded = grounded;
  }
  
  // ==================== Rendering ====================
  
  /**
   * Render Ghosty to the canvas
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   */
  render(ctx) {
    ctx.save();
    
    // Translate to center of sprite for rotation
    ctx.translate(
      this.x + this.width / 2,
      this.y + this.height / 2 + this.bobOffset
    );
    
    // Apply rotation
    ctx.rotate((this.rotation * Math.PI) / 180);
    
    // Draw sprite or fallback rectangle
    if (this.spriteLoaded && this.sprite) {
      ctx.drawImage(
        this.sprite,
        -this.width / 2,
        -this.height / 2,
        this.width,
        this.height
      );
    } else {
      // Fallback: white rectangle
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(
        -this.width / 2,
        -this.height / 2,
        this.width,
        this.height
      );
    }
    
    ctx.restore();
  }
  
  /**
   * Render debug information (hitboxes, velocity, etc.)
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   */
  renderDebug(ctx) {
    ctx.save();
    
    // Draw circular collision bound
    const circle = this.getCircle();
    ctx.strokeStyle = this.invincible ? '#FFD700' : '#FF0000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw rectangular hitbox
    const hitbox = this.getHitbox();
    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 1;
    ctx.strokeRect(hitbox.x, hitbox.y, hitbox.width, hitbox.height);
    
    // Draw velocity vector
    ctx.strokeStyle = '#0000FF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(circle.x, circle.y);
    ctx.lineTo(circle.x, circle.y + this.velocity * 0.1);
    ctx.stroke();
    
    // Draw debug text
    ctx.fillStyle = '#000000';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Vel: ${this.velocity.toFixed(1)}`, this.x, this.y - 10);
    ctx.fillText(`Rot: ${this.rotation.toFixed(1)}°`, this.x, this.y - 25);
    
    ctx.restore();
  }
  
  /**
   * Render invincibility indicator (flashing circle)
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   */
  renderInvincibilityIndicator(ctx) {
    if (!this.invincible) return;
    
    // Flash on/off every 100ms
    const flashOn = Math.floor(Date.now() / 100) % 2 === 0;
    
    if (flashOn) {
      const circle = this.getCircle();
      
      ctx.save();
      ctx.strokeStyle = '#FFD700'; // Gold
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(circle.x, circle.y, circle.radius + 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Ghosty;
}
