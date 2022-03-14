import * as Phaser from 'phaser';
import {
  Preloader,
  Controller,
  Main,
  HUD,
  Inventory
} from 'Scenes';

import { TILE_SIZE } from 'Config/tiles';

// eslint-disable-next-line no-console
console.clear();

const config: Phaser.Types.Core.GameConfig = {
  title: 'Torch',
  type: Phaser.WEBGL,
  parent: 'canvas',
  backgroundColor: '#000000',
  version: 'Dev',

  width: TILE_SIZE * 40,
  height: TILE_SIZE * 22,

  zoom: 1,

  scene: [
    Preloader,
    Controller,
    Main,
    HUD,
    Inventory
  ],

  plugins: {
    scene: [
      {
        key: 'AnimatedTiles',
        // eslint-disable-next-line global-require
        plugin: require('phaser-animated-tiles/dist/AnimatedTiles'),
        mapping: 'animatedTiles'
      }
    ]
  },

  scale: {
    parent: 'canvas',
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.NO_CENTER,

    min: {
      width: TILE_SIZE * 20,
      height: TILE_SIZE * 11
    }
  },

  disableContextMenu: true,

  physics: {
    default: 'arcade',
    arcade: {
      debug: true,
      gravity: {
        y: TILE_SIZE * 32
      }
    }
  }
};

export default new Phaser.Game(config);
