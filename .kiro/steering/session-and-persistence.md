---
inclusion: auto
---

# Game Session Management and Persistence

## Overview

This document defines patterns for game session management, high score tracking, restart functionality, and data persistence in Flappy Kiro. These patterns ensure reliable session handling, accurate score tracking, and smooth game state transitions.

## Core Session Principles

1. **Session Integrity**: Sessions are properly initialized, tracked, and cleaned up
2. **Data Persistence**: Scores and statistics are reliably saved and restored
3. **State Consistency**: Game state transitions are atomic and predictable
4. **Performance Tracking**: Session metrics provide insights into player behavior
5. **Error Resilience**: System handles storage failures gracefully

---

## Game Session Management

### Session Lifecycle

**Complete Session Tracking**:
```javascript
// ✅ GOOD: Comprehensive session management
class GameSession {
  constructor(config) {
    this.config = config;
    
    // Session identification
    this.sessionId = this.generateSessionId();
    this.startTime = null;
    this.endTime = null;
    
    // Session data
    this.score = 0;
    this.jumps = 0;
    this.collisions = 0;
    this.pipesCleared = 0;
    this.maxCombo = 0;
    this.currentCombo = 0;
    
    // Performance metrics
    this.frameCount = 0;
    this.averageFPS = 0;
    this.minFPS = Infinity;
    this.maxFPS = 0;
    
    // Session state
    this.active = false;
    this.paused = false;
    this.pauseDuration = 0;
    this.pauseStartTime = null;
  }
  
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  start() {
    this.startTime = Date.now();
    this.active = true;
    this.paused = false;
    
    // Reset session data
    this.score = 0;
    this.jumps = 0;
    this.collisions = 0;
    this.pipesCleared = 0;
    this.maxCombo = 0;
    this.currentCombo = 0;
    this.frameCount = 0;
    this.averageFPS = 0;
    this.minFPS = Infinity;
    this.maxFPS = 0;
    
    console.log(`Session started: ${this.sessionId}`);
  }
  
  end() {
    this.endTime = Date.now();
    this.active = false;
    
    console.log(`Session ended: ${this.sessionId}`);
    return this.getSessionSummary();
  }
  
  pause() {
    if (!this.active || this.paused) return;
    
    this.paused = true;
    this.pauseStartTime = Date.now();
    console.log('Session paused');
  }
  
  resume() {
    if (!this.active || !this.paused) return;
    
    this.paused = false;
    const pauseTime = Date.now() - this.pauseStartTime;
    this.pauseDuration += pauseTime;
    this.pauseStartTime = null;
    console.log(`Session resumed (paused for ${pauseTime}ms)`);
  }
  
  // Event tracking
  recordJump() {
    if (!this.active || this.paused) return;
    this.jumps++;
  }
  
  recordCollision(type) {
    if (!this.active || this.paused) return;
    this.collisions++;
    this.currentCombo = 0;
    this.collisionType = type; // 'pipe_top', 'pipe_bottom', 'ceiling', 'ground'
  }
  
  recordPipeCleared() {
    if (!this.active || this.paused) return;
    this.pipesCleared++;
    this.currentCombo++;
    
    if (this.currentCombo > this.maxCombo) {
      this.maxCombo = this.currentCombo;
    }
  }
  
  recordScore(score) {
    if (!this.active || this.paused) return;
    this.score = score;
  }
  
  recordFrame(fps) {
    if (!this.active || this.paused) return;
    
    this.frameCount++;
    this.averageFPS = ((this.averageFPS * (this.frameCount - 1)) + fps) / this.frameCount;
    this.minFPS = Math.min(this.minFPS, fps);
    this.maxFPS = Math.max(this.maxFPS, fps);
  }
  
  // Session queries
  getDuration() {
    if (!this.startTime) return 0;
    
    const endTime = this.endTime || Date.now();
    return endTime - this.startTime;
  }
  
  getActiveDuration() {
    return this.getDuration() - this.pauseDuration;
  }
  
  getSessionSummary() {
    return {
      sessionId: this.sessionId,
      duration: this.getDuration(),
      activeDuration: this.getActiveDuration(),
      pauseDuration: this.pauseDuration,
      score: this.score,
      jumps: this.jumps,
      collisions: this.collisions,
      collisionType: this.collisionType,
      pipesCleared: this.pipesCleared,
      maxCombo: this.maxCombo,
      averageFPS: Math.round(this.averageFPS),
      minFPS: this.minFPS === Infinity ? 0 : Math.round(this.minFPS),
      maxFPS: Math.round(this.maxFPS),
      efficiency: this.calculateEfficiency(),
      accuracy: this.calculateAccuracy(),
      startTime: this.startTime,
      endTime: this.endTime
    };
  }
  
  calculateEfficiency() {
    if (this.jumps === 0) return 0;
    // Efficiency = pipes cleared / jumps made
    return Math.round((this.pipesCleared / this.jumps) * 100);
  }
  
  calculateAccuracy() {
    const totalAttempts = this.pipesCleared + this.collisions;
    if (totalAttempts === 0) return 0;
    // Accuracy = successful passes / total attempts
    return Math.round((this.pipesCleared / totalAttempts) * 100);
  }
  
  isActive() {
    return this.active;
  }
  
  isPaused() {
    return this.paused;
  }
}
```


### Session Manager

**Centralized Session Control**:
```javascript
// ✅ GOOD: Session manager with history tracking
class SessionManager {
  constructor(config) {
    this.config = config;
    this.currentSession = null;
    this.sessionHistory = [];
    this.maxHistorySize = 50;
  }
  
  startSession() {
    // End previous session if active
    if (this.currentSession?.isActive()) {
      this.endSession();
    }
    
    // Create new session
    this.currentSession = new GameSession(this.config);
    this.currentSession.start();
    
    return this.currentSession;
  }
  
  endSession() {
    if (!this.currentSession) return null;
    
    const summary = this.currentSession.end();
    
    // Add to history
    this.sessionHistory.push(summary);
    
    // Trim history
    if (this.sessionHistory.length > this.maxHistorySize) {
      this.sessionHistory.shift();
    }
    
    return summary;
  }
  
  pauseSession() {
    this.currentSession?.pause();
  }
  
  resumeSession() {
    this.currentSession?.resume();
  }
  
  getCurrentSession() {
    return this.currentSession;
  }
  
  getSessionHistory() {
    return [...this.sessionHistory];
  }
  
  getRecentSessions(count = 10) {
    return this.sessionHistory.slice(-count);
  }
  
  getSessionStats() {
    if (this.sessionHistory.length === 0) {
      return {
        totalSessions: 0,
        averageScore: 0,
        averageDuration: 0,
        totalPlayTime: 0,
        bestScore: 0,
        bestCombo: 0
      };
    }
    
    const totalSessions = this.sessionHistory.length;
    const totalScore = this.sessionHistory.reduce((sum, s) => sum + s.score, 0);
    const totalDuration = this.sessionHistory.reduce((sum, s) => sum + s.activeDuration, 0);
    const bestScore = Math.max(...this.sessionHistory.map(s => s.score));
    const bestCombo = Math.max(...this.sessionHistory.map(s => s.maxCombo));
    
    return {
      totalSessions,
      averageScore: Math.round(totalScore / totalSessions),
      averageDuration: Math.round(totalDuration / totalSessions),
      totalPlayTime: totalDuration,
      bestScore,
      bestCombo
    };
  }
  
  clearHistory() {
    this.sessionHistory = [];
  }
}
```


