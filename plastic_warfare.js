/* PLASTIC WARFARE v5.0 — Game Logic */

var TILE = 80;
var STARTING_POINTS = 1200;

// =====================================================================
// WEAPON DEFINITIONS
// =====================================================================
var WEAPONS = {
  // Infantry
  assault_rifle:    {name:'Rifle de Asalto',   atk:1, bs:4, range:5, ap:1, dmg:1, abilities:['rapid_fire']},
  smg:              {name:'Subfusil',           atk:2, bs:4, range:2, ap:0, dmg:1, abilities:['pistol']},
  sniper_rifle:     {name:'Rifle de Precisión', atk:1, bs:3, range:9, ap:2, dmg:2, abilities:['precision','heavy']},
  spotter_pistol:   {name:'Pistola Observador', atk:1, bs:5, range:2, ap:0, dmg:1, abilities:[]},
  at_launcher:      {name:'Lanzacohetes AT',    atk:1, bs:4, range:4, ap:4, dmg:3, abilities:['anti_vehicle','hazardous']},
  medic_rifle:      {name:'Rifle de Escolta',   atk:1, bs:4, range:5, ap:1, dmg:1, abilities:[]},
  // Vehicles
  tank_cannon:      {name:'Cañón Principal',    atk:2, bs:3, range:6, ap:5, dmg:3, abilities:['blast'], charges:null},
  tank_mg:          {name:'Ametralladora Coax', atk:3, bs:4, range:4, ap:1, dmg:1, abilities:['rapid_fire']},
  heavy_mg:         {name:'AM Alto Calibre',    atk:3, bs:4, range:5, ap:2, dmg:1, abilities:['suppression']},
  autocannon:       {name:'Cañón Automático',   atk:3, bs:4, range:5, ap:3, dmg:2, abilities:['sustained_hits']},
  heli_mg:          {name:'AM Helicóptero',     atk:4, bs:4, range:4, ap:1, dmg:1, abilities:[]},
  missile_launcher: {name:'Lanzamisiles',       atk:1, bs:3, range:7, ap:4, dmg:3, abilities:['blast','anti_vehicle'], totalCharges:2, chargesLeft:2}
};

// =====================================================================
// UNIT DEFINITIONS
// =====================================================================
var UNIT_DEFS = {
  riflemen:{
    name:'Fusileros', abbr:'FUSI', cost:120,
    maxMen:6, defaultMen:6, icon:'●',
    color:'#4a7c3f', ecolor:'#7c2020',
    hp:2, ap:3, move:4,
    saves:{none:5, light:4, heavy:3},
    tags:['infantry'],
    weaponGroups:[
      {count:6, weapon:'assault_rifle', label:'6× Rifle Asalto'}
    ],
    desc:'6 fusileros. Rapid Fire a media distancia.'
  },
  medics:{
    name:'Escuadrón Médico', abbr:'MÉDI', cost:90,
    maxMen:4, defaultMen:4, icon:'✚',
    color:'#2a8a5a', ecolor:'#8a2a2a',
    hp:2, ap:3, move:4,
    saves:{none:5, light:4, heavy:3},
    tags:['infantry','healer'],
    weaponGroups:[
      {count:2, weapon:'medic_rifle',  label:'2× Rifle (Escolta)'},
      {count:2, weapon:'smg',          label:'2× Subfusil (Médico)'}
    ],
    healDice:2, healRange:2,
    desc:'2 escoltas + 2 médicos. Cura aliados.'
  },
  antitank:{
    name:'Eq. Antitanque', abbr:'AT', cost:150,
    maxMen:3, defaultMen:3, icon:'★',
    color:'#5a6a2a', ecolor:'#6a2a10',
    hp:2, ap:2, move:3,
    saves:{none:5, light:4, heavy:3},
    tags:['infantry','anti_vehicle'],
    weaponGroups:[
      {count:1, weapon:'at_launcher',  label:'1× Lanzacohetes AT'},
      {count:2, weapon:'assault_rifle',label:'2× Rifle (Escolta)'}
    ],
    desc:'1 artillero AT + 2 escoltas. Hazardous en lanzacohetes.'
  },
  sniper:{
    name:'Francotirador', abbr:'FRAN', cost:130,
    maxMen:2, defaultMen:2, icon:'▲',
    color:'#3a5a2a', ecolor:'#5a1a1a',
    hp:2, ap:2, move:3,
    saves:{none:5, light:4, heavy:3},
    tags:['infantry'],
    weaponGroups:[
      {count:1, weapon:'sniper_rifle',  label:'1× Rifle Precisión'},
      {count:1, weapon:'spotter_pistol',label:'1× Pistola Observador'}
    ],
    desc:'Tirador + Observador. Heavy: +1 dado si no se movió.'
  },
  tank:{
    name:'Tanque', abbr:'TANK', cost:300,
    maxMen:1, defaultMen:1, icon:'◈',
    color:'#6a7a3a', ecolor:'#7a3a1a',
    hp:10, ap:2, move:2,
    saves:{none:2, light:2, heavy:1},
    tags:['vehicle','heavy'], toughness:8, openTop:false,
    weaponGroups:[
      {count:1, weapon:'tank_cannon', label:'Cañón Principal (1 disparo/turno)', apCost:1},
      {count:1, weapon:'tank_mg',     label:'Ametralladora Coaxial', apCost:1}
    ],
    desc:'Blindado pesado. Cañón + AM coaxial.'
  },
  apc:{
    name:'APC', abbr:'APC', cost:200,
    maxMen:1, defaultMen:1, icon:'◉',
    color:'#5a6a4a', ecolor:'#6a4a2a',
    hp:6, ap:2, move:4,
    saves:{none:3, light:2, heavy:2},
    tags:['vehicle','heavy','transport'], toughness:6, openTop:false,
    weaponGroups:[
      {count:1, weapon:'autocannon', label:'Cañón Automático', apCost:1}
    ],
    specialAction:'deploy_squad',
    capacity:1,
    desc:'Transporte blindado. Cañón automático + despliegue de escuadrón.'
  },
  jeep:{
    name:'Jeep de Ataque', abbr:'JEEP', cost:160,
    maxMen:1, defaultMen:1, icon:'◇',
    color:'#7a7a3a', ecolor:'#7a5a1a',
    hp:4, ap:3, move:5,
    saves:{none:4, light:3, heavy:3},
    tags:['vehicle','light_vehicle'], toughness:3, openTop:true,
    weaponGroups:[
      {count:1, weapon:'heavy_mg', label:'AM Alto Calibre', apCost:1}
    ],
    desc:'Rápido. AM con fuego de supresión.'
  },
  attack_heli:{
    name:'Heli. Ataque', abbr:'HELI-A', cost:380,
    maxMen:1, defaultMen:1, icon:'✦',
    color:'#3a5a7a', ecolor:'#5a2a2a',
    hp:5, ap:2, move:6,
    saves:{none:3, light:3, heavy:3},
    tags:['vehicle','air','light_vehicle'], toughness:4, openTop:true,
    flying:true,
    weaponGroups:[
      {count:1, weapon:'heli_mg',         label:'AM Helicóptero',       apCost:1},
      {count:1, weapon:'missile_launcher', label:'Lanzamisiles (×2 total)', apCost:1}
    ],
    desc:'Vuela. AM + 2 misiles totales por partida.'
  },
  transport_heli:{
    name:'Heli. Transporte', abbr:'HELI-T', cost:240,
    maxMen:1, defaultMen:1, icon:'✧',
    color:'#3a4a6a', ecolor:'#4a2a4a',
    hp:4, ap:2, move:7,
    saves:{none:3, light:3, heavy:3},
    tags:['vehicle','air','transport','light_vehicle'], toughness:3, openTop:true,
    flying:true,
    weaponGroups:[
      {count:1, weapon:'heli_mg', label:'2× AM Apoyo (4 dados)', apCost:1}
    ],
    specialAction:'deploy_squad',
    deployCooldown:3,
    capacity:1,
    desc:'Veloz. 2 AM apoyo + despliegue cada 3 turnos.'
  }
};

// =====================================================================
// ROOM DEFINITIONS (single large maps)
// =====================================================================
var ROOM_DEFS = {
  sala:{
    name:'Sala de Estar', icon:'🛋️',
    desc:'Sofás, sillones y mesa de café. Alcance medio.',
    cols:20, rows:16,
    floor:function(c,r){return ((c+r)%4<2)?'wood':'wood2';},
    walls:[[0,0,20,1],[0,15,20,1],[0,0,1,16],[19,0,1,16],[8,3,1,4],[11,9,1,4],[3,7,4,1],[13,7,4,1]],
    coverObjs:[
      {c:2,r:2,w:3,h:1,type:'sofa',cover:'medium',label:'sofá'},
      {c:15,r:2,w:3,h:1,type:'sofa',cover:'medium',label:'sofá'},
      {c:2,r:12,w:3,h:1,type:'sofa',cover:'medium',label:'sofá'},
      {c:15,r:12,w:3,h:1,type:'sofa',cover:'medium',label:'sofá'},
      {c:9,r:7,w:2,h:2,type:'table_low',cover:'light',label:'mesa'},
      {c:2,r:6,w:1,h:1,type:'armchair',cover:'light',label:'sillón'},
      {c:17,r:6,w:1,h:1,type:'armchair',cover:'light',label:'sillón'},
      {c:2,r:8,w:1,h:1,type:'armchair',cover:'light',label:'sillón'},
      {c:17,r:8,w:1,h:1,type:'armchair',cover:'light',label:'sillón'},
      {c:9,r:2,w:2,h:1,type:'tv_stand',cover:'heavy',label:'mueble TV'},
      {c:9,r:12,w:2,h:1,type:'cabinet',cover:'medium',label:'vitrina'}
    ],
    spawnZoneAlly:{c:1,r:1,w:5,h:14},
    spawnZoneEnemy:{c:14,r:1,w:5,h:14}
  },
  cocina:{
    name:'Cocina', icon:'🍳',
    desc:'Mesones perimetrales, isla central. Cobertura pesada.',
    cols:18, rows:14,
    floor:function(c,r){return ((c+r)%2===0)?'tile':'tile2';},
    walls:[[0,0,18,1],[0,13,18,1],[0,0,1,14],[17,0,1,14],[7,5,4,1],[7,8,4,1]],
    coverObjs:[
      {c:1,r:1,w:4,h:1,type:'counter',cover:'heavy',label:'mesón'},
      {c:13,r:1,w:4,h:1,type:'counter',cover:'heavy',label:'mesón'},
      {c:1,r:12,w:4,h:1,type:'counter',cover:'heavy',label:'mesón'},
      {c:13,r:12,w:4,h:1,type:'counter',cover:'heavy',label:'mesón'},
      {c:1,r:5,w:1,h:4,type:'counter',cover:'heavy',label:'mesón'},
      {c:16,r:5,w:1,h:4,type:'counter',cover:'heavy',label:'mesón'},
      {c:7,r:6,w:4,h:2,type:'island',cover:'heavy',label:'isla'},
      {c:5,r:1,w:1,h:1,type:'fridge',cover:'heavy',label:'nevera'},
      {c:11,r:1,w:1,h:1,type:'fridge',cover:'heavy',label:'nevera'},
      {c:5,r:4,w:2,h:1,type:'cabinet',cover:'light',label:'gabinete'},
      {c:11,r:4,w:2,h:1,type:'cabinet',cover:'light',label:'gabinete'}
    ],
    spawnZoneAlly:{c:1,r:2,w:4,h:10},
    spawnZoneEnemy:{c:13,r:2,w:4,h:10}
  },
  comedor:{
    name:'Comedor', icon:'🪑',
    desc:'Gran mesa central con sillas. Espacio abierto y peligroso.',
    cols:18, rows:14,
    floor:function(c,r){return 'wood';},
    walls:[[0,0,18,1],[0,13,18,1],[0,0,1,14],[17,0,1,14],[5,0,1,5],[12,0,1,5],[5,9,1,5],[12,9,1,5]],
    coverObjs:[
      {c:6,r:4,w:6,h:5,type:'dining_table',cover:'heavy',label:'mesa comedor'},
      {c:5,r:4,w:1,h:1,type:'chair',cover:'none',label:'silla'},
      {c:12,r:4,w:1,h:1,type:'chair',cover:'none',label:'silla'},
      {c:5,r:8,w:1,h:1,type:'chair',cover:'none',label:'silla'},
      {c:12,r:8,w:1,h:1,type:'chair',cover:'none',label:'silla'},
      {c:1,r:1,w:2,h:1,type:'cabinet_tall',cover:'heavy',label:'vitrina'},
      {c:15,r:1,w:2,h:1,type:'cabinet_tall',cover:'heavy',label:'vitrina'},
      {c:1,r:11,w:2,h:1,type:'cabinet_tall',cover:'heavy',label:'vitrina'},
      {c:15,r:11,w:2,h:1,type:'cabinet_tall',cover:'heavy',label:'vitrina'}
    ],
    spawnZoneAlly:{c:1,r:1,w:4,h:12},
    spawnZoneEnemy:{c:13,r:1,w:4,h:12}
  },
  cochera:{
    name:'Cochera', icon:'🚗',
    desc:'Autos estacionados, barriles y estantes. Terreno denso.',
    cols:22, rows:16,
    floor:function(c,r){return 'concrete';},
    walls:[[0,0,22,1],[0,15,22,1],[0,0,1,16],[21,0,1,16],[10,0,2,6],[10,10,2,6]],
    coverObjs:[
      {c:3,r:3,w:4,h:2,type:'car',cover:'heavy',label:'auto'},
      {c:15,r:3,w:4,h:2,type:'car',cover:'heavy',label:'auto'},
      {c:3,r:10,w:4,h:2,type:'car',cover:'heavy',label:'auto'},
      {c:15,r:10,w:4,h:2,type:'car',cover:'heavy',label:'auto'},
      {c:8,r:7,w:2,h:2,type:'barrel',cover:'light',label:'barriles'},
      {c:12,r:7,w:2,h:2,type:'barrel',cover:'light',label:'barriles'},
      {c:1,r:7,w:1,h:3,type:'shelf',cover:'light',label:'estante'},
      {c:20,r:7,w:1,h:3,type:'shelf',cover:'light',label:'estante'},
      {c:8,r:2,w:2,h:1,type:'toolbox',cover:'light',label:'caja herr.'},
      {c:12,r:12,w:2,h:1,type:'toolbox',cover:'light',label:'caja herr.'}
    ],
    spawnZoneAlly:{c:1,r:1,w:4,h:14},
    spawnZoneEnemy:{c:17,r:1,w:4,h:14}
  },
  patio:{
    name:'Patio', icon:'🌿',
    desc:'Árboles, setos y muros bajos. Terreno abierto.',
    cols:22, rows:18,
    floor:function(c,r){return ((c*3+r*2)%7<2)?'stone':'grass';},
    walls:[[0,0,22,1],[0,17,22,1],[0,0,1,18],[21,0,1,18],[9,7,4,1],[9,10,4,1]],
    coverObjs:[
      {c:4,r:3,w:1,h:1,type:'tree',cover:'light',label:'árbol'},
      {c:8,r:5,w:1,h:1,type:'tree',cover:'light',label:'árbol'},
      {c:4,r:12,w:1,h:1,type:'tree',cover:'light',label:'árbol'},
      {c:8,r:14,w:1,h:1,type:'tree',cover:'light',label:'árbol'},
      {c:13,r:3,w:1,h:1,type:'tree',cover:'light',label:'árbol'},
      {c:17,r:5,w:1,h:1,type:'tree',cover:'light',label:'árbol'},
      {c:13,r:12,w:1,h:1,type:'tree',cover:'light',label:'árbol'},
      {c:17,r:14,w:1,h:1,type:'tree',cover:'light',label:'árbol'},
      {c:3,r:7,w:3,h:1,type:'hedge',cover:'light',label:'seto'},
      {c:16,r:7,w:3,h:1,type:'hedge',cover:'light',label:'seto'},
      {c:3,r:10,w:3,h:1,type:'hedge',cover:'light',label:'seto'},
      {c:16,r:10,w:3,h:1,type:'hedge',cover:'light',label:'seto'},
      {c:9,r:4,w:4,h:1,type:'wall_low',cover:'medium',label:'muro'},
      {c:9,r:12,w:4,h:1,type:'wall_low',cover:'medium',label:'muro'},
      {c:7,r:8,w:1,h:2,type:'wall_low',cover:'medium',label:'muro'},
      {c:14,r:8,w:1,h:2,type:'wall_low',cover:'medium',label:'muro'}
    ],
    spawnZoneAlly:{c:1,r:1,w:5,h:16},
    spawnZoneEnemy:{c:16,r:1,w:5,h:16}
  },
  cuarto:{
    name:'Cuarto', icon:'🛏️',
    desc:'Camas, roperos y escritorio. Espacio reducido.',
    cols:16, rows:14,
    floor:function(c,r){return 'carpet';},
    walls:[[0,0,16,1],[0,13,16,1],[0,0,1,14],[15,0,1,14],[6,0,1,5],[6,9,1,5],[9,0,1,5],[9,9,1,5]],
    coverObjs:[
      {c:2,r:2,w:3,h:1,type:'bed',cover:'medium',label:'cama'},
      {c:11,r:2,w:3,h:1,type:'bed',cover:'medium',label:'cama'},
      {c:1,r:5,w:1,h:2,type:'wardrobe',cover:'heavy',label:'ropero'},
      {c:14,r:5,w:1,h:2,type:'wardrobe',cover:'heavy',label:'ropero'},
      {c:1,r:10,w:1,h:2,type:'wardrobe',cover:'heavy',label:'ropero'},
      {c:14,r:10,w:1,h:2,type:'wardrobe',cover:'heavy',label:'ropero'},
      {c:6,r:6,w:4,h:2,type:'desk',cover:'medium',label:'escritorio'},
      {c:2,r:11,w:2,h:1,type:'nightstand',cover:'none',label:'mesita'},
      {c:12,r:11,w:2,h:1,type:'nightstand',cover:'none',label:'mesita'}
    ],
    spawnZoneAlly:{c:1,r:1,w:4,h:12},
    spawnZoneEnemy:{c:11,r:1,w:4,h:12}
  },
  atico:{
    name:'Ático', icon:'📦',
    desc:'Cajas, baúles y columnas. Visibilidad reducida.',
    cols:20, rows:16,
    floor:function(c,r){return 'wood_old';},
    walls:[[0,0,20,1],[0,15,20,1],[0,0,1,16],[19,0,1,16],[4,4,1,8],[15,4,1,8],[8,0,4,4],[8,12,4,4]],
    coverObjs:[
      {c:2,r:2,w:1,h:1,type:'box',cover:'light',label:'caja'},
      {c:3,r:3,w:1,h:1,type:'box',cover:'light',label:'caja'},
      {c:16,r:2,w:1,h:1,type:'box',cover:'light',label:'caja'},
      {c:17,r:3,w:1,h:1,type:'box',cover:'light',label:'caja'},
      {c:2,r:11,w:2,h:1,type:'trunk',cover:'medium',label:'baúl'},
      {c:16,r:11,w:2,h:1,type:'trunk',cover:'medium',label:'baúl'},
      {c:2,r:13,w:2,h:1,type:'trunk',cover:'medium',label:'baúl'},
      {c:16,r:13,w:2,h:1,type:'trunk',cover:'medium',label:'baúl'},
      {c:5,r:5,w:1,h:2,type:'shelf_old',cover:'light',label:'repisa'},
      {c:14,r:5,w:1,h:2,type:'shelf_old',cover:'light',label:'repisa'},
      {c:5,r:9,w:1,h:2,type:'shelf_old',cover:'light',label:'repisa'},
      {c:14,r:9,w:1,h:2,type:'shelf_old',cover:'light',label:'repisa'},
      {c:9,r:5,w:2,h:1,type:'column',cover:'heavy',label:'columna'},
      {c:9,r:9,w:2,h:1,type:'column',cover:'heavy',label:'columna'},
      {c:6,r:7,w:2,h:2,type:'box',cover:'light',label:'cajas'},
      {c:12,r:7,w:2,h:2,type:'box',cover:'light',label:'cajas'}
    ],
    spawnZoneAlly:{c:1,r:1,w:5,h:14},
    spawnZoneEnemy:{c:14,r:1,w:5,h:14}
  }
};

