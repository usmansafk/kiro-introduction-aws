---
inclusion: auto
---

# Ghosty Behavior and Collision Handling

## Overview

This document defines precise patterns for Ghosty's behavior, wall collision responses, and game over state handling in Flappy Kiro. These patterns ensure consistent physics, fair collision detection, and smooth game state transitions.

## Core Behavior Principles

1. **Predictable Physics**: Ghosty's movement follows consistent physics rules
2. **Fair Collision**: Collision detection is accurate and forgiving
3. **Visual Feedback**: All state changes have clear visual indicators
4. **Smooth Transitions**: State changes are smooth and non-jarring
5. **Player Control**: Player always feels in control of Ghosty

---

## Ghosty Entity

### Ghosty Class Structure

**Complete Ghosty Implementation**:
```javascript
// ✅ GOOD: Complete Ghosty entity with all behaviors
class Ghosty {
  constructor(x, y, config) {
    this.config = config;
    
    // Position and movement
    this.x = x;                           // Fixed horizontal position
    this.y = y;                           // Vertical position (changes)
    this.velocity = 0;                    // Vertical velocity (px/s)
    this.acceleration = 0;                // Current acceleration
    
    // Dimensions
    this.width = config.ghost.width;      // 34px
    this.height = config.ghost.height;    // 24px
    
    // Hitbox (smaller than sprite for forgiveness)
    this.hitboxRadius = config.ghost.hitboxRadius; // 12px
    this.hitboxOffsetX = 3;               // Offset from sprite edge
    this.hitboxOffsetY = 2;
    
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
    this.gravity = config.physics.gravity;              // 800 px/s²
    this.jumpVelocity = config.physics.jumpVelocity;    // -300 px/s
    this.terminalVelocity = config.physics.terminalVelocity;      // 600 px/s
    this.maxUpwardVelocity = config.physics.maxUpwardVelocity;    // -600 px/s
    
    // Load sprite
    this.loadSprite();
  }
  
  loadSprite() {
    this.sprite = new Image();
    this.sprite.onload = () => {
      this.spriteLoaded = true;
      console.log('Ghosty sprite loaded');
    };
    this.sprite.onerror = () => {
      console.error('Failed to load Ghosty sprite');
    };
    this.sprite.src = this.config.ghost.spritePath;
  }
  
  update(deltaTime) {
    if (!this.alive) {
      this.updateDeathAnimation(deltaTime);
      return;
    }
    
    // Apply gravity
    this.velocity += this.gravity * deltaTime;
    
    // Clamp velocity to limits
    this.velocity = Math.min(this.velocity, this.terminalVelocity);
    this.velocity = Math.max(this.velocity, this.maxUpwardVelocity);
    
    // Update position
    this.y += this.velocity * deltaTime;
    
    // Update rotation based on velocity
    this.updateRotation();
    
    // Update animation
    this.updateAnimation(deltaTime);
  }
  
  updateRotation() {
    // Rotation based on velocity
    // Falling: nose down (positive rotation)
    // Rising: nose up (negative rotation)
    const targetRotation = this.velocity * 0.05;
    
    // Smooth rotation transition
    const rotationSpeed = 0.2;
    this.rotation += (targetRotation - this.rotation) * rotationSpeed;
    
    // Clamp rotation to prevent extreme angles
    this.rotation = Math.max(-25, Math.min(25, this.rotation));
  }
  
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
  
  jump() {
    if (!this.alive) return;
    
    // Set velocity to jump velocity (instant change)
    this.velocity = this.jumpVelocity;
    
    // Reset rotation for visual feedback
    this.rotation = -20;
    
    console.log('Ghosty jumped');
  }
  
  kill() {
    if (!this.alive) return;
    
    this.alive = false;
    console.log('Ghosty died');
  }
  
  reset() {
    this.y = 300; // Center of screen
    this.velocity = 0;
    this.rotation = 0;
    this.alive = true;
    this.grounded = false;
    this.bobOffset = 0;
    this.animationFrame = 0;
  }
  
  // Collision detection
  getHitbox() {
    return {
      x: this.x + this.hitboxOffsetX,
      y: this.y + this.hitboxOffsetY,
      width: this.width - (this.hitboxOffsetX * 2),
      height: this.height - (this.hitboxOffsetY * 2)
    };
  }
  
  getCircle() {
    const hitbox = this.getHitbox();
    return {
      x: hitbox.x + hitbox.width / 2,
      y: hitbox.y + hitbox.height / 2,
      radius: this.hitboxRadius
    };
  }
  
  getBounds() {
    return {
      left: this.x,
      right: this.x + this.width,
      top: this.y,
      bottom: this.y + this.height
    };
  }
  
  // State queries
  isAlive() {
    return this.alive;
  }
  
  isInvincible() {
    return this.invincible;
  }
  
  isFalling() {
    return this.velocity > 0;
  }
  
  isRising() {
    return this.velocity < 0;
  }
  
  setInvincible(invincible) {
    this.invincible = invincible;
  }
}
```

---

## Ghosty Behavior Patterns

### Jump Behavior

