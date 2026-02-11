# Implementation Plan: Flappy Kiro

## Overview

This implementation plan builds a browser-based Flappy Bird clone using vanilla JavaScript and HTML5 Canvas. The game targets 120 FPS with smooth physics, precise collision detection, and polished visual/audio feedback. Implementation follows a phased approach: core systems first, then gameplay mechanics, then polish and optimization.

**Technology Stack**: Vanilla JavaScript (ES6+), HTML5 Canvas, Web Audio API, LocalStorage

**Key Features**: Ghost character with circular collision, pipe obstacles, physics system with gravity/jump mechanics, particle effects, screen shake, score tracking with persistence, state management (menu/playing/paused/game_over), object pooling for performance.

## Tasks

- [x] 1. Project setup and configuration
  - Create project directory structure (js/, assets/, tests/)
  - Create index.html with canvas element (400x600px)
  - Create styles.css with minimal styling (centered canvas, retro aesthetic)
  - Create config.js with all game constants (physics, dimensions, colors, paths)
  - Set up ES6 module structure with proper imports/exports
  - _Requirements: 8.1, 8.3_

- [ ] 2. Core game loop and initialization
  - [x] 2.1 Create main.js entry point
    - Initialize canvas and 2D context
    - Create Game instance and start game loop
    - Handle window load event
    - _Requirements: 8.4_
  
  - [x] 2.2 Implement Game class (game.js)
    - Constructor: initialize canvas, context, config, subsystems
    - init() method: load assets, set up event listeners, initialize state
    - gameLoop(timestamp) method: calculate delta time, update, render, request next frame
    - Delta time normalization for 120 FPS target
    - Frame time clamping to prevent large jumps
    - _Requirements: 6.4, 7.1_
  
  - [x] 2.3 Create StateManager class (state.js)
    - Define GameStates enum (MENU, PLAYING, PAUSED, GAME_OVER)
    - Implement state transition methods
    - Track score, high score, invincibility frames
    - State query methods (isPlaying, isPaused, isGameOver, isMenu)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.1.1, 7.1.5, 7.1.6, 7.1.10_

- [ ] 3. Ghost entity and physics system
  - [x] 3.1 Implement Ghost class (entities/ghost.js)
    - Constructor: initialize position, velocity, dimensions, hitbox from config
    - getHitbox() method: return collision bounds with offsets
    - jump(jumpVelocity) method: set velocity to jump value
    - update(deltaTime, gravity, terminalVelocity, maxUpwardVelocity) method
    - reset(x, y) method: reset to initial state
    - Rotation calculation for visual tilt effect
    - _Requirements: 1.1, 1.3, 1.4, 1.5, 1.1.2, 1.1.6_
  
  - [x] 3.2 Write property test for Ghost physics
    - **Property 1: Jump input sets upward velocity**
    - **Property 2: Gravity continuously accelerates ghost downward**
    - **Property 3: Terminal velocity limits falling speed**
    - **Property 4: Maximum upward velocity limits ascending speed**
    - **Property 5: Position updates by velocity integration**
    - **Validates: Requirements 1.1.2, 1.2, 1.1.3, 1.1.4, 1.1.5, 1.1.6**
  
  - [x] 3.3 Implement PhysicsEngine class (systems/physics.js)
    - Constructor: load physics constants from config
    - applyGravity(entity, deltaTime) method
    - updatePosition(entity, deltaTime) method
    - generateGapPosition() method: random gap Y within valid range
    - increaseDifficulty(score) method: increase pipe speed at thresholds
    - resetDifficulty() method: reset to base speed
    - _Requirements: 1.2, 1.1.1, 1.1.3, 1.1.4, 1.1.5, 2.1.4, 2.1.8, 2.1.9_
  
  - [ ] 3.4 Write property test for PhysicsEngine
    - **Property 6: Frame-rate independence through delta time**
    - **Property 10: Gap positions are within valid range**
    - **Property 11: Difficulty increases at score thresholds**
    - **Property 12: Pipe speed never exceeds maximum**
    - **Validates: Requirements 1.1.7, 2.1.4, 2.1.5, 2.1.8, 2.1.9**

