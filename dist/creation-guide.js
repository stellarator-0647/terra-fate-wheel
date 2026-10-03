import {AXIS_NAMES,derive,energyRegen,restEnergy} from './math.js';

const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number=n=>Number(n.toFixed(1)).toLocaleString('zh-CN');
export const ATTRIBUTE_GUIDES=[
 {fields:[['H','生命上限']],effect:'决定你能承受多少伤害，也影响按最大生命计算的治疗量与护盾量。'},
 {fields:[['D','防御']],effect:'防御越高，受到的物理伤害越低。'},
 {fields:[['A','体术强度']],effect:'决定体术攻击的基础伤害，以及技能中按体术强度计算的伤害。'},
 {fields:[['P','源石技艺强度']],effect:'决定技能中按源石技艺强度计算的伤害；具体攻击类型与计算依据见技能描述。'},
 {fields:[['R','魔抗'],['Emax','技力上限']],effect:'魔抗降低受到的法术伤害；技力上限决定能储存多少技力，也影响每次行动与休整的技力恢复量。'}
];
export function attributeHint(step){const g=ATTRIBUTE_GUIDES[step-5];return g?AXIS_NAMES[step-5]+' → '+g.fields.map(([,name])=>name).join('、'):'';}
export function attributeGuide(step,state={},row){const g=ATTRIBUTE_GUIDES[step-5];if(!g)return '';const rolled=Number.isFinite(row?.score),stats=rolled?derive(Array.from({length:5},(_,i)=>i===step-5?row.score:0),state.rolls?.find(r=>r.step===2)?.id||state.identity||'I02'):null;
 const identity=state.rolls?.find(r=>r.step===2)?.id||state.identity;
 const note=step===5?(identity==='I01'?'感染者：本项生命上限已计入−10%。':identity==='I02'?'非感染者：本项生命上限已计入+10%。':''):step===8&&identity==='I01'?'感染者：本项源石技艺强度已计入+15%。':step===9&&stats?'每次自身机会恢复'+energyRegen(stats.Emax)+'技力；休整恢复'+restEnergy(stats.Emax)+'技力。':'';
 return `<section class="attribute-guide" aria-label="${esc(AXIS_NAMES[step-5])}决定的数值"><div><span class="attribute-guide-label">决定的作战数值</span><div class="attribute-guide-values">${g.fields.map(([key,name])=>`<strong>${name}${stats?`<b>${number(stats[key])}</b>`:''}</strong>`).join('')}</div></div><p>${esc(g.effect)}${note?`<small>${esc(note)}</small>`:''}</p></section>`;
}
