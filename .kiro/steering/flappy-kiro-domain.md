---
inclusion: auto
---

# Flappy Kiro Domain Logic

## Overview

This document defines domain-specific patterns for Flappy Kiro including game state management, score persistence, difficulty progression, and game session handling. These patterns ensure consistent game behavior and data integrity.

## Core Domain Principles

1. **State Consistency**: Game state transitions are predictable and atomic
2. **Data Persistence**: Player progress is reliably saved and restored
3. **Fair Progression**: Difficulty increases smoothly and predictably
4. **Session Integrity**: Game sessions are properly initialized and cleaned up
5. **Validation**: All game data is validated before use

---

## Game State Management

### State Machine Architecture

**Robust State Management**:
```javascript
// ✅ GOOD: Complete state machine for Flappy Kiro
const GameStates = Object.freeze({
  LOADING: 'loading',
  MENU: 'menu',
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAME_OVER: 'game_over',
  TRANSITION: 'transition'
});

class GameStateManager {
  constructor(config) {
    this.config = config;
    this.currentState = GameStates.LOADING;
    this.previousState = null;
    this.stateData = new Map();
    this.stateHistory = [];
    this.maxHistorySize = 10;
    
    // State-specific data
    this.score = 0;
    this.highScore = 0;
    this.sessionStartTime = 0;
    this.sessionDuration = 0;
    this.attempts = 0;
    
    // Invincibility tracking
    this.invincibilityFrames = 0;
    this.invincibilityDuration = config.collision.invincibilityDuration;
    
    // Transition tracking
    this.transitionCallback = null;
    this.transitionDuration = 0;
  }

  
  setState(newState, data = {}) {
    // Validate state transition
    if (!this.isValidTransition(this.currentState, newState)) {
      console.warn(`Invalid state transition: ${this.currentState} -> ${newState}`);
      return false;
    }
    
    // Store previous state
    this.previousState = this.currentState;
    
    // Exit current state
    this.onStateExit(this.currentState);
    
    // Update state
    this.currentState = newState;
    this.stateData.set(newState, data);
    
    // Add to history
    this.stateHistory.push({
      state: newState,
      timestamp: Date.now(),
      data: { ...data }
    });
    
    if (this.stateHistory.length > this.maxHistorySize) {
      this.stateHistory.shift();
    }
    
    // Enter new state
    this.onStateEnter(newState, data);
    
    return true;
  }
  
  isValidTransition(fromState, toState) {
    const validTransitions = {
      [GameStates.LOADING]: [GameStates.MENU],
      [GameStates.MENU]: [GameStates.PLAYING, GameStates.TRANSITION],
      [GameStates.PLAYING]: [GameStates.PAUSED, GameStates.GAME_OVER, GameStates.TRANSITION],
      [GameStates.PAUSED]: [GameStates.PLAYING, GameStates.MENU, GameStates.TRANSITION],
      [GameStates.GAME_OVER]: [GameStates.MENU, GameStates.PLAYING, GameStates.TRANSITION],
      [GameStates.TRANSITION]: [GameStates.MENU, GameStates.PLAYING, GameStates.GAME_OVER]
    };
    
    return validTransitions[fromState]?.includes(toState) || false;
  }
  
  onStateEnter(state, data) {
    console.log(`Entering state: ${state}`, data);
    
    switch (state) {
      case GameStates.MENU:
        this.onEnterMenu();
        break;
      case GameStates.PLAYING:
        this.onEnterPlaying();
        break;
      case GameStates.PAUSED:
        this.onEnterPaused();
        break;
      case GameStates.GAME_OVER:
        this.onEnterGameOver();
        break;
    }
  }
  
  onStateExit(state) {
    console.log(`Exiting state: ${state}`);
    
    switch (state) {
      case GameStates.PLAYING:
        this.onExitPlaying();
        break;
      case GameStates.PAUSED:
        this.onExitPaused();
        break;
    }
  }
  
  onEnterMenu() {
    // Reset session data
    this.sessionDuration = 0;
  }
  
  onEnterPlaying() {
    // Start new session
    this.sessionStartTime = Date.now();
    this.score = 0;
    this.attempts++;
    
    // Start invincibility
    this.startInvincibility();
  }
  
  onExitPlaying() {
    // Calculate session duration
    this.sessionDuration = Date.now() - this.sessionStartTime;
  }
  
  onEnterPaused() {
    // Store pause time for accurate duration tracking
    this.pauseStartTime = Date.now();
  }
  
  onExitPaused() {
    // Adjust session start time to exclude pause duration
    const pauseDuration = Date.now() - this.pauseStartTime;
    this.sessionStartTime += pauseDuration;
  }
  
  onEnterGameOver() {
    // Update high score if needed
    if (this.score > this.highScore) {
      this.highScore = this.score;
    }
  }
  
  // State queries
  isLoading() { return this.currentState === GameStates.LOADING; }
  isMenu() { return this.currentState === GameStates.MENU; }
  isPlaying() { return this.currentState === GameStates.PLAYING; }
  isPaused() { return this.currentState === GameStates.PAUSED; }
  isGameOver() { return this.currentState === GameStates.GAME_OVER; }
  isTransitioning() { return this.currentState === GameStates.TRANSITION; }
  
  // Score management
  incrementScore(amount = 1) {
    if (!this.isPlaying()) return;
    
    this.score += amount;
    
    if (this.score > this.highScore) {
      this.highScore = this.score;
    }
  }
  
  resetScore() {
    this.score = 0;
  }
  
  getScore() {
    return this.score;
  }
  
  getHighScore() {
    return this.highScore;
  }
  
  setHighScore(score) {
    this.highScore = Math.max(this.highScore, score);
  }
  
  // Invincibility management
  startInvincibility() {
    this.invincibilityFrames = this.invincibilityDuration;
  }
  
  updateInvincibility() {
    if (this.invincibilityFrames > 0) {
      this.invincibilityFrames--;
    }
  }
  
  isInvincible() {
    return this.invincibilityFrames > 0;
  }
  
  // Session tracking
  getSessionDuration() {
    if (this.isPlaying()) {
      return Date.now() - this.sessionStartTime;
    }
    return this.sessionDuration;
  }
  
  getAttempts() {
    return this.attempts;
  }
  
  // State data access
  getStateData(state) {
    return this.stateData.get(state);
  }
  
  getCurrentStateData() {
    return this.stateData.get(this.currentState);
  }
  
  // State history
  getStateHistory() {
    return [...this.stateHistory];
  }
  
  getPreviousState() {
    return this.previousState;
  }
}
```


