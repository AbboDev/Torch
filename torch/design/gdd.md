# Torch

A side-on pixel-art metroidvania in a mutated alien temple. Vaelen blasts cosmic organisms, claims living suit upgrades to breach sealed ruins sector by sector, and must hide from the Shadow Stalker, an invincible, fully powered duplicate of herself.

## The game

- **Platform:** Mobile and desktop, played in landscape. On a phone held upright, the game asks to be turned.
- **Graphics:** 2D pixel art.
- **Kind of game:** Metroidvania. The reference is Metroid Fusion (2002).
- **Setting:** Biopunk and cosmic horror. An alien planet with a temple and its ruins.
- **Audience:** Everyone. Nothing in it would be unfit for a child. This sets limits only: add nothing because the audience would allow it. There is no gore. Creatures break up cleanly into embers and orbs.
- **Length:** A long game, hours of play. It has a world, a story, saving and loading.
- **Sound:** Music and sound effects.
- **Language:** English. Every word a player reads or hears is in English: the title, menus, buttons, HUD labels, tutorials, messages, dialogue, and the names of characters, items and places. Text reads left to right. The brief names no font.

## Decisions

1. **Missile toggle on touch screens.** The controls table says "tap anywhere". The brief decided on a toggle icon near the beam button. The toggle icon wins.
2. **Who drops the Bio-Missile Launcher.** One page puts the Bio-Missile Launcher in Sector 2. The entity table and the progression chain say the Gorgon Broodmother drops it. The Broodmother drops it. Vaelen has no missiles yet in that fight, so the Broodmother is beaten with charged beam shots into its glowing bulb while its petals are open. Missiles were the page's method; that is dropped.
3. **How the Cryo-Goliath is beaten.** One page says plasma volleys into its rear exhaust; another says missiles. Missiles win, which matches the brief's bosses whose weak points are blasted with rockets.
4. **When the Shadow Stalker appears.** The pages have it roaming in real time and "entering a sector". The brief has a scripted stealth sequence in one sector. The Stalker appears only in Sector 3, as a scripted stealth sequence centred on the Echoing Galleries.
5. **Aiming.** The brief allows aiming up, down and on the diagonals. The pages allow forward, diagonally up and straight up, and Jump sits on the up keys. The rules are:
   - Vaelen aims forward, diagonally up and straight up at all times.
   - She aims diagonally down and straight down only while in the air, because down crouches on the ground.
   - Aim comes from the left stick on gamepad and the virtual stick on touch.
   - On desktop, aim follows the mouse pointer, snapped to the nearest allowed direction.
   - With keyboard alone, shots go forward.
6. **Saving.** The brief asks for several save slots and saving whenever the player likes. The pages save only at sanctuaries. Both stay:
   - The pause menu saves to a slot at any time.
   - Each Biocell Save Sanctuary also saves, and refills energy and missiles.
   - When energy runs out, play resumes at the most recent sanctuary visited, as the brief decided.
7. **Title screen.** The page says there is no title screen yet. The game gets a simple title screen with the title and the save slots, because save slots need somewhere to be chosen.
8. **Running out of time in the escape.** No page says what happens. It counts as a soft failure, the same as running out of energy: play reloads at Sanctuary Delta.
9. **Name of the final boss.** The pages also call it the "Prime Metamorph". It is the Apex Metamorph everywhere.
10. **The escape vehicle.** It is called a dropship, a shuttle and a landing deck. It is the shuttle, waiting in the Extraction Hangar on the surface landing deck.
11. **Magma trenches.** The magma trenches in the Molten Incline behave like the Acidic Slime Pool hazard. No separate lava hazard is added.
12. **Ledge grabbing.** The Spore Spikes page mentions it. No control or rule exists for it, so it is dropped.
13. **"Portals" on the mini-map.** There are no portals in the game. The mini-map flags elevators instead.
14. **Recoil on firing.** The polish list kicks Vaelen back on every beam shot. The feel page kicks her back only for missiles. The recoil hop is for missiles only.
15. **The morph sound.** It is described both as a biological click and as a crisp metallic click. It is a crisp metallic click.
16. **Pause on desktop and gamepad.** No key is given. The on-screen pause button is clickable on desktop, and Start pauses on a gamepad.
17. **"Station".** The brief's word "station" is read as the temple complex throughout.

