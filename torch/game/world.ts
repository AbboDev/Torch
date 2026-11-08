/**
 * The world: every room as a grid of characters, built with a tiny builder so a room reads as what it holds.
 * Cell characters:
 *   .  empty        ,  dark alcove (empty; crouch in it to hide)      :  morph duct (empty, shell-only)
 *   #  solid        =  one-way platform                               ;  background pillar (empty; blocks sight)
 *   ~  slime / magma    ^  spore spikes    c  crumble flesh-block     s  brittle sandstone    b  calcified bone
 *   B R G Y  blue / red / green / yellow gates       S  sealed hatch (guardian arenas)
 * Positions in entities are tiles: x is the column, y the row the thing stands in (its feet at the cell's bottom).
 */
export const T = 32;

export type Arg = number | string | boolean;
export type EntDef = { kind: string; x: number; y: number; a?: Record<string, Arg> };
export type DoorDef = {
    name: string; x: number; y: number; w: number; h: number;   // the trigger, in tiles
    to: string; toDoor: string; ax: number; ay: number;         // where Vaelen arrives when she comes through it
    lift?: boolean;
};
export type RoomDef = {
    id: string; name: string; sector: number; w: number; h: number; grid: string[];
    ents: EntDef[]; doors: DoorDef[]; map: { x: number; y: number; w: number; h: number };
    ice: boolean; boss: number; safe: boolean; spawn?: { x: number; y: number };
};

class B {
    g: string[][];
    ents: EntDef[] = [];
    doors: DoorDef[] = [];
    ice = false;
    boss = 0;
    safe = false;
    spawn?: { x: number; y: number };
    constructor(public id: string, public name: string, public sector: number, public w: number, public h: number,
        public mx: number, public my: number, floor = 2) {
        this.g = Array.from({ length: h }, () => Array.from({ length: w }, () => '.'));
        this.r(0, 0, w, h, '#');
        this.r(1, 1, w - 2, h - 1 - floor, '.');
    }
    r(x: number, y: number, w: number, h: number, ch: string): this {
        for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (this.g[j]?.[i] !== undefined) this.g[j]![i] = ch;
        return this;
    }
    /** A one-way platform whose top is row y. */
    p(x: number, y: number, len: number): this { return this.r(x, y, len, 1, '='); }
    /** A solid slab whose top is row y. */
    s(x: number, y: number, len: number): this { return this.r(x, y, len, 1, '#'); }
    e(kind: string, x: number, y: number, a?: Record<string, Arg>): this { this.ents.push(a ? { kind, x, y, a } : { kind, x, y }); return this; }
    /** Where Vaelen stands on the floor of this room. */
    get fy(): number { return this.floorRow - 1; }
    floorRow = 0;
    private hole(side: 'L' | 'R', y: number, gate: string): void {
        const x = side === 'L' ? 0 : this.w - 1;
        this.r(x, y, 1, 3, '.');
        if (gate) this.r(side === 'L' ? 1 : this.w - 2, y, 1, 3, gate);
    }
    doorL(name: string, y: number, to: string, toDoor: string, gate = ''): this {
        this.hole('L', y, gate);
        this.doors.push({ name, x: 0, y, w: 1, h: 3, to, toDoor, ax: 3, ay: y + 2 });
        return this;
    }
    doorR(name: string, y: number, to: string, toDoor: string, gate = ''): this {
        this.hole('R', y, gate);
        this.doors.push({ name, x: this.w - 1, y, w: 1, h: 3, to, toDoor, ax: this.w - 4, ay: y + 2 });
        return this;
    }
    /** A one-tile-high duct through the wall that only the shell fits. Row y is the duct. */
    ductL(name: string, y: number, len: number, to: string, toDoor: string): this {
        this.r(0, y - 1, len, 1, '#'); this.r(0, y + 1, len, 1, '#'); this.r(0, y, len, 1, ':');
        this.doors.push({ name, x: 0, y, w: 1, h: 1, to, toDoor, ax: len, ay: y });
        return this;
    }
    ductR(name: string, y: number, len: number, to: string, toDoor: string): this {
        this.r(this.w - len, 0, len, y, '#'); this.r(this.w - len, y + 1, len, 1, '#'); this.r(this.w - len, y, len, 1, ':');
        this.doors.push({ name, x: this.w - 1, y, w: 1, h: 1, to, toDoor, ax: this.w - len - 1, ay: y });
        return this;
    }
    /** An elevator pad: stand on it a moment. */
    lift(name: string, x: number, y: number, to: string, toDoor: string): this {
        this.doors.push({ name, x: x - 1, y: y - 1, w: 3, h: 2, to, toDoor, ax: x, ay: y, lift: true });
        this.e('lift', x, y);
        return this;
    }
    /** A horizontal duct run, a vertical shaft: for shell mazes carved out of solid rock. */
    tun(x: number, y: number, len: number): this { return this.r(x, y, len, 1, ':'); }
    shaft(x: number, y: number, len: number): this { return this.r(x, y, 1, len, ':'); }
    done(): RoomDef {
        return {
            id: this.id, name: this.name, sector: this.sector, w: this.w, h: this.h, grid: this.g.map(r => r.join('')),
            ents: this.ents, doors: this.doors, map: { x: this.mx, y: this.my, w: Math.max(1, Math.round(this.w / 16)), h: Math.max(1, Math.round(this.h / 12)) },
            ice: this.ice, boss: this.boss, safe: this.safe, ...(this.spawn ? { spawn: this.spawn } : {}),
        };
    }
}