var FLOOR_COLORS={wood:'#b89860',wood2:'#a88850',tile:'#d8d4ca',tile2:'#c8c4ba',carpet:'#7a5a7a',concrete:'#8a8a8a',stone:'#9a9a8a',grass:'#5a7a3a',wood_old:'#9a8050'};
var OBS_COLORS={sofa:'#6a5040',armchair:'#7a5a40',table_low:'#8a7050',counter:'#9a8a70',fridge:'#a0b0b0',island:'#9a8a70',cabinet:'#6a5a40',dining_table:'#8a7060',chair:'#6a5040',cabinet_tall:'#5a4a30',car:'#5a6a7a',barrel:'#7a6a3a',shelf:'#8a7050',toolbox:'#7a7a5a',shelf_old:'#7a6a50',tree:'#3a6a2a',hedge:'#4a7a3a',wall_low:'#7a7a6a',table_garden:'#8a7060',bed:'#7a6a8a',wardrobe:'#5a4a40',desk:'#7a6050',nightstand:'#6a5a40',box:'#8a7a5a',trunk:'#6a5a40',column:'#7a7a6a',tv_stand:'#4a4a5a'};

// =====================================================================
// GAME STATE
// =====================================================================
var G = {};
var selectedRosterKey = null;
var diceCallback = null;
var mapZoom = 1.0;
var mapPanX = 0, mapPanY = 0;
var isPanning = false, panStartX = 0, panStartY = 0, panStartMapX = 0, panStartMapY = 0;

function rng(a,b){return Math.floor(Math.random()*(b-a+1))+a;}
function d6(){return rng(1,6);}
function rollDice(n){var r=[];for(var i=0;i<n;i++)r.push(d6());return r;}
function clone(o){return JSON.parse(JSON.stringify(o));}

function showScreen(id){
  document.querySelectorAll('.screen').forEach(function(s){s.classList.remove('active');});
  document.getElementById('screen-'+id).classList.add('active');
  // Always hide overlays when changing screen
  document.getElementById('victory-overlay').classList.remove('show');
  document.getElementById('dice-overlay').classList.remove('show');
  if(document.getElementById('weapon-overlay'))
    document.getElementById('weapon-overlay').classList.remove('show');
}

// =====================================================================
// MAP BUILDING
// =====================================================================
function buildMap(roomKey){
  var rd = ROOM_DEFS[roomKey];
  var map = [];
  for(var r=0;r<rd.rows;r++){
    map.push([]);
    for(var c=0;c<rd.cols;c++)
      map[r].push({type:'floor', floor:rd.floor(c,r), obs:null});
  }
  rd.walls.forEach(function(w){
    for(var r=0;r<w[3];r++) for(var c=0;c<w[2];c++){
      var tr=w[1]+r, tc=w[0]+c;
      if(tr<rd.rows&&tc<rd.cols) map[tr][tc]={type:'wall',floor:'',obs:null};
    }
  });
  var obstacles = [];
  rd.coverObjs.forEach(function(obj){
    for(var dr=0;dr<obj.h;dr++) for(var dc=0;dc<obj.w;dc++){
      var tr=obj.r+dr, tc=obj.c+dc;
      if(tr<rd.rows&&tc<rd.cols&&map[tr][tc].type==='floor')
        map[tr][tc].obs=clone(obj);
    }
    obstacles.push(clone(obj));
  });
  var spawnAlly=[], spawnEnemy=[];
  var za=rd.spawnZoneAlly, ze=rd.spawnZoneEnemy;
  for(var r=0;r<za.h;r++) for(var c=0;c<za.w;c++){
    var tr=za.r+r, tc=za.c+c;
    if(tr<rd.rows&&tc<rd.cols&&map[tr][tc].type==='floor'&&!map[tr][tc].obs) spawnAlly.push({c:tc,r:tr});
  }
  for(var r=0;r<ze.h;r++) for(var c=0;c<ze.w;c++){
    var tr=ze.r+r, tc=ze.c+c;
    if(tr<rd.rows&&tc<rd.cols&&map[tr][tc].type==='floor'&&!map[tr][tc].obs) spawnEnemy.push({c:tc,r:tr});
  }
  return {roomKey:roomKey, name:rd.name, rows:rd.rows, cols:rd.cols, map:map, obstacles:obstacles, spawnAlly:spawnAlly, spawnEnemy:spawnEnemy};
}

// =====================================================================
// SCENE SELECT
// =====================================================================
function initSceneSelect(){
  showScreen('scene');
  var grid = document.getElementById('scene-grid');
  grid.innerHTML = '';
  Object.keys(ROOM_DEFS).forEach(function(key){
    var rd = ROOM_DEFS[key];
    var div = document.createElement('div');
    div.className = 'scene-card';
    div.innerHTML = '<div class="scene-card-icon">'+rd.icon+'</div><div class="scene-card-name">'+rd.name+'</div><div class="scene-card-desc">'+rd.desc+'</div>';
    div.addEventListener('click', function(){ startDeploy(key); });
    grid.appendChild(div);
  });
}

// =====================================================================
// DEPLOY
// =====================================================================
function startDeploy(roomKey){
  showScreen('deploy');
  if(!SPRITES_LOADED) loadSprites(null);
  G.scenario = buildMap(roomKey);
  setTimeout(initDeployTabs, 50); // after DOM settles
  G.deployedUnits = [];
  G.pointsLeft = STARTING_POINTS;
  selectedRosterKey = null;
  document.getElementById('deploy-scene-name').textContent = G.scenario.name;
  renderRoster();
  renderDeployCanvas();
  updateDeployUI();
}

function renderRoster(){
  var el = document.getElementById('roster-list');
  el.innerHTML = '';
  Object.keys(UNIT_DEFS).forEach(function(key){
    var def = UNIT_DEFS[key];
    var canAfford = G.pointsLeft >= def.cost;
    var div = document.createElement('div');
    div.className = 'unit-card'+(canAfford?'':' cant-afford');
    div.dataset.key = key;
    var weaponsHtml = def.weaponGroups.map(function(wg){
      var w=WEAPONS[wg.weapon];
      return wg.label+': ATK×'+w.atk*wg.count+' RNG:'+w.range+' AP:'+w.ap+(w.abilities.length?' ['+w.abilities.join(',')+']':'');
    }).join('<br>');
    div.innerHTML = '<div class="uc-header"><span class="uc-name">'+def.icon+' '+def.name+'</span><span class="uc-cost">'+def.cost+' pts</span></div>'
      +'<div class="uc-desc">'+def.desc+'</div>'
      +'<div class="uc-weapons">'+weaponsHtml+'</div>'
      +'<div class="uc-stats"><span class="uc-stat">MOV:'+def.move+'</span><span class="uc-stat">HP:'+def.hp+'×'+def.defaultMen+'</span><span class="uc-stat">AP:'+def.ap+'</span></div>';
    div.addEventListener('click', function(){ selectRosterUnit(this.dataset.key); });
    el.appendChild(div);
  });
}

function selectRosterUnit(key){
  if(G.pointsLeft < UNIT_DEFS[key].cost) return;
  selectedRosterKey = key;
  document.querySelectorAll('.unit-card').forEach(function(c){c.classList.remove('selected');});
  var card = document.querySelector('.unit-card[data-key="'+key+'"]');
  if(card) card.classList.add('selected');
}

function renderDeployCanvas(){
  var sc=G.scenario, cv=document.getElementById('deploy-canvas');
  var dpr=window.devicePixelRatio||1;
  cv.width=sc.cols*TILE*dpr; cv.height=sc.rows*TILE*dpr;
  cv.style.width=(sc.cols*TILE)+'px'; cv.style.height=(sc.rows*TILE)+'px';
  // ctx already set above
  drawBaseMap(ctx,sc);
  ctx.fillStyle='rgba(74,124,63,.28)';
  sc.spawnAlly.forEach(function(s){ctx.fillRect(s.c*TILE,s.r*TILE,TILE,TILE);});
  ctx.fillStyle='rgba(124,32,32,.18)';
  sc.spawnEnemy.forEach(function(s){ctx.fillRect(s.c*TILE,s.r*TILE,TILE,TILE);});
  G.deployedUnits.forEach(function(u){drawUnit(ctx,u,false);});
}

function updateDeployUI(){
  var used = STARTING_POINTS-G.pointsLeft;
  document.getElementById('pts-display').textContent = G.pointsLeft;
  document.getElementById('pts-used').textContent = used;
  var list = document.getElementById('deployed-list');
  list.innerHTML = '';
  G.deployedUnits.forEach(function(u){
    var div = document.createElement('div');
    div.className = 'deployed-item';
    div.innerHTML = '<span>'+u.icon+' '+u.name+'</span><span class="di-remove" data-id="'+u.id+'">✕</span>';
    list.appendChild(div);
  });
  document.querySelectorAll('.di-remove').forEach(function(btn){
    btn.addEventListener('click', function(){
      var id=this.dataset.id;
      var u=G.deployedUnits.find(function(u){return u.id===id;});
      if(u) G.pointsLeft += UNIT_DEFS[u.key].cost;
      G.deployedUnits = G.deployedUnits.filter(function(u){return u.id!==id;});
      renderDeployCanvas(); updateDeployUI(); renderRoster();
    });
  });
}

function createUnit(id, key, team, c, r){
  var def = UNIT_DEFS[key];
  var u = {
    id:id, key:key, team:team, name:def.name, abbr:def.abbr, icon:def.icon,
    color: team==='ally'?def.color:def.ecolor,
    c:c, r:r,
    hp: def.hp * def.defaultMen,
    maxHp: def.hp * def.defaultMen,
    hpPerMan: def.hp,
    menAlive: def.defaultMen,
    menMax: def.defaultMen,
    ap: def.ap, maxAp: def.ap,
    move: def.move,
    saves: clone(def.saves),
    tags: def.tags.slice(),
    flying: def.flying||false,
    weaponGroups: clone(def.weaponGroups),
    specialAction: def.specialAction||null,
    capacity: def.capacity||0,
    embarkedUnit: null,
    deployCooldown: def.deployCooldown||0,
    deployTimer: 0,
    healDice: def.healDice||0,
    healRange: def.healRange||0,
    toughness: def.toughness||0,
    openTop: def.openTop||false,
    degraded: false,
    suppressMarkers: 0,
    overwatch: false,
    suppressed: false,
    suppressTurns: 0,
    moved: false,
    acted: false,
    cannonFired: false,
    missilesLeft: 2
  };
  // Give heli transport an embarked reserve squad
  if(key==='transport_heli') u.embarkedUnit = 'riflemen';
  return u;
}

// =====================================================================
// BATTLE START
// =====================================================================
function startBattle(){
  if(G.deployedUnits.length===0){alert('Despliega al menos una unidad!');return;}
  showScreen('game');
  // Pre-load sprites (async, game renders with fallback until ready)
  if(!SPRITES_LOADED) loadSprites(function(){ renderGame(); });
  var budget = Math.min(STARTING_POINTS, 200 + G.deployedUnits.reduce(function(s,u){return s+UNIT_DEFS[u.key].cost;},0)*0.85);
  G.units = G.deployedUnits.concat(generateEnemyForce(budget));
  G.turn='ally'; G.round=1; G.selected=null; G.mode='select';
  G.moveTiles=[]; G.attackTiles=[]; G.victoryShown=false;
  updateFog();
  fitMapToView();
  renderGame();
  updateGameUI();
  addLog('¡BATALLA INICIADA! Ronda 1 — Turno ALIADOS','system');
  document.getElementById('r-scene-name').textContent = G.scenario.name;
}

