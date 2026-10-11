import * as Phaser from "phaser";
import {
  Facing,
  DirectionAxisY,
  DirectionAxisX,
} from "@/miscellaneous/Direction";
import { ControllerKey } from "@/miscellaneous/Controller";
import { PowerUps } from "@/miscellaneous/Inventory";
import { collidesWithTile } from "@/world/oneWayTiles";
import { BatteryRecharger } from "@/entities/player/BatteryRecharger";
import {
  LiquidDetection,
  PlayerLiquids,
} from "@/entities/player/PlayerLiquids";
import { PlayerWeapons } from "@/entities/player/PlayerWeapons";
import { PlayerBody } from "@/entities/player/PlayerBody";
import { PlayerSensors } from "@/entities/player/PlayerSensors";
import { Arsenal } from "@/entities/weapons/Arsenal";
import { BulletConfig } from "@/entities/bullets/Bullet";
import { MovementContext } from "@/entities/player/movement";
import { PlayerSpeeds } from "@/entities/player/PlayerSpeeds";
import { PlayerAim } from "@/entities/player/PlayerAim";
import { MovementHost } from "@/entities/player/movement/host";
import { createMovementHost } from "@/entities/player/movement/createMovementHost";
import { PlayerMovement } from "@/entities/player/movement/PlayerMovement";
import { MovementState } from "@/entities/player/movement/state";
import {
  getAnimationAction,
  getAnimationKey,
} from "@/entities/player/animation";
import { getDeceleration } from "@/entities/player/horizontalMotion";
import { PlayerInput } from "@/entities/player/PlayerInput";
import { SpriteCollidable } from "@/entities/collidables/SpriteCollidable";
import { MapScene } from "@/scenes/MapScene";
import { PlayerStats } from "@/state/GameState";
import { PLAYER_DEPTH } from "@/config/depths";
import { TILE_SIZE } from "@/config/tiles";

export class Player extends SpriteCollidable {
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
   * What the Player is doing with its body (standing, crouching, in the air,
   * hanging, on a ladder, climbing a ledge), and how it moves
   *
   * @type {PlayerMovement}
   */
  private movement = new PlayerMovement();

  /**
   * What the movement needs from the Player
   *
   * @type {MovementHost}
   */
  private movementHost: MovementHost;

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
   * The default movement speed based on game gravity
   *
   * @type {Number}
   */
  private baseSpeed: number;

  /**
   * How fast the Player goes
   *
   * @type {PlayerSpeeds}
   */
  private speeds: PlayerSpeeds;

  /**
   * Fills the battery up again when it is not used
   *
   * @type {BatteryRecharger}
   */
  private recharger: BatteryRecharger;

  /**
   * The Player in a liquid: swimming and the damage of acid and lava
   *
   * @type {PlayerLiquids}
   */
  private liquids: PlayerLiquids;

  /**
   * The weapons: change them, shoot, spend ammo
   *
   * @type {PlayerWeapons}
   */
  private weapons: PlayerWeapons;

  /**
   * The shape of the body and the corrections of its position
   *
   * @type {PlayerBody}
   */
  private shape: PlayerBody;

  /**
   * Where the Player looks and aims
   *
   * @type {PlayerAim}
   */
  private aim = new PlayerAim();

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
   */
  public get isCrouch(): boolean {
    return this.movement.isCrouch;
  }

  /**
   * Determinate if Player is hanging on a tile
   */
  public get isHanging(): boolean {
    return this.movement.isHanging;
  }

  /**
   * Determinate if Player is near a ladder
   */
  public get isOnLadder(): boolean {
    return this.movement.isOnLadder;
  }

  /**
   * Determinate if Player is grabbing a ladder
   */
  public get isAttachOnLadder(): boolean {
    return this.movement.isAttachOnLadder;
  }

  /**
   * What the Player is doing with its body
   */
  public get movementState(): MovementState {
    return this.movement.state;
  }

  /**
   * Determinate if Player has smaller collision box
   */
  public get isBodySmall(): boolean {
    return this.shape.isSmall;
  }

  /**
   * The bounds of the body, whatever the origin of the sprite
   *
   * @return {Phaser.Geom.Rectangle} The bounds of the body
   */
  public getBodyBounds(): Phaser.Geom.Rectangle {
    return this.shape.getBounds();
  }

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

    this.baseSpeed = this.scene.getWorldGravity().y / 2;
    this.speeds = new PlayerSpeeds(this.baseSpeed, () =>
      this.getMovementContext()
    );