### State Persistence

**Save and Restore State**:
```javascript
// ✅ GOOD: Serialize and restore game state
class StatePersistence {
  constructor(stateManager) {
    this.stateManager = stateManager;
    this.storageKey = 'flappyKiro_gameState';
  }
  
  saveState() {
    const state = {
      highScore: this.stateManager.highScore,
      attempts: this.stateManager.attempts,
      lastPlayed: Date.now(),
      version: '1.0.0'
    };
    
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(state));
      return true;
    } catch (err) {
      console.error('Failed to save state:', err);
      return false;
    }
  }
  
  loadState() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) return null;
      
      const state = JSON.parse(data);
      
      // Validate version
      if (state.version !== '1.0.0') {
        console.warn('State version mismatch, resetting');
        return null;
      }
      
      return state;
    } catch (err) {
      console.error('Failed to load state:', err);
      return null;
    }
  }
  
  restoreState() {
    const state = this.loadState();
    if (!state) return false;
    
    this.stateManager.setHighScore(state.highScore || 0);
    this.stateManager.attempts = state.attempts || 0;
    
    return true;
  }
  
  clearState() {
    try {
      localStorage.removeItem(this.storageKey);
      return true;
    } catch (err) {
      console.error('Failed to clear state:', err);
      return false;
    }
  }
}
```

---

## Score Persistence

### Comprehensive Score Management

