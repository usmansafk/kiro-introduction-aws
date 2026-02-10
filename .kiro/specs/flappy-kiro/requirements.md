# Requirements Document

## Introduction

Flappy Kiro is a retro browser-based endless scroller game where the player guides a ghost character through pipes. The game features classic Flappy Bird-style mechanics with a retro aesthetic, score tracking, and sound effects.

The game will be implemented in JavaScript using HTML5 Canvas for rendering.

## Glossary

- **Game**: The Flappy Kiro browser-based game system
- **Player**: The human user playing the game
- **Ghost**: The player-controlled character sprite (ghosty.png)
- **Pipe**: Green vertical obstacles that extend from the bottom of the screen with gaps for the Ghost to pass through
- **Pipe_Pair**: A set of two Pipes (top and bottom) with a gap between them
- **Jump**: The upward movement action triggered by player input (tap/click/spacebar)
- **Score**: The number of pipes successfully passed by the Ghost
- **High_Score**: The highest Score achieved across all game sessions
- **Game_State**: The current state of the Game (menu, playing, paused, game_over)
- **Collision**: When the Ghost intersects with a Pipe or screen boundary
- **Gravity**: The constant downward acceleration applied to the Ghost
- **Velocity**: The current speed and direction of the Ghost's vertical movement
- **Terminal_Velocity**: The maximum falling speed the Ghost can reach
- **Jump_Velocity**: The initial upward velocity applied when the Ghost jumps
- **Pipe_Spacing**: The horizontal distance between consecutive Pipe_Pairs
- **Gap_Size**: The vertical opening between the top and bottom Pipes in a Pipe_Pair
- **Pipe_Speed**: The horizontal velocity at which Pipes scroll from right to left
- **Hitbox**: The rectangular collision boundary used to detect intersections between game objects
- **Invincibility_Frames**: A brief period after game start where collisions are ignored to allow player preparation
- **Collision_Animation**: Visual feedback displayed when a collision occurs
- **Local_Storage**: Browser-based persistent storage for saving game data across sessions
- **Screen_Shake**: A visual effect that briefly offsets the camera/canvas position to simulate impact
- **Particle_Trail**: Visual particles that follow the Ghost's movement path
- **Score_Indicator**: A temporary visual element that appears when the Score increases
- **Background_Music**: Looping audio track that plays during gameplay

## Requirements

### Requirement 1: Ghost Character Control

**User Story:** As a player, I want to control a ghost character with simple tap/click/spacebar mechanics, so that I can navigate through the game.

#### Acceptance Criteria

1. WHEN the Player clicks, taps the screen, or presses the spacebar, THE Game SHALL make the Ghost jump upward
2. WHILE no input is received, THE Game SHALL apply gravity to the Ghost causing it to fall downward
3. WHEN the Ghost reaches the bottom screen boundary, THE Game SHALL trigger a collision event
4. WHEN the Ghost reaches the top screen boundary, THE Game SHALL trigger a collision event
5. THE Game SHALL render the Ghost using the sprite located at assets/ghosty.png

### Requirement 1.1: Physics System

**User Story:** As a player, I want the ghost to move with realistic physics, so that the game feels smooth and responsive.

#### Acceptance Criteria

1. THE Game SHALL define a constant Gravity value that accelerates the Ghost downward each frame
2. WHEN the Player triggers a jump, THE Game SHALL set the Ghost's Velocity to a negative Jump_Velocity value (upward direction)
3. THE Game SHALL apply Gravity to the Ghost's Velocity each frame, increasing downward speed
4. THE Game SHALL enforce a Terminal_Velocity limit, preventing the Ghost from falling faster than this maximum speed
5. THE Game SHALL enforce a maximum upward velocity limit, preventing the Ghost from ascending faster than this maximum speed
6. THE Game SHALL update the Ghost's position each frame by adding the current Velocity to its vertical position
7. THE Game SHALL use smooth movement interpolation to ensure consistent motion across different frame rates
8. THE Game SHALL preserve momentum, allowing the Ghost's velocity to change gradually rather than instantly (except on jump input)

### Requirement 2: Pipe Obstacle Generation

**User Story:** As a player, I want pipes to continuously appear as obstacles, so that the game provides an ongoing challenge.

#### Acceptance Criteria

1. WHILE the Game_State is playing, THE Game SHALL continuously generate new Pipe_Pairs at regular intervals
2. WHEN a Pipe_Pair is generated, THE Game SHALL create it with a random gap position for the Ghost to pass through
3. WHILE the Game_State is playing, THE Game SHALL scroll all Pipes from right to left at the current Pipe_Speed
4. WHEN a Pipe moves completely off the left side of the screen, THE Game SHALL remove it from the game
5. THE Game SHALL render Pipes as green vertical obstacles extending from the top and bottom of the screen

### Requirement 2.1: Detailed Obstacle Generation

**User Story:** As a player, I want obstacles with consistent spacing and difficulty progression, so that the game remains challenging and fair.

#### Acceptance Criteria

