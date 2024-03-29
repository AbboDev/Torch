import { MapScene } from 'Scenes/MapScene';
import { PLAYER_DEPTH } from 'Config/depths';

/**
 * The three possible orientations along the Y axis
 */
export enum AreaPosition {
  FULL = 'full',
  TOP_HALF = 'top_half',
  LEFT_HALF = 'left_half',
  RIGHT_HALF = 'right_half',
  BOTTOM_HALF = 'bottom_half',
  LEFT_TOP_QUARTER = 'left_top_quarter',
  LEFT_BOTTOM_QUARTER = 'left_bottom_quarter',
  RIGHT_TOP_QUARTER = 'right_top_quarter',
  RIGHT_BOTTOM_QUARTER = 'right_bottom_quarter'
};

export class Hitbox extends Phaser.GameObjects.Rectangle {
  /**
   * The Phaser body
   * @type {Phaser.Physics.Arcade.Body}
   */
  public body!: Phaser.Physics.Arcade.Body;

  public constructor(
    public scene: MapScene,
    public x: number,
    public y: number,
    public width: number,
    public height: number,
    public fillColor: number = 0xffffff,
    public fillAlpha: number = 0
  ) {
    super(
      scene,
      x,
      y,
      width,
      height,
      fillColor,
      fillAlpha
    );

    this.scene.add.existing(this);
    this.scene.physics.world.enable(this);

    this
      .setOrigin(0.5, 0.5)
      .setDepth(PLAYER_DEPTH + 1);

    this.body
      .setAllowGravity(false);

    // The hitbox should be static or anchored to a parent,
    // so is useless show the velocity debug
    this.body.debugShowVelocity = false;
  }

  public update(): void {
    super.update();
  }

  /**
   * An Hitbox should always be associated to a parent, so this function
   * synchronize the coordinates and the velocity of the two elements
   *
   * @param {Phaser.Physics.Arcade.Sprite} parent The parent of the hitbox
   * @param {number} x The x coordinate, by default the same of the parent
   * @param {number} y The y coordinate, by default the same of the parent
   */
  public alignToParent(
    parent: Phaser.Physics.Arcade.Sprite & { body: Phaser.Physics.Arcade.Body },
    x?: number,
    y?: number
  ): void {
    if (typeof y === 'undefined') {
      if (typeof x === 'undefined') {
        x = parent.body.position.x;
        y = parent.body.position.y;
      } else {
        y = x;
      }
    }

    this.setPosition(x, y);

    this.body.velocity.copy(parent.body.velocity);
  }

  public overlapTiles(): boolean {
    let layers: Phaser.Tilemaps.DynamicTilemapLayer[] = this.scene.worldLayer;
    if (!Array.isArray(layers)) {
      layers = [layers];
    }

    for (const layer of layers) {
      const overlap = this.scene.physics.overlap(
        this,
        layer,
        undefined,
        (hitbox, tile: unknown) => {
          return ((tile as Phaser.Tilemaps.Tile).index > -1);
        }
      );

      if (overlap) {
        return true;
      }
    }

    return false;
  }

  /**
   * Detect if the hitbox is inside a specified area
   *
   * @param  {AreaPosition} area The portion of a tile to consider
   * @return {boolean}           True if the hitbox is perfectly inside the area
   */
  public overlapTilesArea(area: AreaPosition): boolean {
    let layers: Phaser.Tilemaps.DynamicTilemapLayer[] = this.scene.worldLayer;
    if (!Array.isArray(layers)) {
      layers = [layers];
    }

    for (const layer of layers) {
      const overlap = this.scene.physics.overlap(
        this,
        layer,
        undefined,
        (hitbox, tile: unknown) => {
          if ((tile as Phaser.Tilemaps.Tile).index > -1) {
            const hitboxBounds: Phaser.Geom.Rectangle = this.getBounds();
            const tileBounds: Phaser.Geom.Rectangle = (tile as Phaser.Tilemaps.Tile).getBounds() as Phaser.Geom.Rectangle;

            let x: number = tileBounds.x;
            let y: number = tileBounds.y;
            let width: number = tileBounds.width;
            let height: number = tileBounds.height;

            switch (area) {
              case AreaPosition.TOP_HALF:
                x = tileBounds.left;
                y = tileBounds.top;
                height = tileBounds.height / 2;
                break;
              case AreaPosition.BOTTOM_HALF:
                x = tileBounds.left;
                y = tileBounds.centerY;
                height = tileBounds.height / 2;
                break;

              case AreaPosition.LEFT_HALF:
                x = tileBounds.left;
                y = tileBounds.top;
                width = tileBounds.width / 2;
                break;
              case AreaPosition.RIGHT_HALF:
                x = tileBounds.centerX;
                y = tileBounds.top;
                width = tileBounds.width / 2;
                break;

              case AreaPosition.LEFT_TOP_QUARTER:
                x = tileBounds.left;
                y = tileBounds.top;
                width = tileBounds.width / 2;
                height = tileBounds.height / 2;
                break;
              case AreaPosition.LEFT_BOTTOM_QUARTER:
                x = tileBounds.left;
                y = tileBounds.centerY;
                width = tileBounds.width / 2;
                height = tileBounds.height / 2;
                break;
              case AreaPosition.RIGHT_TOP_QUARTER:
                x = tileBounds.centerX;
                y = tileBounds.top;
                width = tileBounds.width / 2;
                height = tileBounds.height / 2;
                break;
              case AreaPosition.RIGHT_BOTTOM_QUARTER:
                x = tileBounds.centerX;
                y = tileBounds.centerY;
                width = tileBounds.width / 2;
                height = tileBounds.height / 2;
                break;
            }

            const rectangle = new Phaser.Geom.Rectangle(x, y, width, height);

            return Phaser.Geom.Rectangle.ContainsRect(rectangle, hitboxBounds);
          }

          return false;
        }
      );

      if (overlap) {
        return true;
      }
    }

    return false;
  }
}
