## How to build it well

Guides for games of this kind, and for every game. The design above decides what this game is; these say how games of its kind are made to play and look well. They are guidance, not rules: where the design asks for something different, build what it asks.

### 2D platformer (this kind of game)

#### What it is

The player steers a small character through a side-on world of ledges, gaps, hazards and goals. Everything is built on one verb set, run and jump, sometimes extended with one more (dash, wall-jump, gravity flip, glide, throw). The challenge comes from how the level is laid out, and the player's skill is reading that layout and executing the route.

#### How a session plays

The player enters a room or stretch of level, reads the hazards and the exit, and tries a route. They fail quickly, come back at once, and improve each attempt until they clear it. Clearing it loads something slightly harder or stranger, often with a new trap, enemy or move. Across a session, difficulty climbs by adding and combining ideas. Levels end at a door, flag, portal or pedestal, and the session ends on a final room, a summit, or a last boss. Exploration forms add a second loop: hit a wall, find an upgrade elsewhere, and return to open the blocked path.

#### Screen and layout

- The play area fills the screen. The character, the nearby terrain and the next hazard must all be readable at a glance.
- Single-screen and flip-screen games show the whole room at once, with a hard cut at the edges. Scrolling games follow the player, leaving more view ahead than behind, and scroll vertically where the level climbs.
- The HUD is minimal and sits at the edges: a death counter and timer for precision games, health, lives or score for classic games, and keys, abilities or a map for exploration games.
- Solid ground, hazards, pickups and the exit are visually distinct. Hazards are always recognisable by colour and shape.

#### Common forms

- **Precision, room by room** (Celeste, Super Meat Boy, Jumper): one-screen rooms, instant death, near-instant respawn, a death counter and clear time as the score. A fixed jump with variable height is the core, and a dash or wall-jump may be added.
- **Classic scrolling levels** (Mario, Aladdin, Fancy Pants): left-to-right courses with patrolling enemies, stomps, pickups and a goal gate. Checkpoints, lives or health soften failure.
- **Single-screen collect-and-exit** (Bubble Bobble, Dangerous Dave, Jet Set Willy): one fixed layout per level. Collect everything or a key item, then reach the exit. Patrolling hazards run on fixed loops.
- **Exploration with ability gates** (Super Metroid, Cave Story, Ori, Knytt): one connected map of rooms. Each upgrade turns a previously impossible ledge or door into a route, with save points and some combat.
- **Gimmick platformers** (VVVVVV gravity flip, jelly surfaces, grapple swings, dimension shifts): one unusual mechanic replaces or extends the jump, and the levels teach it in steps.
- **Vertical climbers and runners**: an endless or summit-bound ascent, or an auto-scroll, with falling behind as the failure.

#### What makes it satisfying

- **Control that feels fair.** The player blames themselves for a death, not the controls.
- **Quick retries.** Failure costs seconds, so one more try is always tempting.
- **Learn, then master.** A new hazard appears in a safe setting, then returns in a tighter combination.
- **Mastery of a readable layout.** Beating a room that looked impossible on first view is the core reward.
- **Optional risk.** Gems, strawberries and hidden alcoves offer a harder route for the player who wants one.
- **A new ability recontextualising old space** in exploration games.

#### Building it well

