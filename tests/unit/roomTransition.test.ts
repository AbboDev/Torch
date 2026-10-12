import { describe, expect, it, vi } from "vitest";
import {
  MAX_SCROLL_DURATION,
  MIN_SCROLL_DURATION,
  getScrollDuration,
  toBounds,
  unionBounds,
} from "@/world/scroll";
import {
  RoomTransition,
  TransitionCamera,
  TransitionHost,
  TransitionTweenConfig,
} from "@/world/RoomTransition";

describe("scroll numbers", () => {
  it("takes at least the minimum and at most the maximum duration", () => {
    expect(getScrollDuration(0)).toBe(MIN_SCROLL_DURATION);
    expect(getScrollDuration(10)).toBe(MIN_SCROLL_DURATION);
    expect(getScrollDuration(100000)).toBe(MAX_SCROLL_DURATION);
  });

  it("takes longer for a longer scroll", () => {
    expect(getScrollDuration(400)).toBeGreaterThan(getScrollDuration(300));
  });

  it("makes bounds from a room, with 0 for what is missing", () => {
    expect(toBounds({ x: 5, width: 10 })).toEqual({
      x: 5,
      y: 0,
      width: 10,
      height: 0,
    });
  });

  it("joins two rooms in the smallest rectangle containing them", () => {
    const start = { x: 448, y: 0, width: 1280, height: 320 };
    const left = { x: 0, y: 144, width: 448, height: 176 };

    expect(unionBounds(start, left)).toEqual({
      x: 0,
      y: 0,
      width: 1728,
      height: 320,
    });
  });
});

/**
 * A camera which limits the scroll to its bounds like Phaser's one does
 * (the view is 320 x 176 world pixels, as the game at zoom 2)
 */
class FakeCamera implements TransitionCamera {
  public scrollX = 0;
  public scrollY = 0;
  public bounds = { x: 0, y: 0, width: 0, height: 0 };
  public following = true;
  public history: string[] = [];

  private static VIEW_WIDTH = 320;
  private static VIEW_HEIGHT = 176;

  public setBounds(x: number, y: number, width: number, height: number): this {
    this.bounds = { x, y, width, height };
    this.history.push(`bounds ${x},${y},${width},${height}`);
    this.scrollX = this.clamp(this.scrollX, x, width, FakeCamera.VIEW_WIDTH);
    this.scrollY = this.clamp(this.scrollY, y, height, FakeCamera.VIEW_HEIGHT);

    return this;
  }

  public centerOn(x: number, y: number): this {
    const { bounds } = this;
    this.scrollX = this.clamp(
      x - FakeCamera.VIEW_WIDTH / 2,
      bounds.x,
      bounds.width,
      FakeCamera.VIEW_WIDTH
    );
    this.scrollY = this.clamp(
      y - FakeCamera.VIEW_HEIGHT / 2,
      bounds.y,
      bounds.height,
      FakeCamera.VIEW_HEIGHT
    );

    return this;
  }

  public stopFollow(): this {
    this.following = false;
    this.history.push("stopFollow");

    return this;
  }

  private clamp(value: number, min: number, size: number, view: number) {
    return Math.min(Math.max(value, min), Math.max(min, min + size - view));
  }
}

function setup(focus = { x: 500, y: 100 }) {
  const camera = new FakeCamera();
  const events: string[] = [];
  const tweens: TransitionTweenConfig[] = [];

  const host: TransitionHost = {
    camera,
    addTween: (config) => tweens.push(config),
    getFocus: () => focus,
    freeze: () => events.push("freeze"),
    unfreeze: () => events.push("unfreeze"),
    // Phaser's startFollow centers the camera on the target at once
    follow: () => {
      camera.following = true;
      camera.centerOn(focus.x, focus.y);
      events.push("follow");
    },
  };

  return { camera, events, tweens, transition: new RoomTransition(host) };
}

// The rooms of the map: the Player goes from the start room to the left one
const start = { x: 448, y: 0, width: 1280, height: 320 };
const left = { x: 0, y: 144, width: 448, height: 176 };

describe("RoomTransition", () => {
  it("freezes the game and scrolls the camera to the new room", () => {
    const { camera, events, tweens, transition } = setup({ x: 440, y: 250 });
    camera.setBounds(start.x, start.y, start.width, start.height);
    camera.scrollX = 448;
    camera.scrollY = 120;

    expect(transition.start(start, left)).toBe(true);

    expect(events).toEqual(["freeze"]);
    expect(transition.isRunning).toBe(true);
    expect(camera.following).toBe(false);

    // It arrives centered on the Player, as far as the new room allows
    expect(tweens).toHaveLength(1);
    // centered would be 280 (440 - 320 / 2), but the room is 448 wide
    expect(tweens[0].scrollX).toBe(128);
    // and exactly as high as the view: it cannot scroll vertically
    expect(tweens[0].scrollY).toBe(144);

    // and starts from where it was, with no jump
    expect(camera.scrollX).toBe(448);
    expect(camera.scrollY).toBe(120);
  });

  it("lets the camera go anywhere in the two rooms while it scrolls", () => {
    const { camera, transition } = setup({ x: 440, y: 250 });
    camera.setBounds(start.x, start.y, start.width, start.height);
    camera.scrollX = 448;
    camera.scrollY = 120;

    transition.start(start, left);

    expect(camera.bounds).toEqual({ x: 0, y: 0, width: 1728, height: 320 });
  });

  it("limits the camera to the new room and gives back the control at the end", () => {
    const { camera, events, tweens, transition } = setup({ x: 440, y: 250 });
    camera.setBounds(start.x, start.y, start.width, start.height);

    transition.start(start, left);
    tweens[0].onComplete();

    expect(camera.bounds).toEqual(left);
    expect(events).toEqual(["freeze", "follow", "unfreeze"]);
    expect(camera.following).toBe(true);
    expect(transition.isRunning).toBe(false);
  });

  it("does not jump when the Player takes control again", () => {
    const { camera, tweens, transition } = setup({ x: 440, y: 250 });
    camera.setBounds(start.x, start.y, start.width, start.height);
    camera.scrollX = 448;
    camera.scrollY = 120;

    transition.start(start, left);
    // the camera has arrived where the tween was taking it
    camera.scrollX = tweens[0].scrollX;
    camera.scrollY = tweens[0].scrollY;
    tweens[0].onComplete();

    expect(camera.scrollX).toBe(tweens[0].scrollX);
    expect(camera.scrollY).toBe(tweens[0].scrollY);
  });

  it("tells when the scroll starts, with its duration", () => {
    const { camera, tweens, transition } = setup({ x: 440, y: 250 });
    camera.setBounds(start.x, start.y, start.width, start.height);
    camera.scrollX = 448;
    camera.scrollY = 120;
    const onScroll = vi.fn();

    transition.start(start, left, onScroll);

    expect(onScroll).toHaveBeenCalledWith(tweens[0].duration);
    expect(tweens[0].duration).toBeGreaterThanOrEqual(MIN_SCROLL_DURATION);
  });

  it("does not start another transition while one is running", () => {
    const { camera, events, tweens, transition } = setup();
    camera.setBounds(start.x, start.y, start.width, start.height);

    expect(transition.start(start, left)).toBe(true);
    expect(transition.start(left, start)).toBe(false);

    expect(events).toEqual(["freeze"]);
    expect(tweens).toHaveLength(1);

    tweens[0].onComplete();

    expect(transition.start(left, start)).toBe(true);
  });
});
