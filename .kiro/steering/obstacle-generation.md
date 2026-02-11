---
inclusion: auto
---

# Obstacle Generation and Progression

## Overview

This document defines precise algorithms for obstacle generation, gap sizing, and progressive difficulty increases in Flappy Kiro. These patterns ensure fair, challenging, and predictable gameplay that scales smoothly from beginner to expert levels.

## Core Generation Principles

1. **Fairness**: All obstacles must be passable with skill
2. **Consistency**: Generation follows predictable patterns
3. **Progression**: Difficulty increases smoothly over time
4. **Variety**: Obstacles vary within safe parameters
5. **Performance**: Generation is efficient and frame-rate independent

---

## Pipe Generation System

### Base Generation Parameters

**Configuration Constants**:
```javascript
// ✅ GOOD: Centralized pipe generation config
const PipeGenerationConfig = {
  // Dimensions
  pipeWidth: 52,                    // Fixed pipe width in pixels
  
  // Spacing (horizontal distance between pipes)
  baseSpacing: 350,                 // Starting spacing
  minSpacing: 250,                  // Minimum spacing (hardest)
  maxSpacing: 450,                  // Maximum spacing (easiest)
  
  // Gap size (vertical opening)
  baseGapSize: 140,                 // Starting gap size
  minGapSize: 110,                  // Minimum gap (hardest)
  maxGapSize: 180,                  // Maximum gap (easiest)
  
  // Gap position constraints
  minGapCenterY: 150,               // Minimum gap center from top
  maxGapCenterY: 450,               // Maximum gap center from top
  safeZoneTop: 100,                 // Keep gap away from ceiling
  safeZoneBottom: 100,              // Keep gap away from floor
  
  // Speed
  baseSpeed: 120,                   // Starting speed (px/s)
  minSpeed: 80,                     // Minimum speed
  maxSpeed: 240,                    // Maximum speed
  
  // Progression thresholds
  speedIncreaseInterval: 5,         // Increase speed every N pipes
  spacingDecreaseInterval: 10,      // Decrease spacing every N pipes
  gapDecreaseInterval: 15,          // Decrease gap every N pipes
  
  // Progression amounts
  speedIncrement: 10,               // Speed increase per interval (px/s)
  spacingDecrement: 10,             // Spacing decrease per interval
  gapDecrement: 3                   // Gap decrease per interval
};

Object.freeze(PipeGenerationConfig);
```


### Pipe Generator Core