/** A standard room: a floor `floor` rows thick, standing row h - floor - 1. */
function room(id: string, name: string, sector: number, w: number, h: number, mx: number, my: number, floor = 2): B {
    const b = new B(id, name, sector, w, h, mx, my, floor);
    b.floorRow = h - floor;
    return b;
}

const rooms: Record<string, RoomDef> = {};
const add = (b: B): void => { rooms[b.id] = b.done(); };

// ───────────────────────────── Sector 1: The Sunken Overgrowth ─────────────────────────────

{   // The safe, sunny start: wide floors and lone, slow crawlers.
    const b = room('landing-atrium', 'Landing Atrium', 1, 48, 23, 0, 2);
    b.spawn = { x: 5, y: 20 };
    b.p(10, 17, 6).p(20, 14, 5).p(31, 17, 6);
    b.e('crawler', 18, 20).e('crawler', 34, 20);
    b.doorR('r', 18, 'ruined-nave', 'l', 'B');
    add(b);
}
{   // Ledges out of reach: some places come later. The top ledge holds a red gate.
    const b = room('ruined-nave', 'The Ruined Nave', 1, 48, 30, 3, 0);
    b.doorL('l', 25, 'landing-atrium', 'r', 'B').doorR('r', 25, 'nursery-sanctuary-alpha', 'l', 'B');
    b.p(6, 25, 5).p(14, 22, 5).p(22, 19, 5).p(30, 16, 5).p(22, 13, 5).p(14, 10, 5);
    b.s(1, 7, 11);
    b.doorL('loft', 4, 'nave-loft', 'r', 'R');
    b.p(38, 22, 5).p(40, 17, 5);
    b.e('crawler', 8, 24).e('crawler', 24, 18).e('crawler', 24, 12).e('crawler', 36, 27).e('crawler', 16, 21);
    add(b);
}
{
    const b = room('nave-loft', 'Nave Loft', 1, 24, 14, 1, 0);
    b.doorR('r', 9, 'ruined-nave', 'loft', 'R');
    b.e('reserve', 6, 11, { id: 'reserve-loft' });
    add(b);
}
{
    const b = room('nursery-sanctuary-alpha', 'Nursery Sanctuary Alpha', 1, 32, 15, 6, 2);
    b.safe = true;
    b.doorL('l', 10, 'ruined-nave', 'r', 'B').doorR('r', 10, 'thorny-burrow', 'l', 'B');
    b.e('sanctuary', 16, 12).e('terminal', 6, 12).lift('hub', 25, 12, 'central-transit-shaft', 'n1');
    add(b);
}
{   // The Morph Bio-Shell, with a spike pit to cross and a shell-only duct beyond it.
    const b = room('thorny-burrow', 'The Thorny Burrow', 1, 44, 23, 8, 2);
    b.doorL('l', 18, 'nursery-sanctuary-alpha', 'r', 'B');
    b.r(14, 20, 7, 1, '^').r(14, 21, 7, 1, '#');
    b.p(15, 18, 2).p(18, 18, 2);
    b.e('crawler', 9, 20).e('crawler', 27, 20).e('crawler', 31, 20);
    b.e('pedestal', 37, 20, { item: 'morph-shell' });
    b.ductR('d', 20, 3, 'drainage-ducts', 'd');
    add(b);
}
{   // A shell-only maze, rolling downhill: sandstone to crack, and a hidden pocket with an energy tank.
    const b = room('drainage-ducts', 'Sub-Floor Drainage Ducts', 1, 56, 24, 8, 4);
    b.r(1, 1, 54, 22, '#');
    b.doorL('d', 3, 'thorny-burrow', 'd', ''); b.r(0, 3, 4, 1, ':');
    b.tun(0, 3, 17).shaft(16, 3, 6);
    b.tun(16, 8, 20).r(25, 8, 1, 1, 's');
    b.r(30, 9, 1, 1, 's').shaft(30, 10, 2).tun(22, 11, 9).shaft(22, 11, 4);
    b.e('tank', 24, 11, { id: 'tank-ducts' });
    b.shaft(35, 8, 7).tun(21, 14, 15).r(27, 14, 1, 1, 's').shaft(21, 14, 6);
    b.tun(21, 19, 34);
    b.doors.push({ name: 'x', x: 55, y: 19, w: 1, h: 1, to: 'broodmother-conservatory', toDoor: 'd', ax: 51, ay: 19 });
    b.r(55, 19, 1, 1, ':');
    add(b);
}
{   // Guardian arena: a greenhouse dome. It drops the Bio-Missile Launcher.
    const b = room('broodmother-conservatory', "Broodmother's Conservatory", 1, 40, 23, 12, 4);
    b.boss = 1;
    b.ductL('d', 20, 3, 'drainage-ducts', 'x');
    b.doors[0]!.ax = 4; b.doors[0]!.ay = 20;
    b.e('boss', 29, 20, { n: 1 });
    b.doorR('r', 18, 'central-transit-shaft', 'n1', 'S');
    add(b);
}