**Responsive Jump Mechanics**:
```javascript
// ✅ GOOD: Jump with visual and audio feedback
class GhostyJumpController {
  constructor(ghosty, audioManager, particleSystem) {
    this.ghosty = ghosty;
    this.audioManager = audioManager;
    this.particleSystem = particleSystem;
    
    // Jump settings
    this.jumpCooldown = 0;
    this.minJumpInterval = 0.1; // Minimum time between jumps (seconds)
    this.lastJumpTime = 0;
  }
  
  jump() {
    const now = Date.now() / 1000;
    
    // Check cooldown
    if (now - this.lastJumpTime < this.minJumpInterval) {
      return false;
    }
    
    // Perform jump
    this.ghosty.jump();
    this.lastJumpTime = now;
    
    // Play sound
    this.audioManager.playSound('jump');
    
    // Spawn particles
    this.spawnJumpParticles();
    
    return true;
  }
  
  spawnJumpParticles() {
    const circle = this.ghosty.getCircle();
    
    // Spawn 3-5 particles
    const count = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      this.particleSystem.spawn({
        x: circle.x,
        y: circle.y + this.ghosty.height / 2,
        vx: (Math.random() - 0.5) * 50,
        vy: Math.random() * 50 + 20,
        life: 0.5,
        size: 2 + Math.random() * 2,
        color: '#FFFFFF'
      });
    }
  }
  
  update(deltaTime) {
    // Update cooldown
    if (this.jumpCooldown > 0) {
      this.jumpCooldown -= deltaTime;
    }
  }
}
```


### Movement Constraints

**Boundary Handling**:
```javascript
// ✅ GOOD: Ghosty boundary constraints
class GhostyBoundaryController {
  constructor(ghosty, canvasHeight) {
    this.ghosty = ghosty;
    this.canvasHeight = canvasHeight;
    
    // Boundary settings
    this.topBoundary = 0;
    this.bottomBoundary = canvasHeight;
    this.allowCeilingBounce = false;
    this.allowGroundBounce = false;
  }
  
  update() {
    const circle = this.ghosty.getCircle();
    
    // Check ceiling collision
    if (circle.y - circle.radius <= this.topBoundary) {
      this.handleCeilingCollision();
    }
    
    // Check ground collision
    if (circle.y + circle.radius >= this.bottomBoundary) {
      this.handleGroundCollision();
    }
  }
  
  handleCeilingCollision() {
    const circle = this.ghosty.getCircle();
    
    // Clamp position
    this.ghosty.y = this.topBoundary + circle.radius - (circle.y - this.ghosty.y);
    
    // Stop upward velocity
    if (this.ghosty.velocity < 0) {
      if (this.allowCeilingBounce) {
        this.ghosty.velocity = -this.ghosty.velocity * 0.3; // Bounce with damping
      } else {
        this.ghosty.velocity = 0;
      }
    }
  }
  
  handleGroundCollision() {
    const circle = this.ghosty.getCircle();
    
    // Clamp position
    this.ghosty.y = this.bottomBoundary - circle.radius - (circle.y - this.ghosty.y);
    
    // Stop downward velocity
    if (this.ghosty.velocity > 0) {
      if (this.allowGroundBounce) {
        this.ghosty.velocity = -this.ghosty.velocity * 0.3; // Bounce with damping
      } else {
        this.ghosty.velocity = 0;
        this.ghosty.grounded = true;
      }
    }
  }
  
  isOutOfBounds() {
    const circle = this.ghosty.getCircle();
    return circle.y - circle.radius < this.topBoundary ||
           circle.y + circle.radius > this.bottomBoundary;
  }
}
```

---

## Wall Collision System

### Collision Detection

**Precise Collision Checking**:
```javascript
// ✅ GOOD: Complete collision detection system
class CollisionDetector {
  constructor(config) {
    this.config = config;
  }
  
  checkCircleRectCollision(circle, rect) {
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
  
  checkGhostyPipeCollision(ghosty, pipe) {
    const circle = ghosty.getCircle();
    
    // Get pipe hitboxes
    const topPipe = {
      x: pipe.x,
      y: 0,
      width: pipe.width,
      height: pipe.gapY - (pipe.gapSize / 2)
    };
    
    const bottomPipe = {
      x: pipe.x,
      y: pipe.gapY + (pipe.gapSize / 2),
      width: pipe.width,
      height: 600 - (pipe.gapY + (pipe.gapSize / 2))
    };
    
    // Check collisions
    if (this.checkCircleRectCollision(circle, topPipe)) {
      return {
        collided: true,
        type: 'pipe_top',
        pipe: pipe,
        position: { x: circle.x, y: circle.y }
      };
    }
    
    if (this.checkCircleRectCollision(circle, bottomPipe)) {
      return {
        collided: true,
        type: 'pipe_bottom',
        pipe: pipe,
        position: { x: circle.x, y: circle.y }
      };
    }
    
    return { collided: false };
  }
  
  checkGhostyBoundaryCollision(ghosty, canvasHeight) {
    const circle = ghosty.getCircle();
    
    // Ceiling collision
    if (circle.y - circle.radius <= 0) {
      return {
        collided: true,
        type: 'ceiling',
        position: { x: circle.x, y: 0 }
      };
    }
    
    // Ground collision
    if (circle.y + circle.radius >= canvasHeight) {
      return {
        collided: true,
        type: 'ground',
        position: { x: circle.x, y: canvasHeight }
      };
    }
    
    return { collided: false };
  }
  
  checkAllCollisions(ghosty, pipes, canvasHeight) {
    // Skip if invincible
    if (ghosty.isInvincible()) {
      return { collided: false, type: 'invincible' };
    }
    
    // Check boundary collisions first
    const boundaryCollision = this.checkGhostyBoundaryCollision(ghosty, canvasHeight);
    if (boundaryCollision.collided) {
      return boundaryCollision;
    }
    
    // Check pipe collisions
    const circle = ghosty.getCircle();
    
    for (const pipe of pipes) {
      // Skip pipes too far away (optimization)
      if (pipe.x + pipe.width < circle.x - 100) {
        continue;
      }
      
      if (pipe.x > circle.x + 100) {
        break;
      }
      
      const pipeCollision = this.checkGhostyPipeCollision(ghosty, pipe);
      if (pipeCollision.collided) {
        return pipeCollision;
      }
    }
    
    return { collided: false };
  }
}
```


