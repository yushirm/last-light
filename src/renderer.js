import {CONFIG,PALETTE,NIGHTS} from './config.js';
import {clamp,lerp} from './math.js';
const C=CONFIG.CENTER,W=CONFIG.WIDTH,H=CONFIG.HEIGHT,TAU=Math.PI*2;
export class Renderer {
 constructor(canvas,settings){this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});if(!this.ctx)throw Error('Canvas 2D unavailable');this.settings=settings;this.decor=Array.from({length:65},(_,i)=>({x:(i*83+19)%390,y:21+(i*131)%625,size:.5+(i%3)*.55,phase:i*1.39}));this.resize();window.addEventListener('resize',()=>this.resize());}
 resize(){const scale=Math.min(innerWidth/W,innerHeight/H);const width=Math.max(1,Math.floor(W*scale)),height=Math.max(1,Math.floor(H*scale));this.canvas.parentElement.style.width=width+'px';this.canvas.parentElement.style.height=height+'px';const dpr=Math.min(2,window.devicePixelRatio||1);this.canvas.width=Math.round(W*dpr);this.canvas.height=Math.round(H*dpr);this.ctx.setTransform(dpr,0,0,dpr,0,0);}
 clientToWorld(x,y){const r=this.canvas.getBoundingClientRect();return {x:(x-r.left)/r.width*W,y:(y-r.top)/r.height*H};}
 render(run,view,timestamp=0){const ctx=this.ctx,time=timestamp/1000,motion=this.settings.reducedMotion?0:time,n=run?.night||1,final=run?.finale,dawn=final?.dawnProgress||0;
 ctx.clearRect(0,0,W,H);this.background(ctx,n,motion,dawn);this.ocean(ctx,n,motion,dawn);
 if(!run){this.titleArt(ctx,motion);return;}
 if(n===7&&['finale_survive','finale_fleet','finale_align','finale_dawn'].includes(run.phase))this.hollowKing(ctx,run,motion);
 if(run.phase==='finale_fleet'||run.phase==='finale_align'||run.phase==='finale_dawn')this.fleet(ctx,run,motion);
 this.arena(ctx);this.beam(ctx,run,motion);this.entities(ctx,run,motion);this.lighthouse(ctx,run,motion);
 if(run.phase==='finale_align')this.alignment(ctx,run,motion);
 if(run.phase==='finale_survive'&&run.player.beamActive&&Math.abs(run.player.beamAngle+Math.PI/2)<.2)this.word(ctx,'IT CANNOT BE HURT',195,285,12,PALETTE.coral);
 if(run.phase==='finale_fleet'&&run.finale.elapsed<2)this.word(ctx,'EVERY LIGHT WE SAVED IS COMING HOME',195,296,11,PALETTE.gold);
 if(run.phase==='boss'&&run.boss){this.bossHealth(ctx,run.boss);if(run.boss.shieldRemaining>0)this.word(ctx,'SHIELDED',195,213,12,PALETTE.violet);if(run.lastStand)this.word(ctx,'LAST STAND',195,224,12,PALETTE.gold);}
 if(run.player.overheatRemaining>0||run.player.needsRecharge)this.word(ctx,'RECHARGING',195,617,12,PALETTE.coral);
 if(run.player.damageFlash>0){ctx.fillStyle=`rgba(239,120,108,${run.player.damageFlash/.35*.19})`;ctx.fillRect(0,0,W,H);}
 }
 background(ctx,n,t,dawn){const gradient=ctx.createLinearGradient(0,0,0,H);gradient.addColorStop(0,n===5?'#0B1B30':PALETTE.night);gradient.addColorStop(.5,n===4?'#253047':PALETTE.sea);gradient.addColorStop(1,PALETTE.seaLight);ctx.fillStyle=gradient;ctx.fillRect(0,0,W,H);
 if(dawn){ctx.fillStyle=`rgba(255,185,127,${dawn*.88})`;ctx.fillRect(0,0,W,H);const yy=365-48*dawn;ctx.fillStyle=PALETTE.gold;ctx.beginPath();ctx.arc(195,yy,4+64*dawn,0,TAU);ctx.fill();}
 for(const st of this.decor){if(st.y>440)continue;const a=.25+.23*Math.sin(t*.8+st.phase);ctx.fillStyle=`rgba(255,241,214,${Math.max(.08,a)*(1-dawn)})`;ctx.beginPath();ctx.arc(st.x,st.y,st.size,0,TAU);ctx.fill();}
 if(n===2){ctx.fillStyle='rgba(185,232,217,.045)';for(let i=0;i<4;i++)ctx.fillRect(0,260+i*90+Math.sin(t+i)*8,W,23);}
 if(n===4){ctx.fillStyle='rgba(167,154,219,.18)';for(let i=0;i<9;i++)ctx.fillRect(18+i*43,308-(i*37%45),25,85);}
 if(n===5){ctx.strokeStyle='rgba(172,187,196,.14)';for(let i=0;i<20;i++){const x=(i*47+t*20)%500-60,y=100+(i*71)%610;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-13,y+33);ctx.stroke();}}
 if(n===6){for(let i=0;i<7;i++){ctx.strokeStyle='rgba(255,213,138,.2)';const x=(i*67+30+t*7)%390,y=(i*89+t*15)%570;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-4,y+18);ctx.stroke();}}
 }
 ocean(ctx,n,t,dawn){const sea=ctx.createLinearGradient(0,275,0,850);sea.addColorStop(0,`rgba(22,71,89,${.28-dawn*.15})`);sea.addColorStop(1,`rgba(7,19,30,${.26-dawn*.1})`);ctx.fillStyle=sea;ctx.fillRect(0,275,W,570);
 ctx.strokeStyle=dawn?'rgba(255,241,214,.18)':'rgba(185,232,217,.105)';ctx.lineWidth=1;for(let i=0;i<35;i++){let x=(i*89+((t*2*(i%3+1))%80))%420-22,y=282+(i*53)%516;ctx.beginPath();ctx.ellipse(x,y,11+(i%4)*5,1.8,0,Math.PI*.07,Math.PI*.92);ctx.stroke();}}
 arena(ctx){
  // A quiet compass rose beneath the gameplay, not a competing HUD.
  ctx.save();ctx.translate(C.x,C.y);
  for(const [radius,alpha] of [[CONFIG.ARENA_RADIUS,.23],[105,.085],[52,.055]]){
   ctx.strokeStyle=`rgba(192,177,139,${alpha})`;ctx.lineWidth=radius>150?1.1:.65;
   ctx.beginPath();ctx.arc(0,0,radius,0,TAU);ctx.stroke();
  }
  ctx.strokeStyle='rgba(185,155,103,.16)';ctx.lineWidth=.7;
  ctx.setLineDash([2,7]);for(let i=0;i<8;i++){
   const a=i*TAU/8;ctx.beginPath();ctx.moveTo(Math.cos(a)*57,Math.sin(a)*57);
   ctx.lineTo(Math.cos(a)*173,Math.sin(a)*173);ctx.stroke();
  }ctx.setLineDash([]);
  for(let i=0;i<48;i++){
   const a=i*TAU/48,major=i%4===0,start=major?174:179;
   ctx.strokeStyle=major?'rgba(220,188,124,.35)':'rgba(185,155,103,.17)';
   ctx.beginPath();ctx.moveTo(Math.cos(a)*start,Math.sin(a)*start);
   ctx.lineTo(Math.cos(a)*183,Math.sin(a)*183);ctx.stroke();
  }
  ctx.font='10px Georgia, serif';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillStyle='rgba(232,199,137,.57)';
  for(const [letter,x,y] of [['N',0,-199],['E',199,0],['S',0,199],['W',-199,0]])ctx.fillText(letter,x,y);
  ctx.restore();
 }
 beam(ctx,run,t){const p=run.player,statsAngle=CONFIG.BEAM_HALF_ANGLE+.045*(run.upgrades.wide_lens||0),angle=p.beamAngle,active=p.beamActive,r=CONFIG.BEAM_RANGE;
 const cone=(a,half,alpha)=>{ctx.beginPath();ctx.moveTo(C.x,C.y);ctx.arc(C.x,C.y,r,a-half,a+half);ctx.closePath();let g=ctx.createRadialGradient(C.x,C.y,5,C.x,C.y,r);g.addColorStop(0,`rgba(255,213,138,${alpha})`);g.addColorStop(1,'rgba(255,213,138,.02)');ctx.fillStyle=g;ctx.fill();ctx.beginPath();ctx.moveTo(C.x,C.y);ctx.lineTo(C.x+Math.cos(a)*r,C.y+Math.sin(a)*r);ctx.strokeStyle=`rgba(255,241,214,${alpha+.05})`;ctx.lineWidth=active?2:1;ctx.stroke();};
 cone(angle,active?statsAngle:.028,active?.23:.055);
 if(active&&run.upgrades.prism_beam){cone(angle-.29,statsAngle*.72,.09);cone(angle+.29,statsAngle*.72,.09);}
 if(run.ability.sweepRemaining>0)cone((run.ability.disco*TAU/1.2)%TAU,.13,.13);
 }
 lighthouse(ctx,run,t){ctx.save();ctx.translate(C.x,C.y+3);const shadow=ctx.createRadialGradient(0,4,9,0,4,68);shadow.addColorStop(0,'rgba(255,213,138,.14)');shadow.addColorStop(1,'rgba(255,213,138,0)');ctx.fillStyle=shadow;ctx.beginPath();ctx.arc(0,0,68,0,TAU);ctx.fill();ctx.fillStyle='#193742';ctx.beginPath();ctx.ellipse(0,27,33,11,0,0,TAU);ctx.fill();ctx.strokeStyle=PALETTE.mint;ctx.lineWidth=1;ctx.stroke();ctx.fillStyle='#BCC9C5';ctx.beginPath();ctx.moveTo(-13,19);ctx.lineTo(-10,-28);ctx.lineTo(10,-28);ctx.lineTo(13,19);ctx.closePath();ctx.fill();ctx.fillStyle='#627E85';ctx.fillRect(-10,-8,20,4);ctx.fillRect(-11,8,22,4);ctx.fillStyle=PALETTE.night;ctx.fillRect(-4,4,8,15);
 ctx.fillStyle=PALETTE.black;ctx.fillRect(-17,-28,34,5);ctx.fillRect(-12,-44,24,17);ctx.fillStyle=PALETTE.gold;ctx.fillRect(-8,-41,16,12);ctx.fillStyle='#FFF1D6';ctx.fillRect(-3,-38,6,7);ctx.fillStyle=PALETTE.black;ctx.beginPath();ctx.moveTo(-18,-44);ctx.lineTo(0,-54);ctx.lineTo(18,-44);ctx.closePath();ctx.fill();ctx.strokeStyle=PALETTE.gold;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-55);ctx.lineTo(0,-62);ctx.stroke();ctx.fillStyle=PALETTE.coral;ctx.beginPath();ctx.arc(10,-29,3,0,TAU);ctx.fill();ctx.restore();
 if(run.pipPresent){const a=t*1.2,x=C.x+25+Math.cos(a)*11,y=C.y-51+Math.sin(a)*14;ctx.fillStyle='rgba(255,241,214,.65)';ctx.beginPath();ctx.ellipse(x-4,y,5,3,-.6,0,TAU);ctx.ellipse(x+4,y,5,3,.6,0,TAU);ctx.fill();ctx.fillStyle=PALETTE.gold;ctx.beginPath();ctx.arc(x,y,3,0,TAU);ctx.fill();}
 }
 entities(ctx,run,t){for(const p of run.particles){ctx.globalAlpha=clamp(1-p.age/p.life,0,1);ctx.fillStyle=PALETTE[p.color]||PALETTE.gold;ctx.beginPath();ctx.arc(p.x,p.y,1.5,0,TAU);ctx.fill();}ctx.globalAlpha=1;
 for(const e of run.enemies)this.enemy(ctx,e,t);
 for(const b of run.projectiles){ctx.fillStyle=PALETTE.coral;ctx.beginPath();ctx.arc(b.x,b.y,b.radius,0,TAU);ctx.fill();}
 for(const d of run.decoys){ctx.globalAlpha=.34*(1-d.age/4);this.enemy(ctx,{...d,type:'wisp',hp:1,maxHp:1},t);ctx.globalAlpha=1;}
 for(const s of run.ships){this.boat(ctx,s.x,s.y,s.progress/Math.max(.7,1.2-.25*(run.upgrades.mercy_light||0)),t);if(run.rescuedShips<2)this.word(ctx,'HOLD LIGHT TO GUIDE',Math.max(77,Math.min(313,s.x)),s.y-29,9,PALETTE.gold);}
 for(const s of run.stars){this.star(ctx,s.x,s.y,10,PALETTE.gold);this.ring(ctx,s.x,s.y,16,s.progress/.5,PALETTE.gold);this.word(ctx,'LIGHT THE STAR',Math.max(65,Math.min(325,s.x)),s.y-25,9,PALETTE.gold);}
 if(run.boss&&run.boss.hp>0)this.boss(ctx,run.boss,t);
 }
 enemy(ctx,e,t){ctx.save();ctx.translate(e.x,e.y);const rad=e.radius;ctx.fillStyle=PALETTE.black;ctx.strokeStyle=e.type==='armoured'?PALETTE.muted:PALETTE.teal;ctx.lineWidth=e.type==='armoured'?2.5:1.5;ctx.beginPath();switch(e.type){case 'wisp':ctx.ellipse(0,0,rad,rad*.75,Math.sin(t)*.15,0,TAU);break;case 'drifter':ctx.moveTo(0,-rad);ctx.quadraticCurveTo(rad*1.5,rad*.6,rad*.65,rad);ctx.quadraticCurveTo(-rad,rad*.7,-rad,-rad*.2);ctx.closePath();break;case 'splitter':case 'shard':{const edges=e.type==='shard'?3:6;for(let i=0;i<edges*2;i++){const a=i*Math.PI/edges,r=i%2?rad*.52:rad;const x=Math.cos(a)*r,y=Math.sin(a)*r;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();break;}case 'siren':ctx.arc(0,0,rad,-1.15,1.35);ctx.arc(rad*.35,-1,rad*.7,1.3,-1.2,true);ctx.closePath();break;case 'armoured':for(let i=0;i<7;i++){const a=i*TAU/7;i?ctx.lineTo(Math.cos(a)*rad,Math.sin(a)*rad):ctx.moveTo(Math.cos(a)*rad,Math.sin(a)*rad);}ctx.closePath();break;default:ctx.arc(0,0,rad,0,TAU);}
 ctx.fill();ctx.stroke();if(e.type==='drifter'){ctx.fillStyle=PALETTE.mint;ctx.fillRect(-5,-1,3,3);ctx.fillRect(3,-1,3,3);}if(e.type==='eater'){ctx.strokeStyle=PALETTE.gold;ctx.beginPath();ctx.arc(0,0,rad*.6,0,TAU);ctx.stroke();}
 if(e.type==='armoured'&&e.hp/e.maxHp<.5){ctx.strokeStyle=PALETTE.paper;ctx.beginPath();ctx.moveTo(-5,-10);ctx.lineTo(2,0);ctx.lineTo(-2,9);ctx.stroke();}
 ctx.restore();}
 boat(ctx,x,y,progress=0,t=0){ctx.save();ctx.translate(x,y);ctx.fillStyle=PALETTE.gold;ctx.beginPath();ctx.moveTo(-12,3);ctx.quadraticCurveTo(0,15,12,3);ctx.closePath();ctx.fill();ctx.strokeStyle=PALETTE.paper;ctx.beginPath();ctx.moveTo(0,2);ctx.lineTo(0,-14);ctx.lineTo(8,0);ctx.stroke();ctx.fillStyle=PALETTE.paper;ctx.beginPath();ctx.arc(-4,-2,2.5,0,TAU);ctx.fill();this.ring(ctx,0,0,18,progress,PALETTE.gold);ctx.restore();}
 ring(ctx,x,y,r,progress,color){ctx.strokeStyle='rgba(255,241,214,.2)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.stroke();if(progress>0){ctx.strokeStyle=color;ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y,r,-Math.PI/2,-Math.PI/2+TAU*clamp(progress,0,1));ctx.stroke();}}
 star(ctx,x,y,r,color){ctx.save();ctx.translate(x,y);ctx.fillStyle=color;ctx.beginPath();for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,rr=i%2?r*.42:r;i?ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr):ctx.moveTo(Math.cos(a)*rr,Math.sin(a)*rr);}ctx.closePath();ctx.fill();ctx.restore();}
 boss(ctx,b,t){ctx.save();ctx.translate(b.x,b.y);ctx.rotate(b.orbitAngle*.35);const r=b.radius;ctx.fillStyle=PALETTE.black;ctx.strokeStyle=b.shieldRemaining>0?PALETTE.violet:PALETTE.teal;ctx.lineWidth=b.hitFlash>0?5:2.5;ctx.beginPath();if(b.id==='knocker'){ctx.ellipse(0,0,r,r*.7,0,0,TAU);ctx.fill();ctx.stroke();for(const s of [-1,1]){ctx.beginPath();ctx.arc(s*r*1.1,0,r*.55,.2,Math.PI*1.7);ctx.stroke();}}
 else if(b.id==='jelly_queen'){ctx.arc(0,5,r,Math.PI,TAU);ctx.lineTo(r,11);ctx.quadraticCurveTo(0,22,-r,11);ctx.closePath();ctx.fill();ctx.stroke();for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(i*8,12);ctx.quadraticCurveTo(i*9+Math.sin(t*2+i)*4,26,i*8,39);ctx.stroke();}}
 else if(b.id==='tempest'){for(let i=0;i<3;i++){ctx.arc(0,0,r-i*9,i+Math.sin(t)*.2,i+Math.PI*1.3);}ctx.stroke();ctx.beginPath();ctx.arc(0,0,13,0,TAU);ctx.fill();}
 else if(b.id==='starved_sky'){for(let i=0;i<9;i++){const a=i*TAU/9,rr=r*(i%2?1.3:.95);i?ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr):ctx.moveTo(Math.cos(a)*rr,Math.sin(a)*rr);}ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle=PALETTE.gold;for(let i=0;i<5;i++){ctx.beginPath();ctx.arc(Math.cos(i*5)*r*.4,Math.sin(i*7)*r*.4,2,0,TAU);ctx.fill();}}
 else if(b.id==='archivist'){for(let i=0;i<8;i++){const a=i*TAU/8;i?ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r):ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r);}ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle=PALETTE.violet;ctx.fillRect(-9,-5,18,9);}
 else{ctx.moveTo(-r,12);ctx.lineTo(-r*.65,-r);ctx.lineTo(r*.55,-r);ctx.lineTo(r,12);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle=PALETTE.gold;ctx.fillRect(-4,-5,8,4);}
 if(b.attackState==='warning'){ctx.strokeStyle=PALETTE.coral;ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,r+10,0,TAU);ctx.stroke();}ctx.restore();}
 bossHealth(ctx,b){const w=206,x=92,y=162;this.word(ctx,b.name.toUpperCase(),195,145,12,PALETTE.paper);ctx.fillStyle='rgba(255,241,214,.13)';ctx.fillRect(x,y,w,8);ctx.fillStyle=b.shieldRemaining>0?PALETTE.violet:PALETTE.coral;ctx.fillRect(x,y,w*clamp(b.hp/b.maxHp,0,1),8);}
 hollowKing(ctx,run,t){const fade=run.phase==='finale_dawn'?1-run.finale.dawnProgress:run.phase==='finale_align'?.3:1;ctx.save();ctx.globalAlpha=.75*fade;ctx.fillStyle=PALETTE.black;ctx.beginPath();ctx.moveTo(66,326);ctx.bezierCurveTo(35,180,102,160,195,171);ctx.bezierCurveTo(280,160,366,189,321,326);ctx.quadraticCurveTo(200,260,66,326);ctx.fill();ctx.fillStyle=PALETTE.violet;ctx.fillRect(153,226,15,3);ctx.fillRect(222,226,15,3);ctx.restore();}
 fleet(ctx,run,t){const count=Math.min(24,Math.max(8,8+Math.floor((run.totalRescuesAtStart||0)/2)));for(let i=0;i<count;i++){const x=22+i*(346/Math.max(1,count-1)),y=308+Math.sin(i*3)*16;ctx.strokeStyle='rgba(255,213,138,.3)';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(C.x,C.y);ctx.stroke();ctx.fillStyle=PALETTE.night;ctx.beginPath();ctx.moveTo(x-9,y+2);ctx.lineTo(x+9,y+2);ctx.lineTo(x+5,y+7);ctx.lineTo(x-6,y+7);ctx.closePath();ctx.fill();ctx.fillStyle=PALETTE.gold;ctx.beginPath();ctx.arc(x,y,2,0,TAU);ctx.fill();}}
 alignment(ctx,run,t){const x=195,y=250;this.ring(ctx,x,y,32,run.finale.alignProgress/5,PALETTE.gold);this.star(ctx,x,y,17,PALETTE.gold);this.word(ctx,'GUIDE THE LIGHT INTO THE SKY',195,185,12,PALETTE.paper);this.word(ctx,`${run.finale.alignProgress.toFixed(1)} / 5.0s`,195,305,14,PALETTE.gold);}
 titleArt(ctx,t){
  // An engraved lighthouse plate. All shapes are drawn in Canvas 2D.
  const shift=Math.sin(t*.18)*.08,xx=195,lanternY=169;
  ctx.save();
  const halo=ctx.createRadialGradient(308,117,0,308,117,72);
  halo.addColorStop(0,'rgba(243,224,182,.17)');halo.addColorStop(1,'rgba(243,224,182,0)');
  ctx.fillStyle=halo;ctx.fillRect(216,25,184,180);
  ctx.strokeStyle='rgba(210,186,139,.3)';ctx.lineWidth=1;
  ctx.beginPath();ctx.arc(304,115,37,0,TAU);ctx.stroke();
  ctx.beginPath();ctx.arc(304,115,43,.9,4.5);ctx.stroke();
  // Compass arcs, fine survey lines and guide marks.
  ctx.save();ctx.translate(xx,201);ctx.strokeStyle='rgba(160,182,173,.16)';
  ctx.beginPath();ctx.arc(0,0,136,3.47,5.98);ctx.stroke();
  ctx.beginPath();ctx.arc(0,0,157,3.64,5.71);ctx.stroke();
  for(let i=0;i<31;i++){
   const a=3.47+i*(2.51/30),r=i%5===0?134:139;
   ctx.beginPath();ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r);
   ctx.lineTo(Math.cos(a)*145,Math.sin(a)*145);ctx.stroke();
  }ctx.restore();
  ctx.strokeStyle='rgba(202,193,154,.26)';ctx.lineWidth=.7;
  ctx.beginPath();ctx.moveTo(27,326);ctx.lineTo(363,326);ctx.stroke();
  ctx.setLineDash([1,7]);ctx.beginPath();ctx.moveTo(195,37);ctx.lineTo(195,332);ctx.stroke();ctx.setLineDash([]);
  // Searchlight with an animated bearing and softly illuminated dust.
  const a=-.55+shift,reach=320,spread=.18;
  ctx.beginPath();ctx.moveTo(xx,lanternY);
  ctx.arc(xx,lanternY,reach,a-spread,a+spread);ctx.closePath();
  const light=ctx.createRadialGradient(xx,lanternY,4,xx,lanternY,reach);
  light.addColorStop(0,'rgba(255,231,164,.34)');light.addColorStop(.43,'rgba(237,197,120,.12)');
  light.addColorStop(1,'rgba(237,197,120,0)');ctx.fillStyle=light;ctx.fill();
  ctx.strokeStyle='rgba(255,219,148,.29)';ctx.lineWidth=.6;
  for(const side of [-1,1]){
   ctx.beginPath();ctx.moveTo(xx,lanternY);
   ctx.lineTo(xx+Math.cos(a+spread*side)*reach,lanternY+Math.sin(a+spread*side)*reach);ctx.stroke();
  }
  // Low island rock. Layered blocks and hatch marks suggest an engraving.
  ctx.fillStyle='#07161d';ctx.beginPath();ctx.moveTo(0,357);ctx.lineTo(39,342);
  ctx.lineTo(90,345);ctx.lineTo(136,316);ctx.lineTo(168,320);ctx.lineTo(193,304);
  ctx.lineTo(219,320);ctx.lineTo(258,316);ctx.lineTo(290,342);ctx.lineTo(352,348);
  ctx.lineTo(390,357);ctx.lineTo(390,410);ctx.lineTo(0,410);ctx.closePath();ctx.fill();
  ctx.strokeStyle='rgba(126,167,163,.34)';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(0,357);ctx.lineTo(90,345);ctx.lineTo(136,316);
  ctx.lineTo(168,320);ctx.lineTo(193,304);ctx.lineTo(219,320);
  ctx.lineTo(258,316);ctx.lineTo(290,342);ctx.lineTo(390,357);ctx.stroke();
  for(let i=0;i<26;i++){
   const x=(i*61+18)%390,y=359+(i*19)%34;
   ctx.strokeStyle='rgba(120,150,145,.13)';ctx.beginPath();ctx.moveTo(x,y);
   ctx.lineTo(x+12,y-4);ctx.stroke();
  }
  // Tapered stone shaft, fluted metal lantern and observation gallery.
  ctx.fillStyle='#63767a';ctx.beginPath();ctx.moveTo(165,311);ctx.lineTo(178,193);
  ctx.lineTo(210,193);ctx.lineTo(227,311);ctx.closePath();ctx.fill();
  const masonry=ctx.createLinearGradient(160,0,229,0);
  masonry.addColorStop(0,'#1b3941');masonry.addColorStop(.43,'#b7b5a2');
  masonry.addColorStop(.78,'#74868a');masonry.addColorStop(1,'#15303a');
  ctx.fillStyle=masonry;ctx.beginPath();ctx.moveTo(168,306);ctx.lineTo(180,194);
  ctx.lineTo(208,194);ctx.lineTo(222,306);ctx.closePath();ctx.fill();
  ctx.strokeStyle='rgba(231,220,181,.33)';ctx.lineWidth=1;
  for(let y=214;y<=287;y+=13){const left=180-(y-194)*.10,right=208+(y-194)*.12;
   ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(right,y);ctx.stroke();
  }
  ctx.fillStyle='#182d34';ctx.fillRect(190,269,10,37);
  ctx.strokeStyle='#b6ac8e';ctx.strokeRect(190.5,268.5,10,38);
  ctx.fillStyle='#263f45';ctx.fillRect(179,191,31,8);
  ctx.fillStyle='#0a222c';ctx.fillRect(172,184,46,8);
  ctx.strokeStyle='#c1a878';ctx.strokeRect(173,184,45,7);
  ctx.fillStyle='#0b2028';ctx.fillRect(178,154,33,30);
  ctx.fillStyle='#f8d69a';ctx.fillRect(182,158,25,22);
  const glass=ctx.createLinearGradient(182,158,206,158);
  glass.addColorStop(0,'#977d50');glass.addColorStop(.5,'#ffe4a5');glass.addColorStop(1,'#c4a56d');
  ctx.fillStyle=glass;ctx.fillRect(185,159,19,21);
  ctx.strokeStyle='#17313a';ctx.lineWidth=2;
  for(const x of [182,190,198,206]){ctx.beginPath();ctx.moveTo(x,156);ctx.lineTo(x,183);ctx.stroke();}
  ctx.fillStyle='#0d2530';ctx.beginPath();ctx.moveTo(168,153);
  ctx.lineTo(194,138);ctx.lineTo(220,153);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#c6ad7d';ctx.beginPath();ctx.moveTo(168,153);ctx.lineTo(194,138);ctx.lineTo(220,153);ctx.stroke();
  ctx.beginPath();ctx.moveTo(194,138);ctx.lineTo(194,131);ctx.stroke();
  ctx.fillStyle='#f5d79b';ctx.beginPath();ctx.arc(194,169,5,0,TAU);ctx.fill();
  const glow=ctx.createRadialGradient(194,169,1,194,169,50);
  glow.addColorStop(0,'rgba(255,215,149,.45)');glow.addColorStop(1,'rgba(255,215,149,0)');
  ctx.fillStyle=glow;ctx.fillRect(140,115,110,108);
  // Two quiet navigational annotations.
  ctx.fillStyle='rgba(198,175,126,.6)';ctx.font='9px Georgia, serif';
  ctx.textAlign='left';ctx.fillText('N  47°',23,77);
  ctx.textAlign='right';ctx.fillText('THE LAST BEACON',365,302);
  for(let i=0;i<8;i++){
   const y=358+i*5,offset=(i%3)*17;
   ctx.strokeStyle=`rgba(153,188,177,${.08+i*.007})`;ctx.lineWidth=.65;
   ctx.beginPath();ctx.moveTo(10+offset,y);ctx.bezierCurveTo(116,y-3,287,y+4,385-offset,y);ctx.stroke();
  }
  ctx.restore();
 }
 word(ctx,text,x,y,size,color){ctx.save();ctx.fillStyle=color;ctx.font=`700 ${size}px system-ui`;ctx.textAlign='center';ctx.shadowColor=PALETTE.night;ctx.shadowBlur=8;ctx.fillText(text,x,y);ctx.restore();}
}
