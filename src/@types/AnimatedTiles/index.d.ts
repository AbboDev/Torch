declare module 'phaser-animated-tiles/dist/AnimatedTiles.js';

declare class AnimatedTiles {
  constructor(scene: any, pluginManager: any);
  map: any;
  animatedTiles: any[];
  rate: number;
  active: boolean;
  activeLayer: any[];
  followTimeScale: boolean;
  boot(): void;
  init(map: any): void;
  setRate(rate: any, gid?: any, map?: any): void;
  resetRates(mapIndex?: any): void;
  resume(layerIndex?: any, mapIndex?: any): void;
  pause(layerIndex?: any, mapIndex?: any): void;
  postUpdate(time: any, delta: any): void;
  updateLayer(animatedTile: any, layer: any, oldTileId?: number): void;
  shutdown(): void;
  destroy(): void;
  scene: any;
  getAnimatedTiles(map: any): any[];
  putTileAt(layer: any, tile: any, x: any, y: any): void;
  updateAnimatedTiles(): void;
}

declare namespace AnimatedTiles {
  function register(PluginManager: any): void;
}
