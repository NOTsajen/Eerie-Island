import Phaser from 'phaser';

// Cutaway house interior (side view). Floors = house level (cabin 1, house 2, castle 3).
export const FURN = {
  table: { cost: { wood: 4 } }, chair: { cost: { wood: 2 } }, bed: { cost: { wood: 6, scrap: 1 } }, shelf: { cost: { wood: 6 } },
  lamp: { cost: { wood: 1, charcoal: 1 } }, plant: { cost: { berries: 2 } }, rug: { cost: { wood: 2 }, depth: 1 },
  painting: { cost: { wood: 1, scrap: 1 }, up: 38, depth: 1 }, stove: { cost: { stone: 5, iron: 1 } },
  piano: { cost: { wood: 15, plate: 2 } }, clock: { cost: { wood: 5, scrap: 1 } }, chest: { cost: { wood: 5 } }
};
const TINTS = [0xffffff, 0xff9a9a, 0x9ad0ff, 0x9aff9a, 0xffe08a, 0xd0a0ff];
const FH = 66, GROUND = 250;
const fy = f => GROUND - f * FH;

export default class InteriorScene extends Phaser.Scene {
  constructor() { super('Interior'); }
  init(d) { this.main = d.main; this.key = d.key; this.lv = d.lv; }

  create() {
    const sc = this.main, cam = this.cameras.main; cam.setZoom(Math.min(this.scale.width / 480, this.scale.height / 270)).centerOn(240, 135);
    this.items = sc.interiors[this.key] || (sc.interiors[this.key] = []);
    cam.setBackgroundColor(0x1a1428);
    const g = this.add.graphics();
    for (let i = 0; i < 40; i++) { g.fillStyle(0xffffff, Phaser.Math.FloatBetween(0.3, 1)); g.fillRect(Phaser.Math.Between(0, 480), Phaser.Math.Between(0, 120), 1, 1); }
    g.fillStyle(0xf0ecd0, 1); g.fillCircle(430, 30, 11); g.fillStyle(0x1a1428, 1); g.fillCircle(435, 27, 10);
    const n = this.lv, top = GROUND - n * FH;
    g.fillStyle(this.lv === 3 ? 0x2a7a8a : 0x8a3a2a, 1); g.fillTriangle(30, top, 240, top - 34, 450, top);
    g.fillStyle(0x6b4a3a, 1); g.fillRect(40, top, 400, n * FH);
    g.fillStyle(0x7e5a48, 1); for (let x = 44; x < 440; x += 16) for (let y = top + 4; y < GROUND; y += 16) g.fillRect(x, y, 2, 2);
    for (let f = 0; f < n; f++) {
      const y = fy(f);
      g.fillStyle(0x3a2418, 1); g.fillRect(40, y, 400, 6); g.fillStyle(0x5a3a26, 1); g.fillRect(40, y, 400, 2);
      g.fillStyle(0x2a1a10, 1); g.fillRect(40, y - FH + 2, 400, 4);
      [110, 220, 330].forEach(x => { g.fillStyle(0x2a1a10, 1); g.fillRect(x - 1, y - 52, 22, 34); g.fillStyle(0xcfd8c0, 1); g.fillRect(x + 1, y - 50, 18, 30); g.fillStyle(0x2a1a10, 1); g.fillRect(x + 9, y - 50, 2, 30); });
      if (f < n - 1) for (let i = 0; i < 6; i++) { g.fillStyle(0x8a5a2b, 1); g.fillRect(396 + i * 7, y - i * 11 - 2, 8, 4); }
    }
    g.fillStyle(0x1f6b3a, 1); g.fillRect(0, GROUND, 480, 20);
    this.add.text(240, 258, '', {});
    this.sprites = []; this.items.forEach(it => this.spawnItem(it));
    this.fl = 0;
    this.pl = this.add.image(90, fy(0), 'player').setOrigin(0.5, 1).setDepth(3);
    this.keys = this.input.keyboard.addKeys('A,D,W,S,LEFT,RIGHT,UP,DOWN,SPACE,Q,X,C,H,ESC');
    this.hint = this.add.text(4, 2, 'A/D move · W/S stairs (right side) · Q furniture · Space use · X remove · C recolor · H/Esc leave', { fontFamily: 'monospace', fontSize: '7px', color: '#ffe9a8', stroke: '#000', strokeThickness: 2 }).setDepth(10);
    this.score = 0;
    if (this.renderer.type === Phaser.WEBGL) { try { const fx = cam.postFX; fx.addVignette(0.5, 0.5, 0.92, 0.25); fx.addColorMatrix().saturate(0.35); } catch (e) { /* ok */ } }
    this.mt = 0;
  }

  spawnItem(it) {
    const d = FURN[it.k], x = it.x, y = fy(it.f) - (d.up || 0);
    const im = this.add.image(x, y, 'f_' + it.k).setOrigin(0.5, 1).setDepth(d.depth || 2).setTint(TINTS[it.t || 0]);
    const o = { it, im, glow: null };
    if (it.k === 'lamp') o.glow = this.add.image(x, y - 14, 'light').setTint(0xffd070).setAlpha(0.45).setScale(0.9).setBlendMode(Phaser.BlendModes.ADD).setDepth(2);
    this.sprites.push(o);
  }

  nearest(r = 22) {
    let b = null, bd = r;
    this.sprites.forEach(o => { if (o.it.f !== this.fl) return; const d = Math.abs(o.it.x - this.pl.x); if (d < bd) { bd = d; b = o; } });
    return b;
  }

