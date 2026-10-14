import { describe, expect, it } from "vitest";
import { GameState } from "@/state/GameState";

/** What a save is after it has been written and read again */
const throughStorage = <T>(value: T): T => JSON.parse(JSON.stringify(value));

describe("GameState: the explored cells", () => {
  it("gives the same grid for a map every time, so it can be written to", () => {
    const state = new GameState();

    state.getExplored("chozodia", 10, 5).reveal(2, 1);

    expect(state.getExplored("chozodia", 10, 5).has(2, 1)).toBe(true);
  });

  it("keeps a grid for every map", () => {
    const state = new GameState();

    state.getExplored("a", 10, 5).reveal(2, 1);

    expect(state.getExplored("b", 10, 5).has(2, 1)).toBe(false);
  });

  it("is saved with the game and comes back", () => {
    const state = new GameState();
    state.getExplored("chozodia", 10, 5).revealRect(1, 1, 4, 3);
    const saved = throughStorage(state.snapshot());

    const loaded = new GameState();
    loaded.restore(saved);
    const grid = loaded.getExplored("chozodia", 10, 5);

    expect(grid.count()).toBe(6);
    expect(grid.has(3, 2)).toBe(true);
  });

  it("keeps what was saved for a map which is not in use now", () => {
    const state = new GameState();
    state.getExplored("other_map", 10, 5).reveal(4, 4);
    const loaded = new GameState();
    loaded.restore(throughStorage(state.snapshot()));

    // saved again without having visited "other_map"
    const again = new GameState();
    again.restore(throughStorage(loaded.snapshot()));

    expect(again.getExplored("other_map", 10, 5).has(4, 4)).toBe(true);
  });

  it("keeps the cells when the map has changed in size", () => {
    const state = new GameState();
    state.getExplored("chozodia", 10, 5).reveal(2, 1);
    const loaded = new GameState();
    loaded.restore(throughStorage(state.snapshot()));

    const grid = loaded.getExplored("chozodia", 20, 8);

    expect(grid.cols).toBe(20);
    expect(grid.has(2, 1)).toBe(true);
  });

  it("forgets everything with a new game", () => {
    const state = new GameState();
    state.getExplored("chozodia", 10, 5).reveal(2, 1);

    state.reset();

    expect(state.snapshot().world.explored).toEqual({});
    expect(state.getExplored("chozodia", 10, 5).count()).toBe(0);
  });

  it("loads the saves from before the minimap, and the wrong ones", () => {
    const old = new GameState();
    old.restore({ world: { visitedRooms: [], savePoint: null } } as never);
    expect(old.getExplored("chozodia", 10, 5).count()).toBe(0);

    for (const explored of ["text", 7, null, ["a"], { map: null }, { map: 3 }]) {
      const state = new GameState();
      state.restore({
        world: { visitedRooms: [], savePoint: null, explored },
      } as never);

      expect(state.getExplored("map", 10, 5).count()).toBe(0);
    }
  });
});
