import { ContinuousScene } from "@/scenes/ContinuousScene";
import { STAT_KEYS, StatKey } from "@/state/GameState";

/**
 * A scene which shows the player's stats and keeps them up to date
 */
export abstract class DataScene extends ContinuousScene {
  public create(): void {
    super.create();

    this.watchState("stat", (key, value) => {
      this.updateData(key, value);
    });

    // A save has been loaded (or a new game started): refresh everything
    this.watchState("restored", () => {
      for (const key of STAT_KEYS) {
        this.updateData(key, this.getGameState().get(key));
      }
    });
  }

  protected updateData(_key: StatKey, _value: number): void {}
}
