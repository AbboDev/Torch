import { Facing } from '../miscellaneous/Facing';
import { DirectionAxisY, DirectionAxisX } from '../miscellaneous/Direction';
import { ControlScene } from '../scenes/ControlScene';

export class Player extends Phaser.Physics.Arcade.Sprite {
  public body!: Phaser.Physics.Arcade.Body;

  /**
   * Where the Player is watching
   * @type {Facing}
   */
  private facing: Facing;

  /**
   * The Player is jumping
   * @type {Boolean}
   */
  private isJumping = false;

  /**
   * The Player is falling
   * @type {Boolean}
   */
  private isFalling = false;

  /**
   * The Player has the ability to do the double jump
   * @type {Boolean}
   */
  private hasDoubleJumpAbility = true;

  /**
   * The Player can now perform the double jump
   * @type {Boolean}
   */
  private canDoubleJump = false;

  /**
   * The Player had actually performed the double jump
   * @type {Boolean}
   */
  private hasDoneDoubleJump = false;

  /**
   * Check if the user had previously performed a jump without release the key
   * @type {Boolean}
   */
  private isPressingJump = false;

  /**
   * The Player has the ability to perform an high jump
   * @type {Boolean}
   */
  private hasHighJumpAbility = true;

  /**
   * [JUMP_SPEED_MULTIPLIER description]
   * @type {Number}
   */
  static JUMP_SPEED_MULTIPLIER = 1.25;

  /**
   * [JUMP_SPEED_MULTIPLIER description]
   * @type {Number}
   */
  static HIGH_JUMP_SPEED_MULTIPLIER = 1.5;

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
    // Handle all the movement along the x axis
    this.walk();

    // Handle all the movement along the y axis
    this.jump();

    // Change the current animation based on previous operations
    this.animate();
  }

  protected walk(): void {
    const isRightPress = this.scene.isKeyPress('right');
    const isLeftPress = this.scene.isKeyPress('left');

    if (isRightPress && !isLeftPress) {
      this.facing.x = DirectionAxisX.RIGHT;

      this.setVelocityX(128);
    } else if (isLeftPress && !isRightPress) {
      this.facing.x = DirectionAxisX.LEFT;

      this.setVelocityX(-128);
    } else {
      this.setVelocityX(0);
    }
  }

  protected jump(): void {
    // Test if the user is pressing the button 'A'
    const isJumpPress = this.scene.isKeyPress('a');

    // If the user is pressing jump button
    if (isJumpPress) {
      // If the Player is touching the floor and the key has been release
      if (this.body.onFloor() && !this.isPressingJump) {
        // The Player is actually jumping
        this.isJumping = true;

        this.setVelocityY(this.getJumpSpeed());
      } else if (
        // First check if Player has unlocked double jump
        this.hasDoubleJumpAbility
        // Then check if Player had already performed the action
        && !this.hasDoneDoubleJump
        // Finally check if Player can actually perform the action at the moment
        && this.canDoubleJump
      ) {
        // Prevent the Player to perform another double jump
        this.hasDoneDoubleJump = true;
        // The Player is actually jumping
        this.isJumping = true;

        this.setVelocityY(this.getJumpSpeed());
      }
    } else if (this.body.onFloor()) {
      // Reset everything if the player is touching the ground
      this.isFalling = false;
      this.isJumping = false;

      this.canDoubleJump = false;
      this.hasDoneDoubleJump = false;
    }

    // Check if the user is actually holding the key
    this.isPressingJump = isJumpPress;

    // Detect if the Player is falling by checking if his y speed is positive
    if (this.body.velocity.y > 0) {
      this.isFalling = true;
      // If the Player is falling, he cannot also jump
      this.isJumping = false;
    }

    // Detect if the Player is jumping by checking if his y speed is negative
    if (this.body.velocity.y < 0) {
      // Detect if the user is not pressing the button to jump
      if (!isJumpPress) {
        // The Player is able to perform a double jump
        this.canDoubleJump = true;

        const newVelocity = this.body.velocity.y + -(this.body.velocity.y / 2);

        // The Player slowly stop to jump and perform a linear fall
        this.setVelocityY(Math.max(newVelocity, 0));
      }
    }
  }

  protected animate(): void {
    const isRunning = this.body.velocity.x != 0;
    const animation = isRunning ? 'walk' : 'idle';

    this.play(`hero_${animation}_${this.facing.x}_animation`, true);
  }

  public getJumpSpeed(): number {
    return -this.scene.getWorldGravity().y / 2 * this.getJumpSpeedMultiplier();
  }

  public getJumpSpeedMultiplier(): number {
    return this.hasHighJumpAbility
      ? Player.HIGH_JUMP_SPEED_MULTIPLIER
      : Player.JUMP_SPEED_MULTIPLIER;
  }
}