## The design

### What it is

- The game is a side-on metroidvania. Rooms scroll horizontally and vertically and connect into one large map of four sectors.
- Play is in real time.
- Vaelen runs, jumps, shoots, fires missiles and rolls as a bio-shell. Each upgrade she claims opens routes that were sealed before.
- **Scope:** Four sectors. Five upgrades. Four bosses. One scripted Stalker sequence. One ending. Story is light, with no long cutscenes.

### Core loop

1. Explore a room until a barrier stops you: a ledge too high, a duct too narrow, or a gate of the wrong colour.
2. Fight or avoid creatures along the way, and take damage.
3. Collect Bio-Energy Cells and Missile Munition Pods from slain creatures.
4. Find a suit upgrade, usually by beating a sector guardian.
5. Backtrack through old rooms that are now passable, and breach deeper.
6. Beat the guardian, unlock the next sector, and repeat.

### Win, lose, score

- **Win:** Defeat the Apex Metamorph. This triggers the purge, and Vaelen must reach the shuttle before the Evacuation Countdown Clock runs out. The debrief screen then appears.
- **Lose (soft):** Energy reaches zero, or the escape clock runs out.
  - Vaelen's suit vents smoke and collapses, and the screen fades to black.
  - Play resumes at the most recent Biocell Save Sanctuary with full energy and missiles.
  - Every unlocked ability, opened gate and collected item is kept.
- **No numeric score.** A run is measured by:
  - total clear time;
  - item discovery percentage;
  - suit status at the end.

  The debrief shows these three, the best previous record, and an invitation to play again.

### Rules

**Movement**

- **Run:** Running starts at once with no slippery start-up, and stops crisply. Icy walkways in Sector 2 are slick.
- **Jump:** Jumping has variable height. Tapping gives a short hop. Holding gives the full jump. Releasing during the rise cuts the rise at once.
- **Leniency:**
  - Coyote time: Vaelen can still jump just after running off an edge.
  - Jump buffering: pressing jump just before landing jumps on contact.
  - Corner correction: Vaelen is nudged around overhead corners.
- **Crouch:** Press down.
- **Morph Shell:** Once the Morph Bio-Shell is owned, press down again while crouching to compress into a sphere, with a crisp metallic click.
  - In shell form, Vaelen rolls through half-height ducts and crawlspaces.
  - Fire drops small energy charges, which crack brittle sandstone blocks.
  - Press Jump or Morph again to stand.
- **Sonic Boost:** Once the Sonic Booster Tendons are owned, running uninterrupted along a long flat stretch builds super speed.
  - While boosting, Vaelen shatters Calcified Bone Barricades on contact.
  - She can clear giant gaps.
  - She is unharmed by weak flying organisms.

**Combat**

- **Beam:** Tapping fire looses rapid plasma bolts in the aimed direction. Fire inputs are buffered so rapid tapping never jams. Holding fire charges a heavier blast.
- **Cryo-Beam:** Once owned, beam shots freeze the creatures they hit.
  - Frozen creatures stop moving and attacking.
  - For a while they become solid platforms Vaelen can stand on, including over pools.
  - Beam shots freeze Spore Drifters instead of popping them.
- **Missiles:** The missile toggle arms the shoulder launcher. The HUD reticle and the Missile Munition Counter glow amber and crimson while it is armed.
  - Fire then launches bio-missiles on a heavy forward path.
  - Missiles deal heavy damage and crack armour.
  - Each launch uses one missile and gives a small recoil hop with a bass boom.
  - The counter turns grey when missiles run out.
- **Power Bomb:** Once the Resonator Power Bomb is owned, firing in shell form with missiles armed drops a Power Bomb instead of a small charge.
  - It disintegrates dense obstacles, opens Yellow Resonator Gates, shatters Calcified Bone Barricades and exposes hidden passages.
- **Drops:** Slain creatures release Bio-Energy Cells and Missile Munition Pods. Cells float and drift magnetically to Vaelen when she is near. Both are absorbed on contact: cells restore energy, pods restock missiles.

**Damage**

