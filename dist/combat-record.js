// Observations only: these counters never participate in combat decisions.
export const newTelemetry=()=>({version:1,partial:false,actions:{},damage:{ally:0,enemy:0},shieldDamage:{ally:0,enemy:0},healing:{ally:0,enemy:0}});
function telemetry(b){if(!b.telemetry)b.telemetry={...newTelemetry(),partial:true};return b.telemetry;}
export function recordAction(b,u,button){if(u.isPlayer){const t=telemetry(b);t.actions[button]=(t.actions[button]||0)+1;}}
export function recordDamage(b,u,t,hp,shield){if(u.side!==t.side){const r=telemetry(b);r.damage[u.side]=(r.damage[u.side]||0)+Math.max(0,hp);r.shieldDamage[u.side]=(r.shieldDamage[u.side]||0)+Math.max(0,shield);}}
export function recordHeal(b,u,t,hp){if(u.side===t.side){const r=telemetry(b);r.healing[u.side]=(r.healing[u.side]||0)+Math.max(0,hp);}}
