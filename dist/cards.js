import {tuneSummon} from './summons.js';
import {DATA} from './data.js';
import {SHUO_RAW,installV21} from './v21-skills.js';
import {cleanNumbers} from './number-text.js';
if(!DATA.arts.cards.some(c=>c.art_id==='AK221'))DATA.arts.cards.push(SHUO_RAW);
import {installProfiles} from './profiles.js';
import {describeEffect} from './effect-text.js';
import {installNPC} from './npc-profiles.js';
export const hit=(coef=1,basis='P',type='magic',extra={})=>({op:'damage',coef,basis,type,...extra});
export const st=(name,n=1,duration=2,to='target')=>({op:'status',name,n,duration,to});
export const gain=(n=1)=>({op:'gain',n});
export const shield=(ratio=.12,to='self',duration=2)=>({op:'shield',ratio,to,duration});
export const heal=(ratio=.1,to='self')=>({op:'heal',ratio,to});
export const gauge=(n=-60,to='target')=>({op:'gauge',n,to});
export const energy=(n,to='self')=>({op:'energy',n,to});
export const use=(n='all')=>({op:'consume',n});
export const summon=(name,h=.2,a=.5,basis='P',limit=2,duration=3,extra={})=>({op:'summon',name,h,a,basis,limit,duration,...extra});
export const special=(name,extra={})=>({op:'special',name,...extra});
const statusWords={'加费':'ABC基础费用+12E，持续2自身机会。','嘲讽':'敌方单体与多目标选定优先选择此单位。','寒冷':'寒冷','冻结':'冻结','眩晕':'眩晕','睡眠':'睡眠','沉默':'沉默','恐惧':'恐惧','迟缓':'迟缓','破甲':'破防','破防':'破防','破魔':'破魔','脆弱':'脆弱','衰弱':'衰弱','灼烧':'灼烧','毒':'毒','凋亡':'凋亡','神经损伤':'神经损伤'};
const markerWords=['解构','震慑','人偶','焦土','雪域','追踪','狼惧','狐火','并流','迷狂','试剂','火种','心烛','雷印','梦魇','航标','瞄准','炸弹','国度','苗圃','蛇印','熔痕','血印'];
function compile(raw){let resource=/【([^】]+)】[^。]*?(?:上限|容量)(\d+)/.exec(raw.rule_text),marker=markerWords.find(w=>raw.rule_text.includes('【'+w+'】'));let r=resource&&!marker?resource[1]:null;
 let initial=/初始(\d+)/.exec(raw.rule_text),card={id:raw.art_id,source:raw.source,name:raw.name,pool:raw.pool,weight:raw.pool_weight||1,url:raw.source_url,family:raw.family_id||raw.art_id,tip:raw.play_tip,
 resource:r,cap:resource?+resource[2]:3,initial:initial?+initial[1]:0,marker,ammo:/容量/.test(raw.rule_text)&&/补1/.test(raw.rule_text),passive:[],originalRule:raw.rule_text,actions:[]};
 card.actions=raw.actions.map(a=>({button:a.button,name:a.name,label:a.operation_label||a.name,cost:a.base_cost,cd:a.cooldown,target:a.target||'enemy_one',unlock:a.button==='C'?200:0,ops:[]}));
 return card;}
