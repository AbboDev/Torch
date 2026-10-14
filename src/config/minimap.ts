import { TILE_SIZE } from "@/config/tiles";

/** The minimap of the HUD */
export const MINIMAP = {
  /** What it shows, in cells of the map: odd, so the Player is in the middle cell */
  window: { cols: 49, rows: 27 },
  /** The pixels of the HUD for every cell */
  scale: 2,
  /** Where it is in the HUD: the left of the screen, under the counters */
  x: TILE_SIZE * 0.5,
  y: TILE_SIZE * 2,
  /** The size of the Player and of the points of interest, in pixels */
  markerSize: 4,
  /** How long the Player stays of a color before the other, in milliseconds */
  blinkMs: 400,
} as const;
