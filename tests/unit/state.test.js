/**
 * Unit tests for StateManager
 */

import { StateManager, GameStates } from '../../js/state.js';
import GameConfig from '../../js/config.js';

describe('StateManager', () => {
  let stateManager;
  
  beforeEach(() => {
    stateManager = new StateManager();
  });
  
  describe('Initialization', () => {
    test('should initialize with MENU state', () => {
      expect(stateManager.currentState).toBe(GameStates.MENU);
    });
    
    test('should initialize with score of 0', () => {
      expect(stateManager.score).toBe(0);
    });
    
    test('should initialize with high score of 0', () => {
      expect(stateManager.highScore).toBe(0);
    });
    
    test('should initialize with 0 invincibility frames', () => {
      expect(stateManager.invincibilityFrames).toBe(0);
    });
    
    test('should load invincibility duration from config', () => {
      expect(stateManager.invincibilityDuration).toBe(GameConfig.collision.invincibilityDuration);
    });
  });
  
  describe('State Transitions', () => {
    test('should transition to PLAYING state', () => {
      stateManager.setState(GameStates.PLAYING);
      expect(stateManager.currentState).toBe(GameStates.PLAYING);
    });
    
    test('should transition to PAUSED state', () => {
      stateManager.setState(GameStates.PAUSED);
      expect(stateManager.currentState).toBe(GameStates.PAUSED);
    });
    
    test('should transition to GAME_OVER state', () => {
      stateManager.setState(GameStates.GAME_OVER);
      expect(stateManager.currentState).toBe(GameStates.GAME_OVER);
    });
    
    test('should transition back to MENU state', () => {
      stateManager.setState(GameStates.PLAYING);
      stateManager.setState(GameStates.MENU);
      expect(stateManager.currentState).toBe(GameStates.MENU);
    });
    
    test('should not transition to invalid state', () => {
      const originalState = stateManager.currentState;
      stateManager.setState('invalid_state');
      expect(stateManager.currentState).toBe(originalState);
    });
  });
  
  describe('State Query Methods', () => {
    test('isMenu() should return true when in MENU state', () => {
      stateManager.setState(GameStates.MENU);
      expect(stateManager.isMenu()).toBe(true);
      expect(stateManager.isPlaying()).toBe(false);
      expect(stateManager.isPaused()).toBe(false);
      expect(stateManager.isGameOver()).toBe(false);
    });
    
    test('isPlaying() should return true when in PLAYING state', () => {
      stateManager.setState(GameStates.PLAYING);
      expect(stateManager.isPlaying()).toBe(true);
      expect(stateManager.isMenu()).toBe(false);
      expect(stateManager.isPaused()).toBe(false);
      expect(stateManager.isGameOver()).toBe(false);
    });
    
    test('isPaused() should return true when in PAUSED state', () => {
      stateManager.setState(GameStates.PAUSED);
      expect(stateManager.isPaused()).toBe(true);
      expect(stateManager.isMenu()).toBe(false);
      expect(stateManager.isPlaying()).toBe(false);
      expect(stateManager.isGameOver()).toBe(false);
    });
    
    test('isGameOver() should return true when in GAME_OVER state', () => {
      stateManager.setState(GameStates.GAME_OVER);
      expect(stateManager.isGameOver()).toBe(true);
      expect(stateManager.isMenu()).toBe(false);
      expect(stateManager.isPlaying()).toBe(false);
      expect(stateManager.isPaused()).toBe(false);
    });
  });
  
  describe('Score Tracking', () => {
    test('incrementScore() should increase score by 1', () => {
      stateManager.incrementScore();
      expect(stateManager.score).toBe(1);
      stateManager.incrementScore();
      expect(stateManager.score).toBe(2);
    });
    
    test('incrementScore() should update high score when score exceeds it', () => {
      stateManager.incrementScore();
      expect(stateManager.highScore).toBe(1);
      stateManager.incrementScore();
      expect(stateManager.highScore).toBe(2);
    });
    
    test('incrementScore() should not decrease high score', () => {
      stateManager.highScore = 10;
      stateManager.incrementScore();
      expect(stateManager.highScore).toBe(10);
    });
    
    test('resetScore() should set score to 0', () => {
      stateManager.score = 5;
      stateManager.resetScore();
      expect(stateManager.score).toBe(0);
    });
    
    test('resetScore() should not affect high score', () => {
      stateManager.highScore = 10;
      stateManager.score = 5;
      stateManager.resetScore();
      expect(stateManager.highScore).toBe(10);
    });
  });
  
  describe('Invincibility System', () => {
    test('startInvincibility() should set invincibility frames to duration', () => {
      stateManager.startInvincibility();
      expect(stateManager.invincibilityFrames).toBe(stateManager.invincibilityDuration);
    });
    
    test('isInvincible() should return true when invincibility frames > 0', () => {
      stateManager.invincibilityFrames = 10;
      expect(stateManager.isInvincible()).toBe(true);
    });
    
    test('isInvincible() should return false when invincibility frames = 0', () => {
      stateManager.invincibilityFrames = 0;
      expect(stateManager.isInvincible()).toBe(false);
    });
    
    test('updateInvincibility() should decrement invincibility frames', () => {
      stateManager.invincibilityFrames = 10;
      stateManager.updateInvincibility();
      expect(stateManager.invincibilityFrames).toBe(9);
    });
    
    test('updateInvincibility() should not go below 0', () => {
      stateManager.invincibilityFrames = 0;
      stateManager.updateInvincibility();
      expect(stateManager.invincibilityFrames).toBe(0);
    });
    
    test('invincibility should expire after duration frames', () => {
      stateManager.startInvincibility();
      const duration = stateManager.invincibilityDuration;
      
      // Update for duration frames
      for (let i = 0; i < duration; i++) {
        expect(stateManager.isInvincible()).toBe(true);
        stateManager.updateInvincibility();
      }
      
      // Should no longer be invincible
      expect(stateManager.isInvincible()).toBe(false);
    });
  });
  
  describe('Custom Configuration', () => {
    test('should accept custom config in constructor', () => {
      const customConfig = {
        collision: {
          invincibilityDuration: 60
        }
      };
      const customStateManager = new StateManager(customConfig);
      expect(customStateManager.invincibilityDuration).toBe(60);
    });
  });
});