### Collision Response

**Visual and Audio Feedback**:
```javascript
// ✅ GOOD: Complete collision response system
class CollisionResponseHandler {
  constructor(ghosty, audioManager, particleSystem, screenShake) {
    this.ghosty = ghosty;
    this.audioManager = audioManager;
    this.particleSystem = particleSystem;
    this.screenShake = screenShake;
  }
  
  handleCollision(collision) {
    if (!collision.collided) return;
    
    console.log(`Collision detected: ${collision.type}`);
    
    // Kill ghosty
    this.ghosty.kill();
    
    // Play collision sound
    this.audioManager.playSound('collision');
    
    // Trigger screen shake
    this.screenShake.trigger(collision.type);
    
    // Spawn collision particles
    this.spawnCollisionParticles(collision);
    
    // Return collision data for game over handling
    return {
      type: collision.type,
      position: collision.position,
      timestamp: Date.now()
    };
  }
  
  spawnCollisionParticles(collision) {
    const position = collision.position;
    const count = 10 + Math.floor(Math.random() * 10);
    
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 50 + Math.random() * 100;
      
      this.particleSystem.spawn({
        x: position.x,
        y: position.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.5 + Math.random() * 0.5,
        size: 2 + Math.random() * 3,
        color: this.getCollisionColor(collision.type),
        gravity: 200
      });
    }
  }
  
  getCollisionColor(type) {
    switch (type) {
      case 'pipe_top':
      case 'pipe_bottom':
        return '#FF6B6B'; // Red for pipe collisions
      case 'ceiling':
        return '#4ECDC4'; // Cyan for ceiling
      case 'ground':
        return '#FFE66D'; // Yellow for ground
      default:
        return '#FFFFFF';
    }
  }
}
```

### Screen Shake Effect

**Impact Feedback**:
```javascript
// ✅ GOOD: Screen shake for collision impact
class ScreenShake {
  constructor(config) {
    this.config = config;
    this.active = false;
    this.intensity = 0;
    this.duration = 0;
    this.elapsed = 0;
    this.offsetX = 0;
    this.offsetY = 0;
    
    // Intensity by collision type
    this.intensityMap = {
      pipe_top: 10,
      pipe_bottom: 10,
      ceiling: 6,
      ground: 8
    };
    
    // Duration by collision type (frames at 120 FPS)
    this.durationMap = {
      pipe_top: 30,
      pipe_bottom: 30,
      ceiling: 20,
      ground: 25
    };
  }
  
  trigger(collisionType) {
    this.active = true;
    this.intensity = this.intensityMap[collisionType] || 10;
    this.duration = this.durationMap[collisionType] || 30;
    this.elapsed = 0;
    
    console.log(`Screen shake triggered: ${collisionType}`);
  }
  
  update() {
    if (!this.active) {
      this.offsetX = 0;
      this.offsetY = 0;
      return;
    }
    
    this.elapsed++;
    
    if (this.elapsed >= this.duration) {
      this.active = false;
      this.offsetX = 0;
      this.offsetY = 0;
      return;
    }
    
    // Calculate decay
    const progress = this.elapsed / this.duration;
    const currentIntensity = this.intensity * (1 - progress);
    
    // Random offset
    this.offsetX = (Math.random() - 0.5) * currentIntensity * 2;
    this.offsetY = (Math.random() - 0.5) * currentIntensity * 2;
  }
  
  getOffset() {
    return {
      x: this.offsetX,
      y: this.offsetY
    };
  }
  
  isActive() {
    return this.active;
  }
  
  reset() {
    this.active = false;
    this.elapsed = 0;
    this.offsetX = 0;
    this.offsetY = 0;
  }
}
```


---

## Game Over State Handling

### Game Over State Machine

