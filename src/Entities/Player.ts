import * as Phaser from 'phaser';
import {
  Facing,
  DirectionAxisY,
  DirectionAxisX,
  ControllerKey,
  PowerUps,
  Weapons
} from 'Miscellaneous';
import {
  Hitbox,
  AreaPosition
} from 'Entities/Hitboxes';
import {
  Gun,
  Bow,
  Rifle,
  Weapon
} from 'Entities/Weapons';
import { BulletConfig } from 'Entities/Bullets';
import { SpriteCollidable } from 'Entities/Collidables';
import { MapScene } from 'Scenes';
import { PLAYER_DEPTH } from 'Config/depths';
import { TILE_SIZE } from 'Config/tiles';

export class Player extends SpriteCollidable {
  /**
   * The Player Phaser body
   *
   * @type {Phaser.Physics.Arcade.Body}
   */
  declare public body: Phaser.Physics.Arcade.Body;

  /**
   * Current health points
   *
   * @type {Number}
   */
  private _life: number = 99;

  /**
   * Maximum health points
   *
   * @type {Number}
   */
  private _maxLife: number = 99;

  /**
   * Current ammo
   *
   * @type {Number}
   */
  private _ammo: number = 30;

  /**
   * Maximum ammo
   *
   * @type {Number}
   */
  private _maxAmmo: number = 30;

  /**
   * Current battery level
   *
   * @type {Number}
   */
  private _battery: number = 0;

  /**
   * Last battery level
   *
   * @type {Number}
   */
  public lastBattery: number = 0;

  /**
   * Maximum battery level
   *
   * @type {Number}
   */
  private _maxBattery: number = 99;

  /**
   * The timeout after which the battery start recharging
   *
   * @type {Phaser.Time.TimerEvent}
   */
  private batteryTimeoutTimer!: Phaser.Time.TimerEvent;

  /**
   * The timer which fill up the battery
   *
   * @type {Phaser.Time.TimerEvent}
   */
  private batteryRechargeTimer!: Phaser.Time.TimerEvent;

  /**
   * The light emitted by Player
   *
   * @type {Phaser.GameObjects.Light}
   */
  private torchLight: Phaser.GameObjects.Light;

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
   * Where the Player is aiming
   *
   * @type {Facing}
   */
  private facingForAim: Facing;

  /**
   * Where the Player was watching
   *
   * @type {Facing}
   */
  private previousFacing!: Facing;

  /**
   * If the Player is aim diagonally
   *
   *
   * @type {Boolean}
   */
  private isAimingDiagonal: boolean = false;

  /**
   * If the Player was aiming diagonally
   *
   *
   * @type {Boolean}
   */
  private wasAimingDiagonal: boolean = false;

  /**
   * The Player is jumping
   *
   * @type {Boolean}
   */
  private isJumping: boolean = false;

  /**
   * The Player is jumping
   *
   * @type {Boolean}
   */
  private isStandingJumping: boolean = false;

  /**
   * The Player is falling
   *
   * @type {Boolean}
   */
  private isFalling: boolean = false;

  /**
   * The Player is climbing a tile
   *
   * @type {Boolean}
   */
  private isClimbing: boolean = false;

  /**
   * The Player was climbing a tile
   *
   * @type {Boolean}
   */
  private wasClimbing: boolean = false;

  /**
   * The Player can now perform the double jump
   *
   * @type {Boolean}
   */
  private canDoubleJump: boolean = false;

  /**
   * The Player had actually performed the double jump
   *
   * @type {Boolean}
   */
  private hasDoneDoubleJump: boolean = false;

  /**
   * The Player can now perform a wall jump
   *
   * @type {Boolean}
   */
  private canWallJump: boolean = false;

  /**
   * The Player had actually performed the wall jump
   *
   * @type {Boolean}
   */
  private hasDoneWallJump: boolean = false;

  /**
   * Check if the user had previously
   * performed a jump without releasing the key
   *
   * @type {Boolean}
   */
  private isPressingJump: boolean = false;

  /**
   * Check if the user had previously
   * performed a shoot without releasing the key
   *
   * @type {Boolean}
   */
  private isPressingShot: boolean = false;

  /**
   * Check if the user had previously
   * performed a dash without releasing the key
   *
   * @type {Boolean}
   */
  private isPressingDash: boolean = false;