- Touching a creature or a hazard damages Vaelen. Her suit flashes red and she recoils with a brief bounce, then flashes through a short spell of invulnerability.
- The Energy Gauge flashes red and sounds a warning chime when energy is critical.

**Gates**

- **Blue Iris Gate:** Opens to any beam shot, and closes behind Vaelen.
- **Red Armored Gate:** Opens to a missile and stays open for good. Beam shots bounce off.
- **Green Cryo Gate:** Opens to the Cryo-Beam and stays open for good.
- **Yellow Resonator Gate:** Opens when a Power Bomb goes off in the room, and stays open for good.

**Shadow Stalker (Sector 3 only)**

- **Warning:** When the Stalker is in an adjacent chamber:
  - the lights flicker and buzz;
  - the music drops to a low drone;
  - the Threat Proximity Sensor pulses with static;
  - its heavy footsteps shake the screen.
- **Invincible:** Beams, missiles and bombs only spark off its distortion field. They do no damage and cause no knockback.
- **Patrol and chase:** It patrols on predictable routes, scanning. If Vaelen enters its view or fires nearby, it halts, screeches, and chases fast.
- **Losing it:** Vaelen loses it by entering a morph duct, crouching in a dark background alcove, or breaking line of sight behind a heavy pillar. It then searches the room before moving on.
- **Its attacks:** Contact or its freeze blast deals catastrophic damage and heavy knockback. If Vaelen survives, she has a short invulnerable window to run for an airlock.
- **Safe zones:** It cannot enter Biocell Save Sanctuaries or boss chambers. Crossing their airlocks resets the pursuit.

**Map**

- Entering a room for the first time draws it on the mini-map and the full map. Unopened doors show as coloured markers.
- A Cartography Terminal fills in every room outline in its sector. It shows undiscovered save rooms and elevators in dim grey.
- Hidden passages, crawlspaces and destructible walls stay off the map until they are blown open by a missile, a boost or a Power Bomb.

**Saving**

- Stepping onto a sanctuary's dais refills all energy and missiles and saves.
- The pause menu saves to a slot at any time.

### Entities

**Player**

- **Vaelen.** She wears a sleek bio-mechanical exosuit with a glowing teal visor, a living arm cannon and thruster vents. In shell form she becomes a glowing sphere.

**Pursuer**

- **The Shadow Stalker.** A towering, iridescent charcoal duplicate of Vaelen's suit. It has crimson optics, a shivering distortion field and bristling endgame weapons.
  - It moves with a heavy, methodical stride and bounds across platforms with crushing leaps.
  - It fires freeze blasts and sweeps rooms with its gaze.
  - It can never be harmed.

**Creatures**

- **Tendril Crawler.** A segmented centipede with yellow eyes and pincers.
  - It loops along walls, floors and ceilings, and drops on Vaelen if she walks beneath it.
  - It dies to a couple of beam bolts or one missile.
  - It respawns when Vaelen re-enters the room.
- **Polyp Spitter.** A bulbous fungal pod rooted to the masonry, with a pulsing maw.
  - It is a stationary turret that lobs slow, arcing spores at Vaelen.
  - It bursts under sustained beam fire and stays gone until the sector reloads.
- **Spore Drifter.** A translucent jellyfish trailing glowing filaments.
  - It floats in a gentle wave across vertical gaps.
  - It pops in one hit into restorative mist, or freezes into a platform under the Cryo-Beam.
- **Chitinous Leaper.** A mantis-like predator with a bone carapace and blade forelimbs.
  - It paces high ledges, then crouches before springing at Vaelen in an arc.
  - It needs sustained beam fire or a missile.
- **Siphon Parasite.** A small leech with glowing violet wings.
  - It flies in erratic swarms and dives at Vaelen.
  - It latches on to slow her and drain energy until she shakes it off.
  - Any hit vaporises it into harmless embers.

**Sector Guardians**

- **Gorgon Broodmother (Sector 1).** A colossal arachnid-flower with vine whips and armoured petal-shields.
  - It is rooted in place. It attacks with sweeping tendrils and ground slams, and spawns flying spores.
  - Shoot its glowing central bulb with charged beam shots while its petals are open.
  - It drops the Bio-Missile Launcher and opens the elevator to Sector 2.
