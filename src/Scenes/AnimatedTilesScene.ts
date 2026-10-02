import * as Phaser from "phaser";
import type AnimatedTiles from "phaser-animated-tiles-2";

interface AnimatedTilesSceneSystem extends Phaser.Scenes.Systems {
  animatedTiles: AnimatedTiles;
}

export abstract class AnimatedTilesScene extends Phaser.Scene {
  declare public sys: AnimatedTilesSceneSystem;

  public animatedTiles!: AnimatedTiles;
}