1. THE Game SHALL define a constant Pipe_Spacing value that determines the horizontal distance between consecutive Pipe_Pairs
2. WHEN generating a new Pipe_Pair, THE Game SHALL position it exactly Pipe_Spacing pixels from the previous Pipe_Pair
3. THE Game SHALL define a constant Gap_Size value that determines the vertical opening between top and bottom Pipes
4. WHEN generating a new Pipe_Pair, THE Game SHALL randomly position the gap's vertical center within a valid range that keeps the gap fully visible on screen
5. THE Game SHALL ensure the gap position allows the Ghost to pass through without requiring impossible maneuvers
6. THE Game SHALL define an initial Pipe_Speed value that determines how fast Pipes scroll horizontally
7. THE Game SHALL move all Pipes at the current Pipe_Speed each frame
8. WHEN the Score increases by a defined threshold, THE Game SHALL incrementally increase the Pipe_Speed to make the game progressively harder
9. THE Game SHALL enforce a maximum Pipe_Speed limit to maintain playability

### Requirement 3: Collision Detection

**User Story:** As a player, I want the game to detect when I hit obstacles, so that the game ends when I fail.

#### Acceptance Criteria

1. WHEN the Ghost intersects with any Pipe, THE Game SHALL detect a Collision
2. WHEN the Ghost intersects with the top or bottom screen boundary, THE Game SHALL detect a Collision
3. WHEN a Collision is detected, THE Game SHALL transition the Game_State to game_over
4. WHEN the Game_State transitions to game_over, THE Game SHALL play the sound effect located at assets/game_over.wav

### Requirement 3.1: Enhanced Collision Detection

**User Story:** As a player, I want precise and fair collision detection with visual feedback, so that I understand exactly when and why I failed.

#### Acceptance Criteria

1. THE Game SHALL define a Hitbox for the Ghost with specific width and height dimensions that represent the collidable area
2. THE Game SHALL define a Hitbox for each Pipe with specific width and height dimensions that represent the collidable area
3. THE Game SHALL position the Ghost's Hitbox to be slightly smaller than the visible sprite to provide forgiving collision detection
4. THE Game SHALL check for collision between the Ghost's Hitbox and each Pipe's Hitbox using rectangular intersection detection
5. THE Game SHALL define the ceiling boundary as the top edge of the game canvas (y = 0)
6. THE Game SHALL define the ground boundary as the bottom edge of the game canvas (y = canvas height)
7. WHEN the Ghost's Hitbox intersects with the ceiling boundary, THE Game SHALL detect a ceiling collision
8. WHEN the Ghost's Hitbox intersects with the ground boundary, THE Game SHALL detect a ground collision
9. WHEN the Ghost's Hitbox intersects with any Pipe's Hitbox, THE Game SHALL detect a wall collision
10. WHEN a collision is detected, THE Game SHALL trigger a Collision_Animation that provides visual feedback (such as a flash effect or color change)
11. WHEN the Game_State transitions to playing, THE Game SHALL activate Invincibility_Frames for a brief duration
12. WHILE Invincibility_Frames are active, THE Game SHALL ignore all collision detections to allow the player to prepare
13. WHEN Invincibility_Frames expire, THE Game SHALL resume normal collision detection
14. THE Game SHALL provide a visual indicator (such as a flashing effect) while Invincibility_Frames are active

### Requirement 4: Score Tracking

**User Story:** As a player, I want my score to be tracked and displayed, so that I can measure my performance.

#### Acceptance Criteria

1. WHEN the Ghost successfully passes through a Pipe gap, THE Game SHALL increment the Score by one
2. WHEN the Game_State is playing, THE Game SHALL display the current Score on screen
3. WHEN the Game_State is playing, THE Game SHALL display the High_Score on screen
4. WHEN the Game_State transitions to game_over, THE Game SHALL update the High_Score if the current Score exceeds it
5. WHEN a new game session starts, THE Game SHALL reset the Score to zero
6. THE Game SHALL persist the High_Score across game sessions using browser local storage

### Requirement 5: Sound Effects

**User Story:** As a player, I want audio feedback for my actions, so that the game feels more engaging.

#### Acceptance Criteria

1. WHEN the Player triggers a jump action, THE Game SHALL play the sound effect located at assets/jump.wav
2. WHEN a Collision is detected, THE Game SHALL play the sound effect located at assets/game_over.wav
3. THE Game SHALL load sound assets from the assets folder at game initialization

### Requirement 5.1: Enhanced Audio and Visual Feedback

**User Story:** As a player, I want rich audio and visual feedback for all game events, so that the game feels polished and responsive.

#### Acceptance Criteria

