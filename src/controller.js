import {NIGHTS,CONFIG,BOSSES} from './config.js';
import {STORY} from './story.js';
import {createRun,startWave,updateSimulation} from './simulation.js';
import {createBoss,startFinale} from './encounters.js';
import {makeDraft,applyUpgrade,buyWorkshopUpgrade} from './upgrades.js';
import {makeDefaultSave,loadSave,writeSave,resetSave} from './storage.js';
import {awardAchievement,ACHIEVEMENTS} from './achievements.js';
import {settleRun} from './progression.js';
import {clamp} from './math.js';
import {Renderer} from './renderer.js';
import {InputManager} from './input.js';
import {ScreenManager} from './screens.js';
import {AudioManager} from './audio.js';
const PLAY=['PLAYING','BOSS_PLAYING','FINALE_FLEET','FINALE_ALIGN','FINALE_DAWN'];
export class GameController {
 constructor({canvas,overlay}={}){this.save=loadSave();this.canvas=canvas;this.renderer=new Renderer(canvas,this.save.settings);this.audio=new AudioManager(this.save.settings);this.run=null;this.view='BOOT';this.returnTo='TITLE';this.pausedFrom=null;this.lastTimestamp=null;this.lastHud=0;this.countdown=0;this.screens=new ScreenManager(overlay,this.handlers());this.screens.setSettings(this.save.settings);this.input=new InputManager(canvas,this.renderer,event=>{if(event==='pause')this.pause();});this.hidden=()=>{if(document.hidden){this.input.releaseAll();if(this.view==='COUNTDOWN'||PLAY.includes(this.view))this.pause();this.audio.pause();}};document.addEventListener('visibilitychange',this.hidden);this.tick=this.tick.bind(this);}
 handlers(){return {title:()=>this.goToTitle(),continueStory:()=>this.continueStory(),nightSelect:()=>this.nightSelect(),startNight:n=>this.startNight(n),startEndless:()=>this.startEndless(),workshop:()=>this.openMenu('WORKSHOP'),journal:()=>this.openMenu('JOURNAL'),howToPlay:()=>this.openMenu('HOW_TO_PLAY'),settings:()=>this.openMenu('SETTINGS'),back:()=>this.back(),pause:()=>this.pause(),resume:()=>this.resume(),restart:()=>this.restart(),chooseUpgrade:id=>this.chooseUpgrade(id),faceBoss:()=>this.faceBoss(),nextNight:()=>this.nextNight(),buyUpgrade:id=>this.buyUpgrade(id),setting:(k,v)=>this.changeSetting(k,v),reset:()=>this.reset(),reread:n=>this.reread(n)};}
 boot(){this.setView('TITLE',{save:this.save});requestAnimationFrame(this.tick);}
 setView(view,payload={}){this.view=view;this.input.setEnabled(PLAY.includes(view));this.screens.show(view,payload);if(!PLAY.includes(view))this.audio.pause();}
 title(){this.goToTitle();}
 goToTitle(){if(this.run?.mode==='endless'&&!this.run.rewardsSettled){settleRun(this.save,this.run,'quit');writeSave(this.save);}this.run=null;this.pausedFrom=null;this.setView('TITLE',{save:this.save});}
 continueStory(){const target=NIGHTS.find(n=>!this.save.campaign.completedNights.includes(n.id)&&n.id<=this.save.campaign.highestUnlockedNight);this.startNight(target?.id||7);}
 nightSelect(){this.setView('NIGHT_SELECT',{save:this.save});}
 startNight(night){if(!Number.isInteger(night)||night<1||night>7||night>this.save.campaign.highestUnlockedNight)return;this.audio.unlock();this.save.stats.totalRuns++;writeSave(this.save);
 this.run=createRun({night,mode:'campaign',seed:Date.now()>>>0,workshop:this.save.economy.workshop});this.run.totalRescuesAtStart=this.save.stats.totalRescues;
 this.showStory(`night_${night}_intro`,()=>{if(night===1&&this.save.stats.totalRuns===1)this.setView('HOW_TO_PLAY',{onDone:()=>this.startCountdown()});else this.startCountdown();});}
 startEndless(){if(!this.save.campaign.campaignComplete)return;this.audio.unlock();this.save.stats.totalRuns++;writeSave(this.save);this.run=createRun({night:1,mode:'endless',seed:Date.now()>>>0,workshop:this.save.economy.workshop});this.startCountdown();}
 startCountdown(){if(!this.run)return;this.countdown=CONFIG.COUNTDOWN;this.run.phase='countdown';this.setView('COUNTDOWN');document.getElementById('countdown').hidden=false;document.getElementById('countdown').textContent='3';}
 beginWave(index){startWave(this.run,index);document.getElementById('countdown').hidden=true;this.setView('PLAYING');this.screens.updateHud(this.run);}
 showStory(key,onDone){const cards=STORY[key];if(!cards?.length){onDone?.();return;}this.setView('STORY',{cards,onDone});}
 pause(){if(this.view==='PAUSED')return;if(!PLAY.includes(this.view)&&this.view!=='COUNTDOWN')return;this.pausedFrom=this.view;this.input.releaseAll();document.getElementById('countdown').hidden=true;this.setView('PAUSED');}
 resume(){if(this.view!=='PAUSED')return;const prev=this.pausedFrom||'PLAYING';this.pausedFrom=null;if(prev==='COUNTDOWN'){this.setView('COUNTDOWN');document.getElementById('countdown').hidden=false;}else this.setView(prev);}
 restart(){if(!this.run)return;const mode=this.run.mode,night=this.run.night;if(mode==='endless')this.startEndless();else this.startNight(night);}
 openMenu(name){this.returnTo=this.view;this.setView(name,{save:this.save,onDone:()=>this.back()});}
 back(){const where=this.returnTo;this.returnTo='TITLE';if(where==='PAUSED'&&this.run)this.setView('PAUSED');else if(where==='NIGHT_SELECT')this.nightSelect();else if(where==='JOURNAL')this.setView('JOURNAL',{save:this.save});else this.goToTitle();}
 reread(n){let cards=[...STORY[`night_${n}_intro`],...STORY[`night_${n}_boss_intro`]];if(n===7)cards.push(...STORY.night_7_fleet,...STORY.night_7_align,...STORY.night_7_epilogue);else cards.push(...STORY[`night_${n}_victory`]);this.setView('STORY',{cards,onDone:()=>this.setView('JOURNAL',{save:this.save})});}
 changeSetting(key,value){if(!Object.hasOwn(this.save.settings,key))return;this.save.settings[key]=value;this.screens.setSettings(this.save.settings);this.renderer.settings=this.save.settings;this.audio.setSettings(this.save.settings);writeSave(this.save);}
 reset(){this.save=resetSave();this.run=null;this.screens.setSettings(this.save.settings);this.renderer.settings=this.save.settings;this.audio.setSettings(this.save.settings);this.goToTitle();this.screens.toast('A fresh adventure awaits.');}
 buyUpgrade(id){if(buyWorkshopUpgrade(this.save,id)){awardAchievement(this.save,'shipwright');writeSave(this.save);this.audio.unlock();this.audio.play('upgrade');this.screens.show('WORKSHOP',{save:this.save});this.screens.toast('FINCH: That should hold a little longer.');}else this.screens.toast('Not enough banked starlight yet. Rescue ships and survive nights to earn more.');}
 startDraft(){if(this.run.mode==='endless'&&this.run.waveIndex>=12){this.run.score+=1;this.beginWave(this.run.waveIndex+1);return;}this.run.phase='draft';const offers=makeDraft(this.run);this.setView('DRAFT',{run:this.run,offers});}
 chooseUpgrade(id){if(this.view!=='DRAFT'||!this.run)return;if(!applyUpgrade(this.run,id))return;this.audio.play('upgrade');this.screens.toast(`${id.replaceAll('_',' ').toUpperCase()} READY`);
 const r=this.run;if(r.mode==='campaign'&&r.waveIndex>=3)this.bossIntro();else this.beginWave(r.waveIndex+1);}
 bossIntro(){const r=this.run;const night=r.mode==='endless'?(1+Math.floor((r.waveIndex/5-1)%6)):r.night;r.bossNight=night;
 if(r.mode==='endless'){this.setView('BOSS_INTRO',{night});}else this.showStory(`night_${r.night}_boss_intro`,()=>this.setView('BOSS_INTRO',{night:r.night}));}
 faceBoss(){const r=this.run;if(!r)return;this.audio.unlock();this.audio.play('boss_intro');r.phase='boss';r.phaseElapsed=0;r.bossElapsed=0;r.lastStand=false;r.ability.solarUsed=false;r.enemies=[];r.projectiles=[];r.ships=[];r.stars=[];r.decoys=[];r.player.beamActive=false;
 if(r.mode==='campaign'&&r.night===7){startFinale(r);this.setView('BOSS_PLAYING');}else{r.boss=createBoss(r.bossNight);this.setView('BOSS_PLAYING');}}
 nextNight(){if(this.run?.mode==='campaign'){if(this.run.night===7){this.setView('ENDING');return;}this.startNight(this.run.night+1);}else this.goToTitle();}
 finishNight(outcome){const r=this.run;if(!r||r.rewardsSettled)return;const award=settleRun(this.save,r,outcome);writeSave(this.save);
 if(r.mode==='endless'){this.setView('ENDLESS_GAME_OVER',{run:r,save:this.save});return;}
 if(outcome==='victory'){
  if(r.night===7){r.pipPresent=true;this.showStory('night_7_epilogue',()=>this.setView('ENDING'));}
  else{if(r.night===6)r.pipPresent=false;this.showStory(`night_${r.night}_victory`,()=>this.setView('VICTORY',{run:r,awarded:award}));}
 }else this.setView('DEFEAT',{run:r,awarded:award});}
 handleEvent(e){const r=this.run;if(!r)return;
 switch(e.type){
  case 'wave_finished':if(r.mode==='endless'&&r.waveIndex%5===0)this.bossIntro();else this.startDraft();break;
  case 'boss_defeated':this.audio.play('boss_defeated');if(r.mode==='endless')this.startDraft();else this.finishNight('victory');break;
  case 'run_defeated':this.audio.play('tower_hit');this.finishNight('defeat');break;
  case 'finale_fleet':this.showStory('night_7_fleet',()=>this.setView('FINALE_FLEET'));break;
  case 'finale_align_ready':this.showStory('night_7_align',()=>this.setView('FINALE_ALIGN'));break;
  case 'finale_dawn':this.audio.play('dawn');this.setView('FINALE_DAWN');break;
  case 'finale_completed':r.score+=800;r.runStarlight+=50;this.finishNight('victory');break;
  case 'tower_hit':this.audio.play('tower_hit');break;
  case 'enemy_killed':this.audio.play('enemy_pop');if(awardAchievement(this.save,'first_light')){writeSave(this.save);this.screens.toast('★ FIRST LIGHT');}break;
  case 'ship_saved':this.audio.play('ship_saved');if(awardAchievement(this.save,'safe_harbour')){writeSave(this.save);this.screens.toast('★ SAFE HARBOUR');}if(this.save.stats.totalRescues+r.rescuedShips>=10&&awardAchievement(this.save,'fleet_keeper'))writeSave(this.save);break;
  case 'star_saved':this.audio.play('star_saved');this.screens.toast('STARLIGHT RESTORED');break;
  case 'gust':this.audio.play('gust');this.screens.toast('GUST!');break;
  case 'boss_telegraph':this.audio.play('boss_intro');if(e.bossId==='tempest')this.screens.toast('GUST INCOMING');break;
  case 'last_stand':this.screens.toast('LAST STAND');break;
  default:break;
 }
 }
 tick(timestamp){const dt=this.lastTimestamp===null?0:clamp((timestamp-this.lastTimestamp)/1000,0,.05);this.lastTimestamp=timestamp;
 if(this.run&&!document.hidden){if(this.view==='COUNTDOWN'){this.countdown=Math.max(0,this.countdown-dt);document.getElementById('countdown').textContent=String(Math.max(1,Math.ceil(this.countdown)));if(this.countdown===0)this.beginWave(this.run.waveIndex+1||1);}
 else if(PLAY.includes(this.view)){
  const events=updateSimulation(this.run,dt,this.input.getSnapshot(dt));
  if(this.run.mode==='endless'&&this.run.waveIndex>12)this.run.score+=dt;
  // Events are consumed in order. A state transition freezes subsequent updates.
  for(const e of events){this.handleEvent(e);if(!PLAY.includes(this.view))break;}
  if(this.run?.mode==='endless'&&this.run.waveIndex>=5&&awardAchievement(this.save,'again_again'))writeSave(this.save);
  this.audio.updateAmbient(dt,this.run?.phase||'');
 }
 }
 this.renderer.render(this.run,this.view,timestamp);
 if(this.run&&PLAY.includes(this.view)&&timestamp-this.lastHud>90){this.screens.updateHud(this.run);this.lastHud=timestamp;}
 requestAnimationFrame(this.tick);
 }
}
