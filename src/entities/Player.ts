import {
  Facing,
  DirectionAxisY,
  DirectionAxisX
} from 'Miscellaneous/Direction';
import { ControllerKey } from 'Miscellaneous/Controller';

import { Hitbox, AreaPosition } from 'Entities/Hitboxes/Hitbox';

import { Gun } from 'Entities/Weapons/Gun';
import { Bow } from 'Entities/Weapons/Bow';
import { Rifle } from 'Entities/Weapons/Rifle';
import { Weapon } from 'Entities/Weapons/Weapon';
import { BulletConfig } from 'Entities/Bullets/Bullet';
import { SpriteCollidable } from 'Entities/WorldCollidable';

import { MapScene } from 'Scenes/MapScene';

import { UpdateStatusObject } from 'Miscellaneous/UpdateStatusObject';

import { PLAYER_DEPTH } from 'Config/depths';
import { TILE_SIZE } from 'Config/tiles';

export class Player extends SpriteCollidable {
  /**
   * The Player Phaser body
   *
   * @type {Phaser.Physics.Arcade.Body}
   */
  public body!: Phaser.Physics.Arcade.Body;

  /**
   * Current health points
   *
   * @type {Number}
   */
  private _life = 99;

  /**
   * Maximum health points
   *
   * @type {Number}
   */
  private _maxLife = 99;

  /**
   * Current ammo
   *
   * @type {Number}
   */
  private _ammo = 30;

  /**
   * Maximum ammo
   *
   * @type {Number}
   */
  private _maxAmmo = 30;

  /**
   * Current battery level
   *
   * @type {Number}
   */
  private _battery = 0;

  /**
   * Maximum battery level
   *
   * @type {Number}
   */
  private _maxBattery = 99;

  /**
   * Maximum battery level
   *
   * @type {Number}
   */
  private batteryRechargeTimer: Phaser.Time.TimerEvent;

  /**
   * The Gun associated to Player
   *
   * @type {Gun}
   */
  public gun!: Gun;

  /**
   * The Rifle associated to Player
   *
   * @type {Rifle}
   */
  public rifle!: Rifle;

  /**
   * The Rifle associated to Player
   *
   * @type {Bow}
   */
  public bow!: Bow;

  /**
   * The correct position where the Player where collocated
   *
   * @type {Phaser.Math.Vector2}
   */
  private adjustTo?: Phaser.Math.Vector2;

  /**
   * Where the Player is watching
   *
   * @type {Facing}
   */
  private facing: Facing;

  /**
   * Where the Player was watching
   *
   * @type {Facing}
   */
  private previousFacing: Facing;

  /**
   * If the Player is aim diagonally
   *
   *
   * @type {Boolean}
   */
  private isAimingDiagonal = false;

  /**
   * If the Player has aimed diagonally
   *
   *
   * @type {Boolean}
   */
  private hasAimingDiagonal = false;

  /**
   * The Player is jumping
   *
   * @type {Boolean}
   */
  private isJumping = false;

  /**
   * The Player is jumping
   *
   * @type {Boolean}
   */
  private isStandingJumping = false;

  /**
   * The Player is falling
   *
   * @type {Boolean}
   */
  private isFalling = false;

  /**
   * The Player can now perform the double jump
   *
   * @type {Boolean}
   */
  private canDoubleJump = false;

  /**
   * The Player had actually performed the double jump
   *
   * @type {Boolean}
   */
  private hasDoneDoubleJump = false;

  /**
   * The Player can now perform a wall jump
   *
   * @type {Boolean}
   */
  private canWallJump = false;

  /**
   * The Player had actually performed the wall jump
   *
   * @type {Boolean}
   */
  private hasDoneWallJump = false;

  /**
   * Check if the user had previously
   * performed a jump without releasing the key
   *
   * @type {Boolean}
   */
  private isPressingJump = false;

  /**
   * Check if the user had previously
   * performed a shoot without releasing the key
   *
   * @type {Boolean}
   */
  private isPressingShot = false;

