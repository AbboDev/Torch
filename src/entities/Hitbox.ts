import { MapScene } from 'Scenes/MapScene';

export class Hitbox extends Phaser.GameObjects.Rectangle {
  /**
   * The Phaser body
   * @type {Phaser.Physics.Arcade.Body}
   */
  public body!: Phaser.Physics.Arcade.Body;

  public constructor(
    public scene: MapScene,
    public x: number,
    public y: number,
    public width: number,
    public height: number,
    fillColor?: number | undefined,
    fillAlpha?: number | undefined
  ) {
    super(
      scene,
      x,
      y,
      width,
      height,
      fillColor || 0xfff,
      fillAlpha || 0
    );

    this.scene.add.existing(this);
    this.scene.physics.world.enable(this);

    this.setOrigin(0, 0);

    this.body
      .setAllowGravity(false);

    // The hitbox should be static or anchored to a parent,
    // so is useless show the velocity debug
    this.body.debugShowVelocity = false;
  }

  public update(): void {
    super.update();
  }

  /**
   * An Hitbox should always add to a parent, so this function synchronize
   * the coordinates and the velocity of the two elements
   *
   * @param {Phaser.Physics.Arcade.Sprite} parent The parent of the hitbox
   * @param {number} x The x coordinate, by default the same of the parent
   * @param {number} y The y coordinate, by default the same of the parent
   */
  public alignToParent(
    parent: Phaser.Physics.Arcade.Sprite,
    x?: number,
    y?: number
  ): void {
    if (typeof y === 'undefined') {
      if (typeof x === 'undefined') {
        x = parent.body.position.x;
        y = parent.body.position.y;
      } else {
        y = x;
      }
    }

    this.setPosition(x, y);

    this.body.velocity.copy(parent.body.velocity);
  }
}
