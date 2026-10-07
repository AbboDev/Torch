import * as Phaser from "phaser";

export enum ControllerKey {
  UP = "Up",
  DOWN = "Down",
  LEFT = "Left",
  RIGHT = "Right",
  A = "A",
  B = "B",
  X = "X",
  Y = "Y",
  L = "L",
  START = "Start",
  SELECT = "Select",
  DEBUG = "Debug",
}

const KEY_CODES: Record<ControllerKey, number> = {
  [ControllerKey.UP]: Phaser.Input.Keyboard.KeyCodes.UP,
  [ControllerKey.DOWN]: Phaser.Input.Keyboard.KeyCodes.DOWN,
  [ControllerKey.LEFT]: Phaser.Input.Keyboard.KeyCodes.LEFT,
  [ControllerKey.RIGHT]: Phaser.Input.Keyboard.KeyCodes.RIGHT,
  [ControllerKey.A]: Phaser.Input.Keyboard.KeyCodes.X,
  [ControllerKey.B]: Phaser.Input.Keyboard.KeyCodes.C,
  [ControllerKey.X]: Phaser.Input.Keyboard.KeyCodes.Z,
  [ControllerKey.Y]: Phaser.Input.Keyboard.KeyCodes.S,
  [ControllerKey.L]: Phaser.Input.Keyboard.KeyCodes.A,
  [ControllerKey.START]: Phaser.Input.Keyboard.KeyCodes.ENTER,
  [ControllerKey.SELECT]: Phaser.Input.Keyboard.KeyCodes.SHIFT,
  [ControllerKey.DEBUG]: Phaser.Input.Keyboard.KeyCodes.BACK_SLASH,
};

export class Controller {
  private keys = new Map<ControllerKey, Phaser.Input.Keyboard.Key>();
  private pressed = new Set<ControllerKey>();
  private static instance: Controller;

  private constructor(protected scene: Phaser.Scene) {
    const { keyboard } = this.scene.input;
    if (!keyboard) {
      throw new Error("Keyboard input is unavailable");
    }

    for (const [key, code] of Object.entries(KEY_CODES) as [
      ControllerKey,
      number,
    ][]) {
      const input = keyboard.addKey(code);
      input.on("up", () => this.pressed.delete(key));
      this.keys.set(key, input);
    }
  }

  public static getInstance(scene: Phaser.Scene): Controller {
    if (!Controller.instance) {
      Controller.instance = new Controller(scene);
    }

    return Controller.instance;
  }

  public isKeyPressed(key: ControllerKey, duration?: number): boolean {
    const input = this.keys.get(key);
    if (!input) {
      return false;
    }

    if (duration) {
      const keyboard = this.scene.input.keyboard;
      return keyboard ? keyboard.checkDown(input, duration) : false;
    }

    return input.isDown;
  }

  public isKeyPressedForFirstTime(key: ControllerKey): boolean {
    if (!this.isKeyPressed(key) || this.pressed.has(key)) {
      return false;
    }

    this.pressed.add(key);
    return true;
  }

  public getKeyDuration(key: ControllerKey): number {
    const input = this.keys.get(key);
    return input ? input.getDuration() : 0;
  }
}
