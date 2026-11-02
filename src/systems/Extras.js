import Phaser from 'phaser';

const HP = { wall: 40, fence: 8, gate: 14 };
const REPAIR = { wall: { stone: 1 }, fence: { wood: 1 }, gate: { wood: 1 } };
const D = (a, b) => Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y);
const TIER = ['None', 'Wood', 'Iron', 'Steel', 'Diamond'];
const WEAPON_DMG = [1, 2, 3, 5, 8];
const ARMOR = [1, 0.8, 0.6, 0.4, 0.25];
const NAMES = { fence: 'Fence', spike: 'Spike trap', cabin: 'Cabin', plot: 'Crop plot', greenhouse: 'Greenhouse', turret: 'Turret', chest: 'Chest', torch: 'Torch', sprinkler: 'Sprinkler', wall: 'Stone wall', barn: 'Barn', silo: 'Silo', windmill: 'Windmill', pen: 'Animal pen', storehouse: 'Storehouse', kitchen: 'Kitchen', temple: 'Hindu temple (mandir)', gate: 'Gate', well: 'Well', forge: 'Blacksmith', lab: 'Laboratory' };
const SPECIES = { chicken: { n: 4, prod: ['egg', 50], sp: 14 }, pig: { n: 3, prod: ['meat', 110], sp: 12 }, cow: { n: 2, prod: ['milk', 80], sp: 10 } };
const costStr = c => Object.entries(c).map(([k, v]) => v + ' ' + k).join(' + ');

export default class Extras {
  constructor(sc) {
    this.sc = sc; this.animals = [];
    Object.entries(SPECIES).forEach(([k, d]) => { for (let i = 0; i < d.n; i++) this.addAnimal(k, d); });
  }

  weaponDmg() { return WEAPON_DMG[this.sc.gear.weapon] + (this.sc.ench || 0); }
  armorMult() { return ARMOR[this.sc.gear.armor]; }
  gearChips() {
    const g = this.sc.gear, out = [];
    if (g.weapon) out.push(['sword', TIER[g.weapon]]);
    if (g.armor) { out.push(['helmet', TIER[g.armor]]); out.push(['armor', TIER[g.armor]]); out.push(['boots', TIER[g.armor]]); }
    if (g.tool) out.push(['tool', TIER[g.tool]]);
    return out;
  }
  hudLine() {
    const g = this.sc.gear;
    return `Sword:${TIER[g.weapon]} Armor:${TIER[g.armor]} Tools:${TIER[g.tool]}`;
  }

  // ---------- Animals
  addAnimal(k, d) {
    const sc = this.sc; let x, y, t = 0;
    do { x = Phaser.Math.Between(80, 1200); y = Phaser.Math.Between(80, 900); t++; } while (t < 40 && (!sc.inIsland(x, y, 0.75) || D({ x, y }, { x: 640, y: 480 }) < 60));
    const s = sc.physics.add.sprite(x, y, k).setDepth(y);
    s.body.setSize(Math.max(6, s.width - 2), Math.max(4, s.height / 2)).setOffset(1, s.height / 2);
    sc.physics.add.collider(s, sc.nodes); sc.physics.add.collider(s, sc.fences);
    this.animals.push({ k, s, d, tamed: false, ready: false, t: Phaser.Math.Between(0, 30), wait: 0, tx: x, ty: y, flag: null });
  }