---

## High Score Tracking

### High Score Manager

**Persistent High Score System**:
```javascript
// ✅ GOOD: Comprehensive high score management
class HighScoreManager {
  constructor(config) {
    this.config = config;
    this.storageKey = config.storage?.highScoreKey || 'flappyKiro_highScore';
    this.highScore = 0;
    this.highScoreDate = null;
    this.highScoreSessionId = null;
    
    // Load saved high score
    this.loadHighScore();
  }
  
  loadHighScore() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        
        // Validate data
        if (this.validateHighScoreData(data)) {
          this.highScore = data.score;
          this.highScoreDate = data.date;
          this.highScoreSessionId = data.sessionId;
          console.log(`High score loaded: ${this.highScore}`);
        }
      }
    } catch (err) {
      console.error('Failed to load high score:', err);
      this.highScore = 0;
    }
  }
  
  saveHighScore() {
    try {
      const data = {
        score: this.highScore,
        date: this.highScoreDate,
        sessionId: this.highScoreSessionId,
        version: '1.0.0'
      };
      
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      console.log(`High score saved: ${this.highScore}`);
      return true;
    } catch (err) {
      console.error('Failed to save high score:', err);
      return false;
    }
  }
  
  validateHighScoreData(data) {
    if (!data || typeof data !== 'object') return false;
    if (typeof data.score !== 'number') return false;
    if (data.score < 0 || data.score > 10000) return false;
    return true;
  }
  
  checkAndUpdateHighScore(score, sessionId) {
    if (score > this.highScore) {
      const oldHighScore = this.highScore;
      this.highScore = score;
      this.highScoreDate = Date.now();
      this.highScoreSessionId = sessionId;
      this.saveHighScore();
      
      console.log(`New high score! ${oldHighScore} → ${this.highScore}`);
      return {
        isNewHighScore: true,
        oldHighScore,
        newHighScore: this.highScore,
        improvement: this.highScore - oldHighScore
      };
    }
    
    return {
      isNewHighScore: false,
      highScore: this.highScore,
      difference: this.highScore - score
    };
  }
  
  getHighScore() {
    return this.highScore;
  }
  
  getHighScoreInfo() {
    return {
      score: this.highScore,
      date: this.highScoreDate,
      sessionId: this.highScoreSessionId,
      formattedDate: this.highScoreDate ? new Date(this.highScoreDate).toLocaleDateString() : null
    };
  }
  
  resetHighScore() {
    this.highScore = 0;
    this.highScoreDate = null;
    this.highScoreSessionId = null;
    
    try {
      localStorage.removeItem(this.storageKey);
      console.log('High score reset');
      return true;
    } catch (err) {
      console.error('Failed to reset high score:', err);
      return false;
    }
  }
}
```


### Statistics Tracking

**Comprehensive Game Statistics**:
```javascript
// ✅ GOOD: Detailed statistics tracking
class StatisticsManager {
  constructor(config) {
    this.config = config;
    this.storageKey = config.storage?.statsKey || 'flappyKiro_stats';
    
    this.stats = {
      totalGames: 0,
      totalScore: 0,
      averageScore: 0,
      bestStreak: 0,
      currentStreak: 0,
      totalPlayTime: 0,
      totalJumps: 0,
      totalPipesCleared: 0,
      totalCollisions: 0,
      lastPlayed: null,
      firstPlayed: null,
      scoreHistory: [],
      milestones: []
    };
    
    this.loadStatistics();
  }
  
  loadStatistics() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        this.stats = { ...this.stats, ...data };
        console.log('Statistics loaded');
      }
    } catch (err) {
      console.error('Failed to load statistics:', err);
    }
  }
  
  saveStatistics() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.stats));
      return true;
    } catch (err) {
      console.error('Failed to save statistics:', err);
      return false;
    }
  }
  
  recordSession(sessionSummary) {
    // Update totals
    this.stats.totalGames++;
    this.stats.totalScore += sessionSummary.score;
    this.stats.totalPlayTime += sessionSummary.activeDuration;
    this.stats.totalJumps += sessionSummary.jumps;
    this.stats.totalPipesCleared += sessionSummary.pipesCleared;
    this.stats.totalCollisions += sessionSummary.collisions;
    
    // Update average
    this.stats.averageScore = Math.round(this.stats.totalScore / this.stats.totalGames);
    
    // Update streak
    if (sessionSummary.score > 0) {
      this.stats.currentStreak++;
      if (this.stats.currentStreak > this.stats.bestStreak) {
        this.stats.bestStreak = this.stats.currentStreak;
      }
    } else {
      this.stats.currentStreak = 0;
    }
    
    // Update dates
    this.stats.lastPlayed = Date.now();
    if (!this.stats.firstPlayed) {
      this.stats.firstPlayed = Date.now();
    }
    
    // Add to history (keep last 100)
    this.stats.scoreHistory.push({
      score: sessionSummary.score,
      timestamp: Date.now(),
      duration: sessionSummary.activeDuration,
      efficiency: sessionSummary.efficiency
    });
    
    if (this.stats.scoreHistory.length > 100) {
      this.stats.scoreHistory.shift();
    }
    
    // Check milestones
    this.checkMilestones(sessionSummary);
    
    // Save
    this.saveStatistics();
  }
  
  checkMilestones(sessionSummary) {
    const milestones = [
      { id: 'first_game', name: 'First Game', condition: () => this.stats.totalGames === 1 },
      { id: 'score_10', name: 'Score 10', condition: () => sessionSummary.score >= 10 },
      { id: 'score_25', name: 'Score 25', condition: () => sessionSummary.score >= 25 },
      { id: 'score_50', name: 'Score 50', condition: () => sessionSummary.score >= 50 },
      { id: 'games_10', name: '10 Games', condition: () => this.stats.totalGames === 10 },
      { id: 'games_50', name: '50 Games', condition: () => this.stats.totalGames === 50 },
      { id: 'games_100', name: '100 Games', condition: () => this.stats.totalGames === 100 },
      { id: 'streak_5', name: '5 Game Streak', condition: () => this.stats.currentStreak === 5 },
      { id: 'combo_10', name: '10 Pipe Combo', condition: () => sessionSummary.maxCombo >= 10 }
    ];
    
    for (const milestone of milestones) {
      if (milestone.condition() && !this.hasMilestone(milestone.id)) {
        this.stats.milestones.push({
          id: milestone.id,
          name: milestone.name,
          timestamp: Date.now()
        });
        console.log(`Milestone unlocked: ${milestone.name}`);
      }
    }
  }
  
  hasMilestone(id) {
    return this.stats.milestones.some(m => m.id === id);
  }
  
  getStatistics() {
    return { ...this.stats };
  }
  
  getRecentScores(count = 10) {
    return this.stats.scoreHistory.slice(-count);
  }
  
  getMilestones() {
    return [...this.stats.milestones];
  }
  
  resetStatistics() {
    this.stats = {
      totalGames: 0,
      totalScore: 0,
      averageScore: 0,
      bestStreak: 0,
      currentStreak: 0,
      totalPlayTime: 0,
      totalJumps: 0,
      totalPipesCleared: 0,
      totalCollisions: 0,
      lastPlayed: null,
      firstPlayed: null,
      scoreHistory: [],
      milestones: []
    };
    
    try {
      localStorage.removeItem(this.storageKey);
      console.log('Statistics reset');
      return true;
    } catch (err) {
      console.error('Failed to reset statistics:', err);
      return false;
    }
  }
}
```


