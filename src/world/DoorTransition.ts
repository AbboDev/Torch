import type { LocalDoor } from "@/world/doors";

/** Milliseconds the screen takes to go black */
export const DOOR_FADE_OUT = 250;

/** Milliseconds the screen takes to come back */
export const DOOR_FADE_IN = 500;

/** What the scene gives to the transition */
export interface DoorHost {
  /** The Player can't do anything and the world stands still */
  freeze(): void;
  unfreeze(): void;
  /** Call `done` when the screen is black / fully back */
  fadeOut(duration: number, done: () => void): void;
  fadeIn(duration: number, done: () => void): void;
  /** Put the Player at the target, in the room it is in, with the camera there */
  enter(target: { x: number; y: number }): void;
}

/**
 * Going through a door: the screen fades to black, the Player appears at the
 * other side, and the screen comes back.
 */
export class DoorTransition {
  private running = false;

  public constructor(private readonly host: DoorHost) {}

  public get isRunning(): boolean {
    return this.running;
  }

  /** @return False if a transition is already running */
  public start(door: LocalDoor): boolean {
    if (this.running) {
      return false;
    }

    this.running = true;
    this.host.freeze();

    this.host.fadeOut(DOOR_FADE_OUT, () => {
      this.host.enter(door.target);

      this.host.fadeIn(DOOR_FADE_IN, () => {
        this.host.unfreeze();
        this.running = false;
      });
    });

    return true;
  }
}
