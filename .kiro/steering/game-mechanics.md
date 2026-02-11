---
inclusion: auto
---

# Game Mechanics for Flappy Kiro

## Overview

This document defines the specific game mechanics, physics constants, movement algorithms, and collision detection patterns for Flappy Kiro. All values are based on the game configuration and requirements.

## Physics Constants

### Core Physics Values

**From game-config.json**:
```javascript
const PHYSICS = {
  // Gravity: 800 pixels per second squared
  gravity: 800,
  
  // Jump velocity: -300 pixels per second (negative = upward)
  jumpVelocity: -300,
  
  // Terminal velocity: 600 pixels per second (maximum fall speed)
  terminalVelocity: 600,
  
  // Maximum upward velocity: -600 pixels per second
  maxUpwardVelocity: -600
};
```

### Physics Implementation

**Apply Gravity with Delta Time**:
```javascript
// ✅ GOOD: Frame-rate independent gravity
class Ghost {
  update(deltaTime) {
    // Apply gravity (pixels per second squared)
    this.velocity += 800 * deltaTime;
    
    // Clamp to terminal velocity
    this.velocity = Math.min(this.velocity, 600);
    this.velocity = Math.max(this.velocity, -600);
    
    // Update position (pixels per second)
    this.y += this.velocity * deltaTime;
  }
}

// Example calculations:
// At 120 FPS: deltaTime ≈ 0.0083s
// Gravity per frame: 800 * 0.0083 = 6.64 px/s added to velocity
// At 60 FPS: deltaTime ≈ 0.0167s
// Gravity per frame: 800 * 0.0167 = 13.36 px/s added to velocity
// Movement is consistent regardless of frame rate!
```

### Jump Mechanics

**Instant Velocity Change**:
```javascript
// ✅ GOOD: Jump sets velocity immediately
class Ghost {
  jump() {
    // Set velocity to jump velocity (instant change)
    this.velocity = -300; // Upward
    
    // Optional: Add visual feedback
    this.rotation = -25; // Tilt nose up
  }
}

// Jump behavior:
// - Instant velocity change (not gradual)
// - Overrides current velocity (even if falling)
// - Gravity immediately starts reducing upward velocity
// - Peak height reached when velocity = 0
// - Then gravity accelerates downward
```

### Velocity Clamping

**Prevent Extreme Speeds**:
```javascript
// ✅ GOOD: Clamp velocity to prevent physics explosions
function clampVelocity(velocity) {
  // Clamp downward velocity (falling)
  if (velocity > 600) {
    return 600;
  }
  
  // Clamp upward velocity (jumping)
  if (velocity < -600) {
    return -600;
  }
  
  return velocity;
}

// Why clamp?
// - Prevents ghost from moving too fast
// - Keeps collision detection accurate
// - Maintains playable difficulty
// - Prevents tunneling through pipes
```

---

## Movement Algorithms

### Ghost Movement

**Complete Movement System**:
```javascript
class Ghost {
  constructor(x, y, config) {
    this.x = x;                    // Fixed horizontal position
    this.y = y;                    // Vertical position (changes)
    this.velocity = 0;             // Vertical velocity (px/s)
    this.rotation = 0;             // Visual rotation (-25 to 25 degrees)
    
    this.config = config;
    this.width = config.ghost.width;
    this.height = config.ghost.height;
  }
  
  update(deltaTime) {
    // 1. Apply gravity
    this.velocity += this.config.physics.gravity * deltaTime;
    
    // 2. Clamp velocity
    this.velocity = Math.min(
      this.velocity,
      this.config.physics.terminalVelocity
    );
    this.velocity = Math.max(
      this.velocity,
      this.config.physics.maxUpwardVelocity
    );
    
    // 3. Update position
    this.y += this.velocity * deltaTime;
    
    // 4. Update rotation for visual effect
    this.updateRotation();
  }
  
  updateRotation() {
    // Rotation based on velocity
    // Falling: nose down (positive rotation)
    // Rising: nose up (negative rotation)
    this.rotation = this.velocity * 0.05; // Scale factor
    
    // Clamp rotation to prevent extreme angles
    this.rotation = Math.max(-25, Math.min(25, this.rotation));
  }
  
  jump() {
    this.velocity = this.config.physics.jumpVelocity;
  }
}
```

