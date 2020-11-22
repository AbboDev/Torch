import { Facing, DirectionAxisY, DirectionAxisX } from 'Miscellaneous/Direction';
import { ControllerKey } from 'Miscellaneous/Controller';

import { Hitbox } from 'Entities/Hitbox';
import { Gun } from 'Entities/Weapons/Gun';
import { Bow } from 'Entities/Weapons/Bow';
import { Rifle } from 'Entities/Weapons/Rifle';
import { Weapon } from 'Entities/Weapons/Weapon';
import { BulletConfig } from 'Entities/Bullets/Bullet';
import { SpriteCollidable } from 'Entities/WorldCollidable';

import { MapScene } from 'Scenes/MapScene';

import { PLAYER_DEPTH } from 'Config/depths';
import { TILE_SIZE } from 'Config/tiles';

export class Player extends SpriteCollidable {
  /**
   * The Player Phaser body
   * @type {Phaser.Physics.Arcade.Body}
   */
  public body!: Phaser.Physics.Arcade.Body;

  /**
   * The Gun associated to Player
   * @type {Gun}
   */
  public gun!: Gun;

  /**
   * The Rifle associated to Player
   * @type {Rifle}
   */
  public rifle!: Rifle;

  /**
   * The Rifle associated to Player
   * @type {Bow}
   */
  public bow!: Bow;

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
   * The Player is jumping
   * @type {Boolean}
   */
  private isStandingJumping = false;

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
   * Check if the user had previously performed a jump without releasing the key
   * @type {Boolean}
   */
  private isPressingJump = false;

  /**
   * Check if the user had previously performed a shoot without releasing the key
   * @type {Boolean}
   */
  private isPressingShot = false;

  /**
   * The Player has the ability to do the double jump
   * @type {Boolean}
   */
  private hasDoubleJumpAbility = false;

  /**
   * The Player has the ability to perform an high jump
   * @type {Boolean}
   */
  private hasHighJumpAbility = false;

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
   * The Player has the gun range weapon
   * @type {Boolean}
   */
  private hasGunAbility = true;

  /**
   * The Player has the rifle range weapon
   * @type {Boolean}
   */
  private hasRifleAbility = false;

  /**
   * The Player has the bow range weapon
   * @type {Boolean}
   */
  private hasBowAbility = false;

  /**
   * Default multiplier of jump speed
   * @type {Number}
   */
  static JUMP_SPEED_MULTIPLIER = 1.25;

  /**
   * Multiplier of jump speed offers by dedicated powerup
   * @type {Number}
   */
  static WALL_JUMP_SPEED_MULTIPLIER = 1.1;

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
   * The max distance from wall where the player can yet perform a wall jump
   * @type {Number}
   */
  static WALL_DETECTION_DISTANCE = TILE_SIZE / 4;

  /**
   * The Y position to subtract from current Y to spawn bullets
   * @type {Number}
   */
  static SHOT_HEIGHT = TILE_SIZE + 2;

  /**
   * The default movement speed based on game gravity
   * @type {Number}
   */
  private baseSpeed: number;

  private leftWallHitbox: Hitbox;
  private rightWallHitbox: Hitbox;

  /**
   * The current room number
   * @type {number}
   */
  public currentRoom: number = 0;

  /**
   * The previous room number
   * @type {number | null}
   */
  public previousRoom: number | null = null;

  /**
   * Check if the Player overlap room bounds for start transition
   * @type {boolean}
   */
  public roomChange: boolean = false;

  /**
   * Check if the user can interact with Player
   * @type {boolean}
   */
  public canInteract: boolean = true;

  /**
   * Determinate if Player is crouch
   * @type {boolean}
   */
  public isCrouch: boolean = false;

  /**
   * Determinate if Player can crouch
   * @type {boolean}
   */
  public canCrouch: boolean = true;

  /**
   * Determinate if Player has smaller collision box
   * @type {boolean}
   */
  public isBodySmall: boolean = false;

