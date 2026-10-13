import * as Phaser from "phaser";
import { MapScene } from "@/scenes/MapScene";
import { ControllerKey } from "@/miscellaneous/Controller";
import { SLOPES_LAYER_NAME, renderSlopesDebug } from "@/world/slopesLayer";
import { RoomBackground } from "@/world/RoomBackground";
import { RoomTransition } from "@/world/RoomTransition";
import { DoorTransition } from "@/world/DoorTransition";
import { DoorTrigger, LocalDoor, findDoorAt, isLocalDoor } from "@/world/doors";
import {
  MapObjectContext,
  createMapObjectRegistry,
} from "@/world/mapObjectHandlers";
import { validateMap } from "@/world/mapValidation";
import { PlatformDirection } from "@/world/objectSchemas";
import {
  SavePoint,
  SavePointTrigger,
  findSavePoint,
  findSavePointAt,
  parseSavePoints,
} from "@/world/savePoints";
import { toBounds } from "@/world/scroll";
import { breakableFlag } from "@/world/worldFlags";
import { useSavePoint } from "@/state/checkpoint";
import { getRoomProperty } from "@/world/rooms";
import { DEV_LOADOUT } from "@/config/dev";
import { applyDevLoadout } from "@/miscellaneous/devLoadout";
import { TiledObject } from "@/entities/scenarios/TiledObject";
import { Platform } from "@/entities/scenarios/Platform";
import { Player } from "@/entities/Player";
import {
  BACKGROUND_DEPTH,
  BELOW_LAYER_DEPTH,
  ABOVE_LAYER_DEPTH,
  WORLD_LAYER_DEPTH,
  SLOPES_LAYER_DEPTH,
  STAIRS_LAYER_DEPTH,
  GLOBAL_ABOVE_LAYER_DEPTH,
} from "@/config/depths";
import { DEFAULT_LIGHT } from "@/config/lights";
import { TILE_SIZE } from "@/config/tiles";

/** How long the screen takes to go black when the Player dies */
const DEATH_FADE_DURATION = 1200;

const SAVE_PROMPT = "Press UP to save";

const DEBUG_FACE_COLOR = new Phaser.Display.Color(40, 39, 37, 255);
const DEBUG_COLLISION_COLORS = {
  stairs: new Phaser.Display.Color(134, 243, 134, 255),
  collision: new Phaser.Display.Color(243, 134, 48, 255),
  platforms: new Phaser.Display.Color(48, 48, 134, 255),
  breakables: new Phaser.Display.Color(134, 243, 48, 255),
};

export class MainScene extends MapScene {
  private hero!: Player;

  /**
   * The background of the current room
   */
  private background!: RoomBackground;

  /**
   * The scroll of the camera between two rooms
   */
  private roomTransition!: RoomTransition;

  /**
   * The doors of the map (objects of type "door" in Tiled, see world/doors.ts)
   */
  private doors: LocalDoor[] = [];

  private doorTrigger = new DoorTrigger<LocalDoor>();

  /**
   * The fade to black when the Player goes through a door
   */
  private doorTransition!: DoorTransition;

  /** The kinds of objects a map can have, and how they are made */
  private static readonly objects = createMapObjectRegistry<TiledObject>();

  /**
   * The save points found in the map: objects of type "save_point" in the
   * "objects" layer of Tiled (see world/savePoints.ts). Their name is the id
   * stored in the save.
   */
  private savePoints: SavePoint[] = [];

  private savePointTrigger = new SavePointTrigger();

  /**
   * The hint shown by the HUD while the Player is in a save point
   */
  private prompt: string | null = null;

  /**
   * The Player has no life left: the game is over and nothing can move again
   */
  private isDead = false;

  public constructor() {
    super({
      active: false,
      visible: false,
      key: "main",
    });
  }

