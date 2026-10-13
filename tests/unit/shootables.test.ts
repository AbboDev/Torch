import { describe, expect, it } from "vitest";
import { Shootables } from "@/world/shootables";

describe("Shootables", () => {
  it("knows nothing is there when it is empty", () => {
    expect(new Shootables().isAt(10, 10)).toBe(false);
  });

  it("finds the thing which the probes find", () => {
    const shootables = new Shootables();
    shootables.add((x, y) => x >= 10 && x <= 20 && y >= 10 && y <= 20);

    expect(shootables.isAt(15, 15)).toBe(true);
    expect(shootables.isAt(30, 15)).toBe(false);
  });

  it("forgets a probe when its thing goes away", () => {
    const shootables = new Shootables();
    const remove = shootables.add(() => true);
    expect(shootables.isAt(0, 0)).toBe(true);

    remove();

    expect(shootables.isAt(0, 0)).toBe(false);
  });
});
