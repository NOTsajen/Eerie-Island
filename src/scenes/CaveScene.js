import Phaser from 'phaser';

// Procedural cave + dungeon (5 levels). Depth 1-2 = natural caves, 3-4 = brick dungeon, 5 = Guardian's vault.
const TS = 16, MW = 50, MH = 38, MAXD = 5;
const ORE = {
  crack: { hp: 2, item: null, n: 0, c: 0x6a6f78, label: 'Crack' },
  stone: { hp: 3, item: 'stone', n: 1, c: 0x9aa0a8, label: 'Stone' },
  coal: { hp: 3, item: 'charcoal', n: 1, c: 0x2a2a34, label: 'Coal' },
  copper: { hp: 4, item: 'copper', n: 1, c: 0xb87333, label: 'Copper' },
  iron: { hp: 5, item: 'iron', n: 1, c: 0xd8b8a0, label: 'Iron' },
  gold: { hp: 6, item: 'gold', n: 1, c: 0xffd24a, label: 'Gold' },
  ruby: { hp: 7, item: 'ruby', n: 1, c: 0xe0384a, label: 'Ruby' },
  emerald: { hp: 7, item: 'emerald', n: 1, c: 0x3fbf4a, label: 'Emerald' },
  amethyst: { hp: 7, item: 'amethyst', n: 1, c: 0x8a4ad0, label: 'Amethyst' },
  diamond: { hp: 9, item: 'diamond', n: 1, c: 0x8fe0ff, label: 'Diamond' }
};
const ORE_COL = { crack: [0x6a6f78, 0x9aa0a8], stone: [0x8a8f99, 0xb0b5bd], coal: [0x22222a, 0x4a4a55], copper: [0xb87333, 0x3aa07a], iron: [0xd8b8a0, 0xa07860], gold: [0xffd24a, 0xfff2a0], ruby: [0xe0384a, 0xff9ab0], emerald: [0x3fbf4a, 0xb0ffb8], amethyst: [0x8a4ad0, 0xd0a0ff], diamond: [0x8fe0ff, 0xffffff] };
// ore weights by depth
const weights = d => ({ coal: 6, copper: 4, iron: 3 + d, gold: d >= 2 ? 2 + d : 0, ruby: d >= 2 ? 1 : 0, emerald: d >= 2 ? 1 : 0, amethyst: d >= 3 ? 1.5 : 0, diamond: d >= 3 ? d - 1.5 : 0 });
const MOBS = {
  bat: { hp: 3, dm: 4, sp: 52, tex: 'm_bat', d: 1, loot: [['scrap', 0.3]] },
  slime: { hp: 6, dm: 6, sp: 22, tex: 'm_slime', d: 1, loot: [['slime', 0.7], ['berries', 0.2]] },
  skeleton: { hp: 10, dm: 8, sp: 34, tex: 'm_skel', d: 2, loot: [['bone', 0.8], ['scrap', 0.4], ['key', 0.18], ['gold', 0.25]] },
  mimic: { hp: 12, dm: 9, sp: 42, tex: 'm_mimic', d: 1, loot: [['gold', 1], ['diamond', 0.3], ['iron', 0.6]] },
  warden: { hp: 32, dm: 11, sp: 30, tex: 'm_boss', d: 3, loot: [['gold', 1], ['diamond', 0.7], ['key', 1], ['plate', 0.6]] },
  guardian: { hp: 70, dm: 14, sp: 30, tex: 'm_boss', d: 5, loot: [] }
};

export default class CaveScene extends Phaser.Scene {
  constructor() { super('Cave'); }
  init(d) { this.main = d.main; this.depth = d.depth || 1; }

