import type { DamageSource } from "@/combat/damage";

/** What a liquid does to the Player who is in it, every `LIQUID_TICK` ms */
export interface LiquidEffect {
  /** What hurts at every tick: it goes through the defense of the Player */
  damage: DamageSource;
  /** Battery lost at every tick */
  battery: number;
  /** The colors of the corners of the sprite, which flash at every tick */
  tint: [number, number?, number?, number?];
}

/** Milliseconds between two ticks of the damage of a liquid */
export const LIQUID_TICK = 200;

/**
 * The liquids which hurt, by the "liquid" property of their tile in Tiled.
 * Water and the others do nothing but slow the Player down.
 */
export const LIQUID_EFFECTS: Readonly<Record<string, LiquidEffect>> = {
  acid: {
    damage: { kind: "acid", amount: 3 },
    battery: 2,
    tint: [0x00ff00, 0xff00ff, 0x00ff00],
  },
  lava: {
    damage: { kind: "fire", amount: 2 },
    battery: 0,
    tint: [0xffff00, 0xffff00, 0xff0000, 0xff0000],
  },
};
