import { Controller } from 'Miscellaneous/Controller';

export abstract class ControlScene extends Phaser.Scene {
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
