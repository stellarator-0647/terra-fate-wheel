const live=u=>u.hp>0&&!u.removed;
const enemy=b=>b.units.filter(u=>u.side==='enemy'&&!u.facility&&live(u));
const boss=b=>b.units.find(u=>u.side==='enemy'&&!u.owner&&!u.facility);
const ratio=b=>{let u=boss(b);return u&&live(u)?u.hp/u.stats.H:0;};
const FACILITIES={
 'N01-3':[3,350,40,20,'路障'], 'N01-4':[2,500,60,30,'路障'], 'N02-3':[2,250,0,0,'引线箱'],
 'N03-3':[2,350,100,40,'冰障'], 'N05-2':[2,600,40,40,'旁路门'], 'N05-4':[3,500,80,40,'雷管点',1200],
 'N06-2':[2,600,0,0,'通风闸'], 'N06-3':[3,600,0,0,'冷却装置',0,'ally'],
 'N07-3':[1,400,0,0,'石柱',1000], 'N07-4':[2,500,0,0,'石柱',1400],
 'N09-4':[2,900,150,80,'散热阀'], 'N10-4':[3,650,80,80,'身份锚点'],
 'N12-2':[2,1000,100,100,'导航点'], 'N12-4':[2,1000,100,100,'茧笼']};
const LIMITS={'N01-4':3,'N03-3':6,'N05-2':6,'N08-2':6,'N10-1':6,'N12-2':7};
export function setupScene(b){let s=b.scene;s.destroyed=0;s.integrity={'N01-1':3,'N02-2':3,'N05-3':3,'N07-1':3,'N10-3':4,'N12-3':4}[b.spec.id]??null;s.fire=0;s.progress=0;s.cannon=0;s.shots=0;s.ammo=3;s.defenses=0;s.checked=[];s.roundActions={};s.lastDefense='player';s.needDefense={'N02-4':3,'N03-4':3,'N04-4':3,'N09-3':2,'N11-2':3,'N11-4':6,'N12-1':6,'N12-4':6}[b.spec.id]||0;
 let f=FACILITIES[b.spec.id];if(f){s.blast=f[5]||0;for(let i=0;i<f[0];i++)b.units.push({id:'facility-'+i,name:f[4]+(i+1),side:f[6]||'enemy',stats:{H:f[1],D:f[2],R:f[3],A:0,P:0,V:0,Emax:0},baseH:f[1],hp:f[1],e:0,gauge:0,turn:0,statuses:{},shields:[],cd:{},used:{},facility:true,removed:false});}
 s.limit=b.spec.id==='VECTOR'?120:LIMITS[b.spec.id]||12;
 if(b.spec.id==='N12-4'&&!b.spec.solo){let p=b.units[0];p.statuses['不可选中']={n:1,until:999};}
}
export function sceneAction(b,u,button,t,fx){let s=b.scene,id=b.spec.id,a=s.roundActions[u.id]||{};a[button]=true;if(u.didAttack)a.attack=true;s.roundActions[u.id]=a;
 if(button==='defend'&&u.side==='ally'){s.lastDefense=u.id;s.anyDefense=true;if(u.isPlayer&&!s.playerDefenseThisRound){s.defenses++;s.playerDefenseThisRound=true;}}
 if(button==='rest'&&u.side==='ally')s.anyRest=true;
 if(id==='N02-4'&&u.isPlayer&&button==='defend'&&!b.units.some(v=>v.npcId==='soldier'&&live(v)))s.progress++;
 if(id==='N06-3'&&u.isPlayer&&button==='defend'){let f=b.units.find(v=>v.facility&&v.side==='ally'&&live(v));if(f)f.shields.push({hp:120,until:999,src:u.id});}
 if(id==='N06-3'&&u.side==='enemy'&&button==='B'){let f=b.units.find(v=>v.facility&&v.side==='ally'&&live(v));if(f)fx.damage(b,u,f,250,'true',500,{indirect:true});}
 if(id==='N07-2'){if(u.side==='enemy'&&button==='B')s.fire++;if(u.isPlayer&&button==='rest')s.fire=Math.max(0,s.fire-1);}
 if(['N08-3','N08-4'].includes(id)&&u.didAttack){s.cannon=Math.min(6,s.cannon+1);if(s.cannon===6&&!s.pending){s.pending=b.round+1;s.locked=s.lastDefense;fx.log(b,'城防炮锁定 '+(b.units.find(v=>v.id===s.locked)?.name||'诱敌位置')+' · 下一轮末落下','gold');}}
 if(id==='N10-1'&&(u.npcId==='ines'&&button==='A'||u.isPlayer&&['A','B','C'].includes(button))){const ids=new Set([t?.side==='enemy'?t.id:null,...b.hitIds||[]]);for(const key of ids)if(b.units.some(v=>v.id===key&&v.side==='enemy'&&!v.owner&&!v.facility)&&!s.checked.includes(key))s.checked.push(key);}
 if(id==='N11-3'&&u.isPlayer&&['A','B','C'].includes(button)&&b.choice?.charge&&s.ammo>1)s.pending=b.round+1;
 if(id==='N11-4'&&u.isPlayer&&button==='defend'&&s.ammo&&s.defenses>=2*(s.shots+1)){s.shots++;s.ammo--;let v=boss(b);if(v&&live(v))fx.damage(b,u,v,2500,'true',500,{indirect:true});}
 if(id==='N12-1'&&u.isPlayer&&button==='defend'&&s.defenses>=2*(s.shots+1))s.pending=b.round+1;
}
export function sceneRound(b,fx){let s=b.scene,id=b.spec.id,p=b.units.find(u=>u.isPlayer),v=boss(b);
 if(id==='N10-1')for(const u of b.units.filter(u=>u.side==='enemy'&&!u.owner&&!u.facility&&u.hp<=0))if(!s.checked.includes(u.id)){s.checked.push(u.id);fx.log(b,'PRTS完成倒地目标身份核验：'+u.name,'gold');}
 if(id==='N08-3'&&enemy(b).length===0&&s.shots<2){s.cannon=Math.min(6,s.cannon+2);fx.log(b,'威胁已解除 · 副炮自动校准+2充能');if(s.cannon===6&&!s.pending){s.pending=b.round+1;s.locked=s.lastDefense;}}
 if(id==='N01-1'&&[4,6,8].includes(b.round)&&b.units.some(u=>u.npcId==='crossbow'&&live(u)))s.integrity--;
 if(['N02-2','N07-1'].includes(id)&&b.round%2===0&&!s.anyDefense)s.integrity--;
 if(id==='N05-3'&&b.round%2===0&&!s.anyDefense)s.integrity--;
 if(id==='N10-3'&&!s.anyDefense)s.integrity--;
 if(id==='N12-3'&&!s.anyRest)s.integrity--;
 if(id==='N03-2'&&b.round===3&&enemy(b).length)for(let u of b.units.filter(u=>u.side==='ally'&&live(u)))fx.status(b,v||u,u,'寒冷',1,1);
 if(id==='N06-4'){let npcActions=Object.entries(s.roundActions).filter(([key,a])=>key!=='player'&&a.attack&&b.units.some(u=>u.id===key&&u.side==='ally'));if((b.spec.solo||npcActions.length>=2)&&(s.roundActions.player?.defend||s.roundActions.player?.rest))s.progress++;}
 if(id==='N12-4'&&(s.roundActions.player?.defend||s.roundActions.player?.rest)&&(b.spec.solo||Object.entries(s.roundActions).some(([key,a])=>key!=='player'&&a.attack&&b.units.some(u=>u.id===key&&u.side==='ally'))))s.progress++;
 if(s.pending&&b.round>=s.pending){if(['N08-3','N08-4'].includes(id)){let u=b.units.find(u=>u.id===s.locked);if(u&&live(u))fx.damage(b,v||p,u,1600,'true',500,{indirect:true});if(v&&live(v))fx.damage(b,p,v,1600,'true',500,{indirect:true});s.cannon=0;s.shots++;}
 else if(id==='N11-3'&&s.ammo>1){s.ammo--;s.shots++;if(v&&live(v))fx.damage(b,p,v,1500,'true',500,{indirect:true});}
 else if(id==='N12-1'){s.shots++;for(let u of [...enemy(b),...b.units.filter(u=>u.id===s.lastDefense&&live(u))])fx.damage(b,p,u,1000,'magic',500,{indirect:true});}
 s.pending=0;}
 s.roundActions={};s.anyDefense=false;s.anyRest=false;s.playerDefenseThisRound=false;
}
export function sceneCheck(b){let s=b.scene,id=b.spec.id,n=b.round,clear=enemy(b).length===0,win=false,kind='objective';
 if(id==='VECTOR'){if(clear)return{won:true,kind:'victory',reason:'训练投影已击败 · 突破成功'};if(n>=120)return{won:false,kind:'defeat',reason:'训练达到120轮防僵局上限 · 本次未通过'};return null;}
 if(s.integrity!==null&&s.integrity<=0)return{won:false,reason:'保护目标完整度归零',kind:'defeat'};
 if(id==='N07-2'&&s.fire>=4)return{won:false,reason:'火灾失控',kind:'defeat'};
 switch(id){
 case'N01-2':win=n>=5||clear;break;case'N01-3':win=clear||s.destroyed>=2||n>=5&&ratio(b)<=.5;break;case'N01-4':win=s.destroyed>=2;break;
 case'N02-2':win=clear||n>=5;break;case'N02-4':win=clear||s.progress>=3;break;
 case'N03-3':win=s.destroyed>=2;break;case'N03-4':win=n>=4||ratio(b)<=.65||s.defenses>=3;break;
 case'N04-2':win=clear||!b.units.some(u=>u.npcId==='meph'&&live(u))||!b.units.some(u=>u.owner&&u.side==='enemy'&&live(u))&&b.units.filter(u=>u.npcId==='faust').every(u=>!live(u)||u.hp/u.stats.H<=.5);break;
 case'N04-3':win=clear||n>=6;break;case'N04-4':win=clear||n>=10&&s.defenses>=3;break;
 case'N05-2':win=clear||s.destroyed>=2;break;case'N05-4':win=clear||s.destroyed>=3&&n>=8;break;
 case'N06-2':win=clear||ratio(b)<=.35&&s.destroyed>=2;break;case'N06-3':{let f=b.units.filter(u=>u.facility&&u.side==='ally'&&live(u)).length;if(f<2)return{won:false,reason:'冷却装置不足两处',kind:'defeat'};win=n>=5;break;}
 case'N06-4':win=clear||s.progress>=6&&n>=8;break;
 case'N07-1':win=n>=4;break;case'N07-3':win=clear&&s.destroyed>=1;break;case'N07-4':win=clear||s.destroyed>=2&&n>=7;break;
 case'N08-3':win=s.shots>=2;break;case'N08-4':win=clear||s.shots>=2&&n>=8;break;
 case'N09-3':win=n>=6&&s.defenses>=2;break;case'N09-4':win=clear||s.destroyed>=2&&n>=8;break;
 case'N10-1':win=clear&&s.checked.length>=2;break;case'N10-2':win=n>=4&&b.seenDeaths.some(key=>key.startsWith('enemy-'));break;case'N10-3':win=n>=5;break;case'N10-4':win=clear||s.destroyed>=3;break;
 case'N11-2':win=n>=5&&s.defenses>=3;break;case'N11-3':win=clear&&s.ammo>=1;break;case'N11-4':win=clear||s.shots>=3&&n>=8;break;
 case'N12-1':win=clear||n>=6&&s.shots>=3;break;case'N12-2':win=clear||s.destroyed>=2;break;case'N12-3':win=clear;break;case'N12-4':win=s.destroyed>=2||s.progress>=6&&n>=8;break;
 default:win=clear;
 }
 if(win){kind=clear&&b.units.filter(u=>u.side==='enemy'&&!u.facility).every(u=>u.hp<=0)?'victory':'objective';return{won:true,kind,reason:clear?'敌方威胁解除 · 作战成功':'剧情目标达成 · 作战成功'};}
 if(n>=s.limit)return{won:false,kind:'defeat',reason:'未在'+s.limit+'轮内完成作战目标'};return null;
}
export function sceneSummary(b){const s=b.scene;return ['第 '+b.round+' / '+s.limit+' 轮',s.integrity!==null?'完整度 '+s.integrity:null,s.destroyed?'已破坏设施 '+s.destroyed:null,s.needDefense?'防御推进 '+s.defenses+' / '+s.needDefense:null,s.progress?'剧情进度 '+s.progress:null,s.shots?'炮击 '+s.shots:null,s.checked.length?'核验 '+s.checked.length+'/2':null,s.fire?'火灾 '+s.fire+'/4':null].filter(Boolean);}
