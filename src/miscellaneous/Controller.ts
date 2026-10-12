import { ButtonState } from "@/input/ButtonState";
import { ControllerKey } from "@/input/ControllerKey";
import {
  DEFAULT_BINDINGS,
  InputDevice,
  InputMode,
  KeyBindings,
  bindKey,
  getButtonsOf,
} from "@/input/bindings";
import { GamepadLike, readGamepad } from "@/input/gamepad";
import { InputSettings } from "@/input/inputSettings";

export { ControllerKey };

/** What the Controller needs from a keyboard event */
interface KeyboardEventLike {
  key: string;
  code: string;
  repeat: boolean;
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  target: unknown;
  preventDefault(): void;
}

/** What the Controller needs from a mouse event */
interface MouseEventLike {
  button: number;
  target: unknown;
  preventDefault(): void;
}

/** The connected gamepads, as `navigator.getGamepads()` gives them */
export type GamepadSource = () => ArrayLike<GamepadLike | null | undefined>;

const browserGamepads: GamepadSource = () => {
  try {
    return globalThis.navigator?.getGamepads?.() ?? [];
  } catch {
    return [];
  }
};

/** A mouse button, written as the keys are: "Mouse0", "Mouse2"... */
const mouseCode = (event: MouseEventLike) => {
  const code = `Mouse${event.button}`;

  return { key: code, code };
};

/** The part of `window` the Controller listens to */
export interface KeyEventTarget {
  addEventListener(type: string, listener: (event: any) => void): void;
  removeEventListener(type: string, listener: (event: any) => void): void;
}

/** A text field: the keys typed in it are not for the game */
function isTextField(target: unknown): boolean {
  const element = target as { tagName?: string; isContentEditable?: boolean };

  return (
    ["INPUT", "TEXTAREA", "SELECT"].includes(element?.tagName ?? "") ||
    element?.isContentEditable === true
  );
}

/**
 * All the user inputs, for every scene of the game.
 *
 * It listens to the keyboard and the mouse of the browser by itself: it
 * belongs to the game, not to a scene, so scenes can be started, stopped and
 * restarted without touching it. The gamepad has no events: `update()` reads
 * it once per frame. Which devices count depends on the `mode`; which keys
 * are which buttons is data (`bindings`, one set per device), ready for a
 * screen to change them.
 */
export class Controller {
  private readonly state = new ButtonState<ControllerKey>();

  private bindings: Record<InputDevice, KeyBindings>;

  private mode: InputMode = "keyboard";

  /** The gamepad in use, found by the last `update()` */
  private pad: GamepadLike | undefined;

  /** The buttons held by the gamepad: only these are released by it */
  private readonly padHeld = new Set<ControllerKey>();

  /** Called after the mode or the bindings change, to store them */
  public onChange?: () => void;

  /** The keyboard works, except in gamepad mode with a gamepad connected */
  private isKeyboardActive(): boolean {
    return this.mode !== "gamepad" || this.pad === undefined;
  }

  private readonly onKeyDown = (event: KeyboardEventLike): void => {
    if (!this.isKeyboardActive()) {
      return;
    }

    const buttons = getButtonsOf(event, this.bindings.keyboard);
    if (buttons.length === 0) {
      return;
    }

    // Do not scroll the page with the arrows, but leave alone the shortcuts
    // of the browser and the text fields
    const isShortcut = event.altKey || event.ctrlKey || event.metaKey;
    if (!isShortcut && !isTextField(event.target)) {
      event.preventDefault();
    }

    if (event.repeat) {
      return;
    }

    for (const button of buttons) {
      this.state.press(button, this.clock());
    }
  };

  // Releasing is always allowed: a key pressed before a change of mode
  // would stay down forever
  private readonly onKeyUp = (event: KeyboardEventLike): void => {
    for (const button of getButtonsOf(event, this.bindings.keyboard)) {
      this.state.release(button);
    }
  };

  private readonly onMouseDown = (event: MouseEventLike): void => {
    if (this.mode !== "keyboardMouse") {
      return;
    }

    const buttons = getButtonsOf(mouseCode(event), this.bindings.mouse);
    if (buttons.length === 0) {
      return;
    }

    // The middle button would start the scroll of the page
    if (!isTextField(event.target)) {
      event.preventDefault();
    }

    for (const button of buttons) {
      this.state.press(button, this.clock());
    }
  };

