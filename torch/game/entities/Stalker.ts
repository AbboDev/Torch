import { game } from '../engine.js';
import type { Obj } from '../engine.js';
import { run } from '../run.js';
import { T } from '../world.js';
import { Player } from './Player.js';
import type { Projectile } from './Player.js';

export class Stalker {
    x = 0;
    y = 0;
    vx = 0;
    vy = 0;
    facing: 1 | -1 = 1;
    sprite: Obj | null = null;
    alerted = false;
    alertTimer = 0;
    searchTimer = 0;
    stepTimer = 0;
    active = false;

    init(x: number, y: number): void {
        this.x = x;
        this.y = y;
        this.vx = 45;
        this.vy = 0;
        this.alerted = false;
        this.alertTimer = 0;
        this.searchTimer = 0;
        this.stepTimer = 0;
        this.active = !run.stalkerOff;

        if (this.sprite) this.sprite.kill();
        if (this.active) {
            this.sprite = game.spawn({
                texture: 'stalker',
                x: this.x,
                y: this.y,
                layer: 'world',
                z: 6
            });
            game.sound.play('stalker-screech');
            game.feel.shake(8, 0.4);
        }
    }

    destroy(): void {
        if (this.sprite) this.sprite.kill();
    }

    update(dt: number, player: Player, grid: string[][], enemyProjectiles: Projectile[]): void {
        if (!this.active || run.stalkerOff) {
            if (this.sprite) this.sprite.kill();
            return;
        }

        this.stepTimer += dt;
        if (this.stepTimer >= 0.8) {
            this.stepTimer = 0;
            game.sound.play('stalker-step');
            game.feel.shake(2, 0.1);
        }

        const pCol = Math.floor(player.x / T);
        const pRow = Math.floor(player.y / T);
        const playerTile = grid[pRow]?.[pCol];
        const isHidden = player.inShell || (player.crouching && playerTile === ',') || playerTile === ';';

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy);

        const inFacing = (this.facing > 0 && dx > 0) || (this.facing < 0 && dx < 0);
        const canSee = !isHidden && Math.abs(dy) < 48 && inFacing && dist < 320;
        const canHear = !isHidden && player.fireCooldown > 0 && dist < 260;

        if ((canSee || canHear) && !this.alerted) {
            this.alerted = true;
            this.alertTimer = 4.0;
            game.sound.play('stalker-screech');
            game.feel.shake(6, 0.3);
        }

        if (this.alerted) {
            this.alertTimer -= dt;
            if (isHidden || this.alertTimer <= 0) {
                this.searchTimer += dt;
                if (this.searchTimer > 2.0) {
                    this.alerted = false;
                    this.searchTimer = 0;
                    this.vx = this.facing * 45;
                }
            } else {
                this.searchTimer = 0;
                this.alertTimer = 3.5;
            }

            if (!isHidden) {
                this.facing = dx > 0 ? 1 : -1;
                this.vx = this.facing * 190;

                if (game.rng.chance(0.02) && dist < 240) {
                    const spr = game.spawn({ texture: 'stalker-blast', x: this.x, y: this.y, layer: 'world', z: 7 });
                    enemyProjectiles.push({
                        x: spr.x, y: spr.y, vx: this.facing * 300, vy: 0,
                        kind: 'charge', life: 1.5, sprite: spr, damage: 40, radius: 10
                    });
                    game.sound.play('freeze');
                }
            }
        } else {
            this.x += this.vx * dt;
            const aheadCol = Math.floor((this.x + Math.sign(this.vx) * 20) / T);
            const r = Math.floor(this.y / T);
            if (grid[r]?.[aheadCol] === '#' || grid[r + 1]?.[aheadCol] === '.') {
                this.vx = -this.vx;
                this.facing = this.vx > 0 ? 1 : -1;
            }
        }

        this.x += this.vx * dt;
        if (this.sprite) {
            this.sprite.x = this.x;
            this.sprite.y = this.y;
            this.sprite.sx = this.facing;
        }

        if (dist < 26) {
            player.damage(40, this.x);
        }
    }

    sparkOff(p: Projectile): void {
        game.sound.play('door-bounce');
        game.particles.burst({ x: p.x, y: p.y, count: 10, speed: [30, 80] });
    }
}
