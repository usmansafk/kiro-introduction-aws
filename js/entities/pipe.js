/**
 * Pipe Entity
 * Represents obstacle pipes with top and bottom sections
 */

import GameConfig from '../config.js';

class Pipe {
  /**
   * Create a new pipe
   * @param {number} x - X position (moves left)
   * @param {number} gapY - Center Y position of the gap
   * @param {number} gapSize - Height of the gap
   * @param {number} canvasHeight - Canvas height for calculations
   * @param {Object} config - Game configuration (optional)
   */
  constructor(x, gapY, gapSize, canvasHeight, config = GameConfig) {
    this.config = config;
    this.x = x;
    this.gapY = gapY;
    this.gapSize = gapSize;
    this.width = config.pipes.width;
    this.canvasHeight = canvasHeight;
    this.scored = false;
    
    // Calculate top and bottom pipe heights
    this.topHeight = gapY - (gapSize / 2);
    this.bottomY = gapY + (gapSize / 2);
    this.bottomHeight = canvasHeight - this.bottomY;
  }
  
  /**
   * Get hitbox for top pipe
   * @returns {Object} Rectangle with x, y, width, height
   */
  getTopHitbox() {
    return {
      x: this.x,
      y: 0,
      width: this.width,
      height: this.topHeight
    };
  }
  
  /**
   * Get hitbox for bottom pipe
   * @returns {Object} Rectangle with x, y, width, height
   */
  getBottomHitbox() {
    return {
      x: this.x,
      y: this.bottomY,
      width: this.width,
      height: this.bottomHeight
    };
  }
  
  /**
   * Update pipe position
   * @param {number} deltaTime - Time elapsed since last frame
   * @param {number} speed - Current pipe scroll speed
   */
  update(deltaTime, speed) {
    this.x -= speed * deltaTime;
  }
  
  /**
   * Check if pipe is completely off screen
   * @returns {boolean} True if pipe is past left edge
   */
  isOffScreen() {
    return this.x + this.width < 0;
  }
  
  /**
   * Check if ghost has passed this pipe
   * @param {number} ghostX - Ghost's X position
   * @returns {boolean} True if ghost passed and not yet scored
   */
  hasPassedGhost(ghostX) {
    return !this.scored && this.x + this.width < ghostX;
  }
  
  /**
   * Mark this pipe as scored
   */
  markScored() {
    this.scored = true;
  }
  
  /**
   * Reset pipe for object pooling
   * @param {number} x - New X position
   * @param {number} gapY - New gap center Y position
   * @param {number} gapSize - New gap size
   */
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

export default Pipe;
