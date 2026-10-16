import * as Phaser from "phaser";
import { DirectionAxisX } from "@/miscellaneous/Direction";
import { ControllerKey } from "@/miscellaneous/Controller";
import { PowerUps } from "@/miscellaneous/Inventory";
import { PLAYER_DEPTH } from "@/config/depths";
import { SOUNDS } from "@/config/sounds";
import { TILE_SIZE } from "@/config/tiles";
import { SpriteCollidable } from "@/entities/collidables/SpriteCollidable";
import { Arsenal } from "@/entities/weapons/Arsenal";
import {
  getAnimationAction,
  getAnimationKey,
} from "@/entities/player/animation";
import { BatteryRecharger } from "@/entities/player/BatteryRecharger";
import { getDeceleration } from "@/entities/player/horizontalMotion";
import { MovementContext } from "@/entities/player/movement";
import { createMovementHost } from "@/entities/player/movement/createMovementHost";
import { MovementHost } from "@/entities/player/movement/host";
import { PlayerMovement } from "@/entities/player/movement/PlayerMovement";
import { MovementState } from "@/entities/player/movement/state";
import { AimLock } from "@/entities/player/aimLock";
import { AimHit, AimTargeting, SOLID } from "@/entities/player/aimTarget";
import {
  Damageable,
  DamageSource,
  applyDamage,
} from "@/combat/damage";
import { getPlayerDefense } from "@/combat/playerDefense";
import { FreeAim } from "@/entities/player/FreeAim";
import { PlayerAim } from "@/entities/player/PlayerAim";
import { PlayerBody } from "@/entities/player/PlayerBody";
import { PlayerInput } from "@/entities/player/PlayerInput";
import {
  LiquidDetection,
  PlayerLiquids,
} from "@/entities/player/PlayerLiquids";
import { PlayerSensors } from "@/entities/player/PlayerSensors";
import { PlayerSpeeds } from "@/entities/player/PlayerSpeeds";
import { PlayerWeapons } from "@/entities/player/PlayerWeapons";
import { MapScene } from "@/scenes/MapScene";
import { PlayerStats } from "@/state/GameState";
import { hasLedgeToClimb, hasRoomToClimb } from "@/world/ledgeClimb";
import { collidesWithTile } from "@/world/oneWayTiles";
import { trackRoom } from "@/world/roomChange";

/**
 * The hero. It is a sprite with a body, and the pieces which make it work:
 * the buttons, the aim, the movement (a state machine), the sensors, the speeds,
 * the weapons, the battery and the liquids. This class connects them, and
 * does what needs Phaser itself: the room, the animation, the light.
 */
export class Player extends SpriteCollidable {
  /** The max distance from a wall where the Player can still wall jump */
  static WALL_DETECTION_DISTANCE: number = TILE_SIZE / 4;

  /**
   * When falling fast the hand sensor can travel more than the height of the
   * area where a ledge can be grabbed in a single frame, and skip it.
   * Turn this on to look for ledges along the whole path of the sensor.
   */
  static SWEPT_LEDGE_DETECTION: boolean = false;

  /** The current room number */
  public currentRoom: number = 0;

  /** The previous room number */
  public previousRoom: number | null = null;

  /** The user can control the Player (not while it climbs a ledge) */
  public canInteract: boolean = true;

  /** The default movement speed, based on the gravity of the game */
  private baseSpeed: number;

  /** How fast the Player goes */
  private speeds: PlayerSpeeds;

  /** The buttons of the Player, read once per update */
  private controls: PlayerInput;

  /** Where the Player looks and aims */
  private aim = new PlayerAim();

  /** The shape of the body and the corrections of its position */
  private shape: PlayerBody;

  /** What the Player touches around the body: walls, ledges, ladders, platforms */
  private sensors: PlayerSensors;

  /**
   * What the Player is doing with its body (standing, crouching, in the air,
   * hanging, on a ladder, climbing a ledge), and how it moves
   */
  private movement = new PlayerMovement();

  /** What the movement needs from the Player */
  private movementHost: MovementHost;

  /** The weapons: change them, shoot, spend ammo */
  private weapons: PlayerWeapons;

