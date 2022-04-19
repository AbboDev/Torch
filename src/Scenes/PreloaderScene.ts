import * as Phaser from 'phaser';
import { Player } from 'Entities/Player';
import {
  GunBullet,
  BowArrow,
  RifleBullet
} from 'Entities/Bullets';

export class PreloaderScene extends Phaser.Scene {
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
    // load assets declared in the preload config

    this.load
      .setBaseURL(window.location.href)
      .image('life', '/assets/sprites/life.png')
      .image('ammo', '/assets/sprites/ammo.png')
      .image('battery', '/assets/sprites/battery.png')
      .image('platform', 'assets/sprites/platform.png')
      .image('laboratory-back', [
        '/assets/images/backgrounds/laboratory/back.png',
        '/assets/images/backgrounds/laboratory/back_n.png'
      ])
      .image('laboratory-middle', [
        '/assets/images/backgrounds/laboratory/middle.png',
        '/assets/images/backgrounds/laboratory/middle_n.png'
      ])
      .image('laboratory-front', [
        '/assets/images/backgrounds/laboratory/front.png',
        '/assets/images/backgrounds/laboratory/front_n.png'
      ])
      .image('mountains-sky', [
        '/assets/images/backgrounds/mountains/sky.png',
        '/assets/images/backgrounds/mountains/sky_n.png'
      ])
      .image('mountains-mountain_far', [
        '/assets/images/backgrounds/mountains/mountain-far.png',
        '/assets/images/backgrounds/mountains/mountain-far_n.png'
      ])
      .image('mountains-mountains', [
        '/assets/images/backgrounds/mountains/mountains.png',
        '/assets/images/backgrounds/mountains/mountains_n.png'
      ])
      .image('mountains-trees', [
        '/assets/images/backgrounds/mountains/trees.png',
        '/assets/images/backgrounds/mountains/trees_n.png'
      ])
      .image('mountains-foreground_trees', [
        '/assets/images/backgrounds/mountains/foreground-trees.png',
        '/assets/images/backgrounds/mountains/foreground-trees_n.png'
      ])
      .image('chozodia_tiles', [
        '/assets/tilesets/chozodia.png',
        '/assets/tilesets/chozodia_n.png'
      ])
      .image('liquid_tiles', '/assets/tilesets/liquids.png')
      .image('full_liquid_tiles', '/assets/tilesets/full_liquids.png')
      .tilemapTiledJSON('chozodia_map', '../assets/maps/chozodia.json');

    Player.preload(this);
    GunBullet.preload(this);
    BowArrow.preload(this);
    RifleBullet.preload(this);

    // add the loading bar to use as a display for
    // the loading progress of the remainder of the assets
    this.add.image(this.scale.width / 2, this.scale.height / 2, 'barBg');

    const bar = this.add.sprite(
      this.scale.width / 2,
      this.scale.height / 2,
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
      mask.clear().fillRect(0, 0, bar.width * progress, bar.height);
    });
  }

  public create(): void {
    Player.create(this);

    this.scene
      .launch('gateway')
      .launch('inventory')
      .sleep('inventory')
      .launch('main')
      .launch('hud')
      .stop();
  }
}
