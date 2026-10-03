import test from 'node:test';import assert from 'node:assert/strict';
import * as R from '../dist/run.js';import * as B from '../dist/battle.js';
import {CARDS,BY_ID,actionFor,actionText,evolvedCard,resourceRule} from '../dist/cards.js';
import {statTier,unitResources,isLeader} from '../dist/unit-info.js';
import {derive,tierLabel} from '../dist/math.js';import {dailyOptions} from '../dist/wheel.js';
const born=seed=>{const s=R.createRun({seed,node:'N01'});for(let i=0;i<11;i++)R.drawNext(s);R.enterNode(s,true);return s;};
const findDay=vector=>{for(let i=0;i<100;i++){const s=born('patch222-'+i);s.hp=1;const r=R.train(s);if((r.type==='vector')===vector)return s;}throw Error('No day found');};
test('daily project removal and post-training full recovery use the new health ceiling',()=>{
 assert.equal(dailyOptions().length,7);assert.ok(!dailyOptions().some(r=>r.label==='医疗休养'));
 const s=findDay(false),r=s.pendingTrainingGrowth;assert.equal(s.hp,s.stats.H);assert.ok(r);assert.deepEqual(r.after.stats,s.stats);
 assert.ok(r.gains.every(g=>g.values.every(v=>v.after-v.before===v.gain)));const saved=structuredClone(s);R.validateSave(saved);assert.deepEqual(saved.pendingTrainingGrowth,r);
});
test('vector wheels draw separately, can be drawn in either order and cannot reroll',()=>{
 for(const order of [['art','tier'],['tier','art']]){const s=findDay(true),r=s.pendingTraining;assert.equal(r.art,undefined);assert.equal(r.enemyTier,undefined);assert.equal(s.hp,1);
 for(const kind of order){(kind==='art'?R.drawVectorArt:R.drawVectorTier)(s);const rng=s.rng;(kind==='art'?R.drawVectorArt:R.drawVectorTier)(s);assert.equal(s.rng,rng);}
 assert.ok(r.enemyTier<=Math.floor(s.stats.rating.score));assert.equal(s.trainingSpec.customUnits[0].art,r.art);assert.deepEqual(s.trainingSpec.customUnits[0].stats,derive(Array(5).fill(r.enemyTier)));
 R.beginVector(s);s.battle.over={won:false,kind:'defeat',reason:'test'};R.settle(s);assert.equal(s.hp,s.stats.H);assert.equal(s.phase,'camp');
 }
});
test('six value grades are calculated from their axes and keep energy tied to adaptability',()=>{
 const s={H:1375,A:211,P:78,D:194,R:113,Emax:206};for(const [k,t]of Object.entries({H:3,A:5,P:2,D:5,R:3,Emax:3}))assert.equal(statTier(s,k),tierLabel(t),k);
 for(let tier=0;tier<17;tier++){const stats=derive(Array(5).fill(tier));for(const k of ['H','A','P','D','R','Emax'])assert.equal(statTier(stats,k),tierLabel(tier),k+'/'+tier);}
});
test('every finite exclusive resource cap is described at all mastery stages',()=>{
 for(const c of CARDS)for(const m of [0,100,200]){const card=evolvedCard(c,m),r=resourceRule(card,m);if(!r)continue;
 for(let i=0;i<3;i++){const a=actionFor(c,i,m);assert.ok(actionText(a).includes('上限'+r.cap),c.id+'/'+m+'/'+i);}}
});
test('live resources report gains, evolved ammunition and zero-life charging relays',()=>{
 const b=B.newBattle({art:'AK019',mastery:200,stats:derive(Array(5).fill(4))},{id:'test',title:'test',enemies:['heavy']},{config:{aiEvaluation:true}}),p=b.units[0];b.actor=p.id;p.turn=4;B.act(b,'A',b.units[1].id);assert.equal(unitResources(p,b.units)[0].current,p.res);assert.equal(p.res,3);
 const evolved=evolvedCard(BY_ID.AK086,200),ammo=B.makeUnit('ammo','ammo','ally',derive(Array(5).fill(3)),evolved,{mastery:200});assert.deepEqual(unitResources(ammo),[{name:'弹匣',current:12,cap:16}]);
 const relay=B.makeUnit('relay-owner','relay','ally',derive(Array(5).fill(3)),BY_ID.AK013,{mastery:200});assert.deepEqual(unitResources(relay,[{owner:relay.id,relay:true,hp:0,removed:false}]),[{name:'中继设施',current:1,cap:3}]);
});
test('only enemy leaders are classified, excluding all allies and summons',()=>{assert.ok(isLeader({npcId:'meph',side:'enemy'}));assert.ok(isLeader({eventBoss:true,side:'enemy'}));for(const extra of [{npcId:'amiya'},{npcId:'ace'},{npcId:'patriot'},{boss:true},{leader:true},{eventBoss:true}])assert.equal(isLeader({side:'ally',...extra}),false);assert.ok(!isLeader({npcId:'heavy',side:'enemy'}));assert.ok(!isLeader({npcId:'meph',side:'enemy',owner:'parent'}));assert.ok(!isLeader({npcId:'meph'}));});
test('player is never a leader, including old saves and borrowed boss prototypes',()=>{for(const extra of [{},{leader:true},{boss:true},{eventBoss:true},{npcId:'amiya'},{npcId:'patriot'}])assert.equal(isLeader({isPlayer:true,side:'ally',...extra}),false);});
test('visual impact receipts reflect actual health and shield loss without changing combat',()=>{
 const spec={id:'test',title:'test',enemies:['heavy']},args={art:'AK019',mastery:200,stats:derive(Array(5).fill(4))},a=B.newBattle(args,spec,{config:{skipIntents:true}}),b=B.newBattle(args,spec,{config:{aiEvaluation:true}});
 for(const z of [a,b]){z.actor='player';z.units[0].turn=4;z.units[1].shields=[{hp:30,until:99}];B.act(z,'A',z.units[1].id);}
 assert.equal(a.visual.impacts[0].shield,30);assert.ok(a.visual.impacts[0].hp>0);delete a.visual;delete a.config;delete b.config;for(const z of [a,b])for(const u of z.units)delete u.intent;assert.deepEqual(a,b);
});