  tame(a, quiet) {
    const sc = this.sc;
    a.tamed = true; a.s.setTint(0xffd8e8);
    a.flag = sc.add.text(0, 0, '!', { fontFamily: 'monospace', fontSize: '9px', color: '#ffe066', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5).setDepth(1001).setVisible(false);
    if (!quiet) { sc.float('Tamed!', a.s.x, a.s.y - 12, '#ff9ad0'); sc.audio.sfx('pickup'); }
  }

  update(s, t) {
    const sc = this.sc;
    const follower = sc.net && sc.net.ch && !sc.net.isHost();
    this.animals.forEach(a => {
      const sp = a.s;
      if (follower) { // the room host runs the animals; we only mirror them
        sp.setVelocity(0, 0).setDepth(sp.y);
        if (a.tamed && a.flag) a.flag.setPosition(sp.x, sp.y - sp.height / 2 - 6).setVisible(a.ready);
        return;
      }
      a.wait -= s;
      if (a.wait <= 0) {
        a.wait = Phaser.Math.Between(2, 6);
        if (Math.random() < 0.35) { a.tx = sp.x; a.ty = sp.y; } else { a.tx = sp.x + Phaser.Math.Between(-50, 50); a.ty = sp.y + Phaser.Math.Between(-40, 40); }
      }
      if (!sc.inIsland(a.tx, a.ty, 0.9)) { a.tx = Phaser.Math.Between(500, 780); a.ty = Phaser.Math.Between(380, 580); }
      const d = Math.max(1, D(sp, { x: a.tx, y: a.ty }));
      if (d > 4) sp.setVelocity((a.tx - sp.x) / d * a.d.sp, (a.ty - sp.y) / d * a.d.sp); else sp.setVelocity(0, 0);
      sp.setDepth(sp.y);
      if (a.tamed) {
        a.t += s * (sc.barns.some(b => D(sp, b) < 90) ? 2 : 1) * (sc.pens.some(b => D(sp, b) < 80) ? 1.5 : 1);
        a.ready = a.t >= a.d.prod[1];
        a.flag.setPosition(sp.x, sp.y - sp.height / 2 - 6).setVisible(a.ready);
      }
    });
    this.drawOverlay();
  }

  // ---------- Online sync
  snapshot() { return this.animals.map(a => [Math.round(a.s.x), Math.round(a.s.y), a.tamed ? 1 : 0, a.ready ? 1 : 0]); }
  applyNet(list) {
    list.forEach((v, i) => {
      const a = this.animals[i]; if (!a) return;
      a.s.setPosition(a.s.x + (v[0] - a.s.x) * 0.5, a.s.y + (v[1] - a.s.y) * 0.5);
      if (v[2] && !a.tamed) this.tame(a, true);
      a.ready = !!v[3];
    });
  }
  netAct(m) {
    const a = this.animals[m.i]; if (!a) return;
    if (m.act === 'tame' && !a.tamed) this.tame(a, true);
    if (m.act === 'collect') { a.t = 0; a.ready = false; }
  }

  // ---------- Interaction with stations (called from Space)
  interact() {
    const sc = this.sc, p = sc.player, near = (o, r) => D(p, o) < r;
    const a = this.animals.find(o => near(o.s, 22) && (o.tamed ? o.ready : (sc.sv.inv.berries || 0) > 0));
    if (a) {
      const ai = this.animals.indexOf(a), net = sc.net && sc.net.ch;
      if (a.tamed) { if (net) sc.net.send({ type: 'animalAct', i: ai, act: 'collect' }); const bonus = sc.silos.some(o => D(o, a.s) < 110) ? 2 : 1; sc.sv.add(a.d.prod[0], bonus); a.t = 0; a.ready = false; sc.float('+' + bonus + ' ' + a.d.prod[0], a.s.x, a.s.y - 12, '#ffe9a8'); sc.audio.sfx('pickup'); }
      else { sc.sv.spend({ berries: 1 }); this.tame(a); if (net) sc.net.send({ type: 'animalAct', i: ai, act: 'tame' }); }
      return true;
    }
    if (sc.forges.some(o => near(o, 34))) { this.forgeMenu(); return true; }
    if (sc.kitchens.some(o => near(o, 34))) { this.kitchenMenu(); return true; }
    if (sc.temples.some(o => near(o, 40))) { this.pray(); return true; }
    if (sc.labs.some(o => near(o, 34))) { this.labMenu(); return true; }
    const w = sc.wells.find(o => near(o, 30));
    if (w) { sc.sv.change('thirst', 45); sc.sv.change('stamina', 20); sc.float('+Fresh water', w.x, w.y - 14, '#9ad0ff'); sc.audio.sfx('drink'); return true; }
    // Repair a damaged wall, fence or gate
    const dmg = sc.fences.getChildren().filter(o => HP[o.getData('key')] && o.getData('hp') < HP[o.getData('key')] && D(p, o) < 28).sort((a, b) => D(p, a) - D(p, b))[0];
    if (dmg) {
      const k = dmg.getData('key'), cost = REPAIR[k];
      if (!sc.sv.spend(cost)) { sc.ui.toast('Repair needs ' + costStr(cost)); return true; }
      dmg.setData('hp', Math.min(HP[k], dmg.getData('hp') + HP[k] / 2));
      sc.float('Repaired', dmg.x, dmg.y - 14, '#9be09b'); sc.audio.sfx('craft'); return true;
    }
    return false;
  }

  // ---------- Menus
  menu(title, rows, note) {
    const sc = this.sc, ui = sc.ui, M = ui.modal;
    sc.uiOpen = true; sc.physics.pause(); sc.input.keyboard.enabled = false;
    const close = () => { window.removeEventListener('keydown', esc); ui.hideModal(); sc.uiOpen = false; sc.physics.resume(); sc.input.keyboard.enabled = true; };
    const esc = e => { if (e.key === 'Escape') close(); };
    const fmt = c => Object.entries(c).map(([k, v]) => `${v} ${k}${(sc.sv.inv[k] || 0) >= v ? '' : ' (need)'}`).join(' + ');
    const render = () => {
      const rs = rows();
      M.innerHTML = `<div class="card npc"><h3>${title}</h3><p class="story">${note || ''}</p>` +
        rs.map((r, i) => r.off ? `<div class="story">${r.t}</div>` : `<div><button data-i="${i}">${r.t}</button> <span class="story">${fmt(r.show || r.cost)}</span></div>`).join('') +
        '<div><button data-i="x">Close</button></div></div>';
      M.classList.add('show');
    };
    M.onclick = e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.i === 'x') { close(); return; }
      const r = rows()[+b.dataset.i];
      if (r && sc.sv.spend(r.cost)) { r.go(); sc.audio.sfx('craft'); if (r.close) { close(); return; } } else sc.ui.toast('Not enough resources');
      render();
    };
    window.addEventListener('keydown', esc);
    render();
  }

  buildMenu() {
    const sc = this.sc;
    this.menu('Build', () => Object.entries(sc.BUILD).map(([i, b]) => ({
      t: `${NAMES[b.key]} [${i}]`, cost: {}, show: sc.cost(b.cost), close: true, go: () => sc.time.delayedCall(10, () => sc.build(+i))
    })), 'Builds in front of you. Stand next to a Cabin and press U to upgrade it (Cabin > House > Castle).');
  }

  // Praying at the temple (player) and the pandit's blessings (NPC) calm everyone down.
  bless(who) {
    const sc = this.sc;
    sc.npcs.alive().forEach(n => { n.sanity = Math.min(100, n.sanity + 6); n.morale = Math.min(100, n.morale + 5); n.trust = Math.min(100, n.trust + 1); });
    sc.sv.change('morale', 4);
    const t = sc.temples[0]; if (t) sc.float(`${who} rings the bell. Om...`, t.x, t.y - 30, '#ffd24a');
    sc.audio.sfx('pickup');
  }

  pray() {
    const sc = this.sc;
    if (sc.time.now < (this.prayAt || 0)) { sc.ui.toast('The temple is quiet. Come back soon'); return; }
    this.prayAt = sc.time.now + 30000;
    sc.sv.change('morale', 12); sc.sv.change('health', 6);
    this.bless('You');
    const t = sc.temples[0]; if (t) sc.float('Namaste', t.x, t.y - 40, '#ffe9a8');
  }

  kitchenMenu() {
    const sc = this.sc, sv = sc.sv;
    this.menu('Kitchen', () => [
      { t: 'Berry porridge', cost: { berries: 3 }, go: () => { sv.change('hunger', 45); sv.change('morale', 3); } },
      { t: 'Omelette', cost: { egg: 2, berries: 1 }, go: () => { sv.change('hunger', 50); sv.change('morale', 4); } },
      { t: 'Hearty stew', cost: { meat: 1, berries: 2 }, go: () => { sv.change('hunger', 70); sv.change('health', 15); sv.change('morale', 6); } },
      { t: 'Warm milk soup', cost: { milk: 1, berries: 1 }, go: () => { sv.change('hunger', 30); sv.change('thirst', 25); sv.change('warmth', 25); sv.change('morale', 4); } }
    ], 'Cooked meals are eaten right away.');
  }

  // Gear drawn on the player, plus health bars for creatures and damaged walls
  drawOverlay() {
    const sc = this.sc, p = sc.player, f = sc.facing, g = sc.gear;
    if (!this.gfx) this.gfx = sc.add.graphics().setDepth(1000);
    const gx = this.gfx; gx.clear();
    if (!this.gi) {
      const I = (k, ox, oy) => sc.add.image(0, 0, k).setOrigin(ox, oy).setVisible(false);
      this.gi = { helm: I('g_helm1', 0.5, 0), chest: I('g_chest1', 0.5, 0), boots: I('g_boots1', 0.5, 0), sword: I('g_sword1', 0.5, 1) };
    }
    const gi = this.gi, A = Math.min(3, g.armor), W = Math.min(3, g.weapon), dz = p.depth || p.y;
    gi.chest.setVisible(A >= 1).setTexture('g_chest' + Math.max(1, A)).setPosition(p.x, p.y - 4).setDepth(dz + 1);
    gi.helm.setVisible(A >= 1).setTexture('g_helm' + Math.max(1, A)).setPosition(p.x, p.y - 14).setDepth(dz + 2);
    gi.boots.setVisible(A >= 1).setTexture('g_boots' + Math.max(1, A)).setPosition(p.x, p.y + 9).setDepth(dz + 1);
    gi.sword.setVisible(W >= 1).setTexture('g_sword' + Math.max(1, W)).setPosition(p.x + f.x * 6, p.y + 2 + f.y * 6).setRotation(Math.atan2(f.y, f.x) + Math.PI / 2).setDepth(f.y < 0 ? dz - 1 : dz + 3);
    const bar = (x, y, w, fr, c) => { fr = Math.max(0, Math.min(1, fr)); gx.fillStyle(0x000000, 0.7); gx.fillRect(x - w / 2 - 1, y - 1, w + 2, 4); gx.fillStyle(c, 1); gx.fillRect(x - w / 2, y, w * fr, 2); };
    sc.creatures.list.forEach(c => { if (c.hp < c.T.hp) bar(c.s.x, c.s.y - c.s.height / 2 - 5, 14, c.hp / c.T.hp, 0xe04848); });
    sc.fences.getChildren().forEach(o => {
      const k = o.getData('key'), hp = o.getData('hp'), max = HP[k] || 0;
      if (max && hp !== undefined && hp < max) bar(o.x, o.y - o.height / 2 - 4, 14, hp / max, hp / max < 0.35 ? 0xe04848 : 0xe0c040);
    });
  }

  forgeMenu() {
    const sc = this.sc, g = sc.gear;
    const CAT = [
      ['tool', 'Tools', ['Stone tools', { wood: 3, stone: 3 }], ['Iron tools', { iron: 3, wood: 2, charcoal: 1 }], ['Steel tools', { plate: 3, iron: 2 }], ['Diamond tools', { diamond: 3, gold: 2, plate: 2 }]],
      ['weapon', 'Sword', ['Wooden sword', { wood: 5, stone: 1 }], ['Iron sword', { iron: 3, charcoal: 1 }], ['Steel blade', { plate: 4, iron: 2 }], ['Diamond blade', { diamond: 4, gold: 2 }]],
      ['armor', 'Armor', ['Scrap armor', { scrap: 6, wood: 2 }], ['Iron armor', { iron: 8, charcoal: 2 }], ['Steel armor', { plate: 6, iron: 4 }], ['Diamond armor', { diamond: 6, gold: 3 }]]
    ];
    this.menu('Blacksmith', () => CAT.map(([k, label, ...tiers]) => {
      const nx = tiers[g[k]];
      if (!nx) return { t: `${label}: MAX`, off: true };
      return { t: `${label}: ${nx[0]}`, cost: sc.cost(nx[1]), go: () => { g[k]++; } };
    }), 'Tools chop and mine faster, swords hit harder, armor cuts damage taken.');
  }

  labMenu() {
    this.menu('Laboratory', () => [{ t: 'Research bench', off: true }], 'Scientists here turn scrap into circuits and batteries.');
  }

  upgrade() {
    const sc = this.sc, p = sc.player;
    const s = sc.shelters.filter(c => D(p, c) < 64).sort((a, b) => D(p, a) - D(p, b))[0];
    if (!s) { sc.ui.toast('Stand next to a cabin to upgrade it'); return; }
    if (s.lv >= 3) { sc.ui.toast('Already a castle'); return; }
    const cost = sc.cost([{ wood: 25, stone: 15, plate: 2 }, { wood: 60, stone: 50, plate: 8, iron: 6 }][s.lv - 1]);
    if (!sc.sv.spend(cost)) { sc.ui.toast('Upgrade needs ' + costStr(cost)); return; }
    s.lv++; s.img.setTexture(['cabin', 'house', 'castle'][s.lv - 1]); s.img.refreshBody();
    const b = sc.built.find(o => o.k === 'cabin' && o.x === s.x && o.y === s.y); if (b) b.lv = s.lv;
    sc.audio.sfx('craft'); sc.cameras.main.shake(150, 0.004);
    sc.ui.toast(s.lv === 2 ? 'Upgraded to a House' : 'Upgraded to a Castle!');
  }
}
