---
inclusion: auto
---

# Canvas API and Collision Detection Patterns

## Overview

This document provides best practices for HTML5 Canvas rendering, animation frame management, and efficient collision detection algorithms for Flappy Kiro.

## Canvas API Patterns

### Canvas Initialization

**Proper Canvas Setup**:
```javascript
// ✅ GOOD: Proper canvas initialization
class Game {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    
    if (!this.canvas) {
      throw new Error(`Canvas element '${canvasId}' not found`);
    }
    
    this.ctx = this.canvas.getContext('2d');
    
    if (!this.ctx) {
      throw new Error('2D context not supported');
    }
    
    // Set canvas size
    this.canvas.width = 400;
    this.canvas.height = 600;
    
    // Disable image smoothing for pixel-perfect rendering
    this.ctx.imageSmoothingEnabled = false;
  }
}
```

### Context State Management

**Save and Restore Context State**:
```javascript
// ✅ GOOD: Save/restore for transformations
renderGhost(ghost) {
  this.ctx.save();
  
  // Apply transformations
  this.ctx.translate(ghost.x + ghost.width / 2, ghost.y + ghost.height / 2);
  this.ctx.rotate(ghost.rotation * Math.PI / 180);
  
  // Draw sprite
  this.ctx.drawImage(
    ghost.sprite,
    -ghost.width / 2,
    -ghost.height / 2,
    ghost.width,
    ghost.height
  );
  
  this.ctx.restore();
}

// ❌ BAD: No save/restore (affects subsequent draws)
renderGhost(ghost) {
  this.ctx.translate(ghost.x, ghost.y);
  this.ctx.rotate(ghost.rotation);
  this.ctx.drawImage(ghost.sprite, 0, 0);
  // Transformations persist!
}
```

### Efficient Clearing

**Clear Canvas Efficiently**:
```javascript
// ✅ GOOD: Clear entire canvas
clear() {
  this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
}

// ✅ BETTER: Fill with background color (faster)
clear() {
  this.ctx.fillStyle = '#87CEEB';
  this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
}

// ✅ BEST: Pre-render static background
constructor() {
  this.backgroundCanvas = document.createElement('canvas');
  this.backgroundCanvas.width = this.canvas.width;
  this.backgroundCanvas.height = this.canvas.height;
  
  const bgCtx = this.backgroundCanvas.getContext('2d');
  bgCtx.fillStyle = '#87CEEB';
  bgCtx.fillRect(0, 0, this.canvas.width, this.canvas.height);
}

clear() {
  this.ctx.drawImage(this.backgroundCanvas, 0, 0);
}
```

### Batch Rendering

**Minimize State Changes**:
```javascript
// ✅ GOOD: Batch by material/style
renderPipes(pipes) {
  // Set style once for all pipe bodies
  this.ctx.fillStyle = '#00AA00';
  
  for (const pipe of pipes) {
    this.ctx.fillRect(pipe.x, 0, pipe.width, pipe.topHeight);
    this.ctx.fillRect(pipe.x, pipe.bottomY, pipe.width, pipe.bottomHeight);
  }
  
  // Set style once for all pipe caps
  this.ctx.fillStyle = '#00CC00';
  
  for (const pipe of pipes) {
    this.ctx.fillRect(pipe.x - 2, pipe.topHeight - 20, pipe.width + 4, 20);
    this.ctx.fillRect(pipe.x - 2, pipe.bottomY, pipe.width + 4, 20);
  }
}
```


### Text Rendering

**Optimize Text Drawing**:
```javascript
// ✅ GOOD: Set text properties once
renderScore(score, highScore) {
  this.ctx.fillStyle = '#000000';
  this.ctx.font = '20px Arial';
  this.ctx.textAlign = 'center';
  this.ctx.textBaseline = 'middle';
  
  this.ctx.fillText(
    `Score: ${score} | High: ${highScore}`,
    this.canvas.width / 2,
    this.canvas.height - 20
  );
}

// ❌ BAD: Measure text every frame (slow)
renderScore(score, highScore) {
  const text = `Score: ${score} | High: ${highScore}`;
  const metrics = this.ctx.measureText(text); // Expensive!
  this.ctx.fillText(text, x, y);
}
```

### Image Drawing

