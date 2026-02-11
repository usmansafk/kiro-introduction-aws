---
inclusion: auto
---

# Audio-Visual Integration Patterns

## Overview

This document defines patterns for integrating audio with visual feedback, implementing screen shake mechanics, and creating polished UI animations for Flappy Kiro. These patterns create a cohesive, responsive game feel that targets 120 FPS performance.

## Core Integration Principles

1. **Synchronization**: Audio and visual effects trigger together
2. **Proportional Response**: Effect intensity matches action magnitude
3. **Layered Feedback**: Combine multiple feedback types for impact
4. **Performance First**: Never sacrifice frame rate for effects
5. **Graceful Degradation**: Handle audio failures silently

---

## Sound Effect Integration

### Audio Manager Architecture

**Robust Audio System**:
```javascript
// ✅ GOOD: Production-ready audio manager
class AudioManager {
  constructor(config) {
    this.config = config;
    this.sounds = new Map();
    this.soundInstances = new Map();
    this.muted = false;
    this.masterVolume = 1.0;
    this.audioContext = null;
    this.initialized = false;
    
    // Browser autoplay policy handling
    this.unlocked = false;
  }
  
  async init() {
    try {
      // Try to create AudioContext (better performance)
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      console.log('AudioContext initialized');
    } catch (err) {
      console.warn('AudioContext not available, using HTML5 Audio', err);
    }
    
    this.initialized = true;
  }

  
  async loadSound(name, path, options = {}) {
    try {
      if (this.audioContext) {
        // Load with Web Audio API
        const response = await fetch(path);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        
        this.sounds.set(name, {
          buffer: audioBuffer,
          volume: options.volume || 1.0,
          loop: options.loop || false,
          type: 'webaudio'
        });
      } else {
        // Fallback to HTML5 Audio
        const audio = new Audio(path);
        audio.preload = 'auto';
        audio.volume = (options.volume || 1.0) * this.masterVolume;
        audio.loop = options.loop || false;
        
        await new Promise((resolve, reject) => {
          audio.addEventListener('canplaythrough', resolve, { once: true });
          audio.addEventListener('error', reject, { once: true });
        });
        
        this.sounds.set(name, {
          audio: audio,
          volume: options.volume || 1.0,
          loop: options.loop || false,
          type: 'html5'
        });
      }
      
      console.log(`Sound loaded: ${name}`);
    } catch (err) {
      console.error(`Failed to load sound: ${name}`, err);
    }
  }
  
  playSound(name, options = {}) {
    if (this.muted || !this.initialized) return null;
    
    const sound = this.sounds.get(name);
    if (!sound) {
      console.warn(`Sound not found: ${name}`);
      return null;
    }
    
    try {
      if (sound.type === 'webaudio') {
        return this.playWebAudio(sound, options);
      } else {
        return this.playHTML5Audio(sound, options);
      }
    } catch (err) {
      console.error(`Error playing sound: ${name}`, err);
      return null;
    }
  }
  
  playWebAudio(sound, options) {
    const source = this.audioContext.createBufferSource();
    source.buffer = sound.buffer;
    
    // Create gain node for volume control
    const gainNode = this.audioContext.createGain();
    const volume = (options.volume || sound.volume) * this.masterVolume;
    gainNode.gain.value = volume;
    
    // Connect nodes
    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    // Play
    source.start(0);
    
    return {
      stop: () => source.stop(),
      setVolume: (v) => gainNode.gain.value = v * this.masterVolume
    };
  }
  
  playHTML5Audio(sound, options) {
    // Clone audio element for overlapping sounds
    const audio = sound.audio.cloneNode();
    audio.volume = (options.volume || sound.volume) * this.masterVolume;
    
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      playPromise.catch(err => {
        console.warn('Audio playback failed:', err);
      });
    }
    
    return {
      stop: () => audio.pause(),
      setVolume: (v) => audio.volume = v * this.masterVolume
    };
  }
  
  setMasterVolume(volume) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }
  
  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }
  
  // Handle browser autoplay policy
  unlock() {
    if (this.unlocked) return;
    
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    
    this.unlocked = true;
    console.log('Audio unlocked');
  }
}

// Usage
const audio = new AudioManager(config);
await audio.init();
await audio.loadSound('jump', 'assets/jump.wav', { volume: 0.8 });
await audio.loadSound('collision', 'assets/game_over.wav', { volume: 1.0 });

// Unlock on first user interaction
document.addEventListener('click', () => audio.unlock(), { once: true });
document.addEventListener('keydown', () => audio.unlock(), { once: true });
```


### Sound Effect Pooling

**Efficient Sound Instance Management**:
```javascript
// ✅ GOOD: Pool sound instances for performance
class SoundPool {
  constructor(audioManager, soundName, poolSize = 5) {
    this.audioManager = audioManager;
    this.soundName = soundName;
    this.poolSize = poolSize;
    this.instances = [];
    this.currentIndex = 0;
  }
  
  play(options = {}) {
    // Round-robin through pool
    const instance = this.audioManager.playSound(this.soundName, options);
    
    if (instance) {
      this.instances[this.currentIndex] = instance;
      this.currentIndex = (this.currentIndex + 1) % this.poolSize;
    }
    
    return instance;
  }
  
  stopAll() {
    for (const instance of this.instances) {
      if (instance) {
        instance.stop();
      }
    }
    this.instances = [];
  }
}

// Usage for rapid-fire sounds
class Game {
  constructor() {
    this.audio = new AudioManager(config);
    this.jumpSoundPool = new SoundPool(this.audio, 'jump', 3);
  }
  
  onJump() {
    // Can play multiple overlapping jump sounds
    this.jumpSoundPool.play({ volume: 0.8 });
  }
}
```

