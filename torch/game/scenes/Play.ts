import { game } from '../engine.js';
import type { Obj } from '../engine.js';
import { run, snapshot, writeSlot } from '../run.js';
import { ROOMS, sectorOf, T } from '../world.js';
import type { RoomDef } from '../world.js';
import { Player } from '../entities/Player.js';
import type { Projectile } from '../entities/Player.js';
import { Enemy } from '../entities/Enemies.js';
import { Boss } from '../entities/Bosses.js';
import { Stalker } from '../entities/Stalker.js';
import { PropManager } from '../entities/Props.js';
import { HUD } from '../ui/HUD.js';

let player: Player;
let props: PropManager;
let hud: HUD;
let enemies: Enemy[] = [];
let boss: Boss | null = null;
let stalker: Stalker | null = null;
let enemyProjectiles: Projectile[] = [];
let tileSprites: Obj[] = [];
let doorArrival: { ax: number; ay: number } | null = null;
let currentGrid: string[][] = [];
let currentMusic: string = '';

export function setDoorArrival(ax: number, ay: number): void {
    doorArrival = { ax, ay };
}

export function getCurrentPlayer(): Player | null {
    return player;
}

export function getCurrentBoss(): Boss | null {
    return boss;
}

export const Play = {
    name: 'play',
    enter(): void {
        props = new PropManager();
        player = new Player();
        hud = new HUD();
        hud.init();

        loadRoom(run.room);

        game.step('play', dt => {
            const effectiveDt = run.slowMotion ? dt * 0.4 : dt;

            if (game.input.keyPressed('Escape') || game.input.keyPressed('KeyP')) {
                game.scenes.push('pause');
                return;
            }

            if (run.energy <= 0 || (run.escaping && run.escapeLeft <= 0)) {
                game.scenes.go('defeat');
                return;
            }

            run.time += effectiveDt;

            player.update(effectiveDt, currentGrid, ROOMS[run.room]?.ice ?? false, props, run.room);

            props.update(effectiveDt, player.x, player.y, currentGrid,
                amt => { if (!run.infiniteEnergy) run.energy = Math.min(run.maxEnergy, run.energy + amt); },
                amt => { if (!run.infiniteMissiles) run.missiles = Math.min(run.maxMissiles, run.missiles + amt); }
            );

            for (let i = enemies.length - 1; i >= 0; i--) {
                const e = enemies[i]!;
                e.update(effectiveDt, player, props, enemyProjectiles, currentGrid);
                if (e.dead) {
                    enemies.splice(i, 1);
                    continue;
                }
                for (let j = player.projectiles.length - 1; j >= 0; j--) {
                    const p = player.projectiles[j]!;
                    if (Math.hypot(p.x - e.x, p.y - e.y) < p.radius + 14) {
                        e.hit(p.damage, p.kind, props);
                        if (p.kind !== 'charge' && p.kind !== 'power-bomb') {
                            p.sprite.kill();
                            player.projectiles.splice(j, 1);
                        }
                    }
                }
            }

            if (boss) {
                if (!boss.dead) {
                    boss.update(effectiveDt, player, props, enemyProjectiles, () => {
                        for (let j = 0; j < currentGrid.length; j++) {
                            for (let i = 0; i < currentGrid[j]!.length; i++) {
                                if (currentGrid[j]![i] === 'S') currentGrid[j]![i] = '.';
                            }
                        }
                    });
                    hud.updateBossHp(boss.hp);

                    for (let j = player.projectiles.length - 1; j >= 0; j--) {
                        const p = player.projectiles[j]!;
                        if (Math.hypot(p.x - boss.x, p.y - boss.y) < p.radius + 36) {
                            boss.hit(p, props, () => {
                                for (let j = 0; j < currentGrid.length; j++) {
                                    for (let i = 0; i < currentGrid[j]!.length; i++) {
                                        if (currentGrid[j]![i] === 'S') currentGrid[j]![i] = '.';
                                    }
                                }
                            });
                            if (p.kind !== 'charge' && p.kind !== 'power-bomb') {
                                p.sprite.kill();
                                player.projectiles.splice(j, 1);
                            }
                        }
                    }
                } else {
                    hud.updateBossHp(0);
                }
            }

            if (stalker && stalker.active) {
                stalker.update(effectiveDt, player, currentGrid, enemyProjectiles);
                for (let j = player.projectiles.length - 1; j >= 0; j--) {
                    const p = player.projectiles[j]!;
                    if (Math.hypot(p.x - stalker.x, p.y - stalker.y) < p.radius + 20) {
                        stalker.sparkOff(p);
                        if (p.kind !== 'charge' && p.kind !== 'power-bomb') {
                            p.sprite.kill();
                            player.projectiles.splice(j, 1);
                        }
                    }
                }
            }

            for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
                const ep = enemyProjectiles[i]!;
                ep.life -= effectiveDt;
                if (ep.life <= 0) {
                    ep.sprite.kill();
                    enemyProjectiles.splice(i, 1);
                    continue;
                }
                ep.x += ep.vx * effectiveDt;
                ep.y += ep.vy * effectiveDt;
                ep.sprite.x = ep.x;
                ep.sprite.y = ep.y;

                if (Math.hypot(player.x - ep.x, player.y - ep.y) < ep.radius + 14) {
                    player.damage(ep.damage, ep.x);
                    ep.sprite.kill();
                    enemyProjectiles.splice(i, 1);
                    continue;
                }

                const gx = Math.floor(ep.x / T);
                const gy = Math.floor(ep.y / T);
                if (currentGrid[gy]?.[gx] === '#') {
                    ep.sprite.kill();
                    enemyProjectiles.splice(i, 1);
                }
            }

            checkDoors();
            checkWorldInteractions();

            const stalkerNear = !!(stalker && stalker.active && run.room === 'echoing-galleries');
            hud.update(effectiveDt, player, run.room, stalkerNear);

            if (game.screen.width < game.screen.height) {
                game.ui.label({
                    anchor: 'center',
                    w: game.screen.width - 40,
                    h: 40,
                    text: 'Please turn device to landscape',
                    style: 'bad'
                });
            }
        });
    },
    exit(): void {
        hud.destroy();
        player.destroy();
        props.clear();
        clearRoom();
        game.sound.stopMusic();
    }
};

