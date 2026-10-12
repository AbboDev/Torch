import { describe, expect, it, vi } from "vitest";
import { ButtonState } from "@/input/ButtonState";
import { ControllerKey } from "@/input/ControllerKey";
import {
  DEFAULT_KEY_BINDINGS,
  getButtonsOf,
  matchesBinding,
} from "@/input/bindings";
import { Controller } from "@/miscellaneous/Controller";

describe("ButtonState", () => {
  it("knows which buttons are down", () => {
    const state = new ButtonState<string>();

    state.press("a", 100);

    expect(state.isDown("a")).toBe(true);
    expect(state.isDown("b")).toBe(false);

    state.release("a");
    expect(state.isDown("a")).toBe(false);
  });

  it("tells a press only once", () => {
    const state = new ButtonState<string>();

    expect(state.justPressed("a")).toBe(false);

    state.press("a", 0);
    expect(state.justPressed("a")).toBe(true);
    expect(state.justPressed("a")).toBe(false);
  });

  it("does not use up the press when it is only asked about being down", () => {
    const state = new ButtonState<string>();

    state.press("a", 0);
    state.isDown("a");

    expect(state.justPressed("a")).toBe(true);
  });

  it("tells a new press after the button was released", () => {
    const state = new ButtonState<string>();

    state.press("a", 0);
    state.justPressed("a");
    state.release("a");
    state.press("a", 50);

    expect(state.justPressed("a")).toBe(true);
  });

  it("keeps the first time when pressed again while it is down", () => {
    const state = new ButtonState<string>();

    state.press("a", 100);
    state.press("a", 500);

    expect(state.duration("a", 600)).toBe(500);
  });

  it("says for how long a button has been down, and 0 when it is not", () => {
    const state = new ButtonState<string>();

    expect(state.duration("a", 1000)).toBe(0);

    state.press("a", 400);
    expect(state.duration("a", 1000)).toBe(600);

    state.release("a");
    expect(state.duration("a", 1000)).toBe(0);
  });

  it("releases everything", () => {
    const state = new ButtonState<string>();
    state.press("a", 0);
    state.press("b", 0);

    state.releaseAll();

    expect(state.isDown("a") || state.isDown("b")).toBe(false);
  });
});

describe("the default key bindings", () => {
  it("give every button a key", () => {
    for (const button of Object.values(ControllerKey)) {
      expect(DEFAULT_KEY_BINDINGS[button].length, button).toBeGreaterThan(0);
    }
  });

  it("do not give one key to two buttons", () => {
    const keys = Object.values(DEFAULT_KEY_BINDINGS)
      .flat()
      .map((key) => key.toLowerCase());

    expect(new Set(keys).size).toBe(keys.length);
  });

  it("find the button of a key, by its name or by its physical key", () => {
    expect(
      getButtonsOf({ key: "x", code: "KeyX" }, DEFAULT_KEY_BINDINGS)
    ).toEqual([ControllerKey.A]);
    // Shift makes the letter upper case
    expect(
      getButtonsOf({ key: "X", code: "KeyX" }, DEFAULT_KEY_BINDINGS)
    ).toEqual([ControllerKey.A]);
    // the backslash is written differently on other layouts: its code is the same
    expect(
      getButtonsOf({ key: "|", code: "Backslash" }, DEFAULT_KEY_BINDINGS)
    ).toEqual([ControllerKey.DEBUG]);
    expect(
      getButtonsOf({ key: "q", code: "KeyQ" }, DEFAULT_KEY_BINDINGS)
    ).toEqual([]);
  });

  it("match a binding", () => {
    expect(matchesBinding({ key: "Enter", code: "Enter" }, ["Enter"])).toBe(
      true
    );
    expect(matchesBinding({ key: "a", code: "KeyA" }, ["Enter"])).toBe(false);
  });
});

/** A window which records its listeners and sends events */
class FakeWindow {
  public listeners = new Map<string, Set<(event: any) => void>>();

  public addEventListener(type: string, listener: (event: any) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }

    this.listeners.get(type)!.add(listener);
  }

  public removeEventListener(type: string, listener: (event: any) => void) {
    this.listeners.get(type)?.delete(listener);
  }

  public send(type: string, event: Record<string, unknown> = {}) {
    const full = {
      key: "",
      code: "",
      repeat: false,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      target: {},
      preventDefault: vi.fn(),
      ...event,
    };

    this.listeners.get(type)?.forEach((listener) => listener(full));

    return full;
  }

  public count(): number {
    return [...this.listeners.values()].reduce((sum, set) => sum + set.size, 0);
  }
}

