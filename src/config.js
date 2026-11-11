export const CONFIG = Object.freeze({ WIDTH:390, HEIGHT:844, CENTER:{x:195,y:424}, ARENA_RADIUS:182, SPAWN_RADIUS:180, LIGHTHOUSE_RADIUS:19, BEAM_RANGE:188, BEAM_HALF_ANGLE:.16, BASE_DPS:34, MAX_ENERGY:100, MAX_INTEGRITY:10, DRAIN:20, REGEN:17, OVERHEAT:.8, REACTIVATE:12, ROTATE_SPEED:2.9, WAVE_DURATIONS:[28,30,32], COUNTDOWN:3, MAX_ENEMIES:26, MAX_PARTICLES:90, MAX_PROJECTILES:20 });
export const PALETTE = Object.freeze({night:'#07131E',sea:'#102C3D',seaLight:'#164759',teal:'#49B7AD',mint:'#B9E8D9',gold:'#FFD58A',amber:'#F7AE61',coral:'#EF786C',violet:'#A79ADB',paper:'#FFF1D6',muted:'#ACBBC4',panel:'#112536',black:'#030C12'});
export const ENEMIES = Object.freeze({
  wisp:{hp:16,speed:23,radius:9,damage:1,score:30,starlight:2},
  drifter:{hp:28,speed:17,radius:13,damage:1,score:45,starlight:3},
  splitter:{hp:34,speed:16,radius:14,damage:1,score:60,starlight:4},
  shard:{hp:10,speed:28,radius:6,damage:1,score:10,starlight:0},
  eater:{hp:42,speed:13,radius:15,damage:2,score:85,starlight:5},
  siren:{hp:30,speed:21,radius:12,damage:1,score:80,starlight:4},
  armoured:{hp:52,speed:12,radius:17,damage:2,score:110,starlight:7}
});
export const BOSSES = Object.freeze({
  1:{id:'knocker',name:'The Knocker',hp:110,radius:23,orbitSpeed:.23,attackEvery:8},
  2:{id:'ferryman',name:'The Ferryman',hp:145,radius:25,orbitSpeed:.19,attackEvery:7},
  3:{id:'jelly_queen',name:'The Jelly Queen',hp:170,radius:29,orbitSpeed:.14,attackEvery:11},
  4:{id:'archivist',name:'The Archivist',hp:190,radius:25,orbitSpeed:.15,attackEvery:9},
  5:{id:'tempest',name:'The Tempest',hp:215,radius:31,orbitSpeed:.30,attackEvery:10},
  6:{id:'starved_sky',name:'The Starved Sky',hp:235,radius:32,orbitSpeed:.18,attackEvery:7.5},
  7:{id:'hollow_king',name:'The Hollow King',hp:null,radius:72,orbitSpeed:0,attackEvery:0}
});
const spec=[
 ['Something in the Water','The first things came from the sea.',[{wisp:5,drifter:1},{wisp:4,drifter:2},{wisp:4,drifter:3,splitter:1}]],
 ['The Ghost Fleet','A hundred centuries. One ocean.',[{wisp:3,drifter:2,splitter:1},{wisp:3,splitter:2,drifter:2},{drifter:3,splitter:3,wisp:2}]],
 ['The Queen Below','The deep has a guardian.',[{wisp:2,drifter:3,siren:1},{drifter:2,siren:2,splitter:1},{siren:3,drifter:2,splitter:2}]],
 ['The Drowned City','Some inventions should stay forgotten.',[{drifter:2,armoured:1,splitter:2},{armoured:2,wisp:2,splitter:2},{armoured:3,siren:2,splitter:2}]],
 ['The Storm That Hunts','Weather with a grudge.',[{siren:3,wisp:2,eater:1},{siren:3,eater:2,splitter:2},{eater:3,siren:3,drifter:1}]],
 ['The Last Star','Hold onto the sky.',[{wisp:2,siren:2,eater:2},{armoured:2,eater:2,siren:2},{armoured:2,eater:3,splitter:2}]],
 ['The Thing That Ate the Dawn','The final night. The hardest choice.',[{drifter:2,siren:2,armoured:1},{eater:2,siren:3,armoured:2},{eater:3,armoured:3,siren:3}]]
];
export const NIGHTS = Object.freeze(spec.map(([title,subtitle,enemyPools],i)=>Object.freeze({id:i+1,title,subtitle,bossId:BOSSES[i+1].id,waveDurations:[...CONFIG.WAVE_DURATIONS],enemyPools,journalId:`night_${i+1}`})));
export const UPGRADES=Object.freeze({
 focused_lens:{title:'Focused Lens',description:'Beam damage +20% of base per level.',maxLevel:3,rarity:'common'},
 wide_lens:{title:'Wide Lens',description:'Beam cone +0.045 radians per level.',maxLevel:3,rarity:'common'},
 battery_bank:{title:'Battery Bank',description:'Maximum light +20 and restore 20.',maxLevel:3,rarity:'common'},
 quick_charge:{title:'Quick Charge',description:'Recharge light +4 per second.',maxLevel:3,rarity:'common'},
 efficient_filament:{title:'Efficient Filament',description:'Light drains 2 less per second.',maxLevel:3,rarity:'common'},
 reinforced_walls:{title:'Reinforced Walls',description:'Maximum integrity +2 and heal 2.',maxLevel:3,rarity:'common'},
 prism_beam:{title:'Prism Beam',description:'Two side rays at 45% damage each.',maxLevel:1,rarity:'rare'},
 angry_moth:{title:'Angry Moth',description:'Pip zaps a shadow for 16 every 4.5s.',maxLevel:1,rarity:'rare'},
 disco_lighthouse:{title:'Disco Lighthouse',description:'Sweep the sea for 1.2s every 18s.',maxLevel:1,rarity:'rare'},
 solar_overload:{title:'Solar Overload',description:'First light depletion each wave pulses 20 damage.',maxLevel:1,rarity:'rare'},
 mercy_light:{title:'Mercy Light',description:'Guide ships 0.25s faster and gain +4 light.',maxLevel:2,rarity:'common'},
 lucky_stars:{title:'Lucky Stars',description:'Each enemy adds +1 starlight and +15 score.',maxLevel:2,rarity:'common'}
});
export const WORKSHOP=Object.freeze({lamp:{title:'Lantern Wick',description:'+3 base beam damage per level'},battery:{title:'Old Battery',description:'+10 max light per level'},stone:{title:'Stormproof Stone',description:'+1 integrity per level'}});
export const WORKSHOP_COSTS=Object.freeze([20,45,80]);
export const SAVE_KEY='last-light-save-v1';
