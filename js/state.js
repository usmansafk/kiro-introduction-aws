/**
 * State Manager
 * Manages game state transitions and state-specific behavior
 */

import GameConfig from './config.js';

/**
 * Game state enumeration
 */
export const GameStates = {
  MENU: 'menu',
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAME_OVER: 'game_over'
};

/**
 * StateManager class
 * Tracks game state, score, high score, and invincibility frames
 */
export class StateManager {
  /**
   * Create a new StateManager
   * @param {Object} config - Game configuration object (defaults to GameConfig)
   */
  constructor(config = GameConfig) {
    this.config = config;
    this.currentState = GameStates.MENU;
    this.score = 0;
    this.highScore = 0;
    this.invincibilityFrames = 0;
    this.invincibilityDuration = config.collision.invincibilityDuration;
  }
  
  /**
   * Transition to a new game state
   * @param {string} newState - The new state to transition to (from GameStates enum)
   */
  setState(newState) {
    // Validate that the new state is a valid GameState
    if (!Object.values(GameStates).includes(newState)) {
      console.warn(`Invalid state: ${newState}`);
      return;
    }
    
    this.currentState = newState;
  }
  
  /**
   * Check if the game is currently in the playing state
   * @returns {boolean} True if game is playing
   */
  isPlaying() {
    return this.currentState === GameStates.PLAYING;
  }
  
  /**
   * Check if the game is currently in the paused state
   * @returns {boolean} True if game is paused
   */
  isPaused() {
    return this.currentState === GameStates.PAUSED;
  }
  
  /**
   * Check if the game is currently in the game over state
   * @returns {boolean} True if game is over
   */
  isGameOver() {
    return this.currentState === GameStates.GAME_OVER;
  }
  
  /**
   * Check if the game is currently in the menu state
   * @returns {boolean} True if game is in menu
   */
  isMenu() {
    return this.currentState === GameStates.MENU;
  }
  
  /**
   * Increment the score by one and update high score if necessary
   */
  incrementScore() {
    this.score++;
    if (this.score > this.highScore) {
      this.highScore = this.score;
    }
  }
  
  /**
   * Reset the score to zero
   */
  resetScore() {
    this.score = 0;
  }
  
  /**
   * Start invincibility period
   * Sets invincibility frames to the configured duration
   */
  startInvincibility() {
    this.invincibilityFrames = this.invincibilityDuration;
  }
  
  /**
   * Update invincibility frames
   * Decrements the invincibility frame counter each frame
   */
  updateInvincibility() {
    if (this.invincibilityFrames > 0) {
      this.invincibilityFrames--;
    }
  }
  
  /**
   * Check if the player is currently invincible
   * @returns {boolean} True if invincibility frames are active
   */
  isInvincible() {
    return this.invincibilityFrames > 0;
  }
}

export default StateManager;
