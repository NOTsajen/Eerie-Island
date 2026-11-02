import Phaser from 'phaser';

// Room sync over BroadcastChannel (works across tabs of one browser).
// Message protocol: {type:'state'|'chat'|'ping'|'mode'|'hit', id, name, x, y, ...}
// For real online play, replace send() and the channel's onmessage with a WebSocket/WebRTC relay.
export default class NetManager {
  constructor(sc) {
    this.sc = sc; this.id = Math.random().toString(36).slice(2, 8); this.name = sc.playerName;
    this.known = new Set(); this.code = null; this.mode = 'coop'; this.peers = new Map(); this.ch = null; this.acc = 0;
    this.log = document.getElementById('log'); this.msg = document.getElementById('msg'); this.room = document.getElementById('room');
    window.addEventListener('keydown', e => this.onKey(e));
    this.renderRoom();
    this.say('System', 'Enter = chat (/l local), M = room, P = ping');
  }

  onKey(e) {
    const typing = document.activeElement === this.msg;
    const inInput = document.activeElement && document.activeElement.tagName === 'INPUT';
    if (e.key === 'Enter') {
      if (typing) { const t = this.msg.value.trim(); this.hideMsg(); if (t) this.chat(t); }
      else if (!this.sc.uiOpen && !inInput) { this.msg.style.display = 'block'; this.msg.focus(); e.preventDefault(); }
    } else if (e.key === 'Escape' && typing) this.hideMsg();
    else if (!inInput && e.key.toLowerCase() === 'm') this.room.style.display = this.room.style.display === 'block' ? 'none' : 'block';
    else if (!inInput && e.key.toLowerCase() === 'p') this.ping();
  }

  // The peer with the lowest id runs the shared world (animals); everyone else mirrors it.
  isHost() { for (const id of this.peers.keys()) if (id < this.id) return false; return true; }

  bkey(b) { return b.k + ',' + b.x + ',' + b.y; }
  sendBuild(b) { this.known.add(this.bkey(b)); this.send({ type: 'build', b }); }
  addBuild(b) { if (!b || this.known.has(this.bkey(b)) || this.sc.built.some(o => this.bkey(o) === this.bkey(b))) return; this.known.add(this.bkey(b)); this.sc.place(b.k, b.x, b.y, b.lv); }

  hideMsg() { this.msg.value = ''; this.msg.style.display = 'none'; this.msg.blur(); }

  say(from, text) {
    const d = document.createElement('div'); d.textContent = `${from}: ${text}`; this.log.appendChild(d);
    while (this.log.children.length > 6) this.log.removeChild(this.log.firstChild);
  }

  chat(t) {
    const scope = t.startsWith('/l ') ? 'local' : 'global', text = t.replace(/^\/[gl]\s+/, '');
    this.say(this.name + (scope === 'local' ? ' (local)' : ''), text);
    this.send({ type: 'chat', scope, text });
  }

  send(m) {
    if (!this.ch) return;
    const p = this.sc.player;
    this.ch.postMessage({ ...m, id: this.id, name: this.name, x: p.x, y: p.y });
  }

  join(code) {
    if (this.ch) this.ch.close();
    this.code = code.toUpperCase();
    const url = import.meta.env.VITE_WS_URL;
    if (url) {
      const ws = new WebSocket(`${url}?room=${this.code}`);
      ws.onmessage = e => { try { this.recv(JSON.parse(e.data)); } catch (err) { /* ignore bad packet */ } };
      this.ch = { postMessage: m => { if (ws.readyState === 1) ws.send(JSON.stringify(m)); }, close: () => ws.close() };
    } else {
      const bc = new BroadcastChannel('island-echoes-' + this.code);
      bc.onmessage = e => this.recv(e.data);
      this.ch = bc;
    }
    this.say('System', `Joined room ${this.code}`);
    this.renderRoom();
  }