describe("Controller", () => {
  function setup() {
    const target = new FakeWindow();
    let time = 1000;
    const controller = new Controller(target, {}, () => time);

    return {
      target,
      controller,
      advance: (ms: number) => (time += ms),
    };
  }

  it("follows the keys of the keyboard", () => {
    const { target, controller } = setup();

    target.send("keydown", { key: "ArrowLeft", code: "ArrowLeft" });
    expect(controller.isKeyPressed(ControllerKey.LEFT)).toBe(true);
    expect(controller.isKeyPressed(ControllerKey.RIGHT)).toBe(false);

    target.send("keyup", { key: "ArrowLeft", code: "ArrowLeft" });
    expect(controller.isKeyPressed(ControllerKey.LEFT)).toBe(false);
  });

  it("tells a press once, and again after releasing the key", () => {
    const { target, controller } = setup();
    const enter = { key: "Enter", code: "Enter" };

    target.send("keydown", enter);
    expect(controller.isKeyPressedForFirstTime(ControllerKey.START)).toBe(true);
    expect(controller.isKeyPressedForFirstTime(ControllerKey.START)).toBe(
      false
    );

    // the key repeats while it is held down: still the same press
    target.send("keydown", { ...enter, repeat: true });
    expect(controller.isKeyPressedForFirstTime(ControllerKey.START)).toBe(
      false
    );

    target.send("keyup", enter);
    target.send("keydown", enter);
    expect(controller.isKeyPressedForFirstTime(ControllerKey.START)).toBe(true);
  });

  it("measures for how long a key has been down", () => {
    const { target, controller, advance } = setup();

    target.send("keydown", { key: "z", code: "KeyZ" });
    advance(60);

    expect(controller.getKeyDuration(ControllerKey.X)).toBe(60);
    expect(controller.getKeyDuration(ControllerKey.A)).toBe(0);
  });

  it("does not scroll the page with the arrows, but leaves the shortcuts alone", () => {
    const { target } = setup();

    const arrow = target.send("keydown", { key: "ArrowUp", code: "ArrowUp" });
    const other = target.send("keydown", { key: "q", code: "KeyQ" });
    const shortcut = target.send("keydown", {
      key: "x",
      code: "KeyX",
      ctrlKey: true,
    });
    const typing = target.send("keydown", {
      key: "x",
      code: "KeyX",
      target: { tagName: "INPUT" },
    });

    expect(arrow.preventDefault).toHaveBeenCalled();
    expect(other.preventDefault).not.toHaveBeenCalled();
    expect(shortcut.preventDefault).not.toHaveBeenCalled();
    expect(typing.preventDefault).not.toHaveBeenCalled();
  });

  it("releases every key when the window loses the focus", () => {
    const { target, controller } = setup();

    target.send("keydown", { key: "ArrowRight", code: "ArrowRight" });
    target.send("blur");

    expect(controller.isKeyPressed(ControllerKey.RIGHT)).toBe(false);
  });

  it("can have other keys for a button", () => {
    const { target, controller } = setup();

    controller.setBinding(ControllerKey.A, ["k"]);

    target.send("keydown", { key: "x", code: "KeyX" });
    expect(controller.isKeyPressed(ControllerKey.A)).toBe(false);

    target.send("keydown", { key: "k", code: "KeyK" });
    expect(controller.isKeyPressed(ControllerKey.A)).toBe(true);

    controller.resetBindings();
    expect(controller.getBindings()[ControllerKey.A]).toEqual(["x"]);
  });

  it("lets the bindings of a new Controller be chosen", () => {
    const target = new FakeWindow();
    const controller = new Controller(target, { [ControllerKey.B]: ["j"] });

    target.send("keydown", { key: "j", code: "KeyJ" });

    expect(controller.isKeyPressed(ControllerKey.B)).toBe(true);
    // the other buttons keep the default keys
    expect(controller.getBindings()[ControllerKey.A]).toEqual(["x"]);
  });

  it("stops listening when destroyed", () => {
    const { target, controller } = setup();
    expect(target.count()).toBe(3);

    target.send("keydown", { key: "ArrowUp", code: "ArrowUp" });
    controller.destroy();

    expect(target.count()).toBe(0);
    expect(controller.isKeyPressed(ControllerKey.UP)).toBe(false);
  });
});