  /**
   * Default multiplier of jump speed
   *
   * @type {Number}
   */
  static JUMP_SPEED_MULTIPLIER: number = 1.25;

  /**
   * Multiplier of jump speed offers by dedicated powerup
   *
   * @type {Number}
   */
  static WALL_JUMP_SPEED_MULTIPLIER: number = 1.1;

  /**
   * Multiplier of jump speed offers by dedicated powerup
   *
   * @type {Number}
   */
  static HIGH_JUMP_SPEED_MULTIPLIER: number = 1.5;

  /**
   * Default multiplier of run speed
   *
   * @type {Number}
   */
  static RUN_SPEED_MULTIPLIER: number = 0.75;

  /**
   * Multiplier of dash speed offers by dedicated powerup
   *
   * @type {Number}
   */
  static DASH_SPEED_MULTIPLIER: number = 2;

  /**
   * Multiplier of run speed offers by dedicated powerup
   *
   * @type {Number}
   */
  static BOOSTED_RUN_SPEED_MULTIPLIER: number = 1.5;

  /**
   * Multiplier of swim x speed when not active the dedicated powerup
   *
   * @type {Number}
   */
  static SWIM_X_SPEED_MULTIPLIER: number = 0.5;

  /**
   * Multiplier of swim y speed when not active the dedicated powerup
   *
   * @type {Number}
   */
  static SWIM_Y_SPEED_MULTIPLIER: number = 1;

  /**
   * The max distance from wall where the player can yet perform a wall jump
   *
   * @type {Number}
   */
  static WALL_DETECTION_DISTANCE: number = TILE_SIZE / 4;

  /**
   * The Y position to subtract from current Y to spawn bullets
   *
   * @type {Number}
   */
  static SHOT_HEIGHT: number = TILE_SIZE + 2;

  /**
   * The standard body width
   *
   * @type {Number}
   */
  static BODY_WIDTH: number = TILE_SIZE;

  /**
   * The standard body height
   *
   * @type {Number}
   */
  static BODY_HEIGHT: number = TILE_SIZE * 2;

  /**
   * The body width when it's crouch or jumping
   *
   * @type {Number}
   */
  static BODY_SMALL_WIDTH: number = TILE_SIZE;

  /**
   * The body height when it's crouch or jumping
   *
   * @type {Number}
   */
  static BODY_SMALL_HEIGHT: number = (Player.BODY_HEIGHT / 4) * 3;

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
   * The hitbox dedicated to detect if there's a ladder under Player feet
   *
   * @type {Hitbox}
   */
  private ladderHitbox: Hitbox;

  /**
   * The current room number
   *
   * @type {number}
   */
  public currentRoom: number = 0;

  /**
   * The previous room number
   *
   * @type {number | null}
   */
  public previousRoom: number | null = null;

  /**
   * Check if the user can interact with Player
   *
   * @type {boolean}
   */
  public canInteract: boolean = true;

  /**
   * Determinate if Player is crouch
   *
   * @type {boolean}
   */
  public isCrouch: boolean = false;

  /**
   * Determinate if Player can crouch
   *
   * @type {boolean}
   */
  public canCrouch: boolean = true;

  /**
   * Determinate if Player has smaller collision box
   *
   * @type {boolean}
   */
  public isBodySmall: boolean = false;

  /**
   * Determinate if Player is hanging on a tile
   *
   * @type {boolean}
   */
  public isHanging: boolean = false;

  /**
   * Determinate if Player is swimming in a liquid
   *
   * @type {boolean}
   */
  public isSwimming: boolean = false;

  /**
   * Determinate if Player is near a ladder
   *
   * @type {boolean}
   */
  public isOnLadder: boolean = false;

  /**
   * Determinate if Player is grabbing a ladder
   *
   * @type {boolean}
   */
  public isAttachOnLadder: boolean = false;

  /**
   * The timer which apply damage from liquids
   *
   * @type {Phaser.Time.TimerEvent}
   */
  private liquidDamageTimer!: Phaser.Time.TimerEvent;