**State Transition Management**:
```javascript
// ✅ GOOD: Game over state handling
class GameOverStateHandler {
  constructor(game) {
    this.game = game;
    this.active = false;
    this.collisionData = null;
    this.transitionDuration = 1000; // ms
    this.transitionStartTime = 0;
    this.transitionProgress = 0;
    
    // Callbacks
    this.onGameOverCallbacks = [];
  }
  
  trigger(collisionData) {
    if (this.active) return;
    
    this.active = true;
    this.collisionData = collisionData;
    this.transitionStartTime = Date.now();
    this.transitionProgress = 0;
    
    console.log('Game over triggered');
    
    // Execute callbacks
    this.executeCallbacks();
    
    // Transition to game over state
    this.startTransition();
  }
  
  startTransition() {
    // Slow down time effect
    this.game.timeScale = 1.0;
    
    // Start transition animation
    this.animateTransition();
  }
  
  animateTransition() {
    const animate = () => {
      if (!this.active) return;
      
      const elapsed = Date.now() - this.transitionStartTime;
      this.transitionProgress = Math.min(elapsed / this.transitionDuration, 1.0);
      
      // Slow motion effect
      this.game.timeScale = 1.0 - (this.transitionProgress * 0.7);
      
      if (this.transitionProgress < 1.0) {
        requestAnimationFrame(animate);
      } else {
        this.completeTransition();
      }
    };
    
    animate();
  }
  
  completeTransition() {
    // Reset time scale
    this.game.timeScale = 1.0;
    
    // Change game state
    this.game.state = 'gameOver';
    
    // End session
    this.game.endSession();
    
    console.log('Game over transition complete');
  }
  
  executeCallbacks() {
    for (const callback of this.onGameOverCallbacks) {
      try {
        callback(this.collisionData);
      } catch (err) {
        console.error('Game over callback error:', err);
      }
    }
  }
  
  registerCallback(callback) {
    this.onGameOverCallbacks.push(callback);
  }
  
  reset() {
    this.active = false;
    this.collisionData = null;
    this.transitionProgress = 0;
    this.game.timeScale = 1.0;
  }
  
  isActive() {
    return this.active;
  }
  
  getTransitionProgress() {
    return this.transitionProgress;
  }
}
```

### Game Over Visual Effects

**Death Animation and Effects**:
```javascript
// ✅ GOOD: Game over visual effects
class GameOverEffects {
  constructor(renderer, ghosty) {
    this.renderer = renderer;
    this.ghosty = ghosty;
    this.active = false;
    this.startTime = 0;
    this.duration = 2000; // ms
  }
  
  start() {
    this.active = true;
    this.startTime = Date.now();
  }
  
  update() {
    if (!this.active) return;
    
    const elapsed = Date.now() - this.startTime;
    if (elapsed >= this.duration) {
      this.active = false;
    }
  }
  
  render(ctx) {
    if (!this.active) return;
    
    const elapsed = Date.now() - this.startTime;
    const progress = Math.min(elapsed / this.duration, 1.0);
    
    // Fade to dark
    this.renderFadeOverlay(ctx, progress);
    
    // Flash effect on impact
    if (progress < 0.1) {
      this.renderFlashEffect(ctx, progress / 0.1);
    }
  }
  
  renderFadeOverlay(ctx, progress) {
    const alpha = progress * 0.5;
    
    ctx.save();
    ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.restore();
  }
  
  renderFlashEffect(ctx, progress) {
    const alpha = (1 - progress) * 0.5;
    
    ctx.save();
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.restore();
  }
  
  reset() {
    this.active = false;
  }
}
```


### Game Over UI

