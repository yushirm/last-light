export const clamp=(v,min,max)=>Math.max(min,Math.min(max,Number.isFinite(v)?v:min));
export const lerp=(a,b,t)=>a+(b-a)*t;
export const normalizedAngleDifference=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
export const angleToPoint=(x,y,cx,cy)=>Math.atan2(y-cy,x-cx);
export const distanceSquared=(ax,ay,bx,by)=>(ax-bx)**2+(ay-by)**2;
export function insideBeam(target,beamAngle,halfAngle,range,origin){
 const dx=target.x-origin.x,dy=target.y-origin.y,d=Math.hypot(dx,dy);
 return Number.isFinite(d)&&d<=range+(target.radius||0)&&Math.abs(normalizedAngleDifference(Math.atan2(dy,dx),beamAngle))<=halfAngle+Math.atan2(target.radius||0,Math.max(d,1));
}
export function createRng(seed){let t=(seed>>>0)||0x12345678;return ()=>{t=(t+0x6D2B79F5)>>>0;let x=t;x=Math.imul(x^(x>>>15),x|1);x^=x+Math.imul(x^(x>>>7),x|61);return ((x^(x>>>14))>>>0)/4294967296;};}
export function weightedChoice(rng,entries){const valid=Object.entries(entries||{}).filter(([,w])=>Number.isFinite(w)&&w>0);let total=valid.reduce((s,[,w])=>s+w,0),v=rng()*total;for(const [k,w] of valid){v-=w;if(v<0)return k;}return valid.at(-1)?.[0]||'wisp';}