  /**
   * Create the Player
   *
   * @param {MapScene} scene - scene creating the player.
   * @param {number} x - Start location x value.
   * @param {number} y - Start location y value.
   */
  constructor(
    public scene: MapScene,
    public x: number,
    public y: number,
    currentRoom = 0
  ) {
    super(scene, x, y, 'hero_idle_center');

    this.currentRoom = currentRoom;

    this.facing = {
      y: DirectionAxisY.MIDDLE,
      x: DirectionAxisX.CENTER,
    }

    this.baseSpeed = this.scene.getWorldGravity().y / 2;

    this.scene.add.existing(this);
    this.scene.physics.world.enable(this);

    this
      .setDepth(PLAYER_DEPTH)
      .setOrigin(0.5, 1)
      .setCollideWorldBounds(true)
      .setBounce(0)
      .setMaxVelocity(
        this.getMaxRunSpeed(),
        this.baseSpeed * Player.HIGH_JUMP_SPEED_MULTIPLIER
      );

    this.body
      .setAllowGravity(true)
      .setAllowDrag(true)
      .setDragX(0.90)
      .setOffset(TILE_SIZE / 2, TILE_SIZE / 2)
      .setSize(TILE_SIZE, TILE_SIZE * 2.5, false);

    this.body.useDamping = true;

    this.gun = new Gun(this.scene);
    this.rifle = new Rifle(this.scene);
    this.bow = new Bow(this.scene);

    const bounds = this.getBodyBounds();

    this.body.updateCenter();

    this.leftWallHitbox = new Hitbox(
      this.scene,
      bounds.left - Player.WALL_DETECTION_DISTANCE / 2,
      bounds.top + this.body.halfHeight,
      Player.WALL_DETECTION_DISTANCE,
      this.body.halfHeight
    );

    this.rightWallHitbox = new Hitbox(
      this.scene,
      bounds.right + Player.WALL_DETECTION_DISTANCE / 2,
      bounds.top + this.body.halfHeight,
      Player.WALL_DETECTION_DISTANCE,
      this.body.halfHeight
    );
  }

  public static preload(scene: Phaser.Scene): void {
    const spriteSize: Phaser.Types.Loader.FileTypes.ImageFrameConfig = {
      frameWidth: TILE_SIZE * 2,
      frameHeight: TILE_SIZE * 3
    };

    const smallSpriteSize: Phaser.Types.Loader.FileTypes.ImageFrameConfig = {
      frameWidth: TILE_SIZE * 2,
      frameHeight: TILE_SIZE * 2
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
      )
      .spritesheet(
        'hero_jump_idle_left',
        '/assets/sprites/hero_jump_idle_left.png',
        spriteSize
      )
      .spritesheet(
        'hero_jump_idle_right',
        '/assets/sprites/hero_jump_idle_right.png',
        spriteSize
      )
      .spritesheet(
        'hero_jump_left',
        '/assets/sprites/hero_jump_left.png',
        smallSpriteSize
      )
      .spritesheet(
        'hero_jump_right',
        '/assets/sprites/hero_jump_right.png',
        smallSpriteSize
      )
      .spritesheet(
        'hero_jump_left_start',
        '/assets/sprites/hero_jump_left_start.png',
        smallSpriteSize
      )
      .spritesheet(
        'hero_jump_right_start',
        '/assets/sprites/hero_jump_right_start.png',
        smallSpriteSize
      )
      .spritesheet(
        'hero_crouch_idle_left',
        '/assets/sprites/hero_crouch_idle_left.png',
        smallSpriteSize
      )
      .spritesheet(
        'hero_crouch_idle_right',
        '/assets/sprites/hero_crouch_idle_right.png',
        smallSpriteSize
      );
  }