**Score Storage with Statistics**:
```javascript
// ✅ GOOD: Complete score tracking system
class ScoreManager {
  constructor(config) {
    this.config = config;
    this.storageKey = config.storage.highScoreKey || 'flappyKiroHighScore';
    this.statsKey = 'flappyKiro_stats';
    
    // Current session
    this.currentScore = 0;
    this.highScore = 0;
    this.sessionBest = 0;
    
    // Statistics
    this.stats = {
      totalGames: 0,
      totalScore: 0,
      averageScore: 0,
      bestStreak: 0,
      currentStreak: 0,
      totalPlayTime: 0,
      lastPlayed: null,
      scoreHistory: []
    };
    
    this.loadData();
  }
  
  loadData() {
    // Load high score
    this.loadHighScore();
    
    // Load statistics
    this.loadStatistics();
  }
  
  loadHighScore() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const score = parseInt(stored, 10);
        if (!isNaN(score) && score >= 0) {
          this.highScore = score;
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
      localStorage.setItem(this.storageKey, this.highScore.toString());
      return true;
    } catch (err) {
      console.error('Failed to save high score:', err);
      return false;
    }
  }
  
  loadStatistics() {
    try {
      const stored = localStorage.getItem(this.statsKey);
      if (stored) {
        const stats = JSON.parse(stored);
        this.stats = { ...this.stats, ...stats };
        console.log('Statistics loaded:', this.stats);
      }
    } catch (err) {
      console.error('Failed to load statistics:', err);
    }
  }
  
  saveStatistics() {
    try {
      localStorage.setItem(this.statsKey, JSON.stringify(this.stats));
      return true;
    } catch (err) {
      console.error('Failed to save statistics:', err);
      return false;
    }
  }
  
  // Score operations
  setScore(score) {
    this.currentScore = Math.max(0, score);
    
    // Update session best
    if (this.currentScore > this.sessionBest) {
      this.sessionBest = this.currentScore;
    }
    
    // Update high score
    if (this.currentScore > this.highScore) {
      this.highScore = this.currentScore;
      this.saveHighScore();
    }
  }
  
  incrementScore(amount = 1) {
    this.setScore(this.currentScore + amount);
  }
  
  resetScore() {
    this.currentScore = 0;
  }
  
  // Session management
  startSession() {
    this.currentScore = 0;
    this.sessionBest = 0;
  }
  
  endSession(duration) {
    // Update statistics
    this.stats.totalGames++;
    this.stats.totalScore += this.currentScore;
    this.stats.averageScore = this.stats.totalScore / this.stats.totalGames;
    this.stats.totalPlayTime += duration;
    this.stats.lastPlayed = Date.now();
    
    // Update streak
    if (this.currentScore > 0) {
      this.stats.currentStreak++;
      if (this.stats.currentStreak > this.stats.bestStreak) {
        this.stats.bestStreak = this.stats.currentStreak;
      }
    } else {
      this.stats.currentStreak = 0;
    }
    
    // Add to history (keep last 100)
    this.stats.scoreHistory.push({
      score: this.currentScore,
      timestamp: Date.now(),
      duration: duration
    });
    
    if (this.stats.scoreHistory.length > 100) {
      this.stats.scoreHistory.shift();
    }
    
    // Save statistics
    this.saveStatistics();
  }
  
  // Getters
  getCurrentScore() {
    return this.currentScore;
  }
  
  getHighScore() {
    return this.highScore;
  }
  
  getSessionBest() {
    return this.sessionBest;
  }
  
  getStatistics() {
    return { ...this.stats };
  }
  
  // Statistics queries
  getAverageScore() {
    return Math.round(this.stats.averageScore);
  }
  
  getTotalGames() {
    return this.stats.totalGames;
  }
  
  getBestStreak() {
    return this.stats.bestStreak;
  }
  
  getCurrentStreak() {
    return this.stats.currentStreak;
  }
  
  getTotalPlayTime() {
    return this.stats.totalPlayTime;
  }
  
  getRecentScores(count = 10) {
    return this.stats.scoreHistory.slice(-count);
  }
  
  // Data management
  clearAllData() {
    try {
      localStorage.removeItem(this.storageKey);
      localStorage.removeItem(this.statsKey);
      
      this.currentScore = 0;
      this.highScore = 0;
      this.sessionBest = 0;
      this.stats = {
        totalGames: 0,
        totalScore: 0,
        averageScore: 0,
        bestStreak: 0,
        currentStreak: 0,
        totalPlayTime: 0,
        lastPlayed: null,
        scoreHistory: []
      };
      
      return true;
    } catch (err) {
      console.error('Failed to clear data:', err);
      return false;
    }
  }
  
  exportData() {
    return {
      highScore: this.highScore,
      stats: this.stats,
      exportDate: Date.now()
    };
  }
  
  importData(data) {
    if (!data || typeof data !== 'object') return false;
    
    try {
      if (data.highScore !== undefined) {
        this.highScore = data.highScore;
        this.saveHighScore();
      }
      
      if (data.stats) {
        this.stats = { ...this.stats, ...data.stats };
        this.saveStatistics();
      }
      
      return true;
    } catch (err) {
      console.error('Failed to import data:', err);
      return false;
    }
  }
}
```


---

## Difficulty Progression

### Dynamic Difficulty System

