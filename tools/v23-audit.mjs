import fs from 'node:fs';
import * as R from '../dist/run.js';
import {CARDS,resourceRule} from '../dist/cards.js';
import {seedNumber,random,freshSeed} from '../dist/math.js';
fs.mkdirSync('artifacts/v23',{recursive:true});
const result={drawsPerMode:100000,modes:{},seedUniqueness:new Set(Array.from({length:1000},freshSeed)).size,zeroSeedFixed:seedNumber('')!==0,missingResourceNames:[],resources:[]};
for(const legend of [false,true]){let hidden=0,ids=new Map();for(let i=0;i<result.drawsPerMode;i++){let s=R.createRun({seed:'v23-audit-'+i,legend});for(let j=0;j<5;j++)R.drawNext(s);if(s.rolls[4].pool==='hidden'){hidden++;ids.set(s.rolls[4].id,(ids.get(s.rolls[4].id)||0)+1);}}result.modes[legend?'legend':'normal']={hidden,rate:hidden/result.drawsPerMode,hiddenKinds:ids.size};}
const scan=ops=>ops.some(o=>['gain','consume','resourceSet','focusGain','focusSet','cycleResource','cleanseGain','energyHarvest'].includes(o.op)||scan(o.effects||[])||scan(o.otherwise||[]));
for(const c of CARDS){const rule=resourceRule(c);if(scan(c.actions.flatMap(a=>a.ops))&&!rule)result.missingResourceNames.push({id:c.id,source:c.source});if(rule)result.resources.push({id:c.id,source:c.source,...rule});}
fs.writeFileSync('artifacts/v23/rng-resources.json',JSON.stringify(result,null,2));console.log(JSON.stringify({...result,resources:result.resources.length}));
