import { describe, expect, it, vi } from "vitest";
import { DirectionAxisX, DirectionAxisY } from "@/miscellaneous/Direction";
import { PowerUps } from "@/miscellaneous/Inventory";
import { PlayerMovement } from "@/entities/player/movement/PlayerMovement";
import { MovementState, hasGravity } from "@/entities/player/movement/state";
import {
  Buttons,
  Env,
  FakeHost,
  NO_ENV,
  random,
} from "../helpers/movementWorld";
import { LegacyMovement } from "../helpers/legacyMovement";

vi.mock("phaser", () => ({ Math: { Vector2: class Vector2 {} } }));

const NONE: Buttons = {
  left: false,
  right: false,
  up: false,
  down: false,
  jump: false,
  dash: false,
};

// ---------------------------------------------------------------------------
// Comparing the state machine with the movement it replaces
// ---------------------------------------------------------------------------

type Mode = "ground" | "air" | "ledge" | "ladder" | "water";

const POWER_UPS = [
  PowerUps.GLOVE,
  PowerUps.ROCKET,
  PowerUps.HOOK,
  PowerUps.DASH,
];

const FREEZE_FRAMES = 9;

interface Observed {
  [key: string]: unknown;
}

function observe(host: FakeHost, movement: LegacyMovement | PlayerMovement) {
  const observed: Observed = {
    vx: host.vx,
    vy: host.vy,
    ax: host.ax,
    dragX: host.dragX,
    maxVx: host.maxVx,
    maxVy: host.maxVy,
    allowGravity: host.allowGravity,
    battery: host.battery,
    facingX: host.facing.x,
    facingForAimX: host.facingForAim.x,
    moveTo: JSON.stringify(host.moveToCalls),
    climb: JSON.stringify(host.climbCalls),
    // while a climb starts the ledge may be gone in the same frame: not compared
    isHanging: host.climbCalls.length > 0 ? "-" : movement.isHanging,
    isCrouch: movement.isCrouch,
    isAttachOnLadder: movement.isAttachOnLadder,
    isOnLadder: movement.isOnLadder,
    isJumping: movement.isJumping,
    isFalling: movement.isFalling,
    isStandingJumping: movement.isStandingJumping,
    canDoubleJump: movement.canDoubleJump,
    hasDoneDoubleJump: movement.hasDoneDoubleJump,
    canWallJump: movement.canWallJump,
  };

  return observed;
}

function firstDifference(a: Observed, b: Observed): string | null {
  for (const key of Object.keys(a)) {
    if (a[key] !== b[key]) {
      return `${key}: before ${String(a[key])}, now ${String(b[key])}`;
    }
  }

  return null;
}

/**
 * Run the old movement and the state machine on the same world, frame after
 * frame, with the same random buttons, and say where they first differ.
 *
 * The world is made of stretches (on the ground, in the air, at a ledge, on a
 * ladder, in water), so what is around the Player is always possible: no
 * ledge and ladder at once, and so on.
 */
