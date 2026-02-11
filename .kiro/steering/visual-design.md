---
inclusion: auto
---

# Visual Design Patterns for Flappy Kiro

## Overview

This document defines visual design patterns for sprite rendering, animation systems, and particle effects in Flappy Kiro. All patterns prioritize performance while maintaining the retro aesthetic.

## Sprite Rendering Patterns

### Basic Sprite Rendering

**Draw Sprite with Rotation**:
```javascript
// ✅ GOOD: Render sprite with rotation
class Renderer {
  renderGhost(ghost) {
    this.ctx.save();
    
    // Translate to sprite center
    this.ctx.translate(
      ghost.x + ghost.width / 2,
      ghost.y + ghost.height / 2
    );
    
    // Rotate around center
    this.ctx.rotate(ghost.rotation * Math.PI / 180);
    
    // Draw sprite centered
    this.ctx.drawImage(
      ghost.sprite,
      -ghost.width / 2,
      -ghost.height / 2,
      ghost.width,
      ghost.height
    );
    
    this.ctx.restore();
  }
}

// Sprite details:
// - Source: ghosty.png (32x32px)
// - Rendered: 34x24px (scaled)
// - Rotation: -25° to +25° based on velocity
// - Center point: (width/2, height/2)
```

### Sprite Sheet Rendering (Future)

**Draw from Sprite Sheet**:
```javascript
// ✅ GOOD: Render specific frame from sprite sheet
class Renderer {
  renderGhostFrame(ghost, animationState) {
    const frameWidth = 32;
    const frameHeight = 32;
    const frameIndex = this.getFrameIndex(animationState);
    
    this.ctx.save();
    this.ctx.translate(ghost.x + ghost.width / 2, ghost.y + ghost.height / 2);
    this.ctx.rotate(ghost.rotation * Math.PI / 180);
    
    // Draw specific frame from sprite sheet
    this.ctx.drawImage(
      ghost.spriteSheet,                    // Sprite sheet image
      frameIndex * frameWidth, 0,           // Source X, Y
      frameWidth, frameHeight,              // Source width, height
      -ghost.width / 2, -ghost.height / 2,  // Destination X, Y
      ghost.width, ghost.height             // Destination width, height
    );
    
    this.ctx.restore();
  }
  
  getFrameIndex(animationState) {
    // Idle: frames 0-1
    // Flap: frames 2-4
    // Death: frames 5-8
    switch (animationState.type) {
      case 'idle': return animationState.frame % 2;
      case 'flap': return 2 + (animationState.frame % 3);
      case 'death': return 5 + (animationState.frame % 4);
      default: return 0;
    }
  }
}
```

### Pipe Rendering

**Batch Render Pipes**:
```javascript
// ✅ GOOD: Batch render all pipes
class Renderer {
  renderPipes(pipes) {
    // Set style once for all pipe bodies
    this.ctx.fillStyle = '#00AA00'; // Green
    
    // Draw all pipe bodies
    for (const pipe of pipes) {
      // Top pipe
      this.ctx.fillRect(pipe.x, 0, pipe.width, pipe.topHeight);
      
      // Bottom pipe
      this.ctx.fillRect(pipe.x, pipe.bottomY, pipe.width, pipe.bottomHeight);
    }
    
    // Set style once for all pipe caps
    this.ctx.fillStyle = '#00CC00'; // Lighter green
    
    // Draw all pipe caps
    for (const pipe of pipes) {
      // Top cap
      this.ctx.fillRect(
        pipe.x - 2,
        pipe.topHeight - 20,
        pipe.width + 4,
        20
      );
      
      // Bottom cap
      this.ctx.fillRect(
        pipe.x - 2,
        pipe.bottomY,
        pipe.width + 4,
        20
      );
    }
  }
}

// Pipe rendering:
// - Width: 52px
// - Cap overhang: 2px on each side
// - Cap height: 20px
// - Body color: #00AA00
// - Cap color: #00CC00
```

### Image Smoothing