---

## Restart Functionality

### Restart Manager

**Smooth Game Restart System**:
```javascript
// ✅ GOOD: Comprehensive restart management
class RestartManager {
  constructor(game) {
    this.game = game;
    this.restartInProgress = false;
    this.restartCallbacks = [];
    this.quickRestartEnabled = true;
    this.restartDelay = 500; // ms delay before restart
  }
  
  registerRestartCallback(callback) {
    this.restartCallbacks.push(callback);
  }
  
  async restart(immediate = false) {
    if (this.restartInProgress) {
      console.warn('Restart already in progress');
      return;
    }
    
    this.restartInProgress = true;
    console.log('Restarting game...');
    
    try {
      // Execute pre-restart callbacks
      await this.executeCallbacks('beforeRestart');
      
      // Optional delay for visual feedback
      if (!immediate && this.restartDelay > 0) {
        await this.delay(this.restartDelay);
      }
      
      // Reset game state
      this.resetGameState();
      
      // Reset entities
      this.resetEntities();
      
      // Reset systems
      this.resetSystems();
      
      // Execute post-restart callbacks
      await this.executeCallbacks('afterRestart');
      
      console.log('Game restarted successfully');
    } catch (err) {
      console.error('Restart failed:', err);
    } finally {
      this.restartInProgress = false;
    }
  }
  
  resetGameState() {
    // Reset score
    this.game.score = 0;
    
    // Reset game state
    this.game.state = 'playing';
    
    // Reset timers
    this.game.elapsedTime = 0;
    this.game.frameCount = 0;
  }
  
  resetEntities() {
    // Reset ghost
    if (this.game.ghost) {
      this.game.ghost.reset();
    }
    
    // Clear pipes
    if (this.game.pipes) {
      this.game.pipes.length = 0;
    }
    
    // Clear particles
    if (this.game.particles) {
      this.game.particles.length = 0;
    }
    
    // Clear score indicators
    if (this.game.scoreIndicators) {
      this.game.scoreIndicators.length = 0;
    }
  }
  
  resetSystems() {
    // Reset pipe generator
    if (this.game.pipeGenerator) {
      this.game.pipeGenerator.reset();
    }
    
    // Reset difficulty
    if (this.game.difficultyManager) {
      this.game.difficultyManager.reset();
    }
    
    // Reset collision system
    if (this.game.collisionSystem) {
      this.game.collisionSystem.reset();
    }
    
    // Start invincibility
    if (this.game.stateManager) {
      this.game.stateManager.startInvincibility();
    }
  }
  
  async executeCallbacks(phase) {
    for (const callback of this.restartCallbacks) {
      if (callback.phase === phase) {
        try {
          await callback.fn();
        } catch (err) {
          console.error(`Callback error (${phase}):`, err);
        }
      }
    }
  }
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  quickRestart() {
    if (!this.quickRestartEnabled) return;
    this.restart(true);
  }
  
  setQuickRestartEnabled(enabled) {
    this.quickRestartEnabled = enabled;
  }
  
  setRestartDelay(ms) {
    this.restartDelay = Math.max(0, ms);
  }
  
  isRestartInProgress() {
    return this.restartInProgress;
  }
}
```


### Restart Transitions

**Visual Restart Feedback**:
```javascript
// ✅ GOOD: Smooth restart transitions
class RestartTransition {
  constructor(renderer) {
    this.renderer = renderer;
    this.active = false;
    this.progress = 0;
    this.duration = 300; // ms
    this.startTime = 0;
    this.type = 'fade'; // 'fade', 'zoom', 'slide'
  }
  
  start(type = 'fade') {
    this.active = true;
    this.progress = 0;
    this.startTime = Date.now();
    this.type = type;
  }
  
  update() {
    if (!this.active) return;
    
    const elapsed = Date.now() - this.startTime;
    this.progress = Math.min(elapsed / this.duration, 1.0);
    
    if (this.progress >= 1.0) {
      this.active = false;
    }
  }
  
  render(ctx) {
    if (!this.active) return;
    
    switch (this.type) {
      case 'fade':
        this.renderFade(ctx);
        break;
      case 'zoom':
        this.renderZoom(ctx);
        break;
      case 'slide':
        this.renderSlide(ctx);
        break;
    }
  }
  
  renderFade(ctx) {
    const alpha = this.progress;
    
    ctx.save();
    ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.restore();
  }
  
  renderZoom(ctx) {
    const scale = 1 + (this.progress * 0.5);
    const alpha = this.progress * 0.5;
    
    ctx.save();
    ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
    ctx.scale(scale, scale);
    ctx.translate(-ctx.canvas.width / 2, -ctx.canvas.height / 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.restore();
  }
  
  renderSlide(ctx) {
    const offset = this.progress * ctx.canvas.height;
    
    ctx.save();
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, -ctx.canvas.height + offset, ctx.canvas.width, ctx.canvas.height);
    ctx.restore();
  }
  
  isActive() {
    return this.active;
  }
  
  isComplete() {
    return !this.active && this.progress >= 1.0;
  }
}
```


