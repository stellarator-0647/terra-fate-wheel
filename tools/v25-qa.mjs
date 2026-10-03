import fs from 'node:fs';import * as R from '../dist/run.js';import * as B from '../dist/battle.js';import {DATA} from '../dist/data.js';import {journeyReport} from '../dist/chronicle.js';import {rollStat} from '../dist/math.js';
fs.mkdirSync('artifacts/v25/ui',{recursive:true});
function play(seed,node,solo){
 const s=R.createRun({seed,node,solo,legend:true,iron:true,mode:'single'});for(let i=0;i<11;i++)R.drawNext(s);
 R.enterNode(s,true);
 for(let day=0;day<6;day++){
  const r=R.train(s);if(r.type==='vector'){const b=R.beginVector(s);for(let i=0;i<600&&!b.over;i++){B.advance(b);if(!b.actor||b.over)continue;const u=b.units.find(u=>u.id===b.actor),a=B.chooseAI(b,u);B.act(b,a.button,a.target,a.choice||{});}if(!b.over)throw Error('Unresolved vector');R.settle(s);delete s.pendingGrowth;}
  delete s.pendingTrainingGrowth;
 }
 R.depart(s);
 for(let encounter=0;encounter<4&&s.phase!=='ending';encounter++){
  const b=R.beginBattle(s);
  for(let i=0;i<600&&!b.over;i++){
   B.advance(b);if(!b.actor||b.over)continue;const u=b.units.find(u=>u.id===b.actor);
   let a;
   if(u.isPlayer&&u.hp/u.stats.H<.4&&b.supply>=2)a={button:b.supply>=4?'fieldMedical':'firstAid',target:u.id};
   else if(u.isPlayer&&b.spec.solo&&b.spec.id==='N12-4'){
    const target=b.units.find(u=>u.side==='enemy'&&u.facility&&B.alive(u));a={button:'martial',target:target?.id||u.id};
   }else a=B.chooseAI(b,u);
   B.act(b,a.button,a.target,a.choice||{});
  }
  if(!b.over)throw Error('Bounded QA did not resolve');R.settle(s);
  if(s.phase==='ending')break;
  if(!s.lastResult.won){R.evacuate(s);R.nextNode(s);break;}
  delete s.pendingGrowth;R.nextBattle(s);if(s.phase==='nodeEnd')R.nextNode(s);
 }
 R.validateSave(s);return s;
}
const results=[];
for(const [node,solo,label] of [['N01',true,'solo'],['N12',false,'finale']]){
 let best=null;
 for(let i=0;i<1000;i++){
  const seed='v25-'+label+'-'+i,trial=R.createRun({seed,node,solo,legend:true,mode:'single'});for(let j=0;j<11;j++)R.drawNext(trial);
  if(trial.stats.H<3500||Math.max(trial.stats.A,trial.stats.P)<280)continue;
  const s=play(seed,node,solo);if(!best||journeyReport(s).wins.length>journeyReport(best).wins.length)best=s;
  if(journeyReport(s).wins.length===4)break;
  if(results.filter(r=>r.label===label).length>12)break;
  results.push({label,seed,wins:journeyReport(s).wins.length,ending:s.ending});
 }
 if(!best)throw Error('No QA profile');const r=journeyReport(best);
 fs.writeFileSync('artifacts/v25/'+label+'-ending.json',JSON.stringify(best,null,2));
 results.push({label,selected:best.seed,wins:r.wins.length,bosses:r.bosses,actions:r.actions,ending:best.ending});
}
const fatal=play('v25-fatal','N12',true);fs.writeFileSync('artifacts/v25/fatal-ending.json',JSON.stringify(fatal,null,2));results.push({label:'fatal',selected:fatal.seed,ending:fatal.ending,wins:journeyReport(fatal).wins.length});
const odds=[];for(const solo of [false,true]){const s=R.createRun({seed:'v25-odds',solo});let b=0,a=0;for(let i=0;i<100000;i++){const n=rollStat(s);b+=n>=5;a+=n>=7;}odds.push({solo,samples:100000,BminusAndUp:b/100000,AminusAndUp:a/100000});}
fs.writeFileSync('artifacts/v25/gameplay-qa.json',JSON.stringify({scope:'Bounded end-to-end fixtures from real initial rolls; not a campaign win-rate estimate.',results,odds},null,2));console.log(JSON.stringify({results:results.filter(r=>r.selected),odds}));