**Game Over Screen Display**:
```javascript
// ✅ GOOD: Game over UI rendering
class GameOverUI {
  constructor(persistence) {
    this.persistence = persistence;
    this.visible = false;
    this.fadeIn = 0;
    this.fadeInDuration = 500; // ms
    this.showTime = 0;
  }
  
  show() {
    this.visible = true;
    this.fadeIn = 0;
    this.showTime = Date.now();
  }
  
  hide() {
    this.visible = false;
    this.fadeIn = 0;
  }
  
  update() {
    if (!this.visible) return;
    
    const elapsed = Date.now() - this.showTime;
    this.fadeIn = Math.min(elapsed / this.fadeInDuration, 1.0);
  }
  
  render(ctx, sessionResult) {
    if (!this.visible) return;
    
    const summary = sessionResult.summary;
    const highScoreResult = sessionResult.highScoreResult;
    
    ctx.save();
    
    // Background overlay
    ctx.fillStyle = `rgba(0, 0, 0, ${0.85 * this.fadeIn})`;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Game Over title
    ctx.fillStyle = `rgba(255, 255, 255, ${this.fadeIn})`;
    ctx.font = 'bold 56px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', ctx.canvas.width / 2, 120);
    
    // Score display
    this.renderScore(ctx, summary, highScoreResult);
    
    // Stats display
    this.renderStats(ctx, summary);
    
    // Instructions
    this.renderInstructions(ctx);
    
    ctx.restore();
  }
  
  renderScore(ctx, summary, highScoreResult) {
    const centerX = ctx.canvas.width / 2;
    const y = 200;
    
    // Current score
    ctx.font = 'bold 72px Arial';
    ctx.fillStyle = `rgba(255, 215, 0, ${this.fadeIn})`;
    ctx.fillText(summary.score, centerX, y);
    
    // New high score indicator
    if (highScoreResult.isNewHighScore) {
      const pulse = Math.sin(Date.now() / 200) * 0.2 + 0.8;
      ctx.font = 'bold 24px Arial';
      ctx.fillStyle = `rgba(255, 215, 0, ${pulse * this.fadeIn})`;
      ctx.fillText('NEW HIGH SCORE!', centerX, y + 50);
    } else {
      ctx.font = '20px Arial';
      ctx.fillStyle = `rgba(200, 200, 200, ${this.fadeIn})`;
      ctx.fillText(`Best: ${this.persistence.getHighScore()}`, centerX, y + 50);
    }
  }
  
  renderStats(ctx, summary) {
    const centerX = ctx.canvas.width / 2;
    const y = 320;
    const lineHeight = 35;
    
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    
    const stats = [
      `Pipes Cleared: ${summary.pipesCleared}`,
      `Max Combo: ${summary.maxCombo}`,
      `Efficiency: ${summary.efficiency}%`,
      `Duration: ${this.formatDuration(summary.activeDuration)}`
    ];
    
    stats.forEach((stat, index) => {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.fadeIn})`;
      ctx.fillText(stat, centerX, y + (index * lineHeight));
    });
  }
  
  renderInstructions(ctx) {
    const centerX = ctx.canvas.width / 2;
    const y = ctx.canvas.height - 100;
    
    ctx.font = '22px Arial';
    ctx.fillStyle = `rgba(255, 255, 255, ${this.fadeIn})`;
    ctx.fillText('Press SPACE to restart', centerX, y);
    
    ctx.font = '18px Arial';
    ctx.fillStyle = `rgba(180, 180, 180, ${this.fadeIn})`;
    ctx.fillText('Press ESC for menu', centerX, y + 35);
  }
  
  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  }
}
```


---

## Complete Integration

### Ghosty Controller

**Unified Ghosty Management**:
```javascript
// ✅ GOOD: Complete Ghosty controller
class GhostyController {
  constructor(config, canvasHeight) {
    this.config = config;
    this.canvasHeight = canvasHeight;
    
    // Create Ghosty
    this.ghosty = new Ghosty(100, 300, config);
    
    // Create controllers
    this.jumpController = new GhostyJumpController(
      this.ghosty,
      null, // audioManager - set later
      null  // particleSystem - set later
    );
    
    this.boundaryController = new GhostyBoundaryController(
      this.ghosty,
      canvasHeight
    );
    
    this.collisionDetector = new CollisionDetector(config);
    
    this.collisionResponseHandler = new CollisionResponseHandler(
      this.ghosty,
      null, // audioManager - set later
      null, // particleSystem - set later
      null  // screenShake - set later
    );
  }
  
  setAudioManager(audioManager) {
    this.jumpController.audioManager = audioManager;
    this.collisionResponseHandler.audioManager = audioManager;
  }
  
  setParticleSystem(particleSystem) {
    this.jumpController.particleSystem = particleSystem;
    this.collisionResponseHandler.particleSystem = particleSystem;
  }
  
  setScreenShake(screenShake) {
    this.collisionResponseHandler.screenShake = screenShake;
  }
  
  update(deltaTime) {
    // Update Ghosty physics
    this.ghosty.update(deltaTime);
    
    // Update boundary constraints
    this.boundaryController.update();
    
    // Update jump controller
    this.jumpController.update(deltaTime);
  }
  
  jump() {
    return this.jumpController.jump();
  }
  
  checkCollisions(pipes) {
    return this.collisionDetector.checkAllCollisions(
      this.ghosty,
      pipes,
      this.canvasHeight
    );
  }
  
  handleCollision(collision) {
    return this.collisionResponseHandler.handleCollision(collision);
  }
  
  reset() {
    this.ghosty.reset();
  }
  
  getGhosty() {
    return this.ghosty;
  }
}
```

### Complete Game Integration

**Using Ghosty in Game Loop**:
```javascript
// ✅ GOOD: Complete game with Ghosty integration
class FlappyKiroGame {
  constructor(canvas, config) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.config = config;
    
    // Initialize systems
    this.initializeSystems();
    
    // Game state
    this.state = 'menu'; // menu, playing, paused, gameOver
    this.score = 0;
    this.timeScale = 1.0;
    