**Smooth Difficulty Scaling**:
```javascript
// ✅ GOOD: Progressive difficulty system
class DifficultyManager {
  constructor(config) {
    this.config = config;
    
    // Base values from config
    this.basePipeSpeed = config.pipes.baseSpeed;
    this.maxPipeSpeed = config.pipes.maxSpeed;
    this.basePipeSpacing = config.pipes.spacing;
    this.minPipeSpacing = config.pipes.minSpacing || 180;
    this.baseGapSize = config.pipes.gapSize;
    this.minGapSize = config.pipes.minGapSize || 120;
    
    // Current values
    this.currentPipeSpeed = this.basePipeSpeed;
    this.currentPipeSpacing = this.basePipeSpacing;
    this.currentGapSize = this.baseGapSize;
    
    // Progression settings
    this.speedIncreaseThreshold = config.pipes.speedIncreaseThreshold || 5;
    this.speedIncrement = config.pipes.speedIncrement || 0.2;
    this.spacingDecreaseThreshold = 10;
    this.spacingDecrement = 5;
    this.gapDecreaseThreshold = 15;
    this.gapDecrement = 2;
    
    // Difficulty level
    this.difficultyLevel = 1;
    this.maxDifficultyLevel = 10;
  }
  
  updateDifficulty(score) {
    // Calculate difficulty level based on score
    const newLevel = Math.min(
      Math.floor(score / 5) + 1,
      this.maxDifficultyLevel
    );
    
    if (newLevel !== this.difficultyLevel) {
      this.difficultyLevel = newLevel;
      this.onDifficultyLevelChange(newLevel);
    }
    
    // Update pipe speed
    if (score > 0 && score % this.speedIncreaseThreshold === 0) {
      this.increasePipeSpeed();
    }
    
    // Update pipe spacing
    if (score > 0 && score % this.spacingDecreaseThreshold === 0) {
      this.decreasePipeSpacing();
    }
    
    // Update gap size
    if (score > 0 && score % this.gapDecreaseThreshold === 0) {
      this.decreaseGapSize();
    }
  }
  
  increasePipeSpeed() {
    const newSpeed = this.currentPipeSpeed + this.speedIncrement;
    this.currentPipeSpeed = Math.min(newSpeed, this.maxPipeSpeed);
  }
  
  decreasePipeSpacing() {
    const newSpacing = this.currentPipeSpacing - this.spacingDecrement;
    this.currentPipeSpacing = Math.max(newSpacing, this.minPipeSpacing);
  }
  
  decreaseGapSize() {
    const newGapSize = this.currentGapSize - this.gapDecrement;
    this.currentGapSize = Math.max(newGapSize, this.minGapSize);
  }
  
  onDifficultyLevelChange(level) {
    console.log(`Difficulty level increased to ${level}`);
  }
  
  // Getters
  getPipeSpeed() {
    return this.currentPipeSpeed;
  }
  
  getPipeSpacing() {
    return this.currentPipeSpacing;
  }
  
  getGapSize() {
    return this.currentGapSize;
  }
  
  getDifficultyLevel() {
    return this.difficultyLevel;
  }
  
  getDifficultyPercent() {
    return (this.difficultyLevel / this.maxDifficultyLevel) * 100;
  }
  
  // Reset
  reset() {
    this.currentPipeSpeed = this.basePipeSpeed;
    this.currentPipeSpacing = this.basePipeSpacing;
    this.currentGapSize = this.baseGapSize;
    this.difficultyLevel = 1;
  }
  
  // Difficulty presets
  setDifficultyPreset(preset) {
    const presets = {
      easy: {
        pipeSpeed: this.basePipeSpeed * 0.8,
        pipeSpacing: this.basePipeSpacing * 1.2,
        gapSize: this.baseGapSize * 1.2
      },
      normal: {
        pipeSpeed: this.basePipeSpeed,
        pipeSpacing: this.basePipeSpacing,
        gapSize: this.baseGapSize
      },
      hard: {
        pipeSpeed: this.basePipeSpeed * 1.2,
        pipeSpacing: this.basePipeSpacing * 0.8,
        gapSize: this.baseGapSize * 0.8
      },
      extreme: {
        pipeSpeed: this.maxPipeSpeed,
        pipeSpacing: this.minPipeSpacing,
        gapSize: this.minGapSize
      }
    };
    
    const settings = presets[preset];
    if (settings) {
      this.currentPipeSpeed = settings.pipeSpeed;
      this.currentPipeSpacing = settings.pipeSpacing;
      this.currentGapSize = settings.gapSize;
    }
  }
  
  // Difficulty curve visualization
  getDifficultyCurve(maxScore = 50) {
    const curve = [];
    
    for (let score = 0; score <= maxScore; score++) {
      const tempManager = new DifficultyManager(this.config);
      tempManager.updateDifficulty(score);
      
      curve.push({
        score,
        speed: tempManager.getPipeSpeed(),
        spacing: tempManager.getPipeSpacing(),
        gapSize: tempManager.getGapSize(),
        level: tempManager.getDifficultyLevel()
      });
    }
    
    return curve;
  }
}
```


### Adaptive Difficulty

