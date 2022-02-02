import { MapScene } from 'Scenes/MapScene';
import { LIQUID_DEPTH } from 'Config/depths';

export abstract class Liquid extends Phaser.GameObjects.Sprite {
  protected static FRAME_WIDTH: number;
  protected static FRAME_HEIGHT: number;

  /**
   * The Player Phaser body
   *
   * @type {Phaser.Physics.Arcade.Body}
   */
  public body!: Phaser.Physics.Arcade.Body;

  public constructor(
    scene: MapScene,
    x: number,
    y: number,
    width: number,
    height: number,
    texture: string
  ) {
    super(scene, x, y, texture);

    this.scene.add.existing(this);
    this.scene.physics.world.enable(this);

    this.setDepth(LIQUID_DEPTH)
      .setAlpha(0.5)
      .setCrop(0, 0, width, height)
      .setOrigin(0, 0)
      .setVisible(true)
      // .setPipeline('Light2D')
      .play(`${texture}_animation`);

    this.body
      .setAllowGravity(false)
      .setSize(width, height)
      .setOffset(0, 0);
  }

  public static preload(scene: Phaser.Scene): void {
    scene.load.spritesheet({
      key: this.name.toLowerCase(),
      url: `/assets/tilesets/${this.name.toLowerCase()}.png`,
      normalMap: `/assets/tilesets/${this.name.toLowerCase()}_n.png`,
      frameConfig: {
        frameWidth: this.FRAME_WIDTH,
        frameHeight: this.FRAME_HEIGHT
      }
    });
  }

  public static create(scene: Phaser.Scene): void {
    scene.anims.create({
      key: `${this.name.toLowerCase()}_animation`,
      frames: scene.anims.generateFrameNumbers(this.name.toLowerCase(), {}),
      frameRate: 2,
      repeat: -1
    });
  }

  public update(time: any, delta: number): void {
    super.update(time, delta);
  }

  public onHeroSwim(): void {}
}
