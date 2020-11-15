import * as Phaser from 'phaser';

import { Preloader } from 'Scenes/Preloader';
import { Main } from 'Scenes/Main';

import { TILE_SIZE } from 'Config/tiles';

console.clear();

const config: Phaser.Types.Core.GameConfig = {
  title: 'Torch',
  type: Phaser.AUTO,
  parent: 'canvas',
  backgroundColor: '#000000',
  version: 'Dev',

  width: TILE_SIZE * 40,
  height: TILE_SIZE * 22,

  zoom: 2,
  resolution: 2,

  scene: [
    Preloader,
    Main
  ],

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

export const game = new Phaser.Game(config);