### Spatial Audio

**Position-Based Volume**:
```javascript
// ✅ GOOD: Adjust volume based on position
class SpatialAudio {
  constructor(audioManager, listenerX, listenerY) {
    this.audioManager = audioManager;
    this.listenerX = listenerX;
    this.listenerY = listenerY;
    this.maxDistance = 500; // Max hearing distance
  }
  
  playAtPosition(soundName, x, y, baseVolume = 1.0) {
    const distance = this.calculateDistance(x, y);
    const volume = this.calculateVolume(distance, baseVolume);
    
    if (volume > 0.01) {
      return this.audioManager.playSound(soundName, { volume });
    }
    
    return null;
  }
  
  calculateDistance(x, y) {
    const dx = x - this.listenerX;
    const dy = y - this.listenerY;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  calculateVolume(distance, baseVolume) {
    if (distance >= this.maxDistance) return 0;
    
    // Linear falloff
    const falloff = 1 - (distance / this.maxDistance);
    return baseVolume * falloff;
  }
  
  updateListener(x, y) {
    this.listenerX = x;
    this.listenerY = y;
  }
}

// Usage
const spatialAudio = new SpatialAudio(audioManager, ghostX, ghostY);

// Play collision sound at pipe position
spatialAudio.playAtPosition('collision', pipe.x, pipe.y, 1.0);
```


---

## Screen Shake Mechanics

### Advanced Screen Shake System

**Multi-Axis Screen Shake with Decay**:
```javascript
// ✅ GOOD: Professional screen shake implementation
class ScreenShake {
  constructor() {
    this.shakes = [];
    this.offsetX = 0;
    this.offsetY = 0;
    this.rotation = 0;
  }
  
  add(intensity, duration, frequency = 1.0, decay = 'exponential') {
    this.shakes.push({
      intensity,
      duration,
      maxDuration: duration,
      frequency,
      decay,
      phase: Math.random() * Math.PI * 2
    });
  }
  
  update(deltaTime) {
    this.offsetX = 0;
    this.offsetY = 0;
    this.rotation = 0;
    
    for (let i = this.shakes.length - 1; i >= 0; i--) {
      const shake = this.shakes[i];
      shake.duration -= deltaTime * 60; // Convert to frames
      
      if (shake.duration <= 0) {
        this.shakes.splice(i, 1);
        continue;
      }
      
      // Calculate progress and intensity
      const progress = shake.duration / shake.maxDuration;
      let currentIntensity;
      
      if (shake.decay === 'exponential') {
        currentIntensity = shake.intensity * Math.pow(progress, 2);
      } else if (shake.decay === 'linear') {
        currentIntensity = shake.intensity * progress;
      } else {
        currentIntensity = shake.intensity;
      }
      
      // Apply frequency for oscillation
      const time = (shake.maxDuration - shake.duration) * shake.frequency;
      const noiseX = Math.sin(time + shake.phase) * currentIntensity;
      const noiseY = Math.cos(time + shake.phase * 1.3) * currentIntensity;
      
      this.offsetX += noiseX;
      this.offsetY += noiseY;
      this.rotation += (Math.sin(time * 2) * currentIntensity) * 0.01;
    }
  }
  
  apply(ctx) {
    if (this.shakes.length === 0) return;
    
    ctx.translate(this.offsetX, this.offsetY);
    
    if (Math.abs(this.rotation) > 0.001) {
      const centerX = ctx.canvas.width / 2;
      const centerY = ctx.canvas.height / 2;
      ctx.translate(centerX, centerY);
      ctx.rotate(this.rotation);
      ctx.translate(-centerX, -centerY);
    }
  }
  
  clear() {
    this.shakes = [];
    this.offsetX = 0;
    this.offsetY = 0;
    this.rotation = 0;
  }
  
  isActive() {
    return this.shakes.length > 0;
  }
}

// Preset shake patterns
const ShakePresets = {
  // Small bump
  bump: { intensity: 3, duration: 10, frequency: 1.5, decay: 'exponential' },
  
  // Medium impact
  impact: { intensity: 8, duration: 20, frequency: 2.0, decay: 'exponential' },
  
  // Large explosion
  explosion: { intensity: 15, duration: 30, frequency: 2.5, decay: 'exponential' },
  
  // Continuous rumble
  rumble: { intensity: 2, duration: 60, frequency: 3.0, decay: 'linear' },
  
  // Quick jolt
  jolt: { intensity: 10, duration: 5, frequency: 1.0, decay: 'linear' }
};

// Usage
class Game {
  constructor() {
    this.screenShake = new ScreenShake();
  }
  
  onCollision() {
    // Add impact shake
    const preset = ShakePresets.impact;
    this.screenShake.add(
      preset.intensity,
      preset.duration,
      preset.frequency,
      preset.decay
    );
  }
  
  onJump() {
    // Add small bump
    const preset = ShakePresets.bump;
    this.screenShake.add(
      preset.intensity,
      preset.duration,
      preset.frequency,
      preset.decay
    );
  }
  
  update(deltaTime) {
    this.screenShake.update(deltaTime);
  }
  
  render() {
    this.ctx.save();
    this.screenShake.apply(this.ctx);
    
    // Render game
    this.renderGame();
    
    this.ctx.restore();
  }
}
```