- [ ] 4. Pipe obstacles and generation
  - [x] 4.1 Implement Pipe class (entities/pipe.js)
    - Constructor: initialize position, gap, dimensions from config
    - Calculate top and bottom pipe heights
    - getTopHitbox() and getBottomHitbox() methods
    - update(deltaTime, speed) method: move pipe left
    - isOffScreen() method: check if pipe is past left edge
    - hasPassedGhost(ghostX) method: check if ghost passed pipe
    - markScored() method: mark pipe as scored
    - reset(x, gapY, gapSize) method: reset for object pooling
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.1.1, 2.1.2, 2.1.3, 2.1.7_
  
  - [ ] 4.2 Write property test for Pipe movement
    - **Property 7: Pipes move at current speed**
    - **Property 8: Off-screen pipes are removed**
    - **Property 9: Pipes are spaced correctly**
    - **Validates: Requirements 2.3, 2.4, 2.1.2, 2.1.7**
  
  - [x] 4.3 Implement pipe generation in Game class
    - generatePipes() method: spawn new pipes at correct spacing
    - updatePipes(deltaTime) method: move pipes, check scoring, remove off-screen
    - Track last pipe position for spacing calculation
    - _Requirements: 2.1, 2.2, 2.1.2_
  
  - [ ] 4.4 Write unit tests for pipe generation
    - Test pipe spawning at correct intervals
    - Test pipe removal when off-screen
    - Test gap position randomization
    - _Requirements: 2.1, 2.2, 2.4_

- [ ] 5. Checkpoint - Core systems functional
  - Ensure ghost moves with physics, pipes generate and scroll
  - Verify delta time normalization works correctly
  - Test state transitions (menu → playing)
  - Ask user if questions arise

- [ ] 6. Collision detection system
  - [x] 6.1 Implement CollisionSystem class (systems/collision.js)
    - getGhostCircle(ghost) method: calculate circular collision bounds
    - checkCircleRectIntersection(circle, rect) method: circle-rectangle collision
    - checkRectIntersection(rect1, rect2) method: rectangular collision fallback
    - checkGhostPipeCollision(ghost, pipe) method: test ghost vs pipe
    - checkGhostBoundaryCollision(ghost, canvasHeight) method: test ceiling/ground
    - checkAllCollisions(ghost, pipes, canvasHeight, isInvincible) method: master check
    - checkNearbyCollisions() method: optimized spatial partitioning version
    - debugDrawCollisionBounds(ctx, ghost, pipes) method: visual debugging
    - _Requirements: 3.1, 3.2, 3.1.1, 3.1.2, 3.1.3, 3.1.4, 3.1.5, 3.1.6, 3.1.7, 3.1.8, 3.1.9_
  
  - [ ] 6.2 Write property tests for collision detection
    - **Property 13: Rectangular intersection detects overlapping hitboxes**
    - **Property 14: Ghost-pipe collision detected when hitboxes intersect**
    - **Property 15: Ceiling boundary collision detected**
    - **Property 16: Ground boundary collision detected**
    - **Validates: Requirements 3.1.4, 3.1, 3.1.9, 1.4, 3.2, 3.1.7, 1.3, 3.2, 3.1.8**
  
  - [x] 6.3 Integrate collision detection into game loop
    - checkCollisions() method in Game class
    - Call collision system with current entities
    - Handle collision result (trigger game over)
    - Respect invincibility frames
    - _Requirements: 3.1, 3.2, 3.3, 3.1.12_
  
  - [ ] 6.4 Write property tests for collision integration
    - **Property 17: Collision triggers game over state**
    - **Property 18: Invincibility prevents collision detection**
    - **Property 19: Invincibility expires after duration**
    - **Validates: Requirements 3.3, 7.4, 3.1.12, 3.1.13**

