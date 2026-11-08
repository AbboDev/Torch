import { game } from '../engine.js';
import assets from '../assets.json';
import { applySave, eraseSlot, newRun, readBest, readSlot, run, writeSlot } from '../run.js';

export const Title = {
    name: 'title',
    enter(): void {
        const W = game.screen.width, H = game.screen.height;
        game.background.gradient('#080d1a', '#1a243a');

        // Play ambient title chiptune
        const stopMusic = game.sound.loop('theme-title');

        // Main Title
        game.ui.label({ anchor: 'top', y: 40, w: W - 64, h: 80, text: 'T O R C H', style: 'heading' });
        game.ui.label({ anchor: 'top', y: 110, w: W - 64, h: 28, text: 'MUTATED ALIEN TEMPLE METROIDVANIA', style: 'flat' });

        // Best record
        const best = readBest();
        if (best) {
            const mins = Math.floor(best.time / 60);
            const secs = Math.floor(best.time % 60);
            const timeStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
            game.ui.label({
                anchor: 'top',
                y: 140,
                w: W - 64,
                h: 24,
                text: `BEST RECORD: ${timeStr} (${best.percent}% ITEMS)`,
                style: 'warn'
            });
        }

        // 3 Save Slots
        const slotY = 190;
        const slotGap = 110;
        for (let slot = 0; slot < 3; slot++) {
            const save = readSlot(slot);
            const sy = slotY + slot * slotGap;

            if (save) {
                const mins = Math.floor(save.time / 60);
                const secs = Math.floor(save.time % 60);
                const timeStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
                const labelText = `SLOT ${slot + 1}: SECTOR ${save.sector} | ${timeStr} | ${save.percent}%`;

                game.ui.label({ anchor: 'top', x: -140, y: sy, w: 320, h: 48, text: labelText, style: 'flat' });
                game.ui.button({
                    anchor: 'top',
                    x: 100,
                    y: sy,
                    h: 48,
                    text: 'Continue',
                    style: 'good',
                    icon: 'play',
                    onClick: () => {
                        applySave(slot, save);
                        void game.assets.load(assets, { pack: 'game' }).then(() => game.scenes.go('play'));
                    }
                });
                game.ui.button({
                    anchor: 'top',
                    x: 230,
                    y: sy,
                    h: 48,
                    text: 'Clear',
                    style: 'bad',
                    onClick: () => {
                        eraseSlot(slot);
                        game.scenes.go('title');
                    }
                });
            } else {
                game.ui.label({ anchor: 'top', x: -140, y: sy, w: 320, h: 48, text: `SLOT ${slot + 1}: EMPTY`, style: 'flat' });
                game.ui.button({
                    anchor: 'top',
                    x: 100,
                    y: sy,
                    h: 48,
                    text: 'New Game',
                    style: 'good',
                    icon: 'play',
                    onClick: () => {
                        newRun(slot);
                        void game.assets.load(assets, { pack: 'game' }).then(() => game.scenes.go('play'));
                    }
                });
            }
        }

        // Mute button
        game.ui.muteButton();

        // Keyboard shortcut: Space or Enter starts Slot 0
        game.step('title', () => {
            if (game.input.keyPressed('Space') || game.input.keyPressed('Enter')) {
                const save = readSlot(0);
                if (save) applySave(0, save);
                else newRun(0);
                void game.assets.load(assets, { pack: 'game' }).then(() => game.scenes.go('play'));
            }
        });
    },
    exit(): void {
        game.sound.stopMusic();
    }
};