- **Cryo-Goliath (Sector 2).** An ice-sheathed four-legged beast with bone tusks.
  - It attacks with charges, stomps that bring icicles down from the ceiling, and frost-breath sweeps.
  - Dodge its charges and fire missiles into its glowing rear exhaust.
  - It drops the Cryo-Beam Infusion.
- **Torment Core (Sector 3).** A biomechanical sphere hovering among spinning shield plates.
  - It attacks with rotating laser grids and homing shock orbs.
  - Freeze its exposed cooling conduits to drop its shields, then fire missiles into its core.
  - It drops the Sonic Booster Tendons.
- **Apex Metamorph (Sector 4).** The towering, shifting source of the contagion. It fights in several phases and copies Vaelen's weapon behaviours.
  - It attacks with teleport dashes, screen-filling plasma barrages, ground shockwaves, and a final-phase tentacle thrash.
  - Wear it down with missiles and Power Bombs.
  - Defeating it starts the purge.

All guardians wind up visibly before each big attack. Their weak points glow, and they drop health during the fight. A guardian crashing onto the deck shakes the screen.

**Hazards**

- **Acidic Slime Pools.** Boiling emerald fluid that wears down energy while Vaelen is in it. Jump over it, or bridge it with frozen creatures.
- **Cryogenic Mist Vents.** Pipes spraying white vapour in constant or pulsing jets.
  - The spray freezes Vaelen in place and knocks back the shell.
  - Time a way past it, or shut it off with a missile into its valve.
- **Spore Spikes.** Thorn clusters in pits and shafts. They damage Vaelen and bounce her into the air. They cannot be destroyed.
- **Crumble Flesh-Blocks.** Veined, cracked floor that collapses soon after Vaelen stands on it and drops her below. It regrows once she has left.
- **Super-Heated Steam Jets.** Jets that blast across walkways on a steady rhythm. Pass between blasts.
- **Falling stalactites and icicles (Sector 2).** They drop when Vaelen comes near.

**Upgrades**

Upgrades are glowing relics on pedestals. Each is collected once and lasts the whole game.

- **Morph Bio-Shell.** A pulsing sphere. It gives shell form.
- **Bio-Missile Launcher.** A chitinous arm pod glowing crimson. It gives missiles, and the missile counter appears on the HUD.
- **Cryo-Beam Infusion.** A crystalline core with pale azure frost.
- **Sonic Booster Tendons.** Leg sinews crackling with sparks. Boosting starts by itself during long uninterrupted sprints.
- **Resonator Power Bomb.** A dense sphere glowing with unstable gold.

**Pickups**

- **Bio-Energy Cell.** A floating amber orb. It restores some energy.
- **Missile Munition Pod.** A small crimson cylinder resting where a creature died. It restocks missiles.
- **Energy Expansion Tank.** A golden sarcophagus pod hidden in secret puzzle rooms. It raises maximum energy. Each one can be taken once.
- **Missile Capacity Reserve.** A crimson relic canister hidden behind bombable walls and speed blocks. It raises maximum missiles. Each one can be taken once.

**Props**

- **Blue Iris Gate.** A fleshy hatch with a cyan sensor eye.
- **Red Armored Gate.** Covered by a hardened crimson carapace plate.
- **Green Cryo Gate.** Frosted, with emerald conduits.
- **Yellow Resonator Gate.** Golden alloy held by root clamps.
- **Biocell Save Sanctuary.** A sterile chamber with a lit floor dais and nutrient mist. No creature can enter it.
- **Cartography Terminal.** A holographic star-chart console. It works once per sector and stays lit afterwards as a landmark.
- **Morph Ducts & Bio-Vents.** Narrow ribbed tunnels for shell form.
- **Calcified Bone Barricades.** Thick bone pillars. A boost or a Power Bomb breaks them for good.
- **Brittle sandstone blocks.** Cracked by shell charges.

**HUD**

- **Suit Energy Gauge.** Top left. A segmented bar with reserve tanks.
- **Missile Munition Counter.** Beside the gauge. It shows current and maximum missiles.
- **Sector Mini-Map.** Top right.
  - Visited rooms show as solid blocks; neighbouring rooms show as dotted outlines.
  - It flags save rooms, elevators and items.