- [ ] 7. Score tracking and persistence
  - [x] 7.1 Implement score tracking in StateManager
    - incrementScore() method: increase score by 1
    - resetScore() method: set score to 0
    - Update high score when score exceeds it
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  
  - [x] 7.2 Implement StorageManager class (storage.js)
    - loadHighScore() method: read from localStorage with error handling
    - saveHighScore(score) method: write to localStorage with error handling
    - clearHighScore() method: remove from localStorage
    - Use key "flappyKiroHighScore" from config
    - Handle localStorage unavailable gracefully (return 0)
    - _Requirements: 4.6, 7.1.15, 7.1.16, 7.1.17, 7.1.18_
  
  - [ ] 7.3 Write property tests for score tracking
    - **Property 20: Score increments when passing pipes**
    - **Property 21: High score updates when current score exceeds it**
    - **Property 22: Score resets to zero on new game**
    - **Property 23: High score persistence round-trip**
    - **Property 24: Local storage fallback to zero**
    - **Validates: Requirements 4.1, 4.4, 7.1.16, 4.5, 4.6, 7.1.18**
  
  - [x] 7.4 Integrate score tracking into game loop
    - Check if ghost passed pipe in updatePipes()
    - Increment score and mark pipe as scored
    - Trigger difficulty increase
    - Load high score on game init
    - Save high score on game over
    - _Requirements: 4.1, 4.4, 2.1.8_

- [ ] 8. Input handling system
  - [x] 8.1 Implement InputHandler class (input.js)
    - Constructor: set up event listeners for keyboard, mouse, touch
    - handleJumpOrStart() method: trigger jump or start based on state
    - handlePause() method: toggle pause state
    - onJump(callback) method: register jump callback
    - onPause(callback) method: register pause callback
    - Prevent default behavior for spacebar (no page scroll)
    - _Requirements: 1.1, 7.2, 7.5, 7.1.4, 7.1.6, 7.1.9, 7.1.14, 8.2_
  
  - [x] 8.2 Integrate input handling into Game class
    - Wire input callbacks to game methods
    - handleInput() method: route input based on current state
    - startGame() method: transition to playing, reset entities, start invincibility
    - jump() method: apply jump velocity to ghost
    - restartGame() method: reset and start new session
    - handlePauseInput() method: toggle pause state
    - _Requirements: 1.1, 7.2, 7.5, 7.1.6, 7.1.9_
  
  - [ ] 8.3 Write property tests for input handling
    - **Property 25: Menu to playing transition on input**
    - **Property 26: Game over to playing transition restarts game**
    - **Property 27: Playing to paused transition freezes updates**
    - **Property 28: Paused to playing transition resumes updates**
    - **Property 39: Jump input triggers velocity change**
    - **Property 40: Multiple input types trigger same action**
    - **Validates: Requirements 7.2, 7.1.4, 7.5, 7.1.14, 7.6, 7.1.6, 7.1.7, 7.1.9, 1.1, 8.2**

- [ ] 9. Checkpoint - Core gameplay complete
  - Verify full gameplay loop works (menu → playing → collision → game over → restart)
  - Test all input methods (keyboard, mouse, touch simulation)
  - Verify score tracking and high score persistence
  - Test collision detection accuracy
  - Ask user if questions arise

- [ ] 10. Rendering system
  - [x] 10.1 Implement Renderer class (systems/renderer.js)
    - Constructor: initialize context, canvas, colors from config
    - clear() method: fill background color
    - renderGhost(ghost) method: draw sprite with rotation
    - renderPipe(pipe) method: draw top/bottom pipes with caps
    - renderScore(score, highScore) method: draw score text at bottom
    - renderMenu(highScore) method: draw title, high score, instructions
    - renderPauseOverlay() method: draw semi-transparent overlay with text
    - renderGameOver(score, highScore) method: draw game over screen
    - applyScreenShake(offset) method: translate context for shake effect
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 7.1.1, 7.1.2, 7.1.3, 7.1.8, 7.1.10, 7.1.11, 7.1.12, 7.1.13_
  
  - [x] 10.2 Implement render phase in Game class
    - render() method: orchestrate all rendering
    - renderPlaying() method: render game entities and UI
    - Apply screen shake offset before rendering
    - Render based on current state (menu, playing, paused, game_over)
    - _Requirements: 6.4, 6.5, 7.1.1, 7.1.8, 7.1.10_
  
  - [ ] 10.3 Write unit tests for rendering
    - Test menu screen displays correct elements
    - Test game over screen shows final score
    - Test pause overlay appears correctly
    - Test score display format
    - _Requirements: 6.2, 7.1.1, 7.1.8, 7.1.10_

