import * as Phaser from "phaser";
import { Slopes } from "@/world/Slopes";
import {
  SlopeGrid,
  groundY,
  parseSlopeProperties,
} from "@/world/slopeGeometry";

/** The name of the tile layer of the slopes in Tiled */
export const SLOPES_LAYER_NAME = "slopes";

/**
 * The slopes of a tile layer: the tiles whose tileset has the properties
 * `slopeLeft` and `slopeRight` (see world/slopeGeometry.ts). Tiles without them are
 * only art.
 */
export function buildSlopeGrid(layer: Phaser.Tilemaps.TilemapLayer): SlopeGrid {
  const grid = new SlopeGrid(
    layer.layer.tileWidth,
    layer.layer.tileHeight,
    layer.x,
    layer.y
  );

  layer.forEachTile(
    (tile) => {
      const slope = parseSlopeProperties(tile.properties, tile.height);

      if (slope) {
        grid.set(
          tile.x,
          tile.y,
          tile.flipX ? { left: slope.right, right: slope.left } : slope
        );
      }
    },
    undefined,
    0,
    0,
    layer.layer.width,
    layer.layer.height,
    { isNotEmpty: true }
  );

  return grid;
}

/**
 * Keep the bodies tracked by the slopes on them, after every step of the
 * physics of the scene, until the scene shuts down.
 *
 * @param layer The layer of the slopes, or null if the map has none
 */
export function createSlopes(
  scene: Phaser.Scene,
  layer: Phaser.Tilemaps.TilemapLayer | null
): Slopes {
  const slopes = new Slopes(layer ? buildSlopeGrid(layer) : null);

  const { world } = scene.physics;
  const onStep = (delta: number) => slopes.step(delta);

  world.on(Phaser.Physics.Arcade.Events.WORLD_STEP, onStep);
  slopes.onDestroy(() =>
    world.off(Phaser.Physics.Arcade.Events.WORLD_STEP, onStep)
  );
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => slopes.destroy());

  return slopes;
}

/**
 * Draw the slopes with the other collisions, to check what was set in Tiled
 */
export function renderSlopesDebug(
  graphics: Phaser.GameObjects.Graphics,
  grid: SlopeGrid,
  color = 0xffa500
): void {
  const { tileWidth, tileHeight, originX, originY } = grid;

  graphics.fillStyle(color, 0.5);
  graphics.lineStyle(1, color, 1);

  for (const { column, row, slope } of grid.entries()) {
    const x = originX + column * tileWidth;
    const top = originY + row * tileHeight;
    const bottom = top + tileHeight;

    graphics.fillPoints(
      [
        new Phaser.Math.Vector2(x, bottom),
        new Phaser.Math.Vector2(
          x,
          groundY(top, slope, tileWidth, tileHeight, 0)
        ),
        new Phaser.Math.Vector2(
          x + tileWidth,
          groundY(top, slope, tileWidth, tileHeight, tileWidth)
        ),
        new Phaser.Math.Vector2(x + tileWidth, bottom),
      ],
      true
    );
  }
}
