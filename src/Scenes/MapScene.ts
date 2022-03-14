import * as Phaser from 'phaser';
import { ControlScene } from 'Scenes';
import {
  ControllerKey,
  TiledObject,
  TiledObjectProperty
} from 'Miscellaneous';

import { DEFAULT_LIGHT } from 'Config/lights';

export abstract class MapScene extends ControlScene {
  /**
   * The main tilesmap layer where all the collision will be implemented
   *
   * @type {Phaser.Tilemaps.DynamicTilemapLayer}
   */
  public collisionsLayer!: Phaser.Tilemaps.DynamicTilemapLayer;

  /**
   * The tilesmap layer where all the liquids will be implemented
   *
   * @type {Phaser.Tilemaps.DynamicTilemapLayer}
   */
  public breakablesLayer!: Phaser.Tilemaps.DynamicTilemapLayer;

  /**
   * The tilesmap layer where all the liquids will be implemented
   *
   * @type {Phaser.Tilemaps.DynamicTilemapLayer}
   */
  public liquidsLayer!: Phaser.Tilemaps.DynamicTilemapLayer;

  /**
   * The tilesmap layer just before the background
   *
   * @type {Phaser.Tilemaps.StaticTilemapLayer}
   */
  public belowLayer!: Phaser.Tilemaps.StaticTilemapLayer;

  /**
   * The tilesmap layer above all the elements
   *
   * @type {Phaser.Tilemaps.StaticTilemapLayer}
   */
  public aboveLayer!: Phaser.Tilemaps.StaticTilemapLayer;

  /**
   * The tilesmap layer above all the elements and liquids
   *
   * @type {Phaser.Tilemaps.StaticTilemapLayer}
   */
  public frontLayer!: Phaser.Tilemaps.StaticTilemapLayer;

  /**
   * The graphic which will render the tiles collision debug
   *
   * @type {Phaser.GameObjects.Graphics}
   */
  public collisionDebugGraphics!: Phaser.GameObjects.Graphics;

  /**
   * The default spawnpoint of the Player
   *
   * @type {Phaser.Types.Tilemaps.TiledObject}
   */
  public spawnPoint!: Phaser.Types.Tilemaps.TiledObject;

  /**
   * The current group of rooms
   *
   * @type {TiledObject[]}
   */
  public rooms!: TiledObject[];

  /**
   * The current map stored
   *
   * @type {Phaser.Tilemaps.Tilemap}
   */
  public map!: Phaser.Tilemaps.Tilemap;

  /**
   * The current map background
   *
   * @type {Phaser.GameObjects.Image}
   */
  protected background!: Phaser.GameObjects.Image;

  /**
   * The current map background parallex
   *
   * @type {Phaser.GameObjects.TileSprite}
   */
  protected parallaxes: Phaser.GameObjects.TileSprite[] = [];

  /**
   * Check if the Player overlap room bounds for start transition
   *
   * @type {Boolean}
   */
  public isChangingRoom = false;

  public create(): void {
    super.create();

    this.collisionDebugGraphics = this.add.graphics()
      .setAlpha(0.75)
      .setDepth(10000);

    this.rooms = [];
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

      this.updateCollisionGraphic(this.physics.world.drawDebug);

      // The tilesmap's collision debug graphic, instead of been clean,
      // will be disable/enable and hide/show
    }
  }

  public updateCollisionGraphic(active: boolean): void {
    this.collisionDebugGraphics
      .setActive(active)
      .setVisible(active);
  }

  public setCurrentRoom(x: number, y: number): number {
    const currentRoomNumber: boolean | number = this.getCurrentRoom(x, y);

    if (typeof currentRoomNumber !== 'number') {
      // eslint-disable-next-line no-throw-literal
      throw 'Missing room: player outbound';
    }

    let light = DEFAULT_LIGHT;
    const currentRoom = this.rooms[currentRoomNumber];
    if (!currentRoom.properties) {
      currentRoom.properties = [];
    }

    const { properties } = currentRoom;

    if (properties.length > 0) {
      let hasVisited = false;
      for (const property of properties) {
        switch (property.name) {
          case 'dark': {
            const darkness: string = property.value as string;

            if (darkness && typeof darkness === 'string') {
              light = Phaser.Display.Color.HexStringToColor(darkness).color;
            }
            break;
          }
          case 'visited':
            property.value = true;
            hasVisited = true;
            break;
          default:
            break;
        }
      }

      if (!hasVisited) {
        const visited: TiledObjectProperty = {
          name: 'visited',
          type: 'boolean',
          value: true
        };
        properties.push(visited);
      }
    }

    if (light !== this.lights.ambientColor) {
      this.lights.setAmbientColor(light);
    }

    return currentRoomNumber;
  }

  public getCurrentRoom(x: number, y: number): boolean | number {
    for (const [index, room] of this.rooms.entries()) {
      const roomLeft = room.x || 0;
      const roomRight = roomLeft + (room.width || 0);
      const roomTop = room.y || 0;
      const roomBottom = roomTop + (room.height || 0);

      // Player is within the boundaries of this room
      if (x > roomLeft && x < roomRight && y > roomTop && y < roomBottom) {
        return index;
      }
    }

    return false;
  }

  public get worldLayer(): Phaser.Tilemaps.DynamicTilemapLayer[] {
    return [
      this.collisionsLayer,
      this.breakablesLayer
    ];
  }
}
