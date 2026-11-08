# On-screen touch controls

Buttons and a thumb stick that press key **codes**, so a phone drives the same
bindings as a keyboard.

```ts
game.kernel.input.bind("jump", ["Space", "Touch:jump"]);
game.kernel.input.bind("left", ["ArrowLeft", "KeyA", "Touch:left"]);
```

```json
{
  "id": "controls-touch",
  "options": {
    "stick": {
      "codes": {
        "left": "Touch:left",
        "right": "Touch:right",
        "up": "Touch:up",
        "down": "Touch:down"
      }
    },
    "buttons": [{ "code": "Touch:jump", "label": "A" }]
  }
}
```

## When to use it

Any game that should be playable on a phone. Skip it for a desktop-only game, and
for a game on `rig-minecraft`, which reads its own touch scheme (a floating joystick
on the left half, drag to look on the right, jump and sneak buttons) and hands the game
its layout to draw. `rig-fps` has no touch layout: a finger can drag to look, but moving
needs the keys.

## Requires

`world:screen` (`world-screen`), for the layer the controls draw on, and `typography`,
which draws the buttons' labels, both composed before it. The disc and ring are baked
into the atlas at attach, so the controls need no art.

## How it works

**A control presses a key code, not an action.** The usual alternative — reading a
stick vector in one place and a bound action in another — gives a game two ways to
move and tests only one of them. Use a code no keyboard has (`'Touch:jump'`) and bind
it alongside the real keys; from then on there is one rule for movement and the touch
layout is a skin over it.

**A button captures its pointer.** A thumb that slides off the button keeps it held,
because on a phone a thumb always slides, and a jump that cancels itself mid-press is
unplayable.

**The stick clamps past its ring** rather than releasing: a finger that overshoots is
still asking to go that way. Its **deadzone** (0.35 of the radius by default) stops a
resting thumb jittering between left and right, which reads as the game fighting the
player.

**Hiding releases.** Setting `visible = false` releases every code the controls hold —
a key held down by a control nobody can see is a stuck key.

Codes pressed here are visible to the actions **in the same step**, not the next
frame, so there is no hidden frame of lag between the finger and the game.

## API

`game.touch`:

|                |                                                                                                                                                                                      |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `visible`      | are the controls up; set it to force them on desktop or hide them in a cutscene                                                                                                      |
| `stick`        | the thumb offset, each axis −1..1, already past the deadzone                                                                                                                         |
| `held`         | the codes the controls hold right now                                                                                                                                                |
| `button(spec)` | add a button after attach; one added while a scene runs is that scene's, and goes (releasing its code) when the scene does, while the buttons in the options stay for the whole game |
| `touchDevice`  | the device reports touch, whatever `visible` says                                                                                                                                    |

## Options

| option      | default | meaning                                                                                                                           |
| ----------- | ------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `buttons`   | none    | `{ code, label?, anchor?, x?, y?, r?, tint? }` each.                                                                              |
| `stick`     | none    | `{ codes: { left?, right?, up?, down? }, anchor?, x?, y?, r?, deadzone?, tint? }`.                                                |
| `touchOnly` | `true`  | Show only on a touch device — a desktop player does not want a d-pad over their game, and a phone player cannot play without one. |
| `alpha`     | `0.35`  | Visible enough to aim at, faint enough to see the game through.                                                                   |
| `layer`     | `hud`   | Any roster layer.                                                                                                                 |

An anchor is one of `bottom-left`, `bottom-right`, `top-left`, `top-right`, and the
offset is measured inward from that corner to the control's centre, so a layout holds
whatever the screen policy resolved to.

## Limits

A button without a `label` is a plain disc.

The controls are round. A rectangular d-pad, a shoulder button strip or a radial menu
are their own layouts — build them from `ui` or draw them yourself and call
`input.press(code, down)`, which is the same seam this pack uses.

There is no per-control opacity or art. The disc and ring are baked once and tinted,
which is why the controls need no art of their own.
