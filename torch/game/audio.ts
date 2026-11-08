import { game } from './engine.js';

export function defineAudio(): void {
    game.sound.defineAll({
        // Vaelen weapon SFX
        'beam': { type: 'square', freq: 880, freqEnd: 440, sweep: 'exponential', duration: 0.08, duty: 0.25, volume: 0.35 },
        'beam-charge': { type: 'sine', freq: 220, freqEnd: 880, sweep: 'exponential', duration: 0.6, volume: 0.3 },
        'beam-charged': { type: 'sawtooth', freq: 440, freqEnd: 110, sweep: 'exponential', duration: 0.22, volume: 0.5 },
        'cryo-beam': { type: 'triangle', freq: 1200, freqEnd: 600, sweep: 'exponential', duration: 0.12, volume: 0.4 },
        'missile': { type: 'noise', duration: 0.35, filter: { type: 'lowpass', freq: 1200, freqEnd: 150 }, curve: 'exponential', volume: 0.7 },
        'missile-arm': { type: 'square', freq: 520, freqEnd: 660, sweep: 'linear', duration: 0.06, duty: 0.5, volume: 0.3 },
        'freeze': { type: 'noise', duration: 0.25, filter: { type: 'bandpass', freq: 2400, freqEnd: 800 }, volume: 0.5 },
        'morph': { type: 'square', freq: 1400, freqEnd: 900, sweep: 'exponential', duration: 0.04, duty: 0.1, volume: 0.45 },
        'unmorph': { type: 'square', freq: 900, freqEnd: 1400, sweep: 'exponential', duration: 0.04, duty: 0.1, volume: 0.45 },
        'drop-charge': { type: 'sine', freq: 980, duration: 0.05, volume: 0.3 },
        'bomb-explode': { type: 'noise', duration: 0.9, filter: { type: 'lowpass', freq: 600, freqEnd: 60 }, curve: 'exponential', volume: 0.95 },
        
        // Movement & Impact SFX
        'jump': { type: 'square', freq: 260, freqEnd: 520, sweep: 'exponential', duration: 0.1, duty: 0.3, volume: 0.3 },
        'land': { type: 'noise', duration: 0.08, filter: { type: 'lowpass', freq: 500, freqEnd: 100 }, volume: 0.25 },
        'boost': { type: 'sawtooth', freq: 180, freqEnd: 720, sweep: 'linear', duration: 0.4, volume: 0.4 },
        'hit-player': { type: 'noise', duration: 0.22, filter: { type: 'lowpass', freq: 900, freqEnd: 120 }, volume: 0.6 },
        'hit-enemy': { type: 'triangle', freq: 400, freqEnd: 150, sweep: 'exponential', duration: 0.07, volume: 0.35 },
        'kill-enemy': { type: 'noise', duration: 0.25, filter: { type: 'bandpass', freq: 1400, freqEnd: 300 }, volume: 0.5 },
        'alarm': { type: 'square', freq: 880, freqEnd: 660, sweep: 'linear', duration: 0.12, duty: 0.5, volume: 0.35 },
        
        // Pickups & Interactive
        'pickup-energy': { notes: [660, 880, 1320], duration: 0.16, type: 'triangle', volume: 0.45 },
        'pickup-missile': { notes: [440, 550, 440], duration: 0.14, type: 'square', duty: 0.25, volume: 0.4 },
        'fanfare': { notes: 'E4 G4 B4 E5:2', step: 0.12, type: 'square', volume: 0.5 },
        'door-open': { type: 'noise', duration: 0.2, filter: { type: 'bandpass', freq: 800, freqEnd: 400 }, volume: 0.35 },
        'door-bounce': { type: 'square', freq: 180, freqEnd: 120, sweep: 'linear', duration: 0.08, volume: 0.3 },
        'save': { notes: [440, 554, 659, 880], duration: 0.35, type: 'sine', volume: 0.4 },
        'crumble': { type: 'noise', duration: 0.3, filter: { type: 'lowpass', freq: 400, freqEnd: 80 }, volume: 0.3 },
        'steam': { type: 'noise', duration: 0.4, filter: { type: 'bandpass', freq: 1600, freqEnd: 1200 }, volume: 0.25 },
        'lift': { type: 'sawtooth', freq: 110, duration: 0.5, volume: 0.2 },
        
        // Boss & Stalker
        'boss-roar': { type: 'sawtooth', freq: 120, freqEnd: 55, sweep: 'linear', duration: 0.6, volume: 0.6 },
        'boss-crash': { type: 'noise', duration: 0.6, filter: { type: 'lowpass', freq: 400, freqEnd: 50 }, volume: 0.8 },
        'stalker-screech': { type: 'sawtooth', freq: 900, freqEnd: 300, sweep: 'exponential', duration: 0.45, volume: 0.7 },
        'stalker-step': { type: 'noise', duration: 0.15, filter: { type: 'lowpass', freq: 300, freqEnd: 60 }, volume: 0.4 },

        // Background Music Themes (chiptune notation)
        'theme-title': [
            { type: 'sine', tempo: 70, notes: 'E3 B3 E4 G4 B4 G4 E4 B3 - - E3 -', volume: 0.35 },
            { type: 'triangle', tempo: 70, notes: 'E2 - E2 - G2 - B2 - E2 - - -', volume: 0.3 }
        ],
        'theme-explore': [
            { type: 'triangle', tempo: 92, notes: 'E3 - G3 - A3 B3 - - E3 - D3 - E3 - - -', volume: 0.25 },
            { type: 'sine', tempo: 92, notes: 'E2 - - - C2 - - - D2 - - - B1 - - -', volume: 0.25 }
        ],
        'theme-stalker': [
            { type: 'sawtooth', freq: 65, duration: 2.0, volume: 0.25 },
            { type: 'noise', filter: { type: 'lowpass', freq: 220 }, tempo: 60, notes: 'x - x - x - x -', volume: 0.35 }
        ],
        'theme-boss': [
            { type: 'sawtooth', tempo: 135, notes: 'E3 E3 G3 E3 A3 G3 E3 B3 E3 E3 G3 E3 C4 B3 A3 G3', volume: 0.3 },
            { type: 'noise', filter: { type: 'lowpass', freq: 600 }, tempo: 135, notes: 'x - x x x - x - x - x x x - x x', volume: 0.35 }
        ],
        'theme-escape': [
            { type: 'square', duty: 0.25, tempo: 160, notes: 'A3 C4 D4 D#4 E4 D#4 D4 C4 A3 C4 D4 D#4 E4 - - -', volume: 0.35 },
            { type: 'sawtooth', tempo: 160, notes: 'A2 A2 A2 A2 F2 F2 F2 F2 G2 G2 G2 G2 E2 E2 E2 E2', volume: 0.3 }
        ]
    });
}
