import { Player } from 'Entities/Player';
import { GunBullet } from 'Entities/Bullets/GunBullet';
import { BowArrow } from 'Entities/Bullets/BowArrow';
import { RifleBullet } from 'Entities/Bullets/RifleBullet';

export class Preloader extends Phaser.Scene {
  public constructor() {
    super({
      key: 'preloader',
      pack: {
        files: [
          { type: 'image', key: 'bar', url: './assets/images/loadBar.png' },
          { type: 'image', key: 'barBg', url: './assets/images/barBg.png' }
        ]
      }
    });
  }

  public preload(): void {
    // add the loading bar to use as a display for
    // the loading progress of the remainder of the assets
    this.add.image(
      this.sys.canvas.width / 2,
      this.sys.canvas.height / 2,
      'barBg'
    );

    const bar = this.add.sprite(
      this.sys.canvas.width / 2,
      this.sys.canvas.height / 2,
      'bar'
    );

    const mask = this.make.graphics({
      x: bar.x - (bar.width / 2),
      y: bar.y - (bar.height / 2),
      add: false
    });

    mask.fillRect(0, 0, 0, bar.height);

    bar.mask = new Phaser.Display.Masks.GeometryMask(this, mask);

    this.load.on('progress', (progress: number) => {
      mask.clear();
      mask.fillRect(0, 0, bar.width * progress, bar.height);
    });

    // load assets declared in the preload config

    this.load.image('life', '/assets/sprites/life.png');
    this.load.image('ammo', '/assets/sprites/ammo.png');
    this.load.image('battery', '/assets/sprites/battery.png');

    Player.preload(this);
    GunBullet.preload(this);
    BowArrow.preload(this);
    RifleBullet.preload(this);
  }

  public create(): void {
    Player.create(this);

    this.scene.launch('main').launch('hud').stop();
  }
}
