---
name: test-generation
description: Generates unit, integration, and e2e tests ensuring coverage, correctness, and reliability of code.
---

# Test Generation

## Instructions

When generating tests:

1. Identify unit under test
2. Define expected behavior
3. Create test cases:
   - success cases
   - edge cases
   - failure cases

## Types

### Unit Tests

- Test isolated functions
- Mock dependencies

### Integration Tests

- Test database + services together

### E2E Tests

- Simulate real user flows

## Rules

- Tests must be deterministic
- Avoid external dependencies
- Use clear assertions

## Anti-Patterns

- Testing implementation instead of behavior
- Missing edge cases
- Over-mocking

## Example

Test check-in:

- valid face → success
- invalid face → denied
