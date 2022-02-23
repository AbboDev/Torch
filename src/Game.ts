import * as Phaser from 'phaser';

import { Preloader } from 'Scenes/Preloader';
import { Main } from 'Scenes/Main';
import { HUD } from 'Scenes/HUD';
import { Inventory } from 'Scenes/Inventory';

import { TILE_SIZE } from 'Config/tiles';

import * as AnimatedTiles from 'phaser-animated-tiles/dist/AnimatedTiles.js';

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
  resolution: 1,

  scene: [
    Preloader,
    Main,
    HUD,
    Inventory
  ],

  plugins: {
    scene: [
      {
        key: 'AnimatedTiles',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        plugin: AnimatedTiles,
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
      height: TILE_SIZE * 11,
    }
  },

  disableContextMenu: true,

  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
      gravity: {
        y: TILE_SIZE * 32
      }
    }
  }
};

export const game = new Phaser.Game(config);
