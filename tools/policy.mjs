import * as B from '../dist/battle.js';
export function tactical(b,u){
 let ai=B.chooseAI(b,u);if(u.side==='enemy')return ai;
 const id=b.spec.id,fs=B.allies(b,u),es=B.foes(b,u),fac=es.filter(v=>v.facility),live=es.filter(v=>!v.facility),legal=btn=>!B.legal(b,u,btn),pick=btn=>({button:btn,target:u.id,choice:btn==='defend'?{cover:u.isPlayer&&u.stats.H>Math.max(...fs.filter(v=>!v.owner&&!v.facility&&!v.isPlayer).map(v=>v.stats.H),0)}:{}});
 const defensive=['N02-2','N03-4','N04-4','N05-3','N06-3','N06-4','N07-1','N08-3','N08-4','N09-3','N10-3','N11-2','N11-4','N12-1','N12-4'];
 if(u.isPlayer&&id==='N04-4'&&B.cardOf(u)?.passive.includes('engineer')&&legal('B'))return{button:'B',target:live[0].id};if(u.isPlayer&&id==='N07-2'&&b.scene.fire>=2&&legal('rest'))return pick('rest');
 if(u.isPlayer&&id==='N12-3'&&!b.scene.anyRest&&legal('rest'))return pick('rest');
 if(['N08-3','N08-4'].includes(id)){let guard=fs.filter(v=>!v.owner&&!v.facility&&!v.isPlayer).sort((a,c)=>c.stats.H-a.stats.H)[0];if(u.id===guard?.id&&legal('defend'))return pick('defend');if(u.isPlayer&&legal('rest'))return pick('rest');}if(u.isPlayer&&defensive.includes(id)&&!b.scene.playerDefenseThisRound&&legal('defend')&&!(id==='N06-4'&&fs.filter(v=>!v.owner&&!v.facility).length<3)&&!(id==='N08-3'&&live.length===0))return pick('defend');
 if(id==='N10-1'){let unverified=live.find(v=>!b.scene.checked.includes(v.id));if(unverified&&u.npcId==='ines'&&legal('A'))return{button:'A',target:unverified.id};if(unverified&&u.isPlayer&&fs.some(v=>v.npcId==='ines')&&legal('defend'))return pick('defend');if(unverified&&u.isPlayer&&!fs.some(v=>v.npcId==='ines'))for(let btn of ['A','B','C'])if(legal(btn)&&B.targets(b,u,B.skill(u,btn)).includes(unverified))return{button:btn,target:unverified.id};}
 const facilityFocus=['N01-3','N01-4','N03-3','N05-2','N05-4','N06-2','N07-3','N07-4','N09-4','N10-4','N12-2','N12-4'];
 if(fac.length&&facilityFocus.includes(id))for(let btn of ['B','A','C','martial'])if(legal(btn)){let sk=btn==='martial'?{target:'enemy_one',ops:[]}:B.skill(u,btn),ts=B.targets(b,u,sk),f=fac.find(v=>ts.includes(v));if(f&&sk.target!=='enemy_all'&&B.attacking(sk)||f&&btn==='martial')return{button:btn,target:f.id};}
 if(u.hp/u.stats.H<.4&&legal('rest')&&u.lastAction!=='rest')return pick('rest');
 // Avoid wasting finite turns on support loops while everyone is healthy.
 if(['A','B','C'].includes(ai.button)&&!B.attacking(B.skill(u,ai.button))&&fs.every(v=>v.hp/v.stats.H>.8)&&u.lastAction===ai.button&&legal('martial'))return{button:'martial',target:live.sort((a,c)=>a.hp/a.stats.H-c.hp/c.stats.H)[0]?.id||es[0]?.id};
 return ai;
}
