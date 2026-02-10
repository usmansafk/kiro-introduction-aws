# Audio Assets Specification

## Overview

This document defines the audio specifications for Flappy Kiro. The game uses a minimal set of sound effects to provide clear audio feedback for player actions and game events. All sounds are designed to be pleasant, non-intrusive, and suitable for extended gameplay sessions.

## Audio System Requirements

### Technical Specifications
- **Format**: WAV (primary), MP3/OGG (fallback)
- **Sample Rate**: 44.1 kHz (CD quality)
- **Bit Depth**: 16-bit
- **Channels**: Mono (sufficient for simple sound effects)
- **Compression**: Uncompressed WAV for quality, compressed formats for web optimization
- **Total Size Budget**: < 100 KB for all audio assets

### Browser Compatibility
- **Primary Format**: WAV (universally supported)
- **Fallback Formats**: MP3 (Safari), OGG (Firefox/Chrome)
- **Loading**: Preload all assets before game start
- **Playback**: Web Audio API or HTML5 Audio element
- **Autoplay Policy**: Require user interaction before playing sounds

## Sound Effects

### 1. Flap Sound (Jump Action)

**File Name**: `jump.wav`  
**Duration**: 0.1 seconds (100ms)  
**Type**: Short whoosh/wing flap

**Audio Characteristics**:
- **Frequency Range**: 800 Hz - 3000 Hz (mid-high range)
- **Attack**: Very fast (< 10ms) - immediate onset
- **Decay**: Quick (40ms) - rapid fade
- **Sustain**: None
- **Release**: Short (50ms) - clean cutoff
- **Volume**: Medium (70% of max)
- **Pitch**: Slightly rising (gives sense of upward motion)

**Sound Design**:
- **Base Sound**: Soft whoosh or air displacement
- **Character**: Light, airy, non-aggressive
- **Texture**: Smooth with slight turbulence
- **Harmonics**: Minimal - keep it clean and simple
- **Processing**: 
  - Light reverb (room size: small, decay: 0.2s)
  - High-pass filter at 600 Hz (remove low rumble)
  - Slight compression for consistency

**Waveform Profile**:
```
Amplitude
   │     ╱╲
   │    ╱  ╲___
   │   ╱       ╲___
   │  ╱            ╲___
   │ ╱                 ╲___
   └─────────────────────────► Time
   0ms  20ms  60ms    100ms
```

**Trigger**: 
- Player presses spacebar, clicks, or taps screen
- Only plays when game state is PLAYING
- Can overlap (multiple instances if player spams input)

**Implementation Notes**:
```javascript
// Clone audio for overlapping sounds
const jumpSound = audioManager.sounds['jump'].cloneNode();
jumpSound.volume = 0.7;
jumpSound.play();
```

---

### 2. Score Sound (Point Earned)

**File Name**: `score.wav`  
**Duration**: 0.2 seconds (200ms)  
**Type**: Pleasant chime/bell tone

**Audio Characteristics**:
- **Frequency Range**: 1000 Hz - 4000 Hz (bright, clear)
- **Base Pitch**: C6 (1046.5 Hz) or E6 (1318.5 Hz)
- **Attack**: Fast (5ms) - crisp onset
- **Decay**: Medium (80ms) - gentle fade
- **Sustain**: Brief (40ms) - holds slightly
- **Release**: Smooth (75ms) - natural decay
- **Volume**: Medium-high (80% of max)
- **Timbre**: Bell-like, crystalline

**Sound Design**:
- **Base Sound**: Pure sine wave or bell sample
- **Character**: Positive, rewarding, satisfying
- **Texture**: Clean and pure (minimal noise)
- **Harmonics**: 
  - Fundamental: 100%
  - 2nd harmonic: 40% (octave above)
  - 3rd harmonic: 20% (perfect fifth)
- **Processing**:
  - Medium reverb (room size: medium, decay: 0.5s)
  - Slight chorus for richness
  - Gentle compression

**Waveform Profile**:
```
Amplitude
   │    ╱╲
   │   ╱  ╲____
   │  ╱       ╲____
   │ ╱            ╲____
   │╱                  ╲____
   └──────────────────────────► Time
   0ms  40ms  120ms    200ms
```

**Trigger**:
- Ghost successfully passes through pipe gap
- Plays once per pipe (marked as scored to prevent repeats)
- Cannot overlap (only one score sound at a time)

**Implementation Notes**:
```javascript
// Stop previous score sound if playing
if (audioManager.currentScoreSound) {
  audioManager.currentScoreSound.pause();
  audioManager.currentScoreSound.currentTime = 0;
}
audioManager.currentScoreSound = audioManager.sounds['score'].cloneNode();
audioManager.currentScoreSound.volume = 0.8;
audioManager.currentScoreSound.play();
```

---

### 3. Collision Sound (Game Over)