function compare(seed: number, frames: number): string | null {
  const next = random(seed);
  const chance = (probability: number) => next() < probability;

  const owned = new Set(POWER_UPS.filter(() => chance(0.6)));
  const battery = Math.floor(next() * 60);

  const legacyHost = new FakeHost(owned, battery);
  const modernHost = new FakeHost(owned, battery);
  const legacy = new LegacyMovement();
  const modern = new PlayerMovement();

  let mode: Mode = "ground";
  let modeFrames = 30;
  let buttons: Buttons = { ...NONE };
  let dashHeldFor = 0;
  let frozen = 0;
  let ledgeSides = { left: true, right: true };
  let blockedSide: "left" | "right" | null = null;

  const chooseMode = (): Mode => {
    const all: Mode[] = ["ground", "air", "ledge", "ladder", "water"];
    const allowed = all.filter((candidate) => {
      if (legacy.isHanging) {
        return candidate === "ledge" || candidate === "air";
      }

      if (legacy.isAttachOnLadder) {
        return candidate !== "ledge";
      }

      return true;
    });

    return allowed[Math.floor(next() * allowed.length)];
  };

  for (let frame = 0; frame < frames; frame++) {
    // --- a frame of the world
    if (frozen > 0) {
      frozen--;
      // the time goes on while the Player is pulled up
      legacyHost.now += 1000 / 60;
      modernHost.now += 1000 / 60;

      if (frozen === 0) {
        // The Player is up on the ledge: it stands on the floor
        modern.finishClimb();
        legacy.finishClimb();
        mode = "ground";
        modeFrames = 20;
      }

      continue;
    }

    if (--modeFrames <= 0) {
      mode = chooseMode();
      modeFrames = 15 + Math.floor(next() * 60);
      ledgeSides = { left: chance(0.7), right: chance(0.7) };
      blockedSide = chance(0.5) ? (chance(0.5) ? "left" : "right") : null;
    }

    const vy = legacyHost.vy;
    if (mode === "air" && vy > 0 && chance(0.05)) {
      mode = "ground";
    }

    const touching = blockedSide;
    const env: Env = {
      ...NO_ENV,
      onFloor: false,
      isAimingDiagonal: chance(0.15),
      facingY: [DirectionAxisY.UP, DirectionAxisY.DOWN, DirectionAxisY.MIDDLE][
        Math.floor(next() * 3)
      ],
      previousFacingY: chance(0.7)
        ? DirectionAxisY.MIDDLE
        : DirectionAxisY.DOWN,
      isSwimming: mode === "water",
    };

    if (mode === "ground" || mode === "water") {
      env.onFloor = vy >= 0 && (mode === "ground" || chance(0.5));
      env.blockedLeft = touching === "left" && chance(0.6);
      env.blockedRight = touching === "right" && chance(0.6);
      env.ledgeToClimb = chance(0.5);
    } else if (mode === "air") {
      env.wallLeft = touching === "left";
      env.wallRight = touching === "right";
      env.blockedLeft = env.wallLeft && chance(0.6);
      env.blockedRight = env.wallRight && chance(0.6);
      env.ledgeToClimb = chance(0.5);
    } else if (mode === "ledge") {
      env.wallLeft = ledgeSides.left && !ledgeSides.right;
      env.wallRight = ledgeSides.right && !ledgeSides.left;
      env.ledgeLeft = ledgeSides.left ? { pixelY: 96 } : null;
      env.ledgeRight = ledgeSides.right ? { pixelY: 96 } : null;
    } else if (mode === "ladder") {
      env.overlapsLadder = true;
      env.ladderTop = chance(0.2);
      env.onFloor = vy >= 0 && chance(0.15);
    }

    if (mode === "water" && chance(0.5)) {
      env.wallLeft = chance(0.5);
    }

    // --- the buttons: held for a while, then changed
    const toggle = (value: boolean, probability: number) =>
      chance(probability) ? !value : value;

    buttons = {
      left: toggle(buttons.left, 0.07),
      right: toggle(buttons.right, 0.07),
      up: toggle(buttons.up, 0.05),
      down: toggle(buttons.down, 0.06),
      jump: toggle(buttons.jump, 0.09),
      dash: toggle(buttons.dash, 0.05),
    };
    dashHeldFor = buttons.dash ? dashHeldFor + 16 : 0;
    env.dashHeldFor = dashHeldFor;

    // --- both Players live this frame
    for (const [host, movement] of [
      [legacyHost, legacy],
      [modernHost, modern],
    ] as const) {
      host.env = { ...env };
      host.facing.y = env.facingY;
      host.previousFacing.y = env.previousFacingY;
      host.setButtons(buttons);
      host.beginFrame();

      movement.updateMotion(host);
      movement.updateCrouch(host);
    }

    const difference = firstDifference(
      observe(legacyHost, legacy),
      observe(modernHost, modern)
    );
    if (difference) {
      return `seed ${seed}, frame ${frame} (${mode}): ${difference}`;
    }

    if (legacyHost.climbCalls.length > 0) {
      frozen = FREEZE_FRAMES;
    }

    legacyHost.endFrame();
    modernHost.endFrame();
  }

  return null;
}

