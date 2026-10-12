import { describe, expect, it } from "vitest";
import { DEFAULT_BINDINGS } from "@/input/bindings";
import { parseInputSettings } from "@/input/inputSettings";

describe("the input settings", () => {
  it("fall back to the defaults when the storage is empty or corrupted", () => {
    expect(parseInputSettings(null).mode).toBe("keyboard");
    expect(parseInputSettings("{not json").bindings).toEqual(DEFAULT_BINDINGS);
    expect(
      parseInputSettings('{"mode":"vr","bindings":{"mouse":{"A":[1]}}}')
    ).toEqual(parseInputSettings(null));
  });

  it("keep what is valid and fill in the rest", () => {
    const settings = parseInputSettings(
      '{"mode":"gamepad","bindings":{"keyboard":{"A":["KeyK"]}}}'
    );

    expect(settings.mode).toBe("gamepad");
    expect(settings.bindings.keyboard.A).toEqual(["KeyK"]);
    expect(settings.bindings.keyboard.B).toEqual(["c"]);
  });
});
