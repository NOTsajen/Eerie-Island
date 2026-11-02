import { JOBS } from './NPCManager.js';
import { chip, icon } from './Icons.js';

const BARS = [['health', '#ff4a5a', 'heart'], ['stamina', '#ffd83a', 'bolt'], ['hunger', '#ff9a3a', 'meat'], ['thirst', '#3ab4ff', 'drop'], ['warmth', '#ff6a2a', 'flame'], ['morale', '#c27aff', 'smile']];

export default class UIManager {
  constructor() {
    this.hud = document.getElementById('hud');
    this.hud.innerHTML = '<div id="clock"></div><div id="gear"></div>'; const iv = document.createElement('div'); iv.id = 'inv'; document.body.appendChild(iv);
    document.getElementById('vbar').innerHTML = BARS.map(([k, c, ic]) => `<div class="vs" id="s-${k}" title="${k}"><img src="${icon(ic)}" alt="${k}"><div class="vt"><b id="b-${k}" style="background:linear-gradient(#fff6 0 25%,${c} 25% 75%,#0004 75%)"></b></div></div>`).join('');
    this.bars = Object.fromEntries(BARS.map(([k]) => [k, document.getElementById('b-' + k)]));
    this.clock = document.getElementById('clock'); this.gearEl = document.getElementById('gear'); this.sel = 0; this.off = 0; this.items = []; window.addEventListener('wheel', e => { if (e.target.closest && e.target.closest('#modal.show')) return; this.sel += e.deltaY > 0 ? 1 : -1; this._inv = null; }, { passive: true });
    this.inv = document.getElementById('inv'); this.inv.addEventListener('pointerdown', e => { const b = e.target.closest('[data-slot]'); if (b) { this.sel = +b.dataset.slot; this._inv = null; } });
    this.toastEl = document.getElementById('toast');
    this.modal = document.getElementById('modal');
    this.icons = new Set(['wood', 'stone', 'berries', 'iron', 'scrap', 'copper', 'charcoal', 'plate', 'circuit', 'battery', 'transceiver', 'egg', 'milk', 'meat', 'gold', 'diamond', 'ruby', 'emerald', 'amethyst', 'bone', 'relic', 'key', 'slime']);
  }

