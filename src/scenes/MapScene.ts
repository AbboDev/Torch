import { ControllerKey } from 'Miscellaneous/Controller';
import { ControlScene } from 'Scenes/ControlScene';

export abstract class MapScene extends ControlScene {
  /**
   * The current static background
   * @type {Phaser.GameObjects.TileSprite}
   */
  public background!: Phaser.GameObjects.TileSprite;

  /**
   * The main tilesmap layer where all the collision will be implemented
   * @type {Phaser.Tilemaps.DynamicTilemapLayer}
   */
  public worldLayer!: Phaser.Tilemaps.DynamicTilemapLayer;

  /**
   * The tilesmap layer just before the background
   * @type {Phaser.Tilemaps.StaticTilemapLayer}
   */
  public belowLayer!: Phaser.Tilemaps.StaticTilemapLayer;

  /**
   * The tilesmap layer above all the elements
   * @type {Phaser.Tilemaps.StaticTilemapLayer}
   */
  public aboveLayer!: Phaser.Tilemaps.StaticTilemapLayer;

  /**
   * The graphic which will render the tiles collision debug
   * @type {Phaser.GameObjects.Graphics}
   */
  public collisionDebugGraphics!: Phaser.GameObjects.Graphics;

  /**
   * The default spawnpoint of the Player
   * @type {Phaser.Types.Tilemaps.TiledObject}
   */
  public spawnPoint!: Phaser.Types.Tilemaps.TiledObject;

  /**
   * The current group of rooms
   * @type {Array<Phaser.Types.Tilemaps.TiledObject>}
   */
  public rooms!: Array<Phaser.Types.Tilemaps.TiledObject>;

  /**
   * The current map stored
   * @type {Phaser.Tilemaps.Tilemap}
   */
  public map!: Phaser.Tilemaps.Tilemap;

  public create(): void {
    super.create();

    this.collisionDebugGraphics = this.add.graphics()
      .setAlpha(0.75)
      .setDepth(10000);

    this.rooms = Array<Phaser.Types.Tilemaps.TiledObject>();
  }

  public update(time: any, delta: number): void {
    // Test if the user is pressing debug key
    if (this.getController().isKeyPressedForFirstTime(ControllerKey.DEBUG)) {
      if (typeof this.physics.world.debugGraphic === 'undefined') {
        // If the game was started without debug enable, than init the graphic
        this.physics.world.createDebugGraphic();
        this.physics.world.drawDebug = true;
      } else {
        // Otherwise, just switch the drawDebug
        this.physics.world.drawDebug = !this.physics.world.drawDebug;
      }

      if (!this.physics.world.drawDebug) {
        // Clean the debugGraphic if the debug was disabled
        this.physics.world.debugGraphic.clear();
      }

      // The tilesmap's collision debug graphic, instead of been clean,
      // will be disable/enable and hide/show
      this.collisionDebugGraphics
        .setActive(this.physics.world.drawDebug)
        .setVisible(this.physics.world.drawDebug);
    }
  }
}
