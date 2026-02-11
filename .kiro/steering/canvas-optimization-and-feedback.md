---
inclusion: auto
---

# Canvas Optimization and Visual Feedback Patterns

## Overview

This document provides advanced Canvas API optimization techniques, sprite atlas management, and visual feedback patterns for Flappy Kiro. These patterns ensure 120 FPS performance while delivering polished visual experiences.

## Core Optimization Principles

1. **Minimize State Changes**: Batch operations with the same rendering state
2. **Reduce Draw Calls**: Combine multiple draws into single operations
3. **Cache Static Content**: Pre-render unchanging elements
4. **Use Hardware Acceleration**: Leverage GPU-accelerated operations
5. **Avoid Allocations**: Reuse objects in hot paths

---

## Canvas Drawing Optimization

### Context State Management

**Minimize save/restore Calls**:
```javascript
// ❌ BAD: Excessive save/restore
class Renderer {
  renderEntities(entities) {
    for (const entity of entities) {
      this.ctx.save();
      this.ctx.fillStyle = entity.color;
      this.ctx.fillRect(entity.x, entity.y, entity.width, entity.height);
      this.ctx.restore();
    }
  }
}

// ✅ GOOD: Batch by state
class Renderer {
  renderEntities(entities) {
    // Group entities by color
    const byColor = new Map();
    for (const entity of entities) {
      if (!byColor.has(entity.color)) {
        byColor.set(entity.color, []);
      }
      byColor.get(entity.color).push(entity);
    }
    
    // Render each color group
    for (const [color, group] of byColor) {
      this.ctx.fillStyle = color;
      for (const entity of group) {
        this.ctx.fillRect(entity.x, entity.y, entity.width, entity.height);
      }
    }
  }
}

// Benefits:
// - Reduces state changes from N to unique_colors
// - Eliminates save/restore overhead
// - GPU can batch similar operations
```

**State Tracking Pattern**:
```javascript
// ✅ GOOD: Track and avoid redundant state changes
class OptimizedRenderer {
  constructor(ctx) {
    this.ctx = ctx;
    this.currentFillStyle = null;
    this.currentStrokeStyle = null;
    this.currentLineWidth = null;
  }
  
  setFillStyle(style) {
    if (this.currentFillStyle !== style) {
      this.ctx.fillStyle = style;
      this.currentFillStyle = style;
    }
  }
  
  setStrokeStyle(style) {
    if (this.currentStrokeStyle !== style) {
      this.ctx.strokeStyle = style;
      this.currentStrokeStyle = style;
    }
  }
  
  setLineWidth(width) {
    if (this.currentLineWidth !== width) {
      this.ctx.lineWidth = width;
      this.currentLineWidth = width;
    }
  }
  
  resetState() {
    this.currentFillStyle = null;
    this.currentStrokeStyle = null;
    this.currentLineWidth = null;
  }
}

// Usage
renderer.setFillStyle('#00AA00');
renderer.ctx.fillRect(0, 0, 100, 100);
renderer.setFillStyle('#00AA00'); // Skipped - already set
renderer.ctx.fillRect(100, 0, 100, 100);
```


### Off-Screen Canvas Optimization

**Pre-render Static Content**:
```javascript
// ✅ GOOD: Cache static backgrounds
class BackgroundCache {
  constructor(width, height, config) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext('2d', { alpha: false });
    this.config = config;
    
    this.render();
  }
  
  render() {
    // Render static background once
    this.ctx.fillStyle = this.config.visual.backgroundColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Add static decorations (clouds, ground, etc.)
    this.renderClouds();
    this.renderGround();
  }
  
  renderClouds() {
    // Draw static cloud sprites
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    this.ctx.fillRect(50, 100, 80, 40);
    this.ctx.fillRect(200, 150, 100, 50);
  }
  
  renderGround() {
    // Draw ground pattern
    this.ctx.fillStyle = '#8B7355';
    this.ctx.fillRect(0, this.canvas.height - 50, this.canvas.width, 50);
  }
  
  draw(targetCtx, x = 0, y = 0) {
    // Fast blit to main canvas
    targetCtx.drawImage(this.canvas, x, y);
  }
}

// Usage in main renderer
class Renderer {
  constructor(ctx, config) {
    this.ctx = ctx;
    this.bgCache = new BackgroundCache(
      config.canvas.width,
      config.canvas.height,
      config
    );
  }
  
  clear() {
    // Draw cached background (much faster than fillRect)
    this.bgCache.draw(this.ctx);
  }
}

// Performance gain:
// - fillRect: ~0.5ms per frame
// - drawImage: ~0.1ms per frame
// - 5x faster background rendering
```


**Layer Composition Pattern**:
```javascript
// ✅ GOOD: Multi-layer rendering system
class LayeredRenderer {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    
    // Create layers
    this.layers = {
      background: this.createLayer(false),  // No alpha
      game: this.createLayer(true),         // With alpha
      ui: this.createLayer(true),           // With alpha
      effects: this.createLayer(true)       // With alpha
    };
  }
  
  createLayer(alpha = true) {
    const canvas = document.createElement('canvas');
    canvas.width = this.width;
    canvas.height = this.height;
    const ctx = canvas.getContext('2d', { alpha });
    return { canvas, ctx, dirty: true };
  }
  
  renderBackground() {
    const layer = this.layers.background;
    if (!layer.dirty) return; // Skip if unchanged
    
    layer.ctx.fillStyle = '#87CEEB';
    layer.ctx.fillRect(0, 0, this.width, this.height);
    layer.dirty = false;
  }
  
  renderGame(entities) {
    const layer = this.layers.game;
    layer.ctx.clearRect(0, 0, this.width, this.height);
    
    // Render game entities
    this.renderPipes(layer.ctx, entities.pipes);
    this.renderGhost(layer.ctx, entities.ghost);
  }
  
  renderUI(state) {
    const layer = this.layers.ui;
    layer.ctx.clearRect(0, 0, this.width, this.height);
    
    // Render UI elements
    this.renderScore(layer.ctx, state.score, state.highScore);
  }
  
  renderEffects(effects) {
    const layer = this.layers.effects;
    layer.ctx.clearRect(0, 0, this.width, this.height);
    
    // Render particles and effects
    this.renderParticles(layer.ctx, effects.particles);
  }
  
  composite(targetCtx) {
    // Composite all layers to main canvas
    targetCtx.drawImage(this.layers.background.canvas, 0, 0);
    targetCtx.drawImage(this.layers.game.canvas, 0, 0);
    targetCtx.drawImage(this.layers.effects.canvas, 0, 0);
    targetCtx.drawImage(this.layers.ui.canvas, 0, 0);
  }
}

// Benefits:
// - Only redraw changed layers
// - Better cache utilization
// - Easier to manage z-ordering
// - Can apply layer-wide effects
```