**Pixel-Perfect Rendering**:
```javascript
// ✅ GOOD: Disable smoothing for pixel art
class Renderer {
  constructor(ctx, config) {
    this.ctx = ctx;
    this.config = config;
    
    // Disable image smoothing for crisp pixels
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.webkitImageSmoothingEnabled = false;
    this.ctx.mozImageSmoothingEnabled = false;
    this.ctx.msImageSmoothingEnabled = false;
  }
}

// Why disable smoothing?
// - Maintains pixel art aesthetic
// - Prevents blurry sprites
// - Keeps retro look
// - Standard for pixel art games
```

---

## Animation Systems

### Animation State Machine

**Track Animation States**:
```javascript
// ✅ GOOD: Animation state manager
class AnimationState {
  constructor() {
    this.type = 'idle';        // idle, flap, death
    this.frame = 0;            // Current frame index
    this.elapsed = 0;          // Time elapsed in current frame
    this.duration = 200;       // Frame duration in ms
    this.loop = true;          // Whether animation loops
  }
  
  update(deltaTime) {
    this.elapsed += deltaTime * 1000; // Convert to ms
    
    if (this.elapsed >= this.duration) {
      this.elapsed -= this.duration;
      this.frame++;
      
      // Handle loop or completion
      if (!this.loop && this.frame >= this.getFrameCount()) {
        this.frame = this.getFrameCount() - 1; // Hold last frame
      } else {
        this.frame = this.frame % this.getFrameCount();
      }
    }
  }
  
  getFrameCount() {
    switch (this.type) {
      case 'idle': return 2;
      case 'flap': return 3;
      case 'death': return 4;
      default: return 1;
    }
  }
  
  setState(type, duration, loop = true) {
    if (this.type === type) return;
    
    this.type = type;
    this.frame = 0;
    this.elapsed = 0;
    this.duration = duration;
    this.loop = loop;
  }
}

// Usage
class Ghost {
  constructor(x, y, sprite, config) {
    this.x = x;
    this.y = y;
    this.sprite = sprite;
    this.animation = new AnimationState();
  }
  
  update(deltaTime) {
    // Update physics
    this.updatePhysics(deltaTime);
    
    // Update animation
    this.animation.update(deltaTime);
  }
  
  jump() {
    this.velocity = -300;
    this.animation.setState('flap', 100, false); // 100ms per frame, no loop
  }
  
  die() {
    this.animation.setState('death', 150, false); // 150ms per frame, no loop
  }
}
```

### Frame Timing

**Consistent Animation Speed**:
```javascript
// ✅ GOOD: Frame-rate independent animation
class AnimationController {
  constructor(frameCount, frameDuration) {
    this.frameCount = frameCount;
    this.frameDuration = frameDuration; // In milliseconds
    this.currentFrame = 0;
    this.elapsed = 0;
  }
  
  update(deltaTime) {
    this.elapsed += deltaTime * 1000; // Convert seconds to ms
    
    while (this.elapsed >= this.frameDuration) {
      this.elapsed -= this.frameDuration;
      this.currentFrame = (this.currentFrame + 1) % this.frameCount;
    }
  }
  
  getCurrentFrame() {
    return this.currentFrame;
  }
  
  reset() {
    this.currentFrame = 0;
    this.elapsed = 0;
  }
}

// Animation timings:
// Idle: 200ms per frame (5 FPS)
// Flap: 100ms per frame (10 FPS)
// Death: 150ms per frame (6.67 FPS)
```

### Rotation Animation

**Smooth Rotation Based on Velocity**:
```javascript
// ✅ GOOD: Velocity-based rotation
class Ghost {
  updateRotation() {
    // Target rotation based on velocity
    const targetRotation = this.velocity * 0.05;
    
    // Clamp to prevent extreme angles
    const clampedTarget = Math.max(-25, Math.min(25, targetRotation));
    
    // Smooth interpolation (optional)
    const lerpFactor = 0.2;
    this.rotation += (clampedTarget - this.rotation) * lerpFactor;
  }
}

// Rotation behavior:
// - Falling (velocity > 0): Nose down (positive rotation)
// - Rising (velocity < 0): Nose up (negative rotation)
// - Range: -25° to +25°
// - Smooth interpolation for natural movement
```

