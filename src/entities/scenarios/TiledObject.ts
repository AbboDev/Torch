import * as Phaser from "phaser";

export interface TiledObjectProperty {
  name: string;
  type: string;
  value: null | boolean | string | number;
}

export interface TiledObject extends Phaser.Types.Tilemaps.TiledObject {
  /** The kind of the object, from the raw JSON (Phaser keeps only `type`) */
  class?: string;
  properties?: TiledObjectProperty[] | undefined;
}