  leave() { this.hideMenu(); this.scene.stop(); this.main.scene.resume('Game'); }
  hideMenu() { const ui = this.main.ui; ui.hideModal(); this.input.keyboard.enabled = true; }

  menu() {
    const sc = this.main, M = sc.ui.modal, JD = Phaser.Input.Keyboard.JustDown;
    this.input.keyboard.enabled = false;
    const fmt = c => Object.entries(c).map(([k, v]) => `${v} ${k}${(sc.sv.inv[k] || 0) >= v ? '' : ' (need)'}`).join(' + ');
    const render = () => {
      M.innerHTML = '<div class="card npc"><h3>Furniture</h3><p class="story">Placed where you stand on this floor.</p>' +
        Object.entries(FURN).map(([k, d]) => `<div><button data-k="${k}">${k}</button> <span class="story">${fmt(sc.cost(d.cost))}</span></div>`).join('') + '<div><button data-k="x">Close</button></div></div>';
      M.classList.add('show');
    };
    M.onclick = e => {
      const b = e.target.closest('button'); if (!b) return;
      const k = b.dataset.k;
      if (k === 'x') { this.hideMenu(); return; }
      if (!sc.sv.spend(sc.cost(FURN[k].cost))) { sc.ui.toast('Not enough resources'); return; }
      const it = { k, x: Phaser.Math.Clamp(Math.round(this.pl.x / 4) * 4, 56, 380), f: this.fl, t: 0 };
      this.items.push(it); this.spawnItem(it); sc.audio.sfx('craft'); render();
    };
    render();
  }

  use() {
    const sc = this.main, o = this.nearest(); if (!o) return;
    const k = o.it.k;
    if (k === 'bed') {
      sc.sv.change('health', 25); sc.sv.change('stamina', 100); sc.sv.change('morale', 5);
      const hr = sc.gameMin / 60;
      if (hr >= 18 || hr < 6) { if (hr >= 18) sc.day++; sc.gameMin = 6 * 60; sc.sv.change('hunger', -15); sc.sv.change('thirst', -15); sc.ui.toast('You slept through the night. Good morning!'); }
      else { sc.gameMin += 180; sc.ui.toast('You rest for a few hours (sleep at night to skip it)'); }
      this.cameras.main.fadeIn(900, 0, 0, 0);
    } else if (k === 'piano') { [262, 330, 392, 523].forEach((f, i) => sc.audio.tone(f, 0.6, 0.12, 'triangle', i * 0.2)); sc.sv.change('morale', 2); }
    else if (k === 'lamp' && o.glow) { o.glow.setVisible(!o.glow.visible); }
    else if (k === 'stove') { if (sc.sv.spend({ berries: 1 })) { sc.sv.change('hunger', 30); sc.sv.change('warmth', 25); sc.ui.toast('Hot meal'); } else sc.ui.toast('Needs a berry to cook'); }
    else if (k === 'chest') {
      const inv = sc.sv.inv, st = o.it.store || (o.it.store = {}), keys = Object.keys(inv);
      if (keys.some(q => inv[q] > 0)) { keys.forEach(q => { st[q] = (st[q] || 0) + inv[q]; inv[q] = 0; }); sc.ui.toast('Stored'); }
      else { Object.keys(st).forEach(q => { inv[q] = (inv[q] || 0) + st[q]; st[q] = 0; }); sc.ui.toast('Taken'); }
    }
  }

  update(t, dt) {
    const s = dt / 1000, k = this.keys, JD = Phaser.Input.Keyboard.JustDown, sc = this.main;
    if (!this.input.keyboard.enabled) return;
    const dx = (k.D.isDown || k.RIGHT.isDown ? 1 : 0) - (k.A.isDown || k.LEFT.isDown ? 1 : 0);
    this.pl.x = Phaser.Math.Clamp(this.pl.x + dx * 80 * s, 56, 430);
    if (dx) this.pl.setFlipX(dx < 0);
    if (this.pl.x > 392 && this.pl.x < 436) {
      if ((JD(k.W) || JD(k.UP)) && this.fl < this.lv - 1) { this.fl++; this.pl.x = 440 - 8; }
      if ((JD(k.S) || JD(k.DOWN)) && this.fl > 0) { this.fl--; this.pl.x = 392; }
    }
    this.pl.y = fy(this.fl) - (this.pl.x > 392 ? ((this.pl.x - 392) / 7) * 11 * 0 : 0);
    if (JD(k.Q)) this.menu();
    if (JD(k.SPACE)) this.use();
    if (JD(k.X)) { const o = this.nearest(); if (o) { Object.entries(sc.cost(FURN[o.it.k].cost)).forEach(([q, v]) => { sc.sv.inv[q] = (sc.sv.inv[q] || 0) + v; }); if (o.glow) o.glow.destroy(); o.im.destroy(); this.items.splice(this.items.indexOf(o.it), 1); this.sprites.splice(this.sprites.indexOf(o), 1); sc.ui.toast('Furniture returned to inventory'); } }
    if (JD(k.C)) { const o = this.nearest(); if (o) { o.it.t = ((o.it.t || 0) + 1) % TINTS.length; o.im.setTint(TINTS[o.it.t]); } }
    if (JD(k.H) || JD(k.ESC)) this.leave();
    this.mt += s; if (this.mt > 1) { this.mt = 0; sc.sv.change('morale', 0.05 * this.items.length); sc.sv.change('warmth', 3); }
  }
}
