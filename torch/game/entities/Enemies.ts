import { game } from '../engine.js';
import type { Obj } from '../engine.js';
import { run } from '../run.js';
import { T } from '../world.js';
import { Player } from './Player.js';
import type { Projectile } from './Player.js';
import { PropManager } from './Props.js';

export type EnemyType = 'crawler' | 'spitter' | 'drifter' | 'leaper' | 'swarm';

export class Enemy {
    x: number;
    y: number;
    vx = 0;
    vy = 0;
    type: EnemyType;
    hp: number;
    maxHp: number;
    sprite: Obj;
    facing: 1 | -1 = 1;
    dead = false;
    frozen = false;
    frozenTimer = 0;
    stateTimer = 0;
    id: string;

    attackCooldown = 0;
    originY: number;

    constructor(type: EnemyType, x: number, y: number, id: string) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.originY = y;
        this.id = id;

        switch (type) {
            case 'crawler':
                this.hp = this.maxHp = 20;
                this.vx = 40;
                break;
            case 'spitter':
                this.hp = this.maxHp = 45;
                break;
            case 'drifter':
                this.hp = this.maxHp = 10;
                this.vx = 30;
                break;
            case 'leaper':
                this.hp = this.maxHp = 50;
                this.vx = 50;
                break;
            case 'swarm':
                this.hp = this.maxHp = 8;
                this.vx = 60;
                break;
        }

