import Phaser from 'phaser';
import SurvivalManager from '../systems/SurvivalManager.js';
import AudioManager from '../systems/AudioManager.js';
import UIManager from '../systems/UIManager.js';
import NPCManager from '../systems/NPCManager.js';
import NetManager from '../systems/NetManager.js';
import CreatureManager from '../systems/CreatureManager.js';
import TouchControls from '../systems/TouchControls.js';
import Extras from '../systems/Extras.js';
import { makeChar } from '../systems/Art.js';

const W = 1280, H = 960;
const SEASONS = ['Spring', 'Summer', 'Autumn', 'Winter'];
const SEASON_TINT = [0x66ff88, 0xffd27a, 0xd2782a, 0xaad4ff];
const NODE = {
  tree: { hp: 4, item: 'wood', n: 2, label: 'Wood', sfx: 'chop', fx: 0x3f8a3a },
  rock: { hp: 5, item: 'stone', n: 1, label: 'Stone', sfx: 'rock', fx: 0x9aa0a8 },
  bush: { hp: 2, item: 'berries', n: 2, label: 'Berries', sfx: 'chop', fx: 0xc0334d },
  iron: { hp: 7, item: 'iron', n: 1, label: 'Iron', sfx: 'rock', fx: 0xb87333 },
  ruin: { hp: 3, item: 'scrap', n: 2, label: 'Scrap', sfx: 'chop', fx: 0x8a8f99 },
  copper: { hp: 6, item: 'copper', n: 1, label: 'Copper', sfx: 'rock', fx: 0x3aa07a },
  plane: { hp: 12, item: 'scrap', n: 4, label: 'Scrap', sfx: 'rock', fx: 0xc0c4cc, bonus: ['circuit', 'battery', 'copper'] }
};
const ISL = { x: 640, y: 480, rx: 590, ry: 432 };
const PLANE = { x: 330, y: 330 };

const SAVE_KEY = 'island-echoes-save-v1';
const SAND = { x: 760, y: 365, w: 120, h: 110 };
const STONE = { x: 560, y: 30, w: 160, h: 100 };
const BUILD = {
  1: { key: 'fence', cost: { wood: 1 } },
  2: { key: 'spike', cost: { wood: 3, stone: 1 } },
  3: { key: 'cabin', cost: { wood: 15, stone: 5 } },
  4: { key: 'plot', cost: { wood: 2 } },
  5: { key: 'greenhouse', cost: { wood: 8, stone: 2 } },
  6: { key: 'turret', cost: { wood: 4, plate: 2 } },
  7: { key: 'chest', cost: { wood: 5 } },
  8: { key: 'torch', cost: { wood: 2, charcoal: 1 } },
  9: { key: 'sprinkler', cost: { wood: 3, iron: 1 } },
  10: { key: 'wall', cost: { stone: 2, wood: 1 }, off: 16 },
  11: { key: 'barn', cost: { wood: 20, stone: 6 }, off: 30 },
  12: { key: 'well', cost: { stone: 8, wood: 3 } },
  13: { key: 'forge', cost: { wood: 15, stone: 15, iron: 3 }, off: 28 },
  14: { key: 'lab', cost: { wood: 12, plate: 4, circuit: 1 }, off: 28 },
  15: { key: 'silo', cost: { wood: 12, stone: 6 }, off: 26 },
  16: { key: 'windmill', cost: { wood: 18, stone: 8, iron: 1 }, off: 30 },
  17: { key: 'pen', cost: { wood: 10 }, off: 26 },
  18: { key: 'storehouse', cost: { wood: 15, stone: 4 }, off: 26 },
  19: { key: 'kitchen', cost: { wood: 12, stone: 10 }, off: 26 },
  20: { key: 'temple', cost: { wood: 15, stone: 20 }, off: 32 },
  21: { key: 'gate', cost: { wood: 4, iron: 1 } }
};
const CRAFT = {
  Z: { cost: { wood: 3 }, give: 'charcoal' },
  X: { cost: { iron: 2, charcoal: 1 }, give: 'plate' },
  V: { cost: { scrap: 2, plate: 1 }, give: 'circuit' },
  B: { cost: { copper: 2, charcoal: 1 }, give: 'battery' },
  N: { cost: { circuit: 1, battery: 1, copper: 1 }, give: 'transceiver' }
};
const TOWER = [
  { name: 'Foundation', cost: { wood: 10, stone: 6 } },
  { name: 'Power Grid', cost: { wood: 8, stone: 10, battery: 1 } },
  { name: 'Antenna', cost: { wood: 12, stone: 8, plate: 2 } },
  { name: 'Signal Calibration', cost: { wood: 15, stone: 15, circuit: 2, transceiver: 1 } }
];

export default class MainGameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  create() {
    this.sea = this.add.tileSprite(0, 0, W, H, 'water').setOrigin(0).setDepth(-4);
    this.add.ellipse(ISL.x, ISL.y, 2 * (ISL.rx + 40), 2 * (ISL.ry + 40), 0x7fd6ff, 0.55).setDepth(-3);
    const sandM = this.make.graphics({ add: false }); sandM.fillStyle(0xffffff); sandM.fillEllipse(ISL.x, ISL.y, 2 * (ISL.rx + 14), 2 * (ISL.ry + 14));
    this.add.tileSprite(0, 0, W, H, 'sand').setOrigin(0).setDepth(-2).setMask(sandM.createGeometryMask());
    const grassM = this.make.graphics({ add: false }); grassM.fillStyle(0xffffff); grassM.fillEllipse(ISL.x, ISL.y, 2 * (ISL.rx - 36), 2 * (ISL.ry - 30));
    this.grassTS = this.add.tileSprite(0, 0, W, H, 'grass_0').setOrigin(0).setDepth(-1).setMask(grassM.createGeometryMask());
    this.add.tileSprite(SAND.x, SAND.y, SAND.w, SAND.h, 'sand').setOrigin(0);
    this.add.tileSprite(STONE.x, STONE.y, STONE.w, STONE.h, 'floor').setOrigin(0);
    [[632, 130, 16, 650], [360, 472, 440, 16], [338, 340, 16, 140]].forEach(([x, y, w, h]) => this.add.tileSprite(x, y, w, h, 'path').setOrigin(0).setDepth(-0.5));
    this.physics.world.setBounds(0, 0, W, H);
    this.sv = new SurvivalManager(); this.audio = new AudioManager(); this.ui = new UIManager();
    this.day = 1; this.gameMin = 7 * 60; this.dead = false; this.fires = [];
    this.facing = new Phaser.Math.Vector2(0, 1); this.nextStep = 0; this.seasonIdx = -1;

