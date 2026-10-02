import * as Phaser from "phaser";

export interface TiledObjectProperty {
  name: string;
  type: string;
  value: null | boolean | string | number;
}

export interface TiledObject extends Phaser.Types.Tilemaps.TiledObject {
  properties?: TiledObjectProperty[] | undefined;
}
