import { game } from '../engine.js';
import { run, snapshot, writeSlot } from '../run.js';
import { sectorOf } from '../world.js';
import { MapHologram } from '../ui/MapHologram.js';

const mapHologram = new MapHologram();

export const Pause = {
    name: 'pause',
    enter(): void {
        const W = game.screen.width, H = game.screen.height;

        // Render Map Hologram
        mapHologram.render(run.room);

        // Buttons at the bottom
        const btnY = H - 80;
        game.ui.button({
            anchor: 'top-left',
            x: 80,
            y: btnY,
            h: 52,
            text: 'Resume',
            style: 'good',
            icon: 'play',
            onClick: () => game.scenes.pop()
        });

        game.ui.button({
            anchor: 'top-left',
            x: 230,
            y: btnY,
            h: 52,
            text: 'Save Game',
            style: 'warn',
            onClick: () => {
                const s = snapshot(sectorOf(run.room));
                writeSlot(run.slot, s);
                game.sound.play('save');
            }
        });

        game.ui.button({
            anchor: 'top-left',
            x: 390,
            y: btnY,
            h: 52,
            text: 'Title',
            icon: 'home',
            onClick: () => {
                game.scenes.pop();
                game.scenes.go('title');
            }
        });

        game.ui.muteButton();

        game.step('pause', () => {
            if (game.input.keyPressed('Escape') || game.input.keyPressed('KeyP')) {
                game.scenes.pop();
            }
        });
    }
};
