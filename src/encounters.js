import {BOSSES,CONFIG} from './config.js';
import {clamp,normalizedAngleDifference} from './math.js';
const C=CONFIG.CENTER,TAU=Math.PI*2;
export function createBoss(night){const d=BOSSES[night];if(!d)return null;return {id:d.id,name:d.name,hp:d.hp,maxHp:d.hp,radius:d.radius,x:C.x+(d.radius>=31?130:124),y:C.y,age:0,orbitAngle:0,orbitRadius:d.radius>=31?130:124,orbitSpeed:d.orbitSpeed,attackTimer:d.attackEvery,attackState:'idle',warning:0,shieldRemaining:0,starTimer:14,hitFlash:0,phase:'normal'};}
export function applyBossDamage(run,amount){const b=run.boss;if(!b||b.hp===null||b.hp<=0||b.shieldRemaining>0||!(amount>0))return false;b.hp=Math.max(0,b.hp-amount);b.hitFlash=.1;return b.hp===0;}
export function updateBoss(run,dt,rng=run.rng){const b=run.boss;if(!b||b.hp===null||b.hp<=0||dt<=0)return [];const events=[];b.age+=dt;b.hitFlash=Math.max(0,b.hitFlash-dt);b.orbitAngle+=b.orbitSpeed*dt;b.x=C.x+b.orbitRadius*Math.cos(b.orbitAngle);b.y=C.y+b.orbitRadius*Math.sin(b.orbitAngle);
 if(b.shieldRemaining>0){b.shieldRemaining=Math.max(0,b.shieldRemaining-dt);if(b.shieldRemaining===0&&b.id==='jelly_queen'){events.push({type:'summon',units:[['siren',b.orbitAngle+1],['siren',b.orbitAngle+4]]});}}
 if(b.id==='starved_sky'){b.starTimer-=dt;if(b.starTimer<=0){b.starTimer+=14;events.push({type:'spawn_star',angle:rng()*TAU});}}
 if(b.attackState==='warning'){
  b.warning-=dt;if(b.warning<=0){b.attackState='idle';b.warning=0;
   switch(b.id){
    case 'knocker':events.push({type:'summon',units:[0,2.1,4.2].map(a=>['wisp',b.orbitAngle+a])});break;
    case 'ferryman':events.push({type:'summon',units:[['drifter',b.orbitAngle+2]]},{type:'decoy',angle:b.orbitAngle+4});break;
    case 'jelly_queen':b.shieldRemaining=2.7;break;
    case 'archivist':events.push({type:'bolts',offsets:[-.25,0,.25]});break;
    case 'tempest':events.push({type:'gust',angle:(rng()<.5?-1:1)*.22},{type:'summon',units:[['wisp',b.orbitAngle+3]]});break;
    case 'starved_sky':events.push({type:'summon',units:[['eater',b.orbitAngle],['wisp',b.orbitAngle+2],['wisp',b.orbitAngle+4]]});break;
   }
  }
 }else {b.attackTimer-=dt;if(b.attackTimer<=0){b.attackTimer=BOSSES[run.bossNight||run.night].attackEvery;b.attackState='warning';b.warning=b.id==='tempest'?1:.95;events.push({type:'boss_telegraph',bossId:b.id});}}
 return events;}
export function startFinale(run){run.boss=createBoss(7);run.phase='finale_survive';run.finale={phase:'survive',elapsed:0,alignProgress:0,dawnProgress:0,spawnTimer:2.4,eaterSpawned:false,completed:false};run.enemies.length=0;run.projectiles.length=0;}
export function updateFinale(run,dt,input={}){const f=run.finale;if(!f||dt<=0)return [];const e=[];
 if(f.phase==='survive'){
  const previous=f.elapsed;f.elapsed=Math.min(35,f.elapsed+dt);f.spawnTimer-=dt;
  if(f.spawnTimer<=0){f.spawnTimer+=2.4;e.push({type:'finale_spawn',enemy:run.rng()<.5?'wisp':'siren'});}
  if(!f.eaterSpawned&&previous<18&&f.elapsed>=18){f.eaterSpawned=true;e.push({type:'finale_spawn',enemy:'eater'});}
  if(f.elapsed>=35-1e-8){f.phase='fleet';f.elapsed=0;run.phase='finale_fleet';run.enemies.length=0;run.projectiles.length=0;run.player.integrity=Math.max(5,run.player.integrity);run.player.energy=run.player.maxEnergy;e.push({type:'finale_fleet'});}
 }else if(f.phase==='fleet'){
  f.elapsed+=dt;if(f.elapsed>=7-1e-8){f.phase='align';f.elapsed=0;run.phase='finale_align';run.player.overheatRemaining=0;run.player.needsRecharge=false;e.push({type:'finale_align_ready'});}
 }else if(f.phase==='align'){
  f.elapsed+=dt;const aligned=run.player.beamActive&&Math.abs(normalizedAngleDifference(run.player.beamAngle,-Math.PI/2))<=.24;
  f.alignProgress=clamp(f.alignProgress+(aligned?dt:-.8*dt),0,5);
  if(f.alignProgress>=5-1e-8){f.phase='dawn';f.elapsed=0;run.phase='finale_dawn';e.push({type:'finale_dawn'});}
 }else if(f.phase==='dawn'){
  f.elapsed+=dt;f.dawnProgress=clamp(f.elapsed/5,0,1);
  if(f.elapsed>=5-1e-8&&!f.completed){f.completed=true;e.push({type:'finale_completed'});}
 }
 return e;}
