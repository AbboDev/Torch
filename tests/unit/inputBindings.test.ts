import { describe, expect, it } from "vitest";
import { ControllerKey } from "@/input/ControllerKey";
import {
  DEFAULT_BINDINGS,
  DEFAULT_KEY_BINDINGS,
  bindKey,
  sameKey,
} from "@/input/bindings";

const C = ControllerKey;

describe("default bindings of every device", () => {
  it("never give one key to two buttons", () => {
    for (const bindings of Object.values(DEFAULT_BINDINGS)) {
      const keys = Object.values(bindings)
        .flat()
        .map((key) => key.toLowerCase());

      expect(new Set(keys).size).toBe(keys.length);
    }
  });
});

describe("rebinding", () => {
  it("knows that KeyX, x and X are the same key", () => {
    expect(sameKey("KeyX", "x")).toBe(true);
    expect(sameKey("Digit5", "5")).toBe(true);
    expect(sameKey("KeyX", "KeyZ")).toBe(false);
  });

  it("takes the key from the button which had it and says which", () => {
    // "x" is Jump (A): giving KeyX to Dash (X) must not leave it on both
    const { bindings, stolenFrom } = bindKey(DEFAULT_KEY_BINDINGS, C.X, "KeyX");

    expect(bindings[C.X]).toEqual(["KeyX"]);
    expect(bindings[C.A]).toEqual([]);
    expect(stolenFrom).toEqual([C.A]);
    expect(DEFAULT_KEY_BINDINGS[C.A]).toEqual(["x"]);
  });

  it("changes nothing else when the key is free", () => {
    const { bindings, stolenFrom } = bindKey(
      DEFAULT_KEY_BINDINGS,
      C.A,
      "KeyK"
    );

    expect(bindings[C.A]).toEqual(["KeyK"]);
    expect(stolenFrom).toEqual([]);
  });
});
