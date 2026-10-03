import test from 'node:test';
import assert from 'node:assert/strict';
import * as B from '../dist/battle.js';
import {BY_ID} from '../dist/cards.js';
import {derive} from '../dist/math.js';
import {MEMES,memeFor} from '../dist/motion.js';
function encounter(ops,side='enemy'){
 const stats={...derive([4,4,4,4,4]),H:1e7};
 const b=B.newBattle({art:'AK001',stats},{id:'SIM',title:'控制压力测试',allies:[],enemies:[],solo:true},{config:{skipIntents:true}});
 const card={id:'npc:controller',name:'压制',pool:'normal',passive:[],actions:[{button:'B',name:'测试压制',cost:0,cd:0,unlock:0,target:'enemy_one',ops}]};
 for(let i=0;i<3;i++)b.units.push(B.makeUnit('controller-'+i,'控制投影'+i,side,{...stats,V:150},card));
 return b;
}
function play(b,until=800){const player=b.units[0],actions=[];let ticks=0;while(b.time<until&&!b.over&&ticks++<500){B.advance(b);if(!b.actor)continue;const u=b.units.find(v=>v.id===b.actor);if(u===player){actions.push({time:b.time,turn:u.turn});B.act(b,'rest',u.id);}else B.act(b,'B',player.id);}assert.ok(ticks<500);return actions;}
test('three fast enemies cannot indefinitely erase the solo player action bar',()=>{
 const b=encounter([{op:'gauge',n:-60}]),actions=play(b);
 assert.ok(actions.length>=3);assert.ok(actions[0].time<=200+1e-6);
 for(let i=1;i<actions.length;i++)assert.ok(actions[i].time-actions[i-1].time<=200+1e-6);
 assert.ok(b.log.some(l=>l.text.includes('连续压制达到2轮时长')));
});
test('hard controls refreshed by multiple enemies allow at most two consecutive skipped opportunities',()=>{
 const b=encounter([{op:'status',name:'眩晕',n:1,duration:8}]),actions=play(b);
 assert.ok(actions.length>=3);assert.ok(actions[0].turn<=3);
 for(let i=1;i<actions.length;i++)assert.ok(actions[i].turn-actions[i-1].turn<=3);
});
test('mixed cold, sleep, stun and full bar paralysis still produce a usable protected opportunity',()=>{
 const b=encounter([{op:'status',name:'寒冷',n:1,duration:3},{op:'status',name:'睡眠',n:1,duration:8},{op:'status',name:'眩晕',n:1,duration:8},{op:'mark',name:'麻痹',n:2,cap:3,duration:3}]);
 const actions=play(b);assert.ok(actions.length>=3);assert.ok(actions[0].time<=200+1e-6);
 assert.ok(b.units[0].hp>0);
});
test('enemy units receive the same recovery; own bar costs and normal control keep their effect',()=>{
 const b=encounter([]),p=b.units[0],e=b.units[1];e.gauge=85;
 assert.equal(B.delayGauge(b,p,e,60),60);assert.equal(e.gauge,25);assert.equal(e.controlRecoveryAt,200);
 e.statuses['行动保护']={n:1,until:e.turn+1};e.gauge=80;
 assert.equal(B.delayGauge(b,p,e,60),0);assert.equal(B.delayGauge(b,e,e,20),20);assert.equal(e.gauge,60);
 e.gauge=0;b.time=200;B.advance(b);assert.equal(b.actor,e.id);assert.ok(B.has(e,'行动保护'));assert.ok(B.has(e,'硬控保护'));
});
test('without enemy suppression the normal clock and silence remain unchanged',()=>{
 const b=encounter([]),p=b.units[0];p.stats.V=20;
 const actions=play(b,501);assert.ok(Math.abs(actions[0].time-500)<1e-6);assert.ok(!b.log.some(l=>l.text.includes('控制脱离')));
 b.actor=p.id;B.status(b,b.units[1],p,'沉默',1,3);
 assert.equal(B.legal(b,p,'A'),'状态禁止源石技艺');for(const k of ['martial','rest','defend'])assert.equal(B.legal(b,p,k),null);
});
test('legacy battle data lacks recovery timestamps but gains protection on the next real suppression',()=>{
 const b=encounter([{op:'gauge',n:-60}]);b.time=50;b.nextRound=100;for(const u of b.units){delete u.lastOpportunityAt;delete u.controlRecoveryAt;}
 const loaded=JSON.parse(JSON.stringify(b)),actions=play(loaded,500);assert.ok(actions.length>=2);assert.ok(actions[0].time<=250+1e-6);
});
test('deleted memes stay absent; Chongyue every skill, Surtr twilight and Passenger actual refund gate correctly',()=>{
 for(const id of ['AK125','AK152','AK139'])assert.ok(!MEMES[id]);assert.equal(Object.keys(MEMES).length,5);
 for(const button of ['A','B','C'])assert.equal(memeFor({card:'AK150',button,side:'ally'}).lines.length,4);
 assert.equal(memeFor({card:'AK150',button:'rest',side:'ally'}),null);assert.equal(memeFor({card:'AK150',button:'A',side:'enemy'}),null);
 assert.equal(memeFor({card:'AK055',button:'B',side:'ally',twilightEntered:false}),null);
 assert.equal(memeFor({card:'AK055',button:'B',side:'ally',twilightEntered:true}).line,'汀！汀！莱万汀！');
 assert.equal(memeFor({card:'AK019',button:'C',side:'ally',refundEnergy:0,refundFragments:0}),null);
 assert.equal(memeFor({card:'AK019',button:'C',side:'ally',refundEnergy:4}).line,'力量回来了一点，不多，但够用');
});
test('Passenger and Surtr visual receipts match successful actual combat effects',()=>{
 for(const art of ['AK019','AK055']){const b=B.newBattle({art,mastery:200,stats:derive([5,5,5,5,5])},{id:'SIM',title:'彩蛋实战',allies:[],enemies:['heavy']},{config:{skipIntents:true}}),p=b.units[0];p.turn=1;b.actor=p.id;p.res=3;const k=art==='AK019'?'C':'B';B.act(b,k,b.units[1].id);assert.ok(memeFor(b.visual));if(art==='AK019'){assert.equal(b.visual.refundEnergy,4);assert.equal(b.visual.refundFragments,1);}else assert.ok(B.has(p,'黄昏'));}
});
