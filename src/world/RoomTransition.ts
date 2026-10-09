import { Bounds, getScrollDuration, unionBounds } from "@/world/scroll";

/** The part of a Phaser camera the transition uses */
export interface TransitionCamera {
  scrollX: number;
  scrollY: number;
  setBounds(x: number, y: number, width: number, height: number): unknown;
  centerOn(x: number, y: number): unknown;
  stopFollow(): unknown;
}

export interface TransitionTweenConfig {
  targets: TransitionCamera;
  scrollX: number;
  scrollY: number;
  duration: number;
  ease: string;
  onComplete: () => void;
}

/** What the scene gives to the transition */
export interface TransitionHost {
  camera: TransitionCamera;
  addTween(config: TransitionTweenConfig): unknown;
  /**
   * Where the camera will be centered at the end. It must be the position
   * `follow()` centers the camera on (Phaser's startFollow does it at once),
   * or the camera jumps when the Player takes control again.
   */
  getFocus(): { x: number; y: number };
  /** The Player can't do anything and the world stands still */
  freeze(): void;
  unfreeze(): void;
  /** The camera follows the Player again */
  follow(): void;
}

/**
 * The transition between two rooms: the world stands still and the camera
 * scrolls from the old room to the new one, then the Player takes control
 * again with the camera limited to the new room.
 */
export class RoomTransition {
  private running = false;

  public constructor(private readonly host: TransitionHost) {}

  public get isRunning(): boolean {
    return this.running;
  }

  /**
   * @param previous The room the Player is leaving
   * @param next     The room the Player is entering
   * @param onScroll Called when the scroll starts, with how long it lasts in
   *                 milliseconds: the moment to change the background
   *
   * @return False if another transition is already running
   */
  public start(
    previous: Bounds,
    next: Bounds,
    onScroll?: (duration: number) => void
  ): boolean {
    if (this.running) {
      return false;
    }

    this.running = true;
    this.host.freeze();

    const { camera } = this.host;
    const from = { x: camera.scrollX, y: camera.scrollY };

    camera.stopFollow();

    // Where the camera has to arrive: centered on the Player, as far as the
    // new room allows. Phaser works it out when the bounds are set.
    camera.setBounds(next.x, next.y, next.width, next.height);
    const focus = this.host.getFocus();
    camera.centerOn(focus.x, focus.y);
    const to = { x: camera.scrollX, y: camera.scrollY };

    // The camera goes back where it was, and while it scrolls it is free
    // to be anywhere in the two rooms: with the bounds of the new room only
    // it would jump to them at once.
    camera.scrollX = from.x;
    camera.scrollY = from.y;
    const free = unionBounds(previous, next);
    camera.setBounds(free.x, free.y, free.width, free.height);

    const duration = getScrollDuration(
      Math.hypot(to.x - from.x, to.y - from.y)
    );

    onScroll?.(duration);

    this.host.addTween({
      targets: camera,
      scrollX: to.x,
      scrollY: to.y,
      duration,
      ease: "Sine.easeInOut",
      onComplete: () => this.finish(next),
    });

    return true;
  }

  private finish(next: Bounds): void {
    this.host.camera.setBounds(next.x, next.y, next.width, next.height);
    this.host.follow();
    this.host.unfreeze();

    this.running = false;
  }
}
