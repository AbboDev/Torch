import { Controller, ControllerKey } from '../miscellaneous/Controller';

export class ControlScene extends Phaser.Scene {
  protected control!: Controller;

  create(): void {
    this.control = new Controller(this);
  }

  getKey(key: ControllerKey): boolean | Phaser.Input.Keyboard.Key {
    if (!Object.values(ControllerKey).includes(key)) {
      return false;
    }

    return this.control[`key${key}` as keyof Controller];
  }

  isKeyPress(key: ControllerKey, duration?: number): boolean  {
    const input: boolean | Phaser.Input.Keyboard.Key = this.getKey(key);

    if (!input) {
      return false;
    }

    return this.input
      .keyboard
      .checkDown(input as Phaser.Input.Keyboard.Key, duration);
  }

  getKeyDuration(key: ControllerKey): number {
    const input: boolean | Phaser.Input.Keyboard.Key = this.getKey(key);

    if (!input) {
      return 0;
    }

    return (input as Phaser.Input.Keyboard.Key).getDuration();
  }

  getWorldGravity() {
    return this.physics.world.gravity;
  }
}