- [ ] 11. Audio system
  - [x] 11.1 Implement AudioManager class (systems/audio.js)
    - Constructor: initialize sounds object, muted flag, volume
    - loadSound(name, path) method: create Audio element
    - playSound(name) method: clone and play sound with error handling
    - setVolume(volume) method: update volume for all sounds
    - toggleMute() method: toggle muted flag
    - preloadAssets() method: load jump.wav and game_over.wav
    - _Requirements: 5.1, 5.2, 5.3, 5.1.1, 5.1.3, 5.1.7_
  
  - [ ] 11.2 Integrate audio into game events
    - Play jump sound on jump input
    - Play game over sound on collision
    - Handle autoplay policy (require user interaction)
    - Add error handling for audio playback failures
    - _Requirements: 5.1, 5.2, 5.3, 5.1.1, 5.1.3_
  
  - [ ] 11.3 Write unit tests for audio system
    - Test sound loading from correct paths
    - Test mute functionality
    - Test volume control
    - Test error handling for missing files
    - _Requirements: 5.3, 5.1.7_

- [ ] 12. Visual effects - Particles
  - [ ] 12.1 Implement Particle class (entities/particle.js)
    - Constructor: initialize position, velocity, life, size, color
    - update(deltaTime) method: update position and fade life
    - isDead() method: check if life <= 0
    - reset(x, y) method: reset for object pooling
    - _Requirements: 5.1.11, 5.1.12, 5.1.13_
  
  - [ ] 12.2 Implement ParticlePool class
    - Constructor: pre-allocate particle objects
    - spawn(x, y) method: get particle from pool or create new
    - update(deltaTime) method: update all active particles
    - recycle(particle) method: return particle to pool
    - clear() method: return all particles to pool
    - _Requirements: 5.1.11, 5.1.17_
  
  - [ ] 12.3 Integrate particles into game loop
    - Generate particles near ghost during gameplay
    - Update particles each frame
    - Remove dead particles
    - Render particles behind ghost
    - Enforce maximum particle count from config
    - _Requirements: 5.1.11, 5.1.12, 5.1.13, 5.1.17_
  
  - [ ] 12.4 Write property tests for particle system
    - **Property 33: Particles are generated during gameplay**
    - **Property 34: Particles fade and die**
    - **Property 35: Dead particles are removed**
    - **Validates: Requirements 5.1.11, 5.1.12, 5.1.13, 5.1.17**

- [ ] 13. Visual effects - Score indicators
  - [ ] 13.1 Implement ScoreIndicator class (entities/particle.js)
    - Constructor: initialize position, value, life, decay, upward velocity
    - update(deltaTime) method: float upward and fade
    - isDead() method: check if life <= 0
    - reset(x, y, value) method: reset for object pooling
    - _Requirements: 5.1.14, 5.1.15, 5.1.16_
  
  - [ ] 13.2 Integrate score indicators into game loop
    - Create indicator when score increments
    - Update indicators each frame
    - Remove dead indicators
    - Render indicators with fading opacity
    - _Requirements: 5.1.14, 5.1.15, 5.1.16, 5.1.17_
  
  - [ ] 13.3 Write property tests for score indicators
    - **Property 36: Score indicators created on score increment**
    - **Property 37: Score indicators float upward and fade**
    - **Property 38: Dead score indicators are removed**
    - **Validates: Requirements 5.1.14, 5.1.15, 5.1.17**

- [ ] 14. Visual effects - Screen shake
  - [ ] 14.1 Implement screen shake in CollisionSystem
    - triggerScreenShake(intensity, duration) method: activate shake
    - updateScreenShake() method: update shake offset with decay
    - getScreenShakeOffset() method: return current offset
    - Smooth interpolation with decreasing intensity
    - _Requirements: 5.1.8, 5.1.9, 5.1.10_
  
  - [ ] 14.2 Integrate screen shake into rendering
    - Apply shake offset before rendering
    - Trigger shake on collision
    - Update shake each frame
    - _Requirements: 5.1.8, 5.1.10_
  
  - [ ] 14.3 Write property tests for screen shake
    - **Property 31: Screen shake activates on collision**
    - **Property 32: Screen shake intensity decreases over time**
    - **Validates: Requirements 5.1.8, 5.1.10**