**Deterministic Pipe Generation**:
```javascript
// ✅ GOOD: Complete pipe generation system
class PipeGenerator {
  constructor(config, canvasHeight) {
    this.config = config;
    this.canvasHeight = canvasHeight;
    
    // Current generation parameters
    this.currentSpeed = config.baseSpeed;
    this.currentSpacing = config.baseSpacing;
    this.currentGapSize = config.baseGapSize;
    
    // Generation state
    this.pipesGenerated = 0;
    this.lastPipeX = 0;
    this.nextPipeX = canvasHeight + 200; // Start off-screen
    
    // Random seed for reproducibility (optional)
    this.seed = Date.now();
    this.rng = this.createRNG(this.seed);
  }
  
  // Simple seeded random number generator
  createRNG(seed) {
    let state = seed;
    return () => {
      state = (state * 1664525 + 1013904223) % 4294967296;
      return state / 4294967296;
    };
  }
  
  shouldGeneratePipe(canvasWidth) {
    // Generate when next pipe position is visible
    return this.nextPipeX <= canvasWidth + this.config.pipeWidth;
  }
  
  generatePipe() {
    // Calculate gap position
    const gapY = this.calculateGapPosition();
    
    // Validate gap position
    const validatedGapY = this.validateGapPosition(gapY);
    
    // Create pipe data
    const pipe = {
      x: this.nextPipeX,
      gapY: validatedGapY,
      gapSize: this.currentGapSize,
      width: this.config.pipeWidth,
      speed: this.currentSpeed,
      scored: false,
      id: this.pipesGenerated
    };
    
    // Update generation state
    this.lastPipeX = this.nextPipeX;
    this.nextPipeX = this.lastPipeX + this.currentSpacing;
    this.pipesGenerated++;
    
    // Update difficulty
    this.updateDifficulty();
    
    return pipe;
  }
  
  calculateGapPosition() {
    // Calculate valid range for gap center
    const minY = this.config.minGapCenterY;
    const maxY = this.config.maxGapCenterY;
    
    // Ensure gap doesn't go off screen
    const halfGap = this.currentGapSize / 2;
    const adjustedMinY = Math.max(minY, halfGap + this.config.safeZoneTop);
    const adjustedMaxY = Math.min(maxY, this.canvasHeight - halfGap - this.config.safeZoneBottom);
    
    // Generate random position within valid range
    const range = adjustedMaxY - adjustedMinY;
    const gapY = adjustedMinY + (this.rng() * range);
    
    return gapY;
  }
  
  validateGapPosition(gapY) {
    const halfGap = this.currentGapSize / 2;
    
    // Ensure top pipe has minimum height
    const minTopHeight = 50;
    const maxTopHeight = this.canvasHeight - this.currentGapSize - 50;
    
    const topHeight = gapY - halfGap;
    
    if (topHeight < minTopHeight) {
      return minTopHeight + halfGap;
    }
    
    if (topHeight > maxTopHeight) {
      return maxTopHeight + halfGap;
    }
    
    return gapY;
  }
  
  updateDifficulty() {
    // Increase speed
    if (this.pipesGenerated > 0 && 
        this.pipesGenerated % this.config.speedIncreaseInterval === 0) {
      this.increaseSpeed();
    }
    
    // Decrease spacing
    if (this.pipesGenerated > 0 && 
        this.pipesGenerated % this.config.spacingDecreaseInterval === 0) {
      this.decreaseSpacing();
    }
    
    // Decrease gap size
    if (this.pipesGenerated > 0 && 
        this.pipesGenerated % this.config.gapDecreaseInterval === 0) {
      this.decreaseGapSize();
    }
  }
  
  increaseSpeed() {
    const newSpeed = this.currentSpeed + this.config.speedIncrement;
    this.currentSpeed = Math.min(newSpeed, this.config.maxSpeed);
    console.log(`Speed increased to ${this.currentSpeed} px/s`);
  }
  
  decreaseSpacing() {
    const newSpacing = this.currentSpacing - this.config.spacingDecrement;
    this.currentSpacing = Math.max(newSpacing, this.config.minSpacing);
    console.log(`Spacing decreased to ${this.currentSpacing} px`);
  }
  
  decreaseGapSize() {
    const newGapSize = this.currentGapSize - this.config.gapDecrement;
    this.currentGapSize = Math.max(newGapSize, this.config.minGapSize);
    console.log(`Gap size decreased to ${this.currentGapSize} px`);
  }
  
  // Getters
  getCurrentSpeed() {
    return this.currentSpeed;
  }
  
  getCurrentSpacing() {
    return this.currentSpacing;
  }
  
  getCurrentGapSize() {
    return this.currentGapSize;
  }
  
  getPipesGenerated() {
    return this.pipesGenerated;
  }
  
  // Reset
  reset() {
    this.currentSpeed = this.config.baseSpeed;
    this.currentSpacing = this.config.baseSpacing;
    this.currentGapSize = this.config.baseGapSize;
    this.pipesGenerated = 0;
    this.lastPipeX = 0;
    this.nextPipeX = this.canvasHeight + 200;
  }
}
```


---

## Advanced Generation Patterns

### Pattern-Based Generation

