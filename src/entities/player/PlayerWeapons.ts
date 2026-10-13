import * as Phaser from "phaser";
import type { BulletConfig } from "@/entities/bullets/Bullet";
import type { Weapon } from "@/entities/weapons/Weapon";
import { TILE_SIZE } from "@/config/tiles";
import { getShotPosition } from "@/entities/player/aim";
import { Point, angleBetween } from "@/entities/player/aimAngles";
import type { AimRay } from "@/entities/player/aimTarget";
import type { PlayerAim } from "@/entities/player/PlayerAim";
import { ControllerKey } from "@/input/ControllerKey";
import { DirectionAxisX, getSign } from "@/miscellaneous/Direction";
import type { PlayerStats } from "@/state/GameState";

/** The distance from the top of the sprite to the gun, aiming straight */
export const SHOT_HEIGHT = TILE_SIZE + 2;

/** The sprite of the Player: where the bullets come from */
export interface ShooterSprite {
  x: number;
  width: number;
  getBounds(): { top: number; bottom: number; centerX: number };
}

/** The weapons the Player can use now */
export interface WeaponSource {
  getCurrent(): Weapon | null;
  /** The weapons can shoot again: the button was released */
  resetShoot(): void;
}

/** What the Player does with the weapons: change them, shoot, spend ammo */
export class PlayerWeapons {
  /** The shoot button was down in the previous frame */
  private isPressingShot = false;

  public constructor(
    private readonly inventory: { switchToNextWeapon(): unknown },
    private readonly arsenal: WeaponSource,
    private readonly sprite: ShooterSprite,
    private readonly controls: {
      readonly shoot: boolean;
      justPressed(key: ControllerKey): boolean;
    },
    private readonly aim: PlayerAim,
    private readonly stats: PlayerStats
  ) {}

  /**
   * Handle the weapons: change the current one, shoot
   *
   * @param time The time of the game
   */
  public update(time: number): void {
    if (this.controls.justPressed(ControllerKey.Y)) {
      this.inventory.switchToNextWeapon();
    }

    if (!this.isPressingShot) {
      this.arsenal.resetShoot();
    }

    const isShootPress: boolean = this.controls.shoot;

    // The user have to press Shot button and the player should not facing front
    if (
      isShootPress &&
      this.aim.facingForAim.x !== DirectionAxisX.CENTER &&
      this.stats.ammo > 0
    ) {
      const position = this.getShotPosition();
      const angle = this.getFreeAngle(position);
      const config: BulletConfig = {
        facing: this.aim.facingForAim,
        diagonal: this.aim.isAimingDiagonal,
        position,
        // Only with a free aim: the other shots go in the eight directions
        ...(angle === undefined ? {} : { angle }),
      };

      const weapon = this.arsenal.getCurrent();
      const wasFired = weapon ? weapon.fireBullet(time, config) : false;

      if (wasFired) {
        --this.stats.ammo;
      }
    }

    this.isPressingShot = isShootPress;
  }

  /**
   * Where the gun is and where it points, as a shot would go now. Null while
   * the Player looks at the front: it can not shoot.
   */
  public getAimRay(): AimRay | null {
    if (this.aim.facingForAim.x === DirectionAxisX.CENTER) {
      return null;
    }

    const from = this.getShotPosition();
    const freeAngle = this.getFreeAngle(from);

    if (freeAngle !== undefined) {
      return { from, angle: freeAngle };
    }

    // With the buttons the shots go in one of the eight directions
    const sign = getSign(this.aim.facingForAim);
    if (!this.aim.isAimingDiagonal && sign.y !== 0) {
      sign.x = 0;
    }

    return { from, angle: Math.atan2(sign.y, sign.x) };
  }

  /**
   * The exact direction of a shot with a free aim: from the gun to the point
   * aimed at (the mouse), or the angle itself (the stick). Undefined if the
   * Player aims with the buttons.
   */
  private getFreeAngle(from: Point): number | undefined {
    const { freeAngle, freeTarget } = this.aim;

    if (freeAngle === null) {
      return undefined;
    }

    return freeTarget ? angleBetween(from, freeTarget, freeAngle) : freeAngle;
  }

  /**
   * Where the bullets appear
   *
   * @return {Phaser.Math.Vector2} The position of the bullet
   */
  public getShotPosition(): Phaser.Math.Vector2 {
    const bounds = this.sprite.getBounds();
    const { x, y } = getShotPosition({
      top: bounds.top,
      bottom: bounds.bottom,
      centerX: bounds.centerX,
      x: this.sprite.x,
      width: this.sprite.width,
      facingForAim: this.aim.facingForAim,
      isAimingDiagonal: this.aim.isAimingDiagonal,
      shotHeight: SHOT_HEIGHT,
    });

    return new Phaser.Math.Vector2(x, y);
  }
}