**Efficient Sprite Rendering**:
```javascript
// ✅ GOOD: Draw sprite with proper parameters
renderGhost(ghost) {
  this.ctx.drawImage(
    ghost.sprite,           // Image
    ghost.x,                // Destination X
    ghost.y,                // Destination Y
    ghost.width,            // Destination width
    ghost.height            // Destination height
  );
}

// ✅ GOOD: Draw from sprite sheet
renderGhostFrame(ghost, frameIndex) {
  const frameWidth = 32;
  const frameHeight = 32;
  
  this.ctx.drawImage(
    ghost.spriteSheet,                    // Sprite sheet
    frameIndex * frameWidth, 0,           // Source X, Y
    frameWidth, frameHeight,              // Source width, height
    ghost.x, ghost.y,                     // Destination X, Y
    ghost.width, ghost.height             // Destination width, height
  );
}
```

### Alpha and Compositing

**Use Global Alpha for Fading**:
```javascript
// ✅ GOOD: Use globalAlpha for transparency
renderScoreIndicator(indicator) {
  this.ctx.save();
  this.ctx.globalAlpha = indicator.life; // 0.0 to 1.0
  this.ctx.fillStyle = '#FFD700';
  this.ctx.font = 'bold 24px Arial';
  this.ctx.textAlign = 'center';
  this.ctx.fillText(`+${indicator.value}`, indicator.x, indicator.y);
  this.ctx.restore();
}

// ✅ GOOD: Use composite operations for effects
renderInvincibilityGlow(ghost) {
  this.ctx.save();
  this.ctx.globalCompositeOperation = 'lighter';
  this.ctx.fillStyle = 'rgba(255, 215, 0, 0.5)';
  this.ctx.beginPath();
  this.ctx.arc(ghost.x, ghost.y, ghost.radius + 5, 0, Math.PI * 2);
  this.ctx.fill();
  this.ctx.restore();
}
```

---

## Animation Frame Handling

### RequestAnimationFrame Pattern

**Proper Game Loop**:
```javascript
// ✅ GOOD: Complete game loop with delta time
class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.lastFrameTime = 0;
    this.isRunning = false;
    this.targetFPS = 120;
    this.maxDeltaTime = 2.0; // Clamp to 2 seconds max
  }
  
  start() {
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.gameLoop(this.lastFrameTime);
  }
  
  stop() {
    this.isRunning = false;
  }
  
  gameLoop(timestamp) {
    if (!this.isRunning) return;
    
    // Calculate delta time in seconds
    const deltaTime = (timestamp - this.lastFrameTime) / 1000;
    this.lastFrameTime = timestamp;
    
    // Clamp delta time to prevent physics explosions
    const clampedDelta = Math.min(deltaTime, this.maxDeltaTime);
    
    // Update game state
    this.update(clampedDelta);
    
    // Render frame
    this.render();
    
    // Request next frame
    requestAnimationFrame((t) => this.gameLoop(t));
  }
  
  update(deltaTime) {
    // Update game logic
  }
  
  render() {
    // Draw frame
  }
}
```

### Delta Time Normalization

**Frame-Rate Independent Movement**:
```javascript
// ✅ GOOD: Use delta time for movement
class Ghost {
  update(deltaTime) {
    // Velocity in pixels per second
    const velocityPerSecond = 300;
    
    // Movement is frame-rate independent
    this.y += velocityPerSecond * deltaTime;
  }
}

// ❌ BAD: Frame-rate dependent movement
class Ghost {
  update() {
    // Moves 5px per frame (varies with FPS!)
    this.y += 5;
  }
}
```

### Fixed Timestep (Advanced)

**Consistent Physics Updates**:
```javascript
// ✅ ADVANCED: Fixed timestep for deterministic physics
class Game {
  constructor() {
    this.fixedTimeStep = 1 / 120; // 120 updates per second
    this.accumulator = 0;
    this.maxAccumulator = 0.25; // Prevent spiral of death
  }
  
  gameLoop(timestamp) {
    const deltaTime = (timestamp - this.lastFrameTime) / 1000;
    this.lastFrameTime = timestamp;
    
    // Add to accumulator
    this.accumulator += Math.min(deltaTime, this.maxAccumulator);
    
    // Update physics in fixed steps
    while (this.accumulator >= this.fixedTimeStep) {
      this.updatePhysics(this.fixedTimeStep);
      this.accumulator -= this.fixedTimeStep;
    }
    
    // Render with interpolation
    const alpha = this.accumulator / this.fixedTimeStep;
    this.render(alpha);
    
    requestAnimationFrame((t) => this.gameLoop(t));
  }
}
```

### Performance Monitoring