### Batch Drawing Patterns

**Path Batching**:
```javascript
// ✅ GOOD: Batch path operations
class ParticleRenderer {
  renderParticles(ctx, particles) {
    if (particles.length === 0) return;
    
    // Begin single path for all particles
    ctx.fillStyle = 'rgba(255, 255, 255, 1)';
    ctx.beginPath();
    
    for (const particle of particles) {
      // Add each particle as a sub-path
      ctx.moveTo(particle.x + particle.size, particle.y);
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    }
    
    // Single fill operation for all particles
    ctx.fill();
    
    // Render particles with varying alpha separately
    for (const particle of particles) {
      if (particle.life < 1.0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${particle.life})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

// Performance:
// - N particles: N beginPath + N arc + N fill = 3N operations
// - Batched: 1 beginPath + N arc + 1 fill = N+2 operations
// - ~3x faster for large particle counts
```

**Rectangle Batching**:
```javascript
// ✅ GOOD: Batch rectangle draws
class PipeRenderer {
  renderPipes(ctx, pipes) {
    // Batch all pipe bodies
    ctx.fillStyle = '#00AA00';
    for (const pipe of pipes) {
      ctx.fillRect(pipe.x, 0, pipe.width, pipe.topHeight);
      ctx.fillRect(pipe.x, pipe.bottomY, pipe.width, pipe.bottomHeight);
    }
    
    // Batch all pipe caps
    ctx.fillStyle = '#00CC00';
    for (const pipe of pipes) {
      ctx.fillRect(pipe.x - 2, pipe.topHeight - 20, pipe.width + 4, 20);
      ctx.fillRect(pipe.x - 2, pipe.bottomY, pipe.width + 4, 20);
    }
  }
}

// Benefits:
// - 2 fillStyle changes instead of 2N
// - GPU can optimize consecutive fillRect calls
// - Better instruction cache utilization
```


---

## Sprite Atlas Management

### Atlas Structure

**Sprite Atlas Layout**:
```javascript
// Sprite atlas definition for Flappy Kiro
const SpriteAtlas = {
  image: null,  // Loaded atlas image
  
  // Sprite definitions (x, y, width, height in atlas)
  sprites: {
    // Ghost animation frames
    ghost_idle_0: { x: 0, y: 0, w: 32, h: 32 },
    ghost_idle_1: { x: 32, y: 0, w: 32, h: 32 },
    ghost_flap_0: { x: 64, y: 0, w: 32, h: 32 },
    ghost_flap_1: { x: 96, y: 0, w: 32, h: 32 },
    ghost_flap_2: { x: 128, y: 0, w: 32, h: 32 },
    ghost_death_0: { x: 160, y: 0, w: 32, h: 32 },
    ghost_death_1: { x: 192, y: 0, w: 32, h: 32 },
    ghost_death_2: { x: 224, y: 0, w: 32, h: 32 },
    ghost_death_3: { x: 256, y: 0, w: 32, h: 32 },
    
    // UI elements
    button_play: { x: 0, y: 32, w: 64, h: 32 },
    button_pause: { x: 64, y: 32, w: 64, h: 32 },
    
    // Decorations
    cloud_small: { x: 128, y: 32, w: 48, h: 24 },
    cloud_large: { x: 176, y: 32, w: 64, h: 32 }
  }
};

// Atlas dimensions: 288x64 pixels
// Benefits:
// - Single image load
// - Single GPU texture
// - Reduced draw call overhead
// - Better cache locality
```

### Atlas Loader

**Efficient Atlas Loading**:
```javascript
// ✅ GOOD: Atlas loader with promise
class SpriteAtlasLoader {
  constructor(atlasPath, atlasData) {
    this.atlasPath = atlasPath;
    this.atlasData = atlasData;
    this.image = null;
    this.loaded = false;
  }
  
  async load() {
    return new Promise((resolve, reject) => {
      this.image = new Image();
      
      this.image.onload = () => {
        this.loaded = true;
        console.log(`Atlas loaded: ${this.atlasPath}`);
        resolve(this);
      };
      
      this.image.onerror = (err) => {
        console.error(`Failed to load atlas: ${this.atlasPath}`, err);
        reject(err);
      };
      
      this.image.src = this.atlasPath;
    });
  }
  
  getSprite(name) {
    if (!this.loaded) {
      console.warn('Atlas not loaded yet');
      return null;
    }
    
    return this.atlasData.sprites[name] || null;
  }
  
  drawSprite(ctx, name, x, y, width, height) {
    const sprite = this.getSprite(name);
    if (!sprite) return;
    
    ctx.drawImage(
      this.image,
      sprite.x, sprite.y, sprite.w, sprite.h,  // Source
      x, y, width, height                       // Destination
    );
  }
}

// Usage
const atlas = new SpriteAtlasLoader('assets/sprites.png', SpriteAtlas);
await atlas.load();
atlas.drawSprite(ctx, 'ghost_idle_0', 100, 100, 34, 24);
```


### Sprite Rendering Optimization

