import {DATA} from './data.js';
import {BY_ID} from './cards.js';
import {derive,numericRating,tierLabel} from './math.js';
import {isLeader} from './unit-info.js';

export const OUTCOME_NAMES={defeated:'战场击败',dismissed:'强制退场',repelled:'目标达成 · 未击败',standing:'未解除'};
const weight={defeated:4,dismissed:3,repelled:2,standing:1};
const encounterId=r=>String(r.id||'').split(':')[0];
const uniqueBy=(rows,key)=>[...new Map(rows.map(r=>[key(r),r])).values()];
const safe=n=>Number.isFinite(n)?n:0;
export function battleRecord(b,day=0){
 const bosses=b.units.filter(u=>u.side==='enemy'&&isLeader(u)).map(u=>({
  key:u.npcId||u.card||u.name,name:u.name,grade:tierLabel(numericRating(u.stats).score),score:numericRating(u.stats).score,
  outcome:u.hp<=0&&(b.seenDeaths||[]).includes(u.id)?'defeated':u.removed?'dismissed':b.over?.won?'repelled':'standing',
  scope:u.npcId==='cluster'?'局部分体':u.npcId==='theresa'?'心象交锋':'本场作战'
 }));
 return {version:1,day,bosses,telemetry:b.telemetry?structuredClone(b.telemetry):null,
  summons:b.units.filter(u=>u.side==='ally'&&u.owner&&!u.facility&&!u.relay).length,
  facilities:b.scene.destroyed||0,shots:b.scene.shots||0,checks:b.scene.checked?.length||0,
  allies:b.units.filter(u=>u.side==='ally'&&u.npcId&&!u.owner).map(u=>({id:u.npcId,name:u.name,exited:u.hp<=0||u.removed})),
  playerExited:b.units.some(u=>u.isPlayer&&(u.hp<=0||u.removed))};
}
export function initialStats(s){
 if(s.startStats)return s.startStats;
 const rolls=s.rolls?.slice(5,10);
 return rolls?.length===5&&rolls.every(r=>Number.isFinite(r.score))?derive(rolls.map(r=>r.score),s.identity):null;
}
const CHAPTER_ENDINGS=[
 ['废墟之后','切尔诺伯格的火光被甩在身后。撤离路线没有抹去这座城的伤口，却让下一次救援仍然可能发生。'],
 ['城门内外','龙门的灯没有照亮每一处街巷。你记住了关卡两侧的人，也把感染者营地的呼声带回了罗德岛。'],
 ['雪线之外','离开废墟时，雪还在落。你带走的不是一场关于胜负的争论，而是在低温与追兵之间争取到的生路。'],
 ['冬日的窗口','宿主的脚步与游击队的长影留在城中。撤离窗口终于打开，这段行动被写进了罗德岛的冬日记录。'],
 ['穿过地下的光','地面的争执没有结束。你打开了地下通道，把疏散的秩序从封锁与爆破之间接了回来。'],
 ['火焰尽头','核心塔的烈焰仍在记忆里翻涌。你守住的每一次机会，都成为队伍走出火海的条件。'],
 ['长夜留灯','小丘郡的屋檐仍有烟痕。诊所与街巷曾经需要有人停下脚步，而这次你留下了救援能够继续的空间。'],
 ['灰城的航线','伦蒂尼姆的炮声没有随行动结束而消失。你穿过了封锁，也把通往下一片街区的路线留在了终端里。'],
 ['王庭的余温','旧王庭的钢铁与蒸汽渐渐冷却。你守过的道路通向更多尚未结束的战线，这一章的尽头不是和平的保证。'],
 ['记住自己的名字','迷雾曾让每一个熟悉的轮廓变得可疑。你带回了核验与接应的记录，让下一支队伍知道可以信任什么。'],
 ['血潮之外','装药、掩护与等待都写入了记录。殷红的威胁没有被一句胜利宣言抹去，你为城市争得了继续前行的窗口。'],
 ['灯塔仍在回应','心象中的茧笼不再封住所有回应。你带回的是那些被接引的愿望，而罗德岛的灯塔仍朝着这片大地亮着。']
];
const sum=(rows,f)=>rows.reduce((n,r)=>n+safe(f(r)),0);
export function journeyReport(s){
 const history=s.history||[],wins=uniqueBy(history.filter(r=>r.won),encounterId),daily=s.dailyHistory||[];
 const current=DATA.campaign.nodes[s.nodeIndex]||DATA.campaign.nodes[0],start=DATA.campaign.nodes[s.startNode]||current;
 const completed=DATA.campaign.nodes.filter(n=>n.battles.every(b=>wins.some(r=>encounterId(r)===b.id)));
 const visited=DATA.campaign.nodes.filter(n=>n.id===current.id||history.some(r=>encounterId(r).startsWith(n.id+'-')));
 const records=history.filter(r=>r.record),bossMap=new Map();
 for(const r of records)for(const b of r.record.bosses||[]){const key=encounterId(r)+'/'+b.key,old=bossMap.get(key);
  if(!old||weight[b.outcome]>weight[old.outcome])bossMap.set(key,{...b,battle:r.title,battleId:encounterId(r),day:r.day??r.record.day,rounds:r.rounds,won:r.won});}
 const bosses=[...bossMap.values()],defeated=bosses.filter(b=>b.outcome==='defeated');
 const telemetry=records.map(r=>r.record.telemetry).filter(Boolean),actions={};
 for(const t of telemetry)for(const [k,n]of Object.entries(t.actions||{}))actions[k]=(actions[k]||0)+safe(n);
 const projects=new Map();for(const r of daily)if(r.type!=='vector')projects.set(r.name,(projects.get(r.name)||0)+1);
 const favoriteTraining=[...projects].sort((a,b)=>b[1]-a[1])[0];
 const vectors=daily.filter(r=>r.type==='vector'),initial=initialStats(s),final=s.stats;
 const hardest=[...defeated].sort((a,b)=>b.score-a.score)[0];
 const milestones=[];
 for(const threshold of [100,200])if(s.mastery>=threshold){const rows=[...history.map(r=>({day:r.day,from:r.before?.mastery,to:r.after?.mastery,title:r.title})),...daily.map(r=>({day:r.day,from:r.masteryBefore,to:(r.masteryBefore??0)+(r.mastery||0),title:r.name}))];const first=rows.filter(r=>Number.isFinite(r.from)&&r.from<threshold&&r.to>=threshold).sort((a,b)=>(a.day??Infinity)-(b.day??Infinity))[0];milestones.push({threshold,day:first?.day,title:first?.title});}
 const report={current,start,visited,completed,wins,bosses,defeated,hardest,initial,final,actions,milestones,favoriteTraining,
  attempts:history.length,evacuations:uniqueBy(history.filter(r=>!r.won),encounterId).filter(r=>!wins.some(w=>encounterId(w)===encounterId(r))).length,
  failures:history.filter(r=>!r.won).length,retries:history.length-new Set(history.map(encounterId)).size,
  rounds:sum(history,r=>r.rounds),rescues:history.filter(r=>r.rescued).length,days:s.day||0,
  vectorWins:vectors.filter(r=>r.won).length,vectorAttempts:vectors.length,trainingDays:daily.filter(r=>r.type!=='vector').length,
  allyDamage:sum(telemetry,t=>t.damage?.ally),shieldDamage:sum(telemetry,t=>t.shieldDamage?.ally),healing:sum(telemetry,t=>t.healing?.ally),
  supplies:sum(records,r=>(r.record.telemetry?.actions?.firstAid||0)*2+(r.record.telemetry?.actions?.fieldMedical||0)*4),
  summons:sum(records,r=>r.record.summons),facilities:sum(records,r=>r.record.facilities),shots:sum(records,r=>r.record.shots),checks:sum(records,r=>r.record.checks),
  companions:uniqueBy(records.flatMap(r=>r.record.allies||[]),r=>r.id),
  partial:records.length<history.length||telemetry.length<records.length||telemetry.some(t=>t.partial),
  fatal:['阵亡','全队覆灭'].includes(s.ending),art:BY_ID[s.art]};
 report.story=endingStory(s,report);report.imprints=imprints(s,report);return report;
}
export function endingStory(s,r){
 const [chapterTitle,closure]=CHAPTER_ENDINGS[DATA.campaign.nodes.indexOf(r.current)]||CHAPTER_ENDINGS[0];
 const success=r.completed.some(n=>n.id===r.current.id)&&!r.fatal;
 const title=r.fatal?'此处仍有你的足迹':success?chapterTitle:r.evacuations?'未闭合的航线':'一页未尽的记录';
 const origin=s.rolls?.[0]?.name||'尚未记录的故乡',race=s.rolls?.[1]?.name||'旅人',art=r.art;
 const opening=`来自${origin}的${race}，以“${s.name}”之名在${r.start.name}醒来。${s.identity==='I01'?'感染并未替你决定将走向哪里，源石的回应随每一次选择而改变。':'你把尚可承受的体力留给了行路、坚守与下一次决策。'}${art?'最初与你相遇的是'+art.name+'，其原型来自'+art.source+'。':''}`;
 const road=r.visited.length>1?`从${r.start.name}到${r.current.name}，档案记录了${r.visited.length}处抵达的节点、${r.wins.length}场完成的任务。`:`在${r.current.name}，你完成了${r.wins.length}场任务。`;
 const growth=r.initial?`你的综合战力从${tierLabel(numericRating(r.initial).score)}成长为${tierLabel(numericRating(r.final).score)}。${r.days?String(r.days)+'个准备日，把转盘的偶然磨成了可以使用的能力。':'没有被使用的准备日留在了身后，实战成为这段记录的主要来源。'}`:'最终能力与成长留在了档案中；这份旧记录未保存完整的起点。';
 const combat=r.hardest?`最强的一份击败记录属于${r.hardest.name}（${r.hardest.grade}），发生在“${r.hardest.battle}”。${r.hardest.scope==='心象交锋'?'这是一场心象交锋的战果，不代表对其命运的改写。':r.hardest.scope==='局部分体'?'击倒的是局部分体，集群的存在并未因此终结。':'终端保存的是这次战场交锋的结果。'}`:r.bosses.some(b=>b.outcome==='repelled')?'有些强敌仍留在战场。你完成了目标，拿到了继续前行的窗口；这些遭遇按任务记录封存。':'这一页尚没有经核实的Boss击败记录，已经完成的行动仍有它们的分量。';
 const conclusion=r.fatal?`最后的信号停在“${s.history?.at(-1)?.title||r.current.name}”。全队战斗单位退出后，PRTS封存了这段旅程；此前打开的通道和已经完成的救援，仍留在记录里。`:success?closure:`行动离开了${r.current.name}，${r.evacuations?'未完成的任务以撤离记录保留，':'尚未抵达的终点留给下一次出发，'}${r.wins.length?'已经完成的'+r.wins.length+'场行动没有被这一页的结束抹去。':'这份档案记住了一个来到战场、作出选择的人。'}`;
 const modes=[];
 if(s.iron)modes.push({name:'铁人模式',text:r.fatal?'终端不再为这段旅程重开作战，所有选择在最后的信号中定格。':'你选择了全队覆灭即封存的行路规则。'+(r.rescues?'博士曾退场'+r.rescues+'次，存活的队伍仍完成了目标，把你接回下一场行动。':'每一次完成的任务都承接着上一场留下的状态。')});
 else modes.push({name:'常规模式',text:r.retries?'应急额度让你重新走进了'+r.retries+'场遭遇，终端同时保留了失败与后来作出的选择。':'你保留了应急重整的可能，这段行路尚未用到再次出发的额度。'});
 if(s.legend)modes.push({name:'传奇之路',text:art?.pool==='hidden'?`隐藏池的回声落在${art.name}上。${s.mastery>=200?'升变已在这段旅程中展开，传说终于成为已解锁的招式。':'这份传说仍等待更多熟练度，潜力与已经做到的事分别写入档案。'}`:`未知的源石技艺曾有更大的机会与你相遇；这次陪你走过战场的，是${art?.name||'已记录的能力'}。`});
 if(s.solo)modes.push({name:'一人成军',text:`后续作战没有编入剧情队友。${r.summons?'你让源石技艺展开了'+r.summons+'次召唤部署，独自的阵列也有自己的回应。':'指令只在你自己的行动序列中落下。'}提高后的初始战力权重给了你起点，完成目标仍依靠逐次决策。`});
 return {title,subtitle:r.fatal?'行动终止 · 档案封存':success?'节点完成 · 终章记述':'撤离记录 · 仍有余响',paragraphs:[opening,road+growth,combat,conclusion],modes};
}
function imprints(s,r){const marks=[];
 if(r.completed.length)marks.push({name:'完整的一章',detail:'完整完成'+r.completed.length+'个节点的四场任务'});
 if(s.iron&&r.wins.length>=4&&!r.fatal)marks.push({name:'不可重来的路',detail:'铁人规则下完成至少四场行动'});
 if(s.solo&&r.wins.length>=4)marks.push({name:'一人成军',detail:'独立阵列完成至少四场行动'});
 if(r.defeated.length)marks.push({name:'强敌的回声',detail:'留下'+r.defeated.length+'份Boss击败记录'});
 if(s.mastery>=100)marks.push({name:s.mastery>=200?'升变':'专精',detail:'源石技艺熟练度达到'+(s.mastery>=200?'200':'100')});
 if(r.vectorWins>=3)marks.push({name:'突破者',detail:'赢得'+r.vectorWins+'次矢量突破'});
 if(r.rescues)marks.push({name:'有人把你带回',detail:'博士退场后队伍仍获胜'+r.rescues+'次'});
 if(r.initial&&numericRating(r.initial).score<10&&numericRating(r.final).score>=10)marks.push({name:'跨过王庭的门槛',detail:'在旅程中成长到王庭之主'});
 return marks;
}
