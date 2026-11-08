import { game } from '../engine.js';
import { run } from '../run.js';
import { ROOMS, sectorOf } from '../world.js';
import { Player } from '../entities/Player.js';

type BarHandle = ReturnType<typeof game.bars.create>;
type GfxHandle = ReturnType<typeof game.graphics>;
type TextHandle = ReturnType<typeof game.text>;

export class HUD {
    energyBar: BarHandle | null = null;
    bossBar: BarHandle | null = null;
    alarmTimer = 0;
    gfx: GfxHandle | null = null;
    missileText: TextHandle | null = null;
    threatText: TextHandle | null = null;
    evacText: TextHandle | null = null;

    init(): void {
        this.destroy();
        const W = game.screen.width;

        this.energyBar = game.bars.create({
            style: 'neon',
            anchor: 'top-left',
            x: 130,
            y: 28,
            width: 180,
            height: 18,
            max: run.maxEnergy,
            value: run.energy,
            fill: '#00f0ff',
            label: { text: '{value} / {max}', position: 'center' }
        });

        this.missileText = game.text('', 40, 54, {
            size: 14,
            font: 'sans-bold',
            color: '#00f0ff',
            align: 'left',
            baseline: 'top'
        });

        this.evacText = game.text('', W / 2, 20, {
            size: 22,
            font: 'sans-bold',
            color: '#ff2255',
            align: 'center',
            baseline: 'top'
        });
        this.evacText.visible = false;

        this.threatText = game.text('! THREAT STATIC !', W - 190, 84, {
            size: 14,
            font: 'sans-bold',
            color: '#ff0033',
            align: 'center',
            baseline: 'top'
        });
        this.threatText.visible = false;

        this.gfx = game.graphics({ layer: 'hud' });

        game.ui.pauseButton();
        game.ui.muteButton();
    }

    destroy(): void {
        if (this.energyBar) this.energyBar.handle.kill();
        if (this.bossBar) this.bossBar.handle.kill();
        if (this.gfx) this.gfx.destroy();
        if (this.missileText) this.missileText.destroy();
        if (this.evacText) this.evacText.destroy();
        if (this.threatText) this.threatText.destroy();
        this.energyBar = null;
        this.bossBar = null;
        this.gfx = null;
        this.missileText = null;
        this.evacText = null;
        this.threatText = null;
    }

    showBossBar(maxHp: number): void {
        if (this.bossBar) this.bossBar.handle.kill();
        this.bossBar = game.bars.create({
            style: 'fighter',
            anchor: 'bottom',
            x: 0,
            y: -36,
            width: 440,
            height: 20,
            max: maxHp,
            value: maxHp,
            fill: '#ff2255',
            label: { text: 'GUARDIAN', position: 'center' }
        });
    }

    updateBossHp(hp: number): void {
        if (this.bossBar) {
            this.bossBar.value = hp;
            if (hp <= 0) {
                this.bossBar.handle.kill();
                this.bossBar = null;
            }
        }
    }

    update(dt: number, player: Player, currentRoomId: string, stalkerNear: boolean): void {
        if (this.energyBar) {
            this.energyBar.max = run.maxEnergy;
            this.energyBar.value = run.energy;

            if (run.energy < run.maxEnergy * 0.25) {
                this.alarmTimer += dt;
                if (this.alarmTimer >= 0.8) {
                    this.alarmTimer = 0;
                    game.sound.play('alarm');
                    this.energyBar.flash('#ff0033');
                }
            }
        }

        if (this.evacText) {
            if (run.escaping) {
                if (!run.freezeClock) {
                    run.escapeLeft = Math.max(0, run.escapeLeft - dt);
                }
                const mins = Math.floor(run.escapeLeft / 60);
                const secs = Math.floor(run.escapeLeft % 60);
                const str = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
                this.evacText.text = `EVAC: ${str}`;
                this.evacText.visible = true;
            } else {
                this.evacText.visible = false;
            }
        }

        if (this.missileText) {
            if (run.maxMissiles > 0 || run.have['missile-launcher'] || run.unlockAll) {
                const armed = player.missilesArmed;
                this.missileText.text = `MISSILES: ${run.missiles}/${run.maxMissiles} ${armed ? '[ARMED]' : ''}`;
                this.missileText.visible = true;
            } else {
                this.missileText.visible = false;
            }
        }

        if (this.threatText) {
            this.threatText.visible = stalkerNear;
        }

        this.renderMiniMap(currentRoomId);
    }

    private renderMiniMap(currentRoomId: string): void {
        const curRoom = ROOMS[currentRoomId];
        if (!curRoom || !this.gfx) return;

        const curSector = sectorOf(currentRoomId);
        const termScanned = !!run.opened[`terminal-${curSector}`];

        const mapW = 120;
        const mapH = 70;
        const startX = game.screen.width - mapW - 14;
        const startY = 14;

        const curMx = curRoom.map.x;
        const curMy = curRoom.map.y;

        this.gfx.clear();
        // Mini-map frame (origin top-left)
        this.gfx.rect(startX, startY, mapW, mapH, '#08101cd0');

        for (const [id, r] of Object.entries(ROOMS)) {
            const visited = !!run.visited[id];
            const inSector = r.sector === curSector;

            if (visited || (inSector && termScanned)) {
                const rx = startX + 16 + (r.map.x - curMx) * 7;
                const ry = startY + 14 + (r.map.y - curMy) * 6;
                const rw = r.map.w * 7;
                const rh = r.map.h * 6;

                const isCur = id === currentRoomId;
                const fill = isCur ? '#00f0ff' : (visited ? '#2a5a88' : '#142030');
                this.gfx.rect(rx, ry, rw, rh, fill);
            }
        }
    }
}
