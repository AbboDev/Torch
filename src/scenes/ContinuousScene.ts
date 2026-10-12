import * as Phaser from "phaser";
import { Controller } from "@/miscellaneous/Controller";
import { Inventory } from "@/miscellaneous/Inventory";
import { GameState, GameStateEvents } from "@/state/GameState";
import { SaveManager } from "@/state/SaveManager";

export abstract class ContinuousScene extends Phaser.Scene {
  /**
   * Nothing is set up here any more: the Controller and the game state
   * belong to the game, not to a scene. Kept for the scenes which call it.
   */
  public create(): void {}

  /**
   * The Controller for handle all the user inputs. It belongs to the game, not
   * to a scene: it is created the first time anyone asks for it and lives as
   * long as the game does.
   */
  public getController(): Controller {
    let controller = this.registry.get("controller") as Controller | undefined;

    if (!controller) {
      controller = new Controller(window);
      this.registry.set("controller", controller);

      const created = controller;
      this.game.events.once(Phaser.Core.Events.DESTROY, () =>
        created.destroy()
      );
    }

    return controller;
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
