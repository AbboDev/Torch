export class Controller {
  private keyUp: Phaser.Input.Keyboard.Key;
  private keyDown: Phaser.Input.Keyboard.Key;
  private keyLeft: Phaser.Input.Keyboard.Key;
  private keyRight: Phaser.Input.Keyboard.Key;

  private keyA: Phaser.Input.Keyboard.Key;
  private keyB: Phaser.Input.Keyboard.Key;

  private keyX: Phaser.Input.Keyboard.Key;
  private keyY: Phaser.Input.Keyboard.Key;

  private keyL: Phaser.Input.Keyboard.Key;
  private keyR: Phaser.Input.Keyboard.Key;

  private keyStart: Phaser.Input.Keyboard.Key;
  private keySelect: Phaser.Input.Keyboard.Key;

  public constructor(protected scene: Phaser.Scene) {
    const keyboard = this.scene.input.keyboard;

    this.keyUp = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    this.keyDown = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    this.keyLeft = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
    this.keyRight = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);

    this.keyA = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.keyB = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);

    this.keyX = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C);
    this.keyY = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);

    this.keyL = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyR = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);

    this.keyStart = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.keySelect = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
  }
}