1. WHEN the Player triggers a jump action, THE Game SHALL play the flapping sound effect located at assets/jump.wav
2. WHEN the Score increments, THE Game SHALL play a scoring sound effect to provide audio feedback
3. WHEN a Collision is detected, THE Game SHALL play the collision sound effect located at assets/game_over.wav
4. THE Game SHALL include Background_Music that loops continuously during gameplay
5. WHEN the Game_State transitions to playing, THE Game SHALL start playing the Background_Music
6. WHEN the Game_State transitions to paused or game_over, THE Game SHALL pause or stop the Background_Music
7. THE Game SHALL provide volume controls or mute functionality for sound effects and Background_Music
8. WHEN a Collision is detected, THE Game SHALL trigger a Screen_Shake effect that briefly offsets the canvas position
9. THE Game SHALL define Screen_Shake parameters including shake intensity and duration
10. THE Game SHALL smoothly interpolate the Screen_Shake effect, gradually reducing intensity until it stops
11. WHILE the Game_State is playing, THE Game SHALL render a Particle_Trail that follows the Ghost's movement
12. THE Game SHALL generate particle effects behind the Ghost at regular intervals
13. THE Game SHALL animate particles with fading opacity and movement to create a trailing effect
14. WHEN the Score increments, THE Game SHALL display a Score_Indicator visual element at the location where the score was earned
15. THE Game SHALL animate the Score_Indicator with effects such as floating upward and fading out
16. THE Game SHALL render the Score_Indicator with text showing "+1" or similar score increment notation
17. THE Game SHALL remove Score_Indicator elements after their animation completes

### Requirement 6: Visual Presentation

**User Story:** As a player, I want a retro aesthetic with clear visual elements, so that the game is visually appealing and easy to understand.

#### Acceptance Criteria

1. THE Game SHALL render a light blue background
2. THE Game SHALL display the Score and High_Score at the bottom of the screen in the format "Score: X | High: Y"
3. THE Game SHALL use a retro aesthetic with simple graphics
4. WHEN rendering the game, THE Game SHALL maintain smooth animation at a consistent frame rate
5. THE Game SHALL render all visual elements in a browser canvas or equivalent rendering context

### Requirement 7: Game State Management

**User Story:** As a player, I want to start new games and see game over states, so that I can play multiple rounds.

#### Acceptance Criteria

1. WHEN the Game initializes, THE Game SHALL set the Game_State to menu
2. WHEN the Player provides input in the menu state, THE Game SHALL transition the Game_State to playing
3. WHEN the Game_State is playing, THE Game SHALL update all game elements each frame
4. WHEN a Collision occurs, THE Game SHALL transition the Game_State to game_over
5. WHEN the Game_State is game_over and the Player provides input, THE Game SHALL restart the game and transition to playing
6. WHEN restarting the game, THE Game SHALL reset the Score and clear all existing Pipes

### Requirement 7.1: Expanded Game State Management

**User Story:** As a player, I want comprehensive menu screens, pause functionality, and persistent scores, so that I have full control over my gaming experience.

#### Acceptance Criteria

1. WHEN the Game_State is menu, THE Game SHALL display a main menu screen with the game title "Flappy Kiro"
2. WHEN the Game_State is menu, THE Game SHALL display the current High_Score on the main menu screen
3. WHEN the Game_State is menu, THE Game SHALL display instructions to start the game (e.g., "Press SPACE or Click to Start")
4. WHEN the Game_State is menu and the Player provides input, THE Game SHALL transition to playing and initialize a new game session
5. WHEN the Game_State is playing, THE Game SHALL display the current Score in real-time as it updates
6. WHEN the Game_State is playing and the Player presses the Escape key or designated pause button, THE Game SHALL transition to paused
7. WHEN the Game_State is paused, THE Game SHALL freeze all game element updates (Ghost position, Pipe movement, physics)
8. WHEN the Game_State is paused, THE Game SHALL display a pause overlay with "PAUSED" text and resume instructions
9. WHEN the Game_State is paused and the Player provides input, THE Game SHALL transition back to playing and resume game updates
10. WHEN the Game_State transitions to game_over, THE Game SHALL display a game over screen with "GAME OVER" text
11. WHEN the Game_State is game_over, THE Game SHALL display the final Score achieved in the current session
12. WHEN the Game_State is game_over, THE Game SHALL display the High_Score
13. WHEN the Game_State is game_over, THE Game SHALL display restart instructions (e.g., "Press SPACE or Click to Restart")
14. WHEN the Game_State is game_over and the Player provides input, THE Game SHALL transition to playing and start a new game session
15. WHEN the Game initializes, THE Game SHALL load the High_Score from Local_Storage
16. WHEN a game session ends with a Score higher than the stored High_Score, THE Game SHALL save the new High_Score to Local_Storage
17. THE Game SHALL use the Local_Storage key "flappyKiroHighScore" to store and retrieve the High_Score value
18. WHEN Local_Storage is unavailable or empty, THE Game SHALL initialize the High_Score to zero

### Requirement 8: Browser Compatibility

**User Story:** As a player, I want to play the game in my web browser, so that I can access it easily without installation.

#### Acceptance Criteria

1. THE Game SHALL run in modern web browsers without requiring plugins
2. THE Game SHALL respond to both mouse clicks and touch inputs for mobile compatibility
3. THE Game SHALL load all assets (sprites and sounds) from the assets folder relative to the game HTML file
4. WHEN the game page loads, THE Game SHALL initialize and display the menu state
