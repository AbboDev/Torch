import * as Phaser from "phaser";
import { ContinuousScene } from "@/scenes/ContinuousScene";

/**
 * The crosshair which follows the mouse. It is a scene of its own, last in the
 * list, so it is drawn over every other scene (menus too). It shows only in
 * keyboard + mouse mode, and then it takes the place of the system cursor.
 */
export class CursorScene extends ContinuousScene {
  private crosshair!: Phaser.GameObjects.Graphics;

  private isShown = false;

  /** The mouse starts at (0, 0) until it is moved: do not draw it there */
  private hasMoved = false;

  public constructor() {
    super({
      active: false,
      visible: false,
      key: "cursor",
    });
  }

  public create(): void {
    super.create();

    // Four arms and a dot around (0, 0), each with a black edge to be seen on
    // any background; the edges first, so they stay below the white
    const parts: Array<[number, number, number, number]> = [
      [0, -8, 1, 5],
      [0, 3, 1, 5],
      [-8, 0, 5, 1],
      [3, 0, 5, 1],
      [0, 0, 1, 1],
    ];
    const graphics = this.add.graphics();

    graphics.fillStyle(0x000000, 1);
    for (const [x, y, width, height] of parts) {
      graphics.fillRect(x - 1, y - 1, width + 2, height + 2);
    }

    graphics.fillStyle(0xffffff, 1);
    for (const [x, y, width, height] of parts) {
      graphics.fillRect(x, y, width, height);
    }

    this.crosshair = graphics.setVisible(false);

    this.input.on("pointermove", () => {
      this.hasMoved = true;
    });

    const canvas = this.game.canvas;
    const showSystemCursor = () => {
      canvas.style.cursor = "";
    };
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, showSystemCursor);
    this.events.once(Phaser.Scenes.Events.DESTROY, showSystemCursor);
  }

  public update(): void {
    const show = this.getController().getMode() === "keyboardMouse";

    if (show !== this.isShown) {
      this.isShown = show;
      this.game.canvas.style.cursor = show ? "none" : "";
    }

    // Whole pixels: the game is pixel art, a half pixel would blur the lines
    const pointer = this.input.activePointer;

    this.crosshair
      .setPosition(Math.floor(pointer.x), Math.floor(pointer.y))
      .setVisible(show && this.hasMoved);
  }
}
