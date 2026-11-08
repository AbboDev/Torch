import { game } from '../engine.js';
import { calcPercent, readBest, run, saveBest } from '../run.js';

export const Debrief = {
    name: 'debrief',
    enter(): void {
        const W = game.screen.width, H = game.screen.height;
        game.background.gradient('#08121a', '#102234');

        const clearTime = run.time;
        const itemPercent = calcPercent();
        saveBest(clearTime, itemPercent);
        const best = readBest();

        const mins = Math.floor(clearTime / 60);
        const secs = Math.floor(clearTime % 60);
        const timeStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

        game.ui.label({ anchor: 'top', y: 50, w: W - 64, h: 60, text: 'MISSION COMPLETE', style: 'heading' });
        game.ui.label({ anchor: 'top', y: 110, w: W - 64, h: 32, text: 'TEMPLE COLLAPSE EVACUATION SUCCESSFUL', style: 'good' });

        const boxY = 170;
        game.ui.label({ anchor: 'top', y: boxY, w: 420, h: 32, text: `TOTAL CLEAR TIME: ${timeStr}`, style: 'flat' });
        game.ui.label({ anchor: 'top', y: boxY + 44, w: 420, h: 32, text: `ITEM DISCOVERY: ${itemPercent}%`, style: 'flat' });

        let suitStatus = 'OPERATIONAL';
        if (itemPercent >= 100) suitStatus = 'MAXIMUM COMBAT READINESS (100% ARSENAL)';
        else if (itemPercent >= 70) suitStatus = 'HIGHLY AUGMENTED';
        else suitStatus = 'SURVIVOR SPECIFICATION';

        game.ui.label({ anchor: 'top', y: boxY + 88, w: 500, h: 32, text: `SUIT STATUS: ${suitStatus}`, style: 'warn' });

        if (best) {
            const bMins = Math.floor(best.time / 60);
            const bSecs = Math.floor(best.time % 60);
            const bStr = `${bMins}:${bSecs < 10 ? '0' : ''}${bSecs}`;
            game.ui.label({ anchor: 'top', y: boxY + 140, w: 420, h: 32, text: `PREVIOUS RECORD: ${bStr} (${best.percent}%)`, style: 'flat' });
        }

        game.ui.button({
            anchor: 'top',
            y: boxY + 200,
            h: 72,
            text: 'Play Again',
            style: 'good',
            icon: 'restart',
            onClick: () => game.scenes.go('play')
        });

        game.ui.button({
            anchor: 'top',
            y: boxY + 280,
            h: 60,
            text: 'Return to Title',
            icon: 'home',
            onClick: () => game.scenes.go('title')
        });

        game.step('debrief', () => {
            if (game.input.keyPressed('Space') || game.input.keyPressed('Enter')) {
                game.scenes.go('title');
            }
        });
    }
};