function generateEnemyForce(budget){
  // Detect player army composition to counter it
  var playerHasVehicles=G.deployedUnits.some(function(u){return UNIT_DEFS[u.key].tags.indexOf('vehicle')>=0;});
  var playerHasHeli=G.deployedUnits.some(function(u){return u.key==='attack_heli'||u.key==='transport_heli';});
  var playerInfCount=G.deployedUnits.filter(function(u){return UNIT_DEFS[u.key].tags.indexOf('infantry')>=0;}).length;

  // Build army composition pools based on player
  var pools = [
    // Pool A: Infantry-heavy with support
    ['riflemen','riflemen','riflemen','medics','sniper','antitank'],
    // Pool B: Armored assault
    ['tank','apc','riflemen','riflemen','antitank'],
    // Pool C: Rapid strike
    ['jeep','jeep','riflemen','riflemen','sniper','medics'],
    // Pool D: Air superiority
    ['attack_heli','transport_heli','riflemen','riflemen'],
    // Pool E: Mixed balanced
    ['tank','riflemen','riflemen','sniper','medics','jeep'],
    // Pool F: Counter-infantry if player has many infantry
    ['tank','apc','sniper','sniper','antitank','medics'],
  ];

  // Pick pool based on player composition
  var poolIdx;
  if(playerHasHeli)         poolIdx=2; // fast units to chase heli
  else if(playerHasVehicles) poolIdx=Math.random()<0.5?1:4; // armored or mixed
  else if(playerInfCount>=4) poolIdx=Math.random()<0.5?5:0; // counter-inf or inf
  else                       poolIdx=Math.floor(Math.random()*pools.length);

  var keys=pools[poolIdx].slice().sort(function(){return Math.random()-.5;}); // shuffle within pool

  // Tactical spawn assignment:
  // Sort spawn pool — back rows for snipers/medics, front for tanks/infantry
  var sc=G.scenario;
  var spawnPool=G.scenario.spawnEnemy.slice();
  // Determine "depth" of each spawn tile (distance from enemy edge)
  var enemyEdgeC=sc.cols-1;
  spawnPool.sort(function(a,b){
    return Math.abs(b.c-enemyEdgeC)-Math.abs(a.c-enemyEdgeC); // closest to enemy edge first
  });

  var units=[];
  var remaining=budget;
  var spawnByRole={front:[],mid:[],back:[]};
  spawnPool.forEach(function(s,i){
    var third=Math.floor(spawnPool.length/3);
    if(i<third) spawnByRole.front.push(s);
    else if(i<third*2) spawnByRole.mid.push(s);
    else spawnByRole.back.push(s);
  });

  // Assign roles to unit types
  var roleMap={
    tank:'front', apc:'front', jeep:'front',
    riflemen:'mid', antitank:'mid',
    medics:'back', sniper:'back',
    attack_heli:'front', transport_heli:'back'
  };

  var usedSpawns=new Set();
  function getSpawn(role){
    var pool=spawnByRole[role]||spawnByRole.mid;
    // Fallback to any pool if role pool exhausted
    if(!pool.length||(pool.every(function(s){return usedSpawns.has(s.c+','+s.r);}))) {
      pool=spawnPool;
    }
    for(var i=0;i<pool.length;i++){
      var key=pool[i].c+','+pool[i].r;
      if(!usedSpawns.has(key)){usedSpawns.add(key);return pool[i];}
    }
    return null;
  }

  for(var ki=0;ki<keys.length&&remaining>60;ki++){
    var key=keys[ki];
    var def=UNIT_DEFS[key];
    if(!def||def.cost>remaining) continue;
    var role=roleMap[key]||'mid';
    var pos=getSpawn(role);
    if(!pos) break;
    var uid='enemy_'+Date.now()+'_'+ki+'_'+Math.random().toString(36).slice(2,5);
    units.push(createUnit(uid,key,'enemy',pos.c,pos.r));
    remaining-=def.cost;
  }

  return units;
}

// =====================================================================
// FOG OF WAR
// =====================================================================
function updateFog(){
  var sc=G.scenario;
  var allies=G.units.filter(function(u){return u.team==='ally'&&u.hp>0&&!u.embarkedUnit;});
  G.visibleCells=new Set();
  allies.forEach(function(a){
    for(var dr=-8;dr<=8;dr++) for(var dc=-8;dc<=8;dc++){
      if(Math.abs(dc)+Math.abs(dr)>8)continue;
      var tc=a.c+dc,tr=a.r+dr;
      if(tc>=0&&tr>=0&&tc<sc.cols&&tr<sc.rows&&hasLOS(a.c,a.r,tc,tr,a))
        G.visibleCells.add(tc+','+tr);
    }
  });
  G.visibleEnemyIds=new Set();
  G.units.filter(function(u){return u.team==='enemy'&&u.hp>0;}).forEach(function(e){
    if(G.visibleCells.has(e.c+','+e.r)) G.visibleEnemyIds.add(e.id);
  });
}

// hasLOS with optional attacker unit (to know if vehicle or infantry)
function hasLOS(c1,r1,c2,r2,attackerUnit){
  var dx=c2-c1,dy=r2-r1,steps=Math.max(Math.abs(dx),Math.abs(dy));
  if(!steps)return true;
  var sc=G.scenario;
  var isVehicle=attackerUnit&&attackerUnit.tags&&attackerUnit.tags.indexOf('vehicle')>=0;
  var isHeli=attackerUnit&&attackerUnit.tags&&attackerUnit.tags.indexOf('air')>=0;
  for(var i=1;i<steps;i++){
    var ic=Math.round(c1+dx*i/steps),ir=Math.round(r1+dy*i/steps);
    if(ic<0||ir<0||ic>=sc.cols||ir>=sc.rows)return false;
    var t=sc.map[ir][ic];
    if(t.type==='wall')return false;
    if(!t.obs)continue;
    var ot=t.obs.type;
    // Helicopters fly over TALL obstacles — only walls block them
    if(isHeli)continue;
    // Tall always blocks infantry and ground vehicles
    if(isTallObstacle(ot))return false;
    // Medium blocks infantry LOS (not vehicles — vehicles look over medium cover)
    if(isMedObstacle(ot)&&!isVehicle)return false;
  }
  return true;
}

// Tall obstacles: impassable, always give cover to unit behind/on them
// Low obstacles: passable (unit steps on them), give cover only if unit IS on the tile
// ── OBSTACLE CLASSIFICATION ──────────────────────────────────────────
// TALL: impassable, blocks LOS for infantry AND ground vehicles
//   NOT helicopters (they fly over)
var TALL_OBS=[
  'counter',      // mesón de cocina
  'fridge',       // nevera
  'island',       // isla de cocina
  'cabinet_tall', // vitrina alta
  'dining_table', // mesa de comedor grande
  'car',          // auto estacionado
  'shelf',        // estantería
  'shelf_old',    // repisa de ático
  'wardrobe',     // ropero
  'column',       // columna estructural
  'tv_stand',     // mueble de TV
];
// MEDIUM: passable, blocks infantry LOS, +1 save when unit is on/adjacent
//   Soldados se ponen detrás o encima para cubrirse
var MED_OBS=[
  'sofa',         // sofá (buena cobertura agachado detrás)
  'bed',          // cama
  'wall_low',     // muro bajo
  'trunk',        // baúl
  'desk',         // escritorio
  'cabinet',      // gabinete bajo
];
// LIGHT: passable, does NOT block LOS, -1 attacker die when unit is on/adjacent
//   Cobertura parcial: arbustos, objetos pequeños
var LIGHT_OBS=[
  'armchair',     // sillón
  'table_low',    // mesa de café
  'chair',        // silla
  'barrel',       // barriles
  'toolbox',      // caja de herramientas
  'nightstand',   // mesita de noche
  'tree',         // árbol
  'hedge',        // seto
  'table_garden', // mesa de jardín
  'box',          // caja
];

function isTallObstacle(t){return TALL_OBS.indexOf(t)>=0;}
function isMedObstacle(t){return MED_OBS.indexOf(t)>=0;}
function isLightObstacle(t){return LIGHT_OBS.indexOf(t)>=0;}
function isPassableObstacle(t){return isMedObstacle(t)||isLightObstacle(t);}

// Returns cover info for defender at (dc,dr) being attacked from (ac,ar)
// isVehicle: whether the defender is a vehicle
function getCoverInfo(ac,ar,dc,dr,isDefenderVehicle,isDefenderHeli){
  var sc=G.scenario;
  if(dc<0||dr<0||dc>=sc.cols||dr>=sc.rows)return{type:'none'};
  // Helicopters fly over everything — no cover from obstacles
  if(isDefenderHeli)return{type:'none'};
  // Vehicles only benefit from tall cover (LOS block) — handled at LOS level
  // Infantry can benefit from medium/light on their tile OR adjacent tile
  // Check own tile first
  var ownObs=sc.map[dr][dc].obs;
  if(ownObs&&!isDefenderVehicle){
    if(isTallObstacle(ownObs.type))return{type:'high',obs:ownObs};
    if(isMedObstacle(ownObs.type))return{type:'medium',obs:ownObs};
    if(isLightObstacle(ownObs.type))return{type:'light',obs:ownObs};
  }
  if(isDefenderVehicle)return{type:'none'};
  // Check adjacent tiles — is there a tall/medium obstacle between attacker and defender?
  // The obstacle must be on the line from attacker to defender (angular check)
  var dx=dc-ac, dy=dr-ar;
  var dirs=[[0,1],[0,-1],[1,0],[-1,0]];
  var bestCover={type:'none'};
  for(var i=0;i<dirs.length;i++){
    var nc=dc+dirs[i][0], nr=dr+dirs[i][1];
    if(nc<0||nr<0||nc>=sc.cols||nr>=sc.rows)continue;
    var adjObs=sc.map[nr][nc].obs;
    if(!adjObs)continue;
    // Check if this adjacent tile is "between" attacker and defender
    // by checking if the obstacle is on the attacker-side of the defender
    var obsDx=nc-dc, obsDy=nr-dr;
    // The obstacle provides cover if it's in the direction toward the attacker
    var dotProduct=(-dx)*obsDx+(-dy)*obsDy;
    if(dotProduct<=0)continue; // obstacle is behind or perpendicular — no cover
    var t=adjObs.type;
    if(isTallObstacle(t))return{type:'high',obs:adjObs,fromAdjacent:true};
    if(isMedObstacle(t)&&bestCover.type!=='high'){bestCover={type:'medium',obs:adjObs,fromAdjacent:true};}
    if(isLightObstacle(t)&&bestCover.type==='none'){bestCover={type:'light',obs:adjObs,fromAdjacent:true};}
  }
  return bestCover;
}


// =====================================================================
// SPRITE SYSTEM
// =====================================================================
var SPRITES = {};
var SPRITES_LOADED = false;

// Map: unitKey_team -> array of {minMen, img}
// minMen: use this sprite when menAlive >= minMen
var SPRITE_DEFS = {
  // ── FUSILEROS ──────────────────────────────────────────
  'riflemen_ally':  [
    {minMen:5, src:'sprites/riflemen_green_6.png'},
    {minMen:3, src:'sprites/riflemen_green_4.png'},
    {minMen:2, src:'sprites/riflemen_green_2.png'},
    {minMen:1, src:'sprites/riflemen_green_1.png'},
  ],
  'riflemen_enemy': [
    {minMen:5, src:'sprites/riflemen_tan_6.png'},
    {minMen:3, src:'sprites/riflemen_tan_4.png'},
    {minMen:2, src:'sprites/riflemen_tan_2.png'},
    {minMen:1, src:'sprites/riflemen_tan_1.png'},
  ],
  // ── MÉDICOS ────────────────────────────────────────────
  'medics_ally':  [
    {minMen:3, src:'sprites/medics_green_4.png'},
    {minMen:2, src:'sprites/medics_green_2.png'},
    {minMen:1, src:'sprites/medics_green_1.png'},
  ],
  'medics_enemy': [
    {minMen:3, src:'sprites/medics_tan_4.png'},
    {minMen:2, src:'sprites/medics_tan_2.png'},
    {minMen:1, src:'sprites/medics_tan_1.png'},
  ],
  // ── ANTITANQUE ─────────────────────────────────────────
  'antitank_ally':  [
    {minMen:3, src:'sprites/antitank_green_3.png'},
    {minMen:2, src:'sprites/antitank_green_2.png'},
    {minMen:1, src:'sprites/antitank_green_1.png'},
  ],
  'antitank_enemy': [
    {minMen:3, src:'sprites/antitank_tan_3.png'},
    {minMen:2, src:'sprites/antitank_tan_2.png'},
    {minMen:1, src:'sprites/antitank_tan_1.png'},
  ],
  // ── FRANCOTIRADOR ──────────────────────────────────────
  'sniper_ally':  [
    {minMen:2, src:'sprites/sniper_green_2.png'},
    {minMen:1, src:'sprites/sniper_green_1.png'},
  ],
  'sniper_enemy': [
    {minMen:2, src:'sprites/sniper_tan_2.png'},
    {minMen:1, src:'sprites/sniper_tan_1.png'},
  ],
  // ── VEHÍCULOS (1 sprite, siempre el mismo) ─────────────
  'tank_ally':           [{minMen:1, src:'sprites/tank_green.png'}],
  'tank_enemy':          [{minMen:1, src:'sprites/tank_tan.png'}],
  'apc_ally':            [{minMen:1, src:'sprites/apc_green.png'}],
  'apc_enemy':           [{minMen:1, src:'sprites/apc_tan.png'}],
  'jeep_ally':           [{minMen:1, src:'sprites/jeep_green.png'}],
  'jeep_enemy':          [{minMen:1, src:'sprites/jeep_tan.png'}],
  'attack_heli_ally':    [{minMen:1, src:'sprites/attack_heli_green.png'}],
  'attack_heli_enemy':   [{minMen:1, src:'sprites/attack_heli_tan.png'}],
  'transport_heli_ally':  [{minMen:1, src:'sprites/transport_heli_green.png'}],
  'transport_heli_enemy': [{minMen:1, src:'sprites/transport_heli_tan.png'}],
};

function loadSprites(cb){
  var entries = [];
  Object.keys(SPRITE_DEFS).forEach(function(key){
    SPRITE_DEFS[key].forEach(function(def){
      entries.push({key:key, def:def});
    });
  });
  var total = entries.length, loaded = 0;
  entries.forEach(function(e){
    var img = new Image();
    img.onload = img.onerror = function(){
      loaded++;
      if(loaded >= total){ SPRITES_LOADED = true; if(cb) cb(); }
    };
    img.src = e.def.src;
    if(!SPRITES[e.key]) SPRITES[e.key] = [];
    SPRITES[e.key].push({minMen: e.def.minMen, img: img});
  });
  // Sort descending by minMen so we pick the highest match first
  Object.keys(SPRITES).forEach(function(k){
    SPRITES[k].sort(function(a,b){ return b.minMen - a.minMen; });
  });
}

function getSpriteForUnit(unit){
  var spriteKey = unit.key + '_' + unit.team;
  var defs = SPRITES[spriteKey];
  if(!defs || !defs.length) return null;
  var men = unit.menAlive || 1;
  for(var i=0; i<defs.length; i++){
    if(men >= defs[i].minMen) return defs[i].img;
  }
  return defs[defs.length-1].img; // fallback to smallest
}

// =====================================================================
// DRAWING
// =====================================================================
function drawBaseMap(ctx,sc){
  ctx.clearRect(0,0,sc.cols*TILE,sc.rows*TILE);
  for(var r=0;r<sc.rows;r++) for(var c=0;c<sc.cols;c++){
    var t=sc.map[r][c];
    if(t.type==='wall'){ctx.fillStyle='#1a1c16';ctx.fillRect(c*TILE,r*TILE,TILE,TILE);}
    else{ctx.fillStyle=FLOOR_COLORS[t.floor]||'#7a7a6a';ctx.fillRect(c*TILE,r*TILE,TILE,TILE);ctx.strokeStyle='rgba(0,0,0,.07)';ctx.lineWidth=0.5;ctx.strokeRect(c*TILE+.5,r*TILE+.5,TILE-1,TILE-1);}
  }
  sc.obstacles.forEach(function(o){
    var x=o.c*TILE,y=o.r*TILE,ow=o.w*TILE,oh=o.h*TILE;
    ctx.fillStyle=OBS_COLORS[o.type]||'#6a6a5a';
    ctx.beginPath();ctx.roundRect(x+3,y+3,ow-6,oh-6,4);ctx.fill();
    if(o.cover==='heavy'){ctx.strokeStyle='rgba(255,255,255,.18)';ctx.lineWidth=1.5;ctx.stroke();}
    ctx.fillStyle='rgba(0,0,0,.6)';ctx.font='bold 8px monospace';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(o.label||o.type,x+ow/2,y+oh/2);
    var isTall=TALL_OBS.indexOf(o.type)>=0;
    ctx.fillStyle=o.cover==='heavy'?'#aa8030':o.cover==='light'?'#7a9050':'transparent';
    if(o.cover!=='none'){ctx.font='6px monospace';ctx.fillText(isTall?(o.cover==='heavy'?'▲PES':'▲LIG'):(o.cover==='heavy'?'●PES':'●LIG'),x+ow/2,y+oh/2+11);}
  });
}