- **Threat Proximity Sensor.** Under the mini-map. It pulses and spreads static across the HUD while the Stalker is near.
- **Evacuation Countdown Clock.** Top centre, during the escape only. A crimson clock with pulsing alarms.
- **On-screen buttons.** A pause button and a mute button.

### Places

The **Central Transit Shaft** is a huge elevator corridor and the hub of the map. Each sector joins it through coloured blast gates.

Layout rules for the whole map:

- Barriers seen early are promises of later upgrades.
- One-way drops always loop back to the hub by ducts, frozen-creature steps or breakable blocks. There are no dead ends and no soft-locks.
- Sanctuaries sit before hazard gauntlets, before every guardian, and right after the Stalker zone. They are never far from a hard fight.

**Sector 1: The Sunken Overgrowth (Botanical Nursery)**

This is the uppermost zone: overgrown courtyards, glowing vines, crumbling sandstone arches and shallow pools.

- **Landing Atrium.** The safe, sunny start. Vaelen learns to run, jump and fire on slow Tendril Crawlers.
- **The Ruined Nave.** High platforms sit out of reach for later.
- **Nursery Sanctuary Alpha.** The first save room. The sector's Cartography Terminal is next to it.
- **The Thorny Burrow.** The Morph Bio-Shell sits on its pedestal here, with a chime when it is claimed.
- **Sub-Floor Drainage Ducts.** A shell-only maze that teaches rolling and cracking sandstone with charges.
- **Broodmother's Conservatory.** The boss arena, a greenhouse dome.

**Sector 2: The Cryogenic Catacombs (Sub-Zero Vaults)**

Frozen burial vaults with frosted sarcophagi, slick ice, falling stalactites and mist vents.

- **The Glacial Shaft.** A steep icy climb with falling icicles.
- **The Red Gate Threshold.** The first missile gate.
- **Chitinous Chasm.** A cavern over slime pools, with Leapers on the upper ledges.
- **The Crypt of Relics.** A secret shell puzzle over Crumble Flesh-Blocks, hiding an Energy Expansion Tank.
- **Catacomb Sanctuary Beta.**
- **Arena of the Frostbound.** The boss arena, a frosted colosseum.

**Sector 3: The Geothermal Foundry (Magma Core & Hive Shafts)**

Industrial halls fused with hives and thermal trenches: hot walkways, steam jets, slime basins and Siphon swarms. Reached through Green Cryo Gates.

- **The Molten Incline.** Spore Drifters float over magma trenches. Freeze them to cross.
- **The Echoing Galleries.** The Stalker's domain. The lights buzz, the music cuts, and the Stalker drops from an overhead grating.
  - Vaelen hides in alcoves and vents while it paces past.
  - The far airlock ends the pursuit.
- **Foundry Sanctuary Gamma.** Directly past the Stalker zone.
- **Turbine Assembly Floor.** Catwalks under steam valves, with Siphon Parasite swarms.
- **The Magnetic Caldera.** The boss arena, electrified.

**Sector 4: The Apex Sanctuary & Evacuation Spire (Temple Heart & Shuttle Hangar)**

The innermost sanctum, where cosmic roots swallow the spires.

- **The Booster Runway.** A long flat hall. A boost smashes the bone wall at its end that seals Sector 4.
- **The Hive Spire.** A cathedral of pulsing matter. Hidden ceiling vents lead to the Resonator Power Bomb.
- **Sanctuary Delta.** The last save before the inner sanctum.
- **Chamber of the Apex Metamorph.** The final arena, a ritual hall.
- **The Evacuation Runway & Extraction Hangar.** After the purge begins:
  - sealed maintenance shafts open across all sectors;
  - Vaelen races through familiar rooms, crumbling and lit by red beacons, to the shuttle on the surface landing deck;
  - the shuttle launches as the temple collapses.

### Progression

1. Vaelen arrives with the beam and the jump. She can explore Sector 1 up to its low crawlspaces and red gates.
2. The Morph Bio-Shell opens the vents that lead to the Broodmother.
3. The Bio-Missile Launcher opens red gates, and with them Sector 2.
4. The Cryo-Beam Infusion opens green gates and turns flyers into platforms. This opens Sector 3.
5. Vaelen survives the Stalker and reaches the Torment Core.
6. The Sonic Booster Tendons break bone barricades and open Sector 4.
7. The Resonator Power Bomb opens yellow gates and breaks dense carapaces. It also opens late backtracking to hidden tanks and reserves.
8. The Apex Metamorph falls, and the escape begins.

