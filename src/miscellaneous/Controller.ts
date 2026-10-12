import { ButtonState } from "@/input/ButtonState";
import { ControllerKey } from "@/input/ControllerKey";
import {
  DEFAULT_KEY_BINDINGS,
  KeyBindings,
  getButtonsOf,
} from "@/input/bindings";

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
 * It listens to the keyboard of the browser by itself: it belongs to the
 * game, not to a scene, so scenes can be started, stopped and restarted
 * without touching it. Which keys are which buttons is data (`bindings`),
 * ready for a screen to change them.
 */
export class Controller {
  private readonly state = new ButtonState<ControllerKey>();

  private bindings: KeyBindings;

  private readonly onKeyDown = (event: KeyboardEventLike): void => {
    const buttons = getButtonsOf(event, this.bindings);
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

  private readonly onKeyUp = (event: KeyboardEventLike): void => {
    for (const button of getButtonsOf(event, this.bindings)) {
      this.state.release(button);
    }
  };

  /** A key released while the window had no focus would stay down forever */
  private readonly onBlur = (): void => {
    this.state.releaseAll();
  };

  public constructor(
    private readonly target: KeyEventTarget,
    bindings: Partial<KeyBindings> = {},
    private readonly clock: () => number = () => performance.now()
  ) {
    this.bindings = { ...DEFAULT_KEY_BINDINGS, ...bindings };

    target.addEventListener("keydown", this.onKeyDown);
    target.addEventListener("keyup", this.onKeyUp);
    target.addEventListener("blur", this.onBlur);
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

  public getBindings(): KeyBindings {
    return this.bindings;
  }

  /** Choose the keyboard keys of a button */
  public setBinding(key: ControllerKey, keys: readonly string[]): void {
    this.bindings = { ...this.bindings, [key]: keys };
    this.state.release(key);
  }

  public resetBindings(): void {
    this.bindings = { ...DEFAULT_KEY_BINDINGS };
    this.state.releaseAll();
  }

  /** Stop listening to the keyboard */
  public destroy(): void {
    this.target.removeEventListener("keydown", this.onKeyDown);
    this.target.removeEventListener("keyup", this.onKeyUp);
    this.target.removeEventListener("blur", this.onBlur);
    this.state.releaseAll();
  }
}