---

## Data Persistence

### LocalStorage Manager

**Robust Storage System**:
```javascript
// ✅ GOOD: Safe localStorage wrapper
class StorageManager {
  constructor(config) {
    this.config = config;
    this.prefix = config.storage?.prefix || 'flappyKiro_';
    this.available = this.checkAvailability();
  }
  
  checkAvailability() {
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
  
  save(key, data) {
    if (!this.available) {
      console.warn('Storage not available');
      return false;
    }
    
    try {
      const fullKey = this.prefix + key;
      const serialized = JSON.stringify(data);
      localStorage.setItem(fullKey, serialized);
      return true;
    } catch (err) {
      console.error('Failed to save data:', err);
      
      // Handle quota exceeded
      if (err.name === 'QuotaExceededError') {
        console.warn('Storage quota exceeded, clearing old data');
        this.clearOldData();
        
        // Retry
        try {
          const fullKey = this.prefix + key;
          const serialized = JSON.stringify(data);
          localStorage.setItem(fullKey, serialized);
          return true;
        } catch (retryErr) {
          console.error('Retry failed:', retryErr);
          return false;
        }
      }
      
      return false;
    }
  }
  
  load(key, defaultValue = null) {
    if (!this.available) {
      return defaultValue;
    }
    
    try {
      const fullKey = this.prefix + key;
      const serialized = localStorage.getItem(fullKey);
      
      if (serialized === null) {
        return defaultValue;
      }
      
      return JSON.parse(serialized);
    } catch (err) {
      console.error('Failed to load data:', err);
      return defaultValue;
    }
  }
  
  remove(key) {
    if (!this.available) return false;
    
    try {
      const fullKey = this.prefix + key;
      localStorage.removeItem(fullKey);
      return true;
    } catch (err) {
      console.error('Failed to remove data:', err);
      return false;
    }
  }
  
  clear() {
    if (!this.available) return false;
    
    try {
      // Only clear keys with our prefix
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      }
      return true;
    } catch (err) {
      console.error('Failed to clear data:', err);
      return false;
    }
  }
  
  clearOldData() {
    // Remove old session data, keep high scores and stats
    const keysToKeep = ['highScore', 'stats'];
    const keys = Object.keys(localStorage);
    
    for (const key of keys) {
      if (key.startsWith(this.prefix)) {
        const shortKey = key.substring(this.prefix.length);
        if (!keysToKeep.includes(shortKey)) {
          localStorage.removeItem(key);
        }
      }
    }
  }
  
  getStorageInfo() {
    if (!this.available) {
      return { available: false };
    }
    
    let totalSize = 0;
    const keys = Object.keys(localStorage);
    
    for (const key of keys) {
      if (key.startsWith(this.prefix)) {
        const value = localStorage.getItem(key);
        totalSize += key.length + (value?.length || 0);
      }
    }
    
    return {
      available: true,
      totalKeys: keys.filter(k => k.startsWith(this.prefix)).length,
      totalSize: totalSize,
      totalSizeKB: (totalSize / 1024).toFixed(2)
    };
  }
}
```


### Data Export/Import

**Backup and Restore Functionality**:
```javascript
// ✅ GOOD: Data export and import system
class DataManager {
  constructor(highScoreManager, statisticsManager, storageManager) {
    this.highScoreManager = highScoreManager;
    this.statisticsManager = statisticsManager;
    this.storageManager = storageManager;
  }
  
  exportData() {
    const data = {
      version: '1.0.0',
      exportDate: Date.now(),
      highScore: this.highScoreManager.getHighScoreInfo(),
      statistics: this.statisticsManager.getStatistics(),
      storageInfo: this.storageManager.getStorageInfo()
    };
    
    return data;
  }
  
  exportToJSON() {
    const data = this.exportData();
    return JSON.stringify(data, null, 2);
  }
  
  exportToFile() {
    const json = this.exportToJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `flappy-kiro-data-${Date.now()}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
  }
  
  importData(data) {
    try {
      // Validate version
      if (data.version !== '1.0.0') {
        console.error('Incompatible data version');
        return false;
      }
      
      // Import high score
      if (data.highScore && data.highScore.score > this.highScoreManager.getHighScore()) {
        this.highScoreManager.highScore = data.highScore.score;
        this.highScoreManager.highScoreDate = data.highScore.date;
        this.highScoreManager.highScoreSessionId = data.highScore.sessionId;
        this.highScoreManager.saveHighScore();
      }
      
      // Import statistics (merge, don't replace)
      if (data.statistics) {
        this.mergeStatistics(data.statistics);
      }
      
      console.log('Data imported successfully');
      return true;
    } catch (err) {
      console.error('Failed to import data:', err);
      return false;
    }
  }
  
  importFromJSON(json) {
    try {
      const data = JSON.parse(json);
      return this.importData(data);
    } catch (err) {
      console.error('Failed to parse JSON:', err);
      return false;
    }
  }
  
  importFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const result = this.importFromJSON(e.target.result);
          resolve(result);
        } catch (err) {
          reject(err);
        }
      };
      
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }
  
  mergeStatistics(importedStats) {
    const current = this.statisticsManager.stats;
    
    // Merge totals
    current.totalGames += importedStats.totalGames || 0;
    current.totalScore += importedStats.totalScore || 0;
    current.totalPlayTime += importedStats.totalPlayTime || 0;
    current.totalJumps += importedStats.totalJumps || 0;
    current.totalPipesCleared += importedStats.totalPipesCleared || 0;
    current.totalCollisions += importedStats.totalCollisions || 0;
    
    // Update averages
    current.averageScore = Math.round(current.totalScore / current.totalGames);
    
    // Update bests
    current.bestStreak = Math.max(current.bestStreak, importedStats.bestStreak || 0);
    
    // Merge history (keep most recent 100)
    if (importedStats.scoreHistory) {
      current.scoreHistory = [...current.scoreHistory, ...importedStats.scoreHistory]
        .sort((a, b) => a.timestamp - b.timestamp)
        .slice(-100);
    }
    
    // Merge milestones (unique by id)
    if (importedStats.milestones) {
      const existingIds = new Set(current.milestones.map(m => m.id));
      for (const milestone of importedStats.milestones) {
        if (!existingIds.has(milestone.id)) {
          current.milestones.push(milestone);
        }
      }
    }
    
    // Update dates
    if (importedStats.firstPlayed && (!current.firstPlayed || importedStats.firstPlayed < current.firstPlayed)) {
      current.firstPlayed = importedStats.firstPlayed;
    }
    
    this.statisticsManager.saveStatistics();
  }
  
  clearAllData() {
    if (confirm('Are you sure you want to clear all game data? This cannot be undone.')) {
      this.highScoreManager.resetHighScore();
      this.statisticsManager.resetStatistics();
      this.storageManager.clear();
      console.log('All data cleared');
      return true;
    }
    return false;
  }
}
```


---

## Complete Integration

### Persistence Controller

**Unified Persistence Management**:
```javascript
// ✅ GOOD: Complete persistence system
class PersistenceController {
  constructor(config) {
    this.config = config;
    
    // Initialize managers
    this.storageManager = new StorageManager(config);
    this.sessionManager = new SessionManager(config);
    this.highScoreManager = new HighScoreManager(config);
    this.statisticsManager = new StatisticsManager(config);
    this.dataManager = new DataManager(
      this.highScoreManager,
      this.statisticsManager,
      this.storageManager
    );
    
    // Auto-save settings
    this.autoSaveEnabled = true;
    this.autoSaveInterval = 30000; // 30 seconds
    this.autoSaveTimer = null;
    
    this.startAutoSave();
  }
  