  /**
   * Check if the user had previously
   * performed a dash without releasing the key
   *
   * @type {Boolean}
   */
  private isPressingDash = false;

  /**
   * The Player has the ability to do the double jump
   *
   * @type {Boolean}
   */
  private hasDoubleJumpAbility = false;

  /**
   * The Player has the ability to perform an high jump
   *
   * @type {Boolean}
   */
  private hasHighJumpAbility = false;

  /**
   * The Player has the ability to perform a wall jump
   *
   * @type {Boolean}
   */
  private hasWallJumpAbility = true;

  /**
   * The Player has the ability to run quickly
   *
   * @type {Boolean}
   */
  private hasBoostedRunAbility = false;

  /**
   * The Player has the ability to hang to cliffs
   *
   * @type {Boolean}
   */
  private hasHangAbility = true;

  /**
   * The Player has the ability to make an horizontal dash
   *
   * @type {Boolean}
   */
  private hasDashAbility = true;

  /**
   * The Player has the gun range weapon
   *
   * @type {Boolean}
   */
  private hasGunAbility = true;

  /**
   * The Player has the rifle range weapon
   *
   * @type {Boolean}
   */
  private hasRifleAbility = false;

  /**
   * The Player has the bow range weapon
   *
   * @type {Boolean}
   */
  private hasBowAbility = false;

  /**
   * Default multiplier of jump speed
   *
   * @type {Number}
   */
  static JUMP_SPEED_MULTIPLIER = 1.25;

  /**
   * Multiplier of jump speed offers by dedicated powerup
   *
   * @type {Number}
   */
  static WALL_JUMP_SPEED_MULTIPLIER = 1.1;

  /**
   * Multiplier of jump speed offers by dedicated powerup
   *
   * @type {Number}
   */
  static HIGH_JUMP_SPEED_MULTIPLIER = 1.5;

  /**
   * Default multiplier of run speed
   *
   * @type {Number}
   */
  static RUN_SPEED_MULTIPLIER = 0.75;

  /**
   * Multiplier of dash speed offers by dedicated powerup
   *
   * @type {Number}
   */
  static DASH_SPEED_MULTIPLIER = 2;

  /**
   * Multiplier of run speed offers by dedicated powerup
   *
   * @type {Number}
   */
  static BOOSTED_RUN_SPEED_MULTIPLIER = 1.5;

  /**
   * The max distance from wall where the player can yet perform a wall jump
   *
   * @type {Number}
   */
  static WALL_DETECTION_DISTANCE = TILE_SIZE / 4;

  /**
   * The Y position to subtract from current Y to spawn bullets
   *
   * @type {Number}
   */
  static SHOT_HEIGHT = TILE_SIZE + 2;

  /**
   * The standard body width
   *
   * @type {Number}
   */
  static BODY_WIDTH = TILE_SIZE;

  /**
   * The standard body height
   *
   * @type {Number}
   */
  static BODY_HEIGHT = TILE_SIZE * 2;

  /**
   * The body width when it's crouch or jumping
   *
   * @type {Number}
   */
  static BODY_SMALL_WIDTH = TILE_SIZE;

  /**
   * The body height when it's crouch or jumping
   *
   * @type {Number}
   */
  static BODY_SMALL_HEIGHT = Player.BODY_HEIGHT / 4 * 3;

  /**
   * The default movement speed based on game gravity
   *
   * @type {Number}
   */
  private baseSpeed: number;

  /**
   * The hitbox dedicated to detect overlapping with walls on the left
   *
   * @type {Hitbox}
   */
  private leftWallHitbox: Hitbox;

  /**
   * The hitbox dedicated to detect overlapping with walls on the right
   *
   * @type {Hitbox}
   */
  private rightWallHitbox: Hitbox;

  /**
   * The hitbox dedicated to detect overlapping with tiles on the left
   *
   * @type {Hitbox}
   */
  private leftHangHitbox: Hitbox;

