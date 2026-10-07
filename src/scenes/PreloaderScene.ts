import * as Phaser from "phaser";
import { Player } from "@/entities/Player";
import { GunBullet } from "@/entities/bullets/GunBullet";
import { BowArrow } from "@/entities/bullets/BowArrow";
import { RifleBullet } from "@/entities/bullets/RifleBullet";

export class PreloaderScene extends Phaser.Scene {
  public constructor() {
    super({
      key: "preloader",
    });
  }

  public preload(): void {
    // load assets declared in the preload config

    this.load
      .image("life", "assets/sprites/life.png")
      .image("ammo", "assets/sprites/ammo.png")
      .image("battery", "assets/sprites/battery.png")
      .image("platform", "assets/sprites/platform.png")
      .image("laboratory-back", [
        "assets/images/backgrounds/laboratory/back.png",
        "assets/images/backgrounds/laboratory/back_n.png",
      ])
      .image("laboratory-middle", [
        "assets/images/backgrounds/laboratory/middle.png",
        "assets/images/backgrounds/laboratory/middle_n.png",
      ])
      .image("laboratory-front", [
        "assets/images/backgrounds/laboratory/front.png",
        "assets/images/backgrounds/laboratory/front_n.png",
      ])
      .image("mountains-sky", [
        "assets/images/backgrounds/mountains/sky.png",
        "assets/images/backgrounds/mountains/sky_n.png",
      ])
      .image("mountains-mountain_far", [
        "assets/images/backgrounds/mountains/mountain-far.png",
        "assets/images/backgrounds/mountains/mountain-far_n.png",
      ])
      .image("mountains-mountains", [
        "assets/images/backgrounds/mountains/mountains.png",
        "assets/images/backgrounds/mountains/mountains_n.png",
      ])
      .image("mountains-trees", [
        "assets/images/backgrounds/mountains/trees.png",
        "assets/images/backgrounds/mountains/trees_n.png",
      ])
      .image("mountains-foreground_trees", [
        "assets/images/backgrounds/mountains/foreground-trees.png",
        "assets/images/backgrounds/mountains/foreground-trees_n.png",
      ])
      .image("chozodia_tiles", [
        "assets/tilesets/chozodia.png",
        "assets/tilesets/chozodia_n.png",
      ])
      .image("liquid_tiles", "assets/tilesets/liquids.png")
      .image("full_liquid_tiles", "assets/tilesets/full_liquids.png")
      .tilemapTiledJSON("chozodia_map", "assets/maps/chozodia.json");

    Player.preload(this);
    GunBullet.preload(this);
    BowArrow.preload(this);
    RifleBullet.preload(this);

    const barWidth = 320;
    const barHeight = 16;
    const barX = (this.scale.width - barWidth) / 2;
    const barY = (this.scale.height - barHeight) / 2;
    const barBackground = this.add.graphics();
    barBackground
      .fillStyle(0x202020, 1)
      .fillRect(barX, barY, barWidth, barHeight)
      .lineStyle(1, 0xffffff, 0.65)
      .strokeRect(barX, barY, barWidth, barHeight);

    const bar = this.add.graphics();

    this.load.on("progress", (progress: number) => {
      bar
        .clear()
        .fillStyle(0xb9e185, 1)
        .fillRect(barX, barY, barWidth * progress, barHeight);
    });
  }

  public create(): void {
    Player.create(this);

    this.scene
      .launch("gateway")
      .launch("inventory")
      .sleep("inventory")
      .launch("main")
      .launch("hud")
      .stop();
  }
}