  private readonly onMouseUp = (event: MouseEventLike): void => {
    for (const button of getButtonsOf(mouseCode(event), this.bindings.mouse)) {
      this.state.release(button);
    }
  };

  /** A key released while the window had no focus would stay down forever */
  private readonly onBlur = (): void => {
    this.state.releaseAll();
    this.padHeld.clear();
  };

  public constructor(
    private readonly target: KeyEventTarget,
    bindings: Partial<KeyBindings> = {},
    private readonly clock: () => number = () => performance.now(),
    private readonly getPads: GamepadSource = browserGamepads
  ) {
    this.bindings = {
      ...DEFAULT_BINDINGS,
      keyboard: { ...DEFAULT_BINDINGS.keyboard, ...bindings },
    };

    target.addEventListener("keydown", this.onKeyDown);
    target.addEventListener("keyup", this.onKeyUp);
    target.addEventListener("mousedown", this.onMouseDown);
    target.addEventListener("mouseup", this.onMouseUp);
    target.addEventListener("blur", this.onBlur);
  }

  /** Read the gamepad: call it once per frame, before the scenes read the buttons */
  public update(): void {
    this.pad =
      Array.from(this.getPads()).find((pad) => pad?.connected) ?? undefined;

    const down =
      this.mode === "gamepad" && this.pad
        ? readGamepad(this.pad, this.bindings.gamepad)
        : new Set<ControllerKey>();

    for (const button of this.padHeld) {
      if (!down.has(button)) {
        this.padHeld.delete(button);
        this.state.release(button);
      }
    }

    for (const button of down) {
      if (!this.padHeld.has(button)) {
        this.padHeld.add(button);
        this.state.press(button, this.clock());
      }
    }
  }

  public getMode(): InputMode {
    return this.mode;
  }

  /** Choose which devices drive the game; whatever is held is let go */
  public setMode(mode: InputMode): void {
    if (mode === this.mode) {
      return;
    }

    this.mode = mode;
    this.padHeld.clear();
    this.state.releaseAll();
    this.onChange?.();
  }

  /** Mode and bindings, to be stored (see `InputSettingsStore`) */
  public getSettings(): InputSettings {
    return { mode: this.mode, bindings: this.bindings };
  }

  public applySettings(settings: InputSettings): void {
    this.mode = settings.mode;
    this.bindings = settings.bindings;
    this.padHeld.clear();
    this.state.releaseAll();
  }

  public isKeyPressed(key: ControllerKey): boolean {
    return this.state.isDown(key);
  }

  /** True once per press, then false until the button is released */
  public isKeyPressedForFirstTime(key: ControllerKey): boolean {
    return this.state.justPressed(key);
  }

  /** For how long the button has been down, in milliseconds */
  public getKeyDuration(key: ControllerKey): number {
    return this.state.duration(key, this.clock());
  }

  public getBindings(device: InputDevice = "keyboard"): KeyBindings {
    return this.bindings[device];
  }

  /** Choose the keys of a button, for the keyboard unless said otherwise */
  public setBinding(
    key: ControllerKey,
    keys: readonly string[],
    device: InputDevice = "keyboard"
  ): void {
    this.bindings = {
      ...this.bindings,
      [device]: { ...this.bindings[device], [key]: keys },
    };
    this.state.release(key);
    this.onChange?.();
  }

  /**
   * For a rebind screen: give a button the key just captured (an `event.code`,
   * "Mouse<n>" or "Pad<n>"). Returns the other buttons which lost that key.
   */
  public bind(
    key: ControllerKey,
    code: string,
    device: InputDevice = "keyboard"
  ): ControllerKey[] {
    const { bindings, stolenFrom } = bindKey(this.bindings[device], key, code);

    this.bindings = { ...this.bindings, [device]: bindings };
    this.state.releaseAll();
    this.onChange?.();

    return stolenFrom;
  }

  /** Back to the default keys of every device */
  public resetBindings(): void {
    this.bindings = { ...DEFAULT_BINDINGS };
    this.state.releaseAll();
    this.onChange?.();
  }

  /** Stop listening to the keyboard and the mouse */
  public destroy(): void {
    this.target.removeEventListener("keydown", this.onKeyDown);
    this.target.removeEventListener("keyup", this.onKeyUp);
    this.target.removeEventListener("mousedown", this.onMouseDown);
    this.target.removeEventListener("mouseup", this.onMouseUp);
    this.target.removeEventListener("blur", this.onBlur);
    this.state.releaseAll();
  }
}
