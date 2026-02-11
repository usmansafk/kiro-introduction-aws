/**
 * WallObstacle Class (Pipe Obstacle)
 * 
 * Represents a pair of vertical pipe obstacles in Flappy Kiro.
 * Each obstacle consists of a top pipe and bottom pipe with a gap between them.
 * 
 * Configuration (from game-config.json):
 * - Width: 52 pixels
 * - Gap Size: 140 pixels (vertical opening)
 * - Spacing: 350 pixels (horizontal distance between pipes)
 * - Base Speed: 120 px/s
 * - Max Speed: 240 px/s
 * - Gap Position: Random between 100px and 500px (center Y)
 * 
 * Movement:
 * - Scrolls left at current game speed (frame-rate independent)
 * - Speed increases every 5 points by 10 px/s
 * - Removed when off-screen (x + width < 0)
 */

class WallObstacle {
  /**
   * Create a new WallObstacle (pipe pair)
   * @param {number} x - Initial X position (right side of screen)
   * @param {number} gapY - Center Y position of the gap
   * @param {number} gapSize - Height of the gap opening
   * @param {number} canvasHeight - Height of the canvas (for bottom pipe calculation)
   * @param {Object} config - Game configuration object
   */
  constructor(x, gapY, gapSize, canvasHeight, config) {
    this.config = config;
    
    // Position
    this.x = x;                       // Horizontal position
    this.gapY = gapY;                 // Gap center Y position
    this.gapSize = gapSize;           // Gap height
    this.width = config.pipes.width;  // 52 pixels
    this.canvasHeight = canvasHeight;
    
    // State
    this.scored = false;              // Track if player passed this pipe
    this.active = true;               // Whether pipe is active
    this.id = WallObstacle.nextId++; // Unique identifier
    
    // Pre-calculate pipe heights for performance
    this.topHeight = gapY - (gapSize / 2);
    this.bottomY = gapY + (gapSize / 2);
    this.bottomHeight = canvasHeight - this.bottomY;
    
    // Visual properties
    this.pipeColor = config.visual?.pipeColor || '#00AA00';
    this.pipeCapColor = config.visual?.pipeCapColor || '#00CC00';
    this.capHeight = 20;              // Height of decorative pipe cap
    this.capOverhang = 2;             // Pixels cap extends beyond pipe
  }
  
  /**
   * Update pipe position based on current speed
   * Frame-rate independent using deltaTime
   * @param {number} deltaTime - Time since last frame in seconds
   * @param {number} speed - Current pipe speed in pixels per second
   */
  update(deltaTime, speed) {
    // Move left at current speed (pixels per second)
    this.x -= speed * deltaTime;
  }
  
  /**
   * Check if pipe is off-screen (can be removed)
   * @returns {boolean} True if pipe is completely off-screen
   */
  isOffScreen() {
    return this.x + this.width < 0;
  }
  
  /**
   * Check if pipe has passed the ghost (for scoring)
   * @param {number} ghostX - X position of the ghost
   * @returns {boolean} True if pipe passed ghost and hasn't been scored yet
   */
  hasPassedGhost(ghostX) {
    return !this.scored && this.x + this.width < ghostX;
  }
  
  /**
   * Mark this pipe as scored (player passed through)
   */
  markScored() {
    this.scored = true;
  }
  
  /**
   * Check if pipe is visible on screen
   * @param {number} canvasWidth - Width of the canvas
   * @returns {boolean} True if any part of pipe is visible
   */
  isVisible(canvasWidth) {
    return this.x < canvasWidth && this.x + this.width > 0;
  }
  
  // ==================== Collision Detection ====================
  
  /**
   * Get top pipe hitbox for collision detection
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
   * Get bottom pipe hitbox for collision detection
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
   * Get gap bounds (safe zone between pipes)
   * @returns {Object} Rectangle representing the gap
   */
  getGapBounds() {
    return {
      x: this.x,
      y: this.topHeight,
      width: this.width,
      height: this.gapSize
    };
  }
  
  /**
   * Get all collision bounds for this obstacle
   * @returns {Object} Object containing top and bottom hitboxes
   */
  getAllHitboxes() {
    return {
      top: this.getTopHitbox(),
      bottom: this.getBottomHitbox(),
      gap: this.getGapBounds()
    };
  }
  
  /**
   * Check if a point is inside the gap (safe zone)
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {boolean} True if point is in the gap
   */
  isPointInGap(x, y) {
    return x >= this.x &&
           x <= this.x + this.width &&
           y >= this.topHeight &&
           y <= this.bottomY;
  }
  