  /** The aim with the mouse or the right stick of the gamepad */
  private freeAim: FreeAim;

  /** Knows when the aim points at something which can be hit */
  private targeting: AimTargeting;

  /** Keeps the aim on a block or an enemy */
  private aimLock = new AimLock();

  /** Fills the battery up again when it is not used */
  private recharger: BatteryRecharger;

  /**
   * The Player as something with life: what hurts it (a liquid, a zone, a shot,
   * an enemy) goes through here, by the defense the Player has now
   */
  private readonly damageable: Damageable = {
    getDefense: () =>
      getPlayerDefense((item) => this.scene.getInventory().equip(item)),
    takeDamage: (amount) => {
      this.stats.life -= amount;
    },
  };

  /** The Player in a liquid: swimming and the damage of acid and lava */
  private liquids: PlayerLiquids;

  /** The light emitted by Player */
  private torchLight: Phaser.GameObjects.Light;

  /**
   * Create the Player
   *
   * @param {MapScene} scene - scene creating the player.
   * @param {number} x - Start location x value.
   * @param {number} y - Start location y value.
   * @param {number} currentRoom - The room it starts in.
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

    // The sprite and its body
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
      // The drag is a deceleration in px/s², decided every frame by the movement
      .setDamping(false)
      .setDragX(
        getDeceleration(this.speeds.getMaxRunSpeed(), {
          isOnFloor: true,
          isSwimming: false,
        })
      );

    this.shape = new PlayerBody(this);
    this.shape.init();
    this.body.updateCenter();

    // The pieces
    this.controls = new PlayerInput(this.scene.getController());

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

    this.weapons = new PlayerWeapons(
      this.scene.getInventory(),
      new Arsenal(this.scene),
      this,
      this.controls,
      this.aim,
      this.stats
    );

    this.freeAim = new FreeAim(
      {
        device: () => this.scene.getController().getAimDevice(),
        origin: () => this.getAimOrigin(),
        pointer: () => {
          const pointer = this.scene.input.activePointer;

          // The camera has a zoom and follows the Player: ask it
          return this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
        },
        stick: () => this.scene.getController().getAimStick(),
        keys: () => ({
          fineAim: this.controls.fineAim,
          up: this.controls.up,
          down: this.controls.down,
        }),
      },
      this.scene.getAimCursor()
    );

    this.targeting = new AimTargeting(
      (x, y) => this.probeAim(x, y),
      () =>
        this.scene.sound.play(SOUNDS.aimTarget.key, {
          volume: SOUNDS.aimTarget.volume,
        })
    );

    this.recharger = new BatteryRecharger(
      this.scene.time,
      () => this.scene.getInventory().hasBattery(),
      this.stats
    );

    this.liquids = new PlayerLiquids(
      () => this.detectLiquid(),
      (config) => this.scene.time.addEvent(config),
      this.stats,
      this.damageable,
      this
    );

    // Keep the Player on the slopes of the map
    this.scene.slopes.track(this.body);
    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      this.scene.slopes.untrack(this.body);
      this.scene.getAimCursor().visible = false;
      this.scene.getAimCursor().lock = null;
    });

    // The torch
    const bounds = this.getBodyBounds();
    this.torchLight = this.scene.lights
      .addLight(bounds.centerX, bounds.centerY, TILE_SIZE * 8)
      .setIntensity(this.scene.getInventory().equip(PowerUps.TORCH) ? 3 : 0)
      .setColor(0xffffdd);

    // TODO: activate after create normal maps for sprite
    // this.setPipeline('Light2D');
  }

  /** The stats of the Player (life, ammo, battery...), kept in the game state */
  public get stats(): PlayerStats {
    return this.scene.getGameState().player;
  }

  /** What the Player is doing with its body */
  public get movementState(): MovementState {
    return this.movement.state;
  }

  public get isCrouch(): boolean {
    return this.movement.isCrouch;
  }

  /** Hanging from the edge of a ledge */
  public get isHanging(): boolean {
    return this.movement.isHanging;
  }

  /** Near a ladder */
  public get isOnLadder(): boolean {
    return this.movement.isOnLadder;
  }