function loadRoom(roomId: string): void {
    const room = ROOMS[roomId];
    if (!room) return;

    clearRoom();
    run.room = roomId;
    run.visited[roomId] = true;

    game.rig.bounds({ x: 0, y: 0, w: room.w * T, h: room.h * T });
    game.rig.deadzone = { w: 140, h: 90 };
    game.rig.smoothing = 0.12;

    currentGrid = room.grid.map(row => row.split(''));

    for (let j = 0; j < currentGrid.length; j++) {
        for (let i = 0; i < currentGrid[j]!.length; i++) {
            const ch = currentGrid[j]![i];
            const gateKey = `gate_${roomId}_${i}_${j}`;
            if (run.unlockAll || run.opened[gateKey]) {
                if (ch === 'B' || ch === 'R' || ch === 'G' || ch === 'Y') currentGrid[j]![i] = '.';
            }
            if (ch === 'S' && run.opened[`boss-${room.boss}`]) {
                currentGrid[j]![i] = '.';
            }
        }
    }

    props.initRoom(roomId, currentGrid);

    for (let j = 0; j < currentGrid.length; j++) {
        for (let i = 0; i < currentGrid[j]!.length; i++) {
            const ch = currentGrid[j]![i];
            const x = i * T + T / 2;
            const y = j * T + T / 2;

            if (ch === '#') {
                const tex = room.ice ? 'tile-ice' : 'tile-stone';
                tileSprites.push(game.spawn({ texture: tex, x, y, layer: 'world', z: 1 }));
            } else if (ch === '=') {
                tileSprites.push(game.spawn({ texture: 'tile-platform', x, y: y + 8, layer: 'world', z: 1 }));
            } else if (ch === 's') {
                tileSprites.push(game.spawn({ texture: 'tile-sandstone', x, y, layer: 'world', z: 1 }));
            } else if (ch === 'b') {
                tileSprites.push(game.spawn({ texture: 'tile-bone', x, y, layer: 'world', z: 1 }));
            } else if (ch === 'c') {
                tileSprites.push(game.spawn({ texture: 'tile-crumble', x, y, layer: 'world', z: 1 }));
            } else if (ch === '~') {
                tileSprites.push(game.spawn({ texture: 'tile-slime', x, y: y + 6, layer: 'world', z: 2 }));
            } else if (ch === '^') {
                tileSprites.push(game.spawn({ texture: 'tile-spikes', x, y: y + 6, layer: 'world', z: 2 }));
            } else if (ch === 'B') {
                tileSprites.push(game.spawn({ texture: 'gate-blue', x, y, layer: 'world', z: 2 }));
            } else if (ch === 'R') {
                tileSprites.push(game.spawn({ texture: 'gate-red', x, y, layer: 'world', z: 2 }));
            } else if (ch === 'G') {
                tileSprites.push(game.spawn({ texture: 'gate-green', x, y, layer: 'world', z: 2 }));
            } else if (ch === 'Y') {
                tileSprites.push(game.spawn({ texture: 'gate-yellow', x, y, layer: 'world', z: 2 }));
            } else if (ch === 'S') {
                tileSprites.push(game.spawn({ texture: 'gate-sealed', x, y, layer: 'world', z: 2 }));
            } else if (ch === ':') {
                tileSprites.push(game.spawn({ texture: 'duct-overlay', x, y, layer: 'world', z: 0 }));
            } else if (ch === ',') {
                tileSprites.push(game.spawn({ texture: 'alcove-bg', x, y, layer: 'world', z: 0 }));
            } else if (ch === ';') {
                tileSprites.push(game.spawn({ texture: 'pillar-bg', x, y, layer: 'world', z: 0 }));
            }
        }
    }

    for (const ent of room.ents) {
        const ex = ent.x * T + T / 2;
        const ey = ent.y * T + T / 2;

        if (ent.kind === 'crawler' || ent.kind === 'drifter' || ent.kind === 'leaper' || ent.kind === 'swarm') {
            enemies.push(new Enemy(ent.kind, ex, ey, `${roomId}_${ent.x}_${ent.y}`));
        } else if (ent.kind === 'spitter') {
            if (!run.opened[`spitter_${roomId}_${ent.x}_${ent.y}`]) {
                enemies.push(new Enemy('spitter', ex, ey, `${roomId}_${ent.x}_${ent.y}`));
            }
        } else if (ent.kind === 'boss') {
            const bNum = Number(ent.a?.n ?? 1);
            if (!run.opened[`boss-${bNum}`]) {
                boss = new Boss(bNum, ex, ey);
                hud.showBossBar(boss.maxHp);
            }
        } else if (ent.kind === 'stalker') {
            stalker = new Stalker();
            stalker.init(ex, ey);
        } else if (ent.kind === 'pedestal') {
            const itemKey = String(ent.a?.item ?? 'morph-shell');
            if (!run.have[itemKey]) {
                tileSprites.push(game.spawn({ texture: 'pedestal', x: ex, y: ey, layer: 'world', z: 2 }));
                tileSprites.push(game.spawn({ texture: 'pickup-energy', x: ex, y: ey - 14, layer: 'world', z: 3 }));
            }
        } else if (ent.kind === 'tank') {
            const tankId = String(ent.a?.id ?? 'tank');
            if (!run.opened[tankId]) {
                tileSprites.push(game.spawn({ texture: 'tank-pod', x: ex, y: ey, layer: 'world', z: 2 }));
            }
        } else if (ent.kind === 'reserve') {
            const reserveId = String(ent.a?.id ?? 'reserve');
            if (!run.opened[reserveId]) {
                tileSprites.push(game.spawn({ texture: 'reserve-canister', x: ex, y: ey, layer: 'world', z: 2 }));
            }
        } else if (ent.kind === 'terminal') {
            tileSprites.push(game.spawn({ texture: 'terminal', x: ex, y: ey, layer: 'world', z: 2 }));
        } else if (ent.kind === 'sanctuary') {
            tileSprites.push(game.spawn({ texture: 'sanctuary-dais', x: ex, y: ey + 6, layer: 'world', z: 2 }));
        } else if (ent.kind === 'lift') {
            tileSprites.push(game.spawn({ texture: 'lift-pad', x: ex, y: ey + 10, layer: 'world', z: 2 }));
        } else if (ent.kind === 'shuttle') {
            tileSprites.push(game.spawn({ texture: 'shuttle', x: ex, y: ey, layer: 'world', z: 2 }));
        }
    }

    let spawnX = (room.spawn?.x ?? 4) * T + T / 2;
    let spawnY = (room.spawn?.y ?? 10) * T + T / 2;
    if (doorArrival) {
        spawnX = doorArrival.ax * T;
        spawnY = doorArrival.ay * T;
        doorArrival = null;
    }
    player.init(spawnX, spawnY);
    if (player.sprite) game.rig.follow(player.sprite);

    updateMusic(roomId, room);
}

