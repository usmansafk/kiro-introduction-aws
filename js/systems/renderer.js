/**
 * Renderer System
 * Handles all canvas drawing operations
 */

import GameConfig from '../config.js';

class Renderer {
  constructor(ctx, config = GameConfig) {
    this.ctx = ctx;
    this.canvas = ctx.canvas;
    this.config = config;
    
    // Load colors from config
    this.backgroundColor = config.visual.backgroundColor;
    this.pipeColor = config.visual.pipeColor;
    this.pipeCapColor = config.visual.pipeCapColor;
    this.textColor = config.visual.textColor;
    this.overlayColor = config.visual.overlayColor;
  }
  
  /**
   * Clear canvas with background color
   */
  clear() {
    this.ctx.fillStyle = this.backgroundColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  /**
   * Render ghost sprite with rotation
   * @param {Ghost} ghost - Ghost entity to render
   */
  renderGhost(ghost) {
    this.ctx.save();
    this.ctx.translate(ghost.x + ghost.width / 2, ghost.y + ghost.height / 2);
    this.ctx.rotate(ghost.rotation * Math.PI / 180);
    this.ctx.drawImage(
      ghost.sprite,
      -ghost.width / 2,
      -ghost.height / 2,
      ghost.width,
      ghost.height
    );
    this.ctx.restore();
  }
  
  /**
   * Render pipe with top/bottom sections and caps
   * @param {Pipe} pipe - Pipe entity to render
   */
  renderPipe(pipe) {
    this.ctx.fillStyle = this.pipeColor;
    
    // Top pipe
    this.ctx.fillRect(pipe.x, 0, pipe.width, pipe.topHeight);
    
    // Bottom pipe
    this.ctx.fillRect(pipe.x, pipe.bottomY, pipe.width, pipe.bottomHeight);
    
    // Pipe caps (decorative)
    this.ctx.fillStyle = this.pipeCapColor;
    this.ctx.fillRect(pipe.x - 2, pipe.topHeight - 20, pipe.width + 4, 20);
    this.ctx.fillRect(pipe.x - 2, pipe.bottomY, pipe.width + 4, 20);
  }
  
  /**
   * Render score text at bottom of screen
   * @param {number} score - Current score
   * @param {number} highScore - High score
   */
  renderScore(score, highScore) {
    this.ctx.fillStyle = this.textColor;
    this.ctx.font = '20px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
      `Score: ${score} | High: ${highScore}`,
      this.canvas.width / 2,
      this.canvas.height - 20
    );
  }
  
  /**
   * Render main menu screen
   * @param {number} highScore - High score to display
   */
  renderMenu(highScore) {
    this.ctx.fillStyle = this.textColor;
    this.ctx.font = 'bold 48px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Flappy Kiro', this.canvas.width / 2, 150);
    
    this.ctx.font = '24px Arial';
    this.ctx.fillText(`High Score: ${highScore}`, this.canvas.width / 2, 220);
    
    this.ctx.font = '20px Arial';
    this.ctx.fillText(
      'Press SPACE or Click to Start',
      this.canvas.width / 2,
      300
    );
  }
  
  /**
   * Render pause overlay with semi-transparent background
   */
  renderPauseOverlay() {
    this.ctx.fillStyle = this.overlayColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = 'bold 48px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('PAUSED', this.canvas.width / 2, 200);
    
    this.ctx.font = '20px Arial';
    this.ctx.fillText(
      'Press SPACE to Resume',
      this.canvas.width / 2,
      260
    );
  }
  
  /**
   * Render game over screen
   * @param {number} score - Final score
   * @param {number} highScore - High score
   */
  renderGameOver(score, highScore) {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = 'bold 48px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('GAME OVER', this.canvas.width / 2, 150);
    
    this.ctx.font = '28px Arial';
    this.ctx.fillText(`Score: ${score}`, this.canvas.width / 2, 210);
    this.ctx.fillText(`High Score: ${highScore}`, this.canvas.width / 2, 250);
    
    this.ctx.font = '20px Arial';
    this.ctx.fillText(
      'Press SPACE or Click to Restart',
      this.canvas.width / 2,
      320
    );
  }
  
  /**
   * Apply screen shake offset to context
   * @param {Object} offset - Offset object with x and y properties
   */
  applyScreenShake(offset) {
    this.ctx.translate(offset.x, offset.y);
  }
  
  /**
   * Render particle effect
   * @param {Particle} particle - Particle to render
   */
  renderParticle(particle) {
    this.ctx.fillStyle = particle.color;
    this.ctx.beginPath();
    this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    this.ctx.fill();
  }
  
  /**
   * Render score indicator with fading effect
   * @param {ScoreIndicator} indicator - Score indicator to render
   */
  renderScoreIndicator(indicator) {
    this.ctx.save();
    this.ctx.globalAlpha = indicator.life;
    this.ctx.fillStyle = this.config.scoreIndicators.color;
    this.ctx.font = `bold ${this.config.scoreIndicators.fontSize}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`+${indicator.value}`, indicator.x, indicator.y);
    this.ctx.restore();
  }
  
  /**
   * Render invincibility indicator (flashing effect)
   * @param {Ghost} ghost - Ghost entity
   */
  renderInvincibilityIndicator(ghost) {
    // Flash effect during invincibility
    if (Math.floor(Date.now() / 100) % 2 === 0) {
      this.ctx.strokeStyle = '#FFD700';
      this.ctx.lineWidth = 2;
      const hitbox = ghost.getHitbox();
      this.ctx.strokeRect(hitbox.x, hitbox.y, hitbox.width, hitbox.height);
    }
  }
}

export default Renderer;
