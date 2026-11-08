import { game } from '../engine.js';
import type { Obj } from '../engine.js';
import { run } from '../run.js';
import { Player } from './Player.js';
import type { Projectile } from './Player.js';
import { PropManager } from './Props.js';

export class Boss {
    n: number;
    x: number;
    y: number;
    vx = 0;
    vy = 0;
    hp: number;
    maxHp: number;
    phase = 1;
    stateTimer = 0;
    attackCooldown = 0;
    sprite: Obj | null = null;
    dead = false;
    vulnerable = false;
    conduitsFrozen = false;
    conduitTimer = 0;

    constructor(n: number, x: number, y: number) {
        this.n = n;
        this.x = x;
        this.y = y;

        switch (n) {
            case 1:
                this.hp = this.maxHp = 120;
                this.sprite = game.spawn({ texture: 'boss-broodmother', x, y, layer: 'world', z: 6 });
                break;
            case 2:
                this.hp = this.maxHp = 180;
                this.sprite = game.spawn({ texture: 'boss-goliath', x, y, layer: 'world', z: 6 });
                break;
            case 3:
                this.hp = this.maxHp = 220;
                this.sprite = game.spawn({ texture: 'boss-core', x, y, layer: 'world', z: 6 });
                break;
            case 4:
                this.hp = this.maxHp = 350;
                this.sprite = game.spawn({ texture: 'boss-apex', x, y, layer: 'world', z: 6 });
                break;
            default:
                this.hp = this.maxHp = 100;
                break;
        }
    }

    destroy(): void {
        if (this.sprite) this.sprite.kill();
    }

    update(dt: number, player: Player, props: PropManager, enemyProjectiles: Projectile[], onDefeated: () => void): void {
        if (this.dead) return;

        this.stateTimer += dt;
        this.attackCooldown = Math.max(0, this.attackCooldown - dt);

        switch (this.n) {
            case 1: {
                const cycle = this.stateTimer % 7.0;
                if (cycle < 3.5) {
                    this.vulnerable = false;
                    if (this.sprite) this.sprite.texture = 'boss-broodmother';
                    if (this.attackCooldown <= 0) {
                        this.attackCooldown = 1.8;
                        game.sound.play('boss-roar');
                        game.feel.shake(6, 0.3);
                        for (let a = -0.8; a <= 0.8; a += 0.8) {
                            const spr = game.spawn({ texture: 'spore-orb', x: this.x - 20, y: this.y, layer: 'world', z: 7 });
                            enemyProjectiles.push({
                                x: spr.x, y: spr.y, vx: Math.cos(Math.PI - a) * 140, vy: -180,
                                kind: 'charge', life: 4.0, sprite: spr, damage: 16, radius: 8
                            });
                        }
                    }
                } else {
                    this.vulnerable = true;
                    if (this.sprite) this.sprite.texture = 'boss-broodmother-open';
                }
                break;
            }
            case 2: {
                const cycle = this.stateTimer % 6.0;
                if (cycle < 2.5) {
                    this.vx = (player.x > this.x ? 1 : -1) * 140;
                    this.x += this.vx * dt;
                } else if (cycle < 4.0) {
                    if (this.attackCooldown <= 0) {
                        this.attackCooldown = 3.0;
                        game.sound.play('boss-crash');
                        game.feel.shake(10, 0.4);
                        for (let k = 0; k < 3; k++) {
                            const ix = this.x - 120 + k * 120;
                            const spr = game.spawn({ texture: 'icicle', x: ix, y: this.y - 180, layer: 'world', z: 7 });
                            enemyProjectiles.push({
                                x: spr.x, y: spr.y, vx: 0, vy: 260, kind: 'charge', life: 2.0, sprite: spr, damage: 20, radius: 8
                            });
                        }
                    }
                } else {
                    this.vx = 0;
                }
                this.vulnerable = true;
                break;
            }
            case 3: {
                if (this.conduitsFrozen) {
                    this.conduitTimer -= dt;
                    if (this.conduitTimer <= 0) {
                        this.conduitsFrozen = false;
                        this.vulnerable = false;
                    }
                } else {
                    this.vulnerable = false;
                    this.x += Math.sin(this.stateTimer * 1.5) * 60 * dt;
                    this.y += Math.cos(this.stateTimer * 1.2) * 40 * dt;
                    if (this.attackCooldown <= 0) {
                        this.attackCooldown = 2.0;
                        game.sound.play('beam-charged');
                        const spr = game.spawn({ texture: 'boss-wave', x: this.x, y: this.y, layer: 'world', z: 7 });
                        const angle = Math.atan2(player.y - this.y, player.x - this.x);
                        enemyProjectiles.push({
                            x: spr.x, y: spr.y, vx: Math.cos(angle) * 190, vy: Math.sin(angle) * 190,
                            kind: 'charge', life: 3.5, sprite: spr, damage: 22, radius: 10
                        });
                    }
                }
                break;
            }
            case 4: {
                const cycle = this.stateTimer % 8.0;
                if (cycle < 3.0) {
                    if (this.attackCooldown <= 0) {
                        this.attackCooldown = 0.8;
                        game.sound.play('stalker-screech');
                        const spr = game.spawn({ texture: 'stalker-blast', x: this.x, y: this.y, layer: 'world', z: 7 });
                        const angle = Math.atan2(player.y - this.y, player.x - this.x);
                        enemyProjectiles.push({
                            x: spr.x, y: spr.y, vx: Math.cos(angle) * 230, vy: Math.sin(angle) * 230,
                            kind: 'charge', life: 3.0, sprite: spr, damage: 25, radius: 10
                        });
                    }
                } else if (cycle < 5.0) {
                    if (this.attackCooldown <= 0) {
                        this.attackCooldown = 2.0;
                        game.sound.play('unmorph');
                        this.x = player.x + (game.rng.chance(0.5) ? 180 : -180);
                        game.particles.burst({ x: this.x, y: this.y, count: 24, speed: [50, 150] });
                    }
                } else {
                    if (this.attackCooldown <= 0) {
                        this.attackCooldown = 3.0;
                        game.sound.play('boss-crash');
                        game.feel.shake(12, 0.5);
                        for (const dir of [-1, 1]) {
                            const spr = game.spawn({ texture: 'boss-wave', x: this.x, y: this.y + 30, layer: 'world', z: 7 });
                            enemyProjectiles.push({
                                x: spr.x, y: spr.y, vx: dir * 210, vy: 0,
                                kind: 'charge', life: 2.0, sprite: spr, damage: 20, radius: 10
                            });
                        }
                    }
                }
                this.vulnerable = true;
                break;
            }
        }

        if (this.sprite) {
            this.sprite.x = this.x;
            this.sprite.y = this.y;
        }

        if (Math.hypot(player.x - this.x, player.y - this.y) < 45) {
            player.damage(28, this.x);
        }
    }