  public create(): void {
    super.create();

    // A scene which restarts after a death keeps its fields: start clean
    this.doors = [];
    this.savePoints = [];
    this.isDead = false;
    this.prompt = null;
    this.doorTrigger = new DoorTrigger();
    this.savePointTrigger = new SavePointTrigger();
    this.physics.resume();

    this.map = this.make.tilemap({ key: this.mapConfig.cacheKey });

    // While developing, tell what is wrong in the map before it breaks
    if (import.meta.env.DEV) {
      const { errors, warnings } = validateMap(
        this.cache.tilemap.get(this.mapConfig.cacheKey)?.data
      );

      errors.forEach((error) =>
        console.error(`[${this.mapConfig.key}] ${error}`)
      );
      warnings.forEach((warning) =>
        console.warn(`[${this.mapConfig.key}] ${warning}`)
      );
    }

    // The rooms, the save points, the spawn point and the doors of the map
    // (the platforms are made later, when the layers they collide with exist)
    const savePointObjects: TiledObject[] = [];
    const objectContext = this.createObjectContext(savePointObjects);
    MainScene.objects.spawn(
      "objects",
      this.getMapObjects("objects"),
      objectContext
    );
    this.savePoints = parseSavePoints(savePointObjects);

    if (!this.spawnPoint) {
      throw "No Spawn Point detected";
    }

    const tileset = this.map.addTilesetImage("chozodia", "chozodia_tiles");
    const liquidTileset = this.map.addTilesetImage("liquids", "liquid_tiles");
    const fullLiquidTileset = this.map.addTilesetImage(
      "full_liquids",
      "full_liquid_tiles"
    );

    if (!tileset || !liquidTileset || !fullLiquidTileset) {
      throw new Error("Failed to load map tilesets");
    }

    const createLayer = (
      name: string,
      layerTilesets: Phaser.Tilemaps.Tileset | Phaser.Tilemaps.Tileset[],
      collisionColor?: keyof typeof DEBUG_COLLISION_COLORS,
      prepare?: (layer: Phaser.Tilemaps.TilemapLayer) => void
    ): Phaser.Tilemaps.TilemapLayer => {
      const layer = this.map.createLayer(name, layerTilesets, 0, 0, false);
      if (!layer) {
        throw new Error(`Map layer not found: ${name}`);
      }

      // Before the collisions and their debug drawing, which see the result
      prepare?.(layer as Phaser.Tilemaps.TilemapLayer);

      if (collisionColor) {
        layer
          .setCollisionByProperty({ collides: true })
          .renderDebug(this.collisionDebugGraphics, {
            tileColor: null,
            collidingTileColor: DEBUG_COLLISION_COLORS[collisionColor],
            faceColor: DEBUG_FACE_COLOR,
          });
      }

      return layer as Phaser.Tilemaps.TilemapLayer;
    };

    this.belowLayer = createLayer("background", tileset)
      .setDepth(BELOW_LAYER_DEPTH)
      .setLighting(true);

    this.aboveLayer = createLayer("frontground", tileset)
      .setDepth(ABOVE_LAYER_DEPTH)
      .setLighting(true);

    this.frontLayer = createLayer("global_frontground", tileset)
      .setDepth(GLOBAL_ABOVE_LAYER_DEPTH)
      .setLighting(true);

    this.stairsLayer = createLayer("stairs", tileset, "stairs")
      .setDepth(STAIRS_LAYER_DEPTH)
      .setLighting(true);

    this.liquidsLayer = createLayer("liquids", [
      liquidTileset,
      fullLiquidTileset,
    ])
      .setDepth(WORLD_LAYER_DEPTH)
      .setAlpha(0.7);

    this.collisionsLayer = createLayer("collision", tileset, "collision")
      .setDepth(WORLD_LAYER_DEPTH)
      .setLighting(true);

    this.oneWayCollisionsLayer = createLayer("platforms", tileset, "platforms")
      .setDepth(WORLD_LAYER_DEPTH)
      .setLighting(true);

    this.breakablesLayer = createLayer(
      "breakables",
      tileset,
      "breakables",
      (layer) => this.removeBrokenTiles(layer)
    )
      .setDepth(WORLD_LAYER_DEPTH)
      .setLighting(true);

    // The slopes are optional: not every map has them
    if (this.map.layers.some((layer) => layer.name === SLOPES_LAYER_NAME)) {
      const slopesLayer = createLayer(SLOPES_LAYER_NAME, tileset)
        .setDepth(SLOPES_LAYER_DEPTH)
        .setLighting(true)
        // Only for the bullets: the Player does not collide with its tiles
        .setCollisionByProperty({ collides: true });

      this.setupSlopes(slopesLayer);

      const grid = this.slopes.getGrid();
      if (grid) {
        renderSlopesDebug(this.collisionDebugGraphics, grid);
      }
    }

    MainScene.objects.spawn(
      "scenario_elements",
      this.getMapObjects("scenario_elements"),
      objectContext
    );

    this.physics.world.setBounds(
      0,
      0,
      this.map.widthInPixels,
      this.map.heightInPixels
    );

    // Restart from the last used save point, if any, otherwise from the start
    // (a save point of another map is not for this one)
    const saved = this.getGameState().getSavePoint();
    const savedPoint =
      saved?.map === this.mapConfig.key
        ? findSavePoint(this.savePoints, saved.id)
        : undefined;

    if (saved?.map === this.mapConfig.key && !savedPoint) {
      console.warn(`Save point "${saved.id}" is not in the map`);
    }

    const x: number = savedPoint?.spawn.x ?? this.spawnPoint.x ?? 0;
    const y: number = savedPoint?.spawn.y ?? this.spawnPoint.y ?? 0;

    const roomNumber: number = this.setCurrentRoom(x, y);

    if (DEV_LOADOUT) {
      applyDevLoadout(this.getInventory());
    }

    this.background = new RoomBackground(this);
    this.roomTransition = new RoomTransition({
      camera: this.cameras.main,
      addTween: (config) => this.tweens.add(config),
      // Exactly where startFollow will center the camera when the Player
      // takes control again: it would jump there otherwise
      getFocus: () => ({ x: this.hero.x, y: this.hero.y }),
      freeze: () => this.freeze(),
      unfreeze: () => this.unfreeze(),
      follow: () => {
        this.cameras.main.startFollow(this.hero);
      },
    });

    this.doorTransition = new DoorTransition({
      freeze: () => this.freeze(),
      unfreeze: () => this.unfreeze(),
      fadeOut: (duration, done) => this.fadeCamera(true, duration, done),
      fadeIn: (duration, done) => this.fadeCamera(false, duration, done),
      enter: (target) => this.enterRoomAt(target.x, target.y),
    });

    this.hero = new Player(this, x, y, roomNumber);

    this.updateCollisionGraphic(this.physics.world.drawDebug);
    this.lights.enable().setAmbientColor(DEFAULT_LIGHT);

    this.cameras.main
      .setZoom(2)
      // The user must have a pretty deadzone to see incoming enemies
      .setDeadzone(TILE_SIZE * 5, TILE_SIZE * 2)
      .startFollow(this.hero)
      .fadeIn(2000, 0, 0, 0);

    this.setupRoom(this.rooms[roomNumber]);

    this.physics.add.collider(this.hero, this.platforms);

    // No life left: the game is over
    this.watchState("stat", (key, value) => {
      if (key === "life" && value <= 0) {
        this.die();
      }
    });
  }

