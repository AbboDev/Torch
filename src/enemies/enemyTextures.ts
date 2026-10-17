import * as Phaser from "phaser";
import { ENEMY_DEFINITIONS, ENEMY_KINDS } from "@/config/enemies";

/**
 * Make the textures of the enemies which have no art yet: a box of their
 * color. When a kind has a sprite, load it with the key `texture` of its
 * definition, and it is used instead (a texture which exists is not made).
 */
export function createEnemyTextures(scene: Phaser.Scene): void {
  for (const kind of ENEMY_KINDS) {
    const { texture, color, width, height } = ENEMY_DEFINITIONS[kind];

    if (scene.textures.exists(texture)) {
      continue;
    }

    const graphics = scene.make.graphics({ x: 0, y: 0 }, false);

    graphics.fillStyle(color, 1).fillRect(0, 0, width, height);
    graphics.generateTexture(texture, width, height);
    graphics.destroy();
  }
}