---

## Particle Effect Guidelines

### Particle System Architecture

**Particle Pool for Performance**:
```javascript
// ✅ GOOD: Particle pool to avoid garbage collection
class ParticlePool {
  constructor(maxParticles = 50) {
    this.pool = [];
    this.active = [];
    this.maxParticles = maxParticles;
    
    // Pre-allocate particles
    for (let i = 0; i < maxParticles; i++) {
      this.pool.push(new Particle());
    }
  }
  
  spawn(x, y) {
    let particle;
    
    if (this.pool.length > 0) {
      // Reuse from pool
      particle = this.pool.pop();
      particle.reset(x, y);
    } else if (this.active.length < this.maxParticles) {
      // Create new if under limit
      particle = new Particle(x, y);
    } else {
      // Pool exhausted, skip spawn
      return null;
    }
    
    this.active.push(particle);
    return particle;
  }
  
  update(deltaTime) {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const particle = this.active[i];
      particle.update(deltaTime);
      
      if (particle.isDead()) {
        // Return to pool
        this.active.splice(i, 1);
        this.pool.push(particle);
      }
    }
  }
  
  render(ctx) {
    for (const particle of this.active) {
      particle.render(ctx);
    }
  }
  
  clear() {
    // Return all active particles to pool
    this.pool.push(...this.active);
    this.active = [];
  }
}
```

### Particle Implementation

**Ghost Trail Particles**:
```javascript
// ✅ GOOD: Particle with lifecycle
class Particle {
  constructor(x = 0, y = 0) {
    this.reset(x, y);
  }
  
  reset(x, y) {
    this.x = x;
    this.y = y;
    
    // Random velocity
    this.vx = (Math.random() - 0.5) * 2;  // -1 to 1 px/frame
    this.vy = (Math.random() - 0.5) * 2;
    
    // Lifecycle
    this.life = 1.0;                       // Full life
    this.decay = 0.02;                     // Decay per frame
    
    // Visual
    this.size = Math.random() * 3 + 2;     // 2-5 pixels
    this.color = 'rgba(255, 255, 255, 1)';
  }
  
  update(deltaTime) {
    // Update position
    this.x += this.vx * deltaTime * 60; // Scale for frame rate
    this.y += this.vy * deltaTime * 60;
    
    // Decay life
    this.life -= this.decay;
    
    // Update color with fading alpha
    this.color = `rgba(255, 255, 255, ${this.life})`;
  }
  
  render(ctx) {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
  
  isDead() {
    return this.life <= 0;
  }
}

// Particle properties:
// - Size: 2-5 pixels (random)
// - Color: White with fading alpha
// - Velocity: Random ±1 px/frame
// - Life: 1.0 to 0.0 (50 frames at 0.02 decay)
// - Spawn rate: 30% chance per frame
```

### Score Indicator Particles

**Floating Score Text**:
```javascript
// ✅ GOOD: Score indicator with animation
class ScoreIndicator {
  constructor(x, y, value) {
    this.x = x;
    this.y = y;
    this.value = value;
    
    // Animation
    this.life = 1.0;
    this.decay = 0.03;
    this.vy = -1; // Float upward (pixels per frame)
    
    // Visual
    this.fontSize = 24;
    this.color = '#FFD700'; // Gold
  }
  
  update(deltaTime) {
    // Float upward
    this.y += this.vy * deltaTime * 60;
    
    // Fade out
    this.life -= this.decay;
  }
  
  render(ctx) {
    ctx.save();
    ctx.globalAlpha = this.life;
    ctx.fillStyle = this.color;
    ctx.font = `bold ${this.fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`+${this.value}`, this.x, this.y);
    ctx.restore();
  }
  
  isDead() {
    return this.life <= 0;
  }
}