function drawUnit(ctx,u,exhausted){
  var x=u.c*TILE, y=u.r*TILE;
  var isVehicle=u.tags.indexOf('vehicle')>=0;

  // ── Try sprite first (infantry only) ──────────────────────────────
  var sprite = getSpriteForUnit(u); // works for both infantry and vehicles
  if(sprite && sprite.complete && sprite.naturalWidth>0){
    // Draw shadow
    ctx.fillStyle='rgba(0,0,0,.35)';
    ctx.beginPath();
    ctx.ellipse(x+TILE/2+2, y+TILE-8, TILE*0.38, TILE*0.12, 0, 0, Math.PI*2);
    ctx.fill();

    // Draw sprite using 'screen' blend to knock out black background
    // Vehicles get slightly more padding to account for rotors/barrels extending
    var padding = isVehicle ? TILE * 0.02 : TILE * 0.04;
    var drawW = TILE - padding*2;
    var drawH = TILE - padding*2;

    // Suppressed: tint purple
    if(u.suppressed){
      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.drawImage(sprite, x+padding, y+padding, drawW, drawH);
      ctx.globalCompositeOperation='source-atop';
      ctx.fillStyle='rgba(160,80,220,.55)';
      ctx.fillRect(x+padding, y+padding, drawW, drawH);
      ctx.restore();
    } else if(exhausted){
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.drawImage(sprite, x+padding, y+padding, drawW, drawH);
      ctx.restore();
    } else {
      // Screen blend: multiplies against white, black drops out
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.92;
      ctx.drawImage(sprite, x+padding, y+padding, drawW, drawH);
      ctx.restore();
    }

    // HP bar
    var bw=TILE-6, frac=Math.max(0,u.hp/u.maxHp);
    ctx.fillStyle='rgba(0,0,0,.6)'; ctx.fillRect(x+3,y+TILE-6,bw,4);
    ctx.fillStyle=frac>.6?'#4adf4a':frac>.3?'#dfaf20':'#df3030';
    ctx.fillRect(x+3,y+TILE-6,bw*frac,4);

    // AP dots
    for(var i=0;i<u.maxAp;i++){
      ctx.fillStyle=i<u.ap?'#ffe066':'rgba(0,0,0,.4)';
      ctx.beginPath(); ctx.arc(x+7+i*9, y+5, 3, 0, Math.PI*2); ctx.fill();
    }

    // Team dot
    ctx.fillStyle=u.team==='ally'?'#4adf3a':'#df3030';
    ctx.beginPath(); ctx.arc(x+TILE-6, y+6, 3.5, 0, Math.PI*2); ctx.fill();

    // Status icons
    if(u.suppressed){ ctx.fillStyle='rgba(200,120,255,.95)'; ctx.font='11px monospace'; ctx.textAlign='center'; ctx.fillText('⚡',x+TILE/2,y+14); }
    if(u.overwatch){  ctx.fillStyle='rgba(255,220,40,.95)';  ctx.font='10px monospace'; ctx.textAlign='center'; ctx.fillText('👁',x+TILE/2,y+14); }
    return;
  }

  // ── Fallback: procedural drawing ──────────────────────────────────
  ctx.fillStyle='rgba(0,0,0,.28)';ctx.beginPath();ctx.ellipse(x+TILE/2+2,y+TILE-7,13,4,0,0,Math.PI*2);ctx.fill();
  var base=u.suppressed?'#4a3a5a':(exhausted?'#3a3a3a':u.color);
  ctx.fillStyle=base;
  if(isVehicle){
    ctx.beginPath();ctx.roundRect(x+4,y+4,TILE-8,TILE-8,4);ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,.15)';ctx.lineWidth=1.5;ctx.stroke();
    ctx.fillStyle='rgba(0,0,0,.2)';ctx.fillRect(x+4,y+TILE-11,TILE-8,4);ctx.fillRect(x+4,y+7,TILE-8,4);
  } else {
    ctx.beginPath();ctx.ellipse(x+TILE/2,y+TILE-9,13,4,0,0,Math.PI*2);ctx.fill();
    var pos=[[TILE/2-8,TILE/2-6],[TILE/2+5,TILE/2-10],[TILE/2-8,TILE/2+4],[TILE/2+5,TILE/2],[TILE/2-2,TILE/2-14],[TILE/2+11,TILE/2+4]];
    for(var i=0;i<u.menMax&&i<6;i++){
      ctx.fillStyle=i<u.menAlive?(exhausted?'#5a5a5a':u.color):'rgba(100,40,40,.5)';
      ctx.beginPath();ctx.arc(x+pos[i][0],y+pos[i][1],3.5,0,Math.PI*2);ctx.fill();
    }
  }
  ctx.fillStyle=u.suppressed?'rgba(180,120,220,.7)':(exhausted?'rgba(255,255,255,.25)':'rgba(255,255,255,.9)');
  ctx.font='bold '+(isVehicle?'17':'12')+'px monospace';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText(u.icon,x+TILE/2,y+TILE/2+(isVehicle?0:-5));
  ctx.fillStyle='rgba(255,255,255,.65)';ctx.font='bold 6px monospace';
  ctx.fillText(u.abbr,x+TILE/2,y+TILE-15);
  var bw=TILE-6,frac=Math.max(0,u.hp/u.maxHp);
  ctx.fillStyle='rgba(0,0,0,.5)';ctx.fillRect(x+3,y+TILE-6,bw,4);
  ctx.fillStyle=frac>.6?'#4a9a3a':frac>.3?'#c8820a':'#aa2020';ctx.fillRect(x+3,y+TILE-6,bw*frac,4);
  ctx.fillStyle=u.team==='ally'?'#4aaa3a':'#cc3030';ctx.beginPath();ctx.arc(x+5,y+5,2.5,0,Math.PI*2);ctx.fill();
  if(u.suppressed){ctx.fillStyle='rgba(180,100,220,.8)';ctx.font='9px monospace';ctx.fillText('⚡',x+TILE-8,y+8);}
  if(u.overwatch){ctx.fillStyle='rgba(200,160,20,.9)';ctx.font='9px monospace';ctx.fillText('👁',x+TILE/2,y+8);}
  if(u.key==='attack_heli'){ctx.fillStyle=u.missilesLeft>0?'#e8a030':'rgba(100,100,100,.5)';ctx.font='7px monospace';ctx.textAlign='center';ctx.fillText('★×'+u.missilesLeft,x+TILE/2,y+TILE-22);}
  if(u.degraded){
    ctx.fillStyle='rgba(255,80,0,.9)';ctx.font='bold 10px monospace';ctx.textAlign='center';
    ctx.fillText('⚠',x+TILE-10,y+10);
  }
  // Flying units: draw altitude shadow underneath to show they're airborne
  if(u.flying&&u.hp>0){
    ctx.strokeStyle=u.team==='ally'?'rgba(100,200,255,.5)':'rgba(255,150,100,.5)';
    ctx.lineWidth=2;
    ctx.setLineDash([4,3]);
    ctx.strokeRect(x+3,y+3,TILE-6,TILE-6);
    ctx.setLineDash([]);
    // Small altitude icon
    ctx.fillStyle=u.team==='ally'?'rgba(100,200,255,.8)':'rgba(255,150,100,.8)';
    ctx.font='8px monospace';ctx.textAlign='left';
    ctx.fillText('✈',x+2,y+TILE-8);
  }
  if(u.specialAction==='deploy_squad'&&u.key==='transport_heli'){var tc=u.deployTimer===0?'#8acc7a':'rgba(200,160,20,.8)';ctx.fillStyle=tc;ctx.font='7px monospace';ctx.textAlign='center';ctx.fillText(u.deployTimer===0?'▼DSPL':'T-'+u.deployTimer,x+TILE/2,y+TILE-22);}
}

function renderGame(){
  var cv=document.getElementById('game-canvas');
  var sc=G.scenario;
  var dpr=window.devicePixelRatio||1;
  cv.width=sc.cols*TILE*dpr; cv.height=sc.rows*TILE*dpr;
  cv.style.width=(sc.cols*TILE)+'px'; cv.style.height=(sc.rows*TILE)+'px';
  var ctx=cv.getContext('2d');
  ctx.scale(dpr,dpr);
  drawBaseMap(ctx,sc);
  // Move tiles — bright lime fill + white border
  G.moveTiles.forEach(function(t){
    ctx.fillStyle='rgba(120,255,80,.22)';
    ctx.fillRect(t.c*TILE,t.r*TILE,TILE,TILE);
    ctx.strokeStyle='rgba(140,255,100,.85)';
    ctx.lineWidth=2;
    ctx.strokeRect(t.c*TILE+1,t.r*TILE+1,TILE-2,TILE-2);
    // Corner dots
    ctx.fillStyle='rgba(160,255,120,.9)';
    var d=4;
    ctx.fillRect(t.c*TILE+3,t.r*TILE+3,d,d);
    ctx.fillRect(t.c*TILE+TILE-3-d,t.r*TILE+3,d,d);
    ctx.fillRect(t.c*TILE+3,t.r*TILE+TILE-3-d,d,d);
    ctx.fillRect(t.c*TILE+TILE-3-d,t.r*TILE+TILE-3-d,d,d);
  });
  // Attack tiles
  G.attackTiles.forEach(function(t){
    var hasEnemy=G.units.find(function(u){return u.c===t.c&&u.r===t.r&&u.hp>0&&u.team==='enemy'&&G.visibleEnemyIds.has(u.id);});
    if(hasEnemy){
      ctx.fillStyle='rgba(255,50,50,.28)';
      ctx.fillRect(t.c*TILE,t.r*TILE,TILE,TILE);
      ctx.strokeStyle='rgba(255,80,80,.95)';
      ctx.lineWidth=2;
      ctx.strokeRect(t.c*TILE+1,t.r*TILE+1,TILE-2,TILE-2);
      // X marker
      ctx.strokeStyle='rgba(255,100,100,.7)';
      ctx.lineWidth=1.5;
      ctx.beginPath();ctx.moveTo(t.c*TILE+8,t.r*TILE+8);ctx.lineTo(t.c*TILE+TILE-8,t.r*TILE+TILE-8);ctx.stroke();
      ctx.beginPath();ctx.moveTo(t.c*TILE+TILE-8,t.r*TILE+8);ctx.lineTo(t.c*TILE+8,t.r*TILE+TILE-8);ctx.stroke();
    } else {
      ctx.fillStyle='rgba(220,60,60,.1)';
      ctx.fillRect(t.c*TILE,t.r*TILE,TILE,TILE);
      ctx.strokeStyle='rgba(200,60,60,.4)';
      ctx.lineWidth=1;
      ctx.strokeRect(t.c*TILE+1,t.r*TILE+1,TILE-2,TILE-2);
    }
  });
  if(G.selected){
    ctx.fillStyle='rgba(200,160,20,.18)';ctx.fillRect(G.selected.c*TILE,G.selected.r*TILE,TILE,TILE);
    ctx.strokeStyle='rgba(200,160,20,.7)';ctx.lineWidth=2;ctx.strokeRect(G.selected.c*TILE+1,G.selected.r*TILE+1,TILE-2,TILE-2);
  }
  // Draw ground units first (under fog)
  G.units.forEach(function(u){
    if(u.hp<=0||u.flying)return;
    if(u.team==='enemy'&&!G.visibleEnemyIds.has(u.id))return;
    drawUnit(ctx,u,u.moved&&u.acted);
  });
  // Fog layer
  for(var r=0;r<sc.rows;r++) for(var c=0;c<sc.cols;c++){
    if(!G.visibleCells.has(c+','+r)){ctx.fillStyle='rgba(0,0,0,.75)';ctx.fillRect(c*TILE,r*TILE,TILE,TILE);}
  }
  // Draw flying units ON TOP of fog (helicopters are always visible when in range)
  G.units.forEach(function(u){
    if(u.hp<=0||!u.flying)return;
    if(u.team==='enemy'&&!G.visibleEnemyIds.has(u.id))return;
    drawUnit(ctx,u,u.moved&&u.acted);
  });
  applyMapTransform();
}

function applyMapTransform(){
  document.getElementById('game-map-inner').style.transform='translate('+mapPanX+'px,'+mapPanY+'px) scale('+mapZoom+')';
  document.getElementById('zoom-label').textContent=Math.round(mapZoom*100)+'%';
}

function fitMapToView(){
  var wrap=document.getElementById('game-map-wrap');
  var sc=G.scenario;
  var scaleX=wrap.clientWidth/(sc.cols*TILE);
  var scaleY=wrap.clientHeight/(sc.rows*TILE);
  mapZoom=Math.min(scaleX,scaleY,1.0);
  mapPanX=(wrap.clientWidth-sc.cols*TILE*mapZoom)/2;
  mapPanY=(wrap.clientHeight-sc.rows*TILE*mapZoom)/2;
  applyMapTransform();
}

// =====================================================================
// WEAPON COMBAT RESOLUTION
// =====================================================================
function getMoves(unit){
  var moves=[],visited=new Set(),sc=G.scenario;
  var isFlying=unit.flying||false;
  var queue=[{c:unit.c,r:unit.r,steps:0}];
  visited.add(unit.c+','+unit.r);
  while(queue.length){
    var cur=queue.shift();
    if(cur.steps>0) moves.push({c:cur.c,r:cur.r});
    if(cur.steps>=unit.move) continue;
    [[0,1],[0,-1],[1,0],[-1,0]].forEach(function(d){
      var nc=cur.c+d[0],nr=cur.r+d[1],key=nc+','+nr;
      if(visited.has(key)) return;
      if(nc<0||nr<0||nc>=sc.cols||nr>=sc.rows) return;
      if(sc.map[nr][nc].type==='wall') return;
      if(!isFlying){
        // Ground units: blocked by tall obstacles
        if(sc.map[nr][nc].obs && isTallObstacle(sc.map[nr][nc].obs.type)) return;
        // Ground units: blocked by any unit in the tile
        if(G.units.find(function(u){return u.c===nc&&u.r===nr&&u.hp>0&&u.id!==unit.id;})) return;
      } else {
        // Flying units: can pass THROUGH any unit (they fly over)
        // but CANNOT land (end movement) on a tile occupied by another unit
        // This is handled by filtering final move tiles below
      }
      visited.add(key);
      queue.push({c:nc,r:nr,steps:cur.steps+1});
    });
  }
  // Flying: remove tiles that are already occupied (can't land there)
  if(isFlying){
    moves=moves.filter(function(t){
      return !G.units.find(function(u){
        return u.c===t.c&&u.r===t.r&&u.hp>0&&u.id!==unit.id;
      });
    });
  }
  return moves;
}

function getAttackRange(unit){
  var maxRange=0;
  unit.weaponGroups.forEach(function(wg){maxRange=Math.max(maxRange,WEAPONS[wg.weapon].range);});
  return maxRange;
}

function getAttackTiles(unit){
  var tiles=[],sc=G.scenario,range=getAttackRange(unit);
  for(var dc=-range;dc<=range;dc++) for(var dr=-range;dr<=range;dr++){
    if(Math.abs(dc)+Math.abs(dr)>range)continue;
    var nc=unit.c+dc,nr=unit.r+dr;
    if(nc>=0&&nr>=0&&nc<sc.cols&&nr<sc.rows) tiles.push({c:nc,r:nr});
  }
  return tiles;
}

function canAttackTarget(attacker, target){
  var dist=Math.abs(attacker.c-target.c)+Math.abs(attacker.r-target.r);
  var maxRange=getAttackRange(attacker);
  return dist<=maxRange && hasLOS(attacker.c,attacker.r,target.c,target.r,attacker);
}

