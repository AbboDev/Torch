import { describe, expect, it, vi } from "vitest";
import { AimCursorState } from "@/entities/player/aimAngles";
import { FreeAim } from "@/entities/player/FreeAim";
import { PlayerAim } from "@/entities/player/PlayerAim";
import { DirectionAxisX, DirectionAxisY } from "@/miscellaneous/Direction";

vi.mock("phaser", () => ({ Math: { Vector2: class Vector2 {} } }));

const { PI } = Math;

function setup(facingX: DirectionAxisX = DirectionAxisX.RIGHT) {
  const sources = {
    device: "mouse" as "mouse" | "gamepad" | null,
    pointer: { x: 0, y: 0 },
    stick: { x: 0, y: 0 },
  };
  const cursor: AimCursorState = { visible: false, x: 0, y: 0 };
  const aim = new PlayerAim();
  aim.facing.x = facingX;
  aim.facingForAim.x = facingX;

  const freeAim = new FreeAim(
    {
      device: () => sources.device,
      origin: () => ({ x: 100, y: 100 }),
      pointer: () => sources.pointer,
      stick: () => sources.stick,
    },
    cursor,
    64
  );

  return { freeAim, aim, sources, cursor };
}

describe("FreeAim with the mouse", () => {
  it("aims at the mouse, and keeps the point for the shots", () => {
    const { freeAim, aim, sources, cursor } = setup();
    sources.pointer = { x: 100, y: 0 };

    freeAim.update(aim);

    expect(aim.freeAngle).toBeCloseTo(-PI / 2);
    expect(aim.freeTarget).toEqual({ x: 100, y: 0 });
    expect(aim.facing.y).toBe(DirectionAxisY.UP);
    // the cursor of the mouse is drawn where the mouse is, not by the Player
    expect(cursor.visible).toBe(false);
  });

  it("looks to the side of the mouse while the movement keeps its own facing", () => {
    const { freeAim, aim, sources } = setup(DirectionAxisX.LEFT);
    sources.pointer = { x: 300, y: 100 };

    freeAim.update(aim);

    expect(aim.lookingX).toBe(DirectionAxisX.RIGHT);
    expect(aim.facing.x).toBe(DirectionAxisX.LEFT);
  });

  it("aims ahead when the mouse is on the Player", () => {
    const { freeAim, aim, sources } = setup(DirectionAxisX.LEFT);
    sources.pointer = { x: 100.5, y: 100 };

    freeAim.update(aim);

    expect(aim.freeAngle).toBeCloseTo(PI);
  });
});

describe("FreeAim with the right stick", () => {
  it("puts the cursor at a fixed distance, turning around the Player", () => {
    const { freeAim, aim, sources, cursor } = setup();
    sources.device = "gamepad";

    sources.stick = { x: 0, y: 1 };
    freeAim.update(aim);
    expect(aim.freeAngle).toBeCloseTo(PI / 2);
    expect(aim.freeTarget).toBeNull();
    expect(cursor.visible).toBe(true);
    expect(cursor.x).toBeCloseTo(100);
    expect(cursor.y).toBeCloseTo(164);

    // a half push is as far as a full one: only the direction counts
    sources.stick = { x: -0.5, y: 0 };
    freeAim.update(aim);
    expect(cursor.x).toBeCloseTo(36);
    expect(cursor.y).toBeCloseTo(100);
  });

  it("aims ahead, where the Player is going, when the stick is at rest", () => {
    const { freeAim, aim, sources, cursor } = setup(DirectionAxisX.LEFT);
    sources.device = "gamepad";
    // drift of the stick, inside the dead zone
    sources.stick = { x: 0.1, y: -0.1 };

    freeAim.update(aim);

    expect(aim.freeAngle).toBeCloseTo(PI);
    expect(cursor.visible).toBe(true);
    expect(cursor.x).toBeCloseTo(36);
    expect(cursor.y).toBeCloseTo(100);
  });
});

describe("FreeAim without a free device", () => {
  it("leaves the aim to the buttons", () => {
    const { freeAim, aim, sources, cursor } = setup();
    sources.pointer = { x: 100, y: 0 };
    freeAim.update(aim);

    sources.device = null;
    freeAim.update(aim);

    expect(aim.freeAngle).toBeNull();
    expect(aim.freeSide).toBeNull();
    expect(cursor.visible).toBe(false);
  });

  it("does not aim while the Player looks at the front, as before", () => {
    const { freeAim, aim, sources, cursor } = setup(DirectionAxisX.CENTER);
    sources.device = "gamepad";
    sources.stick = { x: 1, y: 0 };

    freeAim.update(aim);

    expect(aim.freeAngle).toBeNull();
    expect(cursor.visible).toBe(false);
  });
});
