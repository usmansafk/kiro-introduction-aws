# Ghosty Character Sprite Specifications

## Overview

This document defines the sprite specifications for the Ghosty character in Flappy Kiro. The character uses a simple sprite-based animation system with multiple states for different gameplay situations.

## Sprite Dimensions

- **Base Sprite Size**: 32x32 pixels
- **Actual Character Size**: 34x24 pixels (as configured in game-config.json)
- **Sprite Sheet Layout**: Horizontal strip (single row)
- **File Format**: PNG with transparency
- **Color Depth**: 32-bit RGBA

## Hitbox Specifications

### Circular Collision Bounds
- **Hitbox Type**: Circle (for forgiving collision detection)
- **Hitbox Radius**: 12 pixels
- **Hitbox Center**: Sprite center (16, 16) relative to sprite origin
- **Collision Method**: Circle-to-rectangle intersection

### Rectangular Fallback Bounds
- **Hitbox Width**: 28 pixels
- **Hitbox Height**: 20 pixels
- **Hitbox Offset X**: 3 pixels (from sprite left edge)
- **Hitbox Offset Y**: 2 pixels (from sprite top edge)
- **Purpose**: Debug visualization and fallback collision

### Hitbox Positioning
```
Sprite (32x32)
┌─────────────────────────────────┐
│         ╭─────────╮             │
│         │ Hitbox  │             │
│    ╭────┼─────────┼────╮        │
│    │    │ (12px   │    │        │
│    │    │ radius) │    │        │
│    │    │         │    │        │
│    ╰────┼─────────┼────╯        │
│         │         │             │
│         ╰─────────╯             │
└─────────────────────────────────┘
     Center: (16, 16)
```

## Animation States

### 1. Idle State
**Description**: Default floating animation when ghost is in neutral position

**Frame Count**: 2 frames
**Frame Duration**: 200ms per frame (5 FPS)
**Loop**: Yes (continuous)

**Frames**:
- **Frame 0** (0-199ms): Base idle pose
  - Eyes: Open, looking forward
  - Body: Neutral position
  - Tail: Slight wave
  
- **Frame 1** (200-399ms): Subtle float
  - Eyes: Open, looking forward
  - Body: Slightly elevated (1-2px)
  - Tail: Wave continuation

**Sprite Sheet Position**: Columns 0-1

### 2. Flap State
**Description**: Active animation when player presses jump/flap input

**Frame Count**: 3 frames
**Frame Duration**: 100ms per frame (10 FPS)
**Loop**: No (plays once, returns to idle)

**Frames**:
- **Frame 0** (0-99ms): Anticipation
  - Eyes: Wide open
  - Body: Compressed slightly
  - Tail: Pulled in
  
- **Frame 1** (100-199ms): Peak flap
  - Eyes: Determined expression
  - Body: Extended upward
  - Tail: Fully extended
  
- **Frame 2** (200-299ms): Recovery
  - Eyes: Normal
  - Body: Returning to neutral
  - Tail: Relaxing

**Sprite Sheet Position**: Columns 2-4

**Trigger**: On jump input (spacebar, click, or tap)
**Transition**: Returns to Idle after completion

### 3. Death State
**Description**: Animation played when collision occurs

**Frame Count**: 4 frames
**Frame Duration**: 150ms per frame (6.67 FPS)
**Loop**: No (plays once, holds last frame)

**Frames**:
- **Frame 0** (0-149ms): Impact
  - Eyes: X_X (knocked out)
  - Body: Recoil from collision
  - Tail: Shocked straight
  
- **Frame 1** (150-299ms): Spin start
  - Eyes: X_X
  - Body: Beginning rotation
  - Tail: Following rotation
  
- **Frame 2** (300-449ms): Spin continue
  - Eyes: X_X
  - Body: Mid-rotation (90°)
  - Tail: Trailing behind
  
- **Frame 3** (450-599ms): Final pose
  - Eyes: X_X
  - Body: Upside down or tilted
  - Tail: Drooping

**Sprite Sheet Position**: Columns 5-8

**Trigger**: On collision detection
**Transition**: Holds on final frame until game over screen

## Sprite Sheet Layout

```
┌────────┬────────┬────────┬────────┬────────┬────────┬────────┬────────┬────────┐
│ Idle 0 │ Idle 1 │ Flap 0 │ Flap 1 │ Flap 2 │Death 0 │Death 1 │Death 2 │Death 3 │
│  32x32 │  32x32 │  32x32 │  32x32 │  32x32 │  32x32 │  32x32 │  32x32 │  32x32 │
└────────┴────────┴────────┴────────┴────────┴────────┴────────┴────────┴────────┘
   0px      32px     64px     96px    128px    160px    192px    224px    256px

Total Width: 288 pixels (9 frames × 32px)
Total Height: 32 pixels
```

## Current Implementation