// ───────────────────────────── The Central Transit Shaft ─────────────────────────────
{
    const b = room('central-transit-shaft', 'Central Transit Shaft', 0, 72, 23, 4, 7);
    b.r(20, 0, 1, 23, '#').r(20, 18, 1, 3, 'R');        // sector 2 lies behind red gates
    b.r(40, 0, 1, 23, '#').r(40, 18, 1, 3, 'G');        // sector 3 behind green ones
    b.lift('n1', 4, 20, 'nursery-sanctuary-alpha', 'hub');
    b.lift('n2', 25, 20, 'glacial-shaft', 'hub');
    b.lift('n3', 46, 20, 'molten-incline', 'hub');
    b.lift('n4', 66, 20, 'booster-runway', 'hub');
    b.p(10, 16, 6).p(28, 16, 6).p(50, 16, 6).p(58, 13, 6);
    add(b);
}

// ───────────────────────────── Sector 2: The Cryogenic Catacombs ─────────────────────────────
{   // A steep icy climb: slick floors and falling icicles.
    const b = room('glacial-shaft', 'The Glacial Shaft', 2, 36, 40, 0, 9);
    b.ice = true;
    b.lift('hub', 4, 37, 'central-transit-shaft', 'n2');
    b.p(8, 35, 6).p(17, 32, 6).p(26, 29, 6).p(17, 26, 6).p(8, 23, 6).p(17, 20, 6).p(26, 17, 6).p(17, 14, 6).p(8, 11, 6).p(17, 8, 6);
    b.s(22, 5, 13).doorR('r', 2, 'red-gate-threshold', 'l', 'B');
    for (const [x, y] of [[24, 24], [15, 14], [24, 9], [15, 2]] as const) { b.s(x, y, 1); b.e('icicle', x, y + 1); }
    b.e('drifter', 12, 28).e('drifter', 22, 12);
    add(b);
}
{   // The first missile gate.
    const b = room('red-gate-threshold', 'The Red Gate Threshold', 2, 40, 23, 3, 10);
    b.ice = true;
    b.doorL('l', 18, 'glacial-shaft', 'r', 'B').doorR('r', 18, 'chitinous-chasm', 'l', 'B');
    b.r(20, 1, 1, 17, '#').r(20, 18, 1, 3, 'R');
    b.e('crawler', 10, 20).e('crawler', 30, 20);
    add(b);
}
{   // Slime pools to bridge, leapers on the upper ledges, and a duct to the crypt.
    const b = room('chitinous-chasm', 'Chitinous Chasm', 2, 56, 26, 6, 10);
    b.doorL('l', 21, 'red-gate-threshold', 'r', 'B').doorR('r', 21, 'catacomb-sanctuary-beta', 'l', 'B');
    b.r(14, 23, 13, 2, '~').p(15, 20, 3).p(20, 20, 3);
    b.r(33, 23, 7, 2, '~').p(42, 20, 2).p(45, 17, 2);
    b.p(8, 17, 8).p(29, 17, 9);
    b.e('leaper', 12, 16).e('leaper', 33, 16).e('crawler', 6, 23).e('crawler', 29, 23);
    b.s(47, 14, 8).ductR('c', 13, 3, 'crypt-of-relics', 'c');
    add(b);
}
{   // A secret shell puzzle over crumble flesh-blocks, with an energy tank at the end.
    const b = room('crypt-of-relics', 'The Crypt of Relics', 2, 36, 20, 6, 13);
    b.ice = true;
    b.r(1, 1, 34, 17, '#');
    b.ductL('c', 5, 3, 'chitinous-chasm', 'c');
    b.tun(3, 5, 20).r(3, 6, 10, 1, 'c').r(3, 7, 10, 1, '^');
    b.r(3, 7, 10, 1, '^');
    b.e('tank', 22, 5, { id: 'tank-crypt' });
    add(b);
}
{
    const b = room('catacomb-sanctuary-beta', 'Catacomb Sanctuary Beta', 2, 32, 15, 10, 10);
    b.safe = true;
    b.doorL('l', 10, 'chitinous-chasm', 'r', 'B').doorR('r', 10, 'arena-of-frostbound', 'l', 'B');
    b.e('sanctuary', 16, 12).e('terminal', 6, 12);
    add(b);
}
{   // Guardian arena: a frosted colosseum. It drops the Cryo-Beam Infusion.
    const b = room('arena-of-frostbound', 'Arena of the Frostbound', 2, 40, 23, 12, 10);
    b.boss = 2;
    b.doorL('l', 18, 'catacomb-sanctuary-beta', 'r', 'B').doorR('r', 18, 'central-transit-shaft', 'n2', 'S');
    b.e('boss', 30, 20, { n: 2 });
    add(b);
}

