# Scene transitions

A proper scene change instead of an instant cut. The screen is covered, the
scene changes while nothing new can be seen, and the cover lifts off the new
scene: the title fading into the first level, an iris closing on the player as
they die, a wipe between rooms, the title screen shattering into the game. The
cover is either a solid colour or the outgoing frame itself. Nine looks mask the
colour: a cut, a fade, an iris, a wipe at any angle, growing diamonds, venetian
blinds, a soft noise dissolve, square pixels filling in a random order and a
clock-hand sweep. Three copy the last frame of the old scene and take it away
over the new one: a crossfade, a zoom into a point, and a shatter into falling
shards.

## When to use it

Any `game.scenes.go` a player sees: a title screen's exit into play, a level
change, a death and restart, a return to the menu. Call `game.transition.go`
instead and the pack calls `scenes.go` for you, at the moment the screen is
fully covered. It runs on the game clock, so it pauses with the game, slows
with `timeScale`, replays the same from a seed and works under
`game.advance` in headless tools. It is drawn over everything, the HUD
included, in 2D and 3D, on WebGPU and WebGL2. For pause menus and overlays keep
`scenes.push` and `pop`: a transition replaces the whole stack.

Which kind:

- **A colour cover** (`fade`, `iris`, `wipe`, `diamonds`, `blinds`,
  `dissolve`, `pixels`, `radial`) when the two scenes should not be seen
  together: a death, a restart, a load that takes a moment, a change of place.
  The screen is plainly blank in between, so `cover()` and `uncover()` can hide
  work. `fade` is the quiet default; `iris` on the player for a death or a
  level clear; `wipe`, `blinds` and `diamonds` for a brisk arcade change;
  `dissolve` and `pixels` for something softer or more retro; `radial` for a
  time-up.
- **`crossfade`** when the new scene should grow out of the old with no blank in
  between: a menu into a game in the same world, day into night, one camera
  into the next. It is also what `zoom` and `shatter` become under reduced
  motion.
- **`zoom`** for a title screen into play: the old frame flies toward `at` —
  set it to the logo or the Start button — growing and blurring as it fades.
- **`shatter`** for a big moment: a title smashed into the game, a boss
  breaking the screen, a game over. The old frame cracks from `at` and its
  shards tumble and fall, each with a soft shadow, and the new scene shows
  through the cracks first. `cells` sets the shard size.
- **`cut`** when the change should be instant: for a player who has turned
  transitions off, say.

Other packs use it through the registry rather than through game code: a
title-screen or level-flow pack calls
`k.registry.get('transition', 'transition')?.go(...)` and falls back to a plain
`scenes.go` when the pack is not composed.

## Requires

Nothing. No world, HUD layer, font or asset. Headless (no backend) the timing
and the scene change still run and nothing is drawn. The frame kinds read the
finished frame that both backends publish to packs drawing after them (the
swapchain texture on WebGPU, the scene target on WebGL2), the same way the post
chain does; they need no other pack.

## API

```ts
// The whole thing: cover, swap, hold, uncover. Resolves once the new scene is clear.
await game.transition.go("play");
await game.transition.go("play", {
  kind: "iris",
  at: { x: hero.x, y: hero.y },
  duration: 0.8,
});
await game.transition.go("level2", {
  kind: "wipe",
  angle: 90,
  color: "#1b1030",
});
game.transition.go("title", { kind: "diamonds", in: "fade", cells: 8 });

// The outgoing frame as the cover: no colour, no blank between the scenes.
await game.transition.go("play", {
  kind: "zoom",
  at: { x: logo.x, y: logo.y },
  duration: 1,
});
await game.transition.go("play", {
  kind: "shatter",
  at: { x: pointer.x, y: pointer.y },
  duration: 1.2,
  cells: 8,
});
await game.transition.go("night", { kind: "crossfade", duration: 1.5 });
await game.transition.go("room2", { kind: "crossfade", in: "wipe", angle: 30 }); // the old room wiped off the new one
await game.transition.go("play", {
  kind: "iris",
  in: "shatter",
  color: "#120a24",
}); // the colour cover breaks

// In two halves, with work in between: cover, load, then go (which swaps at once and uncovers).
await game.transition.cover({ kind: "pixels" });
await game.assets.load(nextLevel).done;
await game.transition.go("level2");

// Or cover and uncover by hand, swapping yourself.
await game.transition.cover({ kind: "blinds" });
game.scenes.go("shop");
await game.transition.uncover(); // the look and pace it covered with

game.transition.active; // true while covering, covered or uncovering
game.transition.progress; // 0 clear … 1 fully covered
```

- `go(scene, opts)` covers, calls `scenes.go(scene)` at the covered moment,
  holds, then uncovers. Resolves once uncovered. A second call while one runs
  is refused with a console warning and resolves at once, so a title screen
  that calls it on every key press cannot start two. Throws if the scene is not
  registered. After `cover()` it swaps at once, holds and uncovers.
- `cover(opts)` covers and resolves when covered. The cover stays up until
  `uncover()` or `go()`. Already covered: resolves at once.
- `uncover(opts)` lifts a cover put up by `cover()` and resolves when clear.
  With no options it uses the look and the pace the screen was covered with.
  Already clear: resolves at once.
- `active` and `progress` are read-only. `progress` is eased, rising to 1 and
  falling back to 0.
- `TRANSITION_KINDS` lists every kind, for a picker or a validator;
  `FRAME_KINDS` the three that cover with the outgoing frame.
- Registry: `k.registry.get('transition', 'transition')` is the same object.
- `game.inspect().packs.transition` reports `{ active, progress, kind, phase }`,
  `phase` one of `idle`, `covering`, `covered`, `uncovering`.

