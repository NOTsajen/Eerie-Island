import Phaser from 'phaser';

// Night creatures, tier 0 (weak) to 9 (boss). Higher tiers unlock as days pass.
// brk = damage per second against fences and walls.
export const TIERS = [
  { k: 'shade', hp: 2, sp: 38, dm: 5 },
  { k: 'cr1', hp: 3, sp: 36, dm: 6 },
  { k: 'cr2', hp: 4, sp: 44, dm: 7 },
  { k: 'cr3', hp: 6, sp: 34, dm: 9 },
  { k: 'cr4', hp: 8, sp: 30, dm: 10 },
  { k: 'cr5', hp: 11, sp: 24, dm: 12, brk: 3 },
  { k: 'cr6', hp: 15, sp: 38, dm: 14, brk: 4 },
  { k: 'cr7', hp: 22, sp: 46, dm: 18, brk: 5 },
  { k: 'cr8', hp: 32, sp: 52, dm: 22, brk: 8 },
  { k: 'cr9', hp: 55, sp: 34, dm: 30, brk: 14 }
];

export default class CreatureManager {
  constructor(sc) { this.sc = sc; this.list = []; this.timer = 0; this.hit = 0; }

  spawn(tier) {
    const sc = this.sc, p = sc.player, T = TIERS[tier];
    let x, y, tries = 0;
    do {
      const a = Math.random() * Math.PI * 2;
      x = Phaser.Math.Clamp(p.x + Math.cos(a) * 220, 10, 1270); y = Phaser.Math.Clamp(p.y + Math.sin(a) * 220, 10, 950); tries++;
    } while (tries < 12 && !sc.inIsland(x, y, 0.97));
    const s = sc.physics.add.sprite(x, y, T.k);
    s.body.setSize(Math.max(6, s.width - 4), Math.max(6, s.height - 4));
    sc.physics.add.collider(s, sc.fences); sc.physics.add.collider(s, sc.blockers, null, (a, o) => !(o.getData('water') && sc.seasonIdx === 3));
    this.list.push({ s, hp: T.hp, tier, T });
  }

  loot(c) {
    const sc = this.sc, p = c.s;
    sc.sv.change('morale', 1);
    if (c.tier >= 2) { const n = Phaser.Math.Between(1, 1 + Math.floor(c.tier / 3)); sc.sv.add('scrap', n); sc.float(`+${n} scrap`, p.x, p.y - 10, '#cfd4dc'); }
    if (c.tier >= 5 && Math.random() < 0.3) { sc.sv.add('circuit', 1); sc.float('+1 circuit', p.x, p.y - 20, '#9ad0ff'); }
    if (c.tier >= 7 && Math.random() < 0.2) { sc.sv.add('battery', 1); sc.float('+1 battery', p.x, p.y - 20, '#9ad0ff'); }
    if (c.tier === 9) { sc.sv.add('plate', 3); sc.float('+3 plate', p.x, p.y - 30, '#ffe9a8'); }
  }

  hurt(c, dmg) {
    c.hp -= dmg;
    c.s.setTint(0xff6666); this.sc.time.delayedCall(100, () => { if (c.s.active) c.s.clearTint(); });
    this.sc.float('-' + dmg, c.s.x, c.s.y - 10, '#ff6a6a');
  }

  update(s, t, dark) {
    const sc = this.sc, p = sc.player;
    this.timer += s;
    const maxT = Math.min(9, Math.floor((sc.day - 1) / 1.5));
    if (dark > 0.6 && this.timer > 7 && this.list.length < 2 + Math.min(6, sc.day - 1)) {
      this.timer = 0; this.spawn(Phaser.Math.Between(Math.max(0, maxT - 3), maxT));
    }
    this.list = this.list.filter(c => {
      const sp = c.s, T = c.T;
      if (dark < 0.3 && !c.dawn) { c.dawn = true; c.hp = 0; }
      const lit = c.tier < 5 && sc.fires.concat(sc.torches).some(f => Phaser.Math.Distance.Between(sp.x, sp.y, f.x, f.y) < 48);
      if (lit) c.hp -= 1.5 * s;
      if (c.hp <= 0) { sc.dust.explode(6, sp.x, sp.y); if (!c.dawn) this.loot(c); sp.destroy(); return false; }
      const d = Math.max(1, Phaser.Math.Distance.Between(sp.x, sp.y, p.x, p.y)), v = lit ? -T.sp : T.sp;
      sp.setVelocity((p.x - sp.x) / d * v, (p.y - sp.y) / d * v).setDepth(sp.y);
      if (T.brk) {
        sc.fences.getChildren().forEach(o => {
          const hp = o.getData('hp');
          if (hp === undefined || hp > 900 || Phaser.Math.Distance.Between(sp.x, sp.y, o.x, o.y) > 20) return;
          o.setData('hp', hp - T.brk * s);
          if (hp - T.brk * s <= 0) {
            const i = sc.built.findIndex(b => b.x === o.x && b.y === o.y && b.k === o.getData('key'));
            if (i >= 0) sc.built.splice(i, 1);
            sc.dust.explode(5, o.x, o.y); o.destroy();
          }
        });
      }
      if (d < 12) {
        sc.sv.change('health', -T.dm * s * sc.ex.armorMult());
        if (t > this.hit) { this.hit = t + 2000; sc.cameras.main.shake(120, 0.005); sc.audio.sfx('screech'); }
      }
      return true;
    });
  }

  strike(x, y, r) {
    let b = null, bd = r;
    this.list.forEach(c => { const d = Phaser.Math.Distance.Between(x, y, c.s.x, c.s.y); if (d < bd) { bd = d; b = c; } });
    if (!b) return false;
    this.sc.cameras.main.shake(90, 0.005); this.sc.audio.sfx('chop');
    this.hurt(b, this.sc.ex.weaponDmg());
    return true;
  }

  damageAt(x, y, r, dmg) {
    this.list.forEach(c => { if (Phaser.Math.Distance.Between(x, y, c.s.x, c.s.y) < r) c.hp -= dmg; });
  }
}
