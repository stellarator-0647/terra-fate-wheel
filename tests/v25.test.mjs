import test from 'node:test';import assert from 'node:assert/strict';
import * as R from '../dist/run.js';import * as B from '../dist/battle.js';
import {DATA} from '../dist/data.js';import {derive,rollStat,SOLO_WEIGHTS,WEIGHTS} from '../dist/math.js';
import {creationOptions} from '../dist/wheel.js';import {battleRecord,journeyReport} from '../dist/chronicle.js';import {endingMarkup} from '../dist/ending-view.js';
import {sceneRound,sceneCheck} from '../dist/scenes.js';
const career=(solo=false,node='N01')=>{const s=R.createRun({seed:'chronicle-25',solo,node});for(let i=0;i<11;i++)R.drawNext(s);R.enterNode(s,true);R.depart(s);return s;};
const fight=(enemy='patriot')=>B.newBattle({art:'AK019',mastery:200,stats:derive(Array(5).fill(8))},{id:'test',title:'领袖记录测试',allies:[],enemies:[enemy]},{config:{skipIntents:true}});

test('solo initial rolls and all five wheel displays share exact normalized weights',()=>{
 assert.equal(SOLO_WEIGHTS.reduce((n,v)=>n+v,0),100);
 const s=R.createRun({solo:true});for(let step=5;step<10;step++){const rows=creationOptions(step,s);assert.equal(rows.length,17);for(let i=0;i<17;i++)assert.equal(rows[i].probability,SOLO_WEIGHTS[i]/100);}
 assert.equal(SOLO_WEIGHTS.slice(5).reduce((n,v)=>n+v,0),66.5);assert.equal(SOLO_WEIGHTS.slice(7).reduce((n,v)=>n+v,0),26.5);
 const a=R.createRun({seed:'solo-probability',solo:true}),b=R.createRun({seed:'solo-probability',solo:false});let highA=0,highB=0;
 for(let i=0;i<20000;i++){highA+=rollStat(a)>=5;highB+=rollStat(b)>=5;}
 assert.ok(highA/20000>.65&&highA/20000<.68);assert.ok(highB/20000>.27&&highB/20000<.31);assert.ok(WEIGHTS[0]>SOLO_WEIGHTS[0]);
 const x=career(true),y=career(true);assert.deepEqual(x.rolls,y.rolls);assert.deepEqual(x.startStats,x.stats);
});
test('solo removes every story companion in all 48 battles without modifying campaign data',()=>{
 const s=career(true);s.art='AK105'; // 伺夜 starts with three owned wolves.
 const original=JSON.stringify(DATA.campaign.nodes);
 for(let nodeIndex=0;nodeIndex<12;nodeIndex++)for(let battleIndex=0;battleIndex<4;battleIndex++){
  Object.assign(s,{nodeIndex,battleIndex,phase:'prep'});const spec=R.battleSpec(s);assert.deepEqual(spec.allies,[]);assert.equal(spec.solo,true);
  const b=R.beginBattle(s);assert.ok(!b.units.some(u=>u.side==='ally'&&u.npcId));assert.ok(b.units.some(u=>u.isPlayer));
 }
 assert.equal(JSON.stringify(DATA.campaign.nodes),original);
 const normal=career(false);assert.ok(R.beginBattle(normal).units.some(u=>u.side==='ally'&&u.npcId));
});
test('solo retains owned summons and objective facilities',()=>{
 const s=career(true,'N06');s.art=DATA.arts.cards.find(c=>c.source==='伺夜').art_id;s.battleIndex=2;const b=R.beginBattle(s);b.actor='player';b.units[0].turn=1;B.act(b,'A',b.units.find(u=>u.side==='enemy'&&!u.facility).id);
 assert.equal(b.units.filter(u=>u.owner==='player'&&u.name==='猎狼').length,3);assert.equal(b.units.filter(u=>u.facility&&u.side==='ally').length,3);
});
test('both cooperative finale objectives have a solo route and no invulnerable finale exploit',()=>{
 for(const [nodeIndex,id] of [[5,'N06-4'],[11,'N12-4']]){const s=career(true);Object.assign(s,{nodeIndex,battleIndex:3,phase:'prep'});const b=R.beginBattle(s);
  assert.ok(!b.units.some(u=>u.side==='ally'&&u.npcId));assert.match(b.spec.goal,/每轮完成防御\/休整/);
  if(id==='N12-4')assert.ok(!B.has(b.units[0],'不可选中'));
  for(let i=1;i<=8;i++){b.round=i;b.scene.roundActions={player:{defend:true}};sceneRound(b,{damage:B.damage,status:B.status,healUnit:B.healUnit,log:B.log});}
  assert.equal(b.scene.progress,8);assert.equal(sceneCheck(b).won,true);assert.equal(sceneCheck(b).kind,'objective');
 }
});
test('boss record distinguishes real final death, phase revival, dismissal and objective completion',()=>{
 const b=fight(),p=b.units[0],e=b.units.find(u=>u.side==='enemy');e.revives=1;
 B.damage(b,p,e,1e8,'true',100,{indirect:true,ignoreShield:true});assert.equal(battleRecord(b).bosses[0].outcome,'standing');assert.ok(e.hp>0);
 B.damage(b,p,e,1e8,'true',100,{indirect:true,ignoreShield:true});B.checkEnd(b);assert.equal(battleRecord(b).bosses[0].outcome,'defeated');
 const retreat=fight();retreat.over={won:true,kind:'objective'};assert.equal(battleRecord(retreat).bosses[0].outcome,'repelled');
 const forced=fight();B.retire(forced,forced.units[1]);B.checkEnd(forced);assert.equal(battleRecord(forced).bosses[0].outcome,'dismissed');
 const unseen=fight();unseen.units[1].hp=0;assert.notEqual(battleRecord(unseen).bosses[0].outcome,'defeated');
});
test('telemetry counts actual HP and shield loss, effective healing and successful player actions',()=>{
 const b=fight('heavy'),p=b.units[0],e=b.units[1];e.shields=[{hp:50,until:100}];const hp=e.hp;
 B.damage(b,p,e,150,'true',100,{indirect:true});assert.equal(b.telemetry.damage.ally,hp-e.hp);assert.equal(b.telemetry.shieldDamage.ally,50);
 p.hp-=20;B.healUnit(b,p,p,1e6);assert.equal(b.telemetry.healing.ally,20);
 b.actor='player';p.turn=4;B.act(b,'defend',p.id);assert.equal(b.telemetry.actions.defend,1);
 b.actor='player';b.supply=6;B.act(b,'firstAid',p.id);assert.equal(b.telemetry.actions.firstAid,1);
 b.actor='player';assert.throws(()=>B.act(b,'invalid',p.id));assert.equal(b.telemetry.actions.invalid,undefined);
});
test('formal settlement persists records; team victory after Doctor exit remains credited',()=>{
 const s=career();const b=R.beginBattle(s),p=b.units[0];p.hp=0;for(const e of b.units.filter(u=>u.side==='enemy'))B.damage(b,b.units[1],e,1e8,'true',100,{indirect:true,ignoreShield:true});B.checkEnd(b);
 const r=R.settle(s);assert.equal(r.rescued,true);assert.ok(r.record);assert.equal(s.history[0].record.playerExited,true);
 const report=journeyReport(s);assert.equal(report.rescues,1);assert.equal(report.wins.length,1);assert.equal(report.partial,false);
 const saved=structuredClone(s);R.validateSave(saved);assert.deepEqual(saved.history[0].record,r.record);
});
test('story includes origin, art, growth and selected modes; ending rendering escapes save text',()=>{
 const s=career(true,'N12');s.legend=true;s.mastery=200;s.name='<img src=x onerror=evil()>';s.history=DATA.campaign.nodes[11].battles.map(b=>({id:b.id+':win',won:true,kind:'objective',title:b.title,rounds:8,day:4,reason:'test',before:{mastery:190},after:{mastery:200},record:{version:1,bosses:[],telemetry:{actions:{defend:3},damage:{ally:30}},allies:[],summons:2}}));s.phase='ending';s.ending='任务完成';
 const report=journeyReport(s);assert.equal(report.completed.length,1);assert.equal(report.story.title,'灯塔仍在回应');assert.equal(report.story.modes.length,3);assert.ok(report.story.paragraphs[0].includes(s.rolls[0].name));
 const html=endingMarkup(s);assert.ok(html.includes('&lt;img src=x onerror=evil()&gt;'));assert.ok(!html.includes('<img src=x'));
 assert.ok(report.imprints.some(m=>m.name==='一人成军'));assert.match(html,/领袖战果/);assert.match(html,/完整行动时间线/);
 s.ending='全队覆灭';assert.equal(journeyReport(s).story.title,'此处仍有你的足迹');
});
test('legacy endings never manufacture boss kills or detailed combat statistics',()=>{
 const s=career();delete s.solo;delete s.startStats;s.history=[{id:'N01-1:win',won:true,title:'旧记录',rounds:0}];R.validateSave(s);assert.equal(s.solo,false);
 const r=journeyReport(s);assert.equal(r.defeated.length,0);assert.equal(r.partial,true);assert.deepEqual(r.actions,{});assert.ok(r.initial);
});
test('repeat victories remain one cleared encounter and one boss outcome while action attempts accumulate',()=>{
 const s=career(),b=fight('meph');for(const e of b.units.filter(u=>u.side==='enemy')){e.revives=0;B.damage(b,b.units[0],e,1e8,'true',100,{indirect:true,ignoreShield:true});}b.over={won:true,kind:'victory'};
 const rec=battleRecord(b);s.history=[1,2].map(()=>({id:'N01-1:win',title:'重复遭遇',won:true,rounds:3,record:rec}));
 const r=journeyReport(s);assert.equal(r.wins.length,1);assert.equal(r.defeated.length,1);assert.equal(r.retries,1);assert.equal(r.attempts,2);
});