  recv(m) {
    if (m.id === this.id) return;
    const sc = this.sc;
    if (m.type === 'state') {
      let r = this.peers.get(m.id);
      if (!r) {
        r = { s: sc.add.sprite(m.x, m.y, 'player').setTint(0xaaccff), l: sc.add.text(m.x, m.y - 14, m.name, { fontFamily: 'monospace', fontSize: '7px', color: '#9ad0ff', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5).setDepth(1001) };
        this.peers.set(m.id, r); this.say('System', `${m.name} joined.`);
        this.send({ type: 'builds', list: sc.built.map(b => ({ ...b })) }); // let the newcomer see our base
        this.send({ type: 'chests', list: sc.chests.map(c => [c.x, c.y, c.store]) });
      }
      r.s.setPosition(m.x, m.y).setDepth(m.y); r.l.setPosition(m.x, m.y - 14); r.seen = performance.now();
    } else if (m.type === 'build') this.addBuild(m.b);
    else if (m.type === 'builds') (m.list || []).forEach(b => this.addBuild(b));
    else if (m.type === 'animals') { if (!this.isHost()) sc.ex.applyNet(m.list); }
    else if (m.type === 'npcs') { if (!this.isHost()) sc.npcs.applyNet(m.list); }
    else if (m.type === 'npcAct') { if (this.isHost()) sc.npcs.netAct(m); }
    else if (m.type === 'crops') { if (!this.isHost()) m.list.forEach(([x, y, t]) => { const c = sc.crops.find(o => o.x === x && o.y === y); if (c) c.t = t; }); }
    else if (m.type === 'crop') { const c = sc.crops.find(o => o.x === m.cx && o.y === m.cy); if (c) { c.t = 0; c.stage = 0; } }
    else if (m.type === 'chest') { const c = sc.chests.find(o => o.x === m.cx && o.y === m.cy); if (c) c.store = m.store || {}; }
    else if (m.type === 'chests') (m.list || []).forEach(([x, y, store]) => { const c = sc.chests.find(o => o.x === x && o.y === y); if (c) c.store = store; });
    else if (m.type === 'animalAct') { if (this.isHost()) sc.ex.netAct(m); }
    else if (m.type === 'chat') {
      if (m.scope === 'global' || Phaser.Math.Distance.Between(m.x, m.y, sc.player.x, sc.player.y) < 200) this.say(m.name + (m.scope === 'local' ? ' (local)' : ''), m.text);
    } else if (m.type === 'ping') this.drawPing(m.x, m.y, m.name);
    else if (m.type === 'mode') { this.mode = m.mode; this.say('System', `${m.name} set ${m.mode} mode`); this.renderRoom(); }
    else if (m.type === 'hit' && m.target === this.id) {
      sc.sv.change('health', -10); sc.cameras.main.shake(120, 0.006); this.say('System', `${m.name} attacked you!`);
    }
  }

  ping() { const p = this.sc.player; this.drawPing(p.x, p.y, this.name); this.send({ type: 'ping' }); }

  drawPing(x, y, name) {
    const sc = this.sc;
    const c = sc.add.circle(x, y, 4, 0xffd24a, 0).setStrokeStyle(2, 0xffd24a).setDepth(1002);
    sc.tweens.add({ targets: c, scale: 5, alpha: 0, duration: 900, onComplete: () => c.destroy() });
    sc.float('Ping: ' + name, x, y - 12, '#ffd24a');
  }

  strike(x, y, r) {
    if (this.mode !== 'betrayal') return false;
    for (const [id, p] of this.peers) {
      if (Phaser.Math.Distance.Between(x, y, p.s.x, p.s.y) < r) { this.send({ type: 'hit', target: id }); this.sc.cameras.main.shake(90, 0.005); this.sc.audio.sfx('chop'); return true; }
    }
    return false;
  }

  update(s) {
    if (!this.ch) return;
    this.acc += s;
    if (this.acc > 0.1) { this.acc = 0; this.send({ type: 'state' }); }
    this.an = (this.an || 0) + s;
    if (this.an > 0.4) { this.an = 0; if (this.isHost()) { this.send({ type: 'animals', list: this.sc.ex.snapshot() }); this.send({ type: 'npcs', list: this.sc.npcs.snapshot() }); } }
    this.cr = (this.cr || 0) + s;
    if (this.cr > 1.5) { this.cr = 0; if (this.isHost()) this.send({ type: 'crops', list: this.sc.crops.map(c => [c.x, c.y, Math.round(c.t)]) }); }
    const now = performance.now();
    this.peers.forEach((r, id) => { if (now - r.seen > 2000) { r.s.destroy(); r.l.destroy(); this.peers.delete(id); } });
  }

  renderRoom() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    this.room.innerHTML = `<b>Room</b> ${this.code || '(offline)'}<br>Mode: <button id="r-mode">${this.mode}</button><br><button id="r-new">New room</button> <input id="r-code" size="5" placeholder="CODE"><button id="r-join">Join</button><br><small>${import.meta.env.VITE_WS_URL ? 'Online relay' : 'Same-browser tabs only'}</small>`;
    document.getElementById('r-new').onclick = () => this.join(Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join(''));
    document.getElementById('r-join').onclick = () => { const v = document.getElementById('r-code').value.trim(); if (v) this.join(v); };
    document.getElementById('r-mode').onclick = () => { this.mode = this.mode === 'coop' ? 'betrayal' : 'coop'; this.send({ type: 'mode', mode: this.mode }); this.renderRoom(); };
  }
}
