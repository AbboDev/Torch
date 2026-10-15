import { Darkness, DarknessType, isTorchOnly } from "@/world/darkness";
import { ExploredGrid } from "@/world/explored";
import {
  Hazard,
  HazardType,
  MinimapMap,
  Point,
  PoiKind,
  Terrain,
} from "@/world/minimap";
import {
  MinimapFrame,
  getRoomOf,
  isCellVisible,
  isEnemyVisible,
} from "@/world/minimapVisibility";

/**
 * What the minimap shows, as cells and markers with no dependency on Phaser.
 * The Player is always in the middle of the window, which shows a part of the
 * map. Nothing is drawn for what has not been seen; what has been seen is the
 * fog of war, in three tones:
 *
 * - `LIT`: what the Player sees now (see `minimapVisibility`);
 * - `DIM`: what was seen, and is not seen now;
 * - `DARK`: the same, in a dark room, where nothing is seen beyond the torch:
 *   the fog is darker than the other.
 *
 * The rooms with the flag `hot` or `toxic` have their own colors, and the level
 * of darkness of a room (see `darkness`) changes them more:
 *
 * - a room a little shaded is a little darker, in every tone;
 * - a dark room has the fog of the dark;
 * - a corrupted room has the fog of the dark and a tint of violet, more
 *   magenta when it is corrupted all over.
 */
export interface MinimapWindow {
  /** The size of the window, in cells. Odd, so the Player has a middle cell */
  cols: number;
  rows: number;
}

export const Tone = { LIT: 0, DIM: 1, DARK: 2 } as const;

export type ToneType = (typeof Tone)[keyof typeof Tone];

/** What a cell of the map is drawn as */
export const Kind = {
  FLOOR: 0,
  WALL: 1,
  LIQUID: 2,
  PLATFORM: 3,
  EDGE: 4,
} as const;

export type KindType = (typeof Kind)[keyof typeof Kind];

/** The value of a cell which is not drawn */
export const NONE = 0;

const KINDS = 5;
const TONES = 3;
const HAZARDS = 3;

/**
 * The value of a cell of the window: what it is, in which kind of room (how
 * dark, how hot or toxic) and in which tone. It fits in a byte.
 */
export function cellCode(
  kind: KindType,
  hazard: HazardType,
  darkness: DarknessType,
  tone: ToneType
): number {
  return 1 + ((darkness * HAZARDS + hazard) * KINDS + kind) * TONES + tone;
}

export function describeCell(code: number): {
  kind: KindType;
  hazard: HazardType;
  darkness: DarknessType;
  tone: ToneType;
} {
  const index = code - 1;
  const room = Math.floor(index / (TONES * KINDS));

  return {
    tone: (index % TONES) as ToneType,
    kind: (Math.floor(index / TONES) % KINDS) as KindType,
    hazard: (room % HAZARDS) as HazardType,
    darkness: Math.floor(room / HAZARDS) as DarknessType,
  };
}

export interface PaletteColor {
  color: number;
  alpha: number;
}

/** The colors of what the Player sees now, for every kind of room */
const LIT_COLORS: Record<HazardType, Record<KindType, number>> = {
  [Hazard.NONE]: {
    [Kind.FLOOR]: 0x3a74d8,
    [Kind.WALL]: 0xe2e6ff,
    [Kind.LIQUID]: 0x44cdf0,
    [Kind.PLATFORM]: 0xa5b8ff,
    [Kind.EDGE]: 0xa8d8ff,
  },
  [Hazard.HOT]: {
    [Kind.FLOOR]: 0xe0562a,
    [Kind.WALL]: 0xf3dccf,
    [Kind.LIQUID]: 0xff9a3c,
    [Kind.PLATFORM]: 0xffb48c,
    [Kind.EDGE]: 0xffc08a,
  },
  [Hazard.TOXIC]: {
    [Kind.FLOOR]: 0x78bd2c,
    [Kind.WALL]: 0xe6f1d0,
    [Kind.LIQUID]: 0xb9e23c,
    [Kind.PLATFORM]: 0xcde89c,
    [Kind.EDGE]: 0xd8ff80,
  },
};

/** How much of the color is left in every tone, and how solid it is */
const TONE_STYLE: Record<ToneType, { factor: number; alpha: number }> = {
  [Tone.LIT]: { factor: 1, alpha: 1 },
  [Tone.DIM]: { factor: 0.48, alpha: 0.92 },
  [Tone.DARK]: { factor: 0.2, alpha: 0.95 },
};

/** How much darker a room a little shaded is, in every tone */
const SHADE_FACTOR: Partial<Record<DarknessType, number>> = {
  [Darkness.SHADED]: 0.78,
};

/** The tint of a corrupted room, and how much of it is in the colors */
const CORRUPTION_TINT: Partial<
  Record<DarknessType, { color: number; amount: number }>
> = {
  [Darkness.CORRUPTED_PARTIAL]: { color: 0x8a4dff, amount: 0.4 },
  [Darkness.CORRUPTED_TOTAL]: { color: 0xd1189f, amount: 0.65 },
};

const channelOf = (color: number, shift: number) => (color >> shift) & 0xff;

const join = (red: number, green: number, blue: number) =>
  (Math.round(red) << 16) | (Math.round(green) << 8) | Math.round(blue);

function darken(color: number, factor: number): number {
  return join(
    channelOf(color, 16) * factor,
    channelOf(color, 8) * factor,
    channelOf(color, 0) * factor
  );
}

