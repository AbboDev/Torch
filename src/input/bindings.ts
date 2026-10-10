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
