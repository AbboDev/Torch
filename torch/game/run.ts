import { game } from './engine.js';
import { ITEM_COUNT, ROOM_COUNT } from './world.js';

export type Upgrade = 'morph-shell' | 'missile-launcher' | 'cryo-beam' | 'sonic-booster' | 'power-bomb';

export type Run = {
    slot: number;
    room: string;                       // the room Vaelen is in
    sanctRoom: string;                  // the last sanctuary she saved at
    have: Record<string, boolean>;      // upgrades owned
    energy: number;
    maxEnergy: number;
    missiles: number;
    maxMissiles: number;
    opened: Record<string, boolean>;    // gates, guardians, items, terminals: anything that stays done
    visited: Record<string, boolean>;   // rooms drawn on the map
    time: number;                       // seconds of play
    escaping: boolean;
    escapeLeft: number;
    ended: boolean;
    // debug switches (never saved)
    infiniteEnergy: boolean;
    infiniteMissiles: boolean;
    invincible: boolean;
    unlockAll: boolean;
    stalkerOff: boolean;
    freezeClock: boolean;
    slowMotion: boolean;
};

export const BASE_ENERGY = 99;
export const TANK_ENERGY = 100;
export const BASE_MISSILES = 10;
export const RESERVE_MISSILES = 5;
export const ESCAPE_SECONDS = 150;

export const run: Run = blank();

function blank(): Run {
    return {
        slot: 0, room: 'landing-atrium', sanctRoom: 'landing-atrium',
        have: {}, energy: BASE_ENERGY, maxEnergy: BASE_ENERGY, missiles: 0, maxMissiles: 0,
        opened: {}, visited: { 'landing-atrium': true }, time: 0, escaping: false, escapeLeft: ESCAPE_SECONDS, ended: false,
        infiniteEnergy: false, infiniteMissiles: false, invincible: false, unlockAll: false,
        stalkerOff: false, freezeClock: false, slowMotion: false,
    };
}

/** Start a fresh game in a slot, at the landing atrium. */
export function newRun(slot: number): void {
    const keep = {
        infiniteEnergy: run.infiniteEnergy, infiniteMissiles: run.infiniteMissiles, invincible: run.invincible,
        unlockAll: run.unlockAll, stalkerOff: run.stalkerOff, freezeClock: run.freezeClock, slowMotion: run.slowMotion
    };
    Object.assign(run, blank(), keep, { slot });
}

export type Save = {
    used: boolean;
    room: string;
    sanctRoom: string;
    have: Record<string, boolean>;
    maxEnergy: number;
    maxMissiles: number;
    opened: Record<string, boolean>;
    visited: Record<string, boolean>;
    time: number;
    sector: number;
    percent: number;
};

export function calcPercent(): number {
    let items = 0;
    const up: Upgrade[] = ['morph-shell', 'missile-launcher', 'cryo-beam', 'sonic-booster', 'power-bomb'];
    for (const u of up) if (run.have[u]) items++;
    for (const k of ['tank-ducts', 'tank-crypt', 'tank-vault', 'reserve-loft', 'reserve-spire']) {
        if (run.opened[k]) items++;
    }
    return Math.min(100, Math.round((items / ITEM_COUNT) * 100));
}

export function calcDiscoveredPercent(): number {
    const visitedCount = Object.keys(run.visited).length;
    return Math.min(100, Math.round((visitedCount / ROOM_COUNT) * 100));
}

/** The run as it is, ready to store. A save is always taken at a safe moment: energy and missiles come back full. */
export function snapshot(sector: number): Save {
    return {
        used: true, room: run.room, sanctRoom: run.sanctRoom, have: { ...run.have }, maxEnergy: run.maxEnergy,
        maxMissiles: run.maxMissiles, opened: { ...run.opened }, visited: { ...run.visited }, time: run.time,
        sector, percent: calcPercent(),
    };
}

export function writeSlot(slot: number, s: Save): void { game.save.write(`slot-${slot}`, s); }
export function readSlot(slot: number): Save | null {
    const s = game.save.read<Save | null>(`slot-${slot}`, null);
    return s && s.used ? s : null;
}
export function eraseSlot(slot: number): void { game.save.remove(`slot-${slot}`); }

/** Make the run the one in a save. Vaelen comes back at the sanctuary she saved at, with full energy and missiles. */
export function applySave(slot: number, s: Save): void {
    newRun(slot);
    run.have = { ...s.have };
    run.maxEnergy = s.maxEnergy; run.maxMissiles = s.maxMissiles;
    run.energy = s.maxEnergy; run.missiles = s.maxMissiles;
    run.opened = { ...s.opened }; run.visited = { ...s.visited };
    run.time = s.time;
    run.room = s.sanctRoom; run.sanctRoom = s.sanctRoom;
}

export function has(u: Upgrade): boolean { return !!run.have[u]; }

export const BEST_KEY = 'best-record';
export type Best = { time: number; percent: number } | null;

export function readBest(): Best {
    return game.save.read<Best>(BEST_KEY, null);
}

export function saveBest(time: number, percent: number): void {
    const prev = readBest();
    if (!prev || time < prev.time || (time === prev.time && percent > prev.percent)) {
        game.save.write(BEST_KEY, { time, percent });
    }
}
