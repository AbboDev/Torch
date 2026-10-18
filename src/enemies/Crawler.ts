import { ENEMY_DEFINITIONS } from "@/config/enemies";
import { CrawlMotion } from "@/enemies/CrawlMotion";
import { Enemy } from "@/enemies/Enemy";
import type { EnemySpawn } from "@/enemies/spawns";
import type { MapScene } from "@/scenes/MapScene";
import { createCellGrid } from "@/world/terrainProbe";

/**
 * The enemy which crawls along any surface: the floor, up the walls, along the
 * ceilings, and round the corners, until what it clings to is gone and it falls.
 * How it goes is `CrawlMotion`; this only puts the sprite where it says, turned
 * as it clings.
 *
 * It does not walk by physics: it goes from tile to tile, so the tiles do not
 * stop it (it is in a free cell next to a wall) and gravity does not pull it.
 */
export class Crawler extends Enemy {
  private readonly motion: CrawlMotion;

  /** The size of a cell of the map, in pixels */
  private readonly cell: number;

  public constructor(scene: MapScene, spawn: EnemySpawn) {
    super(scene, spawn, ENEMY_DEFINITIONS.crawler);

    this.cell = scene.map.tileWidth;

    // Its middle is the middle of its cell, so it turns about it
    this.setOrigin(0.5, 0.5);
    this.body.setAllowGravity(false).setImmovable(true);
    this.body.moves = false;

    this.motion = new CrawlMotion(
      {
        col: Math.floor(spawn.x / this.cell),
        // the spawn is at the feet: the cell is the one just above them
        row: Math.floor((spawn.y - 1) / this.cell),
      },
      createCellGrid(scene),
      { surface: spawn.surface, heading: spawn.direction }
    );

    this.place();
  }

  /** The tiles do not stop it: it clings to them, it does not bump into them */
  protected testCollision(): boolean {
    return false;
  }

  protected think(_time: number, delta: number): void {
    const cellsPerSecond = this.definition.speed / this.cell;

    this.motion.advance((delta / 1000) * cellsPerSecond);
    this.place();
  }

  /** Put the sprite where the motion says, turned with the surface */
  private place(): void {
    const { position, surface, heading } = this.motion;

    this.setPosition(position.x * this.cell, position.y * this.cell);

    // The art stands on a floor and looks to the right: it is turned so that
    // the surface is under it, and turned over if it goes the other way
    const angle = Math.atan2(surface.y, surface.x) - Math.PI / 2;

    this.setRotation(angle);
    this.setFlipX(heading.x * Math.cos(angle) + heading.y * Math.sin(angle) < 0);
  }
}
