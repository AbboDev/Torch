# Game Design Document

## 1. Game Design Overview & Core Pillars

- **Torch** is a 2D Sci-Fi Metroidvania combining the atmospheric exploration of _Super Metroid_ and _Hollow Knight_ with the precision combat mechanics of _Metroid Fusion/Zero Mission_ and _Mega Man Zero_.
- **Core Pillars:**

1. **Light as a Survival Tool:** Darkness is an active, hostile entity. The multi-directional _Torch_ and its advanced modules are required to illuminate rooms, reveal secret passages, repel dark entities, and interact with environmental elements.
2. **Precise 2D Physics & Momentum:** Fluid horizontal inertia, responsive jumping, wall interactions, and advanced movement capabilities (Dash, Grapple, Spider tracking).
3. **Rewarding Progression (Power Loss & Recovery):** An initial tutorial previewing full power, followed by a dramatic power loss in an ancient temple, setting up a deep journey of rediscovery and combat evolution.
4. **Strict Architectural Integrity:** Built with clean code practices, immutable test-first workflows, and complete type safety via TypeScript.

---

## 2. Player Stats & Resource Management

### A. Health Points (HP)

- **Base Value:** 99 HP (represented as an integer without decimals).
- **Cap & Expansion:** Can be increased by collecting _Energy Tanks_ (+100 HP per tank).
- **Dynamic Max Calculation:** Maximum HP is never stored statically in save files; it is computed dynamically at boot:

$$\text{Max HP} = 99 + (\text{collectedEnergyTanksCount} \times 100)$$

### B. Energy Battery (0–100%)

- **Function:** Powers the active Torch modules, special visors, shields, and energy-consuming weapons.
- **Cap & Expansion:** Base capacity is 100%, expandable via _Battery Upgrade_ pickups (+100% per upgrade).
- **Regeneration:** Recharged at Save Points, via specific energy pickups, or passive regeneration modules.

### C. Ammunition Pool

- **Function:** Shared or weapon-specific pool for ballistic secondary weapons (e.g., missiles, energy arrows).
- **Cap & Expansion:** Starts at 0 capacity until the first ammo expansion or weapon module is acquired. Expanded via _Ammo Packs_ (+100 per pack).

---

## 3. Movement & Traversal System

- **Horizontal Movement:** Acceleration, friction, and inertia curves for precise ground control.
- **Jumping & Air Control:** Short hop (tap) vs. Full hop (hold), retaining horizontal momentum during aerial parabolas.
- **Crouching:** Reduces hitbox height by 50% to crawl or dodge high projectiles.
- **Slopes & Inclines:** Automatic alignment and physics adherence on ramps and angled tiles.
- **Advanced Movement Modulators (Unlocked via Progression):**
- **Space Boots / Rocket Boots:** Enhanced jumps and double-jump capability.
- **Torch Gloves:** Wall jumping and ledge grab / mantling.
- **Moon Torch:** Gravity inversion where applicable (walking on ceilings).
- **Torch Booster / Dash:** High-speed running (Speed Booster) and rapid horizontal dashes capable of destroying weak enemies or specific barrier blocks.
- **Grappling Torch:** 360° directional hook for pendulum swings, pulling objects, and disarming enemies.
- **Spider Torch:** Attachment and sliding along vertical, horizontal, and diagonal guide rails.
- **Torch Ring:** Lifting and moving heavy boulders or obstacles.
- **Torch Fan:** Unimpeded movement through liquids and underwater environments.

---

## 4. Combat System & Weaponry

- **Buster / Primary Beam:** Straight-line projectile with a defined rate of fire.
- **Charged Shot (Charge Buster):** Hold-to-charge mechanics yielding higher damage, bigger hitbox, and light emission upon release.
- **Free Aim (360°):** Independent aiming vector via mouse or right analog stick.
- **Secondary Weapons & Loadout:**
- _Ballistic & Energy:_ Tactical Handgun, Assault Rifle, Torch Bow, Torch Crossbow, Torch Beam, Torch Blast.
- _Melee:_ Assault Knife, Chainsaw, Torch Blade, Torch Saber.
- _Thermal / Incendiary:_ Plasma Torch (melts simple ice, welds circuits), Flame Thrower (melts massive ice blocks and metal sheets).

- **Torch Shield:** Energy barrier protecting against incoming attacks, consuming battery while active.

---

## 5. The Torch & Environmental Lighting Mechanics

- **Lighting States:** Rooms feature varying light levels ranging from normal visibility to sparse light, absolute darkness, and _oppressive darkness_ (which inflicts continuous damage over time unless protected by suitable suits).
- **Torch Evolution Modules:**
- **Torch:** Aligned with alien tech, circular illumination x1, repels weak dark entities.
- **Flashlight:** Human tech, directional cone illumination, battery-powered.
- **Better Torch:** Circular illumination x1.5, damages weak dark entities on proximity.
- **Old Torch:** Circular illumination x2, damages standard dark entities.
- **Ray Torch:** Highlights block types and reveals hidden passages.

---

## 6. Suits & Environmental Protection

- **Light Suit (Alien):** Reduces incoming damage by 30%, halves lava damage, grants access to high-temperature sectors.
- **Old Suit (Alien):** Reduces incoming damage by 60%, provides complete immunity to toxic gas and acid environments.
- **Torch Shield (Human):** Absorbs up to 3 points of damage, auto-recharges if unhit for 3 seconds.

---

## 7. Save System & World Persistence

- **Save Slots:** 3 independent save slots (`save_slot_[1-3].json`) storing player stats, unlocked abilities, collected pickups, world events (levers, buttons, cutscenes), and visited rooms (for the Fog of War minimap).
- **Global Settings:** Separated into `settings.json` for Video/Display options (Integer scaling, V-Sync, Brightness shaders, Particle/Blur quality), Audio volumes, Controls mapping, and i18n Language selection.
- **Persistence Layer:** Native File System via Tauri on Desktop, with IndexedDB fallback for web development.