// Resolve a single weapon group, returns result object
function resolveWeapon(attacker, target, wg){
  var w=WEAPONS[wg.weapon];
  var isDefVehicle=target.tags.indexOf('vehicle')>=0;
  var isDefHeavy=target.tags.indexOf('heavy')>=0; // tank, APC = heavy vehicle
  var isDefHeli=target.tags&&target.tags.indexOf('air')>=0;
  var coverInfo=getCoverInfo(attacker.c,attacker.r,target.c,target.r,isDefVehicle,isDefHeli);
  var coverSave=target.saves['none']||5;

  // Infantry small arms cannot wound heavy vehicles
  // Infantry small arms or vehicle light weapons can't wound heavy vehicles
  var lightWeapon=w.ap<3&&w.abilities.indexOf('anti_vehicle')<0;
  var cantWoundHeavy=isDefHeavy&&lightWeapon;
  if(cantWoundHeavy)return{blocked:true,reason:'Armas ligeras no afectan blindaje pesado',coverInfo:coverInfo,w:w,wg:wg};

  // Missiles
  if(wg.weapon==='missile_launcher'){
    if(attacker.missilesLeft<=0)return{blocked:true,reason:'Sin misiles',coverInfo:coverInfo,w:w,wg:wg};
    attacker.missilesLeft--;
  }
  if(wg.weapon==='tank_cannon'){
    if(attacker.cannonFired)return{blocked:true,reason:'Cañón ya disparado este turno',coverInfo:coverInfo,w:w,wg:wg};
    attacker.cannonFired=true;
  }

  var dist=Math.abs(attacker.c-target.c)+Math.abs(attacker.r-target.r);
  var numDice=w.atk*wg.count;
  var mods=[];

  // Modifiers to attack dice
  if(w.abilities.indexOf('heavy')>=0&&!attacker.moved){numDice++;mods.push({txt:'Heavy: +1 dado (no movió)',cls:'mod-good'});}
  if(w.abilities.indexOf('rapid_fire')>=0&&dist<=Math.floor(w.range/2)){numDice*=2;mods.push({txt:'Rapid Fire: ×2 dados (media dist)',cls:'mod-good'});}
  if(w.abilities.indexOf('blast')>=0){var b=Math.floor(target.menAlive/3);if(b>0){numDice+=b;mods.push({txt:'Blast: +'+b+' dados',cls:'mod-good'});}}
  // Cover light: -1 attack die
  if(!isDefVehicle&&coverInfo.type==='light'){numDice=Math.max(1,numDice-1);mods.push({txt:'Cobertura ligera: -1 dado ataque',cls:'mod-bad'});}
  // Suppressed attacker: -1 die
  if(attacker.suppressed){
    var sLevel=attacker.suppressMarkers||1;
    numDice=Math.max(1,numDice-sLevel);
    mods.push({txt:'Suprimido ('+sLevel+' marc.): -'+sLevel+' dado(s)',cls:'mod-bad'});
  }
  if(attacker.degraded){numDice=Math.max(1,numDice-1);mods.push({txt:'Degradado: -1 dado',cls:'mod-bad'});}

  // Hazardous
  var hazNote=null;
  if(w.abilities.indexOf('hazardous')>=0){
    var hr=d6();if(hr===1){applyWounds(attacker,1);hazNote='¡HAZARDOUS! Herida propia (tiró 1)';}
  }

  var hitThresh=w.bs;
  var atkRolls=rollDice(numDice);
  var hits=atkRolls.filter(function(d){return d>=hitThresh;}).length;
  if(w.abilities.indexOf('sustained_hits')>=0){var sh=atkRolls.filter(function(d){return d===6;}).length;if(sh>0){hits+=sh;mods.push({txt:'Sustained: +'+sh+' hit extra',cls:'mod-good'});}}

  // Wound threshold
  // Strength vs Toughness wound table (Bolt Action / 40k hybrid)
  var wStr = w.ap>=4 ? 8 : w.ap>=3 ? 6 : w.ap>=2 ? 4 : w.ap>=1 ? 3 : 2;
  var defTough = (isDefVehicle && target.toughness) ? target.toughness : 0;
  var wndThresh;
  if(w.abilities.indexOf('anti_vehicle')>=0 && isDefVehicle){ wndThresh=2; }
  else if(defTough>0){
    // S vs T: S>=2T→2+, S>T→3+, S=T→4+, S<T→5+, S<=T/2→6+
    if(wStr>=defTough*2)      wndThresh=2;
    else if(wStr>defTough)    wndThresh=3;
    else if(wStr===defTough)  wndThresh=4;
    else if(wStr*2>defTough)  wndThresh=5;
    else                      wndThresh=6;
  } else { wndThresh=4; }
  // Open-top vehicles: any weapon wounds on 4+, crits destroy instantly
  var openTopKill=false;
  if(target.openTop && !isDefHeavy && wStr>=2){
    wndThresh=Math.min(wndThresh,4);
  }
  var wndRolls=hits>0?rollDice(hits):[];
  // Mark criticals (6 on wound roll)
  var crits=wndRolls.filter(function(d){return d===6;}).length;
  var normals=wndRolls.filter(function(d){return d>=wndThresh&&d<6;}).length;
  var wounds=normals+crits;

  // Save threshold
  // Vehicles use fixed save (cover doesn't apply)
  // Infantry: medium cover +1 save bonus
  var baseSave=coverSave;
  if(!isDefVehicle&&coverInfo.type==='medium'){baseSave=Math.max(2,baseSave-1);mods.push({txt:'Cobertura media: +1 salvación defensor',cls:'mod-good'});}
  var saveThresh=Math.max(2, baseSave - Math.floor(w.ap/2));
  var saveRolls=wounds>0?rollDice(wounds):[];
  // Criticals bypass save
  var savedNormal=saveRolls.slice(crits).filter(function(d){return d>=saveThresh;}).length;
  var savedCrit=0; // crits don't allow saves
  var saved=savedNormal;
  var net=(wounds-saved)*w.dmg; // multiply by weapon damage
  // Crits do double damage for anti-vehicle weapons
  if(crits>0&&isDefVehicle&&w.ap>=3){net+=crits*w.dmg;mods.push({txt:'Crítico: daño doble vs vehículo',cls:'mod-good'});}

  var netHits=wounds-saved;
  return{blocked:false,w:w,wg:wg,numDice:numDice,hitThresh:hitThresh,atkRolls:atkRolls,hits:hits,
    wndRolls:wndRolls,wndThresh:wndThresh,wounds:wounds,crits:crits,
    saveRolls:saveRolls,saveThresh:saveThresh,saved:saved,
    net:net,net_hits:netHits,mods:mods,hazNote:hazNote,coverInfo:coverInfo};
}

// Resolve selected weapon groups and return array of results
function resolveSelectedWeapons(attacker, target, selectedWgIndices){
  var results=[];
  selectedWgIndices.forEach(function(gi){
    var wg=attacker.weaponGroups[gi];
    if(!wg)return;
    var dist=Math.abs(attacker.c-target.c)+Math.abs(attacker.r-target.r);
    if(dist>WEAPONS[wg.weapon].range)return;
    results.push(resolveWeapon(attacker,target,wg));
  });
  return results;
}

// Suppression fire — no wounds, just suppress on any hit
function resolveSuppression(attacker, target){
  // Find suppression-capable weapon from attacker
  var suppWg=attacker.weaponGroups.find(function(wg){return WEAPONS[wg.weapon].abilities.indexOf('suppression')>=0;});
  if(!suppWg)return false;
  var w=WEAPONS[suppWg.weapon];
  var dist=Math.abs(attacker.c-target.c)+Math.abs(attacker.r-target.r);
  if(dist>w.range||!hasLOS(attacker.c,attacker.r,target.c,target.r))return false;
  var rolls=rollDice(w.atk*suppWg.count);
  var hits=rolls.filter(function(d){return d>=w.bs;}).length;
  if(hits>0){target.suppressed=true;target.suppressTurns=2;return true;}
  return false;
}

function applyWounds(target, netWounds, dmgPerWound){
  if(!netWounds||netWounds<=0) return;
  var dmg = dmgPerWound||1;
  var isInf = target.tags.indexOf('infantry')>=0;

  if(isInf){
    // Damage overflow: each wound carries dmg points, spills into next model
    // Build model HP array (first model may already be wounded)
    var models = [];
    for(var i=0;i<target.menAlive;i++) models.push(target.hpPerMan);
    // First model: account for existing damage
    var fullHP = target.menAlive * target.hpPerMan;
    var dmgAlready = fullHP - target.hp;
    if(dmgAlready>0) models[0] = target.hpPerMan - (dmgAlready % target.hpPerMan || target.hpPerMan);

    var dmgLeft = netWounds * dmg;
    for(var mi=0;mi<models.length&&dmgLeft>0;mi++){
      if(dmgLeft>=models[mi]){ dmgLeft-=models[mi]; models[mi]=0; }
      else { models[mi]-=dmgLeft; dmgLeft=0; }
    }

    var newHP  = 0; for(var mi=0;mi<models.length;mi++) newHP+=models[mi];
    var prevMen = target.menAlive;
    target.hp      = Math.max(0,newHP);
    target.menAlive = models.filter(function(h){return h>0;}).length;
    var lost = prevMen - target.menAlive;
    if(lost>0) updateWeaponGroupsForCasualties(target, lost);
  } else {
    // Vehicles — flat HP, check for open-top instant kill
    if(target.openTop && dmg>=3){
      // Heavy hit on open-top: destroyed
      target.hp=0;
    } else {
      target.hp = Math.max(0, target.hp - netWounds*dmg);
    }
    // Degradation: at <=33% HP apply degraded flag
    if(target.hp>0 && target.hp <= Math.ceil(target.maxHp/3) && !target.degraded){
      target.degraded=true;
    } else if(target.hp > Math.ceil(target.maxHp/3)){
      target.degraded=false;
    }
  }
}

function updateWeaponGroupsForCasualties(unit, menLost){
  // Distribute casualties across weapon groups based on model ratio
  var totalMen=unit.menMax;
  var remaining=menLost;
  // Work backwards through weapon groups (escorts/heaviest weapons last)
  for(var gi=unit.weaponGroups.length-1;gi>=0&&remaining>0;gi--){
    var wg=unit.weaponGroups[gi];
    var lose=Math.min(wg.count, remaining);
    wg.count=Math.max(0,wg.count-lose);
    remaining-=lose;
  }
  // Remove empty weapon groups
  unit.weaponGroups=unit.weaponGroups.filter(function(wg){return wg.count>0;});
}

// =====================================================================
// DICE OVERLAY
// =====================================================================
// Show results for array of per-weapon results

// =====================================================================
// IMPACT FLASH
// =====================================================================
function spawnImpact(targetUnit, weaponKey){
  var w = WEAPONS[weaponKey];
  if(!w) return;
  var ap = w.ap || 0;
  // Classify impact size by AP
  var cls, rings;
  if(ap>=5 || weaponKey==='tank_cannon' || weaponKey==='missile_launcher'){
    cls='imp-missile'; rings=3;
  } else if(ap>=3 || weaponKey==='at_launcher' || weaponKey==='autocannon'){
    cls='imp-heavy'; rings=2;
  } else if(ap>=2 || weaponKey==='heavy_mg' || weaponKey==='heli_mg'){
    cls='imp-medium'; rings=1;
  } else {
    cls='imp-small'; rings=0;
  }
  var wrap = document.getElementById('game-map-wrap');
  var inner = document.getElementById('game-map-inner');
  // Convert tile coords to screen coords
  var tx = (targetUnit.c * TILE + TILE/2) * mapZoom + mapPanX;
  var ty = (targetUnit.r * TILE + TILE/2) * mapZoom + mapPanY;

  function makeFlash(extraClass, dx, dy, delay){
    var el = document.createElement('div');
    el.className = 'impact-particle ' + (extraClass||cls);
    var size = extraClass==='imp-small'?56:extraClass==='imp-medium'?96:extraClass==='imp-heavy'?150:extraClass==='imp-missile'?210:(cls==='imp-missile'?210:cls==='imp-heavy'?150:cls==='imp-medium'?96:56);
    el.style.cssText = 'left:'+(tx-size/2+(dx||0))+'px;top:'+(ty-size/2+(dy||0))+'px;width:'+size+'px;height:'+size+'px;animation-delay:'+delay+'s';
    wrap.appendChild(el);
    el.addEventListener('animationend', function(){el.remove();});
  }

  // Ring
  if(rings>0){
    for(var ri=0;ri<rings;ri++){
      (function(rr){
        var rEl=document.createElement('div');
        rEl.className='imp-ring';
        var rs=cls==='imp-missile'?180:cls==='imp-heavy'?120:80;
        rEl.style.cssText='left:'+(tx-rs/2)+'px;top:'+(ty-rs/2)+'px;width:'+rs+'px;height:'+rs+'px;animation-delay:'+(rr*0.1)+'s';
        wrap.appendChild(rEl);
        rEl.addEventListener('animationend',function(){rEl.remove();});
      })(ri);
    }
  }

  // Main flash
  makeFlash(null, 0, 0, 0);

  // Secondary sparks for heavy/missile
  if(cls==='imp-heavy'||cls==='imp-missile'){
    var sparks = cls==='imp-missile'?5:3;
    for(var si=0;si<sparks;si++){
      var sdx=(Math.random()-0.5)*80, sdy=(Math.random()-0.5)*80;
      makeFlash('imp-small', sdx, sdy, 0.05+si*0.04);
    }
    // Screen shake
    var mapInner=document.getElementById('game-map-inner');
    mapInner.classList.add('map-shake');
    setTimeout(function(){mapInner.classList.remove('map-shake');},320);
  } else if(cls==='imp-medium'){
    makeFlash('imp-small',(Math.random()-0.5)*50,(Math.random()-0.5)*50,0.06);
  }
}

function showCombatResults(attackerName, targetName, weapResults, cb){
  var ov=document.getElementById('dice-overlay');
  document.getElementById('dice-title').textContent=attackerName+' → '+targetName;
  var dd=document.getElementById('dice-display'); dd.innerHTML='';
  var totalNet=0;
  weapResults.forEach(function(res){
    var block=document.createElement('div'); block.className='dice-weapon-block';
    if(res.blocked){
      block.innerHTML='<div class="dwb-name">'+res.w.name+'</div><div class="dwb-mods" style="color:var(--red3)">'+res.reason+'</div>';
      dd.appendChild(block); return;
    }
    totalNet+=res.net;
    var modsHtml=res.mods.map(function(mo){return '<span class="'+mo.cls+'">'+mo.txt+'</span>';}).join(' · ');
    if(res.hazNote) modsHtml+=' · <span class="mod-bad">'+res.hazNote+'</span>';
    var atkHtml='<div class="dwb-row-label">ATAQUE ('+res.numDice+'d6, '+res.hitThresh+'+)</div><div class="dwb-dice">';
    res.atkRolls.forEach(function(d){atkHtml+='<div class="dwb-die '+(d>=res.hitThresh?'s':'f')+'">'+d+'</div>';});
    atkHtml+='</div>';
    var wndHtml='';
    if(res.wndRolls.length){
      wndHtml='<div class="dwb-row-label">HERIDA ('+res.wndRolls.length+'d6, '+res.wndThresh+'+, crítico en 6)</div><div class="dwb-dice">';
      res.wndRolls.forEach(function(d,idx){var cl=d===6?'crit':d>=res.wndThresh?'s':'f';wndHtml+='<div class="dwb-die '+cl+'">'+d+'</div>';});
      wndHtml+='</div>';
    }
    var savHtml='';
    if(res.saveRolls.length){
      savHtml='<div class="dwb-row-label">SALVACIÓN ('+res.saveRolls.length+'d6, '+res.saveThresh+'+)</div><div class="dwb-dice">';
      res.saveRolls.forEach(function(d){savHtml+='<div class="dwb-die '+(d>=res.saveThresh?'s':'f')+'">'+d+'</div>';});
      savHtml+='</div>';
    }
    var resHtml='<div class="dwb-result">'
      +'<span class="dwb-wounds">'+res.wounds+' herida(s)</span>'
      +' → <span class="dwb-saved">'+res.saved+' salvada(s)</span>'
      +' → <span class="dwb-net">'+res.net+' daño neto</span>'
      +(res.crits>0?' · <span style="color:#fff">'+res.crits+' CRÍTICO(S)!</span>':'')
      +'</div>';
    block.innerHTML='<div class="dwb-name">'+res.w.name+' ×'+res.wg.count+'</div>'
      +(modsHtml?'<div class="dwb-mods">'+modsHtml+'</div>':'')
      +atkHtml+wndHtml+savHtml+resHtml;
    dd.appendChild(block);
  });
  document.getElementById('dice-result').textContent=totalNet>0?'DAÑO TOTAL: '+totalNet+' HP':'SIN EFECTO';
  document.getElementById('dice-sub').textContent='';
  diceCallback=cb;
  ov.classList.add('show');
}

// Legacy simple dice show (for heals etc)
function showDice(title, atkRolls, wndRolls, saveRolls, result, sub, cb){
  var ov=document.getElementById('dice-overlay');
  document.getElementById('dice-title').textContent=title;
  var dd=document.getElementById('dice-display'); dd.innerHTML='';
  function addRow(label,rolls,thresh){
    var l=document.createElement('div');l.className='dice-section-label';l.textContent=label;dd.appendChild(l);
    rolls.forEach(function(d){var e=document.createElement('div');e.className='die '+(d>=thresh?'success':'fail');e.textContent=d;dd.appendChild(e);});
  }
  if(atkRolls.length) addRow('TIRADAS',atkRolls,4);
  document.getElementById('dice-result').textContent=result;
  document.getElementById('dice-sub').textContent=sub||'';
  diceCallback=cb;
  ov.classList.add('show');
}

function closeDice(){
  document.getElementById('dice-overlay').classList.remove('show');
  if(diceCallback){var cb=diceCallback;diceCallback=null;cb();}
}

