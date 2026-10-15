import { RoomWithProperties, getRoomProperty } from "@/world/rooms";

/**
 * The levels of darkness of a room, with no dependency on Phaser. A room is
 * set in Tiled with two custom properties of the object `room`:
 *
 * - `dark` (string): the color of the light of the room, as the game has always
 *   read it. It is what makes the room darker in the game;
 * - `darkness` (string): the level, one of the keys of `DARKNESS_VALUES`. It is
 *   what the rules and the minimap go by. A room with `dark` and no `darkness`
 *   is completely dark, as it has always been.
 *
 * So a slightly shaded room is `dark` with a light color and `darkness` set to
 * "shaded", and a corrupted room is `dark` with its color and `darkness` set to
 * "corrupted_partial" or "corrupted_total".
 */
export const Darkness = {
  /** The light is on */
  NONE: 0,
  /** A light darkness: it can be seen through, the room is only a little in shadow */
  SHADED: 1,
  /** Completely dark: only the light of the torch is seen */
  DARK: 2,
  /** Dark, and corrupted a little: it hurts a little without the right power-up */
  CORRUPTED_PARTIAL: 3,
  /** Dark, and corrupted all over: it hurts a lot without the right power-up */
  CORRUPTED_TOTAL: 4,
} as const;

export type DarknessType = (typeof Darkness)[keyof typeof Darkness];

/** The values of the property `darkness` in Tiled */
export const DARKNESS_VALUES: Record<string, DarknessType> = {
  none: Darkness.NONE,
  shaded: Darkness.SHADED,
  dark: Darkness.DARK,
  corrupted_partial: Darkness.CORRUPTED_PARTIAL,
  corrupted_total: Darkness.CORRUPTED_TOTAL,
};

/** How much a zone hurts, for a second of staying in it */
export type Damage = "none" | "little" | "light" | "heavy";

export interface DarknessSpec {
  /**
   * What the Player sees: all that the screen shows, or in the dark only what
   * the torch reaches on it
   */
  seen: "screen" | "torch";
  /** The damage in the zone without the right power-up... */
  unprotected: Damage;
  /** ...and with it */
  protected: Damage;
}

/**
 * What every level means. The damage is the specification only: the minimap
 * does not use it, and the game does not hurt the Player for it yet.
 */
export const DARKNESS_SPEC: Record<DarknessType, DarknessSpec> = {
  [Darkness.NONE]: { seen: "screen", unprotected: "none", protected: "none" },
  [Darkness.SHADED]: { seen: "screen", unprotected: "none", protected: "none" },
  [Darkness.DARK]: { seen: "torch", unprotected: "none", protected: "none" },
  [Darkness.CORRUPTED_PARTIAL]: {
    seen: "torch",
    unprotected: "light",
    protected: "none",
  },
  [Darkness.CORRUPTED_TOTAL]: {
    seen: "torch",
    unprotected: "heavy",
    protected: "little",
  },
};

/** Only the light of the torch is seen, not all that the screen shows */
export function isTorchOnly(level: DarknessType): boolean {
  return DARKNESS_SPEC[level].seen === "torch";
}

export function isCorrupted(level: DarknessType): boolean {
  return (
    level === Darkness.CORRUPTED_PARTIAL || level === Darkness.CORRUPTED_TOTAL
  );
}

/** How much the zone hurts the Player, with the right power-up or without it */
export function getDamage(level: DarknessType, hasPowerUp: boolean): Damage {
  const spec = DARKNESS_SPEC[level];

  return hasPowerUp ? spec.protected : spec.unprotected;
}

/**
 * The level of darkness of a room, from its properties. What is wrong or does
 * not fit is said with a warning, and the level is the one the color says.
 */
export function getDarkness(
  room: RoomWithProperties & { id?: number }
): DarknessType {
  const color = getRoomProperty(room, "dark");
  const hasColor = typeof color === "string" && color !== "";
  const named = getRoomProperty(room, "darkness");
  const id = room.id ?? "?";

  // The old way: a room with a color is dark
  const byColor = hasColor ? Darkness.DARK : Darkness.NONE;

  if (named === undefined) {
    return byColor;
  }

  const level = typeof named === "string" ? DARKNESS_VALUES[named] : undefined;

  if (level === undefined) {
    console.warn(
      `Room ${id}: unknown darkness "${String(named)}": it is taken from "dark"`
    );

    return byColor;
  }

  if (level !== Darkness.NONE && !hasColor) {
    console.warn(
      `Room ${id}: darkness "${String(named)}" without a "dark" color: the light of the game does not change`
    );
  } else if (level === Darkness.NONE && hasColor) {
    console.warn(
      `Room ${id}: darkness "none" with a "dark" color: the light of the game is dark`
    );
  }

  return level;
}
