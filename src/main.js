import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import MainGameScene from './scenes/MainGameScene.js';
import InteriorScene from './scenes/InteriorScene.js';
import CaveScene from './scenes/CaveScene.js';

const H = 270, wFor = () => Math.max(400, Math.min(640, Math.round(H * (window.innerWidth || 1) / (window.innerHeight || 1))));

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: wFor(),
  height: H,
  pixelArt: true,
  antialias: false,
  roundPixels: true,
  render: { pixelArt: true, antialias: false, roundPixels: true },
  backgroundColor: '#0b0f1a',
  physics: { default: 'arcade' },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [BootScene, MainGameScene, InteriorScene, CaveScene]
});

// keep the canvas filling the screen when the browser bars hide/show or fullscreen toggles
let rt; const refit = () => { clearTimeout(rt); rt = setTimeout(() => game.scale.setGameSize(wFor(), H), 120); };
window.addEventListener('resize', refit); document.addEventListener('fullscreenchange', refit);

// first touch -> fullscreen + landscape lock
const goFull = () => {
  const el = document.documentElement;
  (el.requestFullscreen ? el.requestFullscreen({ navigationUI: 'hide' }) : Promise.resolve()).catch(() => {})
    .then(() => screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape')).catch(() => {});
};
window.addEventListener('pointerdown', goFull, { once: true });
