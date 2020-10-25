const sceneConfig: Phaser.Types.Scenes.SettingsConfig = {
  active: true,
  visible: true,
  key: 'Game',
};

export class Main extends Phaser.Scene {
  private hero!: Phaser.Physics.Arcade.Sprite;
  private background!: Phaser.GameObjects.TileSprite;
  private isJumping = false;
  private isFacing!: any;

  constructor() {
    super(sceneConfig);

    this.isFacing = {
      x: null,
      y: null,
    }
  }

  preload() {
    this.load.image('big', '/assets/sprites/big.png');

    const spriteSize: Phaser.Types.Loader.FileTypes.ImageFrameConfig = {
      frameWidth: 32,
      frameHeight: 48
    };

    this.load
      .spritesheet(
        'hero_idle',
        '/assets/sprites/hero_idle.png',
        spriteSize
      )
      .spritesheet(
        'hero_idle_left',
        '/assets/sprites/hero_idle_left.png',
        spriteSize
      )
      .spritesheet(
        'hero_idle_right',
        '/assets/sprites/hero_idle_right.png',
        spriteSize
      )
      .spritesheet(
        'hero_walk_left',
        '/assets/sprites/hero_walk_left.png',
        spriteSize
      )
      .spritesheet(
        'hero_walk_right',
        '/assets/sprites/hero_walk_right.png',
        spriteSize
      );
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

    this.hero = this.physics.add.sprite(
      32,
      this.sys.game.canvas.height,
      'hero_idle'
    );
    this.hero
      .setOrigin(0, 0)
      .setCollideWorldBounds(true)
      .setBounce(0);

    this.physics.world.enable(this.hero);

    this.anims.create({
      key: 'hero_idle',
      frames: this.anims.generateFrameNumbers('hero_idle', {}),
      frameRate: 20,
      repeat: -1
    });

    this.anims.create({
      key: 'hero_idle_left',
      frames: this.anims.generateFrameNumbers('hero_idle_left', {}),
      frameRate: 20,
      repeat: -1
    });

    this.anims.create({
      key: 'hero_idle_right',
      frames: this.anims.generateFrameNumbers('hero_idle_right', {}),
      frameRate: 20,
      repeat: -1
    });

    this.anims.create({
      key: 'hero_walk_left',
      frames: this.anims.generateFrameNumbers('hero_walk_left', {}),
      frameRate: 20,
      repeat: -1
    });

    this.anims.create({
      key: 'hero_walk_right',
      frames: this.anims.generateFrameNumbers('hero_walk_right', {}),
      frameRate: 20,
      repeat: -1
    });
  }

  update(): void {
    const cursorKeys: Phaser.Types.Input.Keyboard.CursorKeys =
      this.input.keyboard.createCursorKeys();
    const heroBody = this.hero.body as Phaser.Physics.Arcade.Body;

    if (heroBody.onFloor()) {
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
        .play('hero_walk_right', true);
    } else if (cursorKeys.left!.isDown) {
      this.isFacing.x = 'left';

      this.hero
        .setVelocityX(-128)
        .play('hero_walk_left', true);
    } else {
      this.hero
        .setVelocityX(0)
        .play(`hero_idle_${this.isFacing.x}`, true);
    }
  }
}