    hit(p: Projectile, props: PropManager, onDefeated: () => void): boolean {
        if (this.dead) return false;

        if (this.n === 1) {
            if (!this.vulnerable) {
                game.sound.play('door-bounce');
                return true;
            }
            if (p.kind !== 'charged' && p.kind !== 'beam') return true;
        } else if (this.n === 2) {
            if (p.kind !== 'missile') {
                game.sound.play('door-bounce');
                return true;
            }
        } else if (this.n === 3) {
            if (p.kind === 'cryo') {
                this.conduitsFrozen = true;
                this.vulnerable = true;
                this.conduitTimer = 4.5;
                game.sound.play('freeze');
                game.particles.burst({ x: this.x, y: this.y, count: 20, speed: [40, 100] });
                return true;
            }
            if (!this.vulnerable || p.kind !== 'missile') {
                game.sound.play('door-bounce');
                return true;
            }
        } else if (this.n === 4) {
            if (p.kind !== 'missile' && p.kind !== 'power-bomb' && p.kind !== 'charged') {
                game.sound.play('door-bounce');
                return true;
            }
        }

        this.hp -= p.damage;
        game.sound.play('hit-enemy');
        game.feel.hitstop(0.06);
        game.particles.burst({ x: this.x, y: this.y, count: 12, speed: [40, 100] });

        if (this.hp <= 0) {
            this.die(props, onDefeated);
        }
        return true;
    }

    die(props?: PropManager, onDefeated?: () => void): void {
        this.dead = true;
        if (this.sprite) this.sprite.kill();

        game.sound.play('boss-crash');
        game.feel.shake(14, 0.8);
        game.particles.burst({ x: this.x, y: this.y, count: 64, speed: [60, 240] });

        run.opened[`boss-${this.n}`] = true;

        if (this.n === 1) {
            run.have['missile-launcher'] = true;
            if (run.maxMissiles === 0) run.maxMissiles = 10;
            run.missiles = run.maxMissiles;
            game.sound.play('fanfare');
        } else if (this.n === 2) {
            run.have['cryo-beam'] = true;
            game.sound.play('fanfare');
        } else if (this.n === 3) {
            run.have['sonic-booster'] = true;
            game.sound.play('fanfare');
        } else if (this.n === 4) {
            run.escaping = true;
            run.escapeLeft = 150;
        }

        if (onDefeated) onDefeated();
    }
}