**File Name**: `game_over.wav`  
**Duration**: 0.3 seconds (300ms)  
**Type**: Soft thud/impact

**Audio Characteristics**:
- **Frequency Range**: 200 Hz - 1500 Hz (low-mid range)
- **Attack**: Medium (20ms) - cushioned impact
- **Decay**: Long (150ms) - gradual fade
- **Sustain**: Brief (50ms) - slight hold
- **Release**: Smooth (80ms) - natural decay
- **Volume**: Medium (75% of max)
- **Timbre**: Muffled, soft, non-harsh

**Sound Design**:
- **Base Sound**: Soft drum hit or padded impact
- **Character**: Gentle, non-punishing, slightly sad
- **Texture**: Warm and rounded (no sharp edges)
- **Harmonics**: Minimal - mostly fundamental frequency
- **Processing**:
  - Heavy low-pass filter at 1500 Hz (remove harsh highs)
  - Medium reverb (room size: medium, decay: 0.8s)
  - Compression for smooth dynamics
  - Slight pitch bend down (gives "deflating" feel)

**Waveform Profile**:
```
Amplitude
   │      ╱╲
   │     ╱  ╲
   │    ╱    ╲____
   │   ╱          ╲____
   │  ╱                ╲____
   └────────────────────────────► Time
   0ms   50ms  150ms     300ms
```

**Trigger**:
- Collision detected (ghost hits pipe, ceiling, or ground)
- Plays once per collision
- Marks transition to GAME_OVER state
- Cannot be interrupted

**Implementation Notes**:
```javascript
// Play collision sound (no overlap needed)
const gameOverSound = audioManager.sounds['gameOver'];
gameOverSound.currentTime = 0; // Reset if already playing
gameOverSound.volume = 0.75;
gameOverSound.play();
```

---

## Optional/Future Sound Effects

### 4. Background Music (Optional)

**File Name**: `background_music.mp3` (or OGG)  
**Duration**: 60-120 seconds (looping)  
**Type**: Ambient, relaxing melody

**Audio Characteristics**:
- **Tempo**: 80-100 BPM (calm, not rushed)
- **Key**: Major key (C major, G major) for positive feel
- **Instrumentation**: Soft synths, light percussion, ambient pads
- **Volume**: Low (30-40% of max) - should not overpower SFX
- **Loop**: Seamless loop point for continuous play

**Trigger**:
- Starts when game state transitions to PLAYING
- Pauses when game is PAUSED
- Stops when game is GAME_OVER or MENU
- Fades in/out for smooth transitions (0.5s fade)

**Implementation Notes**:
```javascript
// Background music with looping
const bgMusic = new Audio('assets/background_music.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.3;
bgMusic.play();
```

---

### 5. Menu Hover Sound (Optional)

**File Name**: `menu_hover.wav`  
**Duration**: 0.05 seconds (50ms)  
**Type**: Subtle click/tick

**Audio Characteristics**:
- **Frequency**: 2000 Hz - 4000 Hz
- **Volume**: Very low (40% of max)
- **Character**: Subtle, non-intrusive

**Trigger**: Mouse hover over menu buttons (if menu UI is added)

---

### 6. Pause Sound (Optional)

**File Name**: `pause.wav`  
**Duration**: 0.15 seconds (150ms)  
**Type**: Soft beep or tone

**Audio Characteristics**:
- **Frequency**: 800 Hz
- **Volume**: Medium (60% of max)
- **Character**: Neutral, informative

**Trigger**: Game state transitions to PAUSED

---

## Audio Implementation

### Asset Loading

```javascript
class AudioManager {
  constructor(config) {
    this.sounds = {};
    this.muted = false;
    this.volume = config.audio.defaultVolume;
  }
  
  async preloadAssets() {
    const assets = [
      { name: 'jump', path: 'assets/jump.wav' },
      { name: 'score', path: 'assets/score.wav' },
      { name: 'gameOver', path: 'assets/game_over.wav' }
    ];
    
    const promises = assets.map(asset => this.loadSound(asset.name, asset.path));
    await Promise.all(promises);
  }
  
  loadSound(name, path) {
    return new Promise((resolve, reject) => {
      const audio = new Audio(path);
      audio.oncanplaythrough = () => {
        this.sounds[name] = audio;
        resolve();
      };
      audio.onerror = () => {
        console.warn(`Failed to load sound: ${path}`);
        resolve(); // Don't reject - game should work without audio
      };
      audio.src = path;
    });
  }
  
  playSound(name) {
    if (this.muted || !this.sounds[name]) return;
    
    const sound = this.sounds[name].cloneNode();
    sound.volume = this.volume;
    sound.play().catch(err => {
      console.warn('Audio playback failed:', err);
    });
  }
}
```

### Volume Control

```javascript
// Master volume control
audioManager.setVolume(0.8); // 80%

// Mute/unmute
audioManager.toggleMute();

// Individual sound volume (set during playback)
sound.volume = 0.5;
```

