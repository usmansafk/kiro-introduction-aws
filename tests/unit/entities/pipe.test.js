/**
 * Unit tests for Pipe entity
 */

import Pipe from '../../../js/entities/pipe.js';
import GameConfig from '../../../js/config.js';

describe('Pipe Entity', () => {
  const canvasHeight = 600;
  const gapSize = 150;
  const gapY = 300;
  const x = 400;
  
  describe('Constructor', () => {
    test('should initialize with correct position', () => {
      const pipe = new Pipe(x, gapY, gapSize, canvasHeight);
      
      expect(pipe.x).toBe(x);
      expect(pipe.gapY).toBe(gapY);
      expect(pipe.gapSize).toBe(gapSize);
    });
    
    test('should initialize with correct width from config', () => {
      const pipe = new Pipe(x, gapY, gapSize, canvasHeight);
      
      expect(pipe.width).toBe(GameConfig.pipes.width);
    });
    
    test('should initialize as not scored', () => {
      const pipe = new Pipe(x, gapY, gapSize, canvasHeight);
      
      expect(pipe.scored).toBe(false);
    });
    
    test('should store canvas height', () => {
      const pipe = new Pipe(x, gapY, gapSize, canvasHeight);
      
      expect(pipe.canvasHeight).toBe(canvasHeight);
    });
    
    test('should calculate top pipe height correctly', () => {
      const pipe = new Pipe(x, gapY, gapSize, canvasHeight);
      
      // Top height should be gap center minus half gap size
      expect(pipe.topHeight).toBe(gapY - (gapSize / 2));
    });
    
    test('should calculate bottom pipe Y position correctly', () => {
      const pipe = new Pipe(x, gapY, gapSize, canvasHeight);
      
      // Bottom Y should be gap center plus half gap size
      expect(pipe.bottomY).toBe(gapY + (gapSize / 2));
    });
    
    test('should calculate bottom pipe height correctly', () => {
      const pipe = new Pipe(x, gapY, gapSize, canvasHeight);
      
      // Bottom height should be canvas height minus bottom Y
      expect(pipe.bottomHeight).toBe(canvasHeight - pipe.bottomY);
    });
  });
  
  describe('getTopHitbox()', () => {
    test('should return hitbox with correct position and dimensions', () => {
      const pipe = new Pipe(x, gapY, gapSize, canvasHeight);
      const hitbox = pipe.getTopHitbox();
      
      expect(hitbox.x).toBe(x);
      expect(hitbox.y).toBe(0);
      expect(hitbox.width).toBe(GameConfig.pipes.width);
      expect(hitbox.height).toBe(pipe.topHeight);
    });
    
    test('should update hitbox position when pipe moves', () => {
      const pipe = new Pipe(x, gapY, gapSize, canvasHeight);
      pipe.x = 350;
      
      const hitbox = pipe.getTopHitbox();
      
      expect(hitbox.x).toBe(350);
    });
  });
  
  describe('getBottomHitbox()', () => {
    test('should return hitbox with correct position and dimensions', () => {
      const pipe = new Pipe(x, gapY, gapSize, canvasHeight);
      const hitbox = pipe.getBottomHitbox();
      
      expect(hitbox.x).toBe(x);
      expect(hitbox.y).toBe(pipe.bottomY);
      expect(hitbox.width).toBe(GameConfig.pipes.width);
      expect(hitbox.height).toBe(pipe.bottomHeight);
    });
    
    test('should update hitbox position when pipe moves', () => {
      const pipe = new Pipe(x, gapY, gapSize, canvasHeight);
      pipe.x = 350;
      
      const hitbox = pipe.getBottomHitbox();
      
      expect(hitbox.x).toBe(350);
    });
  });
  
  describe('update()', () => {
    test('should move pipe left by speed * deltaTime', () => {
      const pipe = new Pipe(x, gapY, gapSize, canvasHeight);
      const speed = 2;
      const deltaTime = 1;
      
      const initialX = pipe.x;
      pipe.update(deltaTime, speed);
      
      expect(pipe.x).toBe(initialX - speed * deltaTime);
    });
    
    test('should handle different delta times', () => {
      const pipe = new Pipe(x, gapY, gapSize, canvasHeight);
      const speed = 2;
      const deltaTime = 0.5;
      
      const initialX = pipe.x;
      pipe.update(deltaTime, speed);
      
      expect(pipe.x).toBe(initialX - speed * deltaTime);
    });
    
    test('should handle different speeds', () => {
      const pipe = new Pipe(x, gapY, gapSize, canvasHeight);
      const speed = 5;
      const deltaTime = 1;
      
      const initialX = pipe.x;
      pipe.update(deltaTime, speed);
      
      expect(pipe.x).toBe(initialX - speed * deltaTime);
    });
  });
  
  describe('isOffScreen()', () => {
    test('should return false when pipe is on screen', () => {
      const pipe = new Pipe(x, gapY, gapSize, canvasHeight);
      
      expect(pipe.isOffScreen()).toBe(false);
    });
    
    test('should return false when pipe right edge is at x=0', () => {
      const pipe = new Pipe(-GameConfig.pipes.width, gapY, gapSize, canvasHeight);
      
      expect(pipe.isOffScreen()).toBe(false);
    });
    
    test('should return true when pipe is completely off screen', () => {
      const pipe = new Pipe(-GameConfig.pipes.width - 1, gapY, gapSize, canvasHeight);
      
      expect(pipe.isOffScreen()).toBe(true);
    });
    
    test('should return true when pipe is far off screen', () => {
      const pipe = new Pipe(-200, gapY, gapSize, canvasHeight);
      
      expect(pipe.isOffScreen()).toBe(true);
    });
  });
  
  describe('hasPassedGhost()', () => {
    test('should return false when ghost has not passed pipe', () => {
      const pipe = new Pipe(x, gapY, gapSize, canvasHeight);
      const ghostX = 100;
      
      expect(pipe.hasPassedGhost(ghostX)).toBe(false);
    });
    
    test('should return false when ghost is at pipe right edge', () => {
      const pipe = new Pipe(x, gapY, gapSize, canvasHeight);
      const ghostX = x + GameConfig.pipes.width;
      
      expect(pipe.hasPassedGhost(ghostX)).toBe(false);
    });
    
    test('should return true when ghost has passed pipe', () => {
      const pipe = new Pipe(x, gapY, gapSize, canvasHeight);
      const ghostX = x + GameConfig.pipes.width + 1;
      
      expect(pipe.hasPassedGhost(ghostX)).toBe(true);
    });
    
    test('should return false when pipe is already scored', () => {
      const pipe = new Pipe(x, gapY, gapSize, canvasHeight);
      pipe.scored = true;
      const ghostX = x + GameConfig.pipes.width + 1;
      
      expect(pipe.hasPassedGhost(ghostX)).toBe(false);
    });
  });
  
  describe('markScored()', () => {
    test('should set scored to true', () => {
      const pipe = new Pipe(x, gapY, gapSize, canvasHeight);
      
      pipe.markScored();
      
      expect(pipe.scored).toBe(true);
    });
    
    test('should prevent hasPassedGhost from returning true', () => {
      const pipe = new Pipe(x, gapY, gapSize, canvasHeight);
      const ghostX = x + GameConfig.pipes.width + 1;
      
      pipe.markScored();
      
      expect(pipe.hasPassedGhost(ghostX)).toBe(false);
    });
  });
  
  describe('reset()', () => {
    test('should reset position to specified coordinates', () => {
      const pipe = new Pipe(x, gapY, gapSize, canvasHeight);
      pipe.x = 100;
      
      const newX = 500;
      const newGapY = 250;
      const newGapSize = 180;
      
      pipe.reset(newX, newGapY, newGapSize);
      
      expect(pipe.x).toBe(newX);
      expect(pipe.gapY).toBe(newGapY);
      expect(pipe.gapSize).toBe(newGapSize);
    });
    
    test('should reset scored flag to false', () => {
      const pipe = new Pipe(x, gapY, gapSize, canvasHeight);
      pipe.scored = true;
      
      pipe.reset(500, 250, 180);
      
      expect(pipe.scored).toBe(false);
    });
    
    test('should recalculate top pipe height', () => {
      const pipe = new Pipe(x, gapY, gapSize, canvasHeight);
      
      const newGapY = 250;
      const newGapSize = 180;
      pipe.reset(500, newGapY, newGapSize);
      
      expect(pipe.topHeight).toBe(newGapY - (newGapSize / 2));
    });
    
    test('should recalculate bottom pipe Y position', () => {
      const pipe = new Pipe(x, gapY, gapSize, canvasHeight);
      
      const newGapY = 250;
      const newGapSize = 180;
      pipe.reset(500, newGapY, newGapSize);
      
      expect(pipe.bottomY).toBe(newGapY + (newGapSize / 2));
    });
    
    test('should recalculate bottom pipe height', () => {
      const pipe = new Pipe(x, gapY, gapSize, canvasHeight);
      
      const newGapY = 250;
      const newGapSize = 180;
      pipe.reset(500, newGapY, newGapSize);
      
      expect(pipe.bottomHeight).toBe(canvasHeight - (newGapY + (newGapSize / 2)));
    });
  });
  
  describe('Edge Cases', () => {
    test('should handle gap at top of screen', () => {
      const topGapY = 100;
      const pipe = new Pipe(x, topGapY, gapSize, canvasHeight);
      
      expect(pipe.topHeight).toBe(topGapY - (gapSize / 2));
      expect(pipe.bottomY).toBe(topGapY + (gapSize / 2));
    });
    
    test('should handle gap at bottom of screen', () => {
      const bottomGapY = 500;
      const pipe = new Pipe(x, bottomGapY, gapSize, canvasHeight);
      
      expect(pipe.topHeight).toBe(bottomGapY - (gapSize / 2));
      expect(pipe.bottomY).toBe(bottomGapY + (gapSize / 2));
    });
    
    test('should handle zero delta time in update', () => {
      const pipe = new Pipe(x, gapY, gapSize, canvasHeight);
      const initialX = pipe.x;
      
      pipe.update(0, 2);
      
      expect(pipe.x).toBe(initialX);
    });
    
    test('should handle zero speed in update', () => {
      const pipe = new Pipe(x, gapY, gapSize, canvasHeight);
      const initialX = pipe.x;
      
      pipe.update(1, 0);
      
      expect(pipe.x).toBe(initialX);
    });
    
    test('should handle large gap size', () => {
      const largeGapSize = 300;
      const pipe = new Pipe(x, gapY, largeGapSize, canvasHeight);
      
      expect(pipe.topHeight).toBe(gapY - (largeGapSize / 2));
      expect(pipe.bottomY).toBe(gapY + (largeGapSize / 2));
    });
    
    test('should handle small gap size', () => {
      const smallGapSize = 50;
      const pipe = new Pipe(x, gapY, smallGapSize, canvasHeight);
      
      expect(pipe.topHeight).toBe(gapY - (smallGapSize / 2));
      expect(pipe.bottomY).toBe(gapY + (smallGapSize / 2));
    });
  });
});
