/** The part of a menu entry which decides where the selection can go */
export interface Selectable {
  enabled: boolean;
}

/** The first entry which can be selected, or 0 if none can */
export function firstEnabled(entries: readonly Selectable[]): number {
  const index = entries.findIndex((entry) => entry.enabled);

  return index === -1 ? 0 : index;
}

/**
 * Move the selection up or down, skipping the disabled entries and going
 * round from the last entry to the first. It stays where it is if no other
 * entry can be selected.
 */
export function moveSelection(
  entries: readonly Selectable[],
  current: number,
  step: 1 | -1
): number {
  const count = entries.length;

  for (let offset = 1; offset <= count; offset++) {
    const index = (((current + step * offset) % count) + count) % count;

    if (entries[index].enabled) {
      return index;
    }
  }

  return current;
}