        this.sprite = game.spawn({
            texture: type,
            x: this.x,
            y: this.y,
            layer: 'world',
            z: 5
        });
    }

    update(dt: number, player: Player, props: PropManager, enemyProjectiles: Projectile[], grid: string[][]): void {
        if (this.dead) return;

        if (this.frozen) {
            this.frozenTimer -= dt;
            if (this.frozenTimer <= 0) {
                this.frozen = false;
                this.sprite.texture = this.type;
            } else {
                this.checkPlatformCollision(player);
                return;
            }
        }

        this.stateTimer += dt;
        this.attackCooldown = Math.max(0, this.attackCooldown - dt);

        switch (this.type) {
            case 'crawler': {
                if (Math.abs(player.x - this.x) < 24 && player.y > this.y && player.y - this.y < 200) {
                    this.vy = 240;
                } else if (this.vy === 0) {
                    this.x += this.vx * dt;
                    const aheadCol = Math.floor((this.x + Math.sign(this.vx) * 16) / T);
                    const feetRow = Math.floor((this.y + 12) / T);
                    if (grid[feetRow]?.[aheadCol] === '#' || grid[feetRow + 1]?.[aheadCol] === '.') {
                        this.vx = -this.vx;
                    }
                }
                this.y += this.vy * dt;
                const curRow = Math.floor((this.y + 8) / T);
                const curCol = Math.floor(this.x / T);
                if (grid[curRow]?.[curCol] === '#' && this.vy > 0) {
                    this.vy = 0;
                    this.y = curRow * T - 8;
                }
                this.facing = this.vx > 0 ? 1 : -1;
                break;
            }
            case 'spitter': {
                if (this.attackCooldown <= 0 && Math.hypot(player.x - this.x, player.y - this.y) < 360) {
                    this.attackCooldown = 2.4;
                    const dx = player.x - this.x;
                    const dy = player.y - this.y;
                    const dist = Math.hypot(dx, dy);
                    const spd = 160;
                    const spr = game.spawn({
                        texture: 'spore-orb',
                        x: this.x,
                        y: this.y - 10,
                        layer: 'world',
                        z: 6
                    });
                    enemyProjectiles.push({
                        x: spr.x,
                        y: spr.y,
                        vx: (dx / dist) * spd,
                        vy: -120,
                        kind: 'charge',
                        life: 3.0,
                        sprite: spr,
                        damage: 15,
                        radius: 8
                    });
                    game.sound.play('hit-enemy');
                }
                break;
            }
            case 'drifter': {
                this.x += this.vx * dt;
                this.y = this.originY + Math.sin(this.stateTimer * 2) * 24;
                const aheadCol = Math.floor((this.x + Math.sign(this.vx) * 16) / T);
                const curRow = Math.floor(this.y / T);
                if (grid[curRow]?.[aheadCol] === '#') {
                    this.vx = -this.vx;
                }
                break;
            }
            case 'leaper': {
                if (this.vy !== 0) {
                    this.y += this.vy * dt;
                    this.x += this.vx * dt;
                    this.vy += 800 * dt;
                    const r = Math.floor((this.y + 14) / T);
                    const c = Math.floor(this.x / T);
                    if (grid[r]?.[c] === '#' && this.vy > 0) {
                        this.vy = 0;
                        this.y = r * T - 14;
                        this.vx = this.facing * 50;
                        this.attackCooldown = 1.5;
                    }
                } else {
                    const dist = Math.hypot(player.x - this.x, player.y - this.y);
                    if (dist < 220 && this.attackCooldown <= 0) {
                        this.facing = player.x > this.x ? 1 : -1;
                        this.vx = this.facing * 180;
                        this.vy = -340;
                        game.sound.play('jump');
                    } else {
                        this.x += this.vx * dt;
                        const aheadCol = Math.floor((this.x + Math.sign(this.vx) * 16) / T);
                        const curRow = Math.floor(this.y / T);
                        if (grid[curRow]?.[aheadCol] === '#') this.vx = -this.vx;
                    }
                }
                this.facing = this.vx > 0 ? 1 : -1;
                break;
            }
            case 'swarm': {
                const dx = player.x - this.x;
                const dy = player.y - this.y;
                const dist = Math.hypot(dx, dy);
                if (dist < 260) {
                    this.vx += (dx / dist) * 160 * dt;
                    this.vy += (dy / dist) * 160 * dt;
                } else {
                    this.vx = Math.sin(this.stateTimer * 3) * 60;
                    this.vy = Math.cos(this.stateTimer * 2) * 40;
                }
                this.x += this.vx * dt;
                this.y += this.vy * dt;
                break;
            }
        }

        this.sprite.x = this.x;
        this.sprite.y = this.y;
        this.sprite.sx = this.facing;

        const pDist = Math.hypot(player.x - this.x, player.y - this.y);
        if (pDist < 22) {
            if (player.boosting) {
                this.hit(100, 'beam', props);
            } else {
                player.damage(this.type === 'leaper' ? 22 : 12, this.x);
            }
        }
    }

    hit(damage: number, kind: string, props: PropManager): void {
        if (this.dead) return;

        if (kind === 'cryo') {
            this.frozen = true;
            this.frozenTimer = 6.0;
            this.sprite.texture = this.type === 'drifter' ? 'drifter-frozen' : this.type;
            game.sound.play('freeze');
            game.particles.burst({ x: this.x, y: this.y, count: 12, speed: [20, 60] });
            return;
        }

        this.hp -= damage;
        game.sound.play('hit-enemy');
        game.feel.hitstop(0.04);
        game.particles.burst({ x: this.x, y: this.y, count: 8, speed: [30, 90] });

        if (this.hp <= 0) {
            this.die(props);
        }
    }

    private die(props: PropManager): void {
        this.dead = true;
        this.sprite.kill();
        game.sound.play('kill-enemy');
        game.particles.burst({ x: this.x, y: this.y, count: 18, speed: [40, 120] });

        props.spawnPickup(this.x, this.y, 'energy');
        if (game.rng.chance(0.45) && (run.have['missile-launcher'] || run.unlockAll)) {
            props.spawnPickup(this.x + 8, this.y, 'missile');
        }

        if (this.type === 'spitter') {
            run.opened[`spitter_${this.id}`] = true;
        }
    }

    private checkPlatformCollision(player: Player): void {
        if (player.vy > 0 && Math.abs(player.x - this.x) < 18 && (player.y + player.hh) >= (this.y - 14) && (player.y + player.hh) <= (this.y - 2)) {
            player.y = this.y - 14 - player.hh;
            player.vy = 0;
            player.onGround = true;
        }
    }
}