    // Setup input
    this.setupInput();
  }
  
  initializeSystems() {
    // Ghosty controller
    this.ghostyController = new GhostyController(
      this.config,
      this.canvas.height
    );
    
    // Other systems
    this.audioManager = new AudioManager(this.config);
    this.particleSystem = new ParticleSystem();
    this.screenShake = new ScreenShake(this.config);
    this.pipeGenerator = new PipeGenerator(this.config, this.canvas.height);
    this.persistence = new PersistenceController(this.config);
    
    // Connect systems
    this.ghostyController.setAudioManager(this.audioManager);
    this.ghostyController.setParticleSystem(this.particleSystem);
    this.ghostyController.setScreenShake(this.screenShake);
    
    // Game over handler
    this.gameOverHandler = new GameOverStateHandler(this);
    this.gameOverEffects = new GameOverEffects(
      this.renderer,
      this.ghostyController.getGhosty()
    );
    this.gameOverUI = new GameOverUI(this.persistence);
    
    // Pipes
    this.pipes = [];
  }
  
  setupInput() {
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        this.handleJump();
      } else if (e.code === 'KeyR') {
        this.handleRestart();
      } else if (e.code === 'Escape') {
        this.handleMenu();
      }
    });
    
    this.canvas.addEventListener('click', () => {
      this.handleJump();
    });
  }
  
  handleJump() {
    if (this.state === 'menu') {
      this.startGame();
    } else if (this.state === 'playing') {
      this.ghostyController.jump();
      this.persistence.getCurrentSession()?.recordJump();
    } else if (this.state === 'gameOver') {
      this.restartGame();
    }
  }
  
  handleRestart() {
    if (this.state === 'playing' || this.state === 'gameOver') {
      this.restartGame();
    }
  }
  
  handleMenu() {
    if (this.state === 'gameOver') {
      this.returnToMenu();
    }
  }
  
  startGame() {
    // Start session
    this.persistence.startSession();
    
    // Reset game
    this.score = 0;
    this.ghostyController.reset();
    this.pipes = [];
    this.pipeGenerator.reset();
    this.screenShake.reset();
    this.gameOverHandler.reset();
    
    // Change state
    this.state = 'playing';
    
    console.log('Game started');
  }
  
  restartGame() {
    // End current session if active
    if (this.state === 'gameOver') {
      this.gameOverUI.hide();
    }
    
    // Start new game
    this.startGame();
  }
  
  returnToMenu() {
    this.state = 'menu';
    this.gameOverUI.hide();
  }
  
  update(deltaTime) {
    // Apply time scale
    const scaledDelta = deltaTime * this.timeScale;
    
    // Update based on state
    if (this.state === 'playing') {
      this.updatePlaying(scaledDelta);
    } else if (this.state === 'gameOver') {
      this.updateGameOver(scaledDelta);
    }
    
    // Always update effects
    this.screenShake.update();
    this.particleSystem.update(scaledDelta);
  }
  
  updatePlaying(deltaTime) {
    // Update Ghosty
    this.ghostyController.update(deltaTime);
    
    // Update pipes
    this.updatePipes(deltaTime);
    
    // Check collisions
    const collision = this.ghostyController.checkCollisions(this.pipes);
    if (collision.collided) {
      this.handleCollision(collision);
    }
    
    // Check scoring
    this.checkScoring();
  }
  
  updateGameOver(deltaTime) {
    // Continue Ghosty death animation
    this.ghostyController.getGhosty().update(deltaTime);
    
    // Update game over effects
    this.gameOverEffects.update();
    this.gameOverUI.update();
  }
  
  handleCollision(collision) {
    // Handle collision response
    const collisionData = this.ghostyController.handleCollision(collision);
    
    // Record collision in session
    this.persistence.getCurrentSession()?.recordCollision(collision.type);
    
    // Trigger game over
    this.gameOverHandler.trigger(collisionData);
    
    // Start game over effects
    this.gameOverEffects.start();
  }
  
  endSession() {
    // End session and get results
    const result = this.persistence.endSession();
    
    // Show game over UI
    this.gameOverUI.show();
    
    // Store result for UI
    this.lastSessionResult = result;
  }
  
  updatePipes(deltaTime) {
    // Generate new pipes
    if (this.pipeGenerator.shouldGeneratePipe(this.canvas.width)) {
      const pipe = this.pipeGenerator.generatePipe();
      this.pipes.push(pipe);
    }
    
    // Update existing pipes
    for (const pipe of this.pipes) {
      pipe.x -= pipe.speed * deltaTime;
    }
    
    // Remove off-screen pipes
    this.pipes = this.pipes.filter(pipe => pipe.x + pipe.width > 0);
  }
  
  checkScoring() {
    const ghosty = this.ghostyController.getGhosty();
    
    for (const pipe of this.pipes) {
      if (!pipe.scored && pipe.x + pipe.width < ghosty.x) {
        pipe.scored = true;
        this.score++;
        
        // Record in session
        this.persistence.getCurrentSession()?.recordPipeCleared();
        this.persistence.getCurrentSession()?.recordScore(this.score);
        
        // Play sound
        this.audioManager.playSound('score');
      }
    }
  }
  
  render() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Apply screen shake
    const shakeOffset = this.screenShake.getOffset();
    this.ctx.save();
    this.ctx.translate(shakeOffset.x, shakeOffset.y);
    
    // Render based on state
    if (this.state === 'menu') {
      this.renderMenu();
    } else if (this.state === 'playing' || this.state === 'gameOver') {
      this.renderGame();
    }
    
    this.ctx.restore();
    
    // Render game over effects (no shake)
    if (this.state === 'gameOver') {
      this.gameOverEffects.render(this.ctx);
      this.gameOverUI.render(this.ctx, this.lastSessionResult);
    }
  }
  
  renderGame() {
    // Render pipes
    for (const pipe of this.pipes) {
      this.renderPipe(pipe);
    }
    
    // Render Ghosty
    this.renderGhosty();
    
    // Render particles
    this.particleSystem.render(this.ctx);
    
    // Render HUD
    this.renderHUD();
  }
  
  renderGhosty() {
    const ghosty = this.ghostyController.getGhosty();
    
    this.ctx.save();
    this.ctx.translate(ghosty.x + ghosty.width / 2, ghosty.y + ghosty.height / 2);
    this.ctx.rotate((ghosty.rotation * Math.PI) / 180);
    
    if (ghosty.spriteLoaded) {
      this.ctx.drawImage(
        ghosty.sprite,
        -ghosty.width / 2,
        -ghosty.height / 2 + ghosty.bobOffset,
        ghosty.width,
        ghosty.height
      );
    } else {
      // Fallback rectangle
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.fillRect(
        -ghosty.width / 2,
        -ghosty.height / 2,
        ghosty.width,
        ghosty.height
      );
    }
    
    this.ctx.restore();
    
    // Debug: render hitbox
    if (this.config.debug) {
      this.renderGhostyHitbox(ghosty);
    }
  }
  
  renderGhostyHitbox(ghosty) {
    const circle = ghosty.getCircle();
    
    this.ctx.save();
    this.ctx.strokeStyle = ghosty.isInvincible() ? '#FFD700' : '#FF0000';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.restore();
  }
  
  renderHUD() {
    this.ctx.save();
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = 'bold 36px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(this.score, this.canvas.width / 2, 60);
    
    // High score
    this.ctx.font = '18px Arial';
    this.ctx.fillText(`Best: ${this.persistence.getHighScore()}`, this.canvas.width / 2, 90);
    this.ctx.restore();
  }
}
```


---

## Best Practices Checklist

### Ghosty Behavior
- [ ] Apply frame-rate independent physics
- [ ] Clamp velocity to prevent extreme speeds
- [ ] Update rotation based on velocity
- [ ] Provide visual feedback for all actions
- [ ] Handle death animation smoothly
- [ ] Reset all state properly on restart

### Collision Detection
- [ ] Use circular hitbox for Ghosty (more forgiving)
- [ ] Use rectangular hitboxes for pipes
- [ ] Check boundary collisions first
- [ ] Optimize pipe collision checks (skip far pipes)
- [ ] Respect invincibility frames
- [ ] Provide accurate collision data

### Collision Response
- [ ] Play appropriate sound effects
- [ ] Trigger screen shake for impact
- [ ] Spawn collision particles
- [ ] Kill Ghosty immediately
- [ ] Record collision type for statistics
- [ ] Provide visual feedback

### Game Over Handling
- [ ] Transition smoothly to game over state
- [ ] Continue death animation
- [ ] Display comprehensive session results
- [ ] Show new high score indicator
- [ ] Provide clear restart instructions
- [ ] Save session data immediately

### Visual Effects
- [ ] Screen shake intensity matches collision type
- [ ] Particles use appropriate colors
- [ ] Fade effects are smooth
- [ ] Flash effects are brief
- [ ] Death animation is clear
- [ ] UI fades in smoothly

### Performance
- [ ] Minimize collision checks
- [ ] Use squared distance (avoid sqrt)
- [ ] Cache hitbox calculations
- [ ] Limit particle count
- [ ] Optimize rendering
- [ ] Clean up effects properly

---

## Testing Patterns

### Ghosty Physics Tests

**Test Physics Behavior**:
```javascript
// ✅ GOOD: Ghosty physics tests
describe('Ghosty Physics', () => {
  let ghosty;
  let config;
  
  beforeEach(() => {
    config = {
      ghost: { width: 34, height: 24, hitboxRadius: 12, spritePath: 'test.png' },
      physics: {
        gravity: 800,
        jumpVelocity: -300,
        terminalVelocity: 600,
        maxUpwardVelocity: -600
      }
    };
    ghosty = new Ghosty(100, 300, config);
  });
  
  test('should apply gravity correctly', () => {
    const deltaTime = 1.0; // 1 second
    ghosty.update(deltaTime);
    
    // velocity = 0 + 800 * 1.0 = 800, clamped to 600
    expect(ghosty.velocity).toBe(600);
  });
  
  test('should jump with correct velocity', () => {
    ghosty.velocity = 100; // Falling
    ghosty.jump();
    
    expect(ghosty.velocity).toBe(-300);
  });
  
  test('should clamp velocity to terminal velocity', () => {
    ghosty.velocity = 1000;
    ghosty.update(0.01);
    
    expect(ghosty.velocity).toBeLessThanOrEqual(600);
  });
  
  test('should update rotation based on velocity', () => {
    ghosty.velocity = 200; // Falling
    ghosty.updateRotation();
    
    expect(ghosty.rotation).toBeGreaterThan(0); // Nose down
  });
});
```


### Collision Detection Tests

**Test Collision Accuracy**:
```javascript
// ✅ GOOD: Collision detection tests
describe('CollisionDetector', () => {
  let detector;
  let config;
  
  beforeEach(() => {
    config = {};
    detector = new CollisionDetector(config);
  });
  
  test('should detect circle-rect collision', () => {
    const circle = { x: 50, y: 50, radius: 10 };
    const rect = { x: 55, y: 55, width: 20, height: 20 };
    
    const collided = detector.checkCircleRectCollision(circle, rect);
    expect(collided).toBe(true);
  });
  
  test('should not detect when not overlapping', () => {
    const circle = { x: 10, y: 10, radius: 5 };
    const rect = { x: 50, y: 50, width: 20, height: 20 };
    
    const collided = detector.checkCircleRectCollision(circle, rect);
    expect(collided).toBe(false);
  });
  
  test('should detect ceiling collision', () => {
    const ghosty = {
      getCircle: () => ({ x: 100, y: 5, radius: 12 }),
      isInvincible: () => false
    };
    
    const collision = detector.checkGhostyBoundaryCollision(ghosty, 600);
    expect(collision.collided).toBe(true);
    expect(collision.type).toBe('ceiling');
  });
  
  test('should detect ground collision', () => {
    const ghosty = {
      getCircle: () => ({ x: 100, y: 595, radius: 12 }),
      isInvincible: () => false
    };
    
    const collision = detector.checkGhostyBoundaryCollision(ghosty, 600);
    expect(collision.collided).toBe(true);
    expect(collision.type).toBe('ground');
  });
  
  test('should skip collision when invincible', () => {
    const ghosty = {
      getCircle: () => ({ x: 100, y: 5, radius: 12 }),
      isInvincible: () => true
    };
    
    const collision = detector.checkAllCollisions(ghosty, [], 600);
    expect(collision.collided).toBe(false);
    expect(collision.type).toBe('invincible');
  });
});
```

### Game Over Tests

**Test Game Over Flow**:
```javascript
// ✅ GOOD: Game over state tests
describe('GameOverStateHandler', () => {
  let handler;
  let game;
  
  beforeEach(() => {
    game = {
      state: 'playing',
      timeScale: 1.0,
      endSession: jest.fn()
    };
    handler = new GameOverStateHandler(game);
  });
  
  test('should trigger game over', () => {
    const collisionData = {
      type: 'pipe_top',
      position: { x: 100, y: 200 },
      timestamp: Date.now()
    };
    
    handler.trigger(collisionData);
    
    expect(handler.isActive()).toBe(true);
    expect(handler.collisionData).toEqual(collisionData);
  });
  
  test('should not trigger twice', () => {
    const collisionData = { type: 'pipe_top', position: { x: 100, y: 200 } };
    
    handler.trigger(collisionData);
    const firstActive = handler.isActive();
    
    handler.trigger(collisionData);
    const secondActive = handler.isActive();
    
    expect(firstActive).toBe(true);
    expect(secondActive).toBe(true);
    expect(handler.collisionData.timestamp).toBeDefined();
  });
  
  test('should execute callbacks', () => {
    const callback = jest.fn();
    handler.registerCallback(callback);
    
    const collisionData = { type: 'pipe_top', position: { x: 100, y: 200 } };
    handler.trigger(collisionData);
    
    expect(callback).toHaveBeenCalledWith(collisionData);
  });
  
  test('should reset properly', () => {
    handler.trigger({ type: 'pipe_top', position: { x: 100, y: 200 } });
    handler.reset();
    
    expect(handler.isActive()).toBe(false);
    expect(handler.collisionData).toBeNull();
    expect(game.timeScale).toBe(1.0);
  });
});
```

---

## Common Patterns

### Invincibility Pattern

**Temporary Invincibility**:
```javascript
// ✅ GOOD: Invincibility system
class InvincibilityManager {
  constructor(ghosty, config) {
    this.ghosty = ghosty;
    this.duration = config.collision.invincibilityDuration; // frames
    this.remaining = 0;
  }
  
