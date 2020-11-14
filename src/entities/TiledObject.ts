/**
 * The default properties possessed by an object placed on Tiled
 */
export interface TiledObject extends Phaser.GameObjects.GameObject {
  id: number,​

  x: number,
  y: number,
  width: number
  height: number,
  rotation: number,

  name: string,
  type: string,

  visible: boolean
}
