import { Controller, ControllerKey } from 'Miscellaneous/Controller';

export class ControlScene extends Phaser.Scene {
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
