// Colourful pixel-art item icons (10x10 grids with a white sticker outline), drawn on a canvas for the HUD.
const PAL = {
  k: '#2a1a14', w: '#7a4a22', W: '#c88a4a', V: '#e8b878', y: '#ffd24a', Y: '#fff2a0', o: '#ff8a1c', O: '#c8501a',
  r: '#e0384a', R: '#9a1e34', p: '#ff9ab0', n: '#3fbf4a', N: '#1f7a35', b: '#3a9be0', B: '#1f5aa8', m: '#8fe0ff',
  s: '#eef2f8', S: '#c2c8d6', g: '#9aa2b4', G: '#646c82', d: '#3a4054', c: '#e07a30', C: '#8a3a18', l: '#fff8e8', L: '#e8dcc0',
  u: '#8a4ad0', t: '#2fc0b0', e: '#2a2a34'
};
const MAP = {
  wood: ['..........', '..wwwwww..', '.wWWVVWWw.', 'wWWwwwwWWw', 'wWwWWWWwWw', 'wWwWyyWwWw', 'wWwWWWWwWw', 'wWWwwwwWWw', '.wWWWWWWw.', '..wwwwww..'],
  stone: ['..........', '...ssss...', '..sSSSSg..', '.sSSggGGg.', '.sSgGGGGg.', 'sSggGGGGGg', 'sgGGGGGGGg', '.gGGGGGGg.', '..gggggg..', '..........'],
  berries: ['.....n....', '....nNn...', '..rr.n.rr.', '.rprrrrprr', '.rrRrrRrrR', '..rprrprR.', '...rrRrr..', '....rprR..', '.....rr...', '..........'],
  iron: ['..........', '...dddddd.', '..dsssSSgd', '.dsSSggggd', 'dsSggGGGGd', 'dSggGGGGdd', 'dgGGGGGGd.', '.dddddddd.', '..........', '..........'],
  scrap: ['....gg....', '..g.GG.g..', '.gGgSSgGg.', '..gSddSg..', 'ggSd..dSgg', 'ggSd..dSgg', '..gSddSg..', '.gGgSSgGg.', '..g.GG.g..', '....gg....'],
  copper: ['..........', '...CCCCCC.', '..CYyyyycC', '.CyccccccC', 'CyccccccoC', 'CccCCCCCC.', 'CCCCCCCC..', '..........', '..........', '..........'],
  charcoal: ['..........', '...ee.....', '..eGee.e..', '.eGeeeeGe.', '.eeeeGeee.', 'eGeeeeeeGe', 'eeeGeeeee.', '.eeeeGee..', '..eeee....', '..........'],
  plate: ['..........', '.dddddddd.', 'dsSSSSSSgd', 'dSdSggggdd', 'dSSggGGGdd', 'dSggGGGGdd', 'dgGGGGGGdd', 'dGdGGGGdGd', '.dddddddd.', '..........'],
  circuit: ['..........', 'nnnnnnnnnn', 'nynNNNNyNn', 'nNNddddNNn', 'nyNdssdNyn', 'nNNddddNNn', 'nynNNNNyNn', 'nnnnnnnnnn', '..........', '..........'],
  battery: ['...yy.....', '..dddddd..', '..dyyyyd..', '..dyYYyd..', '..dyyyyd..', '..dBBBBd..', '..dbbbbd..', '..dBBBBd..', '..dddddd..', '..........'],
  transceiver: ['......m...', '.....m....', '....dd....', '..dddddd..', '.dSSSSSSd.', '.dSrSggSd.', '.dSSSSSSd.', '.dGGGGGGd.', '..dddddd..', '..........'],
  egg: ['..........', '...llll...', '..llllll..', '.lllllLLl.', '.llllllLL.', '.lllllLLL.', '.llllLLLL.', '..LLLLLL..', '...LLLL...', '..........'],
  milk: ['..bbbb....', '..bbbb....', '..dddd....', '.dlllld...', '.dlbblld..', '.dllllld..', '.dlLLLLd..', '.dLLLLLd..', '..dddddd..', '..........'],
  meat: ['..........', '..rrrrr...', '.rppRrrr..', '.rpRrrrR..', '.rrrRrRr..', '..rrrrr...', '...llL....', '....lL.ll.', '.....lLLl.', '......ll..'],
  sword: ['.......ss.', '......sSg.', '.....sSg..', '....sSg...', '...sSg....', '.y.Sg.....', '..yy......', '..wy......', '.wV.y.....', '..........'],
  tool: ['..ggggg...', '.gSSSSgg..', 'gS...GGg..', '.....wGg..', '....wWg...', '...wWw....', '..wWw.....', '.wWw......', 'wWw.......', '.w........'],
};
Object.assign(MAP, {
  gold: ['..........', '...YYYYY..', '..YyyyyyY.', '.YyyYYyyoY', 'YyyYyyyyoY', 'YyyyyyyooY', 'YoooyyoooO', '.OOooooOO.', '..OOOOOO..', '..........'],
  diamond: ['..........', '..msssm...', '.mssbbsm..', 'msbbbbbsm.', '.mbbbbbbm.', '..mbbbbm..', '...mbbm...', '....mm....', '..........', '..........'],
  ruby: ['..........', '...rrrr...', '..rprrrR..', '.rprrrrrR.', '.rrrrrrRR.', '..rrrrRR..', '...rRRR...', '....RR....', '..........', '..........'],
  emerald: ['..........', '..nnnnnn..', '.nYnnnnNn.', '.nnnnnnNn.', '.nnnnnNNn.', '.nnnnNNNn.', '..nNNNNn..', '...nnnn...', '..........', '..........'],
  amethyst: ['....u.....', '...uuu....', '..uumuu...', '.uumuuuu..', '.uuuuuuU..', '..uuuuUU..', '..uuuUUu..', '...uUUu...', '..........', '..........'],
  bone: ['.ll....ll.', 'lLl....lLl', '.lllllllL.', '...lLLll..', '...lLLll..', '.lllllllL.', 'lLl....lLl', '.ll....ll.', '..........', '..........'],
  relic: ['....yy....', '...yYYy...', '..yYttYy..', '.yYtuutYy.', '.yYtuutYy.', '..yYttYy..', '...yYYy...', '....yy....', '..........', '..........'],
  key: ['..yyy.....', '.yYYYy....', '.yY.Yy....', '.yYYYy....', '..yyy.....', '...yy.....', '...yyy....', '...yy.....', '...yyy....', '..........'],
  slime: ['..........', '....nn....', '...nnNn...', '..nYnnNn..', '.nnnnnnNn.', '.nknnknNn.', 'nnnnnnnnNn', 'NnnnnnnNNN', '.NNNNNNN..', '..........'],
  heart: ['..........', '.rrr..rrr.', 'rpprrrrrrR', 'rpRrrrrrrR', 'rrrrrrrrrR', '.rrrrrrrR.', '..rrrrrR..', '...rrrR...', '....rR....', '..........'],
  bolt: ['.....yy...', '....yyy...', '...yyY....', '..yyyyyy..', '....yyyy..', '....yyY...', '...yy.....', '..yy......', '.y........', '..........'],
  drop: ['....bb....', '...bbb....', '..bbmbb...', '..bmbbb...', '.bbmbbbb..', '.bbbbbbB..', '.bbbbbBB..', '..bbbBB...', '...BBB....', '..........'],
  flame: ['....o.....', '...oo.....', '..ooo.o...', '.oooyoo...', '.ooyyyoo..', '.oyyyyoo..', '.ooyyyoo..', '..oooOO...', '...OOO....', '..........'],
  smile: ['..yyyyyy..', '.yYyyyyYy.', 'yyyyyyyyyy', 'yykyyyykyy', 'yyyyyyyyyy', 'ykyyyyyyky', 'yykkkkkkyy', '.yyyyyyyy.', '..yyyyyy..', '..........'],
  armor: ['gg.gggg.gg', 'gSgSSSSgSg', 'gSsSSSSsSg', '.gSSccSSg.', '.gSSSSSSg.', '.gSSSSSSg.', '..gSSSSg..', '..gggggg..', '..........', '..........'],
  helmet: ['..........', '...gggg...', '..gSSSSg..', '.gSsSSSSg.', '.gSSSSSSg.', '.gSgggSSg.', '.gSg..gSg.', '.gg....gg.', '..........', '..........'],
  boots: ['..........', '.ww....ww.', '.wW....wW.', '.wW....wW.', '.wwW...wwW', 'wwWWw.wwWW', 'wwwwww.www', '..........', '..........', '..........'],
  gloves: ['.s.s.s....', '.sSsSsS...', '.sSSSSSg..', '.sSSSSSg..', '..sSSSg...', '..ggggg...', '..bbbbb...', '..........', '..........', '..........'],
  bow: ['.ww.......', '..wWw.....', '...wWw..d.', '....wW.d..', '....wWd...', '....wWd...', '...wWw.d..', '..wWw...d.', '.ww.......', '..........']
});
const cache = {};