- Tune movement first. Give acceleration, a jump with variable height, brief coyote time and jump buffering so landings forgive small misses. Design every gap against the actual jump arc, leaving some margin on the required ones.
- When the game is precision-based, make death and respawn near-instant, reset the room cleanly, and show deaths and time. Do not add lives or a game over.
- When the game has single screens, hand-author each layout in a data grid and check that it is solvable. Give each room one idea, and let later rooms combine earlier ones.
- When the game scrolls, keep the camera smooth and let it look ahead in the direction of travel. Place checkpoints before hard sections, not after.
- Keep hazards deterministic with simple patrol, cycle or trigger rules, so the player can learn them. Reuse two or three patterns in varied layouts instead of inventing new behaviours for each level.
- Introduce each mechanic in a safe spot before it is dangerous. Order rooms as a ramp with occasional easier breathers.
- When the game has enemies, make stomp or shot rules consistent. Give touch damage brief invulnerability, and give the player a visible reaction to being hit.
- When the game gates progress by abilities, make the gate visible long before it can be passed. Put save points at the junctions and keep the map small enough to learn.
- For a procedural or endless form, generate only reachable layouts, measured against the jump, and increase difficulty gradually.
- Calm clarity suits the genre. Light juice helps: a death burst, landing dust, a pickup chime, a short screen shake on big landings. Heavy effects that hide hazards or delay the respawn hurt it.
- Show the goal, the hazards and the player's current state unambiguously, and have a title, a restart key and a clear end screen showing the result.

### What every small game gets right

- **Every input answers.** Each action gets an immediate, visible response, and a sound when the game has sound. The player sees what they did and learns from it.
- **Readable at a glance.** From one screenshot, a stranger can tell what they control and what they are trying to do: one familiar verb, one clear goal.
- **One idea of its own.** The best small games take a familiar shape and change one thing — a rule, a constraint, a relationship between two things on screen — that can be said in a sentence. The brief says what that idea is; build around it.
- **Teach by playing.** The opening moments are safe and teach the main verb through play, with at most a line or two of text.
- **Fair challenge.** Threats are telegraphed before they land, and randomness sets up situations the player can read. Losses feel like the player's own mistake, which makes them want another go.
- **Something grows.** Speed, score, board, count or stakes rise through a session, so tension builds toward a clear ending.
- **Quick to try again.** Failure leads to a new attempt in a moment, with one input. The result shows beside the best result.
- **Tuned by playing.** Keep gameplay values together in one named config object, choose starting values from the feel the brief describes, and adjust them by playing. The juice, balance and difficulty guides cover each layer.

### Pressure and losing

A game is tense only when something pushes back. Decide what that is before building, make sure a careless player meets it, and make it rise as the player gets better.

#### Know what pushes back

Every game has one or two of these at its heart. Name them.

- **Threats that come for the player:** enemies, traffic, projectiles, hazards that move. The player loses by being caught or hit. Shooters, platformers, road-crossers, brawlers.
- **The clock:** a countdown, a rising tide, a closing wall. The player loses by running out of time. Arcade timers, races, survival.
- **Running out:** health, lives, ammo, money, moves, oxygen, tiles. The player loses when something they spend is gone. Tower defense, roguelikes, puzzle games with move limits.
- **An opponent:** a player or AI with the same goal. The player loses by being outscored or outplayed. Card, board, sports and fighting games.
- **The board filling up:** pieces stacking, a queue overflowing, a screen crowding. The player loses when there is no room. Tetris, match-3 with a limit, time management.

#### Make the threat real

- **Threats reach the player.** Enemies that never come close, or never shoot, are scenery. In a shooter something fires back; in a defense game something gets through an undefended path.
- **A careless player loses.** Someone who stands still, taps at random or ignores the main threat should lose, and soon enough to learn from it. If they can't, the game has no tension.
- **A good player is tested.** A strong run should come close to losing at least once. If the best players never feel danger, the top end needs more.
- **Losing is the player's own doing.** Threats are visible and telegraphed, hit areas match what is drawn, and nothing spawns on top of the player. A death the player didn't cause feels like a bug.

#### Make it rise

- **Raise one thing at a time:** speed, how many, how often, how many kinds at once, how little room is left. The player should be able to tell what changed.
- **Introduce, then combine.** A new threat appears alone and safely first, then alongside the others.
- **Rise and ease.** A hard stretch, then a breather: a calm after a boss, a slower wave, a bonus. Then higher than before.
- **The player grows too.** Upgrades, new moves and better routes let them meet the rising pressure. If the pressure rises and the player can't, the game becomes a wall; if the player grows and the pressure doesn't, it becomes a stroll.