function clearRoom(): void {
    for (const spr of tileSprites) spr.kill();
    tileSprites = [];
    for (const e of enemies) e.sprite.kill();
    enemies = [];
    if (boss) {
        boss.destroy();
        boss = null;
    }
    if (stalker) {
        stalker.destroy();
        stalker = null;
    }
    for (const ep of enemyProjectiles) ep.sprite.kill();
    enemyProjectiles = [];
}

function updateMusic(roomId: string, room: RoomDef): void {
    let target = 'theme-explore';
    if (run.escaping) {
        target = 'theme-escape';
    } else if (room.boss > 0 && !run.opened[`boss-${room.boss}`]) {
        target = 'theme-boss';
    } else if (roomId === 'echoing-galleries' && !run.stalkerOff) {
        target = 'theme-stalker';
    }

    if (currentMusic !== target) {
        game.sound.stopMusic();
        currentMusic = target;
        game.sound.loop(target);
    }
}

function checkDoors(): void {
    const room = ROOMS[run.room];
    if (!room) return;

    for (const d of room.doors) {
        const dx = d.x * T;
        const dy = d.y * T;
        const dw = d.w * T;
        const dh = d.h * T;

        if (player.x >= dx && player.x <= dx + dw && player.y >= dy && player.y <= dy + dh) {
            if (d.lift) {
                if (game.input.keyPressed('ArrowUp') || game.input.keyPressed('KeyW') || game.input.keyPressed('ArrowDown') || game.input.keyPressed('KeyS') || game.input.keyPressed('Touch:up') || game.input.keyPressed('Touch:down')) {
                    game.sound.play('lift');
                    doorArrival = { ax: d.ax, ay: d.ay };
                    loadRoom(d.to);
                    return;
                }
            } else {
                game.sound.play('door-open');
                doorArrival = { ax: d.ax, ay: d.ay };
                loadRoom(d.to);
                return;
            }
        }
    }
}

