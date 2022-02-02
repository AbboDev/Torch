export interface TiledObjectProperty {
  name: string,
  type: string,
  value: null | boolean | string | number
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
export interface TiledObject extends Phaser.Types.Tilemaps.TiledObject {
  properties?: TiledObjectProperty[] | undefined
}