**Note**: The current implementation uses a single static sprite (`ghosty.png`) located at:
```
/Users/usman.sajid/Documents/kiro-introduction/assets/ghosty.png
```

**Current Behavior**:
- Single sprite rendered at all times
- Rotation applied based on velocity for visual feedback
- No frame-based animation (simplified implementation)

**Future Enhancement**:
To implement full animation, create a sprite sheet with the layout above and update the rendering code to:
1. Track current animation state
2. Update frame index based on elapsed time
3. Render appropriate frame from sprite sheet using `drawImage()` with source rectangle

## Rendering Specifications

### Basic Rendering (Current)
```javascript
ctx.drawImage(
  ghostSprite,           // Image source
  ghost.x,               // Destination X
  ghost.y,               // Destination Y
  ghost.width,           // Destination width (34px)
  ghost.height           // Destination height (24px)
);
```

### Sprite Sheet Rendering (Future)
```javascript
const frameWidth = 32;
const frameHeight = 32;
const frameIndex = getCurrentFrame(animationState, elapsedTime);

ctx.drawImage(
  ghostSpriteSheet,                    // Sprite sheet source
  frameIndex * frameWidth, 0,          // Source X, Y
  frameWidth, frameHeight,             // Source width, height
  ghost.x, ghost.y,                    // Destination X, Y
  ghost.width, ghost.height            // Destination width, height
);
```

### Rotation (Applied to all states)
```javascript
ctx.save();
ctx.translate(ghost.x + ghost.width / 2, ghost.y + ghost.height / 2);
ctx.rotate(ghost.rotation * Math.PI / 180);
ctx.drawImage(
  ghostSprite,
  -ghost.width / 2, -ghost.height / 2,
  ghost.width, ghost.height
);
ctx.restore();
```

**Rotation Calculation**:
- Based on vertical velocity
- Range: -25° to +25°
- Formula: `rotation = clamp(velocity * 2, -25, 25)`
- Upward velocity → nose up (negative angle)
- Downward velocity → nose down (positive angle)

## Visual Effects

### Invincibility Indicator
When invincibility frames are active:
- **Effect**: Golden flashing border around hitbox
- **Flash Rate**: 100ms on/off (10 Hz)
- **Border Color**: #FFD700 (gold)
- **Border Width**: 2 pixels
- **Shape**: Circle matching hitbox radius

### Particle Trail
Particles spawn behind the ghost during gameplay:
- **Spawn Position**: Ghost center (x + width/2, y + height/2)
- **Spawn Rate**: 30% chance per frame (configurable)
- **Particle Color**: White (#FFFFFF) with fading alpha
- **Particle Size**: 2-5 pixels (random)
- **Particle Velocity**: Random within ±2 px/s range

## Color Palette

### Ghost Body
- **Primary**: White (#FFFFFF) with slight transparency
- **Shadow**: Light gray (#E0E0E0) for depth
- **Outline**: Dark gray (#333333) for definition

### Eyes
- **Idle/Flap**: Black (#000000) pupils, white sclera
- **Death**: X marks (black #000000)

### Tail
- **Color**: Matches body (white with transparency)
- **Wispy Effect**: Gradient fade at tail end

## Technical Notes

### Performance Considerations
- **Sprite Caching**: Load sprite sheet once at initialization
- **Frame Calculation**: Use modulo for looping animations
- **State Transitions**: Immediate (no blending between states)
- **Memory**: Single sprite sheet (~9KB estimated)

### Browser Compatibility
- **Format**: PNG with alpha channel (universally supported)
- **Fallback**: Solid color rectangle if sprite fails to load
- **Size**: Optimized for web (compressed PNG)

### Animation State Machine
```
        ┌──────┐
        │ IDLE │◄─────────┐
        └──┬───┘          │
           │              │
    [Jump Input]    [Animation Complete]
           │              │
           ▼              │
        ┌──────┐          │
        │ FLAP ├──────────┘
        └──────┘
           
        [Collision]
           │
           ▼
        ┌───────┐
        │ DEATH │ (Terminal State)
        └───────┘
```

## Implementation Checklist

- [x] Define sprite dimensions (32x32px)
- [x] Define hitbox radius (12px circular)
- [x] Specify animation states (idle, flap, death)
- [x] Define frame counts and durations
- [x] Document sprite sheet layout
- [ ] Create sprite sheet with all frames
- [ ] Implement animation state machine
- [ ] Implement frame-based rendering
- [ ] Add state transition logic
- [ ] Test all animation states

## References

- **Current Sprite**: `/Users/usman.sajid/Documents/kiro-introduction/assets/ghosty.png`
- **Config File**: `game-config.json` (ghost section)
- **Design Document**: `.kiro/specs/flappy-kiro/design.md` (Ghost Entity section)
- **Collision System**: `.kiro/specs/flappy-kiro/design.md` (Collision Detection section)
