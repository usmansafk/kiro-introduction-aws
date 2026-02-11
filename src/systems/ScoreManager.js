/**
 * ScoreManager Class
 * 
 * Manages score tracking, high score persistence, and display formatting for Flappy Kiro.
 * Handles localStorage operations with graceful fallback for unavailable storage.
 * 
 * Features:
 * - Current session score tracking
 * - High score persistence via localStorage
 * - Score increment with validation
 * - Display formatting utilities
 * - Statistics tracking (optional)
 * - Error handling for storage failures
 * 
 * Design Principles:
 * - Single responsibility (score management only)
 * - Graceful degradation (works without localStorage)
 * - Immutable high score updates (validate before save)
 * - Clear separation of data and presentation
 */

class ScoreManager {
  /**
   * Create a new ScoreManager instance
   * @param {Object} config - Game configuration object
   */
  constructor(config) {
    this.config = config;
    
    // Current session score
    this.currentScore = 0;
    
    // High score (all-time best)
    this.highScore = 0;
    
    // Storage configuration
    this.storageKey = config.storage?.highScoreKey || 'flappyKiroHighScore';
    this.storageAvailable = this.checkStorageAvailability();
    
    // Statistics (optional tracking)
    this.stats = {
      totalGames: 0,
      totalScore: 0,
      averageScore: 0,
      gamesThisSession: 0
    };
    
    // Load saved high score
    this.loadHighScore();
    
    console.log('ScoreManager initialized');
  }
  
