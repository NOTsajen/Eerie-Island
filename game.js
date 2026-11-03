'use strict';
// ---------- config ----------
const TILE = 32, MAP = 256, VW = 960, VH = 540, ZOOM = 1.5;
const T = {DEEP:0, SHALLOW:1, SAND:2, GRASS:3, FOREST:4, DIRT:5};
const ITEMS = {
  wood:{name:'Wood',color:'#8a5a2b',stack:99}, stone:{name:'Stone',color:'#8a93a6',stack:99},
  coal:{name:'Coal',color:'#2b2b33',stack:99}, iron:{name:'Iron Ore',color:'#d6784a',stack:99},
  gold:{name:'Gold',color:'#e6b422',stack:999}, berries:{name:'Berries',color:'#b0306a',stack:20,food:20},
  iron_bar:{name:'Iron Bar',color:'#b8c2d0',stack:99},
  campfire:{name:'Campfire',color:'#c8501e',stack:5,place:'campfire'},
  furnace:{name:'Furnace',color:'#5d6272',stack:3,place:'furnace'},
  meat:{name:'Raw Meat',color:'#a8404a',stack:20,food:6}, cooked:{name:'Cooked Meat',color:'#8a4a22',stack:20,food:35},
  sword:{name:'Iron Sword',color:'#9fb0c8',stack:1,tool:'sword',dmg:5},
  iron_axe:{name:'Iron Axe',color:'#6a9a64',stack:1,tool:'axe',power:2,dmg:3},
  iron_pickaxe:{name:'Iron Pickaxe',color:'#5a82b8',stack:1,tool:'pickaxe',power:2,dmg:3},
  raft:{name:'Raft',color:'#c9a45a',stack:1,win:true},
  axe:{name:'Axe',color:'#4f7a4a',stack:1,tool:'axe'}, pickaxe:{name:'Pickaxe',color:'#4a6a9a',stack:1,tool:'pickaxe'},
};
const RECIPES = [
  {id:'campfire',n:1,cost:{wood:5,stone:3}},
  {id:'furnace',n:1,cost:{stone:15,coal:2}},
  {id:'sword',n:1,cost:{iron_bar:2,wood:1}},
  {id:'iron_axe',n:1,cost:{iron_bar:3,wood:2}},
  {id:'iron_pickaxe',n:1,cost:{iron_bar:3,wood:2}},
  {id:'raft',n:1,cost:{wood:30,iron_bar:5,gold:10}},
];
const DEF = {
  tree:{tex:'tree',scale:.5,hp:6,tool:'axe',r:6,label:'Chop',drops:{wood:[2,3]}},
  bush:{tex:'bush',scale:.6,hp:1,tool:'',r:0,label:'Pick',drops:{berries:[1,3]}},
  stone:{tex:'rock',scale:.55,hp:8,tool:'pickaxe',r:12,label:'Mine',drops:{stone:[2,3]}},
  coal:{tex:'rock_coal',scale:.55,hp:8,tool:'pickaxe',r:12,label:'Mine',drops:{stone:[1,1],coal:[1,2]}},
  iron:{tex:'rock_iron',scale:.55,hp:10,tool:'pickaxe',r:12,label:'Mine',drops:{stone:[1,1],iron:[1,2]}},
  gold:{tex:'rock_gold',scale:.55,hp:12,tool:'pickaxe',r:12,label:'Mine',drops:{gold:[1,2]}},
};
const $ = id => document.getElementById(id);
const rand = (a,b)=>Math.floor(Math.random()*(b-a+1))+a;

// ---------- assets ----------
const IMG = {};
const names = ['tiles','player','tree','bush','rock','rock_coal','rock_iron','rock_gold','campfire','furnace','furnace_lit','hearts'];
Promise.all(names.map(n=>new Promise(r=>{const i=new Image();i.onload=()=>r();i.src=`assets/${n}.png`;IMG[n]=i;}))).then(start);