  /**
   * Check if a circle intersects with this pipe
   * Used for ghost collision detection
   * @param {Object} circle - Circle with x, y, radius
   * @returns {Object} Collision result with collided flag and type
   */
  checkCircleCollision(circle) {
    // Check top pipe
    const topHitbox = this.getTopHitbox();
    if (this.circleRectIntersection(circle, topHitbox)) {
      return {
        collided: true,
        type: 'pipe_top',
        pipe: this,
        position: { x: circle.x, y: circle.y }
      };
    }
    
    // Check bottom pipe
    const bottomHitbox = this.getBottomHitbox();
    if (this.circleRectIntersection(circle, bottomHitbox)) {
      return {
        collided: true,
        type: 'pipe_bottom',
        pipe: this,
        position: { x: circle.x, y: circle.y }
      };
    }
    
    return { collided: false };
  }
  
  /**
   * Circle-rectangle intersection test
   * @param {Object} circle - Circle with x, y, radius
   * @param {Object} rect - Rectangle with x, y, width, height
   * @returns {boolean} True if circle intersects rectangle
   */
  circleRectIntersection(circle, rect) {
    // Find closest point on rectangle to circle center
    const closestX = Math.max(
      rect.x,
      Math.min(circle.x, rect.x + rect.width)
    );
    const closestY = Math.max(
      rect.y,
      Math.min(circle.y, rect.y + rect.height)
    );
    
    // Calculate distance from circle center to closest point
    const distanceX = circle.x - closestX;
    const distanceY = circle.y - closestY;
    const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);
    
