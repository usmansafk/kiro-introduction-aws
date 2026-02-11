/**
 * StorageManager
 * Handles localStorage operations for persisting high scores
 * Requirements: 4.6, 7.1.15-7.1.18
 */

import GameConfig from './config.js';

class StorageManager {
  constructor(config = GameConfig) {
    this.config = config;
    this.storageKey = config.storage.highScoreKey;
    this.storageAvailable = this.checkStorageAvailability();
  }

  /**
   * Check if localStorage is available
   * @returns {boolean} True if localStorage is available
   */
  checkStorageAvailability() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Load high score from localStorage
   * @returns {number} High score value, or 0 if unavailable
   */
  loadHighScore() {
    if (!this.storageAvailable) {
      return 0;
    }

    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored === null) {
        return 0;
      }
      const score = parseInt(stored, 10);
      return isNaN(score) ? 0 : score;
    } catch (e) {
      console.warn('Failed to load high score:', e);
      return 0;
    }
  }

  /**
   * Save high score to localStorage
   * @param {number} score - Score to save
   * @returns {boolean} True if save was successful
   */
  saveHighScore(score) {
    if (!this.storageAvailable) {
      return false;
    }

    try {
      localStorage.setItem(this.storageKey, score.toString());
      return true;
    } catch (e) {
      console.warn('Failed to save high score:', e);
      return false;
    }
  }

  /**
   * Clear high score from localStorage
   * @returns {boolean} True if clear was successful
   */
  clearHighScore() {
    if (!this.storageAvailable) {
      return false;
    }

    try {
      localStorage.removeItem(this.storageKey);
      return true;
    } catch (e) {
      console.warn('Failed to clear high score:', e);
      return false;
    }
  }
}

export default StorageManager;
