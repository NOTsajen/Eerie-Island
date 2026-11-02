import { ROSTER } from './NPCManager.js';

const OUT = 0x1d1426;
const shade = c => ((((c >> 16) & 255) * 0.74 | 0) << 16) | ((((c >> 8) & 255) * 0.74 | 0) << 8) | ((c & 255) * 0.74 | 0);
const lite = c => (Math.min(255, ((c >> 16) & 255) + 38) << 16) | (Math.min(255, ((c >> 8) & 255) + 38) << 8) | Math.min(255, (c & 255) + 38);

// Every sprite is recorded as coloured rectangles, flattened to a grid, then given a dark 1px outline.
let REC = null;
const R = (c, x, y, w, h) => { if (REC) REC.push([c, x, y, w, h]); };
const NO_OUTLINE = /^(grass|sand|water|pond|path|floor|fire|hat_|f_rug|dirt|dec|furrow|cliff|dec)/;

function paintTex(scene, g, key, w, h, fn, outline) {
  REC = []; fn(); const rec = REC; REC = null;
  const pad = outline ? 1 : 0, W = w + pad * 2, H = h + pad * 2, cells = new Array(W * H).fill(-1);
  rec.forEach(([c, x, y, cw, ch]) => { for (let j = 0; j < ch; j++) for (let i = 0; i < cw; i++) { const px = x + i, py = y + j; if (px >= 0 && py >= 0 && px < w && py < h) cells[(py + pad) * W + px + pad] = c; } });
  const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? -1 : cells[y * W + x]);
  g.clear();
  for (let y = 0; y < H; y++) {
    let x = 0;
    while (x < W) {
      let c = at(x, y);
      if (c < 0 && outline && (at(x - 1, y) >= 0 || at(x + 1, y) >= 0 || at(x, y - 1) >= 0 || at(x, y + 1) >= 0)) c = OUT;
      if (c < 0) { x++; continue; }
      let e = x + 1;
      while (e < W) { let c2 = at(e, y); if (c2 < 0 && outline && (at(e - 1, y) >= 0 || at(e + 1, y) >= 0 || at(e, y - 1) >= 0 || at(e, y + 1) >= 0)) c2 = OUT; if (c2 !== c) break; e++; }
      g.fillStyle(c, 1); g.fillRect(x, y, e - x, 1); x = e;
    }
  }
  if (scene.textures.exists(key)) scene.textures.remove(key);
  g.generateTexture(key, W, H);
}

// Tall 16x24 character, painted with outfit options (shirt, sweater, overalls, apron, scrubs, coat, dress, robe).
export function drawPerson(o) {
  const skin = o.skin ?? 0xe8b48a, sk2 = shade(skin), hair = o.hair ?? 0x3b2a1a, top = o.shirt ?? 0x2f9fe3, top2 = shade(top);
  const pants = o.pants ?? 0x3a3f6a, pants2 = shade(pants), shoe = o.shoe ?? 0x3a2418, out = o.outfit || 'shirt', style = o.style || 'short';
  const WHITE = 0xf5f0e0, W2 = 0xd8d0bc;
  // hair behind the body
  if (style === 'long') R(hair, 3, 2, 10, 9);
  // legs and shoes
  if (out !== 'robe') {
    R(pants, 5, 16, 3, 6); R(pants, 8, 16, 3, 6); R(pants2, 7, 17, 1, 5); R(pants2, 10, 16, 1, 6);
    R(shoe, 4, 22, 4, 2); R(shoe, 8, 22, 4, 2); R(lite(shoe), 5, 22, 2, 1);
  } else { R(sk2, 5, 21, 3, 1); R(sk2, 8, 21, 3, 1); R(0x8a5a2b, 5, 22, 3, 2); R(0x8a5a2b, 8, 22, 3, 2); }
  // torso and arms
  R(top, 4, 8, 8, 8); R(top2, 10, 8, 2, 8); R(lite(top), 4, 8, 1, 6);
  R(top, 2, 9, 2, 4); R(top2, 12, 9, 2, 4); R(skin, 2, 13, 2, 3); R(sk2, 12, 13, 2, 3); R(lite(top), 2, 9, 1, 3);
  // outfits
  if (out === 'sweater') { R(o.stripe ?? 0xf5f0e0, 4, 10, 8, 1); R(o.stripe ?? 0xf5f0e0, 4, 13, 8, 1); R(o.stripe ?? 0xf5f0e0, 2, 11, 2, 1); R(o.stripe ?? 0xf5f0e0, 12, 11, 2, 1); }
  if (out === 'overalls') { const b = o.bib ?? 0x2f5aa8; R(b, 5, 11, 6, 5); R(b, 5, 9, 1, 2); R(b, 10, 9, 1, 2); R(shade(b), 9, 11, 2, 5); R(0xffd24a, 5, 11, 1, 1); R(0xffd24a, 10, 11, 1, 1); R(b, 5, 16, 3, 5); R(b, 8, 16, 3, 5); R(shade(b), 7, 17, 1, 4); R(shade(b), 10, 16, 1, 5); R(lite(b), 6, 12, 2, 1); }
  if (out === 'apron' || out === 'dress') {
    R(top, 3, 15, 10, 6); R(top2, 11, 15, 2, 6); R(lite(top), 3, 15, 1, 5); R(shade(top), 3, 20, 10, 1);
    R(skin, 5, 21, 2, 1); R(skin, 9, 21, 2, 1);
    if (out === 'apron') { R(WHITE, 5, 10, 6, 11); R(W2, 9, 10, 2, 11); R(W2, 5, 20, 6, 1); R(WHITE, 5, 9, 1, 1); R(WHITE, 10, 9, 1, 1); R(0xe8d890, 7, 14, 2, 2); }
  }
  if (out === 'scrubs') { R(WHITE, 7, 10, 2, 4); R(WHITE, 6, 11, 4, 2); R(0xd03a3a, 7, 11, 2, 2); }
  if (out === 'coat') {
    R(WHITE, 3, 8, 10, 13); R(W2, 11, 8, 2, 13); R(WHITE, 2, 9, 2, 5); R(W2, 12, 9, 2, 5); R(skin, 2, 13, 2, 3); R(sk2, 12, 13, 2, 3);
    R(0x3a78c8, 7, 8, 2, 5); R(0x1d1426, 8, 13, 1, 8); R(W2, 4, 17, 3, 1); R(0xd03a3a, 4, 11, 1, 1);
    R(pants, 5, 21, 3, 1); R(pants, 8, 21, 3, 1);
  }
  if (out === 'robe') {
    const c = o.robe ?? 0xf28c28, c2 = shade(c);
    R(c, 3, 8, 10, 14); R(c2, 11, 8, 2, 14); R(lite(c), 3, 8, 1, 12); R(c, 2, 9, 2, 5); R(c2, 12, 9, 2, 5); R(skin, 2, 13, 2, 3); R(sk2, 12, 13, 2, 3);
    R(0xffd24a, 3, 21, 10, 1); R(c2, 8, 12, 1, 9); R(0xf5f0e0, 4, 9, 2, 1); R(0xf5f0e0, 5, 10, 2, 1); R(0xf5f0e0, 6, 11, 2, 1); R(0xf5f0e0, 7, 12, 2, 1); R(0xf5f0e0, 8, 13, 2, 1);
    R(0x6b3a1a, 6, 9, 4, 1); R(0x6b3a1a, 7, 10, 2, 1);
  }
  // head
  R(skin, 4, 1, 8, 7); R(sk2, 11, 2, 1, 5); R(skin, 3, 4, 1, 2); R(sk2, 12, 4, 1, 2);
  R(0x1d1426, 6, 4, 1, 2); R(0x1d1426, 9, 4, 1, 2); R(0xf09a8a, 5, 6, 1, 1); R(0xf09a8a, 10, 6, 1, 1); R(0xb0584a, 7, 6, 2, 1);
  if (o.glasses) { R(0x2a2a40, 5, 3, 3, 1); R(0x2a2a40, 8, 3, 3, 1); R(0x2a2a40, 5, 6, 3, 1); R(0x2a2a40, 8, 6, 3, 1); R(0x2a2a40, 5, 4, 1, 2); R(0x2a2a40, 7, 4, 2, 1); R(0x2a2a40, 10, 4, 1, 2); }
  // hair, hats
  if (out === 'robe') { R(0x1d1426, 4, 1, 8, 1); R(0x1d1426, 7, 0, 2, 1); R(0xd23a2a, 7, 2, 2, 1); R(0xf5f0e0, 6, 3, 4, 1); }
  else if (style === 'cap') { const c = o.cap ?? 0xd94a4a; R(c, 4, 0, 8, 3); R(lite(c), 5, 0, 3, 1); R(shade(c), 3, 3, 10, 1); R(hair, 3, 2, 1, 3); R(hair, 12, 2, 1, 3); }
  else {
    R(hair, 4, 0, 8, 3); R(lite(hair), 5, 0, 3, 1); R(hair, 3, 1, 1, 4); R(hair, 12, 1, 1, 4); R(hair, 4, 3, 2, 1); R(hair, 9, 3, 3, 1); R(shade(hair), 10, 1, 2, 2);
    if (style === 'bun') { R(hair, 6, -1, 4, 1); R(lite(hair), 7, -1, 2, 1); }
    if (style === 'long') { R(hair, 3, 5, 1, 6); R(hair, 12, 5, 1, 6); }
  }
}