// =====================================================================
// GAME ACTIONS
// =====================================================================
function selectUnit(u){
  G.selected=u; G.mode='selected';
  G.moveTiles=!u.moved?getMoves(u):[];
  G.attackTiles=!u.acted?getAttackTiles(u):[];
  updateUnitInfoBox(u);
  setModeHint(u.name+' — usa los botones de acción');
}

function setMode(m){
  if(!G.selected||G.turn!=='ally')return;
  if(G.selected.suppressed){
    var sl=G.selected.suppressMarkers||0;
    if(m==='move'&&sl>=2){setModeHint('⚡⚡ Suprimida — no puede mover ('+sl+' marcadores)');return;}
    if(m==='attack'&&sl>=3){setModeHint('⚡⚡⚡ Suprimida — no puede actuar ('+sl+' marcadores)');return;}
  }
  if(m==='move'&&G.selected.moved){setModeHint('Esta unidad ya se movió');return;}
  if(m==='attack'&&G.selected.acted){setModeHint('Esta unidad ya actuó');return;}
  G.mode=m;
  if(m==='move'){G.moveTiles=getMoves(G.selected);G.attackTiles=[];}
  else if(m==='attack'){G.attackTiles=getAttackTiles(G.selected);G.moveTiles=[];}
  else if(m==='suppress'){G.attackTiles=getAttackTiles(G.selected);G.moveTiles=[];}
  setModeHint(m==='move'?'Selecciona casilla verde':m==='attack'?'Selecciona objetivo enemigo':'Selecciona objetivo a suprimir');
  renderGame();
}

function setOverwatch(){
  if(!G.selected||G.turn!=='ally'||G.selected.acted)return;
  G.selected.overwatch=true;G.selected.acted=true;G.selected.moved=true;G.selected.ap=Math.max(0,G.selected.ap-1);
  addLog('👁 '+G.selected.name+' entra en GUARDIA','system');
  renderGame();updateGameUI();
}

function doSpecialAction(){
  if(!G.selected||G.turn!=='ally')return;
  var u=G.selected;
  if(!u.specialAction){setModeHint('Esta unidad no tiene acción especial');return;}

  if(u.specialAction==='deploy_squad'){
    if(u.key==='apc'){
      // APC: gasta 2 AP, despliega fusileros adyacentes
      if(u.ap<2){setModeHint('Sin AP suficientes (necesita 2)');return;}
      var spawnPos=getAdjacentFree(u.c,u.r);
      if(!spawnPos){setModeHint('Sin espacio adyacente libre para desplegar');return;}
      var newId='ally_deploy_'+Date.now();
      var squad=createUnit(newId,'riflemen','ally',spawnPos.c,spawnPos.r);
      squad.moved=true;squad.acted=true; // can't act turn they deploy
      G.units.push(squad);
      u.ap=0;u.moved=true;u.acted=true;
      addLog('🚌 '+u.name+' despliega Fusileros en ('+spawnPos.c+','+spawnPos.r+')','special');
      updateFog();renderGame();updateGameUI();
    } else if(u.key==='transport_heli'){
      if(u.deployTimer>0){setModeHint('Cooldown: '+u.deployTimer+' turnos restantes');return;}
      if(u.ap<2){setModeHint('Sin AP suficientes (necesita 2)');return;}
      var spawnPos=getAdjacentFree(u.c,u.r);
      if(!spawnPos){setModeHint('Sin espacio adyacente libre');return;}
      var newId='ally_heli_deploy_'+Date.now();
      var squad=createUnit(newId,'riflemen','ally',spawnPos.c,spawnPos.r);
      squad.moved=true;squad.acted=true;
      G.units.push(squad);
      u.ap=0;u.moved=true;u.acted=true;
      u.deployTimer=u.deployCooldown;
      addLog('🚁 '+u.name+' despliega Fusileros en ('+spawnPos.c+','+spawnPos.r+')','special');
      updateFog();renderGame();updateGameUI();
    }
  }
}

function getAdjacentFree(c,r){
  var sc=G.scenario;
  var dirs=[[0,1],[0,-1],[1,0],[-1,0],[1,1],[-1,1],[1,-1],[-1,-1]];
  for(var i=0;i<dirs.length;i++){
    var nc=c+dirs[i][0],nr=r+dirs[i][1];
    if(nc>=0&&nr>=0&&nc<sc.cols&&nr<sc.rows&&sc.map[nr][nc].type==='floor'&&!sc.map[nr][nc].obs&&!G.units.find(function(u){return u.c===nc&&u.r===nr&&u.hp>0;}))
      return {c:nc,r:nr};
  }
  return null;
}

var G_weaponTarget = null;

function openWeaponSelect(attacker, target){
  G_weaponTarget = {attacker:attacker, target:target};
  var list = document.getElementById('weapon-select-list');
  list.innerHTML = '';
  document.getElementById('wo-target-name').textContent = 'Objetivo: '+target.name+' ('+target.hp+'/'+target.maxHp+' HP)';
  var isDefVehicle = target.tags.indexOf('vehicle')>=0;
  var isDefHeavy   = target.tags.indexOf('heavy')>=0;
  attacker.weaponGroups.forEach(function(wg, gi){
    var w    = WEAPONS[wg.weapon];
    var dist = Math.abs(attacker.c-target.c)+Math.abs(attacker.r-target.r);
    var outOfRange  = dist > w.range;
    var cantWound   = isDefHeavy && attacker.tags.indexOf('infantry')>=0 && w.ap<3 && w.abilities.indexOf('anti_vehicle')<0;
    var noMissiles  = wg.weapon==='missile_launcher' && attacker.missilesLeft<=0;
    var cannonDone  = wg.weapon==='tank_cannon' && attacker.cannonFired;
    var disabled    = outOfRange||cantWound||noMissiles||cannonDone;
    var disReason   = outOfRange?'FUERA DE RANGO':cantWound?'NO PENETRA BLINDAJE':noMissiles?'SIN MISILES':cannonDone?'YA DISPARADO':'';

    // Preview dice count
    var numDice = w.atk * wg.count;
    var prevMods = [];
    if(!disabled){
      if(w.abilities.indexOf('heavy')>=0 && !attacker.moved){numDice++;prevMods.push('+1 Heavy');}
      if(w.abilities.indexOf('rapid_fire')>=0 && dist<=Math.floor(w.range/2)){numDice*=2;prevMods.push('×2 RF');}
      if(w.abilities.indexOf('blast')>=0){var b=Math.floor(target.menAlive/3);if(b>0){numDice+=b;prevMods.push('+'+b+' Blast');}}
      if(attacker.suppressed){numDice=Math.max(1,numDice-1);prevMods.push('-1 Supr');}
      var isTargHeli=target.tags&&target.tags.indexOf('air')>=0;
    var cInfo=getCoverInfo(attacker.c,attacker.r,target.c,target.r,isDefVehicle,isTargHeli);
      if(cInfo.type==='light'){numDice=Math.max(1,numDice-1);prevMods.push('-1 Cob.Lig');}
    }
    var abilStr = w.abilities.length ? '['+w.abilities.join('][')+']' : '';
    var row = document.createElement('div');
    row.className = 'wsel-row'+(disabled?' disabled':'');
    row.dataset.gi = gi;
    row.innerHTML =
      '<div class="wsel-check"></div>'
      +'<div class="wsel-info">'
        +'<div class="wsel-name">'+w.name+' ×'+wg.count+'</div>'
        +'<div class="wsel-stats">ATK:'+w.atk+'×'+wg.count+' BS:'+w.bs+'+ RNG:'+w.range+' AP:'+w.ap+' D:'+w.dmg+(abilStr?' '+abilStr.toUpperCase():'')+'</div>'
        +(disabled
          ?'<div class="wsel-mods mod-bad">'+disReason+'</div>'
          :(prevMods.length?'<div class="wsel-mods">'+prevMods.map(function(s){return '<span class="mod-good">'+s+'</span>';}).join(' ')+'</div>':''))
      +'</div>'
      +'<div class="wsel-dice-preview">'+(disabled?'—':numDice+'d6')+'</div>';
    if(!disabled){
      row.addEventListener('click', function(){
        this.classList.toggle('checked');
        this.querySelector('.wsel-check').textContent = this.classList.contains('checked')?'✓':'';
      });
    }
    list.appendChild(row);
  });
  // Auto-check all available
  document.querySelectorAll('#weapon-select-list .wsel-row:not(.disabled)').forEach(function(r){
    r.classList.add('checked');
    r.querySelector('.wsel-check').textContent='✓';
  });
  document.getElementById('weapon-overlay').classList.add('show');
}

function confirmWeaponSelect(){
  document.getElementById('weapon-overlay').classList.remove('show');
  if(!G_weaponTarget) return;
  var attacker = G_weaponTarget.attacker;
  var target   = G_weaponTarget.target;
  G_weaponTarget = null;
  var selected = [];
  document.querySelectorAll('#weapon-select-list .wsel-row.checked').forEach(function(r){
    selected.push(parseInt(r.dataset.gi));
  });
  if(!selected.length){addLog('No se seleccionó ningún arma','miss');return;}
  var results  = resolveSelectedWeapons(attacker, target, selected);
  // Apply wounds per weapon so overflow works correctly per weapon's DMG stat
  var totalNet = 0;
  attacker.acted = true;
  attacker.ap    = Math.max(0, attacker.ap-1);
  results.forEach(function(res){
    if(!res.blocked && (res.net_hits||0)>0){
      applyWounds(target, (res.net_hits||0), res.w.dmg);  // pass net HITS + dmg separately
      totalNet += (res.net_hits||0) * res.w.dmg;
      if(res.net_hits>0) spawnImpact(target, res.wg.weapon);
    }
  });
  if(totalNet>0) addLog('💥 '+attacker.name+'→'+target.name+': '+totalNet+' daño ('+target.hp+'/'+target.maxHp+' HP)','hit');
  else           addLog('○ '+attacker.name+'→'+target.name+': sin efecto','miss');
  if(target.hp<=0) addLog('💀 '+target.name+' ELIMINADO!','hit');
  showCombatResults(attacker.name, target.name, results, function(){
    G.attackTiles = [];
    if(checkVictory()) return;
    updateFog(); updateGameUI(); renderGame();
  });
}

function performAttack(attacker, target){
  if(attacker.acted) return;
  openWeaponSelect(attacker, target);
}

function performSuppression(attacker, target){
  if(attacker.acted)return;
  var canSuppress=attacker.weaponGroups.some(function(wg){return WEAPONS[wg.weapon].abilities.indexOf('suppression')>=0;});
  if(!canSuppress){setModeHint('Esta unidad no puede suprimir');return;}
  var suppressed=resolveSuppression(attacker,target);
  attacker.acted=true;attacker.ap=Math.max(0,attacker.ap-1);
  if(suppressed){
    addLog('⚡ '+attacker.name+' SUPRIME a '+target.name+' (no puede mover/atacar -1)','suppress');
  } else {
    addLog('○ '+attacker.name+' intentó suprimir a '+target.name+': falló','miss');
  }
  G.attackTiles=[];updateGameUI();renderGame();
}

// =====================================================================
// TURN SYSTEM
// =====================================================================
function endTurn(){
  if(G.turn!=='ally')return;
  G.turn='enemy';G.selected=null;G.moveTiles=[];G.attackTiles=[];G.mode='select';
  addLog('--- Fin turno ALIADOS. Turno ENEMIGOS ---','system');
  updateGameUI();renderGame();
  setTimeout(runAI,500);
}

function tickSuppression(team){
  G.units.filter(function(u){return u.team===team&&u.suppressed;}).forEach(function(u){
    u.suppressMarkers=Math.max(0,(u.suppressMarkers||1)-1);
    if(u.suppressMarkers<=0){
      u.suppressed=false;u.suppressTurns=0;
      addLog('✓ '+u.name+' recuperado de supresión','system');
    } else {
      addLog('⚡ '+u.name+' aún suprimido ('+u.suppressMarkers+' marcadores)','suppress');
    }
  });
}

function tickDeployTimers(team){
  G.units.filter(function(u){return u.team===team&&u.deployTimer>0;}).forEach(function(u){
    u.deployTimer--;
  });
}

function runAI(){
  var enemies=G.units.filter(function(u){return u.team==='enemy'&&u.hp>0;});
  var delay=0;
  enemies.forEach(function(e){
    setTimeout(function(){
      if(e.hp>0) aiActUnit(e);
      updateFog();renderGame();updateGameUI();
      checkVictory();
    }, delay);
    delay+=300;
  });
  setTimeout(function(){
    if(G.victoryShown)return;
    G.units.forEach(function(u){if(u.team==='enemy'&&u.hp>0){u.moved=false;u.acted=false;u.overwatch=false;u.ap=u.maxAp;u.cannonFired=false;}});
    tickSuppression('ally');
    tickDeployTimers('enemy');
    G.turn='ally';G.round++;
    G.units.forEach(function(u){if(u.team==='ally'&&u.hp>0){u.moved=false;u.acted=false;u.overwatch=false;u.ap=u.maxAp;u.cannonFired=false;}});
    tickSuppression('enemy');
    tickDeployTimers('ally');
    addLog('=== RONDA '+G.round+' — TURNO ALIADOS ===','system');
    updateFog();updateGameUI();renderGame();
  }, delay+200);
}

// AI helper: pick best target based on unit role
function aiPickTarget(e, allies){
  if(!allies.length) return null;
  var inRange=allies.filter(function(a){return canAttackTarget(e,a);});
  if(!inRange.length) return null;

  // Snipers prefer weakest infantry target
  if(e.key==='sniper'){
    var infTargets=inRange.filter(function(a){return a.tags.indexOf('infantry')>=0;});
    if(infTargets.length) return infTargets.slice().sort(function(a,b){return a.hp-b.hp;})[0];
  }
  // AT units always prefer vehicles
  if(e.key==='antitank'){
    var vehTargets=inRange.filter(function(a){return a.tags.indexOf('vehicle')>=0;});
    if(vehTargets.length) return vehTargets.slice().sort(function(a,b){return a.hp-b.hp;})[0];
  }
  // Tanks prefer other vehicles first, then highest-HP infantry
  if(e.key==='tank'){
    var vehTargets=inRange.filter(function(a){return a.tags.indexOf('vehicle')>=0;});
    if(vehTargets.length) return vehTargets.slice().sort(function(a,b){return a.hp-b.hp;})[0];
    return inRange.slice().sort(function(a,b){return b.menAlive-a.menAlive;})[0];
  }
  // Medics prefer to NOT attack — move to cover ally medics
  if(e.key==='medics') return inRange.slice().sort(function(a,b){return a.hp-b.hp;})[0];
  // Default: weakest target
  return inRange.slice().sort(function(a,b){return a.hp-b.hp;})[0];
}

// AI helper: pick best move tile
function aiPickMove(e, allies, moves){
  if(!moves.length) return null;
  // Snipers: move to tile with best cover far from enemies
  if(e.key==='sniper'){
    var covered=moves.filter(function(t){
      var obs=G.scenario.map[t.r]&&G.scenario.map[t.r][t.c]&&G.scenario.map[t.r][t.c].obs;
      return obs&&(isMedObstacle(obs.type)||isTallObstacle(obs.type));
    });
    if(covered.length){
      // Pick covered tile furthest from nearest enemy
      var nearest=allies.slice().sort(function(a,b){return(Math.abs(a.c-e.c)+Math.abs(a.r-e.r))-(Math.abs(b.c-e.c)+Math.abs(b.r-e.r));})[0];
      return covered.slice().sort(function(a,b){
        return(Math.abs(b.c-nearest.c)+Math.abs(b.r-nearest.r))-(Math.abs(a.c-nearest.c)+Math.abs(a.r-nearest.r));
      })[0];
    }
  }
  // Jeep: flank — move to tile with most enemies in range after move
  if(e.key==='jeep'){
    var bestFlank=null, bestCount=-1;
    moves.forEach(function(t){
      var count=allies.filter(function(a){
        return Math.abs(a.c-t.c)+Math.abs(a.r-t.r)<=WEAPONS['heavy_mg'].range;
      }).length;
      if(count>bestCount){bestCount=count;bestFlank=t;}
    });
    if(bestFlank&&bestCount>0) return bestFlank;
  }
  // Medics: move toward most wounded ally
  if(e.key==='medics'){
    var wounded=G.units.filter(function(u){return u.team==='enemy'&&u.hp>0&&u.hp<u.maxHp;});
    if(wounded.length){
      var mostWounded=wounded.slice().sort(function(a,b){return(a.hp/a.maxHp)-(b.hp/b.maxHp);})[0];
      return moves.slice().sort(function(a,b){
        return(Math.abs(a.c-mostWounded.c)+Math.abs(a.r-mostWounded.r))-(Math.abs(b.c-mostWounded.c)+Math.abs(b.r-mostWounded.r));
      })[0];
    }
  }
  // Default: move toward nearest enemy
  var nearest=allies.slice().sort(function(a,b){return(Math.abs(a.c-e.c)+Math.abs(a.r-e.r))-(Math.abs(b.c-e.c)+Math.abs(b.r-e.r));})[0];
  return moves.slice().sort(function(a,b){
    return(Math.abs(a.c-nearest.c)+Math.abs(a.r-nearest.r))-(Math.abs(b.c-nearest.c)+Math.abs(b.r-nearest.r));
  })[0];
}

