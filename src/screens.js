import {NIGHTS,BOSSES,UPGRADES,WORKSHOP,WORKSHOP_COSTS} from './config.js';
import {STORY,JOURNAL} from './story.js';
import {ACHIEVEMENTS} from './achievements.js';
const el=(tag,cls='',text='')=>{const a=document.createElement(tag);if(cls)a.className=cls;if(text!==undefined)a.textContent=String(text);return a;};
const add=(parent,...kids)=>{parent.append(...kids);return parent;};
export class ScreenManager {
 constructor(root,handlers){this.root=root;this.handlers=handlers;this.hud=document.getElementById('hud');this.toastElement=document.getElementById('toast');this.current='BOOT';this.settings={};document.getElementById('pause-button').addEventListener('click',()=>handlers.pause());}
 setSettings(settings){this.settings={...settings};document.body.classList.toggle('high-contrast',!!settings.highContrast);document.body.classList.toggle('reduced-motion',!!settings.reducedMotion);}
 button(label,fn,cls=''){const b=el('button',`button ${cls}`,label);b.type='button';b.addEventListener('click',fn);return b;}
 panel(title,sub=''){const p=el('section','panel'),h=el('h2','panel-title',title);add(p,h);if(sub)add(p,el('p','panel-subtitle',sub));return p;}
 actions(panel,items){const box=el('div','button-stack');for(const [name,cb,cl] of items)box.append(this.button(name,cb,cl||''));panel.append(box);}
 show(view,payload={}){
  this.current=view;this.payload=payload;this.root.replaceChildren();const gameplay=['COUNTDOWN','PLAYING','BOSS_PLAYING','FINALE_FLEET','FINALE_ALIGN','FINALE_DAWN'].includes(view);this.root.hidden=gameplay;this.hud.hidden=!gameplay;if(gameplay)return;
  let p;
  switch(view){
   case 'TITLE':{
    p=this.panel('LAST LIGHT','A tiny lighthouse. An endless ocean. Seven nights to bring back the Sun.');p.classList.add('title-panel');p.prepend(el('div','title-symbol','THE KEEPER’S LOG'));
    const s=payload.save,complete=s.campaign.campaignComplete;this.actions(p,[
     [s.stats.totalRuns?'CONTINUE STORY':'START STORY',()=>this.handlers.continueStory(),'primary'],
     ['CHOOSE A NIGHT',()=>this.handlers.nightSelect()],
     [`ENDLESS${complete?'':' · LOCKED'}`,()=>this.handlers.startEndless(),complete?'':'locked'],
     ['WORKSHOP',()=>this.handlers.workshop()],['JOURNAL',()=>this.handlers.journal()],['HOW TO PLAY',()=>this.handlers.howToPlay()],['SETTINGS',()=>this.handlers.settings()]
    ]);
    if(!complete){const b=[...p.querySelectorAll('button')].find(b=>b.textContent.startsWith('ENDLESS'));b.disabled=true;}
    p.append(el('p','fineprint',`Best endless score: ${s.stats.endlessBestScore.toLocaleString()}  •  A small game about finding your way home.`));break;}
   case 'NIGHT_SELECT':{
    p=this.panel('THE NIGHT CHART','Seven watches between the sea and the dawn.');p.classList.add('chart-panel');const list=el('div','scroll-list');const save=payload.save;
    for(const n of NIGHTS){const unlocked=n.id<=save.campaign.highestUnlockedNight,done=save.campaign.completedNights.includes(n.id),card=el('button','night-card');card.type='button';card.disabled=!unlocked;
     add(card,el('span','night-index',String(n.id).padStart(2,'0')),el('span','small-label',`WATCH ${n.id}   /   ${done?'COMPLETE':unlocked?'AVAILABLE':'UNEXPLORED'}`),el('strong','',n.title),el('span','night-description',n.subtitle),el('span','small-label',done?`BEST ${save.campaign.nightBestScores[n.id].toLocaleString()}`:''));card.addEventListener('click',()=>this.handlers.startNight(n.id));list.append(card);}
    p.append(list);this.actions(p,[['WORKSHOP',()=>this.handlers.workshop()],['BACK',()=>this.handlers.title()]]);break;}
   case 'HOW_TO_PLAY':{
    p=this.panel('KEEP THE LIGHT','One finger. One lighthouse. One very long night.');const arr=[['AIM','Press or touch the ocean and drag to point the beam.'],['SHINE','Hold to light up shadows. The beam uses energy.'],['BREATHE','Release to recharge. Rescue golden ships by holding the light on them.'],['WATCH','Protect your lighthouse through three waves, choose upgrades, then face the night.']];const cards=el('div','help-cards');for(const [name,description] of arr)add(cards,add(el('article','help-card'),el('span','help-icon',name==='AIM'?'⌖':name==='SHINE'?'☀':name==='BREATHE'?'◌':'✦'),el('strong','',name),el('p','',description)));p.append(cards,el('p','fineprint','Keyboard: A / D or arrows to aim, hold Space to shine, P to pause.'));this.actions(p,[['GOT IT',()=>payload.onDone?payload.onDone():this.handlers.title(),'primary']]);break;}
   case 'STORY':{
    const i=payload.index||0,card=payload.cards?.[i];if(!card){payload.onDone?.();return;}
    p=this.panel('FROM THE LOGBOOK');p.classList.add('story-panel');p.append(el('div',`speaker speaker-${card.speaker.toLowerCase().replace(/\s+/g,'-')}`,card.speaker),el('p','dialogue',card.text),el('p','fineprint',`${i+1} / ${payload.cards.length}`));this.actions(p,[['CONTINUE',()=>this.show('STORY',{...payload,index:i+1}),'primary'],['SKIP',()=>payload.onDone?.()]]);break;}
   case 'DRAFT':{
    p=this.panel('ADJUST THE LANTERN','Choose an improvement for the remainder of this watch.');p.append(el('p','speaker',payload.run.night===7?'FINCH: For the light.':'PIP: A tactical improvement. I approve.'));const cards=el('div','draft-cards');let selected=false;
    for(const id of payload.offers){const def=UPGRADES[id],title=def?.title||id.replaceAll('_',' ').toUpperCase(),level=(payload.run.upgrades[id]||0)+1,cap=def?.maxLevel||1;const b=this.button('',()=>{if(selected)return;selected=true;this.handlers.chooseUpgrade(id);},'draft-card');add(b,el('strong','',title),el('span','',def?.description||(id==='energy_cell'?'Restore 40 light.':'Heal 2 integrity.')),el('span','small-label',`LV ${level}/${cap}`),el('span','choose-label','CHOOSE'));cards.append(b);}p.append(cards);break;}
   case 'BOSS_INTRO':{
    const d=BOSSES[payload.night];p=this.panel('SOMETHING IN THE FOG',d.name);p.classList.add('boss-panel');p.append(el('div','boss-illustration','✦'),el('p','',payload.night===7?'You cannot defeat what must be understood.':'Read the warning rings and hold the light steady.'));this.actions(p,[['FACE THE DARK',()=>this.handlers.faceBoss(),'primary']]);break;}
   case 'PAUSED':{
    p=this.panel('PAUSED','The waves and creatures are frozen.');p.append(el('p','fineprint','Progress is saved after each completed night. Restarting will abandon this attempt.'));this.actions(p,[['RESUME',()=>this.handlers.resume(),'primary'],['RESTART NIGHT',()=>this.confirm(p,'Restart this night?','Your current attempt will be lost.',()=>this.handlers.restart(),'YES, RESTART NIGHT')],['SETTINGS',()=>this.handlers.settings()],['QUIT TO TITLE',()=>this.confirm(p,'Leave this night?','Your current attempt will be lost.',()=>this.handlers.title(),'YES, ABANDON ATTEMPT')]]);break;}
   case 'VICTORY':{
    const r=payload.run;p=this.panel('DAWN IS ONE NIGHT CLOSER',`Night ${r.night} complete. The light carries on.`);this.results(p,r,payload.awarded);this.actions(p,[['NEXT NIGHT',()=>this.handlers.nextNight(),'primary'],['TITLE',()=>this.handlers.title()]]);break;}
   case 'DEFEAT':{
    const r=payload.run;p=this.panel('THE LIGHT WENT OUT',r.night===7?'The beacon fell before the fleet could find it. The sea will give you another chance.':r.boss?'The darkness reached the lantern. You can try the night again.':'The lighthouse went dark. The night is not over yet.');this.results(p,r,payload.awarded);this.actions(p,[['TRY AGAIN',()=>this.handlers.restart(),'primary'],['TITLE',()=>this.handlers.title()]]);break;}
   case 'ENDLESS_GAME_OVER':{
    const r=payload.run;p=this.panel('THE WATCH ENDS','The last light faded, but your watch will be remembered.');this.results(p,r,0);p.append(el('p','fineprint',`Best: ${payload.save.stats.endlessBestScore.toLocaleString()}   •   Furthest wave: ${payload.save.stats.endlessBestWave}`));this.actions(p,[['TRY AGAIN',()=>this.handlers.startEndless(),'primary'],['TITLE',()=>this.handlers.title()]]);break;}
   case 'ENDING':{
    p=this.panel('THE END','And also, a beginning.');p.classList.add('ending-panel');p.prepend(el('div','ending-sun','☀'));p.append(el('p','dialogue','Thank you for keeping the light on.'));this.actions(p,[['PLAY ENDLESS',()=>this.handlers.startEndless(),'primary'],['BACK TO TITLE',()=>this.handlers.title()]]);break;}
   case 'WORKSHOP':{
    const s=payload.save;p=this.panel('THE LAMP ROOM','Keep the old machinery turning.');p.classList.add('workshop-panel');p.append(el('div','workshop-picture','✦'),el('p','currency',`BANKED STARLIGHT   ${s.economy.bankedStarlight}`),el('p','fineprint',s.campaign.highestUnlockedNight>=7?'FINCH: Pip would tell me to check the batteries first.':'PIP: Everything here is technically repairable. Some of it is even meant to be repaired.'));
    for(const [id,d] of Object.entries(WORKSHOP)){const level=s.economy.workshop[id],cost=WORKSHOP_COSTS[level],card=el('div','workshop-row');const text=add(el('div',''),el('strong','',d.title),el('span','small-label',`LV ${level}/3   •   ${d.description}`));const b=this.button(level===3?'MAXED':`UPGRADE FOR ${cost}`,()=>this.handlers.buyUpgrade(id));b.disabled=level>=3||s.economy.bankedStarlight<cost;card.append(text,b);p.append(card);}this.actions(p,[['BACK',()=>this.handlers.back()]]);break;}
   case 'JOURNAL':{
    const s=payload.save;p=this.panel('THE KEEPER’S LOG',`Ships guided home: ${s.stats.totalRescues}.`);p.classList.add('journal-panel');const list=el('div','scroll-list');for(const n of NIGHTS){const unlocked=s.campaign.completedNights.includes(n.id),j=JOURNAL[`night_${n.id}_journal`],entry=el('article','journal-entry');add(entry,el('span','journal-serial',`ENTRY ${String(n.id).padStart(2,'0')}`),el('strong','',unlocked?j.title:n.id<=s.campaign.highestUnlockedNight?n.title:'???'),el('p','',unlocked?j.body:'Complete this night to uncover its story.'));if(unlocked){const b=this.button('REREAD THE STORY',()=>this.handlers.reread(n.id));entry.append(b);}list.append(entry);}p.append(list,el('h3','minor-title','A FEW BRIGHT STARS'));for(const [id,[name,description]] of Object.entries(ACHIEVEMENTS)){p.append(el('p','achievement',`${s.achievements.includes(id)?'★':'☆'}  ${name}: ${description}`));}this.actions(p,[['BACK',()=>this.handlers.back()]]);break;}
   case 'SETTINGS':{
    p=this.panel('SETTINGS','Make the lighthouse yours.');const save=payload.save;
    for(const [key,title] of [['soundEnabled','SOUND'],['ambientEnabled','AMBIENT MUSIC'],['reducedMotion','REDUCED MOTION'],['highContrast','HIGH CONTRAST']]){const row=el('label','settings-row');const check=el('input');check.type='checkbox';check.checked=!!save.settings[key];check.addEventListener('change',()=>this.handlers.setting(key,check.checked));row.append(el('span','',title),check);p.append(row);}
    const row=el('label','settings-row');row.append(el('span','','SOUND EFFECTS VOLUME'));const slider=el('input');slider.type='range';slider.min='0';slider.max='100';slider.value=save.settings.sfxVolume;slider.addEventListener('input',()=>this.handlers.setting('sfxVolume',Number(slider.value)));row.append(slider);p.append(row);p.append(this.button('RESET PROGRESS',()=>this.confirm(p,'Start over?','This will permanently remove your completed nights, upgrades, scores and settings from this browser.',()=>this.handlers.reset())));this.actions(p,[['BACK',()=>this.handlers.back(),'primary']]);break;}
   default:p=this.panel('THE LIGHTHOUSE','Something unexpected happened.');this.actions(p,[['TITLE',()=>this.handlers.title()]]);
  }
  this.root.append(p);p.querySelector('button:not([disabled])')?.focus({preventScroll:true});
 }
 results(p,r,awarded=0){const grid=el('div','stats-grid');for(const [label,value] of [['SCORE',r.score.toLocaleString()],['SHIPS GUIDED',r.rescuedShips],['STARLIGHT EARNED',`${r.runStarlight} (banked +${awarded})`],['WAVES SURVIVED',r.waveIndex]])add(grid,add(el('div','stat'),el('span','small-label',label),el('strong','',value)));p.append(grid);}
 confirm(parent,title,description,yes,confirmText='YES, RESET EVERYTHING'){const shade=el('div','confirm-shade'),card=add(el('div','confirm-panel'),el('h3','',title),el('p','',description));this.actions(card,[['KEEP MY PROGRESS',()=>shade.remove()],[confirmText,()=>{shade.remove();yes();},'danger']]);shade.append(card);parent.append(shade);shade.querySelector('button')?.focus();}
 updateHud(run){const p=run.player;document.getElementById('hud-night').textContent=run.mode==='endless'?`ENDLESS • WAVE ${run.waveIndex}`:`NIGHT ${run.night} • ${run.phase==='wave'?`WAVE ${run.waveIndex}/3`:run.phase.startsWith('finale_')?'THE FINAL NIGHT':'ENCOUNTER'}`;document.getElementById('hud-score').textContent=`SCORE ${run.score.toLocaleString()}`;
  document.getElementById('hud-integrity').textContent=`${p.integrity}/${p.maxIntegrity}`;document.getElementById('hud-light').textContent=`${Math.round(p.energy)}/${p.maxEnergy}`;document.getElementById('hud-light-bar').style.width=`${100*p.energy/p.maxEnergy}%`;document.getElementById('hud-starlight').textContent=`STARLIGHT ${run.runStarlight}`;
  document.getElementById('hud-time').textContent=run.phase==='wave'?`${Math.ceil(run.waveRemaining)}s`:run.phase==='finale_survive'?`SURVIVE ${Math.ceil(35-run.finale.elapsed)}s`:run.phase==='finale_align'?'ALIGN THE LIGHT':run.phase==='boss'&&run.lastStand?'LAST STAND':'';
 }
 toast(message){const e=this.toastElement;e.textContent=message;e.hidden=false;clearTimeout(this.toastTimer);this.toastTimer=setTimeout(()=>{e.hidden=true;},2600);}
 destroy(){clearTimeout(this.toastTimer);this.root.replaceChildren();}
}
