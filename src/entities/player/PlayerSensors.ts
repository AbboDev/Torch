import * as Phaser from "phaser";
import type { MapScene } from "@/scenes/MapScene";
import { DirectionAxisX } from "@/miscellaneous/Direction";
import {
  AreaPosition,
  Rect,
  SensorConfig,
  SensorRects,
  computeSensors,
  findContainedAlongPath,
  getArea,
  overlapsStrict,
  unionRect,
} from "@/entities/player/sensors";

export interface PlayerSensorsConfig extends SensorConfig {
  /**
   * Look for ledges along the path the hand sensor travelled in the frame,
   * not only where it ended. Needed when the Player falls faster than the
   * height of the area where a ledge can be grabbed.
   */
  sweptLedgeDetection: boolean;
}

type Side = DirectionAxisX.LEFT | DirectionAxisX.RIGHT;

/**
 * The part of the Arcade body the sensors need: its rectangle, and where it
 * was before the last physics step
 */
interface SensorBody {
  x: number;
  y: number;
  width: number;
  height: number;
  prev: { x: number; y: number };
}

/**
 * What the Player is touching around its body: walls, ledges, ladders and
 * moving platforms.
 *
 * The sensors are plain rectangles computed on demand from the current
 * position of the body, so they are never out of date and they cost no
 * Game Object nor physics body.
 */
export class PlayerSensors {
  public constructor(
    private readonly scene: MapScene,
    private readonly body: SensorBody,
    private readonly config: PlayerSensorsConfig
  ) {}

  /** The sensors, around where the body is now */
  public getRects(): SensorRects {
    return computeSensors(this.getBodyRect(), this.config);
  }

  /** The sensors, around where the body was at the start of this frame */
  private getPreviousRects(): SensorRects {
    return computeSensors(
      {
        x: this.body.prev.x,
        y: this.body.prev.y,
        width: this.body.width,
        height: this.body.height,
      },
      this.config
    );
  }

  private getBodyRect(): Rect {
    return {
      x: this.body.x,
      y: this.body.y,
      width: this.body.width,
      height: this.body.height,
    };
  }

  /** Is there a tile of the world right next to this side of the body? */
  public isTouchingWall(side: Side): boolean {
    const rects = this.getRects();
    const sensor =
      side === DirectionAxisX.LEFT ? rects.leftWall : rects.rightWall;

    return this.scene.worldLayer.some((layer) =>
      this.getTilesAround(layer, sensor).some((tile) =>
        overlapsStrict(this.getTileRect(layer, tile), sensor)
      )
    );
  }

  /**
   * Find the tile the Player can grab with the hand on this side: a tile
   * (not a ladder nor a one way platform) whose top half contains the hand,
   * and with nothing on top of it.
   *
   * @return The tile to hang from, or null
   */
  public findLedge(side: Side): Phaser.Tilemaps.Tile | null {
    const hand = this.findHandInTileTopHalf(side);
    if (!hand) {
      return null;
    }

    let tiles: Phaser.Tilemaps.Tile[] = [];
    let lastLayer!: Phaser.Tilemaps.TilemapLayer;

    for (const layer of this.scene.worldLayer) {
      if (
        tiles.length > 0 ||
        // The Player should not be able to hang on stairs nor one way platforms
        ["stairs", "platforms"].indexOf(layer.layer.name) > -1
      ) {
        break;
      }

      tiles =
        this.scene.map.getTilesWithinShape(
          new Phaser.Geom.Rectangle(hand.x, hand.y, hand.width, hand.height),
          { isNotEmpty: true },
          undefined,
          layer
        ) ?? [];

      lastLayer = layer;
    }

    if (tiles.length !== 1) {
      return null;
    }

    const [tile] = tiles;

    // A tile on top of it means this is not the edge of a ledge
    const upperTile = this.scene.map.getTileAt(
      tile.x,
      tile.y - 1,
      undefined,
      lastLayer
    );

    return upperTile === null ? tile : null;
  }

  /**
   * Where the hand on this side is entirely inside the top half of a tile
   * of the world: its rectangle at that moment, or null.
   */
  private findHandInTileTopHalf(side: Side): Rect | null {
    const now = this.getRects();
    const hand = side === DirectionAxisX.LEFT ? now.leftHand : now.rightHand;
    const before = this.config.sweptLedgeDetection
      ? this.getPreviousRects()
      : now;
    const previous =
      side === DirectionAxisX.LEFT ? before.leftHand : before.rightHand;

    const searchArea = unionRect(hand, previous);

    for (const layer of this.scene.worldLayer) {
      for (const tile of this.getTilesAround(layer, searchArea)) {
        const area = getArea(
          this.getTileRect(layer, tile),
          AreaPosition.TOP_HALF
        );

        const found = findContainedAlongPath(area, previous, hand);
        if (found) {
          return found;
        }
      }
    }

    return null;
  }

  /** Is the Player's feet in the top half of a ladder tile? */
  public isOnLadderTop(): boolean {
    const { feet } = this.getRects();
    const layer = this.scene.stairsLayer;

    return this.getTilesAround(layer, feet).some((tile) => {
      const area = getArea(
        this.getTileRect(layer, tile),
        AreaPosition.TOP_HALF
      );

      return overlapsStrict(area, feet);
    });
  }

  /** Is the Player standing on a moving platform? */
  public isOnPlatform(): boolean {
    const { feet } = this.getRects();

    return this.scene.platforms.getChildren().some((platform) => {
      const body = platform.body as Phaser.Physics.Arcade.Body | null;

      return (
        !!body &&
        body.enable &&
        overlapsStrict(feet, {
          x: body.x,
          y: body.y,
          width: body.width,
          height: body.height,
        })
      );
    });
  }

  /**
   * The not empty tiles near a rectangle, like Arcade Physics collects them
   * before testing a body: a margin of a tile is added on the top left side.
   */
  private getTilesAround(
    layer: Phaser.Tilemaps.TilemapLayer,
    rect: Rect
  ): Phaser.Tilemaps.Tile[] {
    const tileWidth = layer.layer.tileWidth * layer.scaleX;
    const tileHeight = layer.layer.tileHeight * layer.scaleY;

    return layer.getTilesWithinWorldXY(
      rect.x - tileWidth,
      rect.y - tileHeight,
      rect.width + tileWidth,
      rect.height + tileHeight,
      { isNotEmpty: true },
      this.scene.cameras.main
    );
  }

  private getTileRect(
    layer: Phaser.Tilemaps.TilemapLayer,
    tile: Phaser.Tilemaps.Tile
  ): Rect {
    const point = layer.tileToWorldXY(tile.x, tile.y);

    return {
      x: point.x,
      y: point.y,
      width: tile.width * layer.scaleX,
      height: tile.height * layer.scaleY,
    };
  }
}