  public update(time: any, delta: number): void {
    super.update(time, delta);

    this.hero.update(time, delta);
    // this.cameras.main.centerOnY(this.hero.y - TILE_SIZE * 4.5);

    this.updateDoors();
    this.updateSavePoints();

    if (this.isChangingRoom && this.rooms.length > 0) {
      this.startRoomTransition(this.hero.previousRoom, this.hero.currentRoom);
    }

    const isStartPressed: boolean =
      this.getController().isKeyPressedForFirstTime(ControllerKey.START);

    if (isStartPressed && !this.isDead) {
      this.scene.pause().wake("inventory");
    }
  }

  /**
   * Where the objects of the map go: the registry (world/mapObjectHandlers.ts)
   * says which object is what, this says what the scene does with each
   */
  private createObjectContext(
    savePointObjects: TiledObject[]
  ): MapObjectContext<TiledObject> {
    return {
      addRoom: (room) => {
        this.rooms.push(room);
      },
      addSavePoint: (savePoint) => {
        savePointObjects.push(savePoint);
      },
      setSpawnPoint: (spawnPoint) => {
        this.spawnPoint = spawnPoint;
      },
      addDoor: (door) => {
        if (isLocalDoor(door)) {
          this.doors.push(door);

          return;
        }

        console.warn(
          `Door ${door.id} leads to another map: changing map is not supported yet, the door is ignored`
        );
      },
      addPlatform: (platform, values) => {
        this.platforms.add(
          new Platform(this, platform.x!, platform.y!, {
            speed: values.speed as number,
            direction: values.direction as PlatformDirection,
            distance: values.distance as number,
          })
        );
      },
    };
  }

  /**
   * Prevent the Player to do anything and pause all the physics events
   */
  private freeze(): void {
    this.hero.canInteract = false;
    this.physics.pause();
  }

  private unfreeze(): void {
    // A transition which ends after the Player died must not bring it back
    if (this.isDead) {
      return;
    }

    this.hero.canInteract = true;
    this.physics.resume();
  }

  private fadeCamera(out: boolean, duration: number, done: () => void): void {
    let called = false;
    const onProgress = (
      _camera: Phaser.Cameras.Scene2D.Camera,
      progress: number
    ) => {
      if (progress === 1 && !called) {
        called = true;
        done();
      }
    };

    if (out) {
      this.cameras.main.fadeOut(duration, 0, 0, 0, onProgress, this);
    } else {
      this.cameras.main.fadeIn(duration, 0, 0, 0, onProgress, this);
    }
  }

