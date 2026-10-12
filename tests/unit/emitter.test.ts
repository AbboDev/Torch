import { describe, expect, it, vi } from "vitest";
import { Emitter } from "@/state/Emitter";

describe("Emitter", () => {
  it("delivers events with their arguments", () => {
    const emitter = new Emitter<{ hit: [number] }>();
    const listener = vi.fn();

    emitter.on("hit", listener);
    emitter.emit("hit", 5);

    expect(listener).toHaveBeenCalledWith(5);
  });

  it("stops delivering after unsubscribe, which is safe to call twice", () => {
    const emitter = new Emitter<{ hit: [number] }>();
    const listener = vi.fn();

    const off = emitter.on("hit", listener);
    off();
    off();
    emitter.emit("hit", 1);

    expect(listener).not.toHaveBeenCalled();
    expect(emitter.listenerCount("hit")).toBe(0);
  });

  it("allows a listener to unsubscribe while being called", () => {
    const emitter = new Emitter<{ hit: [] }>();
    const second = vi.fn();

    const off = emitter.on("hit", () => off());
    emitter.on("hit", second);
    emitter.emit("hit");

    expect(second).toHaveBeenCalledTimes(1);
  });
});
