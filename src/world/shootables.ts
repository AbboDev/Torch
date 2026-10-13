/** Tells if a thing which can be shot, like an enemy, is at a point of the world */
export type ShootableProbe = (x: number, y: number) => boolean;

/**
 * The things which can be shot and are not tiles. The aim of the Player looks
 * here to know if it points at an enemy: an enemy adds its probe when it
 * appears and calls what `add` returned when it goes away.
 */
export class Shootables {
  private readonly probes = new Set<ShootableProbe>();

  /** @return The function which takes the probe away */
  public add(probe: ShootableProbe): () => void {
    this.probes.add(probe);

    return () => {
      this.probes.delete(probe);
    };
  }

  public isAt(x: number, y: number): boolean {
    for (const probe of this.probes) {
      if (probe(x, y)) {
        return true;
      }
    }

    return false;
  }
}