// Used by the character creator to rebuild the player's texture.
export function makeChar(scene, key, o) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  paintTex(scene, g, key, 16, 24, () => drawPerson(o), true); g.destroy();
}

function pine(r, cx, top, h, half) {
  const G = [0x1f6a34, 0x2f9a45, 0x4cc65a, 0x8ae070];
  for (let i = 0; i < h; i++) {
    const hw = Math.round(half * (i + 1) / h), x0 = cx - hw, w = hw * 2 + 1, y = top + i;
    r(G[1], x0, y, w, 1); r(G[2], x0, y, Math.max(1, Math.round(w * 0.35)), 1); r(G[0], x0 + w - Math.max(1, Math.round(w * 0.3)), y, Math.max(1, Math.round(w * 0.3)), 1);
    if (i % 3 === 2) r(G[0], x0, y, w, 1);
    if (i === 1) r(G[3], cx - 1, y, 2, 1);
  }
}

// Front-facing cottage: tiled roof, plank or plaster walls, windows with flower boxes, a door.
function house(w, h, o) {
  const top = 3, roofH = Math.round(h * 0.46), wy = top + roofH;
  if (o.chim) { R(0x8a8f99, w - 13, 0, 5, roofH); R(0x5d6168, w - 13, 0, 5, 1); R(0xb4bac6, w - 13, 1, 1, roofH - 2); }
  for (let y = 0; y < roofH; y++) {
    const ins = Math.floor((roofH - 1 - y) * 0.7), x0 = ins, x1 = w - ins, band = y % 3 === 2;
    R(band ? o.roofD : o.roof, x0, top + y, x1 - x0, 1); R(o.roofL, x0, top + y, 2, 1); R(o.roofD, x1 - 2, top + y, 2, 1);
    if (!band && y % 2 === 0) for (let x = x0 + 4; x < x1 - 2; x += 6) R(o.roofL, x, top + y, 2, 1);
  }
  R(o.roofD, 0, wy - 1, w, 1);
  R(o.wall, 2, wy, w - 4, h - wy); R(o.wallD, 2, wy, w - 4, 2); R(o.wallD, w - 5, wy, 3, h - wy);
  for (let y = wy + 5; y < h - 2; y += 3) R(o.line, 2, y, w - 4, 1);
  R(o.base, 2, h - 2, w - 4, 2);
  const dh = Math.min(10, h - wy - 3), dx = Math.floor(w / 2) - 2;
  R(o.trim, dx - 1, h - dh - 1, 7, dh + 1); R(o.door, dx, h - dh, 5, dh); R(shade(o.door), dx, h - dh, 1, dh); R(lite(o.door), dx + 2, h - dh + 1, 2, 2); R(0xffd24a, dx + 3, h - 4, 1, 1);
  if (w >= 30) {
    [5, w - 10].forEach(wx => {
      R(o.trim, wx - 1, wy + 3, 7, 7); R(o.glass || 0x8fdcff, wx, wy + 4, 5, 5); R(0xe8faff, wx, wy + 4, 2, 2); R(o.trim, wx + 2, wy + 4, 1, 5); R(o.trim, wx, wy + 6, 5, 1);
      R(0x8a5a2b, wx - 1, wy + 10, 7, 2); [0xff5a8a, 0xffd24a, 0xff7a3a].forEach((c, i) => R(c, wx + i * 2, wy + 9, 1, 1)); R(0x2fbf4a, wx, wy + 10, 5, 1);
    });
  }
}