    // ---- Map: tilled farm field, dirt clearings, second lake, more paths, seasonal meadow decor
    this.zones = [[980, 640, 120], [230, 700, 85], [390, 580, 52], [1000, 290, 48], [640, 480, 60]];
    this.dirtTS = []; this.soilAreas = [[980, 640, 118, 80], [390, 580, 50, 34], [1000, 290, 46, 32]];
    const soil = (cx, cy, rx, ry, rim) => {
      const rimG = this.add.ellipse(cx, cy, rx * 2 + 6, ry * 2 + 6, 0x8a5a26).setDepth(-0.9);
      const m = this.make.graphics({ add: false }); m.fillStyle(0xffffff); m.fillEllipse(cx, cy, rx * 2, ry * 2);
      const t = this.add.tileSprite(0, 0, W, H, 'dirt_0').setOrigin(0).setDepth(-0.8).setMask(m.createGeometryMask()); this.dirtTS.push(t);
      return t;
    };
    soil(980, 640, 118, 80); soil(390, 580, 50, 34); soil(1000, 290, 46, 32);
    [[880, 590], [880, 620], [880, 650], [880, 680]].forEach(([x, y]) => this.add.tileSprite(x + 20, y, 190, 16, 'furrow').setOrigin(0).setDepth(-0.7));
    this.add.tileSprite(600, 440, 80, 80, 'floor').setOrigin(0).setDepth(-0.6);
    [[640, 566, 250, 16], [330, 700, 302, 16], [640, 296, 360, 16]].forEach(([x, y, w, h]) => this.add.tileSprite(x, y, w, h, 'path').setOrigin(0).setDepth(-0.5));
    this.zones.push([760, 574, 130], [480, 708, 160]);
    this.lake = this.add.image(230, 700, 'pond').setScale(2.4).setDepth(1);

    // ---- River (with bridge), cliffs and rolling hills
    this.riverTS = []; this.blockers = this.physics.add.staticGroup();
    const block = (x, y, w, h) => { const b = this.add.rectangle(x + w / 2, y + h / 2, w, h, 0, 0); this.physics.add.existing(b, true); this.blockers.add(b); return b; };
    [[480, 100, 32, 356], [480, 504, 32, 190], [288, 662, 224, 32]].forEach(([x, y, w, h]) => {
      this.add.rectangle(x - 4, y - 4, w + 8, h + 8, 0xe3c56e).setOrigin(0).setDepth(-0.95);
      this.riverTS.push(this.add.tileSprite(x, y, w, h, 'water').setOrigin(0).setDepth(-0.9)); block(x, y, w, h).setData('water', true);
    });
    this.add.tileSprite(468, 456, 56, 48, 'path_bridge').setOrigin(0).setDepth(0.5);
    for (let y = 110; y <= 660; y += 55) this.zones.push([496, y, 38]);
    for (let x = 300; x <= 500; x += 50) this.zones.push([x, 678, 36]);
    this.cliffTop = [];
    [[880, 130, 200, 36], [90, 380, 130, 30]].forEach(([x, y, w, h]) => {
      this.cliffTop.push(this.add.tileSprite(x, y, w, h, 'grass_0').setOrigin(0).setDepth(-0.4).setTint(0xe8ffd8));
      this.add.tileSprite(x, y + h, w, 30, 'cliff').setOrigin(0).setDepth(-0.3);
      block(x, y, w, h + 30); this.zones.push([x + w / 2, y + 30, w / 2 + 16]);
    });
    this.hills = [[820, 800, 100, 34], [1130, 520, 70, 26], [180, 560, 80, 28], [980, 850, 90, 30]].map(([x, y, rx, ry]) => {
      this.add.ellipse(x + 6, y + 8, rx * 2, ry * 2, 0x000000, 0.14).setDepth(-0.85);
      const m = this.add.ellipse(x, y, rx * 2, ry * 2, 0x78d85a).setDepth(-0.84);
      this.add.ellipse(x - rx * 0.25, y - ry * 0.35, rx * 0.9, ry * 0.7, 0xffffff, 0.05).setDepth(-0.83);
      return m;
    });