**Cached Sprite Rendering**:
```javascript
// ✅ GOOD: Cache sprite draw parameters
class SpriteRenderer {
  constructor(atlas) {
    this.atlas = atlas;
    this.spriteCache = new Map();
  }
  
  cacheSprite(name) {
    if (this.spriteCache.has(name)) return;
    
    const sprite = this.atlas.getSprite(name);
    if (!sprite) return;
    
    // Cache draw parameters
    this.spriteCache.set(name, {
      image: this.atlas.image,
      sx: sprite.x,
      sy: sprite.y,
      sw: sprite.w,
      sh: sprite.h
    });
  }
  
  drawSprite(ctx, name, dx, dy, dw, dh, rotation = 0) {
    let cached = this.spriteCache.get(name);
    
    if (!cached) {
      this.cacheSprite(name);
      cached = this.spriteCache.get(name);
      if (!cached) return;
    }
    
    if (rotation !== 0) {
      ctx.save();
      ctx.translate(dx + dw / 2, dy + dh / 2);
      ctx.rotate(rotation);
      ctx.drawImage(
        cached.image,
        cached.sx, cached.sy, cached.sw, cached.sh,
        -dw / 2, -dh / 2, dw, dh
      );
      ctx.restore();
    } else {
      ctx.drawImage(
        cached.image,
        cached.sx, cached.sy, cached.sw, cached.sh,
        dx, dy, dw, dh
      );
    }
  }
  
  drawSpriteFlipped(ctx, name, dx, dy, dw, dh, flipX = false, flipY = false) {
    let cached = this.spriteCache.get(name);
    if (!cached) {
      this.cacheSprite(name);
      cached = this.spriteCache.get(name);
      if (!cached) return;
    }
    
    ctx.save();
    ctx.translate(dx + dw / 2, dy + dh / 2);
    ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
    ctx.drawImage(
      cached.image,
      cached.sx, cached.sy, cached.sw, cached.sh,
      -dw / 2, -dh / 2, dw, dh
    );
    ctx.restore();
  }
}

// Benefits:
// - No sprite lookup overhead per frame
// - Cached parameters reduce object creation
// - Faster rendering in hot paths
```


**Animation Frame Management**:
```javascript
// ✅ GOOD: Efficient animation frame selection
class AnimationController {
  constructor(atlas, animationName, frameNames, frameDuration) {
    this.atlas = atlas;
    this.animationName = animationName;
    this.frameNames = frameNames;
    this.frameDuration = frameDuration;
    this.currentFrame = 0;
    this.elapsed = 0;
    this.loop = true;
    this.playing = true;
  }
  
  update(deltaTime) {
    if (!this.playing) return;
    
    this.elapsed += deltaTime * 1000; // Convert to ms
    
    while (this.elapsed >= this.frameDuration) {
      this.elapsed -= this.frameDuration;
      this.currentFrame++;
      
      if (this.currentFrame >= this.frameNames.length) {
        if (this.loop) {
          this.currentFrame = 0;
        } else {
          this.currentFrame = this.frameNames.length - 1;
          this.playing = false;
        }
      }
    }
  }
  
  getCurrentFrameName() {
    return this.frameNames[this.currentFrame];
  }
  
  reset() {
    this.currentFrame = 0;
    this.elapsed = 0;
    this.playing = true;
  }
  
  play() {
    this.playing = true;
  }
  
  pause() {
    this.playing = false;
  }
}

// Usage with sprite atlas
class Ghost {
  constructor(x, y, atlas) {
    this.x = x;
    this.y = y;
    this.atlas = atlas;
    
    // Define animations
    this.animations = {
      idle: new AnimationController(
        atlas,
        'idle',
        ['ghost_idle_0', 'ghost_idle_1'],
        200
      ),
      flap: new AnimationController(
        atlas,
        'flap',
        ['ghost_flap_0', 'ghost_flap_1', 'ghost_flap_2'],
        100
      ),
      death: new AnimationController(
        atlas,
        'death',
        ['ghost_death_0', 'ghost_death_1', 'ghost_death_2', 'ghost_death_3'],
        150
      )
    };
    
    this.currentAnimation = this.animations.idle;
  }
  
  update(deltaTime) {
    this.currentAnimation.update(deltaTime);
  }
  
  setAnimation(name) {
    if (this.animations[name] && this.currentAnimation !== this.animations[name]) {
      this.currentAnimation = this.animations[name];
      this.currentAnimation.reset();
    }
  }
  
  render(ctx, spriteRenderer) {
    const frameName = this.currentAnimation.getCurrentFrameName();
    spriteRenderer.drawSprite(ctx, frameName, this.x, this.y, 34, 24, this.rotation);
  }
}
```


---

## Visual Feedback Patterns

### Juice and Polish Effects

**Screen Flash Effect**:
```javascript
// ✅ GOOD: Screen flash for impact
class ScreenFlash {
  constructor() {
    this.active = false;
    this.intensity = 0;
    this.duration = 0;
    this.maxDuration = 10; // frames
    this.color = 'rgba(255, 255, 255, 0.8)';
  }
  
  trigger(color = 'rgba(255, 255, 255, 0.8)', duration = 10) {
    this.active = true;
    this.intensity = 1.0;
    this.duration = duration;
    this.maxDuration = duration;
    this.color = color;
  }
  
  update() {
    if (!this.active) return;
    
    this.duration--;
    this.intensity = this.duration / this.maxDuration;
    
    if (this.duration <= 0) {
      this.active = false;
      this.intensity = 0;
    }
  }
  
  render(ctx, width, height) {
    if (!this.active || this.intensity <= 0) return;
    
    // Parse color and apply intensity
    const alpha = this.intensity * 0.8;
    const flashColor = this.color.replace(/[\d.]+\)$/g, `${alpha})`);
    
    ctx.fillStyle = flashColor;
    ctx.fillRect(0, 0, width, height);
  }
}

// Usage
const flash = new ScreenFlash();

// On collision
flash.trigger('rgba(255, 0, 0, 0.8)', 8); // Red flash

// On score
flash.trigger('rgba(255, 255, 0, 0.6)', 5); // Yellow flash

// In render loop
flash.update();
flash.render(ctx, canvas.width, canvas.height);
```