### Screens and flow

- **Title screen:** "Torch", the save slots, and new game or continue.
- **Play:** The HUD, with the on-screen pause and mute buttons.
- **Pause menu:** The Full-Screen Map Hologram, which can be panned and zoomed. It shows the discovered sectors, elevator shafts, locked gates and exploration statistics. The menu also offers save to slot, mute, resume, and quit to title.
- **Defeat:** A fade to black, then play resumes at the last sanctuary.
- **Debrief:** Clear time, discovery percentage, suit status and best previous record, with an invitation to play again. It then returns to the title screen.
- **Mute:** Mute is remembered between sessions.
- **Phone held upright:** The game asks to be turned to landscape.

### Controls

| Action                                           | Desktop                                          | Touch                     | Gamepad              |
| ------------------------------------------------ | ------------------------------------------------ | ------------------------- | -------------------- |
| Move                                             | A / D / ArrowLeft / ArrowRight                   | Virtual stick (left)      | Left stick           |
| Aim                                              | Mouse pointer, snapped (keyboard alone: forward) | Virtual stick direction   | Left stick direction |
| Jump                                             | W / ArrowUp                                      | Button A (right)          | A                    |
| Fire Beam / charge (hold) / drop charge in shell | J / Z / Left click                               | Button B (right)          | X                    |
| Arm Missiles (toggle)                            | K / X / Right click                              | Toggle icon near Button B | RB                   |
| Crouch, then Morph Shell                         | S / ArrowDown                                    | Swipe down                | D-pad down           |
| Pause                                            | On-screen button                                 | On-screen button          | Start                |

On-screen controls appear only on touch screens.

### How a new player learns

There are no text tutorials. The first go teaches by doing, with one lesson per room:

- **Landing Atrium:** wide safe floors and lone slow Crawlers teach running, jumping, aiming and firing.
- **The Ruined Nave:** ledges out of reach teach that some places come later.
- **Nursery Sanctuary Alpha:** shows saving and healing.
- **The Thorny Burrow and the Drainage Ducts:** teach rolling and charges.
- **The Red Gate Threshold:** teaches missile gates.
- **The Molten Incline:** teaches freezing creatures into platforms.
- **The Booster Runway:** teaches the boost.

## Difficulty & Feel

### Difficulty targets

- **Onboarding:** A new player understands running, jumping, aiming and firing almost at once in Sector 1, without reading anything.
- **Early forgiveness:** A careless player who bumps into Sector 1 creatures loses only a sliver of energy. Drops are reliable, so an attentive beginner almost never loses in the opening sector.
- **Exploration pays:** A player who rushes the critical path starts taking heavy guardian damage by Sector 3. A player who hunts the hidden tanks and reserves can take several guardian hits and survive a glancing blow from the Stalker.
- **Tense but fair stealth:** The Stalker's warnings come early enough to reach cover before it sees Vaelen. The fear is real, but there is no trial-and-error.
- **Bosses:** Wins come from reading clear wind-ups and patterns, not from twitch reflexes.
- **Tight escape:** On a first clear, a capable player who boosts and uses known shortcuts reaches the shuttle with just enough time. A few stumbles do not doom the run.
- **Gentle failure:** Losing never costs permanent progress.

### What gets harder

- **Sector 1:** Few creatures, wide flat platforms and predictable Crawlers. The focus is orientation, the shell, and reading the map.
- **Sector 2:** Slick ice tests jumping. Stalactites fall. Armoured Leapers demand missiles.
- **Sector 3:** Steam, hot floors, slime basins, draining Siphon swarms, and the Stalker turning corridors into stealth.
- **Sector 4:** Every hazard together, dense creatures, fire from several directions, crumbling floors, and a multi-phase guardian that needs fast switching between beam, missiles and shell charges.
- **Vaelen's arc:** She starts fragile and cautious. She ends as a supersonic, heavily armoured powerhouse who freezes swarms, rockets through gates and shatters walls. Aggressive play is rewarded by the drops.

