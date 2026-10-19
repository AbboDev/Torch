import * as Phaser from "phaser";
import { ENEMY_DEFINITIONS } from "@/config/enemies";
import { Enemy } from "@/enemies/Enemy";
import { HopBrain, getJumpSpeed } from "@/enemies/hop";
import { sensePatrol } from "@/enemies/senses";
import type { EnemySpawn } from "@/enemies/spawns";
import type { MapScene } from "@/scenes/MapScene";
import { createTerrainProbe } from "@/world/terrainProbe";

/**
 * The enemy which hops: it jumps at regular intervals, forward, and where it
 * hits a wall it turns round and comes back. It does not look at the ground, so
 * it can fall off a ledge and into a hole, and it goes on where it lands. How it
 * decides is `HopBrain`; this feels the walls, jumps and moves.
 */
export class Jumper extends Enemy {
  private readonly brain: HopBrain;

  private readonly terrain = createTerrainProbe(this.scene);

  /** How fast it goes up when it jumps: it follows the gravity of the game */
  private readonly jumpSpeed: number;

  public constructor(scene: MapScene, spawn: EnemySpawn) {
    super(scene, spawn, ENEMY_DEFINITIONS.jumper);

    const { jump } = ENEMY_DEFINITIONS.jumper;

    this.brain = new HopBrain(spawn.heading, jump.interval);
    this.jumpSpeed = getJumpSpeed(scene.getWorldGravity().y, jump.height);

    // It lands on the slopes and goes up and down them as the Player does
    this.scene.slopes.track(this.body);
    this.once(Phaser.GameObjects.Events.DESTROY, () =>
      this.scene.slopes.untrack(this.body)
    );
  }

  protected think(time: number): void {
    const { body } = this;

    const walls = sensePatrol(
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
    );

    const intent = this.brain.think({
      onGround: body.onFloor(),
      wallLeft: walls.left.wall,
      wallRight: walls.right.wall,
      time,
    });

    body.setVelocityX(intent.direction * this.definition.speed);

    if (intent.jump) {
      body.setVelocityY(-this.jumpSpeed);
    }

    // The art looks to the right: it is turned when the enemy goes left
    this.setFlipX(intent.heading === -1);
  }
}
