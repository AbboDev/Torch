import * as Phaser from 'phaser';

import { Preloader } from './scenes/Preloader';
import { Main } from './scenes/Main';

const config: Phaser.Types.Core.GameConfig = {
  title: 'Torch',
  type: Phaser.AUTO,
  parent: 'canvas',
  backgroundColor: '#AFAFAF',

  width: 960,
  height: 540,

  resolution: 1,
  zoom: 1,

  // scale: {
  //   width: window.innerWidth,
  //   height: window.innerHeight,
  // },

  scene: [
    Preloader,
    Main
  ],

  physics: {
    default: 'arcade',
    arcade: {
      debug: true,
      gravity: {
        y: 64
      }
    }
  }
};

export const game = new Phaser.Game(config);
