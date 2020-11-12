import * as Phaser from 'phaser';

import { Preloader } from 'Scenes/Preloader';
import { Main } from 'Scenes/Main';

import { TILE_SIZE } from 'Config/tiles';

const config: Phaser.Types.Core.GameConfig = {
  title: 'Torch',
  type: Phaser.AUTO,
  parent: 'canvas',
  backgroundColor: '#000000',

  width: TILE_SIZE * 40,
  height: TILE_SIZE * 20,

  zoom: 2,

  scene: [
    Preloader,
    Main
  ],

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
