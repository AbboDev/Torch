import { Control } from '../miscellaneous/Control';

export class ControlScene extends Phaser.Scene {
  protected control!: Control;

  create(): void {
    this.control = new Control(this);
  }

  getKey(key: string): boolean | Phaser.Input.Keyboard.Key {
    key = key.charAt(0).toUpperCase() + key.slice(1);

    if (!this.control.hasOwnProperty(`key${key}`)) {
      return false;
    }

    return this.control[`key${key}` as keyof Control];
  }

  isKeyPress(key: string, duration?: number): boolean  {
    const input: boolean | Phaser.Input.Keyboard.Key = this.getKey(key);

    if (!input) {
      return false;
    }

    return this.input
      .keyboard
      .checkDown(input as Phaser.Input.Keyboard.Key, duration);
  }

  getKeyDuration(key: string): number {
    const input: boolean | Phaser.Input.Keyboard.Key = this.getKey(key);

    if (!input) {
      return 0;
    }

    return (input as Phaser.Input.Keyboard.Key).getDuration();
  }
}