#### Losing well

- **Show why.** A clear moment of loss: what hit them, what ran out. A short pause before the end screen, not an instant cut.
- **Partial losses first.** Lives, health or a shield give the player a warning before the end, where the form allows it.
- **The way back is quick.** One input to try again. The longer the retry, the gentler the game must be.
- **The end screen says how far they got:** the score, the wave, the level, the best so far.

#### Games without losing

Toys, sandboxes, cosy, idle and some puzzle games have no way to lose, and that is fine. Their tension comes from somewhere else: a goal to reach, a score to beat, a choice with a cost, a puzzle that resists. Name it, and make it rise in the same way.

#### Checking it by playing

Play three ways and watch what happens:

- **Do nothing,** or tap at random. Does the game end, or put the player in clear danger, in a reasonable time?
- **Play carelessly,** ignoring the main threat. Does the player lose a life or the round early on?
- **Play well.** Does the run come close to losing at least once, and does it feel fair when it does?

Remember that an agent playing step by step, reading every position and stopping time, finds every game easier than a person does. Judge the pressure as a person would meet it.

### Difficulty ramps

#### Choose what grows

Pick the one or two things that make this game harder, and raise those:

- **Action:** speed, spawn rate, enemy count, enemy types, fewer safe spaces.
- **Puzzle:** more pieces, more colors, more constraints, more steps to a solution.
- **Strategy and management:** stronger opponents, tighter resources, more things to watch at once.

Raise one axis at a time so the player can tell what changed.

#### Shape the curve like a sawtooth

Challenge rises, then eases briefly, then rises higher: a calm stretch after a boss, a new area that opens gently, a bonus round. The breathers let the player enjoy their new skill.

#### Introduce, then combine

Show each new element on its own, in a safe situation, before it appears alongside the others. The first time the player meets a new enemy or rule, they learn it; later they are tested on it.

#### Open with a win

The opening is easy enough that a newcomer succeeds and learns the one main verb by doing it. Challenge starts to build once they have it.

#### Fit the ramp to the structure

- **Endless games** ramp continuously toward a ceiling that stays humanly playable, so a great run is long and score keeps rising.
- **Level-based games** order levels from easy to hard; each level teaches or tests one idea.
- **Puzzle games** get harder through more complex setups. Add a timer when the genre is about speed.
- **Games against opponents** make the opponent stronger or smarter as the player improves.

#### Close the session clearly

Every session ends with a clear result — a win screen, or game over showing the score and the best score — and a new attempt starts with one input.

### Balance

#### Start from the experience, then derive values

Decide what the player should feel first, then work out values from it:

- "A round lasts about a minute" gives the spawn rate and the score target.
- "A jump clears three tiles" gives jump speed and gravity together.
- "The player can cross the screen in two seconds" gives movement speed.

Express values relative to the screen and the player: speeds in screens per second, sizes relative to the player sprite, timings relative to human reaction time. Relationships survive a change of resolution; raw numbers do not.

#### Treat every value as a starting guess

- Keep all tuning values together in one named config object, so they are easy to find and change.
- Tune by playing. The first values are a guess; the right values are the ones that make play feel as intended.
- Change one value at a time, then play again.

#### Make choices matter

- Riskier actions earn bigger rewards: getting close to danger, chaining, spending a scarce resource.
- In games with options (weapons, units, upgrades, cards), give each one a situation where it is the best choice.
- Upgrades change how the player plays — a new ability or a new trade-off — as well as making numbers bigger.

#### Be generous to the player

In action games, tolerance favors the player:

- Hitboxes are generous for things the player wants to touch (pickups, targets) and slightly smaller than the art for things that hurt.
- A jump still works for a moment after walking off a ledge, and a jump pressed just before landing still happens.
- Warnings come before damage.

#### Shape randomness

- Use a shuffled bag for spawn and piece sequences, so every option appears regularly and droughts stay short.
- Generated boards, deals and levels are checked to be solvable.
- Randomness sets up situations; the player's skill resolves them.

