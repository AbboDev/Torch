/**
 * The status of something the Player can own and turn on or off
 * (a power-up, a weapon)
 */
export enum Switch {
  /** Owned and turned on */
  ENABLE = "true",
  /** Owned, but turned off */
  DISABLE = "false",
  /** Not owned (yet) */
  INDETERMINATE = "null",
}