**Chromatic Aberration Effect**:
```javascript
// ✅ GOOD: Chromatic aberration for impact
class ChromaticAberration {
  constructor() {
    this.active = false;
    this.intensity = 0;
    this.duration = 0;
  }
  
  trigger(intensity = 5, duration = 15) {
    this.active = true;
    this.intensity = intensity;
    this.duration = duration;
    this.maxDuration = duration;
  }
  
  update() {
    if (!this.active) return;
    
    this.duration--;
    const progress = this.duration / this.maxDuration;
    this.intensity = this.intensity * progress;
    
    if (this.duration <= 0) {
      this.active = false;
    }
  }
  
  apply(ctx, sourceCanvas) {
    if (!this.active || this.intensity <= 0) {
      ctx.drawImage(sourceCanvas, 0, 0);
      return;
    }
    
    const offset = Math.floor(this.intensity);
    
    // Draw red channel offset
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.5;
    ctx.drawImage(sourceCanvas, -offset, 0);
    
    // Draw green channel normal
    ctx.globalAlpha = 1.0;
    ctx.drawImage(sourceCanvas, 0, 0);
    
    // Draw blue channel offset
    ctx.globalAlpha = 0.5;
    ctx.drawImage(sourceCanvas, offset, 0);
    
    // Reset
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1.0;
  }
}
```


**Squash and Stretch Animation**:
```javascript
// ✅ GOOD: Squash and stretch for impact
class SquashStretch {
  constructor(entity) {
    this.entity = entity;
    this.scaleX = 1.0;
    this.scaleY = 1.0;
    this.targetScaleX = 1.0;
    this.targetScaleY = 1.0;
    this.lerpSpeed = 0.3;
  }
  
  squash(amount = 0.2) {
    // Squash vertically, stretch horizontally
    this.targetScaleX = 1.0 + amount;
    this.targetScaleY = 1.0 - amount;
  }
  
  stretch(amount = 0.2) {
    // Stretch vertically, squash horizontally
    this.targetScaleX = 1.0 - amount;
    this.targetScaleY = 1.0 + amount;
  }
  
  reset() {
    this.targetScaleX = 1.0;
    this.targetScaleY = 1.0;
  }
  
  update() {
    // Lerp to target scale
    this.scaleX += (this.targetScaleX - this.scaleX) * this.lerpSpeed;
    this.scaleY += (this.targetScaleY - this.scaleY) * this.lerpSpeed;
    
    // Snap to target if close enough
    if (Math.abs(this.scaleX - this.targetScaleX) < 0.01) {
      this.scaleX = this.targetScaleX;
    }
    if (Math.abs(this.scaleY - this.targetScaleY) < 0.01) {
      this.scaleY = this.targetScaleY;
    }
  }
  
  apply(ctx, x, y, width, height) {
    ctx.save();
    ctx.translate(x + width / 2, y + height / 2);
    ctx.scale(this.scaleX, this.scaleY);
    ctx.translate(-width / 2, -height / 2);
    return { x: 0, y: 0, width, height };
  }
  
  restore(ctx) {
    ctx.restore();
  }
}

// Usage
class Ghost {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.squashStretch = new SquashStretch(this);
  }
  
  jump() {
    this.velocity = -300;
    this.squashStretch.stretch(0.3); // Stretch on jump
  }
  
  land() {
    this.squashStretch.squash(0.3); // Squash on landing
  }
  
  update(deltaTime) {
    this.squashStretch.update();
  }
  
  render(ctx) {
    const transformed = this.squashStretch.apply(
      ctx, this.x, this.y, this.width, this.height
    );
    
    // Draw sprite
    ctx.drawImage(this.sprite, transformed.x, transformed.y, 
                  transformed.width, transformed.height);
    
    this.squashStretch.restore(ctx);
  }
}
```


**Trail Effect**:
```javascript
// ✅ GOOD: Motion trail for fast movement
class MotionTrail {
  constructor(maxTrails = 5) {
    this.trails = [];
    this.maxTrails = maxTrails;
  }
  
  addTrail(x, y, width, height, sprite) {
    this.trails.push({
      x, y, width, height, sprite,
      alpha: 1.0,
      decay: 0.15
    });
    
    // Remove old trails
    if (this.trails.length > this.maxTrails) {
      this.trails.shift();
    }
  }
  
  update() {
    for (let i = this.trails.length - 1; i >= 0; i--) {
      const trail = this.trails[i];
      trail.alpha -= trail.decay;
      
      if (trail.alpha <= 0) {
        this.trails.splice(i, 1);
      }
    }
  }
  
  render(ctx) {
    for (const trail of this.trails) {
      ctx.save();
      ctx.globalAlpha = trail.alpha * 0.5;
      ctx.drawImage(trail.sprite, trail.x, trail.y, trail.width, trail.height);
      ctx.restore();
    }
  }
  
  clear() {
    this.trails = [];
  }
}

// Usage
class Ghost {
  constructor(x, y, sprite) {
    this.x = x;
    this.y = y;
    this.sprite = sprite;
    this.trail = new MotionTrail(5);
    this.trailCounter = 0;
  }
  
  update(deltaTime) {
    // Add trail every few frames when moving fast
    this.trailCounter++;
    if (this.trailCounter >= 3 && Math.abs(this.velocity) > 200) {
      this.trail.addTrail(this.x, this.y, this.width, this.height, this.sprite);
      this.trailCounter = 0;
    }
    
    this.trail.update();
  }
  
  render(ctx) {
    // Render trail first (behind ghost)
    this.trail.render(ctx);
    
    // Render ghost
    ctx.drawImage(this.sprite, this.x, this.y, this.width, this.height);
  }
}
```