  /** Holding a ladder */
  public get isAttachOnLadder(): boolean {
    return this.movement.isAttachOnLadder;
  }

  /** In a liquid */
  public get isSwimming(): boolean {
    // Asked by the speeds while the constructor is still running
    return this.liquids?.isSwimming ?? false;
  }

  /** The body has the smaller shape of crouching */
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
   * Called before Update
   *
   * @param {any} time
   * @param {number} delta
   */
  public preUpdate(time: any, delta: number): void {
    super.preUpdate(time, delta);

    const bounds = this.getBodyBounds();
    const room = trackRoom(
      this.currentRoom,
      this.previousRoom,
      this.scene.setCurrentRoom(
        bounds.centerX,
        bounds.centerY,
        this.currentRoom
      )
    );

    // Update player room variables
    this.currentRoom = room.current;
    this.previousRoom = room.previous;
    this.scene.isChangingRoom = room.changed;
  }

  /**
   * Every frame: read the buttons, move, shoot, then draw
   *
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

      // Handle the player body resizing: smaller when crouching
      this.shape.resize(this.movement.isCrouch);

      // Handle the crouch action and settle the state of the movement
      this.movement.updateCrouch(this.movementHost);

      if (this.movement.isAttachOnLadder) {
        this.centerOnLadder();
      }

      // The user can shoot only if the Player has at least one range weapon
      const canShoot = this.scene.getInventory().hasAtLeastOneRangeWeapon();

      // Lock the aim on what it points at, or let it go
      if (!canShoot) {
        this.aimLock.release();
      } else if (this.controls.justPressed(ControllerKey.LOCK)) {
        this.aimLock.toggle(this.targeting.target);
      }

      // Aim with the mouse, the right stick or the keyboard; a lock overrides them
      const locked = this.aimLock.update(
        this.getAimOrigin(),
        (x, y) => this.probeAim(x, y),
        time
      );
      this.freeAim.update(this.aim, delta, locked);

      if (canShoot) {
        // Handle all the ranged combat actions
        this.weapons.update(time);
      }

      // Does the aim point at a block or an enemy a shot would reach?
      this.targeting.update(canShoot ? this.weapons.getAimRay() : null, time);
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

  /** The center of the body: the aim is measured from here */
  private getAimOrigin(): { x: number; y: number } {
    const bounds = this.getBodyBounds();

    return { x: bounds.centerX, y: bounds.centerY };
  }

  /**
   * What the aim finds at a point of the world: the same things which stop or
   * break a shot (the platforms and the stairs let it through)
   */
  private probeAim(x: number, y: number): AimHit | null {
    const { shootables, breakablesLayer, collisionsLayer, slopes } = this.scene;

    const enemy = shootables.find(x, y);
    if (enemy) {
      return { kind: "enemy", id: enemy.id, position: () => enemy.position() };
    }

    const block = breakablesLayer.getTileAtWorldXY(x, y);
    if (block) {
      const [tileX, tileY] = [block.x, block.y];
      const center = { x: block.getCenterX(), y: block.getCenterY() };

      return {
        kind: "breakable",
        id: `${tileX},${tileY}`,
        // a block is where it was until a shot breaks it
        position: () => (breakablesLayer.hasTileAt(tileX, tileY) ? center : null),
      };
    }

    if (collisionsLayer.getTileAtWorldXY(x, y) || slopes.isInside(x, y)) {
      return SOLID;
    }

    return null;
  }

