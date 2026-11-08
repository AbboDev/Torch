import { game } from '../engine.js';
import type { Obj } from '../engine.js';
import { run } from '../run.js';
import { T } from '../world.js';
import { PropManager } from './Props.js';

export type AimDirection = 'forward' | 'up' | 'diag-up' | 'down' | 'diag-down';

export type Projectile = {
    x: number;
    y: number;
    vx: number;
    vy: number;
    kind: 'beam' | 'charged' | 'cryo' | 'missile' | 'charge' | 'power-bomb';
    life: number;
    sprite: Obj;
    damage: number;
    radius: number;
};

export class Player {
    x = 100;
    y = 500;
    vx = 0;
    vy = 0;
    facing: 1 | -1 = 1;
    onGround = false;
    crouching = false;
    inShell = false;
    boosting = false;
    boostTimer = 0;
    aim: AimDirection = 'forward';

    // Jump leniency
    coyoteTimer = 0;
    jumpBuffer = 0;

    // Weapon charging & firing
    fireCooldown = 0;
    fireBuffer = 0;
    chargeTimer = 0;
    charging = false;
    missilesArmed = false;

    // Damage & recoil
    invulnTimer = 0;
    recoilTimer = 0;

    sprite: Obj | null = null;
    projectiles: Projectile[] = [];

    // Collision box dimensions (half-extents)
    get hw(): number { return this.inShell ? 8 : 10; }
    get hh(): number { return this.inShell ? 8 : this.crouching ? 11 : 16; }

    init(x: number, y: number): void {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.inShell = false;
        this.crouching = false;
        this.boosting = false;
        this.boostTimer = 0;
        this.coyoteTimer = 0;
        this.jumpBuffer = 0;
        this.invulnTimer = 0;
        this.recoilTimer = 0;
        this.projectiles = [];

        if (this.sprite) this.sprite.kill();
        this.sprite = game.spawn({
            texture: 'vaelen-stand',
            x: this.x,
            y: this.y,
            layer: 'world',
            z: 10
        });
    }

    destroy(): void {
        if (this.sprite) this.sprite.kill();
        for (const p of this.projectiles) p.sprite.kill();
        this.projectiles = [];
    }

    damage(amount: number, fromX?: number): void {
        if (run.invincible || this.invulnTimer > 0) return;
        if (!run.infiniteEnergy) {
            run.energy = Math.max(0, run.energy - amount);
        }
        this.invulnTimer = 1.2;
        game.sound.play('hit-player');
        game.feel.shake(6, 0.25);
        game.feel.flash('#ff003322', 0.15);

        // Recoil bounce
        const dir = fromX !== undefined ? (this.x < fromX ? -1 : 1) : -this.facing;
        this.vx = dir * 180;
        this.vy = -180;
        this.recoilTimer = 0.2;
    }

