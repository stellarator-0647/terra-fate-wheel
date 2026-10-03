// Deterministic two-ply beam search. This optimizes a declared utility, not all future play.
const bad=['冻结','眩晕','睡眠','沉默','恐惧','神经损伤','破防','破魔','毒','灼烧','凋亡'];
function utility(b,side,base){
 if(b.over)return (b.over.won===(side==='ally')?1:-1)*10000;
 let score=0;
 for(const u of b.units){const sign=u.side===side?1:-1,w=u.isPlayer?2.6:u.owner?.length ? .45 : u.facility ? .45 : 1;
  const max=base.get(u.id)||u.stats.H;
  if(u.removed||u.hp<=0){score-=sign*w*.6;continue;}
  score+=sign*w*(u.hp/max+.12*Math.min(.5,u.shields.reduce((n,s)=>n+s.hp,0)/max)+.12*u.e/Math.max(1,u.stats.Emax)+.05*u.gauge/100);
  if(u.owner&&!base.has(u.id))score+=sign*.2;
  for(const [name,s]of Object.entries(u.statuses))if(s.until>=u.turn){let n=Math.min(3,s.until-u.turn+1);score-=sign*w*(bad.includes(name)?(['冻结','眩晕','睡眠','神经损伤'].includes(name)?.09:.045)*n:0);}
  if(u.defending){let foes=b.units.filter(v=>v.side!==u.side&&v.hp>0&&!v.removed);let threat=foes.reduce((n,v)=>n+Math.max(v.stats.A,v.stats.P)*(v.intent?.target===u.id?1:.2),0);score+=sign*w*Math.min(.1,.1*threat/max);}
  if(u.res&&u.cap)score+=sign*.035*Math.min(1,u.res/u.cap);
 }
 if(side==='ally')score+=(b.scene.destroyed||0)*.45+(b.scene.progress||0)*.55+(b.scene.needDefense?Math.min(b.scene.needDefense,b.scene.defenses||0)*.22:0)+(b.scene.shots||0)*.6+(b.scene.integrity||0)*.25-(b.scene.fire||0)*.35+(b.scene.checked?.length||0)*.45;
 return score;
}
export function tacticalSearch(b,u,api){
 const candidates=[],base=new Map(b.units.map(v=>[v.id,v.stats.H]));
 for(const button of ['C','B','A','martial','rest','defend']){
  if(api.legal(b,u,button))continue;
  const a=api.skill(u,button),support=['rest','defend'].includes(button);
  let list=support?[u]:api.targets(b,u,a||{target:'enemy_one',ops:[]});
  if(a?.target==='enemy_all'||a?.target?.includes('all')||a?.target==='self')list=list.slice(0,1);
  for(const target of list){let choices=[{}];
   if(button==='defend')choices=[{}, {cover:true}];
   if(a?.ops.some(o=>o.to==='ally'))choices=api.targets(b,u,{target:'ally_one',ops:[]}).map(v=>({ally:v.id}));
   if(a?.ops.some(o=>o.op==='special'&&o.name==='wager'))choices=[{wager:'attack'},{wager:'support'}];
   const modes=api.cardOf(u)?.modes;if(modes&&u.card!=='AK035'&&a)choices=modes.map((_,mode)=>({mode}));
   if(b.spec.id==='N11-3'&&u.isPlayer&&a&&b.scene.ammo>1&&!b.scene.pending)choices.push({charge:true});
   for(const choice of choices)candidates.push({button,target:target.id,choice});
  }
 }
 let evaluated=[];
 for(const candidate of candidates){
  try{const next=structuredClone(b);next.config={...next.config,aiEvaluation:true};next.actor=u.id;
   api.act(next,candidate.button,candidate.target,candidate.choice);
   evaluated.push({candidate,next,score:utility(next,u.side,base)});
  }catch(e){if(!/目标不可选|分支不合法/.test(e.message))throw e;}
 }
 evaluated.sort((a,c)=>c.score-a.score);
 // Evaluate the next automatic response only for the three strongest immediate moves.
 for(const row of evaluated.slice(0,3))if(!row.next.over){
  const next=structuredClone(row.next);api.advance(next);
  if(next.actor&&!next.over){let actor=next.units.find(v=>v.id===next.actor),reply=api.chooseLegacyAI(next,actor);api.act(next,reply.button,reply.target,reply.choice||{});}
  row.score=.35*row.score+.65*utility(next,u.side,base);
 }
 return evaluated.slice(0,3).sort((a,c)=>c.score-a.score)[0]?.candidate||{button:'rest',target:u.id};
}