**Track Frame Rate**:
```javascript
// ✅ GOOD: Monitor performance
class PerformanceMonitor {
  constructor() {
    this.frameTimes = [];
    this.maxSamples = 120;
    this.lastTime = performance.now();
  }
  
  update(timestamp) {
    const deltaTime = timestamp - this.lastTime;
    this.lastTime = timestamp;
    
    this.frameTimes.push(deltaTime);
    
    if (this.frameTimes.length > this.maxSamples) {
      this.frameTimes.shift();
    }
  }
  
  getFPS() {
    if (this.frameTimes.length === 0) return 0;
    
    const avgFrameTime = this.frameTimes.reduce((a, b) => a + b) / this.frameTimes.length;
    return Math.round(1000 / avgFrameTime);
  }
  
  getAverageFrameTime() {
    if (this.frameTimes.length === 0) return 0;
    return this.frameTimes.reduce((a, b) => a + b) / this.frameTimes.length;
  }
  
  diagnose() {
    const fps = this.getFPS();
    const avgFrameTime = this.getAverageFrameTime();
    
    console.log(`FPS: ${fps}`);
    console.log(`Avg Frame Time: ${avgFrameTime.toFixed(2)}ms`);
    
    if (fps < 100) {
      console.warn('Performance warning: FPS below 100');
    }
  }
}
```

---

## Collision Detection Algorithms

### Axis-Aligned Bounding Box (AABB)

**Rectangle-Rectangle Collision**:
```javascript
// ✅ GOOD: AABB collision detection
function checkAABBCollision(rect1, rect2) {
  return rect1.x < rect2.x + rect2.width &&
         rect1.x + rect1.width > rect2.x &&
         rect1.y < rect2.y + rect2.height &&
         rect1.y + rect1.height > rect2.y;
}

// Usage
class CollisionSystem {
  checkGhostPipeCollision(ghost, pipe) {
    const ghostBox = ghost.getHitbox();
    const topPipeBox = pipe.getTopHitbox();
    const bottomPipeBox = pipe.getBottomHitbox();
    
    if (checkAABBCollision(ghostBox, topPipeBox)) {
      return { collided: true, type: 'pipe_top' };
    }
    
    if (checkAABBCollision(ghostBox, bottomPipeBox)) {
      return { collided: true, type: 'pipe_bottom' };
    }
    
    return { collided: false };
  }
}
```

### Circle-Rectangle Collision

**More Forgiving Collision for Player**:
```javascript
// ✅ GOOD: Circle-rectangle intersection
function checkCircleRectCollision(circle, rect) {
  // Find closest point on rectangle to circle center
  const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
  const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));
  
  // Calculate distance from circle center to closest point
  const distanceX = circle.x - closestX;
  const distanceY = circle.y - closestY;
  const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);
  
  // Check if distance is less than radius
  return distanceSquared < (circle.radius * circle.radius);
}

// Usage
class CollisionSystem {
  getGhostCircle(ghost) {
    const hitbox = ghost.getHitbox();
    return {
      x: hitbox.x + hitbox.width / 2,
      y: hitbox.y + hitbox.height / 2,
      radius: Math.min(hitbox.width, hitbox.height) / 2
    };
  }
  
  checkGhostPipeCollision(ghost, pipe) {
    const ghostCircle = this.getGhostCircle(ghost);
    const topPipeBox = pipe.getTopHitbox();
    
    if (checkCircleRectCollision(ghostCircle, topPipeBox)) {
      return { collided: true, type: 'pipe_top' };
    }
    
    return { collided: false };
  }
}
```

### Circle-Circle Collision

**Simple Distance Check**:
```javascript
// ✅ GOOD: Circle-circle collision
function checkCircleCollision(circle1, circle2) {
  const dx = circle2.x - circle1.x;
  const dy = circle2.y - circle1.y;
  const distanceSquared = dx * dx + dy * dy;
  const radiusSum = circle1.radius + circle2.radius;
  
  return distanceSquared < radiusSum * radiusSum;
}
```

### Point-Rectangle Collision

**Check if Point Inside Rectangle**:
```javascript
// ✅ GOOD: Point-rectangle collision
function checkPointRectCollision(point, rect) {
  return point.x >= rect.x &&
         point.x <= rect.x + rect.width &&
         point.y >= rect.y &&
         point.y <= rect.y + rect.height;
}
```

### Spatial Partitioning

