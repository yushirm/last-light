import {CONFIG} from './config.js';
export class InputManager {
 constructor(canvas,renderer,onAction){this.canvas=canvas;this.renderer=renderer;this.onAction=onAction;this.enabled=false;this.activePointerId=null;this.isHeld=false;this.angle=-Math.PI/2;this.keys=new Set();this.onDown=e=>{if(!this.enabled||this.activePointerId!==null||e.button>0)return;this.activePointerId=e.pointerId;this.aim(e);this.isHeld=true;canvas.setPointerCapture?.(e.pointerId);e.preventDefault();};
  this.onMove=e=>{if(!this.enabled)return;if(this.activePointerId===null){if(e.pointerType==='mouse')this.aim(e);}else if(e.pointerId===this.activePointerId)this.aim(e);};
  this.onUp=e=>{if(e.pointerId===this.activePointerId){this.activePointerId=null;this.isHeld=false;try{canvas.releasePointerCapture(e.pointerId);}catch{}}};
  this.onKeyDown=e=>{if(!this.enabled||e.target?.matches?.('input,textarea,select,[contenteditable]'))return;const k=e.key.toLowerCase();if([' ','arrowleft','arrowright','a','d','p','escape'].includes(k))e.preventDefault();this.keys.add(k);if((k==='p'||k==='escape')&&!e.repeat)this.onAction('pause');};
  this.onKeyUp=e=>this.keys.delete(e.key.toLowerCase());this.onBlur=()=>this.releaseAll();canvas.addEventListener('pointerdown',this.onDown);canvas.addEventListener('pointermove',this.onMove);canvas.addEventListener('pointerup',this.onUp);canvas.addEventListener('pointercancel',this.onUp);window.addEventListener('keydown',this.onKeyDown);window.addEventListener('keyup',this.onKeyUp);window.addEventListener('blur',this.onBlur);
 }
 aim(e){const p=this.renderer.clientToWorld(e.clientX,e.clientY),dx=p.x-CONFIG.CENTER.x,dy=p.y-CONFIG.CENTER.y;if(Math.hypot(dx,dy)>4)this.angle=Math.atan2(dy,dx);}
 getSnapshot(dt=0){if(this.enabled){const left=this.keys.has('a')||this.keys.has('arrowleft'),right=this.keys.has('d')||this.keys.has('arrowright');if(left!==right)this.angle+=(right?1:-1)*CONFIG.ROTATE_SPEED*dt;}return {angle:this.angle,isHeld:this.enabled&&(this.isHeld||this.keys.has(' '))};}
 releaseAll(){this.activePointerId=null;this.isHeld=false;this.keys.clear();}
 setEnabled(enabled){this.enabled=!!enabled;if(!enabled)this.releaseAll();}
 destroy(){this.releaseAll();this.canvas.removeEventListener('pointerdown',this.onDown);this.canvas.removeEventListener('pointermove',this.onMove);this.canvas.removeEventListener('pointerup',this.onUp);this.canvas.removeEventListener('pointercancel',this.onUp);window.removeEventListener('keydown',this.onKeyDown);window.removeEventListener('keyup',this.onKeyUp);window.removeEventListener('blur',this.onBlur);}
}