  // ==================== Storage Availability ====================
  
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
    } catch (err) {
      console.warn('localStorage not available:', err);
      return false;
    }
  }
  
  // ==================== High Score Persistence ====================
  
  /**
   * Load high score from localStorage
   * @returns {number} Loaded high score (0 if unavailable)
   */
  loadHighScore() {
    if (!this.storageAvailable) {
      console.warn('Storage unavailable, high score will not persist');
      this.highScore = 0;
      return 0;
    }
    
    try {
      const stored = localStorage.getItem(this.storageKey);
      
      if (stored === null) {
        this.highScore = 0;
        console.log('No saved high score found');
        return 0;
      }
      
      // Parse and validate
      const parsed = parseInt(stored, 10);
      
      if (isNaN(parsed) || parsed < 0) {
        console.warn('Invalid high score in storage, resetting to 0');
        this.highScore = 0;
        return 0;
      }
      
      this.highScore = parsed;
      console.log(`High score loaded: ${this.highScore}`);
      return this.highScore;
      
    } catch (err) {
      console.error('Failed to load high score:', err);
      this.highScore = 0;
      return 0;
    }
  }
  
  /**
   * Save high score to localStorage
   * @returns {boolean} True if save succeeded
   */
  saveHighScore() {
    if (!this.storageAvailable) {
      console.warn('Storage unavailable, cannot save high score');
      return false;
    }
    
    try {
      localStorage.setItem(this.storageKey, this.highScore.toString());
      console.log(`High score saved: ${this.highScore}`);
      return true;
    } catch (err) {
      console.error('Failed to save high score:', err);
      
      // Handle quota exceeded error
      if (err.name === 'QuotaExceededError') {
        console.warn('Storage quota exceeded');
      }
      
      return false;
    }
  }
  
  /**
   * Clear high score from localStorage
   * @returns {boolean} True if clear succeeded
   */
  clearHighScore() {
    if (!this.storageAvailable) {
      console.warn('Storage unavailable, cannot clear high score');
      return false;
    }
    
    try {
      localStorage.removeItem(this.storageKey);
      this.highScore = 0;
      console.log('High score cleared');
      return true;
    } catch (err) {
      console.error('Failed to clear high score:', err);
      return false;
    }
  }
  
  // ==================== Score Tracking ====================
  
  /**
   * Reset current score to zero (start new game)
   */
  resetScore() {
    this.currentScore = 0;
    console.log('Score reset to 0');
  }
  
  /**
   * Increment current score by specified amount
   * @param {number} amount - Amount to increment (default: 1)
   * @returns {number} New current score
   */
  incrementScore(amount = 1) {
    // Validate amount
    if (typeof amount !== 'number' || amount < 0 || !isFinite(amount)) {
      console.warn('Invalid score increment amount:', amount);
      return this.currentScore;
    }
    
    // Increment score
    this.currentScore += amount;
    
    // Update statistics
    this.stats.totalScore += amount;
    
    // Check if new high score
    if (this.currentScore > this.highScore) {
      const oldHighScore = this.highScore;
      this.highScore = this.currentScore;
      this.saveHighScore();
      
      console.log(`New high score! ${oldHighScore} → ${this.highScore}`);
      
      return this.currentScore;
    }
    
    console.log(`Score: ${this.currentScore}`);
    return this.currentScore;
  }
  
  /**
   * Set current score to specific value (for testing/debugging)
   * @param {number} score - Score value to set
   */
  setScore(score) {
    if (typeof score !== 'number' || score < 0 || !isFinite(score)) {
      console.warn('Invalid score value:', score);
      return;
    }
    
    this.currentScore = score;
    
    // Check if new high score
    if (this.currentScore > this.highScore) {
      this.highScore = this.currentScore;
      this.saveHighScore();
    }
  }
  
  // ==================== Score Queries ====================
  
  /**
   * Get current session score
   * @returns {number} Current score
   */
  getCurrentScore() {
    return this.currentScore;
  }
  
  /**
   * Get high score
   * @returns {number} High score
   */
  getHighScore() {
    return this.highScore;
  }
  
  /**
   * Check if current score is a new high score
   * @returns {boolean} True if current score exceeds high score
   */
  isNewHighScore() {
    return this.currentScore > 0 && this.currentScore >= this.highScore;
  }
  
  /**
   * Get difference between current score and high score
   * @returns {number} Difference (negative if below high score)
   */
  getScoreDifference() {
    return this.currentScore - this.highScore;
  }
  
  /**
   * Get score data object
   * @returns {Object} Score data with current, high, and metadata
   */
  getScoreData() {
    return {
      current: this.currentScore,
      high: this.highScore,
      isNewHigh: this.isNewHighScore(),
      difference: this.getScoreDifference(),
      storageAvailable: this.storageAvailable
    };
  }
  
  // ==================== Statistics Tracking ====================
  
  /**
   * Record game session end
   * Updates statistics for completed game
   */
  recordGameEnd() {
    this.stats.totalGames++;
    this.stats.gamesThisSession++;
    
    // Calculate average score
    if (this.stats.totalGames > 0) {
      this.stats.averageScore = Math.round(
        this.stats.totalScore / this.stats.totalGames
      );
    }
    
    console.log(`Game ended. Total games: ${this.stats.totalGames}, Average: ${this.stats.averageScore}`);
  }
  
  /**
   * Get statistics data
   * @returns {Object} Statistics object
   */
  getStatistics() {
    return {
      totalGames: this.stats.totalGames,
      totalScore: this.stats.totalScore,
      averageScore: this.stats.averageScore,
      gamesThisSession: this.stats.gamesThisSession,
      currentScore: this.currentScore,
      highScore: this.highScore
    };
  }
  
  /**
   * Reset statistics (keep high score)
   */
  resetStatistics() {
    this.stats.totalGames = 0;
    this.stats.totalScore = 0;
    this.stats.averageScore = 0;
    this.stats.gamesThisSession = 0;
    
    console.log('Statistics reset');
  }
  
  // ==================== Display Formatting ====================
  
  /**
   * Format score for display with leading zeros
   * @param {number} score - Score to format
   * @param {number} minDigits - Minimum number of digits (default: 4)
   * @returns {string} Formatted score string
   */
  formatScore(score = this.currentScore, minDigits = 4) {
    return score.toString().padStart(minDigits, '0');
  }
  
  /**
   * Format score with thousands separator
   * @param {number} score - Score to format
   * @returns {string} Formatted score with commas
   */
  formatScoreWithCommas(score = this.currentScore) {
    return score.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  
  /**
   * Get score display text for UI
   * @returns {string} Formatted score text
   */
  getScoreDisplayText() {
    return `Score: ${this.currentScore}`;
  }
  
  /**
   * Get high score display text for UI
   * @returns {string} Formatted high score text
   */
  getHighScoreDisplayText() {
    return `High: ${this.highScore}`;
  }
  
  /**
   * Get combined score display text
   * @returns {string} Combined score and high score text
   */
  getCombinedDisplayText() {
    return `Score: ${this.currentScore} | High: ${this.highScore}`;
  }
  
  /**
   * Get new high score announcement text
   * @returns {string} New high score announcement
   */
  getNewHighScoreText() {
    if (!this.isNewHighScore()) {
      return '';
    }
    
    return 'NEW HIGH SCORE!';
  }
  
  /**
   * Get score improvement text
   * @returns {string} Score improvement message
   */
  getImprovementText() {
    const diff = this.getScoreDifference();
    
    if (diff > 0) {
      return `+${diff} above high score`;
    } else if (diff === 0) {
      return 'Tied high score';
    } else {
      return `${Math.abs(diff)} below high score`;
    }
  }
  
  // ==================== Rendering Helpers ====================
  
  /**
   * Render current score to canvas
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {Object} options - Rendering options
   */
  renderCurrentScore(ctx, x, y, options = {}) {
    const {
      font = '20px Arial',
      color = '#000000',
      align = 'center'
    } = options;
    
    ctx.save();
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.fillText(this.getScoreDisplayText(), x, y);
    ctx.restore();
  }
  
  /**
   * Render high score to canvas
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {Object} options - Rendering options
   */
  renderHighScore(ctx, x, y, options = {}) {
    const {
      font = '20px Arial',
      color = '#000000',
      align = 'center'
    } = options;
    
    ctx.save();
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.fillText(this.getHighScoreDisplayText(), x, y);
    ctx.restore();
  }
  
  /**
   * Render combined score display to canvas
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {Object} options - Rendering options
   */
  renderCombinedScore(ctx, x, y, options = {}) {
    const {
      font = '20px Arial',
      color = '#000000',
      align = 'center'
    } = options;
    
    ctx.save();
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.fillText(this.getCombinedDisplayText(), x, y);
    ctx.restore();
  }
  
  /**
   * Render new high score announcement with pulsing effect
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {Object} options - Rendering options
   */
  renderNewHighScoreAnnouncement(ctx, x, y, options = {}) {
    if (!this.isNewHighScore()) return;
    
    const {
      font = 'bold 24px Arial',
      color = '#FFD700',
      align = 'center',
      pulse = true
    } = options;
    
    ctx.save();
    
    // Pulsing effect
    let alpha = 1.0;
    if (pulse) {
      alpha = Math.sin(Date.now() / 200) * 0.3 + 0.7;
    }
    
    ctx.globalAlpha = alpha;
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.fillText(this.getNewHighScoreText(), x, y);
    
    ctx.restore();
  }
  
  /**
   * Render game over score summary
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} centerX - Center X position
   * @param {number} startY - Starting Y position
   */
  renderGameOverSummary(ctx, centerX, startY) {
    ctx.save();
    ctx.textAlign = 'center';
    
    // Current score (large)
    ctx.font = 'bold 72px Arial';
    ctx.fillStyle = '#FFD700';
    ctx.fillText(this.currentScore.toString(), centerX, startY);
    
    // New high score indicator or high score display
    if (this.isNewHighScore()) {
      const pulse = Math.sin(Date.now() / 200) * 0.2 + 0.8;
      ctx.globalAlpha = pulse;
      ctx.font = 'bold 24px Arial';
      ctx.fillStyle = '#FFD700';
      ctx.fillText('NEW HIGH SCORE!', centerX, startY + 50);
      ctx.globalAlpha = 1.0;
    } else {
      ctx.font = '20px Arial';
      ctx.fillStyle = '#CCCCCC';
      ctx.fillText(`Best: ${this.highScore}`, centerX, startY + 50);
    }
    
    ctx.restore();
  }
  
  // ==================== Utility Methods ====================
  
  /**
   * Export score data for debugging/testing
   * @returns {Object} Complete score manager state
   */
  exportData() {
    return {
      currentScore: this.currentScore,
      highScore: this.highScore,
      statistics: this.stats,
      storageAvailable: this.storageAvailable,
      storageKey: this.storageKey
    };
  }
  
  /**
   * Import score data (for testing/debugging)
   * @param {Object} data - Score data to import
   */
  importData(data) {
    if (data.currentScore !== undefined) {
      this.currentScore = data.currentScore;
    }
    
    if (data.highScore !== undefined) {
      this.highScore = data.highScore;
      this.saveHighScore();
    }
    
    if (data.statistics) {
      this.stats = { ...this.stats, ...data.statistics };
    }
    
    console.log('Score data imported');
  }
  
  /**
   * Reset all score data (current, high, statistics)
   * @param {boolean} keepHighScore - Whether to keep high score (default: false)
   */
  resetAll(keepHighScore = false) {
    this.currentScore = 0;
    
    if (!keepHighScore) {
      this.highScore = 0;
      this.clearHighScore();
    }
    
    this.resetStatistics();
    
    console.log('All score data reset');
  }
  
  /**
   * Get debug information
   * @returns {string} Debug info string
   */
  getDebugInfo() {
    return `ScoreManager: Current=${this.currentScore}, High=${this.highScore}, ` +
           `Storage=${this.storageAvailable ? 'available' : 'unavailable'}, ` +
           `Games=${this.stats.totalGames}, Avg=${this.stats.averageScore}`;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ScoreManager;
}