    update(dt: number, grid: string[][], isIce: boolean, props: PropManager, roomId: string, onPurgeYellowGate?: () => void): void {
        const speed = isIce ? 220 : 200;
        const boostSpeed = 480;

        // Timers
        if (this.invulnTimer > 0) this.invulnTimer = Math.max(0, this.invulnTimer - dt);
        if (this.recoilTimer > 0) this.recoilTimer = Math.max(0, this.recoilTimer - dt);
        if (this.fireCooldown > 0) this.fireCooldown = Math.max(0, this.fireCooldown - dt);
        if (this.coyoteTimer > 0) this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);
        if (this.jumpBuffer > 0) this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);

        // Read Raw Inputs
        const left = game.input.keyDown('KeyA') || game.input.keyDown('ArrowLeft') || game.input.keyDown('Touch:left');
        const right = game.input.keyDown('KeyD') || game.input.keyDown('ArrowRight') || game.input.keyDown('Touch:right');
        const downKey = game.input.keyDown('KeyS') || game.input.keyDown('ArrowDown') || game.input.keyDown('Touch:down');
        const downPressed = game.input.keyPressed('KeyS') || game.input.keyPressed('ArrowDown') || game.input.keyPressed('Touch:down');
        const jumpPressed = game.input.keyPressed('KeyW') || game.input.keyPressed('ArrowUp') || game.input.keyPressed('Space') || game.input.keyPressed('Touch:jump');
        const jumpHeld = game.input.keyDown('KeyW') || game.input.keyDown('ArrowUp') || game.input.keyDown('Space') || game.input.keyDown('Touch:jump');
        const missileToggle = game.input.keyPressed('KeyK') || game.input.keyPressed('KeyX') || game.input.keyPressed('Touch:missile');
        const firePressed = game.input.keyPressed('KeyJ') || game.input.keyPressed('KeyZ') || game.input.keyPressed('Touch:fire') || game.input.pointer?.pressed;
        const fireHeld = game.input.keyDown('KeyJ') || game.input.keyDown('KeyZ') || game.input.keyDown('Touch:fire') || game.input.pointer?.down;

        // Toggle Missiles
        if (missileToggle && (run.have['missile-launcher'] || run.unlockAll)) {
            this.missilesArmed = !this.missilesArmed;
            game.sound.play('missile-arm');
        }

        // Aim calculation (Mouse pointer or stick)
        if (this.inShell) {
            this.aim = 'forward';
        } else {
            const ptr = game.input.pointer;
            if (ptr) {
                const worldPtr = game.world.toWorld(ptr.x, ptr.y);
                const dx = worldPtr.x - this.x;
                const dy = worldPtr.y - this.y;
                if (Math.abs(dx) > 10) this.facing = dx > 0 ? 1 : -1;

                const angle = Math.atan2(dy, Math.abs(dx));
                if (angle < -1.1) {
                    this.aim = 'up';
                } else if (angle < -0.3) {
                    this.aim = 'diag-up';
                } else if (!this.onGround && angle > 1.1) {
                    this.aim = 'down';
                } else if (!this.onGround && angle > 0.3) {
                    this.aim = 'diag-down';
                } else {
                    this.aim = 'forward';
                }
            } else {
                const upHeld = game.input.keyDown('KeyW') || game.input.keyDown('ArrowUp') || game.input.keyDown('Touch:up');
                if (upHeld && (left || right)) {
                    this.aim = 'diag-up';
                } else if (upHeld) {
                    this.aim = 'up';
                } else if (!this.onGround && downKey && (left || right)) {
                    this.aim = 'diag-down';
                } else if (!this.onGround && downKey) {
                    this.aim = 'down';
                } else {
                    this.aim = 'forward';
                }
            }
        }

        // Crouch and Morph Shell
        if (this.recoilTimer <= 0) {
            if (this.inShell) {
                if (jumpPressed || downPressed) {
                    if (this.canStand(grid)) {
                        this.inShell = false;
                        this.crouching = false;
                        game.sound.play('unmorph');
                    }
                }
            } else {
                if (downPressed && this.onGround) {
                    if (this.crouching && (run.have['morph-shell'] || run.unlockAll)) {
                        this.inShell = true;
                        this.crouching = false;
                        game.sound.play('morph');
                    } else {
                        this.crouching = true;
                    }
                } else if (!downKey && this.crouching) {
                    this.crouching = false;
                }
            }
        }

        // Horizontal Movement
        if (this.recoilTimer <= 0) {
            let moveDir = 0;
            if (left) moveDir -= 1;
            if (right) moveDir += 1;

            if (moveDir !== 0 && (!this.crouching || this.inShell)) {
                this.facing = moveDir > 0 ? 1 : -1;
                const targetSpd = this.boosting ? boostSpeed : (this.inShell ? speed * 0.9 : speed);
                if (isIce) {
                    this.vx += moveDir * 400 * dt;
                    if (Math.abs(this.vx) > targetSpd) this.vx = Math.sign(this.vx) * targetSpd;
                } else {
                    this.vx = moveDir * targetSpd;
                }

                if ((run.have['sonic-booster'] || run.unlockAll) && this.onGround && !this.inShell && !this.crouching) {
                    this.boostTimer += dt;
                    if (this.boostTimer >= 1.0) {
                        if (!this.boosting) {
                            this.boosting = true;
                            game.sound.play('boost');
                            game.feel.shake(3, 0.2);
                        }
                    }
                } else {
                    this.boostTimer = 0;
                    this.boosting = false;
                }
            } else {
                if (isIce) {
                    this.vx *= Math.pow(0.1, dt);
                } else {
                    this.vx = 0;
                }
                this.boostTimer = 0;
                this.boosting = false;
            }
        }

        // Jump Handling
        if (jumpPressed) {
            this.jumpBuffer = 0.12;
        }

        if (this.onGround) {
            this.coyoteTimer = 0.1;
        }

        if (this.jumpBuffer > 0 && this.coyoteTimer > 0 && !this.inShell && this.recoilTimer <= 0) {
            this.vy = -440;
            this.onGround = false;
            this.coyoteTimer = 0;
            this.jumpBuffer = 0;
            game.sound.play('jump');
        }

        if (!jumpHeld && this.vy < -150) {
            this.vy = -150;
        }

        // Gravity
        this.vy += 980 * dt;
        if (this.vy > 650) this.vy = 650;

        // Collision
        this.moveAndCollide(dt, grid, props, roomId);

        // Boost Trail
        if (this.boosting) {
            game.particles.burst({
                x: this.x - this.facing * 12,
                y: this.y + 6,
                count: 3,
                speed: [10, 40]
            });
        }

        // Weapon Fire & Charge
        if (firePressed) this.fireBuffer = 0.12;
        if (this.fireBuffer > 0) this.fireBuffer = Math.max(0, this.fireBuffer - dt);

        if (this.inShell) {
            if (this.fireBuffer > 0 && this.fireCooldown <= 0) {
                this.fireBuffer = 0;
                this.fireCooldown = 0.35;
                if (this.missilesArmed && (run.have['power-bomb'] || run.unlockAll)) {
                    this.dropPowerBomb(props, roomId, grid, onPurgeYellowGate);
                } else {
                    this.dropCharge(props, roomId, grid);
                }
            }
        } else {
            if (fireHeld && !this.missilesArmed) {
                this.chargeTimer += dt;
                if (this.chargeTimer > 0.4 && !this.charging) {
                    this.charging = true;
                    game.sound.play('beam-charge');
                }
            }

            if ((!fireHeld && this.charging) || (this.fireBuffer > 0 && this.fireCooldown <= 0)) {
                const wasCharged = this.chargeTimer >= 0.6;
                this.chargeTimer = 0;
                this.charging = false;
                this.fireBuffer = 0;

                if (this.missilesArmed) {
                    if (run.missiles > 0 || run.infiniteMissiles) {
                        this.launchMissile();
                    } else {
                        game.sound.play('alarm');
                    }
                } else {
                    this.shootBeam(wasCharged);
                }
            }
        }

        this.updateProjectiles(dt, grid, props, roomId);
        this.updateVisuals();
    }

    private shootBeam(charged: boolean): void {
        this.fireCooldown = charged ? 0.25 : 0.12;
        let angle = 0;
        if (this.aim === 'up') angle = -Math.PI / 2;
        else if (this.aim === 'diag-up') angle = this.facing > 0 ? -Math.PI / 4 : -Math.PI * 3 / 4;
        else if (this.aim === 'down') angle = Math.PI / 2;
        else if (this.aim === 'diag-down') angle = this.facing > 0 ? Math.PI / 4 : Math.PI * 3 / 4;
        else angle = this.facing > 0 ? 0 : Math.PI;

        const spd = 620;
        const vx = Math.cos(angle) * spd;
        const vy = Math.sin(angle) * spd;

        const hasCryo = run.have['cryo-beam'] || run.unlockAll;
        const kind = charged ? 'charged' : (hasCryo ? 'cryo' : 'beam');
        const texture = charged ? 'bolt-charged' : (hasCryo ? 'bolt-cryo' : 'bolt-beam');

        const spr = game.spawn({
            texture,
            x: this.x + Math.cos(angle) * 16,
            y: this.y + Math.sin(angle) * 16,
            layer: 'world',
            z: 8
        });

        this.projectiles.push({
            x: spr.x,
            y: spr.y,
            vx,
            vy,
            kind,
            life: 1.2,
            sprite: spr,
            damage: charged ? 35 : 12,
            radius: charged ? 10 : 6
        });

        game.sound.play(charged ? 'beam-charged' : (hasCryo ? 'cryo-beam' : 'beam'));
    }

    private launchMissile(): void {
        if (!run.infiniteMissiles) run.missiles--;
        this.fireCooldown = 0.28;

        let angle = 0;
        if (this.aim === 'up') angle = -Math.PI / 2;
        else if (this.aim === 'diag-up') angle = this.facing > 0 ? -Math.PI / 4 : -Math.PI * 3 / 4;
        else if (this.aim === 'down') angle = Math.PI / 2;
        else if (this.aim === 'diag-down') angle = this.facing > 0 ? Math.PI / 4 : Math.PI * 3 / 4;
        else angle = this.facing > 0 ? 0 : Math.PI;

        const spd = 500;
        const vx = Math.cos(angle) * spd;
        const vy = Math.sin(angle) * spd;

        const spr = game.spawn({
            texture: 'rocket-missile',
            x: this.x + Math.cos(angle) * 16,
            y: this.y + Math.sin(angle) * 16,
            layer: 'world',
            z: 8
        });

        this.projectiles.push({
            x: spr.x,
            y: spr.y,
            vx,
            vy,
            kind: 'missile',
            life: 1.5,
            sprite: spr,
            damage: 60,
            radius: 8
        });

        this.vx -= Math.cos(angle) * 70;
        this.vy -= 40;
        game.sound.play('missile');
        game.feel.shake(4, 0.15);
    }

    private dropCharge(props: PropManager, roomId: string, grid: string[][]): void {
        const spr = game.spawn({
            texture: 'shell-charge',
            x: this.x,
            y: this.y + 4,
            layer: 'world',
            z: 7
        });
        this.projectiles.push({
            x: spr.x,
            y: spr.y,
            vx: 0,
            vy: 0,
            kind: 'charge',
            life: 0.7,
            sprite: spr,
            damage: 20,
            radius: 12
        });
        game.sound.play('drop-charge');
    }

    private dropPowerBomb(props: PropManager, roomId: string, grid: string[][], onPurgeYellowGate?: () => void): void {
        const spr = game.spawn({
            texture: 'power-bomb',
            x: this.x,
            y: this.y,
            layer: 'world',
            z: 7
        });
        this.projectiles.push({
            x: spr.x,
            y: spr.y,
            vx: 0,
            vy: 0,
            kind: 'power-bomb',
            life: 1.0,
            sprite: spr,
            damage: 150,
            radius: 360
        });
        game.sound.play('drop-charge');
    }

    private updateProjectiles(dt: number, grid: string[][], props: PropManager, roomId: string): void {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i]!;
            p.life -= dt;
            if (p.life <= 0) {
                if (p.kind === 'charge') {
                    game.sound.play('hit-player');
                    game.particles.burst({ x: p.x, y: p.y, count: 12, speed: [30, 80] });
                    const cx = Math.floor(p.x / T);
                    const cy = Math.floor(p.y / T);
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            const tx = cx + dx, ty = cy + dy;
                            if (grid[ty]?.[tx] === 's') props.breakSandstone(roomId, tx, ty, grid);
                        }
                    }
                } else if (p.kind === 'power-bomb') {
                    game.sound.play('bomb-explode');
                    game.feel.shake(12, 0.5);
                    game.feel.flash('#ffd70044', 0.3);
                    game.particles.burst({ x: p.x, y: p.y, count: 48, speed: [60, 240] });
                    for (let j = 0; j < grid.length; j++) {
                        for (let k = 0; k < grid[j]!.length; k++) {
                            const ch = grid[j]![k];
                            if (ch === 's') props.breakSandstone(roomId, k, j, grid);
                            else if (ch === 'b') props.breakBone(roomId, k, j, grid);
                            else if (ch === 'Y') {
                                grid[j]![k] = '.';
                                run.opened[`gate_${roomId}_${k}_${j}`] = true;
                                game.sound.play('door-open');
                            }
                        }
                    }
                }
                p.sprite.kill();
                this.projectiles.splice(i, 1);
                continue;
            }

            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.sprite.x = p.x;
            p.sprite.y = p.y;

            if (p.kind !== 'charge' && p.kind !== 'power-bomb') {
                const gx = Math.floor(p.x / T);
                const gy = Math.floor(p.y / T);
                const ch = grid[gy]?.[gx];

                if (ch && ch !== '.' && ch !== ',' && ch !== ';' && ch !== ':' && ch !== '=') {
                    if (ch === 'B' && (p.kind === 'beam' || p.kind === 'charged' || p.kind === 'cryo')) {
                        grid[gy]![gx] = '.';
                        game.sound.play('door-open');
                    } else if (ch === 'R' && p.kind === 'missile') {
                        grid[gy]![gx] = '.';
                        run.opened[`gate_${roomId}_${gx}_${gy}`] = true;
                        game.sound.play('door-open');
                    } else if (ch === 'G' && p.kind === 'cryo') {
                        grid[gy]![gx] = '.';
                        run.opened[`gate_${roomId}_${gx}_${gy}`] = true;
                        game.sound.play('door-open');
                    }

                    game.particles.burst({ x: p.x, y: p.y, count: 6, speed: [20, 60] });
                    p.sprite.kill();
                    this.projectiles.splice(i, 1);
                }
            }
        }
    }

    private moveAndCollide(dt: number, grid: string[][], props: PropManager, roomId: string): void {
        this.x += this.vx * dt;
        let leftCol = Math.floor((this.x - this.hw) / T);
        let rightCol = Math.floor((this.x + this.hw) / T);
        let topRow = Math.floor((this.y - this.hh) / T);
        let btmRow = Math.floor((this.y + this.hh - 1) / T);

        for (let j = topRow; j <= btmRow; j++) {
            for (let i = leftCol; i <= rightCol; i++) {
                const ch = grid[j]?.[i];
                if (this.isSolid(ch)) {
                    if (this.boosting && ch === 'b') {
                        props.breakBone(roomId, i, j, grid);
                    } else {
                        if (this.vx > 0) this.x = i * T - this.hw;
                        else if (this.vx < 0) this.x = (i + 1) * T + this.hw;
                        this.vx = 0;
                    }
                }
            }
        }

        this.y += this.vy * dt;
        leftCol = Math.floor((this.x - this.hw) / T);
        rightCol = Math.floor((this.x + this.hw) / T);
        topRow = Math.floor((this.y - this.hh) / T);
        btmRow = Math.floor((this.y + this.hh) / T);

        this.onGround = false;
        for (let j = topRow; j <= btmRow; j++) {
            for (let i = leftCol; i <= rightCol; i++) {
                const ch = grid[j]?.[i];
                if (this.isSolid(ch) || (ch === '=' && this.vy > 0 && (this.y + this.hh - this.vy * dt) <= j * T + 4)) {
                    if (this.vy > 0) {
                        this.y = j * T - this.hh;
                        this.vy = 0;
                        this.onGround = true;
                    } else if (this.vy < 0 && ch !== '=') {
                        this.y = (j + 1) * T + this.hh;
                        this.vy = 0;
                        const tileCenter = i * T + T / 2;
                        if (this.x < tileCenter) this.x -= 3;
                        else this.x += 3;
                    }
                }
                if (ch === '~') {
                    this.damage(15 * dt);
                } else if (ch === '^') {
                    this.damage(25);
                    this.vy = -360;
                }
            }
        }
    }

    private isSolid(ch?: string): boolean {
        if (!ch) return true;
        if (ch === '#' || ch === 's' || ch === 'b' || ch === 'c' || ch === 'R' || ch === 'G' || ch === 'Y' || ch === 'S' || ch === 'B') {
            return true;
        }
        if (ch === ':' && !this.inShell) return true;
        return false;
    }

    private canStand(grid: string[][]): boolean {
        const topRow = Math.floor((this.y - 16) / T);
        const btmRow = Math.floor((this.y + 16 - 1) / T);
        const leftCol = Math.floor((this.x - 10) / T);
        const rightCol = Math.floor((this.x + 10) / T);
        for (let j = topRow; j <= btmRow; j++) {
            for (let i = leftCol; i <= rightCol; i++) {
                if (this.isSolid(grid[j]?.[i])) return false;
            }
        }
        return true;
    }

    private updateVisuals(): void {
        if (!this.sprite) return;
        this.sprite.x = this.x;
        this.sprite.y = this.y;
        this.sprite.sx = this.facing;

        if (this.inShell) {
            this.sprite.texture = 'vaelen-shell';
        } else if (!this.onGround) {
            this.sprite.texture = 'vaelen-jump';
        } else if (this.crouching) {
            this.sprite.texture = 'vaelen-crouch';
        } else if (this.aim === 'up') {
            this.sprite.texture = 'vaelen-aim-up';
        } else if (this.aim === 'diag-up') {
            this.sprite.texture = 'vaelen-aim-diag';
        } else if (Math.abs(this.vx) > 10) {
            this.sprite.texture = 'vaelen-run';
        } else {
            this.sprite.texture = 'vaelen-stand';
        }

        if (this.invulnTimer > 0) {
            this.sprite.visible = Math.floor(this.invulnTimer * 16) % 2 === 0;
        } else {
            this.sprite.visible = true;
        }
    }
}