export const CARDS=DATA.arts.cards.map(compile);
export const BY_ID=Object.fromEntries(CARDS.map(c=>[c.id,c]));
function set(id,arrays,options={}){let c=BY_ID[id];Object.assign(c,options);arrays.forEach((ops,i)=>{if(ops)c.actions[i].ops=ops;});if(arrays.length===3)c.explicit=true;return c;}
function aoe(id,buttons=['B']){for(let b of buttons)BY_ID[id].actions.find(a=>a.button===b).target='enemy_all';}
installProfiles(BY_ID,{hit,st,gain,use,shield,heal,gauge,energy,summon,special});
// Explicit authored implementations of signature mechanics and user-directed changes.
set('AK001',[[hit(.9),gain()], [use(),hit(1.4,'P','magic',{perResource:.5}),special('resourceHaste',{at:2})],[special('wager')]],{resource:'预见',cap:2,initial:0});
set('AK002',[[hit(1.3),st('寒冷')],[{op:'conditional',status:'寒冷',consume:true,effects:[hit(.7)]},hit(1.7)],[special('dismiss')]],{ascend:'冬痕',ascendOps:[[hit(2.4,'Q'),st('寒冷')],[special('snowSquad')],[special('dismiss')]]});
set('AK003',[[hit(.9),gain()],[use(),hit(1.4,'P','magic',{perResource:.35}),special('resourceDelay',{at:2})],[hit(.8,'Q','magic',{hits:2}),st('眩晕',1,1),{op:'delayed',turns:1,effects:[hit(.6,'Q')],repeat:2}]],{resource:'剑势',cap:2,ascend:'缄默德克萨斯'});
set('AK004',[[hit(1),st('沉默')],[hit(1.7),{op:'conditional',status:'沉默',consume:true,effects:[hit(.6,'A','physical')]}],[hit(1.4,'Q'),st('恐惧',1,1),summon('追逐单元',.2,.7,'Q',2,3,{count:2,slow:true})]],{ascend:'荒芜拉普兰德'});
set('AK006',[[hit(.6),gain(),special('record')],[use(1),hit(1.5),gauge(-60)],[hit(1),st('脆弱'),gain()]],{resource:'火陨',cap:1});
set('AK010',[[hit(1.1,'P','physical'),summon('战术装备',.18,0,'P',1,2,{facility:true,taunt:true})],[hit(2,'P','physical'),special('equipmentConsume')],[special('rosmontis')]],{resource:null});BY_ID.AK010.actions[2].cost=70;
set('AK011',[[summon('流形',.18,.55,'P',1,3,{mode:true})],[hit(1.2),special('morph')],[special('copyAlly')]],{resource:null});
set('AK013',[[hit(.9),special('relayBuild')],[special('relayBurst')],[special('relayCharge')]],{resource:'中继',cap:2,initial:0});
set('AK014',[[hit(.7),st('迟缓')],[hit(1.5),gauge(-60),{op:'conditional',status:'迟缓',consume:true,effects:[gauge(60,'self')]}],[hit(1.2),st('迟缓',2,2)]]);
set('AK015',[[hit(1.2),gain()],[use(),hit(.7,'P','magic',{perResource:.25})],[heal(.2,'allies'),{op:'cleanse',to:'allies'},hit(2.1,'Q')]],{resource:'热量',cap:3,ascend:'纯烬艾雅法拉'});
set('AK019',[[hit(1.1),gain()],[use(1),hit(1.6),gauge(-60)],[use(2),hit(3),special('fragmentRefund')]],{resource:'裂片',cap:6,initial:2});aoe('AK019',['C']);
set('AK025',[[hit(1),special('echoGain')],[use(),hit(1.5,'P','magic',{perResource:.6}),st('迟缓',1,1,'self')],[special('saveResource')]],{resource:'残响',cap:3});
set('AK026',[[hit(1.3),special('toggle')],[special('transpose')],[hit(1.7),{op:'cleanse',to:'self'},shield(.08),special('toggle')]]);
set('AK027',[[hit(1),st('凋亡',1,3)],[hit(1),st('凋亡',2,3)],[hit(1.5),st('破防'),st('破魔'),st('凋亡',3,3),st('恐惧',1,1)]],{passive:['fremont']});BY_ID.AK027.actions[2].cost=0;BY_ID.AK027.actions[2].name='构史';aoe('AK027',['B','C']);
set('AK030',[[summon('仆役',.12,.5,'P',2,4,{fuse:true})],[special('sacrifice'),hit(1.4),heal(.08)],[special('servantShield'),hit(1.3)]],{passive:['deathServant']});aoe('AK030');
set('AK035',[[special('arcSummon')],[special('arcCommand')],[special('arcConcerto'),hit(2)]],{resource:'协奏',cap:3,initial:0,passive:['arcStart'],modes:['防御型','物理型','法术型']});
set('AK040',[[hit(1),st('迷狂',1,3)],[special('neural')],[hit(1.9),st('迷狂',2,3),special('neuralAt3')]],{resource:null});aoe('AK040',['C']);
set('AK043',[[hit(1.2),gauge(-60),special('gravityUp')],[special('gravityDown')],[hit(1.4),gauge(60,'self'),special('gravityToggle')]],{passive:['gravity']});
set('AK053',[[hit(.75),gain()],[use(),hit(1.4,'A','physical',{perResource:.45}),gauge(-60)],[use(1),hit(1.8,'A','physical'),special('breakShield')]],{resource:'构件',cap:2,passive:['engineer']});
set('AK055',[[{op:'life',ratio:.04},hit(1.7)],[heal(.2),hit(1.8),st('黄昏',1,2,'self')],[special('endTwilight'),hit(2),st('衰弱',1,2,'self')]],{passive:[]});BY_ID.AK055.actions[1].limit=1;aoe('AK055',['B']);
set('AK072',[[{op:'life',ratio:.04},hit(1,'A','physical')],[hit(2,'A','physical'),st('锁血',1,2,'self')],[hit(1.8,'Q','physical'),special('shark')]],{ascend:'归溟幽灵鲨'});BY_ID.AK072.actions[1].limit=1;
set('AK086',[[hit(.6,'A','physical',{hits:2}),gain(4)],[use(),hit(.45,'A','physical',{hitsResource:true}),st('迟缓',1,1,'self')],[hit(.65,'Q','physical',{hits:5}),energy(8,'ally'),gauge(40,'ally'),special('revive')]],{resource:'弹匣',cap:12,initial:8,ammo:true,ascend:'新约能天使'});BY_ID.AK086.actions[1].minResource=3;
set('AK087',[[hit(.85,'A','physical'),special('windA')],[hit(1.1,'A','physical'),special('windB')],[shield(.14,'ally'),st('迅捷',1,2,'ally'),special('toggle')]],{ascend:'空弦·升变',passive:['teamHaste']});
set('AK093',[[hit(1,'A','physical'),gain()],[use(),hit(1.5,'A','physical',{perResource:.5})],[use(),hit(.9,'A','physical',{hits:2,extraHitsResource:true})]],{resource:'悼念',cap:2});BY_ID.AK093.actions[2].minResource=1;aoe('AK093',['C']);
set('AK098',[[special('wisA')],[use(),hit(.95,'A','physical',{perResource:.35}),special('resourceLife',{ratio:.03})],[special('wisC')]],{passive:['wisStart'],resource:'魂影',cap:2,initial:0});BY_ID.AK098.actions[2].cost=80;
set('AK108',[[special('wolvesSummon')],[hit(1.2,'A','physical'),special('command')],[special('wolfHunt')]],{passive:[]});
set('AK123',[[hit(1,'A','physical'),gain()],[use(),hit(.5,'A','physical',{hitsResource:true}),special('resourceEnergy',{at:4,n:8})],[use(2),shield(.18,'ally')]],{resource:'金币',cap:5,initial:2,passive:['swire']});BY_ID.AK123.actions[1].minResource=1;
set('AK179',[[hit(2.4,'Q'),st('寒冷')],[special('snowSquad')],[special('dismiss')]],{resource:null,ascend:'冬痕',ascendOps:[[hit(2.4,'Q'),st('寒冷')],[special('snowSquad')],[special('dismiss')]]});aoe('AK179',['A']);
for(const id of ['AK183','AK208'])set(id,[[hit(id==='AK208'?.55:1.3,'A','physical',{hits:id==='AK208'?4:1}),shield(.15)],[hit(id==='AK208'?3.3:2.3,'A','physical')],[special('wendigo')]],{passive:id==='AK208'?['patriotPrime']:[]});
set('AK184',[[heal(.12,'ally'),st('狂乱',1,2,'ally')],[hit(1.7),special('hostSacrifice')],[hit(1.6),{op:'cleanse',to:'allies'}]],{passive:['hosts']});
set('AK185',[[hit(1.1,'A','physical'),gain()],[use(),hit(1.4,'A','physical',{perResource:.4,ignoreShieldAt:3})],[use(1),hit(1.7,'A','physical'),st('隐匿',1,1,'self')]],{resource:'狙杀计数',cap:3,initial:0,passive:['faust']});
set('AK182',null??[],{passive:['blackSnake']});
set('AK190',[],{passive:['lifesteal']});
set('AK141',[],{passive:['nian']});
set('AK150',[],{passive:['chongyue']});
set('AK140',[],{passive:['shu']});
// Canonical basic statuses are shared by player, NPC and summon abilities.
export const STATUS_INFO={
 '加费':'ABC基础费用+12E，持续2自身机会。','嘲讽':'敌方单体与多目标选定优先选择此单位。','寒冷':'速度−15%；再次施加转为冻结1机会。','冻结':'跳过1机会，结束后获得2机会硬控保护。','眩晕':'跳过1机会，结束后获得2机会硬控保护。','睡眠':'跳过1机会，受伤解除并使该段伤害×1.25；结束后获得硬控保护。',
 '沉默':'禁止源石技艺ABC；体术、休整、防御可用。','恐惧':'禁止ABC，直接伤害−20%。','神经损伤':'之后3机会禁止体术和攻击型ABC；不叠加、不刷新。','迟缓':'每层速度−15%，最多2层。','迅捷':'速度+20%。',
 '破防':'每层物理减伤率−10个百分点，最多3层。','破魔':'每层法术减伤率−10个百分点，最多3层。','脆弱':'受到直接伤害+20%。','衰弱':'主动伤害−20%。','灼烧':'每次机会开始受到来源30%P法伤，2机会。','毒':'每层每次机会开始受到来源15%P法伤，3层上限。','凋亡':'满3层消耗全部，对目标造成来源100%P真伤；同一动作每目标最多爆发一次。',
 '迷狂':'最多3层；酒神B消耗至少1层触发神经损伤，C加层到3时触发。','隐匿':'不能被敌方单选；群攻可命中。主动攻击后解除，浮士德开局隐匿例外。','迷彩':'不能被敌方单选；群攻可命中。','不可选中':'不能被敌方单选，多目标选定同样禁止；全体攻击与DOT仍可命中。','锁血':'敌方伤害最低保留1HP；不防自损、力竭或强制退场。','黄昏':'P+35%；机会结束损失12%H。','狂乱':'A+25%，只能体术或攻击型ABC；同时有神经损伤时允许休整和防御。','抵抗':'新获得负面状态持续时间减半，向上取整，至少1机会。','硬控保护':'接下来2次自身机会不被睡眠、冻结或眩晕跳过；硬控结束或连续跳过2次时获得。','行动保护':'直到完成下次自身机会，不受敌方扣行动条或麻痹清条；自身扣条照常。'};
