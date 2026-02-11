/**
 * Unit tests for Ghost entity
 */

import Ghost from '../../../js/entities/ghost.js';
import GameConfig from '../../../js/config.js';

describe('Ghost Entity', () => {
  let mockSprite;
  
  beforeEach(() => {
    // Create a mock sprite image
    mockSprite = {
      width: 34,
      height: 24
    };
  });
  
  describe('Constructor', () => {
    test('should initialize with correct position', () => {
      const ghost = new Ghost(100, 200, mockSprite);
      
      expect(ghost.x).toBe(100);
      expect(ghost.y).toBe(200);
    });
    
    test('should initialize with correct dimensions from config', () => {
      const ghost = new Ghost(100, 200, mockSprite);
      
      expect(ghost.width).toBe(GameConfig.ghost.width);
      expect(ghost.height).toBe(GameConfig.ghost.height);
    });
    
    test('should initialize with zero velocity', () => {
      const ghost = new Ghost(100, 200, mockSprite);
      
      expect(ghost.velocity).toBe(0);
    });
    
    test('should initialize with zero rotation', () => {
      const ghost = new Ghost(100, 200, mockSprite);
      
      expect(ghost.rotation).toBe(0);
    });
    
    test('should store sprite reference', () => {
      const ghost = new Ghost(100, 200, mockSprite);
      
      expect(ghost.sprite).toBe(mockSprite);
    });
    
    test('should initialize hitbox from config', () => {
      const ghost = new Ghost(100, 200, mockSprite);
      
      expect(ghost.hitbox.width).toBe(GameConfig.ghost.hitboxWidth);
      expect(ghost.hitbox.height).toBe(GameConfig.ghost.hitboxHeight);
      expect(ghost.hitbox.offsetX).toBe(GameConfig.ghost.hitboxOffsetX);
      expect(ghost.hitbox.offsetY).toBe(GameConfig.ghost.hitboxOffsetY);
    });
    
    test('should have hitbox smaller than sprite for forgiving collision', () => {
      const ghost = new Ghost(100, 200, mockSprite);
      
      expect(ghost.hitbox.width).toBeLessThan(ghost.width);
      expect(ghost.hitbox.height).toBeLessThan(ghost.height);
    });
  });
  
  describe('getHitbox()', () => {
    test('should return hitbox with correct position and dimensions', () => {
      const ghost = new Ghost(100, 200, mockSprite);
      const hitbox = ghost.getHitbox();
      
      expect(hitbox.x).toBe(100 + GameConfig.ghost.hitboxOffsetX);
      expect(hitbox.y).toBe(200 + GameConfig.ghost.hitboxOffsetY);
      expect(hitbox.width).toBe(GameConfig.ghost.hitboxWidth);
      expect(hitbox.height).toBe(GameConfig.ghost.hitboxHeight);
    });
    
    test('should update hitbox position when ghost moves', () => {
      const ghost = new Ghost(100, 200, mockSprite);
      ghost.y = 250;
      
      const hitbox = ghost.getHitbox();
      
      expect(hitbox.y).toBe(250 + GameConfig.ghost.hitboxOffsetY);
    });
  });
  
  describe('jump()', () => {
    test('should set velocity to jump velocity', () => {
      const ghost = new Ghost(100, 200, mockSprite);
      const jumpVelocity = -10;
      
      ghost.jump(jumpVelocity);
      
      expect(ghost.velocity).toBe(jumpVelocity);
    });
    
    test('should override current velocity', () => {
      const ghost = new Ghost(100, 200, mockSprite);
      ghost.velocity = 5;
      const jumpVelocity = -10;
      
      ghost.jump(jumpVelocity);
      
      expect(ghost.velocity).toBe(jumpVelocity);
    });
  });
  
  describe('update()', () => {
    test('should apply gravity to velocity', () => {
      const ghost = new Ghost(100, 200, mockSprite);
      const gravity = 0.6;
      const deltaTime = 1;
      
      const initialVelocity = ghost.velocity;
      ghost.update(deltaTime, gravity, 12, -12);
      
      expect(ghost.velocity).toBe(initialVelocity + gravity * deltaTime);
    });
    
    test('should clamp velocity to terminal velocity', () => {
      const ghost = new Ghost(100, 200, mockSprite);
      ghost.velocity = 15; // Above terminal velocity
      const terminalVelocity = 12;
      
      ghost.update(1, 0.6, terminalVelocity, -12);
      
      expect(ghost.velocity).toBe(terminalVelocity);
    });
    
    test('should clamp velocity to maximum upward velocity', () => {
      const ghost = new Ghost(100, 200, mockSprite);
      ghost.velocity = -15; // More negative than max upward
      const maxUpwardVelocity = -12;
      
      ghost.update(1, 0.6, 12, maxUpwardVelocity);
      
      expect(ghost.velocity).toBe(maxUpwardVelocity);
    });
    
    test('should update position based on velocity', () => {
      const ghost = new Ghost(100, 200, mockSprite);
      ghost.velocity = 5;
      const deltaTime = 1;
      
      const initialY = ghost.y;
      ghost.update(deltaTime, 0.6, 12, -12);
      
      // Position should change by velocity * deltaTime (plus gravity effect)
      expect(ghost.y).toBeGreaterThan(initialY);
    });
    
    test('should update rotation based on velocity', () => {
      const ghost = new Ghost(100, 200, mockSprite);
      ghost.velocity = 5;
      
      ghost.update(1, 0.6, 12, -12);
      
      // Rotation should be positive when falling
      expect(ghost.rotation).toBeGreaterThan(0);
    });
    
    test('should clamp rotation to -25 to +25 degrees', () => {
      const ghost = new Ghost(100, 200, mockSprite);
      ghost.velocity = 20; // Very high velocity
      
      ghost.update(1, 0.6, 12, -12);
      
      expect(ghost.rotation).toBeLessThanOrEqual(25);
      expect(ghost.rotation).toBeGreaterThanOrEqual(-25);
    });
  });
  
  describe('reset()', () => {
    test('should reset position to specified coordinates', () => {
      const ghost = new Ghost(100, 200, mockSprite);
      ghost.y = 300;
      ghost.x = 150;
      
      ghost.reset(100, 200);
      
      expect(ghost.x).toBe(100);
      expect(ghost.y).toBe(200);
    });
    
    test('should reset velocity to zero', () => {
      const ghost = new Ghost(100, 200, mockSprite);
      ghost.velocity = 5;
      
      ghost.reset(100, 200);
      
      expect(ghost.velocity).toBe(0);
    });
    
    test('should reset rotation to zero', () => {
      const ghost = new Ghost(100, 200, mockSprite);
      ghost.rotation = 15;
      
      ghost.reset(100, 200);
      
      expect(ghost.rotation).toBe(0);
    });
  });
  
  describe('Edge Cases', () => {
    test('should handle zero delta time', () => {
      const ghost = new Ghost(100, 200, mockSprite);
      const initialY = ghost.y;
      
      ghost.update(0, 0.6, 12, -12);
      
      expect(ghost.y).toBe(initialY);
    });
    
    test('should handle negative gravity (upward)', () => {
      const ghost = new Ghost(100, 200, mockSprite);
      const initialVelocity = ghost.velocity;
      
      ghost.update(1, -0.6, 12, -12);
      
      expect(ghost.velocity).toBeLessThan(initialVelocity);
    });
  });
});