### Feel

- **Movement:** Snappy, instant stops on stone, and an expressive variable jump with a buoyant apex. Rolling in shell form keeps its momentum.
- **Impact:** Beam hits flare with a tiny hit-stop. Missiles boom and kick Vaelen back with a small hop. Landings puff dust and give a hydraulic hiss.
- **Stalker dread:** A hollow drone, buzzing flickering lamps and heavy footsteps. Dread without graphic horror.
- **Pickups:** Energy cells sparkle and stream into Vaelen's chest plate with a bright chime.
- **Optional polish, only if time allows:**
  - Blast doors flash white and slide apart when hit by the right shot.
  - The screen shakes when a boss crashes onto the deck.
  - Vaelen's suit flashes red and bounces on contact with a creature.
  - The lights flicker and buzz when the Stalker enters.
  - Morphing gives a crisp metallic click.
  - Orbs sparkle into the chest plate.

## The look

- **Style:** Atmospheric pixel art. Biopunk organic growth fused with ancient alien temple masonry, lit by glowing spores, flickering conduits and soft shadow.
- **Palette:**
  - deep obsidian stone;
  - radiant teal visor;
  - emerald spores and slime;
  - amber energy cells;
  - icy cyan beams and frost;
  - crimson for missiles and the Stalker's optics;
  - violet Siphon wings;
  - gold for the Power Bomb and the yellow gates.
- **Key words:** Bioluminescent, ancient, overgrown, eerie but child-safe, Torch.

---

## A prototype

This build is a prototype: the design's whole game, playable from the title to the win and lose screens, made quickly to find out whether it is fun. No art, sounds or music were made for it. `assets.json` loads nothing and the contact sheet is blank: everything the game shows and plays is made in code, with the engine, by this build. Wherever the briefs speak of the art, the art is what you draw.

- **The look.** Draw the game the way The look describes: its palette, its shapes, its mood. Keep one style throughout. Give every entity a clear silhouette and a color of its own, so a player tells everything apart at a glance, at phone size.
- **Pictures.** Paint each entity, tile, background, button and panel once, as the game starts, with `game.paint(name, width, height, ctx => …)` and the Canvas 2D API (an animation is `{ frames }`, drawn with `(ctx, i)`); a sprite shows it with `texture: name`, at its size. Name each picture for what it is (`player`, `enemy-bat`, `tile-grass`, `button-play`), as a full build's Assets section names its files: when real art is made later, it replaces your pictures by those names. `game.background` gives a scene its color, gradient or stars; `game.graphics()` draws what changes while the game runs (trails, glows, meters).
- **Words.** The title and every word on screen are `game.text`, with a stroke or shadow where they sit over the scene. The title screen is the game's name over a scene drawn like the rest of the game.
- **Effects.** `game.particles` (its shapes are `particle:spark`, `particle:soft` and more, or your own pictures), `game.tween` and `game.feel` add the juice the guides ask for.
- **Sound.** Define every sound effect by name as a synthesized sound with `game.sound.defineAll`, and play it by name. Where the design has music, it is a short chiptune in the audio pack's notation, played with `game.sound.loop`.
- **What stays whole.** Everything in the design above: every rule, entity, level, screen and control. A prototype is plain in its art, never in its game.

---

## Debug controls

These let the team and the designer reach any sector, boss, upgrade or ending at once, without playing through the hours of exploration that lead there.

