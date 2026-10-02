import * as Phaser from "phaser";
import { MapScene } from "@/scenes/MapScene";
import { ControllerKey } from "@/miscellaneous/Controller";
import { TiledObject } from "@/entities/scenarios/TiledObject";
import { Platform } from "@/entities/scenarios/Platform";
import { Player } from "@/entities/Player";
import { Bow } from "@/entities/weapons/Bow";
import { Gun } from "@/entities/weapons/Gun";
import { Rifle } from "@/entities/weapons/Rifle";
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

export class MainScene extends MapScene {
  private hero!: Player;

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
      layerTilesets: Phaser.Tilemaps.Tileset | Phaser.Tilemaps.Tileset[]
    ): Phaser.Tilemaps.TilemapLayer => {
      const layer = this.map.createLayer(name, layerTilesets, 0, 0, false);
      if (!layer) {
        throw new Error(`Map layer not found: ${name}`);
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

    this.stairsLayer = createLayer("stairs", tileset)
      .setDepth(STAIRS_LAYER_DEPTH)
      .setLighting(true)
      .setCollisionByProperty({ collides: true })
      .renderDebug(this.collisionDebugGraphics, {
        tileColor: null,
        collidingTileColor: new Phaser.Display.Color(134, 243, 134, 255),
        faceColor: new Phaser.Display.Color(40, 39, 37, 255),
      });

    this.liquidsLayer = createLayer("liquids", [
      liquidTileset,
      fullLiquidTileset,
    ])
      .setDepth(WORLD_LAYER_DEPTH)
      .setAlpha(0.7);

    this.collisionsLayer = createLayer("collision", tileset)
      .setDepth(WORLD_LAYER_DEPTH)
      .setLighting(true)
      .setCollisionByProperty({ collides: true })
      .renderDebug(this.collisionDebugGraphics, {
        tileColor: null,
        collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255),
        faceColor: new Phaser.Display.Color(40, 39, 37, 255),
      });

    this.oneWayCollisionsLayer = createLayer("platforms", tileset)
      .setDepth(WORLD_LAYER_DEPTH)
      .setLighting(true)
      .setCollisionByProperty({ collides: true })
      .renderDebug(this.collisionDebugGraphics, {
        tileColor: null,
        collidingTileColor: new Phaser.Display.Color(48, 48, 134, 255),
        faceColor: new Phaser.Display.Color(40, 39, 37, 255),
      });

    this.breakablesLayer = createLayer("breakables", tileset)
      .setDepth(WORLD_LAYER_DEPTH)
      .setLighting(true)
      .setCollisionByProperty({ collides: true })
      .renderDebug(this.collisionDebugGraphics, {
        tileColor: null,
        collidingTileColor: new Phaser.Display.Color(134, 243, 48, 255),
        faceColor: new Phaser.Display.Color(40, 39, 37, 255),
      });

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

    const x: number = this.spawnPoint.x || 0;
    const y: number = this.spawnPoint.y || 0;

    const roomNumber: number = this.setCurrentRoom(x, y);

    this.getInventory()
      .pushWeapon(new Gun(this))
      .pushWeapon(new Rifle(this))
      .pushWeapon(new Bow(this));

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
      this.boundsCamera(this.hero.currentRoom);
    }

    const isStartPressed: boolean =
      this.getController().isKeyPressedForFirstTime(ControllerKey.START);

    if (isStartPressed) {
      this.scene.pause().wake("inventory");
    }
  }

  protected boundsCamera(room: number): void {
    // Start a fadeOut animation before change room
    this.cameras.main.fadeOut(
      250,
      0,
      0,
      0,
      (cameraIn: Phaser.Cameras.Scene2D.Camera, progressIn: number) => {
        // Prevent Player to do anything
        this.hero.canInteract = false;
        // Pause all the physics events
        this.physics.pause();

        if (progressIn === 1) {
          // Change camera boundaries when fade out complete
          this.setupRoom(this.rooms[room]);

          // Fade back in with new boundaries
          this.cameras.main.fadeIn(
            500,
            0,
            0,
            0,
            (cameraOut: Phaser.Cameras.Scene2D.Camera, progressOut: number) => {
              if (progressOut === 1) {
                // The Player can now interact
                this.hero.canInteract = true;
                // Resume all the physics events
                this.physics.resume();
              }
            },
            this
          );
        }
      },
      this
    );
  }

  protected setupRoom(room: TiledObject): void {
    const roomX: number = room.x || 0;
    const roomY: number = room.y || 0;
    const roomWidth: number = room.width || 0;
    const roomHeight: number = room.height || 0;

    this.cameras.main.setBounds(roomX, roomY, roomWidth, roomHeight, true);

    let textures: string[] = [];
    if (room.properties) {
      for (const property of room.properties) {
        if (property.name === "background") {
          textures = this.textures
            .getTextureKeys()
            .filter((item) => item.indexOf(property.value as string) !== -1);
        }
      }
    }

    if (textures.length > 0) {
      this.parallaxes.forEach((item) => {
        item.destroy();
      });
      this.parallaxes = [];

      let index = 0;
      for (const texture of textures) {
        if (index === 0) {
          if (this.background) {
            this.background.setTexture(texture);
          } else {
            this.background = this.add.image(
              this.scale.width / 2,
              this.scale.height / 2,
              texture
            );

            this.background
              .setLighting(true)
              .setScrollFactor(0)
              .setDepth(BACKGROUND_DEPTH - (textures.length - index));
          }
        } else {
          const background: Phaser.GameObjects.TileSprite = this.add.tileSprite(
            this.scale.width / 2,
            this.scale.height / 2,
            roomWidth,
            this.textures.get(texture).getSourceImage().height,
            texture
          );

          background
            .setLighting(true)
            .setScrollFactor(index / textures.length, 0)
            .setOrigin(0.5, 0.5)
            .setDepth(BACKGROUND_DEPTH - (textures.length - index));

          this.parallaxes.push(background);
        }

        index++;
      }
    }
  }
}