  /**
   * The hitbox dedicated to detect overlapping with tiles on the right
   *
   * @type {Hitbox}
   */
  private rightHangHitbox: Hitbox;

  /**
   * The current room number
   *
   * @type {number}
   */
  public currentRoom = 0;

  /**
   * The previous room number
   *
   * @type {number | null}
   */
  public previousRoom: number | null = null;

  /**
   * Check if the Player overlap room bounds for start transition
   *
   * @type {boolean}
   */
  public roomChange = false;

  /**
   * Check if the user can interact with Player
   *
   * @type {boolean}
   */
  public canInteract = true;

  /**
   * Determinate if Player is crouch
   *
   * @type {boolean}
   */
  public isCrouch = false;

  /**
   * Determinate if Player can crouch
   *
   * @type {boolean}
   */
  public canCrouch = true;

  /**
   * Determinate if Player has smaller collision box
   *
   * @type {boolean}
   */
  public isBodySmall = false;

  /**
   * Determinate if Player is hanging on a tile
   *
   * @type {boolean}
   */
  public isHanging = false;

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
    };

    this.previousFacing = this.facing;

    this.baseSpeed = this.scene.getWorldGravity().y / 2;

    this.scene.add.existing(this);
    this.scene.physics.world.enable(this);

    this
      .setDepth(PLAYER_DEPTH)
      .setOrigin(0.5, 0)
      .setCollideWorldBounds(true)
      .setBounce(0)
      .setMaxVelocity(
        this.getMaxRunSpeed(),
        this.getMaxJumpSpeed()
      );

    this.body
      .setAllowGravity(true)
      .setAllowDrag(true)
      .setDragX(0.90)
      .setOffset(
        (this.width - Player.BODY_WIDTH) * (1 - this.originX),
        (this.height - Player.BODY_HEIGHT) * (1 - this.originY)
      )
      .setSize(Player.BODY_WIDTH, Player.BODY_HEIGHT, false);

    this.body.useDamping = true;

    this.gun = new Gun(this.scene);
    this.rifle = new Rifle(this.scene);
    this.bow = new Bow(this.scene);

    this.body.updateCenter();

    const bounds = this.getBodyBounds();

    this.leftWallHitbox = new Hitbox(
      this.scene,
      bounds.left - Player.WALL_DETECTION_DISTANCE / 2,
      bounds.centerY,
      Player.WALL_DETECTION_DISTANCE,
      this.body.halfHeight
    );

    this.rightWallHitbox = new Hitbox(
      this.scene,
      bounds.right + Player.WALL_DETECTION_DISTANCE / 2,
      bounds.centerY,
      Player.WALL_DETECTION_DISTANCE,
      this.body.halfHeight
    );

    this.leftHangHitbox = new Hitbox(
      this.scene,
      bounds.left - Player.WALL_DETECTION_DISTANCE / 2 - 1,
      bounds.top + Player.WALL_DETECTION_DISTANCE / 2 + 1,
      Player.WALL_DETECTION_DISTANCE,
      Player.WALL_DETECTION_DISTANCE
    );

    this.rightHangHitbox = new Hitbox(
      this.scene,
      bounds.right + Player.WALL_DETECTION_DISTANCE / 2 + 1,
      bounds.top + Player.WALL_DETECTION_DISTANCE / 2 + 1,
      Player.WALL_DETECTION_DISTANCE,
      Player.WALL_DETECTION_DISTANCE
    );

    // TODO:
    // console.debug(this.scene.data);

    this.batteryRechargeTimer = this.scene.time.addEvent({
      delay: 200,
      callback: this.timer.bind(this),
      loop: true
    });

    this.scene.registry
      .set('ammo', this.ammo)
      .set('maxAmmo', this.maxAmmo)
      .set('life', this.life)
      .set('maxLife', this.maxLife)
      .set('battery', this.battery)
      .set('maxBattery', this.maxBattery);
  }

  public get life(): number {
    return this._life;
  }

  public set life(value: number) {
    this._life = value;
    this.scene.registry.set('life', this._life);
  }

  public get maxLife(): number {
    return this._maxLife;
  }

  public set maxLife(value: number) {
    this._maxLife = value;
    this.scene.registry.set('maxLife', this._maxLife);
  }

  public get ammo(): number {
    return this._ammo;
  }

  public set ammo(value: number) {
    this._ammo = value;
    this.scene.registry.set('ammo', this._ammo);
  }

  public get maxAmmo(): number {
    return this._maxAmmo;
  }

  public set maxAmmo(value: number) {
    this._maxAmmo = value;
    this.scene.registry.set('maxAmmo', this._maxAmmo);
  }

  public get battery(): number {
    return this._battery;
  }

  public set battery(value: number) {
    this._battery = value;
    this.scene.registry.set('battery', this._battery);
  }

  public get maxBattery(): number {
    return this._maxBattery;
  }

  public set maxBattery(value: number) {
    this._maxBattery = value;
    this.scene.registry.set('maxBattery', this._maxBattery);
  }

  public timer(): void {
    if (this.battery === this.maxBattery) {
      this.batteryRechargeTimer.remove();
    }

    ++this.battery;

    const status: UpdateStatusObject = {
      current: this.battery,
      max: this.maxBattery
    };
    this.scene.events.emit('changeBattery', status);
  }

  public static preload(scene: Phaser.Scene): void {
    const spriteSize: Phaser.Types.Loader.FileTypes.ImageFrameConfig = {
      frameWidth: TILE_SIZE * 2,
      frameHeight: TILE_SIZE * 3
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
        'hero_hang_left',
        '/assets/sprites/hero_hang_left.png',
        spriteSize
      )
      .spritesheet(
        'hero_hang_right',
        '/assets/sprites/hero_hang_right.png',
        spriteSize
      )
      .spritesheet(
        'hero_aim_up_left',
        '/assets/sprites/hero_aim_up_left.png',
        spriteSize
      )
      .spritesheet(
        'hero_aim_up_right',
        '/assets/sprites/hero_aim_up_right.png',
        spriteSize
      )
      .spritesheet(
        'hero_aim_up_diagonal_left',
        '/assets/sprites/hero_aim_up_diagonal_left.png',
        spriteSize
      )
      .spritesheet(
        'hero_aim_up_diagonal_right',
        '/assets/sprites/hero_aim_up_diagonal_right.png',
        spriteSize
      )
      .spritesheet(
        'hero_aim_down_diagonal_left',
        '/assets/sprites/hero_aim_down_diagonal_left.png',
        spriteSize
      )
      .spritesheet(
        'hero_aim_down_diagonal_right',
        '/assets/sprites/hero_aim_down_diagonal_right.png',
        spriteSize
      )
      .spritesheet(
        'hero_jump_left',
        '/assets/sprites/hero_jump_left.png',
        spriteSize
      )
      .spritesheet(
        'hero_jump_right',
        '/assets/sprites/hero_jump_right.png',
        spriteSize
      )
      .spritesheet(
        'hero_jump_left_start',
        '/assets/sprites/hero_jump_left_start.png',
        spriteSize
      )
      .spritesheet(
        'hero_jump_right_start',
        '/assets/sprites/hero_jump_right_start.png',
        spriteSize
      )
      .spritesheet(
        'hero_crouch_idle_left',
        '/assets/sprites/hero_crouch_idle_left.png',
        spriteSize
      )
      .spritesheet(
        'hero_crouch_idle_right',
        '/assets/sprites/hero_crouch_idle_right.png',
        spriteSize
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

    scene.anims.create({
      key: 'hero_hang_left_animation',
      frames: scene.anims.generateFrameNumbers('hero_hang_left', {}),
      frameRate: 4,
      repeat: -1
    });

    scene.anims.create({
      key: 'hero_hang_right_animation',
      frames: scene.anims.generateFrameNumbers('hero_hang_right', {}),
      frameRate: 4,
      repeat: -1
    });

    scene.anims.create({
      key: 'hero_aim_up_left_animation',
      frames: scene.anims.generateFrameNumbers('hero_aim_up_left', {}),
      frameRate: 4,
      repeat: -1
    });

    scene.anims.create({
      key: 'hero_aim_up_right_animation',
      frames: scene.anims.generateFrameNumbers('hero_aim_up_right', {}),
      frameRate: 4,
      repeat: -1
    });

    scene.anims.create({
      key: 'hero_aim_up_diagonal_left_animation',
      frames: scene.anims.generateFrameNumbers('hero_aim_up_diagonal_left', {}),
      frameRate: 4,
      repeat: -1
    });

    scene.anims.create({
      key: 'hero_aim_up_diagonal_right_animation',
      frames: scene.anims.generateFrameNumbers('hero_aim_up_diagonal_right', {}),
      frameRate: 4,
      repeat: -1
    });

    scene.anims.create({
      key: 'hero_aim_down_diagonal_left_animation',
      frames: scene.anims.generateFrameNumbers('hero_aim_down_diagonal_left', {}),
      frameRate: 4,
      repeat: -1
    });

    scene.anims.create({
      key: 'hero_aim_down_diagonal_right_animation',
      frames: scene.anims.generateFrameNumbers('hero_aim_down_diagonal_right', {}),
      frameRate: 4,
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
      this.scene.rooms.forEach((room, id) => {
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
          roomNumber = id;

          // Set this room as visited by Player
          if (room.properties) {
            const visited = room.properties.find(function(property: any) {
              return property.name === 'visited';
            });

            visited.value = true;
          }
        }
      });

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
    super.update();

    this.previousFacing = {...this.facing};

    if (this.canInteract) {
      // Handles all the movement along the x axis
      this.tiltAim();

      // Prevent jump when is facing forward
      if (this.facing.x !== DirectionAxisX.CENTER) {
        // Handles all the movement along the y axis
        this.jump();
      }

      // Handles all the movement along the x axis
      this.walk();

      // Handles all the movement along the x axis
      this.dash();

      // Handles the hang action
      this.hang();

      // Handles the hang action
      this.resizeBody();

      // Prevent crouch when is facing forward
      if (this.facing.x !== DirectionAxisX.CENTER) {
        // Handles the crouch action
        this.crouch();
      }

      // The user can shoot only if the Player has at least one range weapon
      if (this.hasAtLeastOneRangeWeapon()) {
        // Handles all the ranged combat actions
        this.shoot(time);
      }
    }

    // Change the current animation based on previous operations
    this.adjustPosition();

    // Change the current animation based on previous operations
    this.updateHitboxes();

    // Change the current animation based on previous operations
    this.animate();

    // Debug the player after all the update cycle
    if (this.scene.physics.world.drawDebug) {
      this.debug();
    }
  }

  /**
   * Handles all the movement along the y axis
   */
  protected tiltAim(): void {
    const isAimPress: boolean = this.scene
      .getController()
      .isKeyPressed(ControllerKey.L);

    const isUpPressed: boolean = this.scene
      .getController()
      .isKeyPressed(ControllerKey.UP);

    const isDownPressed: boolean = this.scene
      .getController()
      .isKeyPressed(ControllerKey.DOWN);

    const isLeftPressed: boolean = this.scene
      .getController()
      .isKeyPressed(ControllerKey.LEFT);

    const isRightPressed: boolean = this.scene
      .getController()
      .isKeyPressed(ControllerKey.RIGHT);

    const isAimingWhileMoving = (isLeftPressed || isRightPressed)
      && (isUpPressed || isDownPressed);

    this.hasAimingDiagonal = this.isAimingDiagonal;

    if (isUpPressed || (isAimPress && !this.isAimingDiagonal)) {
      this.facing.y = DirectionAxisY.UP;
    } else if (isDownPressed
      && (this.body.velocity.y !== 0 || isAimPress || isAimingWhileMoving)
    ) {
      this.facing.y = DirectionAxisY.DOWN;
    } else if (!this.isAimingDiagonal) {
      this.facing.y = DirectionAxisY.MIDDLE;
    }

    this.isAimingDiagonal = isAimPress || isAimingWhileMoving;
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

        const velocity = Math.abs(this.body.velocity.x);
        this.isStandingJumping = velocity <= TILE_SIZE * 2;
        if (this.isStandingJumping) {
          this.setMaxVelocity(
            this.getStandingRunSpeed(),
            this.getMaxJumpSpeed()
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

    if (this.body.velocity.y === 0 && this.body.onFloor()) {
      this.isStandingJumping = false;
    }

    if (!this.isStandingJumping) {
      this.setMaxVelocity(
        this.getMaxRunSpeed(),
        this.getMaxJumpSpeed()
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
   * Handles the dash action
   */
  protected dash(): void {
    const isDashPress: boolean = this.scene
      .getController()
      .isKeyPressed(ControllerKey.X);

    if (this.hasDashAbility) {
      const time = this.scene.getController().getKeyDuration(ControllerKey.X);

      if (time < 100
        && isDashPress
        && this.battery > 0
        && this.facing.x !== DirectionAxisX.CENTER
      ) {
        const isRight = this.facing.x === DirectionAxisX.RIGHT;
        const facing: number = (isRight ? 1 : -1);

        this.setMaxVelocity(
          this.getDashSpeed(),
          this.getMaxJumpSpeed()
        );

        this.setVelocityX(this.getDashSpeed() * facing);

        --this.battery;

        const status: UpdateStatusObject = {
          current: this.battery,
          max: this.maxBattery
        };
        this.scene.events.emit('changeBattery', status);
      } else {
        this.setMaxVelocity(
          this.isStandingJumping
            ? this.getStandingRunSpeed()
            : this.getMaxRunSpeed(),
          this.getMaxJumpSpeed()
        );
      }
    }

    this.isPressingDash = isDashPress;
  }

  /**
   * Handles the hang action
   */
  protected hang(): void {
    if (this.hasHangAbility) {
      if (this.body.velocity.y !== 0 || this.isHanging) {
        let hitbox!: Hitbox;
        let isTouchingTiles = false;
        let hasTileOnHand = false;

        if (this.facing.x === DirectionAxisX.LEFT) {
          hitbox = this.leftHangHitbox;
        } else if (this.facing.x === DirectionAxisX.RIGHT) {
          hitbox = this.rightHangHitbox;
        }

        if (typeof hitbox !== 'undefined') {
          // Test if Player's hitbox is touching a tile
          isTouchingTiles = hitbox.overlapTilesArea(AreaPosition.TOP_HALF);
          let currentTile!: Phaser.Tilemaps.Tile;

          if (isTouchingTiles) {
            // If the Player is touching a tile test which tiles
            // are inside the hitbox area
            const tiles = this.scene
              .map
              .getTilesWithinShape(hitbox.getBounds())
              .filter((tile) => {
                // Filter the void tile
                return tile.index > -1;
              });

            if (tiles.length === 1) {
              currentTile = tiles[0];
              // Check if there is a tile upper the current one
              const upperTile = this.scene.map
                .getTileAt(currentTile.x, currentTile.y - 1);
              hasTileOnHand = upperTile === null;
            }
          }

          if (hasTileOnHand) {
            this.isHanging = true;
            // Prevent the Player to slide down
            this.body.setAllowGravity(false);

            this.setGravity(0);
            this.setVelocityY(0);
            // Align the body to the current tile
            this.setNewPosition(null, currentTile.pixelY);
          } else {
            this.isHanging = false;

            this.body.setAllowGravity(true);
          }
        }
      }
    }
  }

  /**
   * Handles the crouch action
   */
  protected crouch(): void {
    // Test if the Player can crouch in the current state and position
    if (this.canCrouch) {
      const isDownPressed: boolean = this.scene
        .getController()
        .isKeyPressedForFirstTime(ControllerKey.DOWN);

      const isUpPressed: boolean = this.scene
        .getController()
        .isKeyPressed(ControllerKey.UP);

      if (isDownPressed && !this.isCrouch) {
        if (this.isAimingDiagonal && this.previousFacing.y === this.facing.y) {
          this.isCrouch = true;
        }
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

    let updateBody = false;
    let offsetX!: number;
    let offsetY!: number;

    if (!this.isHanging && this.isCrouch) {
      if (!this.isBodySmall) {
        // Shrink his body to fit with the animation
        offsetX = (this.width - Player.BODY_SMALL_WIDTH) * (1 - this.originX);
        offsetY = (this.height - Player.BODY_SMALL_HEIGHT) * (1 - this.originY);

        updateBody = true;
      }
    } else {
      if (this.isBodySmall) {
        // Reset the body to his original shape
        offsetX = (this.width - Player.BODY_WIDTH) * (1 - this.originX);
        offsetY = (this.height - Player.BODY_HEIGHT) * (1 - this.originY);

        updateBody = true;
      }
    }

    if (updateBody) {
      const previousOffset = this.body.offset.clone();

      this.body
        .setOffset(offsetX, offsetY)
        .setSize(
          this.isBodySmall ? Player.BODY_WIDTH : Player.BODY_SMALL_WIDTH,
          this.isBodySmall ? Player.BODY_HEIGHT : Player.BODY_SMALL_HEIGHT,
          false
        )
        .updateCenter();

      if (this.adjustTo) {
        const clone = this.adjustTo.clone();
        clone.add(new Phaser.Math.Vector2(
          previousOffset.x - offsetX,
          previousOffset.y - offsetY
        ));

        this.setNewPosition(clone);
      }

      this.isBodySmall = !this.isBodySmall;
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
        diagonal: this.isAimingDiagonal,
        position: bulletPosition
      };

      let equippedWeapon = null;
      if (this.hasGunAbility) {
        equippedWeapon = 'gun';
      } else if (this.hasRifleAbility) {
        equippedWeapon = 'rifle';
      } else if (this.hasBowAbility) {
        equippedWeapon = 'bow';
      }

      if (equippedWeapon && this.ammo > 0) {
        const weapon = (this[equippedWeapon as keyof Player] as Weapon);
        const wasFired = weapon.fireBullet(time, config);

        if (wasFired) {
          --this.ammo;
        }
      }
    }

    this.isPressingShot = isShootPress;
  }

  /**
   * Adjust the current body position
   */
  protected adjustPosition(): void {
    if (this.adjustTo) {
      if (this.adjustTo.x !== -1) {
        this.body.x = this.adjustTo.x;
      }

      if (this.adjustTo.y !== -1) {
        this.body.y = this.adjustTo.y;
      }

      delete this.adjustTo;
    }
  }

  /**
   * Change the current animation based on previous operations
   */
  protected animate(): void {
    let action = '';

    if (this.body.onFloor()) {
      if (this.isCrouch) {
        action = 'crouch_idle';
      } else if (this.body.velocity.x !== 0) {
        if (this.isAimingDiagonal) {
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          action = `aim_${this.facing.y}_diagonal`;
        } else {
          action = 'walk';
        }
      } else if (this.isAimingDiagonal) {
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        action = `aim_${this.facing.y}_diagonal`;
      } else if (this.facing.y === DirectionAxisY.UP
        // Avoid going from diagonal to up while leaving aim
        && !this.hasAimingDiagonal
      ) {
        action = `aim_${this.facing.y}`;
      } else {
        action = 'idle';
      }
    } else {
      if (this.isHanging) {
        action = 'hang';
      } else if (!this.isStandingJumping) {
        action = 'jump';
      } else if (this.isJumping) {
        action = 'jump_idle';
      } else {
        action = 'fall_idle';
      }
    }

    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    const animation = `hero_${action}_${this.facing.x}_animation`;
    const doNewAnimation: boolean = animation !== this.anims.getCurrentKey();

    if (doNewAnimation) {
      this.anims.play(animation, true);
    }
  }

  protected updateHitboxes(): void {
    this.body.updateCenter();

    const bounds = this.getBodyBounds();

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

    this.leftHangHitbox.alignToParent(
      this,
      bounds.left - Player.WALL_DETECTION_DISTANCE / 2 - 1,
      bounds.top + Player.WALL_DETECTION_DISTANCE / 2 + 1
    );

    this.rightHangHitbox.alignToParent(
      this,
      bounds.right + Player.WALL_DETECTION_DISTANCE / 2 + 1,
      bounds.top + Player.WALL_DETECTION_DISTANCE / 2 + 1
    );
  }

  /**
   * Debug the player after all the update cycle
   */
  protected debug(): void {
    // if (this.scene.getController().isKeyPressedForFirstTime(ControllerKey.START)) {
    //   this.body.setAllowGravity(!this.body.allowGravity);
    // }

    if (this.scene.getController().isKeyPressedForFirstTime(ControllerKey.SELECT)) {
      // eslint-disable-next-line no-console
      console.clear();
    }
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

  public getMaxJumpSpeed(): number {
    return this.baseSpeed * Player.HIGH_JUMP_SPEED_MULTIPLIER;
  }

  public getRunSpeed(): number {
    return this.baseSpeed * 2;
  }

  public getStandingRunSpeed(): number {
    return TILE_SIZE * 4;
  }

  public getDashSpeed(): number {
    return this.baseSpeed * Player.DASH_SPEED_MULTIPLIER;
  }

  public getMaxRunSpeed(): number {
    return this.baseSpeed * this.getRunSpeedMultiplier();
  }

  public getRunSpeedMultiplier(): number {
    return this.hasBoostedRunAbility
      ? Player.BOOSTED_RUN_SPEED_MULTIPLIER
      : Player.RUN_SPEED_MULTIPLIER;
  }

  /**
   * Detect if the required Hitbox is overlapping at least one tile
   *
   * @param  {DirectionAxisX} direction The direction where to test
   *                                    the overlapping. If not specified,
   *                                    both direction are tested
   *
   * @return {boolean|boolean[]}        True if a least one tile per direction is overlapped
   */
  public isTouchingWalls(direction?: DirectionAxisX): boolean | boolean[] {
    let hitbox: Hitbox;

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

    return hitbox.overlapTiles();
  }

  /**
   * Calculate the y coordinate where the bullet should spaw
   *
   * @return {number} The calculated Y coordinate
   */
  private setNewPosition(x: number | Phaser.Math.Vector2 | null, y?: number): void {
    if (x instanceof Phaser.Math.Vector2) {
      this.adjustTo = x;
    } else {
      if (!this.adjustTo) {
        this.adjustTo = new Phaser.Math.Vector2(x || -1, y || -1);
      } else {
        if (x) {
          this.adjustTo.set(x, this.adjustTo.y);
        }

        if (y) {
          this.adjustTo.set(this.adjustTo.x, y);
        }
      }
    }
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
      bounds.left + (this.width - this.body.width) * (1 - this.originX),
      bounds.top + (this.height - this.body.height) * (1 - this.originY),
      this.body.width,
      this.body.height
    );
  }

  public getBodyOffset(width?: number, height?: number): Phaser.Math.Vector2 {
    if (typeof height === 'undefined') {
      if (typeof width === 'undefined') {
        // eslint-disable-next-line no-param-reassign
        width = Player.BODY_WIDTH;
        // eslint-disable-next-line no-param-reassign
        height = Player.BODY_HEIGHT;
      } else {
        // eslint-disable-next-line no-param-reassign
        height = width;
      }
    }

    return new Phaser.Math.Vector2(
      (this.width - (width as number)) * (1 - this.originX),
      (this.height - height) * (1 - this.originY)
    );
  }
}