**Predefined Pipe Patterns**:
```javascript
// ✅ GOOD: Pattern-based pipe generation for variety
const PipePatterns = {
  WAVE: 'wave',           // Sine wave pattern
  STAIRS_UP: 'stairs_up', // Ascending stairs
  STAIRS_DOWN: 'stairs_down', // Descending stairs
  RANDOM: 'random',       // Pure random
  ZIGZAG: 'zigzag'        // Alternating high/low
};

class PatternGenerator {
  constructor(config, canvasHeight) {
    this.config = config;
    this.canvasHeight = canvasHeight;
    this.currentPattern = PipePatterns.RANDOM;
    this.patternProgress = 0;
    this.patternLength = 5; // Pipes per pattern
  }
  
  generateWithPattern(pattern, index) {
    switch (pattern) {
      case PipePatterns.WAVE:
        return this.generateWavePattern(index);
      case PipePatterns.STAIRS_UP:
        return this.generateStairsPattern(index, 1);
      case PipePatterns.STAIRS_DOWN:
        return this.generateStairsPattern(index, -1);
      case PipePatterns.ZIGZAG:
        return this.generateZigzagPattern(index);
      default:
        return this.generateRandomPattern();
    }
  }
  
  generateWavePattern(index) {
    // Sine wave: smooth up and down
    const amplitude = 100; // Vertical range
    const frequency = 0.5; // Wave frequency
    const centerY = this.canvasHeight / 2;
    
    const gapY = centerY + Math.sin(index * frequency) * amplitude;
    return this.clampGapPosition(gapY);
  }
  
  generateStairsPattern(index, direction) {
    // Stairs: gradual ascent or descent
    const stepSize = 30; // Vertical step
    const centerY = this.canvasHeight / 2;
    const maxSteps = 4;
    
    const step = (index % maxSteps) * stepSize * direction;
    const gapY = centerY + step;
    
    return this.clampGapPosition(gapY);
  }
  
  generateZigzagPattern(index) {
    // Zigzag: alternating high and low
    const highY = this.config.minGapCenterY + 50;
    const lowY = this.config.maxGapCenterY - 50;
    
    return index % 2 === 0 ? highY : lowY;
  }
  
  generateRandomPattern() {
    const minY = this.config.minGapCenterY;
    const maxY = this.config.maxGapCenterY;
    const range = maxY - minY;
    
    return minY + Math.random() * range;
  }
  
  clampGapPosition(gapY) {
    const halfGap = this.config.baseGapSize / 2;
    const minY = halfGap + this.config.safeZoneTop;
    const maxY = this.canvasHeight - halfGap - this.config.safeZoneBottom;
    
    return Math.max(minY, Math.min(maxY, gapY));
  }
  
  selectNextPattern() {
    // Randomly select next pattern
    const patterns = Object.values(PipePatterns);
    const randomIndex = Math.floor(Math.random() * patterns.length);
    this.currentPattern = patterns[randomIndex];
    this.patternProgress = 0;
  }
}
```


### Difficulty Curves

**Progressive Difficulty Scaling**:
```javascript
// ✅ GOOD: Smooth difficulty curves
class DifficultyC urve {
  constructor(config) {
    this.config = config;
  }
  
  // Linear curve: steady increase
  linear(progress, min, max) {
    return min + (max - min) * progress;
  }
  
  // Exponential curve: slow start, rapid increase
  exponential(progress, min, max, exponent = 2) {
    const scaledProgress = Math.pow(progress, exponent);
    return min + (max - min) * scaledProgress;
  }
  
  // Logarithmic curve: rapid start, slow increase
  logarithmic(progress, min, max) {
    const scaledProgress = Math.log(1 + progress * 9) / Math.log(10);
    return min + (max - min) * scaledProgress;
  }
  
  // S-curve: slow start, rapid middle, slow end
  sigmoid(progress, min, max) {
    const x = (progress - 0.5) * 10;
    const scaledProgress = 1 / (1 + Math.exp(-x));
    return min + (max - min) * scaledProgress;
  }
  
  // Apply curve to speed based on score
  getSpeedForScore(score) {
    const maxScore = 60; // Max difficulty at score 60
    const progress = Math.min(score / maxScore, 1.0);
    
    return this.exponential(
      progress,
      this.config.baseSpeed,
      this.config.maxSpeed,
      1.5
    );
  }
  
  // Apply curve to spacing based on score
  getSpacingForScore(score) {
    const maxScore = 60;
    const progress = Math.min(score / maxScore, 1.0);
    
    return this.linear(
      progress,
      this.config.baseSpacing,
      this.config.minSpacing
    );
  }
  
  // Apply curve to gap size based on score
  getGapSizeForScore(score) {
    const maxScore = 60;
    const progress = Math.min(score / maxScore, 1.0);
    
    return this.logarithmic(
      progress,
      this.config.baseGapSize,
      this.config.minGapSize
    );
  }
}
```

