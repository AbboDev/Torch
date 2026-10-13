import { describe, expect, it, vi } from "vitest";
import { ControllerKey } from "@/input/ControllerKey";
import { InputSettingsStore } from "@/input/inputSettings";
import { Controller } from "@/miscellaneous/Controller";
import { MemoryStorage } from "@/state/SaveManager";

class FakeWindow {
  private listeners = new Map<string, Set<(event: any) => void>>();

  public addEventListener(type: string, listener: (event: any) => void) {
    const set = this.listeners.get(type) ?? new Set();

    this.listeners.set(type, set.add(listener));
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
}

/** A gamepad with these buttons held (by index) and this left stick */
const pad = (held: number[] = [], axes = [0, 0]) => ({
  connected: true,
  buttons: Array.from({ length: 16 }, (_, i) => ({
    pressed: held.includes(i),
  })),
  axes,
});

function setup() {
  const target = new FakeWindow();
  let pads: ReturnType<typeof pad>[] = [];
  let time = 0;
  const controller = new Controller(
    target,
    {},
    () => time,
    () => pads
  );

  return {
    target,
    controller,
    plug: (...next: ReturnType<typeof pad>[]) => (pads = next),
    at: (ms: number) => (time = ms),
  };
}

const C = ControllerKey;

describe("the modes of the Controller", () => {
  it("starts in keyboard mode and ignores the mouse", () => {
    const { target, controller } = setup();

    target.send("mousedown", { button: 0 });
    expect(controller.isKeyPressed(C.B)).toBe(false);

    target.send("keydown", { key: "c", code: "KeyC" });
    expect(controller.isKeyPressed(C.B)).toBe(true);
  });

  it("uses the mouse in keyboard + mouse mode, together with the keyboard", () => {
    const { target, controller } = setup();
    controller.setMode("keyboardMouse");

    const click = target.send("mousedown", { button: 2 });
    expect(controller.isKeyPressed(C.L)).toBe(true);
    expect(click.preventDefault).toHaveBeenCalled();

    target.send("mouseup", { button: 2 });
    expect(controller.isKeyPressed(C.L)).toBe(false);

    target.send("keydown", { key: "ArrowLeft", code: "ArrowLeft" });
    expect(controller.isKeyPressed(C.LEFT)).toBe(true);
  });

  it("uses only the gamepad in gamepad mode, and presses once per press", () => {
    const { target, controller, plug } = setup();
    controller.setMode("gamepad");
    plug(pad([0]));
    controller.update();

    expect(controller.isKeyPressed(C.A)).toBe(true);
    expect(controller.isKeyPressedForFirstTime(C.A)).toBe(true);
    expect(controller.isKeyPressedForFirstTime(C.A)).toBe(false);

    // the keyboard is ignored while a gamepad is there
    target.send("keydown", { key: "ArrowUp", code: "ArrowUp" });
    expect(controller.isKeyPressed(C.UP)).toBe(false);

    plug(pad([]));
    controller.update();
    expect(controller.isKeyPressed(C.A)).toBe(false);
  });

  it("falls back to the keyboard when no gamepad is connected", () => {
    const { target, controller } = setup();
    controller.setMode("gamepad");
    controller.update();

    target.send("keydown", { key: "Enter", code: "Enter" });
    expect(controller.isKeyPressed(C.START)).toBe(true);
  });

  it("lets go of what a disconnected gamepad was holding", () => {
    const { controller, plug } = setup();
    controller.setMode("gamepad");
    plug(pad([9]));
    controller.update();
    expect(controller.isKeyPressed(C.START)).toBe(true);

    plug();
    controller.update();
    expect(controller.isKeyPressed(C.START)).toBe(false);
  });

  it("lets go of everything when the mode changes", () => {
    const { target, controller } = setup();
    target.send("keydown", { key: "ArrowRight", code: "ArrowRight" });

    controller.setMode("gamepad");
    expect(controller.isKeyPressed(C.RIGHT)).toBe(false);
  });

  it("rebinds one device without touching the others", () => {
    const { controller } = setup();

    expect(controller.bind(C.A, "Pad3", "gamepad")).toEqual([C.Y]);
    expect(controller.getBindings("gamepad")[C.A]).toEqual(["Pad3"]);
    expect(controller.getBindings()[C.A]).toEqual(["x"]);
  });

  it("stores the mode and the bindings apart from the saves", () => {
    const backend = new MemoryStorage();
    const first = new Controller(new FakeWindow());
    first.onChange = () =>
      new InputSettingsStore(backend).save(first.getSettings());

    first.setMode("keyboardMouse");
    first.bind(C.A, "KeyK");

    const second = new Controller(new FakeWindow());
    second.applySettings(new InputSettingsStore(backend).load());

    expect(second.getMode()).toBe("keyboardMouse");
    expect(second.getBindings()[C.A]).toEqual(["KeyK"]);
    expect(backend.getItem("torch:save:0")).toBeNull();
  });
});

describe("the aim device", () => {
  it("is the mouse in keyboard + mouse mode, the stick in gamepad mode", () => {
    const { controller, plug } = setup();
    expect(controller.getAimDevice()).toBe("keyboard");

    controller.setMode("keyboardMouse");
    expect(controller.getAimDevice()).toBe("mouse");

    controller.setMode("gamepad");
    plug(pad());
    controller.update();
    expect(controller.getAimDevice()).toBe("gamepad");
  });

  it("is the keyboard in gamepad mode without a gamepad: it still works", () => {
    const { controller } = setup();
    controller.setMode("gamepad");
    controller.update();

    expect(controller.getAimDevice()).toBe("keyboard");
  });

  it("reads the right stick, and is at rest without a gamepad", () => {
    const { controller, plug } = setup();
    expect(controller.getAimStick()).toEqual({ x: 0, y: 0 });

    plug(pad([], [0, 0, 0.5, -0.75]));
    controller.update();
    expect(controller.getAimStick()).toEqual({ x: 0.5, y: -0.75 });
  });
});

describe("the gamepad seen by a menu", () => {
  it("tells if there is a gamepad and which buttons are held", () => {
    const { controller, plug } = setup();
    expect(controller.hasGamepad()).toBe(false);

    plug(pad([0, 5]));
    controller.update();

    expect(controller.hasGamepad()).toBe(true);
    expect(controller.getHeldPadCodes()).toEqual(["Pad0", "Pad5"]);
  });
});

describe("the reset combination", () => {
  /** Hold Shift + Backspace: the way out when the bindings are unusable */
  function holdKeyboardCombination(target: FakeWindow) {
    target.send("keydown", { key: "Shift", code: "ShiftLeft" });
    target.send("keydown", { key: "Backspace", code: "Backspace" });
  }

  it("resets the keys and goes back to the keyboard after two seconds", () => {
    const { target, controller, at } = setup();
    controller.setMode("gamepad");
    controller.bind(C.A, "KeyK");
    holdKeyboardCombination(target);

    at(0);
    controller.update();
    at(1999);
    controller.update();
    expect(controller.getBindings()[C.A]).toEqual(["KeyK"]);

    at(2000);
    controller.update();
    expect(controller.getBindings()[C.A]).toEqual(["x"]);
    expect(controller.getMode()).toBe("keyboard");
  });

  it("works once for every time the keys are held", () => {
    const { target, controller, at } = setup();
    holdKeyboardCombination(target);
    at(0);
    controller.update();
    at(2000);
    controller.update();

    controller.bind(C.A, "KeyK");
    at(9000);
    controller.update();
    expect(controller.getBindings()[C.A]).toEqual(["KeyK"]);
  });

  it("starts again from zero when the keys are let go", () => {
    const { target, controller, at } = setup();
    controller.bind(C.A, "KeyK");

    holdKeyboardCombination(target);
    at(0);
    controller.update();
    at(1500);
    target.send("keyup", { key: "Backspace", code: "Backspace" });
    controller.update();

    target.send("keydown", { key: "Backspace", code: "Backspace" });
    at(1600);
    controller.update();
    at(3100);
    controller.update();
    expect(controller.getBindings()[C.A]).toEqual(["KeyK"]);
  });

  it("is also on the gamepad (Select + Start), keeping the mode", () => {
    const { controller, plug, at } = setup();
    controller.setMode("gamepad");
    controller.bind(C.A, "Pad5", "gamepad");
    plug(pad([8, 9]));

    at(0);
    controller.update();
    at(2000);
    controller.update();

    expect(controller.getBindings("gamepad")[C.A]).toEqual(["Pad0"]);
    expect(controller.getMode()).toBe("gamepad");
  });

  it("counts every change, so a screen can refresh itself", () => {
    const { controller } = setup();
    const before = controller.getRevision();

    controller.bind(C.A, "KeyK");

    expect(controller.getRevision()).toBeGreaterThan(before);
  });
});
