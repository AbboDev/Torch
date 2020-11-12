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
    this.load.image('chozodia', '/assets/tilesets/chozodia.png');
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

    const EMPTY_TILE = TILE_SIZE * 8 - 1;
    const WALL_TILE = TILE_SIZE * 2 + 4;
    const MIN_FLOOR_TILE = TILE_SIZE * 14 + 4;
    const MAX_FLOOR_TILE = TILE_SIZE * 14 + 8;

    const emptyRow = Array<number>(Math.floor(this.sys.game.canvas.width / TILE_SIZE))
      .fill(EMPTY_TILE);
    let emptyTable = Array<Array<number>>(Math.floor(this.sys.game.canvas.height / TILE_SIZE))
      .fill(emptyRow);

    let floor = Array<number>();

    const level = emptyTable.map((row, index, array) => {
      if (index === 0) {
        row = Array<number>(Math.floor(this.sys.game.canvas.width / TILE_SIZE))
      } else if (index === emptyTable.length - 2) {
        const random = Math.floor(Math.random() * (MAX_FLOOR_TILE - MIN_FLOOR_TILE + 1) + MIN_FLOOR_TILE);

        floor = row = Array<number>(Math.floor(this.sys.game.canvas.width / TILE_SIZE))
          .fill(random);
      } else if (index === emptyTable.length - 1) {
        console.log(index, array);
        row = floor.map((tile, i) => {
          if (i > 0 && i < row.length - 1) {
            console.log(tile)
            tile += TILE_SIZE;
          }

          return tile;
        });
      }

      row[0] = row[row.length - 1] = WALL_TILE;

      return row;
    });

    // When loading from an array, make sure to specify the tileWidth and tileHeight
    const map = this.make.tilemap({ data: level, tileWidth: 16, tileHeight: 16 });
    const tiles = map.addTilesetImage('chozodia');
    const layer = map.createStaticLayer(0, tiles, 0, 0);

    this.hero = new Player(this, TILE_SIZE * 2, this.sys.game.canvas.height);
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
