import test from 'node:test';
import assert from 'node:assert/strict';
import * as R from '../dist/run.js';
import * as B from '../dist/battle.js';
import {journeyReport} from '../dist/chronicle.js';
import {derive} from '../dist/math.js';

function career(iron=false,mode='campaign'){
 const s=R.createRun({seed:'story-failure',node:'N01',iron,mode});
 for(let i=0;i<11;i++)R.drawNext(s);
 R.enterNode(s,true);R.depart(s);R.beginBattle(s);return s;
}
function killPlayer(s){const b=s.battle,p=b.units.find(u=>u.isPlayer),e=b.units.find(u=>u.side==='enemy');p.revives=0;B.damage(b,e,p,1e9,'true',100,{ignoreShield:true,indirect:true});B.checkEnd(b);}

test('story objective timeout ends both journey modes regardless of iron setting, with allies alive',()=>{
 for(const mode of ['campaign','single'])for(const iron of [false,true]){
  const s=career(iron,mode),b=s.battle;b.round=12;B.checkEnd(b);
  assert.equal(b.over.won,false);assert.ok(b.units.some(u=>u.side==='ally'&&u.hp>0));
  R.settle(s);assert.equal(s.phase,'ending');assert.equal(s.ending,'任务失败');assert.match(s.endingReason,/12轮/);
  assert.equal(s.history.length,1);assert.equal(s.nodeIndex,0);assert.equal(s.pendingGrowth,undefined);
  assert.throws(()=>R.retry(s));assert.throws(()=>R.nextBattle(s));assert.throws(()=>R.nextNode(s));
  const story=journeyReport(s).story;assert.match(story.subtitle,/任务失败/);assert.ok(story.paragraphs.some(p=>p.includes(b.over.reason)));
 }
});
test('legacy failed result and failed node-end saves terminate instead of bypassing failure',()=>{
 for(const phase of ['result','nodeEnd']){const s=career();s.battle.over={won:false,reason:'未完成护送',kind:'defeat'};R.settle(s);s.phase=phase;s.reserved=1;s.supply=99;R.validateSave(s);assert.equal(s.phase,'ending');assert.equal(s.reserved,0);assert.equal(s.nodeIndex,0);}
 const s=career();s.phase='nodeEnd';s.nodeSuccess=false;R.nextNode(s);assert.equal(s.phase,'ending');assert.equal(s.nodeIndex,0);
});
test('iron is off by default; player death ends iron immediately even with surviving allies and an objective ready',()=>{
 assert.equal(R.createRun().iron,false);
 const s=career(true);s.battle.spec.id='N01-2';s.battle.round=5;killPlayer(s);
 assert.equal(s.battle.over.kind,'ironDeath');assert.equal(s.battle.over.won,false);
 assert.ok(s.battle.units.some(u=>u.side==='ally'&&!u.isPlayer&&u.hp>0));R.settle(s);
 assert.equal(s.phase,'ending');assert.equal(s.ending,'阵亡');assert.equal(s.lastResult.rescued,false);assert.equal(s.pendingGrowth,undefined);
});
test('a surviving revival is not final death in iron mode',()=>{
 const s=career(true),b=s.battle,p=b.units[0],e=b.units.find(u=>u.side==='enemy');p.revives=1;
 B.damage(b,e,p,1e9,'true',100,{ignoreShield:true,indirect:true});B.checkEnd(b);
 assert.ok(p.hp>0);assert.equal(p.revives,0);assert.equal(b.over,null);
});
test('loaded active iron battle adopts the death rule; standard survivor victory still rescues the player',()=>{
 const s=career(true);delete s.battle.config.ironPlayerDeath;s.battle.units[0].hp=0;R.validateSave(s);assert.equal(s.battle.over.kind,'ironDeath');
 const standard=career();killPlayer(standard);assert.equal(standard.battle.over,null);
 for(const e of standard.battle.units.filter(u=>u.side==='enemy'))e.hp=0;
 B.checkEnd(standard.battle);assert.equal(standard.battle.over.won,true);R.settle(standard);assert.equal(standard.lastResult.rescued,true);assert.equal(standard.phase,'result');
});
test('vector failure is independent in standard mode but iron player death ends the journey',()=>{
 for(const iron of [false,true]){const s=career(iron);s.phase='vectorPrep';s.pendingTraining={type:'vector',day:s.day,name:'矢量突破',enemyTier:3,gains:[],mastery:0};s.trainingSpec={id:'VECTOR',title:'投影测试',customUnits:[{id:'projection',name:'投影',art:'AK018',mastery:0,stats:derive(Array(5).fill(3))}]};R.beginVector(s);killPlayer(s);R.settle(s);assert.equal(s.phase,iron?'ending':'camp');if(iron){assert.equal(s.ending,'阵亡');assert.equal(s.hp,0);}assert.equal(s.dailyHistory.length,1);assert.equal(s.history.length,0);}
 const sim=R.createSandbox();R.beginBattle(sim);killPlayer(sim);R.settle(sim);assert.equal(sim.phase,'result');R.nextBattle(sim);assert.equal(sim.phase,'prep');
});
