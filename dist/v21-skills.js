// Adapted game rules, not canonical Arknights statistics.
export const SHUO_RAW={art_id:'AK221',source:'朔（朔壳原型）',source_rarity:'传奇',name:'暴武',pool:'hidden',pool_weight:2,source_url:'https://prts.wiki/w/朔壳',name_review:'review_required',lore_status:'界园五结局Boss机制改编；同人命名待审',rule_text:'【宿傲】初始0，上限4。',actions:[{button:'A',name:'醉生',operation_label:'醉生',base_cost:20,cooldown:0,target:'self'},{button:'B',name:'溯律',operation_label:'溯律',base_cost:38,cooldown:0,target:'enemy_one'},{button:'C',name:'描躯',operation_label:'描躯',base_cost:64,cooldown:1,target:'enemy_one'}]};
export function installV21(by,{hit,st,gain,use,shield,energy,special,gauge}){
 const C=(id,ops,extra={})=>Object.assign(by[id].actions[2],{ops,cd:1,...extra});
 // Resource multiplier is snapshotted when the delayed meteor is placed.
 C('AK006',[special('meteorRewrite',{power:1})],{target:'enemy_all',label:'陨星改轨'});
 C('AK009',[hit(1.8),{op:'randomNegative',count:3,duration:2}],{target:'enemy_up_to_two'});
 Object.assign(by.AK011.actions[0],{target:'ally_main_one',label:'生成流形',ops:[special('copyFlow')]});
 C('AK011',[special('flowBurst')],{target:'self',cd:2,cost:44});
 for(const a of by.AK012.actions)a.target='enemy_all';
 C('AK012',[{op:'consumeMark',name:'焦土'},hit(2.4,'P','magic',{perResource:.8}),st('灼烧',1,2),{op:'mark',name:'焦土',n:1,cap:3,duration:3,to:'target'},{op:'buff',name:'焦土封锁',values:{shieldPenalty:.6,healPenalty:.4},duration:2,to:'target'}],{target:'enemy_all'});
 C('AK014',[special('lateClock',{power:1}),gauge(-60),st('迟缓',2,2)],{target:'enemy_all'});
 for(const a of by.AK095.actions)a.target='enemy_all';
 // These bookkeeping effects run once per cast, never once per enemy.
 by.AK095.actions[0].ops=by.AK095.actions[0].ops.map(o=>o.op==='focusGain'?{op:'focusGain',once:true}:o);
 by.AK095.actions[2].ops=by.AK095.actions[2].ops.map(o=>o.op==='focusSet'?{...o,once:true}:o);
 by.AK097.actions[2].fixedCoefficient=7.99;
 by.AK192.actions[2].ops[0].coef=4.5;
 by.AK192.actions[2].ops[1].effects=[energy(-20,'holder'),{op:'heal',ratio:.12,to:'self'}];
 by.AK195.actions[2].ops=[use(1),shield(.5,'ally',3),energy(24,'ally')];
 by.AK195.actions[2].minResource=1;
 by.AK029.resource=null;by.AK029.marker='麻痹';
 by.AK215.actions[0].ops.find(o=>o.name==='国度迟滞').values.V=-.5;
 C('AK215',[special('countryExecute')],{target:'enemy_one',limit:1,fromRound:4,requireMark:'国度'});
 const s=by.AK221;Object.assign(s,{resource:'宿傲',cap:4,initial:0,passive:['shuo'],marker:null});
 s.actions[0].ops=[gain(1),shield(.2),{op:'buff',name:'暴武',values:{A:.3,P:.3,dodge:1},to:'self',duration:2}];
 s.actions[1].ops=[hit(2.8,'Q','physical'),special('shuoBlades')];
 s.actions[2].ops=[special('shuoBody')];s.actions[2].fromTurn=4;
}
