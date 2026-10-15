import type { ExploredGrid } from "@/world/explored";
import type { MinimapMap, Point, Rect } from "@/world/minimap";

/**
 * What the Player can see right now, with no dependency on Phaser. How much
 * is seen depends on the room:
 *
 * - in a room without the flag `dark` it is all that the screen shows;
 * - in a dark room it is only what the torch reaches *and* the screen shows:
 *   the light does not go through the walls to a room the screen does not show.
 *
 * The rest of what was seen is memory, and the minimap shows it as such.
 */
export interface MinimapFrame {
  /** The center of the Player, in pixels of the world */
  player: Point;
  /** What the camera shows, in pixels of the world */
  visible: Rect;
  /** How far the torch lights, in pixels of the world */
  torchRadius: number;
}

/** A box of cells: the last ones are excluded */
export interface CellBox {
  col0: number;
  row0: number;
  col1: number;
  row1: number;
}

/** The cells a rectangle of the world touches */
export function getViewCells(map: MinimapMap, view: Rect): CellBox {
  const size = map.tileSize;

  return {
    col0: Math.floor(view.x / size),
    row0: Math.floor(view.y / size),
    col1: Math.ceil((view.x + view.width) / size),
    row1: Math.ceil((view.y + view.height) / size),
  };
}

export function getPlayerCell(
  map: MinimapMap,
  frame: MinimapFrame
): { col: number; row: number } {
  return {
    col: Math.floor(frame.player.x / map.tileSize),
    row: Math.floor(frame.player.y / map.tileSize),
  };
}

/** The room of a cell, or -1 outside of the rooms and of the map */
export function getRoomOf(map: MinimapMap, col: number, row: number): number {
  if (col < 0 || col >= map.cols || row < 0 || row >= map.rows) {
    return -1;
  }

  return map.roomOf[row * map.cols + col];
}

/** The torch reaches the cell: the same distance of the cells it reveals */
function isInTorch(map: MinimapMap, col: number, row: number, frame: MinimapFrame) {
  const player = getPlayerCell(map, frame);

  return (
    Math.hypot(col - player.col, row - player.row) <=
    frame.torchRadius / map.tileSize
  );
}

function isInView(map: MinimapMap, col: number, row: number, frame: MinimapFrame) {
  const view = getViewCells(map, frame.visible);

  return (
    col >= view.col0 && col < view.col1 && row >= view.row0 && row < view.row1
  );
}

/**
 * The Player sees the cell now: in any room if the screen shows it, and in a
 * dark room only if the torch reaches it too. A cell outside the rooms is never
 * seen.
 */
export function isCellVisible(
  map: MinimapMap,
  col: number,
  row: number,
  frame: MinimapFrame
): boolean {
  const room = getRoomOf(map, col, row);

  if (room < 0) {
    return false;
  }

  if (!isInView(map, col, row, frame)) {
    return false;
  }

  return !map.rooms[room].dark || isInTorch(map, col, row, frame);
}

/** The cells worth looking at: only the ones the screen shows can be seen */
export function getCandidateCells(map: MinimapMap, frame: MinimapFrame): CellBox {
  const view = getViewCells(map, frame.visible);

  return {
    col0: Math.max(0, view.col0),
    row0: Math.max(0, view.row0),
    col1: Math.min(map.cols, view.col1),
    row1: Math.min(map.rows, view.row1),
  };
}

/**
 * The minimap shows an enemy if its cell has been seen and it is lit: in a
 * dark room only inside the torch light and on the screen, in any other room
 * all the enemies of the room the Player is in.
 */
export function isEnemyVisible(
  map: MinimapMap,
  explored: ExploredGrid,
  enemy: Point,
  frame: MinimapFrame
): boolean {
  const col = Math.floor(enemy.x / map.tileSize);
  const row = Math.floor(enemy.y / map.tileSize);
  const room = getRoomOf(map, col, row);

  if (room < 0 || !explored.has(col, row)) {
    return false;
  }

  if (map.rooms[room].dark) {
    return isInView(map, col, row, frame) && isInTorch(map, col, row, frame);
  }

  const player = getPlayerCell(map, frame);

  return room === getRoomOf(map, player.col, player.row);
}
