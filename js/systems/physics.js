/**
 * PhysicsEngine
 * Handles all physics calculations and constants
 * Requirements: 1.2, 1.1.1, 1.1.3, 1.1.4, 1.1.5, 2.1.4, 2.1.8, 2.1.9
 */

import GameConfig from '../config.js';

class PhysicsEngine {
  constructor(config = GameConfig) {
    this.config = config;
    
    // Physics constants from config
    this.gravity = config.physics.gravity;
    this.jumpVelocity = config.physics.jumpVelocity;
    this.terminalVelocity = config.physics.terminalVelocity;
    this.maxUpwardVelocity = config.physics.maxUpwardVelocity;
    
    // Pipe generation constants from config
    this.pipeSpacing = config.pipes.spacing;
    this.gapSize = config.pipes.gapSize;
    this.minGapY = config.pipes.minGapY;
    this.maxGapY = config.pipes.maxGapY;
    
    // Pipe movement from config
    this.basePipeSpeed = config.pipes.baseSpeed;
    this.pipeSpeed = this.basePipeSpeed;
    this.maxPipeSpeed = config.pipes.maxSpeed;
    this.speedIncreaseThreshold = config.pipes.speedIncreaseThreshold;
    this.speedIncrement = config.pipes.speedIncrement;
  }
  
  /**
   * Apply gravity to an entity
   * Requirements: 1.2, 1.1.3, 1.1.4, 1.1.5
   * @param {Object} entity - Entity with velocity property
   * @param {number} deltaTime - Time elapsed since last frame
   */
  applyGravity(entity, deltaTime) {
    entity.velocity += this.gravity * deltaTime;
    entity.velocity = Math.min(entity.velocity, this.terminalVelocity);
    entity.velocity = Math.max(entity.velocity, this.maxUpwardVelocity);
  }
  
  /**
   * Update entity position based on velocity
   * Requirements: 1.1.1
   * @param {Object} entity - Entity with y and velocity properties
   * @param {number} deltaTime - Time elapsed since last frame
   */
  updatePosition(entity, deltaTime) {
    entity.y += entity.velocity * deltaTime;
  }
  
  /**
   * Generate a random gap position within valid range
   * Requirements: 2.1.4
   * @returns {number} Random Y position for pipe gap center
   */
  generateGapPosition() {
    return Math.random() * (this.maxGapY - this.minGapY) + this.minGapY;
  }
  
  /**
   * Increase difficulty by increasing pipe speed at score thresholds
   * Requirements: 2.1.8, 2.1.9
   * @param {number} score - Current game score
   */
  increaseDifficulty(score) {
    if (score > 0 && score % this.speedIncreaseThreshold === 0) {
      this.pipeSpeed = Math.min(
        this.pipeSpeed + this.speedIncrement,
        this.maxPipeSpeed
      );
    }
  }
  
  /**
   * Reset difficulty to base speed
   * Requirements: 2.1.8
   */
  resetDifficulty() {
    this.pipeSpeed = this.basePipeSpeed;
  }
}

export default PhysicsEngine;