// ---------- noise ----------
function mulberry(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function makeNoise(seed){
  const h=(x,y)=>{let n=Math.imul(x,374761393)+Math.imul(y,668265263)+Math.imul(seed,1442695041)|0;n=Math.imul(n^n>>>13,1274126177);return((n^n>>>16)>>>0)/4294967295*2-1;};
  const sm=t=>t*t*(3-2*t);
  const base=(x,y)=>{const x0=Math.floor(x),y0=Math.floor(y),fx=sm(x-x0),fy=sm(y-y0);
    const a=h(x0,y0),b=h(x0+1,y0),c=h(x0,y0+1),d=h(x0+1,y0+1);
    return (a+(b-a)*fx)*(1-fy)+(c+(d-c)*fx)*fy;};
  return (x,y,freq,oct)=>{let s=0,amp=1,tot=0,f=freq;for(let i=0;i<oct;i++){s+=base(x*f,y*f)*amp;tot+=amp;amp*=.5;f*=2;}return s/tot;};
}

// ---------- state ----------
let mobs=[], ctxMob=null, saveT=0, spawnT=0, ended=false, seedV=0, grid, objs, player, inv, sel, day, tms, ctxTarget, canDrink, W, H, cam, dead, keys = {}, joy = {id:-1,vx:0,vy:0}, sprintFlag=false;
const hudDirty = {slots:true,craft:true};

function start(){
  setupInput(); resize(); addEventListener('resize',resize);
  if(!loadGame())newGame();
  addEventListener('pagehide',saveGame);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)saveGame();});
  let last=performance.now();
  (function loop(now){const dt=Math.min(.05,(now-last)/1000);last=now;update(dt);draw();requestAnimationFrame(loop);})(last);
}

function genWorld(seed){
  seedV=seed;
  const n=makeNoise(seed), f=makeNoise(seed+7);
  grid=new Uint8Array(MAP*MAP);
  const c=MAP/2;
  for(let y=0;y<MAP;y++)for(let x=0;x<MAP;x++){
    const d=Math.hypot(x-c,y-c)/c;
    const h=(n(x,y,.016,4)+1)*.5-Math.pow(d,2.4)*.9;
    let t;
    if(h<.28)t=T.DEEP;else if(h<.38)t=T.SHALLOW;else if(h<.44)t=T.SAND;
    else if(h>.70)t=T.DIRT;else if(f(x,y,.05,1)>.2)t=T.FOREST;else t=T.GRASS;
    grid[y*MAP+x]=t;
  }
  let sp=[c,c];
  outer:for(let r=0;r<MAP/2;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){
    const t=grid[(c+dy)*MAP+c+dx];if(t===T.GRASS||t===T.SAND){sp=[c+dx,c+dy];break outer;}
  }
  return sp;
}
function resetUI(){
  mobs=[];ended=false;dead=false;$('dead').hidden=true;$('craftPanel').hidden=true;
  hudDirty.slots=hudDirty.craft=true;buildHotbar();
}
function newGame(){
  const sp=genWorld(rand(1,1e9));
  objs=[];
  for(let y=0;y<MAP;y++)for(let x=0;x<MAP;x++){
    if(Math.hypot(x-sp[0],y-sp[1])<3)continue;
    const t=grid[y*MAP+x],r=Math.random();let k='';
    if(t===T.FOREST){if(r<.06)k='tree';else if(r<.07)k='bush';}
    else if(t===T.GRASS){if(r<.008)k='tree';else if(r<.014)k='bush';else if(r<.017)k='stone';}
    else if(t===T.SAND){if(r<.002)k='stone';}
    else if(t===T.DIRT&&r<.05){const q=Math.random();k=q<.4?'stone':q<.7?'coal':q<.92?'iron':'gold';}
    if(!k)continue;
    objs.push(mkRes(k,x*TILE+TILE*.5+(Math.random()*12-6),y*TILE+TILE*.9));
  }
  player={x:sp[0]*TILE+16,y:sp[1]*TILE+16,health:100,hunger:100,thirst:100,stamina:100,sprinting:false,facing:'down',anim:0,moving:false,cd:0,hurt:0};
  cam={x:player.x,y:player.y};
  inv=Array(10).fill(null); sel=0; addItem('axe',1); addItem('pickaxe',1);
  day=1; tms=.2;
  resetUI();
}
const SAVE_KEY='gaps_save_v1';
function saveGame(){
  if(dead||ended)return;
  try{localStorage.setItem(SAVE_KEY,JSON.stringify({seed:seedV,objs,player,inv,sel,day,tms}));}catch(e){}
}
function loadGame(){
  try{
    const d=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');if(!d)return false;
    genWorld(d.seed);objs=d.objs;player=d.player;player.hurt=0;inv=d.inv;sel=d.sel;day=d.day;tms=d.tms;
    cam={x:player.x,y:player.y};resetUI();return true;
  }catch(e){return false;}
}
function endGame(msg,clear){
  ended=true;$('deadMsg').textContent=msg;$('dead').hidden=false;
  if(clear)try{localStorage.removeItem(SAVE_KEY);}catch(e){}
}

