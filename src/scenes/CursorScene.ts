import * as Phaser from "phaser";
import { ContinuousScene } from "@/scenes/ContinuousScene";

/**
 * The crosshair of the aim. It is a scene of its own, last in the list, so it
 * is drawn over every other scene. With the mouse (keyboard + mouse mode) it
 * follows the mouse, menus too, and takes the place of the system cursor. With
 * the gamepad it is the cursor the Player turns around itself with the right
 * stick, and with the keyboard the one of the fine aim button, only while the
 * game is running.
 */
export class CursorScene extends ContinuousScene {
  private crosshair!: Phaser.GameObjects.Graphics;

  /** Shows the target the aim is locked on */
  private lockMark!: Phaser.GameObjects.Graphics;

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

    this.crosshair = this.makeMarker(
      [
        [0, -8, 1, 5],
        [0, 3, 1, 5],
        [-8, 0, 5, 1],
        [3, 0, 5, 1],
        [0, 0, 1, 1],
      ],
      0xffffff
    );

    // Four corners around the target
    this.lockMark = this.makeMarker(
      [
        [-9, -9, 4, 1],
        [-9, -9, 1, 4],
        [6, -9, 4, 1],
        [9, -9, 1, 4],
        [-9, 8, 4, 1],
        [-9, 5, 1, 4],
        [6, 8, 4, 1],
        [9, 5, 1, 4],
      ],
      0xffdd44
    );

    this.input.on("pointermove", () => {
      this.hasMoved = true;
    });

    // The camera moves in the frame, after the update: place the cursor of the
    // gamepad again when it is known where it is, or it would trail behind
    this.events.on(Phaser.Scenes.Events.PRE_RENDER, () => this.place());

    const canvas = this.game.canvas;
    const showSystemCursor = () => {
      canvas.style.cursor = "";
    };
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, showSystemCursor);
    this.events.once(Phaser.Scenes.Events.DESTROY, showSystemCursor);
  }

  /**
   * A marker made of rectangles around (0, 0), each with a black edge to be
   * seen on any background; the edges first, so they stay below the color.
   */
  private makeMarker(
    parts: Array<[number, number, number, number]>,
    color: number
  ): Phaser.GameObjects.Graphics {
    const graphics = this.add.graphics();

    graphics.fillStyle(0x000000, 1);
    for (const [x, y, width, height] of parts) {
      graphics.fillRect(x - 1, y - 1, width + 2, height + 2);
    }

    graphics.fillStyle(color, 1);
    for (const [x, y, width, height] of parts) {
      graphics.fillRect(x, y, width, height);
    }

    return graphics.setVisible(false);
  }

  /** From the world to the screen: the camera of the game has a zoom */
  private toScreen(x: number, y: number): { x: number; y: number } {
    const camera = this.scene.get("main").cameras.main;

    return {
      x: Math.floor((x - camera.worldView.x) * camera.zoom),
      y: Math.floor((y - camera.worldView.y) * camera.zoom),
    };
  }

  public update(): void {
    this.place();
  }

  private place(): void {
    this.placeLock();

    const controller = this.getController();
    const device = controller.getAimDevice();
    const isMouse = device === "mouse";

    if (isMouse !== this.isShown) {
      this.isShown = isMouse;
      this.game.canvas.style.cursor = isMouse ? "none" : "";
    }

    if (isMouse) {
      // Whole pixels: the game is pixel art, a half pixel would blur the lines
      const pointer = this.input.activePointer;

      this.crosshair
        .setPosition(Math.floor(pointer.x), Math.floor(pointer.y))
        .setVisible(this.hasMoved);

      return;
    }

    const cursor = this.getAimCursor();
    const isRunning = this.scene.isActive("main");

    this.crosshair.setVisible(cursor.visible && isRunning);
    if (cursor.visible && isRunning) {
      const { x, y } = this.toScreen(cursor.x, cursor.y);

      this.crosshair.setPosition(x, y);
    }
  }

  /** The lock is shown with every device, the mouse too */
  private placeLock(): void {
    const { lock } = this.getAimCursor();
    const isShown = lock !== null && this.scene.isActive("main");

    this.lockMark.setVisible(isShown);
    if (lock && isShown) {
      const { x, y } = this.toScreen(lock.x, lock.y);

      this.lockMark.setPosition(x, y);
    }
  }
}