### Pipe Movement

**Horizontal Scrolling**:
```javascript
class Pipe {
  constructor(x, gapY, gapSize, canvasHeight, config) {
    this.x = x;                    // Horizontal position
    this.gapY = gapY;              // Gap center Y
    this.gapSize = gapSize;        // Gap height
    this.width = config.pipes.width;
    this.scored = false;
    
    // Pre-calculate pipe heights
    this.topHeight = gapY - (gapSize / 2);
    this.bottomY = gapY + (gapSize / 2);
    this.bottomHeight = canvasHeight - this.bottomY;
  }
  
  update(deltaTime, speed) {
    // Move left at current speed (pixels per second)
    this.x -= speed * deltaTime;
  }
  
  isOffScreen() {
    // Pipe is off-screen when right edge is past left edge
    return this.x + this.width < 0;
  }
  
  hasPassedGhost(ghostX) {
    // Pipe passed when right edge is past ghost's left edge
    return !this.scored && this.x + this.width < ghostX;
  }
}

// Pipe speed progression:
// Base speed: 120 px/s
// Speed increases every 5 points by 10 px/s
// Max speed: 240 px/s
// At 120 FPS: 120 * 0.0083 = 1 pixel per frame
// At 240 px/s: 240 * 0.0083 = 2 pixels per frame
```

### Difficulty Progression

**Speed Increase Algorithm**:
```javascript
class PhysicsEngine {
  constructor(config) {
    this.basePipeSpeed = config.pipes.baseSpeed;        // 120 px/s
    this.pipeSpeed = this.basePipeSpeed;
    this.maxPipeSpeed = config.pipes.maxSpeed;          // 240 px/s
    this.speedIncreaseThreshold = config.pipes.speedIncreaseThreshold; // 5
    this.speedIncrement = config.pipes.speedIncrement;  // 10 px/s
  }
  
  increaseDifficulty(score) {
    // Increase speed every 5 points
    if (score > 0 && score % this.speedIncreaseThreshold === 0) {
      this.pipeSpeed = Math.min(
        this.pipeSpeed + this.speedIncrement,
        this.maxPipeSpeed
      );
      
      console.log(`Speed increased to ${this.pipeSpeed} px/s at score ${score}`);
    }
  }
  
  resetDifficulty() {
    this.pipeSpeed = this.basePipeSpeed;
  }
}

// Difficulty curve:
// Score 0-4:   120 px/s
// Score 5-9:   130 px/s
// Score 10-14: 140 px/s
// Score 15-19: 150 px/s
// ...
// Score 60+:   240 px/s (max)
```

---

## Collision Detection

### Ghost Hitbox

**Circular Collision Bounds**:
```javascript
class Ghost {
  getHitbox() {
    // Rectangular hitbox (for reference)
    return {
      x: this.x + 3,              // Offset from sprite edge
      y: this.y + 2,              // Offset from sprite edge
      width: 28,                  // Smaller than sprite (34px)
      height: 20                  // Smaller than sprite (24px)
    };
  }
  
  getCircle() {
    // Circular collision (more forgiving)
    const hitbox = this.getHitbox();
    return {
      x: hitbox.x + hitbox.width / 2,   // Center X
      y: hitbox.y + hitbox.height / 2,  // Center Y
      radius: 12                         // 12 pixel radius
    };
  }
}

// Why circular collision?
// - More forgiving for player
// - Feels fair (no corner collisions)
// - Matches visual appearance of ghost
// - Standard for Flappy Bird clones
```

### Pipe Hitbox

