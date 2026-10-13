import * as Phaser from "phaser";
import { ContinuousScene } from "@/scenes/ContinuousScene";
import { ControllerKey } from "@/miscellaneous/Controller";
import { MAIN_MAP, MapConfig } from "@/config/maps";
import { Slopes } from "@/world/Slopes";
import { attachClasses, readRawObjects } from "@/world/tiledObjects";
import { createSlopes } from "@/world/slopesLayer";
import {
  findRoomIndex,
  getRoomId,
  getRoomProperty,
  resolveRoom,
} from "@/world/rooms";
import { TiledObject } from "@/entities/scenarios/TiledObject";
import { Platform } from "@/entities/scenarios/Platform";

import { DEFAULT_LIGHT } from "@/config/lights";

export abstract class MapScene extends ContinuousScene {
  /**
   * The main tilemap layer where all the collision will be implemented
   *
   * @type {Phaser.Tilemaps.TilemapLayer}
   */
  public collisionsLayer!: Phaser.Tilemaps.TilemapLayer;

  /**
   * The layer of the slopes (see world/slopeGeometry.ts), if the map has one
   *
   * @type {Phaser.Tilemaps.TilemapLayer | null}
   */
  public slopesLayer: Phaser.Tilemaps.TilemapLayer | null = null;

  /**
   * Keeps the bodies on the slopes of the map
   *
   * @type {Slopes}
   */
  public slopes!: Slopes;

  /**
   * The map of this scene: its name for the saves and the ids of its rooms,
   * and where Phaser has its JSON
   */
  public readonly mapConfig: MapConfig = MAIN_MAP;

  /**
   * The main tilemap layer where all the tiles with only top side collision will be implemented
   *
   * @type {Phaser.Tilemaps.TilemapLayer}
   */
  public oneWayCollisionsLayer!: Phaser.Tilemaps.TilemapLayer;

  /**
   * The tilemap layer where all the stairs will be implemented
   *
   * @type {Phaser.Tilemaps.TilemapLayer}
   */
  public stairsLayer!: Phaser.Tilemaps.TilemapLayer;

  /**
   * The group where all the moving platforms will be implemented
   *
   * @type {Phaser.GameObjects.Group}
   */
  public platforms!: Phaser.GameObjects.Group;

  /**
   * The tilemap layer where all the liquids will be implemented
   *
   * @type {Phaser.Tilemaps.TilemapLayer}
   */
  public breakablesLayer!: Phaser.Tilemaps.TilemapLayer;

  /**
   * The tilemap layer where all the liquids will be implemented
   *
   * @type {Phaser.Tilemaps.TilemapLayer}
   */
  public liquidsLayer!: Phaser.Tilemaps.TilemapLayer;

  /**
   * The tilemap layer just before the background
   *
   * @type {Phaser.Tilemaps.TilemapLayer}
   */
  public belowLayer!: Phaser.Tilemaps.TilemapLayer;

  /**
   * The tilemap layer above all the elements
   *
   * @type {Phaser.Tilemaps.TilemapLayer}
   */
  public aboveLayer!: Phaser.Tilemaps.TilemapLayer;

  /**
   * The tilemap layer above all the elements and liquids
   *
   * @type {Phaser.Tilemaps.TilemapLayer}
   */
  public frontLayer!: Phaser.Tilemaps.TilemapLayer;

  /**
   * The graphic which will render the tiles collision debug
   *
   * @type {Phaser.GameObjects.Graphics}
   */
  public collisionDebugGraphics!: Phaser.GameObjects.Graphics;

  /**
   * The default spawnpoint of the Player
   *
   * @type {Phaser.Types.Tilemaps.TiledObject}
   */
  public spawnPoint!: Phaser.Types.Tilemaps.TiledObject;

  /**
   * The current group of rooms
   *
   * @type {TiledObject[]}
   */
  public rooms!: TiledObject[];

  /**
   * The current map stored
   *
   * @type {Phaser.Tilemaps.Tilemap}
   */
  public map!: Phaser.Tilemaps.Tilemap;

  /**
   * Check if the Player overlap room bounds for start transition
   *
   * @type {Boolean}
   */
  public isChangingRoom = false;

  /**
   * Avoid to warn at every frame while the Player is outside every room
   */
  private hasWarnedOutsideRooms = false;