**Impact Ripple Effect**:
```javascript
// ✅ GOOD: Expanding ripple on collision
class ImpactRipple {
  constructor(x, y, maxRadius = 50, duration = 20) {
    this.x = x;
    this.y = y;
    this.radius = 0;
    this.maxRadius = maxRadius;
    this.duration = duration;
    this.maxDuration = duration;
    this.active = true;
  }
  
  update() {
    if (!this.active) return;
    
    this.duration--;
    const progress = 1 - (this.duration / this.maxDuration);
    this.radius = this.maxRadius * progress;
    
    if (this.duration <= 0) {
      this.active = false;
    }
  }
  
  render(ctx) {
    if (!this.active) return;
    
    const alpha = this.duration / this.maxDuration;
    
    ctx.save();
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  
  isDead() {
    return !this.active;
  }
}

// Ripple manager
class RippleManager {
  constructor() {
    this.ripples = [];
  }
  
  spawn(x, y, maxRadius = 50, duration = 20) {
    this.ripples.push(new ImpactRipple(x, y, maxRadius, duration));
  }
  
  update() {
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      this.ripples[i].update();
      if (this.ripples[i].isDead()) {
        this.ripples.splice(i, 1);
      }
    }
  }
  
  render(ctx) {
    for (const ripple of this.ripples) {
      ripple.render(ctx);
    }
  }
}
```


### UI Feedback Patterns

**Button Hover and Press States**:
```javascript
// ✅ GOOD: Interactive button with visual feedback
class Button {
  constructor(x, y, width, height, text, onClick) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.text = text;
    this.onClick = onClick;
    
    this.state = 'normal'; // normal, hover, pressed
    this.scale = 1.0;
    this.targetScale = 1.0;
    this.lerpSpeed = 0.3;
  }
  
  update(mouseX, mouseY, mouseDown) {
    const wasHovered = this.state === 'hover' || this.state === 'pressed';
    const isHovered = this.contains(mouseX, mouseY);
    
    if (isHovered) {
      if (mouseDown) {
        this.state = 'pressed';
        this.targetScale = 0.9;
      } else {
        this.state = 'hover';
        this.targetScale = 1.1;
        
        // Trigger click on release
        if (wasHovered && this.state === 'hover') {
          this.onClick();
        }
      }
    } else {
      this.state = 'normal';
      this.targetScale = 1.0;
    }
    
    // Smooth scale transition
    this.scale += (this.targetScale - this.scale) * this.lerpSpeed;
  }
  
  contains(x, y) {
    return x >= this.x && x <= this.x + this.width &&
           y >= this.y && y <= this.y + this.height;
  }
  
  render(ctx) {
    ctx.save();
    
    // Apply scale from center
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    ctx.translate(centerX, centerY);
    ctx.scale(this.scale, this.scale);
    ctx.translate(-centerX, -centerY);
    
    // Draw button background
    const colors = {
      normal: '#4CAF50',
      hover: '#66BB6A',
      pressed: '#388E3C'
    };
    
    ctx.fillStyle = colors[this.state];
    ctx.fillRect(this.x, this.y, this.width, this.height);
    
    // Draw button border
    ctx.strokeStyle = '#2E7D32';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.x, this.y, this.width, this.height);
    
    // Draw text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.text, centerX, centerY);
    
    ctx.restore();
  }
}
```


**Score Pop Animation**:
```javascript
// ✅ GOOD: Animated score increase
class ScorePop {
  constructor(x, y, value, color = '#FFD700') {
    this.x = x;
    this.y = y;
    this.startY = y;
    this.value = value;
    this.color = color;
    
    this.scale = 0.5;
    this.targetScale = 1.5;
    this.alpha = 1.0;
    this.duration = 30;
    this.maxDuration = 30;
    this.active = true;
  }
  
  update() {
    if (!this.active) return;
    
    this.duration--;
    const progress = 1 - (this.duration / this.maxDuration);
    
    // Scale up then down
    if (progress < 0.3) {
      this.scale = 0.5 + (this.targetScale - 0.5) * (progress / 0.3);
    } else {
      this.scale = this.targetScale - (this.targetScale - 1.0) * ((progress - 0.3) / 0.7);
    }
    
    // Float upward
    this.y = this.startY - (progress * 40);
    
    // Fade out
    this.alpha = 1.0 - progress;
    
    if (this.duration <= 0) {
      this.active = false;
    }
  }
  
  render(ctx) {
    if (!this.active) return;
    
    ctx.save();
    ctx.globalAlpha = this.alpha;
    
    // Apply scale
    ctx.translate(this.x, this.y);
    ctx.scale(this.scale, this.scale);
    
    // Draw text
    ctx.fillStyle = this.color;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const text = `+${this.value}`;
    ctx.strokeText(text, 0, 0);
    ctx.fillText(text, 0, 0);
    
    ctx.restore();
  }
  
  isDead() {
    return !this.active;
  }
}

// Usage
class ScoreManager {
  constructor() {
    this.score = 0;
    this.pops = [];
  }
  
  addScore(value, x, y) {
    this.score += value;
    this.pops.push(new ScorePop(x, y, value));
  }
  
  update() {
    for (let i = this.pops.length - 1; i >= 0; i--) {
      this.pops[i].update();
      if (this.pops[i].isDead()) {
        this.pops.splice(i, 1);
      }
    }
  }
  
  render(ctx) {
    for (const pop of this.pops) {
      pop.render(ctx);
    }
  }
}
```