**Player Skill-Based Adjustment**:
```javascript
// ✅ GOOD: Adaptive difficulty based on player performance
class AdaptiveDifficultyManager extends DifficultyManager {
  constructor(config) {
    super(config);
    
    // Performance tracking
    this.recentScores = [];
    this.maxRecentScores = 10;
    this.performanceLevel = 'normal'; // beginner, normal, advanced, expert
    
    // Adaptive settings
    this.adaptiveEnabled = true;
    this.adaptiveThreshold = 5; // Games before adapting
  }
  
  recordGameResult(score, duration) {
    this.recentScores.push({ score, duration, timestamp: Date.now() });
    
    if (this.recentScores.length > this.maxRecentScores) {
      this.recentScores.shift();
    }
    
    // Update performance level
    if (this.recentScores.length >= this.adaptiveThreshold) {
      this.updatePerformanceLevel();
    }
  }
  
  updatePerformanceLevel() {
    if (!this.adaptiveEnabled) return;
    
    const avgScore = this.getAverageRecentScore();
    const avgDuration = this.getAverageRecentDuration();
    
    // Classify player skill
    let newLevel;
    if (avgScore < 5) {
      newLevel = 'beginner';
    } else if (avgScore < 15) {
      newLevel = 'normal';
    } else if (avgScore < 30) {
      newLevel = 'advanced';
    } else {
      newLevel = 'expert';
    }
    
    if (newLevel !== this.performanceLevel) {
      this.performanceLevel = newLevel;
      this.applyPerformanceAdjustments();
    }
  }
  
  applyPerformanceAdjustments() {
    const adjustments = {
      beginner: {
        speedMultiplier: 0.85,
        spacingMultiplier: 1.15,
        gapMultiplier: 1.15
      },
      normal: {
        speedMultiplier: 1.0,
        spacingMultiplier: 1.0,
        gapMultiplier: 1.0
      },
      advanced: {
        speedMultiplier: 1.1,
        spacingMultiplier: 0.95,
        gapMultiplier: 0.95
      },
      expert: {
        speedMultiplier: 1.2,
        spacingMultiplier: 0.9,
        gapMultiplier: 0.9
      }
    };
    
    const adj = adjustments[this.performanceLevel];
    
    // Apply adjustments to base values
    this.basePipeSpeed = this.config.pipes.baseSpeed * adj.speedMultiplier;
    this.basePipeSpacing = this.config.pipes.spacing * adj.spacingMultiplier;
    this.baseGapSize = this.config.pipes.gapSize * adj.gapMultiplier;
    
    console.log(`Adaptive difficulty adjusted for ${this.performanceLevel} player`);
  }
  
  getAverageRecentScore() {
    if (this.recentScores.length === 0) return 0;
    const sum = this.recentScores.reduce((acc, game) => acc + game.score, 0);
    return sum / this.recentScores.length;
  }
  
  getAverageRecentDuration() {
    if (this.recentScores.length === 0) return 0;
    const sum = this.recentScores.reduce((acc, game) => acc + game.duration, 0);
    return sum / this.recentScores.length;
  }
  
  getPerformanceLevel() {
    return this.performanceLevel;
  }
  
  setAdaptiveEnabled(enabled) {
    this.adaptiveEnabled = enabled;
  }
  
  isAdaptiveEnabled() {
    return this.adaptiveEnabled;
  }
}
```

---

## Game Session Management

### Session Lifecycle

**Complete Session Handling**:
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
    this.highScore = 0;
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
  }
  
  resume() {
    if (!this.active || !this.paused) return;
    
    this.paused = false;
    const pauseTime = Date.now() - this.pauseStartTime;
    this.pauseDuration += pauseTime;
    this.pauseStartTime = null;
  }
  
  // Event tracking
  recordJump() {
    this.jumps++;
  }
  
  recordCollision() {
    this.collisions++;
    this.currentCombo = 0;
  }
  
  recordPipeCleared() {
    this.pipesCleared++;
    this.currentCombo++;
    
    if (this.currentCombo > this.maxCombo) {
      this.maxCombo = this.currentCombo;
    }
  }
  
  recordScore(score) {
    this.score = score;
  }
  
  recordFrame(fps) {
    this.frameCount++;
    this.averageFPS = ((this.averageFPS * (this.frameCount - 1)) + fps) / this.frameCount;
    this.minFPS = Math.min(this.minFPS, fps);
    this.maxFPS = Math.max(this.maxFPS, fps);
  }
  
  // Session queries
  getDuration() {
    if (!this.startTime) return 0;
    
    const endTime = this.endTime || Date.now();
    return endTime - this.startTime - this.pauseDuration;
  }
  
  getActiveDuration() {
    return this.getDuration() - this.pauseDuration;
  }
  
  getSessionSummary() {
    return {
      sessionId: this.sessionId,
      duration: this.getDuration(),
      activeDuration: this.getActiveDuration(),
      score: this.score,
      jumps: this.jumps,
      collisions: this.collisions,
      pipesCleared: this.pipesCleared,
      maxCombo: this.maxCombo,
      averageFPS: Math.round(this.averageFPS),
      minFPS: this.minFPS === Infinity ? 0 : Math.round(this.minFPS),
      maxFPS: Math.round(this.maxFPS),
      efficiency: this.calculateEfficiency(),
      startTime: this.startTime,
      endTime: this.endTime
    };
  }
  
  calculateEfficiency() {
    if (this.jumps === 0) return 0;
    
    // Efficiency = pipes cleared / jumps made
    return (this.pipesCleared / this.jumps) * 100;
  }
  
  isActive() {
    return this.active;
  }
  
  isPaused() {
    return this.paused;
  }
}
```


---

## Data Validation and Integrity

### Input Validation

**Validate All Game Data**:
```javascript
// ✅ GOOD: Comprehensive data validation
class GameDataValidator {
  static validateScore(score) {
    if (typeof score !== 'number') {
      console.error('Invalid score type:', typeof score);
      return 0;
    }
    
    if (!Number.isFinite(score)) {
      console.error('Score is not finite:', score);
      return 0;
    }
    
    if (score < 0) {
      console.error('Score is negative:', score);
      return 0;
    }
    
    // Sanity check - unreasonably high score
    if (score > 10000) {
      console.warn('Suspiciously high score:', score);
      return Math.min(score, 10000);
    }
    
    return Math.floor(score);
  }
  
