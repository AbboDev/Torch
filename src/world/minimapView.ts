import { ExploredGrid } from "@/world/explored";
import { MinimapMap, PoiKind, Terrain } from "@/world/minimap";
import type { Point, Rect } from "@/world/minimapTracker";

/**
 * What the minimap shows, as cells and markers with no dependency on Phaser.
 * The Player is always in the middle of the window, which shows a part of the
 * map. What has been seen is drawn dim, and brighter where the screen shows
 * it now: what has not been seen is not drawn.
 */
export interface MinimapWindow {
  /** The size of the window, in cells. Odd, so the Player has a middle cell */
  cols: number;
  rows: number;
}

/** What is known of the game at the moment of drawing, in pixels of the world */
export interface MinimapFrame {
  player: Point;
  /** What the camera shows now */
  visible: Rect;
}

/** What a cell of the window is drawn as: an index of `PALETTE` */
export const Cell = {
  NONE: 0,
  FLOOR_DIM: 1,
  FLOOR_LIT: 2,
  WALL_DIM: 3,
  WALL_LIT: 4,
  LIQUID_DIM: 5,
  LIQUID_LIT: 6,
  PLATFORM_DIM: 7,
  PLATFORM_LIT: 8,
  EDGE_DIM: 9,
  EDGE_LIT: 10,
} as const;

export interface PaletteColor {
  color: number;
  alpha: number;
}

export const PALETTE: Record<number, PaletteColor> = {
  [Cell.FLOOR_DIM]: { color: 0x1a2f66, alpha: 0.85 },
  [Cell.FLOOR_LIT]: { color: 0x3a74d8, alpha: 1 },
  [Cell.WALL_DIM]: { color: 0x666b82, alpha: 0.95 },
  [Cell.WALL_LIT]: { color: 0xe2e6ff, alpha: 1 },
  [Cell.LIQUID_DIM]: { color: 0x1c6580, alpha: 0.9 },
  [Cell.LIQUID_LIT]: { color: 0x44cdf0, alpha: 1 },
  [Cell.PLATFORM_DIM]: { color: 0x46549a, alpha: 0.95 },
  [Cell.PLATFORM_LIT]: { color: 0xa5b8ff, alpha: 1 },
  [Cell.EDGE_DIM]: { color: 0x4573c4, alpha: 0.95 },
  [Cell.EDGE_LIT]: { color: 0xa8d8ff, alpha: 1 },
};

export const POI_COLORS: Record<PoiKind, number> = {
  save: 0x44ff88,
  door: 0xff9933,
  item: 0xffee55,
  boss: 0xff4455,
  other: 0xff66ff,
};

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

/** The cells of the map the camera shows: the last ones excluded */
export function getLitCells(map: MinimapMap, visible: Rect) {
  const size = map.tileSize;

  return {
    col0: Math.floor(visible.x / size),
    row0: Math.floor(visible.y / size),
    col1: Math.ceil((visible.x + visible.width) / size),
    row1: Math.ceil((visible.y + visible.height) / size),
  };
}

/** What a cell of the map is drawn as: dim, or bright if it is in the screen */
function getCell(terrain: number, isEdge: boolean, isLit: boolean): number {
  if (terrain === Terrain.SOLID) {
    return isLit ? Cell.WALL_LIT : Cell.WALL_DIM;
  }

  if (terrain === Terrain.PLATFORM) {
    return isLit ? Cell.PLATFORM_LIT : Cell.PLATFORM_DIM;
  }

  if (terrain === Terrain.LIQUID) {
    return isLit ? Cell.LIQUID_LIT : Cell.LIQUID_DIM;
  }

  if (isEdge) {
    return isLit ? Cell.EDGE_LIT : Cell.EDGE_DIM;
  }

  return isLit ? Cell.FLOOR_LIT : Cell.FLOOR_DIM;
}

/**
 * The cells of the window, row after row, as `Cell` values. Only the cells
 * inside a room and already seen are drawn.
 */
export function renderCells(
  map: MinimapMap,
  explored: ExploredGrid,
  frame: MinimapFrame,
  window: MinimapWindow
): Uint8Array {
  const cells = new Uint8Array(window.cols * window.rows);
  const { left, top } = getWindowOrigin(map, frame.player, window);
  const lit = getLitCells(map, frame.visible);

  for (let row = 0; row < window.rows; row++) {
    for (let col = 0; col < window.cols; col++) {
      const mapCol = left + col;
      const mapRow = top + row;

      if (
        mapCol < 0 ||
        mapCol >= map.cols ||
        mapRow < 0 ||
        mapRow >= map.rows
      ) {
        continue;
      }

      const index = mapRow * map.cols + mapCol;

      if (!map.inRoom[index] || !explored.has(mapCol, mapRow)) {
        continue;
      }

      const isLit =
        mapCol >= lit.col0 &&
        mapCol < lit.col1 &&
        mapRow >= lit.row0 &&
        mapRow < lit.row1;

      cells[row * window.cols + col] = getCell(
        map.terrain[index],
        map.edge[index] === 1,
        isLit
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
  kind: "player" | PoiKind;
}

/**
 * The Player, always in the middle, and the points of interest in the window
 * which have been seen. The Player is the last, so it stays over the others.
 *
 * @param blink Which of the two colors of the Player to use
 */
export function getMarkers(
  map: MinimapMap,
  explored: ExploredGrid,
  frame: MinimapFrame,
  window: MinimapWindow,
  blink: boolean
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

      if (cell !== Cell.NONE) {
        runs.push({ col, row, length: end - col, cell });
      }

      col = end;
    }
  }

  return runs;
}
