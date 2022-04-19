import * as Phaser from 'phaser';
import { DataScene } from 'Scenes';
import { TILE_SIZE } from 'Config/tiles';
import {
  Bow,
  Gun,
  Rifle,
  Weapon
} from 'Entities/Weapons';

export class HUDScene extends DataScene {
  private life!: Phaser.GameObjects.Image;

  private lifeCounter!: Phaser.GameObjects.Text;

  private battery!: Phaser.GameObjects.Image;

  private batteryCounter!: Phaser.GameObjects.Text;

  private ammo!: Phaser.GameObjects.Image;

  private ammoCounter!: Phaser.GameObjects.Text;

  private currentWeapon!: Phaser.GameObjects.Text;

  private debugger!: Phaser.GameObjects.Text;

  public constructor() {
    super({
      active: false,
      visible: false,
      key: 'hud'
    });
  }

  public create(): void {
    super.create();

    const style: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: `${TILE_SIZE}px`
    };

    let life = 0;
    if (this.registry.has('life')) {
      life = this.registry.get('life') as number;
    }

    let battery = 0;
    if (this.registry.has('battery')) {
      battery = this.registry.get('battery') as number;
    }

    let ammo = 0;
    if (this.registry.has('ammo')) {
      ammo = this.registry.get('ammo') as number;
    }

    let maxAmmo = 0;
    if (this.registry.has('maxAmmo')) {
      maxAmmo = this.registry.get('maxAmmo') as number;
    }

    let offset: number = TILE_SIZE * 0.5;

    this.life = this.add.image(offset, TILE_SIZE * 0.5, 'life')
      .setSize(TILE_SIZE, TILE_SIZE)
      .setScale(0.5)
      .setOrigin(0);

    offset += TILE_SIZE * 1.5;

    this.lifeCounter = this.add.text(offset, TILE_SIZE * 0.5, life.toString(), style)
      .setAlign('center')
      .setOrigin(0);

    offset += TILE_SIZE * 2;

    this.battery = this.add.image(offset, TILE_SIZE * 0.5, 'battery')
      .setSize(TILE_SIZE, TILE_SIZE)
      .setScale(0.5)
      .setOrigin(0);

    offset += TILE_SIZE * 1.5;

    this.batteryCounter = this.add.text(offset, TILE_SIZE * 0.5, battery.toString(), style)
      .setAlign('center')
      .setOrigin(0);

    this.ammo = this.add.image(
      (this.game.scale.width) - TILE_SIZE * 6,
      TILE_SIZE * 0.5,
      'ammo'
    )
      .setSize(TILE_SIZE, TILE_SIZE)
      .setScale(0.5)
      .setOrigin(1, 0);

    this.ammoCounter = this.add.text(
      (this.game.scale.width) - TILE_SIZE,
      TILE_SIZE * 0.5,
      `${ammo.toString()} / ${maxAmmo.toString()}`,
      style
    )
      .setAlign('right')
      .setOrigin(1, 0);

    this.currentWeapon = this.add.text(
      (this.game.scale.width) - TILE_SIZE * 7,
      TILE_SIZE * 0.5,
      this.getWeaponGraphic(),
      {
        ...style,
        backgroundColor: '#ffffff',
        color: '#ff0000'
      }
    )
      .setAlign('right')
      .setOrigin(1, 0);

    this.debugger = this.add.text(
      TILE_SIZE / 2,
      (this.game.scale.height) - TILE_SIZE,
      'x: 0 | y: 0 | Vx: 0 | Vy : 0',
      {
        fontSize: '10px'
      }
    )
      .setAlign('left')
      .setOrigin(0);

    const mainScene = this.scene.get('main');
    mainScene.events
      .addListener('debugPlayer', (data: any) => {
        const x = data.position.x.toFixed(3);
        const y = data.position.y.toFixed(3);
        const Vx = data.velocity.x.toFixed(3);
        const Vy = data.velocity.y.toFixed(3);

        this.debugger.setText(`x: ${x} | y: ${y} | Vx: ${Vx} | Vy: ${Vy}`);
      });

    const gateway = this.scene.get('gateway');
    gateway.events
      .addListener('changedWeapon', (weapon: Weapon) => {
        this.currentWeapon.setText(this.getWeaponGraphic());
      });
  }

  public update(time: any, delta: number): void {
    super.update(time, delta);

    this.debugger.setVisible(this.physics.world.drawDebug);
  }

  protected updateData(
    parent: Phaser.Game,
    key: string,
    data: string | number
  ): void {
    let maxAmmo = 0;
    if (this.registry.has('maxAmmo')) {
      maxAmmo = this.registry.get('maxAmmo') as number;
    }

    switch (key) {
      case 'ammo':
      case 'maxAmmo':
        this.ammoCounter.setText(`${data.toString()} / ${maxAmmo.toString()}`);
        break;
      case 'life':
      case 'maxLife':
        this.lifeCounter.setText(data.toString());
        break;
      case 'battery':
      case 'maxBattery':
        this.batteryCounter.setText(data.toString());
        break;
      default:
        break;
    }
  }

  private getWeaponGraphic(): string {
    let currentWeaponString: string = 'N';
    if (this.getInventory().hasAtLeastOneRangeWeapon()) {
      const currentWeapon: Weapon | null = this.getInventory().getCurrentWeapon();

      if (currentWeapon instanceof Gun) {
        currentWeaponString = 'G';
      } else if (currentWeapon instanceof Rifle) {
        currentWeaponString = 'R';
      } else if (currentWeapon instanceof Bow) {
        currentWeaponString = 'B';
      }
    }

    return currentWeaponString;
  }
}