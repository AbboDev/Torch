import { describe, expect, it } from "vitest";
import { ControllerKey } from "@/input/ControllerKey";
import { DEFAULT_BINDINGS } from "@/input/bindings";
import { readGamepad } from "@/input/gamepad";

const C = ControllerKey;

/** A gamepad with these buttons held (by index) and this left stick */
const pad = (held: number[] = [], axes = [0, 0]) => ({
  connected: true,
  buttons: Array.from({ length: 16 }, (_, i) => ({
    pressed: held.includes(i),
  })),
  axes,
});

describe("readGamepad", () => {
  it("reads the buttons and the stick", () => {
    const down = readGamepad(pad([0, 14], [0.1, 0.9]), DEFAULT_BINDINGS.gamepad);

    expect([...down].sort()).toEqual([C.A, C.DOWN, C.LEFT].sort());
  });

  it("ignores a stick inside the dead zone", () => {
    const down = readGamepad(pad([], [0.3, -0.4]), DEFAULT_BINDINGS.gamepad);

    expect(down.size).toBe(0);
  });
});
