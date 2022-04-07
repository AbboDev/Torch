import * as Phaser from 'phaser';
import { MapScene } from 'Scenes';

export abstract class SpriteCollidable extends Phaser.Physics.Arcade.Sprite {
  /**
   * The Player Phaser body
   *
   * @type {Phaser.Physics.Arcade.Body}
   */
  declare public body: Phaser.Physics.Arcade.Body;

  /**
   * A Sprite which collide with the map's tilemap
   *
   * @param {MapScene} scene   The current scene with map
   * @param {number}   x       The start x position
   * @param {number}   y       The start y position
   * @param {string}   texture The initial texture key
   */
  constructor(
    scene: MapScene,
    x: number,
    y: number,
    texture: string
  ) {
    super(scene, x, y, texture);

    let layers: Phaser.Tilemaps.DynamicTilemapLayer[] = scene.worldLayer;
    if (!Array.isArray(layers)) {
      layers = [layers];
    }

    for (const layer of layers) {
      scene.physics.add.collider(
        this,
        layer,
        this.postCollision.bind(this),
        this.testCollision.bind(this)
      );
    }
  }

  /**
   * The callback which is call after a collision occurs
   *
   * @param {SpriteCollidable}              self The current sprite
   * @param {Phaser.GameObjects.GameObject} tile The tile on which this collide
   */
  protected postCollision(
    self: Phaser.GameObjects.GameObject,
    tile: Phaser.GameObjects.GameObject
  ): void {}

  /**
   * The callback which is call after a collision occurs
   *
   * @param {SpriteCollidable}              self The current sprite
   * @param {Phaser.GameObjects.GameObject} tile The tile on which this collide
   */
  protected abstract testCollision(
    self: Phaser.GameObjects.GameObject,
    tile: Phaser.GameObjects.GameObject
  ): boolean;
}