export function makeArt(scene) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  const r = R;
  const tex = (key, w, h, fn) => paintTex(scene, g, key, w, h, fn, !NO_OUTLINE.test(key));
  const bmp = (key, rows, pal) => tex(key, rows[0].length, rows.length, () => rows.forEach((row, y) => { for (let x = 0; x < row.length; x++) { const c = pal[row[x]]; if (c !== undefined) r(c, x, y, 1, 1); } }));

  // ---- Terrain (saturated jungle palette)
  tex('grass', 32, 32, () => {
    r(0x3dbb3d, 0, 0, 32, 32); r(0x2fa032, 4, 6, 3, 2); r(0x2fa032, 19, 3, 3, 2); r(0x2fa032, 24, 22, 3, 2); r(0x2fa032, 9, 25, 3, 2);
    r(0x5fd35a, 12, 12, 1, 3); r(0x5fd35a, 27, 9, 1, 3); r(0x5fd35a, 3, 18, 1, 3); r(0x5fd35a, 17, 28, 1, 3);
    r(0xff7ab0, 7, 10, 2, 2); r(0xffe14a, 22, 18, 2, 2); r(0xffffff, 14, 26, 2, 2);
  });
  tex('sand', 16, 16, () => { r(0xffe08a, 0, 0, 16, 16); r(0xe3c56e, 3, 4, 2, 1); r(0xfff0b0, 10, 11, 2, 1); r(0xe3c56e, 12, 3, 1, 1); });
  tex('water', 16, 16, () => { r(0x1f8cf0, 0, 0, 16, 16); r(0x7ad4ff, 2, 4, 5, 1); r(0x7ad4ff, 9, 11, 5, 1); r(0x1468c0, 6, 8, 3, 1); r(0xffffff, 12, 3, 1, 1); r(0xffffff, 4, 13, 1, 1); r(0x4ab4ff, 10, 6, 3, 1); });
  tex('pond', 48, 32, () => { r(0x1768b0, 6, 0, 36, 32); r(0x1768b0, 2, 3, 44, 26); r(0x1f84d8, 8, 3, 32, 26); r(0x1f84d8, 4, 6, 40, 20); r(0x8fd8ff, 10, 8, 10, 2); r(0x8fd8ff, 28, 18, 9, 2); });

  // ---- Resources
  tex('tree', 22, 30, () => {
    r(0x6b4423, 9, 17, 4, 13); r(0x4e2f16, 9, 17, 1, 13); r(0x1d6b2a, 1, 8, 20, 12); r(0x2a8f35, 3, 3, 16, 12); r(0x3fb847, 6, 0, 10, 9);
    r(0x7be05c, 8, 2, 4, 3); r(0x7be05c, 4, 8, 3, 2); r(0x7be05c, 14, 10, 3, 2); r(0xe84a8a, 12, 6, 2, 2); r(0x1d6b2a, 3, 19, 1, 6); r(0x1d6b2a, 17, 19, 1, 7);
  });
  tex('palm', 22, 30, () => {
    r(0xb07a3a, 10, 10, 3, 20); r(0x8a5a2b, 10, 14, 3, 1); r(0x8a5a2b, 10, 20, 3, 1); r(0xb07a3a, 11, 6, 3, 6);
    r(0x2fbf4a, 1, 4, 9, 3); r(0x2fbf4a, 13, 4, 9, 3); r(0x1f9a3a, 4, 0, 14, 4); r(0x2fbf4a, 5, 6, 12, 2); r(0x1f9a3a, 0, 7, 5, 2); r(0x1f9a3a, 17, 7, 5, 2);
    r(0x5a3b1f, 10, 8, 2, 2); r(0x5a3b1f, 13, 8, 2, 2);
  });
  tex('rock', 14, 10, () => { r(0x8d94a6, 1, 3, 12, 7); r(0xb4bbcc, 3, 1, 8, 4); r(0x666d7e, 1, 8, 12, 2); r(0x4cc24a, 3, 1, 4, 2); });
  tex('bush', 12, 10, () => { r(0x23a040, 0, 3, 12, 7); r(0x3fcf5a, 2, 0, 8, 5); r(0xff3355, 3, 4, 2, 2); r(0xff3355, 8, 6, 2, 2); r(0xff3355, 6, 2, 2, 2); });
  tex('fire', 10, 12, () => { r(0x5a3b1f, 0, 9, 10, 3); r(0xff5a1c, 1, 4, 8, 6); r(0xff9a1c, 2, 2, 6, 7); r(0xffe04a, 3, 5, 4, 5); r(0xffffff, 4, 7, 2, 3); });
  tex('plane', 52, 30, () => {
    r(0x3a2a1a, 2, 22, 48, 6); r(0xd0d6dc, 6, 8, 40, 14); r(0xe8edf0, 8, 8, 34, 4); r(0x9aa2ac, 6, 18, 40, 4); r(0xd0d6dc, 2, 11, 6, 8);
    r(0xd94a4a, 40, 2, 10, 10); r(0xb03a3a, 44, 4, 6, 6); r(0x6aa8d0, 10, 11, 4, 3); r(0x6aa8d0, 16, 11, 4, 3); r(0x6aa8d0, 22, 11, 4, 3);
    r(0x2a2a2a, 28, 8, 8, 6); r(0x2a2a2a, 14, 18, 6, 4); r(0x8a8f99, 14, 0, 18, 6); r(0x6a6f78, 14, 4, 18, 2); r(0x555a63, 20, 22, 10, 3);
  });

  // ---- Buildings
  tex('cabin', 32, 28, () => {
    r(0xb07a43, 2, 10, 28, 18); for (let y = 12; y < 28; y += 3) r(0x8a5a2b, 2, y, 28, 1);
    r(0xe8b83a, 0, 5, 32, 8); r(0xcf9a2a, 2, 2, 28, 4); r(0xf5d15a, 6, 0, 20, 3);
    r(0x4a2c14, 13, 16, 6, 12); r(0x9fe0ff, 4, 15, 5, 5); r(0x9fe0ff, 23, 15, 5, 5);
  });
  tex('house', 40, 36, () => {
    r(0xece0c4, 3, 14, 34, 22); r(0xc9bd9f, 3, 32, 34, 4); r(0xd8442a, 0, 6, 40, 10); r(0xf06a4a, 2, 3, 36, 4); r(0xb03018, 0, 14, 40, 2); r(0xf06a4a, 8, 0, 24, 4);
    r(0x8a8f99, 30, 0, 5, 10); r(0x2a5f9e, 17, 21, 7, 15); r(0xffe28a, 6, 20, 7, 7); r(0xffe28a, 28, 20, 7, 7); r(0xff5a8a, 6, 27, 7, 2); r(0xff5a8a, 28, 27, 7, 2);
  });
  tex('castle', 56, 52, () => {
    r(0x9aa0b0, 8, 18, 40, 34); for (let y = 20; y < 52; y += 4) r(0x727888, 8, y, 40, 1); for (let x = 12; x < 48; x += 8) r(0x727888, x, 20, 1, 32);
    for (let x = 8; x < 48; x += 8) r(0xb8bece, x, 14, 5, 5);
    [0, 44].forEach(x => { r(0xaab0c0, x, 8, 12, 44); r(0x2a8f9e, x - 1, 0, 14, 9); r(0x3fc0d0, x + 1, 1, 10, 3); r(0x727888, x + 4, 22, 4, 6); r(0x727888, x + 4, 36, 4, 6); });
    r(0x2a1a14, 22, 32, 12, 20); r(0x2a1a14, 24, 30, 8, 3); r(0xd94a4a, 26, 4, 4, 12); r(0x8a5a2b, 27, 2, 1, 4); r(0xffe28a, 17, 24, 4, 5); r(0xffe28a, 35, 24, 4, 5);
  });
  tex('barn', 40, 32, () => {
    r(0xc0392b, 2, 10, 36, 22); for (let x = 5; x < 38; x += 4) r(0x9a2a1e, x, 10, 1, 22);
    r(0x7a2a1a, 0, 4, 40, 8); r(0x9a3a2a, 4, 0, 32, 5); r(0xf5f0e0, 12, 17, 16, 15); r(0x8a2a1e, 13, 18, 14, 13);
    r(0xf5f0e0, 13, 18, 1, 13); r(0xf5f0e0, 26, 18, 1, 13); r(0xe0b040, 17, 5, 6, 5);
  });
  tex('silo', 18, 36, () => { r(0xb8bec8, 2, 6, 14, 30); for (let y = 10; y < 36; y += 6) r(0x8a909c, 2, y, 14, 1); r(0xc0392b, 0, 2, 18, 5); r(0xd94a4a, 3, 0, 12, 3); r(0x4a4f58, 7, 26, 4, 10); });
  tex('windmill', 28, 40, () => { r(0xd8c8a0, 8, 14, 12, 26); r(0xb8a880, 8, 14, 3, 26); r(0x6b4423, 11, 28, 6, 12); r(0xc0392b, 6, 10, 16, 5); r(0x6b4423, 13, 11, 2, 2);
    for (let i = 0; i < 12; i++) { r(0xf5f0e0, 14 + i, 12 - i, 1, 1); r(0xf5f0e0, 13 - i, 12 + i, 1, 1); r(0xf5f0e0, 13 - i, 12 - i, 1, 1); r(0xf5f0e0, 14 + i, 12 + i, 1, 1); } });
  tex('pen', 34, 26, () => { r(0x7a5a30, 0, 0, 34, 2); r(0x7a5a30, 0, 24, 34, 2); r(0x7a5a30, 0, 0, 2, 26); r(0x7a5a30, 32, 0, 2, 26); for (let x = 4; x < 32; x += 6) { r(0x9a7a48, x, 0, 2, 4); r(0x9a7a48, x, 22, 2, 4); } r(0xd8c070, 4, 6, 26, 14); r(0xc0a850, 8, 10, 6, 2); r(0xc0a850, 20, 14, 6, 2); });
  tex('storehouse', 30, 26, () => { r(0x8a5a2b, 1, 8, 28, 18); for (let x = 3; x < 29; x += 4) r(0x6b4423, x, 8, 1, 18); r(0x5a3a1e, 0, 2, 30, 8); r(0x7a4a28, 3, 0, 24, 4); r(0x3a2410, 11, 14, 8, 12); r(0xd0a040, 17, 20, 1, 2); });
  tex('kitchen', 30, 28, () => { r(0xe8d8b0, 2, 10, 26, 18); r(0xc0392b, 0, 6, 30, 6); r(0x9a2a1e, 3, 2, 24, 5); r(0x4a4f58, 20, 0, 5, 8); r(0x2a2a30, 5, 15, 10, 13); r(0xff8a1c, 7, 20, 6, 4); r(0x9aa0a8, 18, 16, 8, 6); r(0xf5f0e0, 20, 14, 4, 2); });
  tex('temple', 40, 46, () => {
    r(0xd8cdb8, 2, 36, 36, 10); r(0xb8ad98, 2, 36, 36, 2); r(0xe8dcc4, 6, 24, 28, 14);
    r(0xf28c28, 8, 14, 24, 12); r(0xd06a10, 11, 8, 18, 7); r(0xf28c28, 14, 3, 12, 6); r(0xd06a10, 17, 0, 6, 4); r(0xffd24a, 19, 0, 2, 2);
    for (let y = 16; y < 26; y += 3) r(0xd06a10, 8, y, 24, 1);
    r(0x3a1e10, 16, 28, 8, 18); r(0xffd24a, 19, 33, 2, 3); r(0xc0392b, 4, 24, 3, 12); r(0xc0392b, 33, 24, 3, 12);
    r(0xffd24a, 2, 36, 2, 2); r(0xffd24a, 36, 36, 2, 2); r(0xc0392b, 34, 6, 1, 8); r(0xffe04a, 35, 6, 4, 3);
  });
  tex('gate', 16, 16, () => { r(0x5a3b1f, 0, 2, 3, 14); r(0x5a3b1f, 13, 2, 3, 14); r(0xc89a5a, 3, 5, 10, 2); r(0xc89a5a, 3, 10, 10, 2); r(0x8a5a2b, 7, 5, 2, 7); r(0xffd24a, 6, 8, 1, 2); });
  tex('well', 14, 16, () => { r(0x6b4423, 1, 2, 2, 10); r(0x6b4423, 11, 2, 2, 10); r(0xc0392b, 0, 0, 14, 4); r(0x9aa0a8, 1, 9, 12, 7); r(0x727888, 1, 14, 12, 2); r(0x1f84d8, 3, 9, 8, 2); });
  tex('forge', 32, 28, () => {
    r(0x6a6f78, 2, 10, 28, 18); r(0x4a4f58, 0, 6, 32, 6); r(0x4a4f58, 22, 0, 6, 14); r(0x2a2a30, 22, 0, 6, 2);
    r(0x1a1a1e, 9, 14, 14, 12); r(0xff8a1c, 11, 16, 10, 8); r(0xffe04a, 13, 19, 6, 5); r(0x2a2a30, 2, 22, 8, 4); r(0x2a2a30, 4, 20, 4, 2);
  });
  tex('lab', 32, 28, () => {
    r(0xe4eef2, 2, 10, 28, 18); r(0x2aa08a, 0, 6, 32, 6); r(0x1f7a6a, 0, 11, 32, 2); r(0x9aa0a8, 15, 0, 2, 7); r(0xff3355, 14, 0, 4, 2);
    r(0x6af0ff, 5, 15, 7, 6); r(0x6af0ff, 20, 15, 7, 6); r(0x2a5f9e, 13, 18, 6, 10); r(0xb0f8ff, 6, 16, 2, 2); r(0xb0f8ff, 21, 16, 2, 2);
  });
  tex('wall', 16, 16, () => { r(0x8f95a3, 0, 2, 16, 14); r(0xb4bac6, 0, 0, 16, 3); r(0x5d6168, 0, 6, 16, 1); r(0x5d6168, 0, 11, 16, 1); r(0x5d6168, 5, 2, 1, 4); r(0x5d6168, 11, 7, 1, 4); r(0x5d6168, 4, 12, 1, 4); });
  tex('fence', 16, 16, () => { r(0xb07a43, 0, 5, 16, 3); r(0xb07a43, 0, 10, 16, 2); r(0x8a5a2b, 1, 2, 3, 13); r(0x8a5a2b, 12, 2, 3, 13); r(0xd8a060, 1, 2, 3, 1); r(0xd8a060, 12, 2, 3, 1); });
  tex('greenhouse', 32, 28, () => { r(0xc8ecff, 2, 6, 28, 22); r(0x9ad8ff, 4, 8, 10, 8); r(0x6b4423, 0, 4, 32, 3); r(0x6b4423, 15, 6, 2, 22); r(0x6b4423, 0, 26, 32, 2); r(0x3fcf5a, 6, 20, 4, 6); r(0xff3355, 22, 22, 3, 3); });

  // ---- Animals
  bmp('chicken', ['..rr....', '..wwy...', '..ww....', '.wwww...', 'wwwwww..', 'wwwwwww.', '.wwwww..', '..y.y...'], { r: 0xe03030, w: 0xfff8e8, y: 0xf0b020 });
  bmp('pig', ['..d.........', '.pppppppppp.', 'pppppppppppd', 'pkppppppppp.', 'pppppppppppp', '.pppppppppp.', '.pp..pp..pp.', '.dd..dd..dd.'], { p: 0xf8aab8, d: 0xd9808e, k: 0x222222 });
  bmp('cow', ['ww............', 'wwwwwwwwwwwww.', 'wkkwwwwkkwwwww', 'wwwwkkwwwwkkww', 'wwwwwwwwwwwwww', 'wwwwwwwwwwwwww', '.ww.ww..ww.ww.', '.kk.kk..kk.kk.'], { w: 0xf8f8f0, k: 0x2a2a2a });

  // ---- Night creatures (tiers 1-9; tier 0 'shade' comes from BootScene)
  bmp('cr1', ['..w..w..w...', '.bbbbbbbbbb.', 'bbdbbdbbdbbb', 'bbbbbbbbbbbb', 'gggykggggggg', 'gggggggggggg', '.gggggggggg.'], { b: 0x8a5a2b, d: 0x5a3b1f, w: 0xe8e0c8, g: 0x5a9a2a, y: 0xffd24a, k: 0x111111 });
  bmp('cr2', ['....wwww....', '..wwwwwwww..', '.wwwwppwwww.', '.wrwwpkpwrw.', '.wwwwppwwww.', '..wwwwwwww..', '..l.l..l.l..', '.l..l..l..l.'], { w: 0xf5f0f0, p: 0x7a3ab0, k: 0x111111, r: 0xd03030, l: 0xa04040 });
  bmp('cr3', ['..wwwwww..', '.wwwwwwww.', 'wwwwwwwwww', 'wkkwwwwkkw', 'wkkwwwwkkw', 'wwwwkkwwww', '.wwwwwwww.', '..wkwkwk..', '..wkwkwk..'], { w: 0xe8e4d0, k: 0x2a2030 });
  bmp('cr4', ['...rrrr...', '..rrwwrr..', '.rrrrrrrr.', 'rrwrrrrwrr', 'rrrrrrrrrr', '..ssssss..', '..skssks..', '..ssssss..', '...ssss...', '..ss..ss..'], { r: 0xc03030, w: 0xffffff, s: 0xf0e0c8, k: 0x222222 });
  bmp('cr5', ['...w..w..w....', '..bbbbbbbb..e.', '.bbddbbddbb.e.', '.bbbbbbbbbbbk.', 'nnnnnnnnnnnnnn', '.nnnnnnnnnnnn.'], { b: 0x8a5a2b, d: 0x5a3b1f, w: 0xe8e0c8, n: 0x3a7ac0, e: 0x3a7ac0, k: 0x111111 });
  bmp('cr6', ['pppppppppp', 'pddddddddp', 'pdddyydddp', 'pdddykdddp', 'pddddddddp', 'pddddddddp', 'pppppppppp', 'wwwwwwwwww', '....rr....', '....rr....', '.....r....'], { p: 0x5a2a8a, d: 0x3a1a60, y: 0xffe040, k: 0x111111, w: 0xf0e8d0, r: 0xd03030 });
  bmp('cr7', ['..l........l..', '.l..bbbbbb..l.', 'l..bbgbbgbb..l', 'l.bbbbbbbbbb.l', '.l.bbbbbbbb.l.', '..l.bb..bb.l..', '.l..........l.'], { b: 0x8a3aa0, g: 0x50ff50, l: 0x5a2a6a });
  bmp('cr8', ['...bbbbb........', '..bbbbbbbb......', '.bbbybbbbbbbb...', 'bbbbbbbbbbbbbbbd', 'bwbwbbbbbbbbbbbb', '.bbbbbbbbbbbbbb.', '..bb..bb..bbb...', '..bb..bb..bb....'], { b: 0x2f5a8a, d: 0x1f3a5a, y: 0xffe040, w: 0xffffff });
  bmp('cr9', ['....oooooooo....', '..oooooooooooo..', '.oooooooooooooo.', '.owwoooooooowwo.', '.okwoooooooowko.', '.oooooooooooooo.', '..oooooooooooo..', '.oo.oo.oo.oo.oo.', 'oo..oo.oo.oo..oo', 'oo.oo..oo..oo.oo', 'o..o....oo....o.'], { o: 0xe85a2a, w: 0xffffff, k: 0x111111 });

  // ---- Job hats (overlaid on NPC heads)
  tex('hat_Idle', 1, 1, () => { });
  tex('hat_Farmer', 12, 5, () => { r(0xe8c860, 3, 1, 6, 3); r(0xe8c860, 1, 3, 10, 2); r(0xb8902f, 3, 2, 6, 1); });
  tex('hat_Guard', 12, 5, () => { r(0xb0b8c4, 3, 0, 6, 4); r(0x808890, 2, 3, 8, 2); r(0xd94a4a, 5, 0, 2, 1); });
  tex('hat_Builder', 12, 5, () => { r(0xf2c230, 3, 1, 6, 3); r(0xf2c230, 2, 3, 8, 2); r(0xc89a10, 3, 2, 6, 1); });
  tex('hat_Scavenger', 12, 5, () => { r(0xb03a3a, 3, 2, 6, 3); r(0xb03a3a, 9, 3, 2, 2); });
  tex('hat_Blacksmith', 12, 5, () => { r(0x3a3a40, 3, 1, 6, 3); r(0x55555f, 2, 3, 8, 2); });
  tex('hat_Pandit', 12, 5, () => { r(0xf28c28, 2, 1, 8, 3); r(0xd06a10, 2, 3, 8, 1); r(0xffd24a, 5, 0, 2, 1); });
  tex('hat_Scientist', 12, 5, () => { r(0xf5f5f5, 2, 1, 8, 2); r(0x6ad8ff, 3, 3, 6, 2); });

  // ---- Characters (override the basic ones)
  const LOOK = {
    player: { hair: 0x3b2a1a, shirt: 0x2f9fe3, pants: 0x3a3f6a },
    Ravi: { skin: 0xb87a4a, hair: 0x14101a, style: 'short', outfit: 'robe', robe: 0xf28c28, shirt: 0xf28c28, glasses: true },
    Marisol: { skin: 0xc98a5a, hair: 0x3a2418, style: 'long', outfit: 'apron', shirt: 0x6aa84f, pants: 0x8a6a3a },
    Dana: { skin: 0xe8b48a, hair: 0x14101a, style: 'short', outfit: 'shirt', shirt: 0x2a3f6a, pants: 0x2a2f3a },
    Tomas: { skin: 0xd8a070, hair: 0x6b4423, style: 'cap', cap: 0x6b4a2a, outfit: 'overalls', shirt: 0xb03a3a, bib: 0x2f5aa8, pants: 0x2f5aa8 },
    Yuki: { skin: 0xf2d0b0, hair: 0xe05a8a, style: 'bun', outfit: 'coat', shirt: 0x2a2a3a, pants: 0x3a3a4a }
  };
  tex('player', 16, 24, () => drawPerson(LOOK.player));
  ROSTER.forEach((d, i) => tex('npc' + i, 16, 24, () => drawPerson(LOOK[d.name] || { hair: d.hair, shirt: d.shirt, skin: d.skin, pants: d.pants, style: d.gender === 'F' ? 'long' : 'short', outfit: d.gender === 'F' ? 'dress' : 'shirt' })));

  // ---- Interior furniture
  tex('f_table', 24, 14, () => { r(0xb07a43, 0, 0, 24, 3); r(0xd8a060, 0, 0, 24, 1); r(0x7a5230, 2, 3, 2, 11); r(0x7a5230, 20, 3, 2, 11); r(0xf5f0e0, 6, 0, 12, 1); });
  tex('f_chair', 10, 16, () => { r(0x8a5a2b, 1, 0, 2, 16); r(0xb07a43, 1, 8, 8, 2); r(0x8a5a2b, 7, 10, 2, 6); r(0xb07a43, 1, 1, 3, 7); });
  tex('f_bed', 30, 14, () => { r(0x6b4423, 0, 6, 30, 8); r(0xf5f0e0, 2, 3, 26, 5); r(0x3a8ac0, 10, 3, 18, 6); r(0x5aaae0, 10, 3, 18, 1); r(0xffffff, 3, 2, 7, 4); r(0x6b4423, 0, 0, 2, 14); });
  tex('f_shelf', 18, 30, () => { r(0x6b4423, 0, 0, 18, 30); r(0x3a2418, 1, 1, 16, 28); [4, 12, 20].forEach((y, i) => { r(0x6b4423, 1, y + 6, 16, 2); [0xc0392b, 0x3a8ac0, 0xe0b040, 0x3fa050, 0x8a5acf].forEach((c, j) => r(c, 2 + j * 3, y + (j % 2), 2, 6 - (j % 2))); }); });
  tex('f_lamp', 8, 24, () => { r(0x4a4a4a, 3, 8, 2, 14); r(0xffe28a, 0, 0, 8, 8); r(0xfff2b0, 2, 1, 4, 4); r(0x4a4a4a, 1, 22, 6, 2); });
  tex('f_plant', 12, 18, () => { r(0xb04a2a, 2, 12, 8, 6); r(0x3fcf5a, 5, 2, 2, 10); r(0x2a9f3a, 1, 4, 5, 3); r(0x2a9f3a, 6, 2, 5, 3); r(0x3fcf5a, 0, 8, 5, 2); r(0x3fcf5a, 7, 8, 5, 2); });
  tex('f_rug', 28, 4, () => { r(0xc0392b, 0, 0, 28, 4); r(0xf0d060, 2, 1, 24, 2); });
  tex('f_painting', 16, 14, () => { r(0xc89a3a, 0, 0, 16, 14); r(0x3a7a9a, 2, 2, 12, 10); r(0x2a5a3a, 3, 7, 5, 5); r(0x4a8a4a, 7, 5, 6, 7); r(0xffe28a, 10, 3, 2, 2); });
  tex('f_stove', 16, 16, () => { r(0x4a4f58, 0, 0, 16, 16); r(0x2a2a30, 0, 0, 16, 3); r(0xff8a1c, 3, 6, 10, 6); r(0xffe04a, 5, 8, 6, 4); });
  tex('f_piano', 30, 20, () => { r(0x2a1a14, 0, 0, 30, 20); r(0xf5f0e0, 2, 8, 26, 5); for (let x = 4; x < 27; x += 4) r(0x111111, x, 8, 2, 3); r(0x2a1a14, 2, 14, 3, 6); r(0x2a1a14, 25, 14, 3, 6); r(0x4a3a30, 6, 1, 18, 5); });
  tex('f_clock', 8, 22, () => { r(0x6b4423, 0, 0, 8, 22); r(0xf5f0e0, 1, 2, 6, 6); r(0x222222, 4, 3, 1, 3); r(0xc89a3a, 2, 12, 4, 8); });
  tex('f_chest', 14, 12, () => { r(0x8a5a2b, 0, 2, 14, 10); r(0x6b4423, 0, 5, 14, 2); r(0xffd24a, 6, 6, 2, 3); });
  // ---- Colourful overrides (final look)
  tex('tree', 26, 34, () => {
    R(0x7a4a22, 11, 26, 4, 8); R(0x4e2f16, 11, 26, 1, 8); R(0x9a6a36, 14, 28, 1, 5);
    pine(r, 13, 15, 12, 12); pine(r, 13, 8, 11, 9); pine(r, 13, 1, 10, 6);
    r(0xff7ab0, 6, 21, 2, 2); r(0xffe14a, 18, 18, 2, 2); r(0xffffff, 10, 12, 2, 2); r(0xff7ab0, 17, 6, 2, 2); r(0xffe14a, 9, 4, 2, 2); r(0xff7ab0, 19, 24, 2, 2); r(0xffffff, 5, 15, 1, 1);
  });
  tex('bush', 14, 11, () => {
    r(0x1f7a35, 0, 4, 14, 7); r(0x2fb548, 1, 1, 12, 8); r(0x6ae068, 3, 1, 4, 2); r(0x6ae068, 9, 3, 3, 2); r(0x1f7a35, 1, 8, 12, 3);
    [[3, 5], [8, 6], [6, 3], [10, 3]].forEach(([x, y]) => { r(0xff3355, x, y, 2, 2); r(0xffa0b0, x, y, 1, 1); });
  });
  tex('rock', 16, 12, () => { r(0x7a8296, 1, 4, 14, 8); r(0xa8b0c4, 3, 1, 10, 5); r(0xd0d8ea, 4, 2, 4, 2); r(0x586074, 1, 9, 14, 3); r(0x4cc24a, 3, 1, 5, 2); r(0x7a8296, 9, 6, 1, 4); });
  tex('cabin', 36, 30, () => house(36, 30, { wall: 0xc48a4c, wallD: 0x8a5a2b, line: 0xa87038, base: 0x6b4423, roof: 0xe8892a, roofL: 0xffb454, roofD: 0xc06a18, trim: 0xf5e6c4, door: 0xb8402a, chim: true }));
  tex('house', 42, 38, () => house(42, 38, { wall: 0xf3e6c8, wallD: 0xd8c8a4, line: 0xe4d4b0, base: 0xa89878, roof: 0xe0482c, roofL: 0xff7a52, roofD: 0xb02e18, trim: 0xffffff, door: 0xe0662a, chim: true }));
  tex('kitchen', 32, 28, () => house(32, 28, { wall: 0xf5f0e0, wallD: 0xd8d0bc, line: 0xe6dfcc, base: 0xa89878, roof: 0x2fa8a0, roofL: 0x5fd8c8, roofD: 0x1f7a78, trim: 0xc0392b, door: 0x8a5a2b, chim: true }));
  tex('storehouse', 30, 26, () => house(30, 26, { wall: 0xa87038, wallD: 0x7a4a22, line: 0x8a5a2b, base: 0x5a3a1e, roof: 0x3a78c8, roofL: 0x6aa8f0, roofD: 0x2a5a98, trim: 0xe6d8b0, door: 0x4a2c14 }));
  tex('lab', 34, 30, () => house(34, 30, { wall: 0xd8e0e8, wallD: 0x9aa8b8, line: 0xb8c4d0, base: 0x6a7888, roof: 0x7a5ad8, roofL: 0xa88af8, roofD: 0x5a3aa8, trim: 0x6a7888, door: 0x3a4a5a, glass: 0xfff2a0 }));
  // ---- Reference-style pass: creatures from the creature sheet, terrain, gear sprites.
  const bm = (k, rows, pal) => { const w = Math.max(...rows.map(x => x.length)); bmp(k, rows.map(x => x.padEnd(w, '.')), pal); };
  // Creature tiers (weak to boss): skull, slime, mushroom, snake, eyeball, spiked snail, book, spider, fanged beast, octopus
  bm('shade', ['..wwwwwwww..', '.wwwwwwwwww.', 'wwwwwwwwwwww', 'wwkkwwwwkkww', 'wwkkwwwwkkww', 'wwwwwkkwwwww', '.wwwwwwwwww.', '..wwkwkwkw..', '...wwwwww...', '..ss.ss.ss..'], { w: 0xf0ecdc, s: 0xc8c0a8, k: 0x2a2030 });
  bm('cr1', ['....gggg....', '..gggggggg..', '.ggwwgggwwg.', 'gggkwggkwggg', 'gggggggggggg', 'ggGggggggGgg', '.GGGGGGGGGG.'], { g: 0x4cc24a, G: 0x2a8a3a, w: 0xffffff, k: 0x1a1a22 });
  bm('cr2', ['..rrrrrr..', '.rrwrrrwr.', 'rrrrrrrrrr', 'rwrrrwrrrr', 'rrrrrrrrrr', '..cccccc..', '..ckcckc..', '..cccccc..', '..cccccc..', '.cc....cc.'], { r: 0xc03a3a, w: 0xf5f0e0, c: 0xeee0c8, k: 0x2a2030 });
  bm('cr3', ['..ggg.....', '.gkgwg....', '.gggggr...', '..ggg.....', '...ggggg..', '.....gggg.', '..ggggggg.', '.ggg......', '.gggggggg.', '..GGGGGG..'], { g: 0x3fbf4a, G: 0x1f7a35, k: 0x111111, w: 0xffffff, r: 0xe0384a });
  bm('cr4', ['...wwwwww...', '..wwwwwwww..', '.wwwppppwww.', 'wwwppkkpwwww', 'wwwppkkpwrww', 'wwwwppppwwww', '.wwwwwwwwww.', '..wrwwwwrw..', '..r.r..r.r..', '.r..r..r..r.'], { w: 0xf5f0f0, p: 0x7a3ab0, k: 0x111111, r: 0xc03a4a });
  bm('cr5', ['...w..w..w......', '..bbbbbbbbb..n.n', '.bbddbbddbb..n.n', '.bbbbbbbbbbnnnnn', '.bbddbbddbbnnknn', 'nnnnnnnnnnnnnnnn', '.nnnnnnnnnnnnnn.'], { b: 0x9a6a36, d: 0x6b4423, w: 0xe8e0c8, n: 0x4a8ad0, k: 0x111111 });
  bm('cr6', ['pppppppppp', 'pdddddddpp', 'pddwwwwddp', 'pddwykwddp', 'pddwwwwddp', 'pdddddddpp', 'pppppppppp', 'lllllllllp', 'lllllllll.', '....rr....', '....rr....'], { p: 0x5a2a8a, d: 0x7a3ab0, w: 0xf5f0e0, y: 0xffd24a, k: 0x111111, l: 0xf0e8d0, r: 0xe0384a });
  bm('cr7', ['.l..........l.', 'l..bbbbbbbb..l', '.l.bgbggbgb.l.', 'l.bbbbbbbbbb.l', '.l.bbbbbbbb.l.', '..l.bb..bb.l..', '.l..........l.'], { b: 0x8a3aa0, g: 0x50ff50, l: 0x5a2a6a });
  bm('cr8', ['....BBBBB.......', '..BBBBBBBBB.....', '.BBBrBBBBBBBB...', 'BBBBBBBBBBBBBBBt', 'BwBwBwBBBBBBBBtt', '.bbbbbbbbbbbbb..', '..bb..bb..bbb...', '..bb..bb..bb....'], { B: 0x3a7ab0, b: 0x2a5a8a, w: 0xffffff, r: 0xff4040, t: 0x1f4a70 });
  bm('cr9', ['....oooooooo....', '..oooooooooooo..', '.oooooooooooooo.', '.ooowwooooowwoo.', '.ooobwooooobwoo.', '.oooooooooooooo.', '..oooooooooooo..', '.oo.oo.oo.oo.oo.', 'oo..oo.oo..oo..o', 'o...o..oo...o..o', '.s..s..ss...s..s'], { o: 0xe8582a, w: 0xffffff, b: 0x3a6ad0, s: 0xffd0b0 });

  // Terrain: brighter Stardew-style grass, sandy dirt paths, cobblestone plaza, stone-rimmed pond.
  tex('grass', 32, 32, () => {
    r(0x62c84a, 0, 0, 32, 32); r(0x52b43c, 4, 6, 3, 2); r(0x52b43c, 19, 3, 3, 2); r(0x52b43c, 24, 22, 3, 2); r(0x52b43c, 9, 25, 3, 2);
    r(0x84e060, 12, 12, 1, 3); r(0x84e060, 27, 9, 1, 3); r(0x84e060, 3, 18, 1, 3); r(0x84e060, 17, 28, 1, 3); r(0x44a032, 14, 16, 2, 1); r(0x44a032, 6, 14, 1, 2);
    [[22, 14, 0xffffff], [8, 4, 0xff7ab8], [28, 26, 0xffe83a], [3, 27, 0xffffff], [15, 21, 0xff7ab8], [26, 3, 0xffe83a], [11, 9, 0xffffff]].forEach(([x, y, c]) => { r(c, x, y, 2, 2); });
  });
  tex('path', 16, 16, () => {
    r(0xe8c560, 0, 0, 16, 16); r(0xf5da80, 2, 2, 3, 2); r(0xf5da80, 10, 9, 3, 2); r(0xc9a448, 6, 6, 2, 2); r(0xc9a448, 12, 2, 2, 1); r(0xc9a448, 3, 12, 2, 2); r(0xf5da80, 8, 14, 2, 1);
  });
  tex('floor', 16, 16, () => {
    r(0x6a707c, 0, 0, 16, 16);
    [[0, 0, 7, 7], [8, 0, 8, 7], [0, 8, 5, 8], [6, 8, 10, 8]].forEach(([x, y, w, h], i) => { r(i % 2 ? 0xa6acb8 : 0xb8bec8, x, y, w - 1, h - 1); r(0xd8dce4, x, y, w - 1, 1); });
  });
  tex('pond', 48, 32, () => {
    r(0x8a909c, 0, 0, 48, 32); r(0xb8bec8, 1, 1, 46, 2); r(0x5a606c, 0, 29, 48, 3);
    r(0x1f84d8, 3, 3, 42, 25); r(0x4aa8f0, 6, 6, 12, 2); r(0x4aa8f0, 26, 17, 10, 2); r(0x7ad0ff, 8, 6, 4, 1);
  });

  // Gear drawn on the character (tier 1 leather, 2 dark iron, 3 steel)
  const GT = [null, { a: 0x8a5a2b, b: 0xb87a3a, c: 0x5a3a1e }, { a: 0x3a3f58, b: 0x5a6288, c: 0xc03a4a }, { a: 0x9aa2b4, b: 0xe0e6f0, c: 0x4a78d0 }];
  for (let t = 1; t <= 3; t++) {
    const P = GT[t];
    bm('g_helm' + t, ['..aaaaaa..', '.abbbbbba.', 'abbbbbbbba', 'abccccccba', 'aa......aa'.replace(/\./g, t === 3 ? 'c' : '.')], P);
    bm('g_chest' + t, ['aa.bbbb.aa', 'abbbbbbbba', 'abbccccbba', '.abbbbbba.', '.abbbbbba.', '..aaaaaa..', '..cc..cc..'], P);
    bm('g_boots' + t, ['aaa..aaa', 'abb..abb', 'aaa..aaa'], P);
    bm('g_sword' + t, t === 1 ? ['.s.', 'sSs', 'sSs', 'sSs', 'sSs', 'sSs', 'sSs', 'sSs', 'wWw', '.w.'] : ['.s.', 'sSs', 'sSs', 'sSs', 'sSs', 'sSs', 'sSs', 'wWw', 'ycy', '.w.'],
      { s: t === 1 ? 0xc89a5a : t === 2 ? 0xb8bec8 : 0xcfeeff, S: t === 1 ? 0xe0b878 : t === 2 ? 0xe8ecf4 : 0xffffff, w: 0x6b4423, W: 0x8a5a2b, y: 0xffd24a, c: 0xc03a4a });
  }

  // ---- Stardew-style seasonal ground (textured, tufts, dirt specks) and leafy trees
  const rng = seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const GP = [
    { b: 0x68c84c, d: 0x52b03c, l: 0x8ae060, x: 0x4a9a34, f: [0xffffff, 0xff7ab8, 0xffe83a] },
    { b: 0x4eb040, d: 0x3a9a32, l: 0x70d058, x: 0x2f8228, f: [0xffe83a, 0xffffff] },
    { b: 0xa8a03c, d: 0x8e8630, l: 0xc8bc50, x: 0x786e26, f: [0xe07a24, 0xc83a20] },
    { b: 0xe4eef8, d: 0xc8d8ea, l: 0xffffff, x: 0xa8bcd4, f: [0xffffff] }
  ];
  GP.forEach((P, i) => tex('grass_' + i, 32, 32, () => {
    const q = rng(11 + i * 7);
    r(P.b, 0, 0, 32, 32);
    for (let n = 0; n < 26; n++) { const x = (q() * 29) | 0, y = (q() * 29) | 0; r(P.d, x, y, 3, 2); }
    for (let n = 0; n < 16; n++) { const x = (q() * 30) | 0, y = (q() * 28) | 0; r(P.l, x, y, 1, 3); r(P.l, x + 2, y + 1, 1, 2); r(P.x, x + 1, y + 2, 1, 1); }
    if (i < 3) for (let n = 0; n < 4; n++) r(0xc9a86a, (q() * 30) | 0, (q() * 30) | 0, 1, 1);
    for (let n = 0; n < (i === 3 ? 0 : 3); n++) r(P.f[n % P.f.length], (q() * 29) | 0, (q() * 29) | 0, 2, 2);
  }));
  const blob = (cx, cy, rad, c) => { for (let dy = -rad; dy <= rad; dy++) { const hw = Math.round(Math.sqrt(rad * rad - dy * dy)); r(c, cx - hw, cy + dy, hw * 2 + 1, 1); } };
  const TP = [
    { d: 0x2a7a3a, m: 0x44b048, l: 0x78dc60, a: 0xffb4d4 },
    { d: 0x1f6a30, m: 0x34a03e, l: 0x62cc54, a: 0x8ae070 },
    { d: 0xb4401a, m: 0xe0781e, l: 0xf8b838, a: 0xd8301c },
    { d: 0xb8c8dc, m: 0xe0ecf8, l: 0xffffff, a: 0xffffff }
  ];
  TP.forEach((P, i) => tex('tree_' + i, 30, 38, () => {
    const q = rng(97 + i * 13), B = [[15, 12, 11], [8, 19, 8], [22, 19, 8], [15, 22, 9], [11, 10, 7], [20, 10, 7]];
    r(0x7a4a22, 12, 26, 6, 12); r(0x4e2f16, 12, 26, 2, 12); r(0x9a6a36, 16, 28, 1, 8); r(0x7a4a22, 9, 35, 3, 3); r(0x7a4a22, 18, 35, 3, 3);
    if (i === 3) { r(0x6a4a2a, 14, 14, 2, 14); r(0x6a4a2a, 9, 10, 2, 8); r(0x6a4a2a, 19, 10, 2, 8); r(0x6a4a2a, 6, 6, 2, 5); r(0x6a4a2a, 22, 6, 2, 5); }
    B.forEach(([x, y, rad]) => blob(x, y, rad, P.d));
    B.forEach(([x, y, rad]) => blob(x - 1, y - 1, rad - 2, P.m));
    B.forEach(([x, y, rad]) => blob(x - 3, y - 3, Math.max(2, rad - 5), P.l));
    for (let n = 0; n < 30; n++) { const x = 4 + ((q() * 22) | 0), y = 2 + ((q() * 26) | 0); r(n % 2 ? P.l : P.d, x, y, 2, 1); r(n % 3 ? P.m : P.l, x + 1, y + 1, 1, 1); }
    if (i === 0) for (let n = 0; n < 9; n++) r(P.a, 5 + ((q() * 20) | 0), 3 + ((q() * 22) | 0), 2, 2);
    if (i === 2) for (let n = 0; n < 6; n++) r(P.a, 5 + ((q() * 20) | 0), 3 + ((q() * 22) | 0), 2, 2);
  }));

  // ---- Map extras: Stardew-orange tilled soil, furrows, seasonal ground decor
  const DP = [[0xd8a04a, 0xc08838, 0xeab862], [0xd29a46, 0xba8434, 0xe4b05c], [0xc08a42, 0xa87634, 0xd8a458], [0x9c8e84, 0x84766c, 0xe8e8ee]];
  DP.forEach(([b, d, l], i) => tex('dirt_' + i, 32, 32, () => {
    const q = rng(301 + i * 5); r(b, 0, 0, 32, 32);
    for (let n = 0; n < 22; n++) r(d, (q() * 29) | 0, (q() * 30) | 0, 3, 2);
    for (let n = 0; n < 14; n++) r(l, (q() * 30) | 0, (q() * 30) | 0, 2, 1);
    for (let n = 0; n < 5; n++) r(0x8a6a3a, (q() * 30) | 0, (q() * 30) | 0, 2, 2);
    if (i === 3) for (let n = 0; n < 8; n++) r(0xffffff, (q() * 30) | 0, (q() * 30) | 0, 2, 1);
  }));
  tex('furrow', 16, 16, () => { r(0x8a5a26, 0, 5, 16, 2); r(0xb07a3a, 0, 7, 16, 1); r(0x8a5a26, 0, 13, 16, 2); r(0xb07a3a, 0, 15, 16, 1); });
  tex('dec_0', 12, 9, () => { r(0x3a9a34, 5, 4, 2, 5); r(0x3a9a34, 2, 6, 1, 3); r(0x3a9a34, 9, 5, 1, 4); r(0xff8ac0, 4, 2, 4, 3); r(0xffe83a, 5, 3, 2, 1); r(0xffffff, 1, 4, 2, 2); r(0xffffff, 9, 3, 2, 2); });
  tex('dec_1', 12, 9, () => { r(0x2f8a2c, 5, 4, 2, 5); r(0x2f8a2c, 2, 6, 1, 3); r(0x2f8a2c, 9, 5, 1, 4); r(0xffe83a, 4, 2, 4, 3); r(0xff7a2a, 5, 3, 2, 1); r(0xff4a6a, 1, 4, 2, 2); r(0xc080ff, 9, 3, 2, 2); });
  tex('dec_2', 12, 9, () => { r(0xb8501c, 1, 4, 10, 4); r(0xe0781e, 2, 3, 8, 3); r(0xf5b030, 4, 2, 4, 2); r(0xd03a20, 1, 6, 3, 2); r(0x8a3a14, 8, 6, 3, 2); });
  tex('dec_3', 12, 9, () => { r(0xc8d8ea, 1, 4, 10, 4); r(0xffffff, 2, 3, 8, 3); r(0xffffff, 4, 2, 4, 1); r(0x6a4a2a, 8, 1, 1, 4); r(0x6a4a2a, 3, 2, 1, 3); });

  tex('cliff', 16, 16, () => { r(0x8a8f9c, 0, 0, 16, 16); r(0xa8aebb, 0, 0, 16, 3); r(0x6a6f7c, 0, 5, 16, 1); r(0x6a6f7c, 0, 11, 16, 1); r(0x6a6f7c, 4, 6, 1, 5); r(0x6a6f7c, 11, 0, 1, 5); r(0x6a6f7c, 8, 12, 1, 4); r(0x585d6a, 0, 14, 16, 2); r(0xb8bec9, 2, 7, 3, 1); r(0xb8bec9, 12, 2, 2, 1); });
  tex('path_bridge', 16, 16, () => { r(0x5a3a1e, 0, 0, 16, 16); r(0xb07a3a, 0, 1, 16, 4); r(0xc88a4a, 0, 1, 16, 1); r(0xb07a3a, 0, 6, 16, 4); r(0xc88a4a, 0, 6, 16, 1); r(0xb07a3a, 0, 11, 16, 4); r(0xc88a4a, 0, 11, 16, 1); r(0x7a4a22, 3, 1, 1, 4); r(0x7a4a22, 10, 6, 1, 4); r(0x7a4a22, 6, 11, 1, 4); });

  tex('dec_shell', 8, 6, () => { r(0xffe8d8, 1, 1, 6, 4); r(0xffb8a0, 2, 2, 1, 3); r(0xffb8a0, 4, 1, 1, 4); r(0xfff8f0, 3, 0, 2, 1); });
  tex('dec_star', 8, 8, () => { r(0xff7a5a, 3, 0, 2, 8); r(0xff7a5a, 0, 3, 8, 2); r(0xffb090, 3, 3, 2, 2); });
  g.destroy();
}
