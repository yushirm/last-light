import {CONFIG,ENEMIES,NIGHTS} from './config.js';
import {clamp,createRng,insideBeam,weightedChoice,normalizedAngleDifference,distanceSquared} from './math.js';
import {getComputedStats} from './upgrades.js';
import {createBoss,updateBoss,applyBossDamage,updateFinale} from './encounters.js';
const C=CONFIG.CENTER,TAU=Math.PI*2;
export {getComputedStats,createBoss as createEncounter};
export function createRun({night=1,mode='campaign',seed=0x12345678,workshop={}}={}){
 const run={mode,night:clamp(night,1,7),seed:seed>>>0,rng:createRng(seed),workshop:{lamp:workshop.lamp||0,battery:workshop.battery||0,stone:workshop.stone||0},phase:'idle',waveIndex:0,phaseElapsed:0,elapsedTotal:0,waveRemaining:0,bossElapsed:0,score:0,kills:0,rescuedShips:0,runStarlight:0,rewardsSettled:false,bossVictorySettled:false,spawnTimer:1.4,shipSpawnedThisWave:false,enemyId:0,lastStand:false,pipPresent:night<7,upgrades:{},enemies:[],projectiles:[],decoys:[],ships:[],stars:[],particles:[],boss:null,bossNight:night,finale:null,ability:{moth:0,disco:0,sweepRemaining:0,solarUsed:false},player:{integrity:10,maxIntegrity:10,energy:100,maxEnergy:100,beamAngle:-Math.PI/2,beamActive:false,overheatRemaining:0,needsRecharge:false,hitInvulnRemaining:0,damageFlash:0},ended:false};
 const stats=getComputedStats(run);run.player.maxIntegrity=stats.maxIntegrity;run.player.integrity=stats.maxIntegrity;run.player.maxEnergy=stats.maxEnergy;run.player.energy=stats.maxEnergy;return run;
}
export function startWave(run,waveIndex){run.phase='wave';run.waveIndex=waveIndex;run.phaseElapsed=0;run.waveRemaining=run.mode==='endless'?35:CONFIG.WAVE_DURATIONS[waveIndex-1];run.spawnTimer=1.4;run.shipSpawnedThisWave=false;run.enemies=[];run.projectiles=[];run.decoys=[];run.ships=[];run.stars=[];run.boss=null;run.lastStand=false;run.ability.solarUsed=false;run.player.beamActive=false;}
export function spawnEnemy(run,type='wisp',angle=run.rng()*TAU,opts={}){if(!ENEMIES[type]||run.enemies.length>=CONFIG.MAX_ENEMIES)return null;const d=ENEMIES[type];const factor=run.mode==='endless'?Math.min(2,1+.02*(run.waveIndex-1)):1+.05*(run.night-1);const r=opts.radius??CONFIG.SPAWN_RADIUS;
 const en={id:++run.enemyId,type,x:C.x+Math.cos(angle)*r,y:C.y+Math.sin(angle)*r,radius:d.radius,hp:d.hp*factor,maxHp:d.hp*factor,speed:d.speed,damage:d.damage,score:d.score,starlight:d.starlight,age:0,state:'normal',stateTimer:0,angleOffset:opts.angleOffset||0,seedPhase:run.rng()*TAU,pendingRemoval:false};run.enemies.push(en);return en;}
export function applyTowerDamage(run,amount){const p=run.player;if(p.integrity<=0||p.hitInvulnRemaining>0||run.phase==='finale_fleet'||run.phase==='finale_align'||run.phase==='finale_dawn')return false;p.integrity=Math.max(0,p.integrity-Math.max(0,amount));p.hitInvulnRemaining=.35;p.damageFlash=.35;return true;}
export function endWave(run){if(run.phase!=='wave')return false;run.phase='draft';run.score+=125;run.enemies=[];run.projectiles=[];run.decoys=[];run.ships=[];run.stars=[];return true;}
function angleFor(run){if(run.mode==='endless'){const n=Math.min(7,1+Math.floor((run.waveIndex-1)/2)),w=(run.waveIndex-1)%3;return NIGHTS[n-1].enemyPools[w];}return NIGHTS[run.night-1].enemyPools[run.waveIndex-1];}
function spawnPaced(run){const pool=angleFor(run);if(!pool)return;const count=run.waveIndex>=2?run.night>=5&&run.waveIndex>=3&&run.enemies.length<=16?3:2:1;
 for(let i=0;i<count&&run.enemies.length<CONFIG.MAX_ENEMIES;i++){let angle=run.rng()*TAU;for(let j=0;j<5;j++){if(run.enemies.every(a=>Math.abs(normalizedAngleDifference(Math.atan2(a.y-C.y,a.x-C.x),angle))>=.2))break;angle=run.rng()*TAU;}spawnEnemy(run,weightedChoice(run.rng,pool),angle);}
 const interval=run.mode==='endless'?Math.max(.85,2.6-.055*(run.waveIndex-1)):clamp(2.7-.12*(run.night-1)-.16*(run.waveIndex-1),1.25,2.7);run.spawnTimer=interval*(.82+.36*run.rng());}
