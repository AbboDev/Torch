import { describe, expect, it, vi } from "vitest";
import {
  BODY,
  PlayerBody,
  PlayerSprite,
  getBodyShape,
} from "@/entities/player/PlayerBody";
import { PositionRequest } from "@/entities/player/PositionRequest";

vi.mock("phaser", () => ({
  Geom: {
    Rectangle: class Rectangle {
      public constructor(
        public x: number,
        public y: number,
        public width: number,
        public height: number
      ) {}
    },
  },
}));

describe("PositionRequest", () => {
  it("has nothing to give when nobody asked", () => {
    const request = new PositionRequest();

    expect(request.isPending).toBe(false);
    expect(request.take()).toBeNull();
  });

  it("gives what was asked, once", () => {
    const request = new PositionRequest();

    request.set(null, 96);

    expect(request.isPending).toBe(true);
    expect(request.take()).toEqual({ x: null, y: 96 });
    expect(request.take()).toBeNull();
  });

  it("keeps the last value asked for each coordinate, and leaves the others", () => {
    const request = new PositionRequest();

    request.set(10, 20);
    request.set(null, 30);
    request.set(40, null);

    expect(request.take()).toEqual({ x: 40, y: 30 });
  });

  it("treats 0 as a position", () => {
    const request = new PositionRequest();

    request.set(0, 0);

    expect(request.take()).toEqual({ x: 0, y: 0 });
  });

  it("moves what was asked, but not what nobody asked for", () => {
    const request = new PositionRequest();
    request.set(null, 96);

    request.shift(8, 12);

    expect(request.take()).toEqual({ x: null, y: 108 });
  });

  it("does nothing when moving a request which was not made", () => {
    const request = new PositionRequest();

    request.shift(8, 12);
    request.set(null, 96);

    expect(request.take()).toEqual({ x: null, y: 96 });
  });
});

const sprite = { width: 32, height: 48, originX: 0.5, originY: 0 };

describe("getBodyShape", () => {
  it("puts the standing body at the bottom of the sprite", () => {
    expect(getBodyShape(false, sprite)).toEqual({
      offsetX: 8,
      offsetY: 16,
      width: BODY.width,
      height: BODY.height,
    });
  });

  it("makes the crouching body shorter and lower", () => {
    const shape = getBodyShape(true, sprite);

    expect(shape.height).toBe(24);
    expect(shape.offsetY).toBe(24);
    expect(shape.offsetY + shape.height).toBe(48);
  });
});

/** The part of a Phaser sprite and Arcade body which PlayerBody uses */
function fakeSprite() {
  const calls: string[] = [];
  const body = {
    x: 100,
    y: 200,
    width: 16,
    height: 32,
    offset: {
      x: 0,
      y: 0,
      clone: () => ({ x: body.offset.x, y: body.offset.y }),
    },
    setOffset(x: number, y: number) {
      body.offset.x = x;
      body.offset.y = y;
      calls.push(`offset ${x},${y}`);

      return body;
    },
    setSize(width: number, height: number, center: boolean) {
      body.width = width;
      body.height = height;
      calls.push(`size ${width},${height},${center}`);

      return body;
    },
    updateCenter: () => calls.push("center"),
  };

  const player = {
    ...sprite,
    body,
    getBounds: () => ({ left: 90, top: 150 }),
  } as unknown as PlayerSprite;

  return { player, body, calls };
}

describe("PlayerBody", () => {
  it("gives the body the standing shape", () => {
    const { player, body, calls } = fakeSprite();

    new PlayerBody(player).init();

    expect(calls).toEqual(["offset 8,16", "size 16,32,false"]);
    expect(body.height).toBe(32);
  });

  it("has the bounds of the body inside the sprite", () => {
    const { player } = fakeSprite();

    const bounds = new PlayerBody(player).getBounds();

    // the sprite is at 90, 150: the body is 8 px in and 16 px down
    expect(bounds).toMatchObject({ x: 98, y: 166, width: 16, height: 32 });
  });

  it("shrinks to crouch and grows back", () => {
    const { player, body } = fakeSprite();
    const shape = new PlayerBody(player);
    shape.init();

    shape.resize(true);
    expect(shape.isSmall).toBe(true);
    expect(body.height).toBe(24);
    expect(body.offset.y).toBe(24);

    shape.resize(false);
    expect(shape.isSmall).toBe(false);
    expect(body.height).toBe(32);
  });

  it("does nothing when the shape is already the right one", () => {
    const { player, calls } = fakeSprite();
    const shape = new PlayerBody(player);
    shape.init();
    calls.length = 0;

    shape.resize(false);

    expect(calls).toEqual([]);
  });

  it("puts the body where it was asked, only the coordinates asked", () => {
    const { player, body } = fakeSprite();
    const shape = new PlayerBody(player);

    shape.moveTo(null, 96);
    shape.applyRequestedPosition();
    expect(body).toMatchObject({ x: 100, y: 96 });

    // and only once
    body.y = 300;
    shape.applyRequestedPosition();
    expect(body.y).toBe(300);
  });

  it("keeps the place asked for when the body changes shape in the same frame", () => {
    const { player, body } = fakeSprite();
    const shape = new PlayerBody(player);
    shape.init();

    shape.moveTo(null, 96);
    // standing offset y is 16, crouching is 24: the corner moves down by 8
    shape.resize(true);
    shape.applyRequestedPosition();

    expect(body.y).toBe(96 + (16 - 24));
  });
});