  tex() {
    if (this.textures.exists('c_floor0')) return;
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const r = (c, x, y, w, h) => { g.fillStyle(c, 1); g.fillRect(x, y, w, h); };
    const T = (k, w, h, fn) => { g.clear(); fn(); g.generateTexture(k, w, h); };
    T('c_floor0', 16, 16, () => { r(0x3a3548, 0, 0, 16, 16); r(0x443e56, 2, 3, 3, 2); r(0x2f2b3c, 9, 10, 3, 2); r(0x4c465f, 12, 2, 2, 1); });
    T('c_wall0', 16, 16, () => { r(0x1c1826, 0, 0, 16, 16); r(0x2a2538, 0, 0, 16, 3); r(0x14111c, 3, 8, 8, 4); r(0x332e44, 10, 5, 4, 2); });
    T('c_floor1', 16, 16, () => { r(0x4a4038, 0, 0, 16, 16); r(0x3a322c, 0, 0, 16, 1); r(0x3a322c, 0, 8, 16, 1); r(0x3a322c, 8, 0, 1, 8); r(0x3a322c, 4, 8, 1, 8); r(0x56493f, 11, 11, 2, 2); });
    T('c_wall1', 16, 16, () => { r(0x2a2420, 0, 0, 16, 16); r(0x3c332c, 0, 0, 16, 7); r(0x1a1612, 0, 7, 16, 1); r(0x1a1612, 7, 0, 1, 7); r(0x483d34, 1, 1, 5, 2); r(0x1a1612, 3, 8, 1, 8); r(0x1a1612, 11, 8, 1, 8); });
    Object.entries(ORE_COL).forEach(([k, [a, b]]) => T('c_ore_' + k, 16, 16, () => { r(0x2a2538, 0, 0, 16, 16); r(0x3a3548, 1, 1, 14, 14); r(a, 3, 5, 5, 5); r(a, 9, 3, 4, 5); r(a, 6, 9, 6, 5); r(b, 4, 6, 2, 2); r(b, 10, 4, 2, 2); r(b, 8, 10, 2, 2); }));
    T('c_stairs', 16, 16, () => { r(0x0a0610, 0, 0, 16, 16); for (let i = 0; i < 4; i++) r(0x6a6f78 - i * 0x101010, 1 + i, 1 + i * 4, 14 - i * 2, 3); r(0xffd24a, 7, 6, 2, 4); });
    T('c_up', 16, 16, () => { r(0x8a5a2b, 0, 0, 16, 16); r(0x6b4423, 2, 0, 2, 16); r(0x6b4423, 12, 0, 2, 16); for (let i = 0; i < 4; i++) r(0xc88a4a, 3, 1 + i * 4, 10, 2); });
    T('c_chest', 14, 12, () => { r(0x8a5a2b, 0, 2, 14, 10); r(0x6b4423, 0, 5, 14, 2); r(0xffd24a, 6, 6, 2, 3); r(0xffd24a, 0, 2, 14, 1); });
    T('c_vault', 16, 14, () => { r(0x2a2a34, 0, 2, 16, 12); r(0x4a4f58, 1, 3, 14, 4); r(0x8fe0ff, 6, 6, 4, 4); r(0xffd24a, 7, 7, 2, 2); r(0xd94a4a, 0, 2, 16, 1); });
    T('c_open', 14, 12, () => { r(0x6b4423, 0, 5, 14, 7); r(0x2a1a0e, 1, 6, 12, 3); });
    T('c_mush', 10, 10, () => { r(0xd0c8b8, 4, 5, 2, 5); r(0x3ad0d0, 1, 1, 8, 5); r(0xa0ffff, 3, 2, 2, 2); r(0xa0ffff, 6, 3, 1, 1); });
    T('c_spike', 14, 14, () => { r(0x2a2a34, 0, 0, 14, 14); r(0x9aa0a8, 2, 5, 2, 7); r(0x9aa0a8, 6, 2, 2, 10); r(0x9aa0a8, 10, 5, 2, 7); });
    T('c_spike0', 14, 14, () => { r(0x2a2a34, 0, 0, 14, 14); r(0x4a4f58, 2, 10, 2, 2); r(0x4a4f58, 6, 10, 2, 2); r(0x4a4f58, 10, 10, 2, 2); });
    T('c_water', 16, 16, () => { r(0x1f4a7e, 0, 0, 16, 16); r(0x4a8ad0, 3, 4, 5, 1); r(0x4a8ad0, 9, 10, 4, 1); });
    T('c_torch', 8, 12, () => { r(0x5a3b1f, 3, 5, 2, 7); r(0xe8761c, 1, 1, 6, 5); r(0xffd24a, 3, 2, 2, 3); });
    T('m_bat', 12, 8, () => { r(0x3a2a4a, 4, 2, 4, 5); r(0x2a1a3a, 0, 1, 4, 3); r(0x2a1a3a, 8, 1, 4, 3); r(0xff4040, 5, 3, 1, 1); r(0xff4040, 7, 3, 1, 1); });
    T('m_slime', 12, 10, () => { r(0x3fbf4a, 1, 4, 10, 6); r(0x57d860, 3, 1, 6, 4); r(0x1f7a35, 1, 8, 10, 2); r(0x111111, 3, 5, 2, 2); r(0x111111, 7, 5, 2, 2); });
    T('m_skel', 12, 16, () => { r(0xeee8d8, 3, 0, 6, 5); r(0x111111, 4, 2, 1, 2); r(0x111111, 7, 2, 1, 2); r(0xd8d0bc, 4, 5, 4, 6); r(0xeee8d8, 2, 6, 8, 1); r(0xd8d0bc, 3, 11, 2, 5); r(0xd8d0bc, 7, 11, 2, 5); });
    T('m_boss', 28, 30, () => { r(0x2a1a3a, 4, 8, 20, 22); r(0x4a2a6a, 2, 2, 24, 10); r(0x8a4ad0, 6, 0, 4, 5); r(0x8a4ad0, 18, 0, 4, 5); r(0xff3030, 8, 6, 4, 4); r(0xff3030, 16, 6, 4, 4); r(0xffd24a, 11, 16, 6, 6); r(0x14081f, 0, 14, 5, 14); r(0x14081f, 23, 14, 5, 14); });
    T('c_lava', 16, 16, () => { r(0xc8301a, 0, 0, 16, 16); r(0xff8a1c, 2, 3, 6, 3); r(0xffd24a, 9, 9, 4, 3); r(0x7a1a10, 10, 2, 4, 3); });
    T('c_gas', 24, 24, () => { r(0x4aff4a, 4, 4, 16, 16); r(0x2ad02a, 0, 8, 24, 8); r(0xa0ffa0, 8, 8, 6, 6); });
    T('c_plate', 14, 14, () => { r(0x2a2538, 0, 0, 14, 14); r(0x8a8f99, 2, 2, 10, 10); r(0xd94a4a, 5, 5, 4, 4); });
    T('c_crack', 16, 16, () => { r(0x2a2538, 0, 0, 16, 16); r(0x3a3548, 1, 1, 14, 14); r(0x9aa0a8, 7, 1, 2, 5); r(0x9aa0a8, 5, 6, 2, 3); r(0x9aa0a8, 8, 9, 2, 6); });
    T('m_mimic', 14, 12, () => { r(0x8a5a2b, 0, 2, 14, 10); r(0x6b4423, 0, 5, 14, 2); r(0xffffff, 1, 6, 2, 2); r(0xffffff, 5, 6, 2, 2); r(0xffffff, 9, 6, 2, 2); r(0xff3030, 3, 3, 2, 2); r(0xff3030, 9, 3, 2, 2); });
    g.destroy();
  }

