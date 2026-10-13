import { describe, expect, it } from "vitest";
import { firstEnabled, moveSelection } from "@/hud/menu";

const entries = (...enabled: boolean[]) =>
  enabled.map((value) => ({ enabled: value }));

describe("firstEnabled", () => {
  it("skips the disabled entries", () => {
    expect(firstEnabled(entries(false, true, true))).toBe(1);
    expect(firstEnabled(entries(true, true))).toBe(0);
  });

  it("falls back to the first entry if none can be selected", () => {
    expect(firstEnabled(entries(false, false))).toBe(0);
  });
});

describe("moveSelection", () => {
  it("moves down and up", () => {
    const list = entries(true, true, true);

    expect(moveSelection(list, 0, 1)).toBe(1);
    expect(moveSelection(list, 2, -1)).toBe(1);
  });

  it("goes round at both ends", () => {
    const list = entries(true, true, true);

    expect(moveSelection(list, 2, 1)).toBe(0);
    expect(moveSelection(list, 0, -1)).toBe(2);
  });

  it("skips the disabled entries", () => {
    const list = entries(true, false, true);

    expect(moveSelection(list, 0, 1)).toBe(2);
    expect(moveSelection(list, 2, -1)).toBe(0);
  });

  it("stays where it is when nothing else can be selected", () => {
    expect(moveSelection(entries(true, false), 0, 1)).toBe(0);
    expect(moveSelection(entries(false, false), 0, 1)).toBe(0);
    expect(moveSelection([], 0, 1)).toBe(0);
  });
});
