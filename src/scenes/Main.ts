import { MapScene } from 'Scenes/MapScene';

import { ControllerKey } from 'Miscellaneous/Controller';
import { TiledObject } from 'Miscellaneous/TiledObject';
import { Player } from 'Entities/Player';

import {
  BACKGROUND_DEPTH,
  BELOW_LAYER_DEPTH,
  ABOVE_LAYER_DEPTH,
  WORLD_LAYER_DEPTH,
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
      key: 'main',
    });
  }

  public preload(): void {
    this.load
      .image('background', [
        '/assets/sprites/tilemap.png',
        '/assets/sprites/tilemap_n.png',
      ])
      .image('chozodia_tiles', [
        '/assets/tilesets/chozodia.png',
        '/assets/tilesets/chozodia_n.png',
      ])
      .image('liquid_tiles', '/assets/tilesets/liquids.png')
      .image('full_liquid_tiles', '/assets/tilesets/full_liquids.png')
      .tilemapTiledJSON('chozodia_map', '../assets/maps/chozodia.json');
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
      throw 'No Spawn Point detected';
      return;
    }

    const tileset = this.map.addTilesetImage('chozodia', 'chozodia_tiles');
    const liquid_tileset = this.map.addTilesetImage('liquids', 'liquid_tiles');
    const full_liquid_tileset = this.map.addTilesetImage('full_liquids', 'full_liquid_tiles');

    this.belowLayer = this.map.createStaticLayer('background', tileset, 0, 0)
      .setDepth(BELOW_LAYER_DEPTH)
      .setPipeline('Light2D');

    this.aboveLayer = this.map.createStaticLayer('frontground', tileset, 0, 0)
      .setDepth(ABOVE_LAYER_DEPTH)
      .setPipeline('Light2D');

    this.frontLayer = this.map.createStaticLayer('global_frontground', tileset, 0, 0)
      .setDepth(GLOBAL_ABOVE_LAYER_DEPTH)
      .setPipeline('Light2D');

    this.liquidsLayer = this.map.createDynamicLayer('liquids', [liquid_tileset, full_liquid_tileset], 0, 0)
      .setDepth(WORLD_LAYER_DEPTH)
      .setAlpha(0.7)

    this.worldLayer = this.map.createDynamicLayer('collision', tileset, 0, 0)
      .setDepth(WORLD_LAYER_DEPTH)
      .setPipeline('Light2D')
      .setCollisionByProperty({ collides: true })
      .renderDebug(this.collisionDebugGraphics, {
        tileColor: null,
        collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255),
        faceColor: new Phaser.Display.Color(40, 39, 37, 255)
      });

    this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

    const x: number = this.spawnPoint.x || 0;
    const y: number = this.spawnPoint.y || 0;

    const roomNumber: number = this.setCurrentRoom(x, y);

    this.hero = new Player(this, x, y, roomNumber);

    this.background = this.add.tileSprite(
      0,
      0,
      this.map.widthInPixels,
      this.map.widthInPixels,
      'background'
    )
      .setOrigin(0, 0)
      .setAlpha(0.5)
      .setDepth(BACKGROUND_DEPTH)
      .setPipeline('Light2D');

    this.updateCollisionGraphic(this.physics.world.drawDebug);
    this.lights.enable().setAmbientColor(DEFAULT_LIGHT);

    const currentRoom = this.rooms[roomNumber];
    this.cameras.main
      .setZoom(2)
      // The user must have a pretty deadzone to see incoming enemies
      .setDeadzone(TILE_SIZE * 5, TILE_SIZE * 2)
      .startFollow(this.hero)
      .setBounds(
        currentRoom.x || 0,
        currentRoom.y || 0,
        currentRoom.width || 0,
        currentRoom.height || 0,
        true
      )
      .fadeIn(2000, 0, 0, 0);

    this.sys.animatedTiles.init(this.map);
  }

  public update(time: any, delta: number): void {
    super.update(time, delta);

    this.hero.update(time, delta);
    // this.liquids.update(time, delta);
    // this.cameras.main.centerOnY(this.hero.y - TILE_SIZE * 4.5);

    if (this.isChangingRoom && this.rooms.length > 0) {
      this.boundsCamera(this.hero.currentRoom);
    }

    const isStartPressed: boolean = this.getController()
      .isKeyPressedForFirstTime(ControllerKey.START);

    if (isStartPressed) {
      this.scene.pause();
      this.scene.launch('inventory');
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
          this.cameras.main.setBounds(
            this.rooms[room].x || 0,
            this.rooms[room].y || 0,
            this.rooms[room].width || 0,
            this.rooms[room].height || 0,
            true
          );

          // Fade back in with new boundareis
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
}
