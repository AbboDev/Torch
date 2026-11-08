# Side-on world

A 2D side-on world: platformers, shooters, anything with a horizon. Within a
layer, objects draw by `z`, then spawn order. No y-sort — depth is declared,
not derived from where a sprite stands. It installs the same 2D camera and
`toWorld` / `toScreen` as the top-down world, and can wrap the world into a
torus for an arena.

## When to use it

Platformers, runners, horizontal and vertical shooters, brick breakers, an
Asteroids arena. Choose `world-topdown` when a character should walk behind
things by standing higher on screen. Pairs with `physics-2d` for gravity and
platforms, `tiles-2d` for a tilemap, `rig-follow` for the camera, `controls-2d`
for input, `world-screen` for a HUD. 2D only; one 2D world per game.

## Requires

Nothing. It is the world; a backend (`render-webgpu` or `render-webgl2`, usually through `render-auto`) draws what it sorts.

## API

### Spawning into it

```ts
game.spawn({ id: "cloud", x, y, layer: "back" });
game.spawn({ id: "hero", x, y, layer: "world", z: 1 }); // over same-layer z:0
```

- Layers (back to front): `back`, `world`, `front` unless the manifest says otherwise. An unknown layer is an error.
- `world-screen`'s `underlay` (frames, highlights, panels behind the pieces, in screen pixels) draws straight after the first layer and before the second; its `underlayAbove` option moves it after another.
- Same camera and `toWorld`/`toScreen` as every 2D world.

### `game.world`

- `kind` — `'side'`.
- `layers` — the layer names, back to front.
- `toWorld(sx, sy)` — screen (logical pixels) to world.
- `toScreen(wx, wy)` — world to screen.
- `wrap` — the wrap size `{ w, h }`, or null.
- `view` — what the camera is looking at now, in world units: `x`, `y` (the top-left corner), `w`, `h` and the centre `cx`, `cy`. Worked out at every read from the camera's position and zoom, so it is never a frame behind.
- `vw(f)` — the world x a fraction `f` across the view: 0 the left edge, 1 the right, so `vw(0.5)` is always the middle of the screen.
- `vh(f)` — the world y a fraction `f` down the view: 0 the top, 1 the bottom.

```ts
const p = game.input.pointer; // screen pixels
if (p) {
  const at = game.world.toWorld(p.x, p.y); /* … */
}
game.spawn({
  id: "bird",
  x: game.world.vw(1) + 32,
  y: game.world.vh(0.25),
  layer: "front",
}); // just off the right of the view
```

## Options

- `layers` — draw layers, back to front. Default `['back', 'world', 'front']`.
- `wrap` — `{ w, h }` in world units: a toroidal world. Default none.

## Wrapping

If the manifest sets `wrap: { w, h }` the world is a torus: positions wrap,
everything draws at its nearest image to the camera, the camera follows across
the seam, and `near`/`inRect`/collision see across it. **Never wrap a
coordinate in game code** — the engine does it after every step. `game.world.wrap`
tells you the size (e.g. to spawn along an edge).

## Limits

- Two objects with the same layer and `z` draw in spawn order; a later spawn is on top, and nothing reorders them.
- A layer name not in the list throws at spawn.
- Wrapping is all or nothing; a platformer that wraps horizontally only must use a wide world and a bounds clamp instead.
- The camera has no rotation in 2D.
