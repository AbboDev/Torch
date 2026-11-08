import { game } from '../engine.js';
import type { Obj } from '../engine.js';
import { run } from '../run.js';
import { T } from '../world.js';

export type PropInstance = {
    kind: string;
    x: number;
    y: number;
    w: number;
    h: number;
    gx?: number;
    gy?: number;
    key?: string;
    sprite?: Obj;
    active: boolean;
};

export class PropManager {
    props: PropInstance[] = [];
    crumbles: { x: number; y: number; timer: number; broken: boolean; regrow: number }[] = [];
    sandstones: Set<string> = new Set();
    bones: Set<string> = new Set();
    pickups: { x: number; y: number; kind: 'energy' | 'missile'; vx: number; vy: number; sprite: Obj; life: number }[] = [];

    initRoom(roomId: string, grid: string[][]): void {
        this.clear();
        for (let j = 0; j < grid.length; j++) {
            for (let i = 0; i < grid[j]!.length; i++) {
                const ch = grid[j]![i];
                const key = `${roomId}_${i}_${j}`;
                if (ch === 'c') {
                    this.crumbles.push({ x: i, y: j, timer: 0, broken: false, regrow: 0 });
                } else if (ch === 's') {
                    if (run.opened[key]) {
                        grid[j]![i] = '.';
                    } else {
                        this.sandstones.add(key);
                    }
                } else if (ch === 'b') {
                    if (run.opened[key]) {
                        grid[j]![i] = '.';
                    } else {
                        this.bones.add(key);
                    }
                }
            }
        }
    }

    clear(): void {
        for (const p of this.props) {
            if (p.sprite) p.sprite.kill();
        }
        for (const pic of this.pickups) {
            if (pic.sprite) pic.sprite.kill();
        }
        this.props = [];
        this.crumbles = [];
        this.sandstones.clear();
        this.bones.clear();
        this.pickups = [];
    }

    spawnPickup(x: number, y: number, kind: 'energy' | 'missile'): void {
        const texture = kind === 'energy' ? 'pickup-energy' : 'pickup-missile';
        const spr = game.spawn({
            texture,
            x,
            y,
            layer: 'world',
            z: 3
        });
        this.pickups.push({
            x,
            y,
            kind,
            vx: game.rng.between(-20, 20),
            vy: game.rng.between(-100, -60),
            sprite: spr,
            life: 12
        });
    }

    update(dt: number, px: number, py: number, grid: string[][], onHeal: (amount: number) => void, onAmmo: (amount: number) => void): void {
        const pCol = Math.floor(px / T);
        const pRow = Math.floor((py + 18) / T);
        for (const c of this.crumbles) {
            if (!c.broken) {
                if (pCol === c.x && (pRow === c.y || pRow === c.y - 1)) {
                    c.timer += dt;
                    if (c.timer >= 0.4) {
                        c.broken = true;
                        c.regrow = 3.5;
                        grid[c.y]![c.x] = '.';
                        game.sound.play('crumble');
                        game.particles.burst({ x: c.x * T + 16, y: c.y * T + 16, count: 12, speed: [20, 60] });
                    }
                } else {
                    c.timer = Math.max(0, c.timer - dt * 0.5);
                }
            } else {
                c.regrow -= dt;
                if (c.regrow <= 0 && (pCol !== c.x || pRow !== c.y)) {
                    c.broken = false;
                    c.timer = 0;
                    grid[c.y]![c.x] = 'c';
                }
            }
        }

        for (let i = this.pickups.length - 1; i >= 0; i--) {
            const p = this.pickups[i]!;
            p.life -= dt;
            if (p.life <= 0) {
                p.sprite.kill();
                this.pickups.splice(i, 1);
                continue;
            }

            const dx = px - p.x;
            const dy = py - p.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 110) {
                const spd = 240;
                p.vx += (dx / dist) * spd * dt * 4;
                p.vy += (dy / dist) * spd * dt * 4;
            } else {
                p.vy += 180 * dt;
                p.vx *= 0.95;
            }

            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.sprite.x = p.x;
            p.sprite.y = p.y;

            if (dist < 22) {
                if (p.kind === 'energy') {
                    onHeal(15);
                    game.sound.play('pickup-energy');
                } else {
                    onAmmo(2);
                    game.sound.play('pickup-missile');
                }
                game.particles.burst({ x: p.x, y: p.y, count: 8, speed: [30, 80] });
                p.sprite.kill();
                this.pickups.splice(i, 1);
            }
        }
    }

    breakSandstone(roomId: string, gx: number, gy: number, grid: string[][]): void {
        const key = `${roomId}_${gx}_${gy}`;
        grid[gy]![gx] = '.';
        run.opened[key] = true;
        game.sound.play('crumble');
        game.particles.burst({ x: gx * T + 16, y: gy * T + 16, count: 16, speed: [40, 100] });
    }

    breakBone(roomId: string, gx: number, gy: number, grid: string[][]): void {
        const key = `${roomId}_${gx}_${gy}`;
        grid[gy]![gx] = '.';
        run.opened[key] = true;
        game.sound.play('bomb-explode');
        game.feel.shake(6, 0.25);
        game.particles.burst({ x: gx * T + 16, y: gy * T + 16, count: 20, speed: [60, 140] });
    }
}
