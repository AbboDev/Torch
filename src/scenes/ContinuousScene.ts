import * as Phaser from "phaser";
import { Controller } from "@/miscellaneous/Controller";
import { Inventory } from "@/miscellaneous/Inventory";
import { GameState, GameStateEvents } from "@/state/GameState";
import { SaveManager } from "@/state/SaveManager";

export abstract class ContinuousScene extends Phaser.Scene {
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

  /**
   * Everything the game remembers (stats, inventory, visited rooms...).
   * It is attached to the Game, not to this scene, so it survives restarts.
   */
  public getGameState(): GameState {
    return GameState.from(this.registry);
  }

  public getInventory(): Inventory {
    return this.getGameState().inventory;
  }

  public getSaveManager(): SaveManager {
    const key = "saveManager";
    let manager = this.registry.get(key) as SaveManager | undefined;
    if (!manager) {
      manager = new SaveManager();
      this.registry.set(key, manager);
    }

    return manager;
  }

  /**
   * Listen to the game state for as long as this scene is alive:
   * the listener is removed automatically when the scene shuts down,
   * so restarting a scene never stacks duplicated listeners.
   */
  protected watchState<K extends keyof GameStateEvents>(
    event: K,
    listener: (...args: GameStateEvents[K]) => void
  ): void {
    const unsubscribe = this.getGameState().events.on(event, listener);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, unsubscribe);
    this.events.once(Phaser.Scenes.Events.DESTROY, unsubscribe);
  }

  public getWorldGravity(): Phaser.Math.Vector2 {
    return this.physics.world.gravity;
  }
}