// ───────────────────────────── Sector 3: The Geothermal Foundry ─────────────────────────────
{   // Spore drifters over magma trenches: freeze them to cross.
    const b = room('molten-incline', 'The Molten Incline', 3, 56, 26, 17, 7);
    b.lift('hub', 4, 23, 'central-transit-shaft', 'n3');
    b.r(12, 23, 11, 2, '~').r(31, 23, 11, 2, '~');
    b.e('drifter', 14, 20, { amp: 1 }).e('drifter', 19, 20, { amp: 1 }).e('drifter', 33, 20, { amp: 1 }).e('drifter', 38, 20, { amp: 1 });
    b.e('crawler', 27, 23).e('crawler', 47, 23);
    b.doorR('r', 21, 'echoing-galleries', 'l');
    add(b);
}
{   // The Stalker's domain: alcoves, pillars and a shell nook to hide in. The far airlock ends the chase.
    const b = room('echoing-galleries', 'The Echoing Galleries', 3, 64, 25, 21, 7, 4);
    b.doorL('l', 18, 'molten-incline', 'r').doorR('r', 18, 'foundry-sanctuary-gamma', 'l');
    b.r(12, 19, 3, 2, ',').r(37, 19, 3, 2, ',').r(53, 19, 3, 2, ',');
    b.r(24, 13, 2, 8, ';').r(45, 13, 2, 8, ';');
    b.r(30, 21, 1, 1, ':').r(30, 22, 7, 1, ':');
    b.p(8, 15, 4).p(33, 15, 5).p(50, 15, 4);
    b.e('stalker', 30, 3);
    add(b);
}
{
    const b = room('foundry-sanctuary-gamma', 'Foundry Sanctuary Gamma', 3, 32, 15, 25, 7);
    b.safe = true;
    b.doorL('l', 10, 'echoing-galleries', 'r').doorR('r', 10, 'turbine-assembly-floor', 'l');
    b.e('sanctuary', 16, 12).e('terminal', 6, 12);
    add(b);
}
{   // Catwalks under steam valves, siphon swarms and a slime basin.
    const b = room('turbine-assembly-floor', 'Turbine Assembly Floor', 3, 56, 26, 21, 9);
    b.doorL('l', 21, 'foundry-sanctuary-gamma', 'r').doorR('r', 21, 'magnetic-caldera', 'l');
    b.r(26, 23, 7, 2, '~');
    b.p(8, 20, 5).p(16, 17, 5).p(36, 17, 6).p(46, 20, 6);
    b.e('steam', 15, 23, { phase: 0 }).e('steam', 22, 23, { phase: 1 }).e('steam', 38, 23, { phase: 0.5 }).e('steam', 44, 23, { phase: 1.5 });
    b.e('swarm', 20, 10).e('swarm', 40, 12);
    b.e('crawler', 10, 19).e('spitter', 50, 23);
    add(b);
}
{   // Guardian arena: electrified. It drops the Sonic Booster Tendons.
    const b = room('magnetic-caldera', 'The Magnetic Caldera', 3, 40, 23, 25, 9);
    b.boss = 3;
    b.doorL('l', 18, 'turbine-assembly-floor', 'r', 'B').doorR('r', 18, 'central-transit-shaft', 'n3', 'S');
    b.e('boss', 20, 9, { n: 3 });
    add(b);
}

