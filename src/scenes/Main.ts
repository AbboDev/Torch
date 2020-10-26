const sceneConfig: Phaser.Types.Scenes.SettingsConfig = {
  active: true,
  visible: true,
  key: 'Game',
};

import { Player } from '../entities/Player';
import { ControlScene } from './ControlScene';

export class Main extends ControlScene {
  private hero!: Player;
  private background!: Phaser.GameObjects.TileSprite;

  constructor() {
    super(sceneConfig);
  }

  preload(): void {
    this.load.image('big', '/assets/sprites/tilemap.png');

    Player.preload(this);
  }

  create(): void {
    super.create();

    this.background = this.add.tileSprite(
      0,
      0,
      this.sys.game.canvas.width,
      this.sys.game.canvas.height,
      'big'
    )
      .setOrigin(0, 0);

    this.hero = new Player(this, 32, this.sys.game.canvas.height);
  }

  update(): void {
    this.hero.update();
  }
}