export const ALTER_REFS={AK003:'AK041',AK004:'AK024',AK032:'AK043',AK072:'AK130',AK094:'AK098',AK138:'AK148',AK152:'AK110',AK153:'AK042',AK159:'AK099',AK162:'AK028'};

// V20: additive automatic progression. Alternate identity keeps every base move.
const DAMAGE_SPECIALS=new Set(['wager','rosmontis','relayBuild','relayBurst','relayCharge','transpose','arcCommand','gravityDown','shark','windB','wisA','hostSacrifice','command','wolfHunt','morph','fireLine','cageStrike','meteorRewrite','lateClock']);
export function amplify(ops,f){return ops.map(o=>{let a={...o};
 for(const k of ['coef','perResource','scalesResource','perArmor','perGauge'])if(typeof a[k]==='number')a[k]*=f;
 if(o.op==='percentHit'){a.ratio*=f;a.cap*=f;}
 if(o.op==='special'&&DAMAGE_SPECIALS.has(o.name))a.power=(a.power||1)*f;
 for(const k of ['effects','otherwise','fallback'])if(Array.isArray(o[k]))a[k]=amplify(o[k],f);
 return a;});}
for(const c of CARDS){c.actions.forEach((a,i)=>{a.ops=amplify(a.ops,c.pool==='hidden'?[1.15,1.2,1.35][i]:[1.3,1.4,1.65][i]);});if(c.ascendOps)c.ascendOps=c.ascendOps.map((ops,i)=>amplify(ops,c.pool==='hidden'?[1.15,1.2,1.35][i]:[1.3,1.4,1.65][i]));}
// Source corrections: decisive arts retain their canonical multiple-target role.
BY_ID.AK018.actions[2].target='enemy_up_to_three';
BY_ID.AK018.actions[2].ops=[hit(3.6),gauge(-60),shield(.18,'allies')];
BY_ID.AK018.actions[2].label='延异视阈';BY_ID.AK018.actions[2].cost=44;
BY_ID.AK014.actions[2].target='enemy_all';
BY_ID.AK015.actions[2].target='enemy_all';
BY_ID.AK054.actions[2].target='enemy_up_to_three';
BY_ID.AK152.actions[2].target='enemy_all';
installV21(BY_ID,{hit,st,gain,use,shield,energy,special,gauge});
export function evolvedCard(card,mastery){if(card.variant||mastery<200)return card;
 const ref=card.id==='AK086'?'AK086':card.id==='AK015'?'AK015':ALTER_REFS[card.id];if(!ref)return card;
 let c=structuredClone(card);c.variant=true;c.baseArt=card.id;
 if(card.id==='AK086')Object.assign(c,{source:'新约能天使',name:'使命必达！',cap:16,initial:12,ammoRecovery:{natural:2,rest:4,kill:3}});
 else if(card.id==='AK015'){Object.assign(c,{source:'纯烬艾雅法拉',name:'火山回响'});for(const a of c.actions)a.ops.push(heal(.12,'allies'),{op:'cleanse',to:'allies'});}
 else {const alt=BY_ID[ref];c.id=alt.id;c.source=alt.source;c.name=alt.name;c.passive=[...new Set([...card.passive,...alt.passive])];c.passiveText=c.passive.map(p=>PASSIVE_TEXT[p]);
  if(card.id==='AK094'){c.actions[0].ops.push(special('wisA',{power:1.3}));c.actions[2].ops.push(special('wisC'));}
  else for(const a of c.actions)a.ops.push(shield(.08),energy(6));
 }
 return c;
}
export function actionFor(card,index,mastery=0){card=evolvedCard(card,mastery);let a=structuredClone(card.actions[index]);
 if(mastery>=200&&card.ascendOps){a.name='冬痕';a.label=['冰封白夜','雪怪小队','强制退场'][index];a.ops=structuredClone(card.ascendOps[index]);if(index===0)a.target='enemy_all';if(index===1){a.cost=Math.min(a.cost,30);a.target='self';}if(index===2){a.cost=Math.min(a.cost,60);a.fromTurn=4;}}
 if(!card.id.startsWith('npc:')&&mastery>=100&&index<2){a.ops=amplify(a.ops,1.15);a.cost=Math.max(0,a.cost-3);}
 if(!card.id.startsWith('npc:')&&mastery>=200){a.ops=amplify(a.ops,1.2);a.cost=Math.max(0,a.cost-(index===2?4:2));}
 if(a.fixedCoefficient)a.ops[0].coef=a.fixedCoefficient;
 const rule=resourceRule(card,mastery);if(rule){a.resourceName=rule.name;a.resourceCap=rule.cap;}a.cd=index===2?(card.id==='AK011'?2:Math.min(1,a.cd||0)):0;return a;
}
export function describeOp(o){return cleanNumbers(describeRaw(o));}
function describeRaw(o){const target={self:'自身',ally:'所选友方',allies:'己方全体',target:'目标'}[o.to]||'目标';switch(o.op){case'damage':return `造成${o.hitsResource?'消耗层数':o.hits||1}${o.extraHitsResource?'+消耗层数':''}段${Number((o.coef*100).toFixed(2))}%${o.basis}${o.perResource?`（每消耗1层再加${Number((o.perResource*100).toFixed(2))}个百分点）`:''}${{physical:'物理',magic:'法术',true:'真实'}[o.type]}伤害${o.scalesResource?'；每持有1层资源伤害系数再加'+Number((o.scalesResource*100).toFixed(2))+'个百分点':''}${o.perGauge?'；目标每点行动条伤害系数再加'+o.perGauge+'个百分点':''}${o.perArmor?'；额外伤害系数为'+Number((o.perArmor*100).toFixed(2))+'%×min(0.6,目标按本招攻击基础计算的物理减伤率)':''}${o.ignoreDefense?'；该段减伤率降低'+o.ignoreDefense*100+'个百分点':''}${o.ignoreShieldAt?'；消耗至少'+o.ignoreShieldAt+'层资源时无视护盾':''}${o.nonlethal?'；本段伤害最低保留目标1生命':''}`;case'status':return `${target}获得${o.n}层${o.name}，持续${o.duration}次自身机会`;case'gain':return `获得${o.n}层专属资源，不超过上限`;case'consume':return `消耗${o.n==='all'?'全部':o.n+'层'}专属资源`;case'shield':return `${target}获得${o.ratio*100}%最大生命护盾，${o.duration}次机会`;case'heal':return `${target}恢复${o.ratio*100}%最大生命`;case'energy':return `${target}${o.n>=0?'恢复':'失去'}${Math.abs(o.n)}技力`;case'gauge':return `${target}行动条${o.n>0?'+':''}${o.n}，范围0—95`;case'life':return `支付${o.ratio*100}%自身最大生命，不能致死`;case'cleanse':return `净化${target}全部可净化负面状态`;case'conditional':return `目标有${o.status}时${o.consume?'移除该状态并':''}：${o.effects.map(describeOp).join('；')}`;case'delayed':return `${o.turns}次自身机会后：${o.effects.map(describeOp).join('；')}，触发${o.repeat||1}次`;case'summon':o=tuneSummon({},o,[]);return `生成${o.count||1}个${o.name}：生命${o.h*100}%H，攻击${o.a*100}%${o.basis}，防御${Math.round((o.d??1)*100)}%D、魔抗${Math.round((o.r??1)*100)}%R，独立行动（速度${o.v||0}），上限${o.limit}，${o.duration>=99?'持续本场':o.duration+'次主人机会'}${o.taunt?'，嘲讽':''}`;case'special':return (SPECIAL_TEXT[o.name]||o.name)+(o.power&&Math.abs(o.power-1)>1e-6?'；本招伤害系数×'+Number(o.power.toFixed(4)): '');default:{let text=describeEffect(o,describeOp);if(text===null||text===undefined)throw Error('Untranslated effect '+o.op);return text;}}}
export const SPECIAL_TEXT={fremontSeal:'至少2未封存敌方主体且没有黑棺时封存HP比例最高的合法主体；黑棺20%H、双抗100%、攻击0，2主人机会或棺破释放；无法封存时改为沉默1机会与行动条−60',cageStrike:'对全部敌方茧笼各造成220%P法伤',fireLine:'对目标造成(300−60×存活冷却装置数)%P法伤，最低120%P',seal:'至少2名未封存敌方主体时，封存1名敌方NPC；生成黑棺设施（20%H、双抗100%、攻击0），2主人机会或棺破后释放；不能封存最后一名主体',cancelDefense:'移除目标当前防御减伤',resourceLife:'每消耗1层支付3%H，不能致死',resourceEnergy:'消耗至少4层回复8E',wolvesSummon:'补足3只猎狼，生命14%H、攻击50%A物伤、双抗100%，寿命4主人机会；不治疗或刷新旧狼',wolfHunt:'自己的猎狼立即攻击目标；随后每次普攻附迟缓1机会，直到本只狼消失',snowSquad:'补齐雪怪术师和凿冰人各1名并治疗旧队员至满：生命24%/32%H，攻击55%Q法伤/70%Q物伤，双抗100%，寿命4；术师第3次攻击施加寒冷，凿冰人攻击冻结目标系数×2',resourceHaste:'消耗至少2层时自身行动条+60',resourceDelay:'消耗至少2层时目标行动条−60',record:'记录当前目标',wager:'预测目标下一行动：攻击或非攻击。正确造成200%P法伤并获得1资源，错误造成80%P法伤',dismiss:'自身第4次机会起，令一个非设施敌人强制退场，不触发死亡、复活或阶段重生',equipmentConsume:'移除自己1件战术装备并使目标行动条−60',rosmontis:'按敌方作战单位数生成等量嘲讽战术装备（30%H、攻击0、3主人机会），替换旧装备；对敌方全体造成360%P物伤',morph:'切换流形物理/法术形态，回复其30%H并立即攻击一次',copyAlly:'存活流形改为所选友方65%较高攻击属性，保留其物理/法术形态',relayBuild:'M不足200获得1中继资源；M200生成1中继设施（25%H，初始0HP，每主人机会恢复25%；满血自毁并全体260%P法伤），上限3，满额改修复25%',relayBurst:'主目标造成(140+30×中继数)%P法伤，另一敌人造成40×中继数%P法伤；M不足200消耗资源，升变后不消耗设施',relayCharge:'未满3座先创建1座，随后所有中继恢复50%H，满血立即引爆',fragmentRefund:'本动作每伤害1个不同敌人恢复4E并获得1裂片',echoGain:'上次动作是休整或防御获得2残响，否则1',saveResource:'记录当前资源；下一次消耗后返还记录的一半，向下取整',toggle:'切换专属姿态',transpose:'普通姿态220%P单体法伤；转置姿态140%P全体法伤；随后关闭转置',sacrifice:'需并移除自己1只随从',servantShield:'移除1只随从，把剩余HP的60%转为所选友方盾，上限其15%H',arcSummon:'部署所选防御/物理/法术仆役，上限3；满额治疗1只50%H',arcCommand:'防御型：自己与仆役25%H盾；物理型：每仆役3段35%A；法术型：每仆役90%P并迟缓、脆弱',arcConcerto:'有仆役时回收1只，治疗自身20%H并获得1协奏；每协奏让主动攻击额外造成30%P法伤',neural:'需目标有迷狂，消耗全部迷狂并施加神经损伤3机会',neuralAt3:'本次使迷狂达到3的目标消耗迷狂并获得神经损伤3机会',gravityUp:'切为上升：不可被敌方单体选中',gravityDown:'上升时230%P法伤后下落；下落时160%P法伤并自身行动条+60',gravityToggle:'重力方向反转',endTwilight:'结束黄昏增幅与后续生命支付，不恢复B次数',shark:'敌方生命比例不低于自己时追加120%Q物伤',windA:'逆风时自身行动条+60，随后切换风向',windB:'顺风时追加60%A物伤，随后切换风向',revive:'每场至多复活1名阵亡友方主体：40%H、20E、行动条0，不刷新资源、冷却或限次；强制退场者不可复活',wisA:'普通110%A物伤；重炮弹非零时消耗1发，对敌方全体300%A物伤并行动条−60；获得1魂影；目标预告伤害型ABC时自身6%H盾。重炮A基础22E、CD0，击杀返1弹，每次C最多返2发',wisC:'魂灵之影补至3只、旧个体满血：20%H，60%A法伤、双抗100%，本场持续；装满6重炮弹，覆盖旧弹。任一魂灵之影存活时主人迷彩',command:'自己的每只随从对所选目标立即攻击一次',wendigo:'汲取目标本场基础最大生命8%（累计最多30%），裁切当前HP；将实际减少值治疗所选友方，护盾不能抵挡',hostSacrifice:'移除1名友方狂乱，令其失去6%H，对目标追加70%P法伤',reveal:'清除目标隐匿与迷彩；无法揭露重力上升的不可选中',breakShield:'清空目标现有护盾'};
Object.assign(SPECIAL_TEXT,{
 wolvesSummon:'补足3只猎狼：28%主人生命、65%主人体术强度物伤、65%防御、60%魔抗、速度115，独立行动，持续4主人机会；不治疗或刷新旧狼。',
 snowSquad:'补齐雪怪术师与凿冰人各1名，旧队员满血。术师：35%主人生命、70%主人较高攻击强度法伤、55%防御、130%魔抗、速度85，每第3次攻击寒冷2机会；凿冰人：50%生命、95%较高攻击强度物伤、110%防御、55%魔抗、速度85，攻击冻结目标伤害×2。均独立行动，持续4主人机会。',
 wisC:'魂灵之影补至3只，旧个体滿血：32%主人生命、70%主人体术强度法伤、80%防御、110%魔抗、速度90，独立行动、本场持续；装满6发重炮弹。至少1只存活时主人迷彩。'
});
export function resourceRule(card,mastery=0){
 if(!card)return null;const id=card.baseArt||card.id;
 if(id==='AK013'&&mastery>=200)return {name:'中继设施',cap:3,facilities:true};
 if(id==='AK030')return {name:'仆役',cap:2,summons:true};
 const resourceOps=new Set(['gain','consume','resourceSet','cycleResource','focusGain','focusSet','cleanseGain','energyHarvest']);
 const scan=ops=>ops.some(o=>resourceOps.has(o.op)||o.perResource||o.scalesResource||o.hitsResource||o.extraHitsResource||scan(o.effects||[])||scan(o.otherwise||[])||scan(o.fallback||[]));
 const used=scan(card.actions.flatMap(a=>a.ops))||['AK013','AK035','AK098','AK209'].includes(id);
 return card.resource&&used?{name:card.resource,cap:card.cap}:null;
}
export const actionText=a=>cleanNumbers((a.ops.map(describeOp).join('；').replace(/专属资源/g,a.resourceName?'【'+a.resourceName+'】':'专属资源')+'。'+(a.resourceName?'专属资源【'+a.resourceName+'】上限'+a.resourceCap+'。':'')).replace(/。+/g,'。'));
export function npcCard(unit){let card={id:'npc:'+unit.id,name:unit.name,source:unit.name,pool:'normal',resource:null,cap:3,initial:0,passive:[],actions:[]};card.actions=Object.entries(unit.skills).map(([button,a])=>({button,name:a.name,label:a.name,cost:a.base_E,cd:a.CD,unlock:0,target:/全体|敌二|敌三/.test(a.target)?'enemy_all':/友/.test(a.target)?'ally_one':/自己|自身/.test(a.target)?'self':'enemy_one',ops:[]}));installNPC(card,unit,{hit,st,shield,heal,energy,gauge,summon,special});return card;}