### Browser Autoplay Policy

```javascript
// Require user interaction before playing audio
document.addEventListener('click', () => {
  // Unlock audio context on first user interaction
  audioManager.unlockAudio();
}, { once: true });
```

---

## Sound Design Guidelines

### General Principles
1. **Clarity**: Each sound should be distinct and recognizable
2. **Brevity**: Keep sounds short to avoid overlap and fatigue
3. **Consistency**: Maintain similar timbral quality across all sounds
4. **Non-intrusive**: Sounds should enhance, not distract from gameplay
5. **Loopability**: Sounds should work well when triggered repeatedly

### Frequency Ranges
- **Low (200-800 Hz)**: Collision, impacts, negative events
- **Mid (800-2000 Hz)**: Flap, movement, neutral events
- **High (2000-4000 Hz)**: Score, success, positive events

### Volume Levels
- **Background Music**: 30-40% (if implemented)
- **Ambient Sounds**: 40-50%
- **Action Sounds (Flap)**: 60-70%
- **Feedback Sounds (Score)**: 70-80%
- **Event Sounds (Collision)**: 70-80%

### Processing Chain
1. **EQ**: Shape frequency content
2. **Compression**: Even out dynamics
3. **Reverb**: Add space and depth (subtle)
4. **Limiting**: Prevent clipping

---

## File Organization

```
assets/
├── jump.wav           # Flap sound (required)
├── score.wav          # Score sound (to be created)
├── game_over.wav      # Collision sound (required)
├── background_music.mp3  # Background music (optional)
├── menu_hover.wav     # Menu hover (optional)
└── pause.wav          # Pause sound (optional)
```

### Current Assets
- ✅ `jump.wav` - Located at `kiro-introduction-starter-kit/assets/jump.wav`
- ✅ `game_over.wav` - Located at `kiro-introduction-starter-kit/assets/game_over.wav`
- ❌ `score.wav` - **Needs to be created**

---

## Audio Creation Tools

### Recommended Software
- **Audacity** (Free, open-source) - Basic editing and effects
- **LMMS** (Free, open-source) - Sound synthesis and composition
- **Bfxr** (Free, web-based) - Retro game sound effects generator
- **ChipTone** (Free, web-based) - 8-bit style sound effects
- **FamiTracker** (Free) - NES-style chiptune sounds

### Online Resources
- **Freesound.org** - Creative Commons sound library
- **OpenGameArt.org** - Free game assets including audio
- **Zapsplat.com** - Free sound effects (attribution required)

### Synthesis Parameters (for creating score.wav)
```
Oscillator: Sine wave
Frequency: 1046.5 Hz (C6)
ADSR Envelope:
  - Attack: 5ms
  - Decay: 80ms
  - Sustain: 40ms at 60% level
  - Release: 75ms
Effects:
  - Reverb: Room size 50%, Decay 0.5s, Wet 30%
  - Chorus: Rate 2Hz, Depth 20%
Export: WAV, 44.1kHz, 16-bit, Mono
```

---

## Testing Checklist

- [ ] All sound files load without errors
- [ ] Sounds play at correct volume levels
- [ ] No audio clipping or distortion
- [ ] Sounds work on all target browsers (Chrome, Firefox, Safari, Edge)
- [ ] Autoplay policy handled correctly (requires user interaction)
- [ ] Mute functionality works correctly
- [ ] Volume control works correctly
- [ ] Sounds don't overlap inappropriately
- [ ] Audio doesn't cause performance issues
- [ ] Fallback behavior works when audio unavailable

---

## Performance Considerations

### File Size Optimization
- **WAV files**: Keep duration minimal (< 0.5s)
- **Compression**: Use MP3/OGG for longer sounds (background music)
- **Sample rate**: 44.1 kHz is sufficient (don't use 48 kHz or higher)
- **Bit depth**: 16-bit is sufficient (don't use 24-bit)
- **Channels**: Mono for sound effects (stereo only for music)

### Memory Management
- **Preload**: Load all sounds at game initialization
- **Cloning**: Clone audio nodes for overlapping sounds
- **Cleanup**: Remove audio elements when no longer needed
- **Pooling**: Consider audio object pooling for frequently played sounds

### Browser Compatibility
```javascript
// Check for audio support
const audioSupported = !!(window.Audio || window.webkitAudioContext);

// Fallback for unsupported browsers
if (!audioSupported) {
  console.warn('Audio not supported in this browser');
  // Game continues without audio
}
```

---

## References

- **Current Audio Files**: `kiro-introduction-starter-kit/assets/`
- **Config File**: `game-config.json` (audio section)
- **Design Document**: `.kiro/specs/flappy-kiro/design.md` (Audio Manager section)
- **Requirements**: `.kiro/specs/flappy-kiro/requirements.md` (Requirement 5)