### Directional Screen Shake

**Shake in Specific Direction**:
```javascript
// ✅ GOOD: Directional shake for impact feedback
class DirectionalShake {
  constructor() {
    this.shakes = [];
    this.offsetX = 0;
    this.offsetY = 0;
  }
  
  addDirectional(intensity, duration, directionX, directionY) {
    // Normalize direction
    const length = Math.sqrt(directionX * directionX + directionY * directionY);
    const normalizedX = length > 0 ? directionX / length : 0;
    const normalizedY = length > 0 ? directionY / length : 0;
    
    this.shakes.push({
      intensity,
      duration,
      maxDuration: duration,
      directionX: normalizedX,
      directionY: normalizedY
    });
  }
  
  update(deltaTime) {
    this.offsetX = 0;
    this.offsetY = 0;
    
    for (let i = this.shakes.length - 1; i >= 0; i--) {
      const shake = this.shakes[i];
      shake.duration -= deltaTime * 60;
      
      if (shake.duration <= 0) {
        this.shakes.splice(i, 1);
        continue;
      }
      
      // Exponential decay
      const progress = shake.duration / shake.maxDuration;
      const currentIntensity = shake.intensity * Math.pow(progress, 2);
      
      // Add random perpendicular offset for natural feel
      const perpX = -shake.directionY;
      const perpY = shake.directionX;
      const randomOffset = (Math.random() - 0.5) * 0.3;
      
      this.offsetX += shake.directionX * currentIntensity + perpX * randomOffset * currentIntensity;
      this.offsetY += shake.directionY * currentIntensity + perpY * randomOffset * currentIntensity;
    }
  }
  
  apply(ctx) {
    if (this.shakes.length === 0) return;
    ctx.translate(this.offsetX, this.offsetY);
  }
}

// Usage for collision feedback
class CollisionHandler {
  constructor(screenShake) {
    this.screenShake = screenShake;
  }
  
  handleCollision(ghost, pipe) {
    // Calculate collision direction
    const dirX = ghost.x - pipe.x;
    const dirY = ghost.y - (pipe.y || 0);
    
    // Shake away from collision point
    this.screenShake.addDirectional(12, 20, dirX, dirY);
  }
}
```

---

## Audio-Visual Synchronization

### Coordinated Feedback System

**Unified Event Response**:
```javascript
// ✅ GOOD: Synchronized audio-visual feedback
class FeedbackSystem {
  constructor(audioManager, screenShake, particleManager, flashManager) {
    this.audio = audioManager;
    this.shake = screenShake;
    this.particles = particleManager;
    this.flash = flashManager;
  }
  
  triggerJump(x, y) {
    // Audio
    this.audio.playSound('jump', { volume: 0.7 });
    
    // Visual - small shake
    this.shake.add(3, 8, 1.5, 'exponential');
    
    // Particles - burst downward
    this.particles.burst(x, y, {
      count: 5,
      velocityX: { min: -2, max: 2 },
      velocityY: { min: 2, max: 5 },
      color: 'rgba(255, 255, 255, 0.8)',
      size: { min: 2, max: 4 }
    });
  }
  
  triggerCollision(x, y, intensity = 1.0) {
    // Audio
    this.audio.playSound('collision', { volume: 1.0 });
    
    // Visual - strong shake
    this.shake.add(15 * intensity, 25, 2.0, 'exponential');
    
    // Screen flash
    this.flash.trigger('rgba(255, 0, 0, 0.6)', 12);
    
    // Particles - explosion
    this.particles.burst(x, y, {
      count: 20,
      velocityX: { min: -8, max: 8 },
      velocityY: { min: -8, max: 8 },
      color: 'rgba(255, 100, 100, 1.0)',
      size: { min: 3, max: 6 },
      life: 1.0,
      decay: 0.03
    });
    
    // Impact ripple
    this.particles.addRipple(x, y, 60, 25);
  }
  
  triggerScore(x, y, value) {
    // Audio - higher pitch for higher scores
    const pitch = 1.0 + (value * 0.1);
    this.audio.playSound('score', { volume: 0.8, pitch });
    
    // Visual - gentle shake
    this.shake.add(2, 10, 1.0, 'linear');
    
    // Flash
    this.flash.trigger('rgba(255, 255, 0, 0.3)', 8);
    
    // Score popup
    this.particles.addScorePopup(x, y, value);
    
    // Sparkle particles
    this.particles.burst(x, y, {
      count: 10,
      velocityX: { min: -3, max: 3 },
      velocityY: { min: -5, max: -2 },
      color: 'rgba(255, 215, 0, 1.0)',
      size: { min: 2, max: 3 }
    });
  }
  
  triggerPowerup(x, y, type) {
    // Audio
    this.audio.playSound('powerup', { volume: 0.9 });
    
    // Visual - medium shake
    this.shake.add(5, 15, 1.5, 'exponential');
    
    // Flash with powerup color
    const colors = {
      speed: 'rgba(0, 255, 255, 0.4)',
      shield: 'rgba(255, 255, 0, 0.4)',
      magnet: 'rgba(255, 0, 255, 0.4)'
    };
    this.flash.trigger(colors[type] || 'rgba(255, 255, 255, 0.4)', 15);
    
    // Expanding ring
    this.particles.addRing(x, y, 80, 20);
  }
}

// Usage in game
class Game {
  constructor() {
    this.feedback = new FeedbackSystem(
      this.audio,
      this.screenShake,
      this.particles,
      this.flash
    );
  }
  
  onJump() {
    const ghost = this.entities.ghost;
    this.feedback.triggerJump(ghost.x, ghost.y);
  }
  
  onCollision(ghost, pipe) {
    this.feedback.triggerCollision(ghost.x, ghost.y, 1.0);
  }
  
  onScore(pipe) {
    const x = pipe.x + pipe.width / 2;
    const y = pipe.gapY;
    this.feedback.triggerScore(x, y, 1);
  }
}
```