  // Session lifecycle
  startSession() {
    const session = this.sessionManager.startSession();
    console.log('Session started');
    return session;
  }
  
  endSession() {
    const summary = this.sessionManager.endSession();
    
    if (summary) {
      // Check high score
      const highScoreResult = this.highScoreManager.checkAndUpdateHighScore(
        summary.score,
        summary.sessionId
      );
      
      // Record statistics
      this.statisticsManager.recordSession(summary);
      
      // Save all data
      this.saveAll();
      
      console.log('Session ended');
      
      return {
        summary,
        highScoreResult
      };
    }
    
    return null;
  }
  
  pauseSession() {
    this.sessionManager.pauseSession();
  }
  
  resumeSession() {
    this.sessionManager.resumeSession();
  }
  
  // Data access
  getCurrentSession() {
    return this.sessionManager.getCurrentSession();
  }
  
  getHighScore() {
    return this.highScoreManager.getHighScore();
  }
  
  getStatistics() {
    return this.statisticsManager.getStatistics();
  }
  
  getSessionHistory() {
    return this.sessionManager.getSessionHistory();
  }
  
  // Persistence
  saveAll() {
    this.highScoreManager.saveHighScore();
    this.statisticsManager.saveStatistics();
    console.log('All data saved');
  }
  
  loadAll() {
    this.highScoreManager.loadHighScore();
    this.statisticsManager.loadStatistics();
    console.log('All data loaded');
  }
  
  // Auto-save
  startAutoSave() {
    if (!this.autoSaveEnabled) return;
    
    this.autoSaveTimer = setInterval(() => {
      this.saveAll();
    }, this.autoSaveInterval);
  }
  
  stopAutoSave() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }
  
  setAutoSaveEnabled(enabled) {
    this.autoSaveEnabled = enabled;
    
    if (enabled) {
      this.startAutoSave();
    } else {
      this.stopAutoSave();
    }
  }
  
  // Export/Import
  exportData() {
    return this.dataManager.exportData();
  }
  
  exportToFile() {
    this.dataManager.exportToFile();
  }
  
  importData(data) {
    return this.dataManager.importData(data);
  }
  
  importFromFile(file) {
    return this.dataManager.importFromFile(file);
  }
  
  // Cleanup
  clearAllData() {
    return this.dataManager.clearAllData();
  }
  
  destroy() {
    this.stopAutoSave();
    this.saveAll();
  }
}
```


---

## Usage Examples

### Basic Game Integration

**Using Persistence in Game**:
```javascript
// ✅ GOOD: Complete game with persistence
class FlappyKiroGame {
  constructor(canvas, config) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.config = config;
    
    // Initialize persistence
    this.persistence = new PersistenceController(config);
    
    // Initialize restart manager
    this.restartManager = new RestartManager(this);
    
    // Initialize other systems
    this.initializeSystems();
    
    // Setup input handlers
    this.setupInput();
    
    // Load saved data
    this.persistence.loadAll();
  }
  
  initializeSystems() {
    // Initialize game systems
    this.ghost = new Ghost(100, 300, this.config);
    this.pipeGenerator = new PipeGenerator(this.config, this.canvas.height);
    this.pipes = [];
    this.score = 0;
    this.state = 'menu';
  }
  
  setupInput() {
    // Space or click to jump/start
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        this.handleJump();
      } else if (e.code === 'KeyR') {
        this.handleRestart();
      }
    });
    
    this.canvas.addEventListener('click', () => {
      this.handleJump();
    });
  }
  
  handleJump() {
    if (this.state === 'menu') {
      this.startGame();
    } else if (this.state === 'playing') {
      this.ghost.jump();
      this.persistence.getCurrentSession()?.recordJump();
    } else if (this.state === 'gameOver') {
      this.restartGame();
    }
  }
  
  handleRestart() {
    if (this.state === 'playing' || this.state === 'gameOver') {
      this.restartGame();
    }
  }
  
  startGame() {
    // Start new session
    this.persistence.startSession();
    
    // Reset game
    this.score = 0;
    this.ghost.reset();
    this.pipes = [];
    this.pipeGenerator.reset();
    
    // Change state
    this.state = 'playing';
    
    console.log('Game started');
  }
  
  restartGame() {
    // End current session
    const result = this.persistence.endSession();
    
    if (result?.highScoreResult.isNewHighScore) {
      console.log('New high score!', result.highScoreResult.newHighScore);
    }
    
    // Restart with transition
    this.restartManager.restart();
  }
  
  endGame() {
    // Record collision
    this.persistence.getCurrentSession()?.recordCollision('pipe_top');
    
    // End session
    const result = this.persistence.endSession();
    
    // Change state
    this.state = 'gameOver';
    
    // Show results
    this.showGameOverScreen(result);
  }
  
  update(deltaTime) {
    if (this.state !== 'playing') return;
    
    // Update ghost
    this.ghost.update(deltaTime);
    
    // Update pipes
    this.updatePipes(deltaTime);
    
    // Check collisions
    if (this.checkCollisions()) {
      this.endGame();
    }
    
    // Check scoring
    this.checkScoring();
    
    // Record frame
    const fps = 1 / deltaTime;
    this.persistence.getCurrentSession()?.recordFrame(fps);
  }
  
  updatePipes(deltaTime) {
    // Generate new pipes
    if (this.pipeGenerator.shouldGeneratePipe(this.canvas.width)) {
      const pipeData = this.pipeGenerator.generatePipe();
      this.pipes.push(pipeData);
    }
    
    // Update existing pipes
    for (const pipe of this.pipes) {
      pipe.x -= pipe.speed * deltaTime;
    }
    
    // Remove off-screen pipes
    this.pipes = this.pipes.filter(pipe => pipe.x + pipe.width > 0);
  }
  
  checkScoring() {
    for (const pipe of this.pipes) {
      if (!pipe.scored && pipe.x + pipe.width < this.ghost.x) {
        pipe.scored = true;
        this.score++;
        
        // Record in session
        this.persistence.getCurrentSession()?.recordPipeCleared();
        this.persistence.getCurrentSession()?.recordScore(this.score);
      }
    }
  }
  
  showGameOverScreen(result) {
    const summary = result.summary;
    const highScoreResult = result.highScoreResult;
    
    console.log('Game Over!');
    console.log(`Score: ${summary.score}`);
    console.log(`High Score: ${this.persistence.getHighScore()}`);
    console.log(`Efficiency: ${summary.efficiency}%`);
    
    if (highScoreResult.isNewHighScore) {
      console.log(`🎉 New High Score! +${highScoreResult.improvement}`);
    }
  }
  
  render() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    if (this.state === 'menu') {
      this.renderMenu();
    } else if (this.state === 'playing') {
      this.renderGame();
    } else if (this.state === 'gameOver') {
      this.renderGameOver();
    }
  }
  
  renderGame() {
    // Render pipes
    for (const pipe of this.pipes) {
      this.renderPipe(pipe);
    }
    
    // Render ghost
    this.renderGhost();
    
    // Render HUD
    this.renderHUD();
  }
  
  renderHUD() {
    this.ctx.save();
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = 'bold 32px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(this.score, this.canvas.width / 2, 50);
    
    // High score
    this.ctx.font = '16px Arial';
    this.ctx.fillText(`Best: ${this.persistence.getHighScore()}`, this.canvas.width / 2, 80);
    this.ctx.restore();
  }
  
  destroy() {
    // Save and cleanup
    this.persistence.destroy();
  }
}
```


### Statistics Display

**Show Player Statistics**:
```javascript
// ✅ GOOD: Statistics screen implementation
class StatisticsScreen {
  constructor(persistence) {
    this.persistence = persistence;
  }
  