**Rectangular Collision Bounds**:
```javascript
class Pipe {
  getTopHitbox() {
    return {
      x: this.x,
      y: 0,
      width: 52,                  // Pipe width
      height: this.topHeight      // From top to gap
    };
  }
  
  getBottomHitbox() {
    return {
      x: this.x,
      y: this.bottomY,            // Gap bottom to ground
      width: 52,
      height: this.bottomHeight
    };
  }
}
```

### Circle-Rectangle Collision

**Precise Collision Algorithm**:
```javascript
function checkCircleRectCollision(circle, rect) {
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
  
  // Check if distance is less than radius
  return distanceSquared < (circle.radius * circle.radius);
}

// How it works:
// 1. Find closest point on rectangle to circle center
// 2. Calculate distance from circle center to that point
// 3. If distance < radius, collision detected
// 4. Use squared distance to avoid expensive sqrt()
```

### Boundary Collision

**Screen Edge Detection**:
```javascript
class CollisionSystem {
  checkBoundaryCollision(ghost, canvasHeight) {
    const circle = ghost.getCircle();
    
    // Ceiling collision (top of screen)
    if (circle.y - circle.radius <= 0) {
      return {
        collided: true,
        type: 'ceiling',
        position: { x: circle.x, y: 0 }
      };
    }
    
    // Ground collision (bottom of screen)
    if (circle.y + circle.radius >= canvasHeight) {
      return {
        collided: true,
        type: 'ground',
        position: { x: circle.x, y: canvasHeight }
      };
    }
    
    return { collided: false };
  }
}

// Boundary values:
// Canvas height: 600px
// Ceiling: y = 0
// Ground: y = 600
// Ghost radius: 12px
// Collision when: y - 12 <= 0 or y + 12 >= 600
```

### Complete Collision Check

**Master Collision Algorithm**:
```javascript
class CollisionSystem {
  checkAllCollisions(ghost, pipes, canvasHeight, isInvincible) {
    // Skip if invincible
    if (isInvincible) {
      return { collided: false, type: 'invincible' };
    }
    
    // 1. Check boundary collisions first (always present)
    const boundaryCollision = this.checkBoundaryCollision(ghost, canvasHeight);
    if (boundaryCollision.collided) {
      return boundaryCollision;
    }
    
    // 2. Get ghost circle for pipe checks
    const ghostCircle = ghost.getCircle();
    
    // 3. Check pipe collisions (only nearby pipes)
    for (const pipe of pipes) {
      // Skip pipes too far away (optimization)
      if (pipe.x + pipe.width < ghostCircle.x - 100) {
        continue; // Pipe is behind ghost
      }
      
      if (pipe.x > ghostCircle.x + 100) {
        break; // Pipes are sorted, no need to check further
      }
      
      // Check top pipe
      const topHitbox = pipe.getTopHitbox();
      if (checkCircleRectCollision(ghostCircle, topHitbox)) {
        return {
          collided: true,
          type: 'pipe_top',
          pipe: pipe,
          position: { x: ghostCircle.x, y: ghostCircle.y }
        };
      }
      
      // Check bottom pipe
      const bottomHitbox = pipe.getBottomHitbox();
      if (checkCircleRectCollision(ghostCircle, bottomHitbox)) {
        return {
          collided: true,
          type: 'pipe_bottom',
          pipe: pipe,
          position: { x: ghostCircle.x, y: ghostCircle.y }
        };
      }
    }
    
    return { collided: false };
  }
}
```

---

## Scoring Mechanics

### Score Detection

