# Testing & TDD Guidelines

- **Frameworks:** Use **Vitest** for fast unit/integration testing and **Cypress** for E2E tests.
- **Test-First Execution:** Always write tests before writing implementation code.
- **Immutable Test Rule:** Existing test assertions are canonical. If a test fails, correct the implementation logic, do NOT change the test parameters or expected outcomes.
- **Coverage:** Aim for high coverage on `src/core/` logic, state machines, and save slot serialization.
