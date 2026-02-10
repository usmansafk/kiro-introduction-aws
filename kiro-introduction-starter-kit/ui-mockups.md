# UI Mockups and Interface Design

## Overview

This document defines the user interface designs for Flappy Kiro. The game features a minimalist retro aesthetic with clear visual hierarchy and intuitive controls. All screens are designed for a 400x600px canvas with support for both desktop and mobile interactions.

## Design Principles

1. **Minimalism**: Clean, uncluttered interfaces that don't distract from gameplay
2. **Readability**: High contrast text with clear typography
3. **Consistency**: Unified visual language across all screens
4. **Accessibility**: Large touch targets, keyboard support, clear visual feedback
5. **Retro Aesthetic**: Simple graphics, bold colors, pixel-perfect alignment

## Color Palette

### Primary Colors
- **Background**: `#87CEEB` (Sky Blue) - Light, calming background
- **Text Primary**: `#000000` (Black) - High contrast for readability
- **Text Secondary**: `#FFFFFF` (White) - For overlays and emphasis
- **Accent Gold**: `#FFD700` (Gold) - Highlights and score indicators
- **Pipe Green**: `#00AA00` (Green) - Obstacle color
- **Overlay**: `rgba(0, 0, 0, 0.5)` (Semi-transparent black) - Modal backgrounds

### State Colors
- **Success**: `#00FF00` (Bright Green) - Positive feedback
- **Warning**: `#FFA500` (Orange) - Caution states
- **Error**: `#FF0000` (Red) - Collision/failure states
- **Invincibility**: `#FFD700` (Gold) - Special state indicator

## Typography

### Font Stack
```css
font-family: 'Arial', 'Helvetica', sans-serif;
```

### Font Sizes
- **Title**: 48px bold - Main game title
- **Subtitle**: 28px regular - Final scores, section headers
- **Body**: 24px regular - High scores, instructions
- **UI Text**: 20px regular - In-game HUD, buttons
- **Small**: 16px regular - Helper text, credits

### Text Alignment
- **Centered**: All screen titles and primary content
- **Left-aligned**: List items (if added)
- **Right-aligned**: Numerical scores (optional)

---

## Screen 1: Main Menu

### Layout Overview

```
┌─────────────────────────────────────────┐
│                                         │
│              (Sky Blue BG)              │
│                                         │
│           FLAPPY KIRO                   │ ← Title (48px bold)
│                                         │
│                                         │
│         [Ghosty Sprite]                 │ ← Animated idle sprite
│                                         │
│                                         │
│        High Score: 42                   │ ← High score (24px)
│                                         │
│                                         │
│   Press SPACE or Click to Start         │ ← Instructions (20px)
│                                         │
│                                         │
│            [  PLAY  ]                   │ ← Optional button
│                                         │
│                                         │
│         Made with Kiro                  │ ← Credits (16px)
│                                         │
└─────────────────────────────────────────┘
     400px width × 600px height
```

### Detailed Specifications

**Title Section** (Y: 100-150px)
- **Text**: "FLAPPY KIRO"
- **Font**: 48px bold, black
- **Position**: Centered horizontally at Y=150px
- **Effect**: Optional subtle shadow or outline for depth

**Character Preview** (Y: 200-280px)
- **Sprite**: Ghosty idle animation (34x24px scaled to 68x48px)
- **Position**: Centered at X=200px, Y=240px
- **Animation**: Gentle floating motion (idle state, 2 frames)
- **Effect**: Slight vertical bobbing (±5px over 1 second)

**High Score Display** (Y: 320px)
- **Text**: "High Score: [number]"
- **Font**: 24px regular, black
- **Position**: Centered at Y=320px
- **Format**: Zero-padded if desired (e.g., "High Score: 042")

**Instructions** (Y: 380px)
- **Text**: "Press SPACE or Click to Start"
- **Font**: 20px regular, black
- **Position**: Centered at Y=380px
- **Animation**: Optional gentle pulse (opacity 0.7-1.0 over 1.5s)

