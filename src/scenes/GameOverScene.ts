import { MenuScene } from "@/scenes/MenuScene";
import { respawn } from "@/state/checkpoint";
import { TILE_SIZE } from "@/config/tiles";

/**
 * Shown over the game when the Player dies: go back to the last save point
 * or to the title screen
 */
export class GameOverScene extends MenuScene {
  protected inputDelay = 700;

  public constructor() {
    super({
      active: false,
      visible: false,
      key: "gameover",
    });
  }

  public create(): void {
    super.create();

    const { width, height } = this.scale;

    this.add.rectangle(0, 0, width, height, 0x000000, 0.85).setOrigin(0);

    this.add
      .text(width / 2, height * 0.3, "GAME OVER", {
        fontSize: `${TILE_SIZE * 3}px`,
        color: "#ff4444",
      })
      .setOrigin(0.5);

    const state = this.getGameState();
    const hasSave = this.getSaveManager().has(state.getActiveSlot());

    this.buildMenu(
      [
        {
          label: hasSave
            ? `Continue from the last save (slot ${state.getActiveSlot() + 1})`
            : "Try again",
          onSelect: () => this.restartGame(),
        },
        {
          label: "Title screen",
          onSelect: () => this.backToTitle(),
        },
      ],
      height * 0.55
    );
  }

  private restartGame(): void {
    respawn(this.getGameState(), this.getSaveManager());

    // The HUD and the inventory keep running: they follow the state
    this.scene.stop("main").launch("main").stop();
  }

  private backToTitle(): void {
    this.scene.stop("main").stop("hud").launch("title").stop();
  }
}
