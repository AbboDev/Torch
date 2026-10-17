import * as Phaser from "phaser";
import type { Damageable, DamageSource, Defense } from "@/combat/damage";
import { Cooldown } from "@/combat/Cooldown";
import { Health } from "@/combat/Health";
import type { EnemyDefinition } from "@/config/enemies";
import type { EnemySpawn } from "@/enemies/spawns";
import { SpriteCollidable } from "@/entities/collidables/SpriteCollidable";
import type { MapScene } from "@/scenes/MapScene";
import { collidesWithTile } from "@/world/oneWayTiles";

/** What an enemy needs of what it touches: it can be hurt */
export interface Hurtable {
  hurt(source: DamageSource): number;
}

/**
 * The base of every enemy: it is a sprite which stands on the map as the
 * Player does, it has life and a defense (a `Damageable`, so shots, zones and
 * anything which hurts work on it), it can be aimed at and locked on (it is a
 * shootable of the scene), and it hurts the Player which touches it.
 *
 * What changes from an enemy to another is how it thinks: a kind of enemy
 * extends this and writes `think`. To add one, see `config/enemies`.
 */
export abstract class Enemy extends SpriteCollidable implements Damageable {
  declare public body: Phaser.Physics.Arcade.Body;

  protected readonly health: Health;

  private readonly contactCooldown: Cooldown;

  public constructor(
    public scene: MapScene,
    protected readonly spawn: EnemySpawn,
    protected readonly definition: EnemyDefinition
  ) {
    super(scene, spawn.x, spawn.y, definition.texture);

    this.scene.add.existing(this);
    this.scene.physics.world.enable(this);

    // The feet of the enemy are where it was put
    this.setOrigin(0.5, 1);
    this.body
      .setSize(definition.width, definition.height)
      .setCollideWorldBounds(true);

    this.health = new Health(definition.life, definition.defense, () =>
      this.die()
    );
    this.contactCooldown = new Cooldown(definition.contactCooldown);

    // The aim, the lock and the minimap find the enemy here
    const removeShootable = this.scene.shootables.add({
      id: spawn.id,
      contains: (x, y) =>
        x >= this.body.x &&
        x < this.body.x + this.body.width &&
        y >= this.body.y &&
        y < this.body.y + this.body.height,
      position: () =>
        this.active ? { x: this.body.center.x, y: this.body.center.y } : null,
      target: this,
    });

    this.once(Phaser.GameObjects.Events.DESTROY, removeShootable);
  }

  public getDefense(): Defense {
    return this.health.getDefense();
  }

  public takeDamage(amount: number): void {
    this.health.takeDamage(amount);
  }

  /** What happens when the life is over: it goes away. A kind can add to it. */
  protected die(): void {
    this.destroy();
  }

  /**
   * The Player touches the enemy: it is hurt, once in a while.
   *
   * @param time The time of the game, in milliseconds
   */
  public touch(player: Hurtable, time: number): void {
    if (this.active && this.contactCooldown.tryUse(time)) {
      player.hurt(this.definition.contact);
    }
  }

  public update(time: number, delta: number): void {
    super.update(time, delta);

    if (this.active) {
      this.think(time, delta);
    }
  }

  /** What the enemy does at every frame: how it thinks, and how it moves */
  protected abstract think(time: number, delta: number): void;

  protected postCollision(): void {}

  /** The same tiles stop an enemy and the Player: one-way platforms and stairs too */
  protected testCollision(
    self: Phaser.GameObjects.GameObject,
    object: unknown
  ): boolean {
    const tile = object as Phaser.Tilemaps.Tile;

    return collidesWithTile({
      layer: tile.layer.name,
      index: tile.index,
      tileTop: tile.pixelY,
      feetBottom: () => this.body.bottom,
      isDownPressed: () => false,
      hasTileAbove: () =>
        !!this.scene.map.getTileAt(tile.x, tile.y - 1, false, "stairs"),
    });
  }
}
