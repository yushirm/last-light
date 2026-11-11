import {CONFIG,UPGRADES,WORKSHOP_COSTS} from './config.js';
export function getComputedStats(run){const p=run.player,u=run.upgrades;return {dps:(CONFIG.BASE_DPS+3*(run.workshop.lamp||0))*(1+.2*(u.focused_lens||0)),halfAngle:CONFIG.BEAM_HALF_ANGLE+.045*(u.wide_lens||0),maxEnergy:CONFIG.MAX_ENERGY+10*(run.workshop.battery||0)+20*(u.battery_bank||0),regen:CONFIG.REGEN+4*(u.quick_charge||0)+(run.lastStand?8:0),drain:Math.max(10,CONFIG.DRAIN-2*(u.efficient_filament||0)),maxIntegrity:CONFIG.MAX_INTEGRITY+(run.workshop.stone||0)+2*(u.reinforced_walls||0),rescueTime:Math.max(.7,1.2-.25*(u.mercy_light||0)),rescueEnergy:8+4*(u.mercy_light||0)};}
export function makeDraft(run,rng=run.rng){const eligible=Object.keys(UPGRADES).filter(k=>(run.upgrades[k]||0)<UPGRADES[k].maxLevel&&!(run.night===7&&k==='angry_moth'));const out=[];
 const defenses=eligible.filter(k=>['battery_bank','quick_charge','efficient_filament','reinforced_walls','mercy_light'].includes(k));
 if(defenses.length)out.push(defenses[Math.floor(rng()*defenses.length)]);
 while(out.length<3&&eligible.length>out.length){const k=eligible[Math.floor(rng()*eligible.length)];if(!out.includes(k))out.push(k);}
 for(const fallback of ['emergency_repair','energy_cell'])if(out.length<3)out.push(fallback);
 return out;}
export function getUpgradeDescription(id){if(id==='emergency_repair')return 'Restore 2 integrity.';if(id==='energy_cell')return 'Restore 40 light.';return UPGRADES[id]?.description||'';}
export function applyUpgrade(run,id){if(id==='emergency_repair'){run.player.integrity=Math.min(run.player.maxIntegrity,run.player.integrity+2);return true;}
 if(id==='energy_cell'){run.player.energy=Math.min(run.player.maxEnergy,run.player.energy+40);return true;}
 const u=UPGRADES[id];if(!u||(run.upgrades[id]||0)>=u.maxLevel||(run.night===7&&id==='angry_moth'))return false;
 run.upgrades[id]=(run.upgrades[id]||0)+1;
 const p=run.player,stats=getComputedStats(run);
 p.maxEnergy=stats.maxEnergy;p.maxIntegrity=stats.maxIntegrity;
 if(id==='battery_bank')p.energy=Math.min(p.maxEnergy,p.energy+20);
 if(id==='reinforced_walls')p.integrity=Math.min(p.maxIntegrity,p.integrity+2);
 return true;}
export function buyWorkshopUpgrade(save,id){const level=save.economy.workshop[id];if(!Number.isInteger(level)||level>=3||level<0)return false;const cost=WORKSHOP_COSTS[level];if(save.economy.bankedStarlight<cost)return false;save.economy.bankedStarlight-=cost;save.economy.workshop[id]++;return true;}