function mkRes(k,x,y){const d=DEF[k];return{type:'res',kind:k,x,y,hp:d.hp,r:d.r,shake:0};}
function mkStruct(k,x,y){return k==='campfire'?{type:'campfire',x,y,r:8,fire:true,t:0,cook:-1}:{type:'furnace',x,y,r:0,fire:true,prog:-1,hw:16,hh:8,t:0};}

// ---------- inventory ----------
function addItem(id,n){
  const cap=ITEMS[id].stack;
  for(let i=0;i<10&&n>0;i++){const s=inv[i];if(s&&s.id===id&&s.count<cap){const t=Math.min(n,cap-s.count);s.count+=t;n-=t;}}
  for(let i=0;i<10&&n>0;i++){if(!inv[i]){const t=Math.min(n,cap);inv[i]={id,count:t};n-=t;}}
  hudDirty.slots=hudDirty.craft=true;return n;
}
const countItem=id=>inv.reduce((a,s)=>a+(s&&s.id===id?s.count:0),0);
function consume(id,n){for(let i=0;i<10&&n>0;i++){const s=inv[i];if(s&&s.id===id){const t=Math.min(n,s.count);s.count-=t;n-=t;if(s.count<=0)inv[i]=null;}}hudDirty.slots=hudDirty.craft=true;}
const canCraft=r=>Object.entries(r.cost).every(([id,c])=>countItem(id)>=c);
function craft(r){if(!canCraft(r))return;for(const id in r.cost)consume(id,r.cost[id]);addItem(r.id,r.n);}
const selId=()=>inv[sel]?inv[sel].id:'';
const selTool=()=>selId()?(ITEMS[selId()].tool||''):'';

// ---------- input ----------
function setupInput(){
  addEventListener('keydown',e=>{
    keys[e.code]=true;
    if(e.code==='ShiftLeft'||e.code==='ShiftRight')sprintFlag=true;
    if(e.code==='KeyE'||e.code==='Space'){doAction();e.preventDefault();}
    if(e.code==='KeyC')toggleCraft();
    const m=e.code.match(/^Digit(\d)$/);if(m){selectSlot((+m[1]+9)%10);}
  });
  addEventListener('keyup',e=>keys[e.code]=false);
  const cv=$('game'),joyEl=$('joy'),knob=$('knob');
  let ox=0,oy=0,t0=0;
  const R=70;
  cv.addEventListener('pointerdown',e=>{
    if(joy.id!==-1||e.clientX>innerWidth/2)return;
    joy.id=e.pointerId;ox=e.clientX;oy=e.clientY;t0=performance.now();
    joyEl.style.left=(ox-70)+'px';joyEl.style.top=(oy-70)+'px';joyEl.hidden=false;knob.style.left='42px';knob.style.top='42px';
    cv.setPointerCapture(e.pointerId);
  });
  cv.addEventListener('pointermove',e=>{
    if(e.pointerId!==joy.id)return;
    let dx=e.clientX-ox,dy=e.clientY-oy;
    if(dy>60&&Math.abs(dy)>Math.abs(dx)*1.5&&performance.now()-t0<250)sprintFlag=true;
    let vx=dx/R,vy=dy/R,l=Math.hypot(vx,vy);if(l>1){vx/=l;vy/=l;l=1;}
    if(l<.15){vx=vy=0;}
    joy.vx=vx;joy.vy=vy;
    const kl=Math.hypot(dx,dy),k=kl>R?R/kl:1;
    knob.style.left=(42+dx*k)+'px';knob.style.top=(42+dy*k)+'px';
  });
  const end=e=>{if(e.pointerId!==joy.id)return;joy.id=-1;joy.vx=joy.vy=0;joyEl.hidden=true;};
  cv.addEventListener('pointerup',end);cv.addEventListener('pointercancel',end);
  $('actionBtn').addEventListener('pointerdown',e=>{e.preventDefault();doAction();});
  $('sprintBtn').addEventListener('pointerdown',e=>{e.preventDefault();sprintFlag=true;});
  $('craftBtn').addEventListener('click',toggleCraft);
  $('restart').addEventListener('click',newGame);
  $('newBtn').addEventListener('click',()=>{if(confirm('Start a new island? Your save will be lost.'))newGame();});
  addEventListener('pointerdown',()=>audio(),{once:true});addEventListener('keydown',()=>audio(),{once:true});
  addEventListener('contextmenu',e=>e.preventDefault());
}
function toggleCraft(){const p=$('craftPanel');p.hidden=!p.hidden;hudDirty.craft=true;}
function selectSlot(i){if(sel===i)useSelected();else{sel=i;hudDirty.slots=true;}}

