# Developer & Technology Standards Guide

## 1. Prerequisites & Environment Setup

### Core Requirements

- **Node.js:** `v26.x` (LTS recommended)
- **Package Manager:** `pnpm`
- **Map Editor:** Tiled `v1.12+`

### Native Rust & Desktop Toolchain Setup

Install Rust via `rustup` before setting up platform-specific native dependencies:

#### Option A: Windows Setup

- Install **Visual Studio Build Tools** with the "Desktop development with C++" workload.
- Ensure **WebView2 Runtime** is installed (pre-installed on Windows 11).

#### Option B: macOS Setup

- Install Xcode Command Line Tools:
  ```bash
  xcode-select --install
  ```

````

#### Option C: Linux Setup (Ubuntu/Debian)

* Install webkit2gtk, GTK, and build essential packages:
```bash
sudo apt update
sudo apt install -y build-essential curl wget libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev libwebkit2gtk-4.1-dev
````

---

## 2. Local Development Workflow

### Installation

```bash
pnpm install
```

### Execution Scripts

- **Vite Web Dev Server:**

```bash
pnpm run dev
```

- **Tauri Desktop App Dev Mode:**

```bash
pnpm run tauri:dev
```

- **Tauri Desktop Production Build:**

```bash
pnpm run tauri:build
```

- **Tauri CLI Information:**

```bash
pnpm run tauri:info
```

---

## 3. Code Quality, Formatting & Git Conventions

### Code Style & Linters

- **TypeScript:** Strict Mode enabled across all modules.
- **ESLint & Prettier:** Run manual checks with:

```bash
pnpm run lint
pnpm run format
```

### Conventional Commits & Husky Hooks

All commit messages are strictly validated via **Husky** and **Commitlint** using the _Conventional Commits_ specification:

#### Format:

`<type>(<scope>): <short description>`

- **Allowed Types:**
- `feat`: New feature (e.g., `feat(player): add wall jump mechanics`)
- `fix`: Bug fix (e.g., `fix(physics): resolve tilemap collision penetration`)
- `docs`: Documentation updates
- `style`: Formatting, missing semicolons, white-space changes
- `refactor`: Restructuring code without altering functionality
- `test`: Adding or updating test suites
- `chore`: Build configuration, dependency updates

---

## 4. Testing & QA Strategy

### Unit & Integration Testing (Vitest)

Used for pure engine-agnostic logic (state machines, player stats, inventory math, collision helpers):

```bash
pnpm run test:unit
```

### End-to-End Testing (Cypress)

Verifies window initialization, scene boots, UI overlay navigation, and input handlers:

```bash
pnpm run test:e2e
```

---

## 5. Tiled Map Editor Guidelines (`v1.12+`)

- **Shared Configuration:** Always store level files in `src/assets/tilemaps/` using the project configuration file `.tiled-project`.
- **Git Ignore Rules:** Local workspace session files must be ignored in `.gitignore`:

```gitignore
.tiled-session
.tiled-session.*
```

---

## 6. Input Systems & Controls Architecture

The game provides native out-of-the-box support for three input paradigms:

1. **Gamepad:** Managed via `Phaser.Input.Gamepad` (Xbox, DualShock/DualSense, Switch Pro, and standard XInput/DirectInput controllers).
2. **Keyboard:** Configurable key bindings (defaulting to WASD / Arrow keys).
3. **Mouse / Pointer:** Cursor aiming and 360° free-aim angle tracking.

---

## 7. CI/CD & Multi-Platform Delivery Pipeline

### Branch & Environment Mapping

- `master` $\rightarrow$ **Production Environment** (Vercel Prod Web Preview + GitHub Release Desktop Builds).
- `demo` $\rightarrow$ **Demo / QA Environment** (Vercel QA Web Preview + Sentry Error Monitoring Enabled).
- `dev` $\rightarrow$ **Test / Integration Environment** (Vercel Staging Web Preview + CI Validation).
- Feature/Fix branches (`feat/*`, `fix/*`) $\rightarrow$ **Local Development**.

### Issue Tracking & Pull Requests

- Every final User Story maps to a **GitHub Issue / Task**.
- Direct commits to `master`, `demo`, or `dev` are strictly prohibited; changes must be merged via **Pull Requests (PR)** passing all lint and test checks.
- GitHub Actions automatically compile and generate downloadable **Tauri Desktop Executables** for **Windows, macOS, and Linux**.
