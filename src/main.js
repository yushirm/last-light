import {GameController} from './controller.js';
function fatal(error){const loading=document.getElementById('bootstrap-status');if(loading){loading.hidden=false;loading.textContent='The lighthouse could not start. Try reloading the page or use a modern browser.';}console.error('Last Light error',error);}
export function boot(){try{const canvas=document.getElementById('game-canvas'),overlay=document.getElementById('overlay');if(!canvas||!overlay)throw Error('Missing game elements');const game=new GameController({canvas,overlay});game.boot();document.getElementById('bootstrap-status').hidden=true;return game;}catch(err){fatal(err);return null;}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
