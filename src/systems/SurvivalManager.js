export default class SurvivalManager {
  constructor() {
    this.stats = { health: 100, stamina: 100, hunger: 100, thirst: 100, warmth: 100, morale: 100 };
    this.inv = { wood: 0, stone: 0, berries: 0, iron: 0, scrap: 0, charcoal: 0, plate: 0, circuit: 0, copper: 0, battery: 0, transceiver: 0, gold: 0, diamond: 0 };
    this.run = { gathered: 0 };
  }
  change(k, v) { this.stats[k] = Math.max(0, Math.min(100, this.stats[k] + v)); }
  add(item, n) { this.inv[item] = (this.inv[item] || 0) + n; this.run.gathered += n; }
  spend(cost) {
    const ok = Object.entries(cost).every(([k, v]) => (this.inv[k] || 0) >= v);
    if (ok) Object.entries(cost).forEach(([k, v]) => (this.inv[k] -= v));
    return ok;
  }
  update(s, { night, winter, nearFire, moving, wet }) {
    const st = this.stats;
    this.change('hunger', -0.12 * s);
    this.change('thirst', -0.18 * s);
    this.change('warmth', (nearFire ? 3 : (night ? -0.3 : 0.1) + (winter ? -0.35 : 0) + (wet ? -0.2 : 0)) * s);
    this.change('morale', (nearFire ? 0.5 : night ? -0.1 : 0.02) * s);
    this.change('stamina', (moving ? 3 : 8) * s);
    const dying = [st.hunger, st.thirst, st.warmth].filter(v => v <= 0).length;
    if (dying) this.change('health', -1.5 * dying * s);
    else if (st.hunger > 40 && st.thirst > 40 && st.warmth > 40) this.change('health', 0.4 * s);
  }
  isDead() { return this.stats.health <= 0; }
}
