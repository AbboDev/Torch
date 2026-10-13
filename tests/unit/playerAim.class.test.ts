import { describe, expect, it, vi } from "vitest";
import { getShotPosition } from "@/entities/player/aim";
import { PlayerAim } from "@/entities/player/PlayerAim";
import {
  DirectionAxisX,
  DirectionAxisY,
  Facing,
} from "@/miscellaneous/Direction";

vi.mock("phaser", () => ({ Math: { Vector2: class Vector2 {} } }));

const none = { aim: false, up: false, down: false, left: false, right: false };

describe("PlayerAim", () => {
  it("starts looking at the front, aiming straight", () => {
    const aim = new PlayerAim();

    expect(aim.facing).toEqual({
      y: DirectionAxisY.MIDDLE,
      x: DirectionAxisX.CENTER,
    });
    expect(aim.facingForAim).toEqual(aim.facing);
    expect(aim.isAimingDiagonal).toBe(false);
  });

  it("tilts up with the up button and goes back to the middle", () => {
    const aim = new PlayerAim();

    aim.update({ ...none, up: true }, 0);
    expect(aim.facing.y).toBe(DirectionAxisY.UP);
    expect(aim.facingForAim.y).toBe(DirectionAxisY.UP);

    aim.update(none, 0);
    expect(aim.facing.y).toBe(DirectionAxisY.MIDDLE);
  });

  it("aims diagonally with the aim button, and remembers it", () => {
    const aim = new PlayerAim();

    aim.update({ ...none, aim: true }, 0);
    expect(aim.isAimingDiagonal).toBe(true);
    expect(aim.wasAimingDiagonal).toBe(false);

    aim.update({ ...none, aim: true }, 0);
    expect(aim.wasAimingDiagonal).toBe(true);
  });

  it("remembers where it was looking in the previous frame", () => {
    const aim = new PlayerAim();
    aim.facing.x = DirectionAxisX.LEFT;

    aim.remember();
    aim.facing.x = DirectionAxisX.RIGHT;

    expect(aim.previousFacing.x).toBe(DirectionAxisX.LEFT);
  });

  it("keeps the same facing objects, which the movement holds on to", () => {
    const aim = new PlayerAim();
    const { facing, facingForAim } = aim;

    aim.update({ ...none, up: true }, 0);
    aim.remember();

    expect(aim.facing).toBe(facing);
    expect(aim.facingForAim).toBe(facingForAim);
  });
});

// Player.getShotPosition() before it was a function
function original(
  bounds: { top: number; bottom: number; centerX: number },
  x: number,
  width: number,
  facingForAim: Facing,
  isAimingDiagonal: boolean
) {
  const SHOT_HEIGHT = 18;
  let w: number = bounds.centerX;
  let height: number = bounds.top + SHOT_HEIGHT;

  if (facingForAim.y !== DirectionAxisY.MIDDLE) {
    if (facingForAim.y === DirectionAxisY.UP) {
      height = bounds.top;
    } else if (isAimingDiagonal) {
      height = bounds.bottom - SHOT_HEIGHT;
    } else {
      height = bounds.bottom;
    }

    if (isAimingDiagonal) {
      w = x + (width / 2) * (facingForAim.x === DirectionAxisX.RIGHT ? 1 : -1);
    }
  }

  return { x: w, y: height };
}

describe("getShotPosition", () => {
  it("is the same as before for every way of aiming", () => {
    const bounds = { top: 100, bottom: 148, centerX: 216 };
    let count = 0;

    for (const y of Object.values(DirectionAxisY)) {
      for (const x of Object.values(DirectionAxisX)) {
        for (const diagonal of [false, true]) {
          const facingForAim: Facing = { x, y };

          expect(
            getShotPosition({
              ...bounds,
              x: 216,
              width: 32,
              facingForAim,
              isAimingDiagonal: diagonal,
              shotHeight: 18,
            })
          ).toEqual(original(bounds, 216, 32, facingForAim, diagonal));
          count++;
        }
      }
    }

    expect(count).toBe(18);
  });

  it("puts the bullet at the side of the Player when aiming diagonally", () => {
    const shot = getShotPosition({
      top: 100,
      bottom: 148,
      centerX: 216,
      x: 216,
      width: 32,
      facingForAim: { x: DirectionAxisX.LEFT, y: DirectionAxisY.UP },
      isAimingDiagonal: true,
      shotHeight: 18,
    });

    expect(shot).toEqual({ x: 200, y: 100 });
  });
});

describe("PlayerAim with a free aim", () => {
  const looking = (x: DirectionAxisX) => {
    const aim = new PlayerAim();
    aim.facing.x = x;
    aim.facingForAim.x = x;

    return aim;
  };

  it("takes the angle, and shows the closest of the eight directions", () => {
    const aim = looking(DirectionAxisX.RIGHT);

    aim.setFree(-Math.PI / 4, { x: 5, y: 5 });

    expect(aim.freeAngle).toBeCloseTo(-Math.PI / 4);
    expect(aim.freeTarget).toEqual({ x: 5, y: 5 });
    expect(aim.facing.y).toBe(DirectionAxisY.UP);
    expect(aim.facingForAim.y).toBe(DirectionAxisY.UP);
    expect(aim.isAimingDiagonal).toBe(true);
  });

  it("turns the sprite to the side of the aim, not the movement", () => {
    const aim = looking(DirectionAxisX.RIGHT);

    aim.setFree(Math.PI);

    expect(aim.lookingX).toBe(DirectionAxisX.LEFT);
    expect(aim.facingForAim.x).toBe(DirectionAxisX.LEFT);
    expect(aim.facing.x).toBe(DirectionAxisX.RIGHT);
  });

  it("goes back to the buttons with null", () => {
    const aim = looking(DirectionAxisX.RIGHT);
    aim.setFree(Math.PI, { x: 1, y: 1 });

    aim.setFree(null);

    expect(aim.freeAngle).toBeNull();
    expect(aim.freeTarget).toBeNull();
    expect(aim.lookingX).toBe(DirectionAxisX.RIGHT);
  });

  it("does nothing while the Player looks at the front", () => {
    const aim = new PlayerAim();

    aim.setFree(0);

    expect(aim.freeAngle).toBeNull();
    expect(aim.lookingX).toBe(DirectionAxisX.CENTER);
  });
});