// Score indicator:
// - Text: "+1" in gold
// - Font: Bold 24px Arial
// - Animation: Float up 60px over 1 second
// - Fade: Linear from 1.0 to 0.0
// - Spawn: At pipe gap center when scored
```

### Particle Spawning

**Controlled Spawn Rate**:
```javascript
// ✅ GOOD: Spawn particles with probability
class Game {
  updateParticles(deltaTime) {
    // Only spawn during gameplay
    if (!this.state.isPlaying()) return;
    
    // Spawn with 30% probability per frame
    if (Math.random() < 0.3) {
      const ghost = this.entities.ghost;
      this.particlePool.spawn(
        ghost.x + ghost.width / 2,
        ghost.y + ghost.height / 2
      );
    }
    
    // Update all particles
    this.particlePool.update(deltaTime);
  }
  
  renderParticles() {
    this.particlePool.render(this.ctx);
  }
}

// Spawn rate:
// - Probability: 30% per frame
// - At 120 FPS: ~36 particles per second
// - At 60 FPS: ~18 particles per second
// - Max active: 50 particles (enforced by pool)
```

---

## Visual Effects

### Screen Shake Effect

**Camera Shake on Collision**:
```javascript
// ✅ GOOD: Screen shake with decay
class ScreenShake {
  constructor(intensity = 10, duration = 30) {
    this.intensity = intensity;
    this.duration = duration;
    this.currentDuration = 0;
    this.offsetX = 0;
    this.offsetY = 0;
    this.active = false;
  }
  
  trigger() {
    this.active = true;
    this.currentDuration = this.duration;
  }
  
  update() {
    if (!this.active) {
      this.offsetX = 0;
      this.offsetY = 0;
      return;
    }
    
    if (this.currentDuration > 0) {
      // Calculate decay
      const progress = this.currentDuration / this.duration;
      const currentIntensity = this.intensity * progress;
      
      // Random offset
      this.offsetX = (Math.random() - 0.5) * currentIntensity * 2;
      this.offsetY = (Math.random() - 0.5) * currentIntensity * 2;
      
      this.currentDuration--;
    } else {
      this.active = false;
      this.offsetX = 0;
      this.offsetY = 0;
    }
  }
  
  apply(ctx) {
    if (this.active) {
      ctx.translate(this.offsetX, this.offsetY);
    }
  }
}

// Usage in renderer
class Renderer {
  render() {
    this.ctx.save();
    
    // Apply screen shake
    this.screenShake.apply(this.ctx);
    
    // Render game
    this.renderBackground();
    this.renderPipes();
    this.renderGhost();
    
    this.ctx.restore();
  }
}

// Screen shake:
// - Intensity: 10px maximum offset
// - Duration: 30 frames (0.25s at 120 FPS)
// - Decay: Linear from full to zero
// - Random: New offset each frame
```

### Invincibility Flash

**Visual Feedback for Invincibility**:
```javascript
// ✅ GOOD: Flashing indicator
class Renderer {
  renderInvincibilityIndicator(ghost, isInvincible) {
    if (!isInvincible) return;
    
    // Flash on/off every 100ms
    const flashOn = Math.floor(Date.now() / 100) % 2 === 0;
    
    if (flashOn) {
      const circle = ghost.getCircle();
      
      this.ctx.save();
      this.ctx.strokeStyle = '#FFD700'; // Gold
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(
        circle.x,
        circle.y,
        circle.radius + 2,
        0,
        Math.PI * 2
      );
      this.ctx.stroke();
      this.ctx.restore();
    }
  }
}

