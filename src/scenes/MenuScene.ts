import * as Phaser from "phaser";
import { ControllerKey } from "@/miscellaneous/Controller";
import { ContinuousScene } from "@/scenes/ContinuousScene";
import { firstEnabled, moveSelection } from "@/hud/menu";
import { TILE_SIZE } from "@/config/tiles";

export interface MenuOptions {
  /** The distance between two items (default: 2.5 tiles) */
  spacing?: number;
  /** The item selected at first (default: the first one which is enabled) */
  selected?: number;
}

export interface MenuItem {
  label: string;
  /** A smaller text under the label, it may have more lines */
  detail?: string;
  /** A disabled item is grayed out and the cursor skips it (default: true) */
  enabled?: boolean;
  onSelect: () => void;
}

const COLORS = {
  normal: "#ffffff",
  selected: "#efc53f",
  disabled: "#666666",
  detail: "#999999",
};

/**
 * A list of items the Player chooses with Up, Down and A (or Start).
 * Subclasses draw what they want in `create()` and call `buildMenu()`.
 */
export abstract class MenuScene extends ContinuousScene {
  /** Milliseconds during which the buttons do nothing, so one held while the menu opens is not a choice */
  protected inputDelay = 0;

  private items: MenuItem[] = [];

  private labels: Phaser.GameObjects.Text[] = [];

  private details: Phaser.GameObjects.Text[] = [];

  private selected = 0;

  private readyAt = 0;

  /** An item has been chosen: the scene is about to change */
  private locked = false;

  /**
   * Show the items, replacing the ones already shown
   *
   * @param items   The items, from the top
   * @param firstY  The y coordinate of the first item
   * @param options Spacing and first selection
   */
  protected buildMenu(
    items: MenuItem[],
    firstY: number,
    options: MenuOptions = {}
  ): void {
    [...this.labels, ...this.details].forEach((text) => text.destroy());

    this.items = items;
    this.labels = [];
    this.details = [];
    this.locked = false;
    this.readyAt = Date.now() + this.inputDelay;

    const centerX = this.scale.width / 2;
    const spacing = options.spacing ?? TILE_SIZE * 2.5;

    items.forEach((item, index) => {
      const y = firstY + index * spacing;

      this.labels.push(
        this.add
          .text(centerX, y, item.label, { fontSize: `${TILE_SIZE}px` })
          .setOrigin(0.5)
      );

      this.details.push(
        this.add
          .text(centerX, y + TILE_SIZE, item.detail ?? "", {
            fontSize: "10px",
            color: COLORS.detail,
          })
          .setOrigin(0.5)
          .setAlign("center")
      );
    });

    const wanted = options.selected;
    this.select(
      wanted !== undefined && items[wanted]?.enabled !== false
        ? wanted
        : firstEnabled(this.entries())
    );
  }

  public update(): void {
    if (this.items.length === 0 || this.locked || Date.now() < this.readyAt) {
      return;
    }

    const controller = this.getController();

    if (controller.isKeyPressedForFirstTime(ControllerKey.UP)) {
      this.select(moveSelection(this.entries(), this.selected, -1));
    } else if (controller.isKeyPressedForFirstTime(ControllerKey.DOWN)) {
      this.select(moveSelection(this.entries(), this.selected, 1));
    } else if (
      controller.isKeyPressedForFirstTime(ControllerKey.A) ||
      controller.isKeyPressedForFirstTime(ControllerKey.START)
    ) {
      this.choose();
    }
  }

  private entries(): { enabled: boolean }[] {
    return this.items.map((item) => ({ enabled: item.enabled !== false }));
  }

  private select(index: number): void {
    this.selected = index;

    this.items.forEach((item, position) => {
      const color =
        item.enabled === false
          ? COLORS.disabled
          : position === index
            ? COLORS.selected
            : COLORS.normal;
      const marker = position === index && item.enabled !== false ? "> " : "";

      this.labels[position].setColor(color).setText(marker + item.label);
    });
  }

  private choose(): void {
    const item = this.items[this.selected];

    if (!item || item.enabled === false) {
      return;
    }

    this.locked = true;
    item.onSelect();
  }
}
