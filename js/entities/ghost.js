/**
 * Ghost Entity
 * Represents the player-controlled character
 */

import GameConfig from '../config.js';

class Ghost {
  /**
   * Create a new Ghost
   * @param {number} x - Initial X position
   * @param {number} y - Initial Y position
   * @param {HTMLImageElement} spriteImage - Loaded sprite image
   * @param {Object} config - Game configuration (defaults to GameConfig)
   */
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
  
  /**
   * Get the collision hitbox bounds
   * @returns {Object} Hitbox with x, y, width, height
   */
  getHitbox() {
    return {
      x: this.x + this.hitbox.offsetX,
      y: this.y + this.hitbox.offsetY,
      width: this.hitbox.width,
      height: this.hitbox.height
    };
  }
  
  /**
   * Apply jump velocity to the ghost
   * @param {number} jumpVelocity - The jump velocity value (negative for upward)
   */
  jump(jumpVelocity) {
    this.velocity = jumpVelocity;
  }
  
  /**
   * Update ghost physics and position
   * @param {number} deltaTime - Time elapsed since last frame (normalized)
   * @param {number} gravity - Gravity constant
   * @param {number} terminalVelocity - Maximum falling speed
   * @param {number} maxUpwardVelocity - Maximum upward speed (negative value)
   */
  update(deltaTime, gravity, terminalVelocity, maxUpwardVelocity) {
    // Apply gravity
    this.velocity += gravity * deltaTime;
    
    // Clamp velocity to terminal velocity (downward)
    this.velocity = Math.min(this.velocity, terminalVelocity);
    
    // Clamp velocity to maximum upward velocity
    this.velocity = Math.max(this.velocity, maxUpwardVelocity);
    
    // Update position
    this.y += this.velocity * deltaTime;
    
    // Update rotation for visual tilt effect
    // Rotation ranges from -25 to +25 degrees based on velocity
    this.rotation = Math.max(-25, Math.min(25, this.velocity * 2));
  }
  
  /**
   * Reset ghost to initial state
   * @param {number} x - Reset X position
   * @param {number} y - Reset Y position
   */
  reset(x, y) {
    this.x = x;
    this.y = y;
    this.velocity = 0;
    this.rotation = 0;
  }
}

export default Ghost;
