// These are turn-game adaptations, not the original game's absolute HP values.
export const HOSTS=[
 {name:'宿主重装组长',h:.95,a:.65,basis:'Q',limit:1,duration:99,d:1.5,r:.4,v:70,taunt:true,role:'守护',host:true,regen:.04,attackType:'physical'},
 {name:'宿主流浪者',h:.8,a:.95,basis:'Q',limit:1,duration:99,d:.6,r:1.2,v:90,role:'破阵',host:true,regen:.06,attackType:'physical'},
 {name:'狂暴宿主士兵',h:.75,a:1.45,basis:'Q',limit:1,duration:99,d:.25,r:1.2,v:115,role:'狂攻',host:true,selfBleed:true,attackType:'physical'}
];
export const SUMMON_ROLES={
 '结构性原理':{h:.7,a:.8,d:1.35,r:1,v:80,role:'守护',taunt:true},
 '魂灵之影':{h:.32,a:.7,d:.8,r:1.1,v:90,role:'法术',attackType:'magic'},
 '猎狼':{h:.28,a:.65,d:.65,r:.6,v:115,role:'打击'},'狼':{h:.28,a:.65,d:.65,r:.6,v:115,role:'打击'},
 '雪怪术师':{h:.35,a:.7,d:.55,r:1.3,v:85,role:'控场'},
 '雪怪小队凿冰人':{h:.5,a:.95,d:1.1,r:.55,v:85,role:'破冰'},
 '防御仆役':{h:.7,a:.45,d:1.5,r:1,v:75,role:'守护',taunt:true},
 '物理仆役':{h:.32,a:.85,d:.8,r:.6,v:105,role:'打击'},
 '法术仆役':{h:.3,a:.85,d:.55,r:1.2,v:90,role:'法术'},
 '仆役':{h:.3,a:.7,d:.8,r:1,v:90,role:'法术'},
 '分体':{h:.32,a:.65,d:.8,r:1,v:100,role:'法术'},
 '幻影弩炮':{h:.35,a:.8,d:.7,r:.6,v:85,role:'狙击'},
 '雪怪影像':{h:.35,a:.65,d:.7,r:1.1,v:85,role:'控场'},
 '血裔':{h:.4,a:.85,d:.8,r:1,v:105,role:'打击'}
};
export function tuneSummon(owner,op,own){
 if((owner.npcId==='meph'||owner.cardData?.passive?.includes('hosts')||owner.hostMaster)&&op.host){
  let missing=HOSTS.find(h=>!own.some(p=>p.name===h.name));let weakest=[...own].filter(p=>p.host).sort((a,b)=>a.hp/a.stats.H-b.hp/b.stats.H)[0];return {...op,...(missing||HOSTS.find(h=>h.name===weakest?.name)||HOSTS[0])};
 }
 const p=SUMMON_ROLES[op.name];if(p)return {...op,...p};
 if(op.relay||op.facility||op.hatch)return {...op,role:op.relay?'中继':'设施',v:0};
 const role=op.taunt?'守护':op.a===0?'辅助':op.basis==='A'?'打击':'法术';
 return {...op,h:Math.max(op.h||.2,role==='守护'?.55:role==='辅助'?.35:.28),a:op.a>0?Math.max(.55,op.a):0,d:op.d??(role==='守护'?1.3:.8),r:op.r??1,v:role==='守护'?80:95,role};
}