function makeParticles(run,x,y,color,count=7){if(run.particles.length>=CONFIG.MAX_PARTICLES)return;for(let i=0;i<count&&run.particles.length<CONFIG.MAX_PARTICLES;i++){const a=run.rng()*TAU,s=10+run.rng()*30;run.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,age:0,life:.25+run.rng()*.45,color});}}
function kill(run,e,events){if(e.pendingRemoval)return;e.pendingRemoval=true;run.kills++;const extra=run.upgrades.lucky_stars||0;run.score+=e.score+extra*15;run.runStarlight+=e.starlight+extra;events.push({type:'enemy_killed',enemyType:e.type,x:e.x,y:e.y});makeParticles(run,e.x,e.y,'teal');if(e.type==='eater')run.player.energy=Math.min(run.player.maxEnergy,run.player.energy+5);
 if(e.type==='splitter'){
  const base=Math.atan2(C.y-e.y,C.x-e.x);for(const offset of [-.35,.35])if(run.enemies.length+run._queued.length<CONFIG.MAX_ENEMIES){run._queued.push({type:'shard',angle:Math.atan2(e.y-C.y,e.x-C.x)+offset,radius:Math.hypot(e.x-C.x,e.y-C.y),angleOffset:base+offset});}
 }
}
function applyBeam(run,dt,events){const p=run.player;if(!p.beamActive&&run.ability.sweepRemaining<=0)return;
 const stats=getComputedStats(run);const rays=p.beamActive?[{angle:p.beamAngle,factor:1},...(run.upgrades.prism_beam?[{angle:p.beamAngle-.29,factor:.45},{angle:p.beamAngle+.29,factor:.45}]:[])]:[];
 const sweep=run.ability.sweepRemaining>0?{angle:(run.ability.disco*TAU/1.2)%TAU,factor:.55}:null;
 for(const e of run.enemies){if(e.pendingRemoval)continue;let mult=0;for(const ray of rays)if(insideBeam(e,ray.angle,stats.halfAngle,CONFIG.BEAM_RANGE,C))mult+=ray.factor;if(sweep&&insideBeam(e,sweep.angle,stats.halfAngle,CONFIG.BEAM_RANGE,C))mult+=sweep.factor;
  if(mult>0){const amount=stats.dps*Math.min(1.6,mult)*dt*(e.type==='armoured'?.55:1);e.hp-=amount;if(e.type==='eater'&&p.beamActive)p.energy=Math.max(0,p.energy-3*dt);if(e.hp<=0)kill(run,e,events);}
 }
 for(const decoy of run.decoys)if(p.beamActive&&insideBeam(decoy,p.beamAngle,stats.halfAngle,CONFIG.BEAM_RANGE,C)){decoy.pendingRemoval=true;makeParticles(run,decoy.x,decoy.y,'teal',4);}
 for(const bolt of run.projectiles)if(p.beamActive&&insideBeam(bolt,p.beamAngle,stats.halfAngle,CONFIG.BEAM_RANGE,C)){bolt.pendingRemoval=true;makeParticles(run,bolt.x,bolt.y,'gold',3);}
 if(run.boss&&run.boss.hp>0&&p.beamActive){let mult=0;for(const ray of rays)if(insideBeam(run.boss,ray.angle,stats.halfAngle,CONFIG.BEAM_RANGE,C))mult+=ray.factor;if(sweep&&insideBeam(run.boss,sweep.angle,stats.halfAngle,CONFIG.BEAM_RANGE,C))mult+=sweep.factor;if(mult>0&&applyBossDamage(run,stats.dps*Math.min(1.6,mult)*dt))events.push({type:'boss_defeated',bossId:run.boss.id});}
}
function updateEnergy(run,dt,input,events){const p=run.player;const stats=getComputedStats(run);p.hitInvulnRemaining=Math.max(0,p.hitInvulnRemaining-dt);p.damageFlash=Math.max(0,p.damageFlash-dt);p.beamAngle=Number.isFinite(input?.angle)?input.angle:p.beamAngle;
 if(run.phase==='finale_align'){p.energy=p.maxEnergy;p.overheatRemaining=0;p.needsRecharge=false;p.beamActive=!!input?.isHeld;return;}
 if(run.phase==='finale_fleet'||run.phase==='finale_dawn'){p.beamActive=false;return;}
 if(p.overheatRemaining>0){p.overheatRemaining=Math.max(0,p.overheatRemaining-dt);p.energy=Math.min(p.maxEnergy,p.energy+stats.regen*dt);p.beamActive=false;return;}
 if(p.needsRecharge){p.beamActive=false;p.energy=Math.min(p.maxEnergy,p.energy+stats.regen*dt);if(p.energy>=CONFIG.REACTIVATE)p.needsRecharge=false;return;}
 if(input?.isHeld&&p.energy>0){p.energy=Math.max(0,p.energy-stats.drain*dt);p.beamActive=p.energy>0;if(!p.beamActive){p.overheatRemaining=CONFIG.OVERHEAT;p.needsRecharge=true;events.push({type:'energy_depleted'});}return;}
 p.beamActive=false;p.energy=Math.min(p.maxEnergy,p.energy+stats.regen*dt);
}
function processBossEvents(run,list,events){for(const e of list){if(e.type==='summon'){for(const [type,angle] of e.units)spawnEnemy(run,type,angle);}
 else if(e.type==='decoy'){const a=e.angle;run.decoys.push({x:C.x+180*Math.cos(a),y:C.y+180*Math.sin(a),radius:10,age:0,pendingRemoval:false});}
 else if(e.type==='bolts'&&run.boss){for(const offset of e.offsets){if(run.projectiles.length>=CONFIG.MAX_PROJECTILES)break;const b=run.boss,a=Math.atan2(C.y-b.y,C.x-b.x)+offset;run.projectiles.push({x:b.x,y:b.y,vx:Math.cos(a)*78,vy:Math.sin(a)*78,radius:6,damage:1,age:0,maxAge:5,pendingRemoval:false});}}
 else if(e.type==='gust'){run.player.beamAngle+=e.angle;events.push({type:'gust',angle:e.angle});}
 else if(e.type==='spawn_star'){const a=e.angle;run.stars.push({x:C.x+140*Math.cos(a),y:C.y+140*Math.sin(a),radius:11,age:0,progress:0,breakTime:0,pendingRemoval:false});}
 else if(e.type==='finale_spawn'){if(run.enemies.length<18)spawnEnemy(run,e.enemy,run.rng()*TAU);}
 else events.push(e);
 }}