---

## UI Animation Patterns

### Menu Transitions

**Smooth State Transitions**:
```javascript
// ✅ GOOD: Animated menu transitions
class MenuTransition {
  constructor() {
    this.state = 'idle'; // idle, entering, exiting
    this.progress = 0;
    this.duration = 0.3; // seconds
    this.easing = 'easeOutCubic';
  }
  
  enter() {
    this.state = 'entering';
    this.progress = 0;
  }
  
  exit() {
    this.state = 'exiting';
    this.progress = 0;
  }
  
  update(deltaTime) {
    if (this.state === 'idle') return;
    
    this.progress += deltaTime / this.duration;
    
    if (this.progress >= 1.0) {
      this.progress = 1.0;
      this.state = 'idle';
    }
  }
  
  getAlpha() {
    if (this.state === 'idle') return 1.0;
    
    const t = this.ease(this.progress);
    return this.state === 'entering' ? t : 1.0 - t;
  }
  
  getScale() {
    if (this.state === 'idle') return 1.0;
    
    const t = this.ease(this.progress);
    if (this.state === 'entering') {
      return 0.8 + (t * 0.2); // Scale from 0.8 to 1.0
    } else {
      return 1.0 + (t * 0.2); // Scale from 1.0 to 1.2
    }
  }
  
  getOffset() {
    if (this.state === 'idle') return 0;
    
    const t = this.ease(this.progress);
    if (this.state === 'entering') {
      return (1.0 - t) * 50; // Slide from 50px down
    } else {
      return -t * 50; // Slide to 50px up
    }
  }
  
  ease(t) {
    // Ease out cubic
    return 1 - Math.pow(1 - t, 3);
  }
  
  isComplete() {
    return this.state === 'idle' && this.progress === 1.0;
  }
}

// Usage
class MenuScreen {
  constructor() {
    this.transition = new MenuTransition();
    this.visible = false;
  }
  
  show() {
    this.visible = true;
    this.transition.enter();
  }
  
  hide() {
    this.transition.exit();
  }
  
  update(deltaTime) {
    this.transition.update(deltaTime);
    
    if (this.transition.state === 'exiting' && this.transition.isComplete()) {
      this.visible = false;
    }
  }
  
  render(ctx) {
    if (!this.visible) return;
    
    ctx.save();
    
    // Apply transition effects
    ctx.globalAlpha = this.transition.getAlpha();
    
    const scale = this.transition.getScale();
    const offset = this.transition.getOffset();
    
    const centerX = ctx.canvas.width / 2;
    const centerY = ctx.canvas.height / 2;
    
    ctx.translate(centerX, centerY + offset);
    ctx.scale(scale, scale);
    ctx.translate(-centerX, -centerY);
    
    // Render menu content
    this.renderContent(ctx);
    
    ctx.restore();
  }
  
  renderContent(ctx) {
    // Menu rendering code
  }
}
```


### Button Animations

