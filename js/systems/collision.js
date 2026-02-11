/**
 * Collision System
 * Implements precise collision detection with circular collision for Ghosty
 * and rectangular bounds for walls
 */

import GameConfig from '../config.js';

class CollisionSystem {
  /**
   * Create a new collision system
   * @param {Object} config - Game configuration (defaults to GameConfig)
   */
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
   * @param {Ghost} ghost - The ghost entity
   * @returns {Object} Circle with x, y, radius
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
   * @param {Object} circle - Circle with x, y, radius
   * @param {Object} rect - Rectangle with x, y, width, height
   * @returns {boolean} True if collision detected
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
   * @param {Object} rect1 - First rectangle with x, y, width, height
   * @param {Object} rect2 - Second rectangle with x, y, width, height
   * @returns {boolean} True if rectangles intersect
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
   * @param {Ghost} ghost - The ghost entity
   * @param {Pipe} pipe - The pipe entity
   * @returns {Object} Collision result with collided flag, type, and pipe reference
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
   * @param {Ghost} ghost - The ghost entity
   * @param {number} canvasHeight - Canvas height
   * @returns {Object} Collision result with collided flag and type
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
   * @param {Ghost} ghost - The ghost entity
   * @param {Array<Pipe>} pipes - Array of pipe entities
   * @param {number} canvasHeight - Canvas height
   * @param {boolean} isInvincible - Whether ghost is invincible
   * @returns {Object} Collision result with collided flag and type
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
   * @param {Ghost} ghost - The ghost entity
   * @param {Array<Pipe>} pipes - Array of pipe entities
   * @param {number} canvasHeight - Canvas height
   * @param {boolean} isInvincible - Whether ghost is invincible
   * @returns {Object} Collision result with collided flag and type
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
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   * @param {Ghost} ghost - The ghost entity
   * @param {Array<Pipe>} pipes - Array of pipe entities
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
  
  /**
   * Trigger screen shake effect
   * @param {number} intensity - Shake intensity (default from config)
   * @param {number} duration - Shake duration in frames (default from config)
   */
  triggerScreenShake(intensity = this.config.collision.screenShakeIntensity, 
                     duration = this.config.collision.screenShakeDuration) {
    this.screenShake.active = true;
    this.screenShake.intensity = intensity;
    this.screenShake.duration = duration;
  }
  
  /**
   * Update screen shake effect
   * Should be called each frame
   */
  updateScreenShake() {
    if (!this.screenShake.active) {
      this.screenShake.offsetX = 0;
      this.screenShake.offsetY = 0;
      return;
    }
    
    if (this.screenShake.duration > 0) {
      const progress = this.screenShake.duration / this.config.collision.screenShakeDuration;
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
  
  /**
   * Get current screen shake offset
   * @returns {Object} Offset with x and y properties
   */
  getScreenShakeOffset() {
    return {
      x: this.screenShake.offsetX,
      y: this.screenShake.offsetY
    };
  }
}

export default CollisionSystem;
