const sceneConfig: Phaser.Types.Scenes.SettingsConfig = {
  active: true,
  visible: false,
  key: 'Game',
};

export class Main extends Phaser.Scene {
  private hero!: Phaser.Physics.Arcade.Sprite;

  constructor() {
    super(sceneConfig);
  }

  preload() {
    this.load.spritesheet('hero', '/assets/sprites/hero.png', {
      frameWidth: 20,
      frameHeight: 32
    });
  }

  create(): void {
    this.hero = this.physics.add.sprite(
      32,
      this.sys.game.canvas.height / 2,
      'hero'
    );
    this.hero.setOrigin(0, 0);

    this.physics.add.existing(this.hero);
  }

  update(): void {
    const cursorKeys: Phaser.Types.Input.Keyboard.CursorKeys =
      this.input.keyboard.createCursorKeys();
    const heroBody = this.hero.body as Phaser.Physics.Arcade.Body;

    if (cursorKeys.up!.isDown) {
      heroBody.setVelocityY(-500);
    } else if (cursorKeys.down!.isDown) {
      heroBody.setVelocityY(500);
    } else {
      heroBody.setVelocityY(0);
    }

    if (cursorKeys.right!.isDown) {
      heroBody.setVelocityX(500);
    } else if (cursorKeys.left!.isDown) {
      heroBody.setVelocityX(-500);
    } else {
      heroBody.setVelocityX(0);
    }
  }
}
