import * as Phaser from 'phaser';
import { MapScene } from 'Scenes/MapScene';
import { ControllerKey } from 'Miscellaneous';
import {
  TiledObject,
  TiledObjectProperty,
  Platform,
  PlatformDirection
} from 'Entities/Scenarios';
import { Player } from 'Entities/Player';

import {
  BACKGROUND_DEPTH,
  BELOW_LAYER_DEPTH,
  ABOVE_LAYER_DEPTH,
  WORLD_LAYER_DEPTH,
  STAIRS_LAYER_DEPTH,
  GLOBAL_ABOVE_LAYER_DEPTH
} from 'Config/depths';
import { DEFAULT_LIGHT } from 'Config/lights';
import { TILE_SIZE } from 'Config/tiles';

export class Main extends MapScene {
  private hero!: Player;

  public constructor() {
    super({
      active: false,
      visible: false,
      key: 'main'
    });
  }

  public create(): void {
    super.create();

    const config: Phaser.Types.Animations.Animation = {
      key: 'chozodia_tiles_anim',
      frameRate: 10,
      frames: this.anims.generateFrameNumbers('chozodia_tiles', {
        frames: [54, 70]
      })
    };
    this.anims.create(config);

    this.map = this.make.tilemap({ key: 'chozodia_map' });

    // Get the objects layer of the current loaded map for found
    // the main spawn point and rooms
    this.map.getObjectLayer('objects').objects
      .forEach((object: TiledObject) => {
        if (object.type === 'room') {
          this.rooms.push(object);
        }

        if (object.name === 'spawn_point') {
          this.spawnPoint = object;
        }
      });

    if (!this.spawnPoint) {
      // eslint-disable-next-line no-throw-literal
      throw 'No Spawn Point detected';
    }

    const tileset = this.map.addTilesetImage('chozodia', 'chozodia_tiles');
    const liquidTileset = this.map.addTilesetImage('liquids', 'liquid_tiles');
    const fullLiquidTileset = this.map.addTilesetImage('full_liquids', 'full_liquid_tiles');

    this.belowLayer = this.map.createStaticLayer('background', tileset, 0, 0)
      .setDepth(BELOW_LAYER_DEPTH)
      .setPipeline('Light2D');

    this.aboveLayer = this.map.createStaticLayer('frontground', tileset, 0, 0)
      .setDepth(ABOVE_LAYER_DEPTH)
      .setPipeline('Light2D');

    this.frontLayer = this.map.createStaticLayer('global_frontground', tileset, 0, 0)
      .setDepth(GLOBAL_ABOVE_LAYER_DEPTH)
      .setPipeline('Light2D');

    this.stairsLayer = this.map.createDynamicLayer('stairs', tileset, 0, 0)
      .setDepth(STAIRS_LAYER_DEPTH)
      .setPipeline('Light2D')
      .setCollisionByProperty({ collides: true })
      .renderDebug(this.collisionDebugGraphics, {
        tileColor: null,
        collidingTileColor: new Phaser.Display.Color(134, 243, 134, 255),
        faceColor: new Phaser.Display.Color(40, 39, 37, 255)
      });

    this.liquidsLayer = this.map.createDynamicLayer('liquids', [liquidTileset, fullLiquidTileset], 0, 0)
      .setDepth(WORLD_LAYER_DEPTH)
      .setAlpha(0.7);

    this.collisionsLayer = this.map.createDynamicLayer('collision', tileset, 0, 0)
      .setDepth(WORLD_LAYER_DEPTH)
      .setPipeline('Light2D')
      .setCollisionByProperty({ collides: true })
      .renderDebug(this.collisionDebugGraphics, {
        tileColor: null,
        collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255),
        faceColor: new Phaser.Display.Color(40, 39, 37, 255)
      });

    this.oneWayCollisionsLayer = this.map.createDynamicLayer('platforms', tileset, 0, 0)
      .setDepth(WORLD_LAYER_DEPTH)
      .setPipeline('Light2D')
      .setCollisionByProperty({ collides: true })
      .renderDebug(this.collisionDebugGraphics, {
        tileColor: null,
        collidingTileColor: new Phaser.Display.Color(48, 48, 134, 255),
        faceColor: new Phaser.Display.Color(40, 39, 37, 255)
      });

    this.breakablesLayer = this.map.createDynamicLayer('breakables', tileset, 0, 0)
      .setDepth(WORLD_LAYER_DEPTH)
      .setPipeline('Light2D')
      .setCollisionByProperty({ collides: true })
      .renderDebug(this.collisionDebugGraphics, {
        tileColor: null,
        collidingTileColor: new Phaser.Display.Color(134, 243, 48, 255),
        faceColor: new Phaser.Display.Color(40, 39, 37, 255)
      });

    this.map.getObjectLayer('scenario_elements').objects
      .forEach((object: TiledObject) => {
        if (object.type === 'platform') {
          const platform = new Platform(
            this,
            object.x!,
            object.y!,
            object.properties!
          );
          this.platforms.add(platform);
        }
      });

    this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

    const x: number = this.spawnPoint.x || 0;
    const y: number = this.spawnPoint.y || 0;

    const roomNumber: number = this.setCurrentRoom(x, y);

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

    this.sys.animatedTiles.init(this.map);

    this.physics.add.collider(this.hero, this.platforms);
  }

  public update(time: any, delta: number): void {
    super.update(time, delta);

    this.hero.update(time, delta);
    // this.cameras.main.centerOnY(this.hero.y - TILE_SIZE * 4.5);

    if (this.isChangingRoom && this.rooms.length > 0) {
      this.boundsCamera(this.hero.currentRoom);
    }

    const isStartPressed: boolean = this.getController()
      .isKeyPressedForFirstTime(ControllerKey.START);

    if (isStartPressed) {
      this.scene.pause().wake('inventory');
    }
  }

  protected boundsCamera(room: number): void {
    // Start a fadeOut animation before change room
    this.cameras.main
      .fadeOut(250, 0, 0, 0, (cameraIn: Phaser.Cameras.Scene2D.Camera, progressIn: number) => {
        // Prevent Player to do anything
        this.hero.canInteract = false;
        // Pause all the physics events
        this.physics.pause();

        if (progressIn === 1) {
          // Change camera boundaries when fade out complete
          this.setupRoom(this.rooms[room]);

          // Fade back in with new boundaries
          this.cameras.main
            // eslint-disable-next-line max-len
            .fadeIn(500, 0, 0, 0, (cameraOut: Phaser.Cameras.Scene2D.Camera, progressOut: number) => {
              if (progressOut === 1) {
                // The Player can now interact
                this.hero.canInteract = true;
                // Resume all the physics events
                this.physics.resume();
              }
            }, this);
        }
      }, this);
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
        if (property.name === 'background') {
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
              .setPipeline('Light2D')
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
            .setPipeline('Light2D')
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
