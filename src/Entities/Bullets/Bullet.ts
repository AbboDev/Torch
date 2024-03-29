import { Facing, getSign } from 'Miscellaneous/Direction';

import { MapScene } from 'Scenes/MapScene';

import { BULLET_DEPTH } from 'Config/depths';
import { DEFAULT_BULLET_LIGHT } from 'Config/lights';
import { TILE_SIZE } from 'Config/tiles';

export interface BulletConfig {
  position: Phaser.Math.Vector2,
  diagonal: boolean,
  facing: Facing
}

export class Bullet extends Phaser.Physics.Arcade.Sprite {
  /**
   * The Bullet Phaser body
   *
   * @type {Phaser.Physics.Arcade.Body}
   */
  public body!: Phaser.Physics.Arcade.Body;

  /**
   * The baseSpeed of the bullet
   *
   * @type {Number}
   */
  private _speed = 64;

  /**
   * If true, the bullet will slowly fall down
   *
   * @type {Number}
   */
  protected allowGravity = false;

  /**
   * If true, the bullet will emit light
   *
   * @type {Number}
   */
  protected hasLight = false;

  /**
   * If hasLight is true, determine the light radius
   *
   * @type {Number}
   */
  protected lightRadius: null | number = null;

  /**
   * If hasLight is true, determine the light intensity
   *
   * @type {Number}
   */
  protected lightIntensity: null | number = null;

  /**
   * If hasLight is true, determine the light color
   *
   * @type {Number}
   */
  protected lightColor: null | number = null;

  /**
   * The physic light emitted by the bullet
   *
   * @type {Phaser.GameObjects.Light}
   */
  private torchLight!: Phaser.GameObjects.Light | null;

  public constructor(
    public scene: MapScene,
    x: number,
    y: number,
    sprite: string
  ) {
    super(scene, x, y, sprite);

    this.scene.physics.world.enable(this);

    this
      // .setPipeline('Light2D');
      .setDepth(BULLET_DEPTH)
      .setOrigin(0.5, 0)
      .setBounce(0);

    this.body.onWorldBounds = true;
  }

  // eslint-disable-next-line
  public static preload(scene: Phaser.Scene): void {}

  public fire(config: BulletConfig): void {
    const sign = getSign(config.facing);
    // Test if the bullet should be shot diagonally or vertically
    if (!config.diagonal && sign.y !== 0) {
      sign.x = 0;
    }

    this
      .setPosition(config.position.x, config.position.y)
      .setVelocity(
        this.speed * 5 * sign.x,
        this.speed * 5 * sign.y
      )
      .setScale(sign.x || 1, sign.y || 1)
      .setActive(true)
      .setVisible(true);

    this.body
      // The bullet should not fall
      .setAllowGravity(this.allowGravity)
      // The bullet have to collide with world bounds too
      .setCollideWorldBounds(true);

    if (this.hasLight) {
      const center = this.getCenter();

      this.torchLight = this.scene.lights
        .addLight(center.x, center.y, this.lightRadius || TILE_SIZE * 4)
        .setIntensity(this.lightIntensity || 3)
        .setColor(this.lightColor || DEFAULT_BULLET_LIGHT);
    }

    if (this.allowGravity) {
      this.setGravityY(-TILE_SIZE * 10);
    }

    // Detect if the bullet if touching the world's bound
    this.body.world.on('worldbounds', (body: Phaser.Physics.Arcade.Body) => {
      // Check if the body's game object is the sprite you are listening for
      if (body.gameObject === this) {
        // If it is, then simulate impact
        this.impact();
      }
    });

    let layers: Phaser.Tilemaps.DynamicTilemapLayer[] = this.scene.worldLayer;
    if (!Array.isArray(layers)) {
      layers = [layers];
    }

    for (const layer of layers) {
    // If the bullet is touching anything, then start impact
      this.scene.physics.add.collider(
        this,
        layer,
        (bullet, tile: unknown) => {
          if (tile instanceof Phaser.Tilemaps.Tile && bullet.active) {
            if (tile.index > -1) {
              // is the tile destructible?
              if (tile.layer.name === 'breakables') {
                this.scene.map.removeTileAt(tile.x, tile.y);
              }

              this.impact();
            }
          }
        }
      );
    }
  }

  public update(time: any, delta: number): void {
    super.update(time, delta);

    if (this.torchLight) {
      const center = this.getCenter();
      this.torchLight.setPosition(center.x, center.y);
    }
  }

  /**
   * Stop physics and render updates for this object
   */
  public impact(): void {
    if (this.torchLight) {
      this.scene.lights.removeLight(this.torchLight);
    }

    this
      .setVelocity(0, 0)
      .setActive(false)
      .setVisible(false)
      .destroy();
  }

  /**
   * Return the current bullet's speed
   */
  public get speed(): number {
    return this._speed;
  }

  /**
   * Set a new bullet's speed
   */
  public set speed(speed: number) {
    this._speed = speed;
  }
}
