import { describe, expect, it, vi } from "vitest";
import { ControllerKey } from "@/miscellaneous/Controller";
import { ButtonSource, PlayerInput } from "@/entities/player/PlayerInput";

// Controller.ts reads Phaser's key codes when loaded: any value will do here
vi.mock("phaser", () => ({
  Input: { Keyboard: { KeyCodes: new Proxy({}, { get: () => 0 }) } },
}));

class FakeSource implements ButtonSource {
  public held = new Set<ControllerKey>();
  public firstPresses = vi.fn((key: ControllerKey) => this.held.has(key));

  public isKeyPressed(key: ControllerKey): boolean {
    return this.held.has(key);
  }

  public isKeyPressedForFirstTime(key: ControllerKey): boolean {
    return this.firstPresses(key);
  }

  public getKeyDuration(): number {
    return 42;
  }
}

describe("PlayerInput", () => {
  it("maps the buttons to named actions", () => {
    const source = new FakeSource();
    const controls = new PlayerInput(source);

    source.held.add(ControllerKey.A);
    source.held.add(ControllerKey.L);
    controls.poll();

    expect(controls.jump).toBe(true);
    expect(controls.aim).toBe(true);
    expect(controls.shoot).toBe(false);
    expect(controls.left).toBe(false);
  });

  it("keeps the same state during a frame, until the next poll", () => {
    const source = new FakeSource();
    const controls = new PlayerInput(source);

    controls.poll();
    source.held.add(ControllerKey.RIGHT);
    expect(controls.right).toBe(false);

    controls.poll();
    expect(controls.right).toBe(true);
  });

  it("does not consume a first press unless asked", () => {
    const source = new FakeSource();
    const controls = new PlayerInput(source);

    source.held.add(ControllerKey.DOWN);
    controls.poll();
    expect(source.firstPresses).not.toHaveBeenCalled();

    expect(controls.justPressed(ControllerKey.DOWN)).toBe(true);
    expect(source.firstPresses).toHaveBeenCalledTimes(1);
  });

  it("reports how long the dash button has been held", () => {
    expect(new PlayerInput(new FakeSource()).getDashDuration()).toBe(42);
  });
});
