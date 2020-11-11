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

    const wallLeft = this.physics.add.staticSprite(0, 0, 'big');

    wallLeft
      .setOrigin(0, 0)
      .setImmovable(true)
      .setScale(1, this.sys.game.canvas.height / wallLeft.height)
      .refreshBody();

    const wallRight = this.physics.add.staticSprite(this.sys.game.canvas.width - wallLeft.width, 0, 'big');

    wallRight
      .setOrigin(0, 0)
      .setImmovable(true)
      .setScale(1, this.sys.game.canvas.height / wallRight.height)
      .refreshBody();

    const walls = this.physics.add.staticGroup([wallLeft, wallRight]);

    this.hero = new Player(this, TILE_SIZE * 2, this.sys.game.canvas.height);

    this.physics.world.addCollider(this.hero, walls);
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