  /**
   * Put the Player somewhere else in the map: in the room it is there, with
   * the light, the background and the camera of that room
   */
  private enterRoomAt(x: number, y: number): void {
    this.hero.teleportTo(x, y);

    const body = this.hero.body;
    const room = this.setCurrentRoom(
      body.x + body.width / 2,
      body.y + body.height / 2
    );

    // The room is already the current one: no scroll for this change
    this.hero.previousRoom = this.hero.currentRoom;
    this.hero.currentRoom = room;

    this.setupRoom(this.rooms[room]);
    this.cameras.main.startFollow(this.hero);
  }

  /**
   * Take the Player through the door it is in, if it has to
   */
  private updateDoors(): void {
    if (
      this.doors.length === 0 ||
      !this.hero.canInteract ||
      this.doorTransition.isRunning ||
      this.roomTransition.isRunning
    ) {
      return;
    }

    const body = this.hero.body;
    const inside = findDoorAt(
      this.doors,
      body.x + body.width / 2,
      body.y + body.height / 2
    );

    const door = this.doorTrigger.update(
      inside,
      this.getController().isKeyPressed(ControllerKey.UP)
    );

    if (door) {
      this.doorTransition.start(door);
    }
  }

  /**
   * The Player can use a save point: in control, not dead, not in a transition
   */
  private canUseSavePoints(): boolean {
    return (
      !this.isDead &&
      this.hero.canInteract &&
      !this.doorTransition.isRunning &&
      !this.roomTransition.isRunning
    );
  }

  /**
   * Show the hint while the Player is in a save point, and save when it
   * presses Up there
   */
  private updateSavePoints(): void {
    if (this.savePoints.length === 0) {
      return;
    }

    const body = this.hero.body;
    const inside = this.canUseSavePoints()
      ? findSavePointAt(
          this.savePoints,
          body.x + body.width / 2,
          body.y + body.height / 2
        )
      : null;

    this.setPrompt(inside ? SAVE_PROMPT : null);

    const point = this.savePointTrigger.update(
      inside,
      this.getController().isKeyPressed(ControllerKey.UP),
      this.hero.isOnFloor()
    );

    if (point) {
      this.saveAt(point);
    }
  }

  /**
   * Heal the Player and save the game: it restarts from this save point
   */
  private saveAt(point: SavePoint): void {
    try {
      useSavePoint(this.getGameState(), this.getSaveManager(), {
        map: this.mapConfig.key,
        id: point.id,
      });
    } catch (error) {
      // The storage can be full or blocked: the game goes on, unsaved
      console.error("The game could not be saved", error);
      this.events.emit("notice", "Could not save the game");

      return;
    }

    this.cameras.main.flash(300, 160, 255, 160);
    this.events.emit("notice", "Game saved");
  }

  /**
   * Tell the HUD which hint to show (null: none)
   */
  private setPrompt(prompt: string | null): void {
    if (prompt === this.prompt) {
      return;
    }

    this.prompt = prompt;
    this.events.emit("prompt", prompt);
  }

  /**
   * The Player has no life left: everything stops, the screen goes black and
   * the game over screen asks what to do
   */
  private die(): void {
    if (this.isDead) {
      return;
    }

    this.isDead = true;
    this.setPrompt(null);
    this.freeze();
    this.hero.setTint(0xff3333);

    this.fadeCamera(true, DEATH_FADE_DURATION, () => {
      this.scene.launch("gameover");
    });
  }

  /**
   * Take away the blocks which were destroyed in a previous visit (they are
   * flags in the game state, so they come back with a save)
   */
  private removeBrokenTiles(layer: Phaser.Tilemaps.TilemapLayer): void {
    const state = this.getGameState();

    layer.forEachTile(
      (tile) => {
        if (state.hasFlag(breakableFlag(this.mapConfig.key, tile.x, tile.y))) {
          layer.removeTileAt(tile.x, tile.y);
        }
      },
      undefined,
      0,
      0,
      layer.layer.width,
      layer.layer.height,
      { isNotEmpty: true }
    );
  }

  /**
   * Scroll the camera from the room the Player left to the one it entered
   */
  protected startRoomTransition(previous: number | null, next: number): void {
    const room = this.rooms[next];
    const background = getRoomProperty(room, "background");

    this.roomTransition.start(
      toBounds(this.rooms[previous ?? next]),
      toBounds(room),
      (fadeDuration) =>
        this.background.show(
          typeof background === "string" ? background : undefined,
          room.width || 0,
          fadeDuration
        )
    );
  }

  protected setupRoom(room: TiledObject): void {
    const roomX: number = room.x || 0;
    const roomY: number = room.y || 0;
    const roomWidth: number = room.width || 0;
    const roomHeight: number = room.height || 0;

    this.cameras.main.setBounds(roomX, roomY, roomWidth, roomHeight, true);

    const background = getRoomProperty(room, "background");
    this.background.show(
      typeof background === "string" ? background : undefined,
      roomWidth
    );
  }
}
