import { Facing, getSign } from 'Miscellaneous/Direction';

import { ControlScene } from 'Scenes/ControlScene';

import { BULLET_DEPTH } from 'Config/depths';
import { TILE_SIZE } from 'Config/tiles';

export interface BulletConfig {
  position: Phaser.Math.Vector2,
  facing: Facing
};

export class Bullet extends Phaser.Physics.Arcade.Sprite {
  /**
   * The Bullet Phaser body
   * @type {[type]}
   */
  public body!: Phaser.Physics.Arcade.Body;

  /**
   * The baseSpeed of the bullet
   * @type {Number}
   */
  protected speed = 64;

  /**
   * The baseSpeed of the bullet
   * @type {Number}
   */
  protected allowGravity = false;

  public constructor(
    public scene: ControlScene,
    public x: number,
    public y: number,
    public sprite: string
  ) {
    super(scene, x, y, sprite);

    this.scene.physics.world.enable(this);

    this
      .setDepth(BULLET_DEPTH)
      .setOrigin(0.5, 0)
      .setBounce(0);

    this.body.onWorldBounds = true;
  }

  public static preload(scene: Phaser.Scene): void {
    const spriteSize: Phaser.Types.Loader.FileTypes.ImageFrameConfig = {
      frameWidth: 4,
      frameHeight: 4
    };

    scene.load
      .spritesheet(
        'bullet',
        '/assets/sprites/bullet.png',
        spriteSize
      );
  }

  public fire(config: BulletConfig): void {
    this.scene.add.existing(this);

    this.body
      // The bullet should not fall
      .setAllowGravity(this.allowGravity)
      // The bullet have to collide with world bounds too
      .setCollideWorldBounds(true);

    if (this.allowGravity) {
      this.setGravityY(-TILE_SIZE * 10);
    }

    const sign = getSign(config.facing);

    this
      .setPosition(config.position.x, config.position.y)
      .setVelocity(
        this.speed * 5 * sign.x,
        this.speed * 5 * sign.y
      )
      .setScale(sign.x || 1, sign.y || 1)
      .setActive(true)
      .setVisible(true);

    // Detect if the bullet if touching the world's bound
    this.body.world.on('worldbounds', (body: Phaser.Physics.Arcade.Body) => {
      // Check if the body's game object is the sprite you are listening for
      if (body.gameObject === this) {
        // If it is, then simulate impact
        this.impact();
      }
    });
  }

  public update(time: any, delta: number): void {
    super.update(time, delta);

    // If the bullet is touching anything, then start impact
    if (!this.body.touching.none) {
      this.impact();
    }
  }

  /**
   * Stop physics and render updates for this object
   */
  protected impact(): void {
    this
      .setActive(false)
      .setVisible(false)
      .destroy();
  }

  /**
   * Return the current bullet's speed
   */
  public getSpeed() {
    return this.speed;
  }

  /**
   * Set a new bullet's speed
   */
  public setSpeed(speed: number) {
    this.speed = speed;
  }
}
