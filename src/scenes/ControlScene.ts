import { Controller, ControllerKey } from 'Miscellaneous/Controller';

export abstract class ControlScene extends Phaser.Scene {
  /**
   * The Controller for handle all the user inputs
   * @type {[type]}
   */
  private controller!: Controller;

  public create(): void {
    this.controller = new Controller(this);
  }

  public getController(): Controller {
    return this.controller;
  }

  public getWorldGravity(): Phaser.Math.Vector2 {
    return this.physics.world.gravity;
  }
}