Object.assign(SPECIAL_TEXT,{meteorRewrite:'消耗全部火陨；向每名敌人预置陨石，下次该敌人机会开始受到(300+150×消耗层数)%P法伤并施加2层破魔、持续2目标机会；系数随本招伤害倍率升级；重新获得1火陨。已预约的陨石独立结算，目标提前死亡则取消',copyFlow:'选择友方主体为样本，创建或替换基础流形：复制样本65%生命上限、体术强度、技艺强度、防御、魔抗，速度100%、技力0，持续本场；保留所选物理/法术形态。仅自己时可复制自身；不复制特性、资源或状态。重置流形会移除其临时分身',flowBurst:'须有基础流形。额外生成4个完全相同面板和形态的临时流形，立即进入行动序列，独立自动行动；持续100行动时间（速度100的一轮），到期销毁且不触发死亡／击杀收益；上限为1基础+4临时；冷却2回合',lateClock:'每名敌人记录当前行动条，预约其下次机会开始受到(120+180×min(当前行动条,100)/100)%P法伤；系数随本招升级，施放后的加减条不改变已记录伤害。钟声在敌人选意图前结算',countryExecute:'第4战场轮起、本场仅1次：对带国度的合法敌人施加致命真实伤害，无视护盾、双抗与锁血；正常触发复活或阶段变化，不等于强制退场。没有合法国度目标时不能释放',shuoBlades:'按1+宿傲层数补足敛傲（最多5）：生命30%主人H、攻击180%主人较高攻击强度、双抗60%、速度120；每只独立完成首次攻击后销毁，不触发击杀收益；旧敛傲不刷新',shuoBody:'第4自身机会起，强制退场1名可选非设施敌人；生成1节身形（120%主人生命、140%较高攻击强度物伤、双抗150%、速度70、嘲讽），持续2完整主人机会。身形在场时主人免疫伤害；替换旧身形，不触发死亡收益'});
export const PASSIVE_TEXT={shuo:'暴武：宿傲上限4；每层使溯律额外生成1枚敛傲。醉生提供30%双攻击增幅及下一段直接伤害必定闪避。描躯的身形在场时主人免疫普通伤害；处决、强制退场仍有效。',fremont:'M200时敌方实体首次死亡有0.1%概率召来愤怒的弗莱蒙特，全场最多1次；其能量上限3、每颗减物法伤10%，首次致命伤复起60%H，黑棺可封存主体2机会。',deathServant:'敌方实际死亡生成仆役；超过2只时将新仆役的12%H、50%P攻击与100%双抗叠加给最早的一只。',arcStart:'开局部署所选仆役1只：防御/物理/法术型分别40/20/18%H、30/70/70%A/A/P攻击；双抗100%；防御型嘲讽，寿命5主人机会。',gravity:'开局重力上升，不能被敌方单体选中；全体攻击仍可命中。',engineer:'初始结构性原理：45%H、70%A物伤、100%双抗、嘲讽；被毁后第3次主人机会重建。',teamHaste:'M200后每次主动攻击令己方全体主体行动条+40。',wisStart:'初始2只魂灵之影：20%H、60%A法伤、100%双抗；至少1只在场时主人迷彩。',swire:'自身最大生命减半；每场3次致命伤复活至减半后50%H，强退与力竭不触发。',chimera:'初始P+15%。',demonRevive:'己方其他主体首次实际阵亡时复活至30%H，全场共1次。',dusk:'首次普通致命伤保留1HP、清除负面状态并获得30%H盾。',shu:'每次自身机会开始治疗生命比例最低的友方5%H。',nian:'初始最大生命+25%，当前生命同比增加。',forge:'前8次自身机会开始获得1炉火。',chongyue:'A/P中较低者至少为较高者90%。',lifesteal:'主动伤害的实际HP损失20%治疗自己，每次自身机会累计上限12%H。',forms:'开局所选形态对应A/P/H+30%；变形时移除旧加成并施加新加成。',nilu:'初始抵抗；每个在场尼卢火使主人受到的直接伤害乘0.85，最多2个。',journey:'每次攻击+1征途，休整或防御清零，最多3。',calendar:'每次自身机会记录自身HP/E，快照保留2机会。',hosts:'初始狂暴宿主寄生者35%H/80%A、自损5%H，宿主士兵25%H/50%A；双抗100%；各自被毁后第3主人机会重建。',faust:'初始隐匿3自身机会，期间攻击不解除。',blackSnake:'首次普通致命伤复起25%H。',oath:'开场己方主体获得12%各自H护盾。',bulwark:'每层城垒减少10%直接伤害，上限3层。',burden:'至少2承载时首次普通致命伤消耗承载、保留1HP并获得30%H盾。',patriotPrime:'初始最大生命与当前生命+30%。'};
Object.assign(PASSIVE_TEXT,{
 deathServant:'敌方实体首次实际死亡生成仆役：30%主人最大生命、70%主人技艺强度攻击、80%防御、100%魔抗，速度90。超过2只时这些属性叠加给最早的一只。',
 arcStart:'开局选择1只仆役。防御型：70%生命、45%体术攻击、150%防御、100%魔抗、速度75、嘲讽；物理型：32%生命、85%体术攻击、80%防御、60%魔抗、速度105；法术型：30%生命、85%技艺攻击、55%防御、120%魔抗、速度90。各自独立行动，持续5主人机会。',
 engineer:'初始结构性原理：70%主人生命、80%体术攻击、135%防御、100%魔抗、速度80、嘲讽；独立行动，被毁后第3主人机会重建。',
 wisStart:'初始2只魂灵之影：32%主人生命、70%主人体术强度法伤、80%防御、110%魔抗、速度90，独立行动；至少1只在场时主人迷彩。',
 hosts:'初始3只宿主：重装组长95%生命/65%较高攻击/150%防御/40%魔抗/速度70/每次自身行动恢复4%生命且嘲讽；流浪者80%生命/95%较高攻击/60%防御/120%魔抗/速度90/每次自身行动恢复6%生命；狂暴士兵75%生命/145%较高攻击/25%防御/120%魔抗/速度115/每次行动后失去5%生命。均独立造成物伤，分别被毁后第3主人机会重建。'
});
for(const c of CARDS){c.passive=c.passive.filter(p=>PASSIVE_TEXT[p]);c.passiveText=c.passive.map(p=>PASSIVE_TEXT[p]);c.tip=resourceRule(c)?`积累${c.resource}，再决定消耗时机；休整与防御可帮助等待招式冷却。`:c.marker?`先布置${c.marker}，观察敌方意图后选择后续招式。`:'观察敌方意图，选择伤害、控制或支援招式；先完成本场任务目标。';}
