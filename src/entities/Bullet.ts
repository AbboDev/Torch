import { ControlScene } from '../scenes/ControlScene';

export class Bullet extends Phaser.Physics.Arcade.Sprite {
  /**
   * The Player Phaser body
   * @type {[type]}
   */
  public body!: Phaser.Physics.Arcade.Body;

  private timeToLive = 16;
  private speed = 128;

  public constructor(
    public scene: ControlScene,
    public x: number,
    public y: number
  ) {
    super(scene, x, y, 'bullet');

    this.create();
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

  protected create(): void {
    this.scene.add.existing(this);
    this.scene.physics.world.enable(this);

    this
      .setDepth(1)
      .setOrigin(0, 0)
      .setBounce(0);
  }

  public fire(x: number, y: number): void {
    this.body
      .setAllowGravity(false)
      .setCollideWorldBounds(true);

    this
      .setPosition(x, y)
      .setVelocity(this.speed * 5, 0)
      .setActive(true)
      .setVisible(true);
  }

  public update(time: any, delta: number): void {
    super.update(time, delta);

    if (!this.body.touching.none) {
      this
        .setActive(false)
        .setVisible(false);
    }
  }
}
