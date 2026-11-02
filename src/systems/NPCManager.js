import Phaser from 'phaser';
import { ROSTER } from '../data/roster.js';

export const JOBS = ['Idle', 'Farmer', 'Guard', 'Builder', 'Scavenger', 'Blacksmith', 'Scientist', 'Pandit'];
export { ROSTER };

const BASE = { x: 640, y: 480 };
const YIELD = { Farmer: ['berries', 25], Builder: ['wood', 25], Scavenger: ['stone', 30] };

export default class NPCManager {
  constructor(sc) { this.sc = sc; this.list = []; ROSTER.forEach((d, i) => this.spawn(d, i)); }

  spawn(d, i) {
    const sc = this.sc;
    const s = sc.physics.add.sprite(600 + i * 28, 520, 'npc' + i);
    s.body.setSize(8, 6).setOffset(5, 19);
    sc.physics.add.collider(s, sc.nodes); sc.physics.add.collider(s, sc.fences); sc.physics.add.collider(s, sc.blockers, null, (a, o) => !(o.getData('water') && sc.seasonIdx === 3));
    const label = sc.add.text(s.x, s.y - 14, d.name, { fontFamily: 'monospace', fontSize: '7px', color: '#fff', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5).setDepth(1001);
    this.list.push({ d, s, label, hat: sc.add.image(s.x, s.y, 'hat_Idle').setOrigin(0.5, 1), trust: 30, morale: 70, sanity: 80, hp: 3, job: 'Idle', state: 'idle', tx: s.x, ty: s.y, wait: 0, work: 0, steal: 0, hit: 0, dead: false });
  }

  // ---------- Online sync: the room host simulates survivors, everyone else mirrors them.
  snapshot() {
    return this.list.map(n => n.dead ? [0, 0, n.job, 0, 0, 0, 0, n.state, 1, 0] : [Math.round(n.s.x), Math.round(n.s.y), n.job, Math.round(n.trust), Math.round(n.morale), Math.round(n.sanity), n.hp, n.state, 0, n.sleeping ? 1 : 0]);
  }

  applyNet(list) {
    list.forEach((v, i) => {
      const n = this.list[i]; if (!n || n.dead) return;
      if (v[8]) {
        const banished = v[7] === 'banished';
        if (banished) { n.s.destroy(); n.label.destroy(); if (n.hat) n.hat.destroy(); if (n.zz) n.zz.destroy(); n.dead = true; } else this.die(n);
        return;
      }
      n.nx = v[0]; n.ny = v[1]; n.job = v[2]; n.trust = v[3]; n.morale = v[4]; n.sanity = v[5]; n.hp = v[6]; n.state = v[7]; n.sleeping = !!v[9];
    });
  }

  mirror(s) {
    const sc = this.sc;
    this.alive().forEach(n => {
      const sp = n.s; if (n.nx === undefined) return;
      const k = Math.min(1, s * 8); sp.body.reset(sp.x + (n.nx - sp.x) * k, sp.y + (n.ny - sp.y) * k);
      sp.setDepth(sp.y).setAngle(n.sleeping ? 90 : 0).setAlpha(n.sleeping ? 0.7 : 1);
      n.label.setPosition(sp.x, sp.y - 18).setColor(n.sanity < 25 ? '#ff6a6a' : '#ffffff');
      if (n.hat) n.hat.setTexture('hat_' + n.job).setPosition(sp.x, sp.y - 6).setDepth(sp.y + 1).setVisible(n.job !== 'Idle' && !n.sleeping);
      if (n.zz) n.zz.setPosition(sp.x + 6, sp.y - 16).setVisible(!!n.sleeping);
      else if (n.sleeping) n.zz = sc.add.text(0, 0, 'z', { fontFamily: 'monospace', fontSize: '8px', color: '#cfe0ff', stroke: '#000', strokeThickness: 2 }).setDepth(1002);
    });
  }

  netAct(m) {
    const n = this.list[m.i]; if (!n || n.dead) return;
    if (m.act === 'job') { n.job = m.v; if (n.state === 'idle' || n.state === 'work') n.state = m.v === 'Idle' ? 'idle' : 'work'; }
    else if (m.act === 'gift') { n.trust = Math.min(100, n.trust + 8); n.sanity = Math.min(100, n.sanity + 15); }
    else if (m.act === 'banish') this.banish(n);
    else if (m.act === 'hit') { n.hp -= 1; if (n.hp <= 0) this.die(n); }
  }

  alive() { return this.list.filter(n => !n.dead); }

  nearest(x, y, r, madOnly = false) {
    let b = null, bd = r;
    this.alive().forEach(n => {
      if (n.state === 'banished') return;
      if (madOnly && n.state !== 'hostile' && n.state !== 'sabotage') return;
      const d = Phaser.Math.Distance.Between(x, y, n.s.x, n.s.y);
      if (d < bd) { bd = d; b = n; }
    });
    return b;
  }

  area(n) {
    if (n.job === 'Farmer') return [600, 500, 45];
    if (n.job === 'Scavenger') return [BASE.x, BASE.y, 280];
    if (n.job === 'Guard') { const f = this.sc.fires[0]; return f ? [f.x, f.y, 30] : [BASE.x, BASE.y, 30]; }
    return [BASE.x, BASE.y, 60];
  }

  update(s, t, night) {
    const sc = this.sc, p = sc.player; this.night = night;
    this.alive().forEach(n => {
      const sp = n.s, warm = sc.isWarm(sp.x, sp.y);
      n.sanity += (night ? (warm ? -0.05 : -0.35) : 0.15) * s - (sc.mourning > 0 ? 0.3 * s : 0) + (n.trust > 60 ? 0.05 * s : 0);
      n.sanity = Phaser.Math.Clamp(n.sanity, 0, 100);
      n.morale = Phaser.Math.Clamp(n.morale + (warm ? 0.3 : -0.05) * s, 0, 100);

      if (n.state === 'banished') {
        sp.setVelocity(n.dir * 50, 0); n.label.setPosition(sp.x, sp.y - 18);
        if (sp.x < -10 || sp.x > 1290) { sp.destroy(); n.label.destroy(); if (n.hat) n.hat.destroy(); if (n.zz) n.zz.destroy(); n.dead = true; }
        return;
      }

      const wasMad = n.state === 'sabotage' || n.state === 'hostile';
      const mad = n.sanity < 25 || (wasMad && n.sanity < 40);
      if (mad) {
        if (!wasMad) { sc.ui.toast(`${n.d.name} is losing it...`); sc.audio.sfx('screech'); }
        n.state = night ? 'hostile' : 'sabotage';
      } else n.state = n.job === 'Idle' ? 'idle' : 'work';
      n.label.setColor(mad ? '#ff6a6a' : '#ffffff');

      let speed = 35;
      if (n.state === 'hostile') {
        n.tx = p.x; n.ty = p.y; speed = 55;
        if (Phaser.Math.Distance.Between(sp.x, sp.y, p.x, p.y) < 14) {
          sc.sv.change('health', -6 * s);
          if (t > n.hit) { n.hit = t + 1500; sc.cameras.main.shake(120, 0.006); sc.audio.sfx('screech'); }
        }
      } else if (n.state === 'sabotage') {
        n.wait -= s;
        if (n.wait <= 0) { n.wait = 3; n.tx = BASE.x + Phaser.Math.Between(-60, 60); n.ty = BASE.y + Phaser.Math.Between(-60, 60); }
        n.steal += s;
        if (n.steal > 15) {
          n.steal = 0;
          const items = Object.keys(sc.sv.inv).filter(k => sc.sv.inv[k] > 0);
          if (items.length) {
            const it = Phaser.Utils.Array.GetRandom(items);
            sc.sv.inv[it]--; n.trust = Math.max(0, n.trust - 5);
            sc.float(`${n.d.name} stole ${it}`, sp.x, sp.y - 14, '#ff6a6a');
          }
        }
      } else if (night && sc.shelters.length && n.state !== 'hostile') {
        // Everyone heads to a cabin/house for the night and sleeps by the door.
        const h = sc.shelters[this.list.indexOf(n) % sc.shelters.length];
        n.tx = h.x + ((this.list.indexOf(n) % 3) - 1) * 9; n.ty = h.y + 16; n.sleeping = Phaser.Math.Distance.Between(sp.x, sp.y, n.tx, n.ty) < 6;
        if (n.sleeping) { n.sanity = Math.min(100, n.sanity + 0.3 * s); n.morale = Math.min(100, n.morale + 0.1 * s); }
      } else this.roleTick(n, s, t);
      if (!(night && sc.shelters.length) || n.state === 'hostile') n.sleeping = false;
      sp.setAngle(n.sleeping ? 90 : 0).setAlpha(n.sleeping ? 0.7 : 1);
      if (n.zz) n.zz.setPosition(sp.x + 6, sp.y - 16).setVisible(!!n.sleeping);
      else if (n.sleeping) n.zz = sc.add.text(0, 0, 'z', { fontFamily: 'monospace', fontSize: '8px', color: '#cfe0ff', stroke: '#000', strokeThickness: 2 }).setDepth(1002);

      if (n.dead) return;
      const d = Phaser.Math.Distance.Between(sp.x, sp.y, n.tx, n.ty);
      if (d > 3) sp.setVelocity((n.tx - sp.x) / d * speed, (n.ty - sp.y) / d * speed); else sp.setVelocity(0, 0);
      sp.setDepth(sp.y); n.label.setPosition(sp.x, sp.y - 18);
      if (n.hat) n.hat.setTexture('hat_' + n.job).setPosition(sp.x, sp.y - 6).setDepth(sp.y + 1).setVisible(n.job !== 'Idle' && !n.sleeping);
    });
  }

  // Each role does its own job on the island.
  roleTick(n, s, t) {
    const sc = this.sc, sp = n.s, at = (x, y) => { n.tx = x; n.ty = y; };
    const wander = (cx, cy, r) => { if (n.wait <= 0) { n.wait = Phaser.Math.Between(2, 5); n.tx = Phaser.Math.Clamp(cx + Phaser.Math.Between(-r, r), 40, 1240); n.ty = Phaser.Math.Clamp(cy + Phaser.Math.Between(-r, r), 40, 920); } };
    const D = o => Phaser.Math.Distance.Between(sp.x, sp.y, o.x, o.y);
    n.wait -= s;
    const job = n.job, home = sc.fires[0] || BASE;
    if (job === 'Builder' || job === 'Scavenger') {
      const types = job === 'Builder' ? ['tree'] : ['rock', 'iron', 'copper', 'ruin', 'plane', 'bush'];
      if (!n.target || !n.target.active) {
        n.target = null;
        if (n.wait <= 0) { n.wait = 1; let bd = 1e9; sc.nodes.getChildren().forEach(o => { if (!types.includes(o.getData('type'))) return; const d = D(o); if (d < bd) { bd = d; n.target = o; } }); }
      }
      if (n.target && n.target.active) {
        at(n.target.x, n.target.y + 6);
        if (D(n.target) < 28) { n.work += s; if (n.work >= 2.5) { n.work = 0; sc.hit(n.target, true); } }
        return;
      }
      wander(home.x, home.y, 70); return;
    }
    if (job === 'Farmer') {
      const ripe = sc.crops.filter(c => c.stage === 2).sort((a, b) => D(a) - D(b))[0];
      if (ripe) { at(ripe.x, ripe.y + 8); if (D(ripe) < 22) { ripe.t = 0; ripe.stage = 0; sc.sv.add('berries', 3); sc.float(`+3 crops (${n.d.name})`, sp.x, sp.y - 14); } return; }
      const an = sc.ex.animals.find(a => a.tamed && a.ready);
      if (an) { at(an.s.x, an.s.y); if (D(an.s) < 22) { sc.sv.add(an.d.prod[0], 1); an.t = 0; an.ready = false; sc.float(`+1 ${an.d.prod[0]} (${n.d.name})`, sp.x, sp.y - 14); } return; }
      sc.crops.forEach(o => { if (D(o) < 40 && o.stage < 2) o.t += s; });
      const c = sc.crops[0] || sc.barns[0] || home;
      wander(c.x, c.y, 40); return;
    }
    if (job === 'Guard') {
      let tg = null, bd = 130;
      sc.creatures.list.forEach(c => { const d = D(c.s); if (d < bd) { bd = d; tg = c.s; } });
      if (tg) { at(tg.x, tg.y); if (bd < 24) sc.creatures.damageAt(sp.x, sp.y, 26, (2 + sc.gear.weapon) * s); return; }
      this.damageAt(sp.x, sp.y, 40, 0.5 * s);
      wander(home.x, home.y, 90); return;
    }
    if (job === 'Pandit') {
      const tp = sc.temples[0]; if (!tp) { wander(home.x, home.y, 60); return; }
      at(tp.x, tp.y + 26); n.work += s;
      if (n.work > 40 && D(tp) < 40) { n.work = 0; sc.ex.bless(n.d.name); }
      return;
    }
    if (job === 'Blacksmith') {
      const f = sc.forges[0]; if (!f) { wander(home.x, home.y, 60); return; }
      at(f.x, f.y + 24); n.work += s;
      if (n.work > 45) { n.work = 0; if (sc.sv.spend({ iron: 2, charcoal: 1 })) { sc.sv.add('plate', 1); sc.float(`+1 plate (${n.d.name})`, sp.x, sp.y - 14); } }
      return;
    }
    if (job === 'Scientist') {
      const l = sc.labs[0]; if (!l) { wander(home.x, home.y, 60); return; }
      at(l.x, l.y + 24); n.work += s;
      if (n.work > 60) {
        n.work = 0;
        if (sc.sv.spend({ scrap: 2, plate: 1 })) { sc.sv.add('circuit', 1); sc.float(`+1 circuit (${n.d.name})`, sp.x, sp.y - 14); }
        else if (sc.sv.spend({ copper: 2, charcoal: 1 })) { sc.sv.add('battery', 1); sc.float(`+1 battery (${n.d.name})`, sp.x, sp.y - 14); }
      }
      return;
    }
    wander(home.x, home.y, 60);
  }

  strike(x, y, r) {
    const n = this.nearest(x, y, r, true);
    if (!n) return false;
    this.sc.netNpc(n, 'hit');
    n.hp -= 1;
    this.sc.cameras.main.shake(90, 0.005); this.sc.audio.sfx('chop');
    this.sc.float('-1', n.s.x, n.s.y - 14, '#ff6a6a');
    if (n.hp <= 0) this.die(n);
    return true;
  }

  damageAt(x, y, r, dmg) {
    this.alive().forEach(n => {
      if ((n.state === 'hostile' || n.state === 'sabotage') && Phaser.Math.Distance.Between(x, y, n.s.x, n.s.y) < r) {
        n.hp -= dmg; if (n.hp <= 0) this.die(n);
      }
    });
  }

  banish(n) {
    n.state = 'banished'; n.dir = n.s.x < 640 ? -1 : 1; n.s.body.checkCollision.none = true;
    this.alive().forEach(o => { if (o !== n && n.trust > 60) o.trust = Math.max(0, o.trust - 8); });
    this.sc.ui.toast(`${n.d.name} was banished.`);
  }

  die(n) {
    if (n.dead) return;
    n.dead = true;
    const { x, y } = n.s;
    n.s.destroy(); n.label.destroy(); if (n.hat) n.hat.destroy(); if (n.zz) n.zz.destroy();
    this.alive().forEach(o => { o.sanity = Math.max(0, o.sanity - 10); o.trust = Math.max(0, o.trust - 3); });
    this.sc.funeral(n.d.name, x, y);
  }
}
