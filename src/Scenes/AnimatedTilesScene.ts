import * as Phaser from 'phaser';
import * as AnimatedTiles from 'phaser-animated-tiles/dist/AnimatedTiles';

interface AnimatedTilesSceneSystem extends Phaser.Scenes.Systems {
  animatedTiles: AnimatedTiles
}

export abstract class AnimatedTilesScene extends Phaser.Scene {
  declare public sys: AnimatedTilesSceneSystem;

  public animatedTiles!: AnimatedTiles;
}