  static validateHighScore(highScore, currentScore) {
    const validatedHigh = this.validateScore(highScore);
    const validatedCurrent = this.validateScore(currentScore);
    
    return Math.max(validatedHigh, validatedCurrent);
  }
  
  static validateDifficulty(difficulty) {
    const valid = {
      pipeSpeed: null,
      pipeSpacing: null,
      gapSize: null
    };
    
    // Validate pipe speed
    if (typeof difficulty.pipeSpeed === 'number' && 
        difficulty.pipeSpeed > 0 && 
        difficulty.pipeSpeed <= 10) {
      valid.pipeSpeed = difficulty.pipeSpeed;
    }
    
    // Validate pipe spacing
    if (typeof difficulty.pipeSpacing === 'number' && 
        difficulty.pipeSpacing >= 100 && 
        difficulty.pipeSpacing <= 500) {
      valid.pipeSpacing = difficulty.pipeSpacing;
    }
    
    // Validate gap size
    if (typeof difficulty.gapSize === 'number' && 
        difficulty.gapSize >= 80 && 
        difficulty.gapSize <= 250) {
      valid.gapSize = difficulty.gapSize;
    }
    
    return valid;
  }
  
  static validateSessionData(session) {
    if (!session || typeof session !== 'object') {
      return null;
    }
    
    return {
      score: this.validateScore(session.score || 0),
      duration: Math.max(0, session.duration || 0),
      jumps: Math.max(0, Math.floor(session.jumps || 0)),
      collisions: Math.max(0, Math.floor(session.collisions || 0)),
      pipesCleared: Math.max(0, Math.floor(session.pipesCleared || 0))
    };
  }
  
  static validateStorageData(data) {
    if (!data) return null;
    
    try {
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      
      return {
        highScore: this.validateScore(parsed.highScore || 0),
        attempts: Math.max(0, Math.floor(parsed.attempts || 0)),
        lastPlayed: parsed.lastPlayed || null,
        version: parsed.version || '1.0.0'
      };
    } catch (err) {
      console.error('Failed to validate storage data:', err);
      return null;
    }
  }
}
```

### Data Sanitization

**Sanitize User Input**:
```javascript
// ✅ GOOD: Sanitize and normalize data
class DataSanitizer {
  static sanitizePlayerName(name) {
    if (typeof name !== 'string') return 'Player';
    
    // Remove special characters
    let sanitized = name.replace(/[^a-zA-Z0-9\s-_]/g, '');
    
    // Trim and limit length
    sanitized = sanitized.trim().substring(0, 20);
    
    // Default if empty
    return sanitized || 'Player';
  }
  
  static sanitizeConfigValue(value, min, max, defaultValue) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return defaultValue;
    }
    
    return Math.max(min, Math.min(max, value));
  }
  
  static sanitizeTimestamp(timestamp) {
    if (typeof timestamp !== 'number' || !Number.isFinite(timestamp)) {
      return Date.now();
    }
    
    // Ensure timestamp is reasonable (not in future, not too old)
    const now = Date.now();
    const oneYearAgo = now - (365 * 24 * 60 * 60 * 1000);
    
    if (timestamp > now || timestamp < oneYearAgo) {
      return now;
    }
    
    return timestamp;
  }
}
```

---

## Complete Domain Integration

### Game Domain Controller

**Unified Domain Management**:
```javascript
// ✅ GOOD: Complete domain controller
class FlappyKiroDomain {
  constructor(config) {
    this.config = config;
    
    // Initialize subsystems
    this.stateManager = new GameStateManager(config);
    this.scoreManager = new ScoreManager(config);
    this.difficultyManager = new AdaptiveDifficultyManager(config);
    this.session = null;
    
    // Persistence
    this.statePersistence = new StatePersistence(this.stateManager);
    
    // Load saved data
    this.initialize();
  }
  
  initialize() {
    // Load persisted state
    this.statePersistence.restoreState();
    
    // Load scores
    this.scoreManager.loadData();
    
    // Set high score in state manager
    this.stateManager.setHighScore(this.scoreManager.getHighScore());
    
    // Transition to menu
    this.stateManager.setState(GameStates.MENU);
  }
  
  // Game lifecycle
  startGame() {
    // Create new session
    this.session = new GameSession(this.config);
    this.session.start();
    
    // Reset difficulty
    this.difficultyManager.reset();
    
    // Start score tracking
    this.scoreManager.startSession();
    
    // Transition to playing
    this.stateManager.setState(GameStates.PLAYING);
  }
  
  endGame() {
    if (!this.session) return;
    
    // End session
    const summary = this.session.end();
    
    // Record game result
    this.difficultyManager.recordGameResult(
      summary.score,
      summary.duration
    );
    
    // End score session
    this.scoreManager.endSession(summary.duration);
    
    // Save state
    this.statePersistence.saveState();
    
    // Transition to game over
    this.stateManager.setState(GameStates.GAME_OVER, { summary });
    
    return summary;
  }
  
