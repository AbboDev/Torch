import type { TerrainProbe } from "@/enemies/senses";
import type { MapScene } from "@/scenes/MapScene";

/**
 * What the map has at a point of the world, for the enemies which walk. A wall
 * is what stops them: the solid tiles and the blocks which can be broken. To
 * stand on, they also take the platforms, the top of a stair and the slopes.
 */
export function createTerrainProbe(scene: MapScene): TerrainProbe {
  const isWall = (x: number, y: number): boolean =>
    !!scene.collisionsLayer.getTileAtWorldXY(x, y) ||
    !!scene.breakablesLayer.getTileAtWorldXY(x, y);

  return {
    isWall,
    isGround: (x, y) => {
      if (isWall(x, y) || scene.slopes.isInside(x, y)) {
        return true;
      }

      if (scene.oneWayCollisionsLayer.getTileAtWorldXY(x, y)) {
        return true;
      }

      // Only the top tile of a stair can be stood on
      const stair = scene.stairsLayer.getTileAtWorldXY(x, y);

      return (
        !!stair && !scene.map.getTileAt(stair.x, stair.y - 1, false, "stairs")
      );
    },
  };
}
