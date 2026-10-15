import { describe, expect, it, vi } from "vitest";
import {
  DARKNESS_VALUES,
  Darkness,
  getDamage,
  getDarkness,
  isCorrupted,
  isTorchOnly,
} from "@/world/darkness";

const room = (...properties: Array<[string, unknown]>) => ({
  id: 4,
  properties: properties.map(([name, value]) => ({ name, value })),
});

describe("the levels of darkness", () => {
  it("has a value of Tiled for every level", () => {
    expect(Object.values(DARKNESS_VALUES).sort()).toEqual(
      Object.values(Darkness).sort()
    );
  });

  it("lets see all the screen when the light is on or the room is a little shaded", () => {
    expect(isTorchOnly(Darkness.NONE)).toBe(false);
    expect(isTorchOnly(Darkness.SHADED)).toBe(false);
  });

  it("lets see only the light of the torch when the room is dark or corrupted", () => {
    expect(isTorchOnly(Darkness.DARK)).toBe(true);
    expect(isTorchOnly(Darkness.CORRUPTED_PARTIAL)).toBe(true);
    expect(isTorchOnly(Darkness.CORRUPTED_TOTAL)).toBe(true);
  });

  it("knows which levels are corrupted", () => {
    expect(isCorrupted(Darkness.DARK)).toBe(false);
    expect(isCorrupted(Darkness.CORRUPTED_PARTIAL)).toBe(true);
    expect(isCorrupted(Darkness.CORRUPTED_TOTAL)).toBe(true);
  });
});

describe("getDamage", () => {
  it("does not hurt in the zones which are not corrupted", () => {
    for (const level of [Darkness.NONE, Darkness.SHADED, Darkness.DARK]) {
      expect(getDamage(level, false)).toBe("none");
      expect(getDamage(level, true)).toBe("none");
    }
  });

  it("hurts a little in a partly corrupted zone, without the power-up", () => {
    expect(getDamage(Darkness.CORRUPTED_PARTIAL, false)).toBe("light");
    expect(getDamage(Darkness.CORRUPTED_PARTIAL, true)).toBe("none");
  });

  it("hurts a lot in a totally corrupted zone, and a little with the power-up", () => {
    expect(getDamage(Darkness.CORRUPTED_TOTAL, false)).toBe("heavy");
    expect(getDamage(Darkness.CORRUPTED_TOTAL, true)).toBe("little");
  });
});

describe("getDarkness", () => {
  it("is none with no property, and dark with only the color, as it always was", () => {
    expect(getDarkness(room())).toBe(Darkness.NONE);
    expect(getDarkness(room(["dark", "000000"]))).toBe(Darkness.DARK);
    expect(getDarkness(room(["dark", ""]))).toBe(Darkness.NONE);
    expect(getDarkness({ id: 1 })).toBe(Darkness.NONE);
  });

  it("reads every level by its name", () => {
    for (const [name, level] of Object.entries(DARKNESS_VALUES)) {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

      // the color is there for all but "none", so nothing is said
      const properties: Array<[string, unknown]> =
        name === "none"
          ? [["darkness", name]]
          : [["dark", "202020"], ["darkness", name]];

      expect(getDarkness(room(...properties))).toBe(level);
      expect(warn).not.toHaveBeenCalled();
      warn.mockRestore();
    }
  });

  it("takes the name before the color", () => {
    expect(getDarkness(room(["dark", "808080"], ["darkness", "shaded"]))).toBe(
      Darkness.SHADED
    );
  });

  it("warns about a name which does not exist, and goes by the color", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(getDarkness(room(["dark", "000000"], ["darkness", "black"]))).toBe(
      Darkness.DARK
    );
    expect(getDarkness(room(["darkness", 3]))).toBe(Darkness.NONE);
    expect(warn).toHaveBeenCalledTimes(2);
    warn.mockRestore();
  });

  it("warns when the level and the color do not go together", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    // a level with no color: the light of the game does not change
    expect(getDarkness(room(["darkness", "corrupted_total"]))).toBe(
      Darkness.CORRUPTED_TOTAL
    );
    // no darkness with a color: the game is dark
    expect(getDarkness(room(["dark", "000000"], ["darkness", "none"]))).toBe(
      Darkness.NONE
    );
    expect(warn).toHaveBeenCalledTimes(2);
    warn.mockRestore();
  });
});