  start() {
    this.remaining = this.duration;
    this.ghosty.setInvincible(true);
    console.log(`Invincibility started (${this.duration} frames)`);
  }
  
  update() {
    if (this.remaining > 0) {
      this.remaining--;
      
      if (this.remaining === 0) {
        this.ghosty.setInvincible(false);
        console.log('Invincibility ended');
      }
    }
  }
  
  isActive() {
    return this.remaining > 0;
  }
  
  getRemainingFrames() {
    return this.remaining;
  }
  
  getRemainingPercent() {
    return this.remaining / this.duration;
  }
}
```

### Death Replay Pattern

**Replay Last Moments**:
```javascript
// ✅ GOOD: Death replay system
class DeathReplay {
  constructor(maxFrames = 120) {
    this.maxFrames = maxFrames;
    this.frames = [];
    this.recording = false;
    this.playing = false;
    this.playbackIndex = 0;
  }
  
  startRecording() {
    this.recording = true;
    this.frames = [];
  }
  
  stopRecording() {
    this.recording = false;
  }
  
  recordFrame(ghostyState) {
    if (!this.recording) return;
    
    this.frames.push({
      x: ghostyState.x,
      y: ghostyState.y,
      velocity: ghostyState.velocity,
      rotation: ghostyState.rotation,
      timestamp: Date.now()
    });
    
    // Keep only last N frames
    if (this.frames.length > this.maxFrames) {
      this.frames.shift();
    }
  }
  
  startPlayback() {
    this.playing = true;
    this.playbackIndex = 0;
  }
  
  stopPlayback() {
    this.playing = false;
    this.playbackIndex = 0;
  }
  
  getNextFrame() {
    if (!this.playing || this.playbackIndex >= this.frames.length) {
      return null;
    }
    
    return this.frames[this.playbackIndex++];
  }
  
  isComplete() {
    return this.playbackIndex >= this.frames.length;
  }
}
```

---

## References

- **Design Document**: `.kiro/specs/flappy-kiro/design.md`
- **Requirements**: `.kiro/specs/flappy-kiro/requirements.md`
- **Game Mechanics**: `.kiro/steering/game-mechanics.md`
- **Session Management**: `.kiro/steering/session-and-persistence.md`
- **Visual Design**: `.kiro/steering/visual-design.md`
- **Audio Integration**: `.kiro/steering/audio-visual-integration.md`
