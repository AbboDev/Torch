import type { ExploredGrid } from "@/world/explored";
import type { MinimapMap, Point, Rect } from "@/world/minimap";
import {
  MinimapFrame,
  getCandidateCells,
  getPlayerCell,
  isCellVisible,
} from "@/world/minimapVisibility";

/**
 * What the game tells the minimap at every frame, all in pixels of the world.
 * The scene of the map fills it, the HUD reads it.
 */
export interface MinimapLive {
  /** Which map the explored cells belong to */
  mapId: string;
  map: MinimapMap;
  /** The center of the Player */
  player: Point;
  /** What the camera shows now */
  view: Rect;
  /** How far the torch lights, in pixels */
  torchRadius: number;
}

/**
 * Mark as seen what the Player sees now (see `minimapVisibility`): in a room
 * which is not dark all that the screen shows, in a dark room only the cells
 * the torch lights, as far as it does now. The cell of the Player is always
 * seen.
 */
export function revealAround(
  map: MinimapMap,
  grid: ExploredGrid,
  live: Pick<MinimapLive, "player" | "view" | "torchRadius">
): void {
  const frame: MinimapFrame = {
    player: live.player,
    visible: live.view,
    torchRadius: live.torchRadius,
  };
  const player = getPlayerCell(map, frame);
  const box = getCandidateCells(map, frame);

  grid.reveal(player.col, player.row);

  for (let row = box.row0; row < box.row1; row++) {
    for (let col = box.col0; col < box.col1; col++) {
      if (isCellVisible(map, col, row, frame)) {
        grid.reveal(col, row);
      }
    }
  }
}