---

## Gap Sizing Algorithms

### Dynamic Gap Sizing

**Adaptive Gap Size Based on Difficulty**:
```javascript
// ✅ GOOD: Dynamic gap sizing system
class GapSizeManager {
  constructor(config) {
    this.config = config;
    this.baseGapSize = config.baseGapSize;
    this.minGapSize = config.minGapSize;
    this.maxGapSize = config.maxGapSize;
    this.currentGapSize = this.baseGapSize;
  }
  
  calculateGapSize(score, playerSkill = 'normal') {
    // Base calculation from score
    const scoreProgress = Math.min(score / 60, 1.0);
    let gapSize = this.baseGapSize - (scoreProgress * (this.baseGapSize - this.minGapSize));
    
    // Adjust for player skill
    const skillMultipliers = {
      beginner: 1.2,  // 20% larger gaps
      normal: 1.0,    // Standard gaps
      advanced: 0.9,  // 10% smaller gaps
      expert: 0.8     // 20% smaller gaps
    };
    
    const multiplier = skillMultipliers[playerSkill] || 1.0;
    gapSize *= multiplier;
    
    // Clamp to valid range
    return Math.max(this.minGapSize, Math.min(this.maxGapSize, gapSize));
  }
  
  // Variable gap sizes for variety
  getRandomizedGapSize(baseSize, variance = 0.1) {
    const minVariance = baseSize * (1 - variance);
    const maxVariance = baseSize * (1 + variance);
    
    const randomSize = minVariance + Math.random() * (maxVariance - minVariance);
    
    return Math.max(this.minGapSize, Math.min(this.maxGapSize, randomSize));
  }
  
  // Ensure gap is passable
  validateGapSize(gapSize, pipeSpeed, ghostJumpVelocity) {
    // Calculate minimum gap needed to pass
    const timeToTraverse = this.config.pipeWidth / pipeSpeed;
    const verticalRange = Math.abs(ghostJumpVelocity) * timeToTraverse;
    const minPassableGap = verticalRange * 1.5; // 50% safety margin
    
    return Math.max(gapSize, minPassableGap);
  }
}
```


### Player Skill Adaptation

**Adjust Gap Size Based on Performance**:
```javascript
// ✅ GOOD: Adaptive gap sizing based on player performance
class AdaptiveGapManager extends GapSizeManager {
  constructor(config) {
    super(config);
    this.recentAttempts = [];
    this.maxAttempts = 10;
    this.adaptiveEnabled = true;
  }
  
  recordAttempt(score, collisionType) {
    this.recentAttempts.push({
      score,
      collisionType,
      timestamp: Date.now()
    });
    
    if (this.recentAttempts.length > this.maxAttempts) {
      this.recentAttempts.shift();
    }
    
    if (this.adaptiveEnabled && this.recentAttempts.length >= 5) {
      this.adjustDifficulty();
    }
  }
  
  adjustDifficulty() {
    const avgScore = this.getAverageScore();
    const pipeCollisionRate = this.getPipeCollisionRate();
    
    // Player struggling (low scores, many pipe collisions)
    if (avgScore < 3 && pipeCollisionRate > 0.7) {
      this.currentGapSize = Math.min(
        this.currentGapSize + 5,
        this.maxGapSize
      );
      console.log('Gap size increased (player struggling)');
    }
    // Player excelling (high scores, few collisions)
    else if (avgScore > 15 && pipeCollisionRate < 0.3) {
      this.currentGapSize = Math.max(
        this.currentGapSize - 3,
        this.minGapSize
      );
      console.log('Gap size decreased (player excelling)');
    }
  }
  
  getAverageScore() {
    if (this.recentAttempts.length === 0) return 0;
    const sum = this.recentAttempts.reduce((acc, attempt) => acc + attempt.score, 0);
    return sum / this.recentAttempts.length;
  }
  
  getPipeCollisionRate() {
    if (this.recentAttempts.length === 0) return 0;
    const pipeCollisions = this.recentAttempts.filter(
      attempt => attempt.collisionType === 'pipe_top' || attempt.collisionType === 'pipe_bottom'
    ).length;
    return pipeCollisions / this.recentAttempts.length;
  }
  
  setAdaptiveEnabled(enabled) {
    this.adaptiveEnabled = enabled;
  }
}
```

