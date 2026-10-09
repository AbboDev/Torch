import * as Phaser from "phaser";
import { BACKGROUND_DEPTH } from "@/config/depths";
import { ResolvedLayer, getBackgroundLayers } from "@/world/backgroundLayers";

type BackgroundObject =
  Phaser.GameObjects.Image | Phaser.GameObjects.TileSprite;

/**
 * While cross-fading, the new layers are drawn above all the old ones (the
 * old ones are at most at BACKGROUND_DEPTH - 1) and below the world
 */
const FADING_DEPTH = BACKGROUND_DEPTH + 0.5;

/**
 * The background of the current room: a fixed image with some layers
 * scrolling behind the world, taken from the table in config/backgrounds.ts.
 */
export class RoomBackground {
  private name: string | null = null;

  private roomWidth = -1;

  private layers: { object: BackgroundObject; layer: ResolvedLayer }[] = [];

  private fading: {
    old: { object: BackgroundObject }[];
    tween: Phaser.Tweens.Tween;
  } | null = null;

  public constructor(private readonly scene: Phaser.Scene) {}

  /**
   * Show the background of a room.
   *
   * @param name         The "background" property of the room. A room without
   *                     one keeps the previous background.
   * @param roomWidth    The width of the room, which the scrolling layers cover
   * @param fadeDuration Milliseconds to cross-fade from the previous background
   *                     (0: change it at once)
   */
  public show(
    name: string | undefined,
    roomWidth: number,
    fadeDuration = 0
  ): void {
    if (!name || (name === this.name && roomWidth === this.roomWidth)) {
      return;
    }

    const layers = getBackgroundLayers(name);
    if (!layers) {
      console.warn(`Unknown background "${name}" (see config/backgrounds.ts)`);

      return;
    }

    const missing = layers.filter(
      (layer) => !this.scene.textures.exists(layer.texture)
    );
    if (missing.length > 0) {
      console.warn(
        `Background "${name}" needs textures which are not loaded: ${missing
          .map((layer) => layer.texture)
          .join(", ")}`
      );

      return;
    }

    // A cross-fade still running is over: the new one starts from its result
    this.settle();

    const old = this.layers;
    const fade = fadeDuration > 0 && old.length > 0;

    this.layers = layers.map((layer, index) => ({
      layer,
      object: this.createLayer(
        layer,
        roomWidth,
        fade
          ? FADING_DEPTH + index * 0.01
          : BACKGROUND_DEPTH + layer.depthOffset
      ),
    }));
    this.name = name;
    this.roomWidth = roomWidth;

    if (!fade) {
      old.forEach(({ object }) => object.destroy());

      return;
    }

    const objects = this.layers.map(({ object }) => object);
    objects.forEach((object) => object.setAlpha(0));

    this.fading = {
      old,
      tween: this.scene.tweens.add({
        targets: objects,
        alpha: 1,
        duration: fadeDuration,
        onComplete: () => this.settle(),
      }),
    };
  }

  /** Finish a cross-fade at once: the new layers fully visible, the old ones gone */
  private settle(): void {
    if (!this.fading) {
      return;
    }

    const { old, tween } = this.fading;
    this.fading = null;

    tween.stop();
    old.forEach(({ object }) => object.destroy());
    this.layers.forEach(({ object, layer }) => {
      object.setAlpha(1).setDepth(BACKGROUND_DEPTH + layer.depthOffset);
    });
  }

  private createLayer(
    layer: ResolvedLayer,
    roomWidth: number,
    depth: number
  ): BackgroundObject {
    const x = this.scene.scale.width / 2;
    const y = this.scene.scale.height / 2;

    if (layer.kind === "image") {
      return this.scene.add
        .image(x, y, layer.texture)
        .setLighting(true)
        .setScrollFactor(layer.scrollFactor)
        .setDepth(depth);
    }

    return this.scene.add
      .tileSprite(
        x,
        y,
        roomWidth,
        this.scene.textures.get(layer.texture).getSourceImage().height,
        layer.texture
      )
      .setLighting(true)
      .setScrollFactor(layer.scrollFactor, 0)
      .setOrigin(0.5, 0.5)
      .setDepth(depth);
  }
}
