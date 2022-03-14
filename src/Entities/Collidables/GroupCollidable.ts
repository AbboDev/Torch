import * as Phaser from 'phaser';
import { MapScene } from 'Scenes';

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