    this.scene.add.existing(this);
    this.scene.physics.world.enable(this);

    this.setDepth(PLAYER_DEPTH)
      .setOrigin(0.5, 0)
      .setCollideWorldBounds(true)
      .setBounce(0)
      .setMaxVelocity(
        this.speeds.getMaxRunSpeed(),
        this.speeds.getMaxJumpSpeed()
      );

    this.body
      .setAllowGravity(true)
      .setAllowDrag(true)
      // The drag is a deceleration in px/s², decided every frame in walk()
      .setDamping(false)
      .setDragX(
        getDeceleration(this.speeds.getMaxRunSpeed(), {
          isOnFloor: true,
          isSwimming: false,
        })
      );

    this.shape = new PlayerBody(this);
    this.shape.init();

    this.controls = new PlayerInput(this.scene.getController());
    this.weapons = new PlayerWeapons(
      this.scene.getInventory(),
      new Arsenal(this.scene),
      this,
      this.controls,
      this.aim,
      this.stats
    );

    this.body.updateCenter();

    const bounds = this.getBodyBounds();

    this.recharger = new BatteryRecharger(
      this.scene.time,
      () => this.scene.getInventory().hasBattery(),
      this.stats
    );
    this.liquids = new PlayerLiquids(
      () => this.detectLiquid(),
      (config) => this.scene.time.addEvent(config),
      this.stats,
      this
    );

