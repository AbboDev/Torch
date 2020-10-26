import { Facing } from '../miscellaneous/Facing';
import { DirectionAxisY, DirectionAxisX } from '../miscellaneous/Direction';
import { ControlScene } from '../scenes/ControlScene';

export class Player extends Phaser.Physics.Arcade.Sprite {
  public body!: Phaser.Physics.Arcade.Body;

  private facing: Facing;
  private isJumping = false;
  private isFalling = false;

  constructor(
    public scene: ControlScene,
    public x: number,
    public y: number
  ) {
    super(scene, x, y, 'hero_idle_center');

    this.facing = {
      y: DirectionAxisY.MIDDLE,
      x: DirectionAxisX.CENTER,
    }

    this.create();
  }

  static preload(scene: Phaser.Scene): void {
    const spriteSize: Phaser.Types.Loader.FileTypes.ImageFrameConfig = {
      frameWidth: 32,
      frameHeight: 48
    };

    scene.load
      .spritesheet(
        'hero_idle_center',
        '/assets/sprites/hero_idle_center.png',
        spriteSize
      )
      .spritesheet(
        'hero_idle_left',
        '/assets/sprites/hero_idle_left.png',
        spriteSize
      )
      .spritesheet(
        'hero_idle_right',
        '/assets/sprites/hero_idle_right.png',
        spriteSize
      )
      .spritesheet(
        'hero_walk_left',
        '/assets/sprites/hero_walk_left.png',
        spriteSize
      )
      .spritesheet(
        'hero_walk_right',
        '/assets/sprites/hero_walk_right.png',
        spriteSize
      );
  }

  protected create(): void {
    this.scene.physics.world.enableBody(this);
    this.body.setAllowGravity(true);
    this.scene.add.existing(this);

    this
      .setOrigin(0, 0)
      .setCollideWorldBounds(true)
      .setBounce(0);

    this.scene.anims.create({
      key: 'hero_idle_center_animation',
      frames: this.scene.anims.generateFrameNumbers('hero_idle_center', {}),
      frameRate: 4,
      repeat: -1
    });

    this.scene.anims.create({
      key: 'hero_idle_left_animation',
      frames: this.scene.anims.generateFrameNumbers('hero_idle_left', {}),
      frameRate: 4,
      repeat: -1
    });

    this.scene.anims.create({
      key: 'hero_idle_right_animation',
      frames: this.scene.anims.generateFrameNumbers('hero_idle_right', {}),
      frameRate: 4,
      repeat: -1
    });

    this.scene.anims.create({
      key: 'hero_walk_left_animation',
      frames: this.scene.anims.generateFrameNumbers('hero_walk_left', {}),
      frameRate: 20,
      repeat: -1
    });

    this.scene.anims.create({
      key: 'hero_walk_right_animation',
      frames: this.scene.anims.generateFrameNumbers('hero_walk_right', {}),
      frameRate: 20,
      repeat: -1
    });
  }

  public update(): void {
    this.walk();
    this.jump();
  }

  protected walk(): void {
    const isRightPress = this.scene.isKeyPress('right');
    const isLeftPress = this.scene.isKeyPress('left');

    if (isRightPress && !isLeftPress) {
      this.facing.x = DirectionAxisX.RIGHT;

      this
        .setVelocityX(128)
        .play('hero_walk_right_animation', true);
    } else if (isLeftPress && !isRightPress) {
      this.facing.x = DirectionAxisX.LEFT;

      this
        .setVelocityX(-128)
        .play('hero_walk_left_animation', true);
    } else {
      this
        .setVelocityX(0)
        .play(`hero_idle_${this.facing.x}_animation`, true);
    }
  }

  protected jump(): void {
    const isJumpPress = this.scene.isKeyPress('a');
    this.isFalling = this.body.velocity.y > 0;

    if (isJumpPress && this.body.onFloor()) {
      this.isJumping = true;
      this.body.velocity.y = -(256 * 1.25);
    } else if (this.body.onFloor()) {
      this.isFalling = false;
      this.isJumping = false;
    }

    if (this.body.velocity.y > 0) {
      this.isFalling = true;
      this.isJumping = false;
    }

    if (this.body.velocity.y < 0 && !isJumpPress) {
      this.body.velocity.y = Math.max(this.body.velocity.y, 0);
    }
  }
}
