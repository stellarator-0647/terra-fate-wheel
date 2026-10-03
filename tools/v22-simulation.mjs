import fs from 'node:fs';import {performance} from 'node:perf_hooks';import * as R from '../dist/run.js';import * as B from '../dist/battle.js';import {CARDS} from '../dist/cards.js';import {derive,seedNumber} from '../dist/math.js';
fs.mkdirSync('artifacts/v22',{recursive:true});
const policy=(b,u,kind)=>kind==='legacy'?B.chooseLegacyAI(b,u):B.chooseAI(b,u);
function battle(b,playerPolicy='search',enemyPolicy='search',max=1100){let actions=0,times=[];for(;actions<max&&!b.over;actions++){B.advance(b);if(b.over)break;const u=b.units.find(v=>v.id===b.actor),t=performance.now(),a=policy(b,u,u.side==='ally'?playerPolicy:enemyPolicy);times.push(performance.now()-t);B.act(b,a.button,a.target,a.choice||{});}if(!b.over)throw Error('Unresolved '+b.spec.id);return {won:b.over.won,rounds:b.round,actions,times};}
const write=(name,data)=>fs.writeFileSync('artifacts/v22/'+name+'.json',JSON.stringify(data,null,2));
// Keep the previous controller as a measurable baseline, both sides first.
const selected=['AK002','AK010','AK013','AK019','AK030','AK035','AK041','AK043','AK053','AK069','AK086','AK098','AK108','AK123','AK141','AK143','AK179','AK184','AK183','AK001','AK037','AK064','AK096','AK132'].filter(id=>CARDS.some(c=>c.id===id));
const aiRows=[];
if(!process.env.CAREER_SEED)for(let i=0;i<selected.length;i++)for(const first of ['player','enemy'])for(const mode of ['search','legacy']){
 const art=selected[i],opponent=selected[(i+5)%selected.length],stats=derive(Array(5).fill(4)),spec={id:'AI',title:'策略比较',allies:[],enemies:[],customUnits:[{id:'enemy',name:'对手',art:opponent,mastery:200,stats}]};
 const b=B.newBattle({art,mastery:200,stats},spec,{rng:seedNumber(art+first),config:{skipIntents:true}});b.units.find(u=>u.id===first).gauge=1;
 const r=battle(b,mode,'legacy');aiRows.push({art,opponent,first,mode,won:r.won,rounds:r.rounds,actions:r.actions,maxMs:Math.max(...r.times)});
}
const searchWins=aiRows.filter(r=>r.mode==='search'&&r.won).length,legacyWins=aiRows.filter(r=>r.mode==='legacy'&&r.won).length;
if(!process.env.CAREER_SEED){write('ai-comparison',{scope:'24技艺配对×双方先手；同面板、同种子、敌方采用原策略；确定性两层有限搜索，非全局最优',searchWins,legacyWins,matches:aiRows.length/2,rows:aiRows});console.log({searchWins,legacyWins});}
const careers=[];const count=process.env.CAREER_SEED?1:Number(process.env.CAREER_N||60);
for(let i=0;i<count;i++){
 const s=R.createRun({seed:process.env.CAREER_SEED||'v21-career-'+i,node:'N01'});for(let j=0;j<11;j++)R.drawNext(s);R.enterNode(s,true);let encounters=0,vectorWins=0,milestones=[];
 while(s.phase!=='ending'&&encounters<60){
  if(s.mastery>=100&&!milestones.some(m=>m.level===100))milestones.push({level:100,node:s.nodeIndex+1,days:s.day,encounters});if(s.mastery>=200&&!milestones.some(m=>m.level===200))milestones.push({level:200,node:s.nodeIndex+1,days:s.day,encounters});if(s.phase==='camp'){while(s.days>0){R.train(s);if(s.phase==='vectorPrep'){R.beginVector(s);s.battle.config.skipIntents=true;const r=battle(s.battle);if(r.won)vectorWins++;R.settle(s);}}s.specialization=s.mastery>=100?'A':'';R.depart(s);}
  if(s.phase==='prep'){R.beginBattle(s);s.battle.config.skipIntents=true;}
  if(s.phase==='battle'){const b=s.battle;for(let k=0;k<1100&&!b.over;k++){B.advance(b);if(b.over)break;let u=b.units.find(v=>v.id===b.actor),a=B.chooseAI(b,u);if(u.isPlayer&&process.env.MISSION_PLAYER&&b.spec.id==='N04-4')a=b.scene.defenses<3&&!b.scene.playerDefenseThisRound?{button:'defend',target:u.id}:u.hp/u.stats.H<.85?{button:'rest',target:u.id}:a;if(u.isPlayer&&u.hp/u.stats.H<.4&&b.supply>=4)a={button:'fieldMedical',target:u.id};else if(u.isPlayer&&u.hp/u.stats.H<.3&&b.supply>=2)a={button:'firstAid',target:u.id};B.act(b,a.button,a.target,a.choice||{});}if(!b.over)throw Error('Career stuck');R.settle(s);encounters++;if(s.phase==='ending')break;if(s.lastResult.won)R.nextBattle(s);else R.evacuate(s);}
  if(s.phase==='nodeEnd')R.nextNode(s);
 }
 careers.push({seed:s.seed,art:s.art,talent:s.talent,initial:s.rolls.slice(5,10).map(r=>r.score),milestones,phase:s.phase,ending:s.ending,wins:s.history.filter(r=>r.won).length,encounters,days:s.day,vectorWins,mastery:s.mastery,rating:s.stats.rating,history:s.history});
 if(i%10===0)console.log('career',i+1,s.ending,encounters);
}
write(process.env.CAREER_SEED?'winning-career':'careers',{mode:'默认铁人；每日转盘随机、矢量突破与全五项成长；各单位统一搜索，低生命时博士使用补给'+(process.env.MISSION_PLAYER?'；N04-4博士按任务先防御三轮，后低血休整；不回滚或改属性':''),players:count,ended:careers.filter(c=>c.phase==='ending').length,fullClear:careers.filter(c=>c.wins===48).length,meanWins:careers.reduce((n,c)=>n+c.wins,0)/count,records:careers});