**Interactive Button with Juice**:
```javascript
// ✅ GOOD: Polished button with multiple animation states
class AnimatedButton {
  constructor(x, y, width, height, text, onClick) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.text = text;
    this.onClick = onClick;
    
    // Animation state
    this.scale = 1.0;
    this.targetScale = 1.0;
    this.rotation = 0;
    this.targetRotation = 0;
    this.glowIntensity = 0;
    this.targetGlow = 0;
    
    // Interaction state
    this.state = 'normal'; // normal, hover, pressed, disabled
    this.hoverTime = 0;
    this.pressTime = 0;
    
    // Animation parameters
    this.lerpSpeed = 0.2;
    this.bounceAmount = 0.1;
  }
  
  update(deltaTime, mouseX, mouseY, mousePressed) {
    const isHovered = this.contains(mouseX, mouseY);
    const wasPressed = this.state === 'pressed';
    
    // Update state
    if (this.state === 'disabled') {
      this.targetScale = 0.95;
      this.targetGlow = 0;
    } else if (isHovered) {
      this.hoverTime += deltaTime;
      
      if (mousePressed) {
        this.state = 'pressed';
        this.pressTime += deltaTime;
        this.targetScale = 0.9;
        this.targetGlow = 0.5;
      } else {
        if (wasPressed) {
          // Trigger click on release
          this.onClick();
          this.triggerBounce();
        }
        
        this.state = 'hover';
        this.targetScale = 1.05;
        this.targetGlow = 1.0;
      }
    } else {
      this.state = 'normal';
      this.hoverTime = 0;
      this.pressTime = 0;
      this.targetScale = 1.0;
      this.targetGlow = 0;
    }
    
    // Smooth interpolation
    this.scale += (this.targetScale - this.scale) * this.lerpSpeed;
    this.rotation += (this.targetRotation - this.rotation) * this.lerpSpeed;
    this.glowIntensity += (this.targetGlow - this.glowIntensity) * this.lerpSpeed;
    
    // Decay rotation
    this.targetRotation *= 0.9;
  }
  
  triggerBounce() {
    // Add bounce effect
    this.targetScale = 1.15;
    this.targetRotation = (Math.random() - 0.5) * 0.1;
  }
  
  contains(x, y) {
    return x >= this.x && x <= this.x + this.width &&
           y >= this.y && y <= this.y + this.height;
  }
  
  render(ctx) {
    ctx.save();
    
    // Apply transformations
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    
    ctx.translate(centerX, centerY);
    ctx.scale(this.scale, this.scale);
    ctx.rotate(this.rotation);
    ctx.translate(-centerX, -centerY);
    
    // Render glow
    if (this.glowIntensity > 0.01) {
      this.renderGlow(ctx, centerX, centerY);
    }
    
    // Render button background
    const colors = {
      normal: '#4CAF50',
      hover: '#66BB6A',
      pressed: '#388E3C',
      disabled: '#9E9E9E'
    };
    
    ctx.fillStyle = colors[this.state];
    this.roundRect(ctx, this.x, this.y, this.width, this.height, 8);
    ctx.fill();
    
    // Render border
    ctx.strokeStyle = this.state === 'hover' ? '#FFFFFF' : '#2E7D32';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Render text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.text, centerX, centerY);
    
    // Render hover animation (floating particles)
    if (this.state === 'hover') {
      this.renderHoverEffect(ctx, centerX, centerY);
    }
    
    ctx.restore();
  }
  
  renderGlow(ctx, centerX, centerY) {
    const gradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, this.width * 0.8
    );
    gradient.addColorStop(0, `rgba(255, 255, 255, ${this.glowIntensity * 0.3})`);
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(
      this.x - this.width * 0.3,
      this.y - this.height * 0.3,
      this.width * 1.6,
      this.height * 1.6
    );
  }
  
  renderHoverEffect(ctx, centerX, centerY) {
    const time = this.hoverTime * 5;
    const sparkleCount = 3;
    
    for (let i = 0; i < sparkleCount; i++) {
      const angle = (time + i * Math.PI * 2 / sparkleCount) % (Math.PI * 2);
      const radius = this.width * 0.6;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      const alpha = (Math.sin(time * 2 + i) + 1) / 2;
      
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
  
  setDisabled(disabled) {
    this.state = disabled ? 'disabled' : 'normal';
  }
}
```


### Score Counter Animation

**Animated Number Transitions**:
```javascript
// ✅ GOOD: Smooth score counting animation
class AnimatedCounter {
  constructor(x, y, fontSize = 48) {
    this.x = x;
    this.y = y;
    this.fontSize = fontSize;
    
    this.currentValue = 0;
    this.displayValue = 0;
    this.targetValue = 0;
    
    this.countSpeed = 0.15; // Lerp speed
    this.scale = 1.0;
    this.targetScale = 1.0;
    this.pulseSpeed = 0.3;
  }
  
  setValue(value) {
    if (value > this.targetValue) {
      // New high score - trigger pulse
      this.targetScale = 1.3;
    }
    this.targetValue = value;
  }
  
  update(deltaTime) {
    // Smooth count up
    const diff = this.targetValue - this.displayValue;
    
    if (Math.abs(diff) > 0.01) {
      this.displayValue += diff * this.countSpeed;
    } else {
      this.displayValue = this.targetValue;
    }
    
    // Scale animation
    this.scale += (this.targetScale - this.scale) * this.pulseSpeed;
    
    // Return to normal scale
    if (this.scale > 1.0) {
      this.targetScale = 1.0;
    }
  }
  
  render(ctx) {
    ctx.save();
    
    // Apply scale from center
    ctx.translate(this.x, this.y);
    ctx.scale(this.scale, this.scale);
    
    // Render score
    const displayText = Math.floor(this.displayValue).toString();
    
    // Shadow for depth
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.font = `bold ${this.fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(displayText, 2, 2);
    
    // Main text
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(displayText, 0, 0);
    
    // Outline
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.strokeText(displayText, 0, 0);
    
    ctx.restore();
  }
}

// Usage with combo system
class ScoreDisplay {
  constructor(x, y) {
    this.counter = new AnimatedCounter(x, y, 48);
    this.comboCounter = new AnimatedCounter(x, y + 60, 24);
    this.combo = 0;
    this.comboTimer = 0;
    this.comboTimeout = 2.0; // seconds
  }
  
  addScore(value) {
    this.counter.setValue(this.counter.targetValue + value);
    
    // Increment combo
    this.combo++;
    this.comboTimer = this.comboTimeout;
    this.comboCounter.setValue(this.combo);
  }
  
