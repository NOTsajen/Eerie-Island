// On-screen controls for phones. They drive the same Phaser Key objects the keyboard uses.
const PAD = [['E', 'EAT'], ['C', 'FIRE'], ['T', 'TALK'], ['F', 'TOWER'], ['L', 'LAMP'], ['U', 'UPGRADE'], ['Q', 'MENU'], ['H', 'HOUSE'], ['X', 'REMOVE']];
const BUILD = ['Fence', 'Spike', 'Cabin', 'Plot', 'Glass', 'Turret', 'Chest', 'Torch', 'Sprinkler'];
const NUM = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE'];
const CRAFT = [['Z', 'Charcoal'], ['X', 'Plate'], ['V', 'Circuit'], ['B', 'Battery'], ['N', 'Transceiver']];
const fake = { preventDefault() {} };

export default class TouchControls {
  constructor(sc) {
    if (!window.matchMedia('(pointer: coarse)').matches) return;
    const root = document.createElement('div'); root.id = 'touch';
    root.innerHTML = '<div id="joy"><i id="knob"></i></div><div id="tpal"></div><div id="tact"><button data-m="menu" class="mnu">&#9776;</button><button data-k="SPACE" class="act">ACT</button></div>';
    document.body.appendChild(root);
    const pal = root.querySelector('#tpal');
    // Inside a house the Interior scene owns the keys; otherwise use the main scene's.
    const keysNow = () => { for (const n of ['Interior', 'Cave']) { const i = sc.scene.get(n); if (i && i.scene.isActive() && i.keys) return i.keys; } return sc.keys; };
    const press = name => { const key = keysNow()[name]; if (!key) return; if (NUM.includes(name)) sc.forceBuild = true; key.onDown(fake); setTimeout(() => { key.onUp(fake); sc.forceBuild = false; }, 70); };

    root.addEventListener('pointerdown', e => {
      const b = e.target.closest('button'); if (!b) return;
      e.preventDefault(); sc.audio.start();
      if (b.dataset.k) { press(b.dataset.k); if (b.parentNode === pal) pal.style.display = 'none'; }
      else if (b.dataset.e && b.parentNode === pal) { window.dispatchEvent(new KeyboardEvent('keydown', { key: b.dataset.e })); pal.style.display = 'none'; }
      else if (b.dataset.e) window.dispatchEvent(new KeyboardEvent('keydown', { key: b.dataset.e }));
      else if (b.dataset.m === 'menu') {
        if (pal.style.display === 'flex' && pal.dataset.cur === 'menu') { pal.style.display = 'none'; return; }
        const ex = [['m:build', 'BUILD'], ['m:craft', 'CRAFT'], ...PAD.map(([k, l]) => ['k:' + k, l]), ['e:Enter', 'CHAT'], ['e:m', 'ROOM'], ['e:p', 'PING']];
        pal.innerHTML = ex.map(([k, l]) => { const [t, v] = k.split(':'); return `<button data-${t}="${v}">${l}</button>`; }).join(''); pal.dataset.cur = 'menu'; pal.style.display = 'flex';
      }
      else if (b.dataset.m) {
        pal.dataset.cur = 'sub';
        const list = b.dataset.m === 'build' ? BUILD.map((l, i) => [NUM[i], l]) : CRAFT;
        pal.innerHTML = list.map(([k, l]) => `<button data-k="${k}">${l}</button>`).join('');
        pal.style.display = 'flex';
      }
    });

    const joy = root.querySelector('#joy'), knob = root.querySelector('#knob'); let id = null;
    const setDir = (dx, dy) => {
      const want = { W: dy < -0.35, S: dy > 0.35, A: dx < -0.35, D: dx > 0.35 };
      const ks = keysNow(); for (const k in want) { const key = ks[k]; if (!key) continue; if (want[k] && !key.isDown) key.onDown(fake); else if (!want[k] && key.isDown) key.onUp(fake); }
    };
    const move = e => {
      const r = joy.getBoundingClientRect();
      let dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2), dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      const m = Math.hypot(dx, dy); if (m > 1) { dx /= m; dy /= m; }
      knob.style.transform = `translate(${dx * 35}px,${dy * 35}px)`; setDir(dx, dy);
    };
    joy.addEventListener('pointerdown', e => { id = e.pointerId; joy.setPointerCapture(id); sc.audio.start(); move(e); });
    joy.addEventListener('pointermove', e => { if (e.pointerId === id) move(e); });
    const end = e => { if (e.pointerId !== id) return; id = null; knob.style.transform = ''; setDir(0, 0); };
    joy.addEventListener('pointerup', end); joy.addEventListener('pointercancel', end);
  }
}