**Play Button** (Y: 440px) - Optional
- **Size**: 120px × 50px
- **Position**: Centered at X=200px, Y=440px
- **Background**: White with 2px black border
- **Text**: "PLAY" (24px bold, black)
- **Hover**: Light gray background (#F0F0F0)
- **Active**: Darker gray background (#D0D0D0)

**Credits** (Y: 560px)
- **Text**: "Made with Kiro"
- **Font**: 16px regular, dark gray (#666666)
- **Position**: Centered at Y=560px

### Interaction States

**Default State**:
- All elements visible
- Ghosty sprite animating
- Instructions text pulsing gently

**Hover State** (Desktop):
- Play button changes background color
- Cursor changes to pointer

**Active State**:
- Any click/tap/spacebar press transitions to PLAYING state
- Brief fade-out animation (200ms)

### Responsive Considerations

**Desktop**:
- Mouse hover effects on play button
- Spacebar as primary input

**Mobile**:
- Larger touch target for play button (150px × 60px)
- Tap anywhere to start (not just button)
- No hover effects

---

## Screen 2: In-Game HUD (Playing State)

### Layout Overview

```
┌─────────────────────────────────────────┐
│                                         │
│  [Ghosty]    [Pipes]    [Particles]     │ ← Game area
│                                         │
│                                         │
│                                         │
│                                         │
│                                         │
│                                         │
│                                         │
│                                         │
│                                         │
│                                         │
│                                         │
│                                         │
│                                         │
│                                         │
│                                         │
│                                         │
│         Score: 12 | High: 42            │ ← HUD (bottom)
│                                         │
└─────────────────────────────────────────┘
```

### Detailed Specifications

**Game Area** (Y: 0-560px)
- **Background**: Sky blue (#87CEEB)
- **Content**: Ghosty sprite, pipes, particles, score indicators
- **Boundaries**: Visible ceiling (Y=0) and ground (Y=600)
- **Effects**: Screen shake on collision

**Score Display** (Y: 580px)
- **Text**: "Score: [current] | High: [high]"
- **Font**: 20px regular, black
- **Position**: Centered at Y=580px
- **Format**: "Score: 12 | High: 42"
- **Update**: Real-time as score changes

**Score Indicator** (Floating)
- **Text**: "+1"
- **Font**: 24px bold, gold (#FFD700)
- **Position**: Appears at pipe gap center when scored
- **Animation**: Floats upward 50px over 1 second, fades out
- **Lifecycle**: Spawns → floats → fades → removes

**Invincibility Indicator** (Overlay on Ghosty)
- **Visual**: Golden flashing border around hitbox
- **Flash Rate**: 100ms on/off (10 Hz)
- **Border**: 2px solid gold (#FFD700)
- **Shape**: Circle matching hitbox radius (12px)
- **Duration**: First 1 second of gameplay (120 frames at 120 FPS)

### Interaction States

**Playing State**:
- Spacebar/click/tap triggers jump
- Escape key triggers pause
- All game elements updating in real-time

**Invincibility State** (First 1 second):
- Golden border flashing around Ghosty
- Collisions ignored
- Visual feedback that player is safe

### Visual Feedback

**Jump Action**:
- Ghosty sprite rotates upward (nose up)
- Particle trail spawns behind Ghosty
- Jump sound plays

**Score Increment**:
- "+1" indicator appears at pipe gap
- Score sound plays
- Score display updates immediately

**Collision**:
- Screen shake effect (10px intensity, 30 frames)
- Ghosty sprite stops animating
- Collision sound plays
- Transition to game over screen

---

## Screen 3: Pause Overlay

### Layout Overview

```
┌─────────────────────────────────────────┐
│                                         │
│  [Ghosty]    [Pipes]    [Particles]     │ ← Frozen game
│         (Semi-transparent overlay)      │
│                                         │
│                                         │
│                                         │
│              PAUSED                     │ ← Title (48px bold)
│                                         │
│                                         │
│       Press SPACE to Resume             │ ← Instructions (20px)
│                                         │
│                                         │
│                                         │
│                                         │
│                                         │
│                                         │
│                                         │
│         Score: 12 | High: 42            │ ← HUD (still visible)
│                                         │
└─────────────────────────────────────────┘
```

### Detailed Specifications

**Overlay Background** (Full screen)
- **Color**: `rgba(0, 0, 0, 0.5)` (50% black)
- **Size**: 400px × 600px (full canvas)
- **Effect**: Darkens game area, keeps it visible

**Paused Title** (Y: 250px)
- **Text**: "PAUSED"
- **Font**: 48px bold, white
- **Position**: Centered at Y=250px
- **Shadow**: Optional 2px black text shadow for depth

**Resume Instructions** (Y: 320px)
- **Text**: "Press SPACE to Resume"
- **Font**: 20px regular, white
- **Position**: Centered at Y=320px
- **Animation**: Optional gentle pulse

**Game State** (Background)
- **Frozen**: All entities stop updating
- **Visible**: Game remains visible through overlay
- **HUD**: Score display still visible at bottom

### Interaction States

**Paused State**:
- Spacebar/click/tap resumes game
- Escape key also resumes (toggle)
- All game logic frozen

**Resume Transition**:
- Overlay fades out (200ms)
- Game resumes immediately
- No countdown needed

---

## Screen 4: Game Over Screen

### Layout Overview

```
┌─────────────────────────────────────────┐
│                                         │
│  [Ghosty]    [Pipes]    [Particles]     │ ← Frozen game
│      (Dark semi-transparent overlay)    │
│                                         │
│                                         │
│            GAME OVER                    │ ← Title (48px bold)
│                                         │
│                                         │
│            Score: 12                    │ ← Final score (28px)
│                                         │
│          High Score: 42                 │ ← High score (28px)
│                                         │
│                                         │
│   Press SPACE or Click to Restart       │ ← Instructions (20px)
│                                         │
│                                         │
│          [  RESTART  ]                  │ ← Optional button
│                                         │
│                                         │
└─────────────────────────────────────────┘
```

### Detailed Specifications

**Overlay Background** (Full screen)
- **Color**: `rgba(0, 0, 0, 0.7)` (70% black) - Darker than pause
- **Size**: 400px × 600px (full canvas)
- **Effect**: Emphasizes game over state

**Game Over Title** (Y: 150px)
- **Text**: "GAME OVER"
- **Font**: 48px bold, white
- **Position**: Centered at Y=150px
- **Effect**: Optional red tint or shadow

**Final Score** (Y: 210px)
- **Text**: "Score: [final]"
- **Font**: 28px regular, white
- **Position**: Centered at Y=210px
- **Highlight**: Gold color if new high score

**High Score Display** (Y: 250px)
- **Text**: "High Score: [high]"
- **Font**: 28px regular, white
- **Position**: Centered at Y=250px
- **Effect**: "NEW!" badge if high score beaten

**New High Score Badge** (Y: 250px) - Conditional
- **Text**: "NEW HIGH SCORE!"
- **Font**: 24px bold, gold (#FFD700)
- **Position**: Above high score display at Y=230px
- **Animation**: Gentle pulse or sparkle effect

**Restart Instructions** (Y: 320px)
- **Text**: "Press SPACE or Click to Restart"
- **Font**: 20px regular, white
- **Position**: Centered at Y=320px

**Restart Button** (Y: 380px) - Optional
- **Size**: 140px × 50px
- **Position**: Centered at X=200px, Y=380px
- **Background**: White with 2px black border
- **Text**: "RESTART" (24px bold, black)
- **Hover**: Light gray background (#F0F0F0)
- **Active**: Darker gray background (#D0D0D0)

### Interaction States

**Game Over State**:
- All game elements frozen
- Ghosty sprite in death animation (final frame)
- Pipes stopped in place

**New High Score State**:
- Final score displayed in gold
- "NEW HIGH SCORE!" badge visible
- Optional celebration animation (particles, sparkles)

**Restart Transition**:
- Any input triggers restart
- Brief fade-out (200ms)
- Transition to PLAYING state
- All entities reset

### Visual Feedback

**High Score Beaten**:
- Score text changes to gold color
- "NEW!" badge appears with animation
- Optional confetti or particle burst effect
- Celebratory sound (if implemented)

**Standard Game Over**:
- Standard white text
- No special effects
- Clean, simple presentation

---

## Screen 5: Loading Screen (Optional)

### Layout Overview

```
┌─────────────────────────────────────────┐
│                                         │
│                                         │
│                                         │
│                                         │
│           FLAPPY KIRO                   │ ← Title (48px bold)
│                                         │
│                                         │
│         [Ghosty Sprite]                 │ ← Loading animation
│                                         │
│                                         │
│          Loading...                     │ ← Status (20px)
│                                         │
│      ████████░░░░░░░░                   │ ← Progress bar
│                                         │
│                                         │
│                                         │
│                                         │
│                                         │
└─────────────────────────────────────────┘
```

### Detailed Specifications

**Title** (Y: 200px)
- **Text**: "FLAPPY KIRO"
- **Font**: 48px bold, black
- **Position**: Centered at Y=200px

**Loading Animation** (Y: 280px)
- **Sprite**: Ghosty sprite
- **Animation**: Rotating or bobbing
- **Position**: Centered at Y=280px

**Loading Text** (Y: 340px)
- **Text**: "Loading..."
- **Font**: 20px regular, black
- **Position**: Centered at Y=340px

**Progress Bar** (Y: 380px) - Optional
- **Size**: 200px × 20px
- **Position**: Centered at X=200px, Y=380px
- **Background**: Light gray (#CCCCCC)
- **Fill**: Green (#00AA00)
- **Border**: 2px black
- **Progress**: 0-100% based on asset loading

---

## UI Components Library

### Button Component

**Standard Button**:
```
┌──────────────────┐
│      TEXT        │
└──────────────────┘
```

**Specifications**:
- **Size**: 120px × 50px (default)
- **Background**: White (#FFFFFF)
- **Border**: 2px solid black (#000000)
- **Text**: 24px bold, black, centered
- **Padding**: 10px vertical, 20px horizontal
- **Border Radius**: 0px (sharp corners for retro look)

**States**:
- **Default**: White background, black text
- **Hover**: Light gray background (#F0F0F0)
- **Active**: Darker gray background (#D0D0D0)
- **Disabled**: Gray background (#CCCCCC), gray text (#999999)

### Text Display Component

**Score Display**:
```
Score: 12 | High: 42
```

**Specifications**:
- **Font**: 20px regular, black
- **Format**: "Score: [current] | High: [high]"
- **Separator**: Vertical bar (|) with spaces
- **Alignment**: Centered

### Floating Text Component

**Score Indicator**:
```
  +1  ← Floats upward and fades
```

**Specifications**:
- **Font**: 24px bold, gold (#FFD700)
- **Animation**: Float upward 50px over 1 second
- **Opacity**: Fades from 1.0 to 0.0
- **Lifecycle**: 1 second total

---

## Animation Specifications

### Screen Transitions

**Fade Out** (200ms):
```javascript
opacity: 1.0 → 0.0
easing: linear
```

**Fade In** (200ms):
```javascript
opacity: 0.0 → 1.0
easing: linear
```

### UI Animations

**Pulse Effect** (1.5s loop):
```javascript
opacity: 0.7 → 1.0 → 0.7
easing: ease-in-out
```

**Float Effect** (1s):
```javascript
y: start → start - 50px
opacity: 1.0 → 0.0
easing: ease-out
```

**Bobbing Effect** (1s loop):
```javascript
y: start → start + 5px → start - 5px → start
easing: ease-in-out
```

---

## Responsive Design

### Desktop (400x600px)
- **Input**: Keyboard (spacebar, escape) + mouse
- **Hover Effects**: Enabled on buttons
- **Touch Targets**: Standard button sizes

### Mobile (400x600px)
- **Input**: Touch only
- **Hover Effects**: Disabled
- **Touch Targets**: Larger buttons (150px × 60px)
- **Tap Anywhere**: Full screen tap to start/restart

### Scaling (Future)
- **Maintain Aspect Ratio**: 2:3 (width:height)
- **Scale Canvas**: Proportionally to fit screen
- **UI Elements**: Scale with canvas
- **Font Sizes**: Scale proportionally

---

## Accessibility Considerations

### Visual
- **High Contrast**: Black text on light backgrounds
- **Large Text**: Minimum 20px for body text
- **Clear Hierarchy**: Size and weight differentiate importance

### Interaction
- **Keyboard Support**: Full game playable with keyboard
- **Large Touch Targets**: Minimum 44px × 44px (mobile)
- **Clear Feedback**: Visual and audio feedback for all actions

### Color Blindness
- **Not Color-Dependent**: Game mechanics don't rely on color alone
- **High Contrast**: Text always readable
- **Shape Differentiation**: Pipes, ghost, and background distinguishable by shape

---

## Implementation Notes

### Rendering Order (Back to Front)
1. Background (sky blue)
2. Pipes
3. Particles (behind ghost)
4. Ghosty sprite
5. Score indicators (floating text)
6. HUD (score display at bottom)
7. Overlays (pause, game over)
8. UI elements (buttons, text)

### Canvas Layers
- **Single Canvas**: All elements rendered on one canvas
- **Clear Each Frame**: Full canvas clear and redraw
- **Z-Index**: Managed by render order, not CSS

### Text Rendering
```javascript
ctx.font = '20px Arial';
ctx.fillStyle = '#000000';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('Score: 12 | High: 42', 200, 580);
```

### Button Rendering
```javascript
// Draw button background
ctx.fillStyle = '#FFFFFF';
ctx.fillRect(140, 415, 120, 50);

// Draw button border
ctx.strokeStyle = '#000000';
ctx.lineWidth = 2;
ctx.strokeRect(140, 415, 120, 50);

// Draw button text
ctx.fillStyle = '#000000';
ctx.font = 'bold 24px Arial';
ctx.textAlign = 'center';
ctx.fillText('PLAY', 200, 440);
```

---

## Design Assets Checklist

- [x] Define color palette
- [x] Define typography system
- [x] Design main menu layout
- [x] Design in-game HUD
- [x] Design pause overlay
- [x] Design game over screen
- [x] Define button component
- [x] Define text display component
- [x] Define floating text component
- [x] Specify animations
- [x] Document responsive considerations
- [x] Document accessibility features
- [ ] Create visual mockups (optional)
- [ ] Create interactive prototype (optional)

---

## References

- **Requirements**: `.kiro/specs/flappy-kiro/requirements.md` (Requirement 6, 7.1)
- **Design Document**: `.kiro/specs/flappy-kiro/design.md` (Renderer section)
- **Config File**: `game-config.json` (visual section)
- **Example UI**: `img/example-ui.png`