**Progress Bar with Juice**:
```javascript
// ✅ GOOD: Animated progress bar
class ProgressBar {
  constructor(x, y, width, height, maxValue) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.maxValue = maxValue;
    
    this.currentValue = 0;
    this.displayValue = 0;
    this.lerpSpeed = 0.1;
    
    this.pulseScale = 1.0;
    this.pulseSpeed = 0.05;
  }
  
  setValue(value) {
    this.currentValue = Math.max(0, Math.min(value, this.maxValue));
  }
  
  update() {
    // Smooth value transition
    this.displayValue += (this.currentValue - this.displayValue) * this.lerpSpeed;
    
    // Pulse effect when near full
    const fillPercent = this.displayValue / this.maxValue;
    if (fillPercent > 0.8) {
      this.pulseScale = 1.0 + Math.sin(Date.now() * this.pulseSpeed) * 0.05;
    } else {
      this.pulseScale = 1.0;
    }
  }
  
  render(ctx) {
    ctx.save();
    
    // Draw background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(this.x, this.y, this.width, this.height);
    
    // Draw border
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.x, this.y, this.width, this.height);
    
    // Calculate fill width
    const fillPercent = this.displayValue / this.maxValue;
    const fillWidth = (this.width - 4) * fillPercent;
    
    if (fillWidth > 0) {
      // Apply pulse scale
      ctx.translate(this.x + 2, this.y + this.height / 2);
      ctx.scale(1.0, this.pulseScale);
      ctx.translate(0, -this.height / 2 + 2);
      
      // Color gradient based on fill
      const gradient = ctx.createLinearGradient(0, 0, fillWidth, 0);
      if (fillPercent < 0.3) {
        gradient.addColorStop(0, '#FF4444');
        gradient.addColorStop(1, '#FF6666');
      } else if (fillPercent < 0.7) {
        gradient.addColorStop(0, '#FFAA00');
        gradient.addColorStop(1, '#FFCC00');
      } else {
        gradient.addColorStop(0, '#44FF44');
        gradient.addColorStop(1, '#66FF66');
      }
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, fillWidth, this.height - 4);
    }
    
    ctx.restore();
  }
}
```


---

## Performance Monitoring

### FPS Counter and Performance Metrics

**Comprehensive Performance Monitor**:
```javascript
// ✅ GOOD: Detailed performance tracking
class PerformanceMonitor {
  constructor() {
    this.fps = 0;
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.fpsUpdateInterval = 500; // Update FPS every 500ms
    
    this.frameTimes = [];
    this.maxFrameTimeSamples = 60;
    
    this.metrics = {
      avgFrameTime: 0,
      minFrameTime: Infinity,
      maxFrameTime: 0,
      drawCalls: 0,
      entityCount: 0
    };
  }
  
  beginFrame() {
    this.frameStartTime = performance.now();
  }
  
  endFrame() {
    const frameTime = performance.now() - this.frameStartTime;
    
    // Track frame times
    this.frameTimes.push(frameTime);
    if (this.frameTimes.length > this.maxFrameTimeSamples) {
      this.frameTimes.shift();
    }
    
    // Update metrics
    this.metrics.minFrameTime = Math.min(this.metrics.minFrameTime, frameTime);
    this.metrics.maxFrameTime = Math.max(this.metrics.maxFrameTime, frameTime);
    this.metrics.avgFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    
    // Update FPS
    this.frameCount++;
    const currentTime = performance.now();
    const elapsed = currentTime - this.lastTime;
    
    if (elapsed >= this.fpsUpdateInterval) {
      this.fps = Math.round((this.frameCount * 1000) / elapsed);
      this.frameCount = 0;
      this.lastTime = currentTime;
    }
  }
  
  recordDrawCall() {
    this.metrics.drawCalls++;
  }
  
  setEntityCount(count) {
    this.metrics.entityCount = count;
  }
  
  resetFrameMetrics() {
    this.metrics.drawCalls = 0;
  }
  
  render(ctx, x = 10, y = 10) {
    ctx.save();
    
    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(x, y, 200, 120);
    
    // Text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    
    const lines = [
      `FPS: ${this.fps}`,
      `Frame: ${this.metrics.avgFrameTime.toFixed(2)}ms`,
      `Min: ${this.metrics.minFrameTime.toFixed(2)}ms`,
      `Max: ${this.metrics.maxFrameTime.toFixed(2)}ms`,
      `Draw Calls: ${this.metrics.drawCalls}`,
      `Entities: ${this.metrics.entityCount}`
    ];
    
    lines.forEach((line, i) => {
      ctx.fillText(line, x + 10, y + 20 + i * 16);
    });
    
    // FPS color indicator
    const fpsColor = this.fps >= 100 ? '#44FF44' : 
                     this.fps >= 60 ? '#FFAA00' : '#FF4444';
    ctx.fillStyle = fpsColor;
    ctx.fillRect(x + 180, y + 10, 10, 10);
    
    ctx.restore();
  }
  
  getReport() {
    return {
      fps: this.fps,
      avgFrameTime: this.metrics.avgFrameTime,
      minFrameTime: this.metrics.minFrameTime,
      maxFrameTime: this.metrics.maxFrameTime,
      drawCalls: this.metrics.drawCalls,
      entityCount: this.metrics.entityCount
    };
  }
}

// Usage in game loop
class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.perfMonitor = new PerformanceMonitor();
    this.showDebug = false; // Toggle with key
  }
  
  gameLoop(timestamp) {
    this.perfMonitor.beginFrame();
    this.perfMonitor.resetFrameMetrics();
    
    // Update
    this.update(deltaTime);
    
    // Render
    this.render();
    
    // Debug overlay
    if (this.showDebug) {
      this.perfMonitor.render(this.ctx);
    }
    
    this.perfMonitor.endFrame();
    requestAnimationFrame((t) => this.gameLoop(t));
  }
}
```


---

## Optimization Checklist

### Pre-Implementation

- [ ] Plan sprite atlas layout for minimal texture switches
- [ ] Identify static elements for pre-rendering
- [ ] Design layer structure for dirty rectangle optimization
- [ ] Plan batching strategy for similar draw operations
- [ ] Identify hot paths for object pooling

### During Implementation