function checkWorldInteractions(): void {
    const room = ROOMS[run.room];
    if (!room) return;

    for (const ent of room.ents) {
        const ex = ent.x * T + T / 2;
        const ey = ent.y * T + T / 2;
        const dist = Math.hypot(player.x - ex, player.y - ey);

        if (dist < 28) {
            if (ent.kind === 'sanctuary') {
                if (run.sanctRoom !== run.room || run.energy < run.maxEnergy || run.missiles < run.maxMissiles) {
                    run.sanctRoom = run.room;
                    run.energy = run.maxEnergy;
                    run.missiles = run.maxMissiles;
                    const s = snapshot(sectorOf(run.room));
                    writeSlot(run.slot, s);
                    game.sound.play('save');
                    game.particles.burst({ x: ex, y: ey, count: 24, speed: [30, 80] });
                }
            } else if (ent.kind === 'terminal') {
                const termKey = `terminal-${room.sector}`;
                if (!run.opened[termKey]) {
                    run.opened[termKey] = true;
                    game.sound.play('save');
                    game.particles.burst({ x: ex, y: ey, count: 20, speed: [30, 70] });
                }
            } else if (ent.kind === 'pedestal') {
                const itemKey = String(ent.a?.item ?? 'morph-shell');
                if (!run.have[itemKey]) {
                    run.have[itemKey] = true;
                    if (itemKey === 'missile-launcher' && run.maxMissiles === 0) {
                        run.maxMissiles = 10;
                        run.missiles = 10;
                    }
                    game.sound.play('fanfare');
                    game.particles.burst({ x: ex, y: ey, count: 32, speed: [40, 120] });
                    loadRoom(run.room);
                }
            } else if (ent.kind === 'tank') {
                const tankId = String(ent.a?.id ?? 'tank');
                if (!run.opened[tankId]) {
                    run.opened[tankId] = true;
                    run.maxEnergy += 100;
                    run.energy = run.maxEnergy;
                    game.sound.play('fanfare');
                    game.particles.burst({ x: ex, y: ey, count: 32, speed: [40, 120] });
                    loadRoom(run.room);
                }
            } else if (ent.kind === 'reserve') {
                const resId = String(ent.a?.id ?? 'reserve');
                if (!run.opened[resId]) {
                    run.opened[resId] = true;
                    run.maxMissiles += 5;
                    run.missiles = run.maxMissiles;
                    game.sound.play('fanfare');
                    game.particles.burst({ x: ex, y: ey, count: 32, speed: [40, 120] });
                    loadRoom(run.room);
                }
            } else if (ent.kind === 'shuttle') {
                if (run.escaping) {
                    game.sound.play('fanfare');
                    game.feel.shake(12, 1.0);
                    game.scenes.go('debrief');
                }
            }
        }
    }
}