  update(deltaTime) {
    this.counter.update(deltaTime);
    this.comboCounter.update(deltaTime);
    
    // Combo timeout
    if (this.combo > 0) {
      this.comboTimer -= deltaTime;
      if (this.comboTimer <= 0) {
        this.combo = 0;
        this.comboCounter.setValue(0);
      }
    }
  }
  
  render(ctx) {
    this.counter.render(ctx);
    
    if (this.combo > 1) {
      ctx.save();
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`x${this.combo} COMBO!`, this.counter.x, this.counter.y + 50);
      ctx.restore();
      
      this.comboCounter.render(ctx);
    }
  }
}
```


### Progress Bar Animations

**Animated Health/Energy Bar**:
```javascript
// ✅ GOOD: Smooth progress bar with effects
class AnimatedProgressBar {
  constructor(x, y, width, height, maxValue) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.maxValue = maxValue;
    
    this.currentValue = maxValue;
    this.displayValue = maxValue;
    this.damageValue = maxValue; // For damage flash
    
    this.lerpSpeed = 0.1;
    this.damageSpeed = 0.05;
    
    this.pulsePhase = 0;
    this.shakeOffset = 0;
  }
  
  setValue(value) {
    const newValue = Math.max(0, Math.min(value, this.maxValue));
    
    if (newValue < this.currentValue) {
      // Taking damage - show damage flash
      this.damageValue = this.currentValue;
    }
    
    this.currentValue = newValue;
  }
  
  update(deltaTime) {
    // Smooth value transition
    this.displayValue += (this.currentValue - this.displayValue) * this.lerpSpeed;
    
    // Damage flash transition
    if (this.damageValue > this.currentValue) {
      this.damageValue += (this.currentValue - this.damageValue) * this.damageSpeed;
    }
    
    // Pulse when low
    const percent = this.displayValue / this.maxValue;
    if (percent < 0.3) {
      this.pulsePhase += deltaTime * 8;
      this.shakeOffset = Math.sin(this.pulsePhase) * 2;
    } else {
      this.pulsePhase = 0;
      this.shakeOffset = 0;
    }
  }
  
  render(ctx) {
    ctx.save();
    
    // Apply shake when low
    ctx.translate(this.shakeOffset, 0);
    
    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    this.roundRect(ctx, this.x, this.y, this.width, this.height, 4);
    ctx.fill();
    
    // Border
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    const percent = this.displayValue / this.maxValue;
    const damagePercent = this.damageValue / this.maxValue;
    
    // Damage flash (red background)
    if (damagePercent > percent) {
      const damageWidth = (this.width - 4) * damagePercent;
      ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
      this.roundRect(ctx, this.x + 2, this.y + 2, damageWidth, this.height - 4, 2);
      ctx.fill();
    }
    
    // Main bar
    if (percent > 0) {
      const barWidth = (this.width - 4) * percent;
      
      // Color based on percentage
      let color;
      if (percent < 0.3) {
        // Red when low
        const pulse = Math.sin(this.pulsePhase) * 0.3 + 0.7;
        color = `rgba(255, ${Math.floor(50 * pulse)}, 0, 1)`;
      } else if (percent < 0.6) {
        // Yellow when medium
        color = '#FFA500';
      } else {
        // Green when high
        color = '#4CAF50';
      }
      
      // Gradient
      const gradient = ctx.createLinearGradient(
        this.x + 2, this.y + 2,
        this.x + 2 + barWidth, this.y + 2
      );
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, this.lightenColor(color, 20));
      
      ctx.fillStyle = gradient;
      this.roundRect(ctx, this.x + 2, this.y + 2, barWidth, this.height - 4, 2);
      ctx.fill();
      
      // Shine effect
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      this.roundRect(ctx, this.x + 2, this.y + 2, barWidth, (this.height - 4) / 2, 2);
      ctx.fill();
    }
    
    // Value text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    
    const text = `${Math.ceil(this.displayValue)}/${this.maxValue}`;
    ctx.strokeText(text, this.x + this.width / 2, this.y + this.height / 2);
    ctx.fillText(text, this.x + this.width / 2, this.y + this.height / 2);
    
    ctx.restore();
  }
  
  roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
  
  lightenColor(color, percent) {
    // Simple color lightening
    return color; // Simplified for example
  }
}
```


---

## Complete Integration Example

### Game Event Handler

**Unified Audio-Visual Event System**:
```javascript
// ✅ GOOD: Complete event-driven feedback system
class GameEventHandler {
  constructor(game) {
    this.game = game;
    this.audio = game.audioManager;
    this.shake = game.screenShake;
    this.particles = game.particleManager;
    this.flash = game.flashManager;
    this.ui = game.uiManager;
  }
  
  // Jump event
  onJump(ghost) {
    // Audio
    this.audio.playSound('jump', { volume: 0.7 });
    
    // Screen shake
    this.shake.add(3, 8, 1.5, 'exponential');
    
    // Particles
    this.particles.burst(ghost.x + ghost.width / 2, ghost.y + ghost.height, {
      count: 5,
      velocityX: { min: -2, max: 2 },
      velocityY: { min: 2, max: 5 },
      color: 'rgba(200, 200, 255, 0.8)',
      size: { min: 2, max: 4 }
    });
    
    // UI feedback
    this.ui.showInputFeedback('JUMP', ghost.x, ghost.y - 20);
  }
  
