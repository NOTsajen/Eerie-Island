import Phaser from 'phaser';
import { ROSTER } from '../systems/NPCManager.js';
import { makeArt } from '../systems/Art.js';

// Generates every texture with code, so no asset files are needed.
export default class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }
  create() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const r = (c, x, y, w, h) => { g.fillStyle(c, 1); g.fillRect(x, y, w, h); };
    const tex = (key, w, h, fn) => { g.clear(); fn(); g.generateTexture(key, w, h); };

    tex('grass', 16, 16, () => { r(0x4f8a3c, 0, 0, 16, 16); r(0x5c9a46, 2, 3, 2, 2); r(0x45792f, 9, 10, 2, 2); r(0x6aa84f, 12, 2, 1, 2); });
    tex('player', 12, 16, () => { r(0x3b2a1a, 3, 0, 6, 3); r(0xe0b48c, 3, 3, 6, 5); r(0x2f6fb3, 2, 8, 8, 5); r(0x3a3a5a, 3, 13, 2, 3); r(0x3a3a5a, 7, 13, 2, 3); });
    tex('tree', 20, 28, () => { r(0x5a3b1f, 8, 16, 4, 12); r(0x2e6b2e, 2, 6, 16, 12); r(0x3f8a3a, 4, 0, 12, 10); r(0x57a64a, 6, 2, 4, 3); });
    tex('rock', 14, 10, () => { r(0x7b7f86, 1, 3, 12, 7); r(0x9aa0a8, 3, 1, 8, 4); r(0x5d6168, 1, 8, 12, 2); });
    tex('bush', 12, 10, () => { r(0x2f7a3a, 0, 3, 12, 7); r(0x3f9a4a, 2, 0, 8, 5); r(0xc0334d, 3, 4, 2, 2); r(0xc0334d, 8, 6, 2, 2); });
    tex('fire', 10, 12, () => { r(0x5a3b1f, 0, 9, 10, 3); r(0xe8761c, 2, 3, 6, 7); r(0xffd24a, 3, 5, 4, 5); });
    tex('pond', 48, 32, () => { r(0x2a5f9e, 4, 0, 40, 32); r(0x2a5f9e, 0, 4, 48, 24); r(0x4a8ad0, 8, 6, 12, 2); r(0x4a8ad0, 26, 18, 10, 2); });
    tex('px', 2, 2, () => r(0xffffff, 0, 0, 2, 2));
    tex('tool', 9, 3, () => { r(0x8a8f99, 5, 0, 4, 3); r(0x5a3b1f, 0, 1, 6, 1); });

    ROSTER.forEach((d, i) => tex('npc' + i, 12, 16, () => {
      r(d.hair, 3, 0, 6, 3);
      if (d.gender === 'F') { r(d.hair, 2, 3, 1, 5); r(d.hair, 9, 3, 1, 5); }
      r(0xe0b48c, 3, 3, 6, 5); r(d.shirt, 2, 8, 8, 5); r(0x3a3a5a, 3, 13, 2, 3); r(0x3a3a5a, 7, 13, 2, 3);
    }));
    tex('fence', 16, 16, () => { r(0x8a5a2b, 0, 6, 16, 3); r(0x6b4423, 1, 2, 3, 12); r(0x6b4423, 12, 2, 3, 12); });
    tex('spike', 12, 12, () => { r(0x9aa0a8, 1, 6, 2, 6); r(0x9aa0a8, 5, 3, 2, 9); r(0x9aa0a8, 9, 6, 2, 6); r(0x5a3b1f, 0, 10, 12, 2); });
    tex('cabin', 32, 28, () => { r(0x6b4423, 2, 10, 28, 18); r(0x9a3b2a, 0, 2, 32, 10); r(0x2a1a0e, 13, 16, 6, 12); r(0xffd24a, 5, 15, 4, 4); });
    tex('tower', 24, 44, () => { r(0x6a6f78, 8, 12, 8, 32); r(0x4a4f58, 4, 38, 16, 6); r(0xc0c4cc, 10, 0, 4, 14); r(0xd94a4a, 10, 0, 4, 2); r(0xc0c4cc, 4, 14, 16, 2); });
    tex('grave', 10, 12, () => { r(0x9aa0a8, 2, 0, 6, 10); r(0x6a6f78, 0, 8, 10, 4); });

    tex('plot', 16, 16, () => { r(0x6b4423, 0, 0, 16, 16); r(0x5a3b1f, 2, 3, 12, 2); r(0x5a3b1f, 2, 9, 12, 2); });
    tex('crop0', 12, 12, () => r(0x57a64a, 5, 8, 2, 4));
    tex('crop1', 12, 12, () => { r(0x57a64a, 5, 4, 2, 8); r(0x3f8a3a, 3, 5, 2, 2); r(0x3f8a3a, 7, 5, 2, 2); });
    tex('crop2', 12, 12, () => { r(0x57a64a, 5, 4, 2, 8); r(0xc0334d, 2, 2, 3, 3); r(0xc0334d, 7, 3, 3, 3); });
    tex('greenhouse', 32, 28, () => { r(0xb8e0ff, 2, 6, 28, 22); r(0x6b4423, 0, 4, 32, 3); r(0x6b4423, 15, 6, 2, 22); r(0x6b4423, 0, 26, 32, 2); });
    tex('chest', 14, 12, () => { r(0x8a5a2b, 0, 2, 14, 10); r(0x6b4423, 0, 5, 14, 2); r(0xffd24a, 6, 6, 2, 3); });
    tex('turret', 14, 16, () => { r(0x4a4f58, 3, 6, 8, 10); r(0x8a8f99, 1, 2, 12, 5); r(0xd94a4a, 11, 3, 3, 2); });
    tex('iron', 14, 10, () => { r(0x6a5a4a, 1, 3, 12, 7); r(0xb87333, 3, 1, 8, 4); r(0xd89a5a, 4, 4, 2, 2); });
    tex('ruin', 16, 14, () => { r(0x6a6f78, 1, 4, 14, 10); r(0x8a8f99, 0, 2, 16, 3); r(0x4a4f58, 6, 7, 4, 7); });

    tex('shade', 12, 12, () => { r(0x2a1a3a, 1, 2, 10, 10); r(0x2a1a3a, 3, 0, 6, 2); r(0xff3030, 3, 4, 2, 2); r(0xff3030, 7, 4, 2, 2); });
    tex('torch', 6, 14, () => { r(0x5a3b1f, 2, 5, 2, 9); r(0xe8761c, 1, 1, 4, 5); r(0xffd24a, 2, 2, 2, 3); });

    tex('copper', 14, 10, () => { r(0x5a5a50, 1, 3, 12, 7); r(0x3aa07a, 3, 1, 8, 4); r(0xb87333, 4, 4, 2, 2); });
    tex('sprinkler', 10, 12, () => { r(0x8a8f99, 4, 4, 2, 8); r(0x4aa0e0, 1, 1, 8, 3); });
    tex('sand', 16, 16, () => { r(0xd8c27a, 0, 0, 16, 16); r(0xc9b068, 3, 4, 2, 1); r(0xe6d490, 10, 11, 2, 1); });
    tex('floor', 16, 16, () => { r(0x7b7f86, 0, 0, 16, 16); r(0x6a6f78, 0, 0, 16, 1); r(0x6a6f78, 0, 8, 16, 1); r(0x6a6f78, 8, 0, 1, 8); r(0x6a6f78, 4, 8, 1, 8); });

    tex('cave', 32, 28, () => { r(0x4a4f58, 0, 6, 32, 22); r(0x6a6f78, 2, 2, 28, 8); r(0x8a8f99, 6, 0, 20, 4); r(0x0a0610, 8, 12, 16, 16); r(0x1a1226, 10, 10, 12, 4); r(0x3a3f48, 0, 24, 32, 4); r(0xffd24a, 15, 18, 2, 2); });

    // Soft radial light used to cut holes in the night darkness.
    const c = this.textures.createCanvas('light', 128, 128);
    const ctx = c.getContext();
    const gr = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, 128, 128);
    c.refresh();

    makeArt(this);
    this.scene.start('Game');
  }
}