  public create(): void {
    super.create();

    this.collisionDebugGraphics = this.add
      .graphics()
      .setAlpha(0.75)
      .setDepth(10000);

    this.rooms = [];

    this.setupSlopes(null);

    this.platforms = this.add.group({
      active: true,
      maxSize: -1,
      runChildUpdate: true,
      classType: Platform,
    });
  }

  public update(time: any, delta: number): void {
    // Test if the user is pressing debug key
    if (this.getController().isKeyPressedForFirstTime(ControllerKey.DEBUG)) {
      if (typeof this.physics.world.debugGraphic === "undefined") {
        // If the game was started without debug enable, than init the graphic
        this.physics.world.createDebugGraphic();
        this.physics.world.drawDebug = true;
      } else {
        // Otherwise, just switch the drawDebug
        this.physics.world.drawDebug = !this.physics.world.drawDebug;
      }

      if (!this.physics.world.drawDebug) {
        // Clean the debugGraphic if the debug was disabled
        this.physics.world.debugGraphic.clear();
      }

      this.updateCollisionGraphic(this.physics.world.drawDebug);

      // The tilemap's collision debug graphic, instead of been clean,
      // will be disable/enable and hide/show
    }
  }

  public updateCollisionGraphic(active: boolean): void {
    this.collisionDebugGraphics.setActive(active).setVisible(active);
  }

  /**
   * Find the room of a point, update the lighting for it and remember the visit
   *
   * @param x       The x coordinate in the world
   * @param y       The y coordinate in the world
   * @param current The room the Player is in now (rooms may overlap)
   *
   * @return The index of the room. A point outside every room belongs to the
   * closest one, so a gap between rooms can't crash the game
   */
  public setCurrentRoom(x: number, y: number, current?: number | null): number {
    if (this.rooms.length === 0) {
      throw new Error("The map has no rooms");
    }

    const { index, outside } = resolveRoom(this.rooms, x, y, current);
    const currentRoomNumber = index as number;

    if (outside && !this.hasWarnedOutsideRooms) {
      console.warn(
        `Position ${x}, ${y} is outside every room: using ${getRoomId(this.rooms[currentRoomNumber])}`
      );
    }

    this.hasWarnedOutsideRooms = outside;

    let light = DEFAULT_LIGHT;
    const currentRoom = this.rooms[currentRoomNumber];

    const darkness = getRoomProperty(currentRoom, "dark");
    if (darkness && typeof darkness === "string") {
      light = Phaser.Display.Color.HexStringToColor(darkness).color;
    }

    // Remember the visit in the game state (saved with the game), instead of
    // writing it into the Tiled data: that also works for rooms without properties
    if (!outside) {
      this.getGameState().visitRoom(MapScene.getRoomId(currentRoom));
    }

    const ambientColor = this.lights.ambientColor;
    const currentLight = Phaser.Display.Color.GetColor(
      ambientColor.r,
      ambientColor.g,
      ambientColor.b
    );

    if (light !== currentLight) {
      this.lights.setAmbientColor(light);
    }

    return currentRoomNumber;
  }

  /**
   * A stable id for a room, usable in saves (see world/rooms.ts)
   */
  public static getRoomId(room: TiledObject): string {
    return getRoomId(room);
  }

  /**
   * The index of the room containing a point, or null if there is none
   */
  /**
   * The objects of a layer of objects of the map, each with its class
   * (Phaser reads only the `type` of Tiled: the class comes from the raw JSON)
   *
   * @param layerName The name of the layer of objects in Tiled
   */
  protected getMapObjects(layerName: string): TiledObject[] {
    const objects: TiledObject[] =
      this.map.getObjectLayer(layerName)?.objects ?? [];
    const raw = this.cache.tilemap.get(this.mapConfig.cacheKey)?.data;

    return attachClasses(objects, readRawObjects(raw, layerName));
  }

  /**
   * Set up the slopes of the map
   *
   * @param layer The layer of the slopes, or null if there is none
   */
  protected setupSlopes(layer: Phaser.Tilemaps.TilemapLayer | null): void {
    this.slopes?.destroy();
    this.slopesLayer = layer;
    this.slopes = createSlopes(this, layer);
  }

  public getCurrentRoom(x: number, y: number): number | null {
    return findRoomIndex(this.rooms, x, y);
  }

  public get worldLayer(): Phaser.Tilemaps.TilemapLayer[] {
    return [
      this.collisionsLayer,
      this.oneWayCollisionsLayer,
      this.stairsLayer,
      this.breakablesLayer,
    ];
  }
}