  // Collision event
  onCollision(ghost, collisionType) {
    // Audio
    this.audio.playSound('collision', { volume: 1.0 });
    
    // Screen shake - stronger for different collision types
    const intensity = collisionType === 'pipe' ? 15 : 10;
    this.shake.add(intensity, 25, 2.0, 'exponential');
    
    // Screen flash
    this.flash.trigger('rgba(255, 0, 0, 0.6)', 12);
    
    // Particles - explosion
    this.particles.burst(ghost.x + ghost.width / 2, ghost.y + ghost.height / 2, {
      count: 25,
      velocityX: { min: -10, max: 10 },
      velocityY: { min: -10, max: 10 },
      color: 'rgba(255, 100, 100, 1.0)',
      size: { min: 3, max: 7 },
      life: 1.0,
      decay: 0.025
    });
    
    // Impact ripple
    this.particles.addRipple(
      ghost.x + ghost.width / 2,
      ghost.y + ghost.height / 2,
      80, 30
    );
    
    // Freeze frame effect
    this.game.freezeFrame(0.1); // 100ms freeze
    
    // UI feedback
    this.ui.showGameOver();
  }
  
  // Score event
  onScore(pipe, score) {
    // Audio - pitch increases with combo
    const pitch = 1.0 + (this.game.combo * 0.05);
    this.audio.playSound('score', { volume: 0.8, pitch });
    
    // Screen shake - gentle
    this.shake.add(2, 10, 1.0, 'linear');
    
    // Screen flash
    this.flash.trigger('rgba(255, 255, 0, 0.3)', 8);
    
    // Score popup
    const x = pipe.x + pipe.width / 2;
    const y = pipe.gapY;
    this.particles.addScorePopup(x, y, score);
    
    // Sparkle particles
    this.particles.burst(x, y, {
      count: 12,
      velocityX: { min: -4, max: 4 },
      velocityY: { min: -6, max: -2 },
      color: 'rgba(255, 215, 0, 1.0)',
      size: { min: 2, max: 4 }
    });
    
    // UI update
    this.ui.scoreDisplay.addScore(score);
    
    // Combo feedback
    if (this.game.combo > 2) {
      this.ui.showComboText(this.game.combo);
    }
  }
  
  // State change events
  onStateChange(oldState, newState) {
    if (newState === 'playing') {
      // Game start
      this.audio.playSound('start', { volume: 0.6 });
      this.ui.hideMenu();
      this.ui.showHUD();
    } else if (newState === 'paused') {
      // Pause
      this.audio.playSound('pause', { volume: 0.5 });
      this.ui.showPauseMenu();
    } else if (newState === 'game_over') {
      // Game over handled in onCollision
      this.ui.showGameOverScreen(this.game.score, this.game.highScore);
    }
  }
  
  // Menu interactions
  onMenuButtonClick(buttonName) {
    // Audio
    this.audio.playSound('button_click', { volume: 0.6 });
    
    // Screen shake - tiny
    this.shake.add(1, 5, 1.0, 'linear');
    
    // Button feedback handled by button itself
  }
  
  onMenuButtonHover(buttonName) {
    // Audio - subtle
    this.audio.playSound('button_hover', { volume: 0.3 });
  }
}

// Usage in game loop
class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    // Initialize systems
    this.audioManager = new AudioManager(config);
    this.screenShake = new ScreenShake();
    this.particleManager = new ParticleManager();
    this.flashManager = new FlashManager();
    this.uiManager = new UIManager();
    
    // Event handler
    this.events = new GameEventHandler(this);
    
    this.combo = 0;
    this.freezeTime = 0;
  }
  
  update(deltaTime) {
    // Handle freeze frame
    if (this.freezeTime > 0) {
      this.freezeTime -= deltaTime;
      return; // Skip update during freeze
    }
    
    // Normal update
    this.updateGame(deltaTime);
  }
  
  freezeFrame(duration) {
    this.freezeTime = duration;
  }
  
  handleJump() {
    this.ghost.jump();
    this.events.onJump(this.ghost);
  }
  
  handleCollision(collisionType) {
    this.events.onCollision(this.ghost, collisionType);
    this.setState('game_over');
  }
  
  handleScore(pipe) {
    this.score++;
    this.combo++;
    this.events.onScore(pipe, 1);
  }
}
```


---

## Performance Considerations

### Audio Performance

**Optimize Audio Playback**:
```javascript
// ✅ GOOD: Efficient audio management
class PerformantAudioManager extends AudioManager {
  constructor(config) {
    super(config);
    this.maxConcurrentSounds = 8;
    this.activeSounds = [];
  }
  
  playSound(name, options = {}) {
    // Limit concurrent sounds
    if (this.activeSounds.length >= this.maxConcurrentSounds) {
      // Stop oldest sound
      const oldest = this.activeSounds.shift();
      if (oldest && oldest.stop) {
        oldest.stop();
      }
    }
    
    const instance = super.playSound(name, options);
    
    if (instance) {
      this.activeSounds.push(instance);
      
      // Auto-cleanup after duration
      setTimeout(() => {
        const index = this.activeSounds.indexOf(instance);
        if (index > -1) {
          this.activeSounds.splice(index, 1);
        }
      }, 2000); // 2 second cleanup
    }
    
    return instance;
  }
}
```

### Animation Performance

**Optimize UI Animations**:
```javascript
// ✅ GOOD: Efficient animation updates
class AnimationManager {
  constructor() {
    this.animations = [];
  }
  