  /**
   * Create the Player
   *
   * @param {MapScene} scene - scene creating the player.
   * @param {number} x - Start location x value.
   * @param {number} y - Start location y value.
   */
  public constructor(
    public scene: MapScene,
    x: number,
    y: number,
    currentRoom = 0
  ) {
    super(scene, x, y, 'hero_idle_center');

    this.currentRoom = currentRoom;

    this.facing = {
      y: DirectionAxisY.MIDDLE,
      x: DirectionAxisX.CENTER
    };
    this.facingForAim = {
      y: DirectionAxisY.MIDDLE,
      x: DirectionAxisX.CENTER
    };

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

    this.ladderHitbox = new Hitbox(
      this.scene,
      bounds.centerX,
      bounds.bottom,
      this.body.width,
      2
    );

    this.torchLight = this.scene.lights
      .addLight(bounds.centerX, bounds.centerY, TILE_SIZE * 8)
      .setIntensity(this.scene.getInventory().has(PowerUps.TORCH) ? 3 : 0)
      .setColor(0xffffdd);

    // TODO: activate after create normal maps for sprite
    // this.setPipeline('Light2D');

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
    let newValue: number = value;
    if (newValue < 0) {
      newValue = 0;
    }

    this._life = newValue;
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
    let newValue: number = value;
    if (newValue < 0) {
      newValue = 0;
    }

    this._battery = newValue;
    this.scene.registry.set('battery', this._battery);
  }

  public get maxBattery(): number {
    return this._maxBattery;
  }

  public set maxBattery(value: number) {
    this._maxBattery = value;
    this.scene.registry.set('maxBattery', this._maxBattery);
  }

  public static preload(scene: Phaser.Scene): void {
    const spriteSize: Phaser.Types.Loader.FileTypes.ImageFrameConfig = {
      frameWidth: TILE_SIZE * 2,
      frameHeight: TILE_SIZE * 3
    };

    // TODO: assemble everything into a Sprite Atlas
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

    const bounds = this.getBodyBounds();
    const roomNumber = this.scene.setCurrentRoom(bounds.centerX, bounds.centerY);

    // Update player room variables
    if (roomNumber !== null && roomNumber !== this.currentRoom) {
      this.previousRoom = this.currentRoom;
      this.currentRoom = roomNumber;
      this.scene.isChangingRoom = true;
    } else {
      this.scene.isChangingRoom = false;
    }
  }