  render(ctx) {
    const stats = this.persistence.getStatistics();
    const highScore = this.persistence.getHighScore();
    
    ctx.save();
    
    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Title
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Statistics', ctx.canvas.width / 2, 60);
    
    // Stats grid
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    
    const leftX = 50;
    const rightX = ctx.canvas.width / 2 + 50;
    let y = 120;
    const lineHeight = 35;
    
    // Left column
    this.renderStat(ctx, 'High Score', highScore, leftX, y);
    y += lineHeight;
    this.renderStat(ctx, 'Total Games', stats.totalGames, leftX, y);
    y += lineHeight;
    this.renderStat(ctx, 'Average Score', stats.averageScore, leftX, y);
    y += lineHeight;
    this.renderStat(ctx, 'Best Streak', stats.bestStreak, leftX, y);
    y += lineHeight;
    this.renderStat(ctx, 'Current Streak', stats.currentStreak, leftX, y);
    
    // Right column
    y = 120;
    this.renderStat(ctx, 'Total Pipes', stats.totalPipesCleared, rightX, y);
    y += lineHeight;
    this.renderStat(ctx, 'Total Jumps', stats.totalJumps, rightX, y);
    y += lineHeight;
    this.renderStat(ctx, 'Play Time', this.formatDuration(stats.totalPlayTime), rightX, y);
    y += lineHeight;
    
    const accuracy = stats.totalPipesCleared + stats.totalCollisions > 0
      ? Math.round((stats.totalPipesCleared / (stats.totalPipesCleared + stats.totalCollisions)) * 100)
      : 0;
    this.renderStat(ctx, 'Accuracy', `${accuracy}%`, rightX, y);
    
    // Milestones
    y += lineHeight * 2;
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Milestones', ctx.canvas.width / 2, y);
    
    y += 40;
    this.renderMilestones(ctx, stats.milestones, y);
    
    // Instructions
    ctx.font = '16px Arial';
    ctx.fillStyle = '#888888';
    ctx.fillText('Press ESC to return', ctx.canvas.width / 2, ctx.canvas.height - 30);
    
    ctx.restore();
  }
  
  renderStat(ctx, label, value, x, y) {
    ctx.fillStyle = '#AAAAAA';
    ctx.fillText(label + ':', x, y);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(String(value), x + 200, y);
  }
  
  renderMilestones(ctx, milestones, startY) {
    if (milestones.length === 0) {
      ctx.fillStyle = '#666666';
      ctx.font = '18px Arial';
      ctx.fillText('No milestones yet', ctx.canvas.width / 2, startY);
      return;
    }
    
    ctx.font = '18px Arial';
    const cols = 3;
    const colWidth = ctx.canvas.width / cols;
    
    milestones.forEach((milestone, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = colWidth * col + colWidth / 2;
      const y = startY + row * 30;
      
      ctx.fillStyle = '#FFD700';
      ctx.fillText(`✓ ${milestone.name}`, x, y);
    });
  }
  
  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
}
```


### Game Over Screen with Results

**Comprehensive Game Over Display**:
```javascript
// ✅ GOOD: Game over screen with session results
class GameOverScreen {
  constructor(persistence) {
    this.persistence = persistence;
    this.fadeIn = 0;
    this.fadeInDuration = 500; // ms
    this.startTime = Date.now();
  }
  
  render(ctx, sessionResult) {
    // Update fade in
    const elapsed = Date.now() - this.startTime;
    this.fadeIn = Math.min(elapsed / this.fadeInDuration, 1.0);
    
    const summary = sessionResult.summary;
    const highScoreResult = sessionResult.highScoreResult;
    
    ctx.save();
    
    // Semi-transparent background
    ctx.fillStyle = `rgba(0, 0, 0, ${0.8 * this.fadeIn})`;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Game Over title
    ctx.fillStyle = `rgba(255, 255, 255, ${this.fadeIn})`;
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', ctx.canvas.width / 2, 100);
    
    // Score panel
    const panelY = 160;
    this.renderScorePanel(ctx, summary, highScoreResult, panelY);
    
    // Session stats
    const statsY = 340;
    this.renderSessionStats(ctx, summary, statsY);
    
    // New high score indicator
    if (highScoreResult.isNewHighScore) {
      this.renderNewHighScore(ctx, highScoreResult);
    }
    
    // Instructions
    ctx.font = '20px Arial';
    ctx.fillStyle = `rgba(255, 255, 255, ${this.fadeIn})`;
    ctx.fillText('Press SPACE to restart', ctx.canvas.width / 2, ctx.canvas.height - 80);
    ctx.fillText('Press ESC for menu', ctx.canvas.width / 2, ctx.canvas.height - 50);
    
    ctx.restore();
  }
  
