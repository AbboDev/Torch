import * as Phaser from 'phaser';

import { Preloader } from './scenes/Preloader';
import { Main } from './scenes/Main';

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
      debug: true,
      gravity: {
        y: 256 + 128
      }
    }
  }
};

export const game = new Phaser.Game(config);
