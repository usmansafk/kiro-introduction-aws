/**
 * Unit tests for Game class
 * Tests core game loop functionality, delta time calculation, and initialization
 */

import Game from '../../js/game.js';
import GameConfig from '../../js/config.js';

describe('Game class', () => {
  let canvas;
  let game;
  
  beforeEach(() => {
    // Create a mock canvas element
    canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 600;
    document.body.appendChild(canvas);
  });
  
  afterEach(() => {
    if (game) {
      game.cleanup();
    }
    if (canvas && canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }
  });
  
  describe('Constructor', () => {
    test('should initialize with canvas and context', () => {
      game = new Game(canvas);
      
      expect(game.canvas).toBe(canvas);
      expect(game.ctx).toBeTruthy();
      expect(game.ctx).toBe(canvas.getContext('2d'));
    });
    
    test('should initialize with config', () => {
      game = new Game(canvas);
      
      expect(game.config).toBe(GameConfig);
    });
    
    test('should initialize subsystems as null', () => {
      game = new Game(canvas);
      
      expect(game.state).toBeNull();
      expect(game.physics).toBeNull();
      expect(game.collision).toBeNull();
      expect(game.renderer).toBeNull();
      expect(game.audio).toBeNull();
      expect(game.input).toBeNull();
      expect(game.storage).toBeNull();
    });
    
    test('should initialize entities object', () => {
      game = new Game(canvas);
      
      expect(game.entities).toBeDefined();
      expect(game.entities.ghost).toBeNull();
      expect(game.entities.pipes).toEqual([]);
      expect(game.entities.particles).toEqual([]);
      expect(game.entities.scoreIndicators).toEqual([]);
    });
    
    test('should initialize frame timing properties', () => {
      game = new Game(canvas);
      
      expect(game.lastFrameTime).toBe(0);
      expect(game.deltaTime).toBe(0);
    });
    
    test('should initialize game loop control properties', () => {
      game = new Game(canvas);
      
      expect(game.isRunning).toBe(false);
      expect(game.animationFrameId).toBeNull();
    });
  });
  
  describe('init() method', () => {
    test('should validate canvas context', async () => {
      game = new Game(canvas);
      
      await expect(game.init()).resolves.not.toThrow();
    });
    
    test('should throw error if canvas is null', async () => {
      game = new Game(null);
      
      await expect(game.init()).rejects.toThrow('Canvas not supported');
    });
    
    test('should start the game loop', async () => {
      game = new Game(canvas);
      
      await game.init();
      
      expect(game.isRunning).toBe(true);
      expect(game.animationFrameId).not.toBeNull();
    });
  });
  
  describe('gameLoop() method', () => {
    test('should calculate delta time', async () => {
      game = new Game(canvas);
      await game.init();
      
      // Simulate two frames
      const timestamp1 = 1000;
      const timestamp2 = 1016.66; // ~16.66ms later (60 FPS)
      
      game.lastFrameTime = timestamp1;
      game.gameLoop(timestamp2);
      
      // Delta time should be normalized to 120 FPS target
      // 16.66ms / 8.33ms = ~2.0
      expect(game.deltaTime).toBeCloseTo(2.0, 1);
    });
    
    test('should normalize delta time to 120 FPS target', async () => {
      game = new Game(canvas);
      await game.init();
      
      // Simulate one frame at exactly 120 FPS (8.33ms)
      const timestamp1 = 1000;
      const timestamp2 = 1008.33;
      
      game.lastFrameTime = timestamp1;
      game.gameLoop(timestamp2);
      
      // Delta time should be 1.0 for perfect 120 FPS frame
      expect(game.deltaTime).toBeCloseTo(1.0, 1);
    });
    
    test('should clamp delta time to prevent large jumps', async () => {
      game = new Game(canvas);
      await game.init();
      
      // Simulate a very large time jump (e.g., tab was inactive)
      const timestamp1 = 1000;
      const timestamp2 = 2000; // 1000ms later
      
      game.lastFrameTime = timestamp1;
      game.gameLoop(timestamp2);
      
      // Delta time should be clamped to maxDeltaTime (2.0)
      expect(game.deltaTime).toBeLessThanOrEqual(GameConfig.performance.maxDeltaTime);
      expect(game.deltaTime).toBe(GameConfig.performance.maxDeltaTime);
    });
    
    test('should update lastFrameTime', async () => {
      game = new Game(canvas);
      await game.init();
      
      const timestamp = 1234.56;
      game.gameLoop(timestamp);
      
      expect(game.lastFrameTime).toBe(timestamp);
    });
    
    test('should not run if isRunning is false', async () => {
      game = new Game(canvas);
      await game.init();
      
      game.stop();
      
      const initialDeltaTime = game.deltaTime;
      game.gameLoop(2000);
      
      // Delta time should not change if loop is not running
      expect(game.deltaTime).toBe(initialDeltaTime);
    });
  });
  
  describe('start() and stop() methods', () => {
    test('should start the game loop', async () => {
      game = new Game(canvas);
      // Don't call init() to test start() independently
      
      game.start();
      
      expect(game.isRunning).toBe(true);
      expect(game.animationFrameId).not.toBeNull();
    });
    
    test('should not start if already running', async () => {
      game = new Game(canvas);
      game.start();
      
      const firstFrameId = game.animationFrameId;
      game.start(); // Try to start again
      
      expect(game.animationFrameId).toBe(firstFrameId);
    });
    
    test('should stop the game loop', async () => {
      game = new Game(canvas);
      await game.init();
      
      game.stop();
      
      expect(game.isRunning).toBe(false);
      expect(game.animationFrameId).toBeNull();
    });
  });
  
  describe('Delta time normalization', () => {
    test('should normalize 60 FPS to 2.0 delta time', async () => {
      game = new Game(canvas);
      await game.init();
      
      // 60 FPS = 16.66ms per frame
      // Normalized: 16.66 / 8.33 = 2.0
      const deltaMs = 16.66;
      const timestamp1 = 1000;
      const timestamp2 = timestamp1 + deltaMs;
      
      game.lastFrameTime = timestamp1;
      game.gameLoop(timestamp2);
      
      expect(game.deltaTime).toBeCloseTo(2.0, 1);
    });
    
    test('should normalize 120 FPS to 1.0 delta time', async () => {
      game = new Game(canvas);
      await game.init();
      
      // 120 FPS = 8.33ms per frame
      // Normalized: 8.33 / 8.33 = 1.0
      const deltaMs = 8.33;
      const timestamp1 = 1000;
      const timestamp2 = timestamp1 + deltaMs;
      
      game.lastFrameTime = timestamp1;
      game.gameLoop(timestamp2);
      
      expect(game.deltaTime).toBeCloseTo(1.0, 1);
    });
    
    test('should normalize 30 FPS to 4.0 delta time', async () => {
      game = new Game(canvas);
      await game.init();
      
      // 30 FPS = 33.33ms per frame
      // Normalized: 33.33 / 8.33 = 4.0
      const deltaMs = 33.33;
      const timestamp1 = 1000;
      const timestamp2 = timestamp1 + deltaMs;
      
      game.lastFrameTime = timestamp1;
      game.gameLoop(timestamp2);
      
      expect(game.deltaTime).toBeCloseTo(4.0, 1);
    });
  });
  
  describe('Frame time clamping', () => {
    test('should clamp to maxDeltaTime from config', async () => {
      game = new Game(canvas);
      await game.init();
      
      // Simulate a huge time jump
      const timestamp1 = 1000;
      const timestamp2 = 5000; // 4000ms later
      
      game.lastFrameTime = timestamp1;
      game.gameLoop(timestamp2);
      
      expect(game.deltaTime).toBe(GameConfig.performance.maxDeltaTime);
    });
    
    test('should not clamp normal frame times', async () => {
      game = new Game(canvas);
      await game.init();
      
      // Normal frame time (60 FPS)
      const timestamp1 = 1000;
      const timestamp2 = 1016.66;
      
      game.lastFrameTime = timestamp1;
      game.gameLoop(timestamp2);
      
      expect(game.deltaTime).toBeLessThan(GameConfig.performance.maxDeltaTime);
    });
  });
  
  describe('render() method', () => {
    test('should clear canvas with background color', async () => {
      game = new Game(canvas);
      await game.init();
      
      const ctx = game.ctx;
      const fillRectSpy = jest.spyOn(ctx, 'fillRect');
      
      game.render();
      
      expect(fillRectSpy).toHaveBeenCalledWith(0, 0, canvas.width, canvas.height);
    });
    
    test('should render game title', async () => {
      game = new Game(canvas);
      await game.init();
      
      const ctx = game.ctx;
      const fillTextSpy = jest.spyOn(ctx, 'fillText');
      
      game.render();
      
      expect(fillTextSpy).toHaveBeenCalledWith(
        'Flappy Kiro',
        expect.any(Number),
        expect.any(Number)
      );
    });
  });
  
  describe('cleanup() method', () => {
    test('should stop the game loop', async () => {
      game = new Game(canvas);
      await game.init();
      
      game.cleanup();
      
      expect(game.isRunning).toBe(false);
      expect(game.animationFrameId).toBeNull();
    });
  });
});
