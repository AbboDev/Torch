import { Facing } from '../miscellaneous/Facing';
import { DirectionAxisY, DirectionAxisX } from '../miscellaneous/Direction';
import { ControllerKey } from '../miscellaneous/Controller';
import { ControlScene } from '../scenes/ControlScene';

export class Player extends Phaser.Physics.Arcade.Sprite {
  /**
   * The Player Phaser body
   * @type {[type]}
   */
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
   * The Player can now perform a wall jump
   * @type {Boolean}
   */
  private canWallJump = false;

  /**
   * The Player had actually performed the wall jump
   * @type {Boolean}
   */
  private hasDoneWallJump = false;

  /**
   * Check if the user had previously performed a jump without release the key
   * @type {Boolean}
   */
  private isPressingJump = false;

  /**
   * The Player has the ability to do the double jump
   * @type {Boolean}
   */
  private hasDoubleJumpAbility = false;

  /**
   * The Player has the ability to perform an high jump
   * @type {Boolean}
   */
  private hasHighJumpAbility = true;

  /**
   * The Player has the ability to perform a wall jump
   * @type {Boolean}
   */
  private hasWallJumpAbility = true;

  /**
   * The Player has the ability to run quickly
   * @type {Boolean}
   */
  private hasBoostedRunAbility = false;

  /**
   * Default multiplier of jump speed
   * @type {Number}
   */
  static JUMP_SPEED_MULTIPLIER = 1.2;

  /**
   * Multiplier of jump speed offers by dedicated powerup
   * @type {Number}
   */
  static WALL_JUMP_SPEED_MULTIPLIER = 1.3;

  /**
   * Multiplier of jump speed offers by dedicated powerup
   * @type {Number}
   */
  static HIGH_JUMP_SPEED_MULTIPLIER = 1.5;

  /**
   * Default multiplier of run speed
   * @type {Number}
   */
  static RUN_SPEED_MULTIPLIER = 0.75;

  /**
   * Multiplier of run speed offers by dedicated powerup
   * @type {Number}
   */
  static BOOSTED_RUN_SPEED_MULTIPLIER = 1.5;

  /**
   * Multiplier of run speed offers by dedicated powerup
   * @type {Number}
   */
  static WALL_DETECTION_DISTANCE = 6;

  /**
   * The default movement speed based on game gravity
   * @type {Number}
   */
  private baseSpeed: number;

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

    this.baseSpeed = this.scene.getWorldGravity().y / 2;

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

    this
      .setDepth(2)
      .setOrigin(0, 0)
      .setCollideWorldBounds(true)
      .setBounce(0)
      .setMaxVelocity(
        this.getMaxRunSpeed(),
        this.baseSpeed * Player.HIGH_JUMP_SPEED_MULTIPLIER
      );

    this.body
      .setAllowGravity(true)
      .setAllowDrag(true)
      .setDragX(0.90);

    this.body.useDamping = true;

    this.scene.add.existing(this);

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
    // Handle all the movement along the y axis
    this.jump();

    // Handle all the movement along the x axis
    this.walk();

    // Change the current animation based on previous operations
    this.animate();
  }

  /**
   * Handle all the movement along the x axis
   */
  protected walk(): void {
    const isRightPress = this.scene.isKeyPress(ControllerKey.RIGHT);
    const isLeftPress = this.scene.isKeyPress(ControllerKey.LEFT);

    if (isRightPress && !isLeftPress) {
      this.facing.x = DirectionAxisX.RIGHT;

      this.setAccelerationX(this.getRunSpeed());
    } else if (isLeftPress && !isRightPress) {
      this.facing.x = DirectionAxisX.LEFT;

      this.setAccelerationX(-this.getRunSpeed());
    } else {
      this.setAccelerationX(0);

      // Simulate a little slide onto the floor for a bit
      // and stop it if match certain X speed
      if (Math.abs(this.body.velocity.x) < (this.baseSpeed / 20)) {
        this.setVelocityX(0);
      }
    }
  }

  /**
   * Handle all the movement along the y axis
   */
  protected jump(): void {
    // Test if the user is pressing the button 'A'
    const isJumpPress = this.scene.isKeyPress(ControllerKey.A);

    // First check if Player has unlocked wall jump
    if (this.hasWallJumpAbility) {
      // Test if the Player is near walls
      const walls = this.isTouchingWalls(
        Player.WALL_DETECTION_DISTANCE,
        this.height / 2
      );

      // Perform wall jump only if the Player,
      // is not on the ground and is touching at least one wall
      this.canWallJump = (!this.body.onFloor() && walls.length > 0);
      this.hasDoneWallJump = false;

      if (this.canWallJump) {
        // The user have to press again the jump key to perform the action
        if (!this.isPressingJump && isJumpPress) {
          let sign = 0;

          if (
            // The Player is touching a wall on left
            walls[0].overlapX < 0
            // The user is moving on the opposite side of wall (right)
            && this.scene.isKeyPress(ControllerKey.RIGHT)) {
            sign = 1;
          } else if (
            // The Player is touching a wall on right
            walls[0].overlapX > 0
            // The user is moving on the opposite side of wall (left)
            && this.scene.isKeyPress(ControllerKey.LEFT)) {
            sign = -1;
          }

          // Test if both the actions are corrects
          if (sign !== 0) {
            this.hasDoneWallJump = true;
            // Then push the player on the opposite side of wall and to the ceil
            this.setVelocity(
              Math.abs(this.getJumpSpeed(false)) * 2 * sign,
              this.getJumpSpeed()
            );
          }
        }
      }
    }

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

  /**
   * Change the current animation based on previous operations
   */
  protected animate(): void {
    const isRunning = this.body.velocity.x != 0;
    const animation = isRunning ? 'walk' : 'idle';

    this.play(`hero_${animation}_${this.facing.x}_animation`, true);
  }

  public getJumpSpeed(applyMultlipier = true): number {
    return -this.baseSpeed
      * (applyMultlipier ? this.getJumpSpeedMultiplier() : 1);
  }

  protected getJumpSpeedMultiplier(): number {
    if (this.hasWallJumpAbility && this.canWallJump) {
      return Player.WALL_JUMP_SPEED_MULTIPLIER;
    }

    if (this.hasDoubleJumpAbility && this.canDoubleJump) {
      return Player.JUMP_SPEED_MULTIPLIER;
    }

    if (this.hasHighJumpAbility) {
      return Player.HIGH_JUMP_SPEED_MULTIPLIER;
    }

    return Player.JUMP_SPEED_MULTIPLIER;
  }

  public getRunSpeed(): number {
    return this.baseSpeed * 2;
  }

  public getMaxRunSpeed(): number {
    return this.baseSpeed * this.getRunSpeedMultiplier();
  }

  public getRunSpeedMultiplier(): number {
    return this.hasBoostedRunAbility
      ? Player.BOOSTED_RUN_SPEED_MULTIPLIER
      : Player.RUN_SPEED_MULTIPLIER;
  }

  public isTouchingWalls(
    distance?: number,
    height?: number
  ): Phaser.Physics.Arcade.StaticBody[] {
    distance = distance || 0;
    height = height || this.height;

    const walls = this.scene.physics.overlapRect(
      this.body.position.x - distance,
      this.body.position.y - this.height / 2,
      this.width + (distance * 2),
      height,
      false,
      true
    );

    return walls as Phaser.Physics.Arcade.StaticBody[];
  }
}
