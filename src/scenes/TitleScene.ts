import { MenuScene } from "@/scenes/MenuScene";
import { continueGame, startNewGame } from "@/state/checkpoint";
import { SLOT_COUNT } from "@/state/SaveManager";
import { describeSummary, listSlots } from "@/state/saveSummary";
import { TILE_SIZE } from "@/config/tiles";

/**
 * The first screen: choose one of the save slots, then continue the game in
 * it or, if it is empty, start a new one
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
      .text(width / 2, height * 0.13, "TORCH", {
        fontSize: `${TILE_SIZE * 3}px`,
      })
      .setOrigin(0.5);

    this.showSlots();

    this.cameras.main.fadeIn(500, 0, 0, 0);
  }

  /** The slots, each with what the game in it has reached */
  private showSlots(): void {
    const slots = listSlots(this.getSaveManager());

    this.buildMenu(
      slots.map(({ slot, summary }) => ({
        label: `Slot ${slot + 1}`,
        detail: summary ? describeSummary(summary) : "empty",
        onSelect: () =>
          summary
            ? this.showSlotChoices(slot, describeSummary(summary))
            : this.newGame(slot),
      })),
      this.scale.height * 0.38,
      {
        spacing: TILE_SIZE * 3,
        // Back from a game, the slot it was played in is the one to pick
        selected: Math.min(this.getGameState().getActiveSlot(), SLOT_COUNT - 1),
      }
    );
  }

  /**
   * A slot with a game in it: continue it, or erase it and start over (a
   * step of its own, so it is never done by mistake)
   */
  private showSlotChoices(slot: number, description: string): void {
    this.buildMenu(
      [
        {
          label: `Continue slot ${slot + 1}`,
          detail: description,
          onSelect: () => this.continue(slot),
        },
        {
          label: "Erase it and start over",
          detail: `the game in slot ${slot + 1} will be lost`,
          onSelect: () => this.newGame(slot),
        },
        {
          label: "Back",
          onSelect: () => this.showSlots(),
        },
      ],
      this.scale.height * 0.42,
      { spacing: TILE_SIZE * 2.8 }
    );
  }

  private continue(slot: number): void {
    continueGame(this.getGameState(), this.getSaveManager(), slot);
    this.startGame();
  }

  private newGame(slot: number): void {
    startNewGame(this.getGameState(), this.getSaveManager(), slot);
    this.startGame();
  }

  private startGame(): void {
    this.scene.launch("main").launch("hud").stop();
  }
}