**Pipe Passing Algorithm**:
```javascript
class Game {
  updatePipes(deltaTime) {
    const ghostX = this.entities.ghost.x;
    
    for (const pipe of this.entities.pipes) {
      // Update pipe position
      pipe.update(deltaTime, this.physics.pipeSpeed);
      
      // Check if pipe passed ghost
      if (pipe.hasPassedGhost(ghostX)) {
        pipe.markScored();
        this.handleScore(pipe);
      }
      
      // Remove off-screen pipes
      if (pipe.isOffScreen()) {
        this.removePipe(pipe);
      }
    }
  }
  
  handleScore(pipe) {
    // Increment score
    this.state.incrementScore();
    
    // Play sound
    this.audio.playSound('score');
    
    // Create score indicator
    const indicator = new ScoreIndicator(
      pipe.x + pipe.width / 2,
      pipe.gapY,
      1
    );
    this.entities.scoreIndicators.push(indicator);
    
    // Increase difficulty
    this.physics.increaseDifficulty(this.state.score);
  }
}

// Scoring logic:
// - Score increments when pipe's right edge passes ghost's left edge
// - Each pipe can only score once (marked as scored)
// - Score triggers: sound, visual indicator, difficulty increase
```

### High Score Persistence

**Save and Load**:
```javascript
class StateManager {
  incrementScore() {
    this.score++;
    
    // Update high score if exceeded
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.saveHighScore();
    }
  }
  
  saveHighScore() {
    try {
      localStorage.setItem('flappyKiroHighScore', this.highScore.toString());
    } catch (err) {
      console.warn('Failed to save high score:', err);
    }
  }
  
  loadHighScore() {
    try {
      const stored = localStorage.getItem('flappyKiroHighScore');
      this.highScore = stored ? parseInt(stored, 10) : 0;
    } catch (err) {
      console.warn('Failed to load high score:', err);
      this.highScore = 0;
    }
  }
}
```

---

## Invincibility Mechanics

### Invincibility Frames

**Grace Period on Game Start**:
```javascript
class StateManager {
  constructor(config) {
    this.invincibilityDuration = config.collision.invincibilityDuration; // 120 frames
    this.invincibilityFrames = 0;
  }
  
  startInvincibility() {
    this.invincibilityFrames = this.invincibilityDuration;
  }
  
  updateInvincibility() {
    if (this.invincibilityFrames > 0) {
      this.invincibilityFrames--;
    }
  }
  
  isInvincible() {
    return this.invincibilityFrames > 0;
  }
}

// Invincibility timing:
// Duration: 120 frames
// At 120 FPS: 120 / 120 = 1 second
// At 60 FPS: 120 / 60 = 2 seconds (frame-based, not time-based)
// 
// Why frame-based?
// - Consistent with game feel
// - Simpler implementation
// - Standard for retro games
```

### Visual Indicator

**Flash Effect**:
```javascript
class Renderer {
  renderInvincibilityIndicator(ghost) {
    if (!this.state.isInvincible()) return;
    
    // Flash on/off every 100ms
    const flashOn = Math.floor(Date.now() / 100) % 2 === 0;
    
    if (flashOn) {
      const circle = ghost.getCircle();
      
      this.ctx.save();
      this.ctx.strokeStyle = '#FFD700'; // Gold
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(circle.x, circle.y, circle.radius + 2, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.restore();
    }
  }
}
```

---

## Pipe Generation

### Spawn Algorithm

**Consistent Spacing**:
```javascript
class Game {
  constructor() {
    this.lastPipeX = 400; // Start off-screen right
    this.pipeSpacing = 350; // Horizontal spacing
  }
  
  generatePipes() {
    const ghostX = this.entities.ghost.x;
    const screenWidth = this.canvas.width;
    
    // Generate pipes ahead of ghost
    while (this.lastPipeX < ghostX + screenWidth + 200) {
      this.spawnPipe();
    }
  }
  
  spawnPipe() {
    // Calculate next pipe position
    const x = this.lastPipeX + this.pipeSpacing;
    
    // Random gap position
    const gapY = this.physics.generateGapPosition();
    
    // Create pipe
    const pipe = new Pipe(
      x,
      gapY,
      this.config.pipes.gapSize,
      this.canvas.height,
      this.config
    );
    
    this.entities.pipes.push(pipe);
    this.lastPipeX = x;
  }
}

// Pipe generation:
// Spacing: 350px between pipes
// Gap size: 140px vertical opening
// Gap position: Random between 100px and 500px
// Always generate pipes ahead of visible area
```

