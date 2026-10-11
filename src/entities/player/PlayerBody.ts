import * as Phaser from "phaser";
import { TILE_SIZE } from "@/config/tiles";
import { PositionRequest } from "@/entities/player/PositionRequest";

/** The shapes of the body of the Player */
export const BODY = {
  /** Standing */
  width: TILE_SIZE,
  height: TILE_SIZE * 2,
  /** Crouching */
  smallWidth: TILE_SIZE,
  smallHeight: ((TILE_SIZE * 2) / 4) * 3,
};

/** What the shape of the body depends on: the sprite it is drawn on */
export interface SpriteSize {
  width: number;
  height: number;
  originX: number;
  originY: number;
}

export interface BodyShape {
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
}

/**
 * The shape of the body, standing or crouching, inside the sprite: the body
 * is at the bottom of it, whatever the origin of the sprite.
 */
export function getBodyShape(small: boolean, sprite: SpriteSize): BodyShape {
  const width = small ? BODY.smallWidth : BODY.width;
  const height = small ? BODY.smallHeight : BODY.height;

  return {
    offsetX: (sprite.width - width) * (1 - sprite.originX),
    offsetY: (sprite.height - height) * (1 - sprite.originY),
    width,
    height,
  };
}

/** The Player as a sprite with an Arcade body */
export type PlayerSprite = Phaser.Physics.Arcade.Sprite & {
  body: Phaser.Physics.Arcade.Body;
};

/**
 * The body of the Player: its shape (smaller when crouching) and the
 * position corrections asked during the update.
 */
export class PlayerBody {
  /** The body has the small shape */
  public isSmall = false;

  private readonly request = new PositionRequest();

  public constructor(private readonly sprite: PlayerSprite) {}

  /** Give the body the standing shape */
  public init(): void {
    this.applyShape(getBodyShape(false, this.sprite));
  }

  /**
   * The bounds of the body, whatever the origin of the sprite
   */
  public getBounds(): Phaser.Geom.Rectangle {
    const { sprite } = this;
    // Get the current sprite bounds
    const bounds: Phaser.Geom.Rectangle = sprite.getBounds();

    return new Phaser.Geom.Rectangle(
      bounds.left + (sprite.width - sprite.body.width) * (1 - sprite.originX),
      bounds.top + (sprite.height - sprite.body.height) * (1 - sprite.originY),
      sprite.body.width,
      sprite.body.height
    );
  }

  /**
   * Give the body the shape of crouching, or back the standing one. A position
   * asked for in this update moves with it, so it keeps the same place.
   */
  public resize(crouching: boolean): void {
    if (crouching === this.isSmall) {
      return;
    }

    const { body } = this.sprite;
    const previousOffset = body.offset.clone();
    const shape = getBodyShape(crouching, this.sprite);

    this.applyShape(shape);
    body.updateCenter();

    this.request.shift(
      previousOffset.x - shape.offsetX,
      previousOffset.y - shape.offsetY
    );

    this.isSmall = crouching;
  }

  /** Ask to put the body at a position when the update is over */
  public moveTo(x: number | null, y: number | null): void {
    this.request.set(x, y);
  }

  /** Put the body where it was asked, if it was */
  public applyRequestedPosition(): void {
    const position = this.request.take();

    if (!position) {
      return;
    }

    if (position.x !== null) {
      this.sprite.body.x = position.x;
    }

    if (position.y !== null) {
      this.sprite.body.y = position.y;
    }
  }

  private applyShape(shape: BodyShape): void {
    this.sprite.body
      .setOffset(shape.offsetX, shape.offsetY)
      .setSize(shape.width, shape.height, false);
  }
}