// Invincibility indicator:
// - Color: Gold (#FFD700)
// - Shape: Circle around hitbox
// - Radius: Hitbox radius + 2px
// - Flash rate: 100ms on/off (10 Hz)
// - Duration: First 120 frames of gameplay
```

### Color Transitions

**Smooth Color Fading**:
```javascript
// ✅ GOOD: Interpolate colors
function lerpColor(color1, color2, t) {
  // Parse RGB values
  const r1 = parseInt(color1.slice(1, 3), 16);
  const g1 = parseInt(color1.slice(3, 5), 16);
  const b1 = parseInt(color1.slice(5, 7), 16);
  
  const r2 = parseInt(color2.slice(1, 3), 16);
  const g2 = parseInt(color2.slice(3, 5), 16);
  const b2 = parseInt(color2.slice(5, 7), 16);
  
  // Interpolate
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  
  // Convert back to hex
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Usage for fade effects
class FadeEffect {
  constructor(startColor, endColor, duration) {
    this.startColor = startColor;
    this.endColor = endColor;
    this.duration = duration;
    this.elapsed = 0;
  }
  
  update(deltaTime) {
    this.elapsed += deltaTime;
  }
  
  getCurrentColor() {
    const t = Math.min(this.elapsed / this.duration, 1.0);
    return lerpColor(this.startColor, this.endColor, t);
  }
}
```

---

## Rendering Order

### Z-Index Layering

**Render from Back to Front**:
```javascript
// ✅ GOOD: Proper rendering order
class Renderer {
  render(entities, state) {
    // 1. Clear canvas
    this.clear();
    
    // 2. Apply screen shake (affects everything)
    this.ctx.save();
    this.screenShake.apply(this.ctx);
    
    // 3. Background (furthest back)
    this.renderBackground();
    
    // 4. Pipes
    this.renderPipes(entities.pipes);
    
    // 5. Particles (behind ghost)
    this.renderParticles(entities.particles);
    
    // 6. Ghost (main character)
    this.renderGhost(entities.ghost);
    
    // 7. Invincibility indicator (on ghost)
    this.renderInvincibilityIndicator(entities.ghost, state.isInvincible());
    
    // 8. Score indicators (floating text)
    this.renderScoreIndicators(entities.scoreIndicators);
    
    // 9. HUD (always on top)
    this.renderScore(state.score, state.highScore);
    
    // 10. Overlays (pause, game over)
    if (state.isPaused()) {
      this.renderPauseOverlay();
    } else if (state.isGameOver()) {
      this.renderGameOver(state.score, state.highScore);
    }
    
    this.ctx.restore();
  }
}

// Rendering layers (back to front):
// 1. Background
// 2. Pipes
// 3. Particles
// 4. Ghost
// 5. Invincibility indicator
// 6. Score indicators
// 7. HUD
// 8. Overlays
```

---

## Performance Optimization

### Sprite Caching

**Pre-render Static Elements**:
```javascript
// ✅ GOOD: Cache background
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
    bgCtx.fillStyle = this.config.visual.backgroundColor;
    bgCtx.fillRect(0, 0, this.bgCanvas.width, this.bgCanvas.height);
  }
  
  clear() {
    // Draw pre-rendered background (fast!)
    this.ctx.drawImage(this.bgCanvas, 0, 0);
  }
}
```

### Culling

**Don't Render Off-Screen Objects**:
```javascript
// ✅ GOOD: Cull off-screen entities
class Renderer {
  renderPipes(pipes) {
    const screenLeft = 0;
    const screenRight = this.canvas.width;
    
    for (const pipe of pipes) {
      // Skip pipes completely off-screen
      if (pipe.x + pipe.width < screenLeft) continue;
      if (pipe.x > screenRight) break; // Pipes are sorted
      
      this.renderPipe(pipe);
    }
  }
}
```

---

## Visual Design Checklist

Before implementing visual effects:

- [ ] Sprites loaded and cached
- [ ] Image smoothing disabled for pixel art
- [ ] Rotation applied around sprite center
- [ ] Animation states defined and timed
- [ ] Particle pool implemented
- [ ] Rendering order correct (back to front)
- [ ] Screen shake applied before rendering
- [ ] Off-screen culling implemented
- [ ] Static elements pre-rendered
- [ ] Visual effects tested at 120 FPS

---

## References

- **Sprite Specs**: `kiro-introduction-starter-kit/ghosty-sprites.md`
- **UI Mockups**: `kiro-introduction-starter-kit/ui-mockups.md`
- **Canvas Patterns**: `.kiro/steering/canvas-and-collision-patterns.md`
- **Game Mechanics**: `.kiro/steering/game-mechanics.md`
