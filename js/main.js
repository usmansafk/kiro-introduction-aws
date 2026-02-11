/**
 * Main entry point for Flappy Kiro
 * Initializes the game when the page loads
 */

import GameConfig from './config.js';
import Game from './game.js';

// Wait for DOM to be ready
window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas');
  
  if (!canvas) {
    console.error('Canvas element not found');
    return;
  }
  
  // Get 2D rendering context
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    console.error('Canvas 2D context not supported in this browser');
    return;
  }
  
  // Set canvas dimensions from config
  canvas.width = GameConfig.canvas.width;
  canvas.height = GameConfig.canvas.height;
  
  console.log('Flappy Kiro - Initializing...');
  console.log('Canvas size:', canvas.width, 'x', canvas.height);
  
  // Initialize and start the game
  try {
    const game = new Game(canvas);
    game.init();
    console.log('Game initialized successfully');
  } catch (error) {
    console.error('Failed to initialize game:', error);
    
    // Show error message on canvas
    ctx.fillStyle = '#FF0000';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Failed to initialize game', canvas.width / 2, canvas.height / 2);
    ctx.font = '14px Arial';
    ctx.fillText('Check console for details', canvas.width / 2, canvas.height / 2 + 30);
  }
});