/** `amount` of the color `tint`, the rest of the color `color` */
function mix(color: number, tint: number, amount: number): number {
  const channel = (shift: number) =>
    channelOf(color, shift) * (1 - amount) + channelOf(tint, shift) * amount;

  return join(channel(16), channel(8), channel(0));
}

/** The color of a cell of the window, by its value (see `cellCode`) */
export function getCellColor(code: number): PaletteColor {
  const { kind, hazard, darkness, tone } = describeCell(code);
  const style = TONE_STYLE[tone];
  const tint = CORRUPTION_TINT[darkness];
  const base = LIT_COLORS[hazard][kind];

  return {
    color: darken(
      tint ? mix(base, tint.color, tint.amount) : base,
      style.factor * (SHADE_FACTOR[darkness] ?? 1)
    ),
    alpha: style.alpha,
  };
}

export const POI_COLORS: Record<PoiKind, number> = {
  save: 0x44ff88,
  door: 0xff9933,
  item: 0xffee55,
  boss: 0xff4455,
  other: 0xff66ff,
};

export const ENEMY_COLOR = 0xff3b3b;

export const PLAYER_COLORS = [0xffffff, 0xffdd44] as const;

/** The cell of the map which is at the top left of the window */
export function getWindowOrigin(
  map: MinimapMap,
  player: Point,
  window: MinimapWindow
): { left: number; top: number } {
  return {
    left: Math.floor(player.x / map.tileSize) - Math.floor(window.cols / 2),
    top: Math.floor(player.y / map.tileSize) - Math.floor(window.rows / 2),
  };
}

function getKind(terrain: number, isEdge: boolean): KindType {
  if (terrain === Terrain.SOLID) {
    return Kind.WALL;
  }

  if (terrain === Terrain.PLATFORM) {
    return Kind.PLATFORM;
  }

  if (terrain === Terrain.LIQUID) {
    return Kind.LIQUID;
  }

  return isEdge ? Kind.EDGE : Kind.FLOOR;
}

/**
 * The cells of the window, row after row, as values of `cellCode`. Only the
 * cells inside a room and already seen are drawn.
 */
export function renderCells(
  map: MinimapMap,
  explored: ExploredGrid,
  frame: MinimapFrame,
  window: MinimapWindow
): Uint8Array {
  const cells = new Uint8Array(window.cols * window.rows);
  const { left, top } = getWindowOrigin(map, frame.player, window);

  for (let row = 0; row < window.rows; row++) {
    for (let col = 0; col < window.cols; col++) {
      const mapCol = left + col;
      const mapRow = top + row;
      const room = getRoomOf(map, mapCol, mapRow);

      if (room < 0 || !explored.has(mapCol, mapRow)) {
        continue;
      }

      const { darkness, hazard } = map.rooms[room];
      const index = mapRow * map.cols + mapCol;
      let tone: ToneType = isTorchOnly(darkness) ? Tone.DARK : Tone.DIM;

      if (isCellVisible(map, mapCol, mapRow, frame)) {
        tone = Tone.LIT;
      }

      cells[row * window.cols + col] = cellCode(
        getKind(map.terrain[index], map.edge[index] === 1),
        hazard,
        darkness,
        tone
      );
    }
  }

  return cells;
}

export interface Marker {
  /** The cell of the window */
  col: number;
  row: number;
  color: number;
  kind: "player" | "enemy" | PoiKind;
}

/**
 * The Player, always in the middle, the points of interest in the window which
 * have been seen, and the enemies which are lit (see `isEnemyVisible`: in a
 * dark room only inside the torch light). The Player is the last, so it stays
 * over the others.
 *
 * @param blink   Which of the two colors of the Player to use
 * @param enemies Where the enemies are, in pixels of the world
 */
export function getMarkers(
  map: MinimapMap,
  explored: ExploredGrid,
  frame: MinimapFrame,
  window: MinimapWindow,
  blink: boolean,
  enemies: readonly Point[] = []
): Marker[] {
  const { left, top } = getWindowOrigin(map, frame.player, window);
  const markers: Marker[] = [];

  for (const poi of map.pois) {
    const col = poi.col - left;
    const row = poi.row - top;

    if (
      col >= 0 &&
      col < window.cols &&
      row >= 0 &&
      row < window.rows &&
      explored.has(poi.col, poi.row)
    ) {
      markers.push({ col, row, color: POI_COLORS[poi.kind], kind: poi.kind });
    }
  }

  for (const enemy of enemies) {
    const col = Math.floor(enemy.x / map.tileSize) - left;
    const row = Math.floor(enemy.y / map.tileSize) - top;

    if (
      col >= 0 &&
      col < window.cols &&
      row >= 0 &&
      row < window.rows &&
      isEnemyVisible(map, explored, enemy, frame)
    ) {
      markers.push({ col, row, color: ENEMY_COLOR, kind: "enemy" });
    }
  }

  markers.push({
    col: Math.floor(window.cols / 2),
    row: Math.floor(window.rows / 2),
    color: PLAYER_COLORS[blink ? 1 : 0],
    kind: "player",
  });

  return markers;
}

export interface Run {
  col: number;
  row: number;
  length: number;
  cell: number;
}

/** The cells as horizontal runs of the same cell: far fewer rectangles to draw */
export function toRuns(cells: Uint8Array, cols: number, rows: number): Run[] {
  const runs: Run[] = [];

  for (let row = 0; row < rows; row++) {
    let col = 0;

    while (col < cols) {
      const cell = cells[row * cols + col];
      let end = col + 1;

      while (end < cols && cells[row * cols + end] === cell) {
        end++;
      }

      if (cell !== NONE) {
        runs.push({ col, row, length: end - col, cell });
      }

      col = end;
    }
  }

  return runs;
}
