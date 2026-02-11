import GameConfig from '../config.js';

/**
 * AudioManager - Manages all game audio including sound effects
 * Handles loading, playing, volume control, and muting
 */
class AudioManager {
  constructor(config = GameConfig) {
    this.config = config;
    this.sounds = {};
    this.muted = false;
    this.volume = config.audio.defaultVolume;
  }

  /**
   * Load a sound from a file path
   * @param {string} name - Identifier for the sound
   * @param {string} path - Path to the audio file
   */
  loadSound(name, path) {
    const audio = new Audio(path);
    audio.volume = this.volume;
    this.sounds[name] = audio;
  }

  /**
   * Play a sound by name
   * Clones the audio element to allow overlapping plays
   * @param {string} name - Identifier of the sound to play
   */
  playSound(name) {
    if (this.muted) return;
    
    const sound = this.sounds[name];
    if (!sound) {
      console.warn(`Sound "${name}" not found`);
      return;
    }

    try {
      // Clone the audio to allow overlapping plays
      const clone = sound.cloneNode();
      clone.volume = this.volume;
      clone.play().catch(err => {
        console.warn(`Failed to play sound "${name}":`, err);
      });
    } catch (err) {
      console.warn(`Error playing sound "${name}":`, err);
    }
  }

  /**
   * Set volume for all sounds
   * @param {number} volume - Volume level (0.0 to 1.0)
   */
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    
    // Update volume for all loaded sounds
    for (const sound of Object.values(this.sounds)) {
      sound.volume = this.volume;
    }
  }

  /**
   * Toggle mute state
   * @returns {boolean} New muted state
   */
  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  /**
   * Preload all game assets
   * Loads jump and game over sounds from config
   */
  preloadAssets() {
    this.loadSound('jump', this.config.audio.jumpSound);
    this.loadSound('gameOver', this.config.audio.gameOverSound);
  }
}

export default AudioManager;
