import * as Phaser from "phaser";
import {
  Facing,
  DirectionAxisY,
  DirectionAxisX,
} from "@/miscellaneous/Direction";
import { ControllerKey } from "@/miscellaneous/Controller";
import { PowerUps } from "@/miscellaneous/Inventory";
import { PlayerSensors } from "@/entities/player/PlayerSensors";
import { Arsenal } from "@/entities/weapons/Arsenal";
import { BulletConfig } from "@/entities/bullets/Bullet";
import {
  DASH_SPEED_MULTIPLIER,
  MovementContext,
  getJumpSpeedMultiplier,
  getRunSpeed,
  getRunSpeedMultiplier,
  HIGH_JUMP_SPEED_MULTIPLIER,
} from "@/entities/player/movement";
import { computeAim } from "@/entities/player/aim";
import { JumpAssist } from "@/entities/player/JumpAssist";
import {
  getAcceleration,
  getDeceleration,
} from "@/entities/player/horizontalMotion";
import { PlayerInput } from "@/entities/player/PlayerInput";
import { SpriteCollidable } from "@/entities/collidables/SpriteCollidable";
import { MapScene } from "@/scenes/MapScene";
import { PLAYER_DEPTH } from "@/config/depths";
import { TILE_SIZE } from "@/config/tiles";

export class Player extends SpriteCollidable {
  /**
   * Last battery level
   *
   * @type {Number}
   */
  public lastBattery: number = 0;

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
   * The buttons of the Player, read once per update
   *
   * @type {PlayerInput}
   */
  private controls: PlayerInput;

  /**
   * Coyote time and jump buffer
   *
   * @type {JumpAssist}
   */
  private jumpAssist = new JumpAssist();

  /**
   * The Phaser weapons of this scene. Which weapons the Player owns,
   * and which one is active, lives in the Inventory (the game state).
   *
   * @type {Arsenal}
   */
  private arsenal: Arsenal;

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
   * The max distance from wall where the player can yet perform a wall jump
   *
   * @type {Number}
   */
  static WALL_DETECTION_DISTANCE: number = TILE_SIZE / 4;

  /**
   * When falling fast the hand sensor can travel more than the height of the
   * area where a ledge can be grabbed in a single frame, and skip it.
   * Turn this on to look for ledges along the whole path of the sensor.
   */
  static SWEPT_LEDGE_DETECTION: boolean = false;

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
   * What the Player is touching around the body: walls, ledges, ladders
   * and moving platforms
   *
   * @type {PlayerSensors}
   */
  private sensors: PlayerSensors;

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
    super(scene, x, y, "hero_idle_center");

    this.currentRoom = currentRoom;

    this.facing = {
      y: DirectionAxisY.MIDDLE,
      x: DirectionAxisX.CENTER,
    };
    this.facingForAim = {
      y: DirectionAxisY.MIDDLE,
      x: DirectionAxisX.CENTER,
    };

    this.baseSpeed = this.scene.getWorldGravity().y / 2;

    this.scene.add.existing(this);
    this.scene.physics.world.enable(this);

    this.setDepth(PLAYER_DEPTH)
      .setOrigin(0.5, 0)
      .setCollideWorldBounds(true)
      .setBounce(0)
      .setMaxVelocity(this.getMaxRunSpeed(), this.getMaxJumpSpeed());

    this.body
      .setAllowGravity(true)
      .setAllowDrag(true)
      // The drag is a deceleration in px/s², decided every frame in walk()
      .setDamping(false)
      .setDragX(
        getDeceleration(this.getMaxRunSpeed(), {
          isOnFloor: true,
          isSwimming: false,
        })
      )
      .setOffset(
        (this.width - Player.BODY_WIDTH) * (1 - this.originX),
        (this.height - Player.BODY_HEIGHT) * (1 - this.originY)
      )
      .setSize(Player.BODY_WIDTH, Player.BODY_HEIGHT, false);

    this.arsenal = new Arsenal(this.scene);
    this.controls = new PlayerInput(this.scene.getController());

    this.body.updateCenter();

    const bounds = this.getBodyBounds();

    this.sensors = new PlayerSensors(this.scene, this.body, {
      wallDistance: Player.WALL_DETECTION_DISTANCE,
      // The wall sensors keep the height of the standing body
      wallHeight: this.body.halfHeight,
      ladderWidth: this.body.width,
      sweptLedgeDetection: Player.SWEPT_LEDGE_DETECTION,
    });

