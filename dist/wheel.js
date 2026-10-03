import {DATA} from './data.js';
import {CARDS} from './cards.js';
import {TIERS,initialWeights,tierLabel,hiddenChance} from './math.js';
import {DAILY_PROJECTS} from './run.js';

const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const PALETTE=['#305a70','#2b6469','#535574','#786040','#3c665d'];
const normalized=(rows,key='weight')=>{const total=rows.reduce((s,r)=>s+(r[key]||0),0);return rows.map((r,i)=>({...r,id:String(r.id??r.grade??i),label:r.label??r.name,probability:total?(r[key]||0)/total:0,color:r.color??PALETTE[i%PALETTE.length]}));};
export function artsOptions(legend=false,operatorOnly=false){
 const cards=operatorOnly?CARDS.filter(c=>c.pool==='normal'&&/^[3-6]星$/.test(DATA.arts.cards.find(r=>r.art_id===c.id)?.source_rarity)):CARDS;
 const totals=Object.fromEntries(['normal','hidden'].map(p=>[p,cards.filter(c=>c.pool===p).reduce((s,c)=>s+c.weight,0)]));
 return cards.map((c,i)=>({id:c.id,label:c.name+'（'+c.source+'）',probability:operatorOnly?1/cards.length:(c.pool==='hidden'?hiddenChance(legend):(1-hiddenChance(legend)))*c.weight/totals[c.pool],color:c.pool==='hidden'?['#786040','#535574'][i%2]:PALETTE[i%PALETTE.length],hidden:c.pool==='hidden'}));
}
export function creationOptions(step,state){
 if(step<3)return normalized([DATA.origins.birthplaces,DATA.origins.races,DATA.origins.identities][step]);
 if(step===3){const rows=normalized(DATA.campaign.nodes,'entry_weight');return state.selectedNode==='random'?rows:rows.map(r=>({...r,probability:r.id===state.selectedNode?1:0}));}
 if(step===4)return artsOptions(state.legend);
 if(step===10)return normalized(DATA.talents.grades.map(g=>({...g,label:g.grade+' · '+g.name+' ×'+g.training_multiplier})));
 return normalized(TIERS.map((_,i)=>({id:String(i),label:tierLabel(i),weight:initialWeights(state.solo)[i]})));
}
export const dailyOptions=()=>normalized(DAILY_PROJECTS.map(p=>({...p,id:p.name})));
export function vectorTierOptions(tier){
 tier=Math.max(0,Math.min(16,Math.floor(tier)));
 const lower=Array.from({length:tier},(_,i)=>({tier:tier-i-1,weight:[20,12,8,5,3,2][i]||1})),sum=lower.reduce((s,r)=>s+r.weight,0);
 return TIERS.map((_,i)=>({id:String(i),label:tierLabel(i),probability:i===tier?(tier?0.5:1):i<tier?0.5*lower.find(r=>r.tier===i).weight/sum:0,color:PALETTE[i%PALETTE.length]}));
}
export const selectedCreationId=row=>row?.score!==undefined?String(Math.floor(row.score)):String(row?.id??'');
export const percent=p=>p===0?'本次不参与':p===1?'100%':(p*100>=.01?(p*100).toFixed(2).replace(/\.?0+$/,''):(p*100).toPrecision(2))+'%';

export {wheelMarkup,bindWheels} from './wheel-visual.js';
