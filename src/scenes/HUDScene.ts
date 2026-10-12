import * as Phaser from "phaser";
import { DataScene } from "@/scenes/DataScene";
import { TILE_SIZE } from "@/config/tiles";
import { StatKey } from "@/state/GameState";
import { WEAPON_META } from "@/config/weapons";

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
      key: "hud",
    });
  }

  public create(): void {
    super.create();

    const style: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: `${TILE_SIZE}px`,
    };

    const state = this.getGameState();
    const life = state.get("life");
    const battery = state.get("battery");
    const ammo = state.get("ammo");
    const maxAmmo = state.get("maxAmmo");

    let offset: number = TILE_SIZE * 0.5;

    this.life = this.add
      .image(offset, TILE_SIZE * 0.5, "life")
      .setSize(TILE_SIZE, TILE_SIZE)
      .setScale(0.5)
      .setOrigin(0);

    offset += TILE_SIZE * 1.5;

    this.lifeCounter = this.add
      .text(offset, TILE_SIZE * 0.5, life.toString(), style)
      .setAlign("center")
      .setOrigin(0);

    offset += TILE_SIZE * 2;

    this.battery = this.add
      .image(offset, TILE_SIZE * 0.5, "battery")
      .setSize(TILE_SIZE, TILE_SIZE)
      .setScale(0.5)
      .setOrigin(0);

    offset += TILE_SIZE * 1.5;

    this.batteryCounter = this.add
      .text(offset, TILE_SIZE * 0.5, battery.toString(), style)
      .setAlign("center")
      .setOrigin(0);

    this.ammo = this.add
      .image(this.game.scale.width - TILE_SIZE * 6, TILE_SIZE * 0.5, "ammo")
      .setSize(TILE_SIZE, TILE_SIZE)
      .setScale(0.5)
      .setOrigin(1, 0);

    this.ammoCounter = this.add
      .text(
        this.game.scale.width - TILE_SIZE,
        TILE_SIZE * 0.5,
        `${ammo.toString()} / ${maxAmmo.toString()}`,
        style
      )
      .setAlign("right")
      .setOrigin(1, 0);

    this.currentWeapon = this.add
      .text(
        this.game.scale.width - TILE_SIZE * 7,
        TILE_SIZE * 0.5,
        this.getWeaponGraphic(),
        {
          ...style,
          backgroundColor: "#ffffff",
          color: "#ff0000",
        }
      )
      .setAlign("right")
      .setOrigin(1, 0);

    this.debugger = this.add
      .text(
        TILE_SIZE / 2,
        this.game.scale.height - TILE_SIZE,
        "x: 0 | y: 0 | Vx: 0 | Vy : 0",
        {
          fontSize: "10px",
        }
      )
      .setAlign("left")
      .setOrigin(0);

    const mainScene = this.scene.get("main");
    const onDebugPlayer = (data: any) => {
      const x = data.position.x.toFixed(3);
      const y = data.position.y.toFixed(3);
      const Vx = data.velocity.x.toFixed(3);
      const Vy = data.velocity.y.toFixed(3);

      this.debugger.setText(`x: ${x} | y: ${y} | Vx: ${Vx} | Vy: ${Vy}`);
    };
    mainScene.events.on("debugPlayer", onDebugPlayer);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      mainScene.events.off("debugPlayer", onDebugPlayer);
    });

    this.watchState("weapon", () => {
      this.currentWeapon.setText(this.getWeaponGraphic());
    });
  }

  public update(time: any, delta: number): void {
    super.update(time, delta);

    this.debugger.setVisible(this.physics.world.drawDebug);
  }

  protected updateData(key: StatKey, _value: number): void {
    // Always read from the state so that, for instance, a change of
    // maxLife does not overwrite the life counter with the wrong number
    const state = this.getGameState();

    switch (key) {
      case "ammo":
      case "maxAmmo":
        this.ammoCounter.setText(
          `${state.get("ammo")} / ${state.get("maxAmmo")}`
        );
        break;
      case "life":
      case "maxLife":
        this.lifeCounter.setText(state.get("life").toString());
        break;
      case "battery":
      case "maxBattery":
        this.batteryCounter.setText(state.get("battery").toString());
        break;
      default:
        break;
    }
  }

  private getWeaponGraphic(): string {
    const weapon = this.getInventory().getCurrentWeaponId();

    return weapon ? WEAPON_META[weapon].hud : "N";
  }
}
