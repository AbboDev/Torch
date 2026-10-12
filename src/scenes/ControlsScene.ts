import * as Phaser from "phaser";
import { ControllerKey } from "@/input/ControllerKey";
import {
  InputDevice,
  InputMode,
  describeKey,
  nextMode,
} from "@/input/bindings";
import { ContinuousScene } from "@/scenes/ContinuousScene";
import { TILE_SIZE } from "@/config/tiles";

const ACTIONS: ReadonlyArray<[ControllerKey, string]> = [
  [ControllerKey.UP, "Up"],
  [ControllerKey.DOWN, "Down"],
  [ControllerKey.LEFT, "Left"],
  [ControllerKey.RIGHT, "Right"],
  [ControllerKey.A, "Jump"],
  [ControllerKey.B, "Shoot"],
  [ControllerKey.X, "Dash"],
  [ControllerKey.Y, "Switch weapon"],
  [ControllerKey.L, "Aim"],
  [ControllerKey.START, "Menu"],
  [ControllerKey.SELECT, "Controls"],
];

const MODE_LABEL: Record<InputMode, string> = {
  keyboard: "Keyboard",
  keyboardMouse: "Keyboard + Mouse",
  gamepad: "Gamepad",
};

/** The rows after the actions: the device is row 0, so the actions are 1..n */
const RESET_ROW = ACTIONS.length + 1;
const BACK_ROW = ACTIONS.length + 2;
const ROW_COUNT = ACTIONS.length + 3;

/** Wait this long (ms) for a key before giving up */
const CAPTURE_TIMEOUT = 5000;

/** Keys which always work in this menu, so a bad binding never locks it */
const FIXED_KEYS: Record<string, string> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  Space: "confirm",
  Escape: "back",
};

interface RawPress {
  device: "keyboard" | "mouse";
  code: string;
}

/**
 * Choose the input device and the keys. It is opened from the inventory
 * (Select) and goes back to it. The keys are captured as `event.code`, so the
 * scene listens to the window by itself while it is waiting for one.
 */
export class ControlsScene extends ContinuousScene {
  private rows: Phaser.GameObjects.Text[] = [];

  private footer!: Phaser.GameObjects.Text;

  private selected = 0;

  /** The button waiting for a new key */
  private capturing: ControllerKey | undefined;

  private captureSince = 0;

  /** A gamepad button is still held from the last action: do not read it again */
  private waitRelease = false;

  private note = "";

  /** The revision of the Controller shown now: it changes with the reset combination */
  private shownRevision = 0;

  /** The keys and clicks since the last frame */
  private pressed: RawPress[] = [];

  public constructor() {
    super({
      active: false,
      visible: false,
      key: "controls",
    });
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (!this.sys.isActive() || event.repeat) {
      return;
    }

    this.pressed.push({ device: "keyboard", code: event.code });

    // Space and the arrows would scroll the page
    const isShortcut = event.altKey || event.ctrlKey || event.metaKey;
    if (!isShortcut && (this.capturing || event.code in FIXED_KEYS)) {
      event.preventDefault();
    }
  };

  private readonly onMouseDown = (event: MouseEvent): void => {
    if (this.sys.isActive()) {
      this.pressed.push({ device: "mouse", code: `Mouse${event.button}` });
    }
  };

  public create(): void {
    super.create();

    const { width } = this.scale;
    const style: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: `${TILE_SIZE}px`,
    };

    this.add
      .text(width / 2, TILE_SIZE / 2, "controls", style)
      .setOrigin(0.5);

    for (let row = 0; row < ROW_COUNT; row++) {
      this.rows.push(this.add.text(TILE_SIZE * 2, 26 + row * 19, "", style));
    }

    this.footer = this.add.text(TILE_SIZE * 2, 300, "", {
      fontSize: `${TILE_SIZE * 0.75}px`,
      wordWrap: { width: width - TILE_SIZE * 4 },
    });

    this.cameras.main.setBackgroundColor("rgba(0, 0, 0, 0.75)");

    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("mousedown", this.onMouseDown);

    const stopListening = () => {
      window.removeEventListener("keydown", this.onKeyDown);
      window.removeEventListener("mousedown", this.onMouseDown);
    };
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, stopListening);
    this.events.once(Phaser.Scenes.Events.DESTROY, stopListening);

    this.events.on(Phaser.Scenes.Events.WAKE, () => this.open());
    this.open();
  }

  public update(time: number): void {
    const controller = this.getController();
    const queue = this.pressed;
    this.pressed = [];

    if (controller.getRevision() !== this.shownRevision) {
      this.render();
    }

    if (this.capturing) {
      this.capture(time, queue);

      return;
    }

    // A gamepad button held from the last action would act again
    if (this.waitRelease) {
      if (controller.getHeldPadCodes().length > 0) {
        return;
      }

      this.waitRelease = false;
    }

    const fixed = new Set(
      queue.filter((p) => p.device === "keyboard").map((p) => FIXED_KEYS[p.code])
    );
    const first = (key: ControllerKey, name: string): boolean =>
      controller.isKeyPressedForFirstTime(key) || fixed.has(name);

    const up = first(ControllerKey.UP, "up");
    const down = first(ControllerKey.DOWN, "down");
    const left = first(ControllerKey.LEFT, "left");
    const right = first(ControllerKey.RIGHT, "right");
    const confirm = first(ControllerKey.A, "confirm");
    const back =
      controller.isKeyPressedForFirstTime(ControllerKey.START) ||
      controller.isKeyPressedForFirstTime(ControllerKey.SELECT) ||
      fixed.has("back");

    if (back) {
      this.scene.sleep().wake("inventory");
    } else if (up || down) {
      this.selected = (this.selected + (up ? ROW_COUNT - 1 : 1)) % ROW_COUNT;
      this.render();
    } else if ((left || right) && this.selected === 0) {
      this.changeMode(left ? -1 : 1);
    } else if (confirm) {
      this.confirm(time);
    }
  }

  private open(): void {
    this.capturing = undefined;
    this.note = "";
    this.pressed = [];
    this.waitRelease = true;
    this.render();
  }

  private changeMode(step: number): void {
    const controller = this.getController();

    controller.setMode(nextMode(controller.getMode(), step));
    this.note = "";
    this.waitRelease = true;
    this.render();
  }

  private confirm(time: number): void {
    if (this.selected === 0) {
      this.changeMode(1);
    } else if (this.selected === RESET_ROW) {
      this.getController().resetBindings();
      this.note = "Default keys restored";
      this.render();
    } else if (this.selected === BACK_ROW) {
      this.scene.sleep().wake("inventory");
    } else {
      this.capturing = ACTIONS[this.selected - 1][0];
      this.captureSince = time;
      this.waitRelease = true;
      this.note = "";
      this.render();
    }
  }

  /** Wait for the next key, click or gamepad button of the device in use */
  private capture(time: number, queue: RawPress[]): void {
    const controller = this.getController();
    const mode = controller.getMode();
    const usesGamepad = mode === "gamepad" && controller.hasGamepad();

    if (
      queue.some((p) => p.device === "keyboard" && p.code === "Escape") ||
      time - this.captureSince > CAPTURE_TIMEOUT
    ) {
      this.capturing = undefined;
      this.render();

      return;
    }

    let taken: { device: InputDevice; code: string } | undefined;

    if (usesGamepad) {
      const held = controller.getHeldPadCodes();

      if (this.waitRelease) {
        this.waitRelease = held.length > 0;
      } else if (held.length > 0) {
        taken = { device: "gamepad", code: held[0] };
      }
    } else {
      taken = queue.find((p) => p.device === "keyboard" || mode === "keyboardMouse");
    }

    if (!taken || !this.capturing) {
      return;
    }

    const lost = controller.bind(this.capturing, taken.code, taken.device);
    const labelOf = (key: ControllerKey) =>
      ACTIONS.find(([action]) => action === key)?.[1] ?? key;

    this.note = lost.length ? `Taken from: ${lost.map(labelOf).join(", ")}` : "";
    this.capturing = undefined;
    this.waitRelease = true;
    this.render();
  }

  private render(): void {
    const controller = this.getController();
    const mode = controller.getMode();
    const usesGamepad = mode === "gamepad" && controller.hasGamepad();
    const devices: InputDevice[] = usesGamepad
      ? ["gamepad"]
      : mode === "keyboardMouse"
        ? ["keyboard", "mouse"]
        : ["keyboard"];

    const lines: string[] = [
      `${"Device".padEnd(16)}< ${MODE_LABEL[mode]} >`,
      ...ACTIONS.map(([key, label]) => {
        const keys = devices
          .flatMap((device) => controller.getBindings(device)[key])
          .map(describeKey)
          .join(" / ");

        return `${label.padEnd(16)}${this.capturing === key ? "..." : keys || "-"}`;
      }),
      "Reset to defaults",
      "Back",
    ];

    lines.forEach((line, row) => {
      const isSelected = row === this.selected;

      this.rows[row]
        .setText(`${isSelected ? "> " : "  "}${line}`)
        .setColor(isSelected ? "#efc53f" : "#ffffff");
    });

    let footer = this.note;

    if (this.capturing) {
      footer = `${usesGamepad ? "Press a gamepad button" : "Press a key"} - Esc cancels`;
    } else if (!footer && mode === "gamepad" && !usesGamepad) {
      footer = "No gamepad found (press a button on it): the keyboard still works";
    } else if (!footer) {
      footer =
        "Up/Down: choose   Left/Right: device   A or Space: change key\n" +
        "Stuck? Hold Shift+Backspace (or Select+Start on the pad) for 2 s to reset";
    }

    this.footer.setText(footer);
    this.shownRevision = controller.getRevision();
  }
}
