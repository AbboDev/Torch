import { game } from '../engine.js';

/**
 * How a game ends: won, lost, or out of time.
 *
 * Usually the result and the score, and the way back. The way back is already here: Play again (or Space or Enter)
 * goes to 'play', and Title to the title. Show the score as a `label` under the heading, in the skin main.ts chose.
 *
 * A game that never ends, or ends some other way, can delete this file.
 */
export const GameOver = {
    name: 'gameover',
    enter(): void {
        const W = game.screen.width, H = game.screen.height;
        game.background.color('#1a0a14');
        game.ui.label({ anchor: 'center', y: -H * 0.12, w: W - 64, h: 140, text: 'Game over', style: 'heading' });
        game.ui.button({ anchor: 'center', y: H * 0.06, h: 88, text: 'Play again', style: 'good', icon: 'restart', onClick: () => game.scenes.go('play') });
        game.ui.button({ anchor: 'center', y: H * 0.06 + 112, h: 72, text: 'Title', icon: 'home', onClick: () => game.scenes.go('title') });
        game.step('gameover', () => {
            if (game.input.keyPressed('Space') || game.input.keyPressed('Enter')) game.scenes.go('play');
        });
    },
};
