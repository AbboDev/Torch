import { Player } from 'Entities/Player';
import { TiledObject } from 'Entities/TiledObject';

import { MapScene } from 'Scenes/MapScene';

import { TILE_SIZE } from 'Config/tiles';

export class Main extends MapScene {
  private hero!: Player;

  constructor() {
    super({
      active: false,
      visible: false,
      key: 'main',
    });
  }

  public init(): void {
    console.clear();
  }

  public preload(): void {
    this.load.image('big', '/assets/sprites/tilemap.png');
    this.load.image('chozodia_tiles', '/assets/tilesets/chozodia.png');
    this.load.tilemapTiledJSON('chozodia_map', '../assets/maps/chozodia.json');
  }

  public create(): void {
    super.create();

    const map = this.make.tilemap({ key: 'chozodia_map' });

    const spawnPoint: TiledObject = map.findObject('objects', (obj) => {
      return obj.name === 'spawn_point'
    }) as TiledObject;

    // Parameters are the name you gave the tileset in Tiled and then the key of the tileset image in
    // Phaser's cache (i.e. the name you used in preload)
    const tileset = map.addTilesetImage('chozodia', 'chozodia_tiles');

    this.belowLayer = map.createStaticLayer('background', tileset, 0, 0)
      .setDepth(1);
    this.aboveLayer = map.createStaticLayer('frontground', tileset, 0, 0)
      .setDepth(1000);

    this.worldLayer = map.createDynamicLayer('collision', tileset, 0, 0)
      .setCollisionByProperty({ collides: true })
      .renderDebug(this.collisionDebugGraphics, {
        tileColor: null,
        collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255),
        faceColor: new Phaser.Display.Color(40, 39, 37, 255)
      });

    this.hero = new Player(this, spawnPoint.x, spawnPoint.y);

    this.physics.add.collider(this.hero, this.worldLayer);
  }

  public update(time: any, delta: number): void {
    super.update(time, delta);

    this.hero.update(time, delta);
  }
}