// ---------- world helpers ----------
const tileAt=(x,y)=>{const tx=Math.floor(x/TILE),ty=Math.floor(y/TILE);return(tx<0||ty<0||tx>=MAP||ty>=MAP)?T.DEEP:grid[ty*MAP+tx];};
function nearWater(x,y){const cx=Math.floor(x/TILE),cy=Math.floor(y/TILE);
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const tx=cx+dx,ty=cy+dy;if(tx>=0&&ty>=0&&tx<MAP&&ty<MAP&&grid[ty*MAP+tx]===T.SHALLOW)return true;}return false;}
function blocked(x,y,r){
  // deep water tiles
  const x0=Math.floor((x-r)/TILE),x1=Math.floor((x+r)/TILE),y0=Math.floor((y-r)/TILE),y1=Math.floor((y+r)/TILE);
  for(let ty=y0;ty<=y1;ty++)for(let tx=x0;tx<=x1;tx++){
    if(tx<0||ty<0||tx>=MAP||ty>=MAP||grid[ty*MAP+tx]===T.DEEP){
      const nx=Math.max(tx*TILE,Math.min(x,tx*TILE+TILE)),ny=Math.max(ty*TILE,Math.min(y,ty*TILE+TILE));
      if((x-nx)**2+(y-ny)**2<r*r)return true;}
  }
  for(const o of objs){
    if(Math.abs(o.x-x)>40||Math.abs(o.y-y)>40)continue;
    if(o.type==='furnace'){const cy=o.y-6;const nx=Math.max(o.x-o.hw,Math.min(x,o.x+o.hw)),ny=Math.max(cy-o.hh,Math.min(y,cy+o.hh));if((x-nx)**2+(y-ny)**2<r*r)return true;}
    else if(o.r>0&&Math.hypot(o.x-x,o.y-y)<o.r+r)return true;
  }
  return false;
}