function aiActUnit(e){
  // Check suppression level
  if(e.suppressed){
    var sl=e.suppressMarkers||1;
    if(sl>=3){addLog('⚡⚡⚡ '+e.name+' no puede actuar','suppress');return;}
    if(sl>=2){
      addLog('⚡⚡ '+e.name+' suprimido — solo puede atacar','suppress');
      // Can attack but not move
    }
  }

  var allies=G.units.filter(function(u){return u.team==='ally'&&u.hp>0;});
  if(!allies.length)return;

  // Transport heli deploy
  if(e.key==='transport_heli'&&e.deployTimer===0){
    var sp=getAdjacentFree(e.c,e.r);
    if(sp){
      var sq=createUnit('enemy_heli_'+Date.now(),'riflemen','enemy',sp.c,sp.r);
      sq.moved=true;sq.acted=true;
      G.units.push(sq);
      e.deployTimer=e.deployCooldown;e.ap=0;e.moved=true;e.acted=true;
      addLog('🚁 '+e.name+' despliega refuerzos','special');
      return;
    }
  }

  // APC deploy when infantry not yet deployed
  if(e.key==='apc'&&e.ap>=2){
    var sp2=getAdjacentFree(e.c,e.r);
    var hasNearbyInf=G.units.some(function(u){
      return u.team==='enemy'&&u.hp>0&&u.tags.indexOf('infantry')>=0
        &&Math.abs(u.c-e.c)+Math.abs(u.r-e.r)<=3;
    });
    if(sp2&&!hasNearbyInf&&Math.random()<0.6){
      var sq2=createUnit('enemy_apc_'+Date.now(),'riflemen','enemy',sp2.c,sp2.r);
      sq2.moved=true;sq2.acted=true;
      G.units.push(sq2);
      e.ap=0;e.moved=true;e.acted=true;
      addLog('🚌 '+e.name+' despliega fusileros','special');
      return;
    }
  }

  // Suppression with jeep — prioritize biggest infantry squad
  var canSuppress=e.weaponGroups.some(function(wg){return WEAPONS[wg.weapon].abilities.indexOf('suppression')>=0;});
  if(canSuppress&&!e.acted){
    var bigInf=allies.filter(function(a){
      return a.tags.indexOf('infantry')>=0&&!a.suppressed&&canAttackTarget(e,a);
    }).sort(function(a,b){return b.menAlive-a.menAlive;})[0];
    // Use suppression if target has 3+ men and AI hasn't attacked yet
    if(bigInf&&bigInf.menAlive>=3&&Math.random()<0.65){
      var supp=resolveSuppression(e,bigInf);
      if(supp)addLog('⚡ '+e.name+' SUPRIME a '+bigInf.name+' ('+bigInf.suppressMarkers+' marc.)','suppress');
      else addLog('○ '+e.name+' falló supresión','miss');
      e.acted=true;e.ap=Math.max(0,e.ap-1);
      // Move after suppression if still can
      if(!e.moved&&!(e.suppressMarkers>=2)){
        var moves=getMoves(e);
        var mv=aiPickMove(e,allies,moves);
        if(mv){e.c=mv.c;e.r=mv.r;e.moved=true;}
      }
      return;
    }
  }

  // Try attack
  var target=aiPickTarget(e,allies);
  if(target&&!e.acted){
    var availIdx=e.weaponGroups.map(function(_,i){return i;});
    var results=resolveSelectedWeapons(e,target,availIdx);
    var totalNet=0;
    results.forEach(function(r){
      if(!r.blocked&&(r.net_hits||0)>0){applyWounds(target,r.net_hits,r.w.dmg);totalNet+=r.net_hits*r.w.dmg;}
    });
    if(totalNet>0)addLog('🔴 '+e.name+'→'+target.name+': '+totalNet+' daño ('+target.hp+'/'+target.maxHp+')','hit');
    else addLog('○ '+e.name+'→'+target.name+': sin efecto','miss');
    if(target.hp<=0)addLog('💀 '+target.name+' ELIMINADO!','hit');
    e.acted=true;e.ap=Math.max(0,e.ap-1);
    // Try to move after attack if not moved
    if(!e.moved&&!(e.suppressMarkers>=2)){
      var moves2=getMoves(e);
      var mv2=aiPickMove(e,allies,moves2);
      if(mv2){e.c=mv2.c;e.r=mv2.r;e.moved=true;}
    }
    return;
  }

  // No attack possible — move tactically
  if(!e.moved&&!(e.suppressMarkers>=2)){
    var moves3=getMoves(e);
    // Check overwatch before committing move
    G.units.filter(function(u){return u.team==='ally'&&u.overwatch&&u.hp>0&&canAttackTarget(u,e);}).forEach(function(ow){
      var owIdx=ow.weaponGroups.map(function(_,i){return i;});
      var owRes=resolveSelectedWeapons(ow,e,owIdx);
      var owNet=0;
      owRes.forEach(function(r){if(!r.blocked&&(r.net_hits||0)>0){applyWounds(e,r.net_hits,r.w.dmg);owNet+=r.net_hits*r.w.dmg;}});
      if(owNet>0)addLog('👁 '+ow.name+' dispara en GUARDIA a '+e.name+': '+owNet+' daño','hit');
      ow.overwatch=false;
    });
    if(e.hp<=0){addLog('💀 '+e.name+' abatido en guardia!','hit');return;}
    var mv3=aiPickMove(e,allies,moves3);
    if(mv3){
      e.c=mv3.c;e.r=mv3.r;e.moved=true;
      // Try attack after move
      var t2=aiPickTarget(e,allies);
      if(t2&&!e.acted){
        var aidx2=e.weaponGroups.map(function(_,i){return i;});
        var r2=resolveSelectedWeapons(e,t2,aidx2);
        var tn=0;
        r2.forEach(function(r){if(!r.blocked&&(r.net_hits||0)>0){applyWounds(t2,r.net_hits,r.w.dmg);tn+=r.net_hits*r.w.dmg;}});
        if(tn>0)addLog('🔴 '+e.name+'→'+t2.name+': '+tn+' daño','hit');
        if(t2.hp<=0)addLog('💀 '+t2.name+' ELIMINADO!','hit');
        e.acted=true;e.ap=Math.max(0,e.ap-1);
      }
    }
  }
}

function vehicleExplosionCheck(unit){
  if(!unit.tags||unit.tags.indexOf('vehicle')<0) return;
  var roll=d6();
  if(roll>=5){
    var dmg=d6()<=3?1:d6()<=4?2:3; // D3 mortar wounds
    addLog('💥 '+unit.name+' EXPLOTA! Radio 2 tiles — '+dmg+' daño a unidades cercanas!','hit');
    G.units.forEach(function(u){
      if(u.id===unit.id||u.hp<=0) return;
      var dist=Math.abs(u.c-unit.c)+Math.abs(u.r-unit.r);
      if(dist<=2){
        applyWounds(u, dmg, 1);
        addLog('  ↳ '+u.name+' recibe '+dmg+' daño por explosión','hit');
        if(u.hp<=0) addLog('💀 '+u.name+' eliminado por explosión!','hit');
      }
    });
  }
}

function clearSuppressionIfSuppressorDead(){
  // If the unit that applied suppression is dead, remove suppression
  // We track this simply: if ALL suppression-capable enemies are dead, clear ally suppression
  var enemySuppressors=G.units.filter(function(u){
    return u.team==='enemy'&&u.hp>0&&u.weaponGroups&&u.weaponGroups.some(function(wg){
      return WEAPONS[wg.weapon]&&WEAPONS[wg.weapon].abilities.indexOf('suppression')>=0;
    });
  });
  if(enemySuppressors.length===0){
    G.units.filter(function(u){return u.team==='ally'&&u.suppressed;}).forEach(function(u){
      u.suppressed=false;u.suppressTurns=0;
      addLog('✓ '+u.name+': supresión cancelada (supresor eliminado)','system');
    });
  }
  var allySuppressors=G.units.filter(function(u){
    return u.team==='ally'&&u.hp>0&&u.weaponGroups&&u.weaponGroups.some(function(wg){
      return WEAPONS[wg.weapon]&&WEAPONS[wg.weapon].abilities.indexOf('suppression')>=0;
    });
  });
  if(allySuppressors.length===0){
    G.units.filter(function(u){return u.team==='enemy'&&u.suppressed;}).forEach(function(u){
      u.suppressed=false;u.suppressTurns=0;
    });
  }
}

function checkVictory(){
  clearSuppressionIfSuppressorDead();
  // Check for freshly killed vehicles that should explode
  G.units.filter(function(u){return u.hp<=0&&u.tags&&u.tags.indexOf('vehicle')>=0&&!u.exploded;}).forEach(function(u){
    u.exploded=true; vehicleExplosionCheck(u);
  });
  var a=G.units.filter(function(u){return u.team==='ally'&&u.hp>0;}).length;
  var en=G.units.filter(function(u){return u.team==='enemy'&&u.hp>0;}).length;
  if(!a||!en){
    G.victoryShown=true;
    var won=en===0;
    document.getElementById('victory-title').textContent=won?'¡VICTORIA!':'¡DERROTA!';
    document.getElementById('victory-title').className='victory-title '+(won?'win':'lose');
    document.getElementById('victory-sub').textContent=won?'Misión completada':'Fuerzas aliadas eliminadas';
    document.getElementById('victory-overlay').classList.add('show');
    return true;
  }
  return false;
}

// =====================================================================
// UI
// =====================================================================
function addLog(msg,cls){
  var el=document.getElementById('combat-log');
  var div=document.createElement('div');
  div.className='log-entry '+(cls||'');
  div.textContent=msg;
  el.appendChild(div);
  el.scrollTop=el.scrollHeight;
}

function setModeHint(t){document.getElementById('mode-hint').textContent=t;}

function updateUnitInfoBox(u){
  if(!u){document.getElementById('uib-name').textContent='Sin selección';return;}
  document.getElementById('uib-name').textContent=u.icon+' '+u.name;
  document.getElementById('uib-type').textContent=u.tags.join(' · ').toUpperCase()+(u.suppressed?' · ⚡SUPRIMIDO':'');
  var hpFrac=Math.max(0,u.hp/u.maxHp);
  document.getElementById('hp-text').textContent=u.hp+'/'+u.maxHp;
  var hpBar=document.getElementById('hp-bar');
  hpBar.style.width=(hpFrac*100)+'%';
  hpBar.className='bar-fill hp'+(hpFrac>.5?'':hpFrac>.25?' mid':' low');
  document.getElementById('ap-text').textContent=u.ap+'/'+u.maxAp;
  document.getElementById('ap-bar').style.width=((u.ap/u.maxAp)*100)+'%';
  var menEl=document.getElementById('uib-men');menEl.innerHTML='';
  for(var i=0;i<u.menMax;i++){var d=document.createElement('div');d.className='man-dot'+(i>=u.menAlive?' dead':'');menEl.appendChild(d);}
  // Weapon profiles
  var wEl=document.getElementById('uib-weapons'); wEl.innerHTML='';
  u.weaponGroups.forEach(function(wg){
    var w=WEAPONS[wg.weapon];
    var row=document.createElement('div');row.className='weapon-row';
    var isUnavailable=(wg.weapon==='missile_launcher'&&u.missilesLeft===0)||(wg.weapon==='tank_cannon'&&u.cannonFired);
    row.innerHTML='<div class="weapon-name"'+(isUnavailable?' style="color:var(--red3);text-decoration:line-through"':'')+'>'+(wg.label||w.name)+'</div>'
      +'<div class="weapon-stats">ATK:'+w.atk+'×'+wg.count+' BS:'+w.bs+'+ RNG:'+w.range+' AP:'+w.ap+' D:'+w.dmg+'</div>'
      +(w.abilities.length?'<div class="weapon-ability">['+w.abilities.join('] [')+']</div>':'')
      +(wg.weapon==='missile_launcher'?'<div class="weapon-ability" style="color:var(--amber2)">Misiles restantes: '+u.missilesLeft+'</div>':'')
      +(u.specialAction?'<div class="weapon-ability" style="color:var(--green2)">'+(u.key==='transport_heli'?'Despliegue CD: '+u.deployTimer:'ESPECIAL: Despliegue')+'</div>':'');
    wEl.appendChild(row);
  });
}

function updateGameUI(){
  var isAlly=G.turn==='ally';
  document.getElementById('turn-label').textContent=isAlly?'ALIADOS':'ENEMIGOS';
  document.getElementById('turn-label').className='turn-side '+(isAlly?'ally':'enemy');
  document.getElementById('round-num').textContent=G.round||1;
  var totalAp=G.units.filter(function(u){return u.team==='ally'&&u.hp>0;}).reduce(function(s,u){return s+u.ap;},0);
  document.getElementById('ap-left').textContent=totalAp;
  var a=G.units.filter(function(u){return u.team==='ally'&&u.hp>0;}).length;
  var en=G.units.filter(function(u){return u.team==='enemy'&&u.hp>0;}).length;
  document.getElementById('ally-count').textContent=a;
  document.getElementById('enemy-count').textContent=en;
  // Units list
  var ul=document.getElementById('units-list'); ul.innerHTML='';
  function addSection(units, label){
    if(!units.length)return;
    var t=document.createElement('div');t.className='ul-group-title';t.textContent=label;ul.appendChild(t);
    units.forEach(function(u){
      if(u.team==='enemy'&&!G.visibleEnemyIds.has(u.id))return;
      var el=document.createElement('div');
      var isSel=G.selected&&G.selected.id===u.id;
      el.className='ul-entry'+(isSel?' selected':'')+(u.moved&&u.acted?' exhausted':'');
      var frac=Math.max(0,u.hp/u.maxHp);
      var tags='';
      if(u.suppressed)tags+='<span class="status-tag tag-suppressed">SUPR</span>';
      if(u.overwatch)tags+='<span class="status-tag tag-overwatch">OW</span>';
      el.innerHTML='<span class="ul-dot" style="background:'+u.color+'"></span><span class="ul-name">'+u.icon+' '+u.abbr+'</span>'+tags+'<span class="ul-men">'+u.menAlive+'</span><div class="ul-hp-mini"><div class="ul-hp-fill" style="width:'+(frac*100)+'%;background:'+(frac>.5?'#4a9a3a':frac>.3?'#c8820a':'#aa2020')+'"></div></div>';
      if(u.team==='ally')el.addEventListener('click',function(){selectUnit(u);renderGame();updateGameUI();});
      ul.appendChild(el);
    });
  }
  addSection(G.units.filter(function(u){return u.team==='ally'&&u.hp>0;}),'🟢 ALIADOS');
  addSection(G.units.filter(function(u){return u.team==='enemy'&&u.hp>0;}),'🔴 ENEMIGOS VISIBLES');
  // Button states
  var hasSel=!!G.selected;
  document.getElementById('btn-endturn').disabled=!isAlly;
  document.getElementById('btn-move').disabled=!hasSel||!isAlly;
  document.getElementById('btn-attack').disabled=!hasSel||!isAlly;
  document.getElementById('btn-suppress').disabled=!hasSel||!isAlly||!(G.selected&&G.selected.weaponGroups&&G.selected.weaponGroups.some(function(wg){return WEAPONS[wg.weapon].abilities.indexOf('suppression')>=0;}));
  document.getElementById('btn-special').disabled=!hasSel||!isAlly||!(G.selected&&G.selected.specialAction);
  document.getElementById('btn-overwatch').disabled=!hasSel||!isAlly||!!(G.selected&&G.selected.acted);
  if(G.selected) updateUnitInfoBox(G.selected);
}

