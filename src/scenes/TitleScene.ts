import { MenuScene } from "@/scenes/MenuScene";
import { startNewGame } from "@/state/checkpoint";
import { TILE_SIZE } from "@/config/tiles";

/**
 * The first screen: continue the saved game or start a new one
 */
export class TitleScene extends MenuScene {
  public constructor() {
    super({
      active: false,
      visible: false,
      key: "title",
    });
  }

  public create(): void {
    super.create();

    const { width, height } = this.scale;

    this.add
      .text(width / 2, height * 0.25, "TORCH", {
        fontSize: `${TILE_SIZE * 3}px`,
      })
      .setOrigin(0.5);

    this.showMainMenu();

    this.cameras.main.fadeIn(500, 0, 0, 0);
  }

  private showMainMenu(): void {
    const save = this.getSaveManager().load();

    this.buildMenu(
      [
        {
          label: "Continue",
          detail: save ? formatSaveDate(save.savedAt) : "no saved game",
          enabled: save !== null,
          onSelect: () => this.continueGame(),
        },
        {
          label: "New Game",
          onSelect: () => (save ? this.showConfirm() : this.newGame()),
        },
      ],
      this.scale.height * 0.5
    );
  }

  /** A new game erases the save: ask before doing it ("Back" is selected first) */
  private showConfirm(): void {
    this.buildMenu(
      [
        {
          label: "Back",
          onSelect: () => this.showMainMenu(),
        },
        {
          label: "Erase the saved game",
          detail: "the game in the save will be lost",
          onSelect: () => this.newGame(),
        },
      ],
      this.scale.height * 0.5
    );
  }

  private continueGame(): void {
    const state = this.getGameState();

    if (!this.getSaveManager().loadInto(state)) {
      state.reset();
    }

    this.startGame();
  }

  private newGame(): void {
    startNewGame(this.getGameState(), this.getSaveManager());
    this.startGame();
  }

  private startGame(): void {
    this.scene.launch("main").launch("hud").stop();
  }
}

function formatSaveDate(iso: string): string {
  const date = new Date(iso);

  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}
