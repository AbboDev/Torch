import { describe, expect, it } from "vitest";
import { Shootable, Shootables } from "@/world/shootables";

/** An enemy of 10 x 10 pixels at (x, y) */
const enemy = (id: string, x: number, y: number): Shootable => ({
  id,
  contains: (px, py) => px >= x && px < x + 10 && py >= y && py < y + 10,
  position: () => ({ x: x + 5, y: y + 5 }),
});

describe("Shootables", () => {
  it("finds nothing when it is empty", () => {
    expect(new Shootables().find(10, 10)).toBeNull();
  });

  it("finds the thing which is at the point", () => {
    const shootables = new Shootables();
    const first = enemy("first", 10, 10);
    shootables.add(first);
    shootables.add(enemy("second", 100, 10));

    expect(shootables.find(15, 15)).toBe(first);
    expect(shootables.find(105, 15)?.id).toBe("second");
    expect(shootables.find(50, 15)).toBeNull();
  });

  it("forgets a thing when it goes away", () => {
    const shootables = new Shootables();
    const remove = shootables.add(enemy("gone", 0, 0));
    expect(shootables.find(1, 1)?.id).toBe("gone");

    remove();

    expect(shootables.find(1, 1)).toBeNull();
  });
});

describe("Shootables: the positions", () => {
  it("tells where the things are, and leaves out the ones with none", () => {
    const shootables = new Shootables();
    shootables.add(enemy("a", 10, 10));
    shootables.add({ id: "gone", contains: () => false, position: () => null });
    shootables.add(enemy("b", 100, 20));

    expect(shootables.positions()).toEqual([
      { x: 15, y: 15 },
      { x: 105, y: 25 },
    ]);
  });
});