---

## Progressive Speed System

### Speed Progression

**Smooth Speed Increases**:
```javascript
// ✅ GOOD: Progressive speed system
class SpeedManager {
  constructor(config) {
    this.config = config;
    this.baseSpeed = config.baseSpeed;
    this.minSpeed = config.minSpeed || 80;
    this.maxSpeed = config.maxSpeed;
    this.currentSpeed = this.baseSpeed;
    
    // Progression settings
    this.speedIncreaseInterval = config.speedIncreaseInterval || 5;
    this.speedIncrement = config.speedIncrement || 10;
  }
  
  updateSpeed(score) {
    // Increase speed at intervals
    if (score > 0 && score % this.speedIncreaseInterval === 0) {
      this.increaseSpeed();
    }
  }
  
  increaseSpeed() {
    const newSpeed = this.currentSpeed + this.speedIncrement;
    this.currentSpeed = Math.min(newSpeed, this.maxSpeed);
    
    console.log(`Speed increased to ${this.currentSpeed} px/s`);
  }
  
  // Get speed with curve
  getSpeedForScore(score, curve = 'linear') {
    const maxScore = 60;
    const progress = Math.min(score / maxScore, 1.0);
    
    let scaledProgress;
    switch (curve) {
      case 'exponential':
        scaledProgress = Math.pow(progress, 1.5);
        break;
      case 'logarithmic':
        scaledProgress = Math.log(1 + progress * 9) / Math.log(10);
        break;
      default:
        scaledProgress = progress;
    }
    
    return this.baseSpeed + (this.maxSpeed - this.baseSpeed) * scaledProgress;
  }
  
  reset() {
    this.currentSpeed = this.baseSpeed;
  }
  
  getCurrentSpeed() {
    return this.currentSpeed;
  }
}
```


### Acceleration Patterns

**Smooth Speed Transitions**:
```javascript
// ✅ GOOD: Smooth acceleration system
class AccelerationManager {
  constructor(config) {
    this.config = config;
    this.currentSpeed = config.baseSpeed;
    this.targetSpeed = config.baseSpeed;
    this.accelerationRate = 20; // px/s per second
    this.isAccelerating = false;
  }
  
  setTargetSpeed(speed) {
    this.targetSpeed = Math.max(
      this.config.minSpeed,
      Math.min(speed, this.config.maxSpeed)
    );
    this.isAccelerating = this.currentSpeed !== this.targetSpeed;
  }
  
  update(deltaTime) {
    if (!this.isAccelerating) return;
    
    const difference = this.targetSpeed - this.currentSpeed;
    
    if (Math.abs(difference) < 0.1) {
      this.currentSpeed = this.targetSpeed;
      this.isAccelerating = false;
      return;
    }
    
    // Smooth acceleration/deceleration
    const change = this.accelerationRate * deltaTime;
    
    if (difference > 0) {
      this.currentSpeed = Math.min(
        this.currentSpeed + change,
        this.targetSpeed
      );
    } else {
      this.currentSpeed = Math.max(
        this.currentSpeed - change,
        this.targetSpeed
      );
    }
  }
  
  getCurrentSpeed() {
    return this.currentSpeed;
  }
  
  isAtTargetSpeed() {
    return !this.isAccelerating;
  }
}
```


---

## Pipe Pool Management

### Object Pooling for Performance

