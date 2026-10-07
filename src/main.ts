import * as Phaser from "phaser";
import { PreloaderScene } from "@/scenes/PreloaderScene";
import { HandlerScene } from "@/scenes/HandlerScene";
import { MainScene } from "@/scenes/MainScene";
import { HUDScene } from "@/scenes/HUDScene";
import { InventoryScene } from "@/scenes/InventoryScene";

import { TILE_SIZE } from "@/config/tiles";

// Virtual resolution at 32-bit
const GAME_WIDTH = 480;
const GAME_HEIGHT = 270;

const config: Phaser.Types.Core.GameConfig = {
  title: "Torch",

  // WebGL garantisce le migliori prestazioni per shader, filtri e luci 32-bit  parent: "canvas",
  type: Phaser.WEBGL,
  backgroundColor: "#000000",
  version: "0.0.1",

  width: GAME_WIDTH,
  height: GAME_HEIGHT,

  // 1. RIDIMENSIONAMENTO E SCALE MANAGER
  scale: {
    parent: "canvas",
    // Adatta la tela allo schermo mantenendo l'aspetto 16:9
    mode: Phaser.Scale.FIT,
    // Centra la finestra di gioco nello schermo/browser
    autoCenter: Phaser.Scale.CENTER_BOTH,

    min: {
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
    },
    max: {
      width: GAME_WIDTH * 8, // Supporta schermi 4K senza sgranare in modo irregolare
      height: GAME_HEIGHT * 8,
    },
  },

  // 2. RENDERING PIXEL PERFECT (Impostazione cruciale per la Pixel Art)
  render: {
    clearBeforeRender: true,
    // Disattiva l'anti-aliasing (smooth interpolation) su tutte le texture
    pixelArt: true,
    // Disattiva l'anti-aliasing sul canvas WebGL
    antialias: false,
    // Arrotonda le posizioni degli sprite a interi per evitare sfocature durante il movimento/mira
    roundPixels: true,
  },
  scene: [PreloaderScene, HandlerScene, MainScene, HUDScene, InventoryScene],

  disableContextMenu: true,

  physics: {
    default: "arcade",
    arcade: {
      debug: false,
      gravity: {
        x: 0,
        y: TILE_SIZE * 32,
      },
      // Frequenza di aggiornamento della fisica
      fps: 60,
      // Mantiene il passo della fisica costante indipendentemente dai cali di frame
      fixedStep: true,
    },
  },
};

export default new Phaser.Game(config);