  update(sv, { day, h, season, mourning, gear }) {
    for (const [k] of BARS) { const v = sv.stats[k]; this.bars[k].style.width = v.toFixed(0) + '%'; document.getElementById('s-' + k).classList.toggle('low', v < 25); }
    const H = Math.floor(h), mn = Math.floor((h % 1) * 60 / 10) * 10, ap = H >= 12 && H < 24 ? 'pm' : 'am', h12 = H % 12 || 12;
    const WD = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], dis = ((day - 1) % 10) + 1;
    this.clock.innerHTML = `${WD[(day - 1) % 7]}. ${dis} · ${season}<small>${h12}:${String(mn).padStart(2, '0')} ${ap} · ${h >= 18 || h < 6 ? '🌙 Night' : '☀ Day'} · Day ${day}${mourning ? ' · Mourning' : ''}</small>`;
    const items = Object.entries(sv.inv).filter(([, v]) => v > 0); this.items = items.map(e => e[0]);
    let html = '';
    this.sel = Math.max(0, Math.min(this.sel, Math.max(8, items.length - 1)));
    const off = items.length > 9 ? Math.max(0, Math.min(this.sel - 4, items.length - 9)) : 0; this.off = off;
    for (let j = 0; j < 9; j++) {
      const i = off + j, it = items[i], cls = 'chip slot' + (i === this.sel ? ' sel' : '');
      html += it ? chip(it[0], it[1] + (this.icons.has(it[0]) ? '' : '<br>' + it[0])).replace('<span class="chip">', `<span class="${cls}" data-slot="${i}"><i class="kn">${j + 1}</i>`) : `<span class="${cls}" data-slot="${i}"><i class="kn">${j + 1}</i></span>`;
    }
    if (items.length > 9) html += `<span class="more">${off + 1}-${off + 9}/${items.length}</span>`;
    const gh = (gear || []).map(([ic, t]) => chip(ic, t)).join('');
    if (gh !== this._gear) { this._gear = gh; this.gearEl.innerHTML = gh; }
    if (html !== this._inv) { this._inv = html; this.inv.innerHTML = html; }
  }

  toast(msg) {
    this.toastEl.textContent = msg;
    this.toastEl.classList.add('show');
    clearTimeout(this._t);
    this._t = setTimeout(() => this.toastEl.classList.remove('show'), 1800);
  }

  showCreator(cb, saved) {
    this.modal.innerHTML = `<div class="card npc"><h3>Create your survivor</h3>
      <p>Name <input id="c-name" value="Survivor" maxlength="12"></p>
      <p>Skin <select id="c-skin"><option value="#f1c9a5">Light</option><option value="#e0b48c" selected>Tan</option><option value="#a8754f">Brown</option><option value="#6b4630">Dark</option></select>
      Style <select id="c-style"><option value="short">Short</option><option value="long">Long</option><option value="cap">Cap</option></select></p>
      <p>Hair <input type="color" id="c-hair" value="#3b2a1a"> Shirt <input type="color" id="c-shirt" value="#2f6fb3"> Pants <input type="color" id="c-pants" value="#3a3a5a"></p>
      <p>Perk <select id="c-perk"><option>Medic</option><option>Engineer</option><option>Scavenger</option><option>Chef</option></select></p>
      <p class="story">Medic: slow health regen. Engineer: builds cost 25% less. Scavenger: bonus loot. Chef: food restores more.</p>
      <button id="c-go">Start</button>${saved ? ' <button id="c-load">Continue saved game</button>' : ''}</div>`;
    this.modal.classList.add('show');
    const v = id => document.getElementById(id).value, n = id => parseInt(v(id).slice(1), 16);
    document.getElementById('c-go').onclick = () => {
      const o = { name: v('c-name') || 'Survivor', skin: n('c-skin'), style: v('c-style'), hair: n('c-hair'), shirt: n('c-shirt'), pants: n('c-pants'), perk: v('c-perk') };
      this.hideModal(); cb(o);
    };
    if (saved) document.getElementById('c-load').onclick = () => { this.hideModal(); cb(saved.look, true); };
  }

  showNPC(n, A) {
    const row = (l, v, c) => `<div class="bar"><span>${l}</span><i><b style="width:${v.toFixed(0)}%;background:${c}"></b></i></div>`;
    const lock = [25, 50, 75];
    const render = () => {
      this.modal.innerHTML = `<div class="card npc"><img src="${this.portrait(n)}" style="width:48px;height:64px;image-rendering:pixelated;float:right;border:3px solid #6b4423"><h3>${n.d.name} · ${n.d.gender === 'F' ? 'she' : 'he'} · ${n.state}</h3>` +
        row('TRU', n.trust, '#4aa0e0') + row('SAN', n.sanity, '#b070d0') + row('MOR', n.morale, '#e0c040') +
        `<p class="story"><b>${n.d.age} · ${n.d.profession} · ${n.d.role}</b><br>${n.d.perk}<br>Likes: ${n.d.likes}<br>Dislikes: ${n.d.dislikes}</p>` +
        n.d.story.map((st, i) => `<p class="story">• ${n.trust >= lock[i] ? st : `[locked: trust ${lock[i]}]`}</p>`).join('') +
        `<p class="story">${n.trust >= 100 ? '★ ' + n.d.heart : '[locked: trust 100]'}</p>` +
        `<div>Job: ${JOBS.map(j => `<button data-a="job" data-v="${j}">${j === n.job ? '[' + j + ']' : j}</button>`).join('')}</div>` +
        '<div><button data-a="gift">Gift berries</button><button data-a="ban">Call vote to banish</button><button data-a="close">Close</button></div></div>';
      this.modal.classList.add('show');
    };
    this._esc = e => { if (e.key === 'Escape') { this.hideModal(); A.close(); } };
    window.addEventListener('keydown', this._esc);
    this.modal.onclick = e => {
      const b = e.target.closest('button'); if (!b) return;
      const a = b.dataset.a;
      if (a === 'close') { this.hideModal(); A.close(); return; }
      A[a](b.dataset.v);
      if (a === 'ban') { this.hideModal(); A.close(); return; }
      render();
    };
    render();
  }

  portrait(n) {
    const c = document.createElement('canvas'); c.width = 12; c.height = 16; const g = c.getContext('2d');
    const px = (col, x, y, w, h) => { g.fillStyle = '#' + col.toString(16).padStart(6, '0'); g.fillRect(x, y, w, h); };
    const d = n.d, mad = n.state === 'sabotage' || n.state === 'hostile';
    px(0xc9a96a, 0, 0, 12, 16);
    px(d.hair, 3, 0, 6, 3);
    if (d.gender === 'F') { px(d.hair, 2, 3, 1, 6); px(d.hair, 9, 3, 1, 6); }
    px(0xe0b48c, 3, 3, 6, 5);
    px(mad ? 0xd94a4a : 0x222222, 4, 5, 1, 1); px(mad ? 0xd94a4a : 0x222222, 7, 5, 1, 1);
    px(0x7a2e1a, 5, n.sanity < 50 ? 7 : 6, 2, 1);
    px(d.shirt, 2, 8, 8, 8);
    return c.toDataURL();
  }

  hideModal() { this.modal.classList.remove('show'); this.modal.onclick = null; window.removeEventListener('keydown', this._esc); }

  showVictory(info) {
    this.modal.innerHTML = `<div class="card"><h2>Signal Sent!</h2><p>Rescue is coming. Days on the island: ${info.days}</p><p>Press R to play again</p></div>`;
    this.modal.classList.add('show');
    window.addEventListener('keydown', e => { if (e.key.toLowerCase() === 'r') location.reload(); });
  }

  showDeath(info) {
    this.modal.innerHTML = `<div class="card"><h2>You Perished</h2><p>Days survived: ${info.days}</p><p>Resources gathered: ${info.gathered}</p><p>Press R to restart</p></div>`;
    this.modal.classList.add('show');
    window.addEventListener('keydown', e => { if (e.key.toLowerCase() === 'r') location.reload(); });
  }
}