  // ---------- generation
  gen() {
    const d = this.depth, W = MW, H = MH, grid = Array.from({ length: H }, () => Array(W).fill(1));
    const carve = (x, y) => { if (x > 1 && y > 1 && x < W - 2 && y < H - 2) grid[y][x] = 0; };
    const rooms = [];
    const boss = d === MAXD;
    for (let tries = 0; tries < 60 && rooms.length < (boss ? 6 : 10); tries++) {
      const w = Phaser.Math.Between(5, boss && rooms.length === 5 ? 11 : 9), h = Phaser.Math.Between(4, boss && rooms.length === 5 ? 9 : 7), x = Phaser.Math.Between(3, W - w - 3), y = Phaser.Math.Between(3, H - h - 3);
      if (rooms.some(r => x < r.x + r.w + 2 && x + w + 2 > r.x && y < r.y + r.h + 2 && y + h + 2 > r.y)) continue;
      rooms.push({ x, y, w, h, cx: x + (w >> 1), cy: y + (h >> 1) });
    }
    rooms.forEach(r => { for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) carve(x, y); });
    for (let i = 1; i < rooms.length; i++) {
      const a = rooms[i - 1], b = rooms[i]; let x = a.cx, y = a.cy;
      while (x !== b.cx) { carve(x, y); carve(x, y + 1); x += Math.sign(b.cx - x); }
      while (y !== b.cy) { carve(x, y); carve(x + 1, y); y += Math.sign(b.cy - y); }
    }
    if (d <= 2) { // organic cave tunnels
      for (let k = 0; k < 4; k++) { let x = rooms[Phaser.Math.Between(0, rooms.length - 1)].cx, y = rooms[0].cy; for (let i = 0; i < 220; i++) { carve(x, y); carve(x + 1, y); const m = Phaser.Math.Between(0, 3); x += [1, -1, 0, 0][m]; y += [0, 0, 1, -1][m]; x = Phaser.Math.Clamp(x, 3, W - 4); y = Phaser.Math.Clamp(y, 3, H - 4); } }
    }
    return { grid, rooms };
  }

  create() {
    this.tex();
    const sc = this.main, d = this.depth, cam = this.cameras.main;
    this.style = d >= 3 ? 1 : 0;
    cam.setBackgroundColor(0x05030a);
    const { grid, rooms } = this.gen(); this.grid = grid; this.rooms = rooms;
    this.hp = {}; this.oreAt = {};
    // ores
    const wts = weights(d), pool = Object.entries(wts).filter(([, v]) => v > 0);
    const total = pool.reduce((a, [, v]) => a + v, 0);
    const pick = () => { let r = Math.random() * total; for (const [k, v] of pool) { if ((r -= v) <= 0) return k; } return 'coal'; };
    const W = MW, H = MH;
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      if (grid[y][x] !== 1) continue;
      const open = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => grid[y + b][x + a] === 0);
      if (open && Math.random() < 0.2) { this.oreAt[x + ',' + y] = Math.random() < 0.28 ? 'stone' : pick(); }
    }
    // secret room behind a cracked wall
    this.secret = null;
    for (let tr = 0; tr < 120 && !this.secret && Math.random() < 0.8; tr++) {
      const x = Phaser.Math.Between(5, W - 8), y = Phaser.Math.Between(4, H - 7);
      let ok = grid[y + 1][x - 2] === 0 && grid[y + 1][x - 1] === 1;
      for (let yy = y - 1; ok && yy <= y + 3; yy++) for (let xx = x - 1; xx <= x + 3; xx++) if (!(xx === x - 1 && yy === y + 1) && grid[yy][xx] !== 1) ok = false;
      if (!ok) continue;
      for (let yy = y; yy < y + 3; yy++) for (let xx = x; xx < x + 3; xx++) { grid[yy][xx] = 0; delete this.oreAt[xx + ',' + yy]; }
      this.oreAt[(x - 1) + ',' + (y + 1)] = 'crack'; this.secret = { x, y };
    }
    // draw tiles
    this.tiles = this.add.group();
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const o = this.oreAt[x + ',' + y];
      const k = grid[y][x] === 0 ? 'c_floor' + this.style : o === 'crack' ? 'c_crack' : o ? 'c_ore_' + o : 'c_wall' + this.style;
      const im = this.add.image(x * TS, y * TS, k).setOrigin(0).setDepth(0);
      if (o) { this.hp[x + ',' + y] = { hp: ORE[o].hp, im }; }
    }
    this.cx = x => Math.floor(x / TS);
    // start & stairs
    const s0 = rooms[0], last = rooms[rooms.length - 1];
    this.add.image(s0.cx * TS, s0.cy * TS, 'c_up').setOrigin(0).setDepth(1); this.upPos = { x: s0.cx * TS + 8, y: s0.cy * TS + 8 };
    if (d < MAXD) { this.add.image(last.cx * TS, last.cy * TS, 'c_stairs').setOrigin(0).setDepth(1); this.downPos = { x: last.cx * TS + 8, y: last.cy * TS + 8 }; }
    // player
    this.pl = this.add.image(this.upPos.x + 16, this.upPos.y, 'player').setOrigin(0.5, 1).setDepth(5);
    this.fac = new Phaser.Math.Vector2(1, 0); this.atkT = 0; this.hurtT = 0; this.stepT = 0; this.dt = 0;
    // objects
    this.objs = []; this.mobs = [];
    const free = r => ({ x: Phaser.Math.Between(r.x + 1, r.x + r.w - 2) * TS + 8, y: Phaser.Math.Between(r.y + 1, r.y + r.h - 2) * TS + 8 });
    const mid = rooms.slice(1, d < MAXD ? -1 : rooms.length);
    mid.forEach((r, i) => {
      for (let n = 0; n < Phaser.Math.Between(1, 2 + (d > 2 ? 1 : 0)); n++) this.mob(pick2(d), free(r));
      if (Math.random() < 0.5) { const p = free(r); this.obj('chest', p.x, p.y, { mimic: Math.random() < 0.18 }); }
      if (Math.random() < 0.3) { const p = free(r); this.obj('plate', p.x, p.y); }
      if (d === 3 && Math.random() < 0.4) { const p = free(r); this.obj('gas', p.x, p.y); }
      if (d >= 4 && Math.random() < 0.55) { const p = free(r); this.obj('lava', p.x, p.y); }
      if (Math.random() < 0.35) { const p = free(r); this.obj('spike', p.x, p.y); }
      if (Math.random() < 0.3) { const p = free(r); this.obj('mush', p.x, p.y); }
      if (d <= 2 && Math.random() < 0.3) { const p = free(r); this.obj('water', p.x, p.y); }
      if (Math.random() < 0.6) { const p = free(r); this.obj('torch', p.x, p.y); }
    });
    if (d === 2 || d === 4) { const r = mid[0], p = { x: r.cx * TS + 8, y: r.cy * TS + 14 }; this.obj('merchant', p.x, p.y); }
    if (this.secret) { const sx = this.secret.x * TS; this.obj('chest', sx + 10, this.secret.y * TS + 22, { rich: true }); this.obj('chest', sx + 36, this.secret.y * TS + 22, { rich: true }); this.float('?', sx + 24, this.secret.y * TS, '#ffffff'); }
    if (d === 3 || d === 4) { const r = last; this.mob('warden', { x: r.cx * TS + 8, y: r.cy * TS - 10 }); }
    if (d >= 3) { const r = Phaser.Utils.Array.GetRandom(rooms.slice(1, -1)); const p = free(r); this.obj('vault', p.x, p.y); }
    if (d === MAXD) { const r = last; this.mob('guardian', { x: r.cx * TS + 8, y: r.cy * TS + 8 }); this.obj('vault', r.x * TS + 24, r.y * TS + 24, { boss: true }); this.obj('vault', (r.x + r.w - 2) * TS, r.y * TS + 24, { boss: true }); }
    // lighting
    this.dark = this.add.renderTexture(0, 0, 480, 270).setOrigin(0).setScrollFactor(0).setDepth(1000);
    this.lightImg = this.make.image({ x: 0, y: 0, key: 'light', add: false });
    this.keys = this.input.keyboard.addKeys('A,D,W,S,LEFT,RIGHT,UP,DOWN,SPACE,H,ESC,E,Q');
    cam.setBounds(0, 0, W * TS, H * TS).startFollow(this.pl, true, 0.12, 0.12).setRoundPixels(true);
    cam.fadeIn(400, 0, 0, 0);
    this.hud = this.add.text(4, 2, '', { fontFamily: 'monospace', fontSize: '7px', color: '#ffe9a8', stroke: '#000', strokeThickness: 2 }).setScrollFactor(0).setDepth(1100);
    this.add.text(4, 260, 'WASD move · Space mine/attack/open · E eat · H leave at ladder', { fontFamily: 'monospace', fontSize: '6px', color: '#cfd4dc', stroke: '#000', strokeThickness: 2 }).setScrollFactor(0).setDepth(1100);
    sc.ui.toast(d >= 3 ? `Dungeon level ${d}` : `Cave level ${d}`); sc.audio.sfx('craft');
    this.lastTouch = 0;
  }

  obj(k, x, y, o = {}) {
    const key = { chest: 'c_chest', vault: 'c_vault', mush: 'c_mush', spike: 'c_spike0', water: 'c_water', torch: 'c_torch', lava: 'c_lava', gas: 'c_gas', plate: 'c_plate', merchant: 'npc1' }[k];
    const im = this.add.image(x, y, key).setOrigin(0.5, 1).setDepth(k === 'spike' || k === 'water' ? 1 : y / 10);
    if (k === 'water' || k === 'lava') im.setOrigin(0.5, 0.5).setScale(2);
    if (k === 'spike' || k === 'plate') im.setOrigin(0.5, 0.5);
    if (k === 'gas') im.setOrigin(0.5, 0.5).setScale(2).setAlpha(0.45).setDepth(6);
    if (k === 'lava') im.setDepth(1);
    const ob = { k, x, y, im, used: false, t: Math.random() * 3, ...o };
    if (k === 'torch') ob.glow = this.add.image(x, y - 6, 'light').setTint(0xffa030).setAlpha(0.25).setScale(1.1).setBlendMode(Phaser.BlendModes.ADD).setDepth(2);
    if (k === 'lava') ob.glow = this.add.image(x, y, 'light').setTint(0xff6020).setAlpha(0.3).setScale(0.8).setBlendMode(Phaser.BlendModes.ADD).setDepth(2);
    if (k === 'mush') ob.glow = this.add.image(x, y - 4, 'light').setTint(0x40ffff).setAlpha(0.25).setScale(0.5).setBlendMode(Phaser.BlendModes.ADD).setDepth(2);
    this.objs.push(ob); return ob;
  }

  mob(type, p) {
    const T = MOBS[type], boss = type === 'guardian';
    const s = this.add.image(p.x, p.y, T.tex).setOrigin(0.5, 1).setDepth(4);
    const hpMul = 1 + (this.depth - 1) * 0.25;
    if (type === 'warden') s.setScale(0.75).setTint(0x88aaff);
    this.mobs.push({ type, T, s, hp: Math.round(T.hp * (boss || type === 'warden' ? 1 : hpMul)), max: Math.round(T.hp * (boss || type === 'warden' ? 1 : hpMul)), cd: 0, boss, wob: Math.random() * 6 });
  }

  solid(px, py) { const x = Math.floor(px / TS), y = Math.floor(py / TS); return !this.grid[y] || this.grid[y][x] !== 0; }
  blocked(x, y, r = 4) { return this.solid(x - r, y - 2) || this.solid(x + r, y - 2) || this.solid(x - r, y) || this.solid(x + r, y); }

  float(msg, x, y, color = '#ffe9a8') {
    const t = this.add.text(x, y, msg, { fontFamily: 'monospace', fontSize: '8px', color, stroke: '#000', strokeThickness: 2 }).setOrigin(0.5).setDepth(1002);
    this.tweens.add({ targets: t, y: y - 18, alpha: 0, duration: 800, onComplete: () => t.destroy() });
  }
  give(item, n, x, y, col) { this.main.sv.add(item, n); this.float(`+${n} ${item}`, x, y, col); }

  leave() { this.scene.stop(); this.main.scene.resume('Game'); }

  descend(dir) {
    const nd = this.depth + dir;
    if (nd < 1) { this.leave(); return; }
    this.cameras.main.fadeOut(250, 0, 0, 0);
    this.time.delayedCall(260, () => this.scene.restart({ main: this.main, depth: nd }));
  }

  lootChest(o) {
    const d = this.depth + (o.rich ? 2 : 0), sc = this.main;
    o.used = true;
    if (o.mimic) { o.im.destroy(); this.float('Mimic!', o.x, o.y - 14, '#ff6a6a'); this.mob('mimic', { x: o.x, y: o.y }); this.cameras.main.shake(120, 0.006); return; }
    o.im.setTexture('c_open'); sc.audio.sfx('pickup');
    const roll = [['iron', 1, 3], ['copper', 1, 3], ['charcoal', 1, 3], ['plate', 0, 1], ['scrap', 1, 3], ['berries', 1, 3], ['gold', 0, d + 1], ['circuit', 0, 1], ['battery', 0, 1]];
    if (d >= 2) roll.push(['ruby', 0, 1], ['emerald', 0, 1]); if (d >= 3) roll.push(['diamond', 0, 1], ['amethyst', 0, 1]);
    let i = 0; Phaser.Utils.Array.Shuffle(roll).slice(0, 4).forEach(([k, a, b]) => { const n = Phaser.Math.Between(a, b); if (n) this.give(k, n + (o.rich ? 1 : 0), o.x, o.y - 12 - 9 * i++, '#ffe9a8'); });
    sc.sv.change('morale', 3);
  }
  lootVault(o) {
    const sc = this.main;
    if (!o.boss && !sc.sv.spend({ key: 1 })) { sc.ui.toast('Locked. Skeletons carry keys.'); return; }
    o.used = true; o.im.setTexture('c_open'); sc.audio.sfx('craft');
    const d = this.depth; let i = 0; const go = (k, n) => this.give(k, n, o.x, o.y - 12 - 9 * i++, '#8fe0ff');
    go('diamond', Phaser.Math.Between(1, 3)); go('gold', Phaser.Math.Between(3, 6)); go('emerald', 1); go('ruby', 1); go('plate', Phaser.Math.Between(1, 3)); if (d >= 4) go('amethyst', 2);
  }

  shop() {
    const sc = this.main, sv = sc.sv, M = sc.ui.modal, self = this;
    const OFF = [
      ['Heal fully', { ruby: 1 }, () => sv.change('health', 100)],
      ['Feast (food+water)', { emerald: 1 }, () => { sv.change('hunger', 100); sv.change('thirst', 100); }],
      ['Enchant weapon +1 dmg', { amethyst: 1, gold: 1 }, () => { sc.ench = (sc.ench || 0) + 1; }],
      ['Steel plate', { gold: 2 }, () => sv.add('plate', 1)],
      ['Circuit', { gold: 3 }, () => sv.add('circuit', 1)],
      ['Battery', { gold: 2, copper: 2 }, () => sv.add('battery', 1)],
      ['Cave key', { bone: 3 }, () => sv.add('key', 1)],
      ['Charcoal x3', { slime: 2 }, () => sv.add('charcoal', 3)]
    ];
    this.input.keyboard.enabled = false;
    const close = () => { sc.ui.hideModal(); self.input.keyboard.enabled = true; };
    const render = () => {
      M.innerHTML = '<div class="card npc"><h3>Cave Trader</h3><p class="story">"Gems and gold, friend. I trade in echoes."</p>' + OFF.map(([n, c], i) => `<div><button data-i="${i}">${n}</button> <span class="story">${Object.entries(c).map(([k, v]) => v + ' ' + k + ((sv.inv[k] || 0) >= v ? '' : ' (need)')).join(' + ')}</span></div>`).join('') + '<div><button data-i="x">Close</button></div></div>';
      M.classList.add('show');
    };
    M.onclick = e => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.i === 'x') return close(); const o = OFF[+b.dataset.i]; if (!sv.spend(o[1])) { sc.ui.toast('Not enough'); return; } o[2](); sc.audio.sfx('craft'); render(); };
    render();
  }

  hitMob(m, dmg) {
    const sc = this.main; m.hp -= dmg; m.cd = Math.max(m.cd, 0.3);
    this.float('-' + dmg, m.s.x, m.s.y - 12, '#ff6a6a'); sc.audio.sfx('rock');
    this.tweens.add({ targets: m.s, alpha: 0.3, duration: 60, yoyo: true });
    const v = new Phaser.Math.Vector2(m.s.x - this.pl.x, m.s.y - this.pl.y).normalize().scale(8);
    if (!m.boss && !this.blocked(m.s.x + v.x, m.s.y + v.y)) { m.s.x += v.x; m.s.y += v.y; }
    if (m.hp > 0) return;
    sc.audio.sfx('pickup'); sc.sv.run.gathered += 1;
    if (m.boss) {
      this.give('relic', 1, m.s.x, m.s.y - 20, '#ffd24a'); this.give('diamond', 3, m.s.x, m.s.y - 30, '#8fe0ff'); this.give('gold', 6, m.s.x, m.s.y - 40); this.give('plate', 3, m.s.x, m.s.y - 50);
      sc.ui.toast("The Guardian falls. Its relic hums with island echoes."); sc.sv.change('morale', 30);
    } else m.T.loot.forEach(([k, ch], i) => { if (Math.random() < ch) this.give(k, 1, m.s.x, m.s.y - 12 - i * 9, k === 'key' ? '#ffd24a' : '#cfd4dc'); });
    m.s.destroy(); this.mobs.splice(this.mobs.indexOf(m), 1);
  }

  act() {
    const sc = this.main, sv = sc.sv, p = this.pl;
    if (sv.stats.stamina < 4) { sc.ui.toast('Too tired...'); return; }
    // swing visual
    const base = Math.atan2(this.fac.y, this.fac.x);
    const tool = this.add.image(p.x + this.fac.x * 6, p.y - 6 + this.fac.y * 6, 'tool').setOrigin(0, 0.5).setDepth(6); tool.rotation = base - 1;
    this.tweens.add({ targets: tool, rotation: base + 1, duration: 110, onComplete: () => tool.destroy() });
    // interactables
    const o = this.objs.filter(q => !q.used && (['chest', 'vault', 'mush', 'water', 'merchant'].includes(q.k)) && (q.k === 'merchant' || !q.used) && Phaser.Math.Distance.Between(p.x, p.y - 4, q.x, q.y) < 20).sort((a, b) => Phaser.Math.Distance.Between(p.x, p.y, a.x, a.y) - Phaser.Math.Distance.Between(p.x, p.y, b.x, b.y))[0];
    const m = this.mobs.filter(q => Phaser.Math.Distance.Between(p.x, p.y - 4, q.s.x, q.s.y - 4) < (q.boss ? 30 : 24)).sort((a, b) => Phaser.Math.Distance.Between(p.x, p.y, a.s.x, a.s.y) - Phaser.Math.Distance.Between(p.x, p.y, b.s.x, b.s.y))[0];
    if (m) { sv.change('stamina', -4); this.hitMob(m, sc.ex.weaponDmg() + (sc.ench || 0)); return; }
    if (o) {
      if (o.k === 'chest') this.lootChest(o); else if (o.k === 'vault') this.lootVault(o);
      else if (o.k === 'mush') { o.used = true; o.im.setAlpha(0.3); if (o.glow) o.glow.destroy(); sv.change('health', 15); sv.change('morale', 5); this.float('+Glowcap heals', o.x, o.y - 10, '#80ffff'); sc.audio.sfx('pickup'); }
      else if (o.k === 'merchant') this.shop();
      else if (o.k === 'water') { if (Math.random() < 0.3) { sv.add('meat', 1); this.float('+Cave fish', o.x, o.y - 22, '#ff9aa8'); } sv.change('thirst', 40); this.float('+Cave water', o.x, o.y - 10, '#9ad0ff'); sc.audio.sfx('drink'); }
      return;
    }
    // mine the wall in front
    const tx = Math.floor((p.x + this.fac.x * 10) / TS), ty = Math.floor((p.y - 4 + this.fac.y * 10) / TS);
    const near = [[0, 0], [this.fac.x, this.fac.y]].map(([a, b]) => [tx + Math.sign(a), ty + Math.sign(b)]);
    const key = [[tx, ty], ...near].map(([x, y]) => x + ',' + y).find(k => this.hp[k]);
    if (key) {
      const h = this.hp[key], type = this.oreAt[key], def = ORE[type];
      h.hp -= 1 + sc.gear.tool; sv.change('stamina', -3); sc.cameras.main.shake(60, 0.003); sc.audio.sfx('rock');
      const [x, y] = key.split(',').map(Number);
      const e = this.add.particles(x * TS + 8, y * TS + 8, 'px', { lifespan: 400, speed: { min: 20, max: 60 }, scale: { start: 2, end: 0 }, tint: def.c, gravityY: 80, emitting: false }).setDepth(990); e.explode(6); this.time.delayedCall(500, () => e.destroy());
      if (h.hp <= 0) {
        if (type === 'crack') { this.grid[y][x] = 0; h.im.setTexture('c_floor' + this.style); delete this.hp[key]; delete this.oreAt[key]; sc.ui.toast('A secret room!'); sc.audio.sfx('craft'); return; }
        const n = def.n + (sc.perk === 'Scavenger' && Math.random() < 0.5 ? 1 : 0);
        this.give(def.item, n, x * TS + 8, y * TS - 2, '#' + def.c.toString(16).padStart(6, '0'));
        sc.audio.sfx('pickup'); h.im.setTexture('c_wall' + this.style); delete this.hp[key]; delete this.oreAt[key];
      }
    }
  }

  update(t, dtMs) {
    if (!this.input.keyboard.enabled) return;
    const s = dtMs / 1000, sc = this.main, k = this.keys, JD = Phaser.Input.Keyboard.JustDown, p = this.pl, sv = sc.sv;
    const vx = (k.D.isDown || k.RIGHT.isDown ? 1 : 0) - (k.A.isDown || k.LEFT.isDown ? 1 : 0), vy = (k.S.isDown || k.DOWN.isDown ? 1 : 0) - (k.W.isDown || k.UP.isDown ? 1 : 0);
    const moving = vx || vy;
    if (moving) {
      const v = new Phaser.Math.Vector2(vx, vy).normalize(); this.fac.copy(v);
      const nx = p.x + v.x * 62 * s, ny = p.y + v.y * 62 * s;
      if (!this.blocked(nx, p.y)) p.x = nx; if (!this.blocked(p.x, ny)) p.y = ny;
      if (vx) p.setFlipX(vx < 0);
    }
    p.setDepth(p.y / 10);
    if (JD(k.SPACE)) this.act();
    if (JD(k.E)) sc.eat();
    // survival ticks (main scene is paused underground)
    sv.update(s, { night: true, winter: false, nearFire: this.objs.some(o => o.k === 'torch' && Phaser.Math.Distance.Between(p.x, p.y, o.x, o.y) < 40), moving: !!moving, wet: false });
    if (sv.isDead()) { sv.stats.health = 30; sv.stats.hunger = Math.max(sv.stats.hunger, 30); sv.stats.thirst = Math.max(sv.stats.thirst, 30); sc.ui.toast('You collapsed and were dragged out of the cave.'); this.leave(); return; }
    // stairs / ladder
    const near = pt => pt && Phaser.Math.Distance.Between(p.x, p.y - 4, pt.x, pt.y) < 14;
    if (JD(k.H) || JD(k.ESC)) { if (near(this.upPos)) this.descend(-1); else sc.ui.toast('Go to the ladder to leave'); }
    if (near(this.downPos) && t > this.lastTouch) { this.lastTouch = t + 2000; this.descend(1); }
    // spike traps
    this.objs.forEach(o => {
      if (o.k === 'spike') { o.t += s; const up = (o.t % 3) > 2.2; o.im.setTexture(up ? 'c_spike' : 'c_spike0'); if (up && this.hurtT <= 0 && Phaser.Math.Distance.Between(p.x, p.y - 4, o.x, o.y) < 8) this.hurt(8); }
      const dd = Phaser.Math.Distance.Between(p.x, p.y - 4, o.x, o.y);
      if (o.k === 'lava' && dd < 15 && this.hurtT <= 0) this.hurt(7);
      if (o.k === 'gas' && dd < 22) { sv.change('health', -3 * s); if (Math.random() < 0.02) this.float('Poison!', p.x, p.y - 14, '#80ff80'); }
      if (o.k === 'plate' && !o.used && dd < 7) { o.used = true; o.im.setAlpha(0.4); this.float('Ambush!', p.x, p.y - 14, '#ff6a6a'); this.cameras.main.shake(200, 0.008); for (let q = 0; q < 2 + (this.depth > 2 ? 1 : 0); q++) this.mob(this.depth >= 2 ? 'skeleton' : 'bat', { x: o.x + Phaser.Math.Between(-24, 24), y: o.y + Phaser.Math.Between(-12, 12) }); }
      if (o.glow && o.k === 'torch') o.glow.setAlpha(0.22 + Math.sin(t / 120 + o.x) * 0.05);
    });
    // mobs
    this.hurtT -= s;
    this.mobs.forEach(m => {
      const dx = p.x - m.s.x, dy = p.y - 4 - (m.s.y - 4), d = Math.hypot(dx, dy); m.cd -= s;
      const sight = m.type === 'bat' ? 120 : 90;
      if (d < sight && d > 1) {
        const sp = m.T.sp * (m.type === 'bat' ? 1 + Math.sin(t / 150 + m.wob) * 0.4 : 1) * s, mx = dx / d * sp, my = dy / d * sp;
        if (!this.blocked(m.s.x + mx, m.s.y)) m.s.x += mx; if (!this.blocked(m.s.x, m.s.y + my)) m.s.y += my;
      }
      if (m.type === 'bat') m.s.y += Math.sin(t / 100 + m.wob) * 0.2;
      m.s.setFlipX(dx < 0).setDepth(m.s.y / 10);
      if (d < (m.boss ? 22 : 11) && m.cd <= 0) { m.cd = m.boss ? 1.1 : 0.9; this.hurt(m.T.dm); }
    });
    // light
    this.dark.clear(); this.dark.fill(0x04020a, 0.93);
    const cam = this.cameras.main, sx = p.x - cam.scrollX, sy = p.y - 8 - cam.scrollY;
    this.lightImg.setScale(sc.lanternOn || sc.hasLantern ? 2.1 : 1.3); this.dark.erase(this.lightImg, sx, sy);
    this.objs.forEach(o => { if (o.glow && o.glow.active) { this.lightImg.setScale(o.k === 'torch' ? 0.9 : 0.4); this.dark.erase(this.lightImg, o.x - cam.scrollX, o.y - 6 - cam.scrollY); } });
    this.hud.setText(`${this.depth >= 3 ? 'Dungeon' : 'Cave'} L${this.depth}/${MAXD}   Foes ${this.mobs.length}   Keys ${sv.inv.key || 0}`);
    sc.ui.update(sv, { day: sc.day, h: sc.gameMin / 60, season: 'Underground', mourning: false, gear: sc.ex.gearChips() });
  }

  hurt(dm) {
    const sc = this.main; if (this.hurtT > 0) return;
    this.hurtT = 0.35; sc.sv.change('health', -dm * sc.ex.armorMult());
    this.cameras.main.shake(120, 0.006); this.cameras.main.flash(80, 120, 0, 0); sc.audio.sfx('rock');
    this.tweens.add({ targets: this.pl, alpha: 0.4, duration: 70, yoyo: true, repeat: 2 });
  }
}

function pick2(d) { const r = Math.random(); if (d >= 2 && r < 0.4) return 'skeleton'; return r < 0.6 ? 'bat' : 'slime'; }