  /**
   * Pull the Player up a ledge: it moves to the side it looks at and up, and
   * can not be controlled until it has arrived
   *
   * @param {number} x The distance to the side
   * @param {number} y The distance up (default: as x)
   * @return Whether there is enough room and the climb started
   */
  protected climb(x: number, y: number = x): boolean {
    const direction = this.aim.facing.x === DirectionAxisX.LEFT ? -1 : 1;
    const bounds = this.getBodyBounds();
    const blockingLayers = this.scene.worldLayer.filter(
      (layer) => !["stairs", "platforms"].includes(layer.layer.name)
    );
    const hasRoom = hasRoomToClimb({
      x: bounds.x + x * direction,
      y: bounds.y - y,
      width: bounds.width,
      height: bounds.height,
      tileSize: TILE_SIZE,
      hasTile: (column, row) =>
        blockingLayers.some(
          (layer) => !!this.scene.map.getTileAt(column, row, undefined, layer)
        ),
    });

    if (!hasRoom) {
      return false;
    }

    this.canInteract = false;
    this.setVelocity(0, 0);
    this.setAccelerationX(0);

    const sign = direction < 0 ? "-" : "+";
    const isLedgeClimb = y > x;

    this.scene.tweens.chain({
      targets: this,
      tweens: [
        {
          y: `-=${y}`,
          duration: isLedgeClimb ? 240 : 160,
          ease: "Sine.easeInOut",
        },
        {
          x: `${sign}=${x}`,
          duration: isLedgeClimb ? 160 : 120,
          ease: "Sine.easeInOut",
        },
      ],
      onComplete: () => {
        this.movement.finishClimb();

        // A death during the climb must not give control back
        if (this.scene.getGameState().get("life") > 0) {
          this.canInteract = true;
        }
      },
    });

    return true;
  }

  /**
   * Change the current animation based on previous operations
   */
  protected animate(): void {
    const action = getAnimationAction({
      isOnFloor: this.isOnFloor(),
      isOnLadder: this.movement.isAttachOnLadder,
      isCrouch: this.movement.isCrouch,
      isHanging: this.movement.isHanging,
      isClimbing: this.movement.state === MovementState.CLIMBING_LEDGE,
      isJumping: this.movement.isJumping,
      isStandingJumping: this.movement.isStandingJumping,
      isAimingDiagonal: this.aim.isAimingDiagonal,
      isAimingAtTarget: this.targeting.isTargeting,
      wasAimingDiagonal: this.aim.wasAimingDiagonal,
      velocityX: this.body.velocity.x,
      facingY: this.aim.facing.y,
    });

    const animation = getAnimationKey(
      action,
      this.movement.isAttachOnLadder ? DirectionAxisX.CENTER : this.aim.lookingX
    );
    const doNewAnimation: boolean = animation !== this.anims.getName();

    if (doNewAnimation) {
      try {
        this.anims.play(animation, true);
      } catch (error) {
        console.error(error, animation);
      }
    }
  }

  /**
   * Hurt the Player with a source: a shot, an enemy, anything
   *
   * @return The life it took, 0 if the Player is not hurt
   */
  public hurt(source: DamageSource): number {
    return applyDamage(this.damageable, source);
  }

  /** How far the torch lights, in pixels of the world */
  public getTorchRadius(): number {
    return this.torchLight.radius;
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
   * Keep the body centered on the closest ladder tile it is holding
   */
  private centerOnLadder(): void {
    const bounds = this.getBodyBounds();
    const layer = this.scene.stairsLayer;
    const tiles = layer.getTilesWithinWorldXY(
      bounds.x,
      bounds.y,
      bounds.width,
      bounds.height + 1,
      { isNotEmpty: true },
      this.scene.cameras.main
    );

    let closestX: number | null = null;
    let closestDistance = Infinity;

    for (const tile of tiles) {
      const point = layer.tileToWorldXY(tile.x, tile.y);
      const centerX = point.x + (tile.width * layer.scaleX) / 2;
      const distance = Math.abs(centerX - bounds.centerX);

      if (distance < closestDistance) {
        closestX = centerX;
        closestDistance = distance;
      }
    }

    if (closestX !== null) {
      this.shape.moveTo(closestX - bounds.width / 2, null);
    }
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
   * Running against a wall: is there a ledge above to climb onto?
   *
   * @param {boolean} isLeft The wall is on the left
   */
  private hasLedgeToClimb(isLeft: boolean): boolean {
    const bounds = this.getBodyBounds();

    return hasLedgeToClimb({
      isLeft,
      centerX: bounds.centerX,
      centerY: bounds.centerY,
      tileSize: TILE_SIZE,
      hasTile: (column, row) =>
        this.scene.worldLayer.some(
          (layer) => !!this.scene.map.getTileAt(column, row, undefined, layer)
        ),
    });
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