### Gap Positioning

**Random but Valid**:
```javascript
class PhysicsEngine {
  generateGapPosition() {
    const minGapY = this.config.pipes.minGapY;     // 100px
    const maxGapY = this.config.pipes.maxGapY;     // 500px
    const gapSize = this.config.pipes.gapSize;     // 140px
    
    // Random position within valid range
    const range = maxGapY - minGapY;
    const gapY = minGapY + Math.random() * range;
    
    // Ensure gap is fully visible
    const halfGap = gapSize / 2;
    const topEdge = gapY - halfGap;
    const bottomEdge = gapY + halfGap;
    
    // Validate (should always be true with correct config)
    if (topEdge < 0 || bottomEdge > 600) {
      console.warn('Invalid gap position:', gapY);
      return 300; // Fallback to center
    }
    
    return gapY;
  }
}

// Gap positioning:
// Min Y: 100px (gap center)
// Max Y: 500px (gap center)
// Gap size: 140px (70px above and below center)
// Top pipe: 0 to (gapY - 70)
// Bottom pipe: (gapY + 70) to 600
```

---

## Visual Effects

### Screen Shake

**Collision Impact**:
```javascript
class CollisionSystem {
  constructor(config) {
    this.screenShake = {
      active: false,
      intensity: config.collision.screenShakeIntensity,  // 10px
      duration: config.collision.screenShakeDuration,    // 30 frames
      currentDuration: 0,
      offsetX: 0,
      offsetY: 0
    };
  }
  
  triggerScreenShake() {
    this.screenShake.active = true;
    this.screenShake.currentDuration = this.screenShake.duration;
  }
  
  updateScreenShake() {
    if (!this.screenShake.active) {
      this.screenShake.offsetX = 0;
      this.screenShake.offsetY = 0;
      return;
    }
    
    if (this.screenShake.currentDuration > 0) {
      // Calculate decay
      const progress = this.screenShake.currentDuration / this.screenShake.duration;
      const currentIntensity = this.screenShake.intensity * progress;
      
      // Random offset
      this.screenShake.offsetX = (Math.random() - 0.5) * currentIntensity * 2;
      this.screenShake.offsetY = (Math.random() - 0.5) * currentIntensity * 2;
      
      this.screenShake.currentDuration--;
    } else {
      this.screenShake.active = false;
      this.screenShake.offsetX = 0;
      this.screenShake.offsetY = 0;
    }
  }
  
  getScreenShakeOffset() {
    return {
      x: this.screenShake.offsetX,
      y: this.screenShake.offsetY
    };
  }
}

// Screen shake:
// Intensity: 10px maximum offset
// Duration: 30 frames (0.25s at 120 FPS)
// Decay: Linear from full intensity to zero
// Random: Offset changes each frame
```

### Particle Trail

**Ghost Trail Effect**:
```javascript
class Game {
  updateParticles(deltaTime) {
    // Spawn new particles
    if (this.state.isPlaying() && Math.random() < 0.3) {
      const ghost = this.entities.ghost;
      const particle = new Particle(
        ghost.x + ghost.width / 2,
        ghost.y + ghost.height / 2
      );
      this.entities.particles.push(particle);
    }
    
    // Update existing particles
    for (let i = this.entities.particles.length - 1; i >= 0; i--) {
      const particle = this.entities.particles[i];
      particle.update(deltaTime);
      
      if (particle.isDead()) {
        this.entities.particles.splice(i, 1);
      }
    }
  }
}

class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 2;  // Random horizontal velocity
    this.vy = (Math.random() - 0.5) * 2;  // Random vertical velocity
    this.life = 1.0;                       // Full life
    this.decay = 0.02;                     // Life decay per frame
    this.size = Math.random() * 3 + 2;     // 2-5 pixels
  }
  
  update(deltaTime) {
    this.x += this.vx * deltaTime * 60; // Scale for frame rate
    this.y += this.vy * deltaTime * 60;
    this.life -= this.decay;
  }
  
  isDead() {
    return this.life <= 0;
  }
}
```