  public static create(scene: Phaser.Scene): void {
    scene.anims.create({
      key: 'hero_idle_center_animation',
      frames: scene.anims.generateFrameNumbers('hero_idle_center', {}),
      frameRate: 4,
      repeat: -1
    });

    scene.anims.create({
      key: 'hero_idle_left_animation',
      frames: scene.anims.generateFrameNumbers('hero_idle_left', {}),
      frameRate: 4,
      repeat: -1
    });

    scene.anims.create({
      key: 'hero_idle_right_animation',
      frames: scene.anims.generateFrameNumbers('hero_idle_right', {}),
      frameRate: 4,
      repeat: -1
    });

    scene.anims.create({
      key: 'hero_crouch_idle_left_animation',
      frames: scene.anims.generateFrameNumbers('hero_crouch_idle_left', {}),
      frameRate: 4,
      repeat: -1
    });

    scene.anims.create({
      key: 'hero_crouch_idle_right_animation',
      frames: scene.anims.generateFrameNumbers('hero_crouch_idle_right', {}),
      frameRate: 4,
      repeat: -1
    });

    scene.anims.create({
      key: 'hero_walk_left_animation',
      frames: scene.anims.generateFrameNumbers('hero_walk_left', {}),
      frameRate: 20,
      repeat: -1
    });

    scene.anims.create({
      key: 'hero_walk_right_animation',
      frames: scene.anims.generateFrameNumbers('hero_walk_right', {}),
      frameRate: 20,
      repeat: -1
    });

    scene.anims.create({
      key: 'hero_jump_idle_left_animation',
      frames: scene.anims.generateFrameNumbers('hero_jump_idle_left', {
        start: 0,
        end: 1
      }),
      duration: 300
    });

    scene.anims.create({
      key: 'hero_jump_idle_right_animation',
      frames: scene.anims.generateFrameNumbers('hero_jump_idle_right', {
        start: 0,
        end: 1
      }),
      duration: 300
    });

    scene.anims.create({
      key: 'hero_fall_idle_left_animation',
      frames: scene.anims.generateFrameNumbers('hero_jump_idle_left', {
        start: 2,
        end: 3
      }),
      duration: 300
    });

    scene.anims.create({
      key: 'hero_fall_idle_right_animation',
      frames: scene.anims.generateFrameNumbers('hero_jump_idle_right', {
        start: 2,
        end: 3
      }),
      duration: 300
    });

    scene.anims.create({
      key: 'hero_jump_left_animation',
      frames: scene.anims.generateFrameNumbers('hero_jump_left', {}),
      frameRate: 20,
      repeat: -1
    });

    scene.anims.create({
      key: 'hero_jump_right_animation',
      frames: scene.anims.generateFrameNumbers('hero_jump_right', {}),
      frameRate: 20,
      repeat: -1
    });
  }

  /**
   * Called before Update
   *
   * @param {any} time
   * @param {number} delta
   */
  public preUpdate(time: any, delta: number): void {
    super.preUpdate(time, delta);

    this.getRoom();
  }

  /**
   * Returns player's current and previous room, flags rooms player has entered
   */
  public getRoom(): void {
    if (this.scene.rooms.length > 1) {
      let roomNumber: number | null = null;

      const bounds = this.getBodyBounds();

      // Test all the rooms in the map
      for (let id in this.scene.rooms) {
        const room: Phaser.Types.Tilemaps.TiledObject = this.scene.rooms[id];

        const roomLeft = room.x || 0;
        const roomRight = roomLeft + (room.width || 0);
        const roomTop = room.y || 0;
        const roomBottom = roomTop + (room.height || 0);

        // Player is within the boundaries of this room
        if (bounds.centerX > roomLeft
          && bounds.centerX < roomRight
          && bounds.centerY > roomTop
          && bounds.centerY < roomBottom
        ) {
          roomNumber = parseInt(id);

          // Set this room as visited by Player
          if (room.properties) {
            const visited = room.properties.find(function(property: any) {
              return property.name === 'visited';
            });

            visited.value = true;
          }
        }
      };

      // Update player room variables
      if (roomNumber !== null && roomNumber !== this.currentRoom) {
        this.previousRoom = this.currentRoom;
        this.currentRoom = roomNumber;
        this.roomChange = true;
      } else {
        this.roomChange = false;
      }
    }
  }

  /**
   * @param {any} time
   * @param {number} delta
   */
  public update(time: any, delta: number): void {
    if (this.canInteract) {
      // Prevent jump when is facing forward
      if (this.facing.x !== DirectionAxisX.CENTER) {
        // Handles all the movement along the y axis
        this.jump();
      }

      // Handles all the movement along the x axis
      this.walk();

      // Prevent crouch when is facing forward
      if (this.facing.x !== DirectionAxisX.CENTER) {
        // Handles the Player crouch action
        this.crouch();
      }

      // Handles all the Player body resizing based on current state
      this.resizeBody();

      // The user can shoot only if the Player has at least one range weapon
      if (this.hasAtLeastOneRangeWeapon()) {
        // Handles all the ranged combat actions
        this.shoot(time);
      }
    }

    // Change the current animation based on previous operations
    this.animate();

    // Change the current animation based on previous operations
    this.updateHitbox(time, delta);

    // Debug the player after all the update cycle
    if (this.scene.physics.world.drawDebug) {
      this.debug();
    }
  }

