/**
 * The backgrounds a room can have: the "background" property of a room in
 * Tiled is one of the names below.
 *
 * The layers go from the farthest to the nearest. The first one is fixed on
 * the screen (the sky); the others scroll horizontally with the camera, with
 * a `scrollFactor` between 0 (as fixed as the sky) and 1 (as the tiles of
 * the world). When it is not given, it grows with the position of the layer:
 * layer / number of layers.
 *
 * Every texture must be loaded by the PreloaderScene.
 */
export interface BackgroundLayer {
  texture: string;
  scrollFactor?: number;
}

export const BACKGROUNDS: Readonly<Record<string, readonly BackgroundLayer[]>> =
  {
    laboratory: [
      { texture: "laboratory-back" },
      { texture: "laboratory-middle" },
      { texture: "laboratory-front" },
    ],
    mountains: [
      { texture: "mountains-sky" },
      { texture: "mountains-mountain_far" },
      { texture: "mountains-mountains" },
      { texture: "mountains-trees" },
      { texture: "mountains-foreground_trees" },
    ],
  };
