import * as Phaser from "phaser";
import { ENEMY_DEFINITIONS, ENEMY_KINDS } from "@/config/enemies";

/**
 * Make the textures of the enemies which have no art yet: a box of their
 * color, with a light stripe on its top and a light square on its front (the
 * right), so that it can be seen which way it stands and goes. When a kind has
 * a sprite, load it with the key `texture` of its definition, and it is used
 * instead (a texture which exists is not made).
 */
export function createEnemyTextures(scene: Phaser.Scene): void {
  for (const kind of ENEMY_KINDS) {
    const { texture, color, width, height } = ENEMY_DEFINITIONS[kind];

    if (scene.textures.exists(texture)) {
      continue;
    }

    const graphics = scene.make.graphics({ x: 0, y: 0 }, false);

    const light = Phaser.Display.Color.ValueToColor(color).lighten(45).color;

    graphics.fillStyle(color, 1).fillRect(0, 0, width, height);
    graphics.fillStyle(light, 1).fillRect(0, 0, width, 3);
    graphics.fillRect(width - 4, Math.floor(height / 2) - 2, 4, 4);
    graphics.generateTexture(texture, width, height);
    graphics.destroy();
  }
}
