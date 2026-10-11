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
