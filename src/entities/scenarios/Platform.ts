import * as Phaser from "phaser";
import { SpriteCollidable } from "@/entities/collidables/SpriteCollidable";
import { MapScene } from "@/scenes/MapScene";
import { WORLD_LAYER_DEPTH } from "@/config/depths";
import { TILE_SIZE } from "@/config/tiles";
import { TiledObjectProperty } from "@/entities/scenarios/TiledObject";
import {
  PLATFORM_SCHEMA,
  PlatformDirection,
  parseProperties,
} from "@/world/objectSchemas";

export { PlatformDirection };

export class Platform extends SpriteCollidable {
  /**
   * The Player Phaser body
   *
   * @type {Phaser.Physics.Arcade.Body}
   */
  declare public body: Phaser.Physics.Arcade.Body;

  public baseSpeed: number = TILE_SIZE * 3;

  public direction: PlatformDirection = PlatformDirection.HORIZONTAL;

  public distance: number = 0;

  private startPosition: Phaser.Math.Vector2;

  public constructor(
    public scene: MapScene,
    x: number,
    y: number,
    properties: TiledObjectProperty[] | undefined
  ) {
    super(scene, x, y, "platform");

    this.scene.add.existing(this);
    this.scene.physics.world.enable(this);

    // The properties set in Tiled, checked: what is wrong is told, and the
    // property has its default
    const { values, problems } = parseProperties(PLATFORM_SCHEMA, {
      properties,
    });

    for (const problem of problems) {
      console.warn(`Platform at ${x}, ${y}: ${problem}`);
    }

    this.baseSpeed = values.speed as number;
    this.direction = values.direction as PlatformDirection;
    this.distance = values.distance as number;

    this.body.setAllowGravity(false).setImmovable(true);

    this.setDepth(WORLD_LAYER_DEPTH)
      .setOrigin(0, 0)
      .setCollideWorldBounds(true)
      .setBounce(1);

    this.startPosition = new Phaser.Math.Vector2(x, y);

    let xSpeed = this.baseSpeed;
    if (this.direction === PlatformDirection.VERTICAL) {
      xSpeed = 0;
    }

    let ySpeed = this.baseSpeed;
    if (this.direction === PlatformDirection.HORIZONTAL) {
      ySpeed = 0;
    }

    this.body.setVelocity(xSpeed, ySpeed);
  }

  public update(time: any, delta: number): void {
    super.update(time, delta);

    if (this.distance !== 0) {
      const realDistance: number = this.distance * TILE_SIZE;
      const bounceX: boolean =
        Math.abs(this.x - this.startPosition.x) >= realDistance;
      const bounceY: boolean =
        Math.abs(this.y - this.startPosition.y) >= realDistance;

      if (bounceX || bounceY) {
        this.startPosition.x = this.x;
        this.startPosition.y = this.y;

        this.body.setVelocity(
          this.body.velocity.x * (bounceX ? -1 : 1),
          this.body.velocity.y * (bounceY ? -1 : 1)
        );
      }
    }
  }

  protected testCollision(
    self: Phaser.GameObjects.GameObject,
    object: unknown
  ): boolean {
    const tile: Phaser.Tilemaps.Tile = object as Phaser.Tilemaps.Tile;

    return tile.index >= 0;
  }

  protected postCollision(
    self: Phaser.GameObjects.GameObject,
    tile: Phaser.GameObjects.GameObject
  ): void {}
}
