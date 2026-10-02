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

## Commits

Use [Conventional Commits](https://www.conventionalcommits.org/), for example `feat: add a new weapon` or `fix: correct jump collision`. Husky checks commit messages and runs lint-staged before each commit. GitHub Actions checks pull request commit messages; require the `Commitlint` check in branch protection to block nonconforming commits from merging.
