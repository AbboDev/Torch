import { MapScene } from 'Scenes/MapScene';

export abstract class SpriteCollidable extends Phaser.Physics.Arcade.Sprite {
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
      scene.physics.add.collider(this, layer, this.postCollision);
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
}

export abstract class GroupCollidable extends Phaser.Physics.Arcade.Group {
  /**
   * A Group of Sprites which collide with the map's tilemap
   *
   * @param {MapScene}                                       scene  The current scene with map
   * @param {Phaser.Types.Physics.Arcade.PhysicsGroupConfig} config [description]
   */
  constructor(
    scene: MapScene,
    config: Phaser.Types.Physics.Arcade.PhysicsGroupConfig
  ) {
    super(scene.physics.world, scene, config);

    let layers: Phaser.Tilemaps.DynamicTilemapLayer[] = scene.worldLayer;
    if (!Array.isArray(layers)) {
      layers = [layers];
    }

    for (const layer of layers) {
      scene.physics.add.collider(this, layer, this.postChildCollision);
    }
  }

  /**
   * The callback which is call after a collision occurs
   * between a tile a child of the this group
   *
   * @param {Phaser.GameObjects.GameObject} child The child which trigger the collision
   * @param {Phaser.GameObjects.GameObject} tile  The tile on which the child collide
   */
  protected postChildCollision(
    child: Phaser.GameObjects.GameObject,
    tile: Phaser.GameObjects.GameObject
  ): void {}
}
