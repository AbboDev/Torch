# Sections, Screens & Level Structure

## 1. UI & Menu Flow

The user experience and navigation flow across the application are structured into the following sequence of screens and scenes:

1. **SplashScreen / Logo Loading:** Fast engine bootstrap and loading of core configuration files.
2. **PreloaderScene (Loading Screen):** Dynamic progress bar tracking asset bundling (textures, tilemaps, audio, locales).
3. **Main Menu / Title Screen:**
   - **New Game:** Initializes stats and starts Act I (Simulation / Tutorial).
   - **Continue / Save Slots:** Access to 3 independent save slots (`save_slot_[1-3].json`), displaying playtime, completion percentage, and last saved timestamp.
   - **Options Menu:** Global preferences (`settings.json`) divided into four categories:
     - _Graphics / Visuals:_ Display mode (Fullscreen/Windowed), Resolution, V-Sync, Screen Scaling (Integer Scaling), Brightness (WebGL Pipeline), Particle Quality, and Blur Effects.
     - _Audio:_ Master, Music, and SFX volume sliders.
     - _Controls / Input:_ Input device selection, custom key bindings, and gamepad mapping.
     - _Language & Accessibility:_ i18next language selection (Italian, English, French, Spanish) and UI scale.
   - **Exit:** Closes the native Tauri application.
4. **In-Game HUD (UIScene - Parallel Scene):**
   - Health Points bar (99 base + expansions).
   - Energy Battery percentage indicator (0-100%).
   - Shared Ammunition counter.
   - Minimap grid with dynamic Fog of War room tracking.
   - Active secondary weapon / power-up indicator.
5. **Pause Menu:** Freezes physics, gameplay timer, and enemy loops while allowing access to inventory, equipment modules, extended world map, and settings.
6. **Game Over Screen:** Triggers upon reaching 0 HP, presenting options to "Retry" (respawn at the last Save Point) or "Return to Main Menu".

---

## 2. Narrative Acts & Level Structure (`Tiled v1.12+`)

The game world is structured into **4 distinct Narrative Acts**, mapped across Tiled tilemaps (`src/assets/tilemaps/`):

### Act I: The Tutorial & The Descent

- **Area 01 - The Spaceship Simulator (`area_01_sim.json`):**
  - _Context:_ Training simulation aboard the Federation starship.
  - _Gameplay:_ Full-power tutorial where the player tests advanced movement (double dash, wall jump, high-tier weapons) to establish baseline progression goals.
- **Area 02 - The Remote Planet & Ancient Temple (`area_02_temple.json`):**
  - _Context:_ Real mission, squad ambush by dark entities, and tragic collapse.
  - _Gameplay:_ The hero absorbs the _Torch_ relic, loses advanced human gear, and begins subterranean survival under scarce lighting conditions, navigating low-visibility rooms and environmental hazards (toxic gas, high temperatures).

### Act II: The First Adventure & The Renegade Clan

- **Area 03 - Subterranean Caverns & Bandit Laboratories (`area_03_labs.json`):**
  - _Context:_ Discovery that the darkness originates from a rogue alien clan conducting prohibited experiments.
  - _Gameplay:_ Ascending through structured zones using recovered base modules, defeating the clan's leadership, triggering a timed laboratory self-destruction sequence, and escaping via a salvage shuttle with biological samples.

### Act III: Return to the Mother Planet (Earth) & The Breach

- **Area 04 - Federation Research Facility on Earth (`area_04_earth.json`):**
  - _Context:_ Reporting back to the Federation; sudden containment breach and theft of the dark samples.
  - _Gameplay:_ Urban/laboratory survival horror context. The hero must evade overwhelming dark entities through maintenance corridors and sewers, securing minor upgrades before commandeering an emergency reconnaissance shuttle to return to the alien planet.

### Act IV: The Second Adventure & Final Climax

- **Area 05 - The Alien Core & The Final Threat (`area_05_core.json`):**
  - _Context:_ Unofficial, high-stakes return to the alien world with full power and fused technologies.
  - _Gameplay:_ Advanced exploration of deep subterranean zones, multi-screen boss fights, and final confrontation against the true source of the darkness alongside the resurging native alien population.
