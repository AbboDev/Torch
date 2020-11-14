import { Player } from 'Entities/Player';

import { ControllerKey } from 'Miscellaneous/Controller';

import { ControlScene } from 'Scenes/ControlScene';

import { TILE_SIZE } from 'Config/tiles';

export class Main extends ControlScene {
  private hero!: Player;
  private background!: Phaser.GameObjects.TileSprite;
  private blocks!: Phaser.Physics.Arcade.StaticGroup;

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
    this.load.tilemapTiledJSON('chozodia_map', "../assets/maps/chozodia.json");
  }

  public create(): void {
    super.create();

    this.background = this.add.tileSprite(
      0,
      0,
      this.sys.game.canvas.width,
      this.sys.game.canvas.height,
      'big'
    )
      .setOrigin(0, 0)
      .setAlpha(0.5);

    const map = this.make.tilemap({ key: 'chozodia_map' });

    // Parameters are the name you gave the tileset in Tiled and then the key of the tileset image in
    // Phaser's cache (i.e. the name you used in preload)
    const tileset = map.addTilesetImage('chozodia', 'chozodia_tiles');

    // Parameters: layer name (or index) from Tiled, tileset, x, y
    const belowLayer = map.createStaticLayer('Background', tileset, 0, 0);
    const worldLayer = map.createDynamicLayer('Collision', tileset, 0, 0);
    const aboveLayer = map.createStaticLayer('Frontground', tileset, 0, 0);

    aboveLayer.setDepth(1000);

    worldLayer.setCollisionByProperty({ collides: true });

    const debugGraphics = this.add.graphics().setAlpha(0.75);
    worldLayer.renderDebug(debugGraphics, {
      tileColor: null, // Color of non-colliding tiles
      collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255), // Color of colliding tiles
      faceColor: new Phaser.Display.Color(40, 39, 37, 255) // Color of colliding face edges
    });

    this.hero = new Player(
      this,
      TILE_SIZE * 2,
      this.sys.game.canvas.height - TILE_SIZE * 4
    );

    this.physics.add.collider(this.hero, worldLayer);
  }

  public update(time: any, delta: number): void {
    this.hero.update(time, delta);

    if (this.getController().isKeyPressedForFirstTime(ControllerKey.DEBUG)) {
      if (typeof this.physics.world.debugGraphic === 'undefined') {
        this.physics.world.createDebugGraphic();
        this.physics.world.drawDebug = true;
      } else {
        this.physics.world.drawDebug = !this.physics.world.drawDebug;
      }

      if (!this.physics.world.drawDebug) {
        this.physics.world.debugGraphic.clear();
      }
    }
  }
}