**Efficient Pipe Reuse**:
```javascript
// ✅ GOOD: Pipe object pool for performance
class PipePool {
  constructor(config, canvasHeight, poolSize = 10) {
    this.config = config;
    this.canvasHeight = canvasHeight;
    this.pool = [];
    this.active = [];
    
    // Pre-allocate pipes
    for (let i = 0; i < poolSize; i++) {
      this.pool.push(this.createPipe());
    }
  }
  
  createPipe() {
    return {
      x: 0,
      gapY: 0,
      gapSize: 0,
      width: this.config.pipeWidth,
      speed: 0,
      scored: false,
      id: 0,
      active: false
    };
  }
  
  acquire(x, gapY, gapSize, speed, id) {
    let pipe;
    
    // Reuse from pool if available
    if (this.pool.length > 0) {
      pipe = this.pool.pop();
    } else {
      // Create new if pool empty
      pipe = this.createPipe();
    }
    
    // Initialize pipe
    pipe.x = x;
    pipe.gapY = gapY;
    pipe.gapSize = gapSize;
    pipe.speed = speed;
    pipe.id = id;
    pipe.scored = false;
    pipe.active = true;
    
    this.active.push(pipe);
    return pipe;
  }
  
  release(pipe) {
    // Remove from active
    const index = this.active.indexOf(pipe);
    if (index !== -1) {
      this.active.splice(index, 1);
    }
    
    // Reset and return to pool
    pipe.active = false;
    this.pool.push(pipe);
  }
  
  releaseAll() {
    while (this.active.length > 0) {
      this.release(this.active[0]);
    }
  }
  
  getActive() {
    return this.active;
  }
  
  getPoolSize() {
    return this.pool.length;
  }
  
  getActiveCount() {
    return this.active.length;
  }
}
```

---

## Generation Validation

### Ensure Fair Generation

**Validate Pipe Configurations**:
```javascript
// ✅ GOOD: Validation system for pipe generation
class PipeValidator {
  constructor(config, canvasHeight) {
    this.config = config;
    this.canvasHeight = canvasHeight;
  }
  
  validatePipe(pipe) {
    const errors = [];
    
    // Validate gap position
    if (!this.isValidGapPosition(pipe.gapY, pipe.gapSize)) {
      errors.push('Invalid gap position');
    }
    
    // Validate gap size
    if (!this.isValidGapSize(pipe.gapSize)) {
      errors.push('Invalid gap size');
    }
    
    // Validate speed
    if (!this.isValidSpeed(pipe.speed)) {
      errors.push('Invalid speed');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  isValidGapPosition(gapY, gapSize) {
    const halfGap = gapSize / 2;
    const topEdge = gapY - halfGap;
    const bottomEdge = gapY + halfGap;
    
    // Check if gap is within canvas bounds
    if (topEdge < this.config.safeZoneTop) return false;
    if (bottomEdge > this.canvasHeight - this.config.safeZoneBottom) return false;
    
    // Check minimum pipe heights
    const minPipeHeight = 50;
    if (topEdge < minPipeHeight) return false;
    if (this.canvasHeight - bottomEdge < minPipeHeight) return false;
    
    return true;
  }
  
  isValidGapSize(gapSize) {
    return gapSize >= this.config.minGapSize && 
           gapSize <= this.config.maxGapSize;
  }
  
  isValidSpeed(speed) {
    return speed >= this.config.minSpeed && 
           speed <= this.config.maxSpeed;
  }
  
  isPassable(pipe, ghostRadius, ghostJumpVelocity) {
    // Check if gap is large enough for ghost to pass
    const minPassableGap = ghostRadius * 2 + 10; // 10px safety margin
    
    if (pipe.gapSize < minPassableGap) {
      return false;
    }
    
    // Check if ghost has enough time to navigate
    const timeToTraverse = pipe.width / pipe.speed;
    const maxVerticalMovement = Math.abs(ghostJumpVelocity) * timeToTraverse;
    
    return pipe.gapSize >= maxVerticalMovement * 0.5;
  }
}
```


---

## Testing Patterns

### Unit Tests for Generation

