/** A sound of the game: where it is, and how loud it plays */
export interface SoundConfig {
  key: string;
  file: string;
  volume: number;
}

/**
 * The sounds of the game, in one place to replace the files: the key is what
 * the code uses, the file is what is loaded.
 */
export const SOUNDS = {
  /** The aim has found something which can be hit (PLACEHOLDER) */
  aimTarget: {
    key: "aim_target",
    file: "assets/audio/aim_target.wav",
    volume: 0.3,
  },
} satisfies Record<string, SoundConfig>;