#### Economies

When the game has currency or resources, give every source a matching sink. Prices rise with what they unlock, so the player is always saving toward something.

#### Scoring

Score rewards skill: speed, precision, chains, risk. Show the current score beside the best score.

### Juice

Juice is feedback beyond what the rules need: motion, particles, shake, sound. It is a pass applied after the core loop works, and each game decides how much it wants.

#### Decide how much the game wants

- **Full juice** suits real-time action: shooters, platformers, brawlers, arcade scoring, destruction, chain reactions. Speed and impact are the reward.
- **Light juice** suits puzzles where the player thinks between moves: one clean, satisfying response per move — a piece settles with a small bounce, a cleared line flashes, a soft sound confirms.
- **Little or none** suits word games, deduction, reading-led and turn-based strategy games. Clarity and calm are the reward: a clear state change and a gentle sound are enough. Wordle's tile flip is the whole of its juice.

#### Tools, and where each fits

- **Motion on the thing that acted.** Squash on landing, stretch on a jump, a scale pop when an item is collected, tweened movement between positions.
- **Impact.** A brief hit-stop on heavy hits and a small screen shake sized to the event. Save the biggest shake for the biggest moments: an explosion, a boss hit, losing a life.
- **Particles.** A burst at the point of contact, colored like its source. Trails on fast-moving objects.
- **Traces.** Marks that stay — scorch, debris, painted tiles — so the world records what the player did.
- **Sound.** A distinct sound for each meaningful event. Slight random pitch on repeated sounds; rising pitch through a combo or chain.
- **Score feedback.** Points float up from where they were earned; a combo counter grows as the chain grows.
- **Anticipation.** A flash, wind-up or warning line before a threat lands. This also makes the game fairer.

#### Scale feedback to the event

Common, small events get small, quick feedback. Rare, important events get the largest. The hierarchy tells the player what matters.

#### Keep play readable

Effects are short and fade fast. The player, threats and targets stay clearly visible through every effect. Shake moves the camera, and the HUD stays still.

#### Order of work

1. Build the loop plain and make it playable.
2. Add juice to the events that happen most and matter most.
3. Play after each addition and keep what makes the game clearer or better to play.

### Presentation

Players judge a game by how it looks in the first few seconds. Polished games get these things right by default, and they are easy to miss because nothing breaks when they are wrong. Check for them in every screenshot.

#### Layout that never breaks

- **Text fits.** No label runs past its button or panel, and none is cut off at the edge of the screen. Long words, big numbers and the longest score the game can reach still fit.
- **Nothing overlaps by accident.** Buttons, labels and HUD items don't sit on top of each other, and the HUD doesn't cover the play area where the action happens.
- **Room between things.** Buttons are far enough apart that a thumb hits the one it meant, and big enough to hit on a phone. Related items are grouped; unrelated ones have space between them.
- **Inside the screen.** Everything important stays clear of the edges and corners, where phones cut into the screen.
- **Lined up.** Items in a row share a baseline; items in a column share an edge. Things are centred when they look centred.
- **Readable at phone size.** Text is big enough and has enough contrast against what is behind it. Over a busy picture, text sits on a panel or has an outline or shadow.

#### One look

- **One visual style on a screen.** Fonts, buttons, panels, icons and colours come from one family. A plain default button beside pixel art, or two fonts doing the same job, looks unfinished.
- **The same across screens.** The title, play, pause and end screens look like one game: the same button style, the same fonts, the same palette.
- **Match the art.** Code-drawn shapes, panels and effects take their colours and style from the game's art and palette, not from defaults.

#### Smooth in, smooth out

- **Nothing pops.** Screens, panels, buttons and messages fade, slide or scale in and out instead of appearing and vanishing in one frame.
- **Scene changes have a transition:** a short fade or wipe between title, play and end screens.
- **Music fades** between tracks and out at the end, rather than cutting.
- **Keep it quick.** Transitions are short, and the player can act as soon as the next screen is readable.

