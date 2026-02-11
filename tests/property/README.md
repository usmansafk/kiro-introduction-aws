# Ghost Physics Property Tests

## Overview

This directory contains property-based tests for the Ghost entity physics system in Flappy Kiro. Property-based testing verifies that universal properties hold true across many randomized inputs, providing stronger correctness guarantees than example-based unit tests.

## Test Files

### `ghost-physics.property.test.js`
Jest/fast-check based property tests (requires Node.js and npm dependencies).

**To run:**
```bash
npm install
npm test
```

### `ghost-physics-browser.html`
Browser-based property tests that can run without Node.js. Open this file in a web browser to execute the tests.

**To run:**
```bash
open tests/property/ghost-physics-browser.html
```

## Properties Tested

### Property 1: Jump input sets upward velocity
**Validates: Requirements 1.1.2**

For any ghost with any initial velocity, when a jump is triggered, the ghost's velocity should be set to the negative jump velocity value (upward direction).

- **Generators:** Random initial velocity (-20 to 20), random Y position (50 to 400)
- **Iterations:** 100
- **Assertion:** After jump, velocity equals jumpVelocity and is negative

### Property 2: Gravity continuously accelerates ghost downward
**Validates: Requirements 1.2, 1.1.3**

For any ghost, when updated without input over multiple frames, the ghost's velocity should increase in the downward direction by the gravity constant each frame.

- **Generators:** Random initial velocity (-10 to 10), random delta time (0.5 to 2.0)
- **Iterations:** 100
- **Assertion:** Velocity increases after update (if not at terminal velocity)

### Property 3: Terminal velocity limits falling speed
**Validates: Requirements 1.1.4**

For any ghost with velocity exceeding terminal velocity, after physics update, the ghost's velocity should be clamped to the terminal velocity maximum.

- **Generators:** Random excessive velocity (12 to 50), random delta time (0.5 to 2.0)
- **Iterations:** 100
- **Assertion:** Velocity is clamped to exactly terminal velocity

### Property 4: Maximum upward velocity limits ascending speed
**Validates: Requirements 1.1.5**

For any ghost with velocity more negative than the maximum upward velocity, after physics update, the ghost's velocity should be clamped to the maximum upward velocity.

- **Generators:** Random excessive upward velocity (-50 to -12), random delta time (0.5 to 2.0)
- **Iterations:** 100
- **Assertion:** Velocity is clamped to exactly max upward velocity

### Property 5: Position updates by velocity integration
**Validates: Requirements 1.1.6**

For any ghost with a given velocity and delta time, the ghost's position change should equal velocity multiplied by delta time.

- **Generators:** Random velocity (-10 to 10), random delta time (0.5 to 2.0), random Y position (100 to 500)
- **Iterations:** 100
- **Assertion:** Position change equals velocity × deltaTime (with no gravity)

## Additional Properties

The test suite also includes additional properties for comprehensive coverage:

- **Velocity bounds:** Velocity is always within valid bounds after update
- **Multiple updates:** Updating twice with deltaTime D produces similar results to updating once with 2D
- **Jump upward:** Jump always results in negative (upward) velocity
- **Gravity proportionality:** Gravity effect is proportional to delta time
- **Position proportionality:** Position change is proportional to velocity and delta time

## Testing Framework

### Browser Tests
The browser-based tests use a simple property testing implementation that:
- Generates random inputs within specified ranges
- Runs each property test 100 times with different random inputs
- Reports failures with the specific input values that caused the failure
- Provides a visual test report with pass/fail status

### Jest Tests (when Node.js is available)
The Jest-based tests use [fast-check](https://github.com/dubzzz/fast-check), a mature property-based testing library that provides:
- Sophisticated input generation strategies
- Automatic shrinking of failing test cases to minimal examples
- Configurable test runs and seed control for reproducibility
- Integration with Jest's test runner and assertion library

## Configuration

Test parameters are defined in `js/config.js`:
- `physics.gravity`: 0.6
- `physics.jumpVelocity`: -10
- `physics.terminalVelocity`: 12
- `physics.maxUpwardVelocity`: -12

## Interpreting Results

### All Tests Pass ✅
All 5 core properties hold true across 100 randomized inputs each (500 total test cases). The Ghost physics implementation is correct according to the specification.

### Test Failure ❌
If a property test fails, the error message will include:
- The specific property that failed
- The run number (e.g., "Failed on run 37/100")
- The exact input values that caused the failure
- The assertion that failed

Use this information to:
1. Reproduce the failure with the specific inputs
2. Debug the Ghost implementation
3. Fix the bug
4. Re-run the tests to verify the fix

## Design Philosophy

Property-based testing complements unit testing:

- **Unit tests** verify specific examples work correctly (e.g., "ghost at y=0 collides with ceiling")
- **Property tests** verify universal properties hold (e.g., "velocity is always within bounds after update")

Together, they provide comprehensive coverage:
- Unit tests catch concrete bugs in specific scenarios
- Property tests catch edge cases and verify general correctness

## Requirements Traceability

| Property | Requirements Validated |
|----------|----------------------|
| Property 1 | 1.1.2 |
| Property 2 | 1.2, 1.1.3 |
| Property 3 | 1.1.4 |
| Property 4 | 1.1.5 |
| Property 5 | 1.1.6 |

All acceptance criteria for Ghost physics (Requirements 1.1.2 through 1.1.6) are validated by these property tests.
