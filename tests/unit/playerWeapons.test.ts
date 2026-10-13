import { describe, expect, it, vi } from "vitest";
import {
  PlayerWeapons,
  SHOT_HEIGHT,
  WeaponSource,
} from "@/entities/player/PlayerWeapons";
import { PlayerAim } from "@/entities/player/PlayerAim";
import { ControllerKey } from "@/input/ControllerKey";
import { DirectionAxisX, DirectionAxisY } from "@/miscellaneous/Direction";
import { GameState } from "@/state/GameState";

vi.mock("phaser", () => ({
  Math: {
    Vector2: class Vector2 {
      public constructor(
        public x: number,
        public y: number
      ) {}
    },
  },
}));

function setup(options: { ammo?: number; canFire?: boolean } = {}) {
  const state = new GameState();
  state.player.ammo = options.ammo ?? 5;

  const fireBullet = vi.fn(() => options.canFire ?? true);
  const resetShoot = vi.fn();
  const arsenal: WeaponSource = {
    getCurrent: () => ({ fireBullet }) as never,
    resetShoot,
  };

  const inventory = { switchToNextWeapon: vi.fn() };
  const aim = new PlayerAim();
  aim.facingForAim.x = DirectionAxisX.RIGHT;

  const buttons = { shoot: false, switchPressed: false };
  const controls = {
    get shoot() {
      return buttons.shoot;
    },
    justPressed: (key: ControllerKey) =>
      key === ControllerKey.Y && buttons.switchPressed,
  };

  const sprite = {
    x: 216,
    width: 32,
    getBounds: () => ({ top: 100, bottom: 148, centerX: 216 }),
  };

  const weapons = new PlayerWeapons(
    inventory,
    arsenal,
    sprite,
    controls,
    aim,
    state.player
  );

  return { weapons, state, aim, buttons, fireBullet, resetShoot, inventory };
}

describe("PlayerWeapons", () => {
  it("shoots when the button is down, and spends one ammo", () => {
    const { weapons, state, buttons, fireBullet } = setup();
    buttons.shoot = true;

    weapons.update(1000);

    expect(fireBullet).toHaveBeenCalledTimes(1);
    expect(state.get("ammo")).toBe(4);
  });

  it("tells the weapon where to shoot and where the Player aims", () => {
    const { weapons, aim, buttons, fireBullet } = setup();
    aim.facingForAim.y = DirectionAxisY.MIDDLE;
    buttons.shoot = true;

    weapons.update(1000);

    const calls = fireBullet.mock.calls as unknown as [
      number,
      {
        facing: unknown;
        diagonal: boolean;
        position: { x: number; y: number };
      },
    ][];
    const [time, config] = calls[0];
    expect(time).toBe(1000);
    expect(config.facing).toBe(aim.facingForAim);
    expect(config.diagonal).toBe(false);
    expect(config.position).toMatchObject({ x: 216, y: 100 + SHOT_HEIGHT });
  });

  it("spends no ammo when the weapon does not fire", () => {
    const { weapons, state, buttons } = setup({ canFire: false });
    buttons.shoot = true;

    weapons.update(1000);

    expect(state.get("ammo")).toBe(5);
  });

  it("does not shoot without ammo", () => {
    const { weapons, buttons, fireBullet } = setup({ ammo: 0 });
    buttons.shoot = true;

    weapons.update(1000);

    expect(fireBullet).not.toHaveBeenCalled();
  });

  it("does not shoot facing the front", () => {
    const { weapons, aim, buttons, fireBullet } = setup();
    aim.facingForAim.x = DirectionAxisX.CENTER;
    buttons.shoot = true;

    weapons.update(1000);

    expect(fireBullet).not.toHaveBeenCalled();
  });

  it("does nothing when the button is not down", () => {
    const { weapons, buttons, fireBullet } = setup();

    weapons.update(1000);

    expect(buttons.shoot).toBe(false);
    expect(fireBullet).not.toHaveBeenCalled();
  });

  it("lets the weapons shoot again only while the button is up", () => {
    const { weapons, buttons, resetShoot } = setup();

    weapons.update(0);
    expect(resetShoot).toHaveBeenCalledTimes(1);

    buttons.shoot = true;
    weapons.update(16);
    expect(resetShoot).toHaveBeenCalledTimes(2);

    // the button is held: the weapon is not reset
    weapons.update(32);
    expect(resetShoot).toHaveBeenCalledTimes(2);
  });

  it("changes weapon with the Y button", () => {
    const { weapons, buttons, inventory } = setup();

    weapons.update(0);
    expect(inventory.switchToNextWeapon).not.toHaveBeenCalled();

    buttons.switchPressed = true;
    weapons.update(16);
    expect(inventory.switchToNextWeapon).toHaveBeenCalledTimes(1);
  });

  describe("with a free aim", () => {
    const shot = (fireBullet: ReturnType<typeof vi.fn>) =>
      (fireBullet.mock.calls[0] as unknown as [number, { angle?: number }])[1];

    it("shoots along the angle of the stick", () => {
      const { weapons, aim, buttons, fireBullet } = setup();
      aim.freeAngle = -Math.PI / 3;
      buttons.shoot = true;

      weapons.update(1000);

      expect(shot(fireBullet).angle).toBeCloseTo(-Math.PI / 3);
    });

    it("shoots from the gun to the point of the mouse", () => {
      const { weapons, aim, buttons, fireBullet } = setup();
      aim.facingForAim.y = DirectionAxisY.MIDDLE;
      // the gun is at (216, 100 + SHOT_HEIGHT): 100 right and 100 down of it
      aim.freeAngle = 0;
      aim.freeTarget = { x: 316, y: 100 + SHOT_HEIGHT + 100 };
      buttons.shoot = true;

      weapons.update(1000);

      expect(shot(fireBullet).angle).toBeCloseTo(Math.PI / 4);
    });

    it("gives no angle when the buttons aim", () => {
      const { weapons, buttons, fireBullet } = setup();
      buttons.shoot = true;

      weapons.update(1000);

      expect("angle" in shot(fireBullet)).toBe(false);
    });
  });

  describe("the aim ray", () => {
    it("points ahead with the buttons, from the gun", () => {
      const { weapons, aim } = setup();
      aim.facingForAim.y = DirectionAxisY.MIDDLE;

      const ray = weapons.getAimRay();

      expect(ray?.from).toMatchObject({ x: 216, y: 100 + SHOT_HEIGHT });
      expect(ray?.angle).toBeCloseTo(0);

      aim.facingForAim.x = DirectionAxisX.LEFT;
      expect(weapons.getAimRay()?.angle).toBeCloseTo(Math.PI);
    });

    it("goes up straight, or diagonally with the aim key", () => {
      const { weapons, aim } = setup();
      aim.facingForAim.y = DirectionAxisY.UP;

      expect(weapons.getAimRay()?.angle).toBeCloseTo(-Math.PI / 2);

      aim.isAimingDiagonal = true;
      expect(weapons.getAimRay()?.angle).toBeCloseTo(-Math.PI / 4);
    });

    it("follows the free aim as a shot does", () => {
      const { weapons, aim } = setup();
      aim.freeAngle = 1;

      expect(weapons.getAimRay()?.angle).toBe(1);
    });

    it("is none while the Player looks at the front", () => {
      const { weapons, aim } = setup();
      aim.facingForAim.x = DirectionAxisX.CENTER;

      expect(weapons.getAimRay()).toBeNull();
    });
  });
});
