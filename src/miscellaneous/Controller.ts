export enum ControllerKey {
  UP = 'Up',
  DOWN = 'Down',
  LEFT = 'Left',
  RIGHT = 'Right',
  A = 'A',
  B = 'B',
  X = 'X',
  Y = 'Y',
  L = 'L',
  R = 'R',
  START = 'Start',
  SELECT = 'Select',
  DEBUG = 'Debug',
}

export class Controller {
  public keyUp: Phaser.Input.Keyboard.Key;
  public isKeyUpPress = false;

  public keyDown: Phaser.Input.Keyboard.Key;
  public isKeyDownPress = false;

  public keyLeft: Phaser.Input.Keyboard.Key;
  public isKeyLeftPress = false;

  public keyRight: Phaser.Input.Keyboard.Key;
  public isKeyRightPress = false;

  public keyA: Phaser.Input.Keyboard.Key;
  public isKeyAPress = false;

  public keyB: Phaser.Input.Keyboard.Key;
  public isKeyBPress = false;

  public keyX: Phaser.Input.Keyboard.Key;
  public isKeyXPress = false;

  public keyY: Phaser.Input.Keyboard.Key;
  public isKeyYPress = false;

  public keyL: Phaser.Input.Keyboard.Key;
  public isKeyLPress = false;

  public keyR: Phaser.Input.Keyboard.Key;
  public isKeyRPress = false;

  public keyStart: Phaser.Input.Keyboard.Key;
  public isKeyStartPress = false;

  public keySelect: Phaser.Input.Keyboard.Key;
  public isKeySelectPress = false;

  public keyDebug: Phaser.Input.Keyboard.Key;
  public isKeyDebugPress = false;

  public constructor(protected scene: Phaser.Scene) {
    const keyboard = this.scene.input.keyboard;

    this.keyUp = keyboard
      .addKey(Phaser.Input.Keyboard.KeyCodes.UP)
      .on('up', () => {
        this.isKeyUpPress = false;
      });

    this.keyDown = keyboard
      .addKey(Phaser.Input.Keyboard.KeyCodes.DOWN)
      .on('up', () => {
        this.isKeyDownPress = false;
      });

    this.keyLeft = keyboard
      .addKey(Phaser.Input.Keyboard.KeyCodes.LEFT)
      .on('up', () => {
        this.isKeyLeftPress = false;
      });

    this.keyRight = keyboard
      .addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT)
      .on('up', () => {
        this.isKeyRightPress = false;
      });

    this.keyA = keyboard
      .addKey(Phaser.Input.Keyboard.KeyCodes.X)
      .on('up', () => {
        this.isKeyAPress = false;
      });

    this.keyB = keyboard
      .addKey(Phaser.Input.Keyboard.KeyCodes.C)
      .on('up', () => {
        this.isKeyBPress = false;
      });

    this.keyX = keyboard
      .addKey(Phaser.Input.Keyboard.KeyCodes.Z)
      .on('up', () => {
        this.isKeyXPress = false;
      });

    this.keyY = keyboard
      .addKey(Phaser.Input.Keyboard.KeyCodes.S)
      .on('up', () => {
        this.isKeyYPress = false;
      });

    this.keyL = keyboard
      .addKey(Phaser.Input.Keyboard.KeyCodes.A)
      .on('up', () => {
        this.isKeyLPress = false;
      });

    this.keyR = keyboard
      .addKey(Phaser.Input.Keyboard.KeyCodes.D)
      .on('up', () => {
        this.isKeyRPress = false;
      });

    this.keyStart = keyboard
      .addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)
      .on('up', () => {
        this.isKeyStartPress = false;
      });

    this.keySelect = keyboard
      .addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT)
      .on('up', () => {
        this.isKeySelectPress = false;
      });

    this.keyDebug = keyboard
      .addKey(Phaser.Input.Keyboard.KeyCodes.BACK_SLASH)
      .on('up', () => {
        this.isKeyDebugPress = false;
      });
  }

  /**
   * Retrive the key if exist from symbolic string, otherwise return false
   *
   * @param  {ControllerKey} key The requested key
   *
   * @return {boolean|Key}       The requested Key or false if not found
   */
  public getKey(key: ControllerKey): boolean | Phaser.Input.Keyboard.Key {
    if (!Object.values(ControllerKey).includes(key)) {
      return false;
    }

    const stringKey = `key${key}` as keyof Controller;

    if (this[stringKey] instanceof Phaser.Input.Keyboard.Key) {
      return this[stringKey] as Phaser.Input.Keyboard.Key;
    }

    return false;
  }

  /**
   * Test if the requested key is currently press
   *
   * @param  {ControllerKey} key      The requested key
   * @param  {number}        duration Eventualy test the duration of press
   *
   * @return {boolean}                The check if the key is press or not
   */
  public isKeyPressed(key: ControllerKey, duration?: number): boolean {
    const input: boolean | Phaser.Input.Keyboard.Key = this.getKey(key);

    if (!input) {
      return false;
    }

    if (duration) {
      return this.scene
        .input
        .keyboard
        .checkDown(input as Phaser.Input.Keyboard.Key, duration);
    } else {
      return (input as Phaser.Input.Keyboard.Key).isDown;
    }
  }

  /**
   * Test if the requested key is been pressed before
   * If not, then set it as pressed and return true
   *
   * @param  {ControllerKey} key The requested key
   *
   * @return {boolean}           The check if the key was not hold before
   */
  public isKeyPressedForFirstTime(key: ControllerKey): boolean {
    const input: boolean | Phaser.Input.Keyboard.Key = this.getKey(key);

    if (!input) {
      return false;
    }

    const stringKey = `isKey${key}Press` as keyof Controller;

    if (typeof this[stringKey] !== 'boolean') {
      return false;
    }

    if (!this.isKeyPressed(key)) {
      return false;
    }

    const currentValue = this[stringKey] as boolean;

    if (currentValue !== true) {
      (this[stringKey] as boolean) = true;
    }

    return this.isKeyPressed(key) && currentValue === false;
  }

  /**
   * Return the current press duration of a key
   *
   * @param  {ControllerKey} key The requested key
   *
   * @return {number}            The amount of time the key has been pressed
   */
  public getKeyDuration(key: ControllerKey): number {
    const input: boolean | Phaser.Input.Keyboard.Key = this.getKey(key);

    if (!input) {
      return 0;
    }

    return (input as Phaser.Input.Keyboard.Key).getDuration();
  }
}