---

## Game Balance

### Difficulty Curve

**Progression Analysis**:
```
Score Range | Pipe Speed | Time Between Pipes | Reaction Time
------------|------------|-------------------|---------------
0-4         | 120 px/s   | 2.92s             | Easy
5-9         | 130 px/s   | 2.69s             | Easy
10-14       | 140 px/s   | 2.50s             | Medium
15-19       | 150 px/s   | 2.33s             | Medium
20-24       | 160 px/s   | 2.19s             | Medium-Hard
25-29       | 170 px/s   | 2.06s             | Hard
30+         | 180+ px/s  | <2.00s            | Very Hard
60+         | 240 px/s   | 1.46s             | Maximum

Calculation:
Time between pipes = Pipe spacing / Pipe speed
Example: 350px / 120px/s = 2.92 seconds
```

### Tuning Parameters

**Adjustable Values for Balance**:
```javascript
// Make game easier:
// - Increase gap size (140 → 160)
// - Decrease gravity (800 → 700)
// - Increase jump velocity (-300 → -350)
// - Decrease pipe speed (120 → 100)
// - Increase pipe spacing (350 → 400)

// Make game harder:
// - Decrease gap size (140 → 120)
// - Increase gravity (800 → 900)
// - Decrease jump velocity (-300 → -250)
// - Increase pipe speed (120 → 140)
// - Decrease pipe spacing (350 → 300)
```

---

## Testing Mechanics

### Physics Tests

**Verify Physics Behavior**:
```javascript
describe('Ghost Physics', () => {
  it('should apply gravity correctly', () => {
    const ghost = new Ghost(100, 300, config);
    const deltaTime = 1.0; // 1 second
    
    ghost.update(deltaTime);
    
    // After 1 second of gravity:
    // velocity = 0 + 800 * 1.0 = 800 px/s
    // But clamped to terminal velocity: 600 px/s
    expect(ghost.velocity).toBe(600);
  });
  
  it('should jump with correct velocity', () => {
    const ghost = new Ghost(100, 300, config);
    ghost.velocity = 100; // Falling
    
    ghost.jump();
    
    expect(ghost.velocity).toBe(-300);
  });
});
```

### Collision Tests

**Verify Collision Detection**:
```javascript
describe('Collision Detection', () => {
  it('should detect circle-rect collision', () => {
    const circle = { x: 50, y: 50, radius: 10 };
    const rect = { x: 55, y: 55, width: 20, height: 20 };
    
    const collided = checkCircleRectCollision(circle, rect);
    
    expect(collided).toBe(true);
  });
  
  it('should not detect when not overlapping', () => {
    const circle = { x: 10, y: 10, radius: 5 };
    const rect = { x: 50, y: 50, width: 20, height: 20 };
    
    const collided = checkCircleRectCollision(circle, rect);
    
    expect(collided).toBe(false);
  });
});
```

---

## Performance Considerations

### Collision Optimization

**Only Check Nearby Objects**:
- Ghost position: Fixed at x=100
- Only check pipes within 100px range
- Skip pipes behind ghost (x + width < ghostX - 100)
- Break early for pipes ahead (x > ghostX + 100)
- Pipes are sorted by x position

### Physics Optimization

**Cache Calculations**:
- Pre-calculate pipe heights in constructor
- Cache hitbox objects (don't create new each frame)
- Use squared distance for collision (avoid sqrt)
- Clamp velocity inline (no function call)

---

## References

- **Game Config**: `kiro-introduction-starter-kit/game-config.json`
- **Requirements**: `.kiro/specs/flappy-kiro/requirements.md`
- **Design**: `.kiro/specs/flappy-kiro/design.md`
- **Collision Patterns**: `.kiro/steering/canvas-and-collision-patterns.md`
