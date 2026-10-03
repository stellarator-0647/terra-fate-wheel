import {clamp} from './math.js';
export const isLive=u=>!!u&&!u.removed&&(u.hp>0||u.relay);
export function modifiers(u,key){let n=0;for(let s of Object.values(u.statuses))if(s.until>=u.turn&&s.values)n+=s.values[key]||0;return n;}
export function condition(test,b,u,t,ctx,fx){return Object.entries(test).every(([key,v])=>{
 switch(key){case'status':return fx.has(t,v);case'selfStatus':return fx.has(u,v);case'anyStatus':return v.some(n=>fx.has(t,n));case'consumed':return(ctx.consumed||0)>=v;case'resource':return u.res>=v;case'resourceBefore':return(ctx.resourceBefore??u.res)>=v;case'mode':return u.mode===v;case'ownPet':return b.units.some(p=>p.owner===u.id&&isLive(p));case'lastAction':return u.lastAction===v;case'targetHpBelow':return t.hp/t.stats.H<v;case'selfHpBelow':return u.hp/u.stats.H<v;case'energyRatioBelow':return t.e/t.stats.Emax<v;case'energyBelow':return t.e<=v;case'gaugeBelow':return t.gauge<=v;case'armorHigher':return t.stats.D>=t.stats.R;case'targetOwner':return!!t.owner;case'targetDead':return!isLive(t);case'eventAttack':return!!ctx.eventAttack;case'unhurt':return!u.hurtSinceAction;case'shieldBroken':return!!u.shieldBroken;case'recorded':return u.record===t.id;case'alone':return !b.units.some(p=>p.side===u.side&&p.id!==u.id&&!p.owner&&!p.facility&&isLive(p));default:throw Error('Unknown condition '+key);}
 });}
