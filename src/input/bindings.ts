import { ControllerKey } from "@/input/ControllerKey";

/**
 * The keyboard keys of every button. A key is written as the `key` of a
 * keyboard event (letters in lower case: Shift does not change them) or as its
 * `code` (the physical key, like "Backslash").
 */
export type KeyBindings = Record<ControllerKey, readonly string[]>;

export const DEFAULT_KEY_BINDINGS: KeyBindings = {
  [ControllerKey.UP]: ["ArrowUp"],
  [ControllerKey.DOWN]: ["ArrowDown"],
  [ControllerKey.LEFT]: ["ArrowLeft"],
  [ControllerKey.RIGHT]: ["ArrowRight"],
  [ControllerKey.A]: ["x"],
  [ControllerKey.B]: ["c"],
  [ControllerKey.X]: ["z"],
  [ControllerKey.Y]: ["s"],
  [ControllerKey.L]: ["a"],
  [ControllerKey.START]: ["Enter"],
  [ControllerKey.SELECT]: ["Shift"],
  [ControllerKey.DEBUG]: ["Backslash"],
};

/**
 * Where the buttons come from. In "gamepad" mode the keyboard is ignored
 * (unless no gamepad is connected, so the game never locks you out).
 */
export type InputMode = "keyboard" | "keyboardMouse" | "gamepad";

export const INPUT_MODES: readonly InputMode[] = [
  "keyboard",
  "keyboardMouse",
  "gamepad",
];

export type InputDevice = "keyboard" | "mouse" | "gamepad";

/** The devices which aim freely; the keyboard aims with its eight directions */
export type AimDevice = "mouse" | "gamepad";

export const INPUT_DEVICES: readonly InputDevice[] = [
  "keyboard",
  "mouse",
  "gamepad",
];

const noBindings = (): KeyBindings =>
  Object.fromEntries(
    Object.values(ControllerKey).map((button) => [button, []])
  ) as unknown as KeyBindings;

/** Mouse buttons are written "Mouse0" (left), "Mouse1" (middle), "Mouse2" (right) */
export const DEFAULT_MOUSE_BINDINGS: KeyBindings = {
  ...noBindings(),
  [ControllerKey.B]: ["Mouse0"],
  [ControllerKey.L]: ["Mouse2"],
};

/**
 * Gamepad buttons are written "Pad<index>" with the index of the standard
 * layout (0 bottom, 1 right, 2 left, 3 top, 4/5 shoulders, 8 select, 9 start,
 * 12-15 d-pad). The left stick always works as the directions.
 */
export const DEFAULT_GAMEPAD_BINDINGS: KeyBindings = {
  [ControllerKey.UP]: ["Pad12"],
  [ControllerKey.DOWN]: ["Pad13"],
  [ControllerKey.LEFT]: ["Pad14"],
  [ControllerKey.RIGHT]: ["Pad15"],
  [ControllerKey.A]: ["Pad0"],
  [ControllerKey.B]: ["Pad2"],
  [ControllerKey.X]: ["Pad1"],
  [ControllerKey.Y]: ["Pad3"],
  [ControllerKey.L]: ["Pad4", "Pad5"],
  [ControllerKey.START]: ["Pad9"],
  [ControllerKey.SELECT]: ["Pad8"],
  [ControllerKey.DEBUG]: [],
};

export const DEFAULT_BINDINGS: Record<InputDevice, KeyBindings> = {
  keyboard: DEFAULT_KEY_BINDINGS,
  mouse: DEFAULT_MOUSE_BINDINGS,
  gamepad: DEFAULT_GAMEPAD_BINDINGS,
};

/** The part of a keyboard event used to find the button */
export interface KeyEventInfo {
  key: string;
  code: string;
}

/** Is the event one of these keys? */
export function matchesBinding(
  event: KeyEventInfo,
  keys: readonly string[]
): boolean {
  const key = event.key.toLowerCase();

  return keys.some(
    (binding) => binding === event.code || binding.toLowerCase() === key
  );
}

/** The buttons a keyboard event is bound to */
export function getButtonsOf(
  event: KeyEventInfo,
  bindings: KeyBindings
): ControllerKey[] {
  return (Object.keys(bindings) as ControllerKey[]).filter((button) =>
    matchesBinding(event, bindings[button])
  );
}

/** "KeyX", "x" and "X" are the same key; so are "Digit5" and "5" */
const canonical = (key: string): string =>
  key.toLowerCase().replace(/^(?:key|digit)(?=[a-z0-9]$)/, "");

export function sameKey(a: string, b: string): boolean {
  return canonical(a) === canonical(b);
}

/**
 * Give a button the key just captured by a rebind screen (an `event.code`, a
 * "Mouse<n>" or a "Pad<n>"). The key replaces the old ones of the button and
 * is taken away from any other button which had it: those are returned, so
 * the screen can warn about them (a button left with no key has `[]`).
 */
export function bindKey(
  bindings: KeyBindings,
  button: ControllerKey,
  code: string
): { bindings: KeyBindings; stolenFrom: ControllerKey[] } {
  const next = { ...bindings, [button]: [code] };
  const stolenFrom: ControllerKey[] = [];

  for (const other of Object.keys(bindings) as ControllerKey[]) {
    if (other !== button && bindings[other].some((key) => sameKey(key, code))) {
      next[other] = bindings[other].filter((key) => !sameKey(key, code));
      stolenFrom.push(other);
    }
  }

  return { bindings: next, stolenFrom };
}

/** The next mode in the list, wrapping around (`step` is 1 or -1) */
export function nextMode(mode: InputMode, step: number): InputMode {
  const count = INPUT_MODES.length;

  return INPUT_MODES[(INPUT_MODES.indexOf(mode) + step + count) % count];
}

/** A key as the player reads it: "KeyX" and "x" are "X", "Mouse2" is "Mouse right" */
export function describeKey(key: string): string {
  const mouse = /^Mouse(\d)$/.exec(key);
  if (mouse) {
    return `Mouse ${["left", "middle", "right"][Number(mouse[1])] ?? mouse[1]}`;
  }

  const pad = /^Pad(\d+)$/.exec(key);
  if (pad) {
    return `Pad ${pad[1]}`;
  }

  const name = key.replace(/^(?:Key|Digit)(?=[A-Za-z0-9]$)/, "");

  return name.length === 1 ? name.toUpperCase() : name;
}
