import { game } from './engine.js';

export function paintArt(): void {
    // ─────────────── TILES (32x32 standard grid) ───────────────
    game.paint('tile-stone', 32, 32, ctx => {
        ctx.fillStyle = '#1a1f2e';
        ctx.fillRect(0, 0, 32, 32);
        ctx.fillStyle = '#262d42';
        ctx.fillRect(1, 1, 30, 30);
        ctx.fillStyle = '#141824';
        ctx.fillRect(4, 4, 10, 10);
        ctx.fillRect(18, 16, 10, 10);
        ctx.strokeStyle = '#0e121a';
        ctx.strokeRect(0.5, 0.5, 31, 31);
    });

    game.paint('tile-platform', 32, 12, ctx => {
        ctx.fillStyle = '#3a4a68';
        ctx.fillRect(0, 0, 32, 6);
        ctx.fillStyle = '#6580b0';
        ctx.fillRect(0, 0, 32, 2);
        ctx.fillStyle = '#1d2636';
        ctx.fillRect(2, 6, 28, 6);
    });

    game.paint('tile-sandstone', 32, 32, ctx => {
        ctx.fillStyle = '#8a6238';
        ctx.fillRect(0, 0, 32, 32);
        ctx.fillStyle = '#a67c48';
        ctx.fillRect(2, 2, 28, 28);
        ctx.strokeStyle = '#5a3d20';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(4, 4); ctx.lineTo(14, 18); ctx.lineTo(26, 12);
        ctx.moveTo(12, 18); ctx.lineTo(20, 28);
        ctx.stroke();
    });

    game.paint('tile-bone', 32, 32, ctx => {
        ctx.fillStyle = '#dcd6c8';
        ctx.fillRect(0, 0, 32, 32);
        ctx.fillStyle = '#b8af9c';
        ctx.fillRect(4, 4, 24, 24);
        ctx.fillStyle = '#5c5240';
        ctx.fillRect(10, 8, 4, 16);
        ctx.fillRect(18, 8, 4, 16);
    });

    game.paint('tile-crumble', 32, 32, ctx => {
        ctx.fillStyle = '#4a2838';
        ctx.fillRect(0, 0, 32, 32);
        ctx.fillStyle = '#7a3e5c';
        ctx.fillRect(2, 2, 28, 28);
        ctx.fillStyle = '#ff6b8b';
        ctx.fillRect(6, 6, 3, 3);
        ctx.fillRect(16, 14, 4, 4);
        ctx.fillRect(22, 8, 3, 3);
    });

    game.paint('tile-spikes', 32, 20, ctx => {
        ctx.fillStyle = '#225533';
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
            const x = i * 8;
            ctx.moveTo(x, 20);
            ctx.lineTo(x + 4, 2);
            ctx.lineTo(x + 8, 20);
        }
        ctx.fill();
        ctx.fillStyle = '#44ee77';
        for (let i = 0; i < 4; i++) {
            ctx.fillRect(i * 8 + 3, 2, 2, 4);
        }
    });

    game.paint('tile-slime', 32, 20, ctx => {
        ctx.fillStyle = '#0a6624';
        ctx.fillRect(0, 6, 32, 14);
        ctx.fillStyle = '#10ee44';
        ctx.beginPath();
        ctx.arc(6, 6, 4, 0, Math.PI * 2);
        ctx.arc(16, 4, 5, 0, Math.PI * 2);
        ctx.arc(26, 7, 3, 0, Math.PI * 2);
        ctx.fill();
    });

    game.paint('tile-ice', 32, 32, ctx => {
        ctx.fillStyle = '#4898c8';
        ctx.fillRect(0, 0, 32, 32);
        ctx.fillStyle = '#9ee8ff';
        ctx.fillRect(2, 2, 28, 6);
        ctx.fillStyle = '#6cc2ea';
        ctx.fillRect(2, 8, 28, 22);
    });

    // ─────────────── GATES ───────────────
    const drawGate = (color: string, accent: string) => (ctx: CanvasRenderingContext2D) => {
        ctx.fillStyle = '#1c2230';
        ctx.fillRect(0, 0, 16, 64);
        ctx.fillStyle = color;
        ctx.fillRect(4, 4, 8, 56);
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.arc(8, 32, 5, 0, Math.PI * 2);
        ctx.fill();
    };
    game.paint('gate-blue', 16, 64, drawGate('#00c8ff', '#ffffff'));
    game.paint('gate-red', 16, 64, drawGate('#ff2244', '#ffa0b0'));
    game.paint('gate-green', 16, 64, drawGate('#22e066', '#a0ffcc'));
    game.paint('gate-yellow', 16, 64, drawGate('#ffcc00', '#fff8a0'));
    game.paint('gate-sealed', 16, 64, drawGate('#666677', '#aa2222'));

    // Background props: duct, alcove, pillar
    game.paint('duct-overlay', 32, 32, ctx => {
        ctx.fillStyle = '#0a0d14';
        ctx.fillRect(0, 0, 32, 32);
        ctx.fillStyle = '#1c2436';
        ctx.fillRect(0, 2, 32, 4);
        ctx.fillRect(0, 26, 32, 4);
        ctx.strokeStyle = '#283652';
        for (let x = 4; x < 32; x += 8) {
            ctx.beginPath(); ctx.moveTo(x, 6); ctx.lineTo(x, 26); ctx.stroke();
        }
    });

    game.paint('alcove-bg', 32, 32, ctx => {
        ctx.fillStyle = '#080a10';
        ctx.fillRect(0, 0, 32, 32);
        ctx.fillStyle = '#121622';
        ctx.fillRect(2, 2, 28, 28);
    });

    game.paint('pillar-bg', 32, 32, ctx => {
        ctx.fillStyle = '#1e2434';
        ctx.fillRect(6, 0, 20, 32);
        ctx.fillStyle = '#2c354c';
        ctx.fillRect(9, 0, 14, 32);
    });

    // ─────────────── VAELEN (Suit & Shell) ───────────────
    game.paint('vaelen-stand', 24, 36, ctx => {
        // Suit body (biomechanical charcoal/navy)
        ctx.fillStyle = '#1c2438';
        ctx.fillRect(6, 10, 12, 16);
        // Legs
        ctx.fillStyle = '#141a29';
        ctx.fillRect(6, 26, 5, 10);
        ctx.fillRect(13, 26, 5, 10);
        // Helmet / Visor
        ctx.fillStyle = '#26334d';
        ctx.fillRect(6, 2, 12, 10);
        ctx.fillStyle = '#00f0ff'; // Glowing teal visor
        ctx.fillRect(10, 5, 8, 4);
        // Arm cannon
        ctx.fillStyle = '#3a4b6e';
        ctx.fillRect(14, 14, 8, 6);
        ctx.fillStyle = '#00f0ff';
        ctx.fillRect(20, 15, 2, 4);
    });

    game.paint('vaelen-run', 24, 36, (ctx, i) => {
        ctx.fillStyle = '#1c2438';
        ctx.fillRect(6, 9, 12, 16);
        ctx.fillStyle = '#26334d';
        ctx.fillRect(7, 2, 12, 10);
        ctx.fillStyle = '#00f0ff';
        ctx.fillRect(12, 5, 7, 4);
        ctx.fillStyle = '#3a4b6e';
        ctx.fillRect(15, 13, 8, 6);
        // Stride
        ctx.fillStyle = '#141a29';
        if (i === 0) {
            ctx.fillRect(4, 25, 6, 11);
            ctx.fillRect(14, 24, 6, 9);
        } else {
            ctx.fillRect(14, 25, 6, 11);
            ctx.fillRect(4, 24, 6, 9);
        }
    }, { frames: 2 });

    game.paint('vaelen-jump', 24, 36, ctx => {
        ctx.fillStyle = '#1c2438';
        ctx.fillRect(6, 8, 12, 16);
        ctx.fillStyle = '#26334d';
        ctx.fillRect(6, 2, 12, 10);
        ctx.fillStyle = '#00f0ff';
        ctx.fillRect(10, 4, 8, 4);
        ctx.fillStyle = '#3a4b6e';
        ctx.fillRect(14, 12, 8, 6);
        // Tucked legs
        ctx.fillStyle = '#141a29';
        ctx.fillRect(4, 24, 6, 8);
        ctx.fillRect(12, 24, 6, 8);
        // Thruster flame
        ctx.fillStyle = '#00e5ff';
        ctx.fillRect(8, 32, 6, 4);
    });

    game.paint('vaelen-crouch', 24, 24, ctx => {
        ctx.fillStyle = '#1c2438';
        ctx.fillRect(5, 8, 14, 12);
        ctx.fillStyle = '#26334d';
        ctx.fillRect(6, 2, 12, 8);
        ctx.fillStyle = '#00f0ff';
        ctx.fillRect(10, 4, 8, 3);
        ctx.fillStyle = '#3a4b6e';
        ctx.fillRect(14, 11, 8, 6);
        ctx.fillStyle = '#141a29';
        ctx.fillRect(4, 18, 16, 6);
    });

    game.paint('vaelen-shell', 18, 18, (ctx, i) => {
        ctx.fillStyle = '#141a28';
        ctx.beginPath();
        ctx.arc(9, 9, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(9, 9, 7, (i * Math.PI) / 2, (i * Math.PI) / 2 + Math.PI * 1.5);
        ctx.stroke();
        ctx.fillStyle = '#00f0ff';
        ctx.fillRect(8, 8, 2, 2);
    }, { frames: 2 });

    game.paint('vaelen-aim-up', 24, 38, ctx => {
        ctx.fillStyle = '#1c2438';
        ctx.fillRect(6, 12, 12, 16);
        ctx.fillStyle = '#26334d';
        ctx.fillRect(6, 4, 12, 10);
        ctx.fillStyle = '#00f0ff';
        ctx.fillRect(8, 5, 8, 4);
        ctx.fillStyle = '#141a29';
        ctx.fillRect(6, 28, 5, 10);
        ctx.fillRect(13, 28, 5, 10);
        // Cannon pointing up
        ctx.fillStyle = '#3a4b6e';
        ctx.fillRect(11, 0, 6, 12);
        ctx.fillStyle = '#00f0ff';
        ctx.fillRect(12, 0, 4, 2);
    });

    game.paint('vaelen-aim-diag', 26, 36, ctx => {
        ctx.fillStyle = '#1c2438';
        ctx.fillRect(5, 10, 12, 16);
        ctx.fillStyle = '#26334d';
        ctx.fillRect(5, 2, 12, 10);
        ctx.fillStyle = '#00f0ff';
        ctx.fillRect(8, 4, 8, 4);
        ctx.fillStyle = '#141a29';
        ctx.fillRect(5, 26, 5, 10);
        ctx.fillRect(12, 26, 5, 10);
        // Diagonal cannon
        ctx.fillStyle = '#3a4b6e';
        ctx.save();
        ctx.translate(14, 10);
        ctx.rotate(-Math.PI / 4);
        ctx.fillRect(0, -3, 10, 6);
        ctx.fillStyle = '#00f0ff';
        ctx.fillRect(8, -2, 2, 4);
        ctx.restore();
    });

    // ─────────────── PROJECTILES & WEAPONS ───────────────
    game.paint('bolt-beam', 14, 6, ctx => {
        ctx.fillStyle = '#00f0ff';
        ctx.fillRect(0, 1, 14, 4);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(2, 2, 10, 2);
    });

    game.paint('bolt-charged', 22, 12, ctx => {
        ctx.fillStyle = '#00e5ff';
        ctx.beginPath();
        ctx.arc(11, 6, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(11, 6, 3, 0, Math.PI * 2);
        ctx.fill();
    });

    game.paint('bolt-cryo', 16, 8, ctx => {
        ctx.fillStyle = '#80e5ff';
        ctx.fillRect(0, 1, 16, 6);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(3, 2, 10, 4);
    });

    game.paint('rocket-missile', 18, 8, ctx => {
        ctx.fillStyle = '#ff2255';
        ctx.beginPath();
        ctx.moveTo(18, 4); ctx.lineTo(6, 0); ctx.lineTo(2, 4); ctx.lineTo(6, 8);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ffdd44';
        ctx.fillRect(0, 2, 4, 4);
    });

    game.paint('shell-charge', 12, 12, ctx => {
        ctx.fillStyle = '#00ffff';
        ctx.beginPath();
        ctx.arc(6, 6, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(5, 5, 2, 2);
    });

    game.paint('power-bomb', 18, 18, ctx => {
        ctx.fillStyle = '#ffb700';
        ctx.beginPath();
        ctx.arc(9, 9, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(9, 9, 4, 0, Math.PI * 2);
        ctx.fill();
    });

    game.paint('spore-orb', 10, 10, ctx => {
        ctx.fillStyle = '#22ee66';
        ctx.beginPath();
        ctx.arc(5, 5, 4, 0, Math.PI * 2);
        ctx.fill();
    });

    game.paint('stalker-blast', 14, 14, ctx => {
        ctx.fillStyle = '#aaeeff';
        ctx.beginPath();
        ctx.arc(7, 7, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(5, 5, 4, 4);
    });

    game.paint('boss-wave', 24, 16, ctx => {
        ctx.fillStyle = '#ff3344';
        ctx.beginPath();
        ctx.arc(12, 8, 7, 0, Math.PI * 2);
        ctx.fill();
    });

    // ─────────────── PICKUPS & RELICS ───────────────
    game.paint('pickup-energy', 14, 14, ctx => {
        ctx.fillStyle = '#ffb700';
        ctx.beginPath();
        ctx.arc(7, 7, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff4a0';
        ctx.beginPath();
        ctx.arc(7, 7, 3, 0, Math.PI * 2);
        ctx.fill();
    });

    game.paint('pickup-missile', 12, 16, ctx => {
        ctx.fillStyle = '#ff2255';
        ctx.fillRect(2, 2, 8, 12);
        ctx.fillStyle = '#ffa0b0';
        ctx.fillRect(4, 4, 4, 8);
    });

    game.paint('pedestal', 24, 20, ctx => {
        ctx.fillStyle = '#2c3548';
        ctx.fillRect(0, 12, 24, 8);
        ctx.fillStyle = '#455573';
        ctx.fillRect(4, 4, 16, 8);
        ctx.fillStyle = '#00f0ff';
        ctx.fillRect(10, 2, 4, 2);
    });

    game.paint('tank-pod', 24, 28, ctx => {
        ctx.fillStyle = '#c89a20';
        ctx.fillRect(2, 2, 20, 24);
        ctx.fillStyle = '#ffea60';
        ctx.fillRect(6, 6, 12, 16);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(9, 10, 6, 8);
    });

    game.paint('reserve-canister', 18, 24, ctx => {
        ctx.fillStyle = '#b01830';
        ctx.fillRect(2, 2, 14, 20);
        ctx.fillStyle = '#ff5070';
        ctx.fillRect(5, 5, 8, 14);
    });

    game.paint('sanctuary-dais', 64, 16, ctx => {
        ctx.fillStyle = '#182436';
        ctx.fillRect(0, 6, 64, 10);
        ctx.fillStyle = '#2a3d5c';
        ctx.fillRect(8, 2, 48, 6);
        ctx.fillStyle = '#00ffff';
        ctx.fillRect(20, 0, 24, 2);
    });

    game.paint('terminal', 28, 36, ctx => {
        ctx.fillStyle = '#1e283c';
        ctx.fillRect(4, 16, 20, 20);
        ctx.fillStyle = '#00e5ff';
        ctx.fillRect(2, 2, 24, 14);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(6, 6, 16, 6);
    });

    game.paint('lift-pad', 48, 12, ctx => {
        ctx.fillStyle = '#3a4860';
        ctx.fillRect(0, 4, 48, 8);
        ctx.fillStyle = '#ffea00';
        ctx.fillRect(4, 2, 40, 2);
    });

    game.paint('shuttle', 110, 64, ctx => {
        ctx.fillStyle = '#2a3348';
        ctx.beginPath();
        ctx.moveTo(110, 40); ctx.lineTo(80, 10); ctx.lineTo(20, 10);
        ctx.lineTo(0, 30); ctx.lineTo(0, 54); ctx.lineTo(110, 54);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#00f0ff'; // Cockpit glass
        ctx.fillRect(65, 16, 24, 10);
        ctx.fillStyle = '#ff5522'; // Thrusters
        ctx.fillRect(0, 34, 10, 16);
    });

    game.paint('icicle', 16, 24, ctx => {
        ctx.fillStyle = '#9fe8ff';
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(16, 0); ctx.lineTo(8, 24);
        ctx.closePath();
        ctx.fill();
    });

    game.paint('steam-vent', 16, 16, ctx => {
        ctx.fillStyle = '#445566';
        ctx.fillRect(0, 0, 16, 16);
        ctx.fillStyle = '#223344';
        ctx.fillRect(4, 4, 8, 8);
    });

    // ─────────────── CREATURES ───────────────
    // 1. Tendril Crawler
    game.paint('crawler', 30, 16, (ctx, i) => {
        ctx.fillStyle = '#3a6624';
        ctx.beginPath();
        ctx.ellipse(15, 8, 14, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffdd00'; // Eyes
        ctx.fillRect(22, 5, 3, 3);
        ctx.fillStyle = '#1d3312'; // Legs
        const offset = i === 0 ? 0 : 2;
        for (let x = 6; x <= 22; x += 6) {
            ctx.fillRect(x + offset, 12, 2, 4);
        }
    }, { frames: 2 });

    // 2. Polyp Spitter
    game.paint('spitter', 28, 28, ctx => {
        ctx.fillStyle = '#6a284c';
        ctx.beginPath();
        ctx.arc(14, 18, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#10ee55'; // Pulsing maw
        ctx.beginPath();
        ctx.arc(14, 10, 6, 0, Math.PI * 2);
        ctx.fill();
    });

    // 3. Spore Drifter
    game.paint('drifter', 26, 26, (ctx, i) => {
        ctx.fillStyle = 'rgba(100, 240, 180, 0.7)';
        ctx.beginPath();
        ctx.arc(13, 10, 10, Math.PI, 0);
        ctx.fill();
        ctx.strokeStyle = '#64f0b4';
        ctx.lineWidth = 2;
        const wiggle = i === 0 ? -1 : 1;
        ctx.beginPath();
        ctx.moveTo(8, 10); ctx.lineTo(8 + wiggle, 24);
        ctx.moveTo(13, 10); ctx.lineTo(13 - wiggle, 25);
        ctx.moveTo(18, 10); ctx.lineTo(18 + wiggle, 24);
        ctx.stroke();
    }, { frames: 2 });

    game.paint('drifter-frozen', 28, 28, ctx => {
        ctx.fillStyle = 'rgba(160, 230, 255, 0.9)';
        ctx.fillRect(0, 0, 28, 28);
        ctx.strokeStyle = '#ffffff';
        ctx.strokeRect(1, 1, 26, 26);
    });

    // 4. Chitinous Leaper
    game.paint('leaper', 30, 30, (ctx, i) => {
        ctx.fillStyle = '#a69070';
        ctx.fillRect(8, 8, 14, 14);
        ctx.fillStyle = '#3a2e1d';
        ctx.fillRect(10, 4, 10, 6);
        ctx.fillStyle = '#d03040'; // Eyes
        ctx.fillRect(16, 5, 2, 2);
        // Mantis blades
        ctx.strokeStyle = '#c4b295';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(18, 14); ctx.lineTo(26, i === 0 ? 10 : 16); ctx.lineTo(24, 24);
        ctx.stroke();
    }, { frames: 2 });

    // 5. Siphon Swarm
    game.paint('swarm', 18, 18, (ctx, i) => {
        ctx.fillStyle = '#8a2be2'; // Violet wings
        ctx.beginPath();
        const wing = i === 0 ? 2 : 6;
        ctx.moveTo(9, 9); ctx.lineTo(2, wing); ctx.lineTo(9, 14);
        ctx.moveTo(9, 9); ctx.lineTo(16, wing); ctx.lineTo(9, 14);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(8, 8, 2, 4);
    }, { frames: 2 });

    // ─────────────── GUARDIANS & STALKER ───────────────
    // Shadow Stalker
    game.paint('stalker', 32, 48, ctx => {
        ctx.fillStyle = '#101216'; // Iridescent charcoal
        ctx.fillRect(8, 12, 16, 22);
        ctx.fillStyle = '#08090c';
        ctx.fillRect(8, 34, 7, 14);
        ctx.fillRect(17, 34, 7, 14);
        ctx.fillStyle = '#181b22';
        ctx.fillRect(8, 2, 16, 12);
        ctx.fillStyle = '#ff0033'; // Crimson optics
        ctx.fillRect(16, 6, 8, 4);
        ctx.fillStyle = '#ff2255';
        ctx.fillRect(20, 20, 10, 8); // Heavy cannon
    });

    // Boss 1: Gorgon Broodmother (closed petals)
    game.paint('boss-broodmother', 72, 64, ctx => {
        ctx.fillStyle = '#1c4420'; // Armored petals
        ctx.beginPath();
        ctx.arc(36, 32, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#32773b';
        ctx.fillRect(16, 16, 40, 32);
    });

    // Boss 1: Gorgon Broodmother (open bulb)
    game.paint('boss-broodmother-open', 72, 64, ctx => {
        ctx.fillStyle = '#1c4420';
        ctx.fillRect(4, 4, 20, 56);
        ctx.fillRect(48, 4, 20, 56);
        ctx.fillStyle = '#ffdd00'; // Glowing vulnerable bulb!
        ctx.beginPath();
        ctx.arc(36, 32, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(36, 32, 8, 0, Math.PI * 2);
        ctx.fill();
    });

    // Boss 2: Cryo-Goliath
    game.paint('boss-goliath', 80, 56, ctx => {
        ctx.fillStyle = '#457b9d'; // Frozen body
        ctx.fillRect(16, 12, 54, 30);
        ctx.fillStyle = '#1d3557';
        ctx.fillRect(16, 42, 12, 14);
        ctx.fillRect(48, 42, 12, 14);
        ctx.fillStyle = '#e0f4ff'; // Tusks
        ctx.beginPath();
        ctx.moveTo(68, 24); ctx.lineTo(80, 18); ctx.lineTo(70, 32);
        ctx.fill();
        ctx.fillStyle = '#ff3300'; // Rear exhaust weakpoint!
        ctx.fillRect(6, 20, 10, 12);
    });

    // Boss 3: Torment Core
    game.paint('boss-core', 56, 56, ctx => {
        ctx.fillStyle = '#22283a';
        ctx.beginPath();
        ctx.arc(28, 28, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#00e5ff'; // Central core
        ctx.beginPath();
        ctx.arc(28, 28, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffb700'; // Cooling conduit
        ctx.fillRect(24, 2, 8, 10);
        ctx.fillRect(24, 44, 8, 10);
    });

    // Boss 4: Apex Metamorph
    game.paint('boss-apex', 70, 90, ctx => {
        ctx.fillStyle = '#2a1130';
        ctx.beginPath();
        ctx.ellipse(35, 45, 30, 40, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#8a2be2';
        ctx.fillRect(20, 25, 30, 40);
        ctx.fillStyle = '#ff0055'; // Multiple cosmic eyes
        ctx.fillRect(26, 30, 6, 6);
        ctx.fillRect(38, 30, 6, 6);
        ctx.fillRect(32, 44, 8, 8);
    });
}