  add(animation) {
    this.animations.push(animation);
  }
  
  update(deltaTime) {
    // Update in reverse to allow safe removal
    for (let i = this.animations.length - 1; i >= 0; i--) {
      const anim = this.animations[i];
      anim.update(deltaTime);
      
      if (anim.isComplete()) {
        this.animations.splice(i, 1);
      }
    }
  }
  
  render(ctx) {
    for (const anim of this.animations) {
      anim.render(ctx);
    }
  }
  
  clear() {
    this.animations = [];
  }
  
  getCount() {
    return this.animations.length;
  }
}
```

---

## Testing and Debugging

### Audio Debug Panel

**Visual Audio Feedback**:
```javascript
// ✅ GOOD: Debug overlay for audio
class AudioDebugPanel {
  constructor(audioManager) {
    this.audio = audioManager;
    this.soundHistory = [];
    this.maxHistory = 10;
  }
  
  logSound(name, volume) {
    this.soundHistory.unshift({
      name,
      volume,
      time: Date.now()
    });
    
    if (this.soundHistory.length > this.maxHistory) {
      this.soundHistory.pop();
    }
  }
  
  render(ctx, x, y) {
    ctx.save();
    
    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(x, y, 250, 200);
    
    // Title
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('Audio Debug', x + 10, y + 20);
    
    // Stats
    ctx.font = '12px monospace';
    ctx.fillText(`Muted: ${this.audio.muted}`, x + 10, y + 40);
    ctx.fillText(`Volume: ${(this.audio.masterVolume * 100).toFixed(0)}%`, x + 10, y + 55);
    ctx.fillText(`Active: ${this.audio.activeSounds?.length || 0}`, x + 10, y + 70);
    
    // Recent sounds
    ctx.fillText('Recent Sounds:', x + 10, y + 90);
    
    const now = Date.now();
    for (let i = 0; i < this.soundHistory.length; i++) {
      const sound = this.soundHistory[i];
      const age = (now - sound.time) / 1000;
      const alpha = Math.max(0, 1 - age / 2);
      
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fillText(
        `${sound.name} (${(sound.volume * 100).toFixed(0)}%)`,
        x + 15,
        y + 105 + i * 15
      );
    }
    
    ctx.restore();
  }
}
```

### Effect Visualization

**Debug Shake and Effects**:
```javascript
// ✅ GOOD: Visualize screen shake
class EffectDebugPanel {
  constructor(screenShake, particleManager) {
    this.shake = screenShake;
    this.particles = particleManager;
  }
  
  render(ctx, x, y) {
    ctx.save();
    
    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(x, y, 250, 150);
    
    // Title
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('Effects Debug', x + 10, y + 20);
    
    // Screen shake info
    ctx.font = '12px monospace';
    ctx.fillText(`Shake Active: ${this.shake.isActive()}`, x + 10, y + 40);
    ctx.fillText(`Shake Count: ${this.shake.shakes.length}`, x + 10, y + 55);
    ctx.fillText(`Offset: (${this.shake.offsetX.toFixed(1)}, ${this.shake.offsetY.toFixed(1)})`, x + 10, y + 70);
    
    // Particle info
    ctx.fillText(`Particles: ${this.particles.getActiveCount()}`, x + 10, y + 90);
    ctx.fillText(`Pool Size: ${this.particles.getPoolSize()}`, x + 10, y + 105);
    
    // Visual shake indicator
    if (this.shake.isActive()) {
      ctx.fillStyle = '#FF0000';
      ctx.fillRect(x + 230, y + 35, 10, 10);
    }
    
    ctx.restore();
  }
}
```

---

## Best Practices Checklist

### Audio Integration
- [ ] Load all sounds during initialization
- [ ] Handle browser autoplay policy with user interaction
- [ ] Implement sound pooling for rapid-fire effects
- [ ] Provide mute/volume controls
- [ ] Gracefully handle audio loading failures
- [ ] Limit concurrent sound instances
- [ ] Use Web Audio API when available for better performance

### Visual Feedback
- [ ] Synchronize audio and visual effects
- [ ] Use screen shake sparingly (avoid motion sickness)
- [ ] Implement smooth transitions for all UI elements
- [ ] Provide visual feedback for all user interactions
- [ ] Use easing functions for natural motion
- [ ] Layer multiple feedback types for impact
- [ ] Test effects at both 60 FPS and 120 FPS

### Performance
- [ ] Profile audio and animation performance
- [ ] Limit active animations and effects
- [ ] Use object pooling for particles and effects
- [ ] Batch similar rendering operations
- [ ] Avoid allocations in hot paths
- [ ] Test on lower-end devices
- [ ] Provide quality settings for effects

---

## References

- **Design Document**: `.kiro/specs/flappy-kiro/design.md`
- **Audio Assets**: `kiro-introduction-starter-kit/audio-assets.md`
- **Visual Design**: `.kiro/steering/visual-design.md`
- **Canvas Optimization**: `.kiro/steering/canvas-optimization-and-feedback.md`
- **Web Audio API**: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
- **Game Feel**: https://www.youtube.com/watch?v=Fy0aCDmgnxg (Juice it or lose it)

