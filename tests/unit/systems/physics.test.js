/**
 * Unit tests for PhysicsEngine
 * Requirements: 1.2, 1.1.1, 1.1.3, 1.1.4, 1.1.5, 2.1.4, 2.1.8, 2.1.9
 */

import PhysicsEngine from '../../../js/systems/physics.js';
import GameConfig from '../../../js/config.js';

describe('PhysicsEngine', () => {
  let physics;
  
  beforeEach(() => {
    physics = new PhysicsEngine();
  });
  
  describe('Initialization', () => {
    test('should load gravity from config', () => {
      expect(physics.gravity).toBe(GameConfig.physics.gravity);
    });
    
    test('should load jump velocity from config', () => {
      expect(physics.jumpVelocity).toBe(GameConfig.physics.jumpVelocity);
    });
    
    test('should load terminal velocity from config', () => {
      expect(physics.terminalVelocity).toBe(GameConfig.physics.terminalVelocity);
    });
    
    test('should load max upward velocity from config', () => {
      expect(physics.maxUpwardVelocity).toBe(GameConfig.physics.maxUpwardVelocity);
    });
    
    test('should load pipe spacing from config', () => {
      expect(physics.pipeSpacing).toBe(GameConfig.pipes.spacing);
    });
    
    test('should load gap size from config', () => {
      expect(physics.gapSize).toBe(GameConfig.pipes.gapSize);
    });
    
    test('should load min gap Y from config', () => {
      expect(physics.minGapY).toBe(GameConfig.pipes.minGapY);
    });
    
    test('should load max gap Y from config', () => {
      expect(physics.maxGapY).toBe(GameConfig.pipes.maxGapY);
    });
    
    test('should initialize pipe speed to base speed', () => {
      expect(physics.pipeSpeed).toBe(GameConfig.pipes.baseSpeed);
    });
    
    test('should load max pipe speed from config', () => {
      expect(physics.maxPipeSpeed).toBe(GameConfig.pipes.maxSpeed);
    });
    
    test('should load speed increase threshold from config', () => {
      expect(physics.speedIncreaseThreshold).toBe(GameConfig.pipes.speedIncreaseThreshold);
    });
    
    test('should load speed increment from config', () => {
      expect(physics.speedIncrement).toBe(GameConfig.pipes.speedIncrement);
    });
  });
  
  describe('applyGravity()', () => {
    test('should increase entity velocity by gravity * deltaTime', () => {
      const entity = { velocity: 0 };
      const deltaTime = 1;
      
      physics.applyGravity(entity, deltaTime);
      
      expect(entity.velocity).toBe(physics.gravity * deltaTime);
    });
    
    test('should apply gravity over multiple frames', () => {
      const entity = { velocity: 0 };
      const deltaTime = 1;
      
      physics.applyGravity(entity, deltaTime);
      const velocityAfterFrame1 = entity.velocity;
      
      physics.applyGravity(entity, deltaTime);
      
      expect(entity.velocity).toBeGreaterThan(velocityAfterFrame1);
    });
    
    test('should clamp velocity to terminal velocity', () => {
      const entity = { velocity: 15 }; // Above terminal velocity
      const deltaTime = 1;
      
      physics.applyGravity(entity, deltaTime);
      
      expect(entity.velocity).toBe(physics.terminalVelocity);
    });
    
    test('should clamp velocity to max upward velocity', () => {
      const entity = { velocity: -15 }; // Above max upward velocity
      const deltaTime = 1;
      
      physics.applyGravity(entity, deltaTime);
      
      expect(entity.velocity).toBe(physics.maxUpwardVelocity);
    });
    
    test('should work with fractional delta time', () => {
      const entity = { velocity: 0 };
      const deltaTime = 0.5;
      
      physics.applyGravity(entity, deltaTime);
      
      expect(entity.velocity).toBe(physics.gravity * deltaTime);
    });
  });
  
  describe('updatePosition()', () => {
    test('should update entity Y position by velocity * deltaTime', () => {
      const entity = { y: 100, velocity: 5 };
      const deltaTime = 1;
      
      physics.updatePosition(entity, deltaTime);
      
      expect(entity.y).toBe(105);
    });
    
    test('should move entity downward with positive velocity', () => {
      const entity = { y: 100, velocity: 10 };
      const deltaTime = 1;
      
      physics.updatePosition(entity, deltaTime);
      
      expect(entity.y).toBeGreaterThan(100);
    });
    
    test('should move entity upward with negative velocity', () => {
      const entity = { y: 100, velocity: -10 };
      const deltaTime = 1;
      
      physics.updatePosition(entity, deltaTime);
      
      expect(entity.y).toBeLessThan(100);
    });
    
    test('should work with fractional delta time', () => {
      const entity = { y: 100, velocity: 10 };
      const deltaTime = 0.5;
      
      physics.updatePosition(entity, deltaTime);
      
      expect(entity.y).toBe(105);
    });
    
    test('should not change position when velocity is 0', () => {
      const entity = { y: 100, velocity: 0 };
      const deltaTime = 1;
      
      physics.updatePosition(entity, deltaTime);
      
      expect(entity.y).toBe(100);
    });
  });
  
  describe('generateGapPosition()', () => {
    test('should return a value within valid range', () => {
      const gapY = physics.generateGapPosition();
      
      expect(gapY).toBeGreaterThanOrEqual(physics.minGapY);
      expect(gapY).toBeLessThanOrEqual(physics.maxGapY);
    });
    
    test('should generate different values on multiple calls', () => {
      const positions = new Set();
      
      for (let i = 0; i < 10; i++) {
        positions.add(physics.generateGapPosition());
      }
      
      // Should have at least some variation (not all identical)
      expect(positions.size).toBeGreaterThan(1);
    });
    
    test('should never return value below minGapY', () => {
      for (let i = 0; i < 100; i++) {
        const gapY = physics.generateGapPosition();
        expect(gapY).toBeGreaterThanOrEqual(physics.minGapY);
      }
    });
    
    test('should never return value above maxGapY', () => {
      for (let i = 0; i < 100; i++) {
        const gapY = physics.generateGapPosition();
        expect(gapY).toBeLessThanOrEqual(physics.maxGapY);
      }
    });
  });
  
  describe('increaseDifficulty()', () => {
    test('should increase pipe speed at threshold score', () => {
      const initialSpeed = physics.pipeSpeed;
      const thresholdScore = physics.speedIncreaseThreshold;
      
      physics.increaseDifficulty(thresholdScore);
      
      expect(physics.pipeSpeed).toBeGreaterThan(initialSpeed);
    });
    
    test('should increase pipe speed by increment amount', () => {
      const initialSpeed = physics.pipeSpeed;
      const thresholdScore = physics.speedIncreaseThreshold;
      
      physics.increaseDifficulty(thresholdScore);
      
      expect(physics.pipeSpeed).toBe(initialSpeed + physics.speedIncrement);
    });
    
    test('should not increase speed for non-threshold scores', () => {
      const initialSpeed = physics.pipeSpeed;
      
      physics.increaseDifficulty(1);
      physics.increaseDifficulty(2);
      physics.increaseDifficulty(3);
      
      expect(physics.pipeSpeed).toBe(initialSpeed);
    });
    
    test('should increase speed at multiple thresholds', () => {
      const threshold = physics.speedIncreaseThreshold;
      const increment = physics.speedIncrement;
      const baseSpeed = physics.basePipeSpeed;
      
      physics.increaseDifficulty(threshold);
      physics.increaseDifficulty(threshold * 2);
      
      expect(physics.pipeSpeed).toBeCloseTo(baseSpeed + increment * 2, 5);
    });
    
    test('should not exceed max pipe speed', () => {
      // Increase difficulty many times
      for (let i = 1; i <= 100; i++) {
        if (i % physics.speedIncreaseThreshold === 0) {
          physics.increaseDifficulty(i);
        }
      }
      
      expect(physics.pipeSpeed).toBeLessThanOrEqual(physics.maxPipeSpeed);
    });
    
    test('should clamp to max speed exactly', () => {
      // Set speed just below max
      physics.pipeSpeed = physics.maxPipeSpeed - physics.speedIncrement / 2;
      
      physics.increaseDifficulty(physics.speedIncreaseThreshold);
      
      expect(physics.pipeSpeed).toBe(physics.maxPipeSpeed);
    });
    
    test('should not increase speed for score of 0', () => {
      const initialSpeed = physics.pipeSpeed;
      
      physics.increaseDifficulty(0);
      
      expect(physics.pipeSpeed).toBe(initialSpeed);
    });
  });
  
  describe('resetDifficulty()', () => {
    test('should reset pipe speed to base speed', () => {
      // Increase difficulty first
      physics.increaseDifficulty(physics.speedIncreaseThreshold);
      expect(physics.pipeSpeed).toBeGreaterThan(physics.basePipeSpeed);
      
      physics.resetDifficulty();
      
      expect(physics.pipeSpeed).toBe(physics.basePipeSpeed);
    });
    
    test('should reset from max speed', () => {
      physics.pipeSpeed = physics.maxPipeSpeed;
      
      physics.resetDifficulty();
      
      expect(physics.pipeSpeed).toBe(physics.basePipeSpeed);
    });
    
    test('should work when already at base speed', () => {
      physics.resetDifficulty();
      
      expect(physics.pipeSpeed).toBe(physics.basePipeSpeed);
    });
  });
  
  describe('Custom Configuration', () => {
    test('should accept custom config in constructor', () => {
      const customConfig = {
        physics: {
          gravity: 1.0,
          jumpVelocity: -15,
          terminalVelocity: 20,
          maxUpwardVelocity: -20
        },
        pipes: {
          spacing: 250,
          gapSize: 180,
          minGapY: 80,
          maxGapY: 520,
          baseSpeed: 3,
          maxSpeed: 7,
          speedIncreaseThreshold: 10,
          speedIncrement: 0.5
        }
      };
      
      const customPhysics = new PhysicsEngine(customConfig);
      
      expect(customPhysics.gravity).toBe(1.0);
      expect(customPhysics.jumpVelocity).toBe(-15);
      expect(customPhysics.pipeSpacing).toBe(250);
      expect(customPhysics.gapSize).toBe(180);
    });
  });
  
  describe('Integration - Physics and Position Update', () => {
    test('should apply gravity and update position together', () => {
      const entity = { y: 100, velocity: 0 };
      const deltaTime = 1;
      
      physics.applyGravity(entity, deltaTime);
      physics.updatePosition(entity, deltaTime);
      
      // After one frame: velocity = gravity, position = 100 + gravity
      expect(entity.velocity).toBe(physics.gravity);
      expect(entity.y).toBe(100 + physics.gravity);
    });
    
    test('should simulate falling over multiple frames', () => {
      const entity = { y: 100, velocity: 0 };
      const deltaTime = 1;
      const initialY = entity.y;
      
      // Simulate 5 frames
      for (let i = 0; i < 5; i++) {
        physics.applyGravity(entity, deltaTime);
        physics.updatePosition(entity, deltaTime);
      }
      
      // Entity should have fallen
      expect(entity.y).toBeGreaterThan(initialY);
      expect(entity.velocity).toBeGreaterThan(0);
    });
  });
});
