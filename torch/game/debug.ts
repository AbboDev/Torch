import { game } from './engine.js';
import { run, BASE_ENERGY, BASE_MISSILES } from './run.js';
import { ROOMS, sectorOf } from './world.js';
import { getCurrentBoss } from './scenes/Play.js';

export function addDebugControls(): void {
    // Register run state for inspection
    game.inspect.state(() => run);

    // 1. sector <n>
    game.cheats.add({
        name: 'sector',
        does: 'Starts game at first room of sector n with earlier progress',
        args: 'n: 1-4',
        run: arg => {
            const n = Math.max(1, Math.min(4, Number(arg) || 1));
            run.have = {};
            run.opened = {};
            run.maxEnergy = BASE_ENERGY;
            run.maxMissiles = 0;
            run.escaping = false;

            if (n >= 2) {
                run.have['morph-shell'] = true;
                run.have['missile-launcher'] = true;
                run.opened['boss-1'] = true;
                run.maxEnergy += 100; // tank in ducts
                run.maxMissiles = 15;
            }
            if (n >= 3) {
                run.have['cryo-beam'] = true;
                run.opened['boss-2'] = true;
                run.maxEnergy += 100; // tank in crypt
                run.maxMissiles = 20;
            }
            if (n >= 4) {
                run.have['sonic-booster'] = true;
                run.opened['boss-3'] = true;
                run.maxEnergy += 100; // tank in vault
                run.maxMissiles = 20;
            }

            run.energy = run.maxEnergy;
            run.missiles = run.maxMissiles;

            const roomMap: Record<number, string> = {
                1: 'landing-atrium',
                2: 'glacial-shaft',
                3: 'molten-incline',
                4: 'booster-runway'
            };
            run.room = roomMap[n] ?? 'landing-atrium';
            run.sanctRoom = run.room;
            game.scenes.go('play');
            return `sector ${n} (${run.room})`;
        }
    });

    // 2. room <name>
    game.cheats.add({
        name: 'room',
        does: 'Starts game in that room with the progress a player would have there',
        args: 'name',
        run: name => {
            if (!name) return 'room name required';
            const clean = name.toLowerCase().replace(/['\s]/g, '-');
            let target = Object.keys(ROOMS).find(r => r.toLowerCase() === clean || ROOMS[r]?.name.toLowerCase() === name.toLowerCase());
            if (!target) {
                // partial match
                target = Object.keys(ROOMS).find(r => r.includes(clean) || ROOMS[r]?.name.toLowerCase().includes(name.toLowerCase()));
            }
            if (!target) return `unknown room: ${name}`;

            const sec = sectorOf(target);
            // apply progress for that sector
            if (sec >= 2) {
                run.have['morph-shell'] = true;
                run.have['missile-launcher'] = true;
                run.opened['boss-1'] = true;
                run.maxEnergy = Math.max(run.maxEnergy, 199);
                run.maxMissiles = Math.max(run.maxMissiles, 15);
            }
            if (sec >= 3) {
                run.have['cryo-beam'] = true;
                run.opened['boss-2'] = true;
                run.maxEnergy = Math.max(run.maxEnergy, 299);
                run.maxMissiles = Math.max(run.maxMissiles, 20);
            }
            if (sec >= 4) {
                run.have['sonic-booster'] = true;
                run.opened['boss-3'] = true;
            }
            run.energy = run.maxEnergy;
            run.missiles = run.maxMissiles;
            run.room = target;
            game.scenes.go('play');
            return `room ${target}`;
        }
    });

    // 3. boss <n>
    game.cheats.add({
        name: 'boss',
        does: "Starts in that guardian's arena (1-4) with appropriate upgrades and full health",
        args: 'n: 1-4',
        run: arg => {
            const n = Math.max(1, Math.min(4, Number(arg) || 1));
            const arenas: Record<number, string> = {
                1: 'broodmother-conservatory',
                2: 'arena-of-frostbound',
                3: 'magnetic-caldera',
                4: 'apex-chamber'
            };
            if (n >= 1) run.have['morph-shell'] = true;
            if (n >= 2) {
                run.have['missile-launcher'] = true;
                run.opened['boss-1'] = true;
                run.maxMissiles = 15;
            }
            if (n >= 3) {
                run.have['cryo-beam'] = true;
                run.opened['boss-2'] = true;
                run.maxMissiles = 20;
            }
            if (n >= 4) {
                run.have['sonic-booster'] = true;
                run.have['power-bomb'] = true;
                run.opened['boss-3'] = true;
                run.maxEnergy = 299;
                run.maxMissiles = 20;
            }
            run.energy = run.maxEnergy;
            run.missiles = run.maxMissiles;
            run.room = arenas[n]!;
            delete run.opened[`boss-${n}`]; // ensure boss spawns
            game.scenes.go('play');
            return `boss ${n} in ${run.room}`;
        }
    });

    // 4. escape
    game.cheats.add({
        name: 'escape',
        does: 'Starts purge after Apex Metamorph with clock running in Apex Chamber',
        run: () => {
            run.have['morph-shell'] = true;
            run.have['missile-launcher'] = true;
            run.have['cryo-beam'] = true;
            run.have['sonic-booster'] = true;
            run.have['power-bomb'] = true;
            run.opened['boss-1'] = true;
            run.opened['boss-2'] = true;
            run.opened['boss-3'] = true;
            run.opened['boss-4'] = true;
            run.escaping = true;
            run.escapeLeft = 150;
            run.energy = run.maxEnergy;
            run.missiles = run.maxMissiles;
            run.room = 'apex-chamber';
            game.scenes.go('play');
            return 'escape started';
        }
    });

    // 5. screen <name>
    game.cheats.add({
        name: 'screen',
        does: 'Shows that screen: title, debrief or defeat',
        args: 'name',
        run: name => {
            const s = (name ?? 'title').toLowerCase();
            if (s === 'title') game.scenes.go('title');
            else if (s === 'debrief') game.scenes.go('debrief');
            else if (s === 'defeat' || s === 'gameover') game.scenes.go('defeat');
            else if (s === 'play') game.scenes.go('play');
            else if (s === 'pause') game.scenes.push('pause');
            else game.scenes.go(s);
            return `screen ${s}`;
        }
    });

    // 6. give <item>
    game.cheats.add({
        name: 'give',
        does: 'Gives upgrade or pickup at once',
        args: 'item',
        run: item => {
            const it = (item ?? '').toLowerCase();
            if (it === 'energy-tank') {
                run.maxEnergy += 100;
                run.energy = run.maxEnergy;
                return `gave energy-tank, max: ${run.maxEnergy}`;
            } else if (it === 'missile-reserve') {
                run.maxMissiles += 5;
                run.missiles = run.maxMissiles;
                return `gave missile-reserve, max: ${run.maxMissiles}`;
            } else {
                run.have[it] = true;
                if (it === 'missile-launcher' && run.maxMissiles === 0) {
                    run.maxMissiles = 10;
                    run.missiles = 10;
                }
                return `gave ${it}`;
            }
        }
    });

    // 7. refill <what>
    game.cheats.add({
        name: 'refill',
        does: 'Fills Vaelen energy or missiles to current maximum',
        args: 'what',
        run: what => {
            const w = (what ?? 'energy').toLowerCase();
            if (w === 'missiles') {
                run.missiles = run.maxMissiles;
                return `missiles refilled to ${run.missiles}`;
            } else {
                run.energy = run.maxEnergy;
                return `energy refilled to ${run.energy}`;
            }
        }
    });

    // 8. infinite-energy
    game.cheats.add({
        name: 'infinite-energy',
        does: 'Energy never drops, though damage still flashes',
        args: 'state: on|off',
        run: state => {
            run.infiniteEnergy = state === 'off' ? false : (state === 'on' ? true : !run.infiniteEnergy);
            return `infinite-energy ${run.infiniteEnergy ? 'on' : 'off'}`;
        },
        on: () => run.infiniteEnergy
    });

    // 9. infinite-missiles
    game.cheats.add({
        name: 'infinite-missiles',
        does: 'Missiles are never used up',
        args: 'state: on|off',
        run: state => {
            run.infiniteMissiles = state === 'off' ? false : (state === 'on' ? true : !run.infiniteMissiles);
            return `infinite-missiles ${run.infiniteMissiles ? 'on' : 'off'}`;
        },
        on: () => run.infiniteMissiles
    });

    // 10. invincible
    game.cheats.add({
        name: 'invincible',
        does: 'Vaelen takes no damage from creatures, hazards or Stalker',
        args: 'state: on|off',
        run: state => {
            run.invincible = state === 'off' ? false : (state === 'on' ? true : !run.invincible);
            return `invincible ${run.invincible ? 'on' : 'off'}`;
        },
        on: () => run.invincible
    });

    // 11. unlock-all
    game.cheats.add({
        name: 'unlock-all',
        does: 'Every Blue, Red, Green and Yellow gate acts as open',
        args: 'state: on|off',
        run: state => {
            run.unlockAll = state === 'off' ? false : (state === 'on' ? true : !run.unlockAll);
            return `unlock-all ${run.unlockAll ? 'on' : 'off'}`;
        },
        on: () => run.unlockAll
    });

    // 12. stalker
    game.cheats.add({
        name: 'stalker',
        does: 'Turns off Shadow Stalker pursuit in Echoing Galleries',
        args: 'state: on|off',
        run: state => {
            run.stalkerOff = state === 'off' ? true : (state === 'on' ? false : !run.stalkerOff);
            return `stalker ${run.stalkerOff ? 'off' : 'on'}`;
        },
        on: () => !run.stalkerOff
    });

    // 13. freeze-clock
    game.cheats.add({
        name: 'freeze-clock',
        does: 'The Evacuation Countdown Clock stops during the escape',
        args: 'state: on|off',
        run: state => {
            run.freezeClock = state === 'off' ? false : (state === 'on' ? true : !run.freezeClock);
            return `freeze-clock ${run.freezeClock ? 'on' : 'off'}`;
        },
        on: () => run.freezeClock
    });

    // 14. slow-motion
    game.cheats.add({
        name: 'slow-motion',
        does: 'Runs game at reduced speed',
        args: 'state: on|off',
        run: state => {
            run.slowMotion = state === 'off' ? false : (state === 'on' ? true : !run.slowMotion);
            return `slow-motion ${run.slowMotion ? 'on' : 'off'}`;
        },
        on: () => run.slowMotion
    });

    // 15. win-boss
    game.cheats.add({
        name: 'win-boss',
        does: 'Defeats current guardian by game own path',
        run: () => {
            const b = getCurrentBoss();
            if (b && !b.dead) {
                b.hp = 0;
                b.die();
                return 'current boss defeated';
            }
            return 'no active boss to defeat';
        }
    });

    // 16. lose-life
    game.cheats.add({
        name: 'lose-life',
        does: 'Sends Vaelen through normal defeat and resumes at last sanctuary',
        run: () => {
            game.scenes.go('defeat');
            return 'lose-life triggered';
        }
    });

    // 17. end-run
    game.cheats.add({
        name: 'end-run',
        does: 'Reaches shuttle through game ending: collapse, launch, debrief',
        run: () => {
            run.escaping = true;
            game.scenes.go('debrief');
            return 'end-run triggered';
        }
    });
}