    // Keep the Player on the slopes of the map
    this.scene.slopes.track(this.body);
    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      this.scene.slopes.untrack(this.body);
    });

    this.sensors = new PlayerSensors(this.scene, this.body, {
      wallDistance: Player.WALL_DETECTION_DISTANCE,
      // The wall sensors keep the height of the standing body
      wallHeight: this.body.halfHeight,
      ladderWidth: this.body.width,
      sweptLedgeDetection: Player.SWEPT_LEDGE_DETECTION,
    });

    this.movementHost = createMovementHost({
      sprite: this,
      controls: this.controls,
      aim: this.aim,
      stats: this.stats,
      speeds: this.speeds,
      sensors: this.sensors,
      shape: this.shape,
      baseSpeed: this.baseSpeed,
      now: () => this.scene.time.now,
      equip: (item) => this.scene.getInventory().equip(item),
      isSwimming: () => this.isSwimming,
      isOnFloor: () => this.isOnFloor(),
      overlapsLadder: () => this.overlapsLadder(),
      hasLedgeToClimb: (towardsLeft) => this.hasLedgeToClimb(towardsLeft),
      climb: (x, y) => this.climb(x, y),
    });

    this.torchLight = this.scene.lights
      .addLight(bounds.centerX, bounds.centerY, TILE_SIZE * 8)
      .setIntensity(this.scene.getInventory().equip(PowerUps.TORCH) ? 3 : 0)
      .setColor(0xffffdd);

    // TODO: activate after create normal maps for sprite
    // this.setPipeline('Light2D');
  }

  /**
   * Determinate if Player is in a liquid
   */
  public get isSwimming(): boolean {
    // Asked by the speeds while the constructor is still running
    return this.liquids?.isSwimming ?? false;
  }

  /**
   * The stats of the Player (life, ammo, battery...): they live in the game
   * state, so they are saved and shown by the HUD
   */
  public get stats(): PlayerStats {
    return this.scene.getGameState().player;
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

    this.aim.remember();

    if (this.canInteract) {
      // Handle current aim direction based on facing
      this.aim.update(
        {
          aim: this.controls.aim,
          up: this.controls.up,
          down: this.controls.down,
          left: this.controls.left,
          right: this.controls.right,
        },
        this.body.velocity.y
      );

      // Handle logic when the player is in a liquid
      this.liquids.update();

      // Handle jump, walk, dash, hang and the ladders climb
      this.movement.updateMotion(this.movementHost);

      // Handle the player body resizing
      this.shape.resize(!this.movement.isHanging && this.movement.isCrouch);

      // Handle the crouch action and settle the state of the movement
      this.movement.updateCrouch(this.movementHost);

      // The user can shoot only if the Player has at least one range weapon
      if (this.scene.getInventory().hasAtLeastOneRangeWeapon()) {
        // Handle all the ranged combat actions
        this.weapons.update(time);
      }
    }

    // Handle the battery recharge process
    this.recharger.update();

    // Apply the position correction requested during this update
    this.shape.applyRequestedPosition();

    // Keep the torch attached to the body
    this.updateTorch();

    // Change the current animation based on previous operations
    this.animate();

    this.recharger.remember();

    // Debug the player after all the update cycle
    if (this.scene.physics.world.drawDebug) {
      this.debug();
    }
  }

  protected climb(x: number, y?: number): void {
    const x1: number = x;
    let y1: number | undefined = y;

    if (typeof y === "undefined") {
      y1 = x1;
    }

    this.canInteract = false;

    const sign: string = this.aim.facing.x === DirectionAxisX.LEFT ? "-" : "+";
    this.scene.tweens.add({
      targets: this,
      ease: "Linear",
      duration: 150,
      repeat: 0,
      yoyo: false,
      x: `${sign}=${x1}`,
      y: `-=${y1}`,
      onComplete: () => {
        this.movement.finishClimb();
        this.canInteract = true;
      },
    });
  }

  /**
   * Change the current animation based on previous operations
   */
  protected animate(): void {
    const action = getAnimationAction({
      isOnFloor: this.isOnFloor(),
      isCrouch: this.movement.isCrouch,
      isHanging: this.movement.isHanging,
      isJumping: this.movement.isJumping,
      isStandingJumping: this.movement.isStandingJumping,
      isAimingDiagonal: this.aim.isAimingDiagonal,
      wasAimingDiagonal: this.aim.wasAimingDiagonal,
      velocityX: this.body.velocity.x,
      facingY: this.aim.facing.y,
    });

    const animation = getAnimationKey(action, this.aim.facing.x);
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
      canWallJump: this.movement.canWallJump,
      canDoubleJump: this.movement.canDoubleJump,
    };
  }

  /**
   * The body overlaps a tile of a ladder
   */
  private overlapsLadder(): boolean {
    return this.scene.physics.overlap(
      this,
      this.scene.stairsLayer,
      undefined,
      (hero, object: unknown) => (object as Phaser.Tilemaps.Tile).index > -1
    );
  }

  /**
   * Is the Player in a liquid, and which one
   */
  private detectLiquid(): LiquidDetection {
    let liquid = null as string | null;

    const swimming = this.scene.physics.overlap(
      this,
      this.scene.liquidsLayer,
      undefined,
      (hero, object: unknown) => {
        const tile = object as Phaser.Tilemaps.Tile;

        if (tile.index > -1) {
          liquid = tile.properties.liquid;

          return true;
        }

        return false;
      }
    );

    return { swimming, liquid };
  }

  /**
   * Running against a wall: is there a ledge above to climb onto? (a tile on
   * the level of the feet in the next column, and none above it)
   *
   * @param {boolean} isLeft The wall is on the left
   */
  private hasLedgeToClimb(isLeft: boolean): boolean {
    const bounds: Phaser.Geom.Rectangle = this.getBodyBounds();

    const x = isLeft ? bounds.centerX - TILE_SIZE : bounds.centerX + TILE_SIZE;
    const xTile = Math.floor(x / TILE_SIZE);
    const bottom = Math.floor((bounds.centerY - 1) / TILE_SIZE);

    const findTile = (row: number): Phaser.Tilemaps.Tile | null => {
      for (const layer of this.scene.worldLayer) {
        const tile = this.scene.map.getTileAt(xTile, row, undefined, layer);

        if (tile) {
          return tile;
        }
      }

      return null;
    };

    return !findTile(bottom) && findTile(bottom + 1) !== null;
  }

  /**
   * Put the Player somewhere else, standing still (a door, a save point...)
   *
   * @param {number} x The x coordinate of the Player, like the spawn point
   * @param {number} y The y coordinate of the Player
   */
  public teleportTo(x: number, y: number): void {
    this.body.reset(x, y);
    this.body.updateCenter();

    this.setAccelerationX(0);
    this.movement.reset();
    this.body.setAllowGravity(true);
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

    return collidesWithTile({
      layer: tile.layer.name,
      index: tile.index,
      tileTop: tile.pixelY,
      feetBottom: () => this.getBodyBounds().bottom,
      isDownPressed: () =>
        this.scene.getController().isKeyPressed(ControllerKey.DOWN),
      hasTileAbove: () =>
        !!this.scene.map.getTileAt(tile.x, tile.y - 1, false, "stairs"),
    });
  }
}