**Test Pipe Generation Logic**:
```javascript
// ✅ GOOD: Comprehensive generation tests
describe('PipeGenerator', () => {
  let generator;
  const config = PipeGenerationConfig;
  const canvasHeight = 600;
  
  beforeEach(() => {
    generator = new PipeGenerator(config, canvasHeight);
  });
  
  test('should generate pipe with valid gap position', () => {
    const pipe = generator.generatePipe();
    
    const halfGap = pipe.gapSize / 2;
    const topEdge = pipe.gapY - halfGap;
    const bottomEdge = pipe.gapY + halfGap;
    
    expect(topEdge).toBeGreaterThanOrEqual(config.safeZoneTop);
    expect(bottomEdge).toBeLessThanOrEqual(canvasHeight - config.safeZoneBottom);
  });
  
  test('should increase speed at intervals', () => {
    const initialSpeed = generator.getCurrentSpeed();
    
    // Generate pipes to trigger speed increase
    for (let i = 0; i < config.speedIncreaseInterval; i++) {
      generator.generatePipe();
    }
    
    expect(generator.getCurrentSpeed()).toBeGreaterThan(initialSpeed);
  });
  
  test('should not exceed max speed', () => {
    // Generate many pipes
    for (let i = 0; i < 100; i++) {
      generator.generatePipe();
    }
    
    expect(generator.getCurrentSpeed()).toBeLessThanOrEqual(config.maxSpeed);
  });
  
  test('should maintain minimum spacing', () => {
    const pipe1 = generator.generatePipe();
    const pipe2 = generator.generatePipe();
    
    const spacing = pipe2.x - pipe1.x;
    expect(spacing).toBeGreaterThanOrEqual(config.minSpacing);
  });
});
```


### Property-Based Tests

**Test Generation Properties**:
```javascript
// ✅ GOOD: Property-based tests for generation
describe('PipeGenerator Properties', () => {
  test('all generated pipes should be passable', () => {
    const generator = new PipeGenerator(PipeGenerationConfig, 600);
    const validator = new PipeValidator(PipeGenerationConfig, 600);
    
    // Generate 100 pipes
    for (let i = 0; i < 100; i++) {
      const pipe = generator.generatePipe();
      const validation = validator.validatePipe(pipe);
      
      expect(validation.valid).toBe(true);
      expect(validator.isPassable(pipe, 12, -300)).toBe(true);
    }
  });
  
  test('difficulty should increase monotonically', () => {
    const generator = new PipeGenerator(PipeGenerationConfig, 600);
    let previousSpeed = generator.getCurrentSpeed();
    
    for (let i = 0; i < 50; i++) {
      generator.generatePipe();
      const currentSpeed = generator.getCurrentSpeed();
      
      // Speed should never decrease
      expect(currentSpeed).toBeGreaterThanOrEqual(previousSpeed);
      previousSpeed = currentSpeed;
    }
  });
});
```

---

## Usage Examples

### Basic Integration

**Using Pipe Generator in Game**:
```javascript
// ✅ GOOD: Complete pipe generation integration
class Game {
  constructor(canvas, config) {
    this.canvas = canvas;
    this.config = config;
    
    // Initialize pipe generator
    this.pipeGenerator = new PipeGenerator(
      PipeGenerationConfig,
      canvas.height
    );
    
    // Initialize pipe pool
    this.pipePool = new PipePool(
      PipeGenerationConfig,
      canvas.height,
      10
    );
    
    // Initialize validator
    this.pipeValidator = new PipeValidator(
      PipeGenerationConfig,
      canvas.height
    );
    
    this.pipes = [];
  }
  
  update(deltaTime) {
    // Generate new pipes if needed
    if (this.pipeGenerator.shouldGeneratePipe(this.canvas.width)) {
      this.spawnPipe();
    }
    
    // Update existing pipes
    this.updatePipes(deltaTime);
    
    // Remove off-screen pipes
    this.removeOffScreenPipes();
  }
  
  spawnPipe() {
    // Generate pipe data
    const pipeData = this.pipeGenerator.generatePipe();
    
    // Validate pipe
    const validation = this.pipeValidator.validatePipe(pipeData);
    if (!validation.valid) {
      console.error('Invalid pipe generated:', validation.errors);
      return;
    }
    
    // Acquire pipe from pool
    const pipe = this.pipePool.acquire(
      pipeData.x,
      pipeData.gapY,
      pipeData.gapSize,
      pipeData.speed,
      pipeData.id
    );
    
    this.pipes.push(pipe);
  }
  
  updatePipes(deltaTime) {
    for (const pipe of this.pipes) {
      pipe.x -= pipe.speed * deltaTime;
    }
  }
  
  removeOffScreenPipes() {
    for (let i = this.pipes.length - 1; i >= 0; i--) {
      const pipe = this.pipes[i];
      
      if (pipe.x + pipe.width < 0) {
        this.pipes.splice(i, 1);
        this.pipePool.release(pipe);
      }
    }
  }
  
  reset() {
    // Release all pipes
    this.pipePool.releaseAll();
    this.pipes = [];
    
    // Reset generator
    this.pipeGenerator.reset();
  }
}
```


