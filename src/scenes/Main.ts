const sceneConfig: Phaser.Types.Scenes.SettingsConfig = {
  active: true,
  visible: true,
  key: 'Game',
};

import { Player } from '../entities/Player';

export class Main extends Phaser.Scene {
  private hero!: Player;
  private background!: Phaser.GameObjects.TileSprite;
  private isJumping = false;
  private isFacing!: any;

  constructor() {
    super(sceneConfig);

    this.isFacing = {
      x: 'front',
      y: null,
    }
  }

  preload(): void {
    this.load.image('big', '/assets/sprites/tilemap.png');

    Player.preload(this);
  }

  create(): void {
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
    const cursorKeys: Phaser.Types.Input.Keyboard.CursorKeys =
      this.input.keyboard.createCursorKeys();

    if (this.hero.body.onFloor()) {
      this.isJumping = false;

      if (cursorKeys.up!.isDown) {
        this.isJumping = true;
        this.hero.setVelocityY(-256);
      }
    }

    if (cursorKeys.right!.isDown) {
      this.isFacing.x = 'right';

      this.hero
        .setVelocityX(128)
        .play('hero_walk_right_animation', true);
    } else if (cursorKeys.left!.isDown) {
      this.isFacing.x = 'left';

      this.hero
        .setVelocityX(-128)
        .play('hero_walk_left_animation', true);
    } else {
      this.hero
        .setVelocityX(0)
        .play(`hero_idle_${this.isFacing.x}_animation`, true);
    }
  }
}