- [ ] 15. Invincibility system
  - [ ] 15.1 Implement invincibility in StateManager
    - startInvincibility() method: set invincibility frames
    - updateInvincibility() method: decrement frames
    - isInvincible() method: check if frames > 0
    - _Requirements: 3.1.11, 3.1.12, 3.1.13_
  
  - [ ] 15.2 Implement invincibility indicator in Renderer
    - renderInvincibilityIndicator(ghost) method: flash effect
    - Draw golden border around ghost hitbox
    - Flash on/off based on frame count
    - _Requirements: 3.1.14_
  
  - [ ] 15.3 Integrate invincibility into game flow
    - Start invincibility when transitioning to playing
    - Update invincibility frames each frame
    - Pass invincibility state to collision detection
    - Render indicator during invincibility
    - _Requirements: 3.1.11, 3.1.12, 3.1.13, 3.1.14_
  
  - [ ] 15.4 Write property test for invincibility
    - **Property 30: Invincibility activates on game start**
    - **Validates: Requirements 3.1.11**

- [ ] 16. Checkpoint - All features implemented
  - Verify all visual effects work (particles, screen shake, score indicators)
  - Test audio plays correctly for all events
  - Verify invincibility period works as expected
  - Test complete game flow from start to finish
  - Ask user if questions arise

- [ ] 17. Performance optimization - Object pooling
  - [ ] 17.1 Implement PipePool class
    - Constructor: pre-allocate pipe objects
    - spawn(x, gapY, gapSize) method: get pipe from pool
    - update(deltaTime, speed) method: update all active pipes
    - recycle(pipe) method: return pipe to pool
    - clear() method: return all pipes to pool
    - getActivePipes() method: return active pipes array
  
  - [ ] 17.2 Replace pipe array with PipePool in Game class
    - Initialize PipePool in constructor
    - Use pool for pipe generation
    - Use pool for pipe updates
    - Clear pool on game reset
  
  - [ ] 17.3 Implement ScoreIndicatorPool class
    - Similar structure to ParticlePool
    - Pre-allocate score indicator objects
    - Spawn, update, recycle methods
  
  - [ ] 17.4 Replace score indicator array with pool
    - Initialize pool in constructor
    - Use pool for indicator creation
    - Use pool for updates
    - Clear pool on game reset

- [ ] 18. Performance optimization - Rendering
  - [ ] 18.1 Implement sprite batching in Renderer
    - renderPipes(pipes) method: batch all pipes with minimal state changes
    - renderParticles(particles) method: batch all particles
    - renderScoreIndicators(indicators) method: batch all indicators
    - Set fill style once per batch instead of per entity
  
  - [ ] 18.2 Implement background pre-rendering
    - Create off-screen canvas for static background
    - prerenderBackground() method: draw background once
    - Use drawImage() in clear() instead of fillRect()
  
  - [ ] 18.3 Optimize collision detection
    - Implement spatial partitioning in checkNearbyCollisions()
    - Only check pipes within collision range of ghost
    - Early exit on first collision found
    - Cache hitbox calculations when possible

- [ ] 19. Performance optimization - Monitoring
  - [ ] 19.1 Implement PerformanceMonitor class
    - Track frame count and FPS
    - Track frame times for analysis
    - Calculate average and max frame times
    - diagnosePerformance() method: log performance metrics
    - Warn when FPS drops below 100
  
  - [ ] 19.2 Integrate performance monitoring
    - Create PerformanceMonitor in Game constructor
    - Update monitor each frame
    - Expose FPS to debug UI (optional)
    - Log performance warnings to console
  
  - [ ] 19.3 Add entity limit enforcement
    - enforceEntityLimits() method in Game class
    - Limit particles to maxActive from config
    - Limit score indicators to reasonable count
    - Remove oldest entities when limit exceeded