  renderScorePanel(ctx, summary, highScoreResult, y) {
    const centerX = ctx.canvas.width / 2;
    
    // Score
    ctx.font = 'bold 64px Arial';
    ctx.fillStyle = `rgba(255, 215, 0, ${this.fadeIn})`;
    ctx.fillText(summary.score, centerX, y);
    
    // High score
    ctx.font = '24px Arial';
    ctx.fillStyle = `rgba(200, 200, 200, ${this.fadeIn})`;
    ctx.fillText(`Best: ${this.persistence.getHighScore()}`, centerX, y + 50);
  }
  
  renderSessionStats(ctx, summary, y) {
    const centerX = ctx.canvas.width / 2;
    const leftX = centerX - 150;
    const rightX = centerX + 150;
    
    ctx.font = '18px Arial';
    ctx.textAlign = 'left';
    
    // Left column
    ctx.fillStyle = `rgba(170, 170, 170, ${this.fadeIn})`;
    ctx.fillText('Pipes Cleared:', leftX - 120, y);
    ctx.fillStyle = `rgba(255, 255, 255, ${this.fadeIn})`;
    ctx.fillText(String(summary.pipesCleared), leftX, y);
    
    ctx.fillStyle = `rgba(170, 170, 170, ${this.fadeIn})`;
    ctx.fillText('Max Combo:', leftX - 120, y + 30);
    ctx.fillStyle = `rgba(255, 255, 255, ${this.fadeIn})`;
    ctx.fillText(String(summary.maxCombo), leftX, y + 30);
    
    ctx.fillStyle = `rgba(170, 170, 170, ${this.fadeIn})`;
    ctx.fillText('Efficiency:', leftX - 120, y + 60);
    ctx.fillStyle = `rgba(255, 255, 255, ${this.fadeIn})`;
    ctx.fillText(`${summary.efficiency}%`, leftX, y + 60);
    
    // Right column
    ctx.fillStyle = `rgba(170, 170, 170, ${this.fadeIn})`;
    ctx.fillText('Duration:', rightX - 120, y);
    ctx.fillStyle = `rgba(255, 255, 255, ${this.fadeIn})`;
    ctx.fillText(this.formatDuration(summary.activeDuration), rightX, y);
    
    ctx.fillStyle = `rgba(170, 170, 170, ${this.fadeIn})`;
    ctx.fillText('Jumps:', rightX - 120, y + 30);
    ctx.fillStyle = `rgba(255, 255, 255, ${this.fadeIn})`;
    ctx.fillText(String(summary.jumps), rightX, y + 30);
    
    ctx.fillStyle = `rgba(170, 170, 170, ${this.fadeIn})`;
    ctx.fillText('Accuracy:', rightX - 120, y + 60);
    ctx.fillStyle = `rgba(255, 255, 255, ${this.fadeIn})`;
    ctx.fillText(`${summary.accuracy}%`, rightX, y + 60);
    
    ctx.textAlign = 'center';
  }
  
  renderNewHighScore(ctx, highScoreResult) {
    const centerX = ctx.canvas.width / 2;
    const y = 280;
    
    // Pulsing effect
    const pulse = Math.sin(Date.now() / 200) * 0.2 + 0.8;
    
    ctx.save();
    ctx.font = 'bold 28px Arial';
    ctx.fillStyle = `rgba(255, 215, 0, ${pulse * this.fadeIn})`;
    ctx.fillText('🎉 NEW HIGH SCORE! 🎉', centerX, y);
    ctx.fillStyle = `rgba(255, 255, 255, ${pulse * this.fadeIn})`;
    ctx.font = '20px Arial';
    ctx.fillText(`+${highScoreResult.improvement} points`, centerX, y + 30);
    ctx.restore();
  }
  
  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
}
```


---

## Best Practices Checklist

### Session Management
- [ ] Start session when game begins
- [ ] End session when game ends
- [ ] Track all relevant session metrics
- [ ] Handle pause/resume correctly
- [ ] Calculate accurate session duration
- [ ] Provide detailed session summaries

### High Score Tracking
- [ ] Load high score on initialization
- [ ] Save high score immediately on update
- [ ] Validate high score data
- [ ] Handle storage failures gracefully
- [ ] Provide high score metadata (date, session)
- [ ] Show visual feedback for new high scores

### Statistics
- [ ] Track comprehensive game statistics
- [ ] Update statistics after each session
- [ ] Maintain score history
- [ ] Implement milestone system
- [ ] Calculate derived metrics (averages, efficiency)
- [ ] Provide data export functionality

### Restart Functionality
- [ ] Reset all game state properly
- [ ] Clear all entities and systems
- [ ] Provide visual restart feedback
- [ ] Support quick restart (no delay)
- [ ] Execute restart callbacks
- [ ] Prevent restart spam

### Data Persistence
- [ ] Check localStorage availability
- [ ] Handle quota exceeded errors
- [ ] Validate all loaded data
- [ ] Provide fallback for storage failures
- [ ] Implement auto-save
- [ ] Support data export/import


### Error Handling
- [ ] Gracefully handle localStorage unavailable
- [ ] Handle JSON parse errors
- [ ] Validate imported data
- [ ] Provide user feedback on errors
- [ ] Log errors for debugging
- [ ] Implement retry logic where appropriate

### Performance
- [ ] Minimize localStorage writes
- [ ] Batch save operations
- [ ] Use auto-save with reasonable interval
- [ ] Avoid blocking operations
- [ ] Clean up old data periodically
- [ ] Monitor storage usage

---

## Testing Patterns

### Session Tests

**Test Session Lifecycle**:
```javascript
// ✅ GOOD: Session management tests
describe('GameSession', () => {
  let session;
  let config;
  
  beforeEach(() => {
    config = { collision: { invincibilityDuration: 120 } };
    session = new GameSession(config);
  });
  
  test('should start session correctly', () => {
    session.start();
    
    expect(session.isActive()).toBe(true);
    expect(session.startTime).toBeTruthy();
    expect(session.score).toBe(0);
  });
  
  test('should track jumps', () => {
    session.start();
    session.recordJump();
    session.recordJump();
    
    expect(session.jumps).toBe(2);
  });
  
  test('should calculate efficiency', () => {
    session.start();
    session.recordJump();
    session.recordJump();
    session.recordJump();
    session.recordPipeCleared();
    
    const efficiency = session.calculateEfficiency();
    expect(efficiency).toBe(33); // 1/3 * 100
  });
  
  test('should handle pause/resume', () => {
    session.start();
    const startTime = session.startTime;
    
    session.pause();
    expect(session.isPaused()).toBe(true);
    
    session.resume();
    expect(session.isPaused()).toBe(false);
    expect(session.pauseDuration).toBeGreaterThan(0);
  });
});
```


### Persistence Tests

**Test Data Persistence**:
```javascript
// ✅ GOOD: Persistence tests
describe('HighScoreManager', () => {
  let manager;
  let config;
  
  beforeEach(() => {
    config = { storage: { highScoreKey: 'test_highScore' } };
    manager = new HighScoreManager(config);
    localStorage.clear();
  });
  
  afterEach(() => {
    localStorage.clear();
  });
  
  test('should save and load high score', () => {
    manager.checkAndUpdateHighScore(42, 'session_123');
    
    // Create new manager to test loading
    const newManager = new HighScoreManager(config);
    expect(newManager.getHighScore()).toBe(42);
  });
  
  test('should only update when score is higher', () => {
    manager.checkAndUpdateHighScore(50, 'session_1');
    const result = manager.checkAndUpdateHighScore(30, 'session_2');
    
    expect(result.isNewHighScore).toBe(false);
    expect(manager.getHighScore()).toBe(50);
  });
  
  test('should handle storage errors gracefully', () => {
    // Mock localStorage to throw error
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = jest.fn(() => {
      throw new Error('Quota exceeded');
    });
    
    const result = manager.saveHighScore();
    expect(result).toBe(false);
    
    // Restore
    localStorage.setItem = originalSetItem;
  });
});