### Advanced Integration with Patterns

**Using Pattern-Based Generation**:
```javascript
// ✅ GOOD: Pattern-based pipe generation
class AdvancedGame extends Game {
  constructor(canvas, config) {
    super(canvas, config);
    
    // Add pattern generator
    this.patternGenerator = new PatternGenerator(
      PipeGenerationConfig,
      canvas.height
    );
    
    // Add adaptive gap manager
    this.gapManager = new AdaptiveGapManager(PipeGenerationConfig);
    
    // Add acceleration manager
    this.accelerationManager = new AccelerationManager(PipeGenerationConfig);
    
    this.usePatterns = true;
    this.patternIndex = 0;
  }
  
  spawnPipe() {
    let gapY;
    
    if (this.usePatterns) {
      // Use pattern-based generation
      gapY = this.patternGenerator.generateWithPattern(
        this.patternGenerator.currentPattern,
        this.patternIndex
      );
      this.patternIndex++;
      
      // Switch pattern every 5 pipes
      if (this.patternIndex % 5 === 0) {
        this.patternGenerator.selectNextPattern();
      }
    } else {
      // Use random generation
      gapY = this.pipeGenerator.calculateGapPosition();
    }
    
    // Get adaptive gap size
    const gapSize = this.gapManager.calculateGapSize(
      this.score,
      this.playerSkillLevel
    );
    
    // Get current speed
    const speed = this.accelerationManager.getCurrentSpeed();
    
    // Create pipe
    const pipe = this.pipePool.acquire(
      this.pipeGenerator.nextPipeX,
      gapY,
      gapSize,
      speed,
      this.pipeGenerator.pipesGenerated
    );
    
    this.pipes.push(pipe);
    this.pipeGenerator.pipesGenerated++;
  }
  
  onGameOver(score, collisionType) {
    // Record attempt for adaptive difficulty
    this.gapManager.recordAttempt(score, collisionType);
  }
}
```


---

## Best Practices Checklist

### Generation Rules
- [ ] Always validate generated pipe positions
- [ ] Ensure all pipes are passable by the player
- [ ] Maintain consistent spacing between pipes
- [ ] Clamp all values to valid ranges
- [ ] Use deterministic generation for reproducibility

### Difficulty Progression
- [ ] Start with comfortable base difficulty
- [ ] Increase difficulty gradually and predictably
- [ ] Cap maximum difficulty to prevent impossibility
- [ ] Test difficulty curve thoroughly
- [ ] Consider player skill level in adjustments

### Performance
- [ ] Use object pooling for pipe instances
- [ ] Pre-calculate pipe heights and positions
- [ ] Avoid creating new objects in update loop
- [ ] Limit active pipe count
- [ ] Clean up off-screen pipes immediately

### Fairness
- [ ] Ensure minimum gap size is passable
- [ ] Validate gap positions don't clip screen edges
- [ ] Maintain minimum pipe heights (top and bottom)
- [ ] Test with various player skill levels
- [ ] Provide visual feedback for difficulty changes

### Testing
- [ ] Unit test all generation algorithms
- [ ] Property test for fairness and passability
- [ ] Test edge cases (min/max values)
- [ ] Validate difficulty progression
- [ ] Test pattern generation variety

---

## References

- **Game Config**: `kiro-introduction-starter-kit/game-config.json`
- **Requirements**: `.kiro/specs/flappy-kiro/requirements.md`
- **Design**: `.kiro/specs/flappy-kiro/design.md`
- **Game Mechanics**: `.kiro/steering/game-mechanics.md`
- **Domain Logic**: `.kiro/steering/flappy-kiro-domain.md`
