// Procedural audio: no mp3 files needed.
export default class AudioManager {
  constructor() { this.ctx = null; this.night = false; this.tick = 0; this.rain = false; }

  start() {
    if (this.ctx) { this.ctx.resume(); return; }
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return;
    this.ctx = new C();
    this.master = this.ctx.createGain(); this.master.gain.value = 0.5; this.master.connect(this.ctx.destination);
    const len = this.ctx.sampleRate;
    this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    // Night drone
    const o = this.ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 55;
    const lp = this.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 180;
    this.droneGain = this.ctx.createGain(); this.droneGain.gain.value = 0;
    o.connect(lp); lp.connect(this.droneGain); this.droneGain.connect(this.master); o.start();
    this.timer = setInterval(() => this.loop(), 1000);
  }

  setRain(on) { this.rain = on; }

  stop() { clearInterval(this.timer); if (this.droneGain) this.droneGain.gain.value = 0; }

  setNight(n) {
    if (!this.ctx || n === this.night) return;
    this.night = n;
    this.droneGain.gain.linearRampToValueAtTime(n ? 0.08 : 0, this.ctx.currentTime + 3);
  }

  loop() {
    this.tick++;
    if (this.rain) this.noise(6000, 1, 0.04, 'highpass');
    if (!this.night) {
      if (this.tick % 4 === 0) {
        const sets = [[261.6, 329.6, 392], [220, 261.6, 329.6], [174.6, 220, 261.6], [196, 246.9, 293.7]];
        sets[Math.floor(Math.random() * sets.length)].forEach((f, i) => this.tone(f, 1.2, 0.05, 'triangle', i * 0.12));
      }
    } else {
      for (let i = 0; i < 3; i++) this.tone(4200 + Math.random() * 300, 0.04, 0.015, 'sine', i * 0.09);
      if (this.tick % 7 === 0) this.noise(400, 2, 0.05, 'lowpass');
    }
  }

  tone(freq, dur, vol = 0.2, type = 'sine', when = 0) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + when;
    const o = this.ctx.createOscillator(); o.type = type; o.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + 0.05);
  }

  noise(freq, dur, vol = 0.2, filter = 'bandpass') {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const s = this.ctx.createBufferSource(); s.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter(); f.type = filter; f.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(this.master); s.start(t); s.stop(t + dur);
  }

  step(surface = 'grass') { this.noise({ grass: 300, sand: 1200, stone: 2000 }[surface] || 300, 0.05, 0.12); }

  sfx(type) {
    if (type === 'chop') { this.noise(900, 0.09, 0.4); this.tone(140, 0.08, 0.3, 'square'); }
    else if (type === 'rock') { this.noise(2500, 0.05, 0.4); this.tone(300, 0.04, 0.2, 'triangle'); }
    else if (type === 'craft') { this.tone(880, 0.2, 0.2); this.tone(1320, 0.3, 0.15, 'sine', 0.08); }
    else if (type === 'pickup') { this.tone(660, 0.1, 0.15, 'triangle'); this.tone(990, 0.12, 0.12, 'triangle', 0.07); }
    else if (type === 'drink') { this.noise(1500, 0.25, 0.15); }
    else if (type === 'screech') { this.tone(1800, 0.4, 0.2, 'sawtooth'); }
  }
}