#### A screen that is alive

A still screen looks broken. Something should always be moving a little.

- **Idle motion:** the player character breathes or bobs, water ripples, lights flicker, background layers drift.
- **Shine and shimmer** on things worth having: pickups glint, the logo shimmers, a button the player should press pulses.
- **Prompts move:** "press to start" pulses or bobs instead of sitting still.
- **Responses to input:** buttons react when hovered and pressed, and every tap or key gets a visible answer.
- **Keep it calm where it should be.** Motion is gentle and never hides what the player needs to see. A calm puzzle game wants less of it than an arcade game, but not none.

#### Checking it in screenshots

Look at every shot, at the size it will be played, and ask:

- Is any text cut off, overflowing or too small to read?
- Does anything overlap, or sit too close to something else?
- Is everything inside the screen and lined up?
- Is there one visual style, the same as the other screens?
- Does anything on screen move, shine or respond?
- Between two shots, did things fade in and out, or pop?

### Common mistakes

These come up again and again in small games. None of them is a rule. Each is a question worth asking of a build, and each says when the answer can be "that's on purpose". The game's own design always wins: when it asks for something on this list, build what it asks.

#### Play

- **Nothing can beat the player.** You see a careless player survive anything, or a player who stands still win. Usually the threats don't reach the player, or never speed up. Fine in toys, sandboxes, cosy and idle games, where the tension comes from something else: a goal, a timer, a choice.
- **The player can't win.** You see a level that can't be finished, or a goal nobody reached in testing. Usually it is a state the code never expected: an item that can't be collected after a miss, a spawn behind a wall. Play to the end at least once.
- **Progress gets stuck.** You see a step that can't happen any more: a second pickup refused, a door that stays shut, a recipe that can't complete. Usually an order of events the code didn't allow for. Check what happens after each kind of mistake.
- **The first minute is the hardest.** You see newcomers lose before they understand the verb. Usually the game opens at full speed. Arcade games that are meant to bite from the start are the exception, as long as the retry is instant.
- **Unfamiliar rules, no teaching.** You see a player who doesn't know what to do. A card game or a new mechanic needs its rules shown in play, a step at a time. A well-known form (a Frogger, a Breakout) needs less.
- **Same start every time.** You see an identical opening on every run. Usually a fixed seed or spawn table. Fine for puzzles and hand-made levels, where the sameness is the point.

#### Fit and fairness

- **The art and the rules disagree.** You see a hit that didn't touch, a miss that should have hit, pins too wide for the gap between them, lanes off the painted lanes. Usually the collision was sized separately from the picture. Make them agree, or move the code to fit the art.
- **A control does the opposite of what it says.** You see a drag left that throws right, or up that moves down. Usually an inverted sign. Check each control once, in each direction.
- **One press does two things.** You see a press that starts the game and also hops, or a menu tap that also fires. Usually input from one scene leaking into the next.
- **A death the player didn't cause.** You see a spawn on top of the player, a threat with no warning, a hit while invulnerable. Usually spawns that ignore where the player is. Every loss should feel like the player's own mistake.

#### State and flow

- **Restart doesn't reset everything.** You see timers, music, speed-ups or leftover objects carrying into the new run. Usually state kept outside the scene that resets it.
- **Pause doesn't stop everything.** You see a timer still counting, or enemies still moving, under the pause screen.
- **Things pile up.** You see the game slow down over a long run, or objects collecting off-screen. Usually things that spawn with nothing to remove them.
- **Debug left in.** You see a key that skips levels or grants lives in the finished game. Remove it, or keep it behind something no player would press.

#### Sound

- **Silence until the first tap.** Browsers start audio only after the first input. The title can't rely on sound before it.
- **Sounds that stack.** You see the same sound played many times at once, or two music tracks after a restart. Stop the old one before starting the new one.

#### How to use this

Read it before reviewing, then play. When a build does one of these things, ask whether the design meant it. When it did, leave it.
