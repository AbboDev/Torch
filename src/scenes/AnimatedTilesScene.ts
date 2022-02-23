import * as AnimatedTiles from 'phaser-animated-tiles/dist/AnimatedTiles.js';

interface AnimatedTilesSceneSystem extends Phaser.Scenes.Systems {
  animatedTiles: AnimatedTiles
}

export abstract class AnimatedTilesScene extends Phaser.Scene {
  public sys!: AnimatedTilesSceneSystem;
  public animatedTiles!: AnimatedTiles;
}
