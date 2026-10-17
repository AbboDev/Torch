import * as Phaser from "phaser";
import { ENEMY_DEFINITIONS } from "@/config/enemies";
import { Enemy } from "@/enemies/Enemy";
import { PatrolBrain } from "@/enemies/patrol";
import { sensePatrol } from "@/enemies/senses";
import type { EnemySpawn } from "@/enemies/spawns";
import type { MapScene } from "@/scenes/MapScene";
import { createTerrainProbe } from "@/world/terrainProbe";

/**
 * The basic enemy: it walks along the floor until it touches a wall or finds
 * a hole, then goes back, for ever. How it decides is `PatrolBrain`; this
 * only feels the map and moves.
 */
export class Walker extends Enemy {
  private readonly brain: PatrolBrain;

  private readonly terrain = createTerrainProbe(this.scene);

  public constructor(scene: MapScene, spawn: EnemySpawn) {
    super(scene, spawn, ENEMY_DEFINITIONS.walker);

    this.brain = new PatrolBrain(spawn.heading);

    // It walks up and down the slopes as the Player does
    this.scene.slopes.track(this.body);
    this.once(Phaser.GameObjects.Events.DESTROY, () =>
      this.scene.slopes.untrack(this.body)
    );
  }

  protected think(): void {
    const { body } = this;

    const decision = this.brain.think(
      sensePatrol(
        {
          left: body.x,
          top: body.y,
          right: body.x + body.width,
          bottom: body.y + body.height,
        },
        this.terrain,
        body.onFloor(),
        // the physics knows when a wall or the edge of the world stops it
        { left: body.blocked.left, right: body.blocked.right }
      )
    );

    body.setVelocityX(
      decision.moving ? decision.heading * this.definition.speed : 0
    );

    // The art looks to the right: it is turned when the enemy goes left
    this.setFlipX(decision.heading === -1);
  }
}
