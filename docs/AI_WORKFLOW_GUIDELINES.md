# AI Workflow Guidelines & Engineering Standards

## 1. Executive Summary & Purpose

This document establishes mandatory guidelines, constraints, and engineering protocols for AI assistants (such as GitHub Copilot and Cursor) interacting with and generating code or documentation for the **Torch** project (2D Sci-Fi Metroidvania built with **Phaser 4** and **Tauri**).

All AI-generated contributions must strictly adhere to the project's architectural principles, Test-Driven Development (TDD) rules, and clean code standards.

---

## 2. Core Development Principles

### A. Frozen TDD (Test-Driven Development)

- **Test-First Workflow:** Whenever a new feature, bug fix, or module is implemented, corresponding automated tests must be written or updated _before_ or _concurrently_ with the implementation.
- **Immutable Tests:** Test suites (Vitest unit/integration tests and Cypress E2E tests) are immutable. AI agents **must never** modify existing tests simply to make broken or incorrect implementation code pass. If a test fails, the implementation code must be corrected, not the test (unless the test itself contains an explicit, verified requirement bug).

### B. Strict Clean Architecture & Separation of Concerns (SoC)

- **Single Responsibility Principle (SRP):** Every class, module, and function must have a single, well-defined responsibility.
- **DRY (Don't Repeat Yourself):** Avoid code duplication by extracting shared logic into utility modules (`src/core/utils/`) or base classes (`Entity.ts`).
- **Thin Scenes Pattern (Phaser 4):** `Phaser.Scene` classes must manage only the engine lifecycle, asset loading, and scene transitions. Complex game logic, state machines, math calculations, and input handlers must reside in engine-agnostic classes (`src/core/` or `src/game/entities/`).

---

## 3. Code Generation & Quality Standards

### A. TypeScript Strict Mode

- All generated code must be written in strict TypeScript (`strict: true`). Avoid using `any` type unless absolutely necessary; use generics, strict interfaces, and explicit type definitions (e.g., `SaveSlotData`, `GlobalSettings`).

### B. Linter & Formatter Compliance

- Code must conform to ESLint and Prettier rules configured in the repository. AI agents must ensure proper formatting, semicolons, consistent indentation, and absence of unused imports.

### C. File & Directory Conventions

- Adhere strictly to the project structure defined in `ARCHITECTURE.md`:
  - Pure game logic: `src/core/`
  - Phaser integration: `src/game/`
  - Tauri IPC & Storage: `src/services/`
  - Tests: `tests/unit/`, `tests/integration/`, `tests/e2e/`

---

## 4. Git Workflows, Commits & Issue Tracking

### A. Conventional Commits

- All commit messages generated or suggested by AI must follow the Conventional Commits specification:
  `<type>(<scope>): <short description>`
- **Allowed Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`.

### B. Pull Requests & GitHub Issues

- Every User Story implementation must trace back to a **GitHub Issue**.
- Direct commits to protected branches (`master`, `demo`, `dev`) are strictly prohibited. All changes must be submitted via **Pull Requests (PR)** and pass all automated CI checks (Linter, Vitest, Cypress).

---

## 5. Environment Rules & Sentry Monitoring

- **Environment Separation:**
  - `master` = Production
  - `demo` = Demo / QA
  - `dev` = Test / Integration
  - Feature branches = Local Development
- **Error Tracking (Sentry):** Sentry error monitoring is enabled _only_ in `master` and `demo` environments. AI agents must never enable Sentry or leak telemetry in `dev` or local development environments.
