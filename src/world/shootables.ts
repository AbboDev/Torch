import { Damageable, DamageSource, applyDamage } from "@/combat/damage";
import type { Point } from "@/entities/player/aimAngles";

/** A thing which can be shot and is not a tile: an enemy */
export interface Shootable {
  /** Tells it from the others: the same thing keeps its id */
  id: string;
  /** Tells if the thing is at a point of the world */
  contains(x: number, y: number): boolean;
  /** Where it is now: the aim locks on it and follows it */
  position(): Point | null;
  /**
   * What takes the damage of what hits it: its life and its defense. A thing
   * with no target can be aimed at, but not hurt.
   */
  target?: Damageable;
}

/**
 * The things which can be shot and are not tiles. The aim of the Player looks
 * here to know if it points at an enemy: an enemy adds itself when it appears
 * and calls what `add` returned when it goes away.
 */
export class Shootables {
  private readonly all = new Set<Shootable>();

  /** @return The function which takes it away */
  public add(shootable: Shootable): () => void {
    this.all.add(shootable);

    return () => {
      this.all.delete(shootable);
    };
  }

  /** Where the things are now: the minimap shows the ones which are lit */
  public positions(): Point[] {
    const positions: Point[] = [];

    for (const shootable of this.all) {
      const position = shootable.position();

      if (position) {
        positions.push(position);
      }
    }

    return positions;
  }

  /**
   * Hurt the thing at a point of the world, if there is one with life: this is
   * what a shot which lands does, with the damage of its weapon.
   *
   * @return The life it took, 0 if nothing is hurt
   */
  public hit(x: number, y: number, source: DamageSource): number {
    const target = this.find(x, y)?.target;

    return target ? applyDamage(target, source) : 0;
  }

  /** The thing at a point of the world, if any */
  public find(x: number, y: number): Shootable | null {
    for (const shootable of this.all) {
      if (shootable.contains(x, y)) {
        return shootable;
      }
    }

    return null;
  }
}
