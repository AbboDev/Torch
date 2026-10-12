import { describe, expect, it } from "vitest";
import { JumpAssist } from "@/entities/player/JumpAssist";

const assist = (coyoteTime = 100, bufferTime = 100) =>
  new JumpAssist({ coyoteTime, bufferTime });

describe("coyote time", () => {
  it("lets the Player jump while on the floor", () => {
    const jump = assist();

    jump.update(0, true, false);

    expect(jump.canJumpFromGround(0, true)).toBe(true);
  });

  it("lets the Player jump for a moment after walking off a ledge", () => {
    const jump = assist();

    jump.update(0, true, false);
    jump.update(16, false, false);

    expect(jump.canJumpFromGround(16, false)).toBe(true);
    expect(jump.canJumpFromGround(100, false)).toBe(true);
    expect(jump.canJumpFromGround(101, false)).toBe(false);
  });

  it("is not available in the air after a jump", () => {
    const jump = assist();

    jump.update(0, true, true);
    jump.notifyJumped();
    jump.update(16, false, true);

    expect(jump.canJumpFromGround(16, false)).toBe(false);
  });

  it("is available again after landing", () => {
    const jump = assist();

    jump.update(0, true, true);
    jump.notifyJumped();
    jump.update(500, true, false);
    jump.update(516, false, false);

    expect(jump.canJumpFromGround(516, false)).toBe(true);
  });

  it("is off with a time of 0", () => {
    const jump = assist(0, 0);

    jump.update(0, true, false);
    jump.update(16, false, false);

    expect(jump.canJumpFromGround(16, false)).toBe(false);
  });

  it("is not available for a Player which never touched the ground", () => {
    const jump = assist();

    jump.update(0, false, false);

    expect(jump.canJumpFromGround(0, false)).toBe(false);
  });
});

describe("jump buffer", () => {
  it("remembers a press made in the air which is still held on landing", () => {
    const jump = assist();

    jump.update(0, false, true);
    jump.update(60, false, true);

    expect(jump.hasBufferedPress(60, true)).toBe(true);
  });

  it("forgets a press which is too old", () => {
    const jump = assist();

    jump.update(0, false, true);

    expect(jump.hasBufferedPress(100, true)).toBe(true);
    expect(jump.hasBufferedPress(101, true)).toBe(false);
  });

  it("needs the button to be still held", () => {
    const jump = assist();

    jump.update(0, false, true);
    jump.update(30, false, false);

    expect(jump.hasBufferedPress(30, false)).toBe(false);
  });

  it("is used up by a jump: holding the button does not jump again", () => {
    const jump = assist();

    jump.update(0, true, true);
    jump.notifyJumped();
    jump.update(300, true, true);

    expect(jump.hasBufferedPress(300, true)).toBe(false);
  });

  it("counts a new press even if the button is held through a landing", () => {
    const jump = assist();

    jump.update(0, true, true);
    jump.notifyJumped();
    jump.update(200, false, false); // released in the air
    jump.update(300, false, true); // pressed again, just before landing
    jump.update(340, true, true); // landed

    expect(jump.hasBufferedPress(340, true)).toBe(true);
  });

  it("is off with a time of 0", () => {
    const jump = assist(0, 0);

    jump.update(0, false, true);

    expect(jump.hasBufferedPress(16, true)).toBe(false);
  });
});
