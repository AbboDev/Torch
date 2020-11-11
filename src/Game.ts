import * as Phaser from 'phaser';

import { Preloader } from 'Scenes/Preloader';
import { Main } from 'Scenes/Main';

import { TILE_SIZE } from 'Config/tiles';

const config: Phaser.Types.Core.GameConfig = {
  title: 'Torch',
  type: Phaser.AUTO,
  parent: 'canvas',
  backgroundColor: '#000000',

  width: 640,
  height: 360,

  zoom: 2,

  scene: [
    Preloader,
    Main
  ],

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