| Control           | Takes                                                                                                     | Does                                                                                                                                                                                      |
| ----------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| sector            | n: 1 to 4                                                                                                 | Starts the game at the first room of that sector as a player would find it: earlier sectors' guardians beaten, their upgrades owned, gates opened, and energy and missiles full.          |
| room              | name: a room name, e.g. "Echoing Galleries" or "Thorny Burrow"                                            | Starts the game in that room with the progress a player would have there: earlier guardians beaten and their upgrades owned. The Stalker sequence runs if the room is in Sector 3.        |
| boss              | n: 1 to 4                                                                                                 | Starts in that guardian's arena (1 Gorgon Broodmother, 2 Cryo-Goliath, 3 Torment Core, 4 Apex Metamorph) with the upgrades a player would have there and full energy and missiles.        |
| escape            | nothing                                                                                                   | Starts the purge as a player would find it after the Apex Metamorph falls: all upgrades owned, the Evacuation Countdown Clock running, and Vaelen in the Chamber of the Apex Metamorph.   |
| screen            | name: title, debrief or defeat                                                                            | Shows that screen. Debrief shows the clear time, discovery percentage and suit status as for the current progress, and defeat plays the normal fade and the return to the last sanctuary. |
| give              | item: morph-shell, missile-launcher, cryo-beam, sonic-booster, power-bomb, energy-tank or missile-reserve | Gives that upgrade or pickup at once. Tanks and reserves raise the maximum as they do in play.                                                                                            |
| refill            | what: energy or missiles                                                                                  | Fills Vaelen's energy or missiles to the current maximum.                                                                                                                                 |
| infinite-energy   | state: on or off                                                                                          | Energy never drops, though damage still flashes, recoils and gives invulnerability.                                                                                                       |
| infinite-missiles | state: on or off                                                                                          | Missiles are never used up.                                                                                                                                                               |
| invincible        | state: on or off                                                                                          | Vaelen takes no damage from creatures, hazards or the Shadow Stalker, and its freeze blast does nothing.                                                                                  |
| unlock-all        | state: on or off                                                                                          | Every Blue, Red, Green and Yellow gate acts as open.                                                                                                                                      |
| stalker           | state: on or off                                                                                          | Turns off the Shadow Stalker's pursuit in the Echoing Galleries, so the sector can be crossed without hiding.                                                                             |
| freeze-clock      | state: on or off                                                                                          | The Evacuation Countdown Clock stops during the escape.                                                                                                                                   |
| slow-motion       | state: on or off                                                                                          | Runs the game at reduced speed, to check wind-ups and timing.                                                                                                                             |
| win-boss          | nothing                                                                                                   | Defeats the current guardian by the game's own path: the shake of its fall, its drop, the elevator opening, and the sounds. In the final arena it starts the purge.                       |
| lose-life         | nothing                                                                                                   | Sends Vaelen through the normal defeat: the suit vents smoke, the screen fades, and play resumes at the last sanctuary with full energy and missiles and all progress kept.               |
| end-run           | nothing                                                                                                   | Reaches the shuttle through the game's own ending: the launch, the collapse, and the debrief with real clear time, discovery percentage and suit status.                                  |

In the engine each is added once at boot with `game.cheats.add({ name, does, args, run })` (the kernel manual says how); `bake play` lists them with `cheat` and runs one with `cheat <name> [args]`; a person opens them in a panel with the backquote key (`), or with `?cheats` in the address.

---

## Recommended packs

| Pack              | For                                                                                                                                                                        | Notes                                                                                                                                                                          |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `platform-map`    | The temple rooms as cells: solid, one-way and hazard cells, plus the Crumble Flesh-Blocks, brittle sandstone, Calcified Bone Barricades and gates that change at run time. | The core: build on it. Gates (Blue, Red, Green, Yellow), upgrade rules, the Stalker and bosses are the game's own code. Map discovery is also left to the game.                |
| `platform-walker` | Vaelen's and the creatures' movement: run, variable-height jump, falls.                                                                                                    | The core: build on it. Coyote time, jump buffering and corner correction may need to be added or checked. Shell form, boost, icy slickness and aiming are the game's own code. |
| `controls-2d`     | Named intents and the move and aim axes across keyboard, gamepad and touch.                                                                                                | The mouse-pointer aim, snapped to allowed directions, and the rule that aiming down is air-only are the game's own code.                                                       |
| `controls-touch`  | The virtual stick, buttons A and B, and the missile toggle icon.                                                                                                           | Shown only on touch screens. The swipe-down crouch and the landscape prompt need the game's own code.                                                                          |

From a search of the pack library for this design, made before the build: recommendations for the lead, who checks each (`packs.mjs get <id>`), chooses, and adds what fits. A pack that doesn't fit the game is left out. `core-2d` and the packs it brings (maths, color, typography, audio, ui, tween, save, backdrops, backdrop-sky, backdrop-stars, feel, render-auto, world-screen, world-side, rig-follow, render-texture, particle-textures, particles-2d, collision, pointer) are in the game already.
