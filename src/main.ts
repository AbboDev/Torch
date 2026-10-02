import * as Phaser from "phaser";
import { PreloaderScene } from "@/scenes/PreloaderScene";
import { HandlerScene } from "@/scenes/HandlerScene";
import { MainScene } from "@/scenes/MainScene";
import { HUDScene } from "@/scenes/HUDScene";
import { InventoryScene } from "@/scenes/InventoryScene";

import { TILE_SIZE } from "@/config/tiles";

console.clear();

const config: Phaser.Types.Core.GameConfig = {
  title: "Torch",
  type: Phaser.WEBGL,
  parent: "canvas",
  backgroundColor: "#000000",
  version: "Dev",

  width: TILE_SIZE * 40,
  height: TILE_SIZE * 22,

  zoom: 1,
  render: {
    pixelArt: true,
  },

  scene: [PreloaderScene, HandlerScene, MainScene, HUDScene, InventoryScene],

  scale: {
    parent: "canvas",
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.NO_CENTER,

    min: {
      width: TILE_SIZE * 20,
      height: TILE_SIZE * 11,
    },
  },

  disableContextMenu: true,

  physics: {
    default: "arcade",
    arcade: {
      debug: false,
      gravity: {
        x: 0,
        y: TILE_SIZE * 32,
      },
    },
  },
};

export default new Phaser.Game(config);
