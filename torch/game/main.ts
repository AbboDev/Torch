import { game } from './engine.js';
import assets from './assets.json';
import { paintArt } from './art.js';
import { defineAudio } from './audio.js';
import { addDebugControls } from './debug.js';
import { Title } from './scenes/Title.js';
import { Play } from './scenes/Play.js';
import { Pause } from './scenes/Pause.js';
import { Defeat } from './scenes/Defeat.js';
import { Debrief } from './scenes/Debrief.js';

paintArt();
defineAudio();

game.ui.theme = 'candy';
await game.assets.load(assets, { pack: 'title' });

game.scenes.register(Title);
game.scenes.register(Play);
game.scenes.register(Pause);
game.scenes.register(Defeat);
game.scenes.register(Debrief);

addDebugControls();

await game.start();
game.scenes.go('title');

game.assets.load(assets, { pack: 'game' });