export function updateSimulation(run,delta,input={}){const dt=clamp(delta,0,.05);if(dt===0||!['wave','boss','finale_survive','finale_fleet','finale_align','finale_dawn'].includes(run.phase)||run.ended)return [];const events=[];run.elapsedTotal+=dt;run.phaseElapsed+=dt;run._queued=[];
 updateEnergy(run,dt,input,events);
 const combat=['wave','boss','finale_survive'].includes(run.phase);
 if(run.phase==='wave'){
  run.waveRemaining=Math.max(0,run.waveRemaining-dt);run.spawnTimer-=dt;if(run.spawnTimer<=0&&run.waveRemaining>0)spawnPaced(run);
  if(!run.shipSpawnedThisWave&&run.phaseElapsed>=13){run.shipSpawnedThisWave=true;const a=run.rng()*TAU,r=120+run.rng()*43;run.ships.push({angle:a,orbitRadius:r,x:C.x+Math.cos(a)*r,y:C.y+Math.sin(a)*r,direction:run.rng()<.5?-1:1,radius:12,age:0,progress:0,breakTime:0,pendingRemoval:false});}
 }
 if(run.phase==='boss'){
  run.bossElapsed+=dt;if(run.bossElapsed>=75&&!run.lastStand){run.lastStand=true;if(run.boss?.hp>0)run.boss.hp=Math.min(run.boss.hp,run.boss.maxHp*.2);events.push({type:'last_stand'});}
 }
 if(combat){for(const e of run.enemies){e.age+=dt;let angle=Math.atan2(C.y-e.y,C.x-e.x);if(e.type==='drifter')angle+=Math.sin(e.age*2.1+e.seedPhase)*.32;if(e.type==='shard'&&e.age<.35)angle=e.angleOffset;
 let speed=e.speed;if(e.type==='siren'&&e.age%5<1.3)speed*=1.55;e.x+=Math.cos(angle)*speed*dt;e.y+=Math.sin(angle)*speed*dt;}
 for(const b of run.projectiles){b.x+=b.vx*dt;b.y+=b.vy*dt;b.age+=dt;}
 for(const d of run.decoys)d.age+=dt;
 }
 // Automatic assistance advances only while combat exists; rays remain supplementary.
 if(combat){run.ability.moth+=dt;run.ability.disco+=dt;
 if(run.upgrades.disco_lighthouse&&run.ability.disco>=18){run.ability.disco=0;run.ability.sweepRemaining=1.2;events.push({type:'disco'});}
 run.ability.sweepRemaining=Math.max(0,run.ability.sweepRemaining-dt);
 applyBeam(run,dt,events);
 if(run.upgrades.angry_moth&&run.pipPresent&&run.enemies.length&&run.ability.moth>=4.5-1e-8){run.ability.moth=0;const candidate=run.enemies.filter(x=>!x.pendingRemoval).sort((a,b)=>distanceSquared(a.x,a.y,C.x,C.y)-distanceSquared(b.x,b.y,C.x,C.y))[0];if(candidate){candidate.hp-=16;if(candidate.hp<=0)kill(run,candidate,events);events.push({type:'moth_zap',x:candidate.x,y:candidate.y});}}
 if(events.some(e=>e.type==='energy_depleted')&&run.upgrades.solar_overload&&!run.ability.solarUsed){run.ability.solarUsed=true;for(const e of run.enemies){if(!e.pendingRemoval&&Math.hypot(e.x-C.x,e.y-C.y)<=105){e.hp-=20;if(e.hp<=0)kill(run,e,events);}}events.push({type:'overload'});}
 for(const e of run.enemies){if(!e.pendingRemoval&&Math.hypot(e.x-C.x,e.y-C.y)<CONFIG.LIGHTHOUSE_RADIUS+e.radius*.4){e.pendingRemoval=true;if(applyTowerDamage(run,e.damage))events.push({type:'tower_hit',damage:e.damage});}}
 for(const b of run.projectiles){if(b.pendingRemoval)continue;if(b.age>=b.maxAge||Math.abs(b.x-C.x)>200||Math.abs(b.y-C.y)>200){b.pendingRemoval=true;continue;}if(distanceSquared(b.x,b.y,C.x,C.y)<(CONFIG.LIGHTHOUSE_RADIUS+b.radius)**2){b.pendingRemoval=true;if(applyTowerDamage(run,b.damage))events.push({type:'tower_hit',damage:b.damage});}}
 for(const s of run.ships){s.age+=dt;s.angle+=s.direction*.14*dt;s.x=C.x+Math.cos(s.angle)*s.orbitRadius;s.y=C.y+Math.sin(s.angle)*s.orbitRadius;if(run.player.beamActive&&insideBeam(s,run.player.beamAngle,getComputedStats(run).halfAngle,CONFIG.BEAM_RANGE,C)){s.progress+=dt;s.breakTime=0;}else{s.breakTime+=dt;if(s.breakTime>2)s.progress=Math.max(0,s.progress-dt*.7);}if(s.progress>=getComputedStats(run).rescueTime){s.pendingRemoval=true;run.rescuedShips++;run.score+=150;run.runStarlight+=10;run.player.energy=Math.min(run.player.maxEnergy,run.player.energy+getComputedStats(run).rescueEnergy);events.push({type:'ship_saved',x:s.x,y:s.y});makeParticles(run,s.x,s.y,'gold',10);}if(s.age>=15)s.pendingRemoval=true;}
 for(const star of run.stars){star.age+=dt;if(run.player.beamActive&&insideBeam(star,run.player.beamAngle,getComputedStats(run).halfAngle,CONFIG.BEAM_RANGE,C))star.progress+=dt;if(star.progress>=.5){star.pendingRemoval=true;run.player.energy=Math.min(run.player.maxEnergy,run.player.energy+22);run.runStarlight+=5;events.push({type:'star_saved',x:star.x,y:star.y});makeParticles(run,star.x,star.y,'gold');}if(star.age>=10)star.pendingRemoval=true;}
 if(run.phase==='boss'&&run.boss?.hp>0)processBossEvents(run,updateBoss(run,dt,run.rng),events);
 }
 if(run.phase.startsWith('finale_'))processBossEvents(run,updateFinale(run,dt,input),events);
 // Queue splitter offspring after current iteration, not during it.
 run.enemies=run.enemies.filter(e=>!e.pendingRemoval);for(const s of run._queued)spawnEnemy(run,s.type,s.angle,s);delete run._queued;
 run.projectiles=run.projectiles.filter(e=>!e.pendingRemoval);run.decoys=run.decoys.filter(e=>!e.pendingRemoval&&e.age<4);run.ships=run.ships.filter(e=>!e.pendingRemoval);run.stars=run.stars.filter(e=>!e.pendingRemoval);
 for(const p of run.particles){p.age+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;}run.particles=run.particles.filter(p=>p.age<p.life);
 // When simultaneous boss victory and tower contact occur, an already-won boss takes precedence.
 if(events.some(e=>e.type==='boss_defeated')){run.bossVictorySettled=true;run.score+=400;run.runStarlight+=30;run.enemies=[];run.projectiles=[];run.phase='boss_won';return events;}
 if(combat&&run.player.integrity<=0){run.phase='defeated';run.ended=true;events.push({type:'run_defeated'});return events;}
 if(run.phase==='wave'&&run.waveRemaining<=0){endWave(run);events.push({type:'wave_finished',waveIndex:run.waveIndex});}
 return events;
}
