import { ControllerKey } from "@/input/ControllerKey";
import { KeyBindings, sameKey } from "@/input/bindings";

/** The part of a browser `Gamepad` the game reads */
export interface GamepadLike {
  connected: boolean;
  buttons: ReadonlyArray<{ pressed: boolean }>;
  axes: ReadonlyArray<number>;
}

/** How far the left stick has to go to count as a direction */
export const STICK_THRESHOLD = 0.5;

/** The game buttons held on a gamepad: its buttons, plus the left stick as directions */
export function readGamepad(
  pad: GamepadLike,
  bindings: KeyBindings
): Set<ControllerKey> {
  const held = pad.buttons.flatMap((button, index) =>
    button.pressed ? [`Pad${index}`] : []
  );
  const down = new Set<ControllerKey>();

  for (const button of Object.keys(bindings) as ControllerKey[]) {
    if (bindings[button].some((key) => held.some((h) => sameKey(h, key)))) {
      down.add(button);
    }
  }

  const [x = 0, y = 0] = pad.axes;
  if (x < -STICK_THRESHOLD) down.add(ControllerKey.LEFT);
  if (x > STICK_THRESHOLD) down.add(ControllerKey.RIGHT);
  if (y < -STICK_THRESHOLD) down.add(ControllerKey.UP);
  if (y > STICK_THRESHOLD) down.add(ControllerKey.DOWN);

  return down;
}
