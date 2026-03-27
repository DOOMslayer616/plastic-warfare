
/* ═══════════════════════════════════════════════════════════════
   AUDIO SYSTEM — Procedural Web Audio API
   Music: generative chiptune/military
   SFX: synthesized, no external files needed
   ═══════════════════════════════════════════════════════════════ */
var AC = null;
var MUSIC_NODE = null;
var SFX_VOL = 0.55;
var MUSIC_VOL = 0.32;
var AUDIO_ENABLED = true;
var CURRENT_TRACK = null;
var musicTimeouts = [];

function getAC() {
  if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
  if (AC.state === 'suspended') AC.resume();
  return AC;
}

// ── Master volume nodes ───────────────────────────────────────────────
function makeMasterGain(vol) {
  var g = getAC().createGain();
  g.gain.value = vol;
  g.connect(getAC().destination);
  return g;
}

// ── LOW-LEVEL SYNTH PRIMITIVES ────────────────────────────────────────
function playTone(freq, type, dur, vol, delay, dest) {
  var ac = getAC();
  var osc = ac.createOscillator();
  var env = ac.createGain();
  osc.type = type || 'square';
  osc.frequency.value = freq;
  env.gain.setValueAtTime(0, ac.currentTime + delay);
  env.gain.linearRampToValueAtTime(vol, ac.currentTime + delay + 0.01);
  env.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + delay + dur);
  osc.connect(env); env.connect(dest || ac.destination);
  osc.start(ac.currentTime + delay);
  osc.stop(ac.currentTime + delay + dur + 0.02);
}

function playNoise(dur, vol, delay, cutoff, dest) {
  var ac = getAC();
  var buf = ac.createBuffer(1, ac.sampleRate * dur, ac.sampleRate);
  var data = buf.getChannelData(0);
  for (var i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  var src = ac.createBufferSource();
  src.buffer = buf;
  var filt = ac.createBiquadFilter();
  filt.type = 'lowpass'; filt.frequency.value = cutoff || 800;
  var env = ac.createGain();
  env.gain.setValueAtTime(0, ac.currentTime + delay);
  env.gain.linearRampToValueAtTime(vol, ac.currentTime + delay + 0.005);
  env.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + delay + dur);
  src.connect(filt); filt.connect(env); env.connect(dest || ac.destination);
  src.start(ac.currentTime + delay);
}

function stopAllMusic() {
  musicTimeouts.forEach(clearTimeout); musicTimeouts = [];
  if (MUSIC_NODE) { try { MUSIC_NODE.gain.linearRampToValueAtTime(0, getAC().currentTime + 0.5); } catch(e){} }
  MUSIC_NODE = null; CURRENT_TRACK = null;
}

// ── SOUND EFFECTS ─────────────────────────────────────────────────────
var SFX = {

  click: function() {
    if(!AUDIO_ENABLED) return;
    var m = makeMasterGain(SFX_VOL * 0.4);
    playTone(880, 'square', 0.04, 0.3, 0, m);
    playTone(1100, 'square', 0.03, 0.2, 0.02, m);
  },

  select: function() {
    if(!AUDIO_ENABLED) return;
    var m = makeMasterGain(SFX_VOL * 0.5);
    playTone(440, 'triangle', 0.06, 0.4, 0, m);
    playTone(550, 'triangle', 0.06, 0.35, 0.05, m);
  },

  move: function() {
    if(!AUDIO_ENABLED) return;
    var m = makeMasterGain(SFX_VOL * 0.35);
    playNoise(0.08, 0.6, 0, 300, m);
    playTone(220, 'sine', 0.1, 0.2, 0.02, m);
  },

  rifle: function() {
    if(!AUDIO_ENABLED) return;
    var m = makeMasterGain(SFX_VOL * 0.7);
    playNoise(0.04, 1.0, 0, 2000, m);
    playNoise(0.12, 0.5, 0.03, 400, m);
    playTone(180, 'sawtooth', 0.08, 0.3, 0, m);
  },

  explosion: function() {
    if(!AUDIO_ENABLED) return;
    var m = makeMasterGain(SFX_VOL * 0.9);
    playNoise(0.05, 1.0, 0, 4000, m);
    playNoise(0.6, 0.8, 0.04, 120, m);
    playNoise(0.3, 0.6, 0.0, 600, m);
    playTone(80, 'sine', 0.4, 0.5, 0, m);
    playTone(55, 'sine', 0.6, 0.4, 0.05, m);
  },

  hit: function() {
    if(!AUDIO_ENABLED) return;
    var m = makeMasterGain(SFX_VOL * 0.6);
    playNoise(0.08, 0.9, 0, 1200, m);
    playTone(120, 'sawtooth', 0.15, 0.4, 0.02, m);
  },

  miss: function() {
    if(!AUDIO_ENABLED) return;
    var m = makeMasterGain(SFX_VOL * 0.3);
    playTone(300, 'sine', 0.08, 0.3, 0, m);
    playTone(260, 'sine', 0.06, 0.2, 0.06, m);
  },

  heal: function() {
    if(!AUDIO_ENABLED) return;
    var m = makeMasterGain(SFX_VOL * 0.45);
    [0,0.07,0.14].forEach(function(d, i) {
      playTone([523,659,784][i], 'sine', 0.12, 0.3, d, m);
    });
  },

  suppress: function() {
    if(!AUDIO_ENABLED) return;
    var m = makeMasterGain(SFX_VOL * 0.6);
    for(var i=0;i<4;i++) {
      playNoise(0.03, 0.8, i*0.06, 2500, m);
      playTone(160 + i*10, 'sawtooth', 0.04, 0.3, i*0.06, m);
    }
  },

  assault: function() {
    if(!AUDIO_ENABLED) return;
    var m = makeMasterGain(SFX_VOL * 0.75);
    playNoise(0.04, 1.0, 0, 3000, m);
    playNoise(0.04, 0.9, 0.05, 2500, m);
    playTone(200, 'sawtooth', 0.2, 0.5, 0, m);
    playTone(160, 'square', 0.15, 0.4, 0.08, m);
  },

  victory: function() {
    if(!AUDIO_ENABLED) return;
    var m = makeMasterGain(SFX_VOL * 0.8);
    var melody = [523,659,784,1047];
    melody.forEach(function(f,i){ playTone(f,'square',0.25,0.5,i*0.18,m); });
    playTone(523,'triangle',0.8,0.4,0.8,m);
    playTone(659,'triangle',0.6,0.35,0.85,m);
    playTone(784,'triangle',0.7,0.4,0.9,m);
  },

  defeat: function() {
    if(!AUDIO_ENABLED) return;
    var m = makeMasterGain(SFX_VOL * 0.7);
    [392,349,330,294,262].forEach(function(f,i){ playTone(f,'sawtooth',0.3,0.4,i*0.22,m); });
  },

  deploy: function() {
    if(!AUDIO_ENABLED) return;
    var m = makeMasterGain(SFX_VOL * 0.5);
    playTone(330,'square',0.06,0.3,0,m);
    playTone(440,'square',0.06,0.35,0.07,m);
    playTone(550,'square',0.1,0.4,0.14,m);
  },

  turn_end: function() {
    if(!AUDIO_ENABLED) return;
    var m = makeMasterGain(SFX_VOL * 0.4);
    playTone(440,'triangle',0.08,0.3,0,m);
    playTone(330,'triangle',0.12,0.25,0.09,m);
  },
};

// ── MUSIC TRACKS ──────────────────────────────────────────────────────
// Each track is a sequencer built from tone patterns

function playMusicTrack(trackName) {
  if(!AUDIO_ENABLED) return;
  stopAllMusic();
  CURRENT_TRACK = trackName;
  var ac = getAC();
  var master = ac.createGain();
  master.gain.value = MUSIC_VOL;
  master.connect(ac.destination);
  MUSIC_NODE = master;

  if(trackName === 'menu')    _musicMenu(master);
  if(trackName === 'deploy')  _musicDeploy(master);
  if(trackName === 'battle')  _musicBattle(master);
}

// ── MENU: Tense military ambient, slow pulse ──────────────────────────
function _musicMenu(dest) {
  var ac = getAC();
  var bpm = 72, beat = 60/bpm;

  // Repeating bass drone
  function drone() {
    if(CURRENT_TRACK !== 'menu') return;
    [55, 55, 65, 55].forEach(function(f, i) {
      playTone(f, 'sine', beat * 3.8, 0.5, i * beat, dest);
    });
    musicTimeouts.push(setTimeout(drone, beat * 4 * 1000));
  }

  // Slow snare-like hits
  function snare() {
    if(CURRENT_TRACK !== 'menu') return;
    playNoise(0.06, 0.35, 0, 1800, dest);
    musicTimeouts.push(setTimeout(snare, beat * 4 * 1000));
  }

  // Eerie high notes
  var menuMelody = [
    220,0,220,0, 196,0,220,0,
    233,0,220,0, 196,0,0,0
  ];
  function melody(pos) {
    if(CURRENT_TRACK !== 'menu') return;
    var f = menuMelody[pos % menuMelody.length];
    if(f) playTone(f, 'triangle', beat * 0.8, 0.18, 0, dest);
    musicTimeouts.push(setTimeout(function(){ melody(pos+1); }, beat * 1000));
  }

  drone(); 
  musicTimeouts.push(setTimeout(snare, beat * 2 * 1000));
  musicTimeouts.push(setTimeout(function(){ melody(0); }, 200));
}

// ── DEPLOY: Tactical briefing, tense but controlled ───────────────────
function _musicDeploy(dest) {
  var ac = getAC();
  var bpm = 88, beat = 60/bpm;

  var bassLine = [110,0,110,0, 98,0,110,0, 117,0,110,0, 98,0,0,0];
  function bass(pos) {
    if(CURRENT_TRACK !== 'deploy') return;
    var f = bassLine[pos % bassLine.length];
    if(f) playTone(f, 'sawtooth', beat * 0.45, 0.35, 0, dest);
    musicTimeouts.push(setTimeout(function(){ bass(pos+1); }, beat * 1000));
  }

  // Kick-like thud every 4 beats
  function kick() {
    if(CURRENT_TRACK !== 'deploy') return;
    playTone(80, 'sine', 0.12, 0.5, 0, dest);
    playNoise(0.04, 0.3, 0, 200, dest);
    musicTimeouts.push(setTimeout(kick, beat * 4 * 1000));
  }

  // Hi-hat pattern
  var hatPat = [1,0,1,1, 1,0,1,0];
  function hat(pos) {
    if(CURRENT_TRACK !== 'deploy') return;
    if(hatPat[pos % hatPat.length]) playNoise(0.025, 0.2, 0, 6000, dest);
    musicTimeouts.push(setTimeout(function(){ hat(pos+1); }, beat * 0.5 * 1000));
  }

  // Sparse melody: military march feel
  var marchMel = [
    262,0,330,0, 392,0,330,262,
    294,0,0,0,   262,0,0,0
  ];
  function marchMelody(pos) {
    if(CURRENT_TRACK !== 'deploy') return;
    var f = marchMel[pos % marchMel.length];
    if(f) playTone(f, 'square', beat * 0.7, 0.15, 0, dest);
    musicTimeouts.push(setTimeout(function(){ marchMelody(pos+1); }, beat * 0.5 * 1000));
  }

  bass(0); kick();
  musicTimeouts.push(setTimeout(function(){ hat(0); }, 100));
  musicTimeouts.push(setTimeout(function(){ marchMelody(0); }, beat * 4 * 1000));
}

// ── BATTLE: Intense, driving rhythm ──────────────────────────────────
function _musicBattle(dest) {
  var ac = getAC();
  var bpm = 140, beat = 60/bpm;

  // Driving bass
  var battleBass = [
    73,0,73,73, 65,0,73,0,
    78,0,73,65, 73,0,0,0
  ];
  function battleB(pos) {
    if(CURRENT_TRACK !== 'battle') return;
    var f = battleBass[pos % battleBass.length];
    if(f) playTone(f, 'sawtooth', beat * 0.4, 0.4, 0, dest);
    musicTimeouts.push(setTimeout(function(){ battleB(pos+1); }, beat * 0.5 * 1000));
  }

  // Fast kick pattern
  var kickPat = [1,0,0,1, 0,0,1,0];
  function battleKick(pos) {
    if(CURRENT_TRACK !== 'battle') return;
    if(kickPat[pos % kickPat.length]) {
      playTone(70, 'sine', 0.08, 0.6, 0, dest);
      playNoise(0.03, 0.4, 0, 150, dest);
    }
    musicTimeouts.push(setTimeout(function(){ battleKick(pos+1); }, beat * 0.5 * 1000));
  }

  // Snare on 2 and 4
  var snarePat = [0,0,1,0, 0,0,1,0];
  function battleSnare(pos) {
    if(CURRENT_TRACK !== 'battle') return;
    if(snarePat[pos % snarePat.length]) playNoise(0.1, 0.55, 0, 2200, dest);
    musicTimeouts.push(setTimeout(function(){ battleSnare(pos+1); }, beat * 0.5 * 1000));
  }

  // Relentless hi-hat
  function battleHat(pos) {
    if(CURRENT_TRACK !== 'battle') return;
    playNoise(0.02, 0.15, 0, 8000, dest);
    musicTimeouts.push(setTimeout(function(){ battleHat(pos+1); }, beat * 0.5 * 1000));
  }

  // Aggressive melody: intervals of 4ths and tritones
  var battleMel = [
    0,0,196,0,    0,196,220,0,
    0,0,196,175,  196,0,0,0,
    0,0,233,0,    0,233,262,0,
    0,0,233,220,  233,0,0,0
  ];
  function battleMelody(pos) {
    if(CURRENT_TRACK !== 'battle') return;
    var f = battleMel[pos % battleMel.length];
    if(f) playTone(f, 'square', beat * 0.35, 0.2, 0, dest);
    musicTimeouts.push(setTimeout(function(){ battleMelody(pos+1); }, beat * 0.5 * 1000));
  }

  battleB(0); battleKick(0); battleSnare(0);
  musicTimeouts.push(setTimeout(function(){ battleHat(0); }, 50));
  musicTimeouts.push(setTimeout(function(){ battleMelody(0); }, beat * 2 * 1000));
}

// ── AUDIO TOGGLE BUTTON ───────────────────────────────────────────────
function toggleAudio() {
  AUDIO_ENABLED = !AUDIO_ENABLED;
  var btn = document.getElementById('btn-audio-toggle');
  if(btn) btn.textContent = AUDIO_ENABLED ? '🔊' : '🔇';
  if(!AUDIO_ENABLED) stopAllMusic();
  else if(CURRENT_TRACK) playMusicTrack(CURRENT_TRACK);
}


/* PLASTIC WARFARE v6.0 — JavaScript */
/* ═══════════════════════════════════════════════════════════════
   SECTION 1: HEX MATH (single source of truth, no square coords)
   ═══════════════════════════════════════════════════════════════ */
var TILE = 48; // hex radius (center to vertex)
var STARTING_POINTS = 3600;

// Flat-top hex, odd-column offset (odd cols shift down by HEX_H/2)
function hexH()  { return TILE * Math.sqrt(3); }       // flat-to-flat height
function hexW()  { return TILE * 2; }                   // point-to-point width
function hexHS() { return TILE * 1.5; }                 // horizontal step (center-to-center)

function hexGridWidth(cols)  { return hexHS() * cols + TILE * 0.5; }
function hexGridHeight(rows) { return hexH() * rows + hexH() * 0.5; }

// Canvas pixel center of hex (c, r)
function hexToPixel(c, r) {
  return {
    x: hexHS() * c + TILE,
    y: hexH() * r + (c % 2 === 1 ? hexH() / 2 : 0) + hexH() / 2
  };
}

// Nearest hex for canvas pixel (px, py)
function pixelToHex(px, py) {
  var hh = hexH(), hs = hexHS();
  var c = Math.round((px - TILE) / hs);
  var r = Math.round((py - (c % 2 === 1 ? hh / 2 : 0) - hh / 2) / hh);
  // Refine by checking neighbors
  var best = {c:c, r:r}, bd = Infinity;
  for (var dc = -1; dc <= 1; dc++) for (var dr = -1; dr <= 1; dr++) {
    var nc = c + dc, nr = r + dr;
    var p = hexToPixel(nc, nr);
    var d = Math.hypot(px - p.x, py - p.y);
    if (d < bd) { bd = d; best = {c: nc, r: nr}; }
  }
  return best;
}

// 6 hex neighbors for flat-top odd-col offset
function hexNeighbors(c, r, sc) {
  var dirs = c % 2 === 0
    ? [[1,0],[-1,0],[0,-1],[0,1],[1,-1],[-1,-1]]
    : [[1,0],[-1,0],[0,-1],[0,1],[1,1],[-1,1]];
  var out = [];
  dirs.forEach(function(d) {
    var nc = c+d[0], nr = r+d[1];
    if (sc && (nc<0||nr<0||nc>=sc.cols||nr>=sc.rows)) return;
    out.push({c:nc, r:nr});
  });
  return out;
}

// Hex distance using cube coordinates
function hexDist(c1,r1,c2,r2) {
  function toCube(c,r) {
    var x=c, z=r-(c-(c&1))/2, y=-x-z;
    return {x:x,y:y,z:z};
  }
  var a=toCube(c1,r1), b=toCube(c2,r2);
  return Math.max(Math.abs(a.x-b.x), Math.abs(a.y-b.y), Math.abs(a.z-b.z));
}