| kind        | the cover                                                                                               |
| ----------- | ------------------------------------------------------------------------------------------------------- |
| `cut`       | none: the scene changes at once. As `in`, the cover vanishes at once.                                   |
| `fade`      | the whole screen at once                                                                                |
| `iris`      | a circle closing on `at`, then opening from it                                                          |
| `wipe`      | a straight edge sweeping along `angle`, and on out the far side                                         |
| `diamonds`  | a grid of diamonds, each growing from its centre, in a wave along `angle`                               |
| `blinds`    | bands across `angle`, each closing, a little staggered                                                  |
| `dissolve`  | soft blobs of value noise                                                                               |
| `pixels`    | square cells filling in a random order                                                                  |
| `radial`    | a clock hand sweeping clockwise from twelve o'clock around `at`                                         |
| `crossfade` | the old frame, fading off the new scene                                                                 |
| `zoom`      | the old frame flying toward `at`, faster and faster, streaked along its motion, fading as it goes       |
| `shatter`   | the old frame cracking from `at` into shards that tumble and fall with soft shadows; `cells` sizes them |

Per call (`TransitionOptions`, every field optional):

| option     | default           | what it does                                                                                                                                              |
| ---------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `kind`     | `'fade'`          | the look                                                                                                                                                  |
| `in`       | the same kind     | how the new scene is uncovered                                                                                                                            |
| `duration` | 0.6               | seconds for cover, hold and uncover together; each half is (duration − hold) / 2, and after a frame cover the uncover takes all of duration − hold        |
| `hold`     | 0.05              | seconds fully covered before uncovering; for a frame cover, how long the old frame stands still over the new scene                                        |
| `color`    | `'#000000'`       | the cover colour, any CSS colour the kernel parses; unused by a frame cover                                                                               |
| `at`       | the screen centre | logical screen pixels: the centre for `iris` and `radial`, the point `zoom` flies into, where `shatter` breaks from                                       |
| `angle`    | 0                 | degrees: 0 sweeps left to right, 90 top to bottom (`wipe`, `blinds`, `diamonds`)                                                                          |
| `softness` | 0.06              | 0..1, how soft the moving edge is                                                                                                                         |
| `cells`    | 10                | cells across the screen's short side (`diamonds`, `blinds`, `pixels`); about how many shards across it `shatter` makes near `at`, larger toward the edges |

Each half eases in and out (cubic). On the way out `wipe`, `blinds`,
`diamonds` and `radial` carry on in the direction they came; the others run
backwards, so an iris opens from the point it closed on. The dissolve, the
pixels and the shatter take a new pattern each transition, the same on every
replay.

How a frame cover runs. The cover is up at once: `progress` is 1 from the
call. The next frame drawn is copied as it is — everything on screen, the HUD
included, under only the debug overlay — and the scene is swapped on the first
step after it. Then the old frame holds for `hold` and is taken away over the
new scene, which is already running beneath it. The swap waits for a drawn
frame, not for the copy, so it falls on the same step headless, on WebGPU and
on WebGL2, and a replay swaps where the game did.

`kind` picks the cover and `in` the uncover, and every pairing works. A mask
`in` after a frame cover takes the old frame away by that mask, so
`{ kind: 'crossfade', in: 'wipe' }` wipes one scene off the other and
`{ kind: 'crossfade', in: 'dissolve' }` dissolves between them. A frame kind
as `in` after a colour cover takes the colour away: `shatter` breaks it into
coloured shards, and `crossfade` and `zoom` fade it. `cover()` with a frame
kind freezes the screen on the next frame while the game runs on unseen
beneath it; `go()` then swaps at once and takes the frozen frame away.

## Options

The pack's manifest options:

| option          | default            | what it does                                                                                                                                                                                                                                                  |
| --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `reducedMotion` | `'auto'`           | `'auto'` follows the player's `prefers-reduced-motion`, `'on'` turns every moving kind into a fade always (and `zoom` and `shatter` into a `crossfade`, which still shows the old frame), `'off'` never does. A cut, a fade and a crossfade stay as they are. |
| `defaults`      | a 0.6 s black fade | a `TransitionOptions` every call starts from: set the game's look once here                                                                                                                                                                                   |

```json
{
  "id": "transition",
  "options": {
    "defaults": { "kind": "iris", "color": "#120a24", "duration": 0.8 }
  }
}
```

## Limits

- A frame cover is a still copy of one frame: the old scene does not keep
  moving under a crossfade, and the new scene does not zoom or slide in, it is
  simply there beneath the old frame. There is no slide or push of one live
  scene by the other.
- A frame cover swaps one drawn frame after the call, not on the call; with
  `game.advance` at its default 10 fps that can be up to 0.1 s of game time.
- Headless, or after a lost device or context, there is no copy: a frame cover
  draws nothing and the new scene shows at once, with the same timing.
- The copy is a full-screen texture at the canvas's pixel size, held from the
  call until the transition ends and then let go. `zoom` reads the copy eight
  times a pixel; `shatter` draws two triangles (shard and shadow) for each of
  a few hundred shards, more with a large `cells`.
- One at a time: a call while one runs is refused, not queued.
- It changes scenes with `go` only; `push` and `pop` are unchanged.
- Game time, not wall time: a paused game holds a transition where it is, and
  a `go` called while paused waits for the resume. Before `game.start()` there
  are no frames, so `go`, `cover` and `uncover` finish at once.
- The old scene keeps running while it is covered, input included; a new scene
  starts with the kernel's usual input grace while it is uncovered.
- A cover colour with alpha below 1 never hides the swap.
- In dev, bad numbers (non-finite, out of range), an unknown kind or an
  unparseable colour throw; in production they fall back to the nearest valid
  value.
- One pass a frame while active, nothing while clear: a full-screen triangle,
  or the shards.
