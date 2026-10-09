import * as Phaser from "phaser";
import { MapScene } from "@/scenes/MapScene";
import { ControllerKey } from "@/miscellaneous/Controller";
import { RoomBackground } from "@/world/RoomBackground";
import { RoomTransition } from "@/world/RoomTransition";
import { toBounds } from "@/world/scroll";
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
  STAIRS_LAYER_DEPTH,
  GLOBAL_ABOVE_LAYER_DEPTH,
} from "@/config/depths";
import { DEFAULT_LIGHT } from "@/config/lights";
import { TILE_SIZE } from "@/config/tiles";

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
   * The save points found in the map: objects of type "save_point" in the
   * "objects" layer of Tiled. Their name is the id stored in the save.
   */
  private savePoints: TiledObject[] = [];

  public constructor() {
    super({
      active: false,
      visible: false,
      key: "main",
    });
  }

  public create(): void {
    super.create();

    this.map = this.make.tilemap({ key: "chozodia_map" });

    // Get the objects layer of the current loaded map for found
    // the main spawn point and rooms
    (this.map.getObjectLayer("objects")?.objects ?? []).forEach(
      (object: TiledObject) => {
        if (object.type === "room") {
          this.rooms.push(object);
        }

        if (object.type === "save_point") {
          this.savePoints.push(object);
        }

        if (object.name === "spawn_point") {
          this.spawnPoint = object;
        }
      }
    );

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
      collisionColor?: keyof typeof DEBUG_COLLISION_COLORS
    ): Phaser.Tilemaps.TilemapLayer => {
      const layer = this.map.createLayer(name, layerTilesets, 0, 0, false);
      if (!layer) {
        throw new Error(`Map layer not found: ${name}`);
      }

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

    this.breakablesLayer = createLayer("breakables", tileset, "breakables")
      .setDepth(WORLD_LAYER_DEPTH)
      .setLighting(true);

    (this.map.getObjectLayer("scenario_elements")?.objects ?? []).forEach(
      (object: TiledObject) => {
        if (object.type === "platform") {
          const platform = new Platform(
            this,
            object.x!,
            object.y!,
            object.properties!
          );
          this.platforms.add(platform);
        }
      }
    );

    this.physics.world.setBounds(
      0,
      0,
      this.map.widthInPixels,
      this.map.heightInPixels
    );

    // Restart from the last used save point, if any, otherwise from the start
    const savedPointId = this.getGameState().getSavePoint();
    const start: TiledObject =
      this.savePoints.find((point) => point.name === savedPointId) ??
      this.spawnPoint;

    const x: number = start.x || 0;
    const y: number = start.y || 0;

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
      freeze: () => {
        // Prevent Player to do anything and pause all the physics events
        this.hero.canInteract = false;
        this.physics.pause();
      },
      unfreeze: () => {
        this.hero.canInteract = true;
        this.physics.resume();
      },
      follow: () => {
        this.cameras.main.startFollow(this.hero);
      },
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
  }

  public update(time: any, delta: number): void {
    super.update(time, delta);

    this.hero.update(time, delta);
    // this.cameras.main.centerOnY(this.hero.y - TILE_SIZE * 4.5);

    if (this.isChangingRoom && this.rooms.length > 0) {
      this.startRoomTransition(this.hero.previousRoom, this.hero.currentRoom);
    }

    const isStartPressed: boolean =
      this.getController().isKeyPressedForFirstTime(ControllerKey.START);

    if (isStartPressed) {
      this.scene.pause().wake("inventory");
    }
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