// =====================================================================
// CANVAS CLICK & TOOLTIP
// =====================================================================
function getCanvasCoords(e){
  var wrap=document.getElementById('game-map-wrap');
  var rect=wrap.getBoundingClientRect();
  var mx=e.clientX-rect.left, my=e.clientY-rect.top;
  var mc=Math.floor((mx-mapPanX)/(TILE*mapZoom));
  var mr=Math.floor((my-mapPanY)/(TILE*mapZoom));
  return {c:mc, r:mr};
}

document.getElementById('game-canvas').addEventListener('click', function(e){
  if(G.turn!=='ally')return;
  var pos=getCanvasCoords(e);
  var mc=pos.c, mr=pos.r;
  var sc=G.scenario;
  if(mc<0||mr<0||mc>=sc.cols||mr>=sc.rows)return;
  var clickedUnit=G.units.find(function(u){return u.c===mc&&u.r===mr&&u.hp>0;});

  // Always allow switching to another ally unit with a simple click
  if(clickedUnit&&clickedUnit.team==='ally'&&(!G.selected||clickedUnit.id!==G.selected.id)){
    selectUnit(clickedUnit);
    updateGameUI();renderGame();return;
  }

  if(G.mode==='select'||G.mode==='selected'){
    if(!clickedUnit){G.mode='select';G.selected=null;G.moveTiles=[];G.attackTiles=[];}
  } else if(G.mode==='move'){
    var canGo=G.moveTiles.find(function(t){return t.c===mc&&t.r===mr;});
    if(canGo&&G.selected&&!G.selected.moved){
      G.selected.c=mc;G.selected.r=mr;G.selected.moved=true;G.selected.ap=Math.max(0,G.selected.ap-1);
      addLog('▶ '+G.selected.name+' → ('+mc+','+mr+')','move');
      updateFog();G.moveTiles=[];
      if(!G.selected.acted)G.attackTiles=getAttackTiles(G.selected);
      G.mode='selected';
    } else if(!clickedUnit){G.mode='select';G.selected=null;G.moveTiles=[];G.attackTiles=[];}
  } else if(G.mode==='attack'){
    if(clickedUnit&&clickedUnit.team==='enemy'&&G.visibleEnemyIds.has(clickedUnit.id)){
      if(G.selected&&!G.selected.acted&&canAttackTarget(G.selected,clickedUnit)){
        performAttack(G.selected,clickedUnit);return;
      }
    } else if(G.selected&&G.selected.tags.includes('healer')&&clickedUnit&&clickedUnit.team==='ally'){
      var dist=Math.abs(G.selected.c-clickedUnit.c)+Math.abs(G.selected.r-clickedUnit.r);
      if(dist<=G.selected.healRange&&!G.selected.acted){
        var rolls=rollDice(G.selected.healDice);
        var healed=rolls.filter(function(d){return d>=4;}).length;
        clickedUnit.hp=Math.min(clickedUnit.maxHp,clickedUnit.hp+healed);
        clickedUnit.menAlive=Math.ceil(clickedUnit.hp/clickedUnit.hpPerMan);
        G.selected.acted=true;G.selected.ap=Math.max(0,G.selected.ap-1);
        addLog('✚ '+G.selected.name+' curó a '+clickedUnit.name+': +'+healed+' HP','heal');
        showDice('CURACIÓN',rolls,[],[],'+'+healed+' CURADOS','',function(){updateGameUI();renderGame();});
        return;
      }
    } else if(!clickedUnit){G.mode='selected';if(G.selected)G.attackTiles=getAttackTiles(G.selected);}
  } else if(G.mode==='suppress'){
    if(clickedUnit&&clickedUnit.team==='enemy'&&G.visibleEnemyIds.has(clickedUnit.id)&&G.selected&&!G.selected.acted){
      performSuppression(G.selected,clickedUnit);return;
    } else if(!clickedUnit){G.mode='selected';if(G.selected)G.attackTiles=getAttackTiles(G.selected);}
  }
  updateGameUI();renderGame();
});

// Tooltip
document.getElementById('game-map-wrap').addEventListener('mousemove', function(e){
  var tt=document.getElementById('tooltip');
  if(!G.units||G.turn===undefined){tt.style.display='none';return;}
  var pos=getCanvasCoords(e);
  var mc=pos.c, mr=pos.r;
  var sc=G.scenario;
  if(!sc||mc<0||mr<0||mc>=sc.cols||mr>=sc.rows){tt.style.display='none';return;}
  var u=G.units.find(function(u){return u.c===mc&&u.r===mr&&u.hp>0;});
  if(u&&(u.team==='ally'||G.visibleEnemyIds.has(u.id))){
    tt.style.display='block';tt.style.left=(e.clientX+14)+'px';tt.style.top=(e.clientY-8)+'px';
    var weapSummary=u.weaponGroups.map(function(wg){var w=WEAPONS[wg.weapon];return w.name+' R:'+w.range;}).join(' | ');
    tt.innerHTML='<b>'+u.name+'</b>'+(u.suppressed?' ⚡':'')+'<br>HP:'+u.hp+'/'+u.maxHp+' MOV:'+u.move+' AP:'+u.ap+'/'+u.maxAp+'<br>'+weapSummary+'<br>Equipo: '+(u.team==='ally'?'Aliado':'Enemigo');
  } else if(sc.map[mr]&&sc.map[mr][mc]&&sc.map[mr][mc].obs){
    var o=sc.map[mr][mc].obs;
    tt.style.display='block';tt.style.left=(e.clientX+14)+'px';tt.style.top=(e.clientY-8)+'px';
    tt.innerHTML='<b>'+(o.label||o.type)+'</b><br>Cobertura: '+o.cover;
  } else tt.style.display='none';
});
document.getElementById('game-map-wrap').addEventListener('mouseleave',function(){document.getElementById('tooltip').style.display='none';});

// =====================================================================
// MAP PAN & ZOOM
// =====================================================================
document.getElementById('game-map-wrap').addEventListener('mousedown', function(e){
  if(e.button===1||(e.button===0&&(e.altKey||e.ctrlKey))){
    isPanning=true; panStartX=e.clientX; panStartY=e.clientY;
    panStartMapX=mapPanX; panStartMapY=mapPanY;
    this.classList.add('grabbing'); e.preventDefault();
  }
});
document.addEventListener('mousemove', function(e){
  if(!isPanning)return;
  mapPanX=panStartMapX+(e.clientX-panStartX);
  mapPanY=panStartMapY+(e.clientY-panStartY);
  applyMapTransform();
});
document.addEventListener('mouseup', function(){
  isPanning=false;
  document.getElementById('game-map-wrap').classList.remove('grabbing');
});
document.getElementById('game-map-wrap').addEventListener('wheel', function(e){
  e.preventDefault();
  var factor=e.deltaY<0?1.1:0.9;
  var wrap=this.getBoundingClientRect();
  var mx=e.clientX-wrap.left, my=e.clientY-wrap.top;
  var newZoom=Math.min(Math.max(mapZoom*factor,0.3),2.5);
  mapPanX=mx-(mx-mapPanX)*(newZoom/mapZoom);
  mapPanY=my-(my-mapPanY)*(newZoom/mapZoom);
  mapZoom=newZoom;
  applyMapTransform();
},{passive:false});
document.getElementById('btn-zoom-in').addEventListener('click',function(){mapZoom=Math.min(mapZoom*1.2,2.5);applyMapTransform();});
document.getElementById('btn-zoom-out').addEventListener('click',function(){mapZoom=Math.max(mapZoom/1.2,0.3);applyMapTransform();});
document.getElementById('btn-zoom-fit').addEventListener('click',fitMapToView);

// Touch pan support
var lastTouchX=0, lastTouchY=0, lastTouchDist=0;
document.getElementById('game-map-wrap').addEventListener('touchstart',function(e){
  if(e.touches.length===1){lastTouchX=e.touches[0].clientX;lastTouchY=e.touches[0].clientY;}
  if(e.touches.length===2){lastTouchDist=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);}
  e.preventDefault();},{passive:false});
document.getElementById('game-map-wrap').addEventListener('touchmove',function(e){
  if(e.touches.length===1){mapPanX+=e.touches[0].clientX-lastTouchX;mapPanY+=e.touches[0].clientY-lastTouchY;lastTouchX=e.touches[0].clientX;lastTouchY=e.touches[0].clientY;applyMapTransform();}
  if(e.touches.length===2){var d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);mapZoom=Math.min(Math.max(mapZoom*(d/lastTouchDist),0.3),2.5);lastTouchDist=d;applyMapTransform();}
  e.preventDefault();},{passive:false});

// Deploy canvas click
document.getElementById('deploy-canvas').addEventListener('click', function(e){
  if(!selectedRosterKey)return;
  var cv=e.target,rect=cv.getBoundingClientRect();
  var sx=cv.width/rect.width,sy=cv.height/rect.height;
  var mc=Math.floor((e.clientX-rect.left)*sx/TILE),mr=Math.floor((e.clientY-rect.top)*sy/TILE);
  var sc=G.scenario;
  if(!sc.spawnAlly.find(function(s){return s.c===mc&&s.r===mr;}))return;
  if(G.deployedUnits.find(function(u){return u.c===mc&&u.r===mr;}))return;
  var def=UNIT_DEFS[selectedRosterKey];
  if(G.pointsLeft<def.cost)return;
  var uid='ally_'+Date.now()+'_'+Math.random().toString(36).slice(2,6);
  G.deployedUnits.push(createUnit(uid,selectedRosterKey,'ally',mc,mr));
  G.pointsLeft-=def.cost;
  renderDeployCanvas();updateDeployUI();renderRoster();
});

// Buttons
document.getElementById('btn-wo-confirm').addEventListener('click', confirmWeaponSelect);
document.getElementById('btn-wo-cancel').addEventListener('click', function(){
  document.getElementById('weapon-overlay').classList.remove('show');
  G_weaponTarget=null;
});

// =====================================================================
// DEPLOY TAB SYSTEM (mobile)
// =====================================================================
function deployTab(tab){
  document.querySelectorAll('.deploy-tab').forEach(function(t){t.classList.remove('active');});
  document.querySelectorAll('.deploy-panel').forEach(function(p){p.classList.remove('mob-active');});
  var btn=document.getElementById('tab-'+tab);
  var panel=document.getElementById('deploy-panel-'+tab);
  if(btn) btn.classList.add('active');
  if(panel) panel.classList.add('mob-active');
  // Re-render deploy canvas when switching to map tab
  if(tab==='map') setTimeout(renderDeployCanvas, 40);
}

// On deploy screen open, default to catalog tab on mobile
function initDeployTabs(){
  // Show catalog by default on mobile, all visible on desktop
  var isMobile=window.innerWidth<=680;
  if(isMobile){
    deployTab('catalog');
  } else {
    // Desktop: show all panels
    document.querySelectorAll('.deploy-panel').forEach(function(p){p.classList.add('mob-active');});
  }
}

// Update force tab count badge
function updateForceTabCount(){
  var badge=document.getElementById('tab-force-count');
  if(badge) badge.textContent=G.deployedUnits&&G.deployedUnits.length?'('+G.deployedUnits.length+')':'';
}

// =====================================================================
// MOBILE PANEL SYSTEM
// =====================================================================
function openMobPanel(side){
  document.getElementById('mob-panel-'+side).classList.add('open');
  document.getElementById('mob-scrim').classList.add('show');
}
function closeAllMobPanels(){
  document.querySelectorAll('.mob-panel').forEach(function(p){p.classList.remove('open');});
  document.getElementById('mob-scrim').classList.remove('show');
}

// Sync mobile unit info with desktop state
function syncMobileUI(){
  // Turn badge
  var isAlly=G.turn==='ally';
  var mb=document.getElementById('mob-turn-label');
  if(mb){mb.textContent=isAlly?'ALIADOS':'ENEMIGOS';mb.className='mob-turn-badge '+(isAlly?'ally':'enemy');}
  var ma=document.getElementById('mob-ap-info');
  if(ma){
    var ap=G.units?G.units.filter(function(u){return u.team==='ally'&&u.hp>0;}).reduce(function(s,u){return s+u.ap;},0):0;
    ma.textContent='AP: '+ap;
  }
  // Mode hint
  var mh=document.getElementById('mob-mode-hint');
  var dh=document.getElementById('mode-hint');
  if(mh&&dh) mh.textContent=dh.textContent;
  // Selected unit
  if(G.selected){
    var u=G.selected;
    var mn=document.getElementById('mob-uib-name'); if(mn) mn.textContent=u.icon+' '+u.name;
    var mt=document.getElementById('mob-uib-type'); if(mt) mt.textContent=u.tags.join(' · ').toUpperCase();
    var hf=Math.max(0,u.hp/u.maxHp);
    var mhb=document.getElementById('mob-hp-bar'); if(mhb){mhb.style.width=(hf*100)+'%';mhb.className='bar-fill hp'+(hf>.5?'':hf>.25?' mid':' low');}
    var mht=document.getElementById('mob-hp-text'); if(mht) mht.textContent=u.hp+'/'+u.maxHp;
    var mab=document.getElementById('mob-ap-bar'); if(mab) mab.style.width=((u.ap/u.maxAp)*100)+'%';
    var mat=document.getElementById('mob-ap-text'); if(mat) mat.textContent=u.ap+'/'+u.maxAp;
    var mm=document.getElementById('mob-uib-men'); if(mm){mm.innerHTML='';for(var i=0;i<u.menMax;i++){var d=document.createElement('div');d.className='man-dot'+(i>=u.menAlive?' dead':'');mm.appendChild(d);}}
    var mw=document.getElementById('mob-uib-weapons'); if(mw) mw.innerHTML=document.getElementById('uib-weapons')?document.getElementById('uib-weapons').innerHTML:'';
  }
  // Counts
  if(G.units){
    var ac=G.units.filter(function(u){return u.team==='ally'&&u.hp>0;}).length;
    var ec=G.units.filter(function(u){return u.team==='enemy'&&u.hp>0;}).length;
    var mac=document.getElementById('mob-ally-count'); if(mac) mac.textContent=ac;
    var mec=document.getElementById('mob-enemy-count'); if(mec) mec.textContent=ec;
    var msn=document.getElementById('mob-scene-name'); if(msn&&G.scenario) msn.textContent=G.scenario.name;
  }
  // Sync units list to mobile panel
  var mul=document.getElementById('mob-units-list');
  var dul=document.getElementById('units-list');
  if(mul&&dul) mul.innerHTML=dul.innerHTML;
  // Sync combat log
  var mcl=document.getElementById('mob-combat-log');
  var dcl=document.getElementById('combat-log');
  if(mcl&&dcl){mcl.innerHTML=dcl.innerHTML;mcl.scrollTop=9999;}
  // Button states (mirror desktop to mobile)
  ['move','attack','suppress','special','overwatch','endturn'].forEach(function(id){
    var desk=document.getElementById('btn-'+id);
    var mob=document.getElementById('mob-btn-'+id);
    if(desk&&mob) mob.disabled=desk.disabled;
  });
}

document.getElementById('mob-btn-info').addEventListener('click',function(){openMobPanel('left');});
document.getElementById('mob-btn-units').addEventListener('click',function(){openMobPanel('right');});
document.getElementById('mob-close-left').addEventListener('click',closeAllMobPanels);
document.getElementById('mob-close-right').addEventListener('click',closeAllMobPanels);
document.getElementById('mob-scrim').addEventListener('click',closeAllMobPanels);

// Mobile action buttons — mirror desktop
['move','attack','suppress','special','overwatch','endturn'].forEach(function(id){
  var mob=document.getElementById('mob-btn-'+id);
  var desk=document.getElementById('btn-'+id);
  if(mob&&desk) mob.addEventListener('click',function(){desk.click();closeAllMobPanels();});
});

// Hook syncMobileUI into updateGameUI
var _origUpdateGameUI=updateGameUI;
updateGameUI=function(){_origUpdateGameUI();syncMobileUI();};

document.getElementById('btn-start-mission').addEventListener('click', initSceneSelect);
document.getElementById('btn-start-battle').addEventListener('click', startBattle);
document.getElementById('btn-close-dice').addEventListener('click', closeDice);
document.getElementById('btn-main-menu').addEventListener('click', function(){location.reload();});
document.getElementById('btn-new-game').addEventListener('click', initSceneSelect);
document.getElementById('btn-move').addEventListener('click', function(){setMode('move');});
document.getElementById('btn-attack').addEventListener('click', function(){setMode('attack');});
document.getElementById('btn-suppress').addEventListener('click', function(){setMode('suppress');});
document.getElementById('btn-special').addEventListener('click', doSpecialAction);
document.getElementById('btn-overwatch').addEventListener('click', setOverwatch);
document.getElementById('btn-endturn').addEventListener('click', endTurn);
