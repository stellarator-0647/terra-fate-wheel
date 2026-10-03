import test from 'node:test';
import assert from 'node:assert/strict';
import {DATA} from '../dist/data.js';
import {CARDS} from '../dist/cards.js';
import {createRun,drawNext,DAILY_PROJECTS} from '../dist/run.js';
import {creationOptions,artsOptions,dailyOptions,vectorTierOptions,selectedCreationId,wheelMarkup} from '../dist/wheel.js';
const sums=rows=>rows.reduce((s,r)=>s+r.probability,0);
test('all creation wheels contain exactly the complete gameplay pools',()=>{
 const s=createRun();const counts=[22,30,2,12,182,17,17,17,17,17,9];
 for(let i=0;i<11;i++){const opts=creationOptions(i,s);assert.equal(opts.length,counts[i]);assert.equal(new Set(opts.map(o=>o.id)).size,counts[i]);assert.ok(Math.abs(sums(opts)-1)<1e-12);assert.ok(new Set(opts.map(o=>o.color)).size>1);}
 assert.deepEqual(artsOptions().map(o=>o.id),CARDS.map(c=>c.id));
});
test('two-stage hidden weights remain 5 percent or 30 percent',()=>{for(const legend of [false,true]){const rows=artsOptions(legend);assert.ok(Math.abs(sums(rows.filter(o=>o.hidden))-(legend?.30:.05))<1e-12);for(const c of CARDS){const o=rows.find(o=>o.id===c.id);const total=CARDS.filter(a=>a.pool===c.pool).reduce((s,a)=>s+a.weight,0);assert.ok(Math.abs(o.probability/c.weight-(c.pool==='hidden'?(legend?.30:.05):(legend?.70:.95))/total)<1e-12);}}});
test('forced starting node shows all options and only the chosen one participates',()=>{const rows=creationOptions(3,createRun({node:'N04'}));assert.equal(rows.length,12);assert.equal(rows.find(o=>o.id==='N04').probability,1);assert.equal(rows.filter(o=>o.probability>0).length,1);});
test('every actual draw maps to one sector, including adjacent letter grades',()=>{for(let k=0;k<120;k++){const s=createRun({seed:'wheel-'+k,legend:k%2===0});for(let i=0;i<11;i++){const row=drawNext(s);const rows=creationOptions(i,s);assert.equal(rows.filter(o=>o.id===selectedCreationId(row)).length,1);const html=wheelMarkup({options:rows,title:'测试',result:row.name,selected:selectedCreationId(row)});assert.equal((html.match(/class="wheel-sector /g)||[]).length,rows.length);assert.equal((html.match(/data-option-id=/g)||[]).length,rows.length*2);assert.ok(html.includes('selected'));}}});
test('daily and vector wheels match training eligibility and probabilities',()=>{
 assert.deepEqual(dailyOptions().map(o=>o.label),DAILY_PROJECTS.map(p=>p.name));assert.ok(Math.abs(sums(dailyOptions())-1)<1e-12);
 const operator=artsOptions(false,true),pool=CARDS.filter(c=>c.pool==='normal'&&/^[3-6]星$/.test(DATA.arts.cards.find(r=>r.art_id===c.id)?.source_rarity));assert.deepEqual(operator.map(o=>o.id),pool.map(c=>c.id));assert.ok(Math.abs(sums(operator)-1)<1e-12);
 for(let tier=0;tier<17;tier++){const rows=vectorTierOptions(tier+.7);assert.equal(rows.length,17);assert.ok(Math.abs(sums(rows)-1)<1e-12);assert.equal(rows[tier].probability,tier?.5:1);assert.ok(rows.slice(tier+1).every(o=>o.probability===0));}
});