// ───────────────────────────── Sector 4: The Apex Sanctuary & Evacuation Spire ─────────────────────────────
{   // A long flat hall. A boost smashes the bone wall at its end.
    const b = room('booster-runway', 'The Booster Runway', 4, 64, 16, 29, 7);
    b.lift('hub', 4, 13, 'central-transit-shaft', 'n4');
    b.r(58, 1, 1, 13, 'b');
    b.doorR('r', 11, 'hive-spire', 'l', 'B');
    add(b);
}
{   // A cathedral of pulsing matter: climb to the hidden vent, and a bone-sealed closet.
    const b = room('hive-spire', 'The Hive Spire', 4, 48, 34, 33, 6);
    b.doorL('l', 29, 'booster-runway', 'r', 'B').doorR('r', 29, 'sanctuary-delta', 'l', 'B');
    b.p(24, 29, 5).p(32, 26, 5).p(24, 23, 5).p(16, 20, 5).p(24, 17, 5).p(32, 14, 5).p(24, 11, 5).p(32, 8, 4);
    b.s(36, 6, 11);
    b.r(45, 5, 1, 1, 's').ductR('v', 5, 3, 'bomb-vault', 'h');
    b.r(2, 24, 4, 4, '.').r(1, 28, 14, 1, '#').r(6, 24, 1, 4, 'b').p(17, 29, 3);
    b.e('reserve', 3, 27, { id: 'reserve-spire' });
    b.e('leaper', 20, 31).e('leaper', 40, 31).e('swarm', 30, 14).e('crawler', 12, 31).e('crawler', 36, 31);
    b.e('steam', 8, 31, { phase: 0 }).e('steam', 44, 31, { phase: 1 });
    add(b);
}
{
    const b = room('bomb-vault', 'Bomb Vault', 4, 24, 14, 36, 6);
    b.ductL('h', 11, 3, 'hive-spire', 'v');
    b.e('pedestal', 14, 11, { item: 'power-bomb' }).e('tank', 20, 11, { id: 'tank-vault' });
    add(b);
}
{
    const b = room('sanctuary-delta', 'Sanctuary Delta', 4, 32, 15, 36, 8);
    b.safe = true;
    b.doorL('l', 10, 'hive-spire', 'r', 'B').doorR('r', 10, 'apex-chamber', 'l', 'B');
    b.e('sanctuary', 16, 12).e('terminal', 6, 12);
    add(b);
}
{   // The final arena, a ritual hall.
    const b = room('apex-chamber', 'Chamber of the Apex Metamorph', 4, 40, 23, 38, 8);
    b.boss = 4;
    b.doorL('l', 18, 'sanctuary-delta', 'r', 'B').doorR('r', 18, 'evacuation-runway', 'l', 'S');
    b.e('boss', 30, 20, { n: 4 });
    add(b);
}
{   // After the purge: a race against the clock, crumbling floors, steam, and a bone wall a boost can shatter.
    const b = room('evacuation-runway', 'The Evacuation Runway', 4, 64, 23, 33, 10);
    b.doorL('l', 18, 'apex-chamber', 'r').doorR('r', 18, 'extraction-hangar', 'l');
    b.r(9, 21, 6, 1, 'c').r(9, 22, 6, 1, '^');
    b.r(36, 1, 1, 20, 'b');
    b.p(31, 17, 4).p(37, 14, 5).p(42, 17, 4);
    b.r(48, 21, 5, 1, 'c').r(48, 22, 5, 1, '^');
    b.e('steam', 22, 20, { phase: 0 }).e('steam', 28, 20, { phase: 1 }).e('steam', 57, 20, { phase: 0.5 });
    add(b);
}
{
    const b = room('extraction-hangar', 'Extraction Hangar', 4, 40, 23, 37, 10);
    b.doorL('l', 18, 'evacuation-runway', 'r');
    b.e('shuttle', 30, 20);
    add(b);
}

export const ROOMS = rooms;
export const ROOM_COUNT = Object.keys(rooms).length;
export const ITEM_COUNT = 10;    // five upgrades, three energy tanks, two missile reserves

export function sectorOf(id: string): number { return rooms[id]?.sector ?? 1; }
