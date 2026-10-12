import { BACKGROUNDS, BackgroundLayer } from "@/config/backgrounds";

export interface ResolvedLayer {
  texture: string;
  /** The first layer is a fixed image, the others are tiled and scroll */
  kind: "image" | "tile";
  /** How much it follows the camera horizontally */
  scrollFactor: number;
  /** Added to the depth of the backgrounds: the farthest is the lowest */
  depthOffset: number;
}

/**
 * The layers of a background, ready to be created.
 *
 * @param name  The name given in Tiled (see config/backgrounds.ts)
 * @param table Where to look for it
 *
 * @return The layers, or null if there is no background with that name
 */
export function getBackgroundLayers(
  name: string,
  table: Readonly<Record<string, readonly BackgroundLayer[]>> = BACKGROUNDS
): ResolvedLayer[] | null {
  const layers = Object.prototype.hasOwnProperty.call(table, name)
    ? table[name]
    : undefined;

  if (!layers || layers.length === 0) {
    return null;
  }

  return layers.map((layer, index) => ({
    texture: layer.texture,
    kind: index === 0 ? "image" : "tile",
    scrollFactor:
      index === 0 ? 0 : (layer.scrollFactor ?? index / layers.length),
    depthOffset: index - layers.length,
  }));
}