  pauseGame() {
    if (!this.stateManager.isPlaying()) return;
    
    this.session?.pause();
    this.stateManager.setState(GameStates.PAUSED);
  }
  
  resumeGame() {
    if (!this.stateManager.isPaused()) return;
    
    this.session?.resume();
    this.stateManager.setState(GameStates.PLAYING);
  }
  
  restartGame() {
    this.endGame();
    this.startGame();
  }
  
  returnToMenu() {
    if (this.session?.isActive()) {
      this.endGame();
    }
    
    this.stateManager.setState(GameStates.MENU);
  }
  
  // Game events
  onJump() {
    if (!this.stateManager.isPlaying()) return;
    
    this.session?.recordJump();
  }
  
  onCollision() {
    if (!this.stateManager.isPlaying()) return;
    
    this.session?.recordCollision();
    this.endGame();
  }
  
  onPipeCleared() {
    if (!this.stateManager.isPlaying()) return;
    
    // Increment score
    this.scoreManager.incrementScore(1);
    this.stateManager.incrementScore(1);
    
    // Record in session
    this.session?.recordPipeCleared();
    this.session?.recordScore(this.scoreManager.getCurrentScore());
    
    // Update difficulty
    this.difficultyManager.updateDifficulty(this.scoreManager.getCurrentScore());
  }
  
  onFrame(fps) {
    this.session?.recordFrame(fps);
  }
  
  // State queries
  getState() {
    return this.stateManager.currentState;
  }
  
  isPlaying() {
    return this.stateManager.isPlaying();
  }
  
  isPaused() {
    return this.stateManager.isPaused();
  }
  
  isGameOver() {
    return this.stateManager.isGameOver();
  }
  
  isInvincible() {
    return this.stateManager.isInvincible();
  }
  
  // Score queries
  getScore() {
    return this.scoreManager.getCurrentScore();
  }
  
  getHighScore() {
    return this.scoreManager.getHighScore();
  }
  
  getStatistics() {
    return this.scoreManager.getStatistics();
  }
  
  // Difficulty queries
  getDifficulty() {
    return {
      pipeSpeed: this.difficultyManager.getPipeSpeed(),
      pipeSpacing: this.difficultyManager.getPipeSpacing(),
      gapSize: this.difficultyManager.getGapSize(),
      level: this.difficultyManager.getDifficultyLevel()
    };
  }
  
  // Session queries
  getSessionSummary() {
    return this.session?.getSessionSummary() || null;
  }
  
  // Update
  update(deltaTime) {
    // Update invincibility
    if (this.stateManager.isPlaying()) {
      this.stateManager.updateInvincibility();
    }
  }
  
  // Data management
  exportGameData() {
    return {
      state: {
        highScore: this.stateManager.getHighScore(),
        attempts: this.stateManager.getAttempts()
      },
      scores: this.scoreManager.exportData(),
      difficulty: {
        performanceLevel: this.difficultyManager.getPerformanceLevel(),
        recentScores: this.difficultyManager.recentScores
      },
      exportDate: Date.now(),
      version: '1.0.0'
    };
  }
  
  importGameData(data) {
    if (!data || data.version !== '1.0.0') {
      console.error('Invalid or incompatible game data');
      return false;
    }
    
    try {
      // Import scores
      if (data.scores) {
        this.scoreManager.importData(data.scores);
      }
      
      // Update state
      if (data.state) {
        this.stateManager.setHighScore(data.state.highScore || 0);
      }
      
      return true;
    } catch (err) {
      console.error('Failed to import game data:', err);
      return false;
    }
  }
  
  clearAllData() {
    this.scoreManager.clearAllData();
    this.statePersistence.clearState();
    this.difficultyManager.reset();
    this.stateManager.setHighScore(0);
  }
}
```


---

## Usage Examples

### Basic Game Flow

**Complete Game Implementation**:
```javascript
// ✅ GOOD: Using domain controller in game
class Game {
  constructor(canvas, config) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.config = config;
    
    // Initialize domain
    this.domain = new FlappyKiroDomain(config);
    
    // Initialize other systems
    this.renderer = new Renderer(this.ctx, config);
    this.input = new InputHandler(canvas);
    this.audio = new AudioManager(config);
    