- [ ] Batch draws by rendering state (color, style, etc.)
- [ ] Use off-screen canvas for static content
- [ ] Implement state tracking to avoid redundant changes
- [ ] Cache sprite lookup results
- [ ] Use object pools for particles and effects
- [ ] Minimize save/restore calls
- [ ] Avoid allocations in render loop

### Post-Implementation

- [ ] Profile with browser DevTools
- [ ] Verify 120 FPS on target hardware
- [ ] Check draw call count (aim for <100 per frame)
- [ ] Verify no memory leaks over extended play
- [ ] Test on lower-end devices
- [ ] Optimize bottlenecks identified in profiling

---

## Common Performance Pitfalls

### 1. Excessive State Changes

```javascript
// ❌ BAD: Change state for each entity
for (const entity of entities) {
  ctx.fillStyle = entity.color;
  ctx.fillRect(entity.x, entity.y, entity.width, entity.height);
}

// ✅ GOOD: Batch by state
const byColor = groupBy(entities, e => e.color);
for (const [color, group] of byColor) {
  ctx.fillStyle = color;
  for (const entity of group) {
    ctx.fillRect(entity.x, entity.y, entity.width, entity.height);
  }
}
```

### 2. Unnecessary Clears

```javascript
// ❌ BAD: Clear entire canvas every frame
ctx.clearRect(0, 0, canvas.width, canvas.height);

// ✅ GOOD: Use opaque background or dirty rectangles
ctx.drawImage(backgroundCache, 0, 0);
```

### 3. Unoptimized Text Rendering

```javascript
// ❌ BAD: Render text every frame
ctx.fillText(`Score: ${score}`, 10, 10);

// ✅ GOOD: Cache text rendering
if (this.lastScore !== score) {
  this.textCache.clear();
  this.textCache.ctx.fillText(`Score: ${score}`, 10, 10);
  this.lastScore = score;
}
ctx.drawImage(this.textCache.canvas, 0, 0);
```

### 4. Allocations in Hot Paths

```javascript
// ❌ BAD: Create objects every frame
function getHitbox() {
  return { x: this.x, y: this.y, width: this.width, height: this.height };
}

// ✅ GOOD: Reuse cached object
constructor() {
  this._hitboxCache = { x: 0, y: 0, width: 0, height: 0 };
}

function getHitbox() {
  this._hitboxCache.x = this.x;
  this._hitboxCache.y = this.y;
  this._hitboxCache.width = this.width;
  this._hitboxCache.height = this.height;
  return this._hitboxCache;
}
```


---

## Advanced Techniques

### GPU Acceleration Hints

**Leverage Compositing**:
```javascript
// ✅ GOOD: Use compositing for effects
class BlendModeRenderer {
  renderGlow(ctx, entity) {
    ctx.save();
    
    // Draw glow with additive blending
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.5;
    
    const gradient = ctx.createRadialGradient(
      entity.x + entity.width / 2,
      entity.y + entity.height / 2,
      0,
      entity.x + entity.width / 2,
      entity.y + entity.height / 2,
      entity.width
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(
      entity.x - entity.width / 2,
      entity.y - entity.height / 2,
      entity.width * 2,
      entity.height * 2
    );
    
    ctx.restore();
  }
}
```

### Dirty Rectangle Optimization

**Track Changed Regions**:
```javascript
// ✅ GOOD: Only redraw changed areas
class DirtyRectManager {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.dirtyRects = [];
  }
  
  markDirty(x, y, width, height) {
    this.dirtyRects.push({ x, y, width, height });
  }
  
  merge() {
    if (this.dirtyRects.length === 0) return null;
    
    // Find bounding box of all dirty rects
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;
    
    for (const rect of this.dirtyRects) {
      minX = Math.min(minX, rect.x);
      minY = Math.min(minY, rect.y);
      maxX = Math.max(maxX, rect.x + rect.width);
      maxY = Math.max(maxY, rect.y + rect.height);
    }
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }
  
  clear() {
    this.dirtyRects = [];
  }
  
  shouldFullRedraw() {
    const merged = this.merge();
    if (!merged) return false;
    
    // If dirty area is >50% of screen, do full redraw
    const dirtyArea = merged.width * merged.height;
    const totalArea = this.width * this.height;
    return (dirtyArea / totalArea) > 0.5;
  }
}

// Usage
class OptimizedRenderer {
  constructor(ctx, width, height) {
    this.ctx = ctx;
    this.dirtyManager = new DirtyRectManager(width, height);
  }
  
  render(entities) {
    // Mark entities as dirty
    for (const entity of entities) {
      if (entity.moved) {
        this.dirtyManager.markDirty(
          entity.x, entity.y, entity.width, entity.height
        );
      }
    }
    
    if (this.dirtyManager.shouldFullRedraw()) {
      // Full redraw
      this.ctx.clearRect(0, 0, this.width, this.height);
      this.renderAll(entities);
    } else {
      // Partial redraw
      const dirtyRect = this.dirtyManager.merge();
      if (dirtyRect) {
        this.ctx.clearRect(
          dirtyRect.x, dirtyRect.y,
          dirtyRect.width, dirtyRect.height
        );
        this.renderRegion(entities, dirtyRect);
      }
    }
    
    this.dirtyManager.clear();
  }
}
```


### WebGL Fallback Strategy

**Detect and Use WebGL When Available**:
```javascript
// ✅ GOOD: Progressive enhancement with WebGL
class RendererFactory {
  static create(canvas) {
    // Try WebGL first
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (gl) {
      console.log('Using WebGL renderer');
      return new WebGLRenderer(gl);
    }
    
    // Fallback to Canvas 2D
    console.log('Using Canvas 2D renderer');
    const ctx = canvas.getContext('2d');
    return new Canvas2DRenderer(ctx);
  }
}

// Abstract renderer interface
class Renderer {
  clear() { throw new Error('Not implemented'); }
  drawSprite(sprite, x, y, width, height) { throw new Error('Not implemented'); }
  drawRect(x, y, width, height, color) { throw new Error('Not implemented'); }
}

// Canvas 2D implementation
class Canvas2DRenderer extends Renderer {
  constructor(ctx) {
    super();
    this.ctx = ctx;
  }
  
  clear() {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
  }
  
  drawSprite(sprite, x, y, width, height) {
    this.ctx.drawImage(sprite, x, y, width, height);
  }
  
  drawRect(x, y, width, height, color) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, width, height);
  }
}

// WebGL implementation (simplified)
class WebGLRenderer extends Renderer {
  constructor(gl) {
    super();
    this.gl = gl;
    this.initShaders();
  }
  
  initShaders() {
    // Initialize WebGL shaders
    // ... shader setup code
  }
  
  clear() {
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  }
  
  drawSprite(sprite, x, y, width, height) {
    // WebGL sprite rendering
    // ... WebGL draw code
  }
  
  drawRect(x, y, width, height, color) {
    // WebGL rectangle rendering
    // ... WebGL draw code
  }
}
```

---

## Integration Example

**Complete Optimized Renderer**:
```javascript
// ✅ GOOD: Production-ready optimized renderer
class FlappyKiroRenderer {
  constructor(canvas, config) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', {
      alpha: false,  // Opaque canvas for better performance
      desynchronized: true  // Reduce latency
    });
    this.config = config;
    
    // Disable image smoothing for pixel art
    this.ctx.imageSmoothingEnabled = false;
    
    // Initialize subsystems
    this.bgCache = new BackgroundCache(canvas.width, canvas.height, config);
    this.spriteRenderer = new SpriteRenderer(atlas);
    this.perfMonitor = new PerformanceMonitor();
    
    // State tracking
    this.currentFillStyle = null;
    this.currentStrokeStyle = null;
    
    // Effects
    this.screenFlash = new ScreenFlash();
    this.rippleManager = new RippleManager();
  }
  
  render(gameState) {
    this.perfMonitor.beginFrame();
    this.perfMonitor.resetFrameMetrics();
    
    // Clear with cached background
    this.bgCache.draw(this.ctx);
    this.perfMonitor.recordDrawCall();
    
    // Apply screen shake
    this.ctx.save();
    if (gameState.screenShake.active) {
      this.ctx.translate(
        gameState.screenShake.offsetX,
        gameState.screenShake.offsetY
      );
    }
    
    // Render game entities (batched)
    this.renderPipes(gameState.pipes);
    this.renderParticles(gameState.particles);
    this.renderGhost(gameState.ghost);
    
    // Render effects
    this.rippleManager.render(this.ctx);
    this.screenFlash.render(this.ctx, this.canvas.width, this.canvas.height);
    
    this.ctx.restore();
    
    // Render UI (no shake)
    this.renderUI(gameState);
    
    // Debug overlay
    if (this.config.debug) {
      this.perfMonitor.setEntityCount(
        1 + gameState.pipes.length + gameState.particles.length
      );
      this.perfMonitor.render(this.ctx);
    }
    
    this.perfMonitor.endFrame();
  }
  
  renderPipes(pipes) {
    // Batch all pipe bodies
    this.setFillStyle(this.config.visual.pipeColor);
    for (const pipe of pipes) {
      this.ctx.fillRect(pipe.x, 0, pipe.width, pipe.topHeight);
      this.ctx.fillRect(pipe.x, pipe.bottomY, pipe.width, pipe.bottomHeight);
    }
    this.perfMonitor.recordDrawCall();
    
    // Batch all pipe caps
    this.setFillStyle(this.config.visual.pipeCapColor);
    for (const pipe of pipes) {
      this.ctx.fillRect(pipe.x - 2, pipe.topHeight - 20, pipe.width + 4, 20);
      this.ctx.fillRect(pipe.x - 2, pipe.bottomY, pipe.width + 4, 20);
    }
    this.perfMonitor.recordDrawCall();
  }
  
  renderParticles(particles) {
    if (particles.length === 0) return;
    
    // Batch particles with same alpha
    this.ctx.fillStyle = 'rgba(255, 255, 255, 1)';
    this.ctx.beginPath();
    
    for (const particle of particles) {
      if (particle.life >= 1.0) {
        this.ctx.moveTo(particle.x + particle.size, particle.y);
        this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      }
    }
    
    this.ctx.fill();
    this.perfMonitor.recordDrawCall();
    
    // Render fading particles separately
    for (const particle of particles) {
      if (particle.life < 1.0) {
        this.ctx.fillStyle = particle.color;
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        this.ctx.fill();
        this.perfMonitor.recordDrawCall();
      }
    }
  }
  
  renderGhost(ghost) {
    this.spriteRenderer.drawSprite(
      this.ctx,
      ghost.currentSprite,
      ghost.x, ghost.y,
      ghost.width, ghost.height,
      ghost.rotation
    );
    this.perfMonitor.recordDrawCall();
  }
  
  renderUI(gameState) {
    this.setFillStyle('#000000');
    this.ctx.font = '20px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
      `Score: ${gameState.score} | High: ${gameState.highScore}`,
      this.canvas.width / 2,
      this.canvas.height - 20
    );
    this.perfMonitor.recordDrawCall();
  }
  
  setFillStyle(style) {
    if (this.currentFillStyle !== style) {
      this.ctx.fillStyle = style;
      this.currentFillStyle = style;
    }
  }
}
```

---

## References

- **Design Document**: `.kiro/specs/flappy-kiro/design.md`
- **Coding Standards**: `.kiro/steering/game-coding-standards.md`
- **Visual Design**: `.kiro/steering/visual-design.md`
- **Canvas Patterns**: `.kiro/steering/canvas-and-collision-patterns.md`
- **MDN Canvas Tutorial**: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial
- **HTML5 Game Development**: https://www.html5rocks.com/en/tutorials/canvas/performance/