export function notify(b,holder,event,other,fx,meta={}){
 if(!holder||b.effectDepth>=4)return;
 for(let [name,w] of Object.entries(holder.statuses)){if(!w.event||w.event!==event||w.until<holder.turn||w.last===b.actionId)continue;w.last=b.actionId;w.fired=(w.fired||0)+1;let src=b.units.find(v=>v.id===w.src)||holder;
 if(!w.repeat||w.max&&w.fired>=w.max)delete holder.statuses[name];
 b.effectDepth=(b.effectDepth||0)+1;fx.apply(b,src,other||holder,w.effects,{once:new Set(),holder,source:src,eventAttack:meta.attack,reaction:true});b.effectDepth--;}
}
export function executeEffect(b,u,t,o,ctx,fx){
 const own=()=>b.units.filter(p=>p.owner===u.id&&isLive(p)),friends=()=>b.units.filter(v=>v.side===u.side&&isLive(v)&&!v.facility),enemies=()=>b.units.filter(v=>v.side!==u.side&&isLive(v)&&!v.facility);
 const dest=()=>o.to==='pets'?own():o.to==='holder'?[ctx.holder||t]:o.to==='source'?[ctx.source||u]:fx.toUnits(b,u,t,o.to);
 const once=()=>{if(ctx.once?.has(o))return false;ctx.once?.add(o);return true;};
 switch(o.op){
 case'if':fx.apply(b,u,t,condition(o.test,b,u,t,ctx,fx)?o.effects:o.otherwise,ctx);break;
 case'mark':for(let v of dest()){let old=v.statuses[o.name];v.statuses[o.name]={n:Math.min(o.cap||3,(old?.n||0)+o.n),until:v.turn+o.duration+(b.actor===v.id?1:0),src:u.id};if(['麻痹','神经积累'].includes(o.name)&&v.statuses[o.name].n>=(['麻痹'].includes(o.name)?2:3)){delete v.statuses[o.name];if(o.name==='麻痹'){let before=v.gauge;fx.delayGauge(b,u,v,v.gauge);if(v.gauge<before)notify(b,v,'gaugeLoss',u,fx);}else{fx.damage(b,u,v,.8*u.stats.P,'true',u.stats.P,{indirect:true});fx.status(b,u,v,'沉默',1,1);}}}break;
 case'remove':for(let v of dest())delete v.statuses[o.name];break;
 case'extend':for(let v of dest())if(v.statuses[o.name])v.statuses[o.name].until=v.turn+o.duration;break;
 case'consumeMark':ctx.consumed=t.statuses[o.name]?.n||0;delete t.statuses[o.name];break;
 case'buff':for(let v of dest())v.statuses[o.name]={n:1,until:v.turn+o.duration+(b.actor===v.id?1:0),src:u.id,values:o.values};break;
 case'watch':for(let v of dest())v.statuses[o.name]={n:1,until:v.turn+o.duration+(b.actor===v.id?1:0),src:u.id,event:o.event,effects:structuredClone(o.effects),repeat:o.repeat,max:o.max};break;
 case'rearm':if(t.statuses[o.name])Object.assign(t.statuses[o.name],{event:o.event,effects:structuredClone(o.effects)});break;
 case'mode':if(once())u.mode=o.n==='toggle'?1-u.mode:o.n==='cycle3'?(u.mode+1)%3:o.n;break;
 case'resourceSet':if(once())u.res=clamp(o.n,0,u.cap);break;
 case'cycleResource':if(once())u.res=(u.res-1+o.n+u.cap)%u.cap+1;break;
 case'resourceHeal':if(once())for(let v of dest())fx.healUnit(b,u,v,v.stats.H*(ctx.consumed||0)*o.ratio);break;
 case'resourceShield':if(once())for(let v of dest())fx.addShield(b,u,v,o.ratio+o.per*(ctx.consumed||0));break;
 case'resourceEnergy':if(once())for(let v of dest())v.e=clamp(v.e+(ctx.consumed||0)*o.n,0,v.stats.Emax);break;
 case'resourceLife':if(once())u.hp=Math.max(1,u.hp-u.stats.H*o.ratio*(ctx.consumed||0));break;
 case'percentHit':{t.percentUses??={};let key=u.id+':'+b.lastButton;if(!o.limit||(t.percentUses[key]||0)<o.limit){t.percentUses[key]=(t.percentUses[key]||0)+1;fx.damage(b,u,t,Math.min((o.current?t.hp:t.stats.H)*o.ratio,u.stats.P*o.cap),o.type||'magic',u.stats.P,{indirect:ctx.reaction});}break;}
 case'targetDelayed':t.statuses['预约:'+u.id+(o.key||'')]={n:1,until:t.turn+2,src:u.id,event:'start',effects:o.effects};break;
 case'purge':{let key=Object.keys(t.statuses).find(k=>t.statuses[k].values);if(key)delete t.statuses[key];break;}
 case'reset':if(once())u.cd[o.button]=u.turn;break;
 case'cooldown':for(let v of enemies()){v.cdExtensions??=0;if(v.cdExtensions<(o.max||99)){v.cd.C=Math.min(v.turn+2,Math.max(v.turn+1,v.cd.C||v.turn+1)+o.n);v.cdExtensions++;}}break;
 case'chain':for(let v of enemies().filter(v=>v!==t&&fx.has(v,o.name))){fx.damage(b,u,v,u.stats.P*o.coef,'magic',u.stats.P,{indirect:true});delete v.statuses[o.name];}delete t.statuses[o.name];break;
 case'detonate':if(once())for(let v of enemies().filter(v=>fx.has(v,o.name))){delete v.statuses[o.name];let x=fx.xval(u,o.basis);fx.damage(b,u,v,x*o.coef,o.type,x,{indirect:true});}break;
 case'burst':for(let v of enemies().filter(v=>v!==t)){fx.damage(b,u,v,u.stats.P*o.coef,'magic',u.stats.P,{indirect:true});if(o.status)fx.status(b,u,v,o.status);}break;
 case'dotBurst':{let s=t.statuses[o.name];if(s){fx.damage(b,u,t,s.p*(o.name==='毒'?.15*s.n:.3),'magic',s.p,{indirect:true});if(!o.keep)delete t.statuses[o.name];}break;}
 case'shieldLaunch':{let v=o.from==='target'?t:u,amount=fx.shields(v),spent=amount*(o.ratio||1);v.shields=[];fx.damage(b,u,t,Math.min(spent,u.stats[o.basis]*o.cap),o.type,fx.xval(u,o.basis),{indirect:ctx.reaction});if(o.from==='target')fx.addShield(b,u,u,Math.min(.12,spent/u.stats.H));break;}
 case'transferShield':if(once()){let ally=fx.toUnits(b,u,t,'ally')[0];if(ally===u){u.e=Math.min(u.stats.Emax,u.e+10);break;}let amount=Math.min(fx.shields(u)*.5,ally.stats.H*o.ratio);u.shields=[];fx.addShield(b,u,ally,amount/ally.stats.H);}break;
 case'allyConsume':if(once()){let v=friends().find(v=>fx.has(v,o.name));if(v){delete v.statuses[o.name];fx.apply(b,u,t,o.effects,ctx);}}break;
 case'secondary':{let v=enemies().filter(v=>v!==t).sort((v,w)=>v.hp-w.hp)[0];if(v)fx.apply(b,u,v,o.effects,ctx);else if(o.fallback)fx.apply(b,u,t,o.fallback,ctx);break;}
 case'focusGain':if(once()){if(u.record!==t.id)u.res=0;u.record=t.id;u.res=Math.min(u.cap,u.res+1);}break;
 case'focusSet':if(once()){u.record=t.id;u.res=Math.min(u.cap,o.n);}break;
 case'returnBlade':if(u.record&&u.record!==t.id){let old=b.units.find(v=>v.id===u.record);if(isLive(old))fx.damage(b,u,old,.4*u.stats.A,'physical',u.stats.A,{indirect:true});}u.record=t.id;break;
 case'snapshot':u.snapshot={hp:u.hp,e:u.e,until:u.turn+2};break;
 case'recall':{let v=dest()[0];if(u.snapshot&&u.snapshot.until>=u.turn){fx.healUnit(b,u,v,Math.min(v.stats.H*o.h,Math.max(0,u.snapshot.hp-u.hp)));if(o.e)u.e=Math.max(u.e,Math.min(u.snapshot.e,u.e+o.e));delete u.snapshot;}break;}
 case'snapshotTeam':if(once()){u.teamSnapshot=friends().map(v=>({id:v.id,hp:v.hp}));u.restoreAt=u.turn+o.delay;}break;
 case'swapGauge':{let ally=o.to==='ally'?fx.toUnits(b,u,t,'ally')[0]:t;let n=clamp(ally.gauge,0,95);let next=clamp(u.gauge,0,95);if(next<ally.gauge)fx.delayGauge(b,u,ally,ally.gauge-next);else ally.gauge=next;u.gauge=n;break;}
 case'balanceHP':if(once()){let fs=friends().filter(v=>!v.owner),total=fs.reduce((n,v)=>n+v.hp,0),max=fs.reduce((n,v)=>n+v.stats.H,0);for(let v of fs)v.hp=Math.max(1,Math.floor(total/max*v.stats.H));}break;
 case'transferNegative':for(let name of fx.negative.filter(n=>fx.has(u,n)).slice(0,o.count)){t.statuses[name]={...u.statuses[name],until:t.turn+Math.max(1,u.statuses[name].until-u.turn)};delete u.statuses[name];}break;
 case'takeNegative':{let v=fx.toUnits(b,u,t,'ally')[0];for(let name of fx.negative.filter(n=>fx.has(v,n)).slice(0,o.count)){u.statuses[name]={...v.statuses[name],until:u.turn+Math.max(1,v.statuses[name].until-v.turn)};delete v.statuses[name];}break;}
 case'randomNegative':{let pool=['毒','灼烧','破防','破魔','迟缓','衰弱','脆弱'];for(let i=0;i<o.count;i++){let k=Math.floor(fx.random(b)*pool.length),name=pool.splice(k,1)[0];fx.status(b,u,t,name,1,o.duration);}break;}
 case'spread':for(let v of enemies().filter(v=>v!==t).slice(0,1))for(let name of fx.negative.filter(n=>fx.has(t,n)&&!['冻结','睡眠','眩晕'].includes(n)).slice(0,o.count))v.statuses[name]={...t.statuses[name],until:v.turn+Math.max(1,t.statuses[name].until-t.turn)};break;
 case'cleanseGain':if(once()){let n=fx.negative.filter(k=>fx.has(u,k)).length;for(let k of fx.negative)delete u.statuses[k];u.res=Math.min(u.cap,u.res+n);}break;
 case'pushDamage':{let before=t.gauge;fx.delayGauge(b,u,t,60);fx.damage(b,u,t,(before-t.gauge)*o.coef*u.stats.P,'true',u.stats.P,{indirect:true});break;}
 case'pushRefund':{let before=t.gauge;fx.delayGauge(b,u,t,60);u.e=clamp(u.e+Math.floor((60-(before-t.gauge))*o.n),0,u.stats.Emax);break;}
 case'markHarvest':if(once()){let n=enemies().filter(v=>fx.has(v,o.name)).length;for(let v of enemies())delete v.statuses[o.name];if(n)fx.healUnit(b,u,u,Math.min(o.cap,n*o.ratio)*u.stats.H);else u.hp=Math.max(1,u.hp-u.stats.H*.05);}break;
 case'poisonHarvest':{let n=fx.stacks(t,'毒');delete t.statuses['毒'];for(let v of friends())fx.healUnit(b,u,v,v.stats.H*.05*n);break;}
 case'energyHarvest':{let n=Math.min(t.e,o.n);t.e-=n;u.res=Math.min(u.cap,u.res+n);break;}
 case'steal':if(!t.boss){let n=Math.min(t.e,o.energy);t.e-=n;u.e=clamp(u.e+n,0,u.stats.Emax);let h=Math.min(t.hp*o.ratio,u.stats.H*o.cap);t.hp-=h;fx.healUnit(b,u,u,h);}break;
 case'hpCap':u.hp=Math.min(u.hp,u.stats.H*o.ratio);break;
 case'debt':u.debt=Math.min(.25*u.stats.H,(u.debt||0)+o.ratio*u.stats.H);u.debtAt=u.turn+2;break;
 case'payDebt':if(once()){u.hp=Math.max(1,u.hp-(u.debt||0)*o.ratio);u.debt=0;}break;
 case'changeForm':if(once()){let old=u.form||0,neu=(old+1)%3;let keys=['A','P','H'];u.stats[keys[old]]/=1.3;if(old===2)u.hp=Math.max(1,Math.floor(u.hp/1.3));u.stats[keys[neu]]*=1.3;if(neu===2)u.hp=Math.floor(u.hp*1.3);u.form=neu;for(let v of own()){v.attack=.7*Math.max(u.stats.A,u.stats.P);v.stats.A=v.stats.P=v.attack;}}break;
 case'dreamDragon':if(once()){let ps=own().filter(v=>v.name==='梦龙');if(ps.length>=2){let hp=ps.reduce((n,p)=>n+p.hp,0);for(let p of ps)p.removed=true;let v=fx.spawn(b,u,{name:'大梦龙',h:hp/u.stats.H,a:2,basis:'P',limit:1,duration:3});if(v)v.hp=hp;}else fx.spawn(b,u,{name:'梦龙',h:.28,a:.85,basis:'P',limit:2,duration:4});}break;
 case'pet':if(once()){let ps=own();if(o.task==='splitDragon'){let big=ps.find(v=>v.name==='大梦龙');if(big){big.removed=true;for(let i=0;i<2;i++)fx.spawn(b,u,{name:'梦龙',h:Math.floor(big.hp/2)/u.stats.H,a:.9,basis:'P',limit:2,duration:Math.max(1,big.expires-u.turn)});}else for(let p of ps)fx.petAttack(b,p,t);break;}
 for(let p of ps){switch(o.task){case'remove':p.removed=true;return true;case'heal':fx.healUnit(b,u,p,p.stats.H*o.ratio);break;case'extend':if(!p.extended){p.expires+=o.duration;p.extended=true;}break;case'refresh':if(!p.refreshed){p.expires=u.turn+o.duration;p.refreshed=true;}break;case'payLife':p.hp=Math.max(0,p.hp-p.stats.H*o.ratio);break;case'convertHeal':fx.healUnit(b,u,u,Math.min(u.stats.H*o.cap,p.hp*o.ratio));p.removed=true;return true;case'convertShield':{let v=fx.toUnits(b,u,t,o.to||'self')[0];fx.addShield(b,u,v,Math.min(o.cap,p.hp*o.ratio/v.stats.H));p.removed=true;return true;}case'volley':fx.damage(b,u,t,u.stats.P*o.coef,'magic',u.stats.P,{indirect:true});break;case'explode':p.removed=true;for(let v of enemies())fx.damage(b,u,v,u.stats.P*o.coef,'magic',u.stats.P,{indirect:true});u.e=clamp(u.e+o.energy,0,u.stats.Emax);break;case'observe':p.attack=0;p.stats.A=p.stats.P=0;p.supplyEnergy=o.energy||0;p.supplyShield=o.shield||0;p.beneficiary=b.choice?.ally||u.id;break;default:throw Error('Unknown pet task '+o.task);}}}break;
 default:return false;
 }return true;
}

