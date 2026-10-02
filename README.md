# Torch

A Phaser 3 game built with TypeScript and Vite.

## Requirements

Use Node.js 24 LTS and npm.

## Install and run

| Command             | Description                                                  |
| ------------------- | ------------------------------------------------------------ |
| `npm install`       | Install dependencies.                                        |
| `npm run dev`       | Start the Vite development server at http://localhost:5173/. |
| `npm run typecheck` | Check TypeScript without emitting files.                     |
| `npm run build`     | Create a minified production build in `build/`.              |
| `npm run build:dev` | Create a source-mapped, unminified build in `build/`.        |

## Tests

| Command                    | Description                         |
| -------------------------- | ----------------------------------- |
| `npm test`                 | Run all unit and integration tests. |
| `npm run test:unit`        | Run unit tests.                     |
| `npm run test:integration` | Run integration tests.              |
| `npm run test:watch`       | Run tests in watch mode.            |

Place tests in `tests/unit/` or `tests/integration/` and name them `*.test.ts`. Unit tests should isolate one module; integration tests should exercise interactions between game modules. Browser-driven end-to-end tests will be added separately with Cypress.

## Commits

Use [Conventional Commits](https://www.conventionalcommits.org/), for example `feat: add a new weapon` or `fix: correct jump collision`. Husky checks commit messages and runs lint-staged before each commit. GitHub Actions checks pull request commit messages; require the `Commitlint` check in branch protection to block nonconforming commits from merging.
