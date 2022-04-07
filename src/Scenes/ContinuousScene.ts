import * as Phaser from 'phaser';
import {
  Controller,
  Inventory
} from 'Miscellaneous';
import { AnimatedTilesScene } from 'Scenes';

export abstract class ContinuousScene extends AnimatedTilesScene {
  /**
   * The Controller for handle all the user inputs
   *
   * @type {Controller}
   */
  private controller!: Controller;

  /**
   * The Controller for handle all the user inputs
   *
   * @type {Inventory}
   */
  private inventory!: Inventory;

  public create(): void {
    this.controller = Controller.getInstance(this);
    this.inventory = Inventory.getInstance();
  }

  public getController(): Controller {
    return this.controller;
  }

  public getInventory(): Inventory {
    return this.inventory;
  }

  public getWorldGravity(): Phaser.Math.Vector2 {
    return this.physics.world.gravity;
  }
}
