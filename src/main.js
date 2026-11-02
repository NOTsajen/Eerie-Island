import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import MainGameScene from './scenes/MainGameScene.js';
import InteriorScene from './scenes/InteriorScene.js';
import CaveScene from './scenes/CaveScene.js';

const W = 300, hFor = () => Math.max(360, Math.min(720, Math.round(W * (window.innerHeight || 1) / (window.innerWidth || 1))));

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: W,
  height: hFor(),
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
let rt; const refit = () => { clearTimeout(rt); rt = setTimeout(() => game.scale.setGameSize(W, hFor()), 120); };
window.addEventListener('resize', refit); document.addEventListener('fullscreenchange', refit);

// first touch -> fullscreen + portrait lock
const goFull = () => {
  const el = document.documentElement;
  (el.requestFullscreen ? el.requestFullscreen({ navigationUI: 'hide' }) : Promise.resolve()).catch(() => {})
    .then(() => screen.orientation && screen.orientation.lock && screen.orientation.lock('portrait')).catch(() => {});
};
window.addEventListener('pointerdown', goFull, { once: true });
