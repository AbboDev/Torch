import * as Phaser from "phaser";
import type { BulletConfig } from "@/entities/bullets/Bullet";
import type { Weapon } from "@/entities/weapons/Weapon";
import { TILE_SIZE } from "@/config/tiles";
import { getShotPosition } from "@/entities/player/aim";
import type { PlayerAim } from "@/entities/player/PlayerAim";
import { ControllerKey } from "@/input/ControllerKey";
import { DirectionAxisX } from "@/miscellaneous/Direction";
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
      const config: BulletConfig = {
        facing: this.aim.facingForAim,
        diagonal: this.aim.isAimingDiagonal,
        position: this.getShotPosition(),
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
