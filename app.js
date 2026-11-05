(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const wait = (ms) => new Promise((res) => setTimeout(res, ms));

  /* =========================================================
   * LAYOUTS: canvas sizes in px (300 dpi-ish) and photo slots
   * Each slot = [x, y, w, h]; `text` = area for caption/date.
   * ========================================================= */
  const SIZES = {
    strip: [600, 1800],      // 2 x 6 in
    portrait: [1200, 1800],  // 4 x 6 in
    landscape: [1800, 1200], // 6 x 4 in
  };
  const SIZE_LABEL = { strip: '2×6', portrait: '4×6', landscape: '4×6' };
  const dims = (L) => L.dims || SIZES[L.size];

  const LAYOUTS = [
    { id: 'A', size: 'strip', slots: [[40, 40, 520, 390], [40, 460, 520, 390], [40, 880, 520, 390]], text: [40, 1290, 520, 470] },
    { id: 'B', size: 'strip', slots: [[40, 40, 520, 370], [40, 440, 520, 370], [40, 840, 520, 370], [40, 1240, 520, 370]], text: [40, 1625, 520, 140] },
    { id: 'C', size: 'portrait', slots: [[50, 50, 535, 680], [615, 50, 535, 680], [50, 760, 535, 680], [615, 760, 535, 680]], text: [50, 1465, 1100, 290] },
    { id: 'D', size: 'portrait', slots: [[50, 50, 1100, 1380]], text: [50, 1455, 1100, 300] },
    { id: 'E', size: 'portrait', slots: [[50, 50, 1100, 680], [50, 760, 1100, 680]], text: [50, 1465, 1100, 290] },
    { id: 'F', size: 'landscape', slots: [[50, 50, 1700, 880]], text: [50, 950, 1700, 210] },
    { id: 'G', size: 'landscape', slots: [[50, 270, 835, 560], [915, 270, 835, 560]], text: [50, 860, 1700, 300] },
    { id: 'H', size: 'landscape', slots: [[50, 50, 900, 520], [50, 600, 540, 550], [630, 600, 540, 550], [1210, 600, 540, 550]], text: [980, 50, 770, 520] },
    { id: 'I', size: 'landscape', slots: [[50, 50, 835, 535], [50, 615, 835, 535], [915, 615, 835, 535]], text: [915, 50, 835, 535] },
    { id: 'J', size: 'landscape', slots: [[50, 50, 835, 535], [915, 50, 835, 535], [50, 615, 835, 535]], text: [915, 615, 835, 535] },
    { id: 'K', size: 'landscape', slots: [[50, 50, 835, 535], [50, 615, 835, 535]], text: [915, 50, 835, 1100] },
  ];

  /* =========================================================
   * Drawing helpers
   * ========================================================= */
  function rng(seed) {
    return () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function fill(c, W, H, color) { c.fillStyle = color; c.fillRect(0, 0, W, H); }
  function rr(c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }
  function dots(c, W, H, color, gap, r) {
    c.fillStyle = color;
    for (let y = 0, row = 0; y < H + gap; y += gap, row++) {
      for (let x = row % 2 ? gap / 2 : 0; x < W + gap; x += gap) {
        c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
      }
    }
  }
  function gingham(c, W, H, base, color, size) {
    fill(c, W, H, base);
    c.fillStyle = color;
    c.globalAlpha = 0.45;
    for (let x = 0; x < W; x += size * 2) c.fillRect(x, 0, size, H);
    for (let y = 0; y < H; y += size * 2) c.fillRect(0, y, W, size);
    c.globalAlpha = 1;
  }
  function stripes(c, W, H, base, color, size) {
    fill(c, W, H, base);
    c.fillStyle = color;
    for (let x = 0; x < W; x += size * 2) c.fillRect(x, 0, size, H);
  }
  function starPath(c, cx, cy, r, inner = 0.45, points = 5) {
    c.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const rad = i % 2 ? r * inner : r;
      const a = (Math.PI / points) * i - Math.PI / 2;
      c.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
    }
    c.closePath();
  }
  function heartPath(c, x, y, w, h) {
    const hw = Math.min(w, h * 1.15);
    x += (w - hw) / 2; w = hw;
    const top = y + h * 0.28;
    c.beginPath();
    c.moveTo(x + w / 2, top);
    c.bezierCurveTo(x + w / 2, y, x, y, x, top);
    c.bezierCurveTo(x, y + h * 0.6, x + w / 2, y + h * 0.8, x + w / 2, y + h);
    c.bezierCurveTo(x + w / 2, y + h * 0.8, x + w, y + h * 0.6, x + w, top);
    c.bezierCurveTo(x + w, y, x + w / 2, y, x + w / 2, top);
    c.closePath();
  }
  function sprinkle(c, W, H, colors, count, seed, minR, maxR, shape = 'star') {
    const R = rng(seed);
    for (let i = 0; i < count; i++) {
      c.fillStyle = colors[i % colors.length];
      const x = R() * W, y = R() * H, r = minR + R() * (maxR - minR);
      if (shape === 'heart') heartPath(c, x - r, y - r, r * 2, r * 1.8);
      else starPath(c, x, y, r);
      c.fill();
    }
  }
  function cowSpots(c, W, H, seed) {
    const R = rng(seed);
    c.fillStyle = '#1d1d1d';
    const n = Math.round((W * H) / 55000);
    for (let i = 0; i < n; i++) {
      const cx = R() * W, cy = R() * H, r = 26 + R() * 50;
      for (let k = 0; k < 3; k++) {
        c.beginPath();
        c.ellipse(cx + (R() - 0.5) * r, cy + (R() - 0.5) * r, r * (0.6 + R() * 0.5), r * (0.45 + R() * 0.4), R() * Math.PI, 0, Math.PI * 2);
        c.fill();
      }
    }
  }
  function sprockets(c, W, H, color) {
    c.fillStyle = color;
    const vertical = H > W;
    const len = vertical ? H : W;
    for (let p = 22; p < len - 40; p += 64) {
      if (vertical) {
        rr(c, 10, p, 20, 34, 5); c.fill();
        rr(c, W - 30, p, 20, 34, 5); c.fill();
      } else {
        rr(c, p, 12, 34, 22, 5); c.fill();
        rr(c, p, H - 34, 34, 22, 5); c.fill();
      }
    }
  }
  function zigzag(c, W, H, color, depth) {
    c.fillStyle = color;
    for (const edge of [0, H]) {
      c.beginPath();
      c.moveTo(0, edge);
      for (let x = 0; x <= W; x += depth * 2) {
        c.lineTo(x + depth, edge === 0 ? depth : edge - depth);
        c.lineTo(x + depth * 2, edge);
      }
      c.closePath();
      c.fill();
    }
  }

  /* =========================================================
   * FRAME THEMES (original designs drawn with canvas)
   * ========================================================= */
  const pacifico = (s) => `${s}px Pacifico, cursive`;
  const fredoka = (s) => `600 ${s}px Fredoka, sans-serif`;
  const playfair = (s) => `italic 600 ${s}px "Playfair Display", serif`;
  const bebas = (s) => `${s}px "Bebas Neue", Impact, sans-serif`;
  const courier = (s) => `700 ${s}px "Courier Prime", monospace`;
  const lilita = (s) => `${s}px "Lilita One", Fredoka, sans-serif`;

  const TICKET_NO = String(1000 + Math.floor(Math.random() * 9000));
  const THEMES = [
    {
      id: 'sticker', name: 'Snapbooth Sticker', shape: 'rounded', border: { color: '#ffffff', w: 14 },
      bg: (c, W, H) => {
        fill(c, W, H, '#fffaf0');
        const cols = ['#e0393e', '#6cc04a', '#f2c94c', '#4f8cc9', '#ea7d2b'];
        const gap = 56;
        for (let y = 0, row = 0; y < H + gap; y += gap, row++) {
          for (let x = row % 2 ? gap / 2 : 0, k = row; x < W + gap; x += gap, k++) {
            c.fillStyle = cols[k % cols.length]; c.globalAlpha = 0.55;
            c.beginPath(); c.arc(x, y, 7, 0, Math.PI * 2); c.fill();
          }
        }
        c.globalAlpha = 1;
        sprinkle(c, W, H, ['#f2c94c'], Math.round(W * H / 110000), 9, 12, 22);
      },
      text: '#e0393e', font: lilita, sub: fredoka, outline: ['#4f8cc9', '#ffffff'], subColor: '#4f8cc9',
    },
    { id: 'classic', name: 'Classic White', bg: (c, W, H) => fill(c, W, H, '#ffffff'), text: '#1d1d1d', font: playfair, sub: courier, empty: '#ececec' },
    { id: 'noir', name: 'Noir', bg: (c, W, H) => fill(c, W, H, '#141414'), text: '#f5f5f5', font: playfair, sub: courier, empty: '#2c2c2c' },
    {
      id: 'lavender', name: 'Lavender Dots', shape: 'rounded', border: { color: '#ffffff', w: 12 },
      bg: (c, W, H) => { fill(c, W, H, '#c9c2f1'); dots(c, W, H, 'rgba(255,255,255,0.75)', 46, 7); },
      text: '#4b3fa0', font: pacifico, sub: fredoka, panel: 'rgba(255,255,255,0.85)',
    },
    {
      id: 'strawberry', name: 'Strawberry Gingham', shape: 'rounded', border: { color: '#ffffff', w: 14 },
      bg: (c, W, H) => { gingham(c, W, H, '#fff6f9', '#f6a3bf', 36); sprinkle(c, W, H, ['#e0457b', '#ff8fb1'], Math.round(W * H / 90000), 7, 14, 24, 'heart'); },
      text: '#c2185b', font: pacifico, sub: fredoka, panel: 'rgba(255,255,255,0.9)',
    },
    {
      id: 'mint', name: 'Mint Ovals', shape: 'oval', border: { color: '#ffffff', w: 12 },
      bg: (c, W, H) => gingham(c, W, H, '#f2fbf6', '#93d6b2', 34),
      text: '#2e7d5b', font: fredoka, sub: fredoka, panel: 'rgba(255,255,255,0.9)',
    },
    {
      id: 'butter', name: 'Butter Hearts', shape: 'heart', border: { color: '#f4a9c0', w: 10 },
      bg: (c, W, H) => { stripes(c, W, H, '#fff9df', '#fdeba5', 30); sprinkle(c, W, H, ['#ffcf3f', '#8fc7ff'], Math.round(W * H / 120000), 3, 14, 26); },
      text: '#c98a00', font: pacifico, sub: fredoka, panel: 'rgba(255,255,255,0.85)', empty: '#fff3c4',
    },
    {
      id: 'cherry', name: 'Cherry Polka', border: { color: '#ffffff', w: 8 },
      bg: (c, W, H) => { fill(c, W, H, '#8e1f2c'); dots(c, W, H, 'rgba(255,255,255,0.9)', 62, 6); },
      text: '#ffffff', font: fredoka, sub: fredoka, panel: '#8e1f2c', empty: '#b54a57',
    },
    {
      id: 'ticket', name: 'Movie Ticket', border: { color: '#a3222b', w: 8 },
      bg: (c, W, H) => {
        fill(c, W, H, '#f6ead0');
        c.strokeStyle = '#a3222b';
        c.lineWidth = 12; c.strokeRect(8, 8, W - 16, H - 16);
        c.lineWidth = 3; c.setLineDash([14, 10]); c.strokeRect(26, 26, W - 52, H - 52); c.setLineDash([]);
      },
      text: '#a3222b', font: bebas, sub: courier, header: 'ADMIT ONE', footer: () => 'No. ' + TICKET_NO, empty: '#ecdcbc',
    },
    {
      id: 'receipt', name: 'Receipt', border: { color: '#222222', w: 4 },
      bg: (c, W, H) => { fill(c, W, H, '#fdfdfb'); zigzag(c, W, H, '#d8d8d4', 12); },
      text: '#222222', font: courier, sub: courier, header: '*** RECEIPT ***', barcode: true, upper: true, empty: '#ededea',
    },
    {
      id: 'denim', name: 'Starry Denim', shape: 'rounded', border: { color: '#ffd54f', w: 8 },
      bg: (c, W, H) => {
        fill(c, W, H, '#2c4a86');
        const R = rng(11); c.fillStyle = 'rgba(255,255,255,0.08)';
        for (let i = 0; i < W * H / 400; i++) c.fillRect(R() * W, R() * H, 2, 2);
        sprinkle(c, W, H, ['#ffd54f', '#ffffff'], Math.round(W * H / 70000), 5, 10, 26);
      },
      text: '#ffd54f', font: fredoka, sub: fredoka, panel: '#2c4a86', empty: '#4a67a3',
    },
    {
      id: 'cow', name: 'Moo Print', shape: 'rounded', border: { color: '#f49ac1', w: 14 },
      bg: (c, W, H) => { fill(c, W, H, '#ffffff'); cowSpots(c, W, H, 21); },
      text: '#e0578f', font: pacifico, sub: fredoka, panel: '#ffffff',
    },
    {
      id: 'film', name: 'Film Roll',
      bg: (c, W, H) => { fill(c, W, H, '#111111'); sprockets(c, W, H, '#f2efe8'); },
      text: '#f2efe8', font: bebas, sub: courier, empty: '#2a2a2a',
    },
  ];
  const themeById = (id) => THEMES.find((t) => t.id === id) || THEMES[0];

  const { designs: DESIGNS, DECO } = window.SNAPBOOTH_DESIGNS({
    fill, rr, dots, stripes, starPath, heartPath, sprinkle, cowSpots, rng,
    fonts: { pacifico, fredoka, playfair, bebas, courier, lilita },
  });

  /* =========================================================
   * FILTERS (pixel based so they work in every browser)
   * ========================================================= */
  const clamp = (v) => (v < 0 ? 0 : v > 255 ? 255 : v);
  const FILTERS = [
    { id: 'none', name: 'Original', fn: null },
    { id: 'bw', name: 'B&W', fn: (r, g, b) => { const l = 0.299 * r + 0.587 * g + 0.114 * b; const v = (l - 128) * 1.15 + 128; return [v, v, v]; } },
    { id: 'sepia', name: 'Sepia', fn: (r, g, b) => [r * 0.393 + g * 0.769 + b * 0.189, r * 0.349 + g * 0.686 + b * 0.168, r * 0.272 + g * 0.534 + b * 0.131] },
    { id: 'warm', name: 'Warm', fn: (r, g, b) => [r * 1.08 + 12, g * 1.02 + 5, b * 0.88] },
    { id: 'cool', name: 'Cool', fn: (r, g, b) => [r * 0.9, g * 1.0 + 4, b * 1.1 + 14] },
    {
      id: 'vintage', name: 'Vintage', fn: (r, g, b) => {
        const sr = r * 0.393 + g * 0.769 + b * 0.189, sg = r * 0.349 + g * 0.686 + b * 0.168, sb = r * 0.272 + g * 0.534 + b * 0.131;
        return [(r * 0.5 + sr * 0.5) * 0.85 + 30, (g * 0.5 + sg * 0.5) * 0.85 + 24, (b * 0.5 + sb * 0.5) * 0.8 + 22];
      },
    },
    { id: 'soft', name: 'Dreamy', fn: (r, g, b) => [r * 0.82 + 52, g * 0.82 + 44, b * 0.82 + 50] },
    {
      id: 'pop', name: 'Pop', fn: (r, g, b) => {
        const l = 0.299 * r + 0.587 * g + 0.114 * b;
        const s = (v) => ((l + (v - l) * 1.45) - 128) * 1.12 + 128;
        return [s(r), s(g), s(b)];
      },
    },
  ];

  /* =========================================================
   * State
   * ========================================================= */
  const state = {
    step: 1,
    layout: null,
    photos: [],
    current: 0,
    theme: 'sticker',
    filter: 'none',
    caption: 'Snapbooth',
    showDate: true,
    double: false,
    mirror: true,
    facing: 'user',
    timer: 3,
    busy: false,
  };
  let stream = null;
  let photoSeq = 0;
  const filterCache = new Map();

  const video = $('#video');
  const viewfinder = $('#viewfinder');
  const camMsg = $('#camMsg');
  const countdownEl = $('#countdown');
  const flashEl = $('#flash');
  const badge = $('#shotBadge');
  const preview = $('#preview');

  /* =========================================================
   * Rendering
   * ========================================================= */
  function getFiltered(i) {
    const p = state.photos[i];
    if (!p) return null;
    const f = FILTERS.find((x) => x.id === state.filter);
    if (!f || !f.fn) return p.canvas;
    const key = p.id + '|' + f.id;
    if (filterCache.has(key)) return filterCache.get(key);
    const src = p.canvas;
    const out = document.createElement('canvas');
    out.width = src.width; out.height = src.height;
    const ctx = out.getContext('2d');
    ctx.drawImage(src, 0, 0);
    const img = ctx.getImageData(0, 0, out.width, out.height);
    const d = img.data;
    for (let k = 0; k < d.length; k += 4) {
      const [r, g, b] = f.fn(d[k], d[k + 1], d[k + 2]);
      d[k] = clamp(r); d[k + 1] = clamp(g); d[k + 2] = clamp(b);
    }
    ctx.putImageData(img, 0, 0);
    filterCache.set(key, out);
    return out;
  }

  function drawCover(c, img, x, y, w, h) {
    const iw = img.width, ih = img.height;
    const s = Math.max(w / iw, h / ih);
    const dw = iw * s, dh = ih * s;
    c.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  }

  function slotPath(c, shape, x, y, w, h) {
    switch (shape) {
      case 'rounded': rr(c, x, y, w, h, Math.min(w, h) * 0.08); break;
      case 'oval': c.beginPath(); c.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2); break;
      case 'heart': heartPath(c, x, y, w, h); break;
      case 'cloud': cloudPath(c, x, y, w, h); break;
      default: c.beginPath(); c.rect(x, y, w, h);
    }
  }

  function cloudPath(c, x, y, w, h) {
    c.beginPath();
    const bumps = [[0.22, 0.55, 0.22], [0.4, 0.38, 0.24], [0.62, 0.36, 0.25], [0.8, 0.55, 0.2], [0.5, 0.62, 0.3], [0.3, 0.7, 0.2], [0.7, 0.72, 0.2]];
    for (const [bx, by, br] of bumps) {
      const cx = x + bx * w, cy = y + by * h, rx = br * w, ry = br * h * 1.25;
      c.moveTo(cx + rx, cy);
      c.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    }
  }

  function fmtDate() {
    return new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function drawLabel(c, T, L) {
    if (!L.text) return;
    const [x, y, w, h] = L.text;
    const up = (s) => (T.upper ? s.toUpperCase() : s);
    const items = [];
    if (T.header) items.push({ t: T.header, f: T.sub, k: 0.32 });
    if (state.caption.trim()) items.push({ t: up(state.caption.trim()), f: T.font, k: 1, main: true });
    if (state.showDate) items.push({ t: up(fmtDate()), f: T.sub, k: 0.34 });
    if (T.footer) items.push({ t: T.footer(), f: T.sub, k: 0.26 });
    if (!items.length && !T.barcode) return;

    const base = Math.min(h * 0.42, w * 0.16, 150);
    c.save();
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    for (const it of items) {
      let s = base * it.k;
      c.font = it.f(s);
      const mw = c.measureText(it.t).width;
      if (mw > w * 0.84) s *= (w * 0.84) / mw;
      it.s = s;
    }
    let barH = T.barcode ? base * 0.45 : 0;
    let total = items.reduce((a, it) => a + it.s * 1.35, 0) + (T.barcode ? barH + base * 0.12 : 0);
    const maxH = h * 0.92;
    if (total > maxH) {
      const k = maxH / total;
      items.forEach((it) => { it.s *= k; });
      barH *= k; total = maxH;
    }

    if (T.panel) {
      let maxW = 0;
      for (const it of items) { c.font = it.f(it.s); maxW = Math.max(maxW, c.measureText(it.t).width); }
      if (T.barcode) maxW = Math.max(maxW, w * 0.6);
      const pw = Math.min(w, maxW + base * 0.6), ph = Math.min(h, total + base * 0.3);
      c.fillStyle = T.panel;
      rr(c, x + (w - pw) / 2, y + (h - ph) / 2, pw, ph, Math.min(pw, ph) * 0.2);
      c.fill();
    }

    let cy = y + (h - total) / 2;
    c.fillStyle = T.text;
    for (const it of items) {
      c.font = it.f(it.s);
      const ty = cy + (it.s * 1.35) / 2;
      if (it.main && T.outline) {
        c.lineJoin = 'round';
        c.strokeStyle = T.outline[0]; c.lineWidth = it.s * 0.3; c.strokeText(it.t, x + w / 2, ty);
        c.strokeStyle = T.outline[1]; c.lineWidth = it.s * 0.15; c.strokeText(it.t, x + w / 2, ty);
      }
      c.fillStyle = !it.main && T.subColor ? T.subColor : T.text;
      c.fillText(it.t, x + w / 2, ty);
      cy += it.s * 1.35;
    }
    if (T.barcode) {
      cy += base * 0.12;
      const bw = Math.min(w * 0.7, 520), bx = x + (w - bw) / 2;
      const R = rng(42);
      let px = bx;
      while (px < bx + bw) {
        const lw = 2 + Math.floor(R() * 4) * 2;
        if (R() > 0.35) c.fillRect(px, cy, Math.min(lw, bx + bw - px), barH);
        px += lw + 2;
      }
    }
    c.restore();
  }

  function renderInto(canvas, scale, themeId, L = state.layout, withPhotos = true) {
    const [W, H] = dims(L);
    canvas.width = Math.round(W * scale);
    canvas.height = Math.round(H * scale);
    const c = canvas.getContext('2d');
    c.setTransform(scale, 0, 0, scale, 0, 0);
    const T = L.theme || themeById(themeId);

    c.save(); T.bg(c, W, H); c.restore();

    for (const d of L.decos || []) {
      const [x, y, w, h] = d.r;
      c.save(); DECO[d.kind](c, x, y, w, h); c.restore();
      if (d.frame && T.border) {
        c.save(); rr(c, x, y, w, h, Math.min(w, h) * 0.08);
        c.lineWidth = T.border.w; c.strokeStyle = T.border.color; c.stroke(); c.restore();
      }
    }

    L.slots.forEach(([x, y, w, h, slotShape], i) => {
      const shape = slotShape || T.shape;
      c.save();
      if (shape === 'cloud' && T.border) {
        // clouds get a solid "plate" instead of a stroke (avoids inner arc lines)
        const b = T.border.w;
        cloudPath(c, x - b, y - b, w + 2 * b, h + 2 * b);
        c.fillStyle = T.border.color; c.fill();
      }
      slotPath(c, shape, x, y, w, h);
      c.save();
      c.clip();
      const img = withPhotos ? getFiltered(i) : null;
      if (img) {
        drawCover(c, img, x, y, w, h);
      } else {
        c.fillStyle = T.empty || 'rgba(255,255,255,0.7)';
        c.fillRect(x, y, w, h);
        c.fillStyle = 'rgba(0,0,0,0.25)';
        c.font = `600 ${Math.min(w, h) * 0.3}px Fredoka, sans-serif`;
        c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(String(i + 1), x + w / 2, y + h / 2);
      }
      c.restore();
      if (T.border && shape !== 'cloud') {
        c.lineWidth = T.border.w;
        c.strokeStyle = T.border.color;
        c.stroke();
      }
      c.restore();
    });

    drawLabel(c, T, L);
    if (L.overlay) c.drawImage(L.overlay, 0, 0, W, H);
    return canvas;
  }

  function renderPreview() {
    if (!state.layout) return;
    renderInto(preview, 1, state.theme);
  }

  let thumbTimer = 0;
  function renderThemeThumbsSoon() {
    clearTimeout(thumbTimer);
    thumbTimer = setTimeout(renderThemeThumbs, 150);
  }
  function renderThemeThumbs() {
    if (!state.layout) return;
    const scale = 150 / Math.max(...dims(state.layout)) * 0.85;
    for (const btn of $('#themeGrid').children) {
      renderInto(btn.querySelector('canvas'), scale, btn.dataset.theme);
      btn.classList.toggle('active', btn.dataset.theme === state.theme);
    }
  }

  /* =========================================================
   * Step 1: layouts
   * ========================================================= */
  function layoutSVG(L) {
    const [W, H] = dims(L);
    const rects = L.slots.map(([x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#fff"/>`).join('');
    const dh = Math.min(150, (140 * H) / W), dw = (dh * W) / H;
    return `<svg class="${L.size}" width="${dw.toFixed(1)}" height="${dh.toFixed(1)}" viewBox="0 0 ${W} ${H}" aria-hidden="true"><rect width="${W}" height="${H}" fill="#1d1d1d" rx="10"/>${rects}</svg>`;
  }
  function buildLayoutGrid() {
    const grid = $('#layoutGrid');
    grid.innerHTML = '';
    for (const L of LAYOUTS) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'layout-card';
      b.dataset.id = L.id;
      const n = L.slots.length;
      b.innerHTML = `<div class="thumb-box">${layoutSVG(L)}</div><strong>LAYOUT ${L.id}</strong><small>Size ${SIZE_LABEL[L.size]}<br>${n} pose${n > 1 ? 's' : ''}</small>`;
      b.addEventListener('click', () => chooseLayout(L));
      grid.appendChild(b);
    }
  }
  function buildDesignGrid() {
    const grid = $('#designGrid');
    grid.innerHTML = '';
    for (const L of DESIGNS) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'layout-card design-card';
      b.dataset.id = L.id;
      const n = L.slots.length;
      b.innerHTML = `<div class="thumb-box"><canvas></canvas></div><strong>${L.name}</strong><small>Strip 2×6<br>${n} poses</small>`;
      b.addEventListener('click', () => chooseLayout(L));
      grid.appendChild(b);
    }
    renderDesignThumbs();
  }
  function renderDesignThumbs() {
    for (const b of $('#designGrid').children) {
      const L = DESIGNS.find((d) => d.id === b.dataset.id);
      renderInto(b.querySelector('canvas'), 0.25, null, L, false);
    }
  }

  // ---- custom PNG frame: transparent areas become photo windows ----
  function detectWindows(img, W, H) {
    const s = Math.min(1, 320 / Math.max(W, H));
    const gw = Math.max(1, Math.round(W * s)), gh = Math.max(1, Math.round(H * s));
    const cv = document.createElement('canvas');
    cv.width = gw; cv.height = gh;
    const cx = cv.getContext('2d');
    cx.drawImage(img, 0, 0, gw, gh);
    const a = cx.getImageData(0, 0, gw, gh).data;
    const seen = new Uint8Array(gw * gh);
    const boxes = [];
    const minArea = gw * gh * 0.01;
    for (let start = 0; start < gw * gh; start++) {
      if (seen[start] || a[start * 4 + 3] >= 110) continue;
      let x0 = gw, y0 = gh, x1 = 0, y1 = 0, count = 0;
      const stack = [start];
      seen[start] = 1;
      while (stack.length) {
        const p = stack.pop();
        const px = p % gw, py = (p - px) / gw;
        count++;
        if (px < x0) x0 = px; if (px > x1) x1 = px;
        if (py < y0) y0 = py; if (py > y1) y1 = py;
        for (const q of [p - 1, p + 1, p - gw, p + gw]) {
          if (q < 0 || q >= gw * gh) continue;
          if ((q === p - 1 && px === 0) || (q === p + 1 && px === gw - 1)) continue;
          if (!seen[q] && a[q * 4 + 3] < 110) { seen[q] = 1; stack.push(q); }
        }
      }
      if (count >= minArea) boxes.push([x0, y0, x1, y1]);
    }
    const slots = boxes.map(([x0, y0, x1, y1]) => {
      const x = Math.max(0, (x0 - 1) / s), y = Math.max(0, (y0 - 1) / s);
      return [x, y, Math.min(W, (x1 + 2) / s) - x, Math.min(H, (y1 + 2) / s) - y];
    });
    // reading order: top-to-bottom, then left-to-right for windows on the same row
    slots.sort((p, q) => (Math.abs(p[1] - q[1]) < Math.min(p[3], q[3]) * 0.3 ? p[0] - q[0] : p[1] - q[1]));
    return slots;
  }
  async function useCustomFrame(file) {
    if (!file) return;
    try {
      const src = await new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
        img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('bad image')); };
        img.src = url;
      });
      const s = Math.min(1, 2400 / Math.max(src.naturalWidth, src.naturalHeight));
      const W = Math.round(src.naturalWidth * s), H = Math.round(src.naturalHeight * s);
      const overlay = document.createElement('canvas');
      overlay.width = W; overlay.height = H;
      overlay.getContext('2d').drawImage(src, 0, 0, W, H);
      const slots = detectWindows(overlay, W, H);
      if (!slots.length) {
        toast('No transparent photo windows found. Use a PNG with see-through windows.');
        return;
      }
      if (slots.length > 12) slots.length = 12;
      const L = {
        id: 'custom', name: 'Your frame', dims: [W, H], slots, overlay, text: null, custom: true,
        size: W * 3 <= H * 1.2 ? 'strip' : 'custom',
        theme: { bg: (c, w, h) => fill(c, w, h, '#ffffff'), empty: '#e9e9e9' },
      };
      toast(`Found ${slots.length} photo window${slots.length > 1 ? 's' : ''} ✨`);
      chooseLayout(L);
    } catch {
      toast('Could not read that image');
    }
  }

  function chooseLayout(L) {
    if (state.layout !== L) {
      const kept = state.photos.filter(Boolean);
      state.layout = L;
      // keep already-taken photos in order when switching layouts
      state.photos = new Array(L.slots.length).fill(null).map((_, i) => kept[i] || null);
      state.current = Math.max(0, firstEmpty());
    }
    for (const card of [...$('#layoutGrid').children, ...$('#designGrid').children]) card.classList.toggle('selected', card.dataset.id === L.id);
    $('#doubleWrap').hidden = L.size !== 'strip';
    $('#frameSection').hidden = !!L.theme;
    goStep(2);
  }

  /* =========================================================
   * Step 2: camera & capture
   * ========================================================= */
  async function startCamera() {
    if (stream) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showCamMsg('Camera is not available in this browser.<br>Open the site over <b>https</b> (or localhost), or use “Upload photos instead”.');
      return;
    }
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: state.facing, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      video.srcObject = stream;
      await video.play().catch(() => {});
      camMsg.hidden = true;
    } catch (err) {
      stream = null;
      const denied = err && (err.name === 'NotAllowedError' || err.name === 'SecurityError');
      showCamMsg(denied
        ? 'Camera permission was blocked.<br>Allow camera access in your browser settings and reload, or use “Upload photos instead”.'
        : 'No camera found.<br>Connect a camera or use “Upload photos instead”.');
    }
  }
  function stopCamera() {
    if (stream) stream.getTracks().forEach((t) => t.stop());
    stream = null;
    video.srcObject = null;
  }
  function showCamMsg(html) { camMsg.innerHTML = `<div>${html}</div>`; camMsg.hidden = false; }

  function firstEmpty() { return state.photos.findIndex((p) => !p); }
  function allFilled() { return state.photos.length > 0 && state.photos.every(Boolean); }

  function updateViewfinder() {
    const L = state.layout;
    if (!L) return;
    const [, , w, h] = L.slots[state.current] || L.slots[0];
    viewfinder.style.setProperty('--ar', (w / h).toFixed(4));
    badge.textContent = `Pose ${state.current + 1} of ${L.slots.length}`;
    viewfinder.classList.toggle('mirror', state.mirror);
  }

  function buildSlotThumbs() {
    const box = $('#slotThumbs');
    box.innerHTML = '';
    state.layout.slots.forEach(([, , w, h], i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'slot-thumb';
      b.setAttribute('aria-label', `Pose ${i + 1}`);
      const cv = document.createElement('canvas');
      cv.width = 200; cv.height = Math.round((200 * h) / w);
      b.appendChild(cv);
      const num = document.createElement('span');
      num.className = 'num'; num.textContent = i + 1;
      b.appendChild(num);
      b.addEventListener('click', () => { if (!state.busy) selectSlot(i); });
      box.appendChild(b);
    });
    refreshSlotThumbs();
  }
  function refreshSlotThumbs() {
    [...$('#slotThumbs').children].forEach((b, i) => {
      const cv = b.querySelector('canvas');
      const c = cv.getContext('2d');
      c.fillStyle = '#efe5dd';
      c.fillRect(0, 0, cv.width, cv.height);
      const p = state.photos[i];
      if (p) drawCover(c, p.canvas, 0, 0, cv.width, cv.height);
      b.classList.toggle('selected', i === state.current);
    });
    $('#btnToDesign').disabled = !allFilled();
    $('.step-btn[data-step="3"]').disabled = !allFilled();
    $('#btnStart').textContent = state.busy ? '■ Stop' : allFilled() ? '📸 Retake all' : state.photos.some(Boolean) ? '📸 Continue' : '📸 Start photobooth';
  }
  function selectSlot(i) {
    state.current = i;
    updateViewfinder();
    refreshSlotThumbs();
  }

  function setPhoto(i, canvas) {
    const old = state.photos[i];
    if (old) for (const k of [...filterCache.keys()]) if (k.startsWith(old.id + '|')) filterCache.delete(k);
    state.photos[i] = { id: ++photoSeq, canvas };
    refreshSlotThumbs();
  }

  function captureFrame() {
    const vw = video.videoWidth, vh = video.videoHeight;
    if (!vw || !vh) return null;
    const s = Math.min(1, 1600 / Math.max(vw, vh));
    const cv = document.createElement('canvas');
    cv.width = Math.round(vw * s);
    cv.height = Math.round(vh * s);
    const c = cv.getContext('2d');
    if (state.mirror) { c.translate(cv.width, 0); c.scale(-1, 1); }
    c.drawImage(video, 0, 0, cv.width, cv.height);
    return cv;
  }

  // --- little sounds ---
  let audioCtx = null;
  function ac() {
    try { audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)(); } catch { audioCtx = null; }
    return audioCtx;
  }
  function beep(freq, dur) {
    const a = ac(); if (!a) return;
    const o = a.createOscillator(), g = a.createGain();
    o.frequency.value = freq; o.type = 'sine';
    g.gain.setValueAtTime(0.15, a.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
    o.connect(g).connect(a.destination);
    o.start(); o.stop(a.currentTime + dur);
  }
  function shutter() {
    const a = ac(); if (!a) return;
    const len = a.sampleRate * 0.12;
    const buf = a.createBuffer(1, len, a.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    const src = a.createBufferSource(), g = a.createGain();
    g.gain.value = 0.35;
    src.buffer = buf; src.connect(g).connect(a.destination); src.start();
  }
  function flash() {
    flashEl.classList.remove('go'); void flashEl.offsetWidth; flashEl.classList.add('go');
  }

  async function countdown(n) {
    for (let i = n; i > 0; i--) {
      if (!state.busy) { countdownEl.textContent = ''; return false; }
      countdownEl.textContent = i;
      countdownEl.classList.remove('pop'); void countdownEl.offsetWidth; countdownEl.classList.add('pop');
      beep(i === 1 ? 880 : 660, 0.08);
      await wait(1000);
    }
    countdownEl.textContent = '';
    return state.busy;
  }

  async function shoot(i) {
    selectSlot(i);
    const ok = await countdown(state.timer);
    if (!ok) return false;
    const cv = captureFrame();
    if (!cv) { toast('Camera is not ready yet'); return false; }
    flash(); shutter();
    setPhoto(i, cv);
    return true;
  }

  function setBusy(b) {
    state.busy = b;
    $('#btnSnap').disabled = b;
    $('#btnFlip').disabled = b;
    refreshSlotThumbs();
  }

  async function startSequence() {
    if (state.busy) { setBusy(false); return; } // acts as Stop
    if (!stream) { toast('Camera not available. Use “Upload photos instead”.'); return; }
    if (allFilled()) state.photos = state.photos.map(() => null);
    setBusy(true);
    let i;
    while (state.busy && (i = firstEmpty()) !== -1) {
      const ok = await shoot(i);
      if (!ok) break;
      await wait(900);
    }
    setBusy(false);
    if (allFilled()) {
      toast('All poses captured! 🎉');
      await wait(500);
      if (state.step === 2) goStep(3);
    } else if (firstEmpty() !== -1) {
      selectSlot(firstEmpty());
    }
  }

  async function snapOne() {
    if (state.busy) return;
    if (!stream) { toast('Camera not available. Use “Upload photos instead”.'); return; }
    setBusy(true);
    const ok = await shoot(state.current);
    setBusy(false);
    if (ok) {
      const next = firstEmpty();
      if (next !== -1) selectSlot(next);
    }
  }

  function loadImageFile(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const s = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
        const cv = document.createElement('canvas');
        cv.width = Math.round(img.naturalWidth * s);
        cv.height = Math.round(img.naturalHeight * s);
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
        URL.revokeObjectURL(url);
        resolve(cv);
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('bad image')); };
      img.src = url;
    });
  }
  async function handleUpload(files) {
    const list = [...files].filter((f) => f.type.startsWith('image/'));
    if (!list.length) return;
    // one file → current slot; several → fill empty slots first, then from current
    let targets;
    if (list.length === 1) targets = [state.current];
    else {
      const empties = state.photos.map((p, i) => (p ? -1 : i)).filter((i) => i >= 0);
      const rest = state.photos.map((_, i) => i).filter((i) => !empties.includes(i));
      targets = [...empties, ...rest];
    }
    let n = 0;
    for (let k = 0; k < list.length && k < targets.length; k++) {
      try { setPhoto(targets[k], await loadImageFile(list[k])); n++; } catch { /* skip */ }
    }
    toast(`Added ${n} photo${n === 1 ? '' : 's'}`);
    const next = firstEmpty();
    selectSlot(next === -1 ? state.current : next);
  }

  /* =========================================================
   * Step 3: design & save
   * ========================================================= */
  function buildThemeGrid() {
    const grid = $('#themeGrid');
    grid.innerHTML = '';
    for (const T of THEMES) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'theme-btn';
      b.dataset.theme = T.id;
      b.innerHTML = `<canvas></canvas><span>${T.name}</span>`;
      b.addEventListener('click', () => {
        state.theme = T.id;
        renderPreview();
        for (const x of grid.children) x.classList.toggle('active', x.dataset.theme === T.id);
      });
      grid.appendChild(b);
    }
  }
  function buildFilterRow() {
    const row = $('#filterRow');
    row.innerHTML = '';
    for (const F of FILTERS) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip' + (F.id === state.filter ? ' active' : '');
      b.textContent = F.name;
      b.addEventListener('click', () => {
        state.filter = F.id;
        for (const x of row.children) x.classList.toggle('active', x === b);
        renderPreview();
        renderThemeThumbsSoon();
      });
      row.appendChild(b);
    }
  }

  function stamp() {
    const d = new Date(), p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
  }
  function exportBlob(type) {
    const strip = renderInto(document.createElement('canvas'), 1, state.theme);
    let out = strip;
    if (state.double && state.layout.size === 'strip') {
      out = document.createElement('canvas');
      out.width = strip.width * 2; out.height = strip.height;
      const c = out.getContext('2d');
      c.drawImage(strip, 0, 0);
      c.drawImage(strip, strip.width, 0);
    }
    if (type === 'image/jpeg') {
      // flatten onto white so JPG never gets black areas
      const flat = document.createElement('canvas');
      flat.width = out.width; flat.height = out.height;
      const c = flat.getContext('2d');
      c.fillStyle = '#fff'; c.fillRect(0, 0, flat.width, flat.height);
      c.drawImage(out, 0, 0);
      out = flat;
    }
    return new Promise((resolve) => out.toBlob(resolve, type, 0.92));
  }
  async function download(type) {
    const blob = await exportBlob(type);
    if (!blob) { toast('Could not create the image'); return; }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `snapbooth-${stamp()}.${type === 'image/png' ? 'png' : 'jpg'}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    toast('Saved to your device ✨');
  }
  async function share() {
    const blob = await exportBlob('image/png');
    const file = new File([blob], `snapbooth-${stamp()}.png`, { type: 'image/png' });
    try {
      await navigator.share({ files: [file], title: 'My Snapbooth photos' });
    } catch (e) {
      if (e && e.name !== 'AbortError') download('image/png');
    }
  }
  function canShareFiles() {
    try {
      return !!(navigator.canShare && navigator.canShare({ files: [new File(['x'], 'x.png', { type: 'image/png' })] }));
    } catch { return false; }
  }

  /* =========================================================
   * Navigation & misc
   * ========================================================= */
  function goStep(n) {
    if (n >= 2 && !state.layout) return;
    if (n === 3 && !allFilled()) return;
    if (state.busy) setBusy(false);
    state.step = n;
    for (let i = 1; i <= 3; i++) $('#step-' + i).hidden = i !== n;
    document.querySelectorAll('.step-btn').forEach((b) => {
      const s = +b.dataset.step;
      if (s === n) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
    });
    $('.step-btn[data-step="2"]').disabled = !state.layout;
    $('.step-btn[data-step="3"]').disabled = !allFilled();

    if (n === 2) {
      buildSlotThumbs();
      updateViewfinder();
      startCamera();
    } else {
      stopCamera();
    }
    if (n === 3) {
      renderPreview();
      renderThemeThumbs();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  let toastTimer = 0;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
  }

  function bind() {
    document.querySelectorAll('.step-btn').forEach((b) => b.addEventListener('click', () => goStep(+b.dataset.step)));
    $('#btnStart').addEventListener('click', startSequence);
    $('#btnSnap').addEventListener('click', snapOne);
    $('#btnToDesign').addEventListener('click', () => goStep(3));
    $('#fileInput').addEventListener('change', (e) => { handleUpload(e.target.files); e.target.value = ''; });
    $('#timer').addEventListener('change', (e) => { state.timer = +e.target.value; });
    $('#mirror').addEventListener('change', (e) => { state.mirror = e.target.checked; updateViewfinder(); });
    $('#btnFlip').addEventListener('click', async () => {
      state.facing = state.facing === 'user' ? 'environment' : 'user';
      state.mirror = state.facing === 'user';
      $('#mirror').checked = state.mirror;
      updateViewfinder();
      stopCamera();
      await startCamera();
    });

    $('#caption').addEventListener('input', (e) => { state.caption = e.target.value; renderPreview(); renderThemeThumbsSoon(); });
    $('#showDate').addEventListener('change', (e) => { state.showDate = e.target.checked; renderPreview(); renderThemeThumbsSoon(); });
    $('#doubleStrip').addEventListener('change', (e) => { state.double = e.target.checked; });
    $('#btnPng').addEventListener('click', () => download('image/png'));
    $('#btnJpg').addEventListener('click', () => download('image/jpeg'));
    $('#btnShare').hidden = !canShareFiles();
    $('#btnShare').addEventListener('click', share);
    $('#btnRetake').addEventListener('click', () => goStep(2));
    $('#btnRestart').addEventListener('click', () => {
      state.photos = state.layout ? state.layout.slots.map(() => null) : [];
      filterCache.clear();
      state.current = 0;
      goStep(1);
    });

    // keyboard: space = snap selected pose while on the shoot step
    document.addEventListener('keydown', (e) => {
      if (state.step === 2 && e.code === 'Space' && !/INPUT|SELECT|TEXTAREA|BUTTON/.test(document.activeElement.tagName)) {
        e.preventDefault();
        snapOne();
      }
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopCamera();
      else if (state.step === 2) startCamera();
    });
  }

  // Make sure canvas fonts are loaded, then re-render if we're designing
  function preloadFonts() {
    if (!document.fonts || !document.fonts.load) return;
    const specs = ['40px "Lilita One"', '40px Pacifico', '600 40px Fredoka', 'italic 600 40px "Playfair Display"', '40px "Bebas Neue"', '700 40px "Courier Prime"'];
    Promise.all(specs.map((s) => document.fonts.load(s).catch(() => {}))).then(() => {
      renderDesignThumbs();
      if (state.step === 3) { renderPreview(); renderThemeThumbs(); }
    });
  }

  function hideLoaderWhenReady() {
    const loader = $('#loader');
    if (!loader) return;
    const hide = () => { loader.classList.add('done'); setTimeout(() => loader.remove(), 600); };
    loader.addEventListener('click', hide);
    const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    Promise.all([fontsReady.catch(() => {}), wait(1900)]).then(hide);
  }

  hideLoaderWhenReady();
  buildLayoutGrid();
  buildDesignGrid();
  $('#frameInput').addEventListener('change', (e) => { useCustomFrame(e.target.files[0]); e.target.value = ''; });
  buildThemeGrid();
  buildFilterRow();
  bind();
  preloadFonts();
  goStep(1);
})();
