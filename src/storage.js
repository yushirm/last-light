import {SAVE_KEY} from './config.js';
import {ACHIEVEMENTS} from './achievements.js';
const integer=(v,min=0,max=1e9)=>Number.isFinite(v)?Math.max(min,Math.min(max,Math.floor(v))):min;
export function makeDefaultSave(){return {schemaVersion:1,campaign:{highestUnlockedNight:1,campaignComplete:false,completedNights:[],nightBestScores:Object.fromEntries(Array.from({length:7},(_,i)=>[i+1,0])),nightClearCounts:Object.fromEntries(Array.from({length:7},(_,i)=>[i+1,0]))},economy:{bankedStarlight:0,workshop:{lamp:0,battery:0,stone:0}},stats:{totalRescues:0,totalKills:0,totalRuns:0,totalNightVictories:0,endlessBestScore:0,endlessBestWave:0,endlessLongestSeconds:0},achievements:[],settings:{soundEnabled:true,sfxVolume:60,ambientEnabled:true,reducedMotion:false,highContrast:false}};}
export function validateSave(candidate){const d=makeDefaultSave();if(!candidate||candidate.schemaVersion!==1||typeof candidate!=='object')return d;
 const c=candidate.campaign||{},e=candidate.economy||{},s=candidate.stats||{},z=candidate.settings||{};
 d.campaign.completedNights=[...new Set((Array.isArray(c.completedNights)?c.completedNights:[]).filter(n=>Number.isInteger(n)&&n>=1&&n<=7))].sort((a,b)=>a-b);
 for(let i=1;i<=7;i++){d.campaign.nightBestScores[i]=integer(c.nightBestScores?.[i]);d.campaign.nightClearCounts[i]=integer(c.nightClearCounts?.[i]);}
 // A complete chapter cannot unlock two chapters forward unless the preceding chapters are complete.
 let contiguous=0;while(d.campaign.completedNights.includes(contiguous+1))contiguous++;
 d.campaign.highestUnlockedNight=Math.max(1,Math.min(7,contiguous+1));
 d.campaign.campaignComplete=contiguous===7;
 d.economy.bankedStarlight=integer(e.bankedStarlight);
 for(const k of ['lamp','battery','stone'])d.economy.workshop[k]=integer(e.workshop?.[k],0,3);
 for(const k of Object.keys(d.stats))d.stats[k]=integer(s[k]);
 d.achievements=[...new Set((Array.isArray(candidate.achievements)?candidate.achievements:[]).filter(k=>typeof k==='string'&&Object.hasOwn(ACHIEVEMENTS,k)))];
 for(const k of ['soundEnabled','ambientEnabled','reducedMotion','highContrast'])if(typeof z[k]==='boolean')d.settings[k]=z[k];
 if(Number.isFinite(z.sfxVolume))d.settings.sfxVolume=integer(z.sfxVolume,0,100);
 return d;
}
export function getStorage(){try{return typeof globalThis.localStorage==='undefined'?null:globalThis.localStorage;}catch{return null;}}
export function loadSave(storage=getStorage()){try{const raw=storage?.getItem(SAVE_KEY);return raw?validateSave(JSON.parse(raw)):makeDefaultSave();}catch{return makeDefaultSave();}}
export function writeSave(save,storage=getStorage()){try{if(!storage)return false;storage.setItem(SAVE_KEY,JSON.stringify(validateSave(save)));return true;}catch{return false;}}
export function resetSave(storage=getStorage()){const d=makeDefaultSave();writeSave(d,storage);return d;}