    this.torchLight = this.scene.lights
      .addLight(bounds.centerX, bounds.centerY, TILE_SIZE * 8)
      .setIntensity(this.scene.getInventory().equip(PowerUps.TORCH) ? 3 : 0)
      .setColor(0xffffdd);

    // TODO: activate after create normal maps for sprite
    // this.setPipeline('Light2D');
  }

  // Stats live in the game state (so they are saved and shown by the HUD);
  // these accessors keep the rest of the Player code unchanged.

  private get gameState() {
    return this.scene.getGameState();
  }

  public get life(): number {
    return this.gameState.get("life");
  }

  public set life(value: number) {
    this.gameState.set("life", value);
  }

  public get maxLife(): number {
    return this.gameState.get("maxLife");
  }

  public set maxLife(value: number) {
    this.gameState.set("maxLife", value);
  }

  public get ammo(): number {
    return this.gameState.get("ammo");
  }

  public set ammo(value: number) {
    this.gameState.set("ammo", value);
  }

  public get maxAmmo(): number {
    return this.gameState.get("maxAmmo");
  }

  public set maxAmmo(value: number) {
    this.gameState.set("maxAmmo", value);
  }

  public get battery(): number {
    return this.gameState.get("battery");
  }

  public set battery(value: number) {
    this.gameState.set("battery", value);
  }

  public get maxBattery(): number {
    return this.gameState.get("maxBattery");
  }

  public set maxBattery(value: number) {
    this.gameState.set("maxBattery", value);
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
    const roomNumber = this.scene.setCurrentRoom(
      bounds.centerX,
      bounds.centerY,
      this.currentRoom
    );

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

    // Read the buttons once, so the whole update sees the same state
    this.controls.poll();

    this.previousFacing = { ...this.facing };

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
      if (this.scene.getInventory().hasAtLeastOneRangeWeapon()) {
        // Handle all the ranged combat actions
        this.handleWeapons(time);
      }
    }

    // Handle the battery recharge process
    this.updateBattery();

    // Apply the position correction requested during this update
    this.adjustPosition();

    // Keep the torch attached to the body
    this.updateTorch();

    // Change the current animation based on previous operations
    this.animate();

    this.lastBattery = this.battery;

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
    let canTimeoutStarts: boolean =
      typeof this.batteryTimeoutTimer === "undefined";
    if (!canTimeoutStarts) {
      // If the timeout was init, test if is completed
      canTimeoutStarts = this.batteryTimeoutTimer.getProgress() === 1;
    }

    // Check if the timer was not init
    let canTimerStarts: boolean =
      typeof this.batteryRechargeTimer === "undefined";
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
          },
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
    const aim = computeAim(
      {
        aim: this.controls.aim,
        up: this.controls.up,
        down: this.controls.down,
        left: this.controls.left,
        right: this.controls.right,
      },
      {
        facingY: this.facing.y as DirectionAxisY,
        facingForAimY: this.facingForAim.y as DirectionAxisY,
        isAimingDiagonal: this.isAimingDiagonal,
        wasAimingDiagonal: this.wasAimingDiagonal,
      },
      this.body.velocity.y
    );

    this.facing.y = aim.facingY;
    this.facingForAim.y = aim.facingForAimY;
    this.isAimingDiagonal = aim.isAimingDiagonal;
    this.wasAimingDiagonal = aim.wasAimingDiagonal;
  }

  /**
   * Handle all the events inside liquids
   */
  protected swim(): void {
    let liquidName: string | null = null;

    this.isSwimming = this.scene.physics.overlap(
      this,
      this.scene.liquidsLayer,
      undefined,
      (hero, object: unknown) => {
        const liquid = object as Phaser.Tilemaps.Tile;
        if (liquid.index > -1) {
          liquidName = liquid.properties.liquid;
          return true;
        }

        return false;
      }
    );

    if (this.isSwimming && liquidName) {
      if (liquidName === "acid" || liquidName === "lava") {
        const config: Phaser.Types.Time.TimerEventConfig = {
          startAt: 0,
          delay: 200,
          loop: true,
          args: [liquidName],
          callback: (liquid: any) => {
            if (liquid === "acid") {
              this.battery -= 2;
              this.life -= 3;

              if (this.isTinted) {
                this.clearTint();
              } else {
                this.setTint(0x00ff00, 0xff00ff, 0x00ff00);
              }
            } else {
              this.life -= 2;

              if (this.isTinted) {
                this.clearTint();
              } else {
                this.setTint(0xffff00, 0xffff00, 0xff0000, 0xff0000);
              }
            }
          },
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

      if (this.isTinted) {
        this.clearTint();
      }
    }
  }

  /**
   * Handle all the movement along the y axis
   */
  protected jump(): void {
    // Test if the user is pressing the button 'A'
    const isJumpPress: boolean = this.controls.jump;

    const now = this.scene.time.now;
    this.jumpAssist.update(now, this.isOnFloor(), isJumpPress);

    // First check if Player has unlocked wall jump
    if (this.scene.getInventory().equip(PowerUps.GLOVE)) {
      // Test if the Player is near walls
      const walls: boolean[] = [
        this.sensors.isTouchingWall(DirectionAxisX.LEFT),
        this.sensors.isTouchingWall(DirectionAxisX.RIGHT),
      ];
      const wallsCount = walls.filter((wall) => wall);

      // Perform wall jump only if the Player
      // is not on the ground and is touching only one wall
      this.canWallJump = !this.isOnFloor() && wallsCount.length === 1;

      if (this.canWallJump) {
        // The user have to press again the jump key to perform the action
        if (!this.isPressingJump && isJumpPress) {
          let sign = 0;

          if (
            // The Player is touching a wall on left
            walls[0] &&
            // The user is moving on the opposite side of wall (right)
            this.controls.right
          ) {
            sign = 1;
          } else if (
            // The Player is touching a wall on right
            walls[1] &&
            // The user is moving on the opposite side of wall (left)
            this.controls.left
          ) {
            sign = -1;
          }

          // Test if both the actions are corrects
          if (sign !== 0) {
            // The Player is actually performing a jump
            this.isJumping = true;

            // Then push the player on the opposite side of wall and to the ceil
            this.setVelocity(
              Math.abs(this.getJumpSpeed(false)) * 2 * sign,
              this.getJumpSpeed()
            );

            this.jumpAssist.notifyJumped();
          }
        }
      }
    }

    let isClimbing = false;
    if (this.isHanging) {
      if (!this.isPressingJump) {
        const isUpPress: boolean = this.controls.up;

        isClimbing = isUpPress || isJumpPress;

        if (isClimbing) {
          this.climb(TILE_SIZE, TILE_SIZE * 2);
        }
      }
    } else if (isJumpPress) {
      // If the Player is touching the floor (or has just left it) and the key
      // has been released (or has been pressed a moment before landing)
      if (
        this.jumpAssist.canJumpFromGround(now, this.isOnFloor()) &&
        (!this.isPressingJump ||
          this.jumpAssist.hasBufferedPress(now, isJumpPress))
      ) {
        this.jumpAssist.notifyJumped();

        if (this.body.blocked.right || this.body.blocked.left) {
          const bounds: Phaser.Geom.Rectangle = this.getBodyBounds();
          let upperTile: Phaser.Tilemaps.Tile | null = null;
          let footTile: Phaser.Tilemaps.Tile | null = null;

          const isLeft = this.body.blocked.left;
          const x = isLeft
            ? bounds.centerX - TILE_SIZE
            : bounds.centerX + TILE_SIZE;

          const xTile = Math.floor(x / TILE_SIZE);

          let layers: Phaser.Tilemaps.TilemapLayer[] = this.scene.worldLayer;
          if (!Array.isArray(layers)) {
            layers = [layers];
          }

          const bottom = Math.floor((bounds.centerY - 1) / TILE_SIZE);

          for (const layer of layers) {
            if (upperTile) {
              break;
            }

            upperTile = this.scene.map.getTileAt(
              xTile,
              bottom,
              undefined,
              layer
            );
          }

          for (const layer of layers) {
            if (footTile) {
              break;
            }

            footTile = this.scene.map.getTileAt(
              xTile,
              bottom + 1,
              undefined,
              layer
            );
          }

          isClimbing = !upperTile && footTile !== null;
        }

        if (!isClimbing) {
          // The Player is actually jumping: a new jump, so no double jump
          // from a previous one is left (the key may have been held since landing)
          this.isJumping = true;
          this.canDoubleJump = false;
          this.hasDoneDoubleJump = false;

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
        this.scene.getInventory().equip(PowerUps.ROCKET) &&
        // Then check if Player had already performed the action
        !this.hasDoneDoubleJump &&
        // Finally check if Player can actually perform the action at the moment
        this.canDoubleJump
      ) {
        this.jumpAssist.notifyJumped();

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
      this.setMaxVelocity(this.getMaxRunSpeed(), this.getMaxJumpSpeed());
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
      // Test if the user is pressing the button 'Up'
      const isUpPress: boolean = this.controls.up;
      // Detect if the user is not pressing the button to jump
      if (!isJumpPress && !this.isClimbing && !isUpPress) {
        // The Player is able to perform a double jump
        this.canDoubleJump = true;

        const newVelocity = this.body.velocity.y + -(this.body.velocity.y / 2);

        // NOTE: while going up newVelocity is always negative, so the
        // Math.max makes this cut the jump dead (y speed = 0) instead of
        // damping it. Use Math.min(newVelocity, 0) for a softer cut.
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
    const isRightPress: boolean = this.controls.right;
    const isLeftPress: boolean = this.controls.left;

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
      // Do not keep pushing with the acceleration of the last frame
      this.setAccelerationX(0);

      return;
    }

    if (isRightPress && !isLeftPress) {
      this.facing.x = DirectionAxisX.RIGHT;

      this.setAccelerationX(
        getAcceleration(1, this.getRunSpeed(), this.body.velocity.x)
      );
    } else if (isLeftPress && !isRightPress) {
      this.facing.x = DirectionAxisX.LEFT;

      this.setAccelerationX(
        getAcceleration(-1, this.getRunSpeed(), this.body.velocity.x)
      );
    } else {
      this.setAccelerationX(0);

      // With no button pressed the body slows down with this drag: a short
      // slide on the floor, a longer one in the air (see horizontalMotion.ts)
      this.body.setDragX(
        getDeceleration(this.getMaxRunSpeed(), {
          isOnFloor: this.isOnFloor(),
          isSwimming: this.isSwimming,
        })
      );

      // Stop it if it is slow enough
      if (Math.abs(this.body.velocity.x) < this.baseSpeed / 20) {
        this.setVelocityX(0);
      }
    }
  }

  /**
   * Handle the dash action
   */
  protected dash(): void {
    const isDashPress: boolean = this.controls.dash;

    if (this.scene.getInventory().equip(PowerUps.DASH)) {
      const time = this.controls.getDashDuration();

      if (
        time < 100 &&
        isDashPress &&
        this.battery > 0 &&
        this.facing.x !== DirectionAxisX.CENTER
      ) {
        const isRight = this.facing.x === DirectionAxisX.RIGHT;
        const facing: number = isRight ? 1 : -1;

        this.setMaxVelocity(this.getDashSpeed(), this.getMaxJumpSpeed());

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
  }

  /**
   * Handle the hang action
   */
  protected hang(): void {
    if (this.scene.getInventory().equip(PowerUps.HOOK)) {
      if (this.body.velocity.y !== 0 || this.isHanging) {
        const isDownPress: boolean = this.controls.down;

        // If the Player is hanging from a tile, he can jump down
        if (isDownPress) {
          this.isHanging = false;
          this.body.setAllowGravity(true);
          return;
        }

        let side: DirectionAxisX.LEFT | DirectionAxisX.RIGHT | undefined;

        if (this.facing.x === DirectionAxisX.LEFT) {
          side = DirectionAxisX.LEFT;
        } else if (this.facing.x === DirectionAxisX.RIGHT) {
          side = DirectionAxisX.RIGHT;
        }

        if (typeof side !== "undefined") {
          // The tile the Player is touching with the hand, if it can be grabbed
          const ledge = this.sensors.findLedge(side);

          if (ledge) {
            this.isHanging = true;
            // Prevent the Player to slide down
            this.body.setAllowGravity(false);

            this.setGravity(0);
            this.setVelocityY(0);
            // Align the body to the current tile
            this.setNewPosition(null, ledge.pixelY);
          } else {
            this.isHanging = false;

            this.body.setAllowGravity(true);
          }
        }
      }
    }
  }

  protected climbLadders(): void {
    const isOnTopOfLadder = this.sensors.isOnLadderTop();

    this.isOnLadder = this.scene.physics.overlap(
      this,
      this.scene.stairsLayer,
      undefined,
      (hero, object: unknown) => {
        const ladder = object as Phaser.Tilemaps.Tile;

        return ladder.index > -1;
      }
    );

    const isDownPressed: boolean = this.controls.down;

    const isUpPressed: boolean = this.controls.up;

    if (this.isOnLadder || isOnTopOfLadder) {
      if (this.isOnFloor() || !this.isOnLadder) {
        if (this.isAttachOnLadder) {
          this.isAttachOnLadder = false;
        }
      }

      if (isDownPressed || (isUpPressed && this.isOnLadder)) {
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

    if (typeof y === "undefined") {
      y1 = x1;
    }

    this.canInteract = false;

    const sign: string = this.facing.x === DirectionAxisX.LEFT ? "-" : "+";
    this.scene.tweens.add({
      targets: this,
      ease: "Linear",
      duration: 150,
      repeat: 0,
      yoyo: false,
      x: `${sign}=${x1}`,
      y: `-=${y1}`,
      onComplete: () => {
        this.canInteract = true;
      },
    });
  }

  /**
   * Handle the crouch action
   */
  protected crouch(): void {
    // Test if the Player can crouch in the current state and position
    if (this.canCrouch) {
      const isDownPressed: boolean = this.controls.justPressed(
        ControllerKey.DOWN
      );

      const isUpPressed: boolean = this.controls.up;

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
        clone.add(
          new Phaser.Math.Vector2(
            previousOffset.x - offsetX,
            previousOffset.y - offsetY
          )
        );

        this.setNewPosition(clone);
      }

      this.isBodySmall = !this.isBodySmall;
    }
  }

  /**
   * Handle all the ranged combat actions
   */
  protected handleWeapons(time: any): void {
    if (this.controls.justPressed(ControllerKey.Y)) {
      this.scene.getInventory().switchToNextWeapon();
    }

    if (!this.isPressingShot) {
      this.arsenal.resetShoot();
    }

    const isShootPress: boolean = this.controls.shoot;

    // The user have to press Shot button and the player should not facing front
    if (
      isShootPress &&
      this.facingForAim.x !== DirectionAxisX.CENTER &&
      this.ammo > 0
    ) {
      const config: BulletConfig = {
        facing: this.facingForAim,
        diagonal: this.isAimingDiagonal,
        position: this.getShotPosition(),
      };

      const weapon = this.arsenal.getCurrent();
      const wasFired = weapon ? weapon.fireBullet(time, config) : false;

      if (wasFired) {
        --this.ammo;
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
    let action = "";

    if (this.isOnFloor()) {
      if (this.isCrouch) {
        action = "crouch_idle";
      } else if (this.body.velocity.x !== 0) {
        if (this.isAimingDiagonal) {
          action = `aim_${this.facing.y}_diagonal`;
        } else {
          action = "walk";
        }
      } else if (this.isAimingDiagonal) {
        action = `aim_${this.facing.y}_diagonal`;
      } else if (
        this.facing.y === DirectionAxisY.UP &&
        // Avoid going from diagonal to up while leaving aim
        !this.wasAimingDiagonal
      ) {
        action = `aim_${this.facing.y}`;
      } else {
        action = "idle";
      }
    } else if (this.isHanging) {
      action = "hang";
    } else if (!this.isStandingJumping) {
      action = "jump";
    } else if (this.isJumping) {
      action = "jump_idle";
    } else {
      action = "fall_idle";
    }

    const animation = `hero_${action}_${this.facing.x}_animation`;
    const doNewAnimation: boolean = animation !== this.anims.getName();

    if (doNewAnimation) {
      try {
        this.anims.play(animation, true);
      } catch (error) {
        console.error(error, animation);
      }
    }
  }

  protected updateTorch(): void {
    this.body.updateCenter();

    const bounds = this.getBodyBounds();

    this.torchLight.setPosition(bounds.centerX, bounds.centerY);
  }

  /**
   * Debug the player after all the update cycle
   */
  protected debug(): void {
    const controller = this.scene.getController();

    this.scene.events.emit("debugPlayer", {
      velocity: this.body.velocity,
      position: this.body.position,
    });

    if (controller.isKeyPressedForFirstTime(ControllerKey.SELECT)) {
      console.clear();
    }
  }

  public getJumpSpeed(applyMultiplier = true): number {
    return (
      -this.baseSpeed * (applyMultiplier ? this.getJumpSpeedMultiplier() : 1)
    );
  }

  /**
   * What the Player owns and is doing, as needed by the speed rules
   */
  protected getMovementContext(): MovementContext {
    const inventory = this.scene.getInventory();

    return {
      isSwimming: this.isSwimming,
      hasFan: inventory.equip(PowerUps.FAN),
      hasGlove: inventory.equip(PowerUps.GLOVE),
      hasRocket: inventory.equip(PowerUps.ROCKET),
      hasBoots: inventory.equip(PowerUps.BOOTS),
      hasBooster: inventory.equip(PowerUps.BOOSTER),
      canWallJump: this.canWallJump,
      canDoubleJump: this.canDoubleJump,
    };
  }

  protected getJumpSpeedMultiplier(): number {
    return getJumpSpeedMultiplier(this.getMovementContext());
  }

  public getMaxJumpSpeed(): number {
    return this.baseSpeed * HIGH_JUMP_SPEED_MULTIPLIER;
  }

  public getRunSpeed(): number {
    return getRunSpeed(this.baseSpeed, this.getMovementContext());
  }

  public getStandingRunSpeed(): number {
    return TILE_SIZE * 4;
  }

  public getLadderClimbSpeed(): number {
    return TILE_SIZE * 3;
  }

  public getDashSpeed(): number {
    return this.baseSpeed * DASH_SPEED_MULTIPLIER;
  }

  public getMaxRunSpeed(): number {
    return this.baseSpeed * this.getRunSpeedMultiplier();
  }

  public getRunSpeedMultiplier(): number {
    return getRunSpeedMultiplier(this.getMovementContext());
  }

  /**
   * Ask to move the body to a new position at the end of the update
   * (see adjustPosition). A coordinate left as null is not changed.
   *
   * @param {number|Phaser.Math.Vector2|null} x The new x, or a full position
   * @param {number} y The new y
   */
  private setNewPosition(
    x: number | Phaser.Math.Vector2 | null,
    y?: number
  ): void {
    if (x instanceof Phaser.Math.Vector2) {
      this.adjustTo = x;
    } else if (!this.adjustTo) {
      this.adjustTo = new Phaser.Math.Vector2(x ?? -1, y ?? -1);
    } else {
      // 0 is a valid coordinate: only null/undefined mean "leave it as is"
      if (x !== null) {
        this.adjustTo.set(x, this.adjustTo.y);
      }

      if (y !== undefined) {
        this.adjustTo.set(this.adjustTo.x, y);
      }
    }
  }

  /**
   * Calculate the y coordinate where the bullet should spawn
   *
   * @return {number} The calculated Y coordinate
   */
  public getShotPosition(): Phaser.Math.Vector2 {
    const bounds = this.getBounds();
    let width: number = bounds.centerX;
    let height: number = bounds.top + Player.SHOT_HEIGHT;

    if (this.facingForAim.y !== DirectionAxisY.MIDDLE) {
      if (this.facingForAim.y === DirectionAxisY.UP) {
        height = bounds.top;
      } else if (this.isAimingDiagonal) {
        height = bounds.bottom - Player.SHOT_HEIGHT;
      } else {
        height = bounds.bottom;
      }

      if (this.isAimingDiagonal) {
        width =
          this.x +
          (this.width / 2) *
            (this.facingForAim.x === DirectionAxisX.RIGHT ? 1 : -1);
      }
    }

    return new Phaser.Math.Vector2(width, height);
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

  public isOnFloor(): boolean {
    return this.body.onFloor() || this.sensors.isOnPlatform();
  }

  protected postCollision(
    self: Phaser.GameObjects.GameObject,
    tile: Phaser.GameObjects.GameObject
  ): void {}

  protected testCollision(
    self: Phaser.GameObjects.GameObject,
    object: unknown
  ): boolean {
    const tile: Phaser.Tilemaps.Tile = object as Phaser.Tilemaps.Tile;

    switch (tile.layer.name) {
      case "platforms":
        if (tile.index >= 0) {
          const bounds: Phaser.Geom.Rectangle = this.getBodyBounds();
          if (bounds.bottom - 1 < tile.pixelY) {
            return true;
          }
        }
        return false;
      case "stairs":
        if (tile.index >= 0) {
          const isDownPressed: boolean = this.scene
            .getController()
            .isKeyPressed(ControllerKey.DOWN);

          const bounds: Phaser.Geom.Rectangle = this.getBodyBounds();
          const adjacentTile: Phaser.Tilemaps.Tile | null =
            this.scene.map.getTileAt(tile.x, tile.y - 1, false, "stairs");

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