describe("the state machine does what the old movement did", () => {
  it("in 300 random games of 800 frames each", () => {
    const failures: string[] = [];

    for (let seed = 1; seed <= 300 && failures.length < 5; seed++) {
      const failure = compare(seed, 800);

      if (failure) {
        failures.push(failure);
      }
    }

    expect(failures).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// What the state machine does, one thing at a time
// ---------------------------------------------------------------------------

/** A Player in a world, which moves one frame at a time */
class Game {
  public readonly host: FakeHost;
  public readonly movement = new PlayerMovement();

  public constructor(owned: PowerUps[] = [], battery = 10) {
    this.host = new FakeHost(new Set(owned), battery);
  }

  public frame(env: Partial<Env> = {}, buttons: Partial<Buttons> = {}) {
    this.host.env = { ...NO_ENV, ...env };
    this.host.setButtons({ ...NONE, ...buttons });
    this.host.beginFrame();

    this.movement.updateMotion(this.host);
    this.movement.updateCrouch(this.host);

    this.host.endFrame();

    return this.movement.state;
  }

  /** Make the Player face right: the movement does nothing before */
  public turnRight(): void {
    this.frame({}, { right: true });
    this.frame();
  }

  public get speedY(): number {
    return this.host.vy;
  }
}

const LEDGE = { pixelY: 96 };
const IN_AIR: Partial<Env> = { onFloor: false };
const AT_LEDGE: Partial<Env> = {
  onFloor: false,
  wallRight: true,
  ledgeRight: LEDGE,
};
const ON_LADDER: Partial<Env> = { onFloor: false, overlapsLadder: true };

describe("PlayerMovement", () => {
  it("starts standing", () => {
    expect(new PlayerMovement().state).toBe(MovementState.GROUNDED);
  });

  describe("jumping", () => {
    it("takes off, falls and lands", () => {
      const game = new Game();
      game.turnRight();

      game.frame({}, { jump: true });
      expect(game.speedY).toBeLessThan(0);
      expect(game.movement.isJumping).toBe(true);

      expect(game.frame(IN_AIR, { jump: true })).toBe(MovementState.AIRBORNE);

      // the button is released: the rise is over and the Player falls
      game.frame(IN_AIR);
      game.frame(IN_AIR);
      expect(game.movement.isFalling).toBe(true);
      expect(game.movement.isJumping).toBe(false);

      expect(game.frame({ onFloor: true })).toBe(MovementState.GROUNDED);
      expect(game.movement.isFalling).toBe(false);
    });

    it("can still jump a moment after walking off a ledge, but not later", () => {
      const early = new Game();
      early.turnRight();
      early.frame({}, {});
      early.frame(IN_AIR);
      early.frame(IN_AIR, { jump: true });
      expect(early.speedY).toBeLessThan(0);

      const late = new Game();
      late.turnRight();
      late.frame(IN_AIR);
      for (let frame = 0; frame < 12; frame++) late.frame(IN_AIR);
      late.frame(IN_AIR, { jump: true });
      expect(late.speedY).toBeGreaterThanOrEqual(0);
    });

    it("does a double jump with the rocket, once", () => {
      const game = new Game([PowerUps.ROCKET]);
      game.turnRight();

      game.frame({}, { jump: true });
      game.frame(IN_AIR, { jump: true });
      // letting go of the button in mid air allows the second jump
      game.frame(IN_AIR);
      expect(game.movement.canDoubleJump).toBe(true);

      game.frame(IN_AIR, { jump: true });
      expect(game.speedY).toBeLessThan(-100);
      expect(game.movement.hasDoneDoubleJump).toBe(true);

      game.frame(IN_AIR);
      game.frame(IN_AIR, { jump: true });
      expect(game.speedY).toBeGreaterThan(-100);
    });

    it("jumps away from a wall with the glove", () => {
      const game = new Game([PowerUps.GLOVE]);
      game.turnRight();

      game.frame(
        { onFloor: false, wallLeft: true },
        { right: true, jump: true }
      );

      expect(game.host.vx).toBeGreaterThan(0);
      expect(game.speedY).toBeLessThan(0);
    });

    it("does not jump away from a wall without the glove", () => {
      const game = new Game();
      game.turnRight();
      // long enough in the air for the jump after leaving the floor to be over
      for (let frame = 0; frame < 12; frame++) game.frame(IN_AIR);

      game.frame(
        { onFloor: false, wallLeft: true },
        { right: true, jump: true }
      );

      expect(game.speedY).toBeGreaterThanOrEqual(0);
    });
  });

  describe("crouching", () => {
    it("crouches on the floor, and stands up with the up button", () => {
      const game = new Game();
      game.turnRight();

      expect(game.frame({}, { down: true })).toBe(MovementState.CROUCHING);
      expect(game.movement.isCrouch).toBe(true);
      expect(game.frame({}, { down: true })).toBe(MovementState.CROUCHING);

      expect(game.frame({}, { up: true })).toBe(MovementState.GROUNDED);
    });

    it("stops crouching when the Player moves", () => {
      const game = new Game();
      game.turnRight();
      game.frame({}, { down: true });

      expect(game.frame({}, { left: true })).toBe(MovementState.GROUNDED);
    });

    it("does not crouch in the air", () => {
      const game = new Game();
      game.turnRight();

      expect(game.frame(IN_AIR, { down: true })).toBe(MovementState.AIRBORNE);
      expect(game.movement.isCrouch).toBe(false);
    });
  });

  describe("hanging from a ledge", () => {
    function hang(game: Game) {
      game.turnRight();
      game.frame(IN_AIR, { right: true });
      // falling beside the ledge
      game.host.vy = 100;

      return game.frame(AT_LEDGE, { right: true });
    }

    it("grabs a ledge while falling, with the hook", () => {
      const game = new Game([PowerUps.HOOK]);

      expect(hang(game)).toBe(MovementState.HANGING);
      expect(game.movement.isHanging).toBe(true);
      expect(game.host.vy).toBe(0);
      expect(game.host.moveToCalls).toEqual([[null, 96]]);
    });

    it("does not grab it without the hook", () => {
      const game = new Game();

      expect(hang(game)).toBe(MovementState.AIRBORNE);
    });

    it("has no gravity while hanging", () => {
      const game = new Game([PowerUps.HOOK]);
      hang(game);

      expect(game.host.allowGravity).toBe(false);
    });

    it("lets go with the down button, and gravity is back", () => {
      const game = new Game([PowerUps.HOOK]);
      hang(game);

      expect(game.frame(AT_LEDGE, { down: true })).toBe(MovementState.AIRBORNE);
      expect(game.host.allowGravity).toBe(true);
      // and it does not crouch in the air for a frame, as it used to
      expect(game.movement.isCrouch).toBe(false);
    });

    it("pulls itself up with the up button, and can not be controlled meanwhile", () => {
      const game = new Game([PowerUps.HOOK]);
      hang(game);

      expect(game.frame(AT_LEDGE, { up: true })).toBe(
        MovementState.CLIMBING_LEDGE
      );
      expect(game.host.climbCalls).toEqual([[16, 32]]);
      expect(game.host.allowGravity).toBe(false);

      game.movement.finishClimb();
      expect(game.movement.state).toBe(MovementState.AIRBORNE);
      expect(game.frame({ onFloor: true })).toBe(MovementState.GROUNDED);
      expect(game.host.allowGravity).toBe(true);
    });

    it("lets go if the ledge is not there any more", () => {
      const game = new Game([PowerUps.HOOK]);
      hang(game);

      expect(game.frame({ onFloor: false, ledgeRight: null })).toBe(
        MovementState.AIRBORNE
      );
    });
  });

  describe("climbing a ledge from the floor", () => {
    it("pulls itself up when running against a wall with a ledge above", () => {
      const game = new Game();
      game.turnRight();

      expect(
        game.frame({ blockedRight: true, ledgeToClimb: true }, { jump: true })
      ).toBe(MovementState.CLIMBING_LEDGE);
      expect(game.host.climbCalls).toEqual([[16, 16]]);
      expect(game.movement.isHanging).toBe(false);
    });

    it("jumps instead when there is no ledge", () => {
      const game = new Game();
      game.turnRight();

      game.frame({ blockedRight: true, ledgeToClimb: false }, { jump: true });

      expect(game.speedY).toBeLessThan(0);
      expect(game.host.climbCalls).toEqual([]);
    });
  });

  describe("ladders", () => {
    it("holds the ladder with the down button, without gravity", () => {
      const game = new Game();
      game.turnRight();

      expect(
        game.frame({ ...ON_LADDER, ladderTop: true }, { down: true })
      ).toBe(MovementState.ON_LADDER);
      expect(game.speedY).toBeGreaterThan(0);
      expect(game.host.allowGravity).toBe(false);
    });

    it("stays still on the ladder when no button is pressed", () => {
      const game = new Game();
      game.turnRight();
      game.frame(ON_LADDER, { up: true });

      expect(game.frame(ON_LADDER)).toBe(MovementState.ON_LADDER);
      expect(game.speedY).toBe(0);
    });

    it("lets go when it reaches the floor, and gravity is back", () => {
      const game = new Game();
      game.turnRight();
      game.frame(ON_LADDER, { down: true });

      expect(
        game.frame({ onFloor: true, overlapsLadder: false, ladderTop: true })
      ).toBe(MovementState.GROUNDED);
      expect(game.host.allowGravity).toBe(true);
    });

    it("does not crouch while taking the ladder", () => {
      const game = new Game();
      game.turnRight();

      game.frame(
        { ...ON_LADDER, ladderTop: true, onFloor: true },
        { down: true }
      );

      expect(game.movement.isCrouch).toBe(false);
    });

    it("does not grab the ledges it goes past", () => {
      const game = new Game([PowerUps.HOOK]);
      game.turnRight();
      game.frame(ON_LADDER, { down: true });
      game.host.vy = 80;

      expect(
        game.frame(
          { ...ON_LADDER, wallRight: true, ledgeRight: LEDGE },
          { down: true }
        )
      ).toBe(MovementState.ON_LADDER);
      expect(game.host.moveToCalls).toEqual([]);
    });
  });

  describe("the dash", () => {
    it("needs the power-up and the battery", () => {
      const without = new Game([], 10);
      without.turnRight();
      without.frame({}, { dash: true });
      expect(without.host.vx).toBeLessThan(400);

      const empty = new Game([PowerUps.DASH], 0);
      empty.turnRight();
      empty.frame({}, { dash: true });
      expect(empty.host.vx).toBeLessThan(400);

      const ready = new Game([PowerUps.DASH], 10);
      ready.turnRight();
      ready.frame({}, { dash: true });
      expect(ready.host.vx).toBeGreaterThan(400);
      expect(ready.host.battery).toBe(9);
    });
  });

  describe("gravity", () => {
    it("pulls the Player everywhere but where it holds on to something", () => {
      expect(hasGravity(MovementState.GROUNDED)).toBe(true);
      expect(hasGravity(MovementState.CROUCHING)).toBe(true);
      expect(hasGravity(MovementState.AIRBORNE)).toBe(true);
      expect(hasGravity(MovementState.HANGING)).toBe(false);
      expect(hasGravity(MovementState.ON_LADDER)).toBe(false);
      expect(hasGravity(MovementState.CLIMBING_LEDGE)).toBe(false);
    });
  });

  describe("before the Player has turned to a side", () => {
    it("does not jump nor crouch while facing the front", () => {
      const game = new Game();

      game.frame({}, { jump: true });
      expect(game.speedY).toBe(0);

      expect(game.frame({}, { down: true })).toBe(MovementState.GROUNDED);
    });
  });
});