  /**
   * @param {any} time
   * @param {number} delta
   */
  public update(time: any, delta: number): void {
    super.update();

    this.previousFacing = { ...this.facing };

    this.lastBattery = this.battery;

    if (this.canInteract) {
      // Handle current aim direction based on facing
      this.tiltAim();

      // Handle logic when the player is in a liquid
      this.swim();

      // Prevent jump when is facing forward
      if (this.facing.x !== DirectionAxisX.CENTER) {
        // Handle all the movement along the y axis
        this.jump();
      }

      // Handle all the movement along the x axis
      this.walk();

      // Handle the dash action
      this.dash();

      // Handle the hang action
      this.hang();

      // Handle the ladders climb action
      this.climbLadders();

      // Handle the player body resizing
      this.resizeBody();

      // Prevent crouch when is facing forward
      if (this.facing.x !== DirectionAxisX.CENTER) {
        // Handle the crouch action
        this.crouch();
      }

      // The user can shoot only if the Player has at least one range weapon
      if (this.hasAtLeastOneRangeWeapon()) {
        // Handle all the ranged combat actions
        this.shoot(time);
      }
    }

    // Handle the battery recharge process
    this.updateBattery();

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
   * Handle the battery recharge process
   */
  protected updateBattery(): void {
    // The Player should have at least the battery powerup
    if (!this.scene.getInventory().hasBattery()) {
      return;
    }

    // If the battery is already at full capacity, skip reload
    if (this.battery >= this.maxBattery) {
      return;
    }

    // Check if the timeout was not init
    let canTimeoutStarts: boolean = typeof this.batteryTimeoutTimer === 'undefined';
    if (!canTimeoutStarts) {
      // If the timeout was init, test if is completed
      canTimeoutStarts = this.batteryTimeoutTimer.getProgress() === 1;
    }

    // Check if the timer was not init
    let canTimerStarts: boolean = typeof this.batteryRechargeTimer === 'undefined';
    if (!canTimerStarts) {
      // If the timer was init, test if is completed
      canTimerStarts = this.batteryRechargeTimer.getProgress() === 1;
    }

    // If the Player use the battery, restart the timeout
    const restartTimer: boolean = this.battery < this.lastBattery;

    if (restartTimer) {
      // Restart timeout if init
      if (this.batteryTimeoutTimer) {
        this.batteryTimeoutTimer.destroy();
        this.batteryTimeoutTimer.remove();
      }

      // Restart timer if init
      if (this.batteryRechargeTimer) {
        this.batteryRechargeTimer.destroy();
        this.batteryRechargeTimer.remove();
      }
    }

    if ((canTimeoutStarts && canTimerStarts) || restartTimer) {
      this.batteryTimeoutTimer = this.scene.time.delayedCall(5000, () => {
        const config: Phaser.Types.Time.TimerEventConfig = {
          delay: 100,
          loop: true,
          callback: () => {
            ++this.battery;

            // Stop recharging if reached the max level
            if (this.battery === this.maxBattery) {
              this.batteryRechargeTimer.destroy();
              this.batteryRechargeTimer.remove();
            }
          }
        };

        // Start the timer only after a certain amount of time
        this.batteryRechargeTimer = this.scene.time.addEvent(config);
      });
    }
  }

  /**
   * Handle current aim direction based on facing
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

    this.wasAimingDiagonal = this.isAimingDiagonal;

    if (isUpPressed || (isAimPress && !this.isAimingDiagonal)) {
      this.facing.y = DirectionAxisY.UP;
      this.facingForAim.y = DirectionAxisY.UP;
    } else if (isDownPressed
      && (this.body.velocity.y !== 0 || isAimPress || isAimingWhileMoving)
    ) {
      this.facing.y = DirectionAxisY.DOWN;
      this.facingForAim.y = DirectionAxisY.DOWN;
    } else if (!this.isAimingDiagonal) {
      this.facing.y = DirectionAxisY.MIDDLE;
      this.facingForAim.y = DirectionAxisY.MIDDLE;
    }

    this.isAimingDiagonal = isAimPress || isAimingWhileMoving;
  }

  /**
   * Handle all the events inside liquids
   */
  protected swim(): void {
    let liquidName: string | null = null;

    this.isSwimming = this.scene.physics
      .overlap(this, this.scene.liquidsLayer, undefined, (hero, object: unknown) => {
        const liquid = object as Phaser.Tilemaps.Tile;
        if (liquid.index > -1) {
          liquidName = liquid.properties.liquid;
          return true;
        }

        return false;
      });

    if (this.isSwimming && liquidName) {
      if (liquidName === 'acid' || liquidName === 'lava') {
        const config: Phaser.Types.Time.TimerEventConfig = {
          startAt: 0,
          delay: 200,
          loop: true,
          args: [
            liquidName
          ],
          callback: (liquid: any) => {
            if (liquid === 'acid') {
              --this.battery;
            }

            --this.life;
          }
        };

        if (!this.liquidDamageTimer) {
          this.liquidDamageTimer = this.scene.time.addEvent(config);
        } else if (this.liquidDamageTimer.paused) {
          this.liquidDamageTimer.reset(config);
          this.liquidDamageTimer.paused = false;
        }
      }
    } else if (this.liquidDamageTimer) {
      this.liquidDamageTimer.paused = true;
    }
  }

  /**
   * Handle all the movement along the y axis
   */
  protected jump(): void {
    // Test if the user is pressing the button 'A'
    const isJumpPress: boolean = this.scene
      .getController()
      .isKeyPressed(ControllerKey.A);

    // First check if Player has unlocked wall jump
    if (this.scene.getInventory().has(PowerUps.GLOVE)) {
      // Test if the Player is near walls
      const walls: boolean[] = this.isTouchingWalls() as boolean[];
      const wallsCount = walls.filter((wall) => wall);

      // Perform wall jump only if the Player
      // is not on the ground and is touching only one wall
      this.canWallJump = (!this.isOnFloor() && wallsCount.length === 1);
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

    let isClimbing = false;
    if (this.isHanging) {
      if (!this.isPressingJump) {
        const isUpPress: boolean = this.scene
          .getController()
          .isKeyPressed(ControllerKey.UP);

        isClimbing = (isUpPress || isJumpPress);

        if (isClimbing) {
          this.climb(TILE_SIZE, TILE_SIZE * 2);
        }
      }
    } else if (isJumpPress) {
      // If the Player is touching the floor and the key has been release
      if (this.isOnFloor() && !this.isPressingJump) {
        if (this.body.blocked.right || this.body.blocked.left) {
          const bounds: Phaser.Geom.Rectangle = this.getBodyBounds();
          let hasFreeUpperTile!: Phaser.Tilemaps.Tile;
          let hasTileOnFoot!: Phaser.Tilemaps.Tile;

          const isLeft = this.body.blocked.left;
          const x = isLeft
            ? bounds.centerX - TILE_SIZE
            : bounds.centerX + TILE_SIZE;

          const xTile = Math.floor(x / TILE_SIZE);

          let layers: Phaser.Tilemaps.DynamicTilemapLayer[] = this.scene.worldLayer;
          if (!Array.isArray(layers)) {
            layers = [layers];
          }

          const bottom = Math.floor((bounds.centerY - 1) / TILE_SIZE);

          for (const layer of layers) {
            if (hasFreeUpperTile) {
              break;
            }

            hasFreeUpperTile = this.scene.map.getTileAt(
              xTile,
              bottom,
              undefined,
              layer
            );
          }

          for (const layer of layers) {
            if (hasTileOnFoot) {
              break;
            }

            hasTileOnFoot = this.scene.map.getTileAt(
              xTile,
              bottom + 1,
              undefined,
              layer
            );
          }

          isClimbing = (!hasFreeUpperTile && hasTileOnFoot);
        }

        if (!isClimbing) {
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
        } else {
          this.climb(TILE_SIZE, TILE_SIZE);
        }
      } else if (
        // First check if Player has unlocked double jump
        this.scene.getInventory().has(PowerUps.ROCKET)
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
    } else if (this.isOnFloor()) {
      // Reset everything if the player is touching the ground
      this.isFalling = false;
      this.isJumping = false;

      this.canDoubleJump = false;
      this.hasDoneDoubleJump = false;
    }

    if (this.body.velocity.y === 0 && this.isOnFloor()) {
      this.isStandingJumping = false;
    }

    if (!this.isStandingJumping) {
      this.setMaxVelocity(
        this.getMaxRunSpeed(),
        this.getMaxJumpSpeed()
      );
    }

    this.isClimbing = isClimbing;

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
      // Test if the user is pressing the button 'A'
      const isUpPress: boolean = this.scene
        .getController()
        .isKeyPressed(ControllerKey.UP);
      // Detect if the user is not pressing the button to jump
      if (!isJumpPress && !this.isClimbing && !isUpPress) {
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
   * Handle all the movement along the x axis
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
      this.facingForAim.x = DirectionAxisX.RIGHT;
    } else if (isLeftPress && !isRightPress) {
      this.facingForAim.x = DirectionAxisX.LEFT;
    }

    if (this.isHanging) {
      return;
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
   * Handle the dash action
   */
  protected dash(): void {
    const isDashPress: boolean = this.scene
      .getController()
      .isKeyPressed(ControllerKey.X);

    if (this.scene.getInventory().has(PowerUps.DASH)) {
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
   * Handle the hang action
   */
  protected hang(): void {
    if (this.scene.getInventory().has(PowerUps.HOOK)) {
      if (this.body.velocity.y !== 0 || this.isHanging) {
        const isDownPress: boolean = this.scene
          .getController()
          .isKeyPressed(ControllerKey.DOWN);

        // If the Player is hanging from a tile, he can jump down
        if (isDownPress) {
          this.isHanging = false;
          this.body.setAllowGravity(true);
          return;
        }

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

            let tiles: Phaser.Tilemaps.Tile[] = [];

            let layers: Phaser.Tilemaps.DynamicTilemapLayer[] = this.scene.worldLayer;
            if (!Array.isArray(layers)) {
              layers = [layers];
            }

            let lastLayer!: Phaser.Tilemaps.DynamicTilemapLayer;
            for (const layer of layers) {
              if (tiles.length > 0) {
                break;
              }

              tiles = this.scene.map
                .getTilesWithinShape(
                  hitbox.getBounds(),
                  {
                    isNotEmpty: true
                  },
                  undefined,
                  layer
                );

              lastLayer = layer;
            }

            if (tiles.length === 1) {
              [currentTile] = tiles;
              // Check if there is a tile upper the current one
              const upperTile = this.scene.map
                .getTileAt(currentTile.x, currentTile.y - 1, undefined, lastLayer);
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

  protected climbLadders(): void {
    const isOnTopOfLadder = this.ladderHitbox.overlapTilesArea(
      AreaPosition.TOP_HALF,
      this.scene.stairsLayer,
      false
    );

    this.isOnLadder = this.scene.physics
      .overlap(
        this,
        this.scene.stairsLayer,
        undefined,
        (hero, object: unknown) => {
          const ladder = object as Phaser.Tilemaps.Tile;

          return ladder.index > -1;
        }
      );

    const isDownPressed: boolean = this.scene
      .getController()
      .isKeyPressed(ControllerKey.DOWN);

    const isUpPressed: boolean = this.scene
      .getController()
      .isKeyPressed(ControllerKey.UP);

    if (this.isOnLadder || isOnTopOfLadder) {
      if (this.isOnFloor() || !this.isOnLadder) {
        if (this.isAttachOnLadder) {
          this.isAttachOnLadder = false;
        }
      }

      if (isDownPressed
        || (isUpPressed
          && this.isOnLadder)
      ) {
        const speed = isDownPressed ? 1 : -1;
        this.setVelocityY(this.getLadderClimbSpeed() * speed);

        this.isAttachOnLadder = true;
      }
    } else {
      this.isAttachOnLadder = false;
    }

    if (this.isAttachOnLadder) {
      this.setGravity(0);
      this.body.setAllowGravity(false);

      if (!isUpPressed && !isDownPressed) {
        this.setVelocityY(0);
      }
    } else {
      this.body.setAllowGravity(true);
    }
  }

  protected climb(x: number, y?: number): void {
    const x1: number = x;
    let y1: number | undefined = y;

    if (typeof y === 'undefined') {
      y1 = x1;
    }

    this.canInteract = false;

    const sign: string = this.facing.x === DirectionAxisX.LEFT ? '-' : '+';
    this.scene.tweens.add({
      targets: this,
      ease: 'Linear',
      duration: 150,
      repeat: 0,
      yoyo: false,
      x: `${sign}=${x1}`,
      y: `-=${y1}`,
      onComplete: () => {
        this.canInteract = true;
      }
    });
  }

  /**
   * Handle the crouch action
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
        if (!this.isAimingDiagonal || this.previousFacing.y === this.facing.y) {
          this.isCrouch = true;
        }
      } else if (isUpPressed && this.isCrouch) {
        this.isCrouch = false;
      }
    }

    this.canCrouch = true;
  }

  /**
   * Handle all the Player body resizing based on current state
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
    } else if (this.isBodySmall) {
      // Reset the body to his original shape
      offsetX = (this.width - Player.BODY_WIDTH) * (1 - this.originX);
      offsetY = (this.height - Player.BODY_HEIGHT) * (1 - this.originY);

      updateBody = true;
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
   * Handle all the ranged combat actions
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
    if (isShootPress && this.facingForAim.x !== DirectionAxisX.CENTER) {
      // Test which weapon the player has and if is single or with rate
      const bulletPosition = new Phaser.Math.Vector2(
        this.x + (this.width / 2) * (this.facingForAim.x === DirectionAxisX.RIGHT ? 1 : -1),
        this.getShotHeight()
      );

      const config: BulletConfig = {
        facing: this.facingForAim,
        diagonal: this.isAimingDiagonal,
        position: bulletPosition
      };

      let equippedWeapon: string | null = null;
      if (this.scene.getInventory().carry(Weapons.GUN)) {
        equippedWeapon = 'gun';
      } else if (this.scene.getInventory().carry(Weapons.RIFLE)) {
        equippedWeapon = 'rifle';
      } else if (this.scene.getInventory().carry(Weapons.BOW)) {
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

    if (this.isOnFloor()) {
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
        && !this.wasAimingDiagonal
      ) {
        action = `aim_${this.facing.y}`;
      } else {
        action = 'idle';
      }
    } else if (this.isHanging) {
      action = 'hang';
    } else if (!this.isStandingJumping) {
      action = 'jump';
    } else if (this.isJumping) {
      action = 'jump_idle';
    } else {
      action = 'fall_idle';
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

    this.ladderHitbox.alignToParent(
      this,
      bounds.centerX,
      bounds.bottom
    );

    this.torchLight.setPosition(bounds.centerX, bounds.centerY);
  }

  /**
   * Debug the player after all the update cycle
   */
  protected debug(): void {
    const controller = this.scene.getController();

    this.scene.events.emit('debugPlayer', {
      velocity: this.body.velocity,
      position: this.body.position
    });

    if (controller.isKeyPressedForFirstTime(ControllerKey.SELECT)) {
      // eslint-disable-next-line no-console
      console.clear();
    }
  }

  public getJumpSpeed(applyMultiplier = true): number {
    return -this.baseSpeed
    * (applyMultiplier ? this.getJumpSpeedMultiplier() : 1);
  }

  protected getJumpSpeedMultiplier(): number {
    if (this.isSwimming && !this.scene.getInventory().has(PowerUps.FAN)) {
      return Player.SWIM_Y_SPEED_MULTIPLIER;
    }

    if (this.scene.getInventory().has(PowerUps.GLOVE) && this.canWallJump) {
      return Player.WALL_JUMP_SPEED_MULTIPLIER;
    }

    if (this.scene.getInventory().has(PowerUps.ROCKET) && this.canDoubleJump) {
      return Player.JUMP_SPEED_MULTIPLIER;
    }

    if (this.scene.getInventory().has(PowerUps.BOOTS)) {
      return Player.HIGH_JUMP_SPEED_MULTIPLIER;
    }

    return Player.JUMP_SPEED_MULTIPLIER;
  }

  public getMaxJumpSpeed(): number {
    return this.baseSpeed * Player.HIGH_JUMP_SPEED_MULTIPLIER;
  }

  public getRunSpeed(): number {
    return (this.isSwimming && !this.scene.getInventory().has(PowerUps.FAN))
      ? this.baseSpeed * Player.SWIM_X_SPEED_MULTIPLIER
      : this.baseSpeed * 2;
  }

  public getStandingRunSpeed(): number {
    return TILE_SIZE * 4;
  }

  public getLadderClimbSpeed(): number {
    return TILE_SIZE * 3;
  }

  public getDashSpeed(): number {
    return this.baseSpeed * Player.DASH_SPEED_MULTIPLIER;
  }

  public getMaxRunSpeed(): number {
    return this.baseSpeed * this.getRunSpeedMultiplier();
  }

  public getRunSpeedMultiplier(): number {
    if (this.isSwimming && !this.scene.getInventory().has(PowerUps.FAN)) {
      return Player.SWIM_X_SPEED_MULTIPLIER;
    }

    if (this.scene.getInventory().has(PowerUps.BOOSTER)) {
      return Player.BOOSTED_RUN_SPEED_MULTIPLIER;
    }

    return Player.RUN_SPEED_MULTIPLIER;
  }

  /**
   * Detect if the required Hitbox is overlapping at least one tile
   *
   * @param  {DirectionAxisX} direction The direction where to test
   * the overlapping. If not specified, both direction are tested
   *
   * @return {boolean|boolean[]} True if a least one tile
   * per direction is overlapped
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
   * Calculate the y coordinate where the bullet should spawn
   *
   * @return {number} The calculated Y coordinate
   */
  private setNewPosition(
    x: number | Phaser.Math.Vector2 | null,
    y?: number
  ): void {
    if (x instanceof Phaser.Math.Vector2) {
      this.adjustTo = x;
    } else if (!this.adjustTo) {
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

  /**
   * Calculate the y coordinate where the bullet should spawn
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
    return this.scene.getInventory().carry(Weapons.GUN)
    || this.scene.getInventory().carry(Weapons.RIFLE)
    || this.scene.getInventory().carry(Weapons.BOW);

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

  public isOnFloor(): boolean {
    return this.body.onFloor()
      || this.scene.physics.collide(this.ladderHitbox, this.scene.platforms);
  }

  protected testCollision(
    self: Phaser.GameObjects.GameObject,
    object: unknown
  ): boolean {
    const tile: Phaser.Tilemaps.Tile = object as Phaser.Tilemaps.Tile;

    switch (tile.layer.name) {
      case 'platforms':
        if (tile.index >= 0) {
          const bounds: Phaser.Geom.Rectangle = this.getBodyBounds();
          if (bounds.bottom - 1 < tile.pixelY) {
            return true;
          }
        }
        return false;
      case 'stairs':
        if (tile.index >= 0) {
          const isDownPressed: boolean = this.scene
            .getController()
            .isKeyPressed(ControllerKey.DOWN);

          const bounds: Phaser.Geom.Rectangle = this.getBodyBounds();
          const adjacentTile: Phaser.Tilemaps.Tile | null = this.scene.map
            .getTileAt(tile.x, tile.y - 1, false, 'stairs');

          if (bounds.bottom - 1 < tile.pixelY && !adjacentTile) {
            return !isDownPressed;
          }
        }
        return false;

      default:
        break;
    }

    return tile.index >= 0;
  }
}