**Only Check Nearby Objects**:
```javascript
// ✅ GOOD: Spatial partitioning for performance
class CollisionSystem {
  checkNearbyCollisions(ghost, pipes, canvasHeight) {
    const ghostX = ghost.x;
    const collisionRange = 100; // Only check within 100px
    
    // Check boundary collisions (always)
    const boundaryCollision = this.checkBoundaryCollision(ghost, canvasHeight);
    if (boundaryCollision.collided) {
      return boundaryCollision;
    }
    
    // Only check nearby pipes
    for (const pipe of pipes) {
      // Skip pipes too far away
      if (pipe.x + pipe.width < ghostX - collisionRange) {
        continue; // Pipe is behind ghost
      }
      
      if (pipe.x > ghostX + collisionRange) {
        break; // Pipes are sorted, no need to check further
      }
      
      // Check collision with nearby pipe
      const collision = this.checkGhostPipeCollision(ghost, pipe);
      if (collision.collided) {
        return collision;
      }
    }
    
    return { collided: false };
  }
}
```

### Broad Phase / Narrow Phase

**Two-Phase Collision Detection**:
```javascript
// ✅ GOOD: Broad phase then narrow phase
class CollisionSystem {
  checkCollisions(ghost, pipes) {
    // Broad phase: Quick AABB check
    const ghostBounds = this.getGhostBounds(ghost);
    const nearbyPipes = this.broadPhase(ghostBounds, pipes);
    
    // Narrow phase: Precise collision check
    for (const pipe of nearbyPipes) {
      const collision = this.narrowPhase(ghost, pipe);
      if (collision.collided) {
        return collision;
      }
    }
    
    return { collided: false };
  }
  
  broadPhase(bounds, pipes) {
    // Quick AABB check to filter candidates
    return pipes.filter(pipe => {
      const pipeBounds = this.getPipeBounds(pipe);
      return this.checkAABBOverlap(bounds, pipeBounds);
    });
  }
  
  narrowPhase(ghost, pipe) {
    // Precise circle-rectangle check
    const ghostCircle = this.getGhostCircle(ghost);
    const topPipeBox = pipe.getTopHitbox();
    
    if (checkCircleRectCollision(ghostCircle, topPipeBox)) {
      return { collided: true, type: 'pipe_top', pipe };
    }
    
    return { collided: false };
  }
}
```

### Collision Response

**Handle Collision Results**:
```javascript
// ✅ GOOD: Structured collision response
class Game {
  checkCollisions() {
    if (this.state.isInvincible()) {
      return; // Skip collision during invincibility
    }
    
    const collision = this.collision.checkAllCollisions(
      this.entities.ghost,
      this.entities.pipes,
      this.canvas.height
    );
    
    if (collision.collided) {
      this.handleCollision(collision);
    }
  }
  
  handleCollision(collision) {
    // Trigger visual effects
    this.collision.triggerScreenShake(10, 30);
    
    // Play sound
    this.audio.playSound('gameOver');
    
    // Transition to game over
    this.state.setState(GameStates.GAME_OVER);
    
    // Log collision type for debugging
    console.log(`Collision: ${collision.type}`);
  }
}
```

---

## Optimization Techniques

### Dirty Rectangle Rendering

**Only Redraw Changed Areas**:
```javascript
// ✅ ADVANCED: Dirty rectangle optimization
class Renderer {
  constructor(ctx) {
    this.ctx = ctx;
    this.dirtyRects = [];
  }
  
  markDirty(x, y, width, height) {
    this.dirtyRects.push({ x, y, width, height });
  }
  
  render() {
    if (this.dirtyRects.length === 0) {
      // Nothing changed, skip render
      return;
    }
    
    // Clear and redraw only dirty areas
    for (const rect of this.dirtyRects) {
      this.ctx.clearRect(rect.x, rect.y, rect.width, rect.height);
      this.renderRegion(rect);
    }
    
    this.dirtyRects = [];
  }
}

// Note: For Flappy Kiro, full screen redraw is simpler and sufficient
```

### Off-Screen Canvas

**Pre-render Static Elements**:
```javascript
// ✅ GOOD: Pre-render background
class Renderer {
  constructor(ctx, config) {
    this.ctx = ctx;
    this.config = config;
    
    // Create off-screen canvas for background
    this.bgCanvas = document.createElement('canvas');
    this.bgCanvas.width = config.canvas.width;
    this.bgCanvas.height = config.canvas.height;
    
    this.prerenderBackground();
  }
  
  prerenderBackground() {
    const bgCtx = this.bgCanvas.getContext('2d');
    
    // Draw gradient background
    const gradient = bgCtx.createLinearGradient(0, 0, 0, this.bgCanvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#B0E0E6');
    
    bgCtx.fillStyle = gradient;
    bgCtx.fillRect(0, 0, this.bgCanvas.width, this.bgCanvas.height);
  }
  
  clear() {
    // Draw pre-rendered background (fast!)
    this.ctx.drawImage(this.bgCanvas, 0, 0);
  }
}
```

