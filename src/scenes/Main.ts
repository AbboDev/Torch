import { Player } from 'Entities/Player';
import { ControllerKey } from 'Miscellaneous/Controller';
import { MapScene } from 'Scenes/MapScene';
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
      .tilemapTiledJSON('chozodia_map', '../assets/maps/chozodia.json');
  }

  public create(): void {
    super.create();

    this.map = this.make.tilemap({ key: 'chozodia_map' });

    // Get the objects layer of the current loaded map for found
    // the main spawn point and rooms
    this.map.getObjectLayer('objects').objects
      .forEach((object: Phaser.Types.Tilemaps.TiledObject) => {
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

    this.belowLayer = this.map.createStaticLayer('background', tileset, 0, 0)
      .setDepth(1)
      .setPipeline('Light2D');
    this.aboveLayer = this.map.createStaticLayer('frontground', tileset, 0, 0)
      .setDepth(1000)
      .setPipeline('Light2D');

    this.worldLayer = this.map.createDynamicLayer('collision', tileset, 0, 0)
      .setDepth(999)
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
    let roomNumber = 0;

    // Loop through rooms in this level
    this.rooms
      .forEach((room: Phaser.Types.Tilemaps.TiledObject, index: number) => {
        const roomLeft = room.x || 0;
        const roomRight = roomLeft + (room.width || 0);
        const roomTop = room.y || 0;
        const roomBottom = roomTop + (room.height || 0);

        // Player is within the boundaries of this room
        if (x > roomLeft && x < roomRight && y > roomTop && y < roomBottom) {
          roomNumber = index;
        }
      });

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
      .setDepth(-1)
      .setPipeline('Light2D');

    this.updateCollisionGraphic(this.physics.world.drawDebug);

    this.cameras.main
      .setZoom(2)
      // The user must have a pretty deadzone to see incoming enemies
      .setDeadzone(TILE_SIZE * 5, TILE_SIZE * 2)
      .startFollow(this.hero)
      .setBounds(
        this.rooms[roomNumber].x || 0,
        this.rooms[roomNumber].y || 0,
        this.rooms[roomNumber].width || 0,
        this.rooms[roomNumber].height || 0,
        true
      )
      .fadeIn(2000, 0, 0, 0);

    this.lights.enable().setAmbientColor(0x000000);
  }

  public update(time: any, delta: number): void {
    super.update(time, delta);

    this.hero.update(time, delta);
    // this.cameras.main.centerOnY(this.hero.y - TILE_SIZE * 4.5);

    if (this.hero.roomChange && this.rooms.length > 0) {
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
      .fadeOut(250, 0, 0, 0, (camera: Phaser.Cameras.Scene2D.Camera, progress: number) => {
        // Prevent Player to do anything
        this.hero.canInteract = false;
        // Pause all the physics events
        this.physics.pause();

        if (progress === 1) {
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
            .fadeIn(500, 0, 0, 0, (camera: Phaser.Cameras.Scene2D.Camera, progress: number) => {
              if (progress === 1) {
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