  /**
   * Handles all the movement along the y axis
   */
  protected jump(): void {
    // Test if the user is pressing the button 'A'
    const isJumpPress: boolean = this.scene
      .getController()
      .isKeyPressed(ControllerKey.A);

    // First check if Player has unlocked wall jump
    if (this.hasWallJumpAbility) {
      // Test if the Player is near walls
      const walls: boolean[] = this.isTouchingWalls() as boolean[];
      const wallsCount = walls.filter((wall) => {
        return wall;
      });

      // Perform wall jump only if the Player
      // is not on the ground and is touching only one wall
      this.canWallJump = (!this.body.onFloor() && wallsCount.length === 1);
      this.hasDoneWallJump = false;

      if (this.canWallJump) {
        // The user have to press again the jump key to perform the action
        if (!this.isPressingJump && isJumpPress) {
          let sign = 0;

          if (
            // The Player is touching a wall on left
            walls[0]
            // The user is moving on the opposite side of wall (right)
            && this.scene
              .getController()
              .isKeyPressed(ControllerKey.RIGHT)) {
            sign = 1;
          } else if (
            // The Player is touching a wall on right
            walls[1]
            // The user is moving on the opposite side of wall (left)
            && this.scene
              .getController()
              .isKeyPressed(ControllerKey.LEFT)) {
            sign = -1;
          }

          // Test if both the actions are corrects
          if (sign !== 0) {
            // The Player is actually performing a jump
            this.isJumping = true;

            // The Player has done a wall jump
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

        this.isStandingJumping = Math.abs(this.body.velocity.x) <= TILE_SIZE * 2;
        if (this.isStandingJumping) {
          this.setMaxVelocity(
            TILE_SIZE * 4,
            this.baseSpeed * Player.HIGH_JUMP_SPEED_MULTIPLIER
          );
        }

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

        this.isStandingJumping = Math.abs(this.body.velocity.x) <= TILE_SIZE;

        this.setVelocityY(this.getJumpSpeed());
      }
    } else if (this.body.onFloor()) {
      // Reset everything if the player is touching the ground
      this.isFalling = false;
      this.isJumping = false;

      this.canDoubleJump = false;
      this.hasDoneDoubleJump = false;
    }

    if (this.body.velocity.y === 0) {
      this.isStandingJumping = false;
    }

    if (!this.isStandingJumping) {
      this.setMaxVelocity(
        this.getMaxRunSpeed(),
        this.baseSpeed * Player.HIGH_JUMP_SPEED_MULTIPLIER
      );
    }

    // Check if the user is actually holding the key
    this.isPressingJump = isJumpPress;

    // Detect if the Player is falling by checking if his y speed is positive
    if (this.body.velocity.y > 0) {
      this.isFalling = true;
      // If the Player is falling, he cannot also jump
      this.isJumping = false;
    } else {
      this.isFalling = false;
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

    // When the Player is in mid air, he must stand up
    if (this.body.velocity.y !== 0) {
      this.canCrouch = false;
      this.isCrouch = false;
    }
  }

  /**
   * Handles all the movement along the x axis
   */
  protected walk(): void {
    const isRightPress: boolean = this.scene
      .getController()
      .isKeyPressed(ControllerKey.RIGHT);
    const isLeftPress: boolean = this.scene
      .getController()
      .isKeyPressed(ControllerKey.LEFT);

    // When the Player is moving, he cannot also be crouch
    if (isRightPress || isLeftPress) {
      this.canCrouch = false;
      this.isCrouch = false;
    }

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
   * Handles the Player crouch action
   */
  protected crouch(): void {
    // Test if the Player can crouch in the current state and position
    if (this.canCrouch) {
      const isDownPressed: boolean = this.scene
        .getController()
        .isKeyPressed(ControllerKey.DOWN);

      const isUpPressed: boolean = this.scene
        .getController()
        .isKeyPressed(ControllerKey.UP);

      if (isDownPressed && !this.isCrouch) {
        this.isCrouch = true;
      } else if (isUpPressed && this.isCrouch) {
        this.isCrouch = false;
      }
    }

    this.canCrouch = true;
  }

  /**
   * Handles all the Player body resizing based on current state
   */
  protected resizeBody(): void {
    // Check if the Player is in mid air, but with an sufficient x speed
    if (this.isCrouch ||
      !this.isStandingJumping && (this.isFalling || this.isJumping)
    ) {
      if (!this.isBodySmall) {
        // Shrink his body to fit with the animation
        this.body
          .setOffset(TILE_SIZE / 2, 0)
          .setSize(TILE_SIZE, TILE_SIZE * 2, false);

        this.isBodySmall = true;
      }
    } else {
      if (this.isBodySmall) {
        // Reset the body to his original shape
        this.body
          .setOffset(TILE_SIZE / 2, TILE_SIZE / 2)
          .setSize(TILE_SIZE, TILE_SIZE * 2.5, false);

        this.isBodySmall = false;
      }
    }
  }

  /**
   * Handles all the ranged combat actions
   */
  protected shoot(time: any): void {
    if (!this.isPressingShot) {
      this.gun.canShoot();
      this.bow.canShoot();
      this.rifle.canShoot();
    }

    const isShootPress: boolean = this.scene
      .getController()
      .isKeyPressed(ControllerKey.B);

    // The user have to press Shot button and the player should not facing front
    if (isShootPress && this.facing.x !== DirectionAxisX.CENTER) {
      // Test which weapon the player has and if is single or with rateo
      const bulletPosition = new Phaser.Math.Vector2(
        this.x + (this.width / 2) * (this.facing.x === DirectionAxisX.RIGHT ? 1 : -1),
        this.getShotHeight()
      );

      const config: BulletConfig = {
        facing: this.facing,
        position: bulletPosition
      };

      let weapon = null;
      if (this.hasGunAbility) {
        weapon = 'gun';
      } else if (this.hasRifleAbility) {
        weapon = 'rifle';
      } else if (this.hasBowAbility) {
        weapon = 'bow';
      }

      if (weapon) {
        (this[weapon as keyof Player] as Weapon).fireBullet(time, config);
      }
    }

    this.isPressingShot = isShootPress;
  }

  /**
   * Change the current animation based on previous operations
   */
  protected animate(): void {
    let action: string = '';

    const isMoving: boolean = this.body.velocity.x !== 0;

    if (this.body.onFloor()) {
      if (this.isCrouch) {
        action = 'crouch_idle';
      } else if (this.body.velocity.x !== 0) {
        action = 'walk';
      } else {
        action = 'idle';
      }
    } else {
      if (!this.isStandingJumping) {
        action = 'jump';
      } else if (this.isJumping) {
        action = 'jump_idle';
      } else {
        action = 'fall_idle';
      }
    }

    const animation: string = `hero_${action}_${this.facing.x}_animation`;
    const doNewAnimation: boolean = animation !== this.anims.getCurrentKey();

    if (doNewAnimation) {
      this.anims.play(animation, true);
    }
  }

  protected updateHitbox(time: any, delta: number): void {
    const bounds = this.getBodyBounds();

    this.body.updateCenter();

    this.leftWallHitbox.alignToParent(
      this,
      bounds.left - Player.WALL_DETECTION_DISTANCE / 2,
      bounds.centerY
    );

    this.rightWallHitbox.alignToParent(
      this,
      bounds.right + Player.WALL_DETECTION_DISTANCE / 2,
      bounds.centerY
    );
  }

  /**
   * Debug the player after all the update cycle
   */
  protected debug(): void {}

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

  public isTouchingWalls(direction?: DirectionAxisX): boolean | boolean[] {
    let hitbox: Phaser.GameObjects.Rectangle;

    switch (direction) {
      case DirectionAxisX.LEFT:
        hitbox = this.leftWallHitbox;
        break;
      case DirectionAxisX.RIGHT:
        hitbox = this.rightWallHitbox;
        break;

      default:
        return [
          this.isTouchingWalls(DirectionAxisX.LEFT) as boolean,
          this.isTouchingWalls(DirectionAxisX.RIGHT) as boolean
        ];
    }

    return this.scene.physics.overlap(
      hitbox,
      this.scene.worldLayer,
      undefined,
      (hitbox, tile: unknown) => {
        if ((tile as Phaser.Tilemaps.Tile).index > -1) {
          return true;
        }
      }
    );
  }

  /**
   * Calculate the y coordinate where the bullet should spaw
   *
   * @return {number} The calculated Y coordinate
   */
  public getShotHeight(): number {
    const bounds = this.getBounds();

    return bounds.top + Player.SHOT_HEIGHT;
  }

  /**
   * Return true if the Player has at least one ranged weapon in inventory
   *
   * @return {boolean} [description]
   */
  public hasAtLeastOneRangeWeapon(): boolean {
    return this.hasGunAbility
      || this.hasRifleAbility
      || this.hasBowAbility;

    // TODO: add all other weapons into the function
  }

  /**
   * Get the bounds of the current GameObject body, regardless of its origin
   *
   * @return {Phaser.Geom.Rectangle} The bounds of the body
   */
  public getBodyBounds(): Phaser.Geom.Rectangle {
    // Get the current sprite bounds
    const bounds: Phaser.Geom.Rectangle = this.getBounds();

    return new Phaser.Geom.Rectangle(
      bounds.left + (this.width - this.body.width) * this.originX,
      bounds.top + (this.height - this.body.height) * this.originY,
      this.body.width,
      this.body.height
    );
  }
}