- [ ] 20. Asset loading and error handling
  - [ ] 20.1 Implement AssetLoader class
    - loadImage(name, path) method: load with promise
    - loadSound(name, path) method: load with promise
    - loadAll(assetManifest) method: load all assets in parallel
    - getProgress() method: return loading progress (0-1)
    - createFallbackImage() method: colored rectangle for missing sprites
  
  - [ ] 20.2 Integrate asset loading into Game.init()
    - Create asset manifest with all image/sound paths
    - Load all assets before starting game
    - Show loading progress (optional)
    - Handle missing assets gracefully with fallbacks
    - _Requirements: 5.3, 8.3_
  
  - [ ] 20.3 Add error handling throughout
    - Wrap audio playback in try-catch
    - Handle localStorage errors gracefully
    - Handle canvas context errors
    - Log errors to console without crashing game
    - _Requirements: 8.1_

- [ ] 21. State management polish
  - [ ] 21.1 Implement complete state transitions
    - Ensure all state transitions work correctly
    - Add transition callbacks for cleanup/setup
    - Reset entities on state transitions
    - Clear effects on state transitions
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_
  
  - [ ] 21.2 Implement pause functionality
    - Freeze all entity updates when paused
    - Continue rendering paused state
    - Show pause overlay
    - Resume on input
    - _Requirements: 7.1.6, 7.1.7, 7.1.8, 7.1.9_
  
  - [ ] 21.3 Write property tests for state management
    - **Property 29: Playing state updates all entities**
    - **Validates: Requirements 7.3**

- [ ] 22. Final integration and wiring
  - [x] 22.1 Wire all systems together in Game class
    - Connect input handler to game methods
    - Connect state manager to all subsystems
    - Connect audio manager to game events
    - Connect renderer to all entities
    - Ensure proper initialization order
  
  - [ ] 22.2 Implement game reset functionality
    - reset() method: clear all entities, reset state, reset physics
    - Clear all object pools
    - Reset score to 0
    - Load high score from storage
    - Return to menu state
    - _Requirements: 7.6_
  
  - [ ] 22.3 Implement cleanup functionality
    - cleanup() method: remove event listeners, clear canvas
    - Nullify references to prevent memory leaks
    - Clear all pools
    - Stop game loop (if needed)

- [ ] 23. Testing and validation
  - [ ] 23.1 Run all property-based tests
    - Execute all property tests with 100 iterations minimum
    - Verify all properties pass
    - Fix any failing properties
  
  - [ ] 23.2 Run all unit tests
    - Execute all unit tests
    - Verify edge cases are handled
    - Verify error conditions are handled
    - Fix any failing tests
  
  - [ ] 23.3 Integration testing
    - Test complete game flow from start to finish
    - Test all input methods (keyboard, mouse, touch)
    - Test state transitions
    - Test score persistence across sessions
    - Test error handling (missing assets, localStorage disabled)

- [ ] 24. Browser compatibility and polish
  - [ ] 24.1 Test on multiple browsers
    - Test on Chrome (latest)
    - Test on Firefox (latest)
    - Test on Safari (latest)
    - Test on Edge (latest)
    - Fix any browser-specific issues
    - _Requirements: 8.1, 8.2_
  
  - [ ] 24.2 Mobile device testing
    - Test touch controls on mobile devices
    - Test on iOS Safari
    - Test on Chrome Mobile (Android)
    - Verify responsive canvas sizing
    - Test performance on mobile devices
    - _Requirements: 8.2_
  
  - [ ] 24.3 Accessibility improvements
    - Ensure keyboard-only controls work
    - Verify game is playable without audio
    - Check color contrast for visibility
    - Add ARIA labels where appropriate
    - Test with screen reader (basic support)

- [ ] 25. Final checkpoint - Production ready
  - Verify 120 FPS on capable hardware
  - Verify graceful degradation to 60 FPS on lower-end devices
  - Test memory usage over extended play sessions
  - Verify no memory leaks
  - Test asset loading on slow connections
  - Verify all requirements are met
  - Ask user if ready for deployment

## Notes

- Tasks marked with `*` are optional testing tasks that can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties across randomized inputs
- Unit tests validate specific examples, edge cases, and error conditions
- Checkpoints ensure incremental validation and provide opportunities for user feedback
- Object pooling is critical for maintaining 120 FPS target
- All code should use ES6+ features (modules, classes, arrow functions, const/let)
- Configuration is centralized in config.js for easy tuning
- Error handling is defensive - game should never crash, only log warnings
