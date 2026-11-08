import { game } from '../engine.js';
import { calcDiscoveredPercent, calcPercent, run } from '../run.js';
import { ROOMS, sectorOf } from '../world.js';

type GfxHandle = ReturnType<typeof game.graphics>;

export class MapHologram {
    panX = 0;
    panY = 0;
    zoom = 1.0;
    gfx: GfxHandle | null = null;

    render(currentRoomId: string): void {
        const W = game.screen.width;
        const H = game.screen.height;

        if (this.gfx) this.gfx.destroy();
        this.gfx = game.graphics({ layer: 'hud' });

        const curRoom = ROOMS[currentRoomId];
        const sec = sectorOf(currentRoomId);
        const sectorNames = [
            'Central Transit Shaft',
            'Sector 1: The Sunken Overgrowth',
            'Sector 2: The Cryogenic Catacombs',
            'Sector 3: The Geothermal Foundry',
            'Sector 4: The Apex Sanctuary'
        ];
        const secName = sectorNames[sec] ?? 'Alien Temple Complex';

        const mins = Math.floor(run.time / 60);
        const secs = Math.floor(run.time % 60);
        const timeStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

        game.ui.label({
            anchor: 'top',
            x: 0,
            y: 54,
            w: W - 120,
            h: 30,
            text: `HOLOGRAM MAP // ${secName.toUpperCase()}`,
            style: 'heading'
        });

        game.ui.label({
            anchor: 'top',
            x: 0,
            y: 84,
            w: W - 120,
            h: 24,
            text: `EXPLORED: ${calcDiscoveredPercent()}% | ITEMS: ${calcPercent()}% | TIME: ${timeStr} | ROOM: ${curRoom?.name ?? 'Unknown'}`,
            style: 'flat'
        });

        const ox = W / 2 - 240 + this.panX;
        const oy = H / 2 - 120 + this.panY;
        const scale = 14 * this.zoom;

        this.gfx.clear();
        // Background Hologram Tint (top-left x, y, w, h)
        this.gfx.rect(40, 40, W - 80, H - 180, '#0a1018e6');

        for (const [id, r] of Object.entries(ROOMS)) {
            const visited = !!run.visited[id];
            const termScanned = !!run.opened[`terminal-${r.sector}`];

            if (visited || termScanned) {
                const rx = ox + r.map.x * scale;
                const ry = oy + r.map.y * scale;
                const rw = r.map.w * scale;
                const rh = r.map.h * scale;

                let fill = '#141e2a';
                if (visited) {
                    if (r.sector === 1) fill = '#1b4332';
                    else if (r.sector === 2) fill = '#1d3557';
                    else if (r.sector === 3) fill = '#6a040f';
                    else if (r.sector === 4) fill = '#3c096c';
                    else fill = '#2b2d42';
                }

                this.gfx.rect(rx, ry, rw, rh, fill);

                if (r.safe) {
                    this.gfx.rect(rx + rw / 2 - 3, ry + rh / 2 - 3, 6, 6, '#2ec4b6');
                }
                if (r.boss > 0) {
                    this.gfx.rect(rx + rw / 2 - 3, ry + rh / 2 - 3, 6, 6, '#e63946');
                }
                if (id === currentRoomId) {
                    this.gfx.rect(rx, ry, rw, 3, '#00ffff');
                }
            }
        }
    }

    destroy(): void {
        if (this.gfx) {
            this.gfx.destroy();
            this.gfx = null;
        }
    }
}
