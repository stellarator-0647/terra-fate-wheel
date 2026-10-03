export const AXES=['endurance','strength','technique','arts','adaptability'];
export const AXIS_NAMES=['生理耐受','物理强度','战斗技巧','源石技艺强度','源石技艺适应性'];
export const TIERS=['战场中坚·下位','战场中坚·标准','战场中坚·上位','军事精锐·下位','军事精锐·标准','大国将军·下位','大国将军·标准','传奇英雄·下位','传奇英雄·标准','传奇英雄·上位','王庭之主·标准','王庭之主·上位','神明碎片·下位','神明碎片·标准','崛起之物·标准','崛起之物·上位','崛起之物·顶尖'];
export const LETTERS=['D−','D','D+','C−','C','B−','B','A−','A','A+','S−','S','SS−','SS','SSS−','SSS','SSS+'];
export const tierLabel=s=>LETTERS[Math.floor(clamp(s,0,16.999))]+' · '+TIERS[Math.floor(clamp(s,0,16.999))];
export const ANCHORS=[40,55,75,100,135,180,240,330,450,620,860,1200,1700,2400,3400,4800,6800,9600];
export const WEIGHTS=[6,9,13,23.002,20,13,7.5,4,2.5,1.3,.45,.15,.06,.025,.009,.003,.001];
export const SOLO_WEIGHTS=[.5,1,3,11,18,22,18,12,7,4,2,.8,.4,.2,.07,.02,.01];
export const initialWeights=solo=>solo?SOLO_WEIGHTS:WEIGHTS;
export const GATES={10:8,11:12,12:18,13:24,14:32,15:42,16:56};
export const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
export const copy=x=>structuredClone(x);
export function random(state){let x=state.rng>>>0;x^=x<<13;x^=x>>>17;x^=x<<5;state.rng=x>>>0;return state.rng/4294967296;}
export function seedNumber(s){let h=2166136261;for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619);return (h>>>0)||1;}
export function freshSeed(){const c=globalThis.crypto;if(c?.getRandomValues)return Array.from(c.getRandomValues(new Uint32Array(3)),v=>v.toString(36)).join('-');return Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);}
export const hiddenChance=legend=>legend?.30:.05;
export function weighted(state,rows,key='weight'){let n=random(state)*rows.reduce((a,r)=>a+r[key],0);for(const r of rows){n-=r[key];if(n<0)return r;}return rows.at(-1);}
export function value(s){s=clamp(s,0,16.999);let k=Math.floor(s);return ANCHORS[k]*(ANCHORS[k+1]/ANCHORS[k])**(s-k);}
export function score(v){if(v<=40)return Math.log(Math.max(1,v)/40)/Math.log(55/40);let k=0;while(k<16&&v>=ANCHORS[k+1])k++;return clamp(k+Math.log(v/ANCHORS[k])/Math.log(ANCHORS[k+1]/ANCHORS[k]),-10,16.999);}
export function rating(scores){let s=Array.isArray(scores)?scores:AXES.map(a=>scores[a]);let v=.25*s[0]+.15*s[1]+.2*s[4]+.3*Math.max(s[2],s[3])+.1*Math.min(s[2],s[3]);v=Math.min(v,[...s].sort((a,b)=>a-b)[2]+2,16.999);for(let i=10;i<17;i++)if(v>=i&&s.filter(x=>x>=i-1e-9).length<3)v=Math.min(v,i-.001);v=Math.max(0,v);return {score:v,name:tierLabel(v)};}
export function derive(scores,identity='I02'){let v=scores.map(value);v[0]*=identity==='I01'?.9:1.1;if(identity==='I01')v[3]*=1.15;return {H:Math.floor(12*v[0]+1e-9),D:v[1],A:v[2],P:v[3],R:v[4],Emax:energyCapacity(v[4]),V:100,rating:rating(v.map(score))};}
export function newAxis(score){return {score,reserve:0,proof:0,unlocked:Object.keys(GATES).map(Number).filter(x=>x<=score),events:[]};}
export function grow(axis,delta,event,source='training',proof=0){if(axis.events.includes(event))return false;axis.events.push(event);if(source==='training')delta*=axis.score<10?1:axis.score<12?.15:axis.score<14?.04:.01;if(source==='battle')axis.proof+=proof;let pending=delta+axis.reserve;axis.reserve=0;
 while(pending>1e-10&&axis.score<16.999){let boundary=Math.floor(axis.score)+1;if(boundary>=17){axis.score=Math.min(16.999,axis.score+pending);break;}let distance=boundary-axis.score;if(pending<distance-1e-10){axis.score+=pending;break;}if(boundary>=10&&!axis.unlocked.includes(boundary)&&axis.proof<GATES[boundary]){let allowed=Math.max(0,boundary-.001-axis.score);axis.score+=allowed;axis.reserve=Math.min(.25,pending-allowed);break;}axis.score=boundary;pending-=distance;if(boundary>=10&&!axis.unlocked.includes(boundary))axis.unlocked.push(boundary);axis.proof=0;}axis.score=+axis.score.toFixed(9);return true;}
export function mitigate(defense,x){return clamp(defense/(defense+4*Math.max(1,x)),0,.9);}
export function numericRating(stats){return rating([score(stats.H/12),score(stats.D),score(stats.A),score(stats.P),score(stats.R)]);}
export function rollStat(state){let tier=weighted(state,initialWeights(state.solo).map((weight,i)=>({i,weight}))).i;return tier+Math.floor(random(state)*1000)/5000;}

export const energyCapacity=r=>Math.floor(100+100*Math.sqrt(Math.max(0,r)/100));
export const energyRegen=e=>e>0?Math.max(12,Math.floor(e*.06)):0;
export const restEnergy=e=>e>0?Math.max(32,Math.ceil(e*.16)):0;