export function icon(name) {
  if (cache[name] !== undefined) return cache[name];
  const m = MAP[name]; if (!m) return (cache[name] = '');
  const rows = Array.from({ length: 10 }, (_, y) => (m[y] || '').padEnd(10, '.').slice(0, 10));
  const c = document.createElement('canvas'); c.width = c.height = 12;
  const g = c.getContext('2d');
  const on = (x, y) => x >= 0 && y >= 0 && x < 10 && y < 10 && PAL[rows[y][x]];
  g.fillStyle = '#ffffff';
  for (let y = -1; y <= 10; y++) for (let x = -1; x <= 10; x++) {
    if (on(x, y)) continue;
    if (on(x - 1, y) || on(x + 1, y) || on(x, y - 1) || on(x, y + 1) || on(x - 1, y - 1) || on(x + 1, y + 1) || on(x - 1, y + 1) || on(x + 1, y - 1)) g.fillRect(x + 1, y + 1, 1, 1);
  }
  rows.forEach((row, y) => [...row].forEach((ch, x) => { if (PAL[ch]) { g.fillStyle = PAL[ch]; g.fillRect(x + 1, y + 1, 1, 1); } }));
  return (cache[name] = c.toDataURL());
}

export const chip = (name, text) => {
  const src = icon(name);
  return `<span class="chip">${src ? `<img src="${src}" alt="">` : ''}${text}</span>`;
};
