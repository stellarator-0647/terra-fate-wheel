import test from 'node:test';import assert from 'node:assert/strict';
import * as R from '../dist/run.js';import * as B from '../dist/battle.js';
import {DATA} from '../dist/data.js';import {derive,initialWeights,initialHighChance,rollStat,seedNumber} from '../dist/math.js';
import {creationOptions} from '../dist/wheel.js';import {journeyReport} from '../dist/chronicle.js';
import {HAZARD_ENEMY} from '../dist/modes.js';
function career(hazard=false,solo=false){const s=R.createRun({seed:'hazard-test',node:'N01',hazard,solo});for(let i=0;i<11;i++)R.drawNext(s);R.enterNode(s,true);return s;}
test('hazard is opt-in and old saves remain standard; invalid mode values fail validation',()=>{
 const s=career();assert.equal(s.hazard,false);delete s.hazard;R.validateSave(s);assert.equal(s.hazard,false);s.hazard='true';assert.throws(()=>R.validateSave(s),/模式不合法/);
});
test('all five wheels show the actual combined probabilities; seeded high-grade draws increase',()=>{
 for(const solo of [false,true]){const s=R.createRun({hazard:true,solo,seed:'hazard-probability'}),weights=initialWeights(solo,true),sum=weights.reduce((a,b)=>a+b,0);
  for(let step=5;step<10;step++)creationOptions(step,s).forEach((r,i)=>assert.ok(Math.abs(r.probability-weights[i]/sum)<1e-12));
  assert.ok(initialHighChance(solo,true)>initialHighChance(solo,false));let high=0;for(let i=0;i<20000;i++)high+=rollStat(s)>=5;assert.ok(Math.abs(high/20000-initialHighChance(solo,true))<.012);
  assert.deepEqual(creationOptions(4,s),creationOptions(4,{...s,hazard:false}));assert.deepEqual(creationOptions(10,s),creationOptions(10,{...s,hazard:false}));
 }
 assert.ok(Math.abs(initialHighChance(false,true)-.4538)<.0001);assert.ok(Math.abs(initialHighChance(true,true)-.7941)<.0001);
});
test('all 48 story encounters boost enemy panels once and retain allied panels, facilities and deadlines',()=>{
 for(const node of DATA.campaign.nodes)for(const spec of node.battles){const player={art:'AK018',mastery:0,stats:derive([4,4,4,4,4])},plain=B.newBattle(player,spec,{config:{aiEvaluation:true}}),hard=B.newBattle(player,spec,{config:{hazard:true,aiEvaluation:true}});
  assert.equal(hard.scene.limit,plain.scene.limit);assert.deepEqual(hard.spec,plain.spec);
  for(const u of plain.units){const v=hard.units.find(x=>x.id===u.id);assert.ok(v);if(u.side==='ally'||u.facility)assert.deepEqual(v.stats,u.stats);else if(!u.owner)for(const [k,m] of Object.entries(HAZARD_ENEMY))assert.ok(Math.abs(v.stats[k]/u.stats[k]-m)<.004,`${spec.id} ${u.name} ${k}`);}
 }
});
test('enemy summons inherit boosted owners without a second boost; allies and solo summons are preserved',()=>{
 const p={art:'AK018',stats:derive([4,4,4,4,4])},spec={id:'TEST',title:'宿主测试',enemies:['meph']},a=B.newBattle(p,spec,{config:{aiEvaluation:true}}),b=B.newBattle(p,spec,{config:{hazard:true,aiEvaluation:true}});
 for(const u of a.units.filter(u=>u.owner)){const v=b.units.find(v=>v.name===u.name&&v.owner);assert.ok(Math.abs(v.stats.H/u.stats.H-1.5)<.01);assert.ok(Math.abs(v.attack/u.attack-1.3)<.01);assert.equal(v.stats.V,u.stats.V);}
 const s=career(true,true);s.art='AK098';R.depart(s);R.beginBattle(s);assert.equal(s.battle.units.filter(u=>u.side==='ally'&&!u.owner&&!u.facility).length,1);assert.ok(s.battle.units.some(u=>u.owner==='player'));
});
test('daily, story and vector attribute growth are multiplied by 1.5 while mastery and breakthrough requirements stay separate',()=>{
 for(const source of ['training','battle']){const a=career(),b=structuredClone(a);b.hazard=true;a.axes=b.axes.map(x=>({...x,score:4,events:[]}));b.axes=structuredClone(a.axes);R.recalc(a);R.recalc(b);
  const x=R.growth(a,[0,1,2,3,4],6,1.2,'growth',source),y=R.growth(b,[0,1,2,3,4],6,1.2,'growth',source);for(let i=0;i<5;i++){assert.ok(Math.abs(y[i].actual/x[i].actual-1.5)<.00001);assert.equal(y[i].modeMult,1.5);}assert.equal(a.mastery,b.mastery);}
 let a,b;for(let i=0;i<100;i++){a=career();a.rng=seedNumber('daily-'+i);b=structuredClone(a);b.hazard=true;R.train(a);R.train(b);if(a.lastDaily.mastery>0)break;}assert.equal(a.lastDaily.mastery,b.lastDaily.mastery);assert.equal(b.lastDaily.mult,a.lastDaily.mult*1.5);
});
test('mode persists through saves and is recorded in the ending; sandbox excludes the enemy boost',()=>{
 const s=career(true,true);s.iron=true;const store={raw:null,setItem(k,v){this.raw=v},getItem(){return this.raw}};R.save(s,store);const restored=R.load(store);assert.equal(restored.hazard,true);assert.equal(restored.solo,true);assert.equal(restored.iron,true);assert.ok(journeyReport(restored).story.modes.some(m=>m.name==='险路恶敌'));
 const sim=R.createSandbox();R.beginBattle(sim);assert.equal(sim.battle.config.hazard,false);
});
test('hazard damage is stronger at identical player stats and AI encounters finish without invalid values',()=>{
 const player={art:'AK019',mastery:200,stats:derive([5,5,5,5,5])},spec={id:'HAZARD',title:'险路对照',enemies:['heavy']};
 for(const hazard of [false,true]){const b=B.newBattle(player,spec,{rng:42,config:{hazard,skipIntents:true}});for(let i=0;i<500&&!b.over;i++){B.advance(b);if(b.over)break;const u=b.units.find(u=>u.id===b.actor),a=B.chooseAI(b,u);B.act(b,a.button,a.target,a.choice||{});}assert.ok(b.over);assert.ok(b.units.every(u=>Number.isFinite(u.hp)&&Number.isFinite(u.e)));}
 const a=B.newBattle(player,spec),b=B.newBattle(player,spec,{config:{hazard:true}});for(const x of [a,b]){const p=x.units[0],e=x.units.find(u=>u.side==='enemy');B.damage(x,e,p,e.stats.A,'physical',e.stats.A);}assert.ok(a.units[0].hp>b.units[0].hp);
});

