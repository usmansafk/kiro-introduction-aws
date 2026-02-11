/**
 * Property-Based Tests for Ghost Physics
 * Feature: flappy-kiro
 * 
 * Tests universal properties of Ghost physics across randomized inputs
 * using fast-check property-based testing framework.
 * 
 * **Validates: Requirements 1.1.2, 1.2, 1.1.3, 1.1.4, 1.1.5, 1.1.6**
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import fc from 'fast-check';
import Ghost from '../../js/entities/ghost.js';
import GameConfig from '../../js/config.js';

describe('Ghost Physics Properties', () => {
  let mockSprite;
  
  beforeEach(() => {
    // Create a mock sprite for testing
    mockSprite = {
      width: 34,
      height: 24
    };
  });
  
  /**
   * Property 1: Jump input sets upward velocity
   * **Validates: Requirements 1.1.2**
   * 
   * For any ghost with any initial velocity, when a jump is triggered,
   * the ghost's velocity should be set to the negative jump velocity value (upward direction).
   */
  test('Property 1: Jump input sets upward velocity', () => {
    fc.assert(
      fc.property(
        fc.float({ min: -20, max: 20 }), // Initial velocity (any value)
        fc.float({ min: 50, max: 400 }),  // Initial Y position
        (initialVelocity, initialY) => {
          const ghost = new Ghost(100, initialY, mockSprite);
          ghost.velocity = initialVelocity;
          const jumpVelocity = GameConfig.physics.jumpVelocity;
          
          ghost.jump(jumpVelocity);
          
          // After jump, velocity should be exactly the jump velocity
          expect(ghost.velocity).toBe(jumpVelocity);
          // Jump velocity should be negative (upward)
          expect(jumpVelocity).toBeLessThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Property 2: Gravity continuously accelerates ghost downward
   * **Validates: Requirements 1.2, 1.1.3**
   * 
   * For any ghost, when updated without input over multiple frames,
   * the ghost's velocity should increase in the downward direction
   * by the gravity constant each frame.
   */
  test('Property 2: Gravity continuously accelerates ghost downward', () => {
    fc.assert(
      fc.property(
        fc.float({ min: -10, max: 10 }),  // Initial velocity
        fc.float({ min: 0.5, max: 2.0 }), // Delta time
        (initialVelocity, deltaTime) => {
          const ghost = new Ghost(100, 200, mockSprite);
          ghost.velocity = initialVelocity;
          const gravity = GameConfig.physics.gravity;
          const terminalVelocity = GameConfig.physics.terminalVelocity;
          const maxUpwardVelocity = GameConfig.physics.maxUpwardVelocity;
          
          const velocityBefore = ghost.velocity;
          ghost.update(deltaTime, gravity, terminalVelocity, maxUpwardVelocity);
          
          // If not at terminal velocity, velocity should increase (become more positive)
          if (velocityBefore < terminalVelocity) {
            expect(ghost.velocity).toBeGreaterThan(velocityBefore);
            // The increase should be approximately gravity * deltaTime
            const expectedIncrease = gravity * deltaTime;
            const actualIncrease = ghost.velocity - velocityBefore;
            // Allow for clamping at terminal velocity
            if (ghost.velocity < terminalVelocity) {
              expect(actualIncrease).toBeCloseTo(expectedIncrease, 5);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Property 3: Terminal velocity limits falling speed
   * **Validates: Requirements 1.1.4**
   * 
   * For any ghost with velocity exceeding terminal velocity,
   * after physics update, the ghost's velocity should be clamped
   * to the terminal velocity maximum.
   */
  test('Property 3: Terminal velocity limits falling speed', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 12, max: 50 }),   // Velocity above terminal velocity
        fc.float({ min: 0.5, max: 2.0 }), // Delta time
        (excessiveVelocity, deltaTime) => {
          const ghost = new Ghost(100, 200, mockSprite);
          ghost.velocity = excessiveVelocity;
          const gravity = GameConfig.physics.gravity;
          const terminalVelocity = GameConfig.physics.terminalVelocity;
          const maxUpwardVelocity = GameConfig.physics.maxUpwardVelocity;
          
          ghost.update(deltaTime, gravity, terminalVelocity, maxUpwardVelocity);
          
          // Velocity should never exceed terminal velocity
          expect(ghost.velocity).toBeLessThanOrEqual(terminalVelocity);
          // Should be clamped to exactly terminal velocity
          expect(ghost.velocity).toBe(terminalVelocity);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Property 4: Maximum upward velocity limits ascending speed
   * **Validates: Requirements 1.1.5**
   * 
   * For any ghost with velocity more negative than the maximum upward velocity,
   * after physics update, the ghost's velocity should be clamped to the
   * maximum upward velocity.
   */
  test('Property 4: Maximum upward velocity limits ascending speed', () => {
    fc.assert(
      fc.property(
        fc.float({ min: -50, max: -12 }), // Velocity more negative than max upward
        fc.float({ min: 0.5, max: 2.0 }), // Delta time
        (excessiveUpwardVelocity, deltaTime) => {
          const ghost = new Ghost(100, 200, mockSprite);
          ghost.velocity = excessiveUpwardVelocity;
          const gravity = GameConfig.physics.gravity;
          const terminalVelocity = GameConfig.physics.terminalVelocity;
          const maxUpwardVelocity = GameConfig.physics.maxUpwardVelocity;
          
          ghost.update(deltaTime, gravity, terminalVelocity, maxUpwardVelocity);
          
          // Velocity should never be more negative than max upward velocity
          expect(ghost.velocity).toBeGreaterThanOrEqual(maxUpwardVelocity);
          // Should be clamped to exactly max upward velocity
          expect(ghost.velocity).toBe(maxUpwardVelocity);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Property 5: Position updates by velocity integration
   * **Validates: Requirements 1.1.6**
   * 
   * For any ghost with a given velocity and delta time,
   * the ghost's position change should equal velocity multiplied by delta time.
   */
  test('Property 5: Position updates by velocity integration', () => {
    fc.assert(
      fc.property(
        fc.float({ min: -10, max: 10 }),  // Velocity
        fc.float({ min: 0.5, max: 2.0 }), // Delta time
        fc.float({ min: 100, max: 500 }), // Initial Y position
        (velocity, deltaTime, initialY) => {
          const ghost = new Ghost(100, initialY, mockSprite);
          ghost.velocity = velocity;
          const gravity = 0; // No gravity for pure position test
          const terminalVelocity = GameConfig.physics.terminalVelocity;
          const maxUpwardVelocity = GameConfig.physics.maxUpwardVelocity;
          
          const yBefore = ghost.y;
          ghost.update(deltaTime, gravity, terminalVelocity, maxUpwardVelocity);
          
          // Position change should equal velocity * deltaTime
          const expectedYChange = velocity * deltaTime;
          const actualYChange = ghost.y - yBefore;
          
          expect(actualYChange).toBeCloseTo(expectedYChange, 5);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Additional property tests for comprehensive coverage
   */
  
  /**
   * Property: Velocity is always within valid bounds after update
   * 
   * For any ghost state and update parameters, after update,
   * velocity should be between maxUpwardVelocity and terminalVelocity.
   */
  test('Property: Velocity is always within valid bounds after update', () => {
    fc.assert(
      fc.property(
        fc.float({ min: -50, max: 50 }),  // Any initial velocity
        fc.float({ min: 0.5, max: 2.0 }), // Delta time
        (initialVelocity, deltaTime) => {
          const ghost = new Ghost(100, 200, mockSprite);
          ghost.velocity = initialVelocity;
          const gravity = GameConfig.physics.gravity;
          const terminalVelocity = GameConfig.physics.terminalVelocity;
          const maxUpwardVelocity = GameConfig.physics.maxUpwardVelocity;
          
          ghost.update(deltaTime, gravity, terminalVelocity, maxUpwardVelocity);
          
          // Velocity should always be within bounds
          expect(ghost.velocity).toBeGreaterThanOrEqual(maxUpwardVelocity);
          expect(ghost.velocity).toBeLessThanOrEqual(terminalVelocity);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Property: Multiple updates accumulate correctly
   * 
   * For any ghost, updating twice with deltaTime D should produce
   * similar results to updating once with deltaTime 2D (within tolerance).
   */
  test('Property: Multiple updates accumulate correctly', () => {
    fc.assert(
      fc.property(
        fc.float({ min: -5, max: 5 }),    // Initial velocity
        fc.float({ min: 0.5, max: 1.0 }), // Delta time (smaller to avoid clamping)
        fc.float({ min: 200, max: 400 }), // Initial Y position
        (initialVelocity, deltaTime, initialY) => {
          const gravity = GameConfig.physics.gravity;
          const terminalVelocity = GameConfig.physics.terminalVelocity;
          const maxUpwardVelocity = GameConfig.physics.maxUpwardVelocity;
          
          // Ghost 1: Update twice with deltaTime
          const ghost1 = new Ghost(100, initialY, mockSprite);
          ghost1.velocity = initialVelocity;
          ghost1.update(deltaTime, gravity, terminalVelocity, maxUpwardVelocity);
          ghost1.update(deltaTime, gravity, terminalVelocity, maxUpwardVelocity);
          
          // Ghost 2: Update once with 2 * deltaTime
          const ghost2 = new Ghost(100, initialY, mockSprite);
          ghost2.velocity = initialVelocity;
          ghost2.update(2 * deltaTime, gravity, terminalVelocity, maxUpwardVelocity);
          
          // Results should be similar (within floating point tolerance)
          // Note: May differ slightly due to clamping order
          expect(ghost1.y).toBeCloseTo(ghost2.y, 1);
          expect(ghost1.velocity).toBeCloseTo(ghost2.velocity, 1);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Property: Jump always results in upward velocity
   * 
   * For any ghost state, after jump, velocity should be negative (upward).
   */
  test('Property: Jump always results in upward velocity', () => {
    fc.assert(
      fc.property(
        fc.float({ min: -20, max: 20 }),  // Any initial velocity
        fc.float({ min: 50, max: 550 }),  // Any Y position
        (initialVelocity, yPosition) => {
          const ghost = new Ghost(100, yPosition, mockSprite);
          ghost.velocity = initialVelocity;
          const jumpVelocity = GameConfig.physics.jumpVelocity;
          
          ghost.jump(jumpVelocity);
          
          // After jump, velocity should be negative (upward)
          expect(ghost.velocity).toBeLessThan(0);
          expect(ghost.velocity).toBe(jumpVelocity);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Property: Gravity effect is proportional to delta time
   * 
   * For any ghost, the velocity change due to gravity should be
   * proportional to delta time.
   */
  test('Property: Gravity effect is proportional to delta time', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 5 }),     // Initial velocity (not at terminal)
        fc.float({ min: 0.5, max: 1.5 }), // Delta time
        (initialVelocity, deltaTime) => {
          const gravity = GameConfig.physics.gravity;
          const terminalVelocity = GameConfig.physics.terminalVelocity;
          const maxUpwardVelocity = GameConfig.physics.maxUpwardVelocity;
          
          const ghost = new Ghost(100, 200, mockSprite);
          ghost.velocity = initialVelocity;
          
          const velocityBefore = ghost.velocity;
          ghost.update(deltaTime, gravity, terminalVelocity, maxUpwardVelocity);
          
          // If not clamped, velocity change should equal gravity * deltaTime
          if (ghost.velocity < terminalVelocity) {
            const velocityChange = ghost.velocity - velocityBefore;
            const expectedChange = gravity * deltaTime;
            expect(velocityChange).toBeCloseTo(expectedChange, 5);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Property: Position change is proportional to velocity and delta time
   * 
   * For any ghost with constant velocity (no gravity), position change
   * should be exactly velocity * deltaTime.
   */
  test('Property: Position change is proportional to velocity and delta time', () => {
    fc.assert(
      fc.property(
        fc.float({ min: -8, max: 8 }),    // Velocity (within bounds)
        fc.float({ min: 0.5, max: 2.0 }), // Delta time
        fc.float({ min: 150, max: 450 }), // Initial Y position
        (velocity, deltaTime, initialY) => {
          const ghost = new Ghost(100, initialY, mockSprite);
          ghost.velocity = velocity;
          const gravity = 0; // No gravity
          const terminalVelocity = GameConfig.physics.terminalVelocity;
          const maxUpwardVelocity = GameConfig.physics.maxUpwardVelocity;
          
          const yBefore = ghost.y;
          ghost.update(deltaTime, gravity, terminalVelocity, maxUpwardVelocity);
          
          const expectedY = yBefore + (velocity * deltaTime);
          expect(ghost.y).toBeCloseTo(expectedY, 5);
        }
      ),
      { numRuns: 100 }
    );
  });
});
