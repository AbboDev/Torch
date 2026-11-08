import { game } from '../engine.js';
import { run } from '../run.js';

export const Defeat = {
    name: 'defeat',
    enter(): void {
        const W = game.screen.width, H = game.screen.height;
        game.background.color('#0a060a');

        game.sound.play('hit-player');
        game.feel.shake(10, 0.5);

        game.ui.label({ anchor: 'center', y: -40, w: W - 64, h: 60, text: 'SUIT COLLAPSED', style: 'bad' });
        game.ui.label({ anchor: 'center', y: 20, w: W - 64, h: 30, text: 'Rerouting bio-energy to sanctuary...', style: 'flat' });

        let elapsed = 0;
        game.step('defeat', dt => {
            elapsed += dt;
            if (elapsed >= 1.8 || game.input.keyPressed('Space') || game.input.keyPressed('Enter')) {
                // Resume at most recent Biocell Save Sanctuary
                run.room = run.sanctRoom;
                run.energy = run.maxEnergy;
                run.missiles = run.maxMissiles;
                game.scenes.go('play');
            }
        });
    }
};