describe('StorageManager', () => {
  let storage;
  let config;
  
  beforeEach(() => {
    config = { storage: { prefix: 'test_' } };
    storage = new StorageManager(config);
    localStorage.clear();
  });
  
  afterEach(() => {
    localStorage.clear();
  });
  
  test('should save and load data', () => {
    const data = { score: 100, name: 'Player' };
    storage.save('gameData', data);
    
    const loaded = storage.load('gameData');
    expect(loaded).toEqual(data);
  });
  
  test('should return default value when key not found', () => {
    const loaded = storage.load('nonexistent', { default: true });
    expect(loaded).toEqual({ default: true });
  });
  
  test('should clear only prefixed keys', () => {
    storage.save('key1', 'value1');
    localStorage.setItem('other_key', 'other_value');
    
    storage.clear();
    
    expect(storage.load('key1')).toBeNull();
    expect(localStorage.getItem('other_key')).toBe('other_value');
  });
});
```


---

## Common Patterns

### Auto-Save Pattern

**Periodic Data Saving**:
```javascript
// ✅ GOOD: Auto-save implementation
class AutoSaveManager {
  constructor(persistence, interval = 30000) {
    this.persistence = persistence;
    this.interval = interval;
    this.timer = null;
    this.enabled = true;
  }
  
  start() {
    if (!this.enabled || this.timer) return;
    
    this.timer = setInterval(() => {
      this.save();
    }, this.interval);
    
    console.log(`Auto-save started (interval: ${this.interval}ms)`);
  }
  
  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log('Auto-save stopped');
    }
  }
  
  save() {
    try {
      this.persistence.saveAll();
      console.log('Auto-save completed');
    } catch (err) {
      console.error('Auto-save failed:', err);
    }
  }
  
  setEnabled(enabled) {
    this.enabled = enabled;
    if (enabled) {
      this.start();
    } else {
      this.stop();
    }
  }
  
  setInterval(ms) {
    this.interval = Math.max(1000, ms);
    if (this.timer) {
      this.stop();
      this.start();
    }
  }
}
```

### Retry Pattern

**Retry Failed Operations**:
```javascript
// ✅ GOOD: Retry logic for storage operations
class RetryManager {
  constructor(maxRetries = 3, delay = 1000) {
    this.maxRetries = maxRetries;
    this.delay = delay;
  }
  
  async retry(operation, context = 'operation') {
    let lastError;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (err) {
        lastError = err;
        console.warn(`${context} failed (attempt ${attempt}/${this.maxRetries}):`, err);
        
        if (attempt < this.maxRetries) {
          await this.wait(this.delay * attempt);
        }
      }
    }
    
    throw new Error(`${context} failed after ${this.maxRetries} attempts: ${lastError.message}`);
  }
  
  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Usage
const retryManager = new RetryManager(3, 1000);

async function saveWithRetry(data) {
  return retryManager.retry(
    () => localStorage.setItem('key', JSON.stringify(data)),
    'Save operation'
  );
}
```


### Migration Pattern

**Handle Data Version Changes**:
```javascript
// ✅ GOOD: Data migration system
class DataMigration {
  constructor() {
    this.currentVersion = '1.0.0';
    this.migrations = {
      '0.9.0': this.migrateFrom090,
      '0.8.0': this.migrateFrom080
    };
  }
  
  migrate(data) {
    if (!data.version) {
      console.warn('No version found, assuming latest');
      return data;
    }
    
    if (data.version === this.currentVersion) {
      return data;
    }
    
    console.log(`Migrating data from ${data.version} to ${this.currentVersion}`);
    
    let migratedData = { ...data };
    
    // Apply migrations in order
    const versions = Object.keys(this.migrations).sort();
    for (const version of versions) {
      if (this.isVersionOlder(data.version, version)) {
        migratedData = this.migrations[version](migratedData);
      }
    }
    
    migratedData.version = this.currentVersion;
    return migratedData;
  }
  
  migrateFrom090(data) {
    // Example: Add new field
    return {
      ...data,
      totalCollisions: 0
    };
  }
  
  migrateFrom080(data) {
    // Example: Rename field
    const { oldFieldName, ...rest } = data;
    return {
      ...rest,
      newFieldName: oldFieldName || 0
    };
  }
  
  isVersionOlder(version1, version2) {
    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);
    
    for (let i = 0; i < 3; i++) {
      if (v1Parts[i] < v2Parts[i]) return true;
      if (v1Parts[i] > v2Parts[i]) return false;
    }
    
    return false;
  }
}
```

---

## References

- **Design Document**: `.kiro/specs/flappy-kiro/design.md`
- **Requirements**: `.kiro/specs/flappy-kiro/requirements.md`
- **Domain Logic**: `.kiro/steering/flappy-kiro-domain.md`
- **Game Architecture**: `.kiro/steering/game-architecture-patterns.md`
- **LocalStorage API**: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
- **Web Storage Best Practices**: https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API
