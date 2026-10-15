import type { ExploredGrid } from "@/world/explored";
import type { MinimapMap, Point, Rect } from "@/world/minimap";

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
  /** The room is dark: only what the torch lights is seen */
  isDark: boolean;
  /** How far the torch lights, in pixels */
  torchRadius: number;
}

/**
 * Mark as seen what the Player sees now: all that is on the screen, or in a
 * dark room just what the torch lights. The cell of the Player is always seen.
 */
export function revealAround(
  map: MinimapMap,
  grid: ExploredGrid,
  live: Pick<MinimapLive, "player" | "view" | "isDark" | "torchRadius">
): void {
  const size = map.tileSize;
  const col = Math.floor(live.player.x / size);
  const row = Math.floor(live.player.y / size);

  grid.reveal(col, row);

  if (live.isDark) {
    grid.revealCircle(col, row, live.torchRadius / size);

    return;
  }

  const { view } = live;

  grid.revealRect(
    Math.floor(view.x / size),
    Math.floor(view.y / size),
    Math.ceil((view.x + view.width) / size),
    Math.ceil((view.y + view.height) / size)
  );
}
