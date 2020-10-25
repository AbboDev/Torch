import { Control } from '../miscellaneous/Control';

export class ControlScene extends Phaser.Scene {
  protected control!: Control;

  create(): void {
    this.control = new Control(this);
  }

  testKeyboard(key: string): boolean {
    key = key.charAt(0).toUpperCase() + key.slice(1);
    console.log(key);

    if (!this.control.hasOwnProperty(`key${key}`)) {
      return false;
    }

    return this.input
      .keyboard
      .checkDown(this.control[`key${key}` as keyof Control]);
  }
}
