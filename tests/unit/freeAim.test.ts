import { describe, expect, it, vi } from "vitest";
import { AimCursorState } from "@/entities/player/aimAngles";
import { FreeAim } from "@/entities/player/FreeAim";
import { PlayerAim } from "@/entities/player/PlayerAim";
import { DirectionAxisX, DirectionAxisY } from "@/miscellaneous/Direction";

vi.mock("phaser", () => ({ Math: { Vector2: class Vector2 {} } }));

const { PI } = Math;

function setup(facingX: DirectionAxisX = DirectionAxisX.RIGHT) {
  const sources = {
    device: "mouse" as "keyboard" | "mouse" | "gamepad",
    pointer: { x: 0, y: 0 },
    stick: { x: 0, y: 0 },
    keys: { aim: false, up: false, down: false },
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
      keys: () => sources.keys,
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

describe("FreeAim with the keyboard", () => {
  const second = 1000;

  it("leaves the aim to the buttons while the aim key is up", () => {
    const { freeAim, aim, sources, cursor } = setup();
    sources.device = "keyboard";

    freeAim.update(aim, 16);

    expect(aim.freeAngle).toBeNull();
    expect(aim.isAdjustingAngle).toBe(false);
    expect(cursor.visible).toBe(false);
  });

  it("starts at the diagonal when the aim key goes down, and shows the cursor", () => {
    const { freeAim, aim, sources, cursor } = setup();
    sources.device = "keyboard";
    sources.keys = { aim: true, up: false, down: false };

    freeAim.update(aim, 0);

    expect(aim.freeAngle).toBeCloseTo(-PI / 4);
    expect(aim.isAdjustingAngle).toBe(true);
    expect(cursor.visible).toBe(true);
    expect(cursor.x).toBeGreaterThan(100);
    expect(cursor.y).toBeLessThan(100);
  });

  it("starts below with the down key, as the aim key always did", () => {
    const { freeAim, aim, sources } = setup();
    sources.device = "keyboard";
    sources.keys = { aim: true, up: false, down: true };

    freeAim.update(aim, 0);

    expect(aim.freeAngle).toBeCloseTo(PI / 4);
  });

  it("raises the angle with up and lowers it with down, while the aim key is held", () => {
    const { freeAim, aim, sources } = setup();
    sources.device = "keyboard";
    sources.keys = { aim: true, up: false, down: false };
    freeAim.update(aim, 0);

    // 0.3 s up from 45 degrees: 36 degrees more, so 81 above the horizon
    sources.keys = { aim: true, up: true, down: false };
    freeAim.update(aim, 0.3 * second);
    expect(aim.freeAngle).toBeCloseTo(-(PI / 4 + 0.3 * ((PI * 2) / 3)));

    sources.keys = { aim: true, up: false, down: true };
    freeAim.update(aim, 0.6 * second);
    expect(aim.freeAngle).toBeGreaterThan(-PI / 4);

    // the buttons do not move it when they are not held
    sources.keys = { aim: true, up: false, down: false };
    const held = aim.freeAngle;
    freeAim.update(aim, second);
    expect(aim.freeAngle).toBe(held);
  });

  it("aims to the side the Player looks at", () => {
    const { freeAim, aim, sources } = setup(DirectionAxisX.LEFT);
    sources.device = "keyboard";
    sources.keys = { aim: true, up: false, down: false };

    freeAim.update(aim, 0);

    expect(aim.freeAngle).toBeCloseTo((5 * PI) / 4);
    expect(aim.lookingX).toBe(DirectionAxisX.LEFT);
  });

  it("starts again at the diagonal after the aim key is let go", () => {
    const { freeAim, aim, sources } = setup();
    sources.device = "keyboard";
    sources.keys = { aim: true, up: true, down: false };
    freeAim.update(aim, second);

    sources.keys = { aim: false, up: false, down: false };
    freeAim.update(aim, 16);
    expect(aim.freeAngle).toBeNull();

    sources.keys = { aim: true, up: false, down: false };
    freeAim.update(aim, 0);
    expect(aim.freeAngle).toBeCloseTo(-PI / 4);
  });
});

describe("FreeAim when the Player does not aim freely", () => {
  it("does not aim while the Player looks at the front, as before", () => {
    const { freeAim, aim, sources, cursor } = setup(DirectionAxisX.CENTER);
    sources.device = "gamepad";
    sources.stick = { x: 1, y: 0 };

    freeAim.update(aim);

    expect(aim.freeAngle).toBeNull();
    expect(cursor.visible).toBe(false);
  });

  it("lets go of the angle of the mouse when the device changes", () => {
    const { freeAim, aim, sources } = setup();
    sources.pointer = { x: 100, y: 0 };
    freeAim.update(aim);
    expect(aim.freeAngle).not.toBeNull();

    sources.device = "keyboard";
    freeAim.update(aim, 16);

    expect(aim.freeAngle).toBeNull();
    expect(aim.freeSide).toBeNull();
  });
});