// ---------- update ----------
function isNight(){return tms>.68&&tms<.94;}
function nearFire(){return objs.some(o=>o.fire&&Math.hypot(o.x-player.x,o.y-player.y)<130);}
function update(dt){
  if(dead||ended)return;
  const p=player;
  p.hurt=Math.max(0,(p.hurt||0)-dt);
  tms+=dt/300;if(tms>=1){tms-=1;day++;}
  p.cd=Math.max(0,p.cd-dt);
  // vitals
  const cold=(isNight()&&!nearFire())?1.6:1;
  p.hunger=Math.max(0,p.hunger-.17*cold*dt);
  p.thirst=Math.max(0,p.thirst-(p.sprinting?.4:.25)*cold*dt);
  if(p.hunger<=0||p.thirst<=0)p.health=Math.max(0,p.health-dt);
  else if(p.hunger>50&&p.thirst>50)p.health=Math.min(100,p.health+.5*dt);
  if(p.health<=0){dead=true;endGame('You died',true);sfx('die');}
  // context
  ctxTarget=null;let best=44;
  for(const o of objs){if(o.type==='res'||o.type==='furnace'||(o.type==='campfire'&&(o.cook>=0||countItem('meat')>0))){const d=Math.hypot(o.x-p.x,o.y-p.y);if(d<best){best=d;ctxTarget=o;}}}
  ctxMob=null;let md=40;
  for(const m of mobs){const d=Math.hypot(m.x-p.x,m.y-p.y);if(d<md&&d<=best+4){md=d;ctxMob=m;}}
  canDrink=nearWater(p.x,p.y);
  const txt=ctxMob?'Attack':ctxTarget?label(ctxTarget):(canDrink?'Drink':'');
  const ab=$('actionBtn');if(ab.dataset.t!==txt){ab.dataset.t=txt;ab.textContent=txt||'Hit';ab.classList.toggle('idle',!txt);}
  // movement
  let dx=0,dy=0;
  if(keys.KeyA||keys.ArrowLeft)dx-=1;if(keys.KeyD||keys.ArrowRight)dx+=1;
  if(keys.KeyW||keys.ArrowUp)dy-=1;if(keys.KeyS||keys.ArrowDown)dy+=1;
  if(dx||dy){const l=Math.hypot(dx,dy);dx/=l;dy/=l;}else{dx=joy.vx;dy=joy.vy;}
  const has=dx||dy;
  if(sprintFlag){if(p.stamina>10)p.sprinting=true;sprintFlag=false;}
  if(p.sprinting&&(!has||p.stamina<=0))p.sprinting=false;
  let speed=90;
  if(p.sprinting){speed*=1.7;p.stamina=Math.max(0,p.stamina-25*dt);}else p.stamina=Math.min(100,p.stamina+15*dt);
  const mx=dx*speed*dt,my=dy*speed*dt;
  if(!blocked(p.x+mx,p.y,8))p.x+=mx;
  if(!blocked(p.x,p.y+my,8))p.y+=my;
  p.moving=has&&Math.hypot(dx,dy)>.1;
  if(p.moving){
    p.facing=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up');
    p.anim+=dt*10*(p.sprinting?1.6:1);
  }
  // objects
  for(const o of objs){
    o.t=(o.t||0)+dt;
    if(o.shake>0)o.shake=Math.max(0,o.shake-dt);
    if(o.type==='campfire'&&o.cook>=0){o.cook+=dt;if(o.cook>=3){o.cook=-1;addItem('cooked',1);sfx('pick');}}
    if(o.type==='furnace'&&o.prog>=0){o.prog+=dt;if(o.prog>=3){o.prog=-1;addItem('iron_bar',1);}}
  }
  updateMobs(dt);
  saveT+=dt;if(saveT>10){saveT=0;saveGame();}
  // camera
  cam.x+=(p.x-cam.x)*Math.min(1,8*dt);cam.y+=(p.y-cam.y)*Math.min(1,8*dt);
  // hud
  $('clock').textContent=clockText();
  if(hudDirty.slots){buildHotbar();hudDirty.slots=false;}
  if(hudDirty.craft){buildCraft();hudDirty.craft=false;}
  updateBars();
}
function label(o){if(o.type==='campfire')return o.cook>=0?'Cooking...':'Cook';return o.type==='furnace'?(o.prog>=0?'Smelting...':'Smelt'):DEF[o.kind].label;}
function clockText(){const m=Math.floor(((tms*24+6)%24)*60);return `Day ${day}  ${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;}

function doAction(){
  if(dead||player.cd>0)return;
  const p=player,o=ctxTarget;
  if(ctxMob){
    const m=ctxMob;p.cd=.4;
    const dx=m.x-p.x,dy=m.y-p.y;
    p.facing=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up');
    const it=ITEMS[selId()];m.hp-=it?(it.dmg||1):1;m.flash=.15;sfx('hit');
    const l=Math.hypot(dx,dy)||1;
    if(!blockedMob(m.x+dx/l*10,m.y+dy/l*10)){m.x+=dx/l*10;m.y+=dy/l*10;}
    if(m.hp<=0){addItem('meat',m.kind==='wolf'?rand(1,2):rand(2,3));mobs.splice(mobs.indexOf(m),1);sfx('pick');}
    return;
  }
  if(o){
    p.cd=.4;
    const dx=o.x-p.x,dy=o.y-p.y;
    p.facing=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up');
    if(o.type==='campfire'){
      if(o.cook>=0||countItem('meat')<1)return;
      consume('meat',1);o.cook=0;sfx('hit');
    }else if(o.type==='furnace'){
      if(o.prog>=0)return;
      if(countItem('iron')>=1&&countItem('coal')>=1){consume('iron',1);consume('coal',1);o.prog=0;}
    }else{
      const d=DEF[o.kind];
      o.hp-=(d.tool===''||selTool()===d.tool)?3*((ITEMS[selId()]||{}).power||1):1;o.shake=.14;sfx('hit');
      if(o.hp<=0){for(const id in d.drops){const r=d.drops[id];addItem(id,rand(r[0],r[1]));}sfx('pick');objs.splice(objs.indexOf(o),1);}
    }
  }else if(canDrink){p.cd=.4;p.thirst=Math.min(100,p.thirst+12);}
}
function useSelected(){
  const id=selId();if(!id)return;const it=ITEMS[id];
  if(it.win){endGame('You built a raft and escaped the island! Day '+day,true);sfx('win');return;}
  if(it.place){
    const off={down:[0,30],up:[0,-30],left:[-30,0],right:[30,0]}[player.facing];
    objs.push(mkStruct(it.place,player.x+off[0],player.y+off[1]));
    inv[sel].count--;if(inv[sel].count<=0)inv[sel]=null;hudDirty.slots=hudDirty.craft=true;return;
  }
  if(it.food){player.hunger=Math.min(100,player.hunger+it.food);inv[sel].count--;if(inv[sel].count<=0)inv[sel]=null;hudDirty.slots=true;}
}

// ---------- HUD ----------
function buildHotbar(){
  const hb=$('hotbar');hb.innerHTML='';
  for(let i=0;i<10;i++){
    const s=inv[i],b=document.createElement('button');
    b.className='slot'+(i===sel?' sel':'');
    if(s){b.style.background=ITEMS[s.id].color;b.innerHTML=ITEMS[s.id].name+(s.count>1?`<br>x${s.count}`:'');}
    b.addEventListener('click',()=>selectSlot(i));
    hb.appendChild(b);
  }
}
function buildCraft(){
  const p=$('craftPanel');if(p.hidden)return;
  p.innerHTML='<div>Crafting</div>';
  for(const r of RECIPES){
    const b=document.createElement('button');
    b.textContent=`${ITEMS[r.id].name}  (${Object.entries(r.cost).map(([k,v])=>`${v} ${ITEMS[k].name}`).join(', ')})`;
    b.disabled=!canCraft(r);b.onclick=()=>craft(r);p.appendChild(b);
  }
  p.insertAdjacentHTML('beforeend','<small>Furnace: stand close, press Smelt (1 iron + 1 coal)</small>');
}
const BARS=[['HP','health','#d93a3a'],['Food','hunger','#e0922f'],['Water','thirst','#3a8fe0'],['Stamina','stamina','#5fcf5f']];
function updateBars(){
  const el=$('bars');
  if(!el.firstChild){el.innerHTML=BARS.map(b=>`<div class="bar"><div class="t"><div class="f" style="background:${b[2]}"></div></div><span>${b[0]}</span></div>`).join('');}
  BARS.forEach((b,i)=>{el.children[i].firstChild.firstChild.style.width=Math.max(0,Math.min(100,player[b[1]]))+'%';});
}

// ---------- render ----------
const cv=$('game'),ctx=cv.getContext('2d');
const light=document.createElement('canvas'),lctx=light.getContext('2d');
const glow=(()=>{const g=document.createElement('canvas');g.width=g.height=256;const c=g.getContext('2d');
  const gr=c.createRadialGradient(128,128,0,128,128,128);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=gr;c.fillRect(0,0,256,256);return g;})();
function resize(){
  const dpr=Math.min(devicePixelRatio||1,2);
  W=cv.width=Math.floor(innerWidth*dpr);H=cv.height=Math.floor(innerHeight*dpr);
  light.width=W;light.height=H;
}
const GRAD=[[0,[.9,.72,.68]],[.15,[1,1,1]],[.5,[1,1,1]],[.62,[1,.62,.42]],[.72,[.16,.19,.38]],[.92,[.16,.19,.38]],[1,[.9,.72,.68]]];
function dayColor(t){for(let i=1;i<GRAD.length;i++){if(t<=GRAD[i][0]){const a=GRAD[i-1],b=GRAD[i],k=(t-a[0])/(b[0]-a[0]);return a[1].map((v,j)=>Math.round((v+(b[1][j]-v)*k)*255));}}return[255,255,255];}
function draw(){
  ctx.imageSmoothingEnabled=false;
  const scale=Math.min(W/VW,H/VH)*ZOOM;
  ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#0b1d3a';ctx.fillRect(0,0,W,H);
  const vw=W/scale,vh=H/scale;
  let cx=cam.x,cy=cam.y;
  cx=Math.max(vw/2,Math.min(MAP*TILE-vw/2,cx));cy=Math.max(vh/2,Math.min(MAP*TILE-vh/2,cy));
  const ox=cx-vw/2,oy=cy-vh/2;
  ctx.setTransform(scale,0,0,scale,-ox*scale,-oy*scale);
  const tx0=Math.max(0,Math.floor(ox/TILE)),ty0=Math.max(0,Math.floor(oy/TILE));
  const tx1=Math.min(MAP-1,Math.floor((ox+vw)/TILE)),ty1=Math.min(MAP-1,Math.floor((oy+vh)/TILE));
  for(let y=ty0;y<=ty1;y++)for(let x=tx0;x<=tx1;x++)
    ctx.drawImage(IMG.tiles,grid[y*MAP+x]*TILE,0,TILE,TILE,x*TILE,y*TILE,TILE,TILE);
  // y-sorted objects + player
  const list=objs.filter(o=>o.x>ox-80&&o.x<ox+vw+80&&o.y>oy-40&&o.y<oy+vh+160);
  list.push({type:'player',y:player.y});
  for(const m of mobs)list.push(m);
  list.sort((a,b)=>a.y-b.y);
  for(const o of list)drawObj(o);
  // lighting
  const dc=dayColor(tms);
  lctx.setTransform(1,0,0,1,0,0);lctx.globalCompositeOperation='source-over';
  lctx.fillStyle=`rgb(${dc[0]},${dc[1]},${dc[2]})`;lctx.fillRect(0,0,W,H);
  lctx.globalCompositeOperation='lighter';
  lctx.setTransform(scale,0,0,scale,-ox*scale,-oy*scale);
  for(const o of objs){
    if(!o.fire)continue;
    if(o.x<ox-200||o.x>ox+vw+200||o.y<oy-200||o.y>oy+vh+200)continue;
    let rad,col,en;
    if(o.type==='campfire'){rad=170;col=[255,178,89];en=1.25+Math.sin(o.t*13)*.08+Math.sin(o.t*7.3)*.07;}
    else{rad=110;col=[255,140,64];en=o.prog>=0?1+Math.sin(o.prog*14)*.12:0;}
    if(en<=0)continue;
    lctx.globalAlpha=Math.min(1,en*.8);
    tint(col);lctx.drawImage(tintC,o.x-rad,o.y-(o.type==='campfire'?10:12)-rad,rad*2,rad*2);
  }
  lctx.globalAlpha=1;
  ctx.setTransform(1,0,0,1,0,0);ctx.globalCompositeOperation='multiply';ctx.drawImage(light,0,0);ctx.globalCompositeOperation='source-over';
  if(player.hurt>0){ctx.fillStyle=`rgba(200,0,0,${player.hurt*.6})`;ctx.fillRect(0,0,W,H);}
}
const tintC=document.createElement('canvas');tintC.width=tintC.height=256;const tctx=tintC.getContext('2d');
function tint(c){tctx.globalCompositeOperation='copy';tctx.drawImage(glow,0,0);tctx.globalCompositeOperation='source-in';tctx.fillStyle=`rgb(${c[0]},${c[1]},${c[2]})`;tctx.fillRect(0,0,256,256);}
function drawObj(o){
  if(o.type==='mob'){drawMob(o);return;}
  if(o.type==='player'){
    const p=player,row={down:0,left:1,right:2,up:3}[p.facing],f=p.moving?Math.floor(p.anim)%8:0;
    ctx.drawImage(IMG.player,f*32,row*64,32,64,Math.round(p.x-16),Math.round(p.y-28-32),32,64);
  }else if(o.type==='res'){
    const d=DEF[o.kind],im=IMG[d.tex],w=im.width*d.scale,h=im.height*d.scale;
    const sx=o.shake>0?Math.sin(o.shake*90)*2:0;
    ctx.drawImage(im,o.x-w/2+sx,o.y-im.height*.45*d.scale-h/2,w,h);
  }else if(o.type==='campfire'){
    ctx.drawImage(IMG.campfire,(Math.floor(o.t*8)%4)*32,0,32,32,o.x-16,o.y-14-16,32,32);
  }else if(o.type==='furnace'){
    const im=o.prog>=0?IMG.furnace_lit:IMG.furnace;ctx.drawImage(im,o.x-20,o.y-22-24,40,48);
  }
}

// ---------- mobs ----------
function blockedMob(x,y){return blocked(x,y,6)||tileAt(x,y)===T.SHALLOW&&false;}
function spawnMob(kind){
  const p=player;
  for(let i=0;i<12;i++){
    const a=Math.random()*6.283,d=260+Math.random()*140;
    const x=p.x+Math.cos(a)*d,y=p.y+Math.sin(a)*d,t=tileAt(x,y);
    if(t===T.GRASS||t===T.FOREST||t===T.SAND||t===T.DIRT){if(!blockedMob(x,y)){mobs.push({type:'mob',kind,x,y,hp:kind==='wolf'?8:5,vx:0,vy:0,t:Math.random()*5,cd:0,flash:0,face:1});return;}}
  }
}
function moveMob(m,dx,dy,sp,dt){
  const l=Math.hypot(dx,dy);if(l<.01)return;dx/=l;dy/=l;
  const mx=dx*sp*dt,my=dy*sp*dt;
  if(!blockedMob(m.x+mx,m.y))m.x+=mx;
  if(!blockedMob(m.x,m.y+my))m.y+=my;
  if(Math.abs(dx)>.2)m.face=dx>0?1:-1;
}
function updateMobs(dt){
  const p=player,night=isNight();
  spawnT+=dt;
  if(spawnT>3){
    spawnT=0;
    const wolves=mobs.filter(m=>m.kind==='wolf').length,deer=mobs.length-wolves;
    if(night&&wolves<4)spawnMob('wolf');
    if(!night&&deer<6)spawnMob('deer');
  }
  for(let i=mobs.length-1;i>=0;i--){
    const m=mobs[i];m.t+=dt;m.cd=Math.max(0,m.cd-dt);m.flash=Math.max(0,m.flash-dt);
    const dx=p.x-m.x,dy=p.y-m.y,d=Math.hypot(dx,dy);
    if(m.kind==='wolf'){
      if(!night&&d>150){mobs.splice(i,1);continue;}
      const fire=objs.find(o=>o.fire&&Math.hypot(o.x-m.x,o.y-m.y)<125);
      if(fire)moveMob(m,m.x-fire.x,m.y-fire.y,75,dt);
      else if(d<300&&d>14)moveMob(m,dx,dy,68,dt);
      else if(d>=300)moveMob(m,Math.cos(m.t),Math.sin(m.t*.7),25,dt);
      if(d<16&&m.cd<=0&&!fire){m.cd=1.3;p.health=Math.max(0,p.health-6);p.hurt=.4;sfx('hurt');}
    }else{
      if(night&&d>150){mobs.splice(i,1);continue;}
      if(d<90)moveMob(m,-dx,-dy,85,dt);
      else if(Math.sin(m.t*.5)>.3)moveMob(m,Math.cos(m.t*.3),Math.sin(m.t*.4),22,dt);
      if(d>700)mobs.splice(i,1);
    }
  }
}
function drawMob(m){
  const f=m.face,x=Math.round(m.x),y=Math.round(m.y),leg=Math.sin(m.t*10)*2;
  ctx.save();ctx.translate(x,y);ctx.scale(f,1);
  ctx.fillStyle='rgba(0,0,0,.25)';ctx.beginPath();ctx.ellipse(0,0,10,3,0,0,7);ctx.fill();
  if(m.kind==='wolf'){
    ctx.fillStyle=m.flash>0?'#fff':'#6b6f7a';
    ctx.fillRect(-9,-12+leg*.2,16,8);ctx.fillRect(5,-15,8,7);ctx.fillRect(11,-12,4,3);
    ctx.fillRect(-12,-12,4,3);ctx.fillRect(-7,-5,3,5+leg*.3);ctx.fillRect(3,-5,3,5-leg*.3);
    ctx.fillStyle='#e33';ctx.fillRect(10,-14,2,2);ctx.fillStyle='#4a4d56';ctx.fillRect(7,-17,2,3);ctx.fillRect(11,-17,2,3);
  }else{
    ctx.fillStyle=m.flash>0?'#fff':'#a8723a';
    ctx.fillRect(-8,-16,15,9);ctx.fillRect(5,-23,5,9);ctx.fillRect(4,-27,8,5);
    ctx.fillRect(-7,-8,2,8+leg*.3);ctx.fillRect(4,-8,2,8-leg*.3);
    ctx.fillStyle='#e6d2a0';ctx.fillRect(4,-30,1,4);ctx.fillRect(10,-30,1,4);ctx.fillStyle='#000';ctx.fillRect(9,-26,1,1);
  }
  ctx.restore();
}

// ---------- sound ----------
let AC=null;
function audio(){if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)();}catch(e){}}return AC;}
function tone(f,d,type,vol,when){
  const a=audio();if(!a)return;const t=a.currentTime+(when||0);
  const o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.setValueAtTime(f,t);
  g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);
  o.connect(g);g.connect(a.destination);o.start(t);o.stop(t+d);
}
function sfx(k){
  if(k==='hit')tone(160,.08,'square',.08);
  else if(k==='pick'){tone(520,.07,'triangle',.1);tone(780,.09,'triangle',.1,.06);}
  else if(k==='hurt')tone(110,.25,'sawtooth',.14);
  else if(k==='die'){tone(220,.3,'sawtooth',.14);tone(110,.5,'sawtooth',.14,.25);}
  else if(k==='win'){[523,659,784,1047].forEach((f,i)=>tone(f,.25,'triangle',.12,i*.15));}
}