    // Bind input handlers
    this.setupInputHandlers();
  }
  
  setupInputHandlers() {
    this.input.onJump(() => this.handleJump());
    this.input.onPause(() => this.handlePause());
  }
  
  handleJump() {
    const state = this.domain.getState();
    
    if (state === GameStates.MENU) {
      this.domain.startGame();
    } else if (state === GameStates.PLAYING) {
      this.ghost.jump();
      this.domain.onJump();
    } else if (state === GameStates.GAME_OVER) {
      this.domain.startGame();
    }
  }
  
  handlePause() {
    if (this.domain.isPlaying()) {
      this.domain.pauseGame();
    } else if (this.domain.isPaused()) {
      this.domain.resumeGame();
    }
  }
  
  update(deltaTime) {
    // Update domain
    this.domain.update(deltaTime);
    
    // Only update game when playing
    if (!this.domain.isPlaying()) return;
    
    // Update game entities
    this.updateGhost(deltaTime);
    this.updatePipes(deltaTime);
    
    // Check collisions
    if (!this.domain.isInvincible()) {
      this.checkCollisions();
    }
    
    // Check scoring
    this.checkScoring();
  }
  
  updatePipes(deltaTime) {
    const difficulty = this.domain.getDifficulty();
    
    for (const pipe of this.pipes) {
      pipe.update(deltaTime, difficulty.pipeSpeed);
    }
  }
  
  checkCollisions() {
    const collision = this.collisionSystem.check(this.ghost, this.pipes);
    
    if (collision) {
      this.domain.onCollision();
      this.audio.playSound('collision');
    }
  }
  
  checkScoring() {
    for (const pipe of this.pipes) {
      if (pipe.hasPassedGhost(this.ghost.x) && !pipe.scored) {
        pipe.markScored();
        this.domain.onPipeCleared();
        this.audio.playSound('score');
      }
    }
  }
  
  render() {
    const state = this.domain.getState();
    
    if (state === GameStates.MENU) {
      this.renderMenu();
    } else if (state === GameStates.PLAYING || state === GameStates.PAUSED) {
      this.renderGame();
      
      if (state === GameStates.PAUSED) {
        this.renderPauseOverlay();
      }
    } else if (state === GameStates.GAME_OVER) {
      this.renderGameOver();
    }
  }
  
  renderGame() {
    // Render game entities
    this.renderer.clear();
    this.renderer.renderPipes(this.pipes);
    this.renderer.renderGhost(this.ghost);
    
    // Render HUD
    this.renderer.renderScore(
      this.domain.getScore(),
      this.domain.getHighScore()
    );
    
    // Render difficulty indicator
    const difficulty = this.domain.getDifficulty();
    this.renderer.renderDifficultyLevel(difficulty.level);
  }
  
  renderGameOver() {
    const summary = this.domain.getSessionSummary();
    const stats = this.domain.getStatistics();
    
    this.renderer.renderGameOverScreen({
      score: summary.score,
      highScore: this.domain.getHighScore(),
      efficiency: summary.efficiency,
      averageScore: stats.averageScore,
      totalGames: stats.totalGames
    });
  }
}
```

### Statistics Display

**Show Player Statistics**:
```javascript
// ✅ GOOD: Display comprehensive statistics
class StatisticsScreen {
  constructor(domain) {
    this.domain = domain;
  }
  
  render(ctx) {
    const stats = this.domain.getStatistics();
    const difficulty = this.domain.getDifficulty();
    
    ctx.save();
    
    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Title
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Statistics', ctx.canvas.width / 2, 50);
    
    // Stats
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    
    const x = 50;
    let y = 100;
    const lineHeight = 30;
    
    const statLines = [
      `High Score: ${stats.highScore}`,
      `Total Games: ${stats.totalGames}`,
      `Average Score: ${stats.averageScore.toFixed(1)}`,
      `Best Streak: ${stats.bestStreak}`,
      `Current Streak: ${stats.currentStreak}`,
      `Total Play Time: ${this.formatDuration(stats.totalPlayTime)}`,
      ``,
      `Current Difficulty: Level ${difficulty.level}`,
      `Performance: ${this.domain.difficultyManager.getPerformanceLevel()}`
    ];
    
    for (const line of statLines) {
      ctx.fillText(line, x, y);
      y += lineHeight;
    }
    
    ctx.restore();
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

---

## Best Practices Checklist

### State Management
- [ ] Use state machine for all game states
- [ ] Validate all state transitions
- [ ] Track state history for debugging
- [ ] Handle state-specific initialization and cleanup
- [ ] Persist critical state data

### Score Management
- [ ] Validate all score values
- [ ] Save high score immediately on update
- [ ] Track comprehensive statistics
- [ ] Handle localStorage failures gracefully
- [ ] Provide data export/import functionality

### Difficulty Progression
- [ ] Start with comfortable base difficulty
- [ ] Increase difficulty gradually
- [ ] Cap maximum difficulty
- [ ] Consider adaptive difficulty based on player skill
- [ ] Test difficulty curve thoroughly

### Session Management
- [ ] Track all relevant session metrics
- [ ] Handle pause/resume correctly
- [ ] Calculate accurate session duration
- [ ] Provide detailed session summaries
- [ ] Clean up sessions properly

### Data Integrity
- [ ] Validate all input data
- [ ] Sanitize user-provided values
- [ ] Handle corrupted data gracefully
- [ ] Version all persisted data
- [ ] Provide data migration paths

---

## References

- **Design Document**: `.kiro/specs/flappy-kiro/design.md`
- **Requirements**: `.kiro/specs/flappy-kiro/requirements.md`
- **Game Architecture**: `.kiro/steering/game-architecture-patterns.md`
- **Game Mechanics**: `.kiro/steering/game-mechanics.md`
- **LocalStorage API**: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage

