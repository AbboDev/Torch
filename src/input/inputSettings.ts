import { ControllerKey } from "@/input/ControllerKey";
import {
  DEFAULT_BINDINGS,
  INPUT_DEVICES,
  INPUT_MODES,
  InputDevice,
  InputMode,
  KeyBindings,
} from "@/input/bindings";
import { StorageBackend, defaultBackend } from "@/state/SaveManager";

/** The input choices of the player: not part of a save, they belong to the machine */
export interface InputSettings {
  mode: InputMode;
  bindings: Record<InputDevice, KeyBindings>;
}

export const defaultInputSettings = (): InputSettings => ({
  mode: "keyboard",
  bindings: structuredClone(DEFAULT_BINDINGS),
});

/**
 * Read the stored text, trusting nothing: whatever is missing or wrong falls
 * back to the default, so a corrupted or older file never breaks the game.
 */
export function parseInputSettings(raw: string | null): InputSettings {
  const settings = defaultInputSettings();

  try {
    const data = JSON.parse(raw ?? "null");

    if (INPUT_MODES.includes(data?.mode)) {
      settings.mode = data.mode;
    }

    for (const device of INPUT_DEVICES) {
      for (const button of Object.values(ControllerKey)) {
        const keys = data?.bindings?.[device]?.[button];

        if (Array.isArray(keys) && keys.every((k) => typeof k === "string")) {
          settings.bindings[device][button] = keys;
        }
      }
    }
  } catch {
    // corrupted: the defaults are already there
  }

  return settings;
}

/** Mode and bindings, in their own storage key: separate from the saves */
export class InputSettingsStore {
  public constructor(
    private readonly backend: StorageBackend = defaultBackend(),
    private readonly key = "torch:settings"
  ) {}

  public load(): InputSettings {
    return parseInputSettings(this.backend.getItem(this.key));
  }

  public save(settings: InputSettings): void {
    try {
      this.backend.setItem(this.key, JSON.stringify(settings));
    } catch {
      console.warn("Input settings could not be saved");
    }
  }
}