    // ---- Beach: shells on the sand ring and a wooden pier
    this.add.tileSprite(620, 905, 40, 55, 'path_bridge').setOrigin(0).setDepth(0.4);
    this.zones.push([640, 880, 40]);
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2 + Math.random() * 0.2, f = 0.93 + Math.random() * 0.05;
      const x = ISL.x + (ISL.rx + 4) * f * Math.cos(a), y = ISL.y + (ISL.ry + 4) * f * Math.sin(a);
      if (y > 880 && Math.abs(x - 640) < 40) continue;
      this.add.image(x, y, i % 3 ? 'dec_shell' : 'dec_star').setDepth(-0.2);
    }
    this.decor = [];
    for (let i = 0; i < 110; i++) {
      let x, y, k = 0;
      do { x = Phaser.Math.Between(40, W - 40); y = Phaser.Math.Between(40, H - 40); k++; } while (k < 30 && (!this.inIsland(x, y, 0.86) || this.inZone(x, y, 18) || (Math.abs(x - 640) < 24 && y > 120 && y < 790)));
      this.decor.push(this.add.image(x, y, 'dec_0').setDepth(y - 6));
    }

    this.pond = this.add.image(820, 420, 'pond').setDepth(1);
    this.nodes = this.physics.add.staticGroup();
    for (let i = 0; i < 170; i++) this.spawn('tree');
    for (let i = 0; i < 30; i++) this.spawn('rock');
    for (let i = 0; i < 45; i++) this.spawn('bush');
    for (let i = 0; i < 8; i++) this.spawn('iron');
    for (let i = 0; i < 4; i++) this.spawn('ruin');
    for (let i = 0; i < 8; i++) this.spawn('copper');
    this.spawn('plane', PLANE.x, PLANE.y);
    this.add.particles(PLANE.x + 8, PLANE.y - 10, 'px', { lifespan: 1800, speedY: { min: -14, max: -8 }, speedX: { min: -3, max: 5 }, scale: { start: 2, end: 5 }, alpha: { start: 0.5, end: 0 }, tint: 0x555555, frequency: 260 }).setDepth(900);

    this.caveEntrance = this.add.image(1150, 330, 'cave').setOrigin(0.5, 1).setDepth(330);
    this.add.text(1150, 306, 'CAVE (H)', { fontFamily: 'monospace', fontSize: '6px', color: '#ffe9a8', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5).setDepth(331);
    this.player = this.physics.add.sprite(640, 480, 'player').setCollideWorldBounds(true);
    this.player.body.setSize(8, 6).setOffset(5, 19);
    this.physics.add.collider(this.player, this.nodes); this.physics.add.collider(this.player, this.blockers, null, (pl, o) => !(o.getData('water') && this.seasonIdx === 3));
    this.cameras.main.setBounds(0, 0, W, H).startFollow(this.player, true, 0.1, 0.1).setRoundPixels(true);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D,SPACE,C,E,T,F,Z,X,V,Y,SHIFT,ONE,TWO,THREE,FOUR,FIVE,SIX,SEVEN,EIGHT,NINE,L,B,N,G,U,Q,H');
    const unlock = () => this.audio.start();
    this.input.keyboard.once('keydown', unlock); this.input.once('pointerdown', unlock);

    this.dust = this.add.particles(0, 0, 'px', { lifespan: 350, speed: { min: 6, max: 22 }, scale: { start: 2, end: 0 }, tint: 0xcdb98a, emitting: false }).setDepth(990);

    // Night darkness + seasonal color grade
    this.tintRect = this.add.rectangle(0, 0, 900, 1400, 0xffffff, 0).setOrigin(0).setScrollFactor(0).setDepth(999);
    this.dark = this.add.renderTexture(0, 0, this.scale.width, this.scale.height).setOrigin(0).setScrollFactor(0).setDepth(1000);
    this.scale.on('resize', () => this.dark.resize(this.scale.width, this.scale.height));
    this.lightImg = this.make.image({ x: 0, y: 0, key: 'light', add: false });

    this.fences = this.physics.add.staticGroup();
    this.spikes = []; this.shelters = []; this.crops = []; this.greenhouses = []; this.turrets = []; this.chests = []; this.perk = 'Scavenger'; this.torches = []; this.sprinklers = []; this.built = []; this.floodLevel = 0; this.hasLantern = false; this.lanternOn = false; this.playerName = 'Survivor'; this.mourning = 0; this.uiOpen = false; this.towerPhase = 0; this.weather = 'sunny';
    this.physics.add.collider(this.player, this.fences, null, (pl, o) => o.getData('key') !== 'gate');
    this.barns = []; this.temples = []; this.silos = []; this.mills = []; this.pens = []; this.kitchens = []; this.wells = []; this.forges = []; this.labs = []; this.gear = { weapon: 0, armor: 0, tool: 0 }; this.BUILD = BUILD; this.lastSafe = { x: 640, y: 480 }; this.interiors = {};
    this.tower = this.add.image(640, 70, 'tower').setDepth(70);
    this.npcs = new NPCManager(this);
    this.creatures = new CreatureManager(this);
    this.ex = new Extras(this);

    this.rain = this.add.particles(0, 0, 'px', { x: { min: 0, max: 900 }, y: -6, lifespan: 700, speedY: { min: 220, max: 280 }, speedX: -40, scaleY: 3, scaleX: 0.6, tint: 0x8ab4ff, alpha: 0.6, frequency: 30, emitting: false }).setScrollFactor(0).setDepth(998);
    this.snow = this.add.particles(0, 0, 'px', { x: { min: 0, max: 900 }, y: -6, lifespan: 5000, speedY: { min: 25, max: 50 }, speedX: { min: -15, max: 15 }, tint: 0xffffff, frequency: 22, emitting: false }).setScrollFactor(0).setDepth(998);
    this.fog = this.add.rectangle(0, 0, 900, 1400, 0xdfe6ee, 0).setOrigin(0).setScrollFactor(0).setDepth(998);
    this.time.addEvent({ delay: 45000, loop: true, callback: () => this.rollWeather() });

    window.addEventListener('focusin', e => { if (e.target.tagName === 'INPUT') this.input.keyboard.enabled = false; });
    window.addEventListener('focusout', e => { if (e.target.tagName === 'INPUT' && !this.uiOpen) this.input.keyboard.enabled = true; });
    this.floodRect = this.add.rectangle(0, H, W, 0, 0x2a5f9e, 0.35).setOrigin(0, 1).setDepth(3);
    this.time.addEvent({ delay: 20000, loop: true, callback: () => this.save() });
    window.addEventListener('beforeunload', () => this.save());
    this.touch = new TouchControls(this);
    // Vibrant colour grade + glow + vignette (WebGL only)
    if (this.renderer.type === Phaser.WEBGL) {
      try {
        const fx = this.cameras.main.postFX;
        fx.addVignette(0.5, 0.5, 0.9, 0.35);
        const cm = fx.addColorMatrix(); cm.saturate(0.7); cm.contrast(0.2);
      } catch (e) { /* effects unavailable */ }
    }
    this.openCreator();
  }

  sleepOutside(h) {
    if (!(h >= 18 || h < 6)) { this.ui.toast('You can only sleep at night (or use a bed to rest)'); return; }
    const warm = this.isWarm(this.player.x, this.player.y);
    if (h >= 18) this.day++;
    this.gameMin = 6 * 60;
    this.sv.change('stamina', 100); this.sv.change('hunger', -15); this.sv.change('thirst', -15);
    if (!warm) { this.sv.change('warmth', -30); this.sv.change('health', -10); }
    this.cameras.main.fadeIn(900, 0, 0, 0);
    this.ui.toast(warm ? 'You slept by the fire. Good morning!' : 'Cold night outside... sleep by a fire or in a bed next time');
  }

  seasonTint(sIdx) {
    const T = [[0xffffff, 0xffffff, 0xffffff], [0xffffff, 0xffffff, 0xffffff], [0xffb878, 0xc8b8a8, 0xc8dcf0], [0xe4eeff, 0xeef4ff, 0xe0f0ff]][sIdx];
    return { bush: T[0], rock: T[1], water: T[2] };
  }

  applySeasonTints(sIdx) {
    const t = this.seasonTint(sIdx);
    [this.sea, this.pond, this.lake, ...(this.riverTS || [])].forEach(o => o && o.setTint(t.water));
    this.nodes.children.iterate(n => { if (!n) return; const ty = n.getData('type'); if (ty === 'bush') n.setTint(t.bush); else if (ty === 'rock') n.setTint(t.rock); });
  }

  onSoil(x, y) { return (this.soilAreas || []).some(([cx, cy, rx, ry]) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1); }

  inZone(x, y, pad = 0) { return (this.zones || []).some(([zx, zy, zr]) => Phaser.Math.Distance.Between(x, y, zx, zy) < zr + pad); }

  inIsland(x, y, k = 1) { return ((x - ISL.x) / (ISL.rx * k)) ** 2 + ((y - ISL.y) / (ISL.ry * k)) ** 2 <= 1; }

  spawn(type, fx, fy) {
    let x = fx, y = fy, tries = 0;
    if (fx === undefined) {
      do { x = Phaser.Math.Between(24, W - 24); y = Phaser.Math.Between(24, H - 24); tries++; }
      while (tries < 40 && (!this.inIsland(x, y, 0.9) || this.inZone(x, y, 10) || Phaser.Math.Distance.Between(x, y, 640, 480) < 70 || Phaser.Math.Distance.Between(x, y, 820, 420) < 50 || Phaser.Math.Distance.Between(x, y, PLANE.x, PLANE.y) < 50 || (Math.abs(x - 640) < 14 && y > 120 && y < 790) || (Math.abs(y - 480) < 14 && x > 350 && x < 800) || (Math.abs(x - 346) < 14 && y > 330 && y < 490)));
    }
    const tex = type === 'tree' ? (!this.inIsland(x, y, 0.72) ? 'palm' : 'tree_' + Math.max(0, this.seasonIdx)) : type;
    const n = this.nodes.create(x, y, tex).setDepth(y);
    n.setData({ type, hp: NODE[type].hp });
    if (this.seasonIdx >= 0 && (type === 'bush' || type === 'rock')) n.setTint(this.seasonTint(this.seasonIdx)[type]);
    return n;
  }

  enterHouse() {
    const p = this.player;
    if (this.caveEntrance && Phaser.Math.Distance.Between(p.x, p.y, this.caveEntrance.x, this.caveEntrance.y) < 40) { this.scene.pause(); this.scene.launch('Cave', { main: this, depth: 1 }); return; }
    const c = this.shelters.filter(o => Phaser.Math.Distance.Between(p.x, p.y, o.x, o.y) < 64).sort((a, b) => Phaser.Math.Distance.Between(p.x, p.y, a.x, a.y) - Phaser.Math.Distance.Between(p.x, p.y, b.x, b.y))[0];
    if (!c) { this.ui.toast('Stand next to a cabin (or the cave) and press H to go inside'); return; }
    this.scene.pause(); this.scene.launch('Interior', { main: this, key: c.x + ',' + c.y, lv: c.lv });
  }

  eat() {
    const sv = this.sv, p = this.player, order = [['berries', 20, 0], ['egg', 15, 0], ['milk', 10, 25], ['meat', 30, 0]];
    const pick = this.ui.items && this.ui.items[this.ui.sel], pi = order.findIndex(o => o[0] === pick); if (pi > 0) order.unshift(order.splice(pi, 1)[0]);
    for (const [k, h, th] of order) {
      if (sv.spend({ [k]: 1 })) {
        sv.change('hunger', k === 'berries' && this.perk === 'Chef' ? 35 : h); if (th) sv.change('thirst', th); sv.change('morale', 2);
        this.float('+' + k, p.x, p.y - 12, '#ff9aa8'); this.audio.sfx('pickup'); return;
      }
    }
    this.ui.toast('Nothing to eat');
  }

  darkness(h) {
    if (h >= 6.5 && h < 18) return 0;
    if (h >= 18 && h < 20) return 0.82 * (h - 18) / 2;
    if (h >= 20 || h < 4.5) return 0.82;
    return 0.82 * (1 - (h - 4.5) / 2);
  }

  float(msg, x, y, color = '#ffe9a8') {
    const tx = this.add.text(x, y, msg, { fontFamily: 'monospace', fontSize: '8px', color, stroke: '#000', strokeThickness: 2 }).setOrigin(0.5).setDepth(1002);
    this.tweens.add({ targets: tx, y: y - 18, alpha: 0, duration: 800, ease: 'Cubic.out', onComplete: () => tx.destroy() });
  }

  swing() {
    const p = this.player, f = this.facing, base = Math.atan2(f.y, f.x);
    const tool = this.add.image(p.x + f.x * 6, p.y + f.y * 6, 'tool').setOrigin(0, 0.5).setDepth(p.y + 1);
    tool.rotation = base - 1;
    this.tweens.add({ targets: tool, rotation: base + 1, duration: 110, onComplete: () => tool.destroy() });
    this.tweens.add({ targets: p, scaleY: 0.85, duration: 60, yoyo: true });
  }

  act() {
    if (this.sv.stats.stamina < 4) { this.ui.toast('Too tired...'); return; }
    const p = this.player;
    let best = null, bd = 26;
    this.nodes.getChildren().forEach(n => { const d = Phaser.Math.Distance.Between(p.x, p.y, n.x, n.y); if (d < bd) { bd = d; best = n; } });
    this.swing();
    if (this.npcs.strike(p.x, p.y, 24) || (this.net && this.net.strike(p.x, p.y, 24)) || this.creatures.strike(p.x, p.y, 24)) { this.sv.change('stamina', -4); return; }
    if (this.useStations()) return;
    if (best) { this.sv.change('stamina', -4); this.hit(best); return; }
    if (Phaser.Math.Distance.Between(p.x, p.y, this.pond.x, this.pond.y) < 40 || Phaser.Math.Distance.Between(p.x, p.y, this.lake.x, this.lake.y) < 80 || (Math.abs(p.x - 496) < 36 && p.y > 90 && p.y < 700 && !(p.y > 450 && p.y < 510))) {
      this.sv.change('thirst', 30); this.audio.sfx('drink'); this.float('+Water', p.x, p.y - 12, '#9ad0ff');
    }
  }

  hit(n, byNpc) {
    const def = NODE[n.getData('type')], hp = n.getData('hp') - (byNpc ? 1 : 1 + this.gear.tool);
    n.setData('hp', hp);
    if (!byNpc) { this.cameras.main.shake(90, 0.004); this.audio.sfx(def.sfx); }
    const e = this.add.particles(n.x, n.y, 'px', { lifespan: 400, speed: { min: 20, max: 60 }, scale: { start: 2, end: 0 }, tint: def.fx, gravityY: 80, emitting: false }).setDepth(990);
    e.explode(6); this.time.delayedCall(500, () => e.destroy());
    this.tweens.add({ targets: n, scaleX: 1.08, scaleY: 0.92, duration: 60, yoyo: true });
    if (hp <= 0) {
      const amt = def.n + (this.perk === 'Scavenger' && Math.random() < 0.5 ? 1 : 0);
      this.sv.add(def.item, amt);
      this.float(`+${amt} ${def.label}`, n.x, n.y - 12);
      if (def.bonus && Math.random() < 0.4) { const bn = Phaser.Utils.Array.GetRandom(def.bonus); this.sv.add(bn, 1); this.float('+1 ' + bn, n.x, n.y - 24, '#9ad0ff'); }
      this.audio.sfx('pickup');
      const type = n.getData('type');
      n.destroy();
      this.time.delayedCall(type === 'plane' ? 120000 : 45000, () => (type === 'plane' ? this.spawn(type, PLANE.x, PLANE.y) : this.spawn(type)));
    }
  }

  placeFire() {
    if (!this.sv.spend({ wood: 5, stone: 3 })) { this.ui.toast('Campfire needs 5 wood + 3 stone'); return; }
    const p = this.player, f = this.facing;
    const x = Math.round((p.x + f.x * 16) / 16) * 16, y = Math.round((p.y + f.y * 16) / 16) * 16;
    this.place('fire', x, y); this.built.push({ k: 'fire', x, y });
    this.audio.sfx('craft'); this.cameras.main.shake(80, 0.002);
    this.ui.toast('Campfire built. Stay close to stay warm.');
  }

  cost(c) {
    if (this.perk !== 'Engineer') return c;
    const o = {}; Object.entries(c).forEach(([k, v]) => { o[k] = Math.max(1, Math.ceil(v * 0.75)); }); return o;
  }

  craft(key) {
    const r = CRAFT[key];
    if (!this.fires.some(f => Phaser.Math.Distance.Between(this.player.x, this.player.y, f.x, f.y) < 56)) { this.ui.toast('Craft next to a campfire'); return; }
    if (!this.sv.spend(r.cost)) { this.ui.toast(`${r.give} needs ${Object.entries(r.cost).map(([k, v]) => v + ' ' + k).join(' + ')}`); return; }
    this.sv.add(r.give, 1); this.audio.sfx('craft'); this.float(`+1 ${r.give}`, this.player.x, this.player.y - 12, '#9ad0ff');
  }

  useStations() {
    if (this.ex.interact()) return true;
    const p = this.player, near = (o, r) => Phaser.Math.Distance.Between(p.x, p.y, o.x, o.y) < r;
    const c = this.crops.find(o => near(o, 20) && o.stage === 2);
    if (c) {
      c.t = 0; c.stage = 0; const n = 3 + (this.perk === 'Chef' ? 1 : 0);
      this.sv.add('berries', n); if (this.net && this.net.ch) this.net.send({ type: 'crop', cx: c.x, cy: c.y }); this.float(`+${n} Crops`, c.x, c.y - 10); this.audio.sfx('pickup'); return true;
    }
    const ch = this.chests.find(o => near(o, 24));
    if (ch) {
      const inv = this.sv.inv, keys = Object.keys(inv);
      if (keys.some(k => inv[k] > 0)) { keys.forEach(k => { ch.store[k] = (ch.store[k] || 0) + inv[k]; inv[k] = 0; }); this.float('Stored', ch.x, ch.y - 12); }
      else { Object.keys(ch.store).forEach(k => { inv[k] = (inv[k] || 0) + ch.store[k]; ch.store[k] = 0; }); this.float('Taken', ch.x, ch.y - 12); }
      if (this.net && this.net.ch) this.net.send({ type: 'chest', cx: ch.x, cy: ch.y, store: ch.store });
      this.audio.sfx('pickup'); return true;
    }
    return false;
  }

  openCreator() {
    this.uiOpen = true; this.physics.pause(); this.input.keyboard.enabled = false;
    const saved = this.readSave();
    this.ui.showCreator((o, load) => {
      this.perk = o.perk; this.playerName = o.name; this.audio.start();
      makeChar(this, 'player', o);
      this.player.setTexture('player');
      this.uiOpen = false; this.physics.resume(); this.input.keyboard.enabled = true;
      this.look = o;
      this.net = new NetManager(this);
      this.ui.toast(`${o.name} the ${o.perk}. Gather wood & stone, press C for a campfire`);
      if (load) this.restore(saved);
    }, saved);
  }

  isWarm(x, y) {
    return this.fires.some(f => Phaser.Math.Distance.Between(x, y, f.x, f.y) < 56) ||
      this.shelters.some(c => Phaser.Math.Distance.Between(x, y, c.x, c.y) < 44 + (c.lv - 1) * 14);
  }

  rollWeather() {
    const pool = [['sunny', 'sunny', 'rain', 'fog'], ['sunny', 'sunny', 'monsoon', 'fog'], ['sunny', 'fog', 'rain'], ['snow', 'snow', 'snow', 'snow', 'fog']][Math.max(0, this.seasonIdx)];
    this.setWeather(Phaser.Utils.Array.GetRandom(pool));
  }

  setWeather(w) {
    if (w === this.weather) return;
    this.weather = w;
    const rainy = w === 'rain' || w === 'monsoon';
    if (rainy) { this.rain.setFrequency(w === 'monsoon' ? 8 : 30); this.rain.start(); } else this.rain.stop();
    if (w === 'snow') this.snow.start(); else this.snow.stop();
    this.fog.setFillStyle(w === 'monsoon' ? 0x2a5f9e : 0xdfe6ee, 0);
    this.tweens.add({ targets: this.fog, fillAlpha: w === 'fog' ? 0.15 : w === 'monsoon' ? 0.1 : 0, duration: 3000 });
    this.audio.setRain(rainy);
    this.ui.toast(`Weather: ${w}`);
  }

  funeral(name, x, y) {
    this.add.image(x, y, 'grave').setDepth(y);
    this.mourning = 60;
    this.audio.tone(196, 2, 0.15, 'triangle'); this.audio.tone(147, 2.5, 0.12, 'triangle', 0.3);
    this.cameras.main.fadeIn(800, 0, 0, 0);
    this.ui.toast(`Funeral for ${name}. The survivors mourn.`);
  }

  openNPC(n) {
    this.uiOpen = true; this.physics.pause(); this.input.keyboard.enabled = false;
    const now = this.time.now;
    if (now - (n.lastTalk || -1e9) > 5000) { n.lastTalk = now; n.trust = Math.min(100, n.trust + 3); }
    const close = () => { this.uiOpen = false; this.physics.resume(); this.input.keyboard.enabled = true; };
    this.ui.showNPC(n, {
      close,
      job: v => { this.netNpc(n, 'job', v); n.job = v; if (n.state === 'idle' || n.state === 'work') n.state = v === 'Idle' ? 'idle' : 'work'; },
      gift: () => {
        if (this.sv.spend({ berries: 1 })) { this.netNpc(n, 'gift'); n.trust = Math.min(100, n.trust + 8); n.sanity = Math.min(100, n.sanity + 15); this.audio.sfx('pickup'); }
        else this.ui.toast('No berries');
      },
      ban: () => this.voteKick(n)
    });
  }

  build(i) {
    const b = BUILD[i], p = this.player, f = this.facing, off = b.off || (b.key === 'cabin' ? 28 : 18);
    const cost = this.cost(b.cost);
    if (!this.sv.spend(cost)) { this.ui.toast(`Need ${Object.entries(cost).map(([k, v]) => v + ' ' + k).join(' + ')}`); return; }
    const x = Math.round((p.x + f.x * off) / 16) * 16, y = Math.round((p.y + f.y * off) / 16) * 16;
    this.place(b.key, x, y); this.built.push({ k: b.key, x, y });
    if (this.net) this.net.sendBuild({ k: b.key, x, y });
    this.audio.sfx('craft'); this.cameras.main.shake(70, 0.002);
  }

  place(key, x, y, lv) {
    if (key === 'fire') {
    const fire = this.add.image(x, y, 'fire').setDepth(y);
    this.tweens.add({ targets: fire, scaleY: 1.15, scaleX: 0.92, duration: 180, yoyo: true, repeat: -1 });
    this.add.image(x, y, 'light').setTint(0xff9a3c).setAlpha(0.28).setScale(0.9).setBlendMode(Phaser.BlendModes.ADD).setDepth(1001);
    this.fires.push(fire);
      return;
    }
    if (key === 'sprinkler') { this.add.image(x, y, 'sprinkler').setDepth(y); this.sprinklers.push({ x, y }); return; }
    if (key === 'spike') this.spikes.push(this.add.image(x, y, 'spike').setDepth(2));
    else if (key === 'plot') this.crops.push({ x, y, t: 0, stage: 0, plant: this.add.image(x, y - 2, 'crop0').setDepth(3), img: this.add.image(x, y, 'plot').setDepth(2) });
    else if (key === 'torch') {
      this.add.image(x, y, 'torch').setDepth(y);
      this.add.image(x, y - 6, 'light').setTint(0xffb050).setAlpha(0.22).setScale(0.55).setBlendMode(Phaser.BlendModes.ADD).setDepth(1001);
      this.torches.push({ x, y });
    }
    else if (key === 'turret') { this.fences.create(x, y, 'turret').setDepth(y); this.turrets.push({ x, y }); }
    else if (key === 'chest' || key === 'storehouse') { this.fences.create(x, y, key).setDepth(y); this.chests.push({ x, y, store: {} }); }
    else {
      const img = this.fences.create(x, y, key === 'cabin' ? ['cabin', 'house', 'castle'][(lv || 1) - 1] : key).setDepth(y);
      img.setData({ key, hp: key === 'wall' ? 40 : key === 'fence' ? 8 : key === 'gate' ? 14 : 999 });
      if (key === 'cabin') this.shelters.push({ x, y, lv: lv || 1, img });
      if (key === 'greenhouse') this.greenhouses.push({ x, y });
      if (key === 'barn') this.barns.push({ x, y });
      if (key === 'well') this.wells.push({ x, y });
      if (key === 'forge') this.forges.push({ x, y });
      if (key === 'silo') this.silos.push({ x, y });
      if (key === 'temple') this.temples.push({ x, y });
      if (key === 'windmill') this.mills.push({ x, y });
      if (key === 'pen') this.pens.push({ x, y });
      if (key === 'kitchen') this.kitchens.push({ x, y });
      if (key === 'lab') this.labs.push({ x, y });
    }
  }

  surfaceAt(x, y) {
    const inR = r => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
    return inR(SAND) ? 'sand' : inR(STONE) ? 'stone' : 'grass';
  }

  isFlooded(x, y) { return this.floodLevel > 0.05 && y > H - this.floodLevel * 240; }

  netNpc(n, act, v) { if (this.net && this.net.ch) this.net.send({ type: 'npcAct', i: this.npcs.list.indexOf(n), act, v }); }

  voteKick(n) {
    const voters = this.npcs.alive().filter(o => o !== n && o.state !== 'banished');
    let yes = 1;
    voters.forEach(o => { if (n.state === 'hostile' || n.state === 'sabotage' || n.trust < 30 || (o.trust < 40 && n.sanity < 50)) yes++; });
    const total = voters.length + 1, no = total - yes;
    if (yes > total / 2) { this.netNpc(n, 'banish'); this.npcs.banish(n); this.ui.toast(`Vote ${yes}-${no}: ${n.d.name} is banished`); }
    else { n.trust = Math.max(0, n.trust - 5); this.ui.toast(`Vote ${yes}-${no}: ${n.d.name} stays`); }
  }

  readSave() { try { return JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { return null; } }
  clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* storage unavailable */ } }

  save() {
    if (this.uiOpen || this.dead || !this.look) return;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        v: 1, look: this.look, day: this.day, gameMin: this.gameMin, x: this.player.x, y: this.player.y,
        stats: this.sv.stats, inv: this.sv.inv, run: this.sv.run, built: this.built, towerPhase: this.towerPhase, gear: this.gear, interiors: this.interiors, ench: this.ench || 0, animals: this.ex.animals.map(a => ({ tamed: a.tamed, x: Math.round(a.s.x), y: Math.round(a.s.y), t: Math.round(a.t) })),
        lantern: [this.hasLantern, this.lanternOn], chests: this.chests.map(c => c.store), crops: this.crops.map(c => c.t),
        npcs: this.npcs.list.map(n => ({ trust: n.trust, morale: n.morale, sanity: n.sanity, hp: n.hp, job: n.job, gone: n.dead || n.state === 'banished' }))
      }));
    } catch (e) { /* storage unavailable */ }
  }

  restore(d) {
    this.day = d.day; this.gameMin = d.gameMin; this.player.setPosition(d.x, d.y);
    this.ench = d.ench || 0; Object.assign(this.sv.stats, d.stats); Object.assign(this.sv.inv, d.inv); Object.assign(this.sv.run, d.run);
    this.towerPhase = d.towerPhase; [this.hasLantern, this.lanternOn] = d.lantern;
    d.built.forEach(b => { this.place(b.k, b.x, b.y, b.lv); this.built.push(b); });
    this.chests.forEach((c, i) => { c.store = d.chests[i] || {}; });
    this.crops.forEach((c, i) => { c.t = d.crops[i] || 0; });
    this.npcs.list.forEach((n, i) => {
      const s = d.npcs[i]; if (!s) return;
      if (s.gone) { n.dead = true; n.s.destroy(); n.label.destroy(); if (n.hat) n.hat.destroy(); }
      else Object.assign(n, { trust: s.trust, morale: s.morale, sanity: s.sanity, hp: s.hp, job: s.job, state: s.job === 'Idle' ? 'idle' : 'work' });
    });
    if (d.gear) Object.assign(this.gear, d.gear);
    if (d.interiors) this.interiors = d.interiors;
    (d.animals || []).forEach((sa, i) => {
      const a = this.ex.animals[i]; if (!a) return;
      if (typeof sa === 'boolean') sa = { tamed: sa }; // old save format
      if (sa.x !== undefined && this.inIsland(sa.x, sa.y, 0.97)) { a.s.setPosition(sa.x, sa.y); a.tx = sa.x; a.ty = sa.y; }
      if (sa.t !== undefined) a.t = sa.t;
      if (sa.tamed) this.ex.tame(a, true);
    });
    this.ui.toast('Game loaded. Autosave is on.');
  }

  repairTower() {
    const p = this.player;
    if (Phaser.Math.Distance.Between(p.x, p.y, this.tower.x, this.tower.y) > 48) { this.ui.toast('The radio tower is north of camp'); return; }
    if (this.towerPhase >= 4) return;
    const ph = TOWER[this.towerPhase];
    const c = this.cost(ph.cost);
    if (!this.sv.spend(c)) { this.ui.toast(`${ph.name}: need ${Object.entries(c).map(([k, v]) => v + ' ' + k).join(' + ')}`); return; }
    this.towerPhase++;
    this.audio.sfx('craft'); this.cameras.main.shake(150, 0.004);
    this.ui.toast(`${ph.name} done (${this.towerPhase}/4)`);
    if (this.towerPhase === 4) {
      this.dead = true; this.physics.pause(); this.audio.stop();
      this.clearSave(); this.ui.showVictory({ days: this.day });
    }
  }

  update(t, dt) {
    if (this.dead || this.uiOpen) return;
    const s = dt / 1000, p = this.player, k = this.keys, c = this.cursors, cam = this.cameras.main;

    // Clock
    this.gameMin += s * 0.6; // 20 real min day + 20 real min night
    if (this.gameMin >= 1440) { this.gameMin -= 1440; this.day++; this.ui.toast(`Day ${this.day}`); }
    const h = this.gameMin / 60, dark = this.darkness(h);
    const sIdx = Math.floor((this.day - 1) / 10) % 4;
    if (sIdx !== this.seasonIdx) { this.seasonIdx = sIdx; this.tintRect.setFillStyle(SEASON_TINT[sIdx], 0.02); this.ui.toast(`${SEASONS[sIdx]} begins`); this.grassTS.setTexture('grass_' + sIdx); this.dirtTS.forEach(t => t.setTexture('dirt_' + sIdx)); this.decor.forEach(d => d.setTexture('dec_' + sIdx)); this.applySeasonTints(sIdx); if (sIdx === 3) this.ui.toast('The river froze - you can walk across it!'); this.cliffTop.forEach(c => c.setTexture('grass_' + sIdx)); this.hills.forEach(h => h.setFillStyle([0x78d85a, 0x5cc048, 0xbdb248, 0xf2f8ff][sIdx])); if (this.weather !== undefined) this.setWeather(sIdx === 3 ? 'snow' : 'sunny'); this.nodes.children.iterate(n => { if (n && n.texture.key.startsWith('tree_')) n.setTexture('tree_' + sIdx); }); }
    this.audio.setNight(dark > 0.5);
    this.riverTS.forEach(r => { r.tilePositionY = -t / 60; }); this.sea.tilePositionX = t / 90; this.sea.tilePositionY = Math.sin(t / 1500) * 6;

    // Movement
    let vx = (k.D.isDown || c.right.isDown ? 1 : 0) - (k.A.isDown || c.left.isDown ? 1 : 0);
    let vy = (k.S.isDown || c.down.isDown ? 1 : 0) - (k.W.isDown || c.up.isDown ? 1 : 0);
    const moving = vx !== 0 || vy !== 0;
    if (moving) { const v = new Phaser.Math.Vector2(vx, vy).normalize(); this.facing.copy(v); const sp = (this.weather === 'monsoon' ? 0.7 : 1) * (this.isFlooded(p.x, p.y) ? 0.5 : 1); p.setVelocity(v.x * 70 * sp, v.y * 70 * sp); }
    else p.setVelocity(0, 0);
    p.setDepth(p.y);
    if (this.inIsland(p.x, p.y)) { this.lastSafe.x = p.x; this.lastSafe.y = p.y; } else { p.setPosition(this.lastSafe.x, this.lastSafe.y); p.setVelocity(0, 0); }
    if (moving && t > this.nextStep) { this.nextStep = t + 220; this.dust.explode(2, p.x, p.y + 7); this.audio.step(this.surfaceAt(p.x, p.y)); }

    // Actions
    if (Phaser.Input.Keyboard.JustDown(k.SPACE)) this.act();
    if (Phaser.Input.Keyboard.JustDown(k.C)) this.placeFire();
    if (Phaser.Input.Keyboard.JustDown(k.E)) this.eat();
    if (Phaser.Input.Keyboard.JustDown(k.T)) { const n = this.npcs.nearest(p.x, p.y, 36); if (n) this.openNPC(n); else this.ui.toast('No one nearby'); }
    if (Phaser.Input.Keyboard.JustDown(k.F)) this.repairTower();
    if (Phaser.Input.Keyboard.JustDown(k.H)) this.enterHouse();
    if (Phaser.Input.Keyboard.JustDown(k.Y)) this.sleepOutside(h);
    if (Phaser.Input.Keyboard.JustDown(k.U)) this.ex.upgrade();
    if (Phaser.Input.Keyboard.JustDown(k.Q)) this.ex.buildMenu();
    [k.ONE, k.TWO, k.THREE, k.FOUR, k.FIVE, k.SIX, k.SEVEN, k.EIGHT, k.NINE].forEach((key, i) => { if (Phaser.Input.Keyboard.JustDown(key)) { if (k.SHIFT.isDown || this.forceBuild) this.build(i + 1); else { this.ui.sel = (this.ui.off || 0) + i; this.ui._inv = null; } } });
    ['Z', 'X', 'V', 'B', 'N'].forEach(ch => { if (Phaser.Input.Keyboard.JustDown(k[ch])) this.craft(ch); });
    if (Phaser.Input.Keyboard.JustDown(k.L)) {
      if (this.hasLantern) { this.lanternOn = !this.lanternOn; this.ui.toast(this.lanternOn ? 'Lantern on' : 'Lantern off'); }
      else if (this.sv.spend({ plate: 1, charcoal: 1 })) { this.hasLantern = true; this.lanternOn = true; this.audio.sfx('craft'); this.ui.toast('Lantern crafted'); }
      else this.ui.toast('Lantern: 1 plate + 1 charcoal');
    }

    // Survival
    const nearFire = this.isWarm(p.x, p.y);
    this.sv.update(s, { night: dark > 0.5, winter: sIdx === 3, nearFire, moving, wet: ['rain', 'monsoon', 'snow'].includes(this.weather) || this.isFlooded(p.x, p.y) });
    if (this.sv.isDead()) {
      this.dead = true; this.physics.pause(); this.audio.stop();
      this.clearSave(); this.ui.showDeath({ days: this.day, gathered: this.sv.run.gathered });
      return;
    }

    if (this.mourning > 0) { this.mourning -= s; this.sv.change('morale', -0.5 * s); }
    if (this.net && this.net.ch && !this.net.isHost()) this.npcs.mirror(s); else this.npcs.update(s, t, dark > 0.5);
    this.creatures.update(s, t, dark);
    this.ex.update(s, t);
    if (this.perk === 'Medic') this.sv.change('health', 0.3 * s);
    this.turrets.forEach(tu => { this.npcs.damageAt(tu.x, tu.y, 90, 1.5 * s); this.creatures.damageAt(tu.x, tu.y, 90, 1.5 * s); });
    this.crops.forEach(c => {
      const frozen = sIdx === 3 && !this.greenhouses.some(g => Phaser.Math.Distance.Between(c.x, c.y, g.x, g.y) < 36);
      if (frozen) { c.t = 0; c.stage = 0; c.plant.setTexture('crop0').setTint(0x9ad0ff); }
      else { c.plant.clearTint(); c.t += s * (this.onSoil(c.x, c.y) ? 1.5 : 1) * (this.sprinklers.some(sp => Phaser.Math.Distance.Between(c.x, c.y, sp.x, sp.y) < 40) ? 2 : 1) * (this.mills.some(m => Phaser.Math.Distance.Between(c.x, c.y, m.x, m.y) < 120) ? 1.5 : 1); if (this.isFlooded(c.x, c.y)) c.t = 0; c.stage = c.t > 40 ? 2 : c.t > 20 ? 1 : 0; c.plant.setTexture('crop' + c.stage); }
    });
    if (this.net) this.net.update(s);
    this.floodLevel = Phaser.Math.Clamp(this.floodLevel + (this.weather === 'monsoon' ? s / 20 : -s / 30), 0, 1);
    this.floodRect.setSize(W, this.floodLevel * 240).setVisible(this.floodLevel > 0.01);
    this.spikes.forEach(sp => { this.npcs.damageAt(sp.x, sp.y, 12, 1.2 * s); this.creatures.damageAt(sp.x, sp.y, 12, 1.2 * s); });

    // Night darkness with light holes
    this.dark.clear();
    if (dark > 0.02) {
      this.dark.fill(0x070b24, dark);
      this.lightImg.setScale(this.lanternOn ? 1.9 : 1);
      this.dark.erase(this.lightImg, p.x - cam.scrollX, p.y - cam.scrollY);
      this.torches.forEach(tc => { this.lightImg.setScale(0.9 + Math.sin(t / 130 + tc.x) * 0.05); this.dark.erase(this.lightImg, tc.x - cam.scrollX, tc.y - cam.scrollY); });
      this.fires.forEach(f => {
        this.lightImg.setScale(1.5 + Math.sin(t / 110 + f.x) * 0.1);
        this.dark.erase(this.lightImg, f.x - cam.scrollX, f.y - cam.scrollY);
      });
    }

    this.ui.update(this.sv, { day: this.day, h, season: SEASONS[sIdx], mourning: this.mourning > 0, gear: this.ex.gearChips() });
  }
}
