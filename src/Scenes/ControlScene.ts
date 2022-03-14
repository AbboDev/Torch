import * as Phaser from 'phaser';
import { Controller } from 'Miscellaneous';
import { AnimatedTilesScene } from 'Scenes';

export abstract class ControlScene extends AnimatedTilesScene {
  /**
   * The Controller for handle all the user inputs
   *
   * @type {Controller}
   */
  private controller!: Controller;

  public create(): void {
    this.controller = Controller.getInstance(this);
  }

  public getController(): Controller {
    return this.controller;
  }

  public getWorldGravity(): Phaser.Math.Vector2 {
    return this.physics.world.gravity;
  }
}
