/* ============================================================
   Fond sous-marin en pixel art.
   Tout est dessiné dans un petit canvas (1 pixel = PX pixels écran)
   puis agrandi sans lissage : bandes d'eau tramées, rayons de lumière,
   fond de sable, algues, coraux, bulles et un petit requin.
   ============================================================ */
(function () {
    'use strict';

    var PX = 3;          // taille d'un pixel à l'écran
    var FPS = 12;        // cadence volontairement basse, façon sprite

    var canvas = document.createElement('canvas');
    canvas.className = 'ocean-bg';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.insertBefore(canvas, document.body.firstChild);
    var ctx = canvas.getContext('2d');

    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Bandes d'eau, du haut vers le bas
    var WATER = ['#0e4a6b', '#0c4160', '#0a3855', '#08304a', '#072840', '#062136', '#051b2d', '#041524', '#03101c', '#020b14'];

    // Requin : # corps, b ventre, e œil
    var SHARK = [
        '...........#..........',
        '..........##..........',
        '.........###..........',
        '#.......######........',
        '##....############....',
        '.###################..',
        '.##################e##',
        '##...#bbbbbbbbbbbbbbb#',
        '#.......bbbbbbbbbbb...',
        '..........#.....#.....'
    ];
    var FISH = ['.##.#', '#####', '.##.#'];

    // Planche des poissons (assets/fish.png) : 3 lignes (rouge, jaune, vert),
    // 4 images de nage par ligne, cases de 30x26, tournés vers la gauche.
    // « Swimming Fish » par Mepavi @ You're Perfect Studio, CC0.
    var FISH_SHEET = new Image();
    FISH_SHEET.src = document.currentScript.src.replace(/ocean\.js(\?.*)?$/, '') + 'assets/fish.png';
    var CELL_W = 30, CELL_H = 26;
    var KINDS = [
        { row: 0, speed: 0.7 },   // rouge, rapide
        { row: 1, speed: 0.3 },   // jaune, lent
        { row: 2, speed: 0.5 }    // vert
    ];

    var W, H, seabed, weeds, corals, rocks, bubbles, school, shark, swimmers, tick = 0, t = 0;

    function rand(a, b) { return a + Math.random() * (b - a); }

    function setup() {
        W = Math.ceil(window.innerWidth / PX);
        H = Math.ceil(window.innerHeight / PX);
        canvas.width = W;
        canvas.height = H;

        // Relief du fond : quelques sinus de basse fréquence
        var p1 = rand(0, 6), p2 = rand(0, 6);
        seabed = [];
        for (var x = 0; x < W; x++) {
            seabed.push(Math.round(H - 14 - Math.sin(x / 37 + p1) * 4 - Math.sin(x / 13 + p2) * 2));
        }

        weeds = [];
        for (var i = 0; i < W / 9; i++) {
            var wx = Math.floor(rand(2, W - 2));
            weeds.push({ x: wx, h: Math.floor(rand(10, 34)), ph: rand(0, 6), light: Math.random() < 0.4 });
        }

        corals = [];
        for (i = 0; i < W / 70; i++) {
            corals.push({ x: Math.floor(rand(10, W - 10)), pink: Math.random() < 0.6, h: Math.floor(rand(6, 12)) });
        }

        rocks = [];
        for (i = 0; i < W / 45; i++) {
            rocks.push({ x: Math.floor(rand(0, W)), w: Math.floor(rand(4, 10)), h: Math.floor(rand(2, 5)) });
        }

        bubbles = [];
        for (i = 0; i < W / 12; i++) bubbles.push(newBubble(true));

        school = { x: rand(0, W), y: rand(H * 0.25, H * 0.55), dir: 1, fish: [] };
        for (i = 0; i < 7; i++) school.fish.push({ dx: rand(-14, 14), dy: rand(-6, 6), ph: rand(0, 6) });

        swimmers = [];
        var count = Math.max(4, Math.round(W / 50));
        for (i = 0; i < count; i++) swimmers.push(newSwimmer(true, i % KINDS.length));

        shark = { x: -60, y: rand(H * 0.18, H * 0.4), dir: 1, wait: 0 };
    }

    function newSwimmer(anywhere, kind) {
        var k = KINDS[kind === undefined ? Math.floor(rand(0, KINDS.length)) : kind];
        var dir = Math.random() < 0.5 ? 1 : -1;
        return {
            k: k,
            dir: dir,
            x: anywhere ? rand(0, W) : (dir > 0 ? -CELL_W - rand(0, 60) : W + rand(0, 60)),
            y: rand(H * 0.12, H * 0.72),
            v: k.speed * rand(0.8, 1.2),
            ph: rand(0, 6),
            f: Math.floor(rand(0, 4))
        };
    }

    function drawSwimmers() {
        if (!FISH_SHEET.complete || !FISH_SHEET.naturalWidth) return;
        ctx.imageSmoothingEnabled = false;
        for (var i = 0; i < swimmers.length; i++) {
            var s = swimmers[i];
            s.x += s.v * s.dir;
            if (tick % 3 === 0) s.f = (s.f + 1) % 4;
            var x = Math.round(s.x), y = Math.round(s.y + Math.sin(t * 1.5 + s.ph) * 1.5);
            ctx.save();
            if (s.dir > 0) {
                // la planche regarde à gauche : miroir pour nager vers la droite
                ctx.translate(x + CELL_W, y);
                ctx.scale(-1, 1);
                ctx.drawImage(FISH_SHEET, s.f * CELL_W, s.k.row * CELL_H, CELL_W, CELL_H, 0, 0, CELL_W, CELL_H);
            } else {
                ctx.drawImage(FISH_SHEET, s.f * CELL_W, s.k.row * CELL_H, CELL_W, CELL_H, x, y, CELL_W, CELL_H);
            }
            ctx.restore();
            if ((s.dir > 0 && s.x > W + 10) || (s.dir < 0 && s.x < -CELL_W - 10)) {
                swimmers[i] = newSwimmer(false);
            }
        }
    }

    function newBubble(anywhere) {
        var colors = ['#9be8ff', '#9be8ff', '#9be8ff', '#ffb3e6', '#c9b3ff'];
        return {
            x: rand(0, W),
            y: anywhere ? rand(0, H) : H + rand(0, 20),
            r: Math.random() < 0.7 ? 1 : (Math.random() < 0.7 ? 2 : 3),
            v: rand(0.25, 0.7),
            ph: rand(0, 6),
            c: colors[Math.floor(rand(0, colors.length))]
        };
    }

    function px(x, y, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), 1, 1); }

    function drawWater() {
        var band = H / WATER.length;
        for (var i = 0; i < WATER.length; i++) {
            var y0 = Math.floor(i * band);
            ctx.fillStyle = WATER[i];
            ctx.fillRect(0, y0, W, Math.ceil(band) + 1);
            // Trame en damier à la jonction des bandes
            if (i > 0) {
                ctx.fillStyle = WATER[i - 1];
                for (var x = 0; x < W; x += 2) {
                    ctx.fillRect(x, y0, 1, 1);
                    ctx.fillRect(x + 1, y0 + 2, 1, 1);
                }
            }
        }
    }

    function drawSurface() {
        // Reflets de la surface : tirets qui ondulent
        for (var x = 0; x < W; x++) {
            var v = Math.sin(x / 6 + t * 1.6) + Math.sin(x / 2.7 - t * 2.3);
            if (v > 1.1) px(x, 1, 'rgba(190, 245, 255, 0.55)');
            if (v > 1.5) px(x, 0, 'rgba(230, 252, 255, 0.7)');
            if (v < -1.4) px(x, 3, 'rgba(160, 230, 255, 0.25)');
        }
    }

    function drawRays() {
        var rays = [0.12, 0.3, 0.55, 0.78];
        for (var r = 0; r < rays.length; r++) {
            var a = 0.035 + 0.025 * Math.sin(t * 0.5 + r * 1.7);
            ctx.fillStyle = 'rgba(200, 245, 255,' + a.toFixed(3) + ')';
            var x0 = rays[r] * W, w = 8 + r * 3;
            var len = H * 0.75;
            for (var y = 0; y < len; y += 2) {
                // le rayon s'élargit et s'efface en descendant
                if (y > len * 0.5 && (y / 2 + r) % 3 === 0) continue;
                ctx.fillRect(Math.floor(x0 + y * 0.45), y, Math.floor(w + y * 0.06), 2);
            }
        }
    }

    function drawSprite(rows, x, y, flip, colors, scale) {
        var k = scale || 1;
        x = Math.round(x); y = Math.round(y);
        for (var j = 0; j < rows.length; j++) {
            var row = rows[j];
            for (var i = 0; i < row.length; i++) {
                var ch = row[flip ? row.length - 1 - i : i];
                if (colors[ch]) { ctx.fillStyle = colors[ch]; ctx.fillRect(x + i * k, y + j * k, k, k); }
            }
        }
    }

    function drawShark() {
        if (shark.wait > 0) { shark.wait--; return; }
        shark.x += 0.35 * shark.dir;
        var y = shark.y + Math.sin(t * 0.8) * 1.5;
        drawSprite(SHARK, shark.x, y, shark.dir < 0, { '#': '#0f3b52', 'b': '#1f5a73', 'e': '#04121c' }, 2);
        if ((shark.dir > 0 && shark.x > W + 30) || (shark.dir < 0 && shark.x < -60)) {
            shark.dir *= -1;
            shark.y = rand(H * 0.15, H * 0.45);
            shark.wait = Math.floor(rand(FPS * 6, FPS * 16));
        }
    }

    function drawSchool() {
        school.x += 0.5 * school.dir;
        if (school.x > W + 30) { school.dir = -1; school.y = rand(H * 0.25, H * 0.6); }
        if (school.x < -30) { school.dir = 1; school.y = rand(H * 0.25, H * 0.6); }
        for (var i = 0; i < school.fish.length; i++) {
            var f = school.fish[i];
            drawSprite(FISH, school.x + f.dx, school.y + f.dy + Math.sin(t * 2 + f.ph), school.dir < 0,
                { '#': '#1a5c7a' });
        }
    }

    function drawSeabed() {
        for (var x = 0; x < W; x++) {
            var top = seabed[x];
            ctx.fillStyle = '#0d2b33';
            ctx.fillRect(x, top, 1, H - top);
            px(x, top, '#1d4a52');
            // grains de sable fixes (pseudo-aléatoire stable)
            for (var y = top + 2; y < H; y += 3) {
                if (((x * 7 + y * 13) % 11) === 0) px(x, y, '#174049');
            }
        }
        for (var i = 0; i < rocks.length; i++) {
            var r = rocks[i], base = seabed[Math.min(W - 1, r.x)];
            ctx.fillStyle = '#122a33';
            ctx.fillRect(r.x, base - r.h, r.w, r.h + 1);
            ctx.fillStyle = '#1e3d47';
            ctx.fillRect(r.x + 1, base - r.h, r.w - 2, 1);
        }
    }

    function drawCorals() {
        for (var i = 0; i < corals.length; i++) {
            var c = corals[i], base = seabed[c.x];
            var col = c.pink ? '#a8327f' : '#6b44b0', hi = c.pink ? '#d65aa8' : '#9473d6';
            // tronc + branches en Y
            ctx.fillStyle = col;
            ctx.fillRect(c.x, base - c.h, 1, c.h);
            ctx.fillRect(c.x - 3, base - c.h + 3, 3, 1);
            ctx.fillRect(c.x - 3, base - c.h - 1, 1, 4);
            ctx.fillRect(c.x + 1, base - c.h + 5, 3, 1);
            ctx.fillRect(c.x + 3, base - c.h + 1, 1, 4);
            px(c.x, base - c.h - 1, hi);
            px(c.x - 3, base - c.h - 2, hi);
            px(c.x + 3, base - c.h, hi);
        }
    }

    function drawWeeds() {
        for (var i = 0; i < weeds.length; i++) {
            var w = weeds[i], base = seabed[w.x];
            for (var s = 0; s < w.h; s++) {
                var off = Math.round(Math.sin(t * 1.2 + w.ph + s * 0.25) * s * 0.12);
                px(w.x + off, base - s, w.light ? '#2f7a45' : '#1c5532');
                if (s % 5 === 2) px(w.x + off + (s % 10 === 2 ? 1 : -1), base - s, '#24663b');
            }
        }
    }

    function drawBubbles() {
        for (var i = 0; i < bubbles.length; i++) {
            var b = bubbles[i];
            b.y -= b.v;
            var x = Math.round(b.x + Math.sin(t * 2 + b.ph) * 1.2), y = Math.round(b.y);
            if (b.r === 1) {
                px(x, y, b.c);
            } else {
                ctx.globalAlpha = 0.8;
                ctx.fillStyle = b.c;
                // anneau carré-arrondi façon pixel
                ctx.fillRect(x - b.r + 1, y - b.r, b.r * 2 - 1, 1);
                ctx.fillRect(x - b.r + 1, y + b.r, b.r * 2 - 1, 1);
                ctx.fillRect(x - b.r, y - b.r + 1, 1, b.r * 2 - 1);
                ctx.fillRect(x + b.r, y - b.r + 1, 1, b.r * 2 - 1);
                ctx.globalAlpha = 1;
                px(x - b.r + 1, y - b.r + 1, '#ffffff');
            }
            if (b.y < -4) bubbles[i] = newBubble(false);
        }
    }

    function frame() {
        drawWater();
        drawRays();
        drawSurface();
        drawShark();
        drawSchool();
        drawSeabed();
        drawCorals();
        drawWeeds();
        drawSwimmers();
        drawBubbles();
        tick++;
        t += 1 / FPS;
    }

    setup();
    frame();
    // La planche arrive souvent après la première image : on redessine
    FISH_SHEET.onload = frame;

    if (!reduceMotion) {
        setInterval(function () { if (!document.hidden) frame(); }, 1000 / FPS);
    }

    var resizeTimer;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () { setup(); frame(); }, 150);
    });
})();