    // Check if distance is less than radius (collision detected)
    return distanceSquared < (circle.radius * circle.radius);
  }
  
  // ==================== Rendering ====================
  
  /**
   * Render the pipe obstacle to the canvas
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   */
  render(ctx) {
    ctx.save();
    
    // Render top pipe
    this.renderTopPipe(ctx);
    
    // Render bottom pipe
    this.renderBottomPipe(ctx);
    
    ctx.restore();
  }
  
  /**
   * Render the top pipe
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   */
  renderTopPipe(ctx) {
    // Main pipe body
    ctx.fillStyle = this.pipeColor;
    ctx.fillRect(this.x, 0, this.width, this.topHeight);
    
    // Pipe cap (decorative)
    ctx.fillStyle = this.pipeCapColor;
    ctx.fillRect(
      this.x - this.capOverhang,
      this.topHeight - this.capHeight,
      this.width + (this.capOverhang * 2),
      this.capHeight
    );
  }
  
  /**
   * Render the bottom pipe
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   */
  renderBottomPipe(ctx) {
    // Main pipe body
    ctx.fillStyle = this.pipeColor;
    ctx.fillRect(this.x, this.bottomY, this.width, this.bottomHeight);
    
    // Pipe cap (decorative)
    ctx.fillStyle = this.pipeCapColor;
    ctx.fillRect(
      this.x - this.capOverhang,
      this.bottomY,
      this.width + (this.capOverhang * 2),
      this.capHeight
    );
  }
  
  /**
   * Render debug information (hitboxes, gap, etc.)
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   */
  renderDebug(ctx) {
    ctx.save();
    
    // Draw top pipe hitbox
    const topHitbox = this.getTopHitbox();
    ctx.strokeStyle = '#FF0000';
    ctx.lineWidth = 2;
    ctx.strokeRect(topHitbox.x, topHitbox.y, topHitbox.width, topHitbox.height);
    
    // Draw bottom pipe hitbox
    const bottomHitbox = this.getBottomHitbox();
    ctx.strokeStyle = '#FF0000';
    ctx.lineWidth = 2;
    ctx.strokeRect(bottomHitbox.x, bottomHitbox.y, bottomHitbox.width, bottomHitbox.height);
    
    // Draw gap bounds (safe zone)
    const gapBounds = this.getGapBounds();
    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 2;
    ctx.strokeRect(gapBounds.x, gapBounds.y, gapBounds.width, gapBounds.height);
    
    // Draw gap center line
    ctx.strokeStyle = '#FFFF00';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.gapY);
    ctx.lineTo(this.x + this.width, this.gapY);
    ctx.stroke();
    
    // Draw debug text
    ctx.fillStyle = '#000000';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`ID: ${this.id}`, this.x + this.width / 2, this.gapY - 10);
    ctx.fillText(
      this.scored ? 'SCORED' : 'ACTIVE',
      this.x + this.width / 2,
      this.gapY + 5
    );
    
    ctx.restore();
  }
  
  /**
   * Render scoring indicator (when pipe is passed)
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   */
  renderScoringIndicator(ctx) {
    if (!this.scored) return;
    
    ctx.save();
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('+1', this.x + this.width / 2, this.gapY);
    ctx.restore();
  }
  
  // ==================== Static Methods ====================
  
  /**
   * Generate a random gap position within valid range
   * @param {Object} config - Game configuration
   * @param {number} canvasHeight - Canvas height
   * @returns {number} Gap center Y position
   */
  static generateGapPosition(config, canvasHeight) {
    const minGapY = config.pipes.minGapY;     // 100px
    const maxGapY = config.pipes.maxGapY;     // 500px
    const gapSize = config.pipes.gapSize;     // 140px
    
    // Random position within valid range
    const range = maxGapY - minGapY;
    const gapY = minGapY + Math.random() * range;
    
    // Validate gap is fully visible
    const halfGap = gapSize / 2;
    const topEdge = gapY - halfGap;
    const bottomEdge = gapY + halfGap;
    
    // Ensure gap doesn't clip screen edges
    if (topEdge < 0 || bottomEdge > canvasHeight) {
      console.warn('Invalid gap position:', gapY, 'using center');
      return canvasHeight / 2;
    }
    
    return gapY;
  }
  
  /**
   * Create a new pipe at the specified position
   * @param {number} x - X position
   * @param {Object} config - Game configuration
   * @param {number} canvasHeight - Canvas height
   * @returns {WallObstacle} New pipe instance
   */
  static create(x, config, canvasHeight) {
    const gapY = WallObstacle.generateGapPosition(config, canvasHeight);
    const gapSize = config.pipes.gapSize;
    return new WallObstacle(x, gapY, gapSize, canvasHeight, config);
  }
  
  /**
   * Validate pipe configuration
   * @param {number} gapY - Gap center Y
   * @param {number} gapSize - Gap size
   * @param {number} canvasHeight - Canvas height
   * @returns {boolean} True if configuration is valid
   */
  static validateConfiguration(gapY, gapSize, canvasHeight) {
    const halfGap = gapSize / 2;
    const topEdge = gapY - halfGap;
    const bottomEdge = gapY + halfGap;
    
    // Check if gap is within canvas bounds
    if (topEdge < 0 || bottomEdge > canvasHeight) {
      return false;
    }
    
    // Check minimum pipe heights
    const minPipeHeight = 50;
    if (topEdge < minPipeHeight) {
      return false;
    }
    if (canvasHeight - bottomEdge < minPipeHeight) {
      return false;
    }
    
    return true;
  }
  
  // ==================== Utility Methods ====================
  
  /**
   * Get distance to ghost (for optimization)
   * @param {number} ghostX - Ghost X position
   * @returns {number} Horizontal distance to ghost
   */
  getDistanceToGhost(ghostX) {
    // Distance from ghost to nearest edge of pipe
    if (ghostX < this.x) {
      return this.x - ghostX;
    } else if (ghostX > this.x + this.width) {
      return ghostX - (this.x + this.width);
    } else {
      return 0; // Ghost is within pipe's X range
    }
  }
  
  /**
   * Check if pipe is near ghost (for collision optimization)
   * @param {number} ghostX - Ghost X position
   * @param {number} range - Detection range in pixels
   * @returns {boolean} True if pipe is within range
   */
  isNearGhost(ghostX, range = 100) {
    return this.getDistanceToGhost(ghostX) <= range;
  }
  
  /**
   * Get pipe data for serialization
   * @returns {Object} Pipe data object
   */
  toJSON() {
    return {
      id: this.id,
      x: this.x,
      gapY: this.gapY,
      gapSize: this.gapSize,
      scored: this.scored,
      active: this.active
    };
  }
  
  /**
   * Create pipe from serialized data
   * @param {Object} data - Serialized pipe data
   * @param {number} canvasHeight - Canvas height
   * @param {Object} config - Game configuration
   * @returns {WallObstacle} Reconstructed pipe
   */
  static fromJSON(data, canvasHeight, config) {
    const pipe = new WallObstacle(
      data.x,
      data.gapY,
      data.gapSize,
      canvasHeight,
      config
    );
    pipe.id = data.id;
    pipe.scored = data.scored;
    pipe.active = data.active;
    return pipe;
  }
}

// Static counter for unique IDs
WallObstacle.nextId = 1;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WallObstacle;
}