// Draw a flat-top hex path centered at (cx,cy) with radius r
function drawHex(ctx, cx, cy, r) {
  ctx.beginPath();
  for (var i = 0; i < 6; i++) {
    var a = Math.PI / 180 * 60 * i;
    var x = cx + r * Math.cos(a), y = cy + r * Math.sin(a);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

// LOS using hex line-of-sight (cube lerp)
function hasLOS(c1,r1,c2,r2,attackerUnit) {
  if (c1===c2 && r1===r2) return true;
  var sc = G.scenario;
  var isHeli = attackerUnit && attackerUnit.tags.indexOf('air') >= 0;
  var isVeh  = attackerUnit && attackerUnit.tags.indexOf('vehicle') >= 0;
  function toCube(c,r){var x=c,z=r-(c-(c&1))/2,y=-x-z;return{x,y,z};}
  var A=toCube(c1,r1), B=toCube(c2,r2);
  var n=Math.max(Math.abs(A.x-B.x),Math.abs(A.y-B.y),Math.abs(A.z-B.z));
  for (var i=1; i<n; i++) {
    var t=i/n;
    var fx=A.x+t*(B.x-A.x), fy=A.y+t*(B.y-A.y), fz=A.z+t*(B.z-A.z);
    var rx=Math.round(fx),ry=Math.round(fy),rz=Math.round(fz);
    var xd=Math.abs(rx-fx),yd=Math.abs(ry-fy),zd=Math.abs(rz-fz);
    if(xd>yd&&xd>zd) rx=-ry-rz; else if(yd>zd) ry=-rx-rz; else rz=-rx-ry;
    var oc = rx, or_ = rz + (rx-(rx&1))/2;
    if(oc<0||or_<0||oc>=sc.cols||or_>=sc.rows) return false;
    var tile=sc.map[or_][oc];
    if(tile.type==='wall') return false;
    if(!tile.obs) continue;
    var ot=tile.obs.type;
    if(isHeli) continue;
    if(TALL_OBS.indexOf(ot)>=0) return false;
    if(MED_OBS.indexOf(ot)>=0 && !isVeh) return false;
  }
  return true;
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 2: SPRITES
   ═══════════════════════════════════════════════════════════════ */
var SPRITES = {}, SPRITES_READY = false;

// All sprites available in sprites/ folder
var SPRITE_DEFS = {
  // Riflemen (ally=green, enemy=tan) — by men count
  'rfm_g_6':'sprites/riflemen_green_6.png','rfm_g_4':'sprites/riflemen_green_4.png',
  'rfm_g_2':'sprites/riflemen_green_2.png','rfm_g_1':'sprites/riflemen_green_1.png',
  'rfm_t_6':'sprites/riflemen_tan_6.png',  'rfm_t_4':'sprites/riflemen_tan_4.png',
  'rfm_t_2':'sprites/riflemen_tan_2.png',  'rfm_t_1':'sprites/riflemen_tan_1.png',
  // Medics — by men count (1,2,4)
  'med_g_4':'sprites/medics_green_4.png','med_g_2':'sprites/medics_green_2.png','med_g_1':'sprites/medics_green_1.png',
  'med_t_4':'sprites/medics_tan_4.png',  'med_t_2':'sprites/medics_tan_2.png',  'med_t_1':'sprites/medics_tan_1.png',
  // Antitank — by men count (1,2,3)
  'at_g_3':'sprites/antitank_green_3.png','at_g_2':'sprites/antitank_green_2.png','at_g_1':'sprites/antitank_green_1.png',
  'at_t_3':'sprites/antitank_tan_3.png',  'at_t_2':'sprites/antitank_tan_2.png',  'at_t_1':'sprites/antitank_tan_1.png',
  // Sniper — by men count (1,2)
  'snp_g_2':'sprites/sniper_green_2.png','snp_g_1':'sprites/sniper_green_1.png',
  'snp_t_2':'sprites/sniper_tan_2.png',  'snp_t_1':'sprites/sniper_tan_1.png',
  // Vehicles (one sprite each)
  'tank_g':'sprites/tank_green.png',             'tank_t':'sprites/tank_tan.png',
  'apc_g':'sprites/apc_green.png',               'apc_t':'sprites/apc_tan.png',
  'jeep_g':'sprites/jeep_green.png',             'jeep_t':'sprites/jeep_tan.png',
  'aheli_g':'sprites/attack_heli_green.png',     'aheli_t':'sprites/attack_heli_tan.png',
  'theli_g':'sprites/transport_heli_green.png',  'theli_t':'sprites/transport_heli_tan.png',
};

function loadSprites(cb) {
  var keys=Object.keys(SPRITE_DEFS), done=0;
  if(!keys.length){SPRITES_READY=true;if(cb)cb();return;}
  keys.forEach(function(k){
    var img=new Image();
    img.onload=img.onerror=function(){
      done++; if(done>=keys.length){SPRITES_READY=true;if(cb)cb();}
    };
    img.src=SPRITE_DEFS[k];
    SPRITES[k]=img;
  });
}

function getSpriteKey(u) {
  var g=u.team==='ally'?'g':'t';
  var men=u.menAlive||1;
  var k=null;
  if(u.key==='riflemen'){
    var c=men>=5?6:men>=3?4:men>=2?2:1;
    k='rfm_'+g+'_'+c;
  } else if(u.key==='medics'){
    var c=men>=3?4:men>=2?2:1;
    k='med_'+g+'_'+c;
  } else if(u.key==='antitank'){
    var c=men>=3?3:men>=2?2:1;
    k='at_'+g+'_'+c;
  } else if(u.key==='sniper'){
    var c=men>=2?2:1;
    k='snp_'+g+'_'+c;
  } else if(u.key==='tank'){
    k='tank_'+g;
  } else if(u.key==='apc'){
    k='apc_'+g;
  } else if(u.key==='jeep'){
    k='jeep_'+g;
  } else if(u.key==='attack_heli'){
    k='aheli_'+g;
  } else if(u.key==='transport_heli'){
    k='theli_'+g;
  }
  return (k&&SPRITES[k]&&SPRITES[k].complete&&SPRITES[k].naturalWidth>0)?k:null;
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 3: OBSTACLE CLASSIFICATION
   ═══════════════════════════════════════════════════════════════ */
var TALL_OBS  = ['counter','fridge','island','cabinet','dining_table','car','shelf','wardrobe','column','tv_stand'];
var MED_OBS   = ['sofa','bed','wall_low','trunk','desk','dining_chair_group'];
var LIGHT_OBS = ['armchair','chair','barrel','toolbox','nightstand','box','hedge'];

function isTall(t)  { return TALL_OBS.indexOf(t)>=0; }
function isMed(t)   { return MED_OBS.indexOf(t)>=0; }
function isLight(t) { return LIGHT_OBS.indexOf(t)>=0; }

function getCoverInfo(ac,ar,dc,dr,isDefVeh) {
  var sc=G.scenario;
  if(dc<0||dr<0||dc>=sc.cols||dr>=sc.rows) return {type:'none'};
  var own=sc.map[dr][dc].obs;
  if(own&&!isDefVeh) {
    if(isTall(own.type))  return {type:'high',obs:own};
    if(isMed(own.type))   return {type:'medium',obs:own};
    if(isLight(own.type)) return {type:'light',obs:own};
  }
  if(isDefVeh) return {type:'none'};
  // Check adjacent toward attacker
  var dx=ac-dc, dy=ar-dr, best={type:'none'};
  hexNeighbors(dc,dr).forEach(function(n){
    var adj=sc.map[n.r]&&sc.map[n.r][n.c]?sc.map[n.r][n.c].obs:null;
    if(!adj) return;
    var ox=n.c-dc,oy=n.r-dr, dot=dx*ox+dy*oy;
    if(dot<=0) return;
    var t=adj.type;
    if(isTall(t)) {best={type:'high',obs:adj};return;}
    if(isMed(t)&&best.type!=='high') best={type:'medium',obs:adj};
    if(isLight(t)&&best.type==='none') best={type:'light',obs:adj};
  });
  return best;
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 4: TROOP QUALITY
   ═══════════════════════════════════════════════════════════════ */
var GRADES = {
  good:    {label:'Elite',   color:'#8acc6a', woundMod:+1, suppRecovery:4},
  average: {label:'Regular', color:'#e8b840', woundMod:0,  suppRecovery:5},
  poor:    {label:'Milicia', color:'#cc4040', woundMod:-1, suppRecovery:6},
};

/* ═══════════════════════════════════════════════════════════════
   SECTION 5: WEAPONS
   ═══════════════════════════════════════════════════════════════ */
var WEAPONS = {
  assault_rifle:  {name:'Rifle Asalto',    atk:1,bs:4,range:4,ap:0,dmg:1,abilities:['rapid_fire']},
  smg:            {name:'Subfusil',         atk:2,bs:4,range:2,ap:0,dmg:1,abilities:['rapid_fire']},
  sniper_rifle:   {name:'Rifle Precisión', atk:1,bs:3,range:8,ap:2,dmg:2,abilities:['heavy','precision']},
  spotter_pistol: {name:'Pistola Obs.',    atk:1,bs:5,range:2,ap:0,dmg:1,abilities:[]},
  at_launcher:    {name:'Lanzacohetes AT', atk:1,bs:4,range:4,ap:3,dmg:3,abilities:['anti_vehicle','hazardous']},
  tank_cannon:    {name:'Cañón Principal', atk:2,bs:3,range:8,ap:4,dmg:4,abilities:['blast','single_shot']},
  coax_mg:        {name:'AM Coaxial',      atk:3,bs:4,range:4,ap:1,dmg:1,abilities:['rapid_fire']},
  hmg:            {name:'Ametralladora',   atk:4,bs:4,range:6,ap:1,dmg:1,abilities:['heavy','suppression']},
  apc_gun:        {name:'Cañón APC',       atk:2,bs:4,range:5,ap:2,dmg:2,abilities:[]},
  jeep_mg:        {name:'AM .50 cal',      atk:3,bs:4,range:5,ap:1,dmg:1,abilities:['rapid_fire','suppression']},
  rocket_pod:     {name:'Pod Cohetes',     atk:4,bs:4,range:6,ap:3,dmg:2,abilities:['blast']},
  minigun:        {name:'Minigun',         atk:5,bs:4,range:4,ap:1,dmg:1,abilities:['rapid_fire','suppression']},
  heal_kit:       {name:'Kit Médico',      atk:0,bs:4,range:2,ap:0,dmg:-2,abilities:['heal']},
};

/* ═══════════════════════════════════════════════════════════════
   SECTION 6: UNIT DEFINITIONS
   ═══════════════════════════════════════════════════════════════ */
var UNIT_DEFS = {
  riflemen:  {name:'Fusileros',      abbr:'FUSI',cost:120,grade:'average',
    maxMen:6,hpPerMan:2,move:4,ap:2,icon:'●',
    tags:['infantry'],
    saves:{none:6,light:6,medium:5,high:4},
    weaponGroups:[{count:6,weapon:'assault_rifle',label:'6× Rifle Asalto'}],
    desc:'6 fusileros. Rapid Fire a media distancia.'},
  medics:    {name:'Escuadrón Médico',abbr:'MÉDI',cost:90,grade:'average',
    maxMen:4,hpPerMan:2,move:4,ap:2,icon:'✚',
    tags:['infantry','healer'],
    saves:{none:6,light:6,medium:5,high:4},
    weaponGroups:[{count:2,weapon:'assault_rifle',label:'2× Rifle Asalto'},{count:2,weapon:'smg',label:'2× Subfusil'}],
    healDice:2,healRange:2,
    desc:'2 escoltas + 2 médicos. Cura aliados.'},
  antitank:  {name:'Eq. Antitanque', abbr:'AT',  cost:150,grade:'average',
    maxMen:3,hpPerMan:2,move:3,ap:2,icon:'★',
    tags:['infantry','anti_vehicle'],
    saves:{none:6,light:6,medium:5,high:4},
    weaponGroups:[{count:1,weapon:'at_launcher',label:'1× Lanzacohetes AT'},{count:2,weapon:'assault_rifle',label:'2× Rifle Escolta'}],
    desc:'1 artillero AT + 2 escoltas.'},
  sniper:    {name:'Francotirador',  abbr:'FRAN', cost:130,grade:'good',
    maxMen:2,hpPerMan:2,move:3,ap:2,icon:'▲',
    tags:['infantry'],
    saves:{none:6,light:5,medium:5,high:4},
    weaponGroups:[{count:1,weapon:'sniper_rifle',label:'1× Rifle Precisión'},{count:1,weapon:'spotter_pistol',label:'1× Pistola Obs.'}],
    desc:'Precisión: BS:3+ sin mover. Bonus a distancia larga. Peor si se mueve.'},
  tank:      {name:'Tanque',         abbr:'TANK', cost:300,grade:'good',
    maxMen:1,hpPerMan:10,move:2,ap:2,icon:'◆',
    tags:['vehicle','heavy'],
    saves:{none:3,light:3,medium:3,high:3},
    weaponGroups:[{count:1,weapon:'tank_cannon',label:'1× Cañón (1/turno)'},{count:1,weapon:'coax_mg',label:'1× AM Coaxial'}],
    desc:'Blindado pesado. Cañón: disparo único/turno.'},
  apc:       {name:'APC',            abbr:'APC',  cost:200,grade:'average',
    maxMen:1,hpPerMan:8,move:3,ap:2,icon:'⊕',
    tags:['vehicle','heavy'],
    saves:{none:4,light:4,medium:4,high:4},
    weaponGroups:[{count:1,weapon:'apc_gun',label:'1× Cañón APC'}],
    desc:'Transporte blindado. Blindaje medio.'},
  jeep:      {name:'Jeep',           abbr:'JEEP', cost:160,grade:'average',
    maxMen:1,hpPerMan:5,move:4,ap:2,icon:'⊙',
    tags:['vehicle'],
    saves:{none:5,light:5,medium:5,high:5},
    weaponGroups:[{count:1,weapon:'jeep_mg',label:'1× AM Jeep'}],
    desc:'Vehículo ligero. Rápido.'},
  attack_heli:{name:'Helicóptero Ataque',abbr:'HELI-A',cost:380,grade:'good',
    maxMen:1,hpPerMan:8,move:5,ap:2,icon:'⬡',
    tags:['vehicle','air'],flying:true,
    saves:{none:4,light:4,medium:4,high:4},
    weaponGroups:[{count:1,weapon:'rocket_pod',label:'1× Pod Cohetes'},{count:1,weapon:'minigun',label:'1× Minigun'}],
    desc:'Helicóptero de ataque. Vuela sobre obstáculos.'},
  transport_heli:{name:'Helicóptero Transporte',abbr:'HELI-T',cost:240,grade:'average',
    maxMen:1,hpPerMan:6,move:5,ap:2,icon:'⬡',
    tags:['vehicle','air'],flying:true,
    saves:{none:5,light:5,medium:5,high:5},
    weaponGroups:[{count:1,weapon:'minigun',label:'1× Minigun'}],
    desc:'Transporte aéreo. Lanza refuerzos.'},
};

/* ═══════════════════════════════════════════════════════════════
   SECTION 7: SCENARIO OBJECTIVES
   ═══════════════════════════════════════════════════════════════ */
var OBJECTIVES = {
  eliminate_all: {
    label:'Eliminar todas las fuerzas enemigas',
    check:function(){ return G.units.filter(function(u){return u.team==='enemy'&&u.hp>0;}).length===0; },
    lose: function(){ return G.units.filter(function(u){return u.team==='ally'&&u.hp>0;}).length===0; }
  },
  eliminate_75: {
    label:'Eliminar 75% de fuerzas enemigas',
    check:function(){
      var tot=G.objData.enemyStart||1;
      return G.units.filter(function(u){return u.team==='enemy'&&u.hp>0;}).length<=Math.floor(tot*0.25);
    },
    lose:function(){ return G.units.filter(function(u){return u.team==='ally'&&u.hp>0;}).length===0; }
  },
  capture: {
    label:'Mantener la zona central 5 rondas completas sin enemigos',
    // check() and lose() only READ the counters — never write them.
    // Counters are updated once per complete round in evaluateCaptureZone().
    check:function(){
      return (G.objData.captureTurns||0)>=5;
    },
    lose:function(){
      if((G.objData.enemyCaptureTurns||0)>=5) return true;
      return G.units.filter(function(u){return u.team==='ally'&&u.hp>0;}).length===0;
    }
  },
  survive: {
    label:'Sobrevivir 10 rondas',
    check:function(){ return G.round>10&&G.units.filter(function(u){return u.team==='ally'&&u.hp>0;}).length>0; },
    lose:function(){ return G.units.filter(function(u){return u.team==='ally'&&u.hp>0;}).length===0; }
  }
};

/* ═══════════════════════════════════════════════════════════════
   SECTION 8: ROOM DEFINITIONS (hex-native sizes)
   ═══════════════════════════════════════════════════════════════ */
// Each room is designed for flat-top hex grid
// TILE=46: 14×12 grid → ~955×1083px → zoom≈0.6 fills 650×700 viewport
// ── RANDOM OBSTACLE GENERATOR ─────────────────────────────────────────
// Generates obstacles avoiding spawn zones and walls
function generateObstacles(cols, rows, spawnAlly, spawnEnemy, palette, count) {
  var obstacles = [];
  // Build set of forbidden coords (spawn zones + border margin)
  var forbidden = new Set();
  function addZone(zone, margin) {
    for(var r=zone.r-margin; r<zone.r+zone.h+margin; r++)
      for(var c=zone.c-margin; c<zone.c+zone.w+margin; c++)
        forbidden.add(c+','+r);
  }
  addZone(spawnAlly,  2);
  addZone(spawnEnemy, 2);
  // Also forbid border ring
  for(var c=0;c<cols;c++){forbidden.add(c+',0');forbidden.add(c+','+(rows-1));}
  for(var r=0;r<rows;r++){forbidden.add('0,'+r);forbidden.add((cols-1)+','+r);}

  var attempts=0, placed=0;
  while(placed<count && attempts<count*20) {
    attempts++;
    var tmpl=palette[Math.floor(Math.random()*palette.length)];
    var c=1+Math.floor(Math.random()*(cols-2));
    var r=1+Math.floor(Math.random()*(rows-2));
    // Check all cells of this obstacle
    var ok=true;
    for(var dr=0;dr<tmpl.h&&ok;dr++) for(var dc=0;dc<tmpl.w&&ok;dc++)
      if(forbidden.has((c+dc)+','+(r+dr))) ok=false;
    if(!ok) continue;
    obstacles.push({c:c,r:r,w:tmpl.w,h:tmpl.h,type:tmpl.type,cover:tmpl.cover,label:tmpl.label});
    // Mark placed cells as forbidden
    for(var dr=0;dr<tmpl.h;dr++) for(var dc=0;dc<tmpl.w;dc++)
      forbidden.add((c+dc)+','+(r+dr));
    placed++;
  }
  return obstacles;
}

var ROOM_DEFS = {
  sala: {
    name:'Sala de Estar', icon:'🛋',
    desc:'Gran sala con obstáculos aleatorios.',
    objective:'eliminate_all',
    cols:32, rows:28,
    floor:function(c,r){return (c+r)%2===0?'wood':'wood2';},
    walls:[[0,0,32,1],[0,27,32,1],[0,0,1,28],[31,0,1,28],[14,8,4,1],[14,19,4,1]],
    obstaclePalette:[
      {w:2,h:1,type:'sofa',cover:'medium',label:'sofá'},
      {w:1,h:1,type:'sofa',cover:'medium',label:'sofá'},
      {w:2,h:1,type:'tv_stand',cover:'heavy',label:'TV'},
      {w:1,h:1,type:'cabinet',cover:'heavy',label:'vitrina'},
      {w:1,h:1,type:'armchair',cover:'light',label:'sillón'},
      {w:1,h:1,type:'armchair',cover:'light',label:'sillón'},
      {w:1,h:1,type:'nightstand',cover:'light',label:'mesita'},
    ],
    obstacleCount:28,
    spawnZoneAlly: {c:1,r:1,w:6,h:26},
    spawnZoneEnemy:{c:25,r:1,w:6,h:26}
  },
  cocina: {
    name:'Cocina', icon:'🍳',
    desc:'Gran cocina con obstáculos aleatorios.',
    objective:'eliminate_all',
    cols:32, rows:28,
    floor:function(c,r){return (c+r)%2===0?'tile':'tile2';},
    walls:[[0,0,32,1],[0,27,32,1],[0,0,1,28],[31,0,1,28]],
    obstaclePalette:[
      {w:3,h:1,type:'counter',cover:'heavy',label:'mesón'},
      {w:2,h:1,type:'counter',cover:'heavy',label:'mesón'},
      {w:1,h:2,type:'fridge',cover:'heavy',label:'nevera'},
      {w:2,h:2,type:'island',cover:'heavy',label:'isla'},
      {w:1,h:1,type:'barrel',cover:'light',label:'barril'},
      {w:1,h:1,type:'toolbox',cover:'light',label:'cajón'},
    ],
    obstacleCount:26,
    spawnZoneAlly: {c:1,r:1,w:6,h:26},
    spawnZoneEnemy:{c:25,r:1,w:6,h:26}
  },
  comedor: {
    name:'Comedor', icon:'🪑',
    desc:'Gran comedor. Captura el centro.',
    objective:'capture',
    cols:32, rows:28,
    floor:function(c,r){return 'parquet';},
    walls:[[0,0,32,1],[0,27,32,1],[0,0,1,28],[31,0,1,28]],
    obstaclePalette:[
      {w:3,h:2,type:'dining_table',cover:'heavy',label:'mesa'},
      {w:2,h:1,type:'dining_table',cover:'heavy',label:'mesa'},
      {w:1,h:1,type:'dining_chair_group',cover:'medium',label:'sillas'},
      {w:1,h:1,type:'cabinet',cover:'heavy',label:'aparador'},
      {w:2,h:1,type:'sofa',cover:'medium',label:'sofá'},
      {w:1,h:1,type:'armchair',cover:'light',label:'sillón'},
    ],
    obstacleCount:24,
    spawnZoneAlly: {c:1,r:1,w:5,h:26},
    spawnZoneEnemy:{c:26,r:1,w:5,h:26}
  },
  cochera: {
    name:'Cochera', icon:'🚗',
    desc:'Gran cochera con vehículos y cajas.',
    objective:'eliminate_all',
    cols:36, rows:28,
    floor:function(c,r){return 'concrete';},
    walls:[[0,0,36,1],[0,27,36,1],[0,0,1,28],[35,0,1,28]],
    obstaclePalette:[
      {w:3,h:2,type:'car',cover:'heavy',label:'auto'},
      {w:2,h:2,type:'car',cover:'heavy',label:'auto'},
      {w:2,h:1,type:'barrel',cover:'light',label:'barriles'},
      {w:1,h:1,type:'barrel',cover:'light',label:'barril'},
      {w:1,h:2,type:'toolbox',cover:'light',label:'cajón'},
      {w:2,h:1,type:'counter',cover:'heavy',label:'banco'},
      {w:1,h:1,type:'box',cover:'light',label:'cajas'},
    ],
    obstacleCount:30,
    spawnZoneAlly: {c:1,r:1,w:6,h:26},
    spawnZoneEnemy:{c:29,r:1,w:6,h:26}
  },
  patio: {
    name:'Patio', icon:'🌿',
    desc:'Gran jardín. Sobrevive 10 rondas.',
    objective:'survive',
    cols:36, rows:30,
    floor:function(c,r){return (c+r)%3===0?'grass2':'grass';},
    walls:[[0,0,36,1],[0,29,36,1],[0,0,1,30],[35,0,1,30]],
    obstaclePalette:[
      {w:2,h:1,type:'hedge',cover:'medium',label:'seto'},
      {w:1,h:1,type:'hedge',cover:'light',label:'seto'},
      {w:1,h:2,type:'hedge',cover:'medium',label:'seto'},
      {w:1,h:1,type:'barrel',cover:'light',label:'barril'},
      {w:2,h:2,type:'hedge',cover:'medium',label:'arbusto'},
      {w:1,h:1,type:'box',cover:'light',label:'caja'},
    ],
    obstacleCount:35,
    spawnZoneAlly: {c:1,r:1,w:7,h:28},
    spawnZoneEnemy:{c:28,r:1,w:7,h:28}
  },
  cuarto: {
    name:'Dormitorio', icon:'🛏',
    desc:'Gran dormitorio con muebles.',
    objective:'eliminate_75',
    cols:30, rows:26,
    floor:function(c,r){return 'carpet';},
    walls:[[0,0,30,1],[0,25,30,1],[0,0,1,26],[29,0,1,26],[12,10,6,1]],
    obstaclePalette:[
      {w:3,h:1,type:'bed',cover:'medium',label:'cama'},
      {w:2,h:1,type:'bed',cover:'medium',label:'cama'},
      {w:1,h:2,type:'wardrobe',cover:'heavy',label:'armario'},
      {w:1,h:1,type:'nightstand',cover:'light',label:'mesita'},
      {w:1,h:1,type:'desk',cover:'medium',label:'escritorio'},
      {w:1,h:1,type:'armchair',cover:'light',label:'sillón'},
    ],
    obstacleCount:26,
    spawnZoneAlly: {c:1,r:1,w:5,h:24},
    spawnZoneEnemy:{c:24,r:1,w:5,h:24}
  },
  atico: {
    name:'Ático', icon:'📦',
    desc:'Ático con columnas y cajas.',
    objective:'eliminate_all',
    cols:32, rows:28,
    floor:function(c,r){return 'concrete';},
    walls:[[0,0,32,1],[0,27,32,1],[0,0,1,28],[31,0,1,28],[6,6,1,16],[25,6,1,16]],
    obstaclePalette:[
      {w:2,h:1,type:'trunk',cover:'medium',label:'baúl'},
      {w:1,h:1,type:'trunk',cover:'medium',label:'baúl'},
      {w:1,h:2,type:'column',cover:'heavy',label:'columna'},
      {w:1,h:1,type:'column',cover:'heavy',label:'columna'},
      {w:2,h:2,type:'box',cover:'light',label:'cajas'},
      {w:1,h:1,type:'box',cover:'light',label:'caja'},
      {w:1,h:1,type:'barrel',cover:'light',label:'barril'},
    ],
    obstacleCount:30,
    spawnZoneAlly: {c:1,r:1,w:5,h:26},
    spawnZoneEnemy:{c:26,r:1,w:5,h:26}
  }
};

// Obstacle colors
var OBS_COLORS = {
  sofa:'#5a4a3a',bed:'#4a3a5a',counter:'#6a5a3a',fridge:'#8a9aaa',island:'#7a6a4a',
  cabinet:'#5a4a2a',tv_stand:'#2a2a3a',dining_table:'#6a4a2a',dining_chair_group:'#5a3a2a',
  car:'#3a4a5a',barrel:'#5a4a2a',toolbox:'#4a3a2a',wardrobe:'#4a3a2a',armchair:'#5a3a2a',
  chair:'#5a4a3a',trunk:'#5a4a2a',column:'#6a6a5a',box:'#6a5a3a',hedge:'#2a4a2a',nightstand:'#5a4a3a',
  wall_low:'#6a6a5a',desk:'#5a4a2a',shelf:'#5a4a2a',
};
var FLOOR_COLORS = {
  wood:'#6a5030',wood2:'#5a4428',tile:'#8a8a7a',tile2:'#7a7a6a',
  parquet:'#7a5a30',concrete:'#5a5a50',grass:'#3a5a2a',grass2:'#2a4a20',carpet:'#4a3a5a',
};

/* ═══════════════════════════════════════════════════════════════
   SECTION 9: MAP BUILDING
   ═══════════════════════════════════════════════════════════════ */
function buildMap(roomKey) {
  var rd = ROOM_DEFS[roomKey];
  var map = [];
  for (var r=0; r<rd.rows; r++) {
    map.push([]);
    for (var c=0; c<rd.cols; c++) map[r].push({type:'floor',floor:rd.floor(c,r),obs:null});
  }
  // Walls
  rd.walls.forEach(function(w) {
    for (var r=0;r<w[3];r++) for (var c=0;c<w[2];c++) {
      var tr=w[1]+r,tc=w[0]+c;
      if(tr<rd.rows&&tc<rd.cols) map[tr][tc]={type:'wall',floor:'',obs:null};
    }
  });
  // Random obstacles (avoid spawn zones)
  var obs = generateObstacles(
    rd.cols, rd.rows,
    rd.spawnZoneAlly, rd.spawnZoneEnemy,
    rd.obstaclePalette, rd.obstacleCount
  );
  obs.forEach(function(o) {
    for (var dr=0;dr<o.h;dr++) for (var dc=0;dc<o.w;dc++) {
      var tr=o.r+dr,tc=o.c+dc;
      if(tr<rd.rows&&tc<rd.cols&&map[tr][tc].type==='floor')
        map[tr][tc].obs = {type:o.type,cover:o.cover,label:o.label};
    }
  });
  // Spawn zones
  var ally=[], enemy=[];
  var za=rd.spawnZoneAlly, ze=rd.spawnZoneEnemy;
  for(var r=0;r<za.h;r++) for(var c=0;c<za.w;c++) {
    var tr=za.r+r,tc=za.c+c;
    if(tr<rd.rows&&tc<rd.cols&&map[tr][tc].type==='floor'&&!map[tr][tc].obs) ally.push({c:tc,r:tr});
  }
  for(var r=0;r<ze.h;r++) for(var c=0;c<ze.w;c++) {
    var tr=ze.r+r,tc=ze.c+c;
    if(tr<rd.rows&&tc<rd.cols&&map[tr][tc].type==='floor'&&!map[tr][tc].obs) enemy.push({c:tc,r:tr});
  }
  return {roomKey,name:rd.name,cols:rd.cols,rows:rd.rows,map,
          spawnAlly:ally,spawnEnemy:enemy,
          objective:rd.objective};
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 10: GAME STATE
   ═══════════════════════════════════════════════════════════════ */
var G = {
  scenario:null, units:[], deployedUnits:[], pointsLeft:STARTING_POINTS,
  selected:null, mode:'select', turn:'ally', round:1,
  moveTiles:[], attackTiles:[],
  visibleCells:new Set(), visibleEnemyIds:new Set(),
  victoryShown:false,
  objData: {}
};

var UID = 0;
function createUnit(key, team, c, r) {
  var def = UNIT_DEFS[key];
  var men = def.maxMen;
  var wgs = def.weaponGroups.map(function(wg){ return {count:wg.count,weapon:wg.weapon,label:wg.label}; });
  return {
    id: ++UID, key, team,
    name: def.name, abbr: def.abbr, icon: def.icon,
    tags: def.tags.slice(),
    grade: def.grade,
    c, r,
    hp: men * def.hpPerMan, maxHp: men * def.hpPerMan,
    hpPerMan: def.hpPerMan, menAlive: men, menMax: men,
    move: def.move, ap: def.ap, maxAp: def.ap,
    saves: def.saves,
    weaponGroups: wgs,
    healDice: def.healDice||0, healRange: def.healRange||0,
    flying: def.flying||false,
    color: team==='ally'?'#4a8a3a':'#8a2020',
    moved:false, acted:false, activated:false,
    suppressed:false, suppressMarkers:0,
    overwatch:false, cannonFired:false, missilesLeft:4,
    // APC / transport_heli: can deploy infantry every 3 turns
    deployTimer:0, deploysLeft: (key==='apc'||key==='transport_heli')?3:0,
  };
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 11: MAP RENDERING (hex-native, ZERO square coords)
   ═══════════════════════════════════════════════════════════════ */
var mapZoom=1, mapPanX=0, mapPanY=0;

function applyMapTransform() {
  document.getElementById('game-map-inner').style.transform =
    'translate('+mapPanX+'px,'+mapPanY+'px) scale('+mapZoom+')';
  document.getElementById('zoom-label').textContent = Math.round(mapZoom*100)+'%';
}

function fitMapToView() {
  var wrap=document.getElementById('game-map-wrap');
  var sc=G.scenario;
  if(!wrap||!sc) return;
  var gw=hexGridWidth(sc.cols), gh=hexGridHeight(sc.rows);
  var sx=wrap.clientWidth/gw, sy=wrap.clientHeight/gh;
  mapZoom = Math.min(sx, sy); // fill viewport, no arbitrary cap
  mapPanX = Math.max(0,(wrap.clientWidth  - gw*mapZoom)/2);
  mapPanY = Math.max(0,(wrap.clientHeight - gh*mapZoom)/2);
  applyMapTransform();
}

// Convert screen event → canvas logical → hex
function screenToHex(clientX, clientY) {
  var wrap=document.getElementById('game-map-wrap');
  var rect=wrap.getBoundingClientRect();
  var lx=(clientX-rect.left-mapPanX)/mapZoom;
  var ly=(clientY-rect.top -mapPanY)/mapZoom;
  return pixelToHex(lx,ly);
}

function drawBaseMap(ctx, sc) {
  var gw=hexGridWidth(sc.cols), gh=hexGridHeight(sc.rows);
  ctx.clearRect(0,0,gw,gh);
  for(var r=0;r<sc.rows;r++) for(var c=0;c<sc.cols;c++) {
    var t=sc.map[r][c], p=hexToPixel(c,r);
    if(t.type==='wall') {
      ctx.fillStyle='#111209';
      drawHex(ctx,p.x,p.y,TILE-0.5); ctx.fill();
    } else {
      ctx.fillStyle=FLOOR_COLORS[t.floor]||'#5a5a4a';
      drawHex(ctx,p.x,p.y,TILE-0.5); ctx.fill();
      ctx.strokeStyle='rgba(0,0,0,.12)'; ctx.lineWidth=0.6;
      drawHex(ctx,p.x,p.y,TILE-0.5); ctx.stroke();
    }
  }
  // Obstacles
  sc.rows&&sc.map&&sc.map.forEach&&sc.map.forEach(function(row,r){
    row.forEach(function(t,c){
      if(!t.obs||t.type==='wall') return;
      var p=hexToPixel(c,r);
      ctx.fillStyle=OBS_COLORS[t.obs.type]||'#5a5a4a';
      drawHex(ctx,p.x,p.y,TILE-3); ctx.fill();
      if(isTall(t.obs.type)||isMed(t.obs.type)){
        ctx.strokeStyle=isTall(t.obs.type)?'rgba(255,255,255,.15)':'rgba(255,220,120,.12)';
        ctx.lineWidth=1.5; drawHex(ctx,p.x,p.y,TILE-3); ctx.stroke();
      }
      ctx.fillStyle='rgba(0,0,0,.65)';
      ctx.font='bold '+(TILE<36?6:8)+'px monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(t.obs.label||t.obs.type, p.x, p.y);
    });
  });
}

function drawUnit(ctx, u) {
  var p = hexToPixel(u.c, u.r);
  var hw = TILE*2, hh = hexH();        // bounding box: full hex
  var bx = p.x-hw/2, by = p.y-hh/2;   // bounding box top-left
  var exhausted = u.moved && u.acted;

  // Try sprite (riflemen only for now)
  var sk = getSpriteKey(u);
  var spr = sk ? SPRITES[sk] : null;
  if(spr && spr.complete && spr.naturalWidth>0) {
    // Shadow
    ctx.fillStyle='rgba(0,0,0,.3)';
    ctx.beginPath(); ctx.ellipse(p.x,p.y+hh*0.35,hw*0.28,hh*0.07,0,0,Math.PI*2); ctx.fill();
    // Sprite with lighter blend to knock out black background
    var pad=hw*0.06, sw=hw-pad*2, sh=hh-pad*2;
    ctx.save();
    if(u.suppressed) { ctx.globalAlpha=0.55; }
    else if(exhausted) { ctx.globalAlpha=0.5; }
    ctx.globalCompositeOperation='lighter';
    ctx.globalAlpha=(ctx.globalAlpha||1)*0.9;
    ctx.drawImage(spr, bx+pad, by+pad, sw, sh);
    ctx.restore();
  } else {
    // Procedural fallback
    ctx.fillStyle='rgba(0,0,0,.28)';
    ctx.beginPath(); ctx.ellipse(p.x,p.y+hh*0.3,hw*0.26,hh*0.07,0,0,Math.PI*2); ctx.fill();
    var col=u.suppressed?'#4a2a5a':exhausted?'#3a3a3a':u.color;
    var isVeh=u.tags.indexOf('vehicle')>=0;
    if(isVeh) {
      ctx.fillStyle=col;
      ctx.beginPath(); ctx.roundRect(bx+5,by+5,hw-10,hh-10,4); ctx.fill();
      ctx.strokeStyle='rgba(255,255,255,.12)'; ctx.lineWidth=1.5; ctx.stroke();
    } else {
      var men=Math.min(u.menAlive,6);
      var pts=[[-hw*0.18,-hh*0.12],[hw*0.18,-hh*0.22],[-hw*0.22,hh*0.05],
               [hw*0.22,hh*0.05],[0,-hh*0.28],[0,hh*0.12]];
      for(var i=0;i<men;i++){
        ctx.fillStyle=exhausted?'#555':col;
        ctx.beginPath(); ctx.arc(p.x+pts[i][0],p.y+pts[i][1],hw*0.09,0,Math.PI*2); ctx.fill();
      }
    }
    // Icon
    ctx.fillStyle=u.suppressed?'rgba(200,140,255,.9)':exhausted?'rgba(255,255,255,.3)':'rgba(255,255,255,.9)';
    ctx.font='bold '+(isVeh?hw*0.28:hw*0.2)+'px monospace';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(u.icon, p.x, p.y+(isVeh?0:-hh*0.06));
  }

  // HP bar (bottom of hex)
  var bw=hw*0.72, frac=Math.max(0,u.hp/u.maxHp);
  var barX=p.x-bw/2, barY=p.y+hh*0.40;
  ctx.fillStyle='rgba(0,0,0,.5)'; ctx.fillRect(barX,barY,bw,3.5);
  ctx.fillStyle=frac>.6?'#3a8a30':frac>.3?'#c87020':'#b02020';
  ctx.fillRect(barX,barY,bw*frac,3.5);

  // AP dots (top)
  var dotY=p.y-hh*0.42;
  for(var i=0;i<u.maxAp;i++){
    ctx.fillStyle=i<u.ap?'#ffe060':'rgba(0,0,0,.5)';
    ctx.beginPath(); ctx.arc(p.x+(i-u.maxAp/2+0.5)*8,dotY,2.5,0,Math.PI*2); ctx.fill();
  }

  // Team dot (corner)
  ctx.fillStyle=u.team==='ally'?'#44dd33':'#dd3333';
  ctx.beginPath(); ctx.arc(p.x+hw*0.36,p.y-hh*0.34,4,0,Math.PI*2); ctx.fill();

  // Status badges
  if(u.suppressed){
    ctx.fillStyle='rgba(210,140,255,.9)';
    ctx.font='bold 11px monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('⚡',p.x,p.y-hh*0.15);
  }
  if(u.overwatch){
    ctx.fillStyle='rgba(255,220,40,.9)';
    ctx.font='bold 9px monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('👁',p.x-hw*0.2,p.y-hh*0.15);
  }
}

function renderGame() {
  var cv=document.getElementById('game-canvas');
  var sc=G.scenario;
  if(!cv||!sc) return;
  var dpr=window.devicePixelRatio||1;
  var gw=hexGridWidth(sc.cols), gh=hexGridHeight(sc.rows);
  cv.width=Math.ceil(gw*dpr); cv.height=Math.ceil(gh*dpr);
  cv.style.width=gw+'px'; cv.style.height=gh+'px';
  var ctx=cv.getContext('2d');
  ctx.scale(dpr,dpr);

  drawBaseMap(ctx,sc);

  // Objective zone (capture — radius 2 around center)
  if(G.currentObjective==='capture'&&G.objData.captureHex){
    var oh=G.objData.captureHex;
    var allyT=G.objData.captureTurns||0;
    var enemyT=G.objData.enemyCaptureTurns||0;
    var whoHolds='none';
    var radius2=2;
    var aInZ=G.units.filter(function(u){return u.team==='ally'&&u.hp>0&&hexDist(u.c,u.r,oh.c,oh.r)<=radius2;}).length>0;
    var eInZ=G.units.filter(function(u){return u.team==='enemy'&&u.hp>0&&hexDist(u.c,u.r,oh.c,oh.r)<=radius2;}).length>0;
    if(aInZ&&!eInZ) whoHolds='ally';
    else if(eInZ&&!aInZ) whoHolds='enemy';
    else if(aInZ&&eInZ) whoHolds='contested';

    // Zone fill color: yellow=ally progress, red=enemy progress, grey=neutral
    var capColor=whoHolds==='ally'?'rgba(255,200,40,':whoHolds==='enemy'?'rgba(220,60,60,':'rgba(120,120,120,';
    var progress=whoHolds==='ally'?allyT/5:whoHolds==='enemy'?enemyT/5:0;
    for(var dr=-radius2;dr<=radius2;dr++) for(var dc=-radius2;dc<=radius2;dc++){
      if(hexDist(oh.c,oh.r,oh.c+dc,oh.r+dr)>radius2) continue;
      var nc2=oh.c+dc, nr2=oh.r+dr;
      if(nc2<0||nr2<0||nc2>=sc.cols||nr2>=sc.rows) continue;
      var zp=hexToPixel(nc2,nr2);
      ctx.fillStyle=capColor+(0.05+progress*0.14)+')';
      drawHex(ctx,zp.x,zp.y,TILE-2); ctx.fill();
    }
    // Center marker border
    var op=hexToPixel(oh.c,oh.r);
    ctx.strokeStyle=capColor+'0.85)'; ctx.lineWidth=3; ctx.setLineDash([5,3]);
    drawHex(ctx,op.x,op.y,TILE-2); ctx.stroke(); ctx.setLineDash([]);
    // Counter label
    var labelTurns=whoHolds==='ally'?allyT:whoHolds==='enemy'?enemyT:0;
    var labelMax=5;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.font='bold '+(TILE*0.38)+'px monospace';
    if(whoHolds==='contested'){
      ctx.fillStyle='rgba(255,160,0,.95)';
      ctx.fillText('⚡',op.x,op.y);
    } else if(labelTurns>0){
      ctx.fillStyle=whoHolds==='ally'?'rgba(255,220,60,.95)':'rgba(255,100,100,.95)';
      ctx.fillText(labelTurns+'/'+labelMax,op.x,op.y);
    } else {
      ctx.fillStyle='rgba(200,200,200,.5)';
      ctx.font='bold '+(TILE*0.28)+'px monospace';
      ctx.fillText('0/5',op.x,op.y);
    }
  }

  // Move tiles
  G.moveTiles.forEach(function(t){
    var p=hexToPixel(t.c,t.r);
    ctx.fillStyle='rgba(80,200,70,.22)'; drawHex(ctx,p.x,p.y,TILE-2); ctx.fill();
    ctx.strokeStyle='rgba(120,240,100,.85)'; ctx.lineWidth=2;
    drawHex(ctx,p.x,p.y,TILE-2); ctx.stroke();
    ctx.fillStyle='rgba(160,255,130,.9)';
    ctx.beginPath(); ctx.arc(p.x,p.y,3,0,Math.PI*2); ctx.fill();
  });

  // Attack tiles
  G.attackTiles.forEach(function(t){
    var p=hexToPixel(t.c,t.r);
    var hasE=G.units.find(function(u){
      return u.c===t.c&&u.r===t.r&&u.hp>0&&u.team==='enemy'&&G.visibleEnemyIds.has(u.id);
    });
    if(hasE){
      ctx.fillStyle='rgba(220,50,50,.28)'; drawHex(ctx,p.x,p.y,TILE-2); ctx.fill();
      ctx.strokeStyle='rgba(255,80,80,.9)'; ctx.lineWidth=2.5;
      drawHex(ctx,p.x,p.y,TILE-2); ctx.stroke();
      var r2=TILE*0.32;
      ctx.strokeStyle='rgba(255,120,120,.7)'; ctx.lineWidth=1.8;
      ctx.beginPath();
      ctx.moveTo(p.x-r2,p.y-r2); ctx.lineTo(p.x+r2,p.y+r2);
      ctx.moveTo(p.x+r2,p.y-r2); ctx.lineTo(p.x-r2,p.y+r2);
      ctx.stroke();
    } else {
      ctx.fillStyle='rgba(200,50,50,.08)'; drawHex(ctx,p.x,p.y,TILE-2); ctx.fill();
      ctx.strokeStyle='rgba(180,50,50,.4)'; ctx.lineWidth=1;
      drawHex(ctx,p.x,p.y,TILE-2); ctx.stroke();
    }
  });

  // Selection highlight
  if(G.selected&&G.selected.hp>0){
    var sp=hexToPixel(G.selected.c,G.selected.r);
    ctx.strokeStyle='rgba(220,180,30,.9)'; ctx.lineWidth=3;
    drawHex(ctx,sp.x,sp.y,TILE-1); ctx.stroke();
    ctx.strokeStyle='rgba(255,220,80,.3)'; ctx.lineWidth=1.5;
    drawHex(ctx,sp.x,sp.y,TILE-4); ctx.stroke();
  }

  // Units (ground first, then flying)
  G.units.forEach(function(u){
    if(u.hp<=0||u.flying) return;
    if(u.team==='enemy'&&!G.visibleEnemyIds.has(u.id)) return;
    drawUnit(ctx,u);
  });
  G.units.forEach(function(u){
    if(u.hp<=0||!u.flying) return;
    if(u.team==='enemy'&&!G.visibleEnemyIds.has(u.id)) return;
    // Flying: dashed border
    var fp=hexToPixel(u.c,u.r);
    ctx.strokeStyle=u.team==='ally'?'rgba(100,200,255,.45)':'rgba(255,140,100,.45)';
    ctx.lineWidth=1.5; ctx.setLineDash([4,3]);
    drawHex(ctx,fp.x,fp.y,TILE-2); ctx.stroke(); ctx.setLineDash([]);
    drawUnit(ctx,u);
  });

  // Fog of war
  for(var r=0;r<sc.rows;r++) for(var c=0;c<sc.cols;c++){
    if(!G.visibleCells.has(c+','+r)){
      var fp=hexToPixel(c,r);
      ctx.fillStyle='rgba(0,0,0,.78)';
      drawHex(ctx,fp.x,fp.y,TILE+0.5); ctx.fill();
    }
  }
}

/* Deploy canvas */
function renderDeployCanvas() {
  var sc=G.scenario, cv=document.getElementById('deploy-canvas');
  if(!cv||!sc) return;
  var dpr=window.devicePixelRatio||1;
  var gw=hexGridWidth(sc.cols), gh=hexGridHeight(sc.rows);
  var isMobile=window.innerWidth<=680;
  var scale=1;
  if(isMobile){
    var aw=window.innerWidth-8;
    scale=Math.max(0.25,Math.min(aw/gw,1));
  }
  cv.width=Math.ceil(gw*scale*dpr); cv.height=Math.ceil(gh*scale*dpr);
  cv.style.width=Math.ceil(gw*scale)+'px'; cv.style.height=Math.ceil(gh*scale)+'px';
  var ctx=cv.getContext('2d'); ctx.scale(dpr*scale,dpr*scale);
  drawBaseMap(ctx,sc);
  // Spawn zones
  ctx.fillStyle='rgba(60,160,50,.32)';
  sc.spawnAlly.forEach(function(s){var p=hexToPixel(s.c,s.r);drawHex(ctx,p.x,p.y,TILE-2);ctx.fill();});
  ctx.fillStyle='rgba(160,50,50,.22)';
  sc.spawnEnemy.forEach(function(s){var p=hexToPixel(s.c,s.r);drawHex(ctx,p.x,p.y,TILE-2);ctx.fill();});
  // Deployed units
  G.deployedUnits.forEach(function(u){drawUnit(ctx,u);});
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 12: FOG OF WAR & MOVEMENT
   ═══════════════════════════════════════════════════════════════ */
function updateFog() {
  var sc=G.scenario;
  G.visibleCells=new Set(); G.visibleEnemyIds=new Set();
  var allies=G.units.filter(function(u){return u.team==='ally'&&u.hp>0;});
  allies.forEach(function(a){
    var range=8;
    for(var dr=-range;dr<=range;dr++) for(var dc=-range;dc<=range;dc++){
      var tc=a.c+dc,tr=a.r+dr;
      if(tc<0||tr<0||tc>=sc.cols||tr>=sc.rows) continue;
      if(hexDist(a.c,a.r,tc,tr)>range) continue;
      if(hasLOS(a.c,a.r,tc,tr,a)) G.visibleCells.add(tc+','+tr);
    }
  });
  G.units.filter(function(u){return u.team==='enemy'&&u.hp>0;}).forEach(function(e){
    if(G.visibleCells.has(e.c+','+e.r)) G.visibleEnemyIds.add(e.id);
  });
}

function getMoves(unit) {
  var sc=G.scenario, moves=[], visited=new Set();
  var queue=[{c:unit.c,r:unit.r,steps:0}];
  visited.add(unit.c+','+unit.r);
  while(queue.length){
    var cur=queue.shift();
    if(cur.steps>0) moves.push({c:cur.c,r:cur.r});
    if(cur.steps>=unit.move) continue;
    hexNeighbors(cur.c,cur.r,sc).forEach(function(n){
      var key=n.c+','+n.r;
      if(visited.has(key)) return;
      visited.add(key);
      var t=sc.map[n.r][n.c];
      if(t.type==='wall') return;
      if(!unit.flying&&t.obs&&isTall(t.obs.type)) return;
      if(G.units.find(function(u){return u.hp>0&&u.c===n.c&&u.r===n.r&&u.id!==unit.id;})) return;
      queue.push({c:n.c,r:n.r,steps:cur.steps+1});
    });
  }
  return moves;
}

function getAttackTiles(unit) {
  var sc=G.scenario, tiles=[];
  var maxRange=0;
  unit.weaponGroups.forEach(function(wg){
    maxRange=Math.max(maxRange,WEAPONS[wg.weapon].range);
  });
  for(var r=0;r<sc.rows;r++) for(var c=0;c<sc.cols;c++){
    if(hexDist(unit.c,unit.r,c,r)<=maxRange&&hasLOS(unit.c,unit.r,c,r,unit))
      tiles.push({c,r});
  }
  return tiles;
}

function canAttack(attacker, target) {
  return attacker.weaponGroups.some(function(wg){
    var w=WEAPONS[wg.weapon];
    return hexDist(attacker.c,attacker.r,target.c,target.r)<=w.range &&
           hasLOS(attacker.c,attacker.r,target.c,target.r,attacker);
  }) && hasLOS(attacker.c,attacker.r,target.c,target.r,attacker);
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 13: COMBAT
   ═══════════════════════════════════════════════════════════════ */
function d6(){ return Math.floor(Math.random()*6)+1; }
function rollDice(n){ var r=[]; for(var i=0;i<n;i++) r.push(d6()); return r; }

function resolveWeapon(attacker, target, wg) {
  var w=WEAPONS[wg.weapon];
  var isDefVeh=target.tags.indexOf('vehicle')>=0;
  var isDefHeavy=target.tags.indexOf('heavy')>=0;
  var coverInfo=getCoverInfo(attacker.c,attacker.r,target.c,target.r,isDefVeh);
  var grade=GRADES[attacker.grade]||GRADES.average;

  // Heal weapon (medic)
  if(w.abilities.indexOf('heal')>=0) return null; // handled separately

  // Light infantry cannot wound heavy vehicles
  var cantWound=isDefHeavy&&attacker.tags.indexOf('infantry')>=0&&
    w.ap<3&&w.abilities.indexOf('anti_vehicle')<0;
  if(cantWound) return {blocked:true,reason:'Armas ligeras no penetran blindaje pesado',w,wg};

  // Single-shot check
  if(w.abilities.indexOf('single_shot')>=0&&attacker.cannonFired)
    return {blocked:true,reason:'Ya disparado este turno',w,wg};
  if(w.abilities.indexOf('single_shot')>=0) attacker.cannonFired=true;

  var dist=hexDist(attacker.c,attacker.r,target.c,target.r);
  var numDice=w.atk*wg.count;
  var mods=[];

  // Quality bonus on attack
  if(grade.woundMod>0){mods.push({txt:'Elite: +1 hit',cls:'mod-g'});}
  if(grade.woundMod<0){mods.push({txt:'Milicia: -1 hit',cls:'mod-b'});}

  // Weapon abilities
  if(w.abilities.indexOf('heavy')>=0&&!attacker.moved){numDice++;mods.push({txt:'Heavy: +1d (no movió)',cls:'mod-g'});}
  // Precision: sniper bonus scales with distance AND requires stationary
  // At rest: base BS improves. The farther the target (beyond half range), better accuracy.
  // hitThr already declared below — we store a modifier here first
  var precisionMod=0;
  if(w.abilities.indexOf('precision')>=0){
    if(attacker.moved){
      // Moving sniper loses precision entirely: +1 to hit threshold (harder)
      precisionMod=+1;
      mods.push({txt:'Precisión: movió (+1 dificultad)',cls:'mod-b'});
    } else {
      // Stationary: base bonus already from BS:3. Check distance bonus.
      var halfRange=Math.floor(w.range/2); // 4 hexes
      if(dist>halfRange){
        // Every 2 hexes beyond half range = -1 to hit threshold (easier), max -2
        var rangeBonus=Math.min(2,Math.floor((dist-halfRange)/2));
        if(rangeBonus>0){
          precisionMod=-rangeBonus;
          mods.push({txt:'Precisión a distancia: -'+rangeBonus+' dificultad',cls:'mod-g'});
        }
      }
    }
  }
  if(w.abilities.indexOf('rapid_fire')>=0&&dist<=Math.floor(w.range/2)){numDice*=2;mods.push({txt:'Rapid Fire ×2',cls:'mod-g'});}
  if(w.abilities.indexOf('blast')>=0&&target.menAlive>2){var b=Math.floor(target.menAlive/3);numDice+=b;mods.push({txt:'Blast +'+b+'d',cls:'mod-g'});}
  if(!isDefVeh&&coverInfo.type==='light'){numDice=Math.max(1,numDice-1);mods.push({txt:'Cob.Ligera -1d',cls:'mod-b'});}
  if(attacker.suppressed){numDice=Math.max(1,Math.floor(numDice/2));mods.push({txt:'Suprimido ÷2d',cls:'mod-b'});}

  // Hazardous
  var hazNote=null;
  if(w.abilities.indexOf('hazardous')>=0){
    var hr=d6();
    if(hr===1){applyWounds(attacker,1,true);hazNote='¡HAZARDOUS! Herida propia';}
  }

  // Hit roll
  var hitThr=Math.min(6,Math.max(2, w.bs+(grade.woundMod<0?1:0)+precisionMod));
  var atkRolls=rollDice(numDice);
  var hits=atkRolls.filter(function(d){return d>=hitThr;}).length;
  if(w.abilities.indexOf('sustained_hits')>=0){var sh=atkRolls.filter(function(d){return d===6;}).length;if(sh>0){hits+=sh;mods.push({txt:'Sustained +'+sh,cls:'mod-g'});}}

  // Wound roll
  var wndThr=4-(grade.woundMod>0?1:0);
  var isAV=w.abilities.indexOf('anti_vehicle')>=0;
  if(isAV&&isDefVeh) wndThr=2;
  var wndRolls=hits>0?rollDice(hits):[];
  var crits=wndRolls.filter(function(d){return d===6;}).length;
  var norms=wndRolls.filter(function(d){return d>=wndThr&&d<6;}).length;
  var wounds=norms+crits;

  // Save roll
  var baseSave=target.saves[coverInfo.type]||target.saves['none']||6;
  if(!isDefVeh&&coverInfo.type==='medium'){baseSave=Math.max(2,baseSave-1);mods.push({txt:'Cob.Media +1 save',cls:'mod-g'});}
  var saveThr=Math.max(2,baseSave-Math.floor(w.ap/2));
  var saveRolls=wounds>0?rollDice(wounds):[];
  // Crits bypass saves
  var saved=saveRolls.slice(crits).filter(function(d){return d>=saveThr;}).length;
  var net=(wounds-saved)*w.dmg;
  if(crits>0&&isDefVeh&&w.ap>=3){net+=crits*w.dmg;mods.push({txt:'Crítico ×2 vs veh',cls:'mod-g'});}

  return{blocked:false,w,wg,numDice,hitThr,atkRolls,hits,wndRolls,wndThr,wounds,crits,
    saveRolls,saveThr,saved,net,mods,hazNote,coverInfo};
}

function applyWounds(unit, dmg, skipLog) {
  if(!dmg||dmg<=0) return;
  var wasHp=unit.hp;
  unit.hp=Math.max(0,unit.hp-dmg);
  if(unit.tags.indexOf('infantry')>=0){
    var prevMen=unit.menAlive;
    unit.menAlive=Math.max(0,Math.ceil(unit.hp/unit.hpPerMan));
    var lost=prevMen-unit.menAlive;
    // Remove casualties from weapon groups
    for(var gi=unit.weaponGroups.length-1;gi>=0&&lost>0;gi--){
      var take=Math.min(unit.weaponGroups[gi].count,lost);
      unit.weaponGroups[gi].count-=take; lost-=take;
    }
    unit.weaponGroups=unit.weaponGroups.filter(function(wg){return wg.count>0;});
  }
}

/* WEAPON SELECT OVERLAY */
var G_target=null;
function openWeaponSelect(attacker, target) {
  G_target={attacker,target};
  var list=document.getElementById('wo-list');
  list.innerHTML='';
  document.getElementById('wo-target-txt').textContent=
    'Objetivo: '+target.name+' ('+target.hp+'/'+target.maxHp+' HP)';
  var isDefVeh=target.tags.indexOf('vehicle')>=0;
  var isDefHeavy=target.tags.indexOf('heavy')>=0;

  attacker.weaponGroups.forEach(function(wg,gi){
    var w=WEAPONS[wg.weapon];
    if(w.abilities.indexOf('heal')>=0) return;
    var dist=hexDist(attacker.c,attacker.r,target.c,target.r);
    var oor=dist>w.range;
    var cw=isDefHeavy&&attacker.tags.indexOf('infantry')>=0&&w.ap<3&&w.abilities.indexOf('anti_vehicle')<0;
    var ss=w.abilities.indexOf('single_shot')>=0&&attacker.cannonFired;
    var dis=oor||cw||ss;
    var nd=w.atk*wg.count;
    var pmods=[];
    if(!dis){
      if(w.abilities.indexOf('heavy')>=0&&!attacker.moved){nd++;pmods.push('+1H');}
      if(w.abilities.indexOf('rapid_fire')>=0&&dist<=Math.floor(w.range/2)){nd*=2;pmods.push('×2RF');}
      if(w.abilities.indexOf('blast')>=0&&target.menAlive>2){nd+=Math.floor(target.menAlive/3);pmods.push('+Bls');}
      if(attacker.suppressed){nd=Math.max(1,Math.floor(nd/2));pmods.push('÷2S');}
    }
    var row=document.createElement('div');
    row.className='wo-row'+(dis?' wo-dis':'');
    row.dataset.gi=gi;
    row.innerHTML='<div class="wo-chk"></div>'
      +'<div class="wo-inf"><div class="wo-nm">'+w.name+' ×'+wg.count+'</div>'
      +'<div class="wo-st">ATK:'+w.atk+'×'+wg.count+' BS:'+w.bs+'+ RNG:'+w.range+' AP:'+w.ap+'</div>'
      +(dis?'<div class="wo-md mod-b">'+(oor?'FUERA DE RANGO':cw?'NO PENETRA':ss?'YA DISPARADO':'')+'</div>'
        :pmods.length?'<div class="wo-md">'+pmods.map(function(s){return '<span class="mod-g">'+s+'</span>';}).join(' ')+'</div>':'')
      +'</div>'
      +'<div class="wo-dc">'+(dis?'—':nd+'d')+'</div>';
    if(!dis) row.addEventListener('click',function(){
      this.classList.toggle('wo-on');
      this.querySelector('.wo-chk').textContent=this.classList.contains('wo-on')?'✓':'';
    });
    list.appendChild(row);
  });
  // Auto-check all available
  list.querySelectorAll('.wo-row:not(.wo-dis)').forEach(function(r){
    r.classList.add('wo-on'); r.querySelector('.wo-chk').textContent='✓';
  });
  showOv('wo-ov');
}

function confirmWeaponSelect() {
  hideOv('wo-ov');
  if(!G_target) return;
  var att=G_target.attacker, tgt=G_target.target;
  var selIdx=[];
  document.querySelectorAll('#wo-list .wo-row.wo-on').forEach(function(r){selIdx.push(parseInt(r.dataset.gi));});
  if(!selIdx.length){addLog('Ningún arma seleccionada','miss');G_target=null;return;}
  var results=selIdx.map(function(gi){return resolveWeapon(att,tgt,att.weaponGroups[gi]);}).filter(Boolean);
  var totalNet=results.reduce(function(s,r){return s+(r.net||0);},0);
  att.acted=true; att.ap=Math.max(0,att.ap-1);
  applyWounds(tgt,totalNet);
  if(totalNet>0){ var isVehTgt=tgt.tags.indexOf('vehicle')>=0; isVehTgt?SFX.explosion():SFX.rifle(); }
  if(totalNet>0) addLog('💥 '+att.name+'→'+tgt.name+': '+totalNet+' daño ('+tgt.hp+'/'+tgt.maxHp+' HP)','hit');
  else{ SFX.miss(); addLog('○ '+att.name+'→'+tgt.name+': sin efecto','miss'); }
  if(tgt.hp<=0) addLog('💀 '+tgt.name+' ELIMINADO!','hit');
  showDiceResults(att.name+'→'+tgt.name, results, function(){
    G_target=null; G.attackTiles=[];
    if(checkVictory()) return;
    updateFog(); updateGameUI(); renderGame();
  });
}

/* CLOSE ASSAULT (RFIC-inspired) */
function performCloseAssault(attacker, target) {
  addLog('⚔ ASALTO: '+attacker.name+' vs '+target.name,'hit');
  SFX.assault();
  var isAVeh=attacker.tags.indexOf('vehicle')>=0;
  var isDVeh=target.tags.indexOf('vehicle')>=0;
  var aDice=isAVeh?4:attacker.menAlive;
  var dDice=isDVeh?4:target.menAlive;
  var aRolls=rollDice(aDice), dRolls=rollDice(dDice);
  var aHits=aRolls.filter(function(d){return d>=4;}).length;
  var dHits=dRolls.filter(function(d){return d>=4;}).length;
  addLog('  '+attacker.name+': ['+aRolls+']='+aHits+' hits','sys');
  addLog('  '+target.name+': ['+dRolls+']='+dHits+' hits','sys');
  // Apply hits
  if(aHits>0) applyWounds(target,aHits);
  if(dHits>0) applyWounds(attacker,dHits);
  if(aHits>dHits){
    addLog('✓ '+attacker.name+' GANA el asalto!','hit');
    var rh=findRetreatHex(target,attacker);
    if(target.hp>0&&rh){target.c=rh.c;target.r=rh.r;}
    if(target.hp>0){target.suppressed=true;target.suppressMarkers=Math.min(3,(target.suppressMarkers||0)+2);}
    if(target.hp<=0) addLog('💀 '+target.name+' ELIMINADO!','hit');
  } else if(dHits>aHits){
    addLog('✗ '+attacker.name+' RECHAZADO!','miss');
    var rh=findRetreatHex(attacker,target);
    if(rh){attacker.c=rh.c;attacker.r=rh.r;}
    attacker.suppressed=true; attacker.suppressMarkers=Math.min(3,(attacker.suppressMarkers||0)+2);
  } else {
    addLog('= EMPATE — ambos reciben 1 herida extra','miss');
    applyWounds(target,1); applyWounds(attacker,1);
  }
  attacker.acted=true; attacker.moved=true; attacker.ap=0;
  updateFog(); checkVictory(); updateGameUI(); renderGame();
}

function findRetreatHex(unit, fromUnit) {
  var best=null, bestD=-1;
  hexNeighbors(unit.c,unit.r,G.scenario).forEach(function(n){
    var t=G.scenario.map[n.r][n.c];
    if(t.type==='wall'||(t.obs&&isTall(t.obs.type))) return;
    if(G.units.find(function(u){return u.hp>0&&u.c===n.c&&u.r===n.r;})) return;
    var d=hexDist(n.c,n.r,fromUnit.c,fromUnit.r);
    if(d>bestD){bestD=d;best=n;}
  });
  return best;
}

/* DICE RESULT DISPLAY */
var diceCallback=null;
function showDiceResults(title, results, cb) {
  var dd=document.getElementById('dice-display');
  dd.innerHTML='';
  document.getElementById('dice-title').textContent=title;
  var totalNet=0;
  results.forEach(function(res){
    if(!res) return;
    var blk=document.createElement('div'); blk.className='db';
    if(res.blocked){
      blk.innerHTML='<div class="db-name">'+res.w.name+'</div><div class="db-mods mod-b">'+res.reason+'</div>';
      dd.appendChild(blk); return;
    }
    totalNet+=res.net||0;
    var mh=res.mods.map(function(m){return '<span class="'+m.cls+'">'+m.txt+'</span>';}).join(' · ');
    if(res.hazNote) mh+=' · <span class="mod-b">'+res.hazNote+'</span>';
    var ah='<div class="db-rl">ATAQUE ('+res.numDice+'d6 '+res.hitThr+'+)</div><div class="db-row">';
    res.atkRolls.forEach(function(d){ah+='<div class="die '+(d>=res.hitThr?'h':'f')+'">'+d+'</div>';});
    ah+='</div>';
    var wh='';
    if(res.wndRolls.length){
      wh='<div class="db-rl">HERIDA ('+res.wndThr+'+)</div><div class="db-row">';
      res.wndRolls.forEach(function(d){wh+='<div class="die '+(d===6?'crit':d>=res.wndThr?'w':'f')+'">'+d+'</div>';});
      wh+='</div>';
    }
    var sh='';
    if(res.saveRolls.length){
      sh='<div class="db-rl">SALVACIÓN ('+res.saveThr+'+)</div><div class="db-row">';
      res.saveRolls.forEach(function(d){sh+='<div class="die '+(d>=res.saveThr?'s':'f')+'">'+d+'</div>';});
      sh+='</div>';
    }
    blk.innerHTML='<div class="db-name">'+res.w.name+' ×'+res.wg.count+'</div>'
      +(mh?'<div class="db-mods">'+mh+'</div>':'')
      +ah+wh+sh
      +'<div class="db-res"><span class="mod-b">'+res.wounds+'H</span>'
      +' → <span style="color:var(--blue3)">'+res.saved+'S</span>'
      +' → <span class="mod-g">'+res.net+' daño</span>'
      +(res.crits>0?' · <span style="color:#fff">'+res.crits+' CRIT!</span>':'')+'</div>';
    dd.appendChild(blk);
  });
  document.getElementById('dice-total').textContent=totalNet>0?'DAÑO TOTAL: '+totalNet+' HP':'SIN EFECTO';
  diceCallback=cb;
  showOv('dice-ov');
}

/* SUPPRESSION */
function performSuppression(attacker, target) {
  if(attacker.acted) return;
  var hasSupp=attacker.weaponGroups.some(function(wg){return WEAPONS[wg.weapon].abilities.indexOf('suppression')>=0;});
  if(!hasSupp){setHint('Esta unidad no tiene armas de supresión');return;}
  var result=rollDice(2);
  var success=result.some(function(d){return d>=4;});
  attacker.acted=true; attacker.ap=Math.max(0,attacker.ap-1);
  if(success){
    target.suppressed=true;
    target.suppressMarkers=Math.min(3,(target.suppressMarkers||0)+1);
    SFX.suppress(); addLog('⚡ '+attacker.name+' SUPRIME a '+target.name,'supp');
  } else {
    addLog('○ '+attacker.name+' intenta suprimir a '+target.name+': fallido','miss');
  }
  updateFog(); updateGameUI(); renderGame();
}

/* VICTORY CHECK */
function checkVictory() {
  if(G.victoryShown) return false;
  var obj=OBJECTIVES[G.currentObjective];
  if(!obj) return false;
  var won=obj.check(), lost=obj.lose();
  if(won||lost){
    G.victoryShown=true;
    setTimeout(function(){ showVictory(won); }, 400);
    return true;
  }
  return false;
}

function showVictory(won) {
  stopAllMusic();
  setTimeout(function(){ won?SFX.victory():SFX.defeat(); }, 300);
  document.getElementById('vic-result').textContent=won?'VICTORIA':'DERROTA';
  document.getElementById('vic-result').className='vic-result '+(won?'vic-won':'vic-lost');
  var a=G.units.filter(function(u){return u.team==='ally'&&u.hp>0;}).length;
  var e=G.units.filter(function(u){return u.team==='enemy'&&u.hp>0;}).length;
  document.getElementById('vic-stats').innerHTML=
    'Ronda: '+G.round+'<br>'+(won?'¡Misión completada!':'Fuerzas aliadas eliminadas')+
    '<br>Aliados en pie: '+a+' | Enemigos en pie: '+e;
  showOv('vic-ov');
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 14: AI
   ═══════════════════════════════════════════════════════════════ */
// ══ AI FORCE COMPOSER ══════════════════════════════════════════════════
// Reads player's force, counter-builds, distributes across full spawn zone

function analyzeAllyForce() {
  var force={
    totalCost:0, unitCount:0,
    hasArmor:false, hasHeli:false, hasMedic:false,
    hasAT:false, hasSniper:false, hasTransport:false,
    infantryCount:0, vehicleCount:0,
    units: G.deployedUnits.map(function(u){return u.key;})
  };
  G.deployedUnits.forEach(function(u){
    var def=UNIT_DEFS[u.key];
    force.totalCost+=def.cost; force.unitCount++;
    if(u.tags.indexOf('vehicle')>=0) force.vehicleCount++;
    else force.infantryCount++;
    if(u.key==='tank'||u.key==='apc')     force.hasArmor=true;
    if(u.key==='attack_heli'||u.key==='transport_heli') force.hasHeli=true;
    if(u.key==='medics')   force.hasMedic=true;
    if(u.key==='antitank') force.hasAT=true;
    if(u.key==='sniper')   force.hasSniper=true;
    if(u.key==='transport_heli') force.hasTransport=true;
  });
  return force;
}

function generateEnemyForce(budget) {
  var units=[], points=0;
  var spawnPts=G.scenario.spawnEnemy;
  var obj=G.currentObjective;
  var ally=analyzeAllyForce();

  // ── COUNTER-BUILD POOL (responds to ally force) ─────────────────────
  var pool=[];

  // Always: medic support
  pool.push({key:'medics',grade:'average',priority:1});

  // Counter ally vehicles with AT units
  if(ally.hasArmor||ally.vehicleCount>0){
    pool.push({key:'antitank',grade:'average',priority:2});
    pool.push({key:'antitank',grade:'average',priority:3});
    pool.push({key:'tank',grade:'good',priority:4});
  }

  // Counter ally helis with attack helis
  if(ally.hasHeli){
    pool.push({key:'attack_heli',grade:'good',priority:2});
  }

  // Counter sniper with sniper
  if(ally.hasSniper){
    pool.push({key:'sniper',grade:'good',priority:5});
    pool.push({key:'sniper',grade:'good',priority:6});
  }

  // Match ally medic with own medic
  if(ally.hasMedic){
    pool.push({key:'medics',grade:'average',priority:3});
  }

  // Mission-specific additions
  if(obj==='capture'||obj==='survive'){
    // Defensive: more infantry + transport for rapid redeployment
    pool.push({key:'riflemen',grade:'average',priority:2});
    pool.push({key:'riflemen',grade:'average',priority:2});
    pool.push({key:'riflemen',grade:'average',priority:3});
    pool.push({key:'apc',grade:'average',priority:4});
    pool.push({key:'transport_heli',grade:'average',priority:5});
  } else {
    // Assault: armor + assault infantry
    pool.push({key:'tank',grade:'good',priority:2});
    pool.push({key:'apc',grade:'average',priority:3});
    pool.push({key:'attack_heli',grade:'good',priority:4});
    pool.push({key:'jeep',grade:'average',priority:5});
  }

  // Backbone riflemen
  for(var i=0;i<8;i++) pool.push({key:'riflemen',grade:'average',priority:7});
  pool.push({key:'medics',grade:'average',priority:6});

  // Sort by priority
  pool.sort(function(a,b){return a.priority-b.priority;});

  // Deduplicate to reasonable max counts
  var counts={};
  var maxCounts={tank:3,apc:2,attack_heli:2,transport_heli:1,
    antitank:3,sniper:3,medics:2,riflemen:99,jeep:2};
  pool=pool.filter(function(entry){
    counts[entry.key]=(counts[entry.key]||0)+1;
    return counts[entry.key]<=(maxCounts[entry.key]||2);
  });

  // ── SPAWN DISTRIBUTION across entire zone ───────────────────────────
  // Shuffle spawn points so units spread across the whole zone, not just top
  var shuffledSpawn=spawnPts.slice().sort(function(){return Math.random()-0.5;});
  var spawnIdx=0;

  function addUnit(key, grade) {
    if(spawnIdx>=shuffledSpawn.length) return false;
    var def=UNIT_DEFS[key];
    if(!def) return false;
    var sp=shuffledSpawn[spawnIdx];
    var u=createUnit(key,'enemy',sp.c,sp.r);
    u.grade=grade;
    units.push(u); spawnIdx++;
    return true;
  }

  // Build from pool until budget exhausted
  pool.forEach(function(entry){
    var def=UNIT_DEFS[entry.key];
    if(!def||points+def.cost>budget) return;
    if(addUnit(entry.key,entry.grade)) points+=def.cost;
  });

  // Fill remaining budget with riflemen
  var rfCost=UNIT_DEFS['riflemen'].cost;
  while(points+rfCost<=budget&&spawnIdx<shuffledSpawn.length){
    if(addUnit('riflemen','average')) points+=rfCost;
    else break;
  }

  // ── ROLE ASSIGNMENT ─────────────────────────────────────────────────
  var assaultCount=0, total=units.length;
  units.forEach(function(u,i){
    if(u.key==='medics')      u.aiRole='medic';
    else if(u.key==='tank'||u.key==='apc') u.aiRole='armor';
    else if(u.key==='sniper') u.aiRole='sniper';
    else if(u.key==='antitank') u.aiRole='at_hunter';
    else if(u.key==='attack_heli'||u.key==='transport_heli') u.aiRole='air';
    else {
      // Split infantry: 50% assault, 50% flank for eliminate
      // For capture/survive: more defenders
      if(obj==='capture'||obj==='survive'){
        u.aiRole=assaultCount<Math.floor(total*0.3)?'assault':'flank';
      } else {
        u.aiRole=assaultCount<Math.floor(total*0.5)?'assault':'flank';
      }
      assaultCount++;
    }
    // Mission mindset tag
    u.missionMind=obj;
  });

  addLog('IA contrarrestó con '+units.length+' unidades ('+points+' pts) vs tu ejército de '+ally.unitCount,'sys');
  return units;
}

// ══ STRATEGIC AI ══════════════════════════════════════════════════════

// Score a potential target — higher = more important to kill
function aiTargetScore(attacker, target) {
  var score = 0;

  // ── High-value target priority ──────────────────────────────────────
  // Medics: highest priority — they heal, must be silenced first
  if(target.key==='medics') score+=350;
  // Reinforce generators
  if(target.key==='apc'||target.key==='transport_heli') score+=300;
  // Air threats
  if(target.key==='attack_heli') score+=220;
  // Armor
  if(target.key==='tank') score+=160;
  // AT teams (threat to enemy armor)
  if(target.key==='antitank') score+=120;

  // ── Opportunity bonuses ─────────────────────────────────────────────
  // Almost dead = finish it
  score += (1 - target.hp/target.maxHp) * 120;
  // Suppressed target = easier kill
  if(target.suppressed) score+=60;

  // ── Range factor (closer = higher priority) ─────────────────────────
  score -= hexDist(attacker.c,attacker.r,target.c,target.r) * 4;

  // ── Role-specific overrides ─────────────────────────────────────────
  if(attacker.aiRole==='sniper'){
    // Snipers prioritize medics and lone units
    if(target.key==='medics') score+=150;
    if(target.menAlive<=2) score+=80;
    // Snipers stay away from tanks
    if(target.tags.indexOf('heavy')>=0) score-=200;
  }
  if(attacker.aiRole==='at_hunter'){
    if(target.tags.indexOf('vehicle')>=0) score+=250;
    else score-=150; // ignore infantry
  }
  if(attacker.aiRole==='armor'){
    // Armor loves infantry clusters, ignores vehicles (friendly fire risk concept)
    if(target.tags.indexOf('infantry')>=0) score+=80;
    if(target.key==='medics') score+=50; // extra incentive
  }
  if(attacker.aiRole==='assault'){
    // Assault ignores vehicles (no AP weapons), focuses infantry
    if(target.tags.indexOf('heavy')>=0) score-=100;
  }
  if(attacker.aiRole==='flank'){
    if(target.key==='medics') score+=100;
    var nearAllies=G.units.filter(function(u){
      return u.team==='ally'&&u.hp>0&&hexDist(u.c,u.r,target.c,target.r)<=2&&u.id!==target.id;
    }).length;
    score -= nearAllies*15;
  }

  // ── Mission-specific target bonuses ─────────────────────────────────
  var mission=attacker.missionMind||G.currentObjective||'eliminate_all';
  if(mission==='capture'){
    // In capture mode: prioritize targets inside the capture zone
    var ch=G.objData.captureHex;
    if(ch&&hexDist(target.c,target.r,ch.c,ch.r)<=2) score+=100;
  } else if(mission==='survive'){
    // In survive mode: focus the most dangerous attackers (highest damage potential)
    if(target.key==='tank'||target.key==='attack_heli') score+=120;
    // Kill units that are approaching spawn
    var spawnC=aiGetEnemySpawnCenter();
    var dToSpawn=hexDist(target.c,target.r,spawnC.c,spawnC.r);
    if(dToSpawn<10) score+=80;
  }

  return score;
}

// Find best visible attack target for a unit
function aiBestTarget(e) {
  var allies=G.units.filter(function(u){return u.team==='ally'&&u.hp>0;});
  var best=null, bestScore=-Infinity;
  allies.forEach(function(a){
    if(!canAttack(e,a)) return;
    var s=aiTargetScore(e,a);
    if(s>bestScore){bestScore=s;best=a;}
  });
  return best;
}

// Find best move position toward target, preferring cover
function aiBestMove(e, target) {
  var moves=getMoves(e);
  if(!moves.length) return null;
  moves.sort(function(a,b){
    var scoreA=aiMoveScore(e,a,target);
    var scoreB=aiMoveScore(e,b,target);
    return scoreB-scoreA;
  });
  return moves[0];
}

function aiMoveScore(e, pos, target) {
  var score=0;
  var sc=G.scenario;
  var dist=hexDist(pos.c,pos.r,target.c,target.r);
  var mission=e.missionMind||G.currentObjective||'eliminate_all';

  // ── Mission mindset overlay ──────────────────────────────────────────
  if(mission==='capture'){
    // Capture: all units want to be near the center zone
    var ch=G.objData.captureHex;
    if(ch){
      var dCenter=hexDist(pos.c,pos.r,ch.c,ch.r);
      if(e.aiRole==='assault'||e.aiRole==='armor'){
        score -= dCenter*14; // rush to center
      } else if(e.aiRole==='flank'){
        // Flankers approach center from the sides
        score -= dCenter*8;
        var allyC=aiGetAllyCenter();
        score += Math.abs(pos.r-allyC.r)*3;
      }
      // Snipers cover center from perimeter
      if(e.aiRole==='sniper'){
        score -= Math.max(0,dCenter-4)*10; // want to be 2-4 hexes from center
        score += Math.max(0,4-dCenter)*8;
      }
    }
  } else if(mission==='survive'){
    // Survive: defensive — stay near own spawn, create kill zone
    var spawnCenter=aiGetEnemySpawnCenter();
    var dSpawn=hexDist(pos.c,pos.r,spawnCenter.c,spawnCenter.r);
    score -= dSpawn*6; // stay close to spawn = defensive perimeter
    score += dist*4;   // keep distance from enemy
  }
  // eliminate_all / eliminate_75: default aggressive (handled by role)

  // ── Role-based distance preference ──────────────────────────────────
  if(e.key==='medics'){
    // Medics: stay behind frontline, follow wounded allies
    // Find most wounded ally and stay close to them, not the enemy
    var wounded=G.units.filter(function(u){return u.team==='enemy'&&u.hp>0&&u.hp<u.maxHp;});
    if(wounded.length){
      wounded.sort(function(a,b){return (a.hp/a.maxHp)-(b.hp/b.maxHp);});
      var distToWounded=hexDist(pos.c,pos.r,wounded[0].c,wounded[0].r);
      score -= distToWounded*15; // get close to most wounded ally
    }
    // Stay far from enemy threats
    var allyDist=hexDist(pos.c,pos.r,target.c,target.r);
    score += allyDist*8; // more distance from enemies = better
  }
  else if(e.aiRole==='sniper')    score -= dist*6;
  else if(e.aiRole==='armor')     score -= dist*14;
  else if(e.aiRole==='at_hunter') score -= dist*10;
  else if(e.aiRole==='flank') {
    var allyCenter=aiGetAllyCenter();
    var flankBonus=Math.abs(pos.r - allyCenter.r);
    score += flankBonus*5 - dist*7;
  }
  else score -= dist*11; // assault: close in

  // ── Cover bonus ──────────────────────────────────────────────────────
  var tile=sc.map[pos.r]&&sc.map[pos.r][pos.c];
  if(tile&&tile.obs){
    if(isTall(tile.obs.type))  score+=30;
    if(isMed(tile.obs.type))   score+=18;
    if(isLight(tile.obs.type)) score+=10;
  }

  // ── Overexposure penalty ─────────────────────────────────────────────
  var adjAllies=hexNeighbors(pos.c,pos.r,sc).filter(function(n){
    return G.units.find(function(u){return u.team==='ally'&&u.hp>0&&u.c===n.c&&u.r===n.r;});
  }).length;
  if(e.key!=='medics'&&e.aiRole!=='armor') score-=adjAllies*20;

  // ── Low HP: retreat toward own medics ────────────────────────────────
  if(e.hp/e.maxHp<0.35&&e.key!=='medics'){
    var ownMedic=G.units.find(function(u){return u.team==='enemy'&&u.hp>0&&u.key==='medics';});
    if(ownMedic){
      var distToMedic=hexDist(pos.c,pos.r,ownMedic.c,ownMedic.r);
      score -= distToMedic*12; // retreat toward own medic
      score += dist*6; // move away from enemy
    } else {
      score += dist*5; // no medic: just retreat
    }
  }

  // ── Friendly medic nearby bonus (want to stay in aura range) ─────────
  var nearMedic=G.units.find(function(u){
    return u.team==='enemy'&&u.hp>0&&u.key==='medics'
      &&hexDist(pos.c,pos.r,u.c,u.r)<=1;
  });
  if(nearMedic&&e.hp/e.maxHp<0.7) score+=40;

  return score;
}

function aiGetAllyCenter() {
  var allies=G.units.filter(function(u){return u.team==='ally'&&u.hp>0;});
  if(!allies.length) return {c:G.scenario.cols/2,r:G.scenario.rows/2};
  var sc=allies.reduce(function(s,u){return {c:s.c+u.c,r:s.r+u.r};},{c:0,r:0});
  return {c:Math.round(sc.c/allies.length),r:Math.round(sc.r/allies.length)};
}

function aiGetEnemySpawnCenter() {
  var sp=G.scenario.spawnEnemy;
  if(!sp||!sp.length) return {c:G.scenario.cols-5,r:G.scenario.rows/2};
  var sc=sp.reduce(function(s,p){return {c:s.c+p.c,r:s.r+p.r};},{c:0,r:0});
  return {c:Math.round(sc.c/sp.length),r:Math.round(sc.r/sp.length)};
}

// AI deploys squad from APC/transport_heli
function aiTryDeploy(e) {
  if(e.deploysLeft<=0||e.deployTimer>0) return false;
  // Deploy near an ally target if possible
  var free=hexNeighbors(e.c,e.r,G.scenario).filter(function(n){
    var t=G.scenario.map[n.r][n.c];
    return t.type==='floor'&&!t.obs&&!G.units.find(function(u){return u.hp>0&&u.c===n.c&&u.r===n.r;});
  });
  if(!free.length) return false;
  var sp=free[0];
  var squad=createUnit('riflemen','enemy',sp.c,sp.r);
  squad.grade='average';
  squad.aiRole='assault';
  G.units.push(squad);
  e.deploysLeft--; e.deployTimer=3;
  addLog('🔴 '+e.name+' desplegó refuerzos enemigos!','hit');
  return true;
}

function aiActUnit(e) {
  if(e.hp<=0||e.acted) return;

  // APC/heli: try to deploy before anything else
  if((e.key==='apc'||e.key==='transport_heli')&&aiTryDeploy(e)){
    e.acted=true; e.ap=Math.max(0,e.ap-1);
  }

  // Find best attack target
  var target=aiBestTarget(e);

  // Jeep: try suppression first if target is infantry and in range
  if(e.key==='jeep'&&target&&!e.acted){
    var jeepSupp=e.weaponGroups.find(function(wg){
      return WEAPONS[wg.weapon].abilities.indexOf('suppression')>=0;
    });
    if(jeepSupp&&!target.suppressed&&hexDist(e.c,e.r,target.c,target.r)<=WEAPONS[jeepSupp.weapon].range){
      var suppRoll=Math.random()<(4/6); // ~67% chance to apply suppression from 3 dice
      if(suppRoll){
        target.suppressed=true;
        target.suppressMarkers=Math.min(3,(target.suppressMarkers||0)+1);
        addLog('⚡ Jeep suprime a '+target.name+' con AM .50 cal','supp');
        e.acted=true; e.ap=Math.max(0,e.ap-1);
      }
    }
  }

  // Attack if possible
  if(target&&!e.acted){
    var idxs=e.weaponGroups.map(function(_,i){return i;});
    var results=idxs.map(function(gi){return resolveWeapon(e,target,e.weaponGroups[gi]);}).filter(Boolean);
    var totalNet=results.reduce(function(s,r){return s+(r.net||0);},0);
    applyWounds(target,totalNet);
    if(totalNet>0) addLog('🔴 '+e.name+'→'+target.name+': '+totalNet+' daño ('+target.hp+'/'+target.maxHp+' HP)','hit');
    else addLog('○ '+e.name+'→'+target.name+': sin efecto','miss');
    if(target.hp<=0) addLog('💀 '+target.name+' ELIMINADO!','hit');
    e.acted=true; e.ap=Math.max(0,e.ap-1);
  }

  // Move if not yet moved
  if(!e.moved){
    // Find overall best target to move toward (even if can't attack yet)
    var moveTarget=target;
    if(!moveTarget){
      var allies=G.units.filter(function(u){return u.team==='ally'&&u.hp>0;});
      if(allies.length){
        allies.sort(function(a,b){return aiTargetScore(e,b)-aiTargetScore(e,a);});
        moveTarget=allies[0];
      }
    }
    if(moveTarget){
      var best=aiBestMove(e,moveTarget);
      if(best){
        e.c=best.c; e.r=best.r; e.moved=true; e.ap=Math.max(0,e.ap-1);

        // Attack again after move if possible and haven't acted
        if(!e.acted){
          var t2=aiBestTarget(e);
          if(t2){
            var idxs2=e.weaponGroups.map(function(_,i){return i;});
            var res2=idxs2.map(function(gi){return resolveWeapon(e,t2,e.weaponGroups[gi]);}).filter(Boolean);
            var net2=res2.reduce(function(s,r){return s+(r.net||0);},0);
            applyWounds(t2,net2);
            if(net2>0) addLog('🔴 '+e.name+'→'+t2.name+': '+net2+' daño','hit');
            else addLog('○ '+e.name+'→'+t2.name+': miss','miss');
            if(t2.hp<=0) addLog('💀 '+t2.name+' ELIMINADO!','hit');
            e.acted=true; e.ap=Math.max(0,e.ap-1);
          }
        }
      }
    }
  }
}

function runAI() {
  // Tick enemy deploy timers
  G.units.filter(function(u){return u.team==='enemy'&&u.hp>0&&u.deployTimer>0;}).forEach(function(u){
    u.deployTimer=Math.max(0,u.deployTimer-1);
  });
  var enemies=G.units.filter(function(u){return u.team==='enemy'&&u.hp>0;});
  // Sort by role priority: armor first, then assault, then flank/sniper
  var rolePriority={armor:0,at_hunter:1,assault:2,air:3,flank:4,sniper:5,medic:6};
  enemies.sort(function(a,b){
    return (rolePriority[a.aiRole]||9)-(rolePriority[b.aiRole]||9);
  });
  var delay=0;
  enemies.forEach(function(e){
    setTimeout(function(){
      if(e.hp>0) aiActUnit(e);
      updateFog(); renderGame(); updateGameUI();
      checkVictory();
    }, delay);
    delay+=220;
  });
  setTimeout(function(){
    startAllyTurn();
  }, delay+200);
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 15: TURN SYSTEM
   ═══════════════════════════════════════════════════════════════ */
function endTurn() {
  if(G.turn!=='ally') return;
  SFX.turn_end();
  G.turn='enemy';
  G.selected=null; G.moveTiles=[]; G.attackTiles=[]; G.mode='select';
  addLog('--- Fin turno ALIADOS ---','sys');
  updateGameUI(); renderGame();
  setTimeout(runAI, 500);
}


// ── APC / Transport Heli: deploy infantry squad ───────────────────────
function canDeploySquad(carrier) {
  return (carrier.key==='apc'||carrier.key==='transport_heli')
    && carrier.deploysLeft>0
    && carrier.deployTimer===0
    && carrier.hp>0
    && carrier.team==='ally';
}

function performDeploy(carrier) {
  if(!canDeploySquad(carrier)){setHint('No puede desplegar ahora');return;}
  // Find adjacent free hex
  var free=hexNeighbors(carrier.c,carrier.r,G.scenario).filter(function(n){
    var t=G.scenario.map[n.r][n.c];
    return t.type==='floor'&&!t.obs&&!G.units.find(function(u){return u.hp>0&&u.c===n.c&&u.r===n.r;});
  });
  if(!free.length){setHint('Sin espacio adyacente para desplegar');return;}
  var sp=free[Math.floor(Math.random()*free.length)];
  var squad=createUnit('riflemen','ally',sp.c,sp.r);
  G.units.push(squad);
  carrier.deploysLeft--;
  carrier.deployTimer=3; // cooldown 3 turns
  carrier.acted=true; carrier.ap=Math.max(0,carrier.ap-1);
  SFX.deploy(); addLog('⬇ '+carrier.name+' desplegó Fusileros en ('+sp.c+','+sp.r+') — quedan '+carrier.deploysLeft+' despliegues','heal');
  updateFog(); updateGameUI(); renderGame();
}

// Tick deploy timers at start of each ally turn
function tickDeployTimers() {
  G.units.filter(function(u){return u.hp>0&&u.deployTimer>0;}).forEach(function(u){
    u.deployTimer=Math.max(0,u.deployTimer-1);
    if(u.deployTimer===0&&u.deploysLeft>0)
      addLog('🔔 '+u.name+' listo para desplegar refuerzos','heal');
  });
}


// ── Capture zone evaluation — called once per complete round ───────────
// Only runs when objective is 'capture'. Checks who held the zone
// at the end of the just-completed round (ally + enemy turns done).
function evaluateCaptureZone() {
  if(G.currentObjective!=='capture') return;
  var h=G.objData.captureHex;
  if(!h) return;
  var radius=2;

  var allyInZone=G.units.filter(function(u){
    return u.team==='ally'&&u.hp>0&&hexDist(u.c,u.r,h.c,h.r)<=radius;
  }).length>0;

  var enemyInZone=G.units.filter(function(u){
    return u.team==='enemy'&&u.hp>0&&hexDist(u.c,u.r,h.c,h.r)<=radius;
  }).length>0;

  // Only count a round if at least one side is in the zone
  if(!allyInZone&&!enemyInZone) return;

  if(allyInZone&&!enemyInZone){
    G.objData.captureTurns=(G.objData.captureTurns||0)+1;
    G.objData.enemyCaptureTurns=0;
    addLog('🏴 Zona controlada por ALIADOS: '+G.objData.captureTurns+'/5 rondas','heal');
  } else if(enemyInZone&&!allyInZone){
    G.objData.enemyCaptureTurns=(G.objData.enemyCaptureTurns||0)+1;
    G.objData.captureTurns=0;
    addLog('⚠ Zona controlada por ENEMIGOS: '+G.objData.enemyCaptureTurns+'/5 rondas','sys');
  } else {
    // Contested — reset both, no progress
    if(G.objData.captureTurns>0||G.objData.enemyCaptureTurns>0)
      addLog('⚡ Zona EN DISPUTA — progreso reiniciado','sys');
    G.objData.captureTurns=0;
    G.objData.enemyCaptureTurns=0;
  }
}

function startAllyTurn() {
  G.round++;
  G.turn='ally';
  // Reset unit states
  G.units.forEach(function(u){
    if(u.hp<=0) return;
    u.moved=false; u.acted=false; u.ap=u.maxAp; u.cannonFired=false;
    // Suppression recovery (grade-based)
    if(u.suppressed){
      var g=GRADES[u.grade]||GRADES.average;
      var roll=d6();
      if(roll>=g.suppRecovery){
        u.suppressed=false; u.suppressMarkers=0;
        addLog('✓ '+u.name+' recuperado de supresión ('+roll+'≥'+g.suppRecovery+')','heal');
      } else {
        u.suppressMarkers=Math.max(0,u.suppressMarkers-1);
        if(u.suppressMarkers<=0){u.suppressed=false;}
        else addLog('⚡ '+u.name+' sigue suprimido ('+roll+'<'+g.suppRecovery+')','supp');
      }
    }
  });
  tickDeployTimers();
  // ── Medic passive aura (ally medics) ────────────────────────────────
  // Prioritizes most wounded adjacent infantry; 25% chance to heal 2 HP
  G.units.filter(function(u){return u.hp>0&&u.key==='medics'&&u.team==='ally';}).forEach(function(medic){
    // Find all adjacent wounded infantry allies
    var candidates=[];
    hexNeighbors(medic.c,medic.r,G.scenario).forEach(function(n){
      var adj=G.units.find(function(u){
        return u.team==='ally'&&u.hp>0&&u.hp<u.maxHp
          &&u.tags.indexOf('infantry')>=0
          &&u.c===n.c&&u.r===n.r&&u.id!==medic.id;
      });
      if(adj) candidates.push(adj);
    });
    // Also heal self if wounded
    if(medic.hp<medic.maxHp) candidates.push(medic);
    if(!candidates.length) return;
    // Pick most wounded (lowest hp ratio)
    candidates.sort(function(a,b){ return (a.hp/a.maxHp)-(b.hp/b.maxHp); });
    var target=candidates[0];
    // 25% chance to heal 2, 75% chance to heal 1
    var roll=Math.random();
    var amount=(roll<0.25)?2:1;
    var before=target.hp;
    target.hp=Math.min(target.maxHp, target.hp+amount);
    // Update men alive if infantry
    if(target.tags.indexOf('infantry')>=0)
      target.menAlive=Math.min(target.menMax,Math.ceil(target.hp/target.hpPerMan));
    var healed=target.hp-before;
    if(healed>0){
      var msg='✚ AURA MÉDICO: '+medic.name
        +' cura '+healed+' HP a '+target.name
        +' ('+before+'→'+target.hp+'/'+target.maxHp+' HP)'
        +(amount===2?' ¡CURACIÓN DOBLE! (25%)':'');
      SFX.heal(); addLog(msg,'heal');
    }
  });

  // ── Enemy medic aura (mirror mechanic) ───────────────────────────────
  G.units.filter(function(u){return u.hp>0&&u.key==='medics'&&u.team==='enemy';}).forEach(function(medic){
    var candidates=[];
    hexNeighbors(medic.c,medic.r,G.scenario).forEach(function(n){
      var adj=G.units.find(function(u){
        return u.team==='enemy'&&u.hp>0&&u.hp<u.maxHp
          &&u.tags.indexOf('infantry')>=0
          &&u.c===n.c&&u.r===n.r&&u.id!==medic.id;
      });
      if(adj) candidates.push(adj);
    });
    if(medic.hp<medic.maxHp) candidates.push(medic);
    if(!candidates.length) return;
    candidates.sort(function(a,b){ return (a.hp/a.maxHp)-(b.hp/b.maxHp); });
    var target=candidates[0];
    var amount=Math.random()<0.25?2:1;
    var before=target.hp;
    target.hp=Math.min(target.maxHp,target.hp+amount);
    if(target.tags.indexOf('infantry')>=0)
      target.menAlive=Math.min(target.menMax,Math.ceil(target.hp/target.hpPerMan));
    var healed=target.hp-before;
    if(healed>0)
      addLog('🔴 Médico enemigo cura '+healed+' HP a '+target.name
        +(amount===2?' ¡DOBLE!':''),'sys');
  });
  // Check objective
  if(G.currentObjective==='capture') checkVictory();
  // Evaluate capture zone once per complete round (round just ended)
  evaluateCaptureZone();
  if(checkVictory()) return; // win/lose condition from capture
  addLog('=== RONDA '+G.round+' — TURNO ALIADOS ===','sys');
  updateFog(); updateGameUI(); renderGame();
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 16: UI
   ═══════════════════════════════════════════════════════════════ */
var selectedRosterKey=null;

function showScreen(id){
  document.querySelectorAll('.screen').forEach(function(s){s.classList.remove('active');});
  document.getElementById('screen-'+id).classList.add('active');
}

function showOv(id){document.getElementById(id).classList.add('show');}
function hideOv(id){document.getElementById(id).classList.remove('show');}

function addLog(msg, cls){
  var el=document.createElement('div');
  el.className='log-'+(cls||'sys');
  el.textContent=msg;
  var log=document.getElementById('g-log');
  log.appendChild(el);
  log.scrollTop=log.scrollHeight;
}

function setHint(msg){document.getElementById('g-hint').textContent=msg;}

function updateGameUI(){
  // Team bar
  var tbar=document.getElementById('g-team-name');
  tbar.textContent=G.turn==='ally'?'ALIADOS':'ENEMIGOS';
  tbar.className='g-team-name '+(G.turn==='enemy'?'enemy':'');
  document.getElementById('g-round-info').textContent='Ronda '+G.round+' · '+(G.turn==='ally'?'Tu turno':'Turno enemigo');

  // Unit info box
  var u=G.selected;
  if(u){
    document.getElementById('gub-name').textContent=u.name;
    document.getElementById('gub-tags').textContent=u.tags.join(' · ').toUpperCase();
    var gdef=GRADES[u.grade]||GRADES.average;
    var gel=document.getElementById('gub-grade');
    gel.textContent=gdef.label;
    gel.style.color=gdef.color;
    var hpFrac=u.hp/u.maxHp;
    document.getElementById('bar-hp-fill').style.width=(hpFrac*100)+'%';
    document.getElementById('bar-hp-fill').className='bar-fill'+(hpFrac<0.4?' low':'');
    document.getElementById('bar-hp-lbl').textContent='HP '+u.hp+'/'+u.maxHp;
    document.getElementById('bar-ap-fill').style.width=((u.ap/u.maxAp)*100)+'%';
    document.getElementById('bar-ap-lbl').textContent='AP '+u.ap+'/'+u.maxAp;
    var ws=u.weaponGroups.map(function(wg){
      var w=WEAPONS[wg.weapon];
      return '<b>'+wg.count+'× '+w.name+'</b> ATK:'+w.atk+' BS:'+w.bs+'+ RNG:'+w.range+' AP:'+w.ap;
    }).join('<br>');
    document.getElementById('gub-weps').innerHTML=ws;
  } else {
    document.getElementById('gub-name').textContent='Sin selección';
    document.getElementById('gub-tags').textContent='—';
    document.getElementById('gub-grade').textContent='';
    document.getElementById('bar-hp-fill').style.width='0%';
    document.getElementById('bar-ap-fill').style.width='0%';
    document.getElementById('bar-hp-lbl').textContent='HP';
    document.getElementById('bar-ap-lbl').textContent='AP';
    document.getElementById('gub-weps').innerHTML='';
  }

  // Action buttons
  var isAlly=G.turn==='ally';
  var sel=G.selected&&G.selected.team==='ally';
  document.getElementById('btn-move').disabled=!isAlly||!sel||G.selected.moved||G.selected.suppressed;
  document.getElementById('btn-attack').disabled=!isAlly||!sel||G.selected.acted;
  document.getElementById('btn-suppress').disabled=!isAlly||!sel||G.selected.acted;
  document.getElementById('btn-overwatch').disabled=!isAlly||!sel||G.selected.overwatch||G.selected.acted;
  var canDeploy=sel&&canDeploySquad(G.selected);
  document.getElementById('btn-deploy').disabled=!isAlly||!canDeploy;
  document.getElementById('btn-assault').disabled=!isAlly||!sel||G.selected.acted||
    !hexNeighbors(G.selected?G.selected.c:0,G.selected?G.selected.r:0,G.scenario).some(function(n){
      return G.units.find(function(u){return u.team==='enemy'&&u.hp>0&&u.c===n.c&&u.r===n.r;});
    });

  // Button active states
  ['move','attack','suppress','overwatch'].forEach(function(m){
    document.getElementById('btn-'+m).classList.toggle('act',G.mode===m);
  });

  // Right panel: casualties
  var allyDead=G.units.filter(function(u){return u.team==='ally'&&u.hp<=0;}).length;
  var enemyDead=G.units.filter(function(u){return u.team==='enemy'&&u.hp<=0;}).length;
  document.getElementById('cas-ally').textContent=allyDead;
  document.getElementById('cas-enemy').textContent=enemyDead;

  // Units list
  var ul=document.getElementById('g-units');
  ul.innerHTML='';
  var label=document.createElement('div');
  label.style.cssText='font-size:8px;color:var(--text3);letter-spacing:2px;margin-bottom:4px';
  label.textContent='ALIADOS';
  ul.appendChild(label);
  G.units.filter(function(u){return u.team==='ally'&&u.hp>0;}).forEach(function(u){
    var li=document.createElement('div');
    li.className='uli'+(G.selected&&G.selected.id===u.id?' uli-sel':'');
    var frac=u.hp/u.maxHp;
    li.innerHTML='<div class="uli-d dot-ally"></div><span style="flex:0 0 40px">'+u.abbr+'</span>'
      +'<div class="uli-bar"><div class="uli-bf'+(frac<0.4?' low':'')+'" style="width:'+(frac*100)+'%"></div></div>';
    li.addEventListener('click',function(){selectUnit(u);updateGameUI();renderGame();});
    ul.appendChild(li);
  });
  var lbl2=document.createElement('div');
  lbl2.style.cssText='font-size:8px;color:var(--text3);letter-spacing:2px;margin:6px 0 4px';
  lbl2.textContent='ENEMIGOS VISIBLES';
  ul.appendChild(lbl2);
  G.units.filter(function(u){return u.team==='enemy'&&u.hp>0&&G.visibleEnemyIds.has(u.id);}).forEach(function(u){
    var li=document.createElement('div');
    li.className='uli';
    var frac=u.hp/u.maxHp;
    li.innerHTML='<div class="uli-d dot-enemy"></div><span style="flex:0 0 40px">'+u.abbr+'</span>'
      +'<div class="uli-bar"><div class="uli-bf low" style="width:'+(frac*100)+'%"></div></div>';
    ul.appendChild(li);
  });

  // Objective
  var obj=OBJECTIVES[G.currentObjective];
  document.getElementById('obj-txt').textContent=obj?obj.label:'';
}

function selectUnit(u){
  SFX.select();
  G.selected=u; G.mode='selected';
  G.moveTiles=!u.moved?getMoves(u):[];
  G.attackTiles=!u.acted?getAttackTiles(u):[];
  setHint(u.name+' — usa los botones de acción');
}

function setMode(m){
  if(!G.selected||G.turn!=='ally') return;
  if(G.selected.suppressed&&(m==='move'||m==='attack')){
    setHint('⚡ Unidad suprimida — no puede mover ni atacar'); return;
  }
  if(m==='move'&&G.selected.moved){setHint('Ya se movió esta ronda');return;}
  if(m==='attack'&&G.selected.acted){setHint('Ya actuó esta ronda');return;}
  G.mode=m;
  if(m==='move'){G.moveTiles=getMoves(G.selected);G.attackTiles=[];}
  else if(m==='attack'){G.attackTiles=getAttackTiles(G.selected);G.moveTiles=[];}
  else if(m==='suppress'){G.attackTiles=getAttackTiles(G.selected);G.moveTiles=[];}
  else if(m==='assault'){
    var adjE=hexNeighbors(G.selected.c,G.selected.r,G.scenario).filter(function(n){
      return G.units.find(function(u){return u.team==='enemy'&&u.hp>0&&u.c===n.c&&u.r===n.r;});
    });
    if(!adjE.length){setHint('No hay enemigos adyacentes para asaltar');return;}
    var tgt=G.units.find(function(u){return u.team==='enemy'&&u.hp>0&&u.c===adjE[0].c&&u.r===adjE[0].r;});
    if(tgt) performCloseAssault(G.selected,tgt);
    return;
  } else if(m==='overwatch'){
    G.selected.overwatch=true; G.selected.acted=true; G.selected.ap=Math.max(0,G.selected.ap-1);
    setHint(G.selected.name+' en modo GUARDIA');
    updateGameUI(); renderGame(); return;
  } else if(m==='deploy'){
    performDeploy(G.selected); return;
  }
  updateGameUI(); renderGame();
}

/* Deploy UI */
function renderRoster(){
  var cat=document.getElementById('deploy-catalog');
  cat.innerHTML='';
  Object.keys(UNIT_DEFS).forEach(function(key){
    var def=UNIT_DEFS[key];
    var disabled=G.pointsLeft<def.cost;
    var card=document.createElement('div');
    card.className='unit-card'+(selectedRosterKey===key?' sel':'')+(disabled?' disabled':'');
    var gdef=GRADES[def.grade]||GRADES.average;
    card.innerHTML='<div class="uc-hdr"><span class="uc-name">'+def.icon+' '+def.name+'</span>'
      +'<span class="uc-cost">'+def.cost+' pts</span></div>'
      +'<div class="uc-desc">'+def.desc+'</div>'
      +'<div class="uc-tags">MOV:'+def.move+' HP:'+def.maxMen+'×'+def.hpPerMan+' AP:'+def.ap+'</div>'
      +'<div class="uc-tags grade-'+(def.grade==='good'?'good':def.grade==='poor'?'poor':'avg')+'">'+gdef.label+'</div>';
    if(!disabled) card.addEventListener('click',function(){ SFX.click();
      selectedRosterKey=key; renderRoster();
      document.getElementById('deploy-hint').textContent='① Seleccionado: '+def.name+' — toca zona VERDE';
    });
    cat.appendChild(card);
  });
}

function updateDeployUI(){
  document.getElementById('deploy-pts').textContent=G.pointsLeft;
  // Roster list
  var rl=document.getElementById('deploy-roster');
  rl.innerHTML='';
  G.deployedUnits.forEach(function(u){
    var row=document.createElement('div'); row.className='roster-row';
    row.innerHTML='<span>'+u.icon+' '+u.name+'</span><span style="color:var(--amber2)">'+UNIT_DEFS[u.key].cost+'pts</span>'
      +'<span class="roster-del" data-id="'+u.id+'">✕</span>';
    row.querySelector('.roster-del').addEventListener('click',function(){
      var id=parseInt(this.dataset.id);
      var u2=G.deployedUnits.find(function(u){return u.id===id;});
      if(u2) G.pointsLeft+=UNIT_DEFS[u2.key].cost;
      G.deployedUnits=G.deployedUnits.filter(function(u){return u.id!==id;});
      renderDeployCanvas(); updateDeployUI(); renderRoster();
    });
    rl.appendChild(row);
  });
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 17: SCREEN FLOWS
   ═══════════════════════════════════════════════════════════════ */
function initSceneSelect(){
  playMusicTrack('menu');
  var grid=document.getElementById('scene-grid');
  grid.innerHTML='';
  Object.keys(ROOM_DEFS).forEach(function(key){
    var rd=ROOM_DEFS[key];
    var obj=OBJECTIVES[rd.objective];
    var card=document.createElement('div'); card.className='scene-card';
    card.innerHTML='<div class="scene-icon">'+rd.icon+'</div>'
      +'<div class="scene-name">'+rd.name+'</div>'
      +'<div class="scene-desc">'+rd.desc+'</div>'
      +'<div class="scene-obj">🎯 '+(obj?obj.label:'')+'</div>';
    card.addEventListener('click',function(){ SFX.click(); startDeploy(key); });
    grid.appendChild(card);
  });
  showScreen('scene');
}

function startDeploy(roomKey){
  playMusicTrack('deploy');
  G.scenario=buildMap(roomKey);
  G.deployedUnits=[]; G.pointsLeft=STARTING_POINTS;
  selectedRosterKey=null;
  G.currentObjective=ROOM_DEFS[roomKey].objective;
  G.objData={};
  showScreen('deploy');
  if(!SPRITES_READY) loadSprites(function(){renderDeployCanvas();});
  else renderDeployCanvas();
  renderRoster(); updateDeployUI();
  document.getElementById('deploy-header-scene').textContent=G.scenario.name;
}

function startBattle(){
  if(G.deployedUnits.length===0){alert('Despliega al menos una unidad!');return;}
  showScreen('game');
  playMusicTrack('battle');
  var budget=Math.min(STARTING_POINTS,150+G.deployedUnits.reduce(function(s,u){return s+UNIT_DEFS[u.key].cost;},0)*0.8);
  G.units=G.deployedUnits.concat(generateEnemyForce(budget));
  G.turn='ally'; G.round=1; G.selected=null; G.mode='select';
  G.moveTiles=[]; G.attackTiles=[]; G.victoryShown=false;
  G.visibleCells=new Set(); G.visibleEnemyIds=new Set();
  // Init objective data
  if(G.currentObjective==='eliminate_75')
    G.objData.enemyStart=G.units.filter(function(u){return u.team==='enemy';}).length;
  if(G.currentObjective==='capture')
    G.objData.captureHex={c:Math.floor(G.scenario.cols/2),r:Math.floor(G.scenario.rows/2)};
  document.getElementById('g-scene-name').textContent=G.scenario.name;
  document.getElementById('obj-txt').textContent=(OBJECTIVES[G.currentObjective]||{label:''}).label;
  updateFog();
  renderGame();
  fitMapToView();
  renderGame(); // re-render after zoom
  addLog('¡BATALLA INICIADA! Ronda 1 — Turno ALIADOS','sys');
  updateGameUI();
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 18: EVENT HANDLERS
   ═══════════════════════════════════════════════════════════════ */

// ── Game canvas click (mouse) ─────────────────────────────────
document.getElementById('game-canvas').addEventListener('click', function(e){
  if(G.turn!=='ally') return;
  if(mouseMoved) return; // was a drag, not a click
  var h=screenToHex(e.clientX,e.clientY);
  handleMapTap(h.c,h.r);
});

// ── Mouse pan (drag) ──────────────────────────────────────────
var isPanning=false,panSX=0,panSY=0,panStartX=0,panStartY=0,mouseMoved=false;
document.getElementById('game-map-wrap').addEventListener('mousedown',function(e){
  if(e.button!==0) return;
  isPanning=true; mouseMoved=false;
  panSX=e.clientX; panSY=e.clientY;
  panStartX=mapPanX; panStartY=mapPanY;
  e.preventDefault();
});
document.addEventListener('mousemove',function(e){
  if(!isPanning) return;
  var dx=e.clientX-panSX, dy=e.clientY-panSY;
  if(Math.abs(dx)>4||Math.abs(dy)>4) mouseMoved=true;
  mapPanX=panStartX+dx; mapPanY=panStartY+dy;
  applyMapTransform();
});
document.addEventListener('mouseup',function(e){
  if(!isPanning) return;
  isPanning=false;
  // If barely moved = click, let canvas click handler fire naturally
});

// Scroll wheel zoom
document.getElementById('game-map-wrap').addEventListener('wheel',function(e){
  e.preventDefault();
  var wrap=document.getElementById('game-map-wrap');
  var rect=wrap.getBoundingClientRect();
  // Zoom toward cursor position
  var mx=e.clientX-rect.left, my=e.clientY-rect.top;
  var factor=e.deltaY<0?1.12:1/1.12;
  var newZoom=Math.min(Math.max(mapZoom*factor,0.15),4);
  // Adjust pan to keep cursor point fixed
  mapPanX=mx-(mx-mapPanX)*(newZoom/mapZoom);
  mapPanY=my-(my-mapPanY)*(newZoom/mapZoom);
  mapZoom=newZoom;
  applyMapTransform();
  document.getElementById('zoom-label').textContent=Math.round(mapZoom*100)+'%';
},{passive:false});

// ── Touch: pan + tap ──────────────────────────────────────────
var lastTX=0,lastTY=0,lastTDist=0,touchMoved=false;
document.getElementById('game-map-wrap').addEventListener('touchstart',function(e){
  if(e.touches.length===1){lastTX=e.touches[0].clientX;lastTY=e.touches[0].clientY;touchMoved=false;}
  if(e.touches.length===2){lastTDist=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);}
  e.preventDefault();
},{passive:false});

document.getElementById('game-map-wrap').addEventListener('touchmove',function(e){
  if(e.touches.length===1){
    var dx=e.touches[0].clientX-lastTX, dy=e.touches[0].clientY-lastTY;
    if(Math.abs(dx)>6||Math.abs(dy)>6) touchMoved=true;
    mapPanX+=dx; mapPanY+=dy; lastTX=e.touches[0].clientX; lastTY=e.touches[0].clientY;
    applyMapTransform();
  }
  if(e.touches.length===2){
    var d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);
    mapZoom=Math.min(Math.max(mapZoom*(d/lastTDist),0.25),3);
    lastTDist=d; applyMapTransform();
  }
  e.preventDefault();
},{passive:false});

document.getElementById('game-map-wrap').addEventListener('touchend',function(e){
  if(touchMoved||G.turn!=='ally') return;
  if(e.changedTouches.length!==1) return;
  e.preventDefault();
  var t=e.changedTouches[0];
  var h=screenToHex(t.clientX,t.clientY);
  handleMapTap(h.c,h.r);
},{passive:false});

// ── Deploy canvas click ───────────────────────────────────────
function deployTap(clientX,clientY){
  if(!selectedRosterKey) return;
  var cv=document.getElementById('deploy-canvas');
  var rect=cv.getBoundingClientRect();
  var gw=hexGridWidth(G.scenario.cols), gh=hexGridHeight(G.scenario.rows);
  var lx=(clientX-rect.left)*(gw/rect.width);
  var ly=(clientY-rect.top)*(gh/rect.height);
  var h=pixelToHex(lx,ly);
  var sc=G.scenario;
  if(h.c<0||h.r<0||h.c>=sc.cols||h.r>=sc.rows) return;
  if(!sc.spawnAlly.find(function(s){return s.c===h.c&&s.r===h.r;})) return;
  if(G.deployedUnits.find(function(u){return u.c===h.c&&u.r===h.r;})) return;
  var def=UNIT_DEFS[selectedRosterKey];
  if(G.pointsLeft<def.cost) return;
  G.deployedUnits.push(createUnit(selectedRosterKey,'ally',h.c,h.r));
  G.pointsLeft-=def.cost;
  renderDeployCanvas(); updateDeployUI(); renderRoster();
}
document.getElementById('deploy-canvas').addEventListener('click',function(e){deployTap(e.clientX,e.clientY);});
document.getElementById('deploy-canvas').addEventListener('touchend',function(e){
  e.preventDefault();
  if(e.changedTouches.length===1) deployTap(e.changedTouches[0].clientX,e.changedTouches[0].clientY);
},{passive:false});

// ── Main map tap logic ────────────────────────────────────────
function handleMapTap(mc,mr){
  var sc=G.scenario;
  if(!sc||mc<0||mr<0||mc>=sc.cols||mr>=sc.rows) return;
  var clickedUnit=G.units.find(function(u){return u.c===mc&&u.r===mr&&u.hp>0;});

  // Always: click ally to select
  if(clickedUnit&&clickedUnit.team==='ally'){
    if(!G.selected||clickedUnit.id!==G.selected.id){
      selectUnit(clickedUnit); updateGameUI(); renderGame(); return;
    }
  }

  if(G.mode==='move'){
    var canGo=G.moveTiles.find(function(t){return t.c===mc&&t.r===mr;});
    if(canGo&&G.selected&&!G.selected.moved){
      G.selected.c=mc; G.selected.r=mr; G.selected.moved=true;
      G.selected.ap=Math.max(0,G.selected.ap-1);
      addLog('▶ '+G.selected.name+' → ('+mc+','+mr+')','move');
      SFX.move();
      updateFog(); G.moveTiles=[];
      if(!G.selected.acted) G.attackTiles=getAttackTiles(G.selected);
      G.mode='selected';

      // Overwatch interrupt: ally units with overwatch fire at newly revealed enemies
      G.units.filter(function(u){return u.team==='ally'&&u.overwatch&&u.hp>0;}).forEach(function(ow){
        G.units.filter(function(u){return u.team==='enemy'&&u.hp>0&&G.visibleEnemyIds.has(u.id);}).forEach(function(en){
          if(canAttack(ow,en)){
            var idxs=ow.weaponGroups.map(function(_,i){return i;});
            var results=idxs.map(function(gi){return resolveWeapon(ow,en,ow.weaponGroups[gi]);}).filter(Boolean);
            var net=results.reduce(function(s,r){return s+(r.net||0);},0);
            applyWounds(en,net);
            addLog('👁 '+ow.name+' GUARDIA: '+net+' daño a '+en.name,'hit');
            ow.overwatch=false;
          }
        });
      });
    } else if(!clickedUnit){
      G.mode='select'; G.selected=null; G.moveTiles=[]; G.attackTiles=[];
    }

  } else if(G.mode==='attack'){
    if(clickedUnit&&clickedUnit.team==='enemy'&&G.visibleEnemyIds.has(clickedUnit.id)){
      if(G.selected&&!G.selected.acted&&canAttack(G.selected,clickedUnit)){
        performAttack(G.selected,clickedUnit); return;
      }
    } else if(G.selected&&G.selected.key==='medics'&&clickedUnit&&clickedUnit.team==='ally'){
      performHeal(G.selected,clickedUnit); return;
    } else if(!clickedUnit){
      G.mode='select'; G.selected=null; G.moveTiles=[]; G.attackTiles=[];
    }

  } else if(G.mode==='suppress'){
    if(clickedUnit&&clickedUnit.team==='enemy'&&G.visibleEnemyIds.has(clickedUnit.id)){
      if(G.selected&&!G.selected.acted) performSuppression(G.selected,clickedUnit);
    }

  } else {
    if(!clickedUnit){G.mode='select';G.selected=null;G.moveTiles=[];G.attackTiles=[];}
  }

  updateGameUI(); renderGame();
}

function performAttack(att, tgt){
  if(att.acted) return;
  openWeaponSelect(att,tgt);
}

function performHeal(medic, target){
  if(medic.acted) return;
  var dist=hexDist(medic.c,medic.r,target.c,target.r);
  if(dist>medic.healRange){setHint('Fuera de rango de curación');return;}
  var rolls=rollDice(medic.healDice), healed=rolls.filter(function(d){return d>=4;}).length;
  target.hp=Math.min(target.maxHp,target.hp+healed);
  medic.acted=true; medic.ap=Math.max(0,medic.ap-1);
  addLog('✚ '+medic.name+' cura '+healed+' HP a '+target.name,'heal');
  G.mode='selected'; updateGameUI(); renderGame();
}

// ── Action buttons ────────────────────────────────────────────
document.getElementById('btn-move').addEventListener('click',function(){if(G.selected)setMode('move');});
document.getElementById('btn-attack').addEventListener('click',function(){if(G.selected)setMode('attack');});
document.getElementById('btn-suppress').addEventListener('click',function(){if(G.selected)setMode('suppress');});
document.getElementById('btn-overwatch').addEventListener('click',function(){if(G.selected)setMode('overwatch');});
document.getElementById('btn-deploy').addEventListener('click',function(){if(G.selected)setMode('deploy');});
document.getElementById('btn-assault').addEventListener('click',function(){if(G.selected)setMode('assault');});
document.getElementById('btn-end').addEventListener('click',endTurn);

// ── Weapon overlay ────────────────────────────────────────────
document.getElementById('btn-wo-confirm').addEventListener('click',confirmWeaponSelect);
document.getElementById('btn-wo-cancel').addEventListener('click',function(){hideOv('wo-ov');G_target=null;});

// ── Dice overlay ──────────────────────────────────────────────
document.getElementById('btn-dice-ok').addEventListener('click',function(){
  hideOv('dice-ov');
  if(diceCallback){var cb=diceCallback;diceCallback=null;cb();}
});

// ── Victory overlay ───────────────────────────────────────────
document.getElementById('btn-vic-menu').addEventListener('click',function(){
  hideOv('vic-ov'); initSceneSelect();
});

// ── Zoom controls ─────────────────────────────────────────────
document.getElementById('btn-zoom-in').addEventListener('click',function(){mapZoom=Math.min(mapZoom*1.2,3);applyMapTransform();});
document.getElementById('btn-zoom-out').addEventListener('click',function(){mapZoom=Math.max(mapZoom/1.2,0.2);applyMapTransform();});
document.getElementById('btn-zoom-fit').addEventListener('click',function(){fitMapToView();renderGame();});

// ── Deploy buttons ────────────────────────────────────────────
document.getElementById('btn-start-battle').addEventListener('click',startBattle);
document.getElementById('btn-back-scene').addEventListener('click',initSceneSelect);
document.getElementById('btn-clear-deploy').addEventListener('click',function(){
  G.deployedUnits=[]; G.pointsLeft=STARTING_POINTS;
  renderDeployCanvas(); updateDeployUI(); renderRoster();
});

// ── Scene select button ───────────────────────────────────────
document.getElementById('btn-start-mission').addEventListener('click',initSceneSelect);
document.getElementById('btn-audio-toggle').addEventListener('click',toggleAudio);

// ── Resize ───────────────────────────────────────────────────
window.addEventListener('resize',function(){
  if(document.getElementById('screen-game').classList.contains('active')){
    renderGame(); fitMapToView(); renderGame();
  }
  if(document.getElementById('screen-deploy').classList.contains('active')){
    renderDeployCanvas();
  }
});

// ── Start ─────────────────────────────────────────────────────
loadSprites(function(){});
initSceneSelect();