### Canvas Layering

**Multiple Canvases for Different Layers**:
```javascript
// ✅ ADVANCED: Multiple canvas layers
class LayeredRenderer {
  constructor(container) {
    // Background layer (static)
    this.bgCanvas = this.createCanvas(container, 0);
    this.bgCtx = this.bgCanvas.getContext('2d');
    
    // Game layer (dynamic)
    this.gameCanvas = this.createCanvas(container, 1);
    this.gameCtx = this.gameCanvas.getContext('2d');
    
    // UI layer (semi-static)
    this.uiCanvas = this.createCanvas(container, 2);
    this.uiCtx = this.uiCanvas.getContext('2d');
    
    this.renderBackground(); // Render once
  }
  
  createCanvas(container, zIndex) {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 600;
    canvas.style.position = 'absolute';
    canvas.style.zIndex = zIndex;
    container.appendChild(canvas);
    return canvas;
  }
  
  render() {
    // Only clear and redraw game layer
    this.gameCtx.clearRect(0, 0, 400, 600);
    this.renderGame();
    
    // UI layer only updates when score changes
  }
}

// Note: For Flappy Kiro, single canvas is simpler
```

---

## Debug Visualization

### Collision Bounds Debugging

**Visualize Hitboxes**:
```javascript
// ✅ GOOD: Debug collision visualization
class CollisionSystem {
  constructor(config) {
    this.config = config;
    this.debugMode = false; // Toggle with key press
  }
  
  debugDrawCollisionBounds(ctx, ghost, pipes) {
    if (!this.debugMode) return;
    
    ctx.save();
    
    // Draw ghost circular collision bound
    const ghostCircle = this.getGhostCircle(ghost);
    ctx.strokeStyle = '#FF0000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(ghostCircle.x, ghostCircle.y, ghostCircle.radius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw ghost rectangular hitbox
    const ghostHitbox = ghost.getHitbox();
    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 1;
    ctx.strokeRect(ghostHitbox.x, ghostHitbox.y, ghostHitbox.width, ghostHitbox.height);
    
    // Draw pipe bounds
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
  
  toggleDebug() {
    this.debugMode = !this.debugMode;
    console.log(`Debug mode: ${this.debugMode ? 'ON' : 'OFF'}`);
  }
}
```

### Performance Overlay

**Display FPS and Frame Time**:
```javascript
// ✅ GOOD: Performance overlay
class PerformanceOverlay {
  constructor(ctx) {
    this.ctx = ctx;
    this.monitor = new PerformanceMonitor();
    this.visible = false;
  }
  
  render() {
    if (!this.visible) return;
    
    const fps = this.monitor.getFPS();
    const avgFrameTime = this.monitor.getAverageFrameTime();
    
    this.ctx.save();
    
    // Draw background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(10, 10, 150, 60);
    
    // Draw text
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = '14px monospace';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`FPS: ${fps}`, 20, 30);
    this.ctx.fillText(`Frame: ${avgFrameTime.toFixed(2)}ms`, 20, 50);
    
    this.ctx.restore();
  }
  
  toggle() {
    this.visible = !this.visible;
  }
}
```

---

## Best Practices Summary

### Canvas Rendering
- Save/restore context state for transformations
- Batch rendering by material/style
- Pre-render static backgrounds
- Use globalAlpha for transparency
- Disable image smoothing for pixel art

### Animation
- Use requestAnimationFrame, never setInterval
- Calculate delta time for frame-rate independence
- Clamp delta time to prevent physics explosions
- Monitor performance with FPS tracking

### Collision Detection
- Use appropriate algorithm for shape types
- Implement spatial partitioning for performance
- Use broad phase / narrow phase for complex scenes
- Cache hitbox calculations
- Visualize collision bounds for debugging

### Performance
- Minimize state changes in render loop
- Avoid object allocations in hot paths
- Use object pooling for frequently created objects
- Profile with browser dev tools
- Target 120 FPS, gracefully degrade to 60 FPS

---

## References

- **Design Document**: `.kiro/specs/flappy-kiro/design.md`
- **Coding Standards**: `.kiro/steering/game-coding-standards.md`
- **MDN Canvas API**: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API
- **MDN requestAnimationFrame**: https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame
