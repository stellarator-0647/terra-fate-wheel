import {score,tierLabel} from './math.js';
import {BY_ID,evolvedCard,resourceRule} from './cards.js';

export function statTier(stats,key){
 const v=key==='H'?stats.H/12:key==='Emax'?(stats.R??100*((stats.Emax-100)/100)**2):stats[key];
 return tierLabel(score(v));
}
export function unitResources(unit,units=[]){
 const base=BY_ID[unit.cardData?.baseArt||unit.card];const card=base?evolvedCard(base,unit.mastery||0):unit.cardData;if(!card)return [];
 const rule=resourceRule(card,unit.mastery||0),rows=[];
 if(rule){const current=rule.facilities?units.filter(u=>u.owner===unit.id&&u.relay&&!u.removed).length:rule.summons?units.filter(u=>u.owner===unit.id&&!u.removed&&u.hp>0&&u.name.includes('仆役')).length:unit.res;
  rows.push({name:rule.name,current:current||0,cap:rule.cap});}
 if(card.passive.includes('wisStart')||unit.heavy!==undefined)rows.push({name:'重炮弹',current:unit.heavy||0,cap:6});
 return rows;
}
export const artResourceRule=(card,mastery=0)=>resourceRule(evolvedCard(card,mastery),mastery);
const LEADERS=new Set(['amiya','amiya_sword','amiya_final','ace','chen','horn','siege','siege_sword','logos','w','crown','skull','misha','meph','faust','frost','winter','patriot','bird','talulah','mandragora','manfred','steam','cluster','sanguinarch','theresa','fremont']);
export const isLeader=u=>u.side==='enemy'&&!u.isPlayer&&!u.owner&&!u.facility&&!u.relay&&!!(u.leader||u.boss||u.eventBoss||LEADERS.has(u.npcId));
