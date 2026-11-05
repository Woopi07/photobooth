/* Designed 2×6 strips: original artwork drawn on canvas.
 * Each design has its own slot arrangement (with per-slot shapes),
 * illustration panels ("decos"), background and caption style.
 * app.js calls window.SNAPBOOTH_DESIGNS(helpers) to get the list. */
window.SNAPBOOTH_DESIGNS = function (H) {
  'use strict';
  const { fill, rr, dots, stripes, starPath, heartPath, sprinkle, rng, fonts } = H;
  const TAU = Math.PI * 2;

  /* ---------- tiny drawing kit ---------- */
  function circle(c, x, y, r, color) { c.fillStyle = color; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }
  function ellipse(c, x, y, rx, ry, rot, color) { c.fillStyle = color; c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, TAU); c.fill(); }
  function eye(c, x, y, r) {
    circle(c, x, y, r, '#2a1d1a');
    circle(c, x - r * 0.3, y - r * 0.35, r * 0.36, '#fff');
    circle(c, x + r * 0.35, y + r * 0.32, r * 0.15, '#fff');
  }
  function blush(c, x, y, r) { ellipse(c, x, y, r, r * 0.6, 0, 'rgba(255,110,140,0.45)'); }
  function smile(c, x, y, r, color = '#2a1d1a') {
    c.strokeStyle = color; c.lineWidth = Math.max(3, r * 0.4); c.lineCap = 'round';
    c.beginPath(); c.arc(x, y - r * 0.4, r, 0.2 * Math.PI, 0.8 * Math.PI); c.stroke();
  }
  /** a cute face centred on (cx, cy); s = face width */
  function face(c, cx, cy, s, opts = {}) {
    const er = s * (opts.eye || 0.12);
    eye(c, cx - s * 0.36, cy, er);
    eye(c, cx + s * 0.36, cy, er);
    blush(c, cx - s * 0.56, cy + s * 0.2, s * 0.12);
    blush(c, cx + s * 0.56, cy + s * 0.2, s * 0.12);
    smile(c, cx, cy + s * 0.18, s * 0.09, opts.mouth);
  }
  function flower(c, x, y, r, petal, center) {
    c.fillStyle = petal;
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * TAU - Math.PI / 2;
      c.beginPath(); c.arc(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, r * 0.45, 0, TAU); c.fill();
    }
    circle(c, x, y, r * 0.3, center);
  }
  function scatterFlowers(c, W, Ht, seed, count, petals, minR, maxR) {
    const R = rng(seed);
    for (let i = 0; i < count; i++) flower(c, R() * W, R() * Ht, minR + R() * (maxR - minR), petals[i % petals.length], '#fff6c8');
  }
  function clipPanel(c, x, y, w, h, r = 0.08) { rr(c, x, y, w, h, Math.min(w, h) * r); c.clip(); }

  /* ---------- illustration panels ---------- */
  const DECO = {
    bear(c, x, y, w, h) {
      clipPanel(c, x, y, w, h);
      const cx = x + w / 2, r = w * 0.36, cy = y + h * 0.68;
      for (const s of [-1, 1]) {
        circle(c, cx + s * r * 0.78, cy - r * 0.74, r * 0.32, '#c98b5e');
        circle(c, cx + s * r * 0.78, cy - r * 0.74, r * 0.17, '#eab38f');
      }
      ellipse(c, cx, cy, r, r * 0.92, 0, '#c98b5e');
      ellipse(c, cx, cy + r * 0.32, r * 0.38, r * 0.27, 0, '#f4dcc4');
      ellipse(c, cx, cy + r * 0.2, r * 0.11, r * 0.08, 0, '#3a2620');
      eye(c, cx - r * 0.42, cy - r * 0.12, r * 0.12);
      eye(c, cx + r * 0.42, cy - r * 0.12, r * 0.12);
      blush(c, cx - r * 0.64, cy + r * 0.1, r * 0.13);
      blush(c, cx + r * 0.64, cy + r * 0.1, r * 0.13);
      c.strokeStyle = '#3a2620'; c.lineWidth = 5; c.lineCap = 'round';
      c.beginPath(); c.arc(cx - r * 0.08, cy + r * 0.3, r * 0.08, 0.1 * Math.PI, 0.9 * Math.PI); c.stroke();
      c.beginPath(); c.arc(cx + r * 0.08, cy + r * 0.3, r * 0.08, 0.1 * Math.PI, 0.9 * Math.PI); c.stroke();
      flower(c, cx + r * 1.05, cy - r * 1.0, r * 0.22, '#ff9ec0', '#ffe27a');
    },

    strawberryHeart(c, x, y, w, h) {
      clipPanel(c, x, y, w, h);
      fill(c, 10000, 10000, '#fffdf4');
      c.fillStyle = '#ffd3df'; dotsIn(c, x, y, w, h, 30, 4, '#ffd3df');
      const hx = x + w * 0.2, hy = y + h * 0.1, hw = w * 0.6, hh = h * 0.82;
      heartPath(c, hx, hy, hw, hh); c.fillStyle = '#ffe3eb'; c.fill();
      c.lineWidth = 16; c.strokeStyle = '#ff6f9a'; c.stroke();
      const sx = x + w / 2, sy = y + h * 0.48, sw = w * 0.2, sh = h * 0.46;
      c.beginPath();
      c.moveTo(sx, sy + sh * 0.5);
      c.bezierCurveTo(sx - sw * 1.1, sy + sh * 0.1, sx - sw * 0.9, sy - sh * 0.45, sx, sy - sh * 0.36);
      c.bezierCurveTo(sx + sw * 0.9, sy - sh * 0.45, sx + sw * 1.1, sy + sh * 0.1, sx, sy + sh * 0.5);
      c.fillStyle = '#ef3e5c'; c.fill();
      const R = rng(4);
      for (let i = 0; i < 12; i++) ellipse(c, sx + (R() - 0.5) * sw * 1.3, sy - sh * 0.15 + R() * sh * 0.55, 3, 5, 0, '#ffe17a');
      c.fillStyle = '#5bb04a'; starPath(c, sx, sy - sh * 0.38, sw * 0.5, 0.5, 6); c.fill();
      face(c, sx, sy, sw * 1.1);
    },

    croissant(c, x, y, w, h) {
      const cx = x + w / 2, cy0 = y + h * 0.9, R = h * 0.46;
      const segs = [-2, 2, -1, 1, 0];
      for (const i of segs) {
        const a = (-90 + i * 30) * Math.PI / 180;
        const px = cx + Math.cos(a) * R, py = cy0 + Math.sin(a) * R;
        const rx = w * (0.17 - 0.03 * Math.abs(i)), ry = rx * 1.2;
        c.beginPath(); c.ellipse(px, py, rx, ry, a + Math.PI / 2, 0, TAU);
        c.fillStyle = Math.abs(i) === 2 ? '#d98d38' : '#eaa64d'; c.fill();
        c.lineWidth = 5; c.strokeStyle = '#a9651f'; c.stroke();
      }
      face(c, cx, cy0 - R + 6, w * 0.22, { mouth: '#5a2e0c' });
      c.font = fonts.bebas(44);
      const label = 'BUTTER', tw = c.measureText(label).width;
      c.save(); c.translate(x + w - tw / 2 - 40, y + 50); c.rotate(0.08);
      rr(c, -tw / 2 - 18, -28, tw + 36, 56, 28); c.fillStyle = '#fff'; c.fill();
      c.lineWidth = 4; c.strokeStyle = '#3a5aa8'; c.stroke();
      c.fillStyle = '#3a5aa8'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(label, 0, 2);
      c.restore();
      c.fillStyle = '#ffd04a'; starPath(c, x + 60, y + 70, 26); c.fill();
      c.fillStyle = '#8fc7ff'; starPath(c, x + w - 70, y + h - 60, 20); c.fill();
    },

    blackCat(c, x, y, w, h) {
      clipPanel(c, x, y, w, h);
      fill(c, 10000, 10000, '#ffffff');
      // diagonal stripes
      c.save(); c.translate(x, y); c.rotate(-0.6); c.fillStyle = '#ece6f3';
      for (let k = -w; k < w * 2; k += 40) c.fillRect(k, -h, 20, h * 4);
      c.restore();
      const cx = x + w / 2, r = w * 0.32, cy = y + h * 0.72;
      for (const s of [-1, 1]) {
        c.beginPath(); c.moveTo(cx + s * r * 0.95, cy - r * 0.2); c.lineTo(cx + s * r * 0.75, cy - r * 1.25); c.lineTo(cx + s * r * 0.2, cy - r * 0.72); c.closePath();
        c.fillStyle = '#1e1a24'; c.fill();
        c.beginPath(); c.moveTo(cx + s * r * 0.8, cy - r * 0.45); c.lineTo(cx + s * r * 0.72, cy - r * 1.02); c.lineTo(cx + s * r * 0.38, cy - r * 0.72); c.closePath();
        c.fillStyle = '#f4a6c0'; c.fill();
      }
      ellipse(c, cx, cy, r * 1.05, r * 0.9, 0, '#1e1a24');
      for (const s of [-1, 1]) {
        ellipse(c, cx + s * r * 0.42, cy - r * 0.08, r * 0.2, r * 0.24, 0, '#c8e86b');
        ellipse(c, cx + s * r * 0.42, cy - r * 0.08, r * 0.07, r * 0.2, 0, '#1e1a24');
        circle(c, cx + s * r * 0.42 - r * 0.07, cy - r * 0.18, r * 0.05, '#fff');
        c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 3;
        for (const dy of [-0.05, 0.08]) {
          c.beginPath(); c.moveTo(cx + s * r * 0.55, cy + r * (0.22 + dy)); c.lineTo(cx + s * r * 1.25, cy + r * (0.15 + dy * 2)); c.stroke();
        }
      }
      c.beginPath(); c.moveTo(cx - r * 0.08, cy + r * 0.12); c.lineTo(cx + r * 0.08, cy + r * 0.12); c.lineTo(cx, cy + r * 0.22); c.closePath();
      c.fillStyle = '#f4a6c0'; c.fill();
      blush(c, cx - r * 0.62, cy + r * 0.2, r * 0.12); blush(c, cx + r * 0.62, cy + r * 0.2, r * 0.12);
      // bow
      const bx = cx + r * 0.62, by = cy - r * 0.92;
      for (const s of [-1, 1]) {
        c.beginPath(); c.moveTo(bx, by); c.lineTo(bx + s * r * 0.4, by - r * 0.22); c.lineTo(bx + s * r * 0.4, by + r * 0.22); c.closePath();
        c.fillStyle = '#e86a92'; c.fill();
      }
      circle(c, bx, by, r * 0.1, '#c94a74');
    },

    milkCarton(c, x, y, w, h) {
      c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
      fill(c, 10000, 10000, '#f9dbe4');
      const R = rng(8);
      for (let i = 0; i < 14; i++) { heartPath(c, x + R() * w, y + R() * h, 26, 22); c.fillStyle = 'rgba(255,255,255,0.8)'; c.fill(); }
      const bw = w * 0.4, bh = h * 0.42, bx = x + (w - bw) / 2, by = y + h * 0.26;
      c.beginPath(); c.moveTo(bx, by); c.lineTo(bx + bw * 0.5, by - bh * 0.3); c.lineTo(bx + bw, by); c.closePath();
      c.fillStyle = '#ffb3c8'; c.fill(); c.lineWidth = 6; c.strokeStyle = '#e07fa0'; c.stroke();
      c.fillStyle = '#e07fa0'; c.fillRect(bx + bw * 0.4, by - bh * 0.4, bw * 0.2, bh * 0.14);
      rr(c, bx, by, bw, bh, 18); c.fillStyle = '#fff'; c.fill(); c.stroke();
      face(c, bx + bw / 2, by + bh * 0.42, bw * 0.55);
      c.font = fonts.lilita(40); c.fillStyle = '#e07fa0'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('MILK', bx + bw / 2, by + bh * 0.8);
      c.restore();
    },

    bunny(c, x, y, w, h) {
      clipPanel(c, x, y, w, h);
      fill(c, 10000, 10000, '#f7c6d3');
      dotsIn(c, x, y, w, h, 36, 4, 'rgba(255,255,255,0.7)');
      const cx = x + w / 2, r = w * 0.3, cy = y + h * 0.82;
      for (const s of [-1, 1]) {
        ellipse(c, cx + s * r * 0.45, cy - r * 1.25, r * 0.22, r * 0.62, s * 0.18, '#ffffff');
        ellipse(c, cx + s * r * 0.45, cy - r * 1.2, r * 0.1, r * 0.45, s * 0.18, '#ffb3c8');
      }
      ellipse(c, cx, cy, r, r * 0.85, 0, '#ffffff');
      face(c, cx, cy - r * 0.1, r * 1.1);
      flower(c, cx - r * 0.75, cy - r * 0.75, r * 0.2, '#ffd34d', '#ff8fb1');
    },

    cherries(c, x, y, w, h) {
      const cx = x + w / 2, r = w * 0.15, cyL = y + h * 0.56, cyR = y + h * 0.52;
      c.strokeStyle = '#4b8a2e'; c.lineWidth = 10; c.lineCap = 'round';
      c.beginPath(); c.moveTo(cx - r * 1.1, cyL - r * 0.9); c.quadraticCurveTo(cx - r * 0.6, y + h * 0.25, cx + r * 0.1, y + h * 0.14); c.stroke();
      c.beginPath(); c.moveTo(cx + r * 1.1, cyR - r * 0.9); c.quadraticCurveTo(cx + r * 0.6, y + h * 0.25, cx + r * 0.1, y + h * 0.14); c.stroke();
      ellipse(c, cx + r * 0.7, y + h * 0.13, r * 0.6, r * 0.25, -0.4, '#6cc04a');
      for (const [px, py] of [[cx - r * 1.1, cyL], [cx + r * 1.1, cyR]]) {
        c.beginPath(); c.arc(px, py, r, 0, TAU); c.fillStyle = '#e8263f'; c.fill();
        c.lineWidth = 6; c.strokeStyle = '#5e0d16'; c.stroke();
        ellipse(c, px - r * 0.45, py - r * 0.45, r * 0.18, r * 0.1, -0.7, 'rgba(255,255,255,0.85)');
        face(c, px, py + r * 0.05, r * 1.05);
      }
    },

    sleepyMoon(c, x, y, w, h) {
      const cx = x + w * 0.46, cy = y + h * 0.45, r = h * 0.3;
      circle(c, cx, cy, r, '#ffe08a');
      circle(c, cx + r * 0.5, cy - r * 0.22, r * 0.85, '#141414');
      // sleepy eye + blush on the crescent
      c.strokeStyle = '#5a3d10'; c.lineWidth = 6; c.lineCap = 'round';
      c.beginPath(); c.arc(cx - r * 0.55, cy + r * 0.05, r * 0.14, 0.1 * Math.PI, 0.9 * Math.PI); c.stroke();
      blush(c, cx - r * 0.55, cy + r * 0.38, r * 0.12);
      c.beginPath(); c.arc(cx - r * 0.28, cy + r * 0.55, r * 0.1, 0.1 * Math.PI, 0.9 * Math.PI); c.stroke();
      c.font = fonts.fredoka(42); c.fillStyle = '#f7b6cf'; c.textAlign = 'center';
      c.fillText('z', cx + r * 0.85, cy - r * 0.55); c.font = fonts.fredoka(30); c.fillText('z', cx + r * 1.2, cy - r * 0.95);
      c.save(); c.translate(x, y); sprinkle(c, w, h, ['#ffe08a', '#f7b6cf'], 9, 13, 8, 16); c.restore();
    },
  };
  function dotsIn(c, x, y, w, h, gap, r, color) {
    c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); c.translate(x, y); dots(c, w, h, color, gap, r); c.restore();
  }

  /* ---------- the 8 designed strips (600 × 1800) ---------- */
  const W = 600, Ht = 1800;
  const D = [];

  D.push({
    id: 'S1', name: 'Periwinkle Butter',
    slots: [[40, 40, 520, 316], [40, 376, 520, 316], [40, 1048, 520, 316], [40, 1384, 520, 316]],
    decos: [{ kind: 'bear', r: [40, 712, 520, 316], frame: true }],
    text: [40, 1708, 520, 76],
    theme: {
      bg: (c) => {
        fill(c, W, Ht, '#fff4b8');
        c.fillStyle = '#bfc8f4'; c.fillRect(0, 0, W, 870);
        dots(c, W, Ht, 'rgba(255,255,255,0.55)', 50, 4);
        c.fillStyle = '#222'; starPath(c, 34, 300, 26); c.fill();
      },
      shape: 'rounded', border: { color: '#ffffff', w: 10 }, text: '#6b78c9', font: fonts.pacifico, sub: fonts.fredoka, empty: '#eef0ff',
    },
  });

  D.push({
    id: 'S2', name: 'Lemon Blossom',
    slots: [[40, 440, 520, 380, 'heart'], [40, 840, 520, 380, 'rounded'], [40, 1240, 520, 380, 'rounded']],
    decos: [{ kind: 'strawberryHeart', r: [40, 40, 520, 380], frame: true }],
    text: [40, 1636, 520, 140],
    theme: {
      bg: (c) => { fill(c, W, Ht, '#fff1a1'); scatterFlowers(c, W, Ht, 31, 34, ['#ffb3c8', '#ffffff', '#ff8fb1'], 18, 34); },
      border: { color: '#ffffff', w: 12 }, text: '#e0578f', font: fonts.pacifico, sub: fonts.fredoka, panel: 'rgba(255,255,255,0.85)', empty: '#fff8d6',
    },
  });

  D.push({
    id: 'S3', name: 'Butter Bakery',
    slots: [[40, 50, 520, 420, 'heart'], [40, 490, 520, 350, 'rounded'], [40, 860, 520, 350, 'rounded']],
    decos: [{ kind: 'croissant', r: [40, 1225, 520, 470] }],
    text: [40, 1695, 520, 90],
    theme: {
      bg: (c) => { stripes(c, W, Ht, '#fffaf0', '#fff0c2', 26); },
      border: { color: '#ffffff', w: 12 }, text: '#b8742a', font: fonts.pacifico, sub: fonts.fredoka, empty: '#fff3d1',
    },
  });

  D.push({
    id: 'S4', name: 'Lilac Lace',
    slots: [[40, 90, 520, 340, 'rounded'], [40, 770, 520, 360, 'cloud'], [40, 1150, 520, 360, 'rounded']],
    decos: [{ kind: 'blackCat', r: [40, 450, 520, 300], frame: true }],
    text: [40, 1528, 520, 180],
    theme: {
      bg: (c) => {
        fill(c, W, Ht, '#fbf3ff');
        dotsIn(c, 0, 760, W, 980, 34, 3.5, '#3b2e4a');
        for (const edge of ['top', 'bottom']) {
          const y0 = edge === 'top' ? 0 : Ht - 44;
          c.fillStyle = '#5b4870'; c.fillRect(0, y0, W, 44);
          const sy = edge === 'top' ? 44 : Ht - 44;
          for (let x = 15; x < W + 15; x += 30) { c.beginPath(); c.arc(x, sy, 15, 0, TAU); c.fill(); }
          for (let x = 15; x < W; x += 30) { c.fillStyle = '#fff'; c.beginPath(); c.arc(x, y0 + 22, 3, 0, TAU); c.fill(); c.fillStyle = '#5b4870'; }
        }
      },
      border: { color: '#ffffff', w: 12 }, text: '#5b4870', font: fonts.pacifico, sub: fonts.fredoka, panel: 'rgba(255,255,255,0.92)', empty: '#efe6f7',
    },
  });

  D.push({
    id: 'S5', name: 'Moo Pink',
    slots: [[60, 120, 480, 370], [60, 510, 480, 370], [60, 900, 480, 370]],
    decos: [{ kind: 'milkCarton', r: [0, 1310, 600, 490] }],
    text: [40, 1700, 520, 86],
    theme: {
      bg: (c) => {
        fill(c, W, Ht, '#f7e9ee');
        c.save(); c.beginPath(); c.rect(0, 0, W, 90); c.clip(); fill(c, W, 90, '#fff');
        { const R = rng(3); c.fillStyle = '#1d1d1d'; for (let i = 0; i < 9; i++) { const x = i * 70 + R() * 30, y = R() * 90, r = 18 + R() * 16; c.beginPath(); c.ellipse(x, y, r * 1.3, r, R() * 3, 0, TAU); c.fill(); c.beginPath(); c.ellipse(x + r * 0.7, y + r * 0.4, r * 0.7, r * 0.6, 0, 0, TAU); c.fill(); } }
        c.restore();
        c.fillStyle = '#cf8fa6'; c.fillRect(36, 96, 528, 1198);
      },
      border: { color: '#f2d3de', w: 8 }, text: '#c65f86', font: fonts.pacifico, sub: fonts.fredoka, panel: 'rgba(255,255,255,0.9)', empty: '#e8f3ee',
    },
  });

  D.push({
    id: 'S6', name: 'Dotty Noir',
    slots: [[60, 50, 480, 330], [60, 400, 480, 330], [60, 1070, 480, 330], [60, 1420, 480, 300]],
    decos: [{ kind: 'bunny', r: [60, 750, 480, 300] }],
    text: [60, 1726, 480, 66],
    theme: {
      bg: (c) => {
        fill(c, W, Ht, '#121212');
        for (const [x, y, r] of [[W, 0, 150], [0, Ht, 170], [W, Ht * 0.55, 90]]) { c.fillStyle = '#d99aab'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }
        c.fillStyle = '#fff';
        for (let y = 30; y < Ht; y += 52) { c.beginPath(); c.arc(28, y, 9, 0, TAU); c.fill(); c.beginPath(); c.arc(W - 28, y + 26, 9, 0, TAU); c.fill(); }
      },
      text: '#ffffff', font: fonts.pacifico, sub: fonts.fredoka, empty: '#f3eef0',
    },
  });

  D.push({
    id: 'S7', name: 'Cherry Red',
    slots: [[50, 50, 500, 400], [50, 470, 500, 400], [50, 890, 500, 400]],
    decos: [{ kind: 'cherries', r: [0, 1310, 600, 400] }],
    text: [40, 1690, 520, 96],
    theme: {
      bg: (c) => {
        fill(c, W, Ht, '#8f1d27');
        c.fillStyle = 'rgba(255,255,255,0.9)';
        for (let x = 24; x < W; x += 40) { c.beginPath(); c.arc(x, 22, 5, 0, TAU); c.fill(); c.beginPath(); c.arc(x, Ht - 22, 5, 0, TAU); c.fill(); }
        for (let y = 62; y < Ht - 30; y += 40) { c.beginPath(); c.arc(22, y, 5, 0, TAU); c.fill(); c.beginPath(); c.arc(W - 22, y, 5, 0, TAU); c.fill(); }
        dotsIn(c, 40, 1310, 520, 440, 70, 5, 'rgba(255,255,255,0.35)');
      },
      border: { color: '#ffffff', w: 6 }, text: '#ffffff', font: fonts.pacifico, sub: fonts.fredoka, empty: '#f4e3e5',
    },
  });

  D.push({
    id: 'S8', name: 'Midnight Blossom',
    slots: [[50, 80, 500, 400, 'rounded'], [50, 500, 500, 400, 'rounded'], [50, 920, 500, 400, 'rounded']],
    decos: [{ kind: 'sleepyMoon', r: [0, 1330, 600, 380] }],
    text: [40, 1700, 520, 86],
    theme: {
      bg: (c) => {
        fill(c, W, Ht, '#141414');
        for (const [x, y, r] of [[30, 30, 46], [575, 40, 38], [20, 1200, 34], [585, 700, 30], [560, 1330, 40]]) flower(c, x, y, r, '#f7b6cf', '#fff3a8');
        c.font = fonts.pacifico(30); c.fillStyle = '#f7b6cf'; c.textAlign = 'center'; c.fillText('Snapbooth', W / 2, 52);
      },
      border: { color: '#f7b6cf', w: 6 }, text: '#f7b6cf', font: fonts.pacifico, sub: fonts.fredoka, empty: '#f6eef2',
    },
  });

  for (const d of D) { d.size = 'strip'; d.designed = true; }
  return { designs: D, DECO };
};
